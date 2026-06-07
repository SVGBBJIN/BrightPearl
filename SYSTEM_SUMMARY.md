# BrightPearl — System Summary

## Overview

BrightPearl is a **single-file static SPA** for an academy site. All UI lives in `index.html` (~9.3k lines). There is **no custom backend server, no build step, and no package.json**. All "backend" responsibilities are delegated to **Supabase** (PostgreSQL DB, Auth, Storage), accessed directly from the browser via the Supabase JS SDK loaded from a CDN.

## Architecture at a Glance

| Layer | Technology | Where |
|---|---|---|
| UI | Vanilla JS + Tailwind CDN | `index.html` |
| State | Global vars + Supabase session | `index.html` |
| Routing | Hash-less view toggling (`showView()`) | `index.html` |
| Drag/Drop | SortableJS (CDN) | `index.html` |
| Database | Supabase Postgres | hosted |
| Auth | Supabase Auth (email+password) | hosted |
| File storage | Supabase Storage buckets (`gallery/`, `pdfs/`) | hosted |
| Authorization | Supabase Row-Level Security | hosted |

**Supabase credentials are embedded in `index.html` (~line 4026):**
- URL: `https://vsjlvkivsvrjplkscgrz.supabase.co`
- Anon key: embedded (public by design; RLS enforces access)

**Admin account:** `admin@brightpearl.academy` (hardcoded email check gates admin UI).

## File Layout

```
BrightPearl/
├── index.html          # entire app
├── BPcontext.md        # AI project context
├── QUICKSTART.md
├── ADMIN_GUIDE.md
├── README.md
└── assets/Logo.png
```

---

## Back-End Features (what the backend does today)

