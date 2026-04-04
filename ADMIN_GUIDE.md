# Bright Pearl Academy — Admin & Edit Mode Guide

All site content is managed through two interfaces: the **Admin Dashboard** (accessible after logging in as an admin) and **Edit Mode** (toggled on the live page for in-place editing). Both interfaces write to the same Supabase backend.

---

## How to Access

| Interface | How to open |
|-----------|-------------|
| Admin Dashboard | Log in → click your avatar/profile → "Admin Dashboard" |
| Edit Mode | From any page, click the **Edit Mode** button in the top toolbar |
| Exit Edit Mode | Click **Preview** (same button toggles back) |

---

## Feature Reference

### 1. Hero Banner

**Admin Dashboard** → *Hero Settings*
- **Est. Label** — the year/badge text shown in the hero (e.g., "Est. 2018")
- **Change Image** — upload a new background photo (JPEG, PNG, WebP, GIF)

**Edit Mode (on-page)**
- Hover over the hero → a **"Click to Change"** overlay appears; click it to replace the background image
- The Est. Label text is directly contentEditable — click it to type a new value

**Storage:** `site_settings.hero_image` (URL), `site_settings.hero_content` (JSON: `{ estLabel }`)

---

### 2. Awards / Achievements Ticker

**Admin Dashboard** → *Awards*
- **Add Award** form — Title (required), Year, Description
- The awards table lists all entries; click **Delete** to remove one
- Entries display as scrolling chips in the ticker strip on the homepage

**Edit Mode (on-page)**
- No on-page edit controls; use the Admin Dashboard

**Storage:** Supabase `awards` table — `id, title, year, description, created_at`

---

### 3. What We Believe In (Values Cards)

**Admin Dashboard** → *Values & Beliefs Cards*
- **Add Value** form — Title, Description, Icon (choose from 8 icons: Dance, Heritage, Music, Community, Excellence, Learning, Passion, Awards)
- Each existing card shows inline **Edit** and **Delete** buttons
- Drag handles for reordering

**Edit Mode (on-page)**
- Each card shows a small toolbar (top-right corner):
  - **≡ Drag handle** — drag card left/right to reorder; order is saved automatically
  - **✏ Pencil** — makes the title and description directly editable in place; a **Save Changes** button appears below the card
  - **🗑 Trash** — deletes the card (with confirmation prompt)
- **Click the card's icon** → an 8-icon picker pops open; click any icon to swap it instantly
- **"+ Add Value Card"** row appears at the bottom of the grid; click to add a new card via prompts

**Storage:** `site_settings.values_data` (JSON array of `{ id, title, body, icon_key, display_order }`)

---

### 4. Programs & Classes Grid (Homepage)

**Admin Dashboard** → *Programs*
- **Create Program** form — Name, URL slug, Display order, Short description
- Each program has an expandable panel where you can:
  - Edit the program's name, slug, and description
  - Upload/remove the **Card Icon** (shown in the homepage grid)
  - Add, edit, reorder, and delete **content sections** for the program detail page
  - Upload images for each section

**Edit Mode (on-page)**
- Each program card shows a toolbar (top-right corner):
  - **≡ Drag handle** — reorder cards; saved automatically
  - **✏ Pencil** — makes program name and description editable in place; click **Save Changes** to commit
- **Hover over the icon area** → a camera overlay appears; click it to upload a new icon image
- A **"Add new programs"** note at the bottom links to the Admin Dashboard (full program creation requires a slug and content setup)

**Storage:** `site_settings.programs_data` (JSON array of `{ id, name, slug, description, icon_url, display_order, sections: [...] }`)

---

### 5. Program Detail Pages

**Admin Dashboard** → *Programs* → expand a program
- Each program's detail page is built from **sections** — add as many as needed
- Each section has: Title, Body text, optional Image
- Sections can be reordered with drag handles and deleted

**Edit Mode (on-page)** — navigate to a program's detail page, then enable Edit Mode
- The page title and description are directly contentEditable
- Each content section shows a `.section-toolbar`:
  - **≡ Drag** to reorder
  - **✏ Edit** — inline contentEditable for title and body text
  - **🗑 Delete** — removes the section
- Hover over a section image → camera overlay to replace the photo
- Sections are reordered with `programSortable`

**Storage:** Nested inside `site_settings.programs_data[n].sections`

---

### 6. About / Our Story Sections

