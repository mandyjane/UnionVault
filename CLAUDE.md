# UnionVault — standing facts for every Claude Code session

Read the latest `docs/sessions/HANDOFF_SESSION*.md` and `docs/CLAUDE_CODE_CONTEXT.md` for full context. The facts below are settled — do not ask the user about them again.

## Supabase (project `hzafdlfprtzfxtyaebmc`, ap-southeast-2)

- **`RESEND_API_KEY` edge function secret is SET** (since 24 Oct 2026, SHA256 digest starts `45658b6c3e93…`). Never ask the user for the Resend key. Never write its value into this repo — the repo is public.
- **`unionvault.app` is verified in Resend** (DNS done). Edge functions (source in `supabase/functions/`, all deployed):
  - `send-appointment-email` — from `<couple names> <appointments@unionvault.app>`, reply-to the couple, signed-in users only.
  - `send-guest-email` — save-the-dates/invites from `<couple names> <invites@unionvault.app>`, optional invitation attachment (own `photos` folder only), signed-in users only.
  - `rsvp-notify` — RSVP alerts to the couple (service role; called by public RSVP form, no sign-in).
  - All three send a branded HTML version (logo header, `assets/email-logo-black.png` / `-white.png`) built server-side from escaped plain text — never accept raw HTML from the client.
- **Public pages read via RPCs**: `public_wedding_extras(uid)` (guest names/groupings, meal settings, wishing well minus contributions) and `vendor_brief(token)`. Raw `guests`/`settings`/`families`/`wishingwell` rows must never be readable by `anon`.
- **Storage `photos` SELECT RLS policy EXISTS** ("Users can read own photos", plus "Users manage own photos …" SELECT/INSERT/UPDATE/DELETE). Parked item P2 is done.

## Conventions (short form)

- No build step, no bundler. `index.html` is the app shell; CSS in `css/`, JS in `js/`, loaded via `<script>` tags. Branch `main` only; `git push -u origin main`.
- Bump `APP_BUILD` in `js/autocomplete.js` and `CACHE` in `sw.js` together on every app deploy. Add new JS/CSS files to the `SHELL` array in `sw.js`.
- Visual changes: light + dark preview first, wait for Accept / Reject / Adjust.

## Repo layout

- Root: only what the live site / Supabase needs (`index.html`, `maintenance.html` (offline template for future use), `sw.js`, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, `CNAME`, `.nojekyll`, `og-image.png`, `assets/`, `css/`, `js/`, `icons/`, `logos/`, `supabase/`). Keep it that way.
- `docs/` — reference docs (`CLAUDE_CODE_CONTEXT.md`, changelog, decisions).
- `docs/sessions/` — per-session handoffs and new-session prompts. New handoffs go here, not at the root.
- `scripts/` — helper scripts.
