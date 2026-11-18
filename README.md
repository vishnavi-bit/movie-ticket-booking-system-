# Movie Ticket Booking (frontend demo)

A frontend-only movie ticket booking website built with HTML, CSS and vanilla JavaScript. Data is stored in the browser's LocalStorage. Payments are simulated.

## Run the website

### Option 1: double-click `run.bat` (Windows, recommended)

1. Double-click `run.bat` in the project folder.
2. A CMD window opens and starts a local server at **http://localhost:8000/index.html**.
3. The website opens in Google Chrome, or in your default browser if Chrome is not installed.
4. Keep the CMD window open while you use the site. The window shows the server status and each request.
5. To stop the server, click the CMD window and press **Ctrl + C**, then type **Y** and press Enter.

`run.bat` uses Python (`python -m http.server`) if it is installed, or Node.js (`npx http-server`) otherwise. If neither is installed, it shows a message with download links.

### Option 2: start the server yourself

From the project folder, run one of these commands:

```
python -m http.server 8000
```

or, with Node.js:

```
npx --yes http-server -p 8000 -c-1
```

Then open **http://localhost:8000/index.html** in your browser. Stop the server with **Ctrl + C**.

### Option 3: open the file directly

You can also double-click `index.html` to open it without a server. Everything works, but a server is recommended.

Google Fonts are loaded from the network. The app still works offline with fallback fonts.

## Demo accounts

| Role  | Email             | Password   |
|-------|-------------------|------------|
| User  | demo@demo.com     | demo1234   |
| Admin | admin@demo.com    | admin123   |

Accounts are kept only in this browser. The password hashing is a simple demo hash, not secure authentication.

## Coupons

| Code     | Offer                                        |
|----------|----------------------------------------------|
| WELCOME10| 10% off, up to ₹200                          |
| FLAT100  | ₹100 off on ticket value of ₹500 or more     |
| MOVIE20  | 20% off, up to ₹150, on ticket value of ₹300+|

Pricing: Silver ₹150, Gold ₹250, Premium ₹400 per seat. Convenience fee ₹35 per ticket, plus 18% GST on the fee.

## Features

- Home: hero carousel, city selector, search, categories, languages, Now Showing, Upcoming, Popular, Trending, Recommended, Recently viewed, footer.
- Browse: search by title, filter by category, language, genre and minimum rating, with a friendly empty state.
- Movie details: poster, banner, genre, duration, language, release date, rating, cast and crew, trailer link, showtimes by date, reviews (login required to post), wishlist.
- Booking flow: city → cinema → date → showtime → seat selection (Silver/Gold/Premium, up to 10 seats) → customer details and coupon → simulated payment → ticket.
- Seat safety: booked seats cannot be selected, and a checkout re-checks occupancy so double booking is blocked.
- Payment (demo only): UPI, card (Luhn-checked number, expiry and CVV validation), net banking and wallet. Nothing is charged.
- Ticket: unique booking ID, digital ticket, PNG download, cancellation (allowed until 2 hours before showtime).
- Account: sign up, log in, log out, profile, My Bookings with upcoming, history and cancelled tabs.
- Extras: wishlist, recently viewed, reviews, dark/light theme, notifications, toasts, loading overlay, back-to-top, responsive mobile navigation.
- Admin dashboard (admin login): overview with demo revenue and bar chart, movie add/edit/delete, showtime add/remove, booking list with search and cancel, demo data reset.

## Project structure

```
movie-ticket-booking/
├── run.bat             Double-click to start the local server and open the site
├── index.html          App shell (header, footer, modal, toasts)
├── css/style.css       Theme tokens, layout, components, responsive rules
├── js/
│   ├── app.js          Storage wrapper, utilities, toasts, modal, layout, router, boot
│   ├── movies.js       Sample catalogue, generated posters, home/browse/details/wishlist, show picker
│   ├── seats.js        Seat layout, occupancy, seat selection screen
│   ├── booking.js      Pricing, coupons, checkout, simulated payment, tickets, My Bookings
│   ├── auth.js         Demo accounts, login, sign up, profile
│   └── admin.js        Admin dashboard and CRUD
└── assets/
    ├── icons/logo.svg
    └── images/hero-bg.svg
```

Posters are generated as SVG artwork from each title unless an image URL is set in the admin form.

## LocalStorage keys

`mtb_movies`, `mtb_bookings`, `mtb_users`, `mtb_session`, `mtb_pending` (in-progress order), `mtb_reviews`, `mtb_notifs`, `mtb_recent`, `mtb_wish_<email|guest>`, `mtb_theme`, `mtb_city`.

## Notes and limitations

- This is a demonstration. The local server only serves the files; there is no backend, no real payment, and no real security.
- Sample movies, cast and crew are fictional. The trailer button opens a YouTube search for the title.
- Guest bookings are linked to an account by the email entered at checkout, so they appear under My Bookings once that account is logged in.
- Each browser has its own data. Clearing site data resets everything.
