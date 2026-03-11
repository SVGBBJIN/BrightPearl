# BrightPearl — Codebase Format & Architecture Guide

## Project Structure

Everything lives in a single file: `index.html`.

```
index.html (~4600 lines)
├── <style>         CSS (lines ~1–820)
├── <body> HTML     Static markup for all views (lines ~820–1860)
└── <script>        All JavaScript (lines ~1860–end)
```

There are no build steps, no frameworks, no bundlers. The app runs directly in a browser with Supabase for the backend.

---

## Views System

Views are `<main id="…-view">` elements that are shown/hidden by the `showView(name)` function.

### Available views
| ID | Route name | Description |
|----|-----------|-------------|
| `home-view` | `'home'` | Landing page with hero, gallery, awards, FAQ |
| `about-view` | `'about'` | About sections + PDF downloads |
| `faculty-view` | `'faculty'` | Faculty members grouped by category |
| `concert-view` | `'concert'` | Concert page with dynamic sections |
| `programs-view` | `'programs'` | Single program detail page (uses `currentProgram`) |
| `gallery-page-view` | `'gallery-page'` | Full gallery grid |
| `register-view` | `'register'` | Registration form (2-step) |
| `tos-view` | `'tos'` | Terms of Service |
| `admin-view` | `'admin'` | Admin dashboard / login |

### How `showView` works
```javascript
showView('about')  // hides all views, shows about-view, scrolls to top, updates nav active state
```
The function also shows/hides the admin visual-edit-toolbar and re-renders data for the target view.

---

## Navigation Dropdowns

### Programs Dropdown
- **Button:** `#nav-programs`
- **Menu:** `#programs-dropdown` (`.programs-dropdown-menu`)
- **CSS:** `.programs-dropdown-menu`, `.programs-dropdown-item`
- **JS:** `positionProgramsDropdown()`, `closeProgramsDropdown()`, click handler on `#nav-programs`
- **Populated by:** `populateProgramsDropdown()` — called on init and after add/delete program
- Items are dynamic: one button per program, navigates to that program's page

### About Dropdown
- **Button:** `#nav-about`
- **Menu:** `#about-dropdown` (`.about-dropdown-menu`)
- **CSS:** `.about-dropdown-menu`, `.about-dropdown-item`
- **JS:** `positionAboutDropdown()`, `closeAboutDropdown()`, click handler on `#nav-about`
- **Items (static):**
  - "Our Story" → `showView('about')` + scroll to `#about-sections-container`
  - "Downloads & Resources" → `showView('about')` + scroll to `#section-pdfs`
- Both dropdowns close on `document` click

---

## Data Layer (Supabase)

### Database Tables
| Table | Key columns | Notes |
|-------|------------|-------|
| `awards` | `id, title, year, description, display_order` | Ordered by `display_order` |
| `classes` | `id, name, schedule_time, level, description, display_order` | Ordered by `display_order` |
| `gallery` | `id, image_url, caption, created_at` | Images in Supabase Storage `gallery` bucket |
| `about_sections` | `id, title, body, image_url, display_order` | Ordered by `display_order` |
| `pdfs` | `id, title, description, file_url, display_order, created_at` | PDFs in `pdfs` bucket |
| `registrations` | `id, student_name, parent_name, email, phone, …, status` | Status: pending/confirmed/cancelled/… |
| `site_settings` | `id, key, value` | JSON key-value store |

### JSON Settings (stored in `site_settings`)
| Key | Shape | Description |
|-----|-------|-------------|
| `faculty_data` | `Faculty[]` | Faculty members array (no separate table) |
| `programs_data` | `Program[]` | Programs + nested sections |
| `concert_data` | `{sections: Section[]}` | Concert page sections |
| `tos_data` | `{sections: Section[]}` | Terms of Service sections |
| `hero_image` | `string` | Hero banner image URL |
| `payment_info` | `{method, details}` | Registration payment instructions |
| `contact_info` | `{email, phone, address}` | Contact details |
| `faq_data` | `FaqItem[]` | FAQ questions & answers |

### CRUD Pattern
All CRUD functions are async, return `true` on success or `false` on error (calling `alert()` for user-facing errors).

```javascript
// Fetch
await fetchAwards()           // returns Award[]
await fetchClasses()          // returns Class[]
await fetchFaculty()          // returns Faculty[] (sorted by display_order)

// Create
await addAward(title, year, description)
await addClass(name, schedule_time, level, description)
await addFacultyMember(name, title, bio, photo_url, display_order, category)

// Update (new)
await updateAward(id, { title, year, description })
await updateClass(id, { name, schedule_time, level, description })
await updateFacultyMember(id, { name, title, category, bio })
await updateGalleryCaption(id, caption)
await updatePdf(id, { title, description })

// Reorder (new)
await reorderAwards(orderedIds[])    // saves display_order 0,1,2…
await reorderClasses(orderedIds[])
await reorderFaculty(orderedIds[])

// Delete
await deleteAward(id)
await deleteClass(id)
await deleteFacultyMember(id)
await deleteGalleryItem(id, imageUrl)
await deletePdf(id, fileUrl)
```

