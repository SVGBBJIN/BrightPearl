# Bright Pearl Academy — Project Quickstart

## Overview
A single-file SPA (`index.html`) for a Chinese dance school. Built with Tailwind CSS Play CDN, Vanilla JS ES Modules, and Supabase as the backend. No build step — open the file in a browser or serve it statically.

**Live file:** `/Users/jeremy/Desktop/BrightPearl/index.html`
**Dev server:** Python3 HTTP server on port 3000 — copy file to `/tmp/bright-pearl-serve/` then use `preview_start "BrightPearl"`
**Launch config:** `/Users/jeremy/Desktop/BrightPearl/.claude/launch.json`

```bash
cp /Users/jeremy/Desktop/BrightPearl/index.html /tmp/bright-pearl-serve/index.html
# then use: preview_start "BrightPearl"  (port 3000)
```

---

## Supabase Project
| Key | Value |
|-----|-------|
| Project ID | `vsjlvkivsvrjplkscgrz` |
| Project name | BrightPearlBackend |
| URL | `https://vsjlvkivsvrjplkscgrz.supabase.co` |
| Anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzamx2a2l2c3ZyanBsa3NjZ3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTAyNzcsImV4cCI6MjA4Nzk4NjI3N30.x3M7efiCkyuJakCsytKxdZp7RnDGdtJDKQZzM5WdaUo` |
| Admin login | `admin@brightpearl.academy` / `admin` |

---

## Tech Stack
- **CSS framework:** Tailwind CSS Play CDN (no build) with `darkMode: 'media'`
- **Backend:** Supabase JS CDN (`@supabase/supabase-js` via jsDelivr ESM)
- **AI chat:** Groq API (`llama-3.3-70b-versatile`) — Pearl assistant widget
- **Fonts:** Playfair Display (display/headings), Inter (body)
- **No framework** — pure ES modules in a single `<script type="module">` block

---

## Theme / Design System

### Colors (CSS custom properties — auto dark-mode)
```css
/* Light mode */
--cream-rgb:           249 247 242;   /* #f9f7f2  warm cream background  */
--ink-rgb:             26  26  26;    /* #1a1a1a  near-black text         */
--imperial-rgb:        91  79  207;   /* #5b4fcf  blue-purple accent      */
--imperial-hover-rgb:  74  61  191;   /* #4a3dbf  hover state             */
--surface-rgb:         255 255 255;   /* white cards                      */

/* Dark mode (prefers-color-scheme: dark) */
--cream-rgb:           12  11  24;    /* #0c0b18  deep dark background    */
--ink-rgb:             232 228 245;   /* #e8e4f5  light lavender text     */
--imperial-rgb:        139 128 248;   /* #8b80f8  lighter purple          */
--imperial-hover-rgb:  160 151 252;   /* #a097fc  light hover             */
--surface-rgb:         28  25  52;    /* #1c1934  dark card surface       */
```

### Tailwind Color Tokens
```js
// Colors use rgb(var(--X-rgb) / <alpha-value>) so opacity modifiers work:
// bg-cream, bg-ink, bg-imperial, bg-surface
// bg-cream/90, text-ink/60, border-imperial/10, etc.
```

### Key CSS Classes
| Class | Purpose |
|-------|---------|
| `.view-hidden` | `display: none !important` — used for all show/hide |
| `.btn-imperial` | Filled blue-purple button |
| `.btn-outline` | Outlined blue-purple button |
| `.card-accent` | Left border + hover lift effect |
| `.admin-table` | Styled table with imperial header |
| `.drop-zone` | Dashed drag-and-drop upload area |
| `.lotus-bg` | Fixed geometric SVG background decoration |
| `.ink-divider` | Thin gradient horizontal rule |
| `.chat-panel` / `.chat-fab` | Pearl AI chat widget |

---

## Views / Pages
The SPA has **4 views** toggled by `showView(viewName)`. Each is a `<main>` with `.view-hidden`:

| ID | Nav trigger | Content |
|----|-------------|---------|
| `#home-view` | Home | Hero, Awards, Gallery |
| `#about-view` | About | About sections (from DB), PDF downloads |
| `#register-view` | Register | 2-step enrollment: details → payment |
| `#admin-view` | Admin | Login gate + full dashboard |

---

## Database Schema (Supabase / PostgreSQL)

### `awards`
```
id uuid PK | title text | year text | description text | created_at
```
RLS: public SELECT, authenticated ALL

