/* =========================================================
   Movie Ticket Booking · movies.js
   Sample catalogue (fictional titles), generated poster art,
   home / browse / details / wishlist views, show picker and reviews.
   ========================================================= */

const SEED_VERSION = 'v1';

// Cinemas are fixed reference data (admin manages showtimes, not cinemas)
const CINEMAS = [
  { id: 'c1', name: 'Starline Cinemas: Hitech City', city: 'Hyderabad', address: 'Hitech City Main Road, Madhapur' },
  { id: 'c2', name: 'Starline Cinemas: Banjara Hills', city: 'Hyderabad', address: 'Road No. 12, Banjara Hills' },
  { id: 'c3', name: 'Starline Cinemas: Andheri West', city: 'Mumbai', address: 'Link Road, Andheri West' },
  { id: 'c4', name: 'Starline Cinemas: Bandra', city: 'Mumbai', address: 'Hill Road, Bandra West' },
  { id: 'c5', name: 'Starline Cinemas: Connaught Place', city: 'Delhi', address: 'Inner Circle, Connaught Place' },
  { id: 'c6', name: 'Starline Cinemas: Saket', city: 'Delhi', address: 'Select Citywalk, Saket' },
  { id: 'c7', name: 'Starline Cinemas: Koramangala', city: 'Bengaluru', address: '80 Feet Road, Koramangala' },
  { id: 'c8', name: 'Starline Cinemas: Indiranagar', city: 'Bengaluru', address: '100 Feet Road, Indiranagar' },
  { id: 'c9', name: 'Starline Cinemas: Anna Nagar', city: 'Chennai', address: '2nd Avenue, Anna Nagar' },
  { id: 'c10', name: 'Starline Cinemas: T. Nagar', city: 'Chennai', address: 'Usman Road, T. Nagar' }
];

