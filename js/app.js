/* =========================================================
   Movie Ticket Booking · app.js
   Shared utilities, LocalStorage wrapper, toasts, modals,
   notifications, theme, city, layout, hash router and boot.
   Loaded first; the other modules attach to the same globals.
   ========================================================= */

/* ---------- LocalStorage wrapper (every call is guarded) ---------- */
const Store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      console.warn('Could not read', key, err);
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('Could not save', key, err);
      return false;
    }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (err) { /* ignore */ }
  },
  keys() {
    try { return Object.keys(localStorage); } catch (err) { return []; }
  }
};

/* ---------- Generic helpers ---------- */
const Utils = {
  esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  },
  money(n) {
    return '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
  },
  uid(prefix = 'ID') {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  },
  toISO(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },
  todayISO() {
    return Utils.toISO(new Date());
  },
  addDays(iso, n) {
    const [y, m, d] = iso.split('-').map(Number);
    return Utils.toISO(new Date(y, m - 1, d + n));
  },
  fmtDate(iso, opts) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', opts || { day: 'numeric', month: 'short', year: 'numeric' });
  },
  hash(str) {
    let h = 2166136261;
    for (const ch of String(str)) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  },
  // Small deterministic PRNG (xorshift32) so the same seed always gives the same numbers
  rng(seed) {
    let s = (seed >>> 0) || 0x9e3779b9;
    return function () {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      return (s >>> 0) / 4294967296;
    };
  },
  validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  },
  // Returns a 10-digit Indian mobile number or null
  normPhone(value) {
    const digits = String(value || '').replace(/[\s+\-()]/g, '').replace(/^91(?=\d{10}$)/, '');
    return /^[6-9]\d{9}$/.test(digits) ? digits : null;
  },
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  minutesToText(mins) {
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  },
  truncate(text, max) {
    return text.length > max ? text.slice(0, max).replace(/\s+\S*$/, '') + '…' : text;
  },
  initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }
};

/* ---------- Toasts, modal, navigation, field errors ---------- */
function toast(message, type = 'info') {
  const wrap = document.getElementById('toasts');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.setAttribute('role', 'status');
  el.textContent = message;
  wrap.appendChild(el);
  setTimeout(() => {
    el.classList.add('hide');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

function openModal(html) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true">${html}</div>`;
  root.classList.add('open');
  const first = root.querySelector('input, select, textarea, button');
  if (first) first.focus();
  return root;
}

function closeModal() {
  const root = document.getElementById('modalRoot');
  root.classList.remove('open');
  root.innerHTML = '';
}

// Writes error text into every [data-err="key"] element inside root
function showErrors(root, errors) {
  root.querySelectorAll('[data-err]').forEach(el => {
    el.textContent = errors[el.dataset.err] || '';
  });
}

// Navigate; if the hash is already current, force a re-render
function navigate(hash) {
  if (location.hash === hash) Router.render();
  else location.hash = hash;
}

/* ---------- Notifications ---------- */
const Notify = {
  all() {
    return Store.get('mtb_notifs', []);
  },
  add(text) {
    const list = [{ id: Utils.uid('N'), text, at: new Date().toISOString(), read: false }, ...this.all()].slice(0, 30);
    Store.set('mtb_notifs', list);
    Layout.renderBadge();
  },
  unread() {
    return this.all().filter(n => !n.read).length;
  },
  markAllRead() {
    Store.set('mtb_notifs', this.all().map(n => ({ ...n, read: true })));
    Layout.renderBadge();
  },
  clear() {
    Store.set('mtb_notifs', []);
    Layout.renderBadge();
  }
};

/* ---------- Recently viewed ---------- */
const Recent = {
  list() {
    return Store.get('mtb_recent', []);
  },
  add(id) {
    const list = [id, ...this.list().filter(x => x !== id)].slice(0, 8);
    Store.set('mtb_recent', list);
  }
};

/* ---------- Theme (dark / light) ---------- */
const Theme = {
  current() {
    return Store.get('mtb_theme', 'dark');
  },
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeBtn');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀' : '☾';
      btn.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    }
  },
  init() {
    this.apply(this.current());
  },
  toggle() {
    const next = this.current() === 'dark' ? 'light' : 'dark';
    Store.set('mtb_theme', next);
    this.apply(next);
    toast(`${next === 'dark' ? 'Dark' : 'Light'} theme enabled`, 'info');
  }
};

/* ---------- City selection ---------- */
const City = {
  current() {
    const saved = Store.get('mtb_city', 'Hyderabad');
    return Movies.cities().includes(saved) ? saved : 'Hyderabad';
  },
  set(city) {
    Store.set('mtb_city', city);
  }
};

