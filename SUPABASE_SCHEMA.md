# Supabase Schema Reference (Archived)

> **Status: DISCONNECTED.** As of this document, `index.html` / `assets/js/state.js`
> no longer initializes a live Supabase client — see [`Disconnection notes`](#disconnection-notes)
> at the bottom. This file is a historical record of every table, column, storage
> bucket, and settings key the app used to read/write in the `BrightPearlBackend`
> Supabase project (ref `vsjlvkivsvrjplkscgrz`), reverse-engineered from the
> application code (`assets/js/*.js`, `index.html`) since the project itself was
> `INACTIVE`/paused and not reachable to introspect live at doc time.
>
> If you restore the Supabase project later, this document is the spec to
> recreate the schema from, or to diff against the real thing.

---

## 1. Connection (as it was)

```js
// assets/js/state.js
const SUPABASE_URL      = 'https://vsjlvkivsvrjplkscgrz.supabase.co';
const SUPABASE_ANON_KEY = '<anon JWT>';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

- Client library: `@supabase/supabase-js` loaded via `esm.sh`/`jsdelivr` CDN (no bundler).
- Used for: **Postgres tables** (`supabase.from(...)`), **Storage** (`supabase.storage.from(...)`), and **Auth** (`supabase.auth.*`).

---

## 2. Auth

| Aspect | Detail |
|---|---|
| Provider | Supabase email/password auth only (no OAuth) |
| Sign up | `supabase.auth.signUp({ email, password })` — public self-serve, used by parents |
| Sign in | `supabase.auth.signInWithPassword({ email, password })` |
| Sign out | `supabase.auth.signOut()` |
| Session restore | `supabase.auth.getSession()` on load + `onAuthStateChange` listener |
| Session expiry | Client-side only: `localStorage['bp_session_start']`, force sign-out after 4 hours |
| Role model | No `roles`/`profiles` table. A single hardcoded admin email constant (`ADMIN_EMAIL = 'admin@brightpearl.academy'`) distinguishes the admin account from any other authenticated user, who is treated as a "parent" and routed to the Parent Portal. **Anyone who signs up gets a parent account**; admin-ness is just "does your email match the constant." |

---

## 3. Postgres Tables (`public` schema)

### 3.1 `awards`
Displayed on the Home/About pages as an awards strip; managed in Admin.

| Column | Type (inferred) | Notes |
|---|---|---|
| `id` | uuid/serial (PK) | auto, used in `.eq('id', id)` |
| `title` | text | required |
| `year` | text (or int, but treated as free text, max 4 chars in the UI) | optional |
| `description` | text | optional |
| `created_at` | timestamptz | default now(); sort key (`order('created_at', desc)`) |

Access pattern: `select('*')`, `insert({title, year, description})`, `update(fields)`, `delete()`.

### 3.2 `classes`
The list of enrollable classes; feeds the registration form's class dropdown.

| Column | Type (inferred) | Notes |
|---|---|---|
| `id` | uuid/serial (PK) | referenced by `registrations.class_id` |
| `name` | text | required |
| `schedule_time` | text | free-text schedule, e.g. "Tue/Thu 4–5pm" |
| `level` | text | e.g. "Beginner" |
| `description` | text | optional |
| `created_at` | timestamptz | default now(); sort key |

### 3.3 `gallery`
Photo/video gallery items (home + full gallery page + lightbox).

| Column | Type (inferred) | Notes |
|---|---|---|
| `id` | uuid/serial (PK) | |
| `image_url` | text | public URL — either a Supabase Storage `gallery` bucket object, or an external/YouTube-style URL pasted in the admin UI |
| `caption` | text, nullable | editable inline in the visual editor |
| `created_at` | timestamptz | default now(); sort key |

Storage side-effect: deleting a gallery row also calls `supabase.storage.from('gallery').remove([path])`, where `path` is parsed out of `image_url`.

### 3.4 `about_sections`
Rich content blocks for the About page (and mirrored on Home).

| Column | Type (inferred) | Notes |
|---|---|---|
| `id` | uuid/serial (PK) | |
| `title` | text | |
| `body` | text | |
| `eyebrow` | text, nullable | small label above the title; only written if truthy |
| `image_url` | text, nullable | only written if truthy |
| `display_order` | int | manual ordering (drag-and-drop via SortableJS), ascending sort |

### 3.5 `pdfs`
Downloadable PDF resources (e.g. handbooks, forms) shown on the About page.

| Column | Type (inferred) | Notes |
|---|---|---|
| `id` | uuid/serial (PK) | |
| `title` | text | required |
| `description` | text, nullable | |
| `file_url` | text | public URL from the `pdfs` Storage bucket |
| `file_name` | text | storage object key, e.g. `169...-ab12cd.pdf` — used to compute the storage path on delete |
| `display_order` | int | ascending sort; defaults to `0` |

### 3.6 `registrations`
Program/class enrollment submissions from the public registration form; also read back by the Parent Portal (filtered by the signed-in user's email) and by Admin.

| Column | Type (inferred) | Notes |
|---|---|---|
| `id` | uuid (PK) | generated client-side via `crypto.randomUUID()` before insert (not DB-generated) |
| `student_name` | text | required |
| `parent_name` | text | required |
| `email` | text | required — used both for contact and for the Parent Portal's `eq('email', email)` filter, so it should match the parent's auth account email |
| `phone` | text | required |
| `date_of_birth` | date, nullable | |
| `class_id` | uuid/serial, nullable | FK → `classes.id` |
| `class_name` | text, nullable | denormalized copy of the class name at submission time |
| `experience_level` | text, nullable | free-form/select value from the form |
| `notes` | text, nullable | |
| `status` | text | one of `pending` \| `awaiting_verification` \| `confirmed` \| `cancelled` (admin dropdown) — the Parent Portal UI additionally recognizes `approved` \| `rejected` as legacy/alternate status labels, so the status vocabulary is inconsistent across the codebase and worth reconciling if you rebuild this table |
| `created_at` | timestamptz | default now(); sort key |

No `user_id` column — the row is linked to a parent purely by matching `email` text, not a Postgres FK to `auth.users`.

### 3.7 `payment_settings`
Configurable payment method(s) shown on the registration payment step (e.g. Venmo/Zelle).

| Column | Type (inferred) | Notes |
|---|---|---|
| `id` | uuid/serial (PK) | |
| `method_name` | text | e.g. `"Venmo"`, `"Zelle"` — matched by exact string in the UI to pick an icon/deep-link format |
| `handle` | text | the Venmo username or Zelle contact, used to build a deep link |
| `instructions` | text | shown to the payer |
| `qr_code_url` | text, nullable | optional QR code image |
| `is_active` | boolean | only one row is expected to be active at a time (`eq('is_active', true).limit(1).maybeSingle()`); the app does not enforce this at the DB level |
| `created_at` | timestamptz | used to pick "most recent" as a fallback if none is active |

### 3.8 `site_settings`
Generic key/JSON-value store used as a lightweight CMS for everything that isn't a first-class table above. This is where most of the site's editable content actually lives.

| Column | Type (inferred) | Notes |
|---|---|---|
| `id` | uuid/serial (PK) | |
| `key` | text | unique-ish (app does a manual "does a row for this key exist" check before insert vs. update — no DB unique constraint enforced by the client) |
| `value` | text | JSON-stringified payload; parsed with `JSON.parse` on read, falls back to raw string on parse failure |

**Known `key` values in use** (each `value` is a JSON blob whose shape is described below):

| Key | Shape | Purpose |
|---|---|---|
| `faculty_data` | `Array<{ id, name, title, bio, photo_url, display_order, category }>` | Faculty directory. `category` is one of `Dance`, `Chinese / Mandarin`, `STEM / Coding`, `Music`, `Other` (auto-inferred from title/role text if missing) |
| `programs_data` | `Array<{ id, name, slug, description, content, display_order, icon_url }>` | Program pages (Elite Dance, Mandarin, STEM, etc.), each with nested sub-sections (see below). Falls back to `DEFAULT_PROGRAMS` (hardcoded in `state.js`) when empty |
| `programs_header_text` | string/object (free-form) | Header copy for the Programs listing page |
| `concert_data` | `Array<{ id, title, body, display_order }>` | Concert/performance page sections |
| `tos_data` | `{ title, subtitle, sections: Array<{ id, title, body, display_order }> }` | Terms of Service page; ships with 3 hardcoded fallback sections if unset |
| `contact_info` | object (free-form; rendered by `renderAdminContactInfo`/etc.) | Site-wide contact details |
| `faq_data` | array (free-form; rendered by `renderAdminFaq`) | FAQ entries |
| `values_data` | `Array<{ id, title, body, icon_key, display_order }>` | "Our Values" cards on Home. `icon_key` indexes into a hardcoded SVG icon library in `state.js` (`dance`, `heritage`, `music`, `community`, `star`, `book`, `heart`, `award`) |
| `testimonials_data` | array (free-form; rendered by `renderTestimonials`/`renderAdminTestimonials`) | Testimonial quotes |
| `hero_content` | object (free-form; rendered by `renderAdminHeroSettings`) | Home hero banner text/config |
| `hero_image` | string (image URL) | Home hero banner background image, uploaded via the visual editor to the `gallery` bucket |

Program sub-sections (nested inside a `programs_data` entry, not their own table) also carry `image_url` per section, uploaded/replaced/removed through the visual editor with the same Storage-path-parsing pattern used for gallery/PDF deletes.

> Because `faculty_data`, `programs_data`, `concert_data`, `tos_data`, `values_data`, etc. are **JSON blobs inside one `site_settings` row each**, none of those "collections" are queryable, indexable, or constrainable at the Postgres level — all filtering/sorting/dedup (e.g. slug dedup in `fetchPrograms`) happens client-side in JavaScript after the whole blob is fetched.

---

## 4. Storage Buckets

| Bucket | Access | Contents | Referenced from |
|---|---|---|---|
| `gallery` | public | Gallery photos, program section images, hero image | `visual-editor.js`, `admin.js` |
| `pdfs` | public | Downloadable PDF resources | `visual-editor.js`, `data.js` |

Upload pattern: `${Date.now()}-${random6charBase36}.${ext}`, uploaded then immediately read back via `getPublicUrl()`. Deletes parse the storage object key out of the stored public URL by splitting on `/gallery/` or `/pdfs/`.

---

## 5. Row Level Security / Policies

**Not present in the codebase.** The client always uses the public **anon key** for every read and write shown above, including `registrations` (write), `payment_settings` (write), `site_settings` (write), and Storage uploads. This implies the Supabase project relied on RLS policies configured directly in the Supabase dashboard/SQL (not tracked anywhere in this repo — no `supabase/migrations` directory exists in this project). If the project is ever recreated, RLS policies will need to be re-authored from scratch; this repo has no record of what they were.

---

## 6. Disconnection Notes

This app has been disconnected from Supabase:

- `assets/js/state.js` no longer creates a live `createClient(...)` connection or embeds the project URL/anon key.
- All `supabase.from(...)`, `supabase.storage.from(...)`, and `supabase.auth.*` calls throughout `assets/js/*.js` now resolve against a local, in-memory/`localStorage`-backed stub (see `assets/js/local-store.js` if present) so the UI keeps functioning for local development/demo purposes, but **no data is persisted to any backend** and no network calls to `*.supabase.co` are made.
- The previously hardcoded Supabase project URL and anon key have been removed from the client bundle.

To reconnect to a real Supabase project in the future: recreate the tables/columns/buckets documented above, re-author RLS policies, and swap the stub in `state.js` back for a real `createClient(...)` call using that project's URL and anon key (ideally injected via environment/build-time config rather than hardcoded in source).
