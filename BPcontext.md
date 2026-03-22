# BrightPearl Academy — Project Context

> **AI Context Document** — Authoritative reference for working on this codebase.
> Keep this file up-to-date when making significant structural changes.

---

## 1. Project Identity

**BrightPearl Academy** is an all-in-one website + CMS for a Chinese cultural school offering classical dance, Mandarin language, STEM/coding, and music programs. The entire application lives in a single file: `index.html`. There is no build step, no package manager, and no framework — it is a static SPA deployable from any static host.

---

## 2. File Structure

```
/home/user/BrightPearl/
├── index.html          # Entire application (~6,344 lines)
├── BPcontext.md        # This file — AI project context
├── QUICKSTART.md       # Developer quickstart reference
├── README.md           # Minimal (just "# BrightPearl")
└── assets/
    └── Logo.png        # Academy logo (~21 KB)
```

**All HTML, CSS (Tailwind config + custom), and JavaScript live inside `index.html`.**

---

## 3. Tech Stack

| Concern | Technology | Notes |
|---------|-----------|-------|
| Frontend CSS | Tailwind CSS Play CDN | No build; `darkMode: 'media'` |
| Frontend JS | Vanilla ES Modules | Single `<script type="module">` block |
| Backend / DB | Supabase (PostgreSQL) | Hosted, BaaS |
| Auth | Supabase Auth | Email+password only |
| File Storage | Supabase Storage | Public buckets |
| AI Chat | Groq API | `llama-3.3-70b-versatile` |
| Drag-and-Drop | SortableJS v1.15.6 | CDN |
| Fonts | Google Fonts | Playfair Display + Inter |

---

## 4. Design System

### Color Tokens (CSS custom properties — auto-switch on `prefers-color-scheme`)

```css
/* Light mode */
--cream-rgb:          249 247 242;   /* #f9f7f2  warm cream background    */
--ink-rgb:            26  26  26;    /* #1a1a1a  near-black text           */
--imperial-rgb:       91  79  207;   /* #5b4fcf  blue-purple accent        */
--imperial-hover-rgb: 74  61  191;   /* #4a3dbf  hover state               */
--surface-rgb:        255 255 255;   /* #ffffff  white card surface        */

/* Dark mode */
--cream-rgb:          12  11  24;    /* #0c0b18  deep dark background      */
--ink-rgb:            232 228 245;   /* #e8e4f5  light lavender text       */
--imperial-rgb:       139 128 248;   /* #8b80f8  lighter purple            */
--imperial-hover-rgb: 160 151 252;   /* #a097fc  light hover               */
--surface-rgb:        28  25  52;    /* #1c1934  dark card surface         */
```

### Tailwind Color Tokens
Colors are wired via `rgb(var(--X-rgb) / <alpha-value>)` so opacity modifiers work:
`bg-cream`, `bg-ink`, `bg-imperial`, `bg-surface`, `text-ink/60`, `border-imperial/10`, etc.

### Key CSS Classes

| Class | Purpose |
|-------|---------|
| `.lotus-bg` | Fixed geometric lotus SVG background (8 petals) |
| `.hero-banner` | Large hero image with gradient overlay + shimmer underline |
| `.awards-strip-section` | Horizontally scrolling awards carousel |
| `.btn-imperial` | Filled blue-purple button with hover glow |
| `.btn-outline` | Outlined blue-purple button |
| `.card-accent` | Content card: left colored border + hover lift; 4-cycle color rotation |
| `.view-hidden` | `display: none !important` — all view toggling uses this class |
| `.ink-divider` | Gradient horizontal rule decoration |
| `.hero-glass` | Frosted glass overlay for hero text |
| `.chat-fab` / `.chat-panel` | Pearl AI chat widget (FAB + slide-up panel) |
| `.admin-table` | Data table with imperial-colored header |
| `.drop-zone` | Dashed drag-and-drop upload area |

---

## 5. Views / SPA Routing

Views are `<main>` elements toggled by `showView(viewName)` via the `.view-hidden` class.

