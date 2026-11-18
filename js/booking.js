/* =========================================================
   Movie Ticket Booking · booking.js
   Pricing & coupons, checkout, SIMULATED payment, booking
   creation (with double-booking check), digital ticket with
   PNG download, and My Bookings with cancellation.
   Payments here are demonstrations only - no money moves.
   ========================================================= */

const Booking = {
  COUPONS: {
    WELCOME10: { label: '10% off, up to ₹200', type: 'percent', value: 10, max: 200, min: 0 },
    FLAT100: { label: '₹100 off on tickets of ₹500+', type: 'flat', value: 100, min: 500 },
    MOVIE20: { label: '20% off, up to ₹150, on tickets of ₹300+', type: 'percent', value: 20, max: 150, min: 300 }
  },
  CONV_FEE_PER_SEAT: 35,
  GST_RATE: 0.18,
  STEPS: ['Showtime', 'Seats', 'Details', 'Payment', 'Ticket'],

  /* ---------- Storage ---------- */
  all() {
    return Store.get('mtb_bookings', []);
  },
  get(id) {
    return this.all().find(b => b.id === id) || null;
  },
  userBookings(user) {
    if (!user) return [];
    return this.all().filter(b => b.userEmail === user.email || (b.customer && b.customer.email === user.email));
  },
  bucket(b) {
    if (b.status === 'cancelled') return 'cancelled';
    return Movies.showStart(b.date, b.time) > new Date() ? 'upcoming' : 'past';
  },
  isCancellable(b) {
    return b.status === 'confirmed' && Movies.showStart(b.date, b.time) - new Date() > 2 * 60 * 60 * 1000;
  },

  /* ---------- Pricing ---------- */
  couponDiscount(code, subtotal) {
    const c = this.COUPONS[code];
    if (!c) return { ok: false, message: 'That coupon code is not valid.' };
    if (subtotal < c.min) return { ok: false, message: `${code} needs ticket value of ${Utils.money(c.min)} or more.` };
    const raw = c.type === 'percent' ? Math.round(subtotal * c.value / 100) : c.value;
    const discount = Math.min(c.max ? Math.min(raw, c.max) : raw, subtotal);
    return { ok: true, discount };
  },
  breakdown(seats, couponCode) {
    const subtotal = seats.reduce((s, id) => s + Seats.priceOf(id), 0);
    let discount = 0;
    let coupon = null;
    if (couponCode) {
      const r = this.couponDiscount(couponCode, subtotal);
      if (r.ok) { discount = r.discount; coupon = couponCode; }
    }
    const fee = seats.length * this.CONV_FEE_PER_SEAT;
    const gst = Math.round(fee * this.GST_RATE);
    const total = subtotal - discount + fee + gst;
    return { subtotal, discount, coupon, fee, gst, total };
  },
  priceTable(b) {
    return `<div class="price-table">
      <div><span>Tickets</span><strong>${Utils.money(b.subtotal)}</strong></div>
      ${b.discount ? `<div class="good"><span>Coupon ${Utils.esc(b.coupon)}</span><strong>− ${Utils.money(b.discount)}</strong></div>` : ''}
      <div><span>Convenience fee (${Utils.money(this.CONV_FEE_PER_SEAT)} per ticket)</span><strong>${Utils.money(b.fee)}</strong></div>
      <div><span>GST on fee (18%)</span><strong>${Utils.money(b.gst)}</strong></div>
      <div class="grand"><span>Total</span><strong>${Utils.money(b.total)}</strong></div>
    </div>`;
  },

  /* ---------- Validation ---------- */
  validateDetails(d) {
    const errs = {};
    if (!/^[A-Za-z][A-Za-z .'-]{1,49}$/.test(d.name)) errs.name = 'Enter your full name (letters only, at least 2 characters).';
    if (!Utils.validEmail(d.email)) errs.email = 'Enter a valid email address.';
    if (!Utils.normPhone(d.phone)) errs.phone = 'Enter a valid 10-digit Indian mobile number.';
    return errs;
  },
  luhnOk(number) {
    let sum = 0;
    let alt = false;
    for (let i = number.length - 1; i >= 0; i--) {
      let n = Number(number[i]);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  },
  // Returns an error message, or '' when the payment details look valid
  validatePayment(method, root) {
    const val = sel => (root.querySelector(sel) || {}).value || '';
    if (method === 'upi') {
      return /^[\w.\-]{2,}@[A-Za-z]{2,}$/.test(val('#upiId').trim()) ? '' : 'Enter a UPI ID in the form name@bank (demo: any valid format works).';
    }
    if (method === 'card') {
      const number = val('#cardNum').replace(/\s/g, '');
      if (!/^\d{16}$/.test(number) || !this.luhnOk(number)) return 'Enter a valid 16-digit card number (try the demo card 4111 1111 1111 1111).';
      if (val('#cardName').trim().length < 2) return 'Enter the name printed on the card.';
      const m = val('#cardExp').match(/^(\d{2})\/(\d{2})$/);
      if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) return 'Enter the expiry as MM/YY.';
      if (new Date(2000 + Number(m[2]), Number(m[1]), 0, 23, 59, 59) < new Date()) return 'This card has expired.';
      if (!/^\d{3,4}$/.test(val('#cardCvv'))) return 'Enter the 3 or 4 digit CVV.';
      return '';
    }
    if (method === 'netbanking') return val('#bank') ? '' : 'Choose your bank to continue.';
    if (method === 'wallet') return val('#wallet') ? '' : 'Choose a wallet to continue.';
    return 'Choose a payment method.';
  },

  /* ---------- Creating a booking (with double-booking guard) ---------- */
  newId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = 'MTB';
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  },
  create(p) {
    const show = Movies.getShow(p.showId);
    if (!show || !p.seats.length || !p.details) {
      return { ok: false, error: 'Your booking session expired. Please start again.', redirect: '#/' };
    }
    const occ = Seats.occupied(p.showId);
    const clash = p.seats.filter(s => occ.has(s));
    if (clash.length) {
      Pending.set({ ...p, seats: p.seats.filter(s => !occ.has(s)) });
      return {
        ok: false,
        error: `${clash.length > 1 ? 'Seats' : 'Seat'} ${clash.join(', ')} ${clash.length > 1 ? 'were' : 'was'} just booked by someone else. Please choose again.`,
        redirect: '#/seats/' + encodeURIComponent(p.showId)
      };
    }
    const b = this.breakdown(p.seats, p.coupon);
    const user = Auth.current();
    let id;
    do { id = this.newId(); } while (this.get(id));
    const booking = {
      id,
      showId: p.showId,
      movieId: show.movie.id,
      movieTitle: show.movie.title,
      language: show.movie.language,
      cinemaName: show.cinema.name,
      city: show.city,
      date: show.date,
      time: show.time,
      format: show.format,
      screen: show.screen,
      seats: Seats.sort(p.seats),
      subtotal: b.subtotal,
      discount: b.discount,
      coupon: b.coupon,
      fee: b.fee,
      gst: b.gst,
      total: b.total,
      customer: p.details,
      userEmail: user ? user.email : null,
      method: p.method,
      paymentRef: 'DEMO' + Math.random().toString().slice(2, 12),
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    if (!Store.set('mtb_bookings', [booking, ...this.all()])) {
      return { ok: false, error: 'Could not save your booking. Browser storage may be full.' };
    }
    Pending.clear();
    Notify.add(`Booking ${id} confirmed: ${show.movie.title}, ${show.time}`);
    return { ok: true, booking };
  },
  cancel(id) {
    const list = this.all();
    const b = list.find(x => x.id === id);
    if (!b) return false;
    b.status = 'cancelled';
    Store.set('mtb_bookings', list);
    Notify.add(`Booking ${id} cancelled. Demo refund of ${Utils.money(b.total)} initiated.`);
    return true;
  },
  confirmCancel(id) {
    const b = this.get(id);
    if (!b) return;
    openModal(`
      <h3>Cancel this booking?</h3>
      <p class="muted">${Utils.esc(b.movieTitle)} · ${b.seats.join(', ')} · ${b.time}</p>
      <p>Your seats will be released and a demo refund of <strong>${Utils.money(b.total)}</strong> will be initiated.</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close>Keep booking</button>
        <button type="button" class="btn btn-danger" id="doCancel">Yes, cancel</button>
      </div>`);
    document.getElementById('doCancel').addEventListener('click', () => {
      this.cancel(id);
      closeModal();
      toast('Booking cancelled. Demo refund initiated.', 'success');
      Router.render();
    });
  },
  processing(on) {
    document.getElementById('processing').hidden = !on;
  },

  /* ---------- Shared visual pieces ---------- */
  stepper(active) {
    return `<ol class="stepper" aria-label="Booking progress">
      ${this.STEPS.map((s, i) => `<li class="${i < active ? 'done' : i === active ? 'active' : ''}"><span>${i + 1}</span>${s}</li>`).join('')}
    </ol>`;
  },
  orderCard(show, seats) {
    return `<div class="order-card">
      <img src="${Movies.posterURL(show.movie)}" alt="">
      <div>
        <h3>${Utils.esc(show.movie.title)}</h3>
        <p class="muted">${Utils.esc(show.movie.language)} · ${Utils.esc(show.format)}</p>
        <p>${Utils.esc(show.cinema.name)}</p>
        <p>${Utils.fmtDate(show.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${show.time} · ${Utils.esc(show.screen)}</p>
        <p><strong>Seats:</strong> ${Seats.sort(seats).join(', ')}</p>
      </div>
    </div>`;
  },
  barcodeSVG(seed) {
    const r = Utils.rng(Utils.hash(seed));
    let x = 0;
    let bars = '';
    while (x < 200) {
      const w = 1 + Math.floor(r() * 3);
      if (r() > 0.42) bars += `<rect x="${x}" y="0" width="${w}" height="60"/>`;
      x += w + 1 + Math.floor(r() * 2);
    }
    return `<svg viewBox="0 0 ${x} 60" preserveAspectRatio="none" class="barcode-svg" fill="currentColor" aria-hidden="true">${bars}</svg>`;
  },

  /* ---------- Checkout: customer details + coupon ---------- */
  viewCheckout() {
    const p = Pending.get();
    if (!p.showId || !p.seats.length) {
      return {
        html: `<div class="container page-pad">${this.stepper(2)}${Layout.empty({
          icon: '🎟️',
          title: 'No seats selected',
          text: 'Pick a showtime and choose your seats first.',
          action: '<a class="btn btn-primary" href="#/">Browse movies</a>'
        })}</div>`,
        title: 'Checkout'
      };
    }
    const show = Movies.getShow(p.showId);
    if (!show) return { html: Layout.notFound(), title: 'Checkout' };

    const subtotal = p.seats.reduce((s, id) => s + Seats.priceOf(id), 0);
    if (p.coupon && !this.couponDiscount(p.coupon, subtotal).ok) {
      Pending.set({ ...p, coupon: null });
      p.coupon = null;
    }
    const user = Auth.current();
    const d = p.details || { name: user ? user.name : '', email: user ? user.email : '', phone: user ? user.phone : '' };
    const b = this.breakdown(p.seats, p.coupon);

    const html = `<div class="container page-pad">
      ${this.stepper(2)}
      <div class="two-col wide-left">
        <section class="panel">
          <h2>Customer details</h2>
          <form id="detailsForm" novalidate>
            <div class="field">
              <label for="cdName">Full name</label>
              <input id="cdName" name="name" autocomplete="name" value="${Utils.esc(d.name)}" placeholder="As on your ID">
              <p class="field-error" data-err="name"></p>
            </div>
            <div class="field">
              <label for="cdEmail">Email for ticket</label>
              <input id="cdEmail" name="email" type="email" autocomplete="email" value="${Utils.esc(d.email)}" placeholder="you@example.com">
              <p class="field-error" data-err="email"></p>
            </div>
            <div class="field">
              <label for="cdPhone">Mobile number</label>
              <input id="cdPhone" name="phone" type="tel" autocomplete="tel" value="${Utils.esc(d.phone)}" placeholder="98765 43210">
              <p class="field-error" data-err="phone"></p>
            </div>

            <h2 class="mt">Coupon</h2>
            <div class="coupon-row">
              <input id="couponInput" placeholder="Enter coupon code" value="${Utils.esc(p.coupon || '')}" ${p.coupon ? 'disabled' : ''} autocomplete="off">
              ${p.coupon
                ? '<button type="button" class="btn btn-ghost" id="removeCoupon">Remove</button>'
                : '<button type="button" class="btn btn-ghost" id="applyCoupon">Apply</button>'}
            </div>
            <p class="field-error" data-err="coupon"></p>
            ${p.coupon
              ? `<p class="good small">✓ ${Utils.esc(p.coupon)} applied: ${Utils.esc(this.COUPONS[p.coupon].label)}</p>`
              : `<p class="muted small">Try ${Object.keys(this.COUPONS).map(c => `<code>${c}</code>`).join(', ')}.</p>`}

            <button type="submit" class="btn btn-primary btn-block btn-lg mt">Continue to payment →</button>
          </form>
        </section>

        <aside class="panel summary">
          ${this.orderCard(show, p.seats)}
          ${this.priceTable(b)}
          <p class="muted small">Seats are reserved for this order only. Your details are used only to send the ticket.</p>
        </aside>
      </div>
    </div>`;

    const readDetails = root => ({
      name: root.querySelector('#cdName').value.trim(),
      email: root.querySelector('#cdEmail').value.trim().toLowerCase(),
      phone: root.querySelector('#cdPhone').value.trim()
    });

    const bind = root => {
      root.querySelector('#detailsForm').addEventListener('submit', e => {
        e.preventDefault();
        const data = readDetails(root);
        const errs = this.validateDetails(data);
        showErrors(root, errs);
        if (Object.keys(errs).length) return;
        data.phone = Utils.normPhone(data.phone);
        Pending.set({ ...Pending.get(), details: data });
        navigate('#/payment');
      });

      const applyBtn = root.querySelector('#applyCoupon');
      if (applyBtn) {
        applyBtn.addEventListener('click', () => {
          const code = root.querySelector('#couponInput').value.trim().toUpperCase();
          if (!code) { showErrors(root, { coupon: 'Enter a coupon code first.' }); return; }
          const r = this.couponDiscount(code, subtotal);
          if (!r.ok) { showErrors(root, { coupon: r.message }); return; }
          Pending.set({ ...Pending.get(), coupon: code, details: readDetails(root) });
          toast(`${code} applied. You save ${Utils.money(r.discount)}.`, 'success');
          Router.render();
        });
      }
      const removeBtn = root.querySelector('#removeCoupon');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          Pending.set({ ...Pending.get(), coupon: null, details: readDetails(root) });
          toast('Coupon removed', 'info');
          Router.render();
        });
      }
    };
    return { html, title: 'Checkout', bind };
  },

  /* ---------- Payment (simulated) ---------- */
  viewPayment() {
    const p = Pending.get();
    if (!p.showId || !p.seats.length) return { redirect: '#/' };
    if (!p.details) return { redirect: '#/checkout' };
    const show = Movies.getShow(p.showId);
    if (!show) return { html: Layout.notFound(), title: 'Payment' };
    const b = this.breakdown(p.seats, p.coupon);

    const tabs = [['upi', 'UPI'], ['card', 'Card'], ['netbanking', 'Net Banking'], ['wallet', 'Wallet']]
      .map(([k, label]) => `<button type="button" role="tab" class="pay-tab ${p.method === k ? 'active' : ''}" data-method="${k}" aria-selected="${p.method === k}">${label}</button>`).join('');

    const forms = {
      upi: `<div class="field">
              <label for="upiId">UPI ID</label>
              <input id="upiId" placeholder="yourname@bank" autocomplete="off">
              <small class="muted">Format check only, e.g. demo@upi</small>
            </div>`,
      card: `<div class="field">
              <label for="cardNum">Card number</label>
              <input id="cardNum" inputmode="numeric" placeholder="4111 1111 1111 1111" autocomplete="off" maxlength="19">
            </div>
            <div class="field">
              <label for="cardName">Name on card</label>
              <input id="cardName" autocomplete="cc-name" placeholder="As printed on the card">
            </div>
            <div class="form-row">
              <div class="field"><label for="cardExp">Expiry (MM/YY)</label><input id="cardExp" placeholder="12/30" maxlength="5" autocomplete="cc-exp"></div>
              <div class="field"><label for="cardCvv">CVV</label><input id="cardCvv" inputmode="numeric" placeholder="123" maxlength="4" autocomplete="cc-csc" type="password"></div>
            </div>`,
      netbanking: `<div class="field">
              <label for="bank">Select your bank</label>
              <select id="bank"><option value="">Choose a bank</option>
                <option>Demo Bank Alpha</option><option>Demo Bank Beta</option><option>Demo Bank Gamma</option><option>Demo Bank Delta</option>
              </select>
            </div>`,
      wallet: `<div class="field">
              <label for="wallet">Select a wallet</label>
              <select id="wallet"><option value="">Choose a wallet</option>
                <option>Demo Wallet</option><option>Pocket Pay (demo)</option><option>QuickCash (demo)</option>
              </select>
            </div>`
    };

    const html = `<div class="container page-pad">
      ${this.stepper(3)}
      <div class="two-col wide-left">
        <section class="panel">
          <div class="demo-banner">🧪 <strong>Demonstration only.</strong> No real payment is processed. Valid-format details are accepted.</div>
          <div class="pay-tabs" role="tablist">${tabs}</div>
          <div class="pay-form">${forms[p.method] || forms.upi}</div>
          <p class="field-error" data-err="pay"></p>
          <button type="button" class="btn btn-primary btn-block btn-lg" id="payBtn">Confirm Payment · ${Utils.money(b.total)}</button>
        </section>
        <aside class="panel summary">
          ${this.orderCard(show, p.seats)}
          ${this.priceTable(b)}
          <p class="muted small">Paying as <strong>${Utils.esc(p.details.name)}</strong> · ${Utils.esc(p.details.email)}</p>
        </aside>
      </div>
    </div>`;

    const bind = root => {
      root.querySelectorAll('[data-method]').forEach(btn => {
        btn.addEventListener('click', () => {
          Pending.set({ ...Pending.get(), method: btn.dataset.method });
          Router.render();
        });
      });
      const cardNum = root.querySelector('#cardNum');
      if (cardNum) {
        cardNum.addEventListener('input', () => {
          const digits = cardNum.value.replace(/\D/g, '').slice(0, 16);
          cardNum.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
        });
      }
      const exp = root.querySelector('#cardExp');
      if (exp) {
        exp.addEventListener('input', () => {
          const d = exp.value.replace(/\D/g, '').slice(0, 4);
          exp.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
        });
      }

      const payBtn = root.querySelector('#payBtn');
      payBtn.addEventListener('click', async () => {
        const method = Pending.get().method;
        const msg = this.validatePayment(method, root);
        showErrors(root, { pay: msg });
        if (msg) return;
        payBtn.disabled = true;
        this.processing(true);
        await Utils.sleep(1800);
        this.processing(false);
        const res = this.create(Pending.get());
        if (!res.ok) {
          payBtn.disabled = false;
          toast(res.error, 'error');
          if (res.redirect) navigate(res.redirect);
          return;
        }
        toast('Payment successful (demo). Your ticket is ready!', 'success');
        navigate('#/ticket/' + res.booking.id);
      });
    };
    return { html, title: 'Payment', bind };
  },

  /* ---------- Digital ticket ---------- */
  methodLabel(m) {
    return { upi: 'UPI', card: 'Card', netbanking: 'Net banking', wallet: 'Wallet' }[m] || 'Demo';
  },
  viewTicket(id) {
    const b = this.get(id);
    if (!b) return { html: Layout.notFound(), title: 'Ticket not found' };
    const m = Movies.get(b.movieId);
    const cancelled = b.status === 'cancelled';
    const poster = Movies.posterURL(m || { id: b.movieId, title: b.movieTitle, language: b.language || '', genres: [], colors: ['#ff4d6d', '#7c5cff'] });
    const dateLong = Utils.fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    const html = `<div class="container page-pad">
      ${cancelled ? '' : this.stepper(4)}
      <div class="confirm-banner ${cancelled ? 'cancelled' : ''}">
        <div class="check" aria-hidden="true">${cancelled ? '✕' : '✓'}</div>
        <div>
          <h1>${cancelled ? 'Booking cancelled' : 'Booking confirmed!'}</h1>
          <p class="muted">Booking ID <strong class="mono">${b.id}</strong> · ${cancelled ? 'a demo refund was initiated' : 'show this ticket at the cinema gate'}</p>
        </div>
      </div>

      <div class="ticket-wrap">
        <article class="ticket" id="ticketCard">
          <div class="ticket-main">
            <img src="${poster}" alt="">
            <div class="ticket-info">
              <span class="tag">${Utils.esc(b.format)} · ${Utils.esc(b.language || '')}</span>
              <h2>${Utils.esc(b.movieTitle)}</h2>
              <p class="muted">${Utils.esc(b.cinemaName)} · ${Utils.esc(b.city)}</p>
              <dl class="ticket-grid">
                <div><dt>Date</dt><dd>${dateLong}</dd></div>
                <div><dt>Time</dt><dd>${b.time}</dd></div>
                <div><dt>Screen</dt><dd>${Utils.esc(b.screen)}</dd></div>
                <div><dt>Seats</dt><dd>${b.seats.join(', ')}</dd></div>
                <div><dt>Name</dt><dd>${Utils.esc(b.customer ? b.customer.name : '')}</dd></div>
                <div><dt>Paid via</dt><dd>${this.methodLabel(b.method)} (demo)</dd></div>
              </dl>
            </div>
          </div>
          <div class="ticket-stub">
            <div class="barcode">${this.barcodeSVG(b.id)}</div>
            <code>${b.id}</code>
            <strong>${Utils.money(b.total)}</strong>
            <span class="status ${b.status}">${cancelled ? 'Cancelled' : 'Confirmed'}</span>
          </div>
        </article>
      </div>

      <div class="ticket-actions">
        <button type="button" class="btn btn-primary btn-lg" id="downloadTicket">⬇ Download ticket (PNG)</button>
        <a class="btn btn-ghost btn-lg" href="#/bookings">My bookings</a>
        <a class="btn btn-ghost btn-lg" href="#/">Book another</a>
      </div>
      <section class="panel narrow">${this.priceTable(b)}</section>
    </div>`;

    return {
      html,
      title: 'Your ticket',
      bind: root => {
        const dl = root.querySelector('#downloadTicket');
        if (dl) dl.addEventListener('click', () => this.downloadTicket(b));
      }
    };
  },
  downloadTicket(b) {
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 400;
    const g = canvas.getContext('2d');
    const m = Movies.get(b.movieId);
    const [c1, c2] = (m && m.colors) || ['#ff4d6d', '#7c5cff'];

    g.fillStyle = '#0d1120';
    g.fillRect(0, 0, 960, 400);
    const grad = g.createLinearGradient(0, 0, 640, 400);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    g.fillStyle = grad;
    g.fillRect(0, 0, 640, 400);
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.fillRect(0, 0, 640, 400);

    g.fillStyle = '#f5f7fc';
    g.fillRect(640, 0, 320, 400);
    g.setLineDash([8, 8]);
    g.strokeStyle = '#9aa3b8';
    g.beginPath();
    g.moveTo(640, 20);
    g.lineTo(640, 380);
    g.stroke();
    g.setLineDash([]);

    g.fillStyle = '#ffffff';
    g.font = '700 18px Arial';
    g.fillText('MOVIE TICKET BOOKING · E-TICKET', 40, 60);
    g.font = '800 44px Arial';
    g.fillText(b.movieTitle.slice(0, 26), 40, 130);
    g.font = '400 22px Arial';
    g.fillText(b.cinemaName.slice(0, 40), 40, 176);
    const dateLong = Utils.fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    g.fillText(`${dateLong} · ${b.time} · ${b.format} · ${b.screen}`, 40, 212);
    g.font = '600 16px Arial';
    g.fillText('SEATS', 40, 272);
    g.font = '700 28px Arial';
    g.fillText(b.seats.join(', ').slice(0, 40), 40, 306);
    g.font = '600 16px Arial';
    g.fillText('BOOKING ID', 40, 350);
    g.font = '700 24px Courier New';
    g.fillText(b.id, 40, 380);

    g.fillStyle = '#14182a';
    g.font = '700 18px Arial';
    g.fillText('ADMIT ' + b.seats.length, 680, 60);
    g.font = '600 15px Arial';
    g.fillText(`Name: ${(b.customer && b.customer.name || '').slice(0, 22)}`, 680, 88);
    const r = Utils.rng(Utils.hash(b.id));
    let x = 680;
    while (x < 925) {
      const w = 1 + Math.floor(r() * 3);
      if (r() > 0.42) g.fillRect(x, 120, w, 150);
      x += w + 2;
    }
    g.font = '700 22px Courier New';
    g.fillText(b.id, 680, 300);
    g.font = '800 30px Arial';
    g.fillText(Utils.money(b.total), 680, 352);

    canvas.toBlob(blob => {
      if (!blob) { toast('Could not create the ticket image', 'error'); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${b.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Ticket downloaded', 'success');
    }, 'image/png');
  },

  /* ---------- My bookings ---------- */
  viewBookings() {
    const user = Auth.current();
    const list = this.userBookings(user).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const counts = { upcoming: 0, past: 0, cancelled: 0 };
    list.forEach(b => { counts[this.bucket(b)]++; });

    const items = list.map(b => {
      const bucket = this.bucket(b);
      const statusLabel = bucket === 'cancelled' ? 'Cancelled' : bucket === 'past' ? 'Completed' : 'Confirmed';
      const poster = Movies.posterURL(Movies.get(b.movieId) || { id: b.movieId, title: b.movieTitle, genres: [], colors: ['#ff4d6d', '#7c5cff'] });
      return `<article class="booking-item" data-bucket="${bucket}">
        <img src="${poster}" alt="">
        <div class="bi-main">
          <span class="status ${bucket === 'cancelled' ? 'cancelled' : 'confirmed'}">${statusLabel}</span>
          <h3>${Utils.esc(b.movieTitle)}</h3>
          <p class="muted">${Utils.esc(b.cinemaName)} · ${Utils.fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${b.time} · ${Utils.esc(b.format)}</p>
          <p>Seats <strong>${b.seats.join(', ')}</strong> · ${Utils.money(b.total)} · ID <code>${b.id}</code></p>
        </div>
        <div class="bi-actions">
          <a class="btn btn-ghost btn-sm" href="#/ticket/${b.id}">View ticket</a>
          ${this.isCancellable(b) ? `<button type="button" class="btn btn-danger btn-sm" data-cancel="${b.id}">Cancel</button>` : ''}
        </div>
      </article>`;
    }).join('');

    const html = `<div class="container page-pad">
      <div class="page-head">
        <h1>My bookings</h1>
        <p class="muted">Signed in as ${Utils.esc(user.email)} · Cancellation closes 2 hours before showtime.</p>
      </div>
      ${list.length
        ? `<div class="tabs" id="bkTabs" role="tablist">
             <button type="button" class="active" data-tab="upcoming">Upcoming (${counts.upcoming})</button>
             <button type="button" data-tab="past">History (${counts.past})</button>
             <button type="button" data-tab="cancelled">Cancelled (${counts.cancelled})</button>
           </div>
           <div class="booking-list">${items}</div>
           <p class="empty-inline hidden" id="bkEmpty">Nothing in this tab yet.</p>`
        : Layout.empty({
            icon: '🎟️',
            title: 'No bookings yet',
            text: 'Your tickets will show up here once you book a show with this account.',
            action: '<a class="btn btn-primary" href="#/">Find a movie</a>'
          })}
    </div>`;
    return { html, title: 'My bookings', bind: root => this.bindBookings(root) };
  },
  bindBookings(root) {
    const tabs = root.querySelectorAll('#bkTabs [data-tab]');
    const showTab = tab => {
      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
      let count = 0;
      root.querySelectorAll('.booking-item').forEach(el => {
        const ok = el.dataset.bucket === tab;
        el.hidden = !ok;
        if (ok) count++;
      });
      const empty = root.querySelector('#bkEmpty');
      if (empty) empty.classList.toggle('hidden', count > 0);
    };
    tabs.forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));
    if (tabs.length) showTab('upcoming');
    root.addEventListener('click', e => {
      const btn = e.target.closest('[data-cancel]');
      if (btn) this.confirmCancel(btn.dataset.cancel);
    });
  }
};
