import { aboutSortable, concertSortable, currentProgram, currentView, destModalFile, destModalResolve, editMode, galleryPageSortable, gallerySortable, homeAboutSortable, homeProgramsSortable, homeValuesSortable, programSortable, selectedFile, selectedHeroFile, selectedPdf, setAboutSortable, setConcertSortable, setDestModalFile, setDestModalResolve, setEditMode, setGalleryPageSortable, setGallerySortable, setHomeAboutSortable, setHomeProgramsSortable, setHomeValuesSortable, setProgramSortable, setSelectedFile, setSelectedHeroFile, setSelectedPdf, setTosSortable, supabase, tosSortable } from './state.js';
import { showView } from './auth.js';
import { fetchAboutSections, fetchConcertSections, fetchFaculty, fetchPrograms, reorderTosSections, saveSetting } from './data.js';
import { fetchValuesData, renderAdminHeroPreview, renderHeroPhoto, renderHomeAboutFeatures, renderHomeGallery } from './home.js';
import { initProgramsHeaderEdit, renderAboutPdfs, renderHomeAbout, renderTestimonials } from './programs.js';
import { _applyProgramEditMode, renderConcertPage, renderFacultyPage, renderProgramPage, renderTosPage } from './gallery.js';
import { renderAdminAbout, renderAdminConcert, renderAdminFaculty, renderAdminGallery, renderAdminPdfs, renderAdminPrograms } from './admin.js';
import { esc, getYouTubeId } from './utils.js';

    //  VISUAL EDIT MODE + DRAG-AND-DROP
    // ════════════════════════════════════════════════
    export async function updateAboutSection(id, fields) {
      const { error } = await supabase.from('about_sections').update(fields).eq('id', id);
      if (error) { alert('Error: ' + error.message); return false; } return true;
    }
    export async function updateConcertSection(id, fields) {
      const sections = await fetchConcertSections();
      const idx = sections.findIndex(s => s.id === id);
      if (idx === -1) return false;
      sections[idx] = { ...sections[idx], ...fields };
      await saveSetting('concert_data', sections); return true;
    }
    async function reorderConcertSections(orderedIds) {
      const sections = await fetchConcertSections();
      const ordered = orderedIds.map((id, i) => {
        const s = sections.find(s => s.id === id); return s ? { ...s, display_order: i } : null;
      }).filter(Boolean);
      await saveSetting('concert_data', ordered);
    }
    export async function updateFacultyMember(id, fields) {
      const members = await fetchFaculty();
      const idx = members.findIndex(m => m.id === id);
      if (idx === -1) return false;
      members[idx] = { ...members[idx], ...fields };
      await saveSetting('faculty_data', members); return true;
    }
    export async function updateProgramItem(id, fields) {
      const programs = await fetchPrograms();
      const idx = programs.findIndex(p => p.id === id);
      if (idx === -1) return false;
      programs[idx] = { ...programs[idx], ...fields };
      await saveSetting('programs_data', programs); return true;
    }
    export function extractGalleryObjectPath(fileUrl) {
      if (!fileUrl) return null;
      const parts = fileUrl.split('/gallery/');
      if (parts.length < 2) return null;
      return decodeURIComponent(parts[1]);
    }

    export async function addProgramSection(programId, title, body, image_url = null) {
      const programs = await fetchPrograms(false);
      const idx = programs.findIndex(p => p.id === programId);
      if (idx === -1) return false;
      const sections = Array.isArray(programs[idx].sections) ? programs[idx].sections : [];
      const order = sections.length ? Math.max(...sections.map(s => s.display_order || 0)) + 1 : 0;
      sections.push({ id: crypto.randomUUID(), title, body, image_url: image_url || null, display_order: order });
      programs[idx] = { ...programs[idx], sections };
      await saveSetting('programs_data', programs); return true;
    }
    export async function updateProgramSection(programId, sectionId, fields) {
      const programs = await fetchPrograms(false);
      const pi = programs.findIndex(p => p.id === programId);
      if (pi === -1) return false;
      const sections = Array.isArray(programs[pi].sections) ? programs[pi].sections : [];
      const si = sections.findIndex(s => s.id === sectionId);
      if (si === -1) return false;
      sections[si] = { ...sections[si], ...fields };
      programs[pi] = { ...programs[pi], sections };
      await saveSetting('programs_data', programs); return true;
    }
    export async function deleteProgramSection(programId, sectionId) {
      const programs = await fetchPrograms(false);
      const pi = programs.findIndex(p => p.id === programId);
      if (pi === -1) return false;
      programs[pi].sections = (programs[pi].sections || []).filter(s => s.id !== sectionId);
      await saveSetting('programs_data', programs); return true;
    }
    async function reorderProgramSections(programId, orderedIds) {
      const programs = await fetchPrograms(false);
      const pi = programs.findIndex(p => p.id === programId);
      if (pi === -1) return false;
      const sections = Array.isArray(programs[pi].sections) ? programs[pi].sections : [];
      programs[pi].sections = orderedIds.map((id, i) => {
        const s = sections.find(s => s.id === id); return s ? { ...s, display_order: i } : null;
      }).filter(Boolean);
      await saveSetting('programs_data', programs); return true;
    }
    export async function updateGalleryCaption(id, caption) {
      const { error } = await supabase.from('gallery').update({ caption }).eq('id', id);
      if (error) throw new Error(error.message); return true;
    }
    async function reorderAboutSections(orderedIds) {
      for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await supabase.from('about_sections').update({ display_order: i }).eq('id', orderedIds[i]);
        if (error) { console.error('Reorder error:', error); return false; }
      }
      return true;
    }
    export async function fetchHeroSetting() {
      const { data, error } = await supabase.from('site_settings').select('*').eq('key', 'hero_image').single();
      if (error) return null;
      return data;
    }
    async function saveHeroSetting(imageUrl) {
      const { data: existing } = await supabase.from('site_settings').select('id').eq('key', 'hero_image').single();
      if (existing) {
        const { error } = await supabase.from('site_settings').update({ value: imageUrl }).eq('key', 'hero_image');
        if (error) { alert('Error saving hero: ' + error.message); return false; }
      } else {
        const { error } = await supabase.from('site_settings').insert({ key: 'hero_image', value: imageUrl });
        if (error) { alert('Error saving hero: ' + error.message); return false; }
      }
      return true;
    }
    export async function uploadImageToStorage(file) {
      const ext = file.name.split('.').pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const { error: ue } = await supabase.storage.from('gallery').upload(filename, file, { contentType: file.type });
      if (ue) throw new Error(ue.message);
      const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(filename);
      return publicUrl;
    }

    export function toggleEditMode() {
      setEditMode(!editMode);
      document.body.classList.toggle('edit-mode', editMode);
      const $btn = document.getElementById('edit-mode-toggle');
      $btn.classList.toggle('active', editMode);
      $btn.innerHTML = editMode
        ? '<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>Preview'
        : '<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>Edit Mode';

      if      (editMode && currentView === 'about')        initAboutSortable();
      else if (editMode && currentView === 'concert')      initConcertSortable();
      else if (editMode && currentView === 'gallery-page') initGalleryPageSortable();
      else if (editMode && currentView === 'tos')          initTosSortable();
      else if (editMode && currentView === 'programs')     initProgramSortable();
      else destroySortables();

      if (editMode && currentView === 'home') {
        initGallerySortable();
        initHomeAboutSortable();
        initHomeValuesSortable();
        initHomeProgramsSortable();
        renderTestimonials();
      }
      if (currentView === 'home') initProgramsHeaderEdit();

      // Refresh program edit controls when toggling on programs page
      if (currentView === 'programs') _applyProgramEditMode();
    }

    export function initAboutSortable() {
      const container = document.getElementById('about-sections-container');
      if (!container || aboutSortable) return;
      setAboutSortable(Sortable.create(container, {
        handle: '.drag-handle',
        animation: 200,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onEnd: async () => {
          const ids = Array.from(container.querySelectorAll('[data-section-id]')).map(el => el.dataset.sectionId);
          await reorderAboutSections(ids);
          await renderHomeAbout();
        }
      }));
    }

    export function initHomeAboutSortable() {
      const container = document.getElementById('home-about-sections');
      if (!container || homeAboutSortable) return;
      setHomeAboutSortable(Sortable.create(container, {
        handle: '.drag-handle', animation: 200,
        ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag',
        filter: '.home-about-add-row',
        onEnd: async () => {
          const ids = Array.from(container.querySelectorAll('[data-section-id]')).map(el => el.dataset.sectionId);
          await reorderAboutSections(ids);
          await renderHomeAboutFeatures();
        }
      }));
    }

    export function initHomeValuesSortable() {
      const grid = document.getElementById('hp-values-grid');
      if (!grid || homeValuesSortable) return;
      setHomeValuesSortable(Sortable.create(grid, {
        handle: '.drag-handle', animation: 200,
        ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag',
        filter: '.val-add-row',
        onEnd: async () => {
          const ids = Array.from(grid.querySelectorAll('[data-val-id]')).map(el => el.dataset.valId).filter(Boolean);
          const vals = await fetchValuesData();
          const reordered = ids.map((id, idx) => {
            const item = vals.find(v => v.id === id);
            return item ? { ...item, display_order: idx } : null;
          }).filter(Boolean);
          await saveSetting('values_data', reordered);
        }
      }));
    }

    export function initHomeProgramsSortable() {
      const grid = document.getElementById('home-programs-grid');
      if (!grid || homeProgramsSortable) return;
      setHomeProgramsSortable(Sortable.create(grid, {
        handle: '.drag-handle', animation: 200,
        ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag',
        filter: '.prog-add-row',
        onEnd: async () => {
          const ids = Array.from(grid.querySelectorAll('[data-prog-id]')).map(el => el.dataset.progId).filter(Boolean);
          const programs = await fetchPrograms();
          const reordered = ids.map((id, idx) => {
            const item = programs.find(p => p.id === id);
            return item ? { ...item, display_order: idx } : null;
          }).filter(Boolean);
          await saveSetting('programs_data', reordered);
        }
      }));
    }

    function initGallerySortable() {
      const grid = document.getElementById('gallery-grid');
      if (!grid || gallerySortable) return;
      setGallerySortable(Sortable.create(grid, {
        animation: 200,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
      }));
    }

    export function initConcertSortable() {
      const container = document.getElementById('concert-sections-container');
      if (!container || concertSortable) return;
      setConcertSortable(Sortable.create(container, {
        handle: '.drag-handle', animation: 200,
        ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag',
        onEnd: async () => {
          const ids = Array.from(container.querySelectorAll('[data-section-id]')).map(el => el.dataset.sectionId);
          await reorderConcertSections(ids);
          await renderConcertPage();
        }
      }));
    }
    export function initGalleryPageSortable() {
      const grid = document.getElementById('gallery-page-grid');
      if (!grid || galleryPageSortable) return;
      setGalleryPageSortable(Sortable.create(grid, {
        animation: 200, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag',
      }));
    }
    export function initTosSortable() {
      const container = document.getElementById('tos-content-container');
      if (!container || tosSortable) return;
      setTosSortable(Sortable.create(container, {
        handle: '.drag-handle', animation: 200,
        ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag',
        onEnd: async () => {
          const ids = Array.from(container.querySelectorAll('[data-section-id]')).map(el => el.dataset.sectionId);
          await reorderTosSections(ids);
          await renderTosPage();
        }
      }));
    }
    export function initProgramSortable() {
      const container = document.getElementById('program-content-container');
      if (!container || programSortable) return;
      setProgramSortable(Sortable.create(container, {
        handle: '.drag-handle', animation: 200,
        ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag',
        onEnd: async () => {
          const slug = container.dataset.programId;
          if (!slug) return;
          const ids = Array.from(container.querySelectorAll('[data-section-id]')).map(el => el.dataset.sectionId);
          await reorderProgramSections(slug, ids);
          await renderProgramPage(currentProgram);
        }
      }));
    }
    export function destroySortables() {
      if (aboutSortable)        { aboutSortable.destroy();        setAboutSortable(null); }
      if (homeAboutSortable)    { homeAboutSortable.destroy();    setHomeAboutSortable(null); }
      if (gallerySortable)      { gallerySortable.destroy();      setGallerySortable(null); }
      if (concertSortable)      { concertSortable.destroy();      setConcertSortable(null); }
      if (galleryPageSortable)  { galleryPageSortable.destroy();  setGalleryPageSortable(null); }
      if (tosSortable)          { tosSortable.destroy();          setTosSortable(null); }
      if (programSortable)      { programSortable.destroy();      setProgramSortable(null); }
      if (homeValuesSortable)   { homeValuesSortable.destroy();   setHomeValuesSortable(null); }
      if (homeProgramsSortable) { homeProgramsSortable.destroy(); setHomeProgramsSortable(null); }
    }

    // ── Edit toolbar buttons ───────────────────────
    document.getElementById('edit-mode-toggle').addEventListener('click', toggleEditMode);
    document.getElementById('edit-back-dashboard').addEventListener('click', () => showView('admin'));

    document.addEventListener('click', e => {
      const $fsl = e.target.closest('.footer-social-links');
      if ($fsl && editMode) {
        e.preventDefault();
        showView('admin');
        setTimeout(() => {
          document.getElementById('contact-info-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    });

    // ── Hero change button (in edit mode overlay) ──
    document.getElementById('hero-change-btn').addEventListener('click', () => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/webp,image/gif';
      inp.onchange = async () => {
        if (!inp.files.length) return;
        const file = inp.files[0];
        if (file.size > 5*1024*1024) { alert('File too large (max 5 MB)'); return; }
        try {
          const url = await uploadImageToStorage(file);
          await saveHeroSetting(url);
          await renderHeroPhoto();
          renderAdminHeroPreview();
        } catch (err) { alert('Upload error: ' + err.message); }
      };
      inp.click();
    });

    // ════════════════════════════════════════════════
    //  IMAGE DESTINATION PICKER
    // ════════════════════════════════════════════════
    function openDestModal(file) {
      return new Promise((resolve) => {
        setDestModalFile(file);
        setDestModalResolve(resolve);
        const $modal = document.getElementById('image-dest-modal');
        const $preview = document.getElementById('dest-preview-img');
        $preview.src = URL.createObjectURL(file);
        // Reset state
        document.querySelectorAll('.dest-option').forEach(o => o.classList.remove('selected'));
        document.querySelector('.dest-option[data-dest="gallery"]').classList.add('selected');
        document.querySelector('input[name="img-dest"][value="gallery"]').checked = true;
        ['dest-about-picker','dest-faculty-picker','dest-concert-picker','dest-program-picker'].forEach(id =>
          document.getElementById(id).classList.add('view-hidden')
        );
        document.getElementById('dest-caption').value = '';
        document.getElementById('dest-upload-status').classList.add('view-hidden');
        // Populate all dropdowns
        populateDestAboutSelect();
        populateDestFacultySelect();
        populateDestConcertSelect();
        populateDestProgramSelect();
        $modal.classList.add('active');
      });
    }

    async function populateDestAboutSelect() {
      const sections = await fetchAboutSections();
      const $sel = document.getElementById('dest-about-select');
      $sel.innerHTML = sections.length
        ? sections.map(s => `<option value="${s.id}">${esc(s.title)}</option>`).join('')
        : '<option value="">— No sections found —</option>';
    }
    async function populateDestFacultySelect() {
      const members = await fetchFaculty();
      const $sel = document.getElementById('dest-faculty-select');
      $sel.innerHTML = members.length
        ? members.map(m => `<option value="${m.id}">${esc(m.name)}${m.title ? ' — ' + esc(m.title) : ''}</option>`).join('')
        : '<option value="">— No faculty members found —</option>';
    }
    async function populateDestConcertSelect() {
      const sections = await fetchConcertSections();
      const $sel = document.getElementById('dest-concert-select');
      $sel.innerHTML = sections.length
        ? sections.map(s => `<option value="${s.id}">${esc(s.title)}</option>`).join('')
        : '<option value="">— No concert sections found —</option>';
    }
    async function populateDestProgramSelect() {
      const programs = await fetchPrograms();
      const $progSel = document.getElementById('dest-program-select');
      $progSel.innerHTML = programs.length
        ? programs.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')
        : '<option value="">— No programs found —</option>';
      // Populate sections for the first program
      if (programs.length) updateDestProgramSectionSelect(programs[0]);
    }
    function updateDestProgramSectionSelect(program) {
      const $secSel = document.getElementById('dest-program-section-select');
      const sections = Array.isArray(program?.sections) ? program.sections : [];
      $secSel.innerHTML = sections.length
        ? sections.map(s => `<option value="${s.id}">${esc(s.title || 'Untitled section')}</option>`).join('')
        : '<option value="">— No sections in this program —</option>';
    }

    // Destination radio handling
    document.querySelectorAll('.dest-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.dest-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        opt.querySelector('input[type="radio"]').checked = true;
        const dest = opt.dataset.dest;
        document.getElementById('dest-about-picker').classList.toggle('view-hidden', dest !== 'about');
        document.getElementById('dest-faculty-picker').classList.toggle('view-hidden', dest !== 'faculty');
        document.getElementById('dest-concert-picker').classList.toggle('view-hidden', dest !== 'concert');
        document.getElementById('dest-program-picker').classList.toggle('view-hidden', dest !== 'program');
      });
    });

    // When program selection changes, update section dropdown
    document.getElementById('dest-program-select').addEventListener('change', async () => {
      const programId = document.getElementById('dest-program-select').value;
      const programs = await fetchPrograms();
      const program = programs.find(p => p.id === programId);
      updateDestProgramSectionSelect(program);
    });

    document.getElementById('dest-cancel').addEventListener('click', () => {
      document.getElementById('image-dest-modal').classList.remove('active');
      if (destModalResolve) { destModalResolve(null); setDestModalResolve(null); }
    });

    document.getElementById('dest-upload').addEventListener('click', async () => {
      if (!destModalFile) return;
      const dest = document.querySelector('input[name="img-dest"]:checked').value;
      const caption = document.getElementById('dest-caption').value.trim();
      const $st = document.getElementById('dest-upload-status');
      const $br = document.getElementById('dest-upload-progress-bar');
      const $tx = document.getElementById('dest-upload-status-text');
      const $btn = document.getElementById('dest-upload');
      $btn.disabled = true; $st.classList.remove('view-hidden'); $br.style.width = '30%'; $tx.textContent = 'Uploading…';

      try {
        $br.style.width = '60%';
        const url = await uploadImageToStorage(destModalFile);
        $br.style.width = '80%';

        if (dest === 'gallery') {
          const { error } = await supabase.from('gallery').insert({ image_url: url, caption: caption || null });
          if (error) throw new Error(error.message);
          await renderAdminGallery(); await renderHomeGallery(); await renderHeroPhoto();
        } else if (dest === 'hero') {
          await saveHeroSetting(url);
          await renderHeroPhoto();
          renderAdminHeroPreview();
        } else if (dest === 'about') {
          const sectionId = document.getElementById('dest-about-select').value;
          if (sectionId) {
            await updateAboutSection(sectionId, { image_url: url });
            await renderHomeAbout();
            await renderAdminAbout();
          }
        } else if (dest === 'faculty') {
          const memberId = document.getElementById('dest-faculty-select').value;
          if (memberId) {
            await updateFacultyMember(memberId, { photo_url: url });
            if (currentView === 'faculty') await renderFacultyPage();
            await renderAdminFaculty();
          }
        } else if (dest === 'concert') {
          const sectionId = document.getElementById('dest-concert-select').value;
          if (sectionId) {
            await updateConcertSection(sectionId, { image_url: url });
            if (currentView === 'concert') await renderConcertPage();
            await renderAdminConcert();
          }
        } else if (dest === 'program') {
          const programId = document.getElementById('dest-program-select').value;
          const sectionId = document.getElementById('dest-program-section-select').value;
          if (programId && sectionId) {
            await updateProgramSection(programId, sectionId, { image_url: url });
            if (currentView === 'programs') await renderProgramPage(currentProgram);
            await renderAdminPrograms();
          }
        }

        $br.style.width = '100%'; $tx.textContent = 'Done!';
        setTimeout(() => {
          document.getElementById('image-dest-modal').classList.remove('active');
          $st.classList.add('view-hidden'); $br.style.width = '0%'; $btn.disabled = false;
          if (destModalResolve) { destModalResolve(url); setDestModalResolve(null); }
        }, 800);
      } catch (err) {
        $tx.textContent = 'Error: ' + err.message; $br.style.width = '0%'; $btn.disabled = false;
      }
    });

    // ════════════════════════════════════════════════
    //  FILE UPLOAD
    // ════════════════════════════════════════════════
    async function uploadPhoto(file, caption) {
      const ext = file.name.split('.').pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const { error: ue } = await supabase.storage.from('gallery').upload(filename, file, { contentType: file.type });
      if (ue) throw new Error(ue.message);
      const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(filename);
      const { error: de } = await supabase.from('gallery').insert({ image_url: publicUrl, caption: caption || null });
      if (de) throw new Error(de.message);
      return publicUrl;
    }
    export async function deleteGalleryItem(id, imageUrl) {
      const objectPath = extractGalleryObjectPath(imageUrl);
      if (objectPath) await supabase.storage.from('gallery').remove([objectPath]);
      const { error } = await supabase.from('gallery').delete().eq('id', id);
      if (error) { alert('Error: ' + error.message); return false; } return true;
    }
    async function uploadPdfFile(file, title, description, display_order) {
      const ext = file.name.split('.').pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const { error: ue } = await supabase.storage.from('pdfs').upload(filename, file, { contentType: 'application/pdf' });
      if (ue) throw new Error(ue.message);
      const { data: { publicUrl } } = supabase.storage.from('pdfs').getPublicUrl(filename);
      const { error: de } = await supabase.from('pdfs').insert({
        title, description: description || null, file_url: publicUrl, file_name: filename, display_order: display_order || 0,
      });
      if (de) throw new Error(de.message);
      return publicUrl;
    }

    // Gallery drop zone — supports single and bulk upload
    const $dz  = document.getElementById('upload-drop-zone');
    const $fi  = document.getElementById('upload-file-input');
    const $ub  = document.getElementById('upload-btn');
    const $fn  = document.getElementById('upload-filename');
    const $bulkStrip = document.getElementById('bulk-preview-strip');
    let selectedFiles = []; // array for multi-file support
    $dz.addEventListener('click',     () => $fi.click());
    $dz.addEventListener('dragover',  e => { e.preventDefault(); $dz.classList.add('dragover'); });
    $dz.addEventListener('dragleave', () => $dz.classList.remove('dragover'));
    $dz.addEventListener('drop',      e => { e.preventDefault(); $dz.classList.remove('dragover'); if (e.dataTransfer.files.length) pickFiles(Array.from(e.dataTransfer.files)); });
    $fi.addEventListener('change',    () => { if ($fi.files.length) pickFiles(Array.from($fi.files)); });
    function pickFiles(files) {
      const valid = files.filter(f => {
        if (f.size > 5*1024*1024) { alert(`"${f.name}" is too large (max 5 MB) and was skipped.`); return false; }
        return true;
      });
      if (!valid.length) return;
      selectedFiles = valid;
      setSelectedFile(valid[0]); // keep backward compat for single-file path
      $fn.textContent = valid.length === 1 ? `Selected: ${valid[0].name}` : `${valid.length} images selected`;
      $fn.classList.remove('view-hidden');
      if (valid.length === 1) {
        $ub.textContent = 'Upload Image…';
        $bulkStrip.classList.add('view-hidden');
        $bulkStrip.innerHTML = '';
        document.getElementById('upload-caption').closest('.flex').querySelector('label').textContent = 'Caption (optional)';
      } else {
        $ub.textContent = `Upload ${valid.length} Images to Gallery`;
        $bulkStrip.innerHTML = valid.map((f, i) =>
          `<div class="relative group"><img src="${URL.createObjectURL(f)}" class="w-14 h-14 object-cover rounded border border-imperial/20" alt="${esc(f.name)}" title="${esc(f.name)}" />` +
          `<button type="button" data-bulk-remove="${i}" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">&times;</button></div>`
        ).join('');
        $bulkStrip.classList.remove('view-hidden');
        $bulkStrip.querySelectorAll('[data-bulk-remove]').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.bulkRemove);
            selectedFiles.splice(idx, 1);
            if (!selectedFiles.length) { clearGalleryPicker(); } else { pickFiles(selectedFiles); }
          });
        });
        document.getElementById('upload-caption').closest('.flex').querySelector('label').textContent = 'Caption (optional — single upload only)';
      }
      $ub.disabled = false;
    }
    function clearGalleryPicker() {
      selectedFiles = []; setSelectedFile(null); $fi.value = '';
      $fn.classList.add('view-hidden'); $ub.disabled = true; $ub.textContent = 'Upload Image…';
      $bulkStrip.classList.add('view-hidden'); $bulkStrip.innerHTML = '';
    }
    $ub.addEventListener('click', async () => {
      if (!selectedFiles.length && !selectedFile) return;
      if (selectedFiles.length > 1) {
        // Bulk upload: all go to gallery
        const caption = document.getElementById('upload-caption').value.trim();
        const $st = document.getElementById('upload-status');
        const $br = document.getElementById('upload-progress-bar');
        const $tx = document.getElementById('upload-status-text');
        $ub.disabled = true; $st.classList.remove('view-hidden'); $br.style.width = '0%';
        let done = 0;
        const total = selectedFiles.length;
        const errors = [];
        for (const file of selectedFiles) {
          try {
            $tx.textContent = `Uploading ${done + 1} of ${total}…`;
            $br.style.width = `${Math.round((done / total) * 90)}%`;
            const url = await uploadImageToStorage(file);
            await supabase.from('gallery').insert({ image_url: url, caption: caption || null });
            done++;
          } catch (err) { errors.push(file.name + ': ' + err.message); }
        }
        $br.style.width = '100%';
        $tx.textContent = errors.length ? `Done with ${errors.length} error(s): ${errors.join('; ')}` : `${done} image${done !== 1 ? 's' : ''} uploaded!`;
        clearGalleryPicker();
        document.getElementById('upload-caption').value = '';
        await renderAdminGallery(); await renderHomeGallery(); await renderHeroPhoto();
        setTimeout(() => { $st.classList.add('view-hidden'); $br.style.width = '0%'; $ub.disabled = false; }, 2000);
      } else {
        // Single file: open destination picker
        const file = selectedFiles[0] || selectedFile;
        openDestModal(file);
        clearGalleryPicker();
        document.getElementById('upload-caption').value = '';
      }
    });

    // ── YouTube URL add to gallery ─────────────────────
    (function wireYouTubeGalleryAdd() {
      const $ytIn  = document.getElementById('yt-url-input');
      const $ytCap = document.getElementById('yt-caption-input');
      const $ytBtn = document.getElementById('yt-add-btn');
      const $ytPrv = document.getElementById('yt-url-preview');
      const $ytErr = document.getElementById('yt-url-error');
      if (!$ytIn) return;
      $ytIn.addEventListener('input', () => {
        const id = getYouTubeId($ytIn.value.trim());
        if (id) {
          $ytErr.classList.add('hidden');
          $ytPrv.innerHTML = `<img src="https://img.youtube.com/vi/${id}/mqdefault.jpg" alt="" aria-hidden="true" style="width:100%;height:100%;object-fit:cover;" /><div class="yt-play-overlay"></div>`;
          $ytPrv.classList.remove('hidden');
        } else {
          $ytPrv.classList.add('hidden');
          if ($ytIn.value.trim()) $ytErr.classList.remove('hidden'); else $ytErr.classList.add('hidden');
        }
      });
      $ytBtn.addEventListener('click', async () => {
        const url = $ytIn.value.trim();
        const id  = getYouTubeId(url);
        if (!id) { $ytErr.classList.remove('hidden'); return; }
        $ytBtn.disabled = true; $ytBtn.textContent = 'Adding…';
        const { error } = await supabase.from('gallery').insert({ image_url: url, caption: $ytCap.value.trim() || null });
        if (error) { alert('Error: ' + error.message); }
        else {
          $ytIn.value = ''; $ytCap.value = '';
          $ytPrv.classList.add('hidden');
          await renderAdminGallery(); await renderHomeGallery();
        }
        $ytBtn.disabled = false; $ytBtn.textContent = 'Add Video';
      });
    })();

    // Hero image drop zone (admin dashboard)
    const $hdz = document.getElementById('hero-drop-zone');
    const $hfi = document.getElementById('hero-file-input');
    const $hub = document.getElementById('hero-upload-btn');
    $hdz.addEventListener('click', () => $hfi.click());
    $hdz.addEventListener('dragover', e => { e.preventDefault(); $hdz.classList.add('dragover'); });
    $hdz.addEventListener('dragleave', () => $hdz.classList.remove('dragover'));
    $hdz.addEventListener('drop', e => { e.preventDefault(); $hdz.classList.remove('dragover'); if (e.dataTransfer.files.length) pickHeroFile(e.dataTransfer.files[0]); });
    $hfi.addEventListener('change', () => { if ($hfi.files.length) pickHeroFile($hfi.files[0]); });
    function pickHeroFile(file) {
      if (file.size > 5*1024*1024) { alert('File too large (max 5 MB)'); return; }
      setSelectedHeroFile(file);
      document.getElementById('hero-upload-filename').textContent = `Selected: ${file.name}`;
      document.getElementById('hero-upload-filename').classList.remove('view-hidden');
      $hub.disabled = false;
    }
    $hub.addEventListener('click', async () => {
      if (!selectedHeroFile) return;
      const $st = document.getElementById('hero-upload-status');
      const $br = document.getElementById('hero-upload-progress-bar');
      const $tx = document.getElementById('hero-upload-status-text');
      $hub.disabled = true; $st.classList.remove('view-hidden'); $br.style.width = '30%'; $tx.textContent = 'Uploading…';
      try {
        $br.style.width = '60%';
        const url = await uploadImageToStorage(selectedHeroFile);
        $br.style.width = '80%';
        await saveHeroSetting(url);
        $br.style.width = '100%'; $tx.textContent = 'Hero image updated!';
        setSelectedHeroFile(null); $hfi.value = '';
        document.getElementById('hero-upload-filename').classList.add('view-hidden');
        setTimeout(() => { $st.classList.add('view-hidden'); $br.style.width = '0%'; $hub.disabled = true; }, 1500);
        await renderHeroPhoto();
        renderAdminHeroPreview();
      } catch (err) { $tx.textContent = 'Error: ' + err.message; $br.style.width = '0%'; $hub.disabled = false; }
    });

    // PDF drop zone
    const $pdz = document.getElementById('pdf-drop-zone');
    const $pfi = document.getElementById('pdf-file-input');
    const $pub = document.getElementById('pdf-upload-btn');
    $pdz.addEventListener('click',     () => $pfi.click());
    $pdz.addEventListener('dragover',  e => { e.preventDefault(); $pdz.classList.add('dragover'); });
    $pdz.addEventListener('dragleave', () => $pdz.classList.remove('dragover'));
    $pdz.addEventListener('drop',      e => { e.preventDefault(); $pdz.classList.remove('dragover'); if (e.dataTransfer.files.length) pickPdf(e.dataTransfer.files[0]); });
    $pfi.addEventListener('change',    () => { if ($pfi.files.length) pickPdf($pfi.files[0]); });
    function pickPdf(file) {
      if (file.type !== 'application/pdf')  { alert('Please select a PDF file'); return; }
      if (file.size > 20*1024*1024)         { alert('File too large (max 20 MB)'); return; }
      setSelectedPdf(file);
      document.getElementById('pdf-upload-filename').textContent = `Selected: ${file.name}`;
      document.getElementById('pdf-upload-filename').classList.remove('view-hidden');
      $pub.disabled = false;
    }
    $pub.addEventListener('click', async () => {
      if (!selectedPdf) return;
      const title = document.getElementById('pdf-title-input').value.trim();
      if (!title) { alert('Please enter a document title'); return; }
      const desc  = document.getElementById('pdf-desc-input').value.trim();
      const order = parseInt(document.getElementById('pdf-order-input').value) || 0;
      const $st = document.getElementById('pdf-upload-status');
      const $br = document.getElementById('pdf-upload-progress-bar');
      const $tx = document.getElementById('pdf-upload-status-text');
      $pub.disabled = true; $st.classList.remove('view-hidden'); $br.style.width = '30%'; $tx.textContent = 'Uploading…';
      try {
        $br.style.width = '60%';
        await uploadPdfFile(selectedPdf, title, desc, order);
        $br.style.width = '100%'; $tx.textContent = 'Upload complete!';
        setSelectedPdf(null); $pfi.value = '';
        document.getElementById('pdf-upload-filename').classList.add('view-hidden');
        document.getElementById('pdf-title-input').value = '';
        document.getElementById('pdf-desc-input').value  = '';
        document.getElementById('pdf-order-input').value = '';
        setTimeout(() => { $st.classList.add('view-hidden'); $br.style.width = '0%'; $pub.disabled = true; }, 1500);
        await renderAdminPdfs();
        if (currentView === 'about') await renderAboutPdfs();
      } catch (err) { $tx.textContent = 'Error: ' + err.message; $br.style.width = '0%'; $pub.disabled = false; }
    });

    // ════════════════════════════════════════════════