| View ID | Nav Trigger | Auth Required | Content |
|---------|------------|:---:|---------|
| `#home-view` | Home | No | Hero banner, awards strip, gallery, featured about sections |
| `#about-view` | About | No | About sections (DB), PDF downloads |
| `#concert-view` | Concert | No | Concert/performance sections |
| `#faculty-view` | Faculty | No | Faculty directory with photos & bios |
| `#programs-view` | Programs | No | Programs: Elite Dance, Mandarin, STEM, etc. |
| `#gallery-page-view` | Gallery | No | Full-page gallery with lightbox |
| `#register-view` | Register | No | 2-step enrollment: details → payment |
| `#tos-view` | Terms | No | Terms of Service / Policies |
| `#admin-view` | Admin | **YES** | Full CMS dashboard (login gate) |

---

## 6. Database Schema (Supabase / PostgreSQL)

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
id uuid PK
student_name text | parent_name text | email text | phone text
date_of_birth date
class_id uuid FK→classes | class_name text
experience_level text  -- none | beginner | intermediate | advanced
notes text
status text            -- pending | awaiting_verification | confirmed | cancelled
created_at
```
RLS: public INSERT, authenticated SELECT/UPDATE/DELETE

### `payment_settings`
```
id uuid PK | method_name text (Venmo|Zelle|Cash|Check) | handle text
instructions text | qr_code_url text | is_active boolean | created_at
```
RLS: public SELECT, authenticated ALL.
Default seed: Venmo / `BrightPearlAcademy`

### `about_sections`
```
id uuid PK | title text | body text | display_order int | created_at
```
RLS: public SELECT, authenticated ALL.
Seeds: "Our Mission", "Our Teaching Philosophy", "The Academy Today"

### `pdfs`
```
id uuid PK | title text | description text | file_url text | file_name text
display_order int | created_at
```
RLS: public SELECT, authenticated ALL

### `site_settings` (key-value JSON store)
```
id uuid PK | key text UNIQUE | value jsonb
```
RLS: public SELECT, authenticated ALL.

**Known keys and their shapes:**

| Key | Value Shape | Used By |
|-----|-------------|---------|
| `hero_image` | `{ url: string }` | Home hero banner |
| `faculty_data` | `{ faculty: [{ name, bio, photo_url, category }] }` | Faculty page |
| `programs_data` | `{ programs: [{ title, description, image_url, details }] }` | Programs page |
| `concert_data` | `{ sections: [{ title, body, display_order }] }` | Concert page |
| `tos_data` | `{ sections: [{ title, body, display_order }] }` | Terms page |
| `contact_info` | `{ email, phone, address, hours }` | Contact section |
| `faq_data` | `{ faqs: [{ question, answer }] }` | FAQ section |

`fetchSetting(key)` / `saveSetting(key, value)` are the generic helpers for this table.

### Storage Buckets

| Bucket | Public | Max Size | MIME Types |
|--------|:------:|----------|------------|
| `gallery` | Yes | 5 MB | image/jpeg, png, webp, gif |
| `pdfs` | Yes | 20 MB | application/pdf |

---

## 7. Authentication & Session

- **Provider:** Supabase Auth (email + password)
- **Admin credential:** `admin@brightpearl.academy` / `admin`
- **Startup:** `supabase.auth.getSession()` called on page load; result stored in `session`
- **Lifecycle:** `supabase.auth.onAuthStateChange()` monitors changes throughout session
- **Guard:** Admin view checks `session !== null`; redirects to login form if null
- **Logout:** Calls `supabase.auth.signOut()`, resets `session = null`, navigates to home

---

## 8. Registration Flow (2-Step)

1. **Step 1 — Details** (`#reg-form`):
   - Fields: student name, DOB, parent name, email, phone, class (dropdown from `classes`), experience level, notes
   - Submit → INSERT into `registrations` with `status: 'pending'`; stores returned `id`
   - Step indicator: circle 1 dims, circle 2 activates

2. **Step 2 — Payment** (`#reg-payment-step`):
   - Fetches active `payment_settings` row (`is_active = true`)
   - Renders: method icon, handle, instructions, deep-link button, QR code (if set)
   - "I Have Sent the Payment" → UPDATE `status` → `'awaiting_verification'`

