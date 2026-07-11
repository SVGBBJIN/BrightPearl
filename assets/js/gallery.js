import { currentProgram, editMode } from './state.js';
import { closeDrawer, closeProgramsDropdown, showView } from './auth.js';
import { deleteConcertSection, deleteTosSection, fetchConcertSections, fetchFaculty, fetchGallery, fetchPrograms, fetchTosSettings, inferFacultyCategory, updateTosSection } from './data.js';
import { deleteGalleryItem, deleteProgramSection, destroySortables, initConcertSortable, initGalleryPageSortable, initProgramSortable, initTosSortable, updateConcertSection, updateFacultyMember, updateGalleryCaption, updateProgramItem, updateProgramSection, uploadImageToStorage } from './visual-editor.js';
import { renderHeroPhoto, renderHomeGallery, renderSkeletonCards } from './home.js';
import { buildCarouselHTML, computeVariants, getSectionImages, wireCarousels, wireSbsResizeHandles } from './programs.js';
import { renderAdminConcert, renderAdminGallery, renderAdminTosSettings } from './admin.js';
import { openLightbox } from './lightbox.js';
import { esc, getYouTubeId, sanitizeHtml, showFormatToolbar } from './utils.js';
import { initReveal } from './main.js';

    //  RENDER — FACULTY / CONCERT / PROGRAMS / GALLERY PAGE
    // ════════════════════════════════════════════════
    const FACULTY_CAT_ICONS = {
      'Dance': '💃',
      'Chinese / Mandarin': '🏮',
      'STEM / Coding': '💻',
      'Music': '🎵',
      'Other': '⭐'
    };

    export async function renderFacultyPage() {
      const $grid     = document.getElementById('faculty-category-grid');
      const $sections = document.getElementById('faculty-sections-container');
      const $empty    = document.getElementById('faculty-list-empty');
      renderSkeletonCards('faculty-sections-container', 4);
      const members   = await fetchFaculty();
      $empty.classList.add('view-hidden');

      // Always show these 3 primary categories regardless of faculty count
      const ALL_CATS = [
        {
          key: 'Dance',
          label: 'Dance Faculty',
          desc: 'Classical & contemporary movement',
          grad: 'linear-gradient(145deg,#7f1d1d 0%,#b91c1c 45%,#ef4444 100%)',
          icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:64px;height:64px;opacity:0.55">
            <circle cx="32" cy="14" r="7" fill="white"/>
            <path d="M22 32 Q28 22 32 28 Q38 18 44 32 L40 50 L32 44 L24 50 Z" fill="white"/>
            <path d="M22 32 Q16 36 14 44" stroke="white" stroke-width="3" stroke-linecap="round"/>
            <path d="M44 32 Q50 36 50 44" stroke="white" stroke-width="3" stroke-linecap="round"/>
          </svg>`
        },
        {
          key: 'Chinese / Mandarin',
          label: 'Chinese / Mandarin Faculty',
          desc: 'Language & cultural immersion',
          grad: 'linear-gradient(145deg,#92400e 0%,#b45309 45%,#f59e0b 100%)',
          icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:64px;height:64px;opacity:0.55">
            <rect x="12" y="12" width="40" height="6" rx="3" fill="white"/>
            <rect x="20" y="12" width="4" height="36" rx="2" fill="white"/>
            <rect x="40" y="12" width="4" height="36" rx="2" fill="white"/>
            <rect x="16" y="32" width="32" height="5" rx="2.5" fill="white"/>
          </svg>`
        },
        {
          key: 'STEM / Coding',
          label: 'STEM / Coding Faculty',
          desc: 'Science, technology & mathematics',
          grad: 'linear-gradient(145deg,#1e3a8a 0%,#1d4ed8 45%,#60a5fa 100%)',
          icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:64px;height:64px;opacity:0.55">
            <rect x="8" y="14" width="48" height="32" rx="5" stroke="white" stroke-width="3"/>
            <polyline points="18,34 26,26 32,32 40,22 46,28" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="20" y="46" width="24" height="4" rx="2" fill="white"/>
          </svg>`
        }
      ];

      // Resolve effective category: use stored value if set, otherwise infer from title
      const effCat = m => m.category && m.category !== '' && m.category !== 'Other'
        ? m.category
        : inferFacultyCategory((m.title || '') + ' ' + (m.role || ''));

      // Build category grid — always render all 3 cards
      $grid.innerHTML = ALL_CATS.map(cat => {
        const sectionId = 'faculty-section-' + cat.key.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const count = members.filter(m => effCat(m) === cat.key).length;
        return `
          <div class="faculty-cat-card">
            <div class="faculty-cat-img-wrap" style="background:${cat.grad}">
              <div class="faculty-cat-img-placeholder" style="display:flex;flex-direction:column;align-items:center;gap:0.5rem;">
                ${cat.icon}
              </div>
            </div>
            <div class="faculty-cat-body">
              <div class="faculty-cat-title">${esc(cat.label)}</div>
              <p style="font-size:0.75rem;color:rgb(var(--ink-rgb)/0.5);margin-bottom:0.85rem;">${esc(cat.desc)}</p>
              ${count > 0
                ? `<a href="#${sectionId}" class="faculty-cat-btn" onclick="document.getElementById('${sectionId}')?.scrollIntoView({behavior:'smooth',block:'start'});return false;">
                    Meet the Instructors →
                  </a>`
                : `<span style="font-size:0.75rem;color:rgb(var(--ink-rgb)/0.35);font-style:italic;">Profiles coming soon</span>`}
            </div>
          </div>`;
      }).join('');

      // Trigger reveal animations for the category grid (always present)
      if (typeof initReveal === 'function') setTimeout(initReveal, 60);

      // Faculty sections — only for categories with members
      const presentCats = ALL_CATS.filter(cat => members.some(m => effCat(m) === cat.key));
      if (!presentCats.length) { $sections.innerHTML = ''; return; }

      $sections.innerHTML = presentCats.map(cat => {
        const sectionId = 'faculty-section-' + cat.key.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const group = members.filter(m => effCat(m) === cat.key);
        return `
          <div class="faculty-group-section" id="${sectionId}">
            <div class="faculty-group-header">
              <h3>${esc(cat.label)}</h3>
              <span class="group-count">${group.length} instructor${group.length !== 1 ? 's' : ''}</span>
            </div>
            ${group.map(m => `
              <div class="editable-section faculty-card" data-section-id="${m.id}">
                <div class="section-toolbar" style="top:0.5rem;left:0.5rem;">
                  <button class="edit-section-btn" title="Edit inline" data-edit-id="${m.id}">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                  </button>
                </div>
                <div>
                  <div class="faculty-photo-wrap" data-upload-member="${m.id}">
                    ${m.photo_url
                      ? `<img src="${esc(m.photo_url)}" alt="${esc(m.name)}" />`
                      : `<div class="faculty-photo-placeholder">${esc(m.name.charAt(0))}</div>`}
                    <div class="faculty-photo-upload-overlay" title="Upload photo">
                      <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/></svg>
                      <span>Change photo</span>
                    </div>
                    <input class="faculty-photo-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none" />
                  </div>
                </div>
                <div>
                  <span class="faculty-name-divider"></span>
                  <h2 class="font-display text-2xl sm:text-3xl text-ink font-bold mb-1 editable-title" data-field="name" data-id="${m.id}">${esc(m.name)}</h2>
                  <p class="text-sm font-bold text-ink/70 mb-4 editable-subtitle" data-field="title" data-id="${m.id}">${esc(m.title || '')}</p>
                  <p class="text-ink/65 leading-relaxed text-sm sm:text-base whitespace-pre-line editable-body" data-field="bio" data-id="${m.id}">${esc(m.bio)}</p>
                </div>
              </div>`).join('')}
          </div>`;
      }).join('');

      // Wire faculty inline-edit buttons
      $sections.querySelectorAll('.edit-section-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.editId;
          const card = $sections.querySelector(`[data-section-id="${id}"]`);
          const $name = card.querySelector('.editable-title');
          const $sub  = card.querySelector('.editable-subtitle');
          const $bio  = card.querySelector('.editable-body');
          if ($name.contentEditable === 'true') {
            [$name, $sub, $bio].forEach(el => { el.contentEditable = 'false'; });
            const sb = card.querySelector('.inline-save-btn'); if (sb) sb.remove();
            updateFacultyMember(id, { name: $name.textContent.trim(), title: $sub.textContent.trim(), bio: $bio.textContent.trim() });
          } else {
            [$name, $sub, $bio].forEach(el => { el.contentEditable = 'true'; }); $name.focus();
            if (!card.querySelector('.inline-save-btn')) {
              const sb = document.createElement('button');
              sb.className = 'inline-save-btn'; sb.textContent = 'Save Changes';
              sb.addEventListener('click', async () => {
                await updateFacultyMember(id, { name: $name.textContent.trim(), title: $sub.textContent.trim(), bio: $bio.textContent.trim() });
                [$name, $sub, $bio].forEach(el => { el.contentEditable = 'false'; }); sb.remove();
              });
              card.appendChild(sb);
            }
          }
        });
      });

      // Wire faculty photo upload overlays (edit mode)
      $sections.querySelectorAll('.faculty-photo-wrap[data-upload-member]').forEach(wrap => {
        const memberId  = wrap.dataset.uploadMember;
        const overlay   = wrap.querySelector('.faculty-photo-upload-overlay');
        const fileInput = wrap.querySelector('.faculty-photo-file-input');
        overlay.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
        fileInput.addEventListener('change', async () => {
          const file = fileInput.files[0];
          if (!file) return;
          overlay.innerHTML = '<span style="font-size:0.6rem">Uploading…</span>';
          try {
            const url = await uploadImageToStorage(file);
            await updateFacultyMember(memberId, { photo_url: url });
            // Update photo in place
            const existing = wrap.querySelector('img, .faculty-photo-placeholder');
            if (existing) existing.remove();
            const img = document.createElement('img');
            img.src = url; img.alt = '';
            wrap.insertBefore(img, overlay);
            overlay.innerHTML = `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/></svg><span>Change photo</span>`;
          } catch (err) {
            overlay.innerHTML = `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/></svg><span>Change photo</span>`;
            alert('Upload failed: ' + err.message);
          }
          fileInput.value = '';
        });
      });
      if (typeof initReveal === 'function') setTimeout(initReveal, 60);
    }

    export async function renderConcertPage() {
      const $container = document.getElementById('concert-sections-container');
      const $empty     = document.getElementById('concert-sections-empty');
      renderSkeletonCards('concert-sections-container', 3);
      const sections   = await fetchConcertSections();
      if (!sections.length) { $container.innerHTML = ''; $empty.classList.remove('view-hidden'); return; }
      $empty.classList.add('view-hidden');
      $container.classList.add('cb-grid');
      const variants_cp = computeVariants(sections);
      const SVG_DRAG   = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg>`;
      const SVG_PENCIL = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>`;
      const SVG_IMG_C  = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`;
      const SVG_VID_C  = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`;
      const SVG_TRASH  = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>`;
      $container.innerHTML = sections.map((s, idx) => {
        const v       = variants_cp[idx];
        const flip    = idx % 2 !== 0;
        const imgs    = getSectionImages(s);
        const hasImgs = imgs.length > 0;
        const carHTML = hasImgs ? buildCarouselHTML(imgs, s.id, editMode) : '';
        const tbHTML = `
            <div class="drag-handle" title="Drag to reorder">${SVG_DRAG}</div>
            <button class="edit-section-btn" title="Edit inline" data-edit-id="${s.id}">${SVG_PENCIL}</button>
            <button class="img-concert-btn" title="${hasImgs ? 'Add/change image' : 'Add image'}" data-imgbtn-id="${s.id}">${SVG_IMG_C}</button>
            <button class="vid-concert-btn" title="Add YouTube video" data-vidbtn-id="${s.id}">${SVG_VID_C}</button>
            <button class="del-section-btn" title="Delete" data-delbtn-id="${s.id}">${SVG_TRASH}</button>`;
        const textHTML = `
          <h3 class="cb-title editable-title" data-field="title" data-id="${s.id}">${esc(s.title)}</h3>
          <div class="cb-body editable-body" data-field="body" data-id="${s.id}">${sanitizeHtml(s.body)}</div>`;
        if (!hasImgs) {
          return `
          <div class="editable-section content-block reveal-left" data-tone="${v.tone}" data-section-id="${s.id}" style="grid-column: span ${v.span}">
            <div class="section-toolbar">${tbHTML}</div>
            ${textHTML}
          </div>`;
        }
        const imgH = s.img_height || '';
        const resizeHandle = editMode ? `<div class="sbs-resize-handle" data-resize-id="${s.id}" title="Drag to resize image"><svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M10 2L2 10M7 2L2 7M10 5L5 10"/></svg></div>` : '';
        return `
        <div class="editable-section cb-editorial${flip ? ' flip' : ''}${v.inkEdit ? ' ink' : ''} reveal-left" data-section-id="${s.id}" style="grid-column: span 12">
          <div class="section-toolbar">${tbHTML}</div>
          <div class="cb-photo-pane sec-sidebyside-img" style="${imgH ? `--sbs-img-h:${imgH}` : ''}">
            ${carHTML}${resizeHandle}
          </div>
          <div class="cb-text-pane sec-sidebyside-text">
            ${textHTML}
          </div>
        </div>`;
      }).join('');

      wireCarousels($container);
      wireSbsResizeHandles($container, updateConcertSection);

      // Carousel: add image to section
      $container.querySelectorAll('.carousel-add-img').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.cid;
          const inp = document.createElement('input');
          inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/webp,image/gif';
          inp.onchange = async () => {
            if (!inp.files.length) return;
            const file = inp.files[0];
            if (file.size > 5*1024*1024) { alert('Max 5 MB'); return; }
            try {
              const url = await uploadImageToStorage(file);
              const sec = (await fetchConcertSections()).find(s => s.id === id);
              const imgs = getSectionImages(sec); imgs.push(url);
              await updateConcertSection(id, { images: imgs, image_url: imgs[0] });
              await renderConcertPage();
            } catch (err) { alert('Error: ' + err.message); }
          };
          inp.click();
        });
      });
      // Carousel: add YouTube video to section
      $container.querySelectorAll('.carousel-add-yt').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.cid;
          const raw = prompt('Enter YouTube URL:');
          if (!raw) return;
          const ytId = getYouTubeId(raw.trim());
          if (!ytId) { alert('Invalid YouTube URL. Please use a youtube.com or youtu.be link.'); return; }
          try {
            const sec = (await fetchConcertSections()).find(s => s.id === id);
            const imgs = getSectionImages(sec); imgs.push(raw.trim());
            await updateConcertSection(id, { images: imgs, image_url: imgs[0] });
            await renderConcertPage();
          } catch (err) { alert('Error: ' + err.message); }
        });
      });

      // Toolbar: add YouTube video to section
      $container.querySelectorAll('.vid-concert-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id  = btn.dataset.vidbtnId;
          const raw = prompt('Enter YouTube URL:');
          if (!raw) return;
          const ytId = getYouTubeId(raw.trim());
          if (!ytId) { alert('Invalid YouTube URL. Please use a youtube.com or youtu.be link.'); return; }
          try {
            const sec = (await fetchConcertSections()).find(s => s.id === id);
            const imgs = getSectionImages(sec); imgs.push(raw.trim());
            await updateConcertSection(id, { images: imgs, image_url: imgs[0] });
            await renderConcertPage();
          } catch (err) { alert('Error: ' + err.message); }
        });
      });

      // Carousel: remove image from section
      $container.querySelectorAll('.carousel-remove-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
          e.stopPropagation();
          if (!confirm('Remove this image?')) return;
          const id = btn.dataset.cid; const idx = parseInt(btn.dataset.sidx);
          const sec = (await fetchConcertSections()).find(s => s.id === id);
          const imgs = getSectionImages(sec); imgs.splice(idx, 1);
          await updateConcertSection(id, { images: imgs, image_url: imgs[0] || null });
          await renderConcertPage();
        });
      });

      $container.querySelectorAll('.edit-section-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.editId;
          const card = $container.querySelector(`[data-section-id="${id}"]`);
          const $t = card.querySelector('.editable-title'), $b = card.querySelector('.editable-body');
          if ($t.contentEditable === 'true') {
            $t.contentEditable = 'false'; $b.contentEditable = 'false';
            const sb = card.querySelector('.inline-save-btn'); if (sb) sb.remove();
            card.querySelector('.format-toolbar')?.remove();
            updateConcertSection(id, { title: $t.textContent.trim(), body: sanitizeHtml($b.innerHTML.trim()) });
          } else {
            $t.contentEditable = 'true'; $b.contentEditable = 'true'; $t.focus();
            showFormatToolbar($b);
            if (!card.querySelector('.inline-save-btn')) {
              const sb = document.createElement('button');
              sb.className = 'inline-save-btn'; sb.textContent = 'Save Changes';
              sb.addEventListener('click', async () => {
                await updateConcertSection(id, { title: $t.textContent.trim(), body: sanitizeHtml($b.innerHTML.trim()) });
                $t.contentEditable = 'false'; $b.contentEditable = 'false';
                card.querySelector('.format-toolbar')?.remove(); sb.remove();
              });
              card.appendChild(sb);
            }
          }
        });
      });
      $container.querySelectorAll('.del-section-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this section?')) return;
          await deleteConcertSection(btn.dataset.delbtnId);
          await renderConcertPage(); await renderAdminConcert();
        });
      });
      // Primary image button — sets/replaces images[0]
      $container.querySelectorAll('.img-concert-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.imgbtnId;
          const inp = document.createElement('input');
          inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/ogg';
          inp.onchange = async () => {
            if (!inp.files.length) return;
            const file = inp.files[0];
            if (file.size > 5*1024*1024) { alert('Max 5 MB'); return; }
            try {
              const url = await uploadImageToStorage(file);
              const sec = (await fetchConcertSections()).find(s => s.id === id);
              const imgs = getSectionImages(sec);
              if (!imgs.length) imgs.push(url); else imgs[0] = url;
              await updateConcertSection(id, { image_url: url, images: imgs });
              await renderConcertPage();
            } catch (err) { alert('Error: ' + err.message); }
          };
          inp.click();
        });
      });
      if (editMode) { destroySortables(); initConcertSortable(); }
      if (typeof initReveal === 'function') setTimeout(initReveal, 60);
    }

    export async function renderProgramPage(slug) {
      const $title   = document.getElementById('program-page-title');
      const $desc    = document.getElementById('program-page-desc');
      const $container = document.getElementById('program-content-container');
      const $empty   = document.getElementById('program-content-empty');
      renderSkeletonCards('program-content-container', 2);
      const programs = await fetchPrograms();
      const program  = slug ? programs.find(p => p.slug === slug) : programs[0];
      if (!program) {
        $title.textContent = 'Program'; $desc.textContent = '';
        $title.dataset.programId = ''; $desc.dataset.programId = '';
        $container.innerHTML = ''; $empty.classList.remove('view-hidden'); return;
      }
      $title.textContent = program.name;
      $desc.textContent  = program.description || '';
      $title.dataset.programId = program.id;
      $desc.dataset.programId  = program.id;
      $container.dataset.programId = program.id;

      // Normalize sections: prefer program.sections, fall back to legacy content field
      let sections = Array.isArray(program.sections) ? program.sections : [];
      if (!sections.length && program.content) {
        sections = [{ id: program.id + '-legacy', title: program.name, body: program.content, image_url: null, display_order: 0 }];
      }
      sections = sections.map(s => ({ ...s, image_url: s.image_url || null }));
      sections = sections.sort((a,b) => (a.display_order||0)-(b.display_order||0));

      const SVG_DRAG   = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg>`;
      const SVG_PENCIL = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>`;
      const SVG_IMG_P  = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`;
      const SVG_VID_P  = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`;
      const SVG_TRASH  = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>`;

      if (sections.length) {
        $empty.classList.add('view-hidden');
        $container.classList.add('cb-grid');
        const variants_pp = computeVariants(sections);
        $container.innerHTML = sections.map((s, idx) => {
          const v       = variants_pp[idx];
          const flip    = idx % 2 !== 0;
          const imgs    = getSectionImages(s);
          const hasImgs = imgs.length > 0;
          const carHTML = hasImgs ? buildCarouselHTML(imgs, s.id, editMode) : '';
          const tbHTMLp = `
              <div class="drag-handle" title="Drag to reorder">${SVG_DRAG}</div>
              <button class="edit-section-btn" title="Edit inline" data-edit-id="${esc(s.id)}">${SVG_PENCIL}</button>
              <button class="img-program-btn" title="${hasImgs ? 'Add/change image' : 'Add image'}" data-imgbtn-id="${esc(s.id)}">${SVG_IMG_P}</button>
              <button class="vid-program-btn" title="Add YouTube video" data-vidbtn-id="${esc(s.id)}">${SVG_VID_P}</button>
              <button class="del-section-btn" title="Delete section" data-delbtn-id="${esc(s.id)}">${SVG_TRASH}</button>`;
          const textHTML = `
            <h3 class="cb-title editable-title" data-field="title" data-id="${esc(s.id)}">${esc(s.title)}</h3>
            <div class="cb-body editable-body" data-field="body" data-id="${esc(s.id)}">${sanitizeHtml(s.body)}</div>`;
          if (!hasImgs) {
            return `
          <div class="prog-accordion-wrap${idx === 0 ? ' open' : ''} reveal-left" data-section-id="${esc(s.id)}" style="grid-column: 1 / -1">
            <div class="section-toolbar">${tbHTMLp}</div>
            <button class="prog-accordion-trigger" data-accordion-id="${esc(s.id)}" type="button">
              <div class="prog-accordion-label">
                <span class="prog-accordion-eyebrow">Section ${idx + 1}</span>
                <span class="prog-accordion-title-text editable-title" data-field="title" data-id="${esc(s.id)}">${esc(s.title)}</span>
              </div>
              <svg class="prog-accordion-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8l5 5 5-5"/></svg>
            </button>
            <div class="prog-accordion-body">
              <div class="prog-accordion-inner">
                <div class="cb-body editable-body" data-field="body" data-id="${esc(s.id)}">${sanitizeHtml(s.body)}</div>
              </div>
            </div>
          </div>`;
          }
          const imgH = s.img_height || '';
          const resizeHandle = editMode ? `<div class="sbs-resize-handle" data-resize-id="${esc(s.id)}" title="Drag to resize image"><svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M10 2L2 10M7 2L2 7M10 5L5 10"/></svg></div>` : '';
          return `
          <div class="editable-section cb-editorial${flip ? ' flip' : ''}${v.inkEdit ? ' ink' : ''} reveal-left" data-section-id="${esc(s.id)}" style="grid-column: span 12">
            <div class="section-toolbar">${tbHTMLp}</div>
            <div class="cb-photo-pane sec-sidebyside-img" style="${imgH ? `--sbs-img-h:${imgH}` : ''}">
              ${carHTML}${resizeHandle}
            </div>
            <div class="cb-text-pane sec-sidebyside-text">
              ${textHTML}
            </div>
          </div>`;
        }).join('');

        wireCarousels($container);
        wireSbsResizeHandles($container, (id, fields) => updateProgramSection(currentProgram, id, fields));

        // Wire accordion toggles
        $container.querySelectorAll('.prog-accordion-trigger').forEach(btn => {
          btn.addEventListener('click', () => {
            const wrap = btn.closest('.prog-accordion-wrap');
            wrap.classList.toggle('open');
          });
        });

        // Carousel: add image
        $container.querySelectorAll('.carousel-add-img').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.cid;
            const inp = document.createElement('input');
            inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/webp,image/gif';
            inp.onchange = async () => {
              if (!inp.files.length) return;
              const file = inp.files[0];
              if (file.size > 5*1024*1024) { alert('Max 5 MB'); return; }
              try {
                const url = await uploadImageToStorage(file);
                const progs = await fetchPrograms(false);
                const prog = progs.find(p => p.id === program.id);
                const secs = Array.isArray(prog?.sections) ? prog.sections : [];
                const sec  = secs.find(s => s.id === id) || {};
                const imgs = getSectionImages(sec); imgs.push(url);
                await updateProgramSection(program.id, id, { images: imgs, image_url: imgs[0] });
                await renderProgramPage(slug);
              } catch (err) { alert('Error: ' + err.message); }
            };
            inp.click();
          });
        });
        // Carousel: add YouTube video
        $container.querySelectorAll('.carousel-add-yt').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.cid;
            const raw = prompt('Enter YouTube URL:');
            if (!raw) return;
            const ytId = getYouTubeId(raw.trim());
            if (!ytId) { alert('Invalid YouTube URL. Please use a youtube.com or youtu.be link.'); return; }
            try {
              const progs = await fetchPrograms(false);
              const prog = progs.find(p => p.id === program.id);
              const secs = Array.isArray(prog?.sections) ? prog.sections : [];
              const sec  = secs.find(s => s.id === id) || {};
              const imgs = getSectionImages(sec); imgs.push(raw.trim());
              await updateProgramSection(program.id, id, { images: imgs, image_url: imgs[0] });
              await renderProgramPage(slug);
            } catch (err) { alert('Error: ' + err.message); }
          });
        });

        // Toolbar: add YouTube video to section
        $container.querySelectorAll('.vid-program-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id  = btn.dataset.vidbtnId;
            const raw = prompt('Enter YouTube URL:');
            if (!raw) return;
            const ytId = getYouTubeId(raw.trim());
            if (!ytId) { alert('Invalid YouTube URL. Please use a youtube.com or youtu.be link.'); return; }
            try {
              const progs = await fetchPrograms(false);
              const prog  = progs.find(p => p.id === program.id);
              const secs  = Array.isArray(prog?.sections) ? prog.sections : [];
              const sec   = secs.find(s => s.id === id) || {};
              const imgs  = getSectionImages(sec); imgs.push(raw.trim());
              await updateProgramSection(program.id, id, { images: imgs, image_url: imgs[0] });
              await renderProgramPage(slug);
            } catch (err) { alert('Error: ' + err.message); }
          });
        });

        // Carousel: remove image
        $container.querySelectorAll('.carousel-remove-btn').forEach(btn => {
          btn.addEventListener('click', async e => {
            e.stopPropagation();
            if (!confirm('Remove this image?')) return;
            const id = btn.dataset.cid; const idx = parseInt(btn.dataset.sidx);
            const progs = await fetchPrograms(false);
            const prog = progs.find(p => p.id === program.id);
            const secs = Array.isArray(prog?.sections) ? prog.sections : [];
            const sec  = secs.find(s => s.id === id) || {};
            const imgs = getSectionImages(sec); imgs.splice(idx, 1);
            await updateProgramSection(program.id, id, { images: imgs, image_url: imgs[0] || null });
            await renderProgramPage(slug);
          });
        });

        $container.querySelectorAll('.edit-section-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.editId;
            const card = $container.querySelector(`[data-section-id="${id}"]`);
            // Ensure accordion is open for editing
            card.classList.add('open');
            const $t = card.querySelector('.editable-title') || card.querySelector('.prog-accordion-title-text');
            const $b = card.querySelector('.editable-body');
            if ($t.contentEditable === 'true') {
              $t.contentEditable = 'false'; $b.contentEditable = 'false';
              const sb = card.querySelector('.inline-save-btn'); if (sb) sb.remove();
              card.querySelector('.format-toolbar')?.remove();
              updateProgramSection(program.id, id, { title: $t.textContent.trim(), body: sanitizeHtml($b.innerHTML.trim()) });
            } else {
              $t.contentEditable = 'true'; $b.contentEditable = 'true'; $t.focus();
              showFormatToolbar($b);
              if (!card.querySelector('.inline-save-btn')) {
                const sb = document.createElement('button');
                sb.className = 'inline-save-btn'; sb.textContent = 'Save Changes';
                sb.addEventListener('click', async () => {
                  await updateProgramSection(program.id, id, { title: $t.textContent.trim(), body: sanitizeHtml($b.innerHTML.trim()) });
                  $t.contentEditable = 'false'; $b.contentEditable = 'false';
                  card.querySelector('.format-toolbar')?.remove(); sb.remove();
                });
                card.appendChild(sb);
              }
            }
          });
        });
        $container.querySelectorAll('.del-section-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm('Delete this section?')) return;
            await deleteProgramSection(program.id, btn.dataset.delbtnId);
            await renderProgramPage(slug);
          });
        });
        // Primary image button — sets/replaces images[0]
        $container.querySelectorAll('.img-program-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.imgbtnId;
            const inp = document.createElement('input');
            inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/ogg';
            inp.onchange = async () => {
              if (!inp.files.length) return;
              const file = inp.files[0];
              if (file.size > 5*1024*1024) { alert('Max 5 MB'); return; }
              try {
                const url = await uploadImageToStorage(file);
                const progs = await fetchPrograms(false);
                const prog = progs.find(p => p.id === program.id);
                const secs = Array.isArray(prog?.sections) ? prog.sections : [];
                const sec  = secs.find(s => s.id === id) || {};
                const imgs = getSectionImages(sec);
                if (!imgs.length) imgs.push(url); else imgs[0] = url;
                await updateProgramSection(program.id, id, { image_url: url, images: imgs });
                await renderProgramPage(slug);
              } catch (err) { alert('Error: ' + err.message); }
            };
            inp.click();
          });
        });
      } else {
        $container.innerHTML = ''; $empty.classList.remove('view-hidden');
      }
      _applyProgramEditMode();
      if (editMode) { destroySortables(); initProgramSortable(); }
      if (typeof initReveal === 'function') setTimeout(initReveal, 60);
    }
    export function _applyProgramEditMode() {
      const $title = document.getElementById('program-page-title');
      const $desc  = document.getElementById('program-page-desc');
      if (!$title || !$title.dataset.programId) return;
      $title.contentEditable = editMode ? 'true' : 'false';
      $desc.contentEditable  = editMode ? 'true' : 'false';
      if (editMode) {
        if (!$title._saveWired) {
          $title._saveWired = true;
          const save = async () => {
            const id = $title.dataset.programId;
            if (id) await updateProgramItem(id, { name: $title.textContent.trim(), description: $desc.textContent.trim() });
          };
          $title.addEventListener('blur', save);
          $desc.addEventListener('blur', save);
        }
      }
    }

    export async function renderGalleryPage() {
      const $grid  = document.getElementById('gallery-page-grid');
      const $empty = document.getElementById('gallery-page-empty');
      const PAGE_SIZE = 8;
      const start = Number.parseInt($grid.dataset.pageStart || '0', 10) || 0;

      // Skeleton placeholders while loading
      $grid.innerHTML = Array.from({length:8},(_,i)=>`<div class="gallery-card skeleton" style="height:${[180,240,200,260,150,220,190,230][i%8]}px"></div>`).join('');
      const photos = await fetchGallery();
      if (!photos.length) { $grid.innerHTML = ''; $empty.classList.remove('view-hidden'); return; }
      $empty.classList.add('view-hidden');
      const pageStart = Math.max(0, Math.min(start, Math.max(0, photos.length - 1)));
      const page = photos.slice(pageStart, pageStart + PAGE_SIZE);

      const SVG_PENCIL = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>`;
      const SVG_TRASH  = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>`;

      $grid.innerHTML = `
        <div class="gallery-page-controls">
          <button type="button" data-gallery-page-prev ${pageStart <= 0 ? 'disabled' : ''}>← Newer</button>
          <span class="gallery-page-status">${pageStart + 1}–${Math.min(pageStart + page.length, photos.length)} of ${photos.length}</span>
          <button type="button" data-gallery-page-next ${pageStart + PAGE_SIZE >= photos.length ? 'disabled' : ''}>Older →</button>
        </div>
        ${page.map(p => {
          const ytId = getYouTubeId(p.image_url);
          const mediaEl = ytId
            ? `<div class="yt-thumb-wrap"><img src="https://img.youtube.com/vi/${ytId}/mqdefault.jpg" alt="${esc(p.caption||'Video')}" loading="lazy" /><div class="yt-play-overlay"></div></div>`
            : `<img src="${esc(p.image_url)}" alt="${esc(p.caption||'Gallery photo')}" loading="lazy" />`;
          return `
          <div class="gallery-card" data-photo-id="${esc(p.id)}" data-lburl="${esc(p.image_url)}" data-lbcap="${esc(p.caption||'')}">
            <button class="gallery-card-delete-btn" data-del-id="${esc(p.id)}" data-del-url="${esc(p.image_url)}" title="Delete photo">${SVG_TRASH}</button>
            <button class="gallery-card-edit-btn" title="Edit caption">${SVG_PENCIL}</button>
            <div class="gallery-card-img-wrap">${mediaEl}</div>
            ${p.caption ? `<div class="gallery-card-caption">${esc(p.caption)}</div>` : ''}
          </div>`;
        }).join('')}
      `;

      $grid.dataset.pageStart = String(pageStart);
      $grid.querySelector('[data-gallery-page-prev]')?.addEventListener('click', () => {
        $grid.dataset.pageStart = String(Math.max(0, pageStart - PAGE_SIZE));
        renderGalleryPage();
      });
      $grid.querySelector('[data-gallery-page-next]')?.addEventListener('click', () => {
        $grid.dataset.pageStart = String(pageStart + PAGE_SIZE);
        renderGalleryPage();
      });

      // Lightbox on image click
      $grid.querySelectorAll('.gallery-card').forEach(card => {
        card.addEventListener('click', e => {
          if (e.target.closest('.gallery-card-edit-btn') || e.target.closest('.gallery-card-delete-btn')) return;
          if (card.querySelector('.gallery-caption-edit-row')) return; // editing in progress
          openLightbox(card.dataset.lburl, card.dataset.lbcap);
        });
      });

      // Inline caption editing
      $grid.querySelectorAll('.gallery-card-edit-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const card = btn.closest('.gallery-card');
          if (card.querySelector('.gallery-caption-edit-row')) return; // already open
          const id      = card.dataset.photoId;
          const current = card.dataset.lbcap || '';
          const $existing = card.querySelector('.gallery-card-caption');
          if ($existing) $existing.remove();
          const row = document.createElement('div');
          row.className = 'gallery-caption-edit-row';
          row.innerHTML = `<input class="gallery-caption-input" type="text" placeholder="Add a caption…" value="${esc(current)}" />
            <button class="gallery-caption-save-btn" title="Save">✓</button>
            <button class="gallery-caption-cancel-btn" title="Cancel">✕</button>`;
          card.appendChild(row);
          const $input  = row.querySelector('.gallery-caption-input');
          const $save   = row.querySelector('.gallery-caption-save-btn');
          const $cancel = row.querySelector('.gallery-caption-cancel-btn');
          $input.focus();
          const doSave = async () => {
            const val = $input.value.trim();
            card.dataset.lbcap = val;
            row.remove();
            if (val) {
              const cap = document.createElement('div');
              cap.className = 'gallery-card-caption';
              cap.textContent = val;
              card.appendChild(cap);
            }
            await updateGalleryCaption(id, val).catch(err => alert('Save failed: ' + err.message));
          };
          const doCancel = () => {
            row.remove();
            if (current) {
              const cap = document.createElement('div');
              cap.className = 'gallery-card-caption';
              cap.textContent = current;
              card.appendChild(cap);
            }
          };
          $save.addEventListener('click', e => { e.stopPropagation(); doSave(); });
          $cancel.addEventListener('click', e => { e.stopPropagation(); doCancel(); });
          $input.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); doSave(); }
            if (e.key === 'Escape') doCancel();
          });
        });
      });

      // Delete from gallery page (edit mode)
      $grid.querySelectorAll('.gallery-card-delete-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
          e.stopPropagation();
          if (!confirm('Delete this photo?')) return;
          const id  = btn.dataset.delId;
          const url = btn.dataset.delUrl;
          if (await deleteGalleryItem(id, url)) {
            await renderHomeGallery();
            await renderHeroPhoto();
            await renderAdminGallery();
            const remaining = photos.length - 1;
            const nextStart = remaining <= 0 ? 0 : Math.min(pageStart, Math.max(0, remaining - 1));
            $grid.dataset.pageStart = String(nextStart);
            await renderGalleryPage();
          }
        });
      });

      if (editMode) { destroySortables(); initGalleryPageSortable(); }
    }

    export async function renderTosPage() {
      const tos = await fetchTosSettings();
      const $title = document.getElementById('tos-page-title');
      const $subtitle = document.getElementById('tos-page-subtitle');
      const $container = document.getElementById('tos-content-container');
      const $empty = document.getElementById('tos-content-empty');
      renderSkeletonCards('tos-content-container', 3);
      $title.textContent = tos.title || 'Terms of Service';
      $subtitle.textContent = tos.subtitle || '';
      const sections = Array.isArray(tos.sections) ? tos.sections.sort((a,b) => (a.display_order||0)-(b.display_order||0)) : [];
      if (!sections.length) {
        $container.innerHTML = '';
        $empty.classList.remove('view-hidden');
        return;
      }
      $empty.classList.add('view-hidden');
      $container.classList.add('cb-grid');
      const variants_tp = computeVariants(sections);
      const SVG_DRAG   = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg>`;
      const SVG_PENCIL = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>`;
      const SVG_TRASH  = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>`;
      $container.innerHTML = sections.map((s, idx) => {
        const v = variants_tp[idx];
        return `
        <div class="editable-section content-block" data-tone="${v.tone}" data-section-id="${esc(s.id)}" style="grid-column: span ${v.span}">
          <div class="section-toolbar">
            <div class="drag-handle" title="Drag to reorder">${SVG_DRAG}</div>
            <button class="edit-section-btn" title="Edit inline" data-edit-id="${esc(s.id)}">${SVG_PENCIL}</button>
            <button class="del-section-btn" title="Delete section" data-delbtn-id="${esc(s.id)}">${SVG_TRASH}</button>
          </div>
          <h3 class="cb-title editable-title" data-field="title" data-id="${esc(s.id)}">${esc(s.title)}</h3>
          <div class="cb-body editable-body" data-field="body" data-id="${esc(s.id)}">${sanitizeHtml(s.body)}</div>
        </div>`;
      }).join('');

      $container.querySelectorAll('.edit-section-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.editId;
          const card = $container.querySelector(`[data-section-id="${id}"]`);
          const $t = card.querySelector('.editable-title'), $b = card.querySelector('.editable-body');
          if ($t.contentEditable === 'true') {
            $t.contentEditable = 'false'; $b.contentEditable = 'false';
            const sb = card.querySelector('.inline-save-btn'); if (sb) sb.remove();
            card.querySelector('.format-toolbar')?.remove();
            updateTosSection(id, { title: $t.textContent.trim(), body: sanitizeHtml($b.innerHTML.trim()) });
          } else {
            $t.contentEditable = 'true'; $b.contentEditable = 'true'; $t.focus();
            showFormatToolbar($b);
            if (!card.querySelector('.inline-save-btn')) {
              const sb = document.createElement('button');
              sb.className = 'inline-save-btn'; sb.textContent = 'Save Changes';
              sb.addEventListener('click', async () => {
                await updateTosSection(id, { title: $t.textContent.trim(), body: sanitizeHtml($b.innerHTML.trim()) });
                $t.contentEditable = 'false'; $b.contentEditable = 'false';
                card.querySelector('.format-toolbar')?.remove(); sb.remove();
              });
              card.appendChild(sb);
            }
          }
        });
      });
      $container.querySelectorAll('.del-section-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this section?')) return;
          await deleteTosSection(btn.dataset.delbtnId);
          await renderTosPage();
          await renderAdminTosSettings();
        });
      });
      if (editMode) { destroySortables(); initTosSortable(); }
    }

    export async function populateProgramsDropdown() {
      const programs  = await fetchPrograms();
      const $dropdown = document.getElementById('programs-dropdown');
      const $mobList  = document.getElementById('mob-programs-list');
      if (!programs.length) {
        $dropdown.innerHTML = '<span class="programs-dropdown-item opacity-50 cursor-default">No programs added yet</span>';
        if ($mobList) $mobList.innerHTML = '';
        return;
      }
      $dropdown.innerHTML = programs.map(p =>
        `<button class="programs-dropdown-item" data-program-slug="${esc(p.slug)}">${esc(p.name)}</button>`
      ).join('');
      $dropdown.querySelectorAll('[data-program-slug]').forEach(btn => {
        btn.addEventListener('click', () => {
          closeProgramsDropdown();
          showView('programs', btn.dataset.programSlug);
        });
      });
      // Mirror into mobile drawer
      if ($mobList) {
        $mobList.innerHTML = programs.map(p =>
          `<button class="mobile-nav-item" data-mob-program-slug="${esc(p.slug)}">${esc(p.name)}</button>`
        ).join('');
        $mobList.querySelectorAll('[data-mob-program-slug]').forEach(btn => {
          btn.addEventListener('click', () => {
            closeDrawer();
            showView('programs', btn.dataset.mobProgramSlug);
          });
        });
      }
    }

    // ════════════════════════════════════════════════