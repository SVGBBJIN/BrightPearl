# Admin Editability & Customization Policy

## Purpose
To keep Bright Pearl Academy easy to maintain, every newly introduced user-facing feature should be configurable by admins without code changes.

## Required Standards for New Features
1. **Admin editable by default**
   - If a feature displays content on the site (text, cards, media, labels, links, calls-to-action), it must include an admin editing path in the dashboard or visual edit mode.
2. **Customizable presentation**
   - Repeating UI blocks (cards, sections, highlights, testimonials, etc.) must support add/edit/delete/reorder operations.
3. **Persisted settings**
   - Feature settings must be stored in a durable source (e.g., `site_settings`, existing content tables, or equivalent persistent storage).
4. **Safe fallback content**
   - Features should render sensible defaults when no admin data exists yet.
5. **Edit-mode compatibility**
   - Where drag-and-drop is used, use consistent drag handles and save ordering on drop.

## Implementation Checklist (PRs)
- [ ] Added admin controls for all new user-facing content.
- [ ] Added persistence and load logic.
- [ ] Added fallback/default state.
- [ ] Added or updated render logic on both admin and public views.
- [ ] Confirmed drag-and-drop reorder (if applicable).

## Scope
This policy applies to all future homepage, about, faculty, programs, gallery, registration, and shared component enhancements.