3. **Success screen:** "You're All Set!" confirmation

---

## 9. Admin Dashboard Sections (order as rendered)

| # | Section | Data Source | Actions |
|---|---------|-------------|---------|
| 1 | Pending Registrations | `registrations` (status: pending/awaiting) | Approve → confirmed, Deny → cancelled |
| 2 | Payment Settings | `payment_settings` | Edit method/handle/instructions/QR/active |
| 3 | Hero Banner Image | `site_settings.hero_image` | Upload image |
| 4 | Awards | `awards` table | Add / Edit / Delete |
| 5 | Classes | `classes` table | Add / Edit / Delete |
| 6 | About Page Sections | `about_sections` table | Add / Edit / Delete / Drag-reorder |
| 7 | PDF Downloads | `pdfs` table + `pdfs` bucket | Drag-and-drop upload, Delete |
| 8 | Gallery Photos | `gallery` table + `gallery` bucket | Drag-and-drop upload, Delete |
| 9 | All Registrations | `registrations` table | Full table, status dropdown |
| 10 | Faculty | `site_settings.faculty_data` | Add / Edit / Delete (photo upload) |
| 11 | Programs | `site_settings.programs_data` | Add / Edit / Delete |
| 12 | Concert | `site_settings.concert_data` | Add / Edit / Delete / Drag-reorder |
| 13 | Terms of Service | `site_settings.tos_data` | Add / Edit / Delete / Drag-reorder |
| 14 | Contact Info | `site_settings.contact_info` | Edit form fields |
| 15 | FAQ | `site_settings.faq_data` | Add / Edit / Delete |

---

## 10. Visual Edit Mode

- **Toggle:** `toggleEditMode()` — admin-only button in top-right corner
- **Visibility:** Edit controls (drag handles, inline add/delete buttons) only render when `editMode === true`
- **Drag-reorder:** SortableJS instances per page:
  - About sections → `reorderAboutSections()`
  - Concert sections → `reorderConcertSections()`
  - Gallery items → `reorderGallery()`
  - TOS sections → `reorderTosSections()`
  - Programs → `reorderPrograms()`
- **Auto-save:** Reorder callbacks persist updated `display_order` to DB immediately

---

## 11. Pearl AI Chat Assistant

- **Widget:** Fixed bottom-right FAB (`.chat-fab`); click opens `.chat-panel` (slide-up)
- **Model:** `llama-3.3-70b-versatile` via Groq API
- **Context Building:** On first open, fetches live `classes` + `awards` rows and injects into system prompt
- **Quick Actions:** Classes, Awards, Schedules, Site Tour
- **Site Tour:** `tourActive = true`; sequentially highlights home sections with pulsing animation
- **State:** `chatHistory[]` maintained for session duration; `isSending` guards duplicate sends
- **Typing indicator:** Three-dot bounce animation while awaiting Groq response

---

## 12. Key JavaScript Functions

### View Management
| Function | Purpose |
|----------|---------|
| `showView(view, subview?)` | Toggles views; fires appropriate render calls |
| `toggleEditMode()` | Toggles `editMode` flag; shows/hides edit controls |

### Data Access
| Function | Purpose |
|----------|---------|
| `fetchSetting(key)` | Generic `site_settings` GET by key → parsed JSON value |
| `saveSetting(key, value)` | Generic `site_settings` UPSERT |
| `fetchAwards()` | SELECT all awards ordered by `year DESC` |
| `fetchClasses()` | SELECT all classes |
| `fetchGallery()` | SELECT all gallery rows |
| `fetchAboutSections()` | SELECT about_sections ordered by `display_order` |
| `fetchFaculty()` | `fetchSetting('faculty_data')` → faculty array |
| `fetchPrograms()` | `fetchSetting('programs_data')` → programs array |
| `fetchConcertSections()` | `fetchSetting('concert_data')` → sections array |

### Mutations
| Function | Purpose |
|----------|---------|
| `submitRegistration(payload)` | INSERT registration; returns `id` |
| `updateRegStatus(id, status)` | UPDATE registration status |
| `addAward()` / `deleteAward(id)` / `updateAward(id)` | CRUD awards |
| `addClass()` / `deleteClass(id)` / `updateClass(id)` | CRUD classes |
| `addAboutSection()` / `deleteAboutSection(id)` / `updateAboutSection(id)` | CRUD about sections |