// Fictional sample titles and people - not real films
const MOVIE_SEED = [
  {
    id: 'neon-horizon', title: 'Neon Horizon', language: 'English', genres: ['Sci-Fi', 'Thriller'], duration: 138,
    releaseDate: '2026-11-07', certificate: 'UA', score: 8.2, status: 'now', trending: true, colors: ['#ff4d6d', '#7c5cff'],
    director: 'Ava Reynolds', music: 'Kai Lindqvist', writer: 'Ava Reynolds & Sam Okafor',
    cast: [['Leo Marin', 'Commander Ray Kade'], ['Priya Nair', 'Dr. Maya Sen'], ['Tomas Hale', 'Synth pilot Orr']],
    description: 'In a city where the night never ends, a disgraced signal analyst intercepts a transmission from a satellite decommissioned twenty years ago. She must decode it before a syndicate and her own buried memories catch up with her.'
  },
  {
    id: 'monsoon-dreams', title: 'Monsoon Dreams', language: 'Hindi', genres: ['Romance', 'Drama'], duration: 125,
    releaseDate: '2026-11-14', certificate: 'UA', score: 7.6, status: 'now', trending: false, colors: ['#14b8a6', '#2563eb'],
    director: 'Ritu Sharma', music: 'Arjun Vale', writer: 'Ritu Sharma',
    cast: [['Kabir Anand', 'Rohan'], ['Meera Joshi', 'Tara']],
    description: 'Two strangers stranded at a hill-station guesthouse during a week of relentless rain discover how much they have left unsaid, and how far they are willing to travel to say it.'
  },
  {
    id: 'iron-tide', title: 'Iron Tide', language: 'Telugu', genres: ['Action', 'Adventure'], duration: 152,
    releaseDate: '2026-11-13', certificate: 'UA', score: 8.0, status: 'now', trending: true, colors: ['#f97316', '#dc2626'],
    director: 'Vikram Rao', music: 'S. Keshav', writer: 'Vikram Rao & P. Anand',
    cast: [['Arun Teja', 'Shiva'], ['Lakshmi Iyer', 'Commissioner Devi']],
    description: 'When a port city is held hostage by a rogue shipping cartel, a former naval diver returns to the water to rescue his brother and expose the men behind the blockade.'
  },
  {
    id: 'the-last-orchard', title: 'The Last Orchard', language: 'English', genres: ['Drama'], duration: 118,
    releaseDate: '2026-10-31', certificate: 'U', score: 8.5, status: 'now', trending: false, colors: ['#84cc16', '#166534'],
    director: 'Elena Park', music: 'Noor Haddad', writer: 'Elena Park',
    cast: [['Hannah Cole', 'Maren'], ['Daniel Ose', 'Thomas']],
    description: 'A widowed fruit farmer must decide whether to sell the orchard her family has tended for four generations. A quiet, warm story about roots, change and the seasons that shape us.'
  },
  {
    id: 'gully-kings', title: 'Gully Kings', language: 'Hindi', genres: ['Comedy'], duration: 130,
    releaseDate: '2026-11-06', certificate: 'UA', score: 7.1, status: 'now', trending: false, colors: ['#eab308', '#ea580c'],
    director: 'Sunny Dhillon', music: 'Pritam Roy', writer: 'Sunny Dhillon & Neha Kapur',
    cast: [['Varun Mehra', 'Bunty'], ['Ishita Rao', 'Pinky'], ['Sahil Khan', 'Gogi']],
    description: 'Three cricket-obsessed neighbours enter a street-tournament with a plan that is somewhere between brilliant and disastrous. Mayhem follows in every lane of the neighbourhood.'
  },
  {
    id: 'phantom-circuit', title: 'Phantom Circuit', language: 'Tamil', genres: ['Thriller', 'Mystery'], duration: 135,
    releaseDate: '2026-11-12', certificate: 'UA', score: 7.8, status: 'now', trending: false, colors: ['#6366f1', '#0f172a'],
    director: 'Karthik Selvan', music: 'Yuvan Rahul', writer: 'Karthik Selvan',
    cast: [['Surya Venkat', 'Inspector Arul'], ['Anjali Murali', 'Nila']],
    description: 'A string of high-tech heists leaves no fingerprints and no suspects. An inspector and a gifted hacker must follow a trail of ghost signals through the city\'s oldest tram tunnels.'
  },
  {
    id: 'starfall-odyssey', title: 'Starfall Odyssey', language: 'English', genres: ['Animation', 'Adventure'], duration: 102,
    releaseDate: '2026-12-05', certificate: 'U', score: 7.9, status: 'upcoming', trending: true, colors: ['#38bdf8', '#a855f7'],
    director: 'Mila Torres', music: 'Ben Ashford', writer: 'Mila Torres & Joe Lin',
    cast: [['Voice: Nina Bell', 'Pip, the star-cartographer'], ['Voice: Owen Gray', 'Captain Quill']],
    description: 'A curious young cartographer and a grumpy robot crew sail a ship made of light across a galaxy of floating islands, searching for the place where every falling star comes to rest.'
  },
  {
    id: 'dragons-ledger', title: "Dragon's Ledger", language: 'English', genres: ['Fantasy', 'Action'], duration: 160,
    releaseDate: '2026-12-18', certificate: 'UA', score: 8.1, status: 'upcoming', trending: false, colors: ['#b45309', '#7f1d1d'],
    director: 'Gareth Vale', music: 'Iris Monk', writer: 'Gareth Vale',
    cast: [['Julian Reyes', 'Aldric'], ['Sophie Lang', 'Vaelith']],
    description: 'Bound by an ancient contract, a disgraced accountant of the kingdom must balance the debts of a dying dragon clan against the greed of the crown that is hunting it.'
  },
  {
    id: 'midnight-samba', title: 'Midnight Samba', language: 'Hindi', genres: ['Musical', 'Romance'], duration: 140,
    releaseDate: '2026-12-25', certificate: 'UA', score: 7.3, status: 'upcoming', trending: false, colors: ['#ec4899', '#f59e0b'],
    director: 'Dev Ranjan', music: 'Dev Ranjan', writer: 'Dev Ranjan & Ila Sen',
    cast: [['Aditya Singh', 'Rishi'], ['Shreya Pal', 'Zoya']],
    description: 'A rising dancer and a sound engineer collide during one unforgettable week of rehearsals for a city festival. Every song they record changes what they think they want.'
  },
  {
    id: 'quiet-ridge', title: 'Quiet Ridge', language: 'English', genres: ['Horror'], duration: 96,
    releaseDate: '2026-11-10', certificate: 'A', score: 7.0, status: 'now', trending: false, colors: ['#1e293b', '#7f1d1d'],
    director: 'Owen Blackwood', music: 'Lena Frost', writer: 'Owen Blackwood',
    cast: [['Grace Holt', 'Nora'], ['Ellis Ford', 'Mark']],
    description: 'A family moves into a remote farmhouse on a ridge where the radio only plays one song, and the neighbours never come out after dark. Something is listening.'
  },
  {
    id: 'coastal-hearts', title: 'Coastal Hearts', language: 'Malayalam', genres: ['Romance', 'Drama'], duration: 127,
    releaseDate: '2026-11-03', certificate: 'U', score: 7.4, status: 'now', trending: false, colors: ['#0ea5e9', '#22c55e'],
    director: 'Anoop Varghese', music: 'Jithin Paul', writer: 'Anoop Varghese',
    cast: [['Rahul Menon', 'Jayan'], ['Devika Nair', 'Athira']],
    description: 'A fishing-village schoolteacher and a returning architect rediscover each other while the coastline is redrawn by a new harbour. Love, loyalty and the tides of home.'
  },
  {
    id: 'code-red-protocol', title: 'Code Red Protocol', language: 'Kannada', genres: ['Crime', 'Thriller'], duration: 132,
    releaseDate: '2026-11-11', certificate: 'UA', score: 7.9, status: 'now', trending: true, colors: ['#dc2626', '#1d4ed8'],
    director: 'Shreyas Gowda', music: 'Anand Pillai', writer: 'Shreyas Gowda',
    cast: [['Pranav Kulkarni', 'DCP Hegde'], ['Ritika Shetty', 'Asha']],
    description: 'When a city-wide emergency alarm is hacked, a police officer and a disgraced cyber-expert have six hours to stop a chain of blackouts before the grid collapses.'
  }
];