### `classes`
```
id uuid PK | name text | schedule_time text | level text | description text | created_at
```
RLS: public SELECT, authenticated ALL. Referenced by `registrations.class_id`.

### `registrations`
```
id uuid PK | student_name text | parent_name text | email text | phone text
date_of_birth date | class_id uuid FK→classes | class_name text
experience_level text (none|beginner|intermediate|advanced)
notes text | status text (pending|awaiting_verification|confirmed|cancelled) | created_at
```
RLS: public INSERT, authenticated SELECT/UPDATE/DELETE

### `payment_settings`
```
id uuid PK | method_name text (Venmo|Zelle|Cash|Check) | handle text
instructions text | qr_code_url text | is_active boolean | created_at
```
RLS: public SELECT, authenticated ALL
**Seeded default:** Venmo / `BrightPearlAcademy`

### `about_sections`
```
id uuid PK | title text | body text | display_order int | created_at
```
RLS: public SELECT, authenticated ALL
**Seeded with 3 entries:** Our Mission, Our Teaching Philosophy, The Academy Today

### `pdfs`
```
id uuid PK | title text | description text | file_url text | file_name text
display_order int | created_at
```
RLS: public SELECT, authenticated ALL

### Storage Buckets
| Bucket | Public | Max size | MIME types |
|--------|--------|----------|------------|
| `gallery` | Yes | 5 MB | image/jpeg, png, webp, gif |
| `pdfs` | Yes | 20 MB | application/pdf |

---

## Registration Flow (2-Step)

1. **Step 1 — Details form** (`#reg-form`): student name, DOB, parent name, email, phone, class dropdown (fetched from `classes` table), experience level, notes
2. On submit → INSERT into `registrations` with `status: 'pending'`, returns row ID
3. Step indicator animates: circle 1 dims, circle 2 activates
4. **Step 2 — Payment** (`#reg-payment-step`): fetches active `payment_settings` row, renders:
   - Method icon + handle
   - Instructions text
   - Deep link button: `https://venmo.com/u/[handle]` (Venmo) or Zelle equivalent
   - QR code image if `qr_code_url` is set
5. "I Have Sent the Payment" → UPDATE `registrations.status` → `'awaiting_verification'`
6. **Success screen**: "You're All Set!"

---

## Admin Dashboard Sections (in order)

1. **Pending Registrations** — lists `status IN ('pending','awaiting_verification')` with amber badge count; Approve → `confirmed`, Deny → `cancelled`
2. **Payment Settings** — form to change method/handle/instructions/QR/active flag; loads from DB on login
3. **Awards** — add/delete awards shown on home page
4. **Classes** — add/delete classes (used in registration dropdown)
5. **About Page Sections** — add/delete content sections shown on About page
6. **PDF Downloads** — drag-and-drop PDF upload to Supabase storage; shown on About page
7. **Gallery Photos** — drag-and-drop image upload; shown in home gallery with lightbox
8. **Registrations** — full table with status dropdown (all statuses)

---

## Key JS Functions Reference

| Function | Purpose |
|----------|---------|
| `showView(view)` | Toggles views, triggers appropriate render calls |
| `submitRegistration(payload)` | INSERT into registrations, returns `id` |
| `updateRegStatus(id, status)` | UPDATE registration status |
| `fetchActivePaymentSetting()` | Gets `is_active=true` payment_settings row |
| `renderPaymentStep(regId)` | Builds payment UI and wires "sent" button |
| `renderAdminPendingRegistrations()` | Pending/awaiting table with Approve/Deny |
| `renderAdminPaymentSettings()` | Pre-fills payment settings form from DB |
| `uploadPhoto(file, caption)` | Uploads to `gallery` bucket, inserts DB row |
| `uploadPdfFile(file, title, desc, order)` | Uploads to `pdfs` bucket, inserts DB row |
| `renderHomeAbout()` | Renders about_sections on public About page |
| `renderAboutPdfs()` | Renders pdf download cards on About page |
| `esc(str)` | XSS-safe HTML escaping utility |

---

## Pearl AI Chat
- **Model:** `llama-3.3-70b-versatile` via Groq API
- **Key:** `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`
- Context auto-built from live `classes` + `awards` tables on first open
- Fixed bottom-right FAB; slide-up panel; quick-action buttons (Classes, Awards, Schedules, Site Tour)
- Site Tour highlights home sections with a pulsing animation

---

## File Backup
A backup exists at `/Users/jeremy/Desktop/BrightPearl/index.html.bak` from an earlier session.
