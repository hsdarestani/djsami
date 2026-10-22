# DJ SAMI — Official one-page website

Fast, bilingual (English/German), mobile-first artist landing page and booking enquiries for **Cloudflare Pages**. No frontend framework. Two lightweight npm font packages are bundled into the static build and served from this site.

## Live features

- Editorial single-page website, responsive hero and artist portrait
- Spotify, YouTube, Instagram and SoundCloud links from the artist's public profile
- Click-to-load YouTube video to avoid loading the player before the visitor asks for it
- Booking enquiry form (not instant confirmation) with client/server validation, honeypot and per-IP / per-email limits
- Cloudflare Pages Function stores bookings in D1
- Private \`/admin/\` page for enquiry status (new, contacted, confirmed, declined), email action and CSV export
- Optional Resend email alerts; no keys or user details committed

## 1. Deploy site to Cloudflare Pages

1. Open Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Authorize GitHub and select \`hsdarestani/djsami\`; use the \`main\` branch.
3. Framework preset: **None**.
4. Build command: \`npm run build\`
5. Build output directory: \`dist\`
6. Deploy. The site will have a \`*.pages.dev\` URL. The static frontend works as soon as the Pages deployment succeeds, while booking submissions return "not configured" until Step 2 is complete.

The \`functions/\` folder must remain at the repository root; it is deployed automatically as Cloudflare Pages Functions, not copied into \`dist\`.

## 2. Activate the booking backend

1. Cloudflare Dashboard → Workers & Pages → D1 → Create database, e.g. \`djsami-bookings\`.
2. In that database's Console, execute the statements in \`migrations/0001_bookings.sql\` once.
3. Open your Pages project → Settings → Bindings / Functions → D1 database bindings. Create a binding named **\`DB\`** for the database you created. Configure production and preview environments as needed.
4. In your Pages environment variables or secrets, add **\`ADMIN_TOKEN\`**: a generated, random string of at least 24 characters (32+ recommended). **Never commit it**. Set \`RATE_LIMIT_SALT\` to another random secret if desired.
5. Redeploy the Pages project after changing bindings or environment variables.
6. Open \`/admin/\` and enter the admin token to review booking enquiries.

The function validates and stores each request first. It never promises that a booking is confirmed.

## 3. Optional email notification

If DJ Sami wants a notification for every new request, configure these encrypted secrets (after verifying the sender domain with Resend):

- \`RESEND_API_KEY\`: Resend API key
- \`BOOKING_FROM_EMAIL\`: verified sender email
- \`BOOKING_NOTIFICATION_EMAIL\`: destination inbox

All three are required for an email alert. The booking remains stored in D1 even if sending an email fails.

## 4. Required before making the site public

- Complete \`imprint.html\` and \`privacy.html\` with the actual operator's legal name, contact email, postal address, relevant business details and accurately identified processors. They deliberately contain publication warnings, not invented identities.
- Obtain the artist's permission to reuse their SoundCloud profile portrait and verify the Instagram/YouTube/Spotify links.
- Define and operationalize a deletion procedure for old enquiries. The function opportunistically purges records older than 120 days when it receives a new valid enquiry, but this **is not a guaranteed periodic purge**.
- Confirm who will receive booking enquiries, and set up email alerts if the admin dashboard alone is insufficient.
- Optional: attach a custom domain to the Pages project.

## Typography

- Display and brand font: **Syne Variable** (weights up to 800), bold and editorial.
- Body text and form font: **Manrope Variable**, readable on German desktop and mobile layouts.
- Both fonts are installed from `@fontsource-variable` version 5.3.0 under the OFL-1.1 license and copied to `dist/fonts/` at build time. Fonts are served from the same Cloudflare Pages domain; no Google Fonts CDN calls are needed.
- Hero copy remains separate from portrait media. Automated Chromium checks verify font loading and layout at 11 viewport widths from 320px to 1920px.

## Local development

\`\`\`sh
npm install
npm run check
npm run build
npx wrangler pages dev dist --d1 DB=djsami-bookings
\`\`\`

D1 must already exist for local binding and migrations should be applied. To view the static site without backend, open \`dist/index.html\` in a local web server.

## Tech notes

- Plain HTML, CSS, and JavaScript. No trackers or third-party frontend packages.
- Pages Functions route: \`/api/bookings\` (POST public; GET and PATCH require admin bearer token).
- Binding name is **DB**, not DATABASE.
- The \`/admin/\` HTML is publicly downloadable, but records and mutation endpoints are always protected by the server-side admin token.
- CSV exports contain personal data; handle them securely.
- Photo source currently points to the artist's SoundCloud avatar CDN; replace with an authorized, self-hosted high-resolution photo for production.