const Movies = {
  CINEMAS,

  /* ---------- Data access ---------- */
  init() {
    if (!Store.get('mtb_movies', null) || Store.get('mtb_seed_version', null) !== SEED_VERSION) {
      this.reset();
    }
  },
  reset() {
    Store.set('mtb_movies', this.buildSeed());
    Store.set('mtb_seed_version', SEED_VERSION);
  },
  buildSeed() {
    return MOVIE_SEED.map((m, i) => ({
      ...m,
      poster: '',
      cast: m.cast.map(([name, role]) => ({ name, role })),
      showtimes: m.status === 'now' ? this.seedShowtimes(i) : []
    }));
  },
  seedShowtimes(index) {
    const plan = [
      { cinemaId: CINEMAS[index % 10].id, times: ['10:30', '14:15', '18:30'], format: '2D' },
      { cinemaId: CINEMAS[(index + 3) % 10].id, times: ['12:00', '21:45'], format: 'IMAX' },
      { cinemaId: CINEMAS[(index + 6) % 10].id, times: ['09:45', '16:00', '22:15'], format: '2D' }
    ];
    const out = [];
    plan.forEach((p, pi) => p.times.forEach((time, ti) => {
      out.push({
        cinemaId: p.cinemaId,
        time,
        screen: 'Screen ' + (1 + ((pi + ti) % 3)),
        format: (pi === 2 && ti === 1) ? '3D' : p.format
      });
    }));
    return out;
  },
  all() {
    return Store.get('mtb_movies', []);
  },
  get(id) {
    return this.all().find(m => m.id === id) || null;
  },
  save(list) {
    Store.set('mtb_movies', list);
  },
  cities() {
    return [...new Set(CINEMAS.map(c => c.city))];
  },
  cinemasInCity(city) {
    return CINEMAS.filter(c => c.city === city);
  },
  cinemaById(id) {
    return CINEMAS.find(c => c.id === id) || null;
  },
  genres() {
    return [...new Set(this.all().flatMap(m => m.genres))].sort();
  },
  languages() {
    return [...new Set(this.all().map(m => m.language))].sort();
  },
  // Today plus the next six days
  dates() {
    const today = Utils.todayISO();
    return Array.from({ length: 7 }, (_, i) => Utils.addDays(today, i));
  },

  /* ---------- Shows ---------- */
  makeShowId(movieId, cinemaId, date, time) {
    return `${movieId}__${cinemaId}__${date}__${time.replace(':', '')}`;
  },
  parseShowId(showId) {
    const parts = String(showId).split('__');
    if (parts.length !== 4 || !/^\d{4}$/.test(parts[3])) return null;
    return { movieId: parts[0], cinemaId: parts[1], date: parts[2], time: parts[3].slice(0, 2) + ':' + parts[3].slice(2) };
  },
  getShow(showId) {
    const p = this.parseShowId(showId);
    if (!p) return null;
    const movie = this.get(p.movieId);
    const cinema = this.cinemaById(p.cinemaId);
    const st = movie && movie.showtimes.find(s => s.cinemaId === p.cinemaId && s.time === p.time);
    if (!movie || !cinema || !st || !this.dates().includes(p.date)) return null;
    return { showId, movie, cinema, city: cinema.city, date: p.date, time: p.time, screen: st.screen, format: st.format };
  },
  showStart(date, time) {
    const [y, mo, d] = date.split('-').map(Number);
    const [h, mi] = time.split(':').map(Number);
    return new Date(y, mo - 1, d, h, mi);
  },
  isPast(date, time) {
    return this.showStart(date, time) < new Date();
  },

  /* ---------- Posters (generated SVG art, or admin-supplied URL) ---------- */
  posterURL(m, wide) {
    if (m && m.poster) return m.poster;
    return this.posterSVG(m || {}, wide);
  },
  posterSVG(m, wide) {
    const w = wide ? 1280 : 600;
    const h = wide ? 540 : 900;
    const [c1, c2] = (m.colors && m.colors.length === 2) ? m.colors : ['#ff4d6d', '#7c5cff'];
    const words = String(m.title || 'Untitled').toUpperCase().split(/\s+/);
    const limit = wide ? 22 : 12;
    const lines = [];
    let cur = '';
    words.forEach(word => {
      const next = cur ? cur + ' ' + word : word;
      if (next.length > limit && cur) { lines.push(cur); cur = word; } else { cur = next; }
    });
    if (cur) lines.push(cur);
    const fs = wide ? 96 : 66;
    const startY = wide ? h * 0.52 : h * 0.56;
    const titleSvg = lines.slice(0, 4).map((l, i) =>
      `<text x="${w / 2}" y="${(startY + i * fs * 1.08).toFixed(0)}" text-anchor="middle" font-family="Outfit, Arial Black, Arial, sans-serif" font-weight="900" font-size="${fs}" fill="#ffffff" fill-opacity="${wide ? 0.2 : 1}" letter-spacing="3">${Utils.esc(l)}</text>`
    ).join('');
    const rnd = Utils.rng(Utils.hash(m.id || m.title || 'x'));
    let stars = '';
    for (let i = 0; i < 50; i++) {
      stars += `<circle cx="${(rnd() * w).toFixed(0)}" cy="${(rnd() * h * 0.55).toFixed(0)}" r="${(rnd() * 2 + 0.6).toFixed(1)}" fill="#ffffff" opacity="${(rnd() * 0.6 + 0.2).toFixed(2)}"/>`;
    }
    const tag = [String(m.language || '').toUpperCase(), (m.genres && m.genres[0]) ? m.genres[0].toUpperCase() : ''].filter(Boolean).join(' · ');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.3" r="0.7"><stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="1" stop-color="#000000" stop-opacity="0.55"/></radialGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#bg)"/>
      <rect width="${w}" height="${h}" fill="url(#glow)"/>
      ${stars}
      <circle cx="${w / 2}" cy="${(h * 0.3).toFixed(0)}" r="${(w * 0.2).toFixed(0)}" fill="#000000" opacity="0.25"/>
      ${titleSvg}
      <text x="${w / 2}" y="${h - 36}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${wide ? 24 : 18}" fill="#ffffff" opacity="0.85" letter-spacing="6">${Utils.esc(tag)}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  },
  trailerURL(m) {
    return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(`${m.title} official trailer`);
  },

  /* ---------- Ratings & reviews ---------- */
  reviews(id) {
    return (Store.get('mtb_reviews', {})[id]) || [];
  },
  userRating(id) {
    const list = this.reviews(id);
    if (!list.length) return { avg: 0, count: 0 };
    return { avg: list.reduce((s, r) => s + r.rating, 0) / list.length, count: list.length };
  },

  /* ---------- Wishlist (per signed-in user, or guest) ---------- */
  Wishlist: {
    key() {
      const u = Auth.current();
      return 'mtb_wish_' + (u ? u.email : 'guest');
    },
    list() {
      return Store.get(this.key(), []);
    },
    has(id) {
      return this.list().includes(id);
    },
    toggle(id) {
      const list = this.list();
      const on = !list.includes(id);
      Store.set(this.key(), on ? [...list, id] : list.filter(x => x !== id));
      document.querySelectorAll(`[data-action="wish"][data-id="${id}"]`).forEach(btn => {
        btn.classList.toggle('on', on);
        btn.setAttribute('aria-pressed', String(on));
        if (btn.dataset.label === 'full') btn.textContent = on ? '♥ In wishlist' : '♡ Add to wishlist';
      });
      toast(on ? 'Added to wishlist' : 'Removed from wishlist', 'success');
      return on;
    }
  },

  recommended() {
    const recent = Recent.list();
    const refs = [...new Set([...recent, ...this.Wishlist.list()])].map(id => this.get(id)).filter(Boolean);
    const genreCount = {};
    refs.forEach(m => m.genres.forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1; }));
    return this.all()
      .filter(m => m.status === 'now' && !recent.includes(m.id))
      .map(m => ({ m, s: m.genres.reduce((acc, g) => acc + (genreCount[g] || 0), 0) * 2 + m.score }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 6)
      .map(x => x.m);
  },

  /* ---------- Card & grid markup ---------- */
  cardHTML(m) {
    const inWish = this.Wishlist.has(m.id);
    return `<article class="movie-card">
      <a class="poster-link" href="#/movie/${m.id}">
        <img src="${this.posterURL(m)}" alt="${Utils.esc(m.title)} poster" loading="lazy">
        <span class="score-badge">★ ${m.score.toFixed(1)}</span>
        ${m.status === 'upcoming' ? '<span class="soon-badge">Coming soon</span>' : ''}
      </a>
      <button type="button" class="fav-btn ${inWish ? 'on' : ''}" data-action="wish" data-id="${m.id}" aria-pressed="${inWish}" aria-label="Save ${Utils.esc(m.title)} to wishlist">♥</button>
      <div class="card-body">
        <a href="#/movie/${m.id}" class="card-title">${Utils.esc(m.title)}</a>
        <p class="card-meta">${Utils.esc(m.genres.slice(0, 2).join(' · '))} · ${Utils.esc(m.language)}</p>
      </div>
    </article>`;
  },
  grid(list, emptyTitle = 'Nothing here yet') {
    if (!list.length) {
      return Layout.empty({ icon: '🎞️', title: emptyTitle, text: 'Check back soon for new titles.' });
    }
    return `<div class="movie-grid">${list.map(m => this.cardHTML(m)).join('')}</div>`;
  },
  hscroll(list) {
    if (!list.length) return '<p class="muted">Nothing to show yet.</p>';
    return `<div class="h-scroll">${list.map(m => `<div class="h-item">${this.cardHTML(m)}</div>`).join('')}</div>`;
  },

  /* ---------- Home ---------- */
  heroHTML(list) {
    if (!list.length) return '';
    return `<section class="hero" id="hero" aria-label="Featured movies">
      <div class="hero-track">
        ${list.map((m, i) => `
          <div class="hero-slide ${i === 0 ? 'active' : ''}">
            <img class="hero-bg" src="${this.posterURL(m, true)}" alt="">
            <div class="hero-shade"></div>
            <div class="container hero-content">
              <span class="eyebrow">${m.trending ? '🔥 Trending now' : 'Now showing'}</span>
              <h1>${Utils.esc(m.title)}</h1>
              <div class="meta-row">
                <span>★ ${m.score.toFixed(1)}</span>
                <span>${Utils.esc(m.genres.join(' · '))}</span>
                <span>${Utils.minutesToText(m.duration)}</span>
                <span>${Utils.esc(m.language)}</span>
              </div>
              <p>${Utils.esc(Utils.truncate(m.description, 170))}</p>
              <div class="cta-row">
                <a class="btn btn-primary btn-lg" href="#/book/${m.id}">Book tickets</a>
                <a class="btn btn-glass btn-lg" href="#/movie/${m.id}">More info</a>
              </div>
            </div>
          </div>`).join('')}
      </div>
      <button type="button" class="hero-nav prev" data-hero="-1" aria-label="Previous slide">‹</button>
      <button type="button" class="hero-nav next" data-hero="1" aria-label="Next slide">›</button>
      <div class="hero-dots">
        ${list.map((m, i) => `<button type="button" data-hero-to="${i}" class="${i === 0 ? 'active' : ''}" aria-label="Show slide ${i + 1}"></button>`).join('')}
      </div>
    </section>`;
  },
  startHero(root) {
    this.stopHero();
    const hero = root.querySelector('#hero');
    if (!hero) return;
    const slides = hero.querySelectorAll('.hero-slide');
    const dots = hero.querySelectorAll('.hero-dots button');
    let i = 0;
    const go = n => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('active', k === i));
      dots.forEach((d, k) => d.classList.toggle('active', k === i));
    };
    const restart = () => {
      clearInterval(this._heroTimer);
      this._heroTimer = setInterval(() => go(i + 1), 6000);
    };
    hero.addEventListener('click', e => {
      const nav = e.target.closest('[data-hero]');
      if (nav) { go(i + Number(nav.dataset.hero)); restart(); return; }
      const dot = e.target.closest('[data-hero-to]');
      if (dot) { go(Number(dot.dataset.heroTo)); restart(); }
    });
    restart();
  },
  stopHero() {
    clearInterval(this._heroTimer);
  },

  viewHome() {
    const all = this.all();
    const now = all.filter(m => m.status === 'now');
    const upcoming = all.filter(m => m.status === 'upcoming');
    const trending = all.filter(m => m.trending);
    const popular = [...now].sort((a, b) => b.score - a.score).slice(0, 8);
    const recommended = this.recommended();
    const recent = Recent.list().map(id => this.get(id)).filter(Boolean);
    const heroList = [...trending, ...now].filter((m, i, arr) => arr.indexOf(m) === i).slice(0, 5);
    const section = (title, link, body) => `
      <section class="home-section">
        <div class="section-head"><h2>${title}</h2>${link ? `<a href="${link}">View all →</a>` : ''}</div>
        ${body}
      </section>`;

    const html = `${this.heroHTML(heroList)}
      <div class="container">
        <section class="browse">
          <div class="browse-block">
            <h3>Categories</h3>
            <div class="chips">${this.genres().map(g => `<a class="chip" href="#/movies?genre=${encodeURIComponent(g)}">${Utils.esc(g)}</a>`).join('')}</div>
          </div>
          <div class="browse-block">
            <h3>Languages</h3>
            <div class="chips">${this.languages().map(l => `<a class="chip alt" href="#/movies?lang=${encodeURIComponent(l)}">${Utils.esc(l)}</a>`).join('')}</div>
          </div>
        </section>
        ${section('Now Showing', '#/movies?status=now', this.grid(now, 'No movies showing right now'))}
        ${section('Trending', '#/movies?category=trending', this.hscroll(trending))}
        ${section('Popular', '#/movies?category=popular', this.hscroll(popular))}
        ${section('Upcoming', '#/movies?status=upcoming', this.hscroll(upcoming))}
        ${section('Recommended for you', null, this.hscroll(recommended))}
        ${recent.length ? section('Recently viewed', null, this.hscroll(recent)) : ''}
      </div>`;
    return { html, title: 'Home', bind: root => this.startHero(root) };
  },

  /* ---------- Browse / search / filter ---------- */
  filterMovies(s) {
    return this.all().filter(m => {
      if (s.q && !m.title.toLowerCase().includes(s.q.toLowerCase())) return false;
      if (s.lang && m.language !== s.lang) return false;
      if (s.genre && !m.genres.includes(s.genre)) return false;
      if (s.rating && m.score < Number(s.rating)) return false;
      if (s.category === 'now' && m.status !== 'now') return false;
      if (s.category === 'upcoming' && m.status !== 'upcoming') return false;
      if (s.category === 'trending' && !m.trending) return false;
      if (s.category === 'popular' && m.score < 7.5) return false;
      return true;
    }).sort((a, b) => b.score - a.score);
  },

  viewList(query) {
    const state = {
      q: query.get('q') || '',
      lang: query.get('lang') || '',
      genre: query.get('genre') || '',
      rating: query.get('rating') || '',
      category: query.get('category') || ({ now: 'now', upcoming: 'upcoming' }[query.get('status')] || 'all')
    };
    const langOpts = this.languages().map(l => `<option value="${Utils.esc(l)}">${Utils.esc(l)}</option>`).join('');
    const genreOpts = this.genres().map(g => `<option value="${Utils.esc(g)}">${Utils.esc(g)}</option>`).join('');
    const html = `<div class="container page-pad">
      <div class="page-head">
        <h1>Browse movies</h1>
        <p class="muted" id="listCount"></p>
      </div>
      <form class="filter-bar" id="filterBar" novalidate>
        <input class="filter-input" name="q" type="search" placeholder="Search by title…" aria-label="Search by title">
        <select class="filter-input" name="category" aria-label="Category">
          <option value="all">All categories</option>
          <option value="now">Now showing</option>
          <option value="upcoming">Upcoming</option>
          <option value="trending">Trending</option>
          <option value="popular">Popular</option>
        </select>
        <select class="filter-input" name="lang" aria-label="Language"><option value="">All languages</option>${langOpts}</select>
        <select class="filter-input" name="genre" aria-label="Genre"><option value="">All genres</option>${genreOpts}</select>
        <select class="filter-input" name="rating" aria-label="Minimum rating">
          <option value="">Any rating</option>
          <option value="6">6.0 and up</option>
          <option value="7">7.0 and up</option>
          <option value="8">8.0 and up</option>
        </select>
        <button type="button" class="btn btn-ghost btn-sm" id="clearFilters">Reset</button>
      </form>
      <div id="listResults"></div>
    </div>`;

    const bind = root => {
      const form = root.querySelector('#filterBar');
      form.addEventListener('submit', e => e.preventDefault());
      form.q.value = state.q;
      form.category.value = state.category;
      form.lang.value = state.lang;
      form.genre.value = state.genre;
      form.rating.value = state.rating;

      const update = () => {
        const s = {
          q: form.q.value.trim(),
          category: form.category.value,
          lang: form.lang.value,
          genre: form.genre.value,
          rating: form.rating.value
        };
        const list = this.filterMovies(s);
        root.querySelector('#listCount').textContent = `${list.length} movie${list.length === 1 ? '' : 's'} found`;
        root.querySelector('#listResults').innerHTML = list.length
          ? `<div class="movie-grid">${list.map(m => this.cardHTML(m)).join('')}</div>`
          : Layout.empty({
              icon: '🔍',
              title: 'No movies match your filters',
              text: 'Try a different title, or clear the filters to see everything.',
              action: '<button type="button" class="btn btn-primary" data-clear>Clear filters</button>'
            });
        const params = new URLSearchParams(Object.entries(s).filter(([k, v]) => v && !(k === 'category' && v === 'all')));
        history.replaceState(null, '', '#/movies' + (params.toString() ? '?' + params.toString() : ''));
      };
      const reset = () => {
        form.q.value = '';
        form.category.value = 'all';
        form.lang.value = '';
        form.genre.value = '';
        form.rating.value = '';
        update();
      };
      form.addEventListener('input', update);
      form.addEventListener('change', update);
      root.querySelector('#clearFilters').addEventListener('click', reset);
      root.addEventListener('click', e => { if (e.target.closest('[data-clear]')) reset(); });
      update();
    };
    return { html, title: 'Browse movies', bind };
  },

  /* ---------- Movie details ---------- */
  viewDetails(id) {
    const m = this.get(id);
    if (!m) return { html: Layout.notFound(), title: 'Not found' };
    Recent.add(id);
    const city = City.current();
    const rating = this.userRating(id);
    const inWish = this.Wishlist.has(id);
    const crew = [['Director', m.director], ['Music', m.music], ['Writer', m.writer]]
      .filter(([, v]) => v)
      .map(([k, v]) => `<div><small>${k}</small><strong>${Utils.esc(v)}</strong></div>`).join('');
    const cast = m.cast.length
      ? m.cast.map(c => `<div class="person"><span class="avatar-lg">${Utils.esc(Utils.initials(c.name))}</span><div><strong>${Utils.esc(c.name)}</strong><small>${Utils.esc(c.role)}</small></div></div>`).join('')
      : '<p class="muted">Cast to be announced.</p>';
    const statusPill = m.status === 'now'
      ? '<span class="pill now">Now showing</span>'
      : `<span class="pill upcoming">Releases ${Utils.fmtDate(m.releaseDate)}</span>`;

    const html = `
      <section class="details-hero">
        <img class="details-backdrop" src="${this.posterURL(m, true)}" alt="">
        <div class="details-shade"></div>
        <div class="container details-grid">
          <img class="details-poster" src="${this.posterURL(m)}" alt="${Utils.esc(m.title)} poster">
          <div class="details-info">
            <div class="badges">
              <span class="cert">${Utils.esc(m.certificate)}</span>
              ${m.trending ? '<span class="pill hot">🔥 Trending</span>' : ''}
              ${statusPill}
            </div>
            <h1>${Utils.esc(m.title)}</h1>
            <div class="meta-row">
              <span>${Utils.minutesToText(m.duration)}</span>
              <span>${Utils.esc(m.language)}</span>
              <span>Released ${Utils.fmtDate(m.releaseDate)}</span>
            </div>
            <div class="rating-row">
              <span class="score">★ ${m.score.toFixed(1)}<small>/10</small></span>
              <span class="muted">${rating.count ? `Viewers ★ ${rating.avg.toFixed(1)}/5 · ${rating.count} review${rating.count > 1 ? 's' : ''}` : 'No viewer reviews yet'}</span>
            </div>
            <div class="chips">${m.genres.map(g => `<a class="chip" href="#/movies?genre=${encodeURIComponent(g)}">${Utils.esc(g)}</a>`).join('')}</div>
            <p class="desc">${Utils.esc(m.description)}</p>
            <div class="cta-row">
              ${m.status === 'upcoming' || !m.showtimes.length
                ? '<button type="button" class="btn btn-primary btn-lg" disabled>Bookings open soon</button>'
                : `<a class="btn btn-primary btn-lg" href="#/book/${m.id}">Book Tickets</a>`}
              <a class="btn btn-glass btn-lg" href="${this.trailerURL(m)}" target="_blank" rel="noopener noreferrer">▶ Trailer</a>
              <button type="button" class="btn btn-glass btn-lg ${inWish ? 'on' : ''}" data-action="wish" data-id="${m.id}" data-label="full" aria-pressed="${inWish}">${inWish ? '♥ In wishlist' : '♡ Add to wishlist'}</button>
            </div>
          </div>
        </div>
      </section>

      <div class="container details-body">
        <section class="panel">
          <h2>Cast &amp; crew</h2>
          <div class="crew-row">${crew}</div>
          <div class="cast-grid">${cast}</div>
        </section>

        <section class="panel">
          <div class="section-head">
            <h2>Showtimes in ${Utils.esc(city)}</h2>
            <a href="#/book/${m.id}">Open seat booking →</a>
          </div>
          ${ShowPicker.html(m, this.dates()[0], 'go', city)}
        </section>

        <section class="panel" id="reviewsPanel">${this.reviewsHTML(m)}</section>
      </div>`;
    return {
      html,
      title: m.title,
      bind: root => {
        ShowPicker.bind(root, m, 'go');
        this.bindReviews(root, m);
      }
    };
  },

  reviewsHTML(m) {
    const list = this.reviews(m.id);
    const user = Auth.current();
    const rating = this.userRating(m.id);
    const items = list.length
      ? list.slice().reverse().map(r => `
          <article class="review">
            <div class="review-head">
              <span class="avatar-sm">${Utils.esc(Utils.initials(r.user))}</span>
              <div><strong>${Utils.esc(r.user)}</strong><small>${new Date(r.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</small></div>
              <span class="stars" aria-label="${r.rating} out of 5">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
            </div>
            <p>${Utils.esc(r.text)}</p>
          </article>`).join('')
      : `<div class="empty-inline">No reviews yet. Be the first to review ${Utils.esc(m.title)}.</div>`;
    const form = user
      ? `<form id="reviewForm" class="review-form" novalidate>
           <div class="field">
             <label for="rvRating">Your rating</label>
             <select id="rvRating" name="rating">${[5, 4, 3, 2, 1].map(n => `<option value="${n}">${n} star${n > 1 ? 's' : ''}</option>`).join('')}</select>
           </div>
           <div class="field">
             <label for="rvText">Your review</label>
             <textarea id="rvText" name="text" rows="3" maxlength="400" placeholder="What did you think? (at least 10 characters)"></textarea>
             <p class="field-error" data-err="review"></p>
           </div>
           <button type="submit" class="btn btn-primary">Post review</button>
         </form>`
      : `<p class="muted">Please <a href="#/login?next=${encodeURIComponent('#/movie/' + m.id)}">log in</a> to write a review.</p>`;
    return `<div class="section-head">
        <h2>Reviews</h2>
        <span class="muted">${rating.count ? `★ ${rating.avg.toFixed(1)} / 5` : ''}</span>
      </div>
      <div class="reviews">${items}</div>
      ${form}`;
  },

  bindReviews(root, m) {
    const form = root.querySelector('#reviewForm');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const rating = Number(form.elements.rating.value);
      const text = form.elements.text.value.trim();
      if (text.length < 10) {
        showErrors(form, { review: 'Please write at least 10 characters.' });
        return;
      }
      const all = Store.get('mtb_reviews', {});
      all[m.id] = [...(all[m.id] || []), {
        id: Utils.uid('R'), user: Auth.current().name, rating, text, at: new Date().toISOString()
      }];
      Store.set('mtb_reviews', all);
      toast('Thanks for your review!', 'success');
      Router.render();
    });
  },

  /* ---------- Booking entry: choose cinema, date and showtime ---------- */
  viewBook(id, query) {
    const m = this.get(id);
    if (!m) return { html: Layout.notFound(), title: 'Not found' };
    const city = City.current();
    const dates = this.dates();
    const requested = query.get('date');
    const date = dates.includes(requested) ? requested : dates[0];
    const html = `<div class="container page-pad">
      ${Booking.stepper(0)}
      <div class="book-head panel">
        <img src="${this.posterURL(m)}" alt="">
        <div>
          <span class="eyebrow">Choose your show</span>
          <h1>${Utils.esc(m.title)}</h1>
          <p class="muted">${Utils.esc(m.language)} · ${Utils.minutesToText(m.duration)} · ${Utils.esc(m.certificate)}</p>
          <p class="muted">Showing in <strong>${Utils.esc(city)}</strong> ·
            <button type="button" class="link-btn" data-action="city">change city</button> ·
            <a href="#/movie/${m.id}">movie details</a></p>
        </div>
      </div>
      <section class="panel">${ShowPicker.html(m, date, 'select', city)}</section>
    </div>`;
    return { html, title: `Book · ${m.title}`, bind: root => ShowPicker.bind(root, m, 'select') };
  },

  /* ---------- Wishlist ---------- */
  viewWishlist() {
    const list = this.Wishlist.list().map(id => this.get(id)).filter(Boolean);
    const body = list.length
      ? this.grid(list)
      : Layout.empty({
          icon: '♡',
          title: 'Your wishlist is empty',
          text: 'Tap the heart on any movie to save it here.',
          action: '<a class="btn btn-primary" href="#/movies">Browse movies</a>'
        });
    return {
      html: `<div class="container page-pad">
        <div class="page-head"><h1>Wishlist</h1><p class="muted">${list.length} saved</p></div>
        ${body}
      </div>`,
      title: 'Wishlist'
    };
  }
};

