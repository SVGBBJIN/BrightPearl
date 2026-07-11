import { DEFAULT_VALUES, VALUE_CARD_ICONS, VALUE_ICON_LABELS, currentView, editMode, homeProgramsSortable, setHomeProgramsSortable } from './state.js';
import { showView } from './auth.js';
import { deleteAboutSection, fetchAboutSections, fetchPdfs, fetchPrograms, fetchSetting, saveSetting } from './data.js';
import { destroySortables, initAboutSortable, initHomeProgramsSortable, updateAboutSection, updateProgramItem, uploadImageToStorage } from './visual-editor.js';
import { fetchContactInfo, renderHomeFaq, renderHomeValuesCards, renderSkeletonCards } from './home.js';
import { renderAdminAbout } from './admin.js';
import { esc, getYouTubeId, isVideoUrl, sanitizeHtml, showFormatToolbar } from './utils.js';
import { initReveal } from './main.js';

    //  HOMEPAGE — Programs & Classes grid
    // ════════════════════════════════════════════════
    export async function loadProgramsHeaderText() {
      const data = await fetchSetting('programs_header_text');
      if (!data) return;
      const map = { eyebrow: 'programs-eyebrow-el', title: 'programs-title-el', sub: 'programs-sub-el' };
      Object.entries(map).forEach(([k, id]) => {
        const el = document.getElementById(id);
        if (el && typeof data[k] === 'string' && data[k].trim()) el.textContent = data[k];
      });
    }
    async function saveProgramsHeaderText() {
      const payload = {
        eyebrow: (document.getElementById('programs-eyebrow-el')?.textContent || '').trim(),
        title:   (document.getElementById('programs-title-el')?.textContent   || '').trim(),
        sub:     (document.getElementById('programs-sub-el')?.textContent     || '').trim(),
      };
      try { await saveSetting('programs_header_text', payload); } catch (e) { console.error(e); }
    }
    export function initProgramsHeaderEdit() {
      ['programs-eyebrow-el','programs-title-el','programs-sub-el'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.contentEditable = editMode ? 'true' : 'false';
        if (el.dataset.editWired) return;
        el.dataset.editWired = '1';
        el.addEventListener('blur', () => { if (editMode) saveProgramsHeaderText(); });
        el.addEventListener('keydown', e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); el.blur(); }
        });
      });
    }
    export async function renderHomePrograms() {
      const $grid = document.getElementById('home-programs-grid');
      if (!$grid) return;
      const programs = await fetchPrograms();
      if (!programs.length) {
        $grid.innerHTML = '<p class="text-ink/40 text-sm italic text-center py-4">Programs coming soon.</p>';
        return;
      }

      const SVG_DRAG   = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg>`;
      const SVG_PENCIL = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>`;
      const SVG_CAM    = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/></svg>`;

      const PROG_PHOTOS = ['dance', 'mandarin', 'stem', 'music', 'adult', 'camp'];
      $grid.innerHTML = programs.map((p, idx) => `
        <div class="hp-program-card cb-zigzag${idx % 2 === 1 ? ' flip' : ''}" data-prog-id="${esc(p.id)}">
          <div class="cb-zigzag-photo prog-icon-wrap" data-prog-id="${esc(p.id)}">
            <div class="cb-photo ${PROG_PHOTOS[idx % PROG_PHOTOS.length]}"></div>
            ${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}" class="hp-program-photo-img" />` : (p.icon_url ? `<img src="${esc(p.icon_url)}" alt="" aria-hidden="true" class="cb-prog-icon-img" />` : '')}
            <div class="hp-photo-upload-overlay prog-icon-upload-overlay">${SVG_CAM}<span>${p.image_url ? 'Change photo' : 'Add photo'}</span></div>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="prog-icon-file" data-prog-id="${esc(p.id)}" style="display:none" />
          </div>
          <div class="cb-zigzag-text">
            <div class="prog-card-toolbar">
              <div class="drag-handle" title="Drag to reorder">${SVG_DRAG}</div>
              <button class="prog-edit-btn" data-prog-id="${esc(p.id)}" title="Edit card">${SVG_PENCIL}</button>
            </div>
            <p class="cb-eyebrow">Program</p>
            <h3 class="hp-program-name prog-name-el" data-prog-id="${esc(p.id)}">${esc(p.name)}</h3>
            <p class="hp-program-desc prog-desc-el" data-prog-id="${esc(p.id)}">${esc(p.description || '')}</p>
            <div class="hp-program-btns">
              <button class="hp-program-btn-learn" data-slug="${esc(p.slug)}">Learn More</button>
              <button class="hp-program-btn-enroll">Enroll Now</button>
            </div>
          </div>
        </div>`).join('') + `
      <div class="prog-add-row">
        <p class="text-ink/50 text-sm italic">Add new programs from the <button class="text-imperial hover:underline font-medium" id="hp-prog-goto-admin">Admin Dashboard</button></p>
      </div>`;

      $grid.querySelectorAll('.hp-program-btn-learn').forEach(btn => {
        btn.addEventListener('click', () => showView('programs', btn.dataset.slug));
      });
      $grid.querySelectorAll('.hp-program-btn-enroll').forEach(btn => {
        btn.addEventListener('click', () => showView('register'));
      });

      // Icon upload overlay click
      $grid.querySelectorAll('.prog-icon-upload-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
          if (!editMode) return;
          e.stopPropagation();
          overlay.closest('.prog-icon-wrap')?.querySelector('.prog-icon-file')?.click();
        });
      });

      // Icon file input change
      $grid.querySelectorAll('.prog-icon-file').forEach(input => {
        input.addEventListener('change', async () => {
          const file   = input.files[0]; if (!file) return;
          const progId = input.dataset.progId;
          const overlay = input.closest('.prog-icon-wrap')?.querySelector('.prog-icon-upload-overlay');
          if (overlay) overlay.innerHTML = '<span>Uploading…</span>';
          try {
            const url = await uploadImageToStorage(file);
            await updateProgramItem(progId, { image_url: url });
            if (homeProgramsSortable) { homeProgramsSortable.destroy(); setHomeProgramsSortable(null); }
            await renderHomePrograms();
            if (editMode) initHomeProgramsSortable();
          } catch (err) {
            if (overlay) overlay.innerHTML = SVG_CAM + '<span>Change photo</span>';
            alert('Upload failed: ' + err.message);
          }
          input.value = '';
        });
      });

      // Pencil → contentEditable inline edit
      $grid.querySelectorAll('.prog-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const progId = btn.dataset.progId;
          const card   = $grid.querySelector(`.hp-program-card[data-prog-id="${progId}"]`);
          const $name  = card.querySelector('.prog-name-el');
          const $desc  = card.querySelector('.prog-desc-el');
          if ($name.contentEditable === 'true') {
            [$name, $desc].forEach(el => { el.contentEditable = 'false'; el.style.outline = ''; });
            card.querySelector('.prog-inline-save')?.remove();
            updateProgramItem(progId, { name: $name.textContent.trim(), description: $desc.textContent.trim() });
          } else {
            [$name, $desc].forEach(el => {
              el.contentEditable = 'true';
              el.style.outline = '1px dashed rgb(var(--imperial-rgb) / 0.4)';
              el.style.borderRadius = '3px';
            });
            $name.focus();
            if (!card.querySelector('.prog-inline-save')) {
              const sb = document.createElement('button');
              sb.className = 'prog-inline-save inline-save-btn';
              sb.textContent = 'Save Changes';
              sb.addEventListener('click', async () => {
                [$name, $desc].forEach(el => { el.contentEditable = 'false'; el.style.outline = ''; el.style.borderRadius = ''; });
                sb.remove();
                await updateProgramItem(progId, { name: $name.textContent.trim(), description: $desc.textContent.trim() });
                if (homeProgramsSortable) { homeProgramsSortable.destroy(); setHomeProgramsSortable(null); }
                await renderHomePrograms();
                if (editMode) initHomeProgramsSortable();
              });
              // Insert before buttons row
              const btnsRow = card.querySelector('.hp-program-btns');
              btnsRow ? card.insertBefore(sb, btnsRow) : card.appendChild(sb);
            }
          }
        });
      });

      // Admin link from add-row
      document.getElementById('hp-prog-goto-admin')?.addEventListener('click', () => showView('admin'));

      // Init sortable if already in edit mode
      if (editMode) initHomeProgramsSortable();
    }

    export async function renderAdminContactInfo() {
      const ci = await fetchContactInfo();
      document.getElementById('ci-email').value    = ci.email    || '';
      document.getElementById('ci-phone').value    = ci.phone    || '';
      document.getElementById('ci-location').value = ci.location || '';
      document.getElementById('ci-helper').value   = ci.helper_text || '';
      document.getElementById('ci-facebook').value = ci.facebook || '';
      document.getElementById('ci-youtube').value  = ci.youtube  || '';
      document.getElementById('ci-wechat').value   = ci.wechat   || '';
    }

    let faqAdminSortable = null;
    export async function renderAdminFaq() {
      const raw   = await fetchSetting('faq_data');
      const items = Array.isArray(raw) ? raw.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)) : [];
      const $list  = document.getElementById('admin-faq-list');
      const $empty = document.getElementById('admin-faq-empty');
      if (faqAdminSortable) { faqAdminSortable.destroy(); faqAdminSortable = null; }
      if (!items.length) { $list.innerHTML = ''; $empty.classList.remove('view-hidden'); return; }
      $empty.classList.add('view-hidden');
      $list.innerHTML = items.map(item => `
        <div class="faq-admin-item bg-cream/60 border border-imperial/10 rounded-lg overflow-hidden" data-faq-id="${esc(item.id)}">
          <div class="flex items-start gap-2 px-3 py-2.5">
            <div class="faq-drag-handle flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing text-ink/25 hover:text-ink/50 transition-colors" title="Drag to reorder">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-ink faq-display-q">${esc(item.question)}</p>
              <p class="text-xs text-ink/50 faq-display-a">${esc((item.answer || '').substring(0, 90))}${(item.answer || '').length > 90 ? '…' : ''}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button data-edit-faq="${esc(item.id)}" class="text-ink/50 hover:text-imperial text-xs font-medium transition-colors">Edit</button>
              <button data-del-faq="${esc(item.id)}"  class="text-imperial hover:underline text-xs font-medium">Delete</button>
            </div>
          </div>
          <div class="faq-inline-edit view-hidden px-3 pb-3 space-y-2 border-t border-imperial/8 pt-2.5">
            <input data-faq-edit-q="${esc(item.id)}" type="text" value="${esc(item.question)}"
              class="w-full px-2.5 py-1.5 rounded border border-imperial/15 bg-cream text-ink text-sm focus:outline-none focus:border-imperial" placeholder="Question" />
            <textarea data-faq-edit-a="${esc(item.id)}" rows="2"
              class="w-full px-2.5 py-1.5 rounded border border-imperial/15 bg-cream text-ink text-sm focus:outline-none focus:border-imperial resize-y" placeholder="Answer">${esc(item.answer || '')}</textarea>
            <div class="flex gap-2">
              <button data-save-faq="${esc(item.id)}" class="btn-imperial px-3 py-1 rounded text-xs font-medium">Save</button>
              <button data-cancel-faq="${esc(item.id)}" class="px-3 py-1 rounded text-xs font-medium border border-imperial/20 text-ink/60 hover:border-imperial/40">Cancel</button>
            </div>
          </div>
        </div>`).join('');

      // Wire up edit / cancel / save / delete
      $list.querySelectorAll('[data-edit-faq]').forEach(b => {
        b.addEventListener('click', () => {
          const card = $list.querySelector(`[data-faq-id="${b.dataset.editFaq}"]`);
          card.querySelector('.faq-inline-edit').classList.remove('view-hidden');
          b.textContent = '▲';
          b.dataset.editOpen = 'true';
        });
      });
      $list.querySelectorAll('[data-cancel-faq]').forEach(b => {
        b.addEventListener('click', () => {
          const card   = $list.querySelector(`[data-faq-id="${b.dataset.cancelFaq}"]`);
          const editBtn = card.querySelector('[data-edit-faq]');
          card.querySelector('.faq-inline-edit').classList.add('view-hidden');
          if (editBtn) { editBtn.textContent = 'Edit'; delete editBtn.dataset.editOpen; }
        });
      });
      $list.querySelectorAll('[data-save-faq]').forEach(b => {
        b.addEventListener('click', async () => {
          const id       = b.dataset.saveFaq;
          const card     = $list.querySelector(`[data-faq-id="${id}"]`);
          const question = card.querySelector(`[data-faq-edit-q]`).value.trim();
          const answer   = card.querySelector(`[data-faq-edit-a]`).value.trim();
          if (!question || !answer) return;
          b.textContent = 'Saving…'; b.disabled = true;
          const current = await fetchSetting('faq_data');
          const list    = Array.isArray(current) ? current : [];
          const updated = list.map(f => f.id === id ? { ...f, question, answer } : f);
          await saveSetting('faq_data', updated);
          b.textContent = 'Save'; b.disabled = false;
          await renderAdminFaq();
          if (currentView === 'home') await renderHomeFaq();
        });
      });
      $list.querySelectorAll('[data-del-faq]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Delete this FAQ item?')) return;
        const current = await fetchSetting('faq_data');
        const updated = Array.isArray(current) ? current.filter(f => f.id !== b.dataset.delFaq) : [];
        await saveSetting('faq_data', updated);
        await renderAdminFaq();
        if (currentView === 'home') await renderHomeFaq();
      }));

      // Drag-and-drop reordering
      faqAdminSortable = Sortable.create($list, {
        handle: '.faq-drag-handle',
        animation: 180,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onEnd: async () => {
          const ids     = Array.from($list.querySelectorAll('[data-faq-id]')).map(el => el.dataset.faqId);
          const current = await fetchSetting('faq_data');
          if (!Array.isArray(current)) return;
          const reordered = ids.map((id, idx) => {
            const item = current.find(f => f.id === id);
            return item ? { ...item, display_order: idx } : null;
          }).filter(Boolean);
          await saveSetting('faq_data', reordered);
          if (currentView === 'home') await renderHomeFaq();
        }
      });
    }

    // ── Icon picker HTML helper ────────────────────
    function buildIconPickerHtml(containerId, selectedKey) {
      return Object.entries(VALUE_ICON_LABELS).map(([key, label]) => `
        <button type="button" data-icon-pick="${esc(key)}" data-picker-for="${esc(containerId)}"
          class="val-icon-pick-btn flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all cursor-pointer
            ${key === selectedKey
              ? 'border-imperial bg-imperial/12 ring-2 ring-imperial/40'
              : 'border-imperial/15 bg-cream hover:border-imperial/40'}"
          title="${esc(label)}">
          <span class="w-7 h-7 flex items-center justify-center">${VALUE_CARD_ICONS[key]}</span>
          <span class="text-ink/70 leading-tight">${esc(label)}</span>
        </button>`).join('');
    }

    let valuesAdminSortable = null;
    export async function renderAdminValues() {
      const raw    = await fetchSetting('values_data');
      const items  = Array.isArray(raw) && raw.length
        ? raw.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        : DEFAULT_VALUES;
      const $list  = document.getElementById('admin-values-list');
      const $empty = document.getElementById('admin-values-empty');
      if (!$list) return;
      if (valuesAdminSortable) { valuesAdminSortable.destroy(); valuesAdminSortable = null; }

      // Populate the Add form icon picker
      const $addPicker = document.getElementById('val-icon-picker-add');
      if ($addPicker && !$addPicker.children.length) {
        const curKey = document.getElementById('val-icon-key')?.value || 'dance';
        $addPicker.innerHTML = buildIconPickerHtml('add', curKey);
        wireIconPickerButtons($addPicker, 'val-icon-key');
      }

      if (!items.length) { $list.innerHTML = ''; $empty.classList.remove('view-hidden'); return; }
      $empty.classList.add('view-hidden');

      $list.innerHTML = items.map(item => `
        <div class="val-admin-item bg-cream/60 border border-imperial/10 rounded-lg overflow-hidden" data-val-id="${esc(item.id)}">
          <div class="flex items-start gap-2 px-3 py-2.5">
            <div class="val-drag-handle flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing text-ink/25 hover:text-ink/50 transition-colors" title="Drag to reorder">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg>
            </div>
            <span class="w-6 h-6 flex-shrink-0 flex items-center justify-center mt-0.5">${VALUE_CARD_ICONS[item.icon_key] || VALUE_CARD_ICONS['star']}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-ink">${esc(item.title)}</p>
              <p class="text-xs text-ink/50">${esc((item.body || '').substring(0, 80))}${(item.body || '').length > 80 ? '…' : ''}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button data-edit-val="${esc(item.id)}" class="text-ink/50 hover:text-imperial text-xs font-medium transition-colors">Edit</button>
              <button data-del-val="${esc(item.id)}"  class="text-imperial hover:underline text-xs font-medium">Delete</button>
            </div>
          </div>
          <div class="val-inline-edit view-hidden px-3 pb-3 space-y-2 border-t border-imperial/8 pt-2.5">
            <div>
              <p class="text-xs font-medium text-ink/70 mb-1.5">Icon</p>
              <div class="val-edit-icon-picker flex flex-wrap gap-1.5" data-val-edit-id="${esc(item.id)}">
                ${buildIconPickerHtml('edit-' + esc(item.id), item.icon_key || 'star')}
              </div>
              <input type="hidden" class="val-edit-icon-key" value="${esc(item.icon_key || 'star')}" />
            </div>
            <input data-val-edit-title="${esc(item.id)}" type="text" value="${esc(item.title)}"
              class="w-full px-2.5 py-1.5 rounded border border-imperial/15 bg-cream text-ink text-sm focus:outline-none focus:border-imperial" placeholder="Title" />
            <textarea data-val-edit-body="${esc(item.id)}" rows="3"
              class="w-full px-2.5 py-1.5 rounded border border-imperial/15 bg-cream text-ink text-sm focus:outline-none focus:border-imperial resize-y" placeholder="Body text">${esc(item.body || '')}</textarea>
            <div class="flex gap-2">
              <button data-save-val="${esc(item.id)}" class="btn-imperial px-3 py-1 rounded text-xs font-medium">Save</button>
              <button data-cancel-val="${esc(item.id)}" class="px-3 py-1 rounded text-xs font-medium border border-imperial/20 text-ink/60 hover:border-imperial/40">Cancel</button>
            </div>
          </div>
        </div>`).join('');

      // Wire edit/cancel/save/delete
      $list.querySelectorAll('[data-edit-val]').forEach(b => {
        b.addEventListener('click', () => {
          const card = $list.querySelector(`[data-val-id="${b.dataset.editVal}"]`);
          card.querySelector('.val-inline-edit').classList.remove('view-hidden');
          const picker = card.querySelector('.val-edit-icon-picker');
          const hiddenKey = card.querySelector('.val-edit-icon-key');
          if (picker) wireIconPickerButtons(picker, null, hiddenKey);
          b.textContent = '▲';
        });
      });
      $list.querySelectorAll('[data-cancel-val]').forEach(b => {
        b.addEventListener('click', () => {
          const card    = $list.querySelector(`[data-val-id="${b.dataset.cancelVal}"]`);
          const editBtn = card.querySelector('[data-edit-val]');
          card.querySelector('.val-inline-edit').classList.add('view-hidden');
          if (editBtn) editBtn.textContent = 'Edit';
        });
      });
      $list.querySelectorAll('[data-save-val]').forEach(b => {
        b.addEventListener('click', async () => {
          const id    = b.dataset.saveVal;
          const card  = $list.querySelector(`[data-val-id="${id}"]`);
          const title = card.querySelector(`[data-val-edit-title]`).value.trim();
          const body  = card.querySelector(`[data-val-edit-body]`).value.trim();
          const icon_key = card.querySelector('.val-edit-icon-key')?.value || 'star';
          if (!title || !body) return;
          b.textContent = 'Saving…'; b.disabled = true;
          const current = await fetchSetting('values_data');
          const list    = Array.isArray(current) && current.length ? current : DEFAULT_VALUES;
          const updated = list.map(v => v.id === id ? { ...v, title, body, icon_key } : v);
          await saveSetting('values_data', updated);
          b.textContent = 'Save'; b.disabled = false;
          await renderAdminValues();
          if (currentView === 'home') await renderHomeValuesCards();
        });
      });
      $list.querySelectorAll('[data-del-val]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Delete this value card?')) return;
        const current = await fetchSetting('values_data');
        const list    = Array.isArray(current) && current.length ? current : DEFAULT_VALUES;
        const updated = list.filter(v => v.id !== b.dataset.delVal);
        await saveSetting('values_data', updated);
        await renderAdminValues();
        if (currentView === 'home') await renderHomeValuesCards();
      }));

      // Drag-and-drop reordering
      valuesAdminSortable = Sortable.create($list, {
        handle: '.val-drag-handle',
        animation: 180,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onEnd: async () => {
          const ids     = Array.from($list.querySelectorAll('[data-val-id]')).map(el => el.dataset.valId);
          const current = await fetchSetting('values_data');
          const list    = Array.isArray(current) && current.length ? current : DEFAULT_VALUES;
          const reordered = ids.map((id, idx) => {
            const item = list.find(v => v.id === id);
            return item ? { ...item, display_order: idx } : null;
          }).filter(Boolean);
          await saveSetting('values_data', reordered);
          if (currentView === 'home') await renderHomeValuesCards();
        }
      });
    }

    // Wire icon picker buttons — sets value in a hidden input or named input by id
    function wireIconPickerButtons(pickerEl, hiddenInputId, hiddenInputEl) {
      pickerEl.querySelectorAll('[data-icon-pick]').forEach(btn => {
        btn.addEventListener('click', () => {
          pickerEl.querySelectorAll('[data-icon-pick]').forEach(b => {
            b.classList.remove('border-imperial', 'bg-imperial/12', 'ring-2', 'ring-imperial/40');
            b.classList.add('border-imperial/15', 'bg-cream');
          });
          btn.classList.add('border-imperial', 'bg-imperial/12', 'ring-2', 'ring-imperial/40');
          btn.classList.remove('border-imperial/15', 'bg-cream');
          const key = btn.dataset.iconPick;
          if (hiddenInputId) {
            const inp = document.getElementById(hiddenInputId);
            if (inp) inp.value = key;
          }
          if (hiddenInputEl) hiddenInputEl.value = key;
        });
      });
    }

    export async function renderTestimonials() {
      const raw   = await fetchSetting('testimonials_data');
      const items = Array.isArray(raw) ? raw.sort((a,b) => (a.display_order||0)-(b.display_order||0)) : [];
      const $grid  = document.getElementById('testimonials-grid');
      const $empty = document.getElementById('testimonials-empty');
      if (!$grid) return;
      if (!items.length) {
        $grid.innerHTML = '';
        $empty?.classList.remove('view-hidden');
        return;
      }
      $empty?.classList.add('view-hidden');
      $grid.innerHTML = items.map(t => `
        <div class="hp-tm-card editable-section" data-tm-id="${esc(t.id)}">
          <div class="section-toolbar" style="display:none; position:absolute; top:0.5rem; right:0.5rem; gap:0.35rem; align-items:center;">
            <button class="tm-edit-btn toolbar-btn" title="Edit" data-tm-id="${esc(t.id)}">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
            </button>
            <button class="tm-delete-btn toolbar-btn" title="Delete" data-tm-id="${esc(t.id)}" style="color:rgb(239,68,68)">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <span class="tm-quote-mark">&ldquo;</span>
          <p class="tm-text">${esc(t.quote)}</p>
          <div class="tm-author">
            <div class="tm-avatar">${esc((t.name||'?')[0])}</div>
            <div>
              <p class="tm-name">${esc(t.name)}</p>
              ${t.role ? `<p class="tm-role">${esc(t.role)}</p>` : ''}
            </div>
          </div>
        </div>
      `).join('');

      // Wire edit/delete buttons
      $grid.querySelectorAll('.tm-edit-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id   = btn.dataset.tmId;
          const all  = await fetchSetting('testimonials_data');
          const item = (Array.isArray(all) ? all : []).find(t => t.id === id);
          if (!item) return;
          const newName  = prompt('Name:', item.name  || ''); if (newName  === null) return;
          const newRole  = prompt('Role:', item.role  || '');
          const newQuote = prompt('Quote:', item.quote || ''); if (newQuote === null) return;
          const updated  = (Array.isArray(all) ? all : []).map(t => t.id === id ? { ...t, name: newName.trim(), role: (newRole||'').trim(), quote: newQuote.trim() } : t);
          await saveSetting('testimonials_data', updated);
          if (currentView === 'home') await renderTestimonials();
          await renderAdminTestimonials();
        });
      });
      $grid.querySelectorAll('.tm-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this testimonial?')) return;
          const id  = btn.dataset.tmId;
          const all = await fetchSetting('testimonials_data');
          const updated = (Array.isArray(all) ? all : []).filter(t => t.id !== id);
          await saveSetting('testimonials_data', updated);
          if (currentView === 'home') await renderTestimonials();
          await renderAdminTestimonials();
        });
      });
      // Re-observe new cards after async inject
      if (typeof initReveal === 'function') setTimeout(initReveal, 60);
    }

    export async function renderAdminTestimonials() {
      const raw   = await fetchSetting('testimonials_data');
      const items = Array.isArray(raw) ? raw.sort((a,b) => (a.display_order||0)-(b.display_order||0)) : [];
      const $list  = document.getElementById('admin-testimonials-list');
      const $empty = document.getElementById('admin-testimonials-empty');
      if (!items.length) { $list.innerHTML = ''; $empty.classList.remove('view-hidden'); return; }
      $empty.classList.add('view-hidden');
      $list.innerHTML = items.map(item => `
        <div class="bg-cream/60 border border-imperial/10 rounded-lg overflow-hidden" data-tm-id="${esc(item.id)}">
          <div class="flex items-start gap-3 px-4 py-3">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-ink truncate">${esc(item.name)}</p>
              ${item.role ? `<p class="text-xs text-ink/45 truncate">${esc(item.role)}</p>` : ''}
              <p class="text-xs text-ink/60 mt-1 line-clamp-2">${esc(item.quote)}</p>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <button class="tm-admin-edit-btn text-xs text-imperial/70 hover:text-imperial border border-imperial/15 rounded px-2 py-1 transition-colors" data-tm-id="${esc(item.id)}">Edit</button>
              <button class="tm-admin-delete-btn text-xs text-red-500/70 hover:text-red-600 border border-red-200/50 rounded px-2 py-1 transition-colors" data-tm-id="${esc(item.id)}">Delete</button>
            </div>
          </div>
        </div>
      `).join('');

      $list.querySelectorAll('.tm-admin-edit-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id   = btn.dataset.tmId;
          const all  = await fetchSetting('testimonials_data');
          const item = (Array.isArray(all) ? all : []).find(t => t.id === id);
          if (!item) return;
          const newName  = prompt('Name:', item.name  || ''); if (newName  === null) return;
          const newRole  = prompt('Role:', item.role  || '');
          const newQuote = prompt('Quote:', item.quote || ''); if (newQuote === null) return;
          const updated  = (Array.isArray(all) ? all : []).map(t => t.id === id ? { ...t, name: newName.trim(), role: (newRole||'').trim(), quote: newQuote.trim() } : t);
          await saveSetting('testimonials_data', updated);
          if (currentView === 'home') await renderTestimonials();
          await renderAdminTestimonials();
        });
      });
      $list.querySelectorAll('.tm-admin-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this testimonial?')) return;
          const id  = btn.dataset.tmId;
          const all = await fetchSetting('testimonials_data');
          const updated = (Array.isArray(all) ? all : []).filter(t => t.id !== id);
          await saveSetting('testimonials_data', updated);
          if (currentView === 'home') await renderTestimonials();
          await renderAdminTestimonials();
        });
      });
    }

    // ════════════════════════════════════════════════
    // ════════════════════════════════════════════════
    //  CAROUSEL & LAYOUT HELPERS
    // ════════════════════════════════════════════════
    function getSectionLayout() { return 'sidebyside'; }
    export function getSectionImages(s) {
      if (Array.isArray(s.images) && s.images.length) return s.images;
      if (s.image_url) return [s.image_url];
      return [];
    }
    const _SVG_PREV = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>`;
    const _SVG_NEXT = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>`;
    export function buildCarouselHTML(images, sectionId, isEdit) {
      if (!images.length) return '';
      const slides = images.map((url, i) => {
        const ytId = getYouTubeId(url);
        const mediaEl = ytId
          ? `<iframe src="https://www.youtube.com/embed/${ytId}" class="sec-carousel-yt" frameborder="0" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>`
          : `<img src="${esc(url)}" alt="" loading="lazy" class="sec-carousel-img" />`;
        return `
        <div class="sec-carousel-slide${i === 0 ? ' active' : ''}" data-slide="${i}" data-is-yt="${ytId ? '1' : '0'}">
          ${mediaEl}
          <button class="carousel-remove-btn" data-cid="${esc(sectionId)}" data-sidx="${i}" title="Remove">×</button>
        </div>`;
      }).join('');
      const nav = images.length > 1 ? `
        <button class="carousel-btn carousel-prev" aria-label="Previous">${_SVG_PREV}</button>
        <button class="carousel-btn carousel-next" aria-label="Next">${_SVG_NEXT}</button>` : '';
      const dots = images.length > 1 ? `
        <div class="carousel-dots">${images.map((_, i) =>
          `<button class="carousel-dot${i === 0 ? ' active' : ''}" data-idx="${i}"></button>`).join('')}
        </div>` : '';
      return `
        <div class="sec-carousel" data-cid="${esc(sectionId)}" data-cur="0">
          <div class="sec-carousel-track">${slides}</div>${nav}${dots}
        </div>
        ${isEdit ? `
        <button class="carousel-add-btn carousel-add-img" data-cid="${esc(sectionId)}">+ Add image</button>
        <button class="carousel-add-btn carousel-add-yt" data-cid="${esc(sectionId)}" style="margin-top:0.25rem">▶ Add YouTube video</button>` : ''}`;
    }
    export function wireCarousels($container) {
      $container.querySelectorAll('.sec-carousel').forEach(car => {
        const slides = car.querySelectorAll('.sec-carousel-slide');
        const dots   = car.querySelectorAll('.carousel-dot');
        if (slides.length <= 1) return;
        function goTo(n) {
          const cur = parseInt(car.dataset.cur) || 0;
          if (cur === n) return;
          // Fade out the current slide
          const curSlide = slides[cur];
          curSlide.classList.add('carousel-fade-out');
          dots[cur]?.classList.remove('active');
          curSlide.addEventListener('animationend', () => {
            curSlide.classList.remove('active', 'carousel-fade-out');
          }, { once: true });
          // Fade in the new slide
          car.dataset.cur = n;
          slides[n].classList.add('active');
          dots[n]?.classList.add('active');
          // Pause autoscroll if target slide has a YouTube iframe
          if (slides[n]?.dataset.isYt === '1') stopAuto();
          // Preload next slide image
          const next = slides[(n + 1) % slides.length];
          const preloadEl = next?.querySelector('img');
          if (preloadEl && !preloadEl.src) preloadEl.src = preloadEl.dataset.src || preloadEl.src;
        }
        // Autoscroll
        let _autoTimer = null;
        function startAuto() {
          clearInterval(_autoTimer);
          _autoTimer = setInterval(() => {
            const c = parseInt(car.dataset.cur) || 0;
            goTo((c + 1) % slides.length);
          }, 5000);
        }
        function stopAuto() { clearInterval(_autoTimer); _autoTimer = null; }
        startAuto();
        car.addEventListener('mouseenter', stopAuto);
        car.addEventListener('mouseleave', startAuto);
        car.querySelector('.carousel-prev')?.addEventListener('click', e => {
          e.stopPropagation(); stopAuto();
          const c = parseInt(car.dataset.cur) || 0; goTo((c - 1 + slides.length) % slides.length);
          startAuto();
        });
        car.querySelector('.carousel-next')?.addEventListener('click', e => {
          e.stopPropagation(); stopAuto();
          const c = parseInt(car.dataset.cur) || 0; goTo((c + 1) % slides.length);
          startAuto();
        });
        dots.forEach((dot, i) => dot.addEventListener('click', e => { e.stopPropagation(); stopAuto(); goTo(i); startAuto(); }));
        // Touch swipe
        let _sx = 0;
        car.querySelector('.sec-carousel-track').addEventListener('touchstart', e => { _sx = e.touches[0].clientX; stopAuto(); }, { passive: true });
        car.querySelector('.sec-carousel-track').addEventListener('touchend', e => {
          const dx = e.changedTouches[0].clientX - _sx;
          if (Math.abs(dx) > 40) { const c = parseInt(car.dataset.cur) || 0; goTo(dx < 0 ? (c + 1) % slides.length : (c - 1 + slides.length) % slides.length); }
          setTimeout(startAuto, 3000);
        }, { passive: true });
      });
    }
    export function computeVariants(sections) {
    // Determine kind/tone/span for each section without touching the DB.
    // kind: 'editorial' if has image/carousel, 'text' otherwise
    // tone: cycles through palette for text blocks; editorial blocks stay cream
    // span: editorial = 12 (full row); text blocks tile 7/5/5/7/6/6, rows sum to 12
    const TEXT_TONES = ['cream', 'lavender', 'gold', 'cream', 'rose', 'cream'];
    const TEXT_SPANS = [7, 5, 5, 7, 6, 6];

    const variants = sections.map((s, i) => {
      const hasImage = !!(s.image_url || (s.images && s.images.length));
      const isVideo  = hasImage && isVideoUrl(s.image_url || '');
      const kind     = isVideo ? 'video' : hasImage ? 'editorial' : 'text';
      const tone     = kind === 'text' ? TEXT_TONES[i % TEXT_TONES.length] : 'cream';
      const inkEdit  = kind === 'editorial' && (i % 3 === 2);
      return { kind, tone, span: kind !== 'text' ? 12 : 0, inkEdit };
    });

    // Tile text block spans so each row sums to 12
    let rowSum = 0;
    let rowStart = 0;
    for (let i = 0; i < variants.length; i++) {
      if (variants[i].kind !== 'text') { rowSum = 0; rowStart = i + 1; continue; }
      const span = TEXT_SPANS[i % TEXT_SPANS.length];
      variants[i].span = span;
      rowSum += span;
      if (rowSum >= 12) { rowSum = 0; rowStart = i + 1; }
      else if (i === variants.length - 1 || variants[i + 1].kind !== 'text') {
        // partial row — widen this block to fill
        variants[i].span += (12 - rowSum);
        rowSum = 0; rowStart = i + 1;
      }
    }
    return variants;
  }

    export function wireSbsResizeHandles($container, updateFn) {
      $container.querySelectorAll('.sbs-resize-handle').forEach(handle => {
        const imgContainer = handle.closest('.sec-sidebyside-img, .cb-photo-pane');
        const carousel = imgContainer?.querySelector('.sec-carousel');
        const sectionId = handle.dataset.resizeId;
        handle.addEventListener('mousedown', e => {
          e.preventDefault(); e.stopPropagation();
          const startY = e.clientY;
          const startH = carousel ? carousel.offsetHeight : 300;
          function onMove(e) {
            const newH = Math.max(150, Math.min(900, startH + (e.clientY - startY)));
            imgContainer.style.setProperty('--sbs-img-h', newH + 'px');
          }
          function onUp(e) {
            const newH = Math.max(150, Math.min(900, startH + (e.clientY - startY)));
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            updateFn(sectionId, { img_height: newH + 'px' });
          }
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        });
      });
    }


    //  RENDER — ABOUT
    // ════════════════════════════════════════════════
    export async function renderHomeAbout() {
      const $container = document.getElementById('about-sections-container');
      const $empty     = document.getElementById('about-sections-empty');
      renderSkeletonCards('about-sections-container', 3);
      const sections   = await fetchAboutSections();
      if (!sections.length) { $container.innerHTML = ''; $empty.classList.remove('view-hidden'); return; }
      $empty.classList.add('view-hidden');
      $container.classList.add('cb-grid');
      const variants_ha = computeVariants(sections);
      const SVG_DRAG   = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg>`;
      const SVG_PENCIL = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>`;
      const SVG_IMG_A  = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`;
      const SVG_VID_A  = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`;
      const SVG_TRASH  = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>`;
      $container.innerHTML = sections.map((s, idx) => {
        const v       = variants_ha[idx];
        const flip    = idx % 2 !== 0;
        const imgs    = getSectionImages(s);
        const hasImgs = imgs.length > 0;
        const carHTML = hasImgs ? buildCarouselHTML(imgs, s.id, editMode) : '';
        const tbHTML = `
          <div class="section-toolbar">
            <div class="drag-handle" title="Drag to reorder">${SVG_DRAG}</div>
            <button class="edit-section-btn" title="Edit inline" data-edit-id="${s.id}">${SVG_PENCIL}</button>
            <button class="img-section-btn" title="Add/change image" data-imgbtn-id="${s.id}">${SVG_IMG_A}</button>
            <button class="vid-section-btn" title="Add YouTube video" data-vidbtn-id="${s.id}">${SVG_VID_A}</button>
            <button class="del-section-btn" title="Delete section" data-delbtn-id="${s.id}">${SVG_TRASH}</button>
          </div>`;
        const textHTML = `
          <h3 class="cb-title editable-title" data-field="title" data-id="${s.id}">${esc(s.title)}</h3>
          <div class="cb-body editable-body" data-field="body" data-id="${s.id}">${sanitizeHtml(s.body)}</div>`;
        if (!hasImgs) {
          return `
          <div class="editable-section content-block" data-tone="${v.tone}" data-section-id="${s.id}" style="grid-column: span ${v.span}">
            ${tbHTML}
            ${textHTML}
          </div>`;
        }
        const imgH = s.img_height || '';
        const resizeHandle = editMode ? `<div class="sbs-resize-handle" data-resize-id="${s.id}" title="Drag to resize image"><svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M10 2L2 10M7 2L2 7M10 5L5 10"/></svg></div>` : '';
        return `
        <div class="editable-section cb-editorial${flip ? ' flip' : ''}${v.inkEdit ? ' ink' : ''}" data-section-id="${s.id}" style="grid-column: span 12">
          ${tbHTML}
          <div class="cb-photo-pane sec-sidebyside-img" style="${imgH ? `--sbs-img-h:${imgH}` : ''}">
            ${carHTML}${resizeHandle}
          </div>
          <div class="cb-text-pane sec-sidebyside-text">
            ${textHTML}
          </div>
        </div>`;
      }).join('');

      wireCarousels($container);
      wireSbsResizeHandles($container, updateAboutSection);

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
              const secs = await fetchAboutSections();
              const sec  = secs.find(s => s.id === id) || {};
              const imgs = getSectionImages(sec); imgs.push(url);
              await updateAboutSection(id, { images: imgs, image_url: imgs[0] });
              await renderHomeAbout();
              if (editMode) initAboutSortable();
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
            const secs = await fetchAboutSections();
            const sec  = secs.find(s => s.id === id) || {};
            const imgs = getSectionImages(sec); imgs.push(raw.trim());
            await updateAboutSection(id, { images: imgs, image_url: imgs[0] });
            await renderHomeAbout();
            if (editMode) initAboutSortable();
          } catch (err) { alert('Error: ' + err.message); }
        });
      });

      // Toolbar: add YouTube video to section
      $container.querySelectorAll('.vid-section-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id  = btn.dataset.vidbtnId;
          const raw = prompt('Enter YouTube URL:');
          if (!raw) return;
          const ytId = getYouTubeId(raw.trim());
          if (!ytId) { alert('Invalid YouTube URL. Please use a youtube.com or youtu.be link.'); return; }
          try {
            const secs = await fetchAboutSections();
            const sec  = secs.find(s => s.id === id) || {};
            const imgs = getSectionImages(sec); imgs.push(raw.trim());
            await updateAboutSection(id, { images: imgs, image_url: imgs[0] });
            await renderHomeAbout();
            if (editMode) initAboutSortable();
          } catch (err) { alert('Error: ' + err.message); }
        });
      });

      // Carousel: remove image
      $container.querySelectorAll('.carousel-remove-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
          e.stopPropagation();
          if (!confirm('Remove this image?')) return;
          const id = btn.dataset.cid; const idx = parseInt(btn.dataset.sidx);
          const secs = await fetchAboutSections();
          const sec  = secs.find(s => s.id === id) || {};
          const imgs = getSectionImages(sec); imgs.splice(idx, 1);
          await updateAboutSection(id, { images: imgs, image_url: imgs[0] || null });
          await renderHomeAbout();
        });
      });

      // Wire up edit mode buttons
      $container.querySelectorAll('.edit-section-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.editId;
          const card = $container.querySelector(`[data-section-id="${id}"]`);
          const $title = card.querySelector('.editable-title');
          const $body  = card.querySelector('.editable-body');
          if ($title.contentEditable === 'true') {
            $title.contentEditable = 'false'; $body.contentEditable = 'false';
            const saveBtn = card.querySelector('.inline-save-btn'); if (saveBtn) saveBtn.remove();
            card.querySelector('.format-toolbar')?.remove();
            updateAboutSection(id, { title: $title.textContent.trim(), body: sanitizeHtml($body.innerHTML.trim()) });
          } else {
            $title.contentEditable = 'true'; $body.contentEditable = 'true'; $title.focus();
            showFormatToolbar($body);
            if (!card.querySelector('.inline-save-btn')) {
              const sb = document.createElement('button');
              sb.className = 'inline-save-btn'; sb.textContent = 'Save Changes';
              sb.addEventListener('click', async () => {
                await updateAboutSection(id, { title: $title.textContent.trim(), body: sanitizeHtml($body.innerHTML.trim()) });
                $title.contentEditable = 'false'; $body.contentEditable = 'false';
                card.querySelector('.format-toolbar')?.remove(); sb.remove();
              });
              card.appendChild(sb);
            }
          }
        });
      });

      // Primary image button — sets/replaces images[0]
      $container.querySelectorAll('.img-section-btn').forEach(btn => {
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
              const secs = await fetchAboutSections();
              const sec  = secs.find(s => s.id === id) || {};
              const imgs = getSectionImages(sec);
              if (!imgs.length) imgs.push(url); else imgs[0] = url;
              await updateAboutSection(id, { image_url: url, images: imgs });
              await renderHomeAbout();
              if (editMode) initAboutSortable();
            } catch (err) { alert('Error: ' + err.message); }
          };
          inp.click();
        });
      });

      // Delete buttons
      $container.querySelectorAll('.del-section-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this section?')) return;
          await deleteAboutSection(btn.dataset.delbtnId);
          await renderHomeAbout();
          await renderAdminAbout();
        });
      });

      if (editMode) { destroySortables(); initAboutSortable(); }
    }

    export async function renderAboutPdfs() {
      const $grid  = document.getElementById('pdf-grid');
      const $empty = document.getElementById('pdf-empty');
      renderSkeletonCards('pdf-grid', 3);
      const pdfs   = await fetchPdfs();
      if (!pdfs.length) { $grid.innerHTML = ''; $empty.classList.remove('view-hidden'); return; }
      $empty.classList.add('view-hidden');
      $grid.innerHTML = pdfs.map(p => `
        <div class="bg-surface/60 backdrop-blur rounded-xl border border-imperial/10 p-5 flex flex-col gap-3">
          <div class="flex items-start gap-3">
            <div class="pdf-icon-bg">
              <svg class="w-5 h-5 text-imperial" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-display text-sm font-semibold text-ink leading-snug">${esc(p.title)}</h3>
              ${p.description ? `<p class="text-ink/50 text-xs mt-0.5 leading-relaxed">${esc(p.description)}</p>` : ''}
            </div>
          </div>
          <a href="${esc(p.file_url)}" target="_blank" rel="noopener noreferrer"
            class="btn-outline text-xs font-medium px-4 py-2 rounded-lg text-center inline-flex items-center justify-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
            </svg>
            Download PDF
          </a>
        </div>`).join('');
    }

    // ════════════════════════════════════════════════