**Admin Dashboard** → *About Page Sections*
- **Add Section** form — Title (required), Body text (required), Display order, optional Photo (drag-drop or click to upload), optional YouTube URL
- Each section listed in the table shows a **Delete** button
- Sections appear as alternating image+text blocks on the homepage

**Edit Mode (on-page)**
- Each section block has a `.section-toolbar` (top-right):
  - **≡ Drag** — reorder sections; saved to Supabase on drop
  - **✏ Edit** — enables contentEditable for the eyebrow label, heading, and body; a rich-text format toolbar appears; click **Save Changes** to commit
  - **🖼 Image** — opens a file picker to add or replace the section photo
  - **▶ Video** — prompts for a YouTube URL to embed
  - **🗑 Delete** — removes the section
- Hover over a section photo → camera overlay to replace it directly
- A **"+ Add Section"** row at the bottom of the list is visible only in edit mode

**Storage:** Supabase `about_sections` table — `id, title, body, eyebrow, image_url, display_order, created_at`

---

### 7. Gallery

**Admin Dashboard** → *Gallery Photos*
- **Upload photos** — drag-drop or click to select (JPEG, PNG, WebP, GIF; max 5 MB each); bulk upload supported; optional caption per photo
- **Add YouTube video** — paste a YouTube URL + optional caption; thumbnail auto-fetched
- All uploads appear in the gallery table with preview, caption, date, and a **Delete** button

**Edit Mode (on-page — Homepage Gallery strip)**
- Each photo card shows (on hover):
  - **✏ Edit caption** — inline caption input with Save/Cancel
  - **🗑 Delete** — removes the photo
- Gallery items can be **dragged to reorder** (`gallerySortable`)
- An **"Add image"** button is visible in edit mode

**Edit Mode (on-page — Full Gallery page)**
- Same controls as homepage strip
- Reordering supported via drag handles (`galleryPageSortable`)

**Storage:** Supabase `gallery` table — `id, image_url, caption, created_at` + Supabase Storage bucket `gallery/`

---

### 8. Faculty / Meet the Team

**Admin Dashboard** → *Faculty*
- **Add Faculty Member** form — Name (required), Title/Role, Category (Dance, Chinese/Mandarin, STEM/Coding, Music, Other), Bio (required), optional Profile Photo, Display order
- Each member listed in the table with a **Delete** button

**Edit Mode (on-page)**
- Each faculty card has a `.section-toolbar` (top-left):
  - **✏ Edit** — contentEditable for name, title, and bio
  - **🗑 Delete** — removes the member
- Hover over the profile photo → an upload overlay to replace it
- Cards grouped by category; reorderable within each group

**Storage:** `site_settings.faculty_data` (JSON array of `{ id, name, title, category, bio, photo_url, display_order }`)

---

### 9. Testimonials

**Admin Dashboard** → *Testimonials*
- **Add Testimonial** form — Name, Role, Quote, Display order
- Each testimonial listed with inline **Edit** and **Delete** buttons
- Drag handles for reordering

**Edit Mode (on-page)**
- Testimonials re-render when Edit Mode is activated, showing `.section-toolbar` with Edit and Delete buttons on each card
- Inline contentEditable for quote, name, and role

**Storage:** `site_settings.testimonials_data` (JSON array of `{ id, name, role, quote, display_order }`)

---

### 10. Contact Info & Social Links

**Admin Dashboard** → *Contact & Enrollment Info*
- **Fields:** Email, Phone, Location, Helper text (subtitle shown in the contact block), Facebook URL, YouTube URL, WeChat ID
- Click **Save** to apply all changes
- These fields also populate the **footer** (email, phone, location, social icons)

**Edit Mode (on-page)**
- Clicking the footer's social links row while in Edit Mode navigates directly to the contact info form in the Admin Dashboard

**Storage:** `site_settings.contact_info` (JSON: `{ email, phone, location, helper_text, facebook, youtube, wechat, instagram }`)

---

### 11. FAQ

**Admin Dashboard** → *FAQ*
- **Add FAQ** form — Question, Answer, Display order
- Each item shows inline **Edit** and **Delete** buttons; edit expands a form in place
- Drag handles for reordering (`faqAdminSortable`)

**Edit Mode (on-page)**
- No on-page edit controls; use the Admin Dashboard

**Storage:** `site_settings.faq_data` (JSON array of `{ id, question, answer, display_order }`)