### Rendering
| Function | Purpose |
|----------|---------|
| `renderHomeAwards()` | Awards strip on home page |
| `renderHomeGallery()` | Gallery thumbnails on home page |
| `renderHomeAbout()` | About preview blocks on home page |
| `renderAboutPdfs()` | PDF download cards on About page |
| `renderFacultyPage()` | Faculty directory |
| `renderConcertPage()` | Concert/performance sections |
| `renderProgramPage()` | Programs grid |
| `renderAdminPendingRegistrations()` | Pending reg table with Approve/Deny |
| `renderAdminPaymentSettings()` | Payment settings form pre-filled from DB |

### Uploads & Storage
| Function | Purpose |
|----------|---------|
| `uploadImageToStorage(file)` | Upload to `gallery` bucket; returns public URL |
| `uploadPdfFile(file, title, desc)` | Upload to `pdfs` bucket; inserts DB row |
| `saveHeroSetting(imageUrl)` | `saveSetting('hero_image', { url })` |

### Utilities
| Function | Purpose |
|----------|---------|
| `esc(str)` | XSS-safe HTML escaping (escapes `&`, `<`, `>`, `"`, `'`) |
| `inferFacultyCategory(text)` | Auto-categorize faculty from bio text: Dance / Mandarin / STEM / Music |

---

## 13. Global State Variables

```js
let currentView = 'home';      // Active view name
let currentProgram = null;     // Selected program (programs sub-view)
let session = null;            // Supabase Auth session object (null = logged out)
let chatOpen = false;          // Pearl chat panel open state
let chatHistory = [];          // Chat message history [{role, content}]
let editMode = false;          // Visual edit mode toggle
let isSending = false;         // Guard flag for Groq API calls
let tourActive = false;        // Site tour animation state
```

---

## 14. Credentials & Configuration

| Item | Value |
|------|-------|
| Supabase Project ID | `vsjlvkivsvrjplkscgrz` |
| Supabase URL | `https://vsjlvkivsvrjplkscgrz.supabase.co` |
| Supabase Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzamx2a2l2c3ZyanBsa3NjZ3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTAyNzcsImV4cCI6MjA4Nzk4NjI3N30.x3M7efiCkyuJakCsytKxdZp7RnDGdtJDKQZzM5WdaUo` |
| Groq API Key | `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` |
| Admin Login | `admin@brightpearl.academy` / `admin` |
| Groq Model | `llama-3.3-70b-versatile` |

> These credentials are embedded in `index.html`. The Supabase anon key is intentionally public (Row Level Security enforces access control). The Groq key is client-side; rotate if exposed.

---

## 15. Deployment

- **No build step.** `index.html` can be opened directly in a browser or served from any static host (Vercel, Netlify, GitHub Pages, etc.).
- **Dev server:** Python 3 HTTP server on port 3000
  ```bash
  cp /path/to/index.html /tmp/bright-pearl-serve/index.html
  # then: preview_start "BrightPearl"  (port 3000)
  ```
- **Git remote:** `http://local_proxy@127.0.0.1:35829/git/SVGBBJIN/BrightPearl`
- **Main branch:** `main`

---

## 16. Working Notes

- **Single-file constraint:** All changes go into `index.html`. Keep CSS in the `<style>` block, JS in the `<script type="module">` block.
- **No imports from disk.** All dependencies load from CDN (Tailwind Play CDN, jsDelivr for Supabase, SortableJS CDN).
- **XSS safety:** Always use `esc()` when inserting user-supplied strings into `innerHTML`.
- **RLS:** Unauthenticated users can SELECT public data and INSERT registrations. All mutations require `session !== null`.
- **Dark mode:** Use CSS custom properties (`--X-rgb`) and Tailwind tokens (`bg-cream`, `text-ink`) — never hardcode hex colors in new UI.
- **Edit mode guard:** Wrap all inline CMS controls in `${editMode ? '...' : ''}` template literal checks.
