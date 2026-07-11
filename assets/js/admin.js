import { DEFAULT_VALUES, currentProgram, currentView, selectedAboutImg, selectedFacultyPhoto, setSelectedAboutImg, setSelectedFacultyPhoto, supabase } from './state.js';
import { addAboutSection, addAward, addClass, addConcertSection, addFacultyMember, addProgramItem, addTosSection, deleteAboutSection, deleteAward, deleteClass, deleteConcertSection, deleteFacultyMember, deletePdf, deleteProgramItem, deleteRegistration, deleteTosSection, fetchAboutSections, fetchAwards, fetchClasses, fetchConcertSections, fetchFaculty, fetchGallery, fetchPdfs, fetchPrograms, fetchRegistrations, fetchSetting, fetchTosSettings, saveSetting, saveTosSettings, submitRegistration, updateAward, updateClass, updateRegStatus } from './data.js';
import { addProgramSection, deleteGalleryItem, deleteProgramSection, extractGalleryObjectPath, updateProgramItem, updateProgramSection, uploadImageToStorage } from './visual-editor.js';
import { renderFooterSocial, renderHeroContent, renderHeroPhoto, renderHomeAboutFeatures, renderHomeAwards, renderHomeContactInfo, renderHomeFaq, renderHomeGallery, renderHomeValuesCards } from './home.js';
import { renderAboutPdfs, renderAdminFaq, renderAdminTestimonials, renderAdminValues, renderHomeAbout, renderHomePrograms, renderTestimonials } from './programs.js';
import { populateProgramsDropdown, renderConcertPage, renderFacultyPage, renderProgramPage, renderTosPage } from './gallery.js';
import { renderPaymentStep } from './payment.js';
import { esc, getYouTubeId } from './utils.js';

    //  RENDER — ADMIN (Faculty / Programs / Concert)
    // ════════════════════════════════════════════════
    export async function renderAdminFaculty() {
      const members = await fetchFaculty();
      const $tbody  = document.getElementById('admin-faculty-tbody');
      const $empty  = document.getElementById('admin-faculty-empty');
      if (!members.length) { $tbody.innerHTML = ''; $empty.classList.remove('view-hidden'); return; }
      $empty.classList.add('view-hidden');
      $tbody.innerHTML = members.map(m => `<tr>
        <td class="px-4 py-3">${m.photo_url
          ? `<img src="${esc(m.photo_url)}" class="w-10 h-10 object-cover rounded-full border border-imperial/10" alt="${esc(m.name || 'Faculty member')}" />`
          : '<span class="text-ink/25 text-xs">—</span>'}</td>
        <td class="px-4 py-3 font-medium">${esc(m.name)}</td>
        <td class="px-4 py-3 text-ink/60">${esc(m.title||'')}</td>
        <td class="px-4 py-3">${m.category ? `<span class="faculty-category-badge">${esc(m.category)}</span>` : '<span class="text-ink/25 text-xs">—</span>'}</td>
        <td class="px-4 py-3 text-ink/60 text-xs">${esc((m.bio||'').substring(0,80))}${(m.bio||'').length>80?'…':''}</td>
        <td class="px-4 py-3 text-ink/50 text-center">${m.display_order||0}</td>
        <td class="px-4 py-3 text-center"><button data-del-faculty="${m.id}" class="text-imperial hover:underline text-xs font-medium">Delete</button></td>
      </tr>`).join('');
      $tbody.querySelectorAll('[data-del-faculty]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Delete this faculty member?')) return;
        if (await deleteFacultyMember(b.dataset.delFaculty)) {
          await renderAdminFaculty();
          if (currentView === 'faculty') await renderFacultyPage();
        }
      }));
    }

    export async function renderAdminPrograms() {
      const programs = await fetchPrograms(false);
      const $list  = document.getElementById('admin-programs-list');
      const $empty = document.getElementById('admin-programs-empty');
      if (!programs.length) { $list.innerHTML = ''; $empty.classList.remove('view-hidden'); return; }
      $empty.classList.add('view-hidden');
      $list.innerHTML = programs.map(p => {
        const sections = (Array.isArray(p.sections) ? p.sections : [])
          .map(s => ({ ...s, image_url: s.image_url || null }))
          .sort((a,b)=>(a.display_order||0)-(b.display_order||0));
        const sectionsHtml = sections.map(s => `
          <div class="flex flex-wrap items-center gap-2 bg-cream/50 border border-imperial/10 rounded px-3 py-1.5 text-xs" data-prog-section-row="${esc(s.id)}">
            <span class="font-medium text-ink flex-1 min-w-32 truncate">${esc(s.title)}</span>
            <span class="text-ink/40 truncate max-w-xs hidden sm:block">${esc((s.body||'').substring(0,50))}${(s.body||'').length>50?'…':''}</span>
            <span class="text-[10px] uppercase tracking-wide text-ink/50 bg-cream px-2 py-0.5 rounded">${s.image_url ? 'Has image' : 'No image'}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="prog-sec-image-input text-[10px] max-w-[170px]" data-prog-id="${esc(p.id)}" data-section-id="${esc(s.id)}" />
            <button data-replace-prog-section-image="${esc(s.id)}" data-prog-id="${esc(p.id)}" class="text-imperial hover:underline font-medium shrink-0">Replace image</button>
            <button data-remove-prog-section-image="${esc(s.id)}" data-prog-id="${esc(p.id)}" class="text-imperial/75 hover:text-imperial hover:underline font-medium shrink-0" ${s.image_url ? '' : 'disabled'}>Remove image</button>
            <button data-del-prog-section="${esc(s.id)}" data-prog-id="${esc(p.id)}" class="text-imperial hover:underline font-medium shrink-0">Delete</button>
          </div>`).join('');
        return `
        <div class="bg-surface/60 backdrop-blur rounded-xl border border-imperial/10 overflow-hidden">
          <!-- Program header row -->
          <div class="flex items-center gap-3 px-4 py-3">
            <div class="flex-1 min-w-0">
              <p class="font-medium text-ink text-sm">${esc(p.name)}</p>
              <p class="text-xs text-ink/50 font-mono">${esc(p.slug||'')}${p.description ? ' · ' + esc(p.description.substring(0,50)) : ''}</p>
            </div>
            <span class="text-xs text-ink/40 shrink-0">${sections.length} section${sections.length===1?'':'s'}</span>
            <button class="toggle-program-panel text-imperial text-xs font-medium hover:underline shrink-0" data-prog-id="${esc(p.id)}">Edit ▾</button>
            <button data-del-program="${esc(p.id)}" class="text-imperial/60 hover:text-imperial text-xs font-medium shrink-0">Delete</button>
          </div>
          <!-- Expandable sections panel -->
          <div id="prog-panel-${esc(p.id)}" class="view-hidden border-t border-imperial/10 px-4 py-4 space-y-3">
            <!-- Program card icon -->
            <div class="flex items-center gap-3 pb-3 border-b border-imperial/10">
              <div class="hp-program-icon shrink-0">${p.icon_url ? `<img src="${esc(p.icon_url)}" alt="" class="w-full h-full object-cover rounded-md" />` : ''}</div>
              <div class="flex-1">
                <p class="text-xs font-medium text-ink/70 mb-1">Card Icon <span class="text-ink/40 font-normal">(shown in the programs grid)</span></p>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                  class="prog-icon-input block text-xs text-ink/70 file:mr-2 file:px-2 file:py-1 file:rounded file:border-0 file:bg-imperial/10 file:text-imperial file:cursor-pointer"
                  data-prog-id="${esc(p.id)}" />
                ${p.icon_url ? `<button data-remove-prog-icon="${esc(p.id)}" class="mt-1 text-imperial/70 hover:text-imperial text-xs hover:underline">Remove icon</button>` : ''}
              </div>
            </div>
            <div class="space-y-1.5">
              ${sections.length ? sectionsHtml : '<p class="text-xs text-ink/40 italic">No sections yet.</p>'}
            </div>
            <!-- Add section form -->
            <form class="add-prog-section-form space-y-2 pt-2 border-t border-imperial/10" data-prog-id="${esc(p.id)}">
              <p class="text-xs font-medium text-ink/60 uppercase tracking-wide">Add Section to this Program</p>
              <input type="text" placeholder="Section title *" required
                class="prog-sec-title w-full px-3 py-1.5 rounded border border-imperial/15 bg-cream text-ink text-sm focus:outline-none focus:border-imperial" />
              <textarea rows="3" placeholder="Section body…" required
                class="prog-sec-body w-full px-3 py-1.5 rounded border border-imperial/15 bg-cream text-ink text-sm focus:outline-none focus:border-imperial resize-y"></textarea>
              <label class="block text-xs text-ink/60">Section image (optional)
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                  class="prog-sec-image mt-1 block w-full text-xs text-ink/70 file:mr-2 file:px-2 file:py-1 file:rounded file:border-0 file:bg-imperial/10 file:text-imperial file:cursor-pointer" />
              </label>
              <button type="submit" class="btn-imperial px-3 py-1.5 rounded text-xs font-medium">+ Add Section</button>
            </form>
          </div>
        </div>`;
      }).join('');

      // Toggle panels
      $list.querySelectorAll('.toggle-program-panel').forEach(btn => {
        btn.addEventListener('click', () => {
          const panel = document.getElementById('prog-panel-' + btn.dataset.progId);
          const isOpen = !panel.classList.contains('view-hidden');
          panel.classList.toggle('view-hidden', isOpen);
          btn.textContent = isOpen ? 'Edit ▾' : 'Close ▴';
        });
      });

      // Delete program
      $list.querySelectorAll('[data-del-program]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Delete this program and all its content?')) return;
        if (await deleteProgramItem(b.dataset.delProgram)) {
          await renderAdminPrograms();
          await populateProgramsDropdown();
        }
      }));

      // Delete section inside program
      $list.querySelectorAll('[data-del-prog-section]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Delete this section?')) return;
        await deleteProgramSection(b.dataset.progId, b.dataset.delProgSection);
        await renderAdminPrograms();
        if (currentView === 'programs') await renderProgramPage(currentProgram);
      }));

      // Add section forms
      $list.querySelectorAll('.add-prog-section-form').forEach(form => {
        form.addEventListener('submit', async e => {
          e.preventDefault();
          const title = form.querySelector('.prog-sec-title').value.trim();
          const body  = form.querySelector('.prog-sec-body').value.trim();
          const imageInput = form.querySelector('.prog-sec-image');
          const file = imageInput?.files?.[0] || null;
          if (!title || !body) return;
          let imageUrl = null;
          if (file) imageUrl = await uploadImageToStorage(file);
          await addProgramSection(form.dataset.progId, title, body, imageUrl);
          form.querySelector('.prog-sec-title').value = '';
          form.querySelector('.prog-sec-body').value = '';
          if (imageInput) imageInput.value = '';
          await renderAdminPrograms();
          // Re-open the panel
          const panel = document.getElementById('prog-panel-' + form.dataset.progId);
          if (panel) { panel.classList.remove('view-hidden'); }
          const toggleBtn = $list.querySelector(`.toggle-program-panel[data-prog-id="${form.dataset.progId}"]`);
          if (toggleBtn) toggleBtn.textContent = 'Close ▴';
          if (currentView === 'programs') await renderProgramPage(currentProgram);
        });
      });

      // Program card icon upload
      $list.querySelectorAll('.prog-icon-input').forEach(input => {
        input.addEventListener('change', async () => {
          const file = input.files?.[0];
          if (!file) return;
          const progId = input.dataset.progId;
          const btn = input.closest('.bg-surface\\/60')?.querySelector('.toggle-program-panel');
          try {
            const iconUrl = await uploadImageToStorage(file);
            await updateProgramItem(progId, { icon_url: iconUrl });
            await renderAdminPrograms();
            if (btn) { const panel = document.getElementById('prog-panel-' + progId); if (panel) panel.classList.remove('view-hidden'); }
            if (currentView === 'home') await renderHomePrograms();
          } catch (err) { alert('Upload failed: ' + err.message); }
        });
      });

      // Remove program card icon
      $list.querySelectorAll('[data-remove-prog-icon]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Remove this program\'s icon?')) return;
          const progId = btn.dataset.removeProgIcon;
          await updateProgramItem(progId, { icon_url: null });
          await renderAdminPrograms();
          const panel = document.getElementById('prog-panel-' + progId);
          if (panel) panel.classList.remove('view-hidden');
          if (currentView === 'home') await renderHomePrograms();
        });
      });

      $list.querySelectorAll('[data-replace-prog-section-image]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const row = btn.closest('[data-prog-section-row]');
          const input = row?.querySelector('.prog-sec-image-input');
          const file = input?.files?.[0];
          if (!file) { alert('Choose an image file first.'); return; }

          const progId = btn.dataset.progId;
          const sectionId = btn.dataset.replaceProgSectionImage;
          const programs = await fetchPrograms(false);
          const program = programs.find(p => p.id === progId);
          const existing = (program?.sections || []).find(s => s.id === sectionId);

          const newUrl = await uploadImageToStorage(file);
          await updateProgramSection(progId, sectionId, { image_url: newUrl });

          const oldPath = extractGalleryObjectPath(existing?.image_url);
          if (oldPath && existing.image_url !== newUrl) {
            await supabase.storage.from('gallery').remove([oldPath]);
          }

          await renderAdminPrograms();
          if (currentView === 'programs') await renderProgramPage(currentProgram);
        });
      });

      $list.querySelectorAll('[data-remove-prog-section-image]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Remove this section image?')) return;
          const progId = btn.dataset.progId;
          const sectionId = btn.dataset.removeProgSectionImage;
          const programs = await fetchPrograms(false);
          const program = programs.find(p => p.id === progId);
          const existing = (program?.sections || []).find(s => s.id === sectionId);

          await updateProgramSection(progId, sectionId, { image_url: null });
          const oldPath = extractGalleryObjectPath(existing?.image_url);
          if (oldPath) await supabase.storage.from('gallery').remove([oldPath]);

          await renderAdminPrograms();
          if (currentView === 'programs') await renderProgramPage(currentProgram);
        });
      });
    }

    export async function renderAdminConcert() {
      const sections = await fetchConcertSections();
      const $tbody   = document.getElementById('admin-concert-tbody');
      const $empty   = document.getElementById('admin-concert-empty');
      if (!sections.length) { $tbody.innerHTML = ''; $empty.classList.remove('view-hidden'); return; }
      $empty.classList.add('view-hidden');
      $tbody.innerHTML = sections.map(s => `<tr>
        <td class="px-4 py-3 font-medium">${esc(s.title)}</td>
        <td class="px-4 py-3 text-ink/60 text-xs">${esc((s.body||'').substring(0,90))}${(s.body||'').length>90?'…':''}</td>
        <td class="px-4 py-3 text-ink/50 text-center">${s.display_order||0}</td>
        <td class="px-4 py-3 text-center"><button data-del-concert="${s.id}" class="text-imperial hover:underline text-xs font-medium">Delete</button></td>
      </tr>`).join('');
      $tbody.querySelectorAll('[data-del-concert]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Delete this concert section?')) return;
        if (await deleteConcertSection(b.dataset.delConcert)) {
          await renderAdminConcert();
          if (currentView === 'concert') await renderConcertPage();
        }
      }));
    }

    export async function renderAdminTosSettings() {
      const tos = await fetchTosSettings();
      document.getElementById('tos-title').value = tos.title || '';
      document.getElementById('tos-subtitle').value = tos.subtitle || '';
      const sections = Array.isArray(tos.sections) ? tos.sections.sort((a,b) => (a.display_order||0)-(b.display_order||0)) : [];
      const $list  = document.getElementById('admin-tos-sections-list');
      const $empty = document.getElementById('admin-tos-sections-empty');
      if (!sections.length) {
        $list.innerHTML = '';
        $empty.classList.remove('view-hidden');
        return;
      }
      $empty.classList.add('view-hidden');
      $list.innerHTML = sections.map(s => `
        <div class="flex items-start gap-2 bg-cream/60 border border-imperial/10 rounded-lg px-3 py-2" data-tos-admin-id="${esc(s.id)}">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-ink truncate">${esc(s.title)}</p>
            <p class="text-xs text-ink/50 truncate">${esc((s.body||'').substring(0,80))}${(s.body||'').length>80?'…':''}</p>
          </div>
          <button data-del-tos-section="${esc(s.id)}" class="text-imperial hover:underline text-xs font-medium shrink-0 mt-0.5">Delete</button>
        </div>`).join('');
      $list.querySelectorAll('[data-del-tos-section]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Delete this section?')) return;
        await deleteTosSection(b.dataset.delTosSection);
        await renderAdminTosSettings();
        if (currentView === 'tos') await renderTosPage();
      }));
    }

    // ════════════════════════════════════════════════
    //  RENDER — ADMIN
    // ════════════════════════════════════════════════
    export async function renderAdminAwards() {
      const awards = await fetchAwards();
      const $tbody = document.getElementById('admin-awards-tbody');
      const $empty = document.getElementById('admin-awards-empty');
      if (!awards.length) { $tbody.innerHTML = ''; $empty.classList.remove('view-hidden'); return; }
      $empty.classList.add('view-hidden');
      $tbody.innerHTML = awards.map(a => `<tr data-award-row="${a.id}">
        <td class="px-4 py-3 font-medium" data-award-display-title="${a.id}">${esc(a.title)}</td>
        <td class="px-4 py-3 text-ink/60" data-award-display-year="${a.id}">${esc(a.year||'')}</td>
        <td class="px-4 py-3 text-ink/60" data-award-display-desc="${a.id}">${esc(a.description||'')}</td>
        <td class="px-4 py-3 text-center space-x-2">
          <button data-edit-award="${a.id}" class="text-imperial hover:underline text-xs font-medium">Edit</button>
          <button data-del-award="${a.id}" class="text-imperial hover:underline text-xs font-medium">Delete</button>
        </td>
      </tr>
      <tr data-award-edit-row="${a.id}" class="view-hidden bg-imperial/5">
        <td class="px-2 py-2"><input data-award-input-title="${a.id}" type="text" value="${esc(a.title)}" placeholder="Title *" class="w-full px-2 py-1 rounded border border-imperial/20 bg-cream text-ink text-sm focus:outline-none focus:border-imperial" /></td>
        <td class="px-2 py-2"><input data-award-input-year="${a.id}" type="text" value="${esc(a.year||'')}" placeholder="Year" maxlength="4" class="w-full px-2 py-1 rounded border border-imperial/20 bg-cream text-ink text-sm focus:outline-none focus:border-imperial" /></td>
        <td class="px-2 py-2"><input data-award-input-desc="${a.id}" type="text" value="${esc(a.description||'')}" placeholder="Description" class="w-full px-2 py-1 rounded border border-imperial/20 bg-cream text-ink text-sm focus:outline-none focus:border-imperial" /></td>
        <td class="px-2 py-2 text-center space-x-2">
          <button data-save-award="${a.id}" class="btn-imperial px-2 py-1 rounded text-xs font-medium">Save</button>
          <button data-cancel-award="${a.id}" class="px-2 py-1 rounded text-xs font-medium border border-imperial/20 text-ink/60 hover:border-imperial/40">Cancel</button>
        </td>
      </tr>`).join('');
      $tbody.querySelectorAll('[data-edit-award]').forEach(b => {
        b.addEventListener('click', () => {
          const id = b.dataset.editAward;
          $tbody.querySelector(`[data-award-row="${id}"]`).classList.add('view-hidden');
          $tbody.querySelector(`[data-award-edit-row="${id}"]`).classList.remove('view-hidden');
        });
      });
      $tbody.querySelectorAll('[data-cancel-award]').forEach(b => {
        b.addEventListener('click', () => {
          const id = b.dataset.cancelAward;
          $tbody.querySelector(`[data-award-row="${id}"]`).classList.remove('view-hidden');
          $tbody.querySelector(`[data-award-edit-row="${id}"]`).classList.add('view-hidden');
        });
      });
      $tbody.querySelectorAll('[data-save-award]').forEach(b => {
        b.addEventListener('click', async () => {
          const id    = b.dataset.saveAward;
          const title = $tbody.querySelector(`[data-award-input-title="${id}"]`).value.trim();
          const year  = $tbody.querySelector(`[data-award-input-year="${id}"]`).value.trim();
          const desc  = $tbody.querySelector(`[data-award-input-desc="${id}"]`).value.trim();
          if (!title) return;
          b.textContent = 'Saving…'; b.disabled = true;
          if (await updateAward(id, { title, year: year||null, description: desc||null })) {
            await renderAdminAwards(); await renderHomeAwards();
          } else { b.textContent = 'Save'; b.disabled = false; }
        });
      });
      $tbody.querySelectorAll('[data-del-award]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Delete this award?')) return;
        if (await deleteAward(b.dataset.delAward)) { await renderAdminAwards(); await renderHomeAwards(); }
      }));
    }

    export async function renderAdminClasses() {
      const classes = await fetchClasses();
      const $tbody  = document.getElementById('admin-classes-tbody');
      const $empty  = document.getElementById('admin-classes-empty');
      if (!classes.length) { $tbody.innerHTML = ''; $empty.classList.remove('view-hidden'); return; }
      $empty.classList.add('view-hidden');
      $tbody.innerHTML = classes.map(c => `<tr data-class-row="${c.id}">
        <td class="px-4 py-3 font-medium" data-class-display-name="${c.id}">${esc(c.name)}</td>
        <td class="px-4 py-3 text-ink/60" data-class-display-time="${c.id}">${esc(c.schedule_time||'')}</td>
        <td class="px-4 py-3 text-ink/60" data-class-display-level="${c.id}">${esc(c.level||'')}</td>
        <td class="px-4 py-3 text-ink/60" data-class-display-desc="${c.id}">${esc(c.description||'')}</td>
        <td class="px-4 py-3 text-center space-x-2">
          <button data-edit-class="${c.id}" class="text-imperial hover:underline text-xs font-medium">Edit</button>
          <button data-del-class="${c.id}" class="text-imperial hover:underline text-xs font-medium">Delete</button>
        </td>
      </tr>
      <tr data-class-edit-row="${c.id}" class="view-hidden bg-imperial/5">
        <td class="px-2 py-2"><input data-class-input-name="${c.id}" type="text" value="${esc(c.name)}" placeholder="Class Name *" class="w-full px-2 py-1 rounded border border-imperial/20 bg-cream text-ink text-sm focus:outline-none focus:border-imperial" /></td>
        <td class="px-2 py-2"><input data-class-input-time="${c.id}" type="text" value="${esc(c.schedule_time||'')}" placeholder="Schedule" class="w-full px-2 py-1 rounded border border-imperial/20 bg-cream text-ink text-sm focus:outline-none focus:border-imperial" /></td>
        <td class="px-2 py-2"><input data-class-input-level="${c.id}" type="text" value="${esc(c.level||'')}" placeholder="Level" class="w-full px-2 py-1 rounded border border-imperial/20 bg-cream text-ink text-sm focus:outline-none focus:border-imperial" /></td>
        <td class="px-2 py-2"><input data-class-input-desc="${c.id}" type="text" value="${esc(c.description||'')}" placeholder="Description" class="w-full px-2 py-1 rounded border border-imperial/20 bg-cream text-ink text-sm focus:outline-none focus:border-imperial" /></td>
        <td class="px-2 py-2 text-center space-x-2">
          <button data-save-class="${c.id}" class="btn-imperial px-2 py-1 rounded text-xs font-medium">Save</button>
          <button data-cancel-class="${c.id}" class="px-2 py-1 rounded text-xs font-medium border border-imperial/20 text-ink/60 hover:border-imperial/40">Cancel</button>
        </td>
      </tr>`).join('');
      $tbody.querySelectorAll('[data-edit-class]').forEach(b => {
        b.addEventListener('click', () => {
          const id = b.dataset.editClass;
          $tbody.querySelector(`[data-class-row="${id}"]`).classList.add('view-hidden');
          $tbody.querySelector(`[data-class-edit-row="${id}"]`).classList.remove('view-hidden');
        });
      });
      $tbody.querySelectorAll('[data-cancel-class]').forEach(b => {
        b.addEventListener('click', () => {
          const id = b.dataset.cancelClass;
          $tbody.querySelector(`[data-class-row="${id}"]`).classList.remove('view-hidden');
          $tbody.querySelector(`[data-class-edit-row="${id}"]`).classList.add('view-hidden');
        });
      });
      $tbody.querySelectorAll('[data-save-class]').forEach(b => {
        b.addEventListener('click', async () => {
          const id    = b.dataset.saveClass;
          const name  = $tbody.querySelector(`[data-class-input-name="${id}"]`).value.trim();
          const time  = $tbody.querySelector(`[data-class-input-time="${id}"]`).value.trim();
          const level = $tbody.querySelector(`[data-class-input-level="${id}"]`).value.trim();
          const desc  = $tbody.querySelector(`[data-class-input-desc="${id}"]`).value.trim();
          if (!name) return;
          b.textContent = 'Saving…'; b.disabled = true;
          if (await updateClass(id, { name, schedule_time: time||null, level: level||null, description: desc||null })) {
            await renderAdminClasses();
          } else { b.textContent = 'Save'; b.disabled = false; }
        });
      });
      $tbody.querySelectorAll('[data-del-class]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Delete this class?')) return;
        if (await deleteClass(b.dataset.delClass)) await renderAdminClasses();
      }));
    }

    export async function renderAdminAbout() {
      const sections = await fetchAboutSections();
      const $tbody   = document.getElementById('admin-about-tbody');
      const $empty   = document.getElementById('admin-about-empty');
      if (!sections.length) { $tbody.innerHTML = ''; $empty.classList.remove('view-hidden'); return; }
      $empty.classList.add('view-hidden');
      $tbody.innerHTML = sections.map(s => `<tr>
        <td class="px-4 py-3">${s.image_url ? `<img src="${esc(s.image_url)}" alt="" class="w-12 h-8 object-cover rounded border border-imperial/10"/>` : '<span class="text-ink/25 text-xs">—</span>'}</td>
        <td class="px-4 py-3 font-medium">${esc(s.title)}</td>
        <td class="px-4 py-3 text-ink/60 text-xs">${esc(s.body.substring(0,90))}${s.body.length>90?'…':''}</td>
        <td class="px-4 py-3 text-ink/50 text-center">${s.display_order}</td>
        <td class="px-4 py-3 text-center">
          <button data-del-about="${s.id}" class="text-imperial hover:underline text-xs font-medium">Delete</button>
        </td>
      </tr>`).join('');
      $tbody.querySelectorAll('[data-del-about]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Delete this section?')) return;
        if (await deleteAboutSection(b.dataset.delAbout)) {
          await renderAdminAbout();
          await renderHomeAboutFeatures();
          if (currentView === 'about') await renderHomeAbout();
        }
      }));
    }

    export async function renderAdminPdfs() {
      const pdfs   = await fetchPdfs();
      const $tbody = document.getElementById('admin-pdf-tbody');
      const $empty = document.getElementById('admin-pdf-empty');
      if (!pdfs.length) { $tbody.innerHTML = ''; $empty.classList.remove('view-hidden'); return; }
      $empty.classList.add('view-hidden');
      $tbody.innerHTML = pdfs.map(p => `<tr>
        <td class="px-4 py-3 font-medium">${esc(p.title)}</td>
        <td class="px-4 py-3 text-ink/60 text-xs">${esc(p.description||'—')}</td>
        <td class="px-4 py-3 text-ink/50 text-center text-xs">${p.display_order}</td>
        <td class="px-4 py-3 text-ink/40 text-xs">${new Date(p.created_at).toLocaleDateString()}</td>
        <td class="px-4 py-3 text-center text-xs">
          <a href="${esc(p.file_url)}" target="_blank" class="text-imperial hover:underline mr-3">View</a>
          <button data-del-pdf="${p.id}" data-pdf-url="${esc(p.file_url)}" class="text-imperial hover:underline font-medium">Delete</button>
        </td>
      </tr>`).join('');
      $tbody.querySelectorAll('[data-del-pdf]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Delete this PDF?')) return;
        if (await deletePdf(b.dataset.delPdf, b.dataset.pdfUrl)) {
          await renderAdminPdfs();
          if (currentView === 'about') await renderAboutPdfs();
        }
      }));
    }

    export async function renderAdminGallery() {
      const photos = await fetchGallery();
      const $tbody = document.getElementById('admin-gallery-tbody');
      const $empty = document.getElementById('admin-gallery-empty');
      if (!photos.length) { $tbody.innerHTML = ''; $empty.classList.remove('view-hidden'); return; }
      $empty.classList.add('view-hidden');
      $tbody.innerHTML = photos.map(p => {
        const ytId = getYouTubeId(p.image_url);
        const thumb = ytId
          ? `<img src="https://img.youtube.com/vi/${ytId}/mqdefault.jpg" class="yt-admin-thumb" alt="video"/>`
          : `<img src="${esc(p.image_url)}" alt="" class="w-14 h-10 object-cover rounded border border-imperial/10"/>`;
        return `<tr>
        <td class="px-4 py-3">${thumb}</td>
        <td class="px-4 py-3 text-ink/60">${esc(p.caption||'—')}</td>
        <td class="px-4 py-3 text-ink/40 text-xs">${new Date(p.created_at).toLocaleDateString()}</td>
        <td class="px-4 py-3 text-center"><button data-del-gal="${p.id}" data-gal-url="${esc(p.image_url)}" class="text-imperial hover:underline text-xs font-medium">Delete</button></td>
      </tr>`;
      }).join('');
      $tbody.querySelectorAll('[data-del-gal]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Delete this photo?')) return;
        if (await deleteGalleryItem(b.dataset.delGal, b.dataset.galUrl)) { await renderAdminGallery(); await renderHomeGallery(); await renderHeroPhoto(); }
      }));
    }

    const STATUS_STYLES = {
      pending:                'bg-amber-50  text-amber-700  border border-amber-200',
      awaiting_verification:  'bg-blue-50   text-blue-700   border border-blue-200',
      confirmed:              'bg-green-50  text-green-700  border border-green-200',
      cancelled:              'bg-red-50    text-red-700    border border-red-200',
    };
    const STATUS_LABELS = {
      pending:               'Pending',
      awaiting_verification: 'Awaiting Verification',
      confirmed:             'Confirmed',
      cancelled:             'Cancelled',
    };

    export async function renderAdminRegistrations() {
      const regs   = await fetchRegistrations();
      const $tbody = document.getElementById('admin-reg-tbody');
      const $empty = document.getElementById('admin-reg-empty');
      const $badge = document.getElementById('reg-count-badge');
      const pending = regs.filter(r => r.status === 'pending').length;
      if (pending > 0) { $badge.textContent = `${pending} pending`; $badge.classList.remove('view-hidden'); }
      else             { $badge.classList.add('view-hidden'); }
      if (!regs.length) { $tbody.innerHTML = ''; $empty.classList.remove('view-hidden'); return; }
      $empty.classList.add('view-hidden');
      $tbody.innerHTML = regs.map(r => `<tr>
        <td class="px-4 py-3 font-medium">${esc(r.student_name)}${r.date_of_birth?`<div class="text-xs text-ink/40">${new Date(r.date_of_birth).toLocaleDateString()}</div>`:''}</td>
        <td class="px-4 py-3 text-ink/70">${esc(r.parent_name)}</td>
        <td class="px-4 py-3 text-ink/60 text-xs"><div>${esc(r.email)}</div><div>${esc(r.phone)}</div></td>
        <td class="px-4 py-3 text-ink/60">${esc(r.class_name||'—')}</td>
        <td class="px-4 py-3 text-ink/60 capitalize">${esc(r.experience_level||'—')}</td>
        <td class="px-4 py-3 text-ink/40 text-xs whitespace-nowrap">${new Date(r.created_at).toLocaleDateString()}</td>
        <td class="px-4 py-3">
          <select data-status-reg="${r.id}" class="text-xs px-2 py-1 rounded-full font-medium focus:outline-none ${STATUS_STYLES[r.status]||''}">
            <option value="pending"                ${r.status==='pending'               ?'selected':''}>Pending</option>
            <option value="awaiting_verification"  ${r.status==='awaiting_verification' ?'selected':''}>Awaiting Verification</option>
            <option value="confirmed"              ${r.status==='confirmed'             ?'selected':''}>Confirmed</option>
            <option value="cancelled"              ${r.status==='cancelled'             ?'selected':''}>Cancelled</option>
          </select>
        </td>
        <td class="px-4 py-3 text-center"><button data-del-reg="${r.id}" class="text-imperial hover:underline text-xs font-medium">Delete</button></td>
      </tr>`).join('');
      $tbody.querySelectorAll('[data-status-reg]').forEach(sel => sel.addEventListener('change', async () => {
        if (await updateRegStatus(sel.dataset.statusReg, sel.value))
          sel.className = `text-xs px-2 py-1 rounded-full font-medium focus:outline-none ${STATUS_STYLES[sel.value]||''}`;
      }));
      $tbody.querySelectorAll('[data-del-reg]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Delete this registration?')) return;
        if (await deleteRegistration(b.dataset.delReg)) await renderAdminRegistrations();
      }));
    }

    // ── Class dropdown ─────────────────────────────
    export async function populateClassDropdown() {
      const classes = await fetchClasses();
      const $sel    = document.getElementById('reg-class');
      $sel.innerHTML = '<option value="">— Select a class —</option>' +
        classes.map(c => `<option value="${esc(c.id)}" data-name="${esc(c.name)}">${esc(c.name)}${c.schedule_time?' — '+esc(c.schedule_time):''}</option>`).join('');
    }

    // ── Form validation helpers ─────────────────────
    function _setFieldError(id, msg) {
      const el = document.getElementById(id);
      el.classList.add('reg-field-error');
      let errEl = el.parentElement.querySelector('.reg-field-err-msg');
      if (!errEl) { errEl = document.createElement('p'); errEl.className = 'reg-field-err-msg'; el.parentElement.appendChild(errEl); }
      errEl.textContent = msg;
    }
    function _clearFieldError(id) {
      const el = document.getElementById(id);
      el.classList.remove('reg-field-error');
      const errEl = el.parentElement.querySelector('.reg-field-err-msg');
      if (errEl) errEl.remove();
    }
    // Clear errors on user input
    ['reg-student-name','reg-parent-name','reg-email','reg-phone'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => _clearFieldError(id));
    });

    // ── Form handlers ──────────────────────────────
    document.getElementById('reg-form').addEventListener('submit', async e => {
      e.preventDefault();
      const $btn = document.getElementById('reg-submit');
      const $err = document.getElementById('reg-error');
      $err.classList.add('view-hidden');

      // Custom validation
      const requiredFields = [
        { id: 'reg-student-name', label: 'Student name is required' },
        { id: 'reg-parent-name',  label: 'Parent / guardian name is required' },
        { id: 'reg-email',        label: 'Email address is required' },
        { id: 'reg-phone',        label: 'Phone number is required' },
      ];
      let firstError = null;
      requiredFields.forEach(({ id, label }) => {
        const val = document.getElementById(id).value.trim();
        if (!val) { _setFieldError(id, label); if (!firstError) firstError = id; }
        else _clearFieldError(id);
      });
      if (firstError) { document.getElementById(firstError).focus(); return; }

      $btn.disabled = true; $btn.textContent = 'Submitting…';
      const sel = document.getElementById('reg-class');
      try {
        const regId = await submitRegistration({
          student_name:     document.getElementById('reg-student-name').value.trim(),
          parent_name:      document.getElementById('reg-parent-name').value.trim(),
          email:            document.getElementById('reg-email').value.trim(),
          phone:            document.getElementById('reg-phone').value.trim(),
          date_of_birth:    document.getElementById('reg-dob').value || null,
          class_id:         sel.value || null,
          class_name:       sel.value ? sel.options[sel.selectedIndex].dataset.name : null,
          experience_level: document.getElementById('reg-experience').value || null,
          notes:            document.getElementById('reg-notes').value.trim() || null,
        });
        e.target.reset();
        // Activate step-2 indicator
        document.getElementById('step-1-dot').classList.add('opacity-35');
        document.getElementById('step-2-dot').classList.remove('opacity-35');
        document.getElementById('step-2-num').className = 'w-7 h-7 rounded-full bg-imperial text-cream flex items-center justify-center text-xs font-semibold';
        // Show payment step
        document.getElementById('reg-form').classList.add('view-hidden');
        await renderPaymentStep(regId);
        document.getElementById('reg-payment-step').classList.remove('view-hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) { $err.textContent = 'Submission failed: ' + err.message; $err.classList.remove('view-hidden'); }
      $btn.disabled = false; $btn.textContent = 'Submit Application';
    });

    document.getElementById('reg-another').addEventListener('click', () => {
      document.getElementById('reg-success').classList.add('view-hidden');
      document.getElementById('reg-payment-step').classList.add('view-hidden');
      document.getElementById('reg-form').classList.remove('view-hidden');
      // Reset step indicator
      document.getElementById('step-1-dot').classList.remove('opacity-35');
      document.getElementById('step-2-dot').classList.add('opacity-35');
      document.getElementById('step-2-num').className = 'w-7 h-7 rounded-full border-2 border-imperial/40 text-ink/40 flex items-center justify-center text-xs font-semibold';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('hero-est-save-btn').addEventListener('click', async () => {
      const $btn = document.getElementById('hero-est-save-btn');
      const $input = document.getElementById('hero-est-input');
      const estLabel = $input.value.trim() || 'Est. 2008';
      $btn.disabled = true;
      try {
        await saveSetting('hero_content', { estLabel });
        await renderHeroContent();
        $input.value = estLabel;
      } catch (err) {
        alert('Error saving hero label: ' + err.message);
      }
      $btn.disabled = false;
    });

    document.getElementById('add-award-form').addEventListener('submit', async e => {
      e.preventDefault();
      const title = document.getElementById('award-title').value.trim();
      const year  = document.getElementById('award-year').value.trim();
      const desc  = document.getElementById('award-desc').value.trim();
      if (!title) return;
      if (await addAward(title, year||null, desc||null)) {
        ['award-title','award-year','award-desc'].forEach(id => document.getElementById(id).value = '');
        await renderAdminAwards(); await renderHomeAwards();
      }
    });

    document.getElementById('add-class-form').addEventListener('submit', async e => {
      e.preventDefault();
      const name  = document.getElementById('class-name').value.trim();
      const time  = document.getElementById('class-time').value.trim();
      const level = document.getElementById('class-level').value.trim();
      const desc  = document.getElementById('class-desc').value.trim();
      if (!name) return;
      if (await addClass(name, time||null, level||null, desc||null)) {
        ['class-name','class-time','class-level','class-desc'].forEach(id => document.getElementById(id).value = '');
        await renderAdminClasses();
      }
    });

    // About section image upload in admin form
    const $aboutImgDrop = document.getElementById('about-img-drop');
    const $aboutImgInput = document.getElementById('about-img-input');
    $aboutImgDrop.addEventListener('click', () => $aboutImgInput.click());
    $aboutImgDrop.addEventListener('dragover', e => { e.preventDefault(); $aboutImgDrop.classList.add('dragover'); });
    $aboutImgDrop.addEventListener('dragleave', () => $aboutImgDrop.classList.remove('dragover'));
    $aboutImgDrop.addEventListener('drop', e => { e.preventDefault(); $aboutImgDrop.classList.remove('dragover'); if (e.dataTransfer.files.length) pickAboutImg(e.dataTransfer.files[0]); });
    $aboutImgInput.addEventListener('change', () => { if ($aboutImgInput.files.length) pickAboutImg($aboutImgInput.files[0]); });
    function pickAboutImg(file) {
      if (file.size > 5*1024*1024) { alert('Max 5 MB'); return; }
      setSelectedAboutImg(file);
      document.getElementById('about-img-thumb').src = URL.createObjectURL(file);
      document.getElementById('about-img-preview').classList.remove('view-hidden');
    }
    document.getElementById('about-img-clear').addEventListener('click', () => {
      setSelectedAboutImg(null); $aboutImgInput.value = '';
      document.getElementById('about-img-preview').classList.add('view-hidden');
    });

    document.getElementById('add-about-form').addEventListener('submit', async e => {
      e.preventDefault();
      const title = document.getElementById('about-title-input').value.trim();
      const body  = document.getElementById('about-body-input').value.trim();
      const order = parseInt(document.getElementById('about-order-input').value) || 0;
      if (!title || !body) return;
      let imageUrl = null;
      if (selectedAboutImg) {
        try { imageUrl = await uploadImageToStorage(selectedAboutImg); } catch (err) { alert('Image upload error: ' + err.message); return; }
      }
      if (await addAboutSection(title, body, order, imageUrl)) {
        ['about-title-input','about-body-input','about-order-input'].forEach(id => document.getElementById(id).value = '');
        setSelectedAboutImg(null); $aboutImgInput.value = '';
        document.getElementById('about-img-preview').classList.add('view-hidden');
        await renderAdminAbout();
        await renderHomeAboutFeatures();
        if (currentView === 'about') await renderHomeAbout();
      }
    });

    // ════════════════════════════════════════════════
    //  FACULTY / PROGRAMS / CONCERT FORM HANDLERS
    // ════════════════════════════════════════════════

    // Faculty photo drop zone
    const $facPhDrop  = document.getElementById('faculty-photo-drop');
    const $facPhInput = document.getElementById('faculty-photo-input');
    $facPhDrop.addEventListener('click',     () => $facPhInput.click());
    $facPhDrop.addEventListener('dragover',  e  => { e.preventDefault(); $facPhDrop.classList.add('dragover'); });
    $facPhDrop.addEventListener('dragleave', ()  => $facPhDrop.classList.remove('dragover'));
    $facPhDrop.addEventListener('drop',      e  => { e.preventDefault(); $facPhDrop.classList.remove('dragover'); if (e.dataTransfer.files.length) pickFacultyPhoto(e.dataTransfer.files[0]); });
    $facPhInput.addEventListener('change',   ()  => { if ($facPhInput.files.length) pickFacultyPhoto($facPhInput.files[0]); });
    function pickFacultyPhoto(file) {
      if (file.size > 5*1024*1024) { alert('File too large (max 5 MB)'); return; }
      setSelectedFacultyPhoto(file);
      document.getElementById('faculty-photo-thumb').src = URL.createObjectURL(file);
      document.getElementById('faculty-photo-preview').classList.remove('view-hidden');
    }
    document.getElementById('faculty-photo-clear').addEventListener('click', () => {
      setSelectedFacultyPhoto(null); $facPhInput.value = '';
      document.getElementById('faculty-photo-preview').classList.add('view-hidden');
    });

    document.getElementById('add-faculty-form').addEventListener('submit', async e => {
      e.preventDefault();
      const name     = document.getElementById('faculty-name').value.trim();
      const title    = document.getElementById('faculty-title').value.trim();
      const bio      = document.getElementById('faculty-bio').value.trim();
      const order    = parseInt(document.getElementById('faculty-order').value) || 0;
      const category = document.getElementById('faculty-category').value;
      if (!name || !bio) return;
      let photoUrl = null;
      if (selectedFacultyPhoto) {
        try { photoUrl = await uploadImageToStorage(selectedFacultyPhoto); }
        catch (err) { alert('Photo upload error: ' + err.message); return; }
      }
      try {
        await addFacultyMember(name, title||null, bio, photoUrl, order, category||null);
        ['faculty-name','faculty-title','faculty-bio','faculty-order'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('faculty-category').value = '';
        setSelectedFacultyPhoto(null); $facPhInput.value = '';
        document.getElementById('faculty-photo-preview').classList.add('view-hidden');
        await renderAdminFaculty();
        if (currentView === 'faculty') await renderFacultyPage();
      } catch (err) { alert('Error: ' + err.message); }
    });

    document.getElementById('add-program-form').addEventListener('submit', async e => {
      e.preventDefault();
      const name    = document.getElementById('program-name').value.trim();
      const rawSlug = document.getElementById('program-slug').value.trim();
      const slug    = rawSlug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const desc    = document.getElementById('program-description').value.trim();
      const order   = parseInt(document.getElementById('program-order').value) || 0;
      if (!name) return;
      try {
        await addProgramItem(name, slug, desc||null, null, order);
        ['program-name','program-slug','program-description','program-order'].forEach(id => document.getElementById(id).value = '');
        await renderAdminPrograms();
        await populateProgramsDropdown();
      } catch (err) { alert('Error: ' + err.message); }
    });

    document.getElementById('add-concert-form').addEventListener('submit', async e => {
      e.preventDefault();
      const title = document.getElementById('concert-title').value.trim();
      const body  = document.getElementById('concert-body').value.trim();
      const order = parseInt(document.getElementById('concert-order').value) || 0;
      if (!title || !body) return;
      try {
        await addConcertSection(title, body, order);
        ['concert-title','concert-body','concert-order'].forEach(id => document.getElementById(id).value = '');
        await renderAdminConcert();
        if (currentView === 'concert') await renderConcertPage();
      } catch (err) { alert('Error: ' + err.message); }
    });

    document.getElementById('tos-settings-form').addEventListener('submit', async e => {
      e.preventDefault();
      try {
        const tos = await fetchTosSettings();
        await saveTosSettings({
          ...tos,
          title: document.getElementById('tos-title').value.trim(),
          subtitle: document.getElementById('tos-subtitle').value.trim(),
        });
        if (currentView === 'tos') await renderTosPage();
        alert('Terms page info updated.');
      } catch (err) {
        alert('Save failed: ' + err.message);
      }
    });

    document.getElementById('add-tos-section-form').addEventListener('submit', async e => {
      e.preventDefault();
      const title = document.getElementById('tos-section-title').value.trim();
      const body  = document.getElementById('tos-section-body').value.trim();
      if (!title || !body) return;
      try {
        await addTosSection(title, body);
        document.getElementById('tos-section-title').value = '';
        document.getElementById('tos-section-body').value = '';
        await renderAdminTosSettings();
        if (currentView === 'tos') await renderTosPage();
      } catch (err) { alert('Error: ' + err.message); }
    });

    // ════════════════════════════════════════════════
    //  CONTACT INFO + FAQ — FORM HANDLERS
    // ════════════════════════════════════════════════
    document.getElementById('contact-info-form').addEventListener('submit', async e => {
      e.preventDefault();
      const $status = document.getElementById('ci-status');
      $status.classList.add('view-hidden');
      const data = {
        email:       document.getElementById('ci-email').value.trim(),
        phone:       document.getElementById('ci-phone').value.trim(),
        location:    document.getElementById('ci-location').value.trim(),
        helper_text: document.getElementById('ci-helper').value.trim(),
        facebook:    document.getElementById('ci-facebook').value.trim(),
        youtube:     document.getElementById('ci-youtube').value.trim(),
        wechat:      document.getElementById('ci-wechat').value.trim(),
      };
      try {
        await saveSetting('contact_info', data);
        $status.textContent = 'Saved!';
        $status.classList.remove('view-hidden');
        setTimeout(() => $status.classList.add('view-hidden'), 3000);
        if (currentView === 'home') await renderHomeContactInfo();
        renderFooterSocial(data);
      } catch (err) { alert('Save failed: ' + err.message); }
    });

    document.getElementById('add-faq-form').addEventListener('submit', async e => {
      e.preventDefault();
      const question = document.getElementById('faq-question').value.trim();
      const answer   = document.getElementById('faq-answer').value.trim();
      if (!question || !answer) return;
      try {
        const current = await fetchSetting('faq_data');
        const items   = Array.isArray(current) ? current : [];
        items.push({ id: crypto.randomUUID(), question, answer, display_order: items.length });
        await saveSetting('faq_data', items);
        document.getElementById('faq-question').value = '';
        document.getElementById('faq-answer').value   = '';
        await renderAdminFaq();
        if (currentView === 'home') await renderHomeFaq();
      } catch (err) { alert('Error: ' + err.message); }
    });

    document.getElementById('add-value-form').addEventListener('submit', async e => {
      e.preventDefault();
      const icon_key = document.getElementById('val-icon-key').value || 'star';
      const title    = document.getElementById('val-title').value.trim();
      const body     = document.getElementById('val-body').value.trim();
      if (!title || !body) return;
      try {
        const current = await fetchSetting('values_data');
        const items   = Array.isArray(current) && current.length ? current : [...DEFAULT_VALUES];
        items.push({ id: crypto.randomUUID(), title, body, icon_key, display_order: items.length });
        await saveSetting('values_data', items);
        document.getElementById('val-title').value = '';
        document.getElementById('val-body').value  = '';
        await renderAdminValues();
        if (currentView === 'home') await renderHomeValuesCards();
      } catch (err) { alert('Error: ' + err.message); }
    });

    document.getElementById('add-testimonial-form').addEventListener('submit', async e => {
      e.preventDefault();
      const name  = document.getElementById('tm-name').value.trim();
      const role  = document.getElementById('tm-role').value.trim();
      const quote = document.getElementById('tm-quote').value.trim();
      if (!name || !quote) return;
      try {
        const current = await fetchSetting('testimonials_data');
        const items   = Array.isArray(current) ? current : [];
        items.push({ id: crypto.randomUUID(), name, role, quote, display_order: items.length });
        await saveSetting('testimonials_data', items);
        document.getElementById('tm-name').value  = '';
        document.getElementById('tm-role').value  = '';
        document.getElementById('tm-quote').value = '';
        await renderAdminTestimonials();
        if (currentView === 'home') await renderTestimonials();
      } catch (err) { alert('Error: ' + err.message); }
    });

    // ════════════════════════════════════════════════

    //  ADMIN — PENDING REGISTRATIONS
    // ════════════════════════════════════════════════
    export async function renderAdminPendingRegistrations() {
      const { data: regs, error } = await supabase.from('registrations')
        .select('*')
        .in('status', ['pending', 'awaiting_verification'])
        .order('created_at', { ascending: false });
      if (error) { console.error(error); return; }
      const $tbody = document.getElementById('admin-pending-tbody');
      const $empty = document.getElementById('admin-pending-empty');
      const $badge = document.getElementById('pending-reg-badge');
      if (!regs || !regs.length) {
        $tbody.innerHTML = ''; $empty.classList.remove('view-hidden');
        $badge.classList.add('view-hidden'); return;
      }
      $empty.classList.add('view-hidden');
      $badge.textContent = `${regs.length} pending`; $badge.classList.remove('view-hidden');
      $tbody.innerHTML = regs.map(r => `<tr>
        <td class="px-4 py-3 font-medium">${esc(r.student_name)}</td>
        <td class="px-4 py-3 text-ink/70">${esc(r.parent_name)}</td>
        <td class="px-4 py-3 text-ink/60 text-xs"><div>${esc(r.email)}</div><div>${esc(r.phone)}</div></td>
        <td class="px-4 py-3 text-ink/60 text-xs">${esc(r.class_name||'—')}</td>
        <td class="px-4 py-3">
          <span class="text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[r.status]||''}">
            ${STATUS_LABELS[r.status]||r.status}
          </span>
        </td>
        <td class="px-4 py-3 text-ink/40 text-xs whitespace-nowrap">${new Date(r.created_at).toLocaleDateString()}</td>
        <td class="px-4 py-3 text-center whitespace-nowrap">
          <button data-approve-reg="${r.id}" class="btn-imperial text-xs px-3 py-1.5 rounded-lg font-medium mr-2">Approve</button>
          <button data-deny-reg="${r.id}"    class="text-imperial hover:underline text-xs font-medium">Deny</button>
        </td>
      </tr>`).join('');
      $tbody.querySelectorAll('[data-approve-reg]').forEach(b => b.addEventListener('click', async () => {
        if (await updateRegStatus(b.dataset.approveReg, 'confirmed')) {
          await renderAdminPendingRegistrations();
          await renderAdminRegistrations();
        }
      }));
      $tbody.querySelectorAll('[data-deny-reg]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Mark this registration as cancelled?')) return;
        if (await updateRegStatus(b.dataset.denyReg, 'cancelled')) {
          await renderAdminPendingRegistrations();
          await renderAdminRegistrations();
        }
      }));
    }

    // ════════════════════════════════════════════════