---

### 12. Concert / Events Page

**Admin Dashboard** → *Concert Page*
- **Add Concert Section** form — Title (required), Display order, Body content (required)
- Sections listed in a table with a **Delete** button

**Edit Mode (on-page)** — navigate to the Concert page, then enable Edit Mode
- Each section block shows a `.section-toolbar`:
  - **≡ Drag** — reorder sections (`concertSortable`)
  - **✏ Edit** — contentEditable for title and body text; rich-text toolbar appears
  - **🗑 Delete** — removes the section

**Storage:** `site_settings.concert_data` (JSON array of `{ id, title, body, display_order }`)

---

### 13. Terms of Service Page

**Admin Dashboard** → *Terms of Service Page*
- **Page metadata** form — Page title, Subtitle; click **Save Page Info**
- **Add Section** form — Section title (required), Body text (required)
- Sections listed with inline **Edit** and **Delete** buttons

**Edit Mode (on-page)** — navigate to the ToS page, then enable Edit Mode
- Each section has a `.section-toolbar`:
  - **≡ Drag** — reorder (`tosSortable`)
  - **✏ Edit** — contentEditable for title and body; rich-text toolbar
  - **🗑 Delete** — removes the section

**Storage:** `site_settings.tos_data` (JSON: `{ title, subtitle, sections: [{ id, title, body, display_order }] }`)

---

### 14. PDF Downloads / Resources

**Admin Dashboard** → *PDF Downloads*
- Upload PDFs via drag-drop or file picker (PDF only, max 20 MB)
- Required: **Title**; optional: **Description**, **Display order**
- Upload progress bar shown during upload
- Each uploaded file listed with download link, date, and **Delete** button

**Edit Mode (on-page)**
- No on-page edit controls; use the Admin Dashboard

**Storage:** Supabase `pdfs` table — `id, title, description, pdf_url, display_order, created_at` + Supabase Storage bucket `pdfs/`

---

### 15. Classes (Schedule)

**Admin Dashboard** → *Classes*
- **Add Class** form — Name (required), Schedule time, Level (Beginner / Intermediate / Advanced), Description
- Classes table shows all entries with a **Delete** button
- Classes appear in the enrollment registration form dropdown

**Edit Mode (on-page)**
- No on-page edit controls; use the Admin Dashboard

**Storage:** Supabase `classes` table — `id, name, schedule_time, level, description, created_at`

---

### 16. Registrations

**Admin Dashboard** → *Registrations* / *Pending Registrations*
- **Pending Registrations** tab — review new applications; click **Approve** or **Reject** per entry
- **All Registrations** tab — full list with student name, parent, contact, class, experience, date, status; **Delete** to remove
- **Payment Settings** sub-section — configure payment contact email and phone

**Edit Mode (on-page)**
- Not applicable; registrations are submitted by site visitors

**Storage:** Supabase `registrations` table — `id, student_name, dob, parent_name, email, phone, class_id, experience, notes, status, created_at`

---

## Quick Reference: Edit Mode Controls

| Control | What it does |
|---------|-------------|
| **≡ Drag handle** | Drag to reorder; new order saves automatically on drop |
| **✏ Pencil** | Opens in-place text editing (contentEditable); a **Save Changes** button appears |
| **🗑 Trash** | Deletes the item after a confirmation prompt |
| **🖼 Image button** | Opens file picker to add/replace a section photo |
| **▶ Video button** | Prompts for a YouTube URL to embed |
| **Camera overlay** | Appears on hover over photos; click to replace the image |
| **"+ Add …" row** | Appears at the bottom of each editable grid/list; click to add a new item |
| **Icon picker** | Click a value card's icon to open an 8-icon selector |
| **Save Changes** | Commits contentEditable text to Supabase |

## Quick Reference: Edit Mode by Page

| Page | Sections with edit controls |
|------|-----------------------------|
| **Home** | Hero image, About/Story blocks, Values cards, Programs grid, Gallery strip, Testimonials, Footer social (redirects to admin) |
| **About** | All About page content sections |
| **Programs** (list) | — |
| **Programs** (detail) | Page title/description, all content sections, section images |
| **Concert/Events** | All concert content sections |
| **Gallery** | All gallery items (caption, delete, reorder) |
| **Terms of Service** | Page title/subtitle, all TOS sections |
| **Faculty** | All faculty cards (name, title, bio, photo) |