/* ---------- Layout: header, footer, global actions, loader ---------- */
const Layout = {
  init() {
    Theme.init();
    this.renderHeader();
    this.renderFooter();
    this.renderBadge();

    document.addEventListener('click', e => this.onClick(e));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeModal();
        this.closeDropdowns();
      }
    });
    window.addEventListener('scroll', () => {
      document.getElementById('backTop').classList.toggle('show', window.scrollY > 400);
    }, { passive: true });
    document.getElementById('modalRoot').addEventListener('click', e => {
      if (e.target.id === 'modalRoot' || e.target.closest('[data-close]')) closeModal();
    });
    document.getElementById('headerSearch').addEventListener('submit', e => {
      e.preventDefault();
      const q = document.getElementById('headerSearchInput').value.trim();
      navigate('#/movies' + (q ? '?q=' + encodeURIComponent(q) : ''));
    });
    window.addEventListener('hashchange', () => Router.render());
  },

  onClick(e) {
    const el = e.target.closest('[data-action]');
    if (!el) {
      this.closeDropdowns(e.target);
      return;
    }
    switch (el.dataset.action) {
      case 'theme': Theme.toggle(); break;
      case 'notif':
        document.getElementById('notifPanel').classList.toggle('open');
        this.renderNotifPanel();
        break;
      case 'notif-read': Notify.markAllRead(); this.renderNotifPanel(); break;
      case 'notif-clear': Notify.clear(); this.renderNotifPanel(); break;
      case 'city': this.openCityModal(); break;
      case 'set-city':
        City.set(el.dataset.city);
        closeModal();
        toast(`Showing movies in ${el.dataset.city}`, 'success');
        this.renderHeader();
        Router.render();
        break;
      case 'menu': document.getElementById('siteHeader').classList.toggle('menu-open'); break;
      case 'user-menu': {
        const dd = document.getElementById('userDropdown');
        if (dd) dd.classList.toggle('open');
        break;
      }
      case 'logout':
        Auth.logout();
        this.renderHeader();
        toast('You have been logged out', 'info');
        navigate('#/');
        break;
      case 'wish': Movies.Wishlist.toggle(el.dataset.id); break;
      case 'back-top': window.scrollTo({ top: 0, behavior: 'smooth' }); break;
    }
  },

  closeDropdowns(target) {
    if (!target || !target.closest('.notif-wrap')) document.getElementById('notifPanel').classList.remove('open');
    if (!target || !target.closest('.user-menu')) {
      const dd = document.getElementById('userDropdown');
      if (dd) dd.classList.remove('open');
    }
  },

  renderHeader() {
    const user = Auth.current();
    document.getElementById('authArea').innerHTML = user
      ? `<div class="user-menu">
           <button type="button" class="avatar" data-action="user-menu" aria-label="Account menu">${Utils.esc(Utils.initials(user.name))}</button>
           <div class="dropdown" id="userDropdown">
             <div class="dd-head"><strong>${Utils.esc(user.name)}</strong><small>${Utils.esc(user.email)}</small></div>
             <a href="#/bookings">My bookings</a>
             <a href="#/wishlist">Wishlist</a>
             <a href="#/profile">Profile</a>
             ${user.role === 'admin' ? '<a href="#/admin">Admin dashboard</a>' : ''}
             <button type="button" class="dd-logout" data-action="logout">Log out</button>
           </div>
         </div>`
      : `<a class="btn btn-ghost btn-sm" href="#/login">Log in</a>
         <a class="btn btn-primary btn-sm" href="#/signup">Sign up</a>`;
    document.getElementById('cityName').textContent = City.current();
    document.querySelectorAll('.admin-only').forEach(a => { a.hidden = !(user && user.role === 'admin'); });
  },

  renderBadge() {
    const n = Notify.unread();
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    badge.textContent = n > 9 ? '9+' : String(n);
    badge.hidden = n === 0;
  },

  renderNotifPanel() {
    const list = Notify.all();
    document.getElementById('notifPanel').innerHTML = `
      <div class="dd-head">
        <strong>Notifications</strong>
        <span><button type="button" class="link-btn" data-action="notif-read">Mark read</button>
        <button type="button" class="link-btn" data-action="notif-clear">Clear</button></span>
      </div>
      ${list.length ? list.map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'}">
          <p>${Utils.esc(n.text)}</p>
          <small>${new Date(n.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
        </div>`).join('') : '<div class="dd-empty">No notifications yet</div>'}`;
  },

  openCityModal() {
    const cur = City.current();
    openModal(`
      <div class="modal-head"><h3>Select your city</h3><button type="button" class="icon-btn" data-close aria-label="Close">✕</button></div>
      <div class="city-grid">
        ${Movies.cities().map(c => `<button type="button" class="city-option ${c === cur ? 'active' : ''}" data-action="set-city" data-city="${Utils.esc(c)}">${Utils.esc(c)}</button>`).join('')}
      </div>`);
  },

  setActiveNav() {
    document.getElementById('siteHeader').classList.remove('menu-open');
    document.querySelectorAll('[data-nav]').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === location.hash);
    });
    this.closeDropdowns();
  },

  loader(on) {
    document.getElementById('loader').classList.toggle('show', on);
  },

  empty({ icon = '🎬', title, text = '', action = '' }) {
    return `<div class="empty-state">
      <div class="empty-icon" aria-hidden="true">${icon}</div>
      <h3>${Utils.esc(title)}</h3>
      ${text ? `<p class="muted">${Utils.esc(text)}</p>` : ''}
      ${action}
    </div>`;
  },

  notFound() {
    return `<div class="container page-pad">${this.empty({
      icon: '🎞️',
      title: 'Page not found',
      text: 'The page you are looking for does not exist or has moved.',
      action: '<a class="btn btn-primary" href="#/">Back to home</a>'
    })}</div>`;
  },

  renderFooter() {
    document.getElementById('siteFooter').innerHTML = `
      <div class="container footer-grid">
        <div>
          <a href="#/" class="logo"><img src="assets/icons/logo.svg" alt="" width="30" height="30"><span>Movie Ticket <b>Booking</b></span></a>
          <p class="muted">Browse movies, pick the best seats and get your digital ticket in seconds.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <a href="#/movies">All movies</a>
          <a href="#/movies?status=now">Now showing</a>
          <a href="#/movies?status=upcoming">Coming soon</a>
          <a href="#/movies?category=trending">Trending</a>
        </div>
        <div>
          <h4>Account</h4>
          <a href="#/bookings">My bookings</a>
          <a href="#/wishlist">Wishlist</a>
          <a href="#/profile">Profile</a>
          <a href="#/login">Log in</a>
        </div>
        <div>
          <h4>Help &amp; contact</h4>
          <a href="mailto:support@movieticketbooking.example">support@movieticketbooking.example</a>
          <span class="muted">+91 1800 000 0000 (demo number)</span>
          <span class="muted">Daily · 9 AM – 11 PM</span>
          <span class="muted">Cancel up to 2 hours before showtime</span>
        </div>
      </div>
      <div class="container footer-bottom">
        <span>© ${new Date().getFullYear()} Movie Ticket Booking · Frontend demonstration, not a real booking service</span>
        <span>Payments are simulated · Data is stored in this browser only</span>
      </div>`;
  }
};

/* ---------- Hash router ---------- */
const ROUTES = [
  { re: /^#\/?$/, view: () => Movies.viewHome() },
  { re: /^#\/movies\/?$/, view: (p, q) => Movies.viewList(q) },
  { re: /^#\/movie\/([^/]+)$/, view: p => Movies.viewDetails(p[0]) },
  { re: /^#\/book\/([^/]+)$/, view: (p, q) => Movies.viewBook(p[0], q) },
  { re: /^#\/seats\/([^/]+)$/, view: p => Seats.view(p[0]) },
  { re: /^#\/checkout$/, view: () => Booking.viewCheckout() },
  { re: /^#\/payment$/, view: () => Booking.viewPayment() },
  { re: /^#\/ticket\/([^/]+)$/, view: p => Booking.viewTicket(p[0]) },
  { re: /^#\/bookings$/, auth: 'user', view: () => Booking.viewBookings() },
  { re: /^#\/wishlist$/, view: () => Movies.viewWishlist() },
  { re: /^#\/login$/, view: (p, q) => Auth.viewLogin(q) },
  { re: /^#\/signup$/, view: () => Auth.viewSignup() },
  { re: /^#\/profile$/, auth: 'user', view: () => Auth.viewProfile() },
  { re: /^#\/admin$/, auth: 'admin', view: (p, q) => Admin.view(q) }
];

const Router = {
  seq: 0,

  parse() {
    const raw = location.hash || '#/';
    const i = raw.indexOf('?');
    return {
      path: i >= 0 ? raw.slice(0, i) : raw,
      query: new URLSearchParams(i >= 0 ? raw.slice(i + 1) : '')
    };
  },

  async render() {
    const token = ++this.seq;
    Movies.stopHero();
    Layout.setActiveNav();
    Layout.loader(true);
    await Utils.sleep(150);
    if (token !== this.seq) return;

    const { path, query } = this.parse();
    const appEl = document.getElementById('app');
    const route = ROUTES.find(r => r.re.test(path));
    let page;

    if (!route) {
      page = { html: Layout.notFound(), title: 'Not found' };
    } else if (route.auth === 'user' && !Auth.current()) {
      toast('Please log in to continue', 'info');
      location.hash = '#/login?next=' + encodeURIComponent(path);
      Layout.loader(false);
      return;
    } else if (route.auth === 'admin' && !Auth.isAdmin()) {
      toast('Admin access only. Log in with an admin account.', 'error');
      location.hash = '#/login?next=' + encodeURIComponent(path);
      Layout.loader(false);
      return;
    } else {
      const match = path.match(route.re);
      const params = match.slice(1).map(x => decodeURIComponent(x || ''));
      page = route.view(params, query);
    }

    if (page.redirect) {
      location.hash = page.redirect;
      Layout.loader(false);
      return;
    }

    appEl.innerHTML = `<div class="page">${page.html}</div>`;
    document.title = page.title ? `${page.title} · Movie Ticket Booking` : 'Movie Ticket Booking · Movie Tickets';
    if (page.bind) page.bind(appEl.querySelector('.page'));
    window.scrollTo({ top: 0 });
    Layout.loader(false);
  }
};

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  Movies.init();
  Auth.init();
  Layout.init();
  Router.render();
});
