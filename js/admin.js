/* =========================================================
   Movie Ticket Booking · admin.js
   Admin dashboard: overview (demo revenue), movie CRUD,
   showtime management, booking list with cancel. All data is
   saved to LocalStorage.
   ========================================================= */

const Admin = {
  LANGUAGES: ['English', 'Hindi', 'Telugu', 'Tamil', 'Malayalam', 'Kannada'],

  view(query) {
    const tab = query.get('tab') || 'overview';
    const tabs = [['overview', 'Overview'], ['movies', 'Movies'], ['showtimes', 'Showtimes'], ['bookings', 'Bookings']];
    const nav = tabs.map(([k, label]) =>
      `<a href="#/admin?tab=${k}" class="${tab === k ? 'active' : ''}">${label}</a>`).join('');
    const parts = {
      overview: () => this.overview(),
      movies: () => this.movies(),
      showtimes: () => this.showtimes(query),
      bookings: () => this.bookings()
    };
    const body = (parts[tab] || parts.overview)();
    return {
      html: `<div class="container page-pad">
        <div class="page-head">
          <div>
            <h1>Admin dashboard</h1>
            <p class="muted">Demo data stored in this browser. Changes save automatically.</p>
          </div>
        </div>
        <nav class="admin-tabs" aria-label="Admin sections">${nav}</nav>
        ${body.html}
      </div>`,
      title: 'Admin',
      bind: root => body.bind && body.bind(root)
    };
  },

  /* ---------- Overview ---------- */
  overview() {
    const movies = Movies.all();
    const all = Booking.all();
    const active = all.filter(b => b.status === 'confirmed');
    const revenue = active.reduce((s, b) => s + b.total, 0);
    const tickets = active.reduce((s, b) => s + b.seats.length, 0);
    const byMovie = {};
    active.forEach(b => { byMovie[b.movieTitle] = (byMovie[b.movieTitle] || 0) + b.total; });
    const entries = Object.entries(byMovie).sort((a, b) => b[1] - a[1]);
    const max = entries.length ? entries[0][1] : 1;

    const stats = [
      ['🎬', 'Total movies', movies.length],
      ['🟢', 'Now showing', movies.filter(m => m.status === 'now').length],
      ['🗓️', 'Upcoming', movies.filter(m => m.status === 'upcoming').length],
      ['🎟️', 'Active bookings', active.length],
      ['💺', 'Tickets sold', tickets],
      ['₹', 'Revenue (demo)', Utils.money(revenue)]
    ];
    const recent = all.slice(0, 6);

    const html = `
      <section class="stat-grid">
        ${stats.map(([icon, label, value]) => `
          <div class="stat-card">
            <span class="stat-icon" aria-hidden="true">${icon}</span>
            <div><small>${label}</small><strong>${value}</strong></div>
          </div>`).join('')}
      </section>
      <div class="two-col">
        <section class="panel">
          <h3>Revenue by movie</h3>
          ${entries.length
            ? entries.map(([title, v]) => `
                <div class="bar-row">
                  <span>${Utils.esc(title)}</span>
                  <div class="bar"><i style="width:${Math.max(4, Math.round(v / max * 100))}%"></i></div>
                  <b>${Utils.money(v)}</b>
                </div>`).join('')
            : '<p class="muted">No revenue yet. Make a booking to see it here.</p>'}
        </section>
        <section class="panel">
          <h3>Recent bookings</h3>
          ${recent.length
            ? `<ul class="mini-list">${recent.map(b => `
                <li>
                  <div><strong>${Utils.esc(b.movieTitle)}</strong><small class="muted block">${Utils.esc(b.customer ? b.customer.name : '')} · ${b.seats.join(', ')}</small></div>
                  <span class="status ${b.status}">${b.status}</span>
                </li>`).join('')}</ul>`
            : '<p class="muted">No bookings yet.</p>'}
          <hr class="divider">
          <h3>Demo data</h3>
          <p class="muted small">Restores the sample movies and clears bookings, reviews, notifications and wishlists. User accounts are kept.</p>
          <button type="button" class="btn btn-danger" id="resetDemo">Reset demo data</button>
        </section>
      </div>`;

    return {
      html,
      bind: root => {
        root.querySelector('#resetDemo').addEventListener('click', () => {
          openModal(`
            <h3>Reset demo data?</h3>
            <p class="muted">This clears all bookings, reviews, notifications, recently viewed items and wishlists, and restores the sample movies.</p>
            <div class="modal-actions">
              <button type="button" class="btn btn-ghost" data-close>Cancel</button>
              <button type="button" class="btn btn-danger" id="confirmReset">Reset</button>
            </div>`);
          document.getElementById('confirmReset').addEventListener('click', () => {
            this.resetDemo();
            closeModal();
            toast('Demo data reset', 'success');
            navigate('#/admin?tab=overview');
          });
        });
      }
    };
  },

  resetDemo() {
    Movies.reset();
    ['mtb_bookings', 'mtb_reviews', 'mtb_notifs', 'mtb_recent', 'mtb_pending'].forEach(k => Store.remove(k));
    Store.keys().filter(k => k.startsWith('mtb_wish_')).forEach(k => Store.remove(k));
    Layout.renderBadge();
  },

  /* ---------- Movies (CRUD) ---------- */
  movies() {
    const list = Movies.all();
    const rows = list.map(m => `
      <tr>
        <td><img class="thumb" src="${Movies.posterURL(m)}" alt=""></td>
        <td><strong>${Utils.esc(m.title)}</strong><small class="muted block">${Utils.esc(m.genres.join(', '))}</small></td>
        <td>${Utils.esc(m.language)}</td>
        <td><span class="pill ${m.status}">${m.status === 'now' ? 'Now showing' : 'Upcoming'}</span></td>
        <td>★ ${m.score.toFixed(1)}</td>
        <td>${m.trending ? 'Yes' : '—'}</td>
        <td>${m.showtimes.length}</td>
        <td class="actions">
          <button type="button" class="btn btn-ghost btn-sm" data-admin="edit" data-id="${m.id}">Edit</button>
          <button type="button" class="btn btn-danger btn-sm" data-admin="delete" data-id="${m.id}">Delete</button>
        </td>
      </tr>`).join('');

    const html = `
      <section class="panel">
        <div class="toolbar">
          <h2>Movies <span class="muted">(${list.length})</span></h2>
          <button type="button" class="btn btn-primary" data-admin="add">+ Add movie</button>
        </div>
        ${list.length ? `<div class="table-wrap"><table class="table">
          <thead><tr><th>Poster</th><th>Title</th><th>Language</th><th>Status</th><th>Rating</th><th>Trending</th><th>Shows</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>` : '<p class="muted">No movies yet. Add one to get started.</p>'}
      </section>`;

    return {
      html,
      bind: root => {
        root.addEventListener('click', e => {
          const btn = e.target.closest('[data-admin]');
          if (!btn) return;
          const action = btn.dataset.admin;
          if (action === 'add') this.movieForm(null);
          if (action === 'edit') this.movieForm(Movies.get(btn.dataset.id));
          if (action === 'delete') this.confirmDeleteMovie(btn.dataset.id);
        });
      }
    };
  },

  slug(title, list) {
    const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'movie';
    let id = base;
    let n = 2;
    while (list.some(m => m.id === id)) id = `${base}-${n++}`;
    return id;
  },

  movieForm(movie) {
    const m = movie || {
      title: '', language: 'English', genres: [], duration: 120, releaseDate: Utils.todayISO(),
      certificate: 'UA', score: 7, status: 'upcoming', trending: false, description: '',
      director: '', poster: '', colors: ['#ff4d6d', '#7c5cff']
    };
    openModal(`
      <div class="modal-head"><h3>${movie ? 'Edit movie' : 'Add movie'}</h3>
        <button type="button" class="icon-btn" data-close aria-label="Close">✕</button></div>
      <form id="movieForm" class="form-grid" novalidate>
        <div class="field span-2"><label for="mfTitle">Title *</label>
          <input id="mfTitle" name="title" value="${Utils.esc(m.title)}"><p class="field-error" data-err="title"></p></div>
        <div class="field"><label for="mfLang">Language *</label>
          <select id="mfLang" name="language">${this.LANGUAGES.map(l => `<option ${l === m.language ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label for="mfCert">Certificate</label>
          <select id="mfCert" name="certificate">${['U', 'UA', 'A'].map(c => `<option ${c === m.certificate ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="field span-2"><label for="mfGenres">Genres * (comma separated)</label>
          <input id="mfGenres" name="genres" value="${Utils.esc(m.genres.join(', '))}" placeholder="Action, Thriller"><p class="field-error" data-err="genres"></p></div>
        <div class="field"><label for="mfDuration">Duration (minutes) *</label>
          <input id="mfDuration" name="duration" type="number" min="30" max="300" value="${m.duration}"><p class="field-error" data-err="duration"></p></div>
        <div class="field"><label for="mfRelease">Release date *</label>
          <input id="mfRelease" name="releaseDate" type="date" value="${m.releaseDate}"><p class="field-error" data-err="releaseDate"></p></div>
        <div class="field"><label for="mfScore">Rating (0–10) *</label>
          <input id="mfScore" name="score" type="number" step="0.1" min="0" max="10" value="${m.score}"><p class="field-error" data-err="score"></p></div>
        <div class="field"><label for="mfStatus">Status</label>
          <select id="mfStatus" name="status">
            <option value="now" ${m.status === 'now' ? 'selected' : ''}>Now showing</option>
            <option value="upcoming" ${m.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
          </select></div>
        <div class="field"><label for="mfDirector">Director</label>
          <input id="mfDirector" name="director" value="${Utils.esc(m.director || '')}"></div>
        <div class="field span-2"><label for="mfDesc">Description * (min 20 characters)</label>
          <textarea id="mfDesc" name="description" rows="3">${Utils.esc(m.description)}</textarea><p class="field-error" data-err="description"></p></div>
        <div class="field span-2"><label for="mfPoster">Poster image URL (optional)</label>
          <input id="mfPoster" name="poster" value="${Utils.esc(m.poster || '')}" placeholder="https://… leave empty to use the generated poster">
          <p class="field-error" data-err="poster"></p></div>
        <div class="field"><label for="mfC1">Poster colour 1</label><input id="mfC1" name="c1" type="color" value="${m.colors[0]}"></div>
        <div class="field"><label for="mfC2">Poster colour 2</label><input id="mfC2" name="c2" type="color" value="${m.colors[1]}"></div>
        <label class="check span-2"><input type="checkbox" name="trending" ${m.trending ? 'checked' : ''}> Show in Trending</label>
        <p class="field-error span-2" data-err="form"></p>
        <div class="modal-actions span-2">
          <button type="button" class="btn btn-ghost" data-close>Cancel</button>
          <button type="submit" class="btn btn-primary">${movie ? 'Save changes' : 'Add movie'}</button>
        </div>
      </form>`);

    const form = document.getElementById('movieForm');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = form.elements;
      const val = name => f[name].value.trim();
      const errs = {};
      const title = val('title');
      if (title.length < 2) errs.title = 'Title must be at least 2 characters.';
      const genres = val('genres').split(',').map(s => s.trim()).filter(Boolean);
      if (!genres.length) errs.genres = 'Add at least one genre.';
      const duration = Number(val('duration'));
      if (!(duration >= 30 && duration <= 300)) errs.duration = 'Duration must be between 30 and 300 minutes.';
      const releaseDate = val('releaseDate');
      if (!releaseDate) errs.releaseDate = 'Choose a release date.';
      const score = Number(val('score'));
      if (!(score >= 0 && score <= 10)) errs.score = 'Rating must be between 0 and 10.';
      const description = val('description');
      if (description.length < 20) errs.description = 'Description should be at least 20 characters.';
      const poster = val('poster');
      if (poster && !/^https?:\/\/\S+$/.test(poster)) errs.poster = 'Use a full http or https image URL.';
      showErrors(form, errs);
      if (Object.keys(errs).length) return;

      const data = {
        title,
        language: val('language'),
        certificate: val('certificate'),
        genres,
        duration,
        releaseDate,
        score: Math.round(score * 10) / 10,
        status: val('status'),
        director: val('director'),
        description,
        poster,
        trending: f.trending.checked,
        colors: [val('c1'), val('c2')]
      };
      const list = Movies.all();
      if (movie) {
        const idx = list.findIndex(x => x.id === movie.id);
        if (idx >= 0) list[idx] = { ...list[idx], ...data };
      } else {
        list.push({ id: this.slug(title, list), ...data, cast: [], music: '', writer: '', showtimes: [] });
        Notify.add(`New movie added: ${title}`);
      }
      Movies.save(list);
      closeModal();
      toast(movie ? 'Movie updated' : 'Movie added', 'success');
      navigate('#/admin?tab=movies');
    });
  },

  confirmDeleteMovie(id) {
    const m = Movies.get(id);
    if (!m) return;
    openModal(`
      <h3>Delete “${Utils.esc(m.title)}”?</h3>
      <p class="muted">Its showtimes will be removed. Past bookings are kept for records.</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close>Cancel</button>
        <button type="button" class="btn btn-danger" id="confirmDel">Delete movie</button>
      </div>`);
    document.getElementById('confirmDel').addEventListener('click', () => {
      Movies.save(Movies.all().filter(x => x.id !== id));
      closeModal();
      toast('Movie deleted', 'success');
      navigate('#/admin?tab=movies');
    });
  },

  /* ---------- Showtimes ---------- */
  showtimes(query) {
    const list = Movies.all();
    if (!list.length) {
      return { html: Layout.empty({ icon: '🎬', title: 'No movies yet', text: 'Add a movie first, then give it showtimes.' }), bind: () => {} };
    }
    const requested = query.get('movie');
    const movieId = list.some(x => x.id === requested) ? requested : list[0].id;
    const m = Movies.get(movieId);
    const rows = m.showtimes
      .slice()
      .sort((a, b) => a.cinemaId.localeCompare(b.cinemaId) || a.time.localeCompare(b.time))
      .map(st => {
        const c = Movies.cinemaById(st.cinemaId);
        return `<tr>
          <td>${Utils.esc(c ? c.name : st.cinemaId)}<small class="muted block">${Utils.esc(c ? c.city : '')}</small></td>
          <td>${Utils.esc(st.screen)}</td>
          <td>${st.time}</td>
          <td>${Utils.esc(st.format)}</td>
          <td><button type="button" class="btn btn-danger btn-sm" data-del-st="${st.cinemaId}|${st.time}">Remove</button></td>
        </tr>`;
      }).join('');

    const html = `
      <section class="panel">
        <label class="field">Movie
          <select id="stMovie">${list.map(x => `<option value="${x.id}" ${x.id === movieId ? 'selected' : ''}>${Utils.esc(x.title)}${x.status === 'upcoming' ? ' (upcoming)' : ''}</option>`).join('')}</select>
        </label>
      </section>
      <div class="two-col">
        <section class="panel">
          <h3>Showtimes for ${Utils.esc(m.title)} <span class="muted">(${m.showtimes.length})</span></h3>
          ${m.showtimes.length
            ? `<div class="table-wrap"><table class="table">
                <thead><tr><th>Cinema</th><th>Screen</th><th>Time</th><th>Format</th><th></th></tr></thead>
                <tbody>${rows}</tbody></table></div>`
            : '<p class="muted">No showtimes yet. Add one with the form.</p>'}
          <p class="muted small">Each showtime repeats every day for the next 7 days.</p>
        </section>
        <section class="panel">
          <h3>Add showtime</h3>
          <form id="stForm" novalidate>
            <div class="field"><label for="stCinema">Cinema</label>
              <select id="stCinema" name="cinemaId">${Movies.CINEMAS.map(c => `<option value="${c.id}">${Utils.esc(c.city)} — ${Utils.esc(c.name)}</option>`).join('')}</select></div>
            <div class="field"><label for="stTime">Start time</label>
              <input id="stTime" name="time" type="time" required><p class="field-error" data-err="time"></p></div>
            <div class="field"><label for="stScreen">Screen</label>
              <select id="stScreen" name="screen">${['Screen 1', 'Screen 2', 'Screen 3'].map(s => `<option>${s}</option>`).join('')}</select></div>
            <div class="field"><label for="stFormat">Format</label>
              <select id="stFormat" name="format">${['2D', '3D', 'IMAX', '4DX'].map(s => `<option>${s}</option>`).join('')}</select></div>
            <p class="field-error" data-err="form"></p>
            <button type="submit" class="btn btn-primary btn-block">Add showtime</button>
          </form>
        </section>
      </div>`;

    return {
      html,
      bind: root => {
        root.querySelector('#stMovie').addEventListener('change', e => {
          navigate(`#/admin?tab=showtimes&movie=${encodeURIComponent(e.target.value)}`);
        });
        root.querySelector('#stForm').addEventListener('submit', e => {
          e.preventDefault();
          const f = e.target.elements;
          const time = f.time.value;
          const errs = {};
          if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
            errs.time = 'Pick a valid start time.';
          } else if (m.showtimes.some(s => s.cinemaId === f.cinemaId.value && s.time === time)) {
            errs.form = 'That cinema already has a show at this time.';
          }
          showErrors(e.target, errs);
          if (Object.keys(errs).length) return;
          const all = Movies.all();
          const target = all.find(x => x.id === movieId);
          target.showtimes.push({ cinemaId: f.cinemaId.value, time, screen: f.screen.value, format: f.format.value });
          target.showtimes.sort((a, b) => a.time.localeCompare(b.time));
          Movies.save(all);
          toast('Showtime added', 'success');
          navigate(`#/admin?tab=showtimes&movie=${encodeURIComponent(movieId)}`);
        });
        root.addEventListener('click', e => {
          const btn = e.target.closest('[data-del-st]');
          if (!btn) return;
          const [cinemaId, time] = btn.dataset.delSt.split('|');
          const all = Movies.all();
          const target = all.find(x => x.id === movieId);
          target.showtimes = target.showtimes.filter(s => !(s.cinemaId === cinemaId && s.time === time));
          Movies.save(all);
          toast('Showtime removed', 'info');
          navigate(`#/admin?tab=showtimes&movie=${encodeURIComponent(movieId)}`);
        });
      }
    };
  },

  /* ---------- Bookings ---------- */
  bookings() {
    const list = Booking.all();
    const rows = list.map(b => {
      const searchText = `${b.id} ${b.movieTitle} ${b.customer ? b.customer.name + ' ' + b.customer.email : ''}`.toLowerCase();
      return `<tr data-search="${Utils.esc(searchText)}">
        <td><code>${b.id}</code></td>
        <td>${Utils.esc(b.movieTitle)}<small class="muted block">${Utils.esc(b.cinemaName)}</small></td>
        <td>${Utils.esc(b.customer ? b.customer.name : '')}<small class="muted block">${Utils.esc(b.customer ? b.customer.email : '')}</small></td>
        <td>${Utils.fmtDate(b.date, { day: 'numeric', month: 'short' })} · ${b.time}</td>
        <td>${b.seats.join(', ')}</td>
        <td>${Utils.money(b.total)}</td>
        <td><span class="status ${b.status}">${b.status}</span></td>
        <td>${b.status === 'confirmed' ? `<button type="button" class="btn btn-danger btn-sm" data-cancel-admin="${b.id}">Cancel</button>` : ''}</td>
      </tr>`;
    }).join('');

    const html = `
      <section class="panel">
        <div class="toolbar">
          <h2>All bookings <span class="muted">(${list.length})</span></h2>
          <input type="search" id="bkSearch" class="filter-input" placeholder="Search by ID, movie or customer" aria-label="Search bookings">
        </div>
        ${list.length ? `<div class="table-wrap"><table class="table">
          <thead><tr><th>ID</th><th>Movie</th><th>Customer</th><th>Show</th><th>Seats</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>${rows}</tbody></table></div>`
          : '<p class="muted">No bookings yet. They appear here as soon as a checkout is confirmed.</p>'}
      </section>`;

    return {
      html,
      bind: root => {
        const search = root.querySelector('#bkSearch');
        if (search) {
          search.addEventListener('input', () => {
            const q = search.value.trim().toLowerCase();
            root.querySelectorAll('tbody tr').forEach(tr => {
              tr.hidden = !!q && !tr.dataset.search.includes(q);
            });
          });
        }
        root.addEventListener('click', e => {
          const btn = e.target.closest('[data-cancel-admin]');
          if (btn) Booking.confirmCancel(btn.dataset.cancelAdmin);
        });
      }
    };
  }
};
