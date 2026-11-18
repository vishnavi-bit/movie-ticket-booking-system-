/* =========================================================
   Movie Ticket Booking · auth.js
   Frontend-only accounts for demonstration. Users and the
   session live in LocalStorage. This is NOT secure production
   authentication: passwords are hashed with a simple, non-
   cryptographic hash and there is no server.
   ========================================================= */

const Auth = {
  USERS_KEY: 'mtb_users',
  SESSION_KEY: 'mtb_session',

  init() {
    if (Store.get(this.USERS_KEY, null)) return;
    Store.set(this.USERS_KEY, [
      {
        id: 'U-ADMIN', name: 'Site Admin', email: 'admin@demo.com', phone: '9000000000',
        pass: this.hash('admin123'), role: 'admin', joined: new Date().toISOString()
      },
      {
        id: 'U-DEMO', name: 'Demo User', email: 'demo@demo.com', phone: '9876543210',
        pass: this.hash('demo1234'), role: 'user', joined: new Date().toISOString()
      }
    ]);
  },
  hash(text) {
    return Utils.hash('cinestar-demo-salt:' + text).toString(16);
  },
  users() {
    return Store.get(this.USERS_KEY, []);
  },
  current() {
    const email = Store.get(this.SESSION_KEY, null);
    if (!email) return null;
    const u = this.users().find(x => x.email === email);
    if (!u) return null;
    const { pass, ...safe } = u;
    return safe;
  },
  isAdmin() {
    const u = this.current();
    return !!u && u.role === 'admin';
  },
  login(email, password) {
    const u = this.users().find(x => x.email === email);
    if (!u || u.pass !== this.hash(password)) return { ok: false, error: 'Incorrect email or password.' };
    Store.set(this.SESSION_KEY, u.email);
    const { pass, ...safe } = u;
    return { ok: true, user: safe };
  },
  signup({ name, email, phone, password }) {
    const users = this.users();
    if (users.some(u => u.email === email)) {
      return { ok: false, error: 'An account with this email already exists. Try logging in.' };
    }
    const user = {
      id: Utils.uid('U'), name, email, phone, pass: this.hash(password), role: 'user', joined: new Date().toISOString()
    };
    if (!Store.set(this.USERS_KEY, [...users, user])) return { ok: false, error: 'Could not save your account. Browser storage may be full.' };
    Store.set(this.SESSION_KEY, email);
    return { ok: true };
  },
  logout() {
    Store.remove(this.SESSION_KEY);
  },
  updateProfile(email, changes) {
    const users = this.users().map(u => (u.email === email ? { ...u, ...changes } : u));
    Store.set(this.USERS_KEY, users);
  },

  /* ---------- Login ---------- */
  viewLogin(query) {
    if (this.current()) return { redirect: '#/' };
    const next = query.get('next') || '';
    const html = `<div class="container auth-wrap">
      <div class="auth-card panel">
        <span class="eyebrow">Welcome back</span>
        <h1>Log in</h1>
        <p class="muted">Access your bookings, wishlist and profile.</p>
        <form id="loginForm" novalidate>
          <div class="field">
            <label for="liEmail">Email</label>
            <input id="liEmail" name="email" type="email" autocomplete="username" placeholder="you@example.com">
            <p class="field-error" data-err="email"></p>
          </div>
          <div class="field">
            <label for="liPass">Password</label>
            <input id="liPass" name="password" type="password" autocomplete="current-password" placeholder="••••••••">
            <p class="field-error" data-err="password"></p>
          </div>
          <p class="field-error" data-err="form"></p>
          <button type="submit" class="btn btn-primary btn-block btn-lg">Log in</button>
        </form>
        <div class="demo-box">
          <p><strong>Demo accounts</strong> (kept only in this browser)</p>
          <div class="demo-btns">
            <button type="button" class="btn btn-ghost btn-sm" data-fill="demo@demo.com|demo1234">User · demo@demo.com</button>
            <button type="button" class="btn btn-ghost btn-sm" data-fill="admin@demo.com|admin123">Admin · admin@demo.com</button>
          </div>
        </div>
        <p class="muted center">New here? <a href="#/signup">Create an account</a></p>
      </div>
    </div>`;
    return {
      html,
      title: 'Log in',
      bind: root => {
        root.querySelectorAll('[data-fill]').forEach(btn => {
          btn.addEventListener('click', () => {
            const [e, p] = btn.dataset.fill.split('|');
            root.querySelector('#liEmail').value = e;
            root.querySelector('#liPass').value = p;
          });
        });
        root.querySelector('#loginForm').addEventListener('submit', e => {
          e.preventDefault();
          const email = root.querySelector('#liEmail').value.trim().toLowerCase();
          const password = root.querySelector('#liPass').value;
          const errs = {};
          if (!Utils.validEmail(email)) errs.email = 'Enter a valid email address.';
          if (!password) errs.password = 'Enter your password.';
          showErrors(root, errs);
          if (Object.keys(errs).length) return;
          const res = this.login(email, password);
          if (!res.ok) {
            showErrors(root, { form: res.error });
            return;
          }
          Layout.renderHeader();
          toast(`Welcome back, ${res.user.name}!`, 'success');
          navigate(next.startsWith('#/') && !next.startsWith('#/login') ? next : '#/');
        });
      }
    };
  },

  /* ---------- Sign up ---------- */
  viewSignup() {
    if (this.current()) return { redirect: '#/' };
    const html = `<div class="container auth-wrap">
      <div class="auth-card panel">
        <span class="eyebrow">Join Movie Ticket Booking</span>
        <h1>Create account</h1>
        <p class="muted">Save bookings, wishlist movies and review what you watched.</p>
        <form id="signupForm" novalidate>
          <div class="field">
            <label for="suName">Full name</label>
            <input id="suName" name="name" autocomplete="name" placeholder="Your name">
            <p class="field-error" data-err="name"></p>
          </div>
          <div class="field">
            <label for="suEmail">Email</label>
            <input id="suEmail" name="email" type="email" autocomplete="email" placeholder="you@example.com">
            <p class="field-error" data-err="email"></p>
          </div>
          <div class="field">
            <label for="suPhone">Mobile number</label>
            <input id="suPhone" name="phone" type="tel" autocomplete="tel" placeholder="98765 43210">
            <p class="field-error" data-err="phone"></p>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="suPass">Password</label>
              <input id="suPass" name="password" type="password" autocomplete="new-password" placeholder="8+ characters">
              <p class="field-error" data-err="password"></p>
            </div>
            <div class="field">
              <label for="suConfirm">Confirm password</label>
              <input id="suConfirm" name="confirm" type="password" autocomplete="new-password">
              <p class="field-error" data-err="confirm"></p>
            </div>
          </div>
          <label class="check"><input type="checkbox" id="suTerms" name="terms"> I agree to the demo terms. Nothing is stored beyond this browser.</label>
          <p class="field-error" data-err="terms"></p>
          <p class="field-error" data-err="form"></p>
          <button type="submit" class="btn btn-primary btn-block btn-lg">Create account</button>
        </form>
        <p class="muted center">Already registered? <a href="#/login">Log in</a></p>
      </div>
    </div>`;
    return {
      html,
      title: 'Sign up',
      bind: root => {
        root.querySelector('#signupForm').addEventListener('submit', e => {
          e.preventDefault();
          const f = e.target.elements;
          const data = {
            name: f.name.value.trim(),
            email: f.email.value.trim().toLowerCase(),
            phone: f.phone.value.trim(),
            password: f.password.value,
            confirm: f.confirm.value
          };
          const errs = {};
          if (!/^[A-Za-z][A-Za-z .'-]{1,49}$/.test(data.name)) errs.name = 'Enter your name (letters only, at least 2 characters).';
          if (!Utils.validEmail(data.email)) errs.email = 'Enter a valid email address.';
          if (!Utils.normPhone(data.phone)) errs.phone = 'Enter a valid 10-digit Indian mobile number.';
          if (data.password.length < 8 || !/[A-Za-z]/.test(data.password) || !/\d/.test(data.password)) {
            errs.password = 'Use at least 8 characters with a letter and a number.';
          }
          if (data.confirm !== data.password) errs.confirm = 'Passwords do not match.';
          if (!f.terms.checked) errs.terms = 'Please accept the demo terms to continue.';
          showErrors(root, errs);
          if (Object.keys(errs).length) return;

          data.phone = Utils.normPhone(data.phone);
          const res = this.signup(data);
          if (!res.ok) {
            showErrors(root, { form: res.error });
            return;
          }
          Layout.renderHeader();
          Notify.add(`Welcome to Movie Ticket Booking, ${data.name}!`);
          toast('Account created. You are now logged in.', 'success');
          navigate('#/');
        });
      }
    };
  },

  /* ---------- Profile ---------- */
  viewProfile() {
    const u = this.current();
    const confirmed = Booking.userBookings(u).filter(b => b.status === 'confirmed');
    const spent = confirmed.reduce((s, b) => s + b.total, 0);
    const html = `<div class="container page-pad">
      <div class="page-head"><h1>Your profile</h1></div>
      <div class="profile-grid">
        <section class="panel profile-card">
          <div class="avatar-xl">${Utils.esc(Utils.initials(u.name))}</div>
          <h2>${Utils.esc(u.name)}</h2>
          <p class="muted">${Utils.esc(u.email)}</p>
          <span class="pill">${u.role === 'admin' ? 'Administrator' : 'Member'}</span>
          <div class="profile-stats">
            <div><strong>${confirmed.length}</strong><small>Active bookings</small></div>
            <div><strong>${Utils.money(spent)}</strong><small>Total spent</small></div>
            <div><strong>${Movies.Wishlist.list().length}</strong><small>Wishlist</small></div>
          </div>
          <div class="profile-links">
            <a class="btn btn-ghost btn-block" href="#/bookings">My bookings</a>
            <a class="btn btn-ghost btn-block" href="#/wishlist">Wishlist</a>
            ${u.role === 'admin' ? '<a class="btn btn-ghost btn-block" href="#/admin">Admin dashboard</a>' : ''}
            <button type="button" class="btn btn-danger btn-block" data-action="logout">Log out</button>
          </div>
        </section>
        <section class="panel">
          <h2>Edit details</h2>
          <form id="profileForm" novalidate>
            <div class="field">
              <label for="pfName">Full name</label>
              <input id="pfName" name="name" value="${Utils.esc(u.name)}">
              <p class="field-error" data-err="name"></p>
            </div>
            <div class="field">
              <label for="pfEmail">Email</label>
              <input id="pfEmail" value="${Utils.esc(u.email)}" disabled>
              <small class="muted">Your email is your login and cannot be changed here.</small>
            </div>
            <div class="field">
              <label for="pfPhone">Mobile number</label>
              <input id="pfPhone" name="phone" value="${Utils.esc(u.phone)}">
              <p class="field-error" data-err="phone"></p>
            </div>
            <p class="field-error" data-err="form"></p>
            <button type="submit" class="btn btn-primary">Save changes</button>
          </form>
        </section>
      </div>
    </div>`;
    return {
      html,
      title: 'Profile',
      bind: root => {
        root.querySelector('#profileForm').addEventListener('submit', e => {
          e.preventDefault();
          const name = root.querySelector('#pfName').value.trim();
          const phone = Utils.normPhone(root.querySelector('#pfPhone').value);
          const errs = {};
          if (!/^[A-Za-z][A-Za-z .'-]{1,49}$/.test(name)) errs.name = 'Enter your name (letters only, at least 2 characters).';
          if (!phone) errs.phone = 'Enter a valid 10-digit Indian mobile number.';
          showErrors(root, errs);
          if (Object.keys(errs).length) return;
          this.updateProfile(u.email, { name, phone });
          Layout.renderHeader();
          toast('Profile updated', 'success');
          Router.render();
        });
      }
    };
  }
};
