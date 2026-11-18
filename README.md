# Movie Ticket Booking · Movie Ticket Booking (frontend demo)

A frontend-only movie ticket booking website built with HTML, CSS and vanilla JavaScript. Data is stored in the browser's LocalStorage. Payments are simulated.

## Run it

No build step and no dependencies. Either:

- open `index.html` in a modern browser, or
- serve the folder, for example `npx serve .` or `python -m http.server`.

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

- This is a demonstration. There is no server, no real payment, and no real security.
- Sample movies, cast and crew are fictional. The trailer button opens a YouTube search for the title.
- Guest bookings are linked to an account by the email entered at checkout, so they appear under My Bookings once that account is logged in.
- Each browser has its own data. Clearing site data resets everything.