/* ---------- Show picker: date tabs + cinemas + time chips ---------- */
const ShowPicker = {
  html(movie, date, mode, city) {
    const tabs = Movies.dates().map(d => `
      <button type="button" class="date-tab ${d === date ? 'active' : ''}" data-date="${d}">
        <small>${Utils.fmtDate(d, { weekday: 'short' })}</small>
        <strong>${d.slice(8)}</strong>
        <small>${Utils.fmtDate(d, { month: 'short' })}</small>
      </button>`).join('');
    const footer = mode === 'select'
      ? `<div class="picker-footer">
           <span class="muted" id="pickHint">Pick a showtime to continue</span>
           <button type="button" class="btn btn-primary" id="pickContinue" disabled>Continue to seats →</button>
         </div>`
      : '';
    return `<div class="show-picker" data-date="${date}">
      <div class="date-tabs" role="tablist">${tabs}</div>
      <div class="picker-body">${this.body(movie, date, city)}</div>
      ${footer}
    </div>`;
  },

  body(movie, date, city) {
    if (!movie.showtimes.length) {
      return '<div class="empty-inline">Bookings open once this movie is in cinemas.</div>';
    }
    const cinemas = Movies.cinemasInCity(city).filter(c => movie.showtimes.some(s => s.cinemaId === c.id));
    if (!cinemas.length) {
      return `<div class="empty-inline">${Utils.esc(movie.title)} isn't screening in ${Utils.esc(city)} right now. Try another city from the header.</div>`;
    }
    return cinemas.map(c => {
      const shows = movie.showtimes
        .filter(s => s.cinemaId === c.id)
        .sort((a, b) => a.time.localeCompare(b.time));
      return `<div class="cinema-row">
        <div class="cinema-info"><h4>${Utils.esc(c.name)}</h4><p class="muted">${Utils.esc(c.address)}</p></div>
        <div class="time-chips">${shows.map(st => this.chip(movie, c, date, st)).join('')}</div>
      </div>`;
    }).join('');
  },

  chip(movie, cinema, date, st) {
    const showId = Movies.makeShowId(movie.id, cinema.id, date, st.time);
    const past = Movies.isPast(date, st.time);
    const left = past ? 0 : Seats.available(showId);
    const unavailable = past || left === 0;
    const label = past ? 'Closed' : (left === 0 ? 'Sold out' : `${left} seats left`);
    return `<button type="button" class="time-chip ${unavailable ? 'disabled' : ''}" data-show="${showId}" ${unavailable ? 'disabled' : ''}>
      <strong>${st.time}</strong>
      <small>${Utils.esc(st.format)} · ${label}</small>
    </button>`;
  },

  bind(root, movie, mode) {
    const picker = root.querySelector('.show-picker');
    if (!picker) return;
    const city = City.current();
    const cta = picker.querySelector('#pickContinue');
    const hint = picker.querySelector('#pickHint');
    let selected = null;
    const refreshCta = () => {
      if (!cta) return;
      cta.disabled = !selected;
      if (hint) hint.textContent = selected ? 'Great! Now choose your seats.' : 'Pick a showtime to continue';
    };
    picker.addEventListener('click', e => {
      const tab = e.target.closest('.date-tab');
      if (tab) {
        const date = tab.dataset.date;
        picker.querySelectorAll('.date-tab').forEach(t => t.classList.toggle('active', t === tab));
        picker.querySelector('.picker-body').innerHTML = ShowPicker.body(movie, date, city);
        picker.dataset.date = date;
        selected = null;
        refreshCta();
        return;
      }
      const chip = e.target.closest('.time-chip');
      if (!chip || chip.disabled) return;
      if (mode === 'go') {
        navigate('#/seats/' + encodeURIComponent(chip.dataset.show));
        return;
      }
      picker.querySelectorAll('.time-chip.selected').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      selected = chip.dataset.show;
      refreshCta();
    });
    if (cta) {
      cta.addEventListener('click', () => {
        if (selected) navigate('#/seats/' + encodeURIComponent(selected));
      });
    }
  }
};
