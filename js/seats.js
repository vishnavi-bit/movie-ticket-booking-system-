/* =========================================================
   Movie Ticket Booking · seats.js
   Seat layout (Silver / Gold / Premium), occupancy, selection
   and the seat-selection screen.
   ========================================================= */

/* Pending booking = the in-progress order. Kept in LocalStorage so a refresh keeps it. */
const Pending = {
  DEFAULT: { showId: null, seats: [], coupon: null, details: null, method: 'upi' },
  get() {
    return { ...Pending.DEFAULT, ...Store.get('mtb_pending', {}) };
  },
  set(p) {
    Store.set('mtb_pending', p);
  },
  clear() {
    Store.remove('mtb_pending');
  }
};

// Sorts seat ids like A1, A2 … B1 … J12
function seatCompare(a, b) {
  return a[0].localeCompare(b[0]) || Number(a.slice(1)) - Number(b.slice(1));
}

const Seats = {
  ROWS: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  PER_ROW: 12,
  MAX_SEATS: 10,
  PRICES: { silver: 150, gold: 250, premium: 400 },
  LABELS: { silver: 'Silver', gold: 'Gold', premium: 'Premium' },

  categoryOf(row) {
    const i = this.ROWS.indexOf(row);
    return i < 4 ? 'silver' : i < 7 ? 'gold' : 'premium';
  },
  priceOf(seatId) {
    return this.PRICES[this.categoryOf(seatId[0])];
  },
  allIds() {
    const ids = [];
    this.ROWS.forEach(r => {
      for (let n = 1; n <= this.PER_ROW; n++) ids.push(r + n);
    });
    return ids;
  },
  sort(list) {
    return [...list].sort(seatCompare);
  },

  // Booked seats = seeded "other customers" (deterministic per show) + real bookings in this browser
  occupied(showId) {
    const set = new Set();
    const rnd = Utils.rng(Utils.hash(showId));
    this.allIds().forEach(id => {
      if (rnd() < 0.2) set.add(id);
    });
    Booking.all().forEach(b => {
      if (b.showId === showId && b.status !== 'cancelled') b.seats.forEach(s => set.add(s));
    });
    return set;
  },
  available(showId) {
    return this.allIds().length - this.occupied(showId).size;
  },

  mapHTML(selected, occ) {
    let out = '';
    let lastCat = null;
    this.ROWS.forEach(r => {
      const cat = this.categoryOf(r);
      if (cat !== lastCat) {
        out += `<div class="cat-head ${cat}">${this.LABELS[cat]} · ${Utils.money(this.PRICES[cat])} per seat</div>`;
        lastCat = cat;
      }
      let seats = '';
      for (let n = 1; n <= this.PER_ROW; n++) {
        const id = r + n;
        const state = occ.has(id) ? 'occupied' : selected.includes(id) ? 'selected' : 'available';
        const stateText = state === 'occupied' ? 'booked' : state;
        if (n === 5 || n === 9) seats += '<span class="aisle" aria-hidden="true"></span>';
        seats += `<button type="button" class="seat ${cat} ${state}" data-seat="${id}"
          aria-pressed="${state === 'selected'}" aria-label="Seat ${id}, ${this.LABELS[cat]}, ${stateText}"
          ${state === 'occupied' ? 'disabled' : ''}>${n}</button>`;
      }
      out += `<div class="seat-row">
        <span class="row-label" aria-hidden="true">${r}</span>
        <div class="seats">${seats}</div>
        <span class="row-label" aria-hidden="true">${r}</span>
      </div>`;
    });
    return out;
  },

  summaryHTML(show, selected) {
    const counts = { silver: 0, gold: 0, premium: 0 };
    selected.forEach(id => { counts[this.categoryOf(id[0])]++; });
    const subtotal = selected.reduce((s, id) => s + this.priceOf(id), 0);
    const rows = ['silver', 'gold', 'premium'].filter(c => counts[c]).map(c => `
      <div class="sum-row"><span>${this.LABELS[c]} × ${counts[c]}</span><strong>${Utils.money(counts[c] * this.PRICES[c])}</strong></div>`).join('');
    const chips = selected.length
      ? this.sort(selected).map(id => `<span class="seat-chip">${id}</span>`).join('')
      : '<p class="muted">No seats selected yet. Tap a seat on the map.</p>';
    const d = Utils.fmtDate(show.date, { weekday: 'short', day: 'numeric', month: 'short' });
    return `
      <h3>Your selection</h3>
      <div class="sum-meta">
        <div><small>Movie</small><strong>${Utils.esc(show.movie.title)}</strong></div>
        <div><small>Cinema</small><strong>${Utils.esc(show.cinema.name)}</strong></div>
        <div><small>When</small><strong>${d} · ${show.time}</strong></div>
      </div>
      <div class="seat-chips">${chips}</div>
      <div class="sum-rows">${rows}</div>
      <div class="sum-total"><span>Ticket total</span><strong>${Utils.money(subtotal)}</strong></div>
      <p class="muted small">Convenience fee and GST are added at checkout. Up to ${this.MAX_SEATS} seats per booking.</p>
      <button type="button" class="btn btn-ghost btn-block" data-clear-seats ${selected.length ? '' : 'disabled'}>Clear selection</button>
      <button type="button" class="btn btn-primary btn-block btn-lg" id="seatContinue" ${selected.length ? '' : 'disabled'}>Continue to checkout →</button>`;
  },

  view(showId) {
    const show = Movies.getShow(showId);
    if (!show) {
      return {
        html: Layout.empty({
          icon: '🎟️',
          title: 'Show not available',
          text: 'This showtime has already passed or no longer exists.',
          action: '<a class="btn btn-primary" href="#/">Browse movies</a>'
        }),
        title: 'Show not available'
      };
    }
    const p = Pending.get();
    if (p.showId !== showId) Pending.set({ ...p, showId, seats: [], coupon: null });

    const html = `<div class="container page-pad">
      ${Booking.stepper(1)}
      <div class="seat-layout">
        <section class="panel seat-stage-wrap">
          <div class="show-head">
            <div>
              <h1>${Utils.esc(show.movie.title)}</h1>
              <p class="muted">${Utils.esc(show.cinema.name)} · ${Utils.fmtDate(show.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${show.time} · ${Utils.esc(show.format)} · ${Utils.esc(show.screen)}</p>
            </div>
            <a class="btn btn-ghost btn-sm" href="#/book/${show.movie.id}">Change show</a>
          </div>
          <div class="legend">
            <span><i class="lg available"></i>Available</span>
            <span><i class="lg selected"></i>Selected</span>
            <span><i class="lg occupied"></i>Booked</span>
          </div>
          <div class="screen">
            <div class="screen-curve"></div>
            <span>All eyes this way · Screen</span>
          </div>
          <div class="seat-map" id="seatMap" role="group" aria-label="Seat map"></div>
          <div class="tier-legend">
            <span class="tier silver">Silver · ${Utils.money(this.PRICES.silver)}</span>
            <span class="tier gold">Gold · ${Utils.money(this.PRICES.gold)}</span>
            <span class="tier premium">Premium · ${Utils.money(this.PRICES.premium)}</span>
          </div>
        </section>
        <aside class="panel seat-summary" id="seatSummary"></aside>
      </div>
    </div>`;
    return { html, title: `Seats · ${show.movie.title}`, bind: root => this.bind(root, show) };
  },

  bind(root, show) {
    const showId = show.showId;
    const map = root.querySelector('#seatMap');
    const sum = root.querySelector('#seatSummary');

    // Re-read storage and occupancy, drop any seat that was taken elsewhere, then redraw
    const redraw = () => {
      const p = Pending.get();
      const occ = this.occupied(showId);
      const selected = p.seats.filter(id => !occ.has(id));
      if (selected.length !== p.seats.length) {
        toast('Some of your seats were just booked by someone else. Please choose again.', 'error');
        Pending.set({ ...p, showId, seats: selected });
      }
      map.innerHTML = this.mapHTML(selected, occ);
      sum.innerHTML = this.summaryHTML(show, selected);
    };
    redraw();

    map.addEventListener('click', e => {
      const btn = e.target.closest('.seat');
      if (!btn || btn.disabled) return;
      const id = btn.dataset.seat;
      const p = Pending.get();
      let seats = [...p.seats];
      if (seats.includes(id)) {
        seats = seats.filter(s => s !== id);
      } else if (seats.length >= this.MAX_SEATS) {
        toast(`You can book up to ${this.MAX_SEATS} seats at a time.`, 'error');
        return;
      } else {
        seats.push(id);
      }
      Pending.set({ ...p, showId, seats });
      redraw();
    });

    sum.addEventListener('click', e => {
      if (e.target.closest('[data-clear-seats]')) {
        Pending.set({ ...Pending.get(), seats: [] });
        redraw();
      }
      if (e.target.closest('#seatContinue')) navigate('#/checkout');
    });
  }
};