---

## Admin Edit Mode

When an admin is logged in (`session !== null`), a toolbar appears at the top of public pages:

```
[Edit Mode toggle] [Dashboard button]
```

Toggling **Edit Mode** adds `.edit-mode` to `<body>`, which:
- Shows `.section-toolbar` overlays on editable sections (About, Concert, Programs, ToS)
- Enables `contenteditable` on section titles/bodies
- Shows drag handles on sortable containers

### Inline Editing in Edit Mode
- Section titles and bodies are `contenteditable`
- A toolbar (`.section-toolbar`) with Edit / Delete / Drag buttons appears on hover
- Changes are saved on blur or explicit save button click
- Used by: About sections, Concert sections, Program sections, ToS sections

### Admin Dashboard Inline Editing
The admin dashboard tables (Awards, Classes, Faculty, Gallery, PDFs) use a **row-toggle** pattern:
1. Each row has `data-*` attributes storing original values
2. Clicking **Edit** replaces the row's `innerHTML` with `<input>` fields
3. Clicking **Save** calls the appropriate `update*()` function, then re-renders
4. Clicking **Cancel** calls the render function to restore the row

---

## Drag-and-Drop (SortableJS)

**Library:** SortableJS v1.15.6 (CDN)

### Active Sortables
| Variable | Container | Trigger | Reorder function |
|----------|-----------|---------|-----------------|
| `aboutSortable` | `#about-sections-container` | Edit mode on about page | `reorderAboutSections()` |
| `gallerySortable` | `#gallery-grid` | Edit mode on home | *(visual only)* |
| `galleryPageSortable` | `#gallery-page-grid` | Edit mode on gallery page | *(visual only)* |
| `concertSortable` | `#concert-sections-container` | Edit mode on concert page | `reorderConcertSections()` |
| `tosSortable` | `#tos-sections-container` | Edit mode on ToS page | `reorderTosSections()` |
| `programSortable` | program sections container | Edit mode on program page | `reorderProgramSections()` |
| `faqAdminSortable` | `#admin-faq-list` | Always in admin dashboard | `reorderFaqItems()` |
| `awardsSortable` | `#admin-awards-tbody` | Always in admin dashboard | `reorderAwards()` |
| `classesSortable` | `#admin-classes-tbody` | Always in admin dashboard | `reorderClasses()` |
| `facultySortable` | `#admin-faculty-tbody` | Always in admin dashboard | `reorderFaculty()` |

### Init Pattern
```javascript
function initAwardsSortable() {
  const tbody = document.getElementById('admin-awards-tbody');
  if (!tbody || awardsSortable) return;  // guard: no double-init
  awardsSortable = Sortable.create(tbody, {
    handle: '.drag-handle',
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: async () => {
      const ids = Array.from(tbody.querySelectorAll('tr[data-award-id]')).map(r => r.dataset.awardId);
      await reorderAwards(ids);
    }
  });
}
```

All admin table sortables are initialized by their respective `renderAdmin*()` function. Before re-initializing, the existing instance is destroyed: `if (awardsSortable) { awardsSortable.destroy(); awardsSortable = null; }`.

### CSS Classes
```css
.sortable-ghost  { opacity: 0.4; }              /* placeholder while dragging */
.sortable-chosen { box-shadow: 0 4px 20px …; }  /* the element being dragged */
.sortable-drag   { transform: rotate(1deg); }    /* drag clone */
.drag-handle     { cursor: grab; }
.drag-handle:active { cursor: grabbing; }
```

---

## Key Utilities

```javascript
esc(str)                        // XSS-safe HTML entity escaping
showView(name)                  // navigate to a view
toggleEditMode()                // toggle admin edit mode
destroySortables()              // destroy all active sortable instances
fetchSetting(key)               // fetch a JSON value from site_settings
saveSetting(key, value)         // upsert a JSON value in site_settings
populateProgramsDropdown()      // rebuild the Programs nav dropdown
```

---

## Adding a New Editable Section (Checklist)

1. **Database:** Create table or add to a `site_settings` JSON key
2. **Fetch function:** `async function fetchMyItems()` — query Supabase
3. **CRUD functions:** `addMyItem()`, `updateMyItem()`, `deleteMyItem()`, `reorderMyItems()`
4. **HTML:** Add a `<table>` with thead including a drag-handle `<th class="w-8">` + data columns + Actions column
5. **Render function:** `renderAdminMyItems()` — build tbody with `data-*` attributes, wire up Edit/Save/Cancel + Delete buttons, call `initMySortable()` at the end
6. **Sortable variable:** `let mySortable = null;` (near line 1858)
7. **Sortable init function:** `initMySortable()` — create Sortable on tbody, `onEnd` calls `reorderMyItems()`
8. **Add to `destroySortables()`**
9. **Call `renderAdminMyItems()`** from the admin dashboard render block (near line ~2000)