Everything below is provided by **Supabase only** — there is no Node/Python/Go server. Each item lists the purpose and what makes it "back-end" (i.e., why a pure-frontend app couldn't trivially replicate it).

### 1. PostgreSQL Database (8 tables + 1 KV store)

Purpose: persist all dynamic content and registrations across users/devices.

| Table | Purpose |
|---|---|
| `awards` | Achievement/award records shown on About page |
| `classes` | Programs/classes available for registration |
| `registrations` | Student enrollment submissions + status lifecycle (`pending → awaiting_verification → confirmed/cancelled`) |
| `gallery` | Gallery photo metadata (URL + caption) |
| `about_sections` | Ordered content blocks on About page |
| `pdfs` | PDF resource metadata (title + storage URL + order) |
| `payment_settings` | Active payment methods (Venmo handle, QR code, instructions) |
| `site_settings` | Generic `key → jsonb value` store for: `hero_image`, `hero_content`, `faculty_data`, `programs_data`, `concert_data`, `tos_data`, `contact_info`, `faq_data`, `testimonials_data`, `values_data` |

CRUD is called directly from the browser using `supabase.from('<table>').select/insert/update/delete()`.

**Why this is "backend":** durable cross-session storage, shared state between admin and every visitor. A frontend-only replacement needs a hosted DB, a Git-based CMS, or static JSON files committed at build time.

### 2. Authentication (Supabase Auth)

Purpose: gate admin functionality (CMS, registration approvals, edit mode).

- Email + password login via `signInWithPassword`
- Session restored on load via `getSession` + `onAuthStateChange`
- Custom 4-hour expiry check using `localStorage.bp_session_start`
- Admin status decided by client-side email comparison (`session.user.email === 'admin@brightpearl.academy'`)

**Why this is "backend":** identity has to be issued and validated somewhere trusted. Pure frontend cannot generate or verify tokens.

### 3. File Storage (Supabase Storage buckets)

Purpose: host user-uploaded binaries.

- `gallery/` bucket — JPG/PNG, ≤5 MB, public read
- `pdfs/` bucket — PDFs, ≤20 MB, public read
- Hero image and faculty photos also uploaded here, referenced from `site_settings`

Operations: `storage.from(bucket).upload()`, `getPublicUrl()`, `remove()`.

**Why this is "backend":** browsers cannot host arbitrary files; needs object storage + CDN.

### 4. Row-Level Security (Supabase RLS policies)

Purpose: enforce who can read/write what, because the anon key is in plaintext in the HTML.

Typical policies:
- Public `SELECT` on content tables (`awards`, `classes`, `about_sections`, `pdfs`, `gallery`, `payment_settings`, `site_settings`)
- Public `INSERT` on `registrations` (anyone can submit)
- Authenticated `INSERT/UPDATE/DELETE` on everything else

**Why this is "backend":** the only thing stopping any visitor from deleting all data is a server-side rule. This is the hardest piece to remove.

### 5. Registration intake & moderation workflow

Purpose: visitors submit an enrollment form; admin approves/rejects in the dashboard.

- Public form → `registrations.insert(status='pending')`
- Admin UI lists pending rows, mutates `status`
- No email notifications, no payment processing — payment is manual via QR/Venmo

**Why this is "backend":** the submission must survive page reloads and be visible to a different user (the admin).

### 6. Inline CMS / Edit Mode

Purpose: admin clicks "Edit mode," edits content in-page (contentEditable + drag handles), and saves. Each save is a Supabase `update`/`insert`/`reorder` against the relevant table or `site_settings` key.

**Why this is "backend":** changes are visible to everyone, not just the editing browser.

### What the backend does NOT do today

None of these exist and none need replacing:
- Cron jobs / background workers
- Webhooks / outbound integrations
- Email sending (other than Supabase's auth emails)
- Server-side rendering
- Custom API routes / Edge Functions
- Rate limiting
- Payment processing

---

## Migration Implications (backend → no backend)

Use this as the brief for the migration branch.

### Easy to drop (already 100% client-side)
- View switching, template rendering, edit-mode UX, drag-and-drop reordering, all forms' DOM behavior.

### Must be replaced or removed

| Capability | Hardness | Options |
|---|---|---|
| Persistent content (8 tables + KV) | Medium | (a) Bake content into a JSON file committed to repo; (b) Git-based CMS (Decap/TinaCMS) that commits to repo; (c) swap Supabase for Firebase/Appwrite (still a backend, just different) |
| Admin auth | Medium | (a) Drop admin UI entirely — edit by committing JSON; (b) Netlify/Cloudflare Access in front of an `/admin` route; (c) Clerk/Auth0 (still a backend) |
| File uploads (gallery, PDFs, hero, faculty photos) | Medium | (a) Commit assets to `assets/` in the repo; (b) Cloudinary/Uploadcare direct-upload widget; (c) GitHub API uploads from admin UI |
| Registration intake | Hard (truly needs a receiver) | (a) Netlify Forms / Formspree / Basin; (b) Google Forms embed; (c) `mailto:` link (lossy) |
| Authorization (RLS) | Hard | Vanishes if writes go through Git/PRs instead of an open DB |

### Recommended target architecture for a "no-backend" branch

1. **Convert dynamic content to static JSON** committed under `content/` (one file per current table or `site_settings` key).
2. **Replace runtime Supabase reads** with `fetch('/content/<name>.json')` (or inline at build).
3. **Replace admin CMS** with a Git-based CMS (Decap CMS / TinaCMS) — admin logs in via GitHub OAuth, edits commit to the repo, static host redeploys.
4. **Replace uploads** with the CMS's media handling (commits files into `assets/`) or Cloudinary.
5. **Replace registration form** with Netlify Forms or Formspree (single 3rd-party form endpoint, no DB).
6. **Delete** all Supabase SDK calls, auth code, RLS dependence, and embedded keys.

End state: a static folder deployable to Netlify / Cloudflare Pages / GitHub Pages with one form-handler integration and one Git-CMS integration — no servers, no databases, no RLS to maintain.
