import { DEFAULT_VALUES, VALUE_CARD_ICONS, VALUE_ICON_LABELS, editMode, homeValuesSortable, setHomeValuesSortable } from './state.js';
import { addAboutSection, deleteAboutSection, fetchAboutSections, fetchAwards, fetchGallery, fetchSetting, saveSetting } from './data.js';
import { fetchHeroSetting, initHomeAboutSortable, initHomeValuesSortable, updateAboutSection, uploadImageToStorage } from './visual-editor.js';
import { computeVariants, renderHomeAbout } from './programs.js';
import { renderAdminAbout } from './admin.js';
import { openLightbox } from './lightbox.js';
import { esc, getYouTubeId, isVideoUrl, sanitizeHtml, showFormatToolbar } from './utils.js';
import { initReveal } from './main.js';

    //  RENDER — HOME
    // ════════════════════════════════════════════════
    export function renderSkeletonCards(containerId, count = 3) {
      const $container = document.getElementById(containerId);
      if (!$container) return;
      $container.innerHTML = Array.from({ length: count }, () => `
        <div class="bg-surface/60 border border-imperial/10 rounded-xl p-6">
          <div class="skeleton skeleton-line w-1/3"></div>
          <div class="skeleton skeleton-line w-full"></div>
          <div class="skeleton skeleton-line w-5/6"></div>
        </div>
      `).join('');
    }

    async function fetchHeroContentSetting() {
      const data = await fetchSetting('hero_content');
      return {
        estLabel: data && typeof data === 'object' && typeof data.estLabel === 'string' && data.estLabel.trim()
          ? data.estLabel.trim()
          : 'Est. 2009'
      };
    }

    export async function renderHeroContent() {
      const $est = document.getElementById('hero-est-text');
      if (!$est) return;
      const heroContent = await fetchHeroContentSetting();
      $est.textContent = heroContent.estLabel;
    }

    export async function renderHeroPhoto() {
      const $img = document.getElementById('hero-photo-img');
      if (!$img) return;
      // Try dedicated hero setting first
      const hero = await fetchHeroSetting();
      if (hero && hero.value) {
        $img.onload = () => $img.classList.add('loaded');
        $img.src = hero.value;
        return;
      }
      // Fallback to first gallery image
      const photos = await fetchGallery();
      if (!photos.length) return;
      $img.onload = () => $img.classList.add('loaded');
      $img.src = photos[0].image_url;
    }

    export async function renderAdminHeroSettings() {
      const $input = document.getElementById('hero-est-input');
      if (!$input) return;
      const heroContent = await fetchHeroContentSetting();
      $input.value = heroContent.estLabel;
      await renderAdminHeroPreview();
    }

    export async function renderAdminHeroPreview() {
      const $preview = document.getElementById('hero-admin-preview');
      if (!$preview) return;
      const hero = await fetchHeroSetting();
      if (hero && hero.value) {
        $preview.innerHTML = `<img src="${esc(hero.value)}" class="w-full h-full object-cover" alt="Hero"/>`;
      } else {
        const photos = await fetchGallery();
        if (photos.length) {
          $preview.innerHTML = `<img src="${esc(photos[0].image_url)}" class="w-full h-full object-cover" alt="Hero"/><span class="absolute bottom-1 right-1 text-[10px] bg-ink/50 text-cream px-1 rounded">from gallery</span>`;
        } else {
          $preview.innerHTML = '<span class="text-ink/30 text-xs">No hero image</span>';
        }
      }
    }

    export async function renderHomeAwards() {
      const awards = await fetchAwards();
      const $list  = document.getElementById('awards-list');
      const $empty = document.getElementById('awards-empty');
      if (!awards.length) { $list.innerHTML = ''; $empty.classList.remove('view-hidden'); return; }
      $empty.classList.add('view-hidden');
      // Duplicate chips for seamless infinite marquee (animation translateX(-50%) loops back to start)
      const chipHtml = awards.map(a => `
        <div class="award-chip">
          ${a.year ? `<span class="award-chip-year">${esc(a.year)}</span>` : ''}
          <span class="award-chip-title">${esc(a.title)}</span>
        </div>`).join('');
      $list.innerHTML = chipHtml + chipHtml;
    }

    export async function renderHomeGallery() {
      const photos = await fetchGallery();
      const $grid  = document.getElementById('gallery-grid');
      if (!$grid) return;
      if (!photos.length) {
        $grid.innerHTML = `<div class="hp-gallery-empty">Photos coming soon</div>`;
        return;
      }
      const displayed = photos.slice(0, 3);
      $grid.innerHTML = displayed.map((p, i) => {
        const ytId = getYouTubeId(p.image_url);
        const isLarge = i === 0;
        const mediaHtml = ytId
          ? `<div class="yt-thumb-wrap" data-lburl="${esc(p.image_url)}" data-lbcap="${esc(p.caption||'')}">
               <img src="https://img.youtube.com/vi/${ytId}/hqdefault.jpg" alt="${esc(p.caption||'Video')}" loading="lazy" />
               <div class="yt-play-overlay"></div>
             </div>`
          : `<img src="${esc(p.image_url)}" alt="${esc(p.caption||'Gallery photo')}" loading="lazy" />`;
        return `<div class="hp-gallery-photo${isLarge ? ' large' : ''}" data-lburl="${esc(p.image_url)}" data-lbcap="${esc(p.caption||'')}">
          ${mediaHtml}
          ${p.caption ? `<div class="hp-gallery-photo-cap">${esc(p.caption)}</div>` : ''}
        </div>`;
      }).join('') || `<div class="hp-gallery-empty">Photos coming soon</div>`;
      $grid.querySelectorAll('.hp-gallery-photo').forEach(card => {
        card.addEventListener('click', () => {
          openLightbox(card.dataset.lburl, card.dataset.lbcap || '');
        });
      });
    }

    // ════════════════════════════════════════════════
    //  CONTACT INFO + FAQ — DATA & RENDER
    // ════════════════════════════════════════════════
    const DEFAULT_CONTACT_INFO = {
      email:       'brightpearlacademy@gmail.com',
      phone:       '617-971-8866',
      location:    '61 Chestnut St, West Newton, MA 02465',
      wechat:      'J3477495715',
      facebook:    'https://www.facebook.com/BrightPearlAcademy',
      youtube:     'https://www.youtube.com/@BrightPearlAcademy',
      instagram:   '',
      helper_text: 'Have questions before registering? We usually reply within 1 business day.',
    };
    const DEFAULT_FAQ = [
      { id: 'faq-1', question: 'When does registration open?',       answer: 'Registration opens seasonally. Join the waitlist through the registration form now.',                                                                                         display_order: 0 },
      { id: 'faq-2', question: 'How are students placed?',            answer: 'Placement is based on age, experience, and a brief instructor review if needed.',                                                                                            display_order: 1 },
      { id: 'faq-3', question: 'What happens after I apply?',         answer: 'We confirm details by email and send next steps within 1–2 business days.',                                                                                                 display_order: 2 },
      { id: 'faq-4', question: 'How do I find out about tuition?',    answer: 'Pricing is available upon registration or by contacting us directly at brightpearlacademy@gmail.com or 617-971-8866.',                                                       display_order: 3 },
      { id: 'faq-5', question: 'What payment methods are accepted?',  answer: 'We accept Venmo, Zelle, Cash, and Check.',                                                                                                                                   display_order: 4 },
      { id: 'faq-6', question: 'What is the refund policy?',          answer: 'All payments are non-refundable. Once payment is made, it cannot be refunded under any circumstances. Please contact us before registering if you have any concerns.',        display_order: 5 },
    ];

    export async function fetchContactInfo() {
      const data = await fetchSetting('contact_info');
      return data && typeof data === 'object' ? { ...DEFAULT_CONTACT_INFO, ...data } : DEFAULT_CONTACT_INFO;
    }
    async function fetchFaqData() {
      const data = await fetchSetting('faq_data');
      const list = Array.isArray(data) ? data : [];
      return list.length ? list.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)) : DEFAULT_FAQ;
    }

    export async function renderHomeContactInfo() {
      const ci   = await fetchContactInfo();
      const $card = document.getElementById('contact-info-card');
      $card.innerHTML = `
        <h3 class="font-display text-xl text-ink mb-3">Contact &amp; Enrollment Help</h3>
        <p class="text-sm text-ink/60 mb-4">${esc(ci.helper_text)}</p>
        <div class="space-y-2 text-sm">
          ${ci.phone    ? `<p><span class="font-medium text-ink">Phone:</span> <a href="tel:${esc(ci.phone)}" class="hover:text-imperial transition-colors">${esc(ci.phone)}</a></p>` : ''}
          ${ci.email    ? `<p><span class="font-medium text-ink">Email:</span> <a href="mailto:${esc(ci.email)}" class="hover:text-imperial transition-colors">${esc(ci.email)}</a></p>` : ''}
          ${ci.location ? `<p><span class="font-medium text-ink">Address:</span> ${esc(ci.location)}</p>` : ''}
          ${ci.wechat   ? `<p><span class="font-medium text-ink">WeChat:</span> ${esc(ci.wechat)}</p>` : ''}
        </div>
        ${(ci.facebook || ci.youtube) ? `
        <div class="flex gap-3 mt-4">
          ${ci.facebook ? `<a href="${esc(ci.facebook)}" target="_blank" rel="noopener noreferrer" class="text-ink/50 hover:text-imperial transition-colors" aria-label="Facebook">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>` : ''}
          ${ci.youtube ? `<a href="${esc(ci.youtube)}" target="_blank" rel="noopener noreferrer" class="text-ink/50 hover:text-imperial transition-colors" aria-label="YouTube">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>` : ''}
        </div>` : ''}`;
      renderFooterSocial(ci);
    }

    export function renderFooterSocial(ci) {
      const FB_SVG  = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
      const YT_SVG  = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
      const IG_SVG  = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
      const html = [
        ci.instagram ? `<a href="${esc(ci.instagram)}" target="_blank" rel="noopener noreferrer" class="text-ink/50 hover:text-imperial transition-colors" aria-label="Instagram">${IG_SVG}</a>` : '',
        ci.facebook  ? `<a href="${esc(ci.facebook)}"  target="_blank" rel="noopener noreferrer" class="text-ink/50 hover:text-imperial transition-colors" aria-label="Facebook">${FB_SVG}</a>`  : '',
        ci.youtube   ? `<a href="${esc(ci.youtube)}"   target="_blank" rel="noopener noreferrer" class="text-ink/50 hover:text-imperial transition-colors" aria-label="YouTube">${YT_SVG}</a>`   : '',
      ].join('');
      document.querySelectorAll('.footer-social-links').forEach(el => { el.innerHTML = html; });
    }

    export async function renderHomeFaq() {
      const items = await fetchFaqData();
      const $card  = document.getElementById('faq-card');
      $card.innerHTML = `
        <h3 class="font-display text-xl text-ink mb-3">Quick FAQ</h3>
        <div class="space-y-3 text-sm text-ink/65">
          ${items.map(item => `
            <div>
              <p class="font-medium text-ink">${esc(item.question)}</p>
              <p>${esc(item.answer)}</p>
            </div>`).join('')}
        </div>`;
    }

    // ════════════════════════════════════════════════
    //  VALUES / BELIEFS CARDS — Data + Render
    // ════════════════════════════════════════════════
    export async function fetchValuesData() {
      const data = await fetchSetting('values_data');
      return Array.isArray(data) && data.length
        ? data.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        : DEFAULT_VALUES;
    }

    export async function renderHomeValuesCards() {
      const $grid = document.getElementById('hp-values-grid');
      if (!$grid) return;
      const values = await fetchValuesData();

      const SVG_DRAG   = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg>`;
      const SVG_PENCIL = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>`;
      const SVG_TRASH  = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>`;

      const iconPickerHtml = Object.keys(VALUE_CARD_ICONS).map(key => `
        <button type="button" class="val-icon-opt" data-icon-key="${key}" title="${VALUE_ICON_LABELS[key] || key}">
          ${VALUE_CARD_ICONS[key]}
        </button>`).join('');

      $grid.innerHTML = values.map((v, idx) => `
        <div class="hp-value-card" data-val-id="${esc(v.id)}">
          <div class="val-card-toolbar">
            <div class="drag-handle" title="Drag to reorder">${SVG_DRAG}</div>
            <button class="val-edit-btn" data-val-id="${esc(v.id)}" title="Edit card">${SVG_PENCIL}</button>
            <button class="val-del-btn" data-val-id="${esc(v.id)}" title="Delete card">${SVG_TRASH}</button>
          </div>
          <div class="hp-value-icon val-icon-wrap" data-val-id="${esc(v.id)}" title="${editMode ? 'Click to change icon' : ''}" style="${editMode ? 'cursor:pointer' : ''}">${VALUE_CARD_ICONS[v.icon_key] || VALUE_CARD_ICONS['star']}</div>
          <div class="val-icon-picker" data-val-id="${esc(v.id)}">${iconPickerHtml}</div>
          <h3 class="hp-value-title val-title-el" data-val-id="${esc(v.id)}">${esc(v.title)}</h3>
          <p class="hp-value-body val-body-el" data-val-id="${esc(v.id)}">${esc(v.body)}</p>
        </div>`).join('') + `
      <div class="val-add-row">
        <button id="hp-val-add-btn" class="btn-outline px-5 py-2 text-sm font-medium">+ Add Value Card</button>
      </div>`;

      // Icon click → toggle icon picker
      $grid.querySelectorAll('.val-icon-wrap').forEach(wrap => {
        wrap.addEventListener('click', () => {
          if (!editMode) return;
          const picker = $grid.querySelector(`.val-icon-picker[data-val-id="${wrap.dataset.valId}"]`);
          if (picker) picker.classList.toggle('open');
        });
      });

      // Icon picker option selected
      $grid.querySelectorAll('.val-icon-opt').forEach(btn => {
        btn.addEventListener('click', async e => {
          e.stopPropagation();
          const picker = btn.closest('.val-icon-picker');
          const valId  = picker.dataset.valId;
          const newKey = btn.dataset.iconKey;
          picker.classList.remove('open');
          const vals = await fetchValuesData();
          const idx  = vals.findIndex(v => v.id === valId);
          if (idx === -1) return;
          vals[idx].icon_key = newKey;
          await saveSetting('values_data', vals);
          await renderHomeValuesCards();
          if (homeValuesSortable) { homeValuesSortable.destroy(); setHomeValuesSortable(null); }
          if (editMode) initHomeValuesSortable();
        });
      });

      // Pencil → contentEditable inline edit
      $grid.querySelectorAll('.val-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const valId  = btn.dataset.valId;
          const card   = $grid.querySelector(`.hp-value-card[data-val-id="${valId}"]`);
          const $title = card.querySelector('.val-title-el');
          const $body  = card.querySelector('.val-body-el');
          if ($title.contentEditable === 'true') {
            // Save & close
            [$title, $body].forEach(el => { el.contentEditable = 'false'; el.style.outline = ''; });
            card.querySelector('.val-inline-save')?.remove();
            fetchValuesData().then(async vals => {
              const idx = vals.findIndex(v => v.id === valId);
              if (idx !== -1) {
                vals[idx].title = $title.textContent.trim();
                vals[idx].body  = $body.textContent.trim();
                await saveSetting('values_data', vals);
              }
            });
          } else {
            // Open edit
            [$title, $body].forEach(el => {
              el.contentEditable = 'true';
              el.style.outline = '1px dashed rgb(var(--imperial-rgb) / 0.4)';
              el.style.borderRadius = '3px';
              el.style.minHeight = '1em';
            });
            $title.focus();
            if (!card.querySelector('.val-inline-save')) {
              const sb = document.createElement('button');
              sb.className = 'val-inline-save inline-save-btn';
              sb.textContent = 'Save Changes';
              sb.addEventListener('click', async () => {
                [$title, $body].forEach(el => { el.contentEditable = 'false'; el.style.outline = ''; el.style.borderRadius = ''; });
                sb.remove();
                const vals = await fetchValuesData();
                const idx  = vals.findIndex(v => v.id === valId);
                if (idx !== -1) {
                  vals[idx].title = $title.textContent.trim();
                  vals[idx].body  = $body.textContent.trim();
                  await saveSetting('values_data', vals);
                }
                await renderHomeValuesCards();
                if (homeValuesSortable) { homeValuesSortable.destroy(); setHomeValuesSortable(null); }
                if (editMode) initHomeValuesSortable();
              });
              card.appendChild(sb);
            }
          }
        });
      });

      // Delete buttons
      $grid.querySelectorAll('.val-del-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this value card?')) return;
          const vals = await fetchValuesData();
          await saveSetting('values_data', vals.filter(v => v.id !== btn.dataset.valId));
          if (homeValuesSortable) { homeValuesSortable.destroy(); setHomeValuesSortable(null); }
          await renderHomeValuesCards();
          if (editMode) initHomeValuesSortable();
        });
      });

      // Add card button
      document.getElementById('hp-val-add-btn')?.addEventListener('click', async () => {
        const title = prompt('Card title:');
        if (!title?.trim()) return;
        const body = prompt('Card description:');
        if (body === null) return;
        const vals = await fetchValuesData();
        vals.push({ id: crypto.randomUUID(), title: title.trim(), body: body.trim(), icon_key: 'star', display_order: vals.length });
        await saveSetting('values_data', vals);
        if (homeValuesSortable) { homeValuesSortable.destroy(); setHomeValuesSortable(null); }
        await renderHomeValuesCards();
        if (editMode) initHomeValuesSortable();
      });

      // Init sortable if already in edit mode
      if (editMode) initHomeValuesSortable();
    }

    // ════════════════════════════════════════════════
    //  HOMEPAGE — About feature blocks (Our Story)
    // ════════════════════════════════════════════════
    export async function renderHomeAboutFeatures() {
      const $container = document.getElementById('home-about-sections');
      if (!$container) return;
      const sections = await fetchAboutSections();

      const SVG_DRAG   = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg>`;
      const SVG_PENCIL = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>`;
      const SVG_TRASH  = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>`;
      const SVG_IMG    = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`;
      const SVG_CAM    = `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/></svg>`;
      const SVG_VID    = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`;

      const addRowHtml = `
        <div class="home-about-add-row">
          <button class="home-about-add-btn" id="home-about-add-btn">+ Add Section</button>
          <div class="home-about-add-form" id="home-about-add-form">
            <p style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgb(var(--ink-rgb)/0.5);margin-bottom:0.5rem;">Layout</p>
            <div id="haf-type-picker" style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem;">
              <button type="button" class="haf-type-btn active" data-type="text"
                style="display:flex;flex-direction:column;align-items:center;gap:0.3rem;padding:0.5rem 0.75rem;border-radius:0.5rem;border:1.5px solid rgb(var(--imperial-rgb)/0.3);background:rgb(var(--imperial-rgb)/0.08);cursor:pointer;font-size:0.72rem;color:inherit;transition:border-color 0.15s,background 0.15s;">
                <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="26" height="18" rx="2"/><line x1="5" y1="6" x2="23" y2="6"/><line x1="5" y1="10" x2="23" y2="10"/><line x1="5" y1="14" x2="16" y2="14"/></svg>
                Text Block
              </button>
              <button type="button" class="haf-type-btn" data-type="photo"
                style="display:flex;flex-direction:column;align-items:center;gap:0.3rem;padding:0.5rem 0.75rem;border-radius:0.5rem;border:1.5px solid rgb(var(--imperial-rgb)/0.15);background:transparent;cursor:pointer;font-size:0.72rem;color:inherit;transition:border-color 0.15s,background 0.15s;">
                <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="12" height="18" rx="2"/><rect x="15" y="1" width="12" height="18" rx="2"/><path d="M3 14l3-3 2 2 3-3"/></svg>
                Photo + Text
              </button>
              <button type="button" class="haf-type-btn" data-type="video"
                style="display:flex;flex-direction:column;align-items:center;gap:0.3rem;padding:0.5rem 0.75rem;border-radius:0.5rem;border:1.5px solid rgb(var(--imperial-rgb)/0.15);background:transparent;cursor:pointer;font-size:0.72rem;color:inherit;transition:border-color 0.15s,background 0.15s;">
                <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="12" height="18" rx="2"/><rect x="15" y="1" width="12" height="18" rx="2"/><polygon points="5,7 5,13 9,10" fill="currentColor" stroke="none"/></svg>
                Video + Text
              </button>
            </div>
            <input id="haf-eyebrow" type="text" placeholder="Eyebrow label (optional)" style="margin-bottom:0.5rem;" />
            <input id="haf-title" type="text" placeholder="Section title *" />
            <textarea id="haf-body" rows="4" placeholder="Section body text *" style="resize:vertical"></textarea>
            <div id="haf-photo-row" style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
              <div id="haf-img-drop" class="drop-zone flex-1 min-w-[180px] !py-2" style="cursor:pointer">
                <p class="text-ink/50 text-xs">Photo — drop or <span class="text-imperial font-medium">click</span></p>
                <input id="haf-img-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" />
              </div>
              <div id="haf-img-preview" class="view-hidden flex items-center gap-2">
                <img id="haf-img-thumb" class="w-12 h-8 object-cover rounded border border-imperial/10" src="" alt=""/>
                <button type="button" id="haf-img-clear" class="text-imperial text-xs hover:underline">Clear</button>
              </div>
            </div>
            <div id="haf-video-row" style="display:none;align-items:center;gap:0.5rem;">
              <input id="haf-yt-url" type="url" placeholder="Paste a YouTube URL"
                style="flex:1;padding:0.4rem 0.6rem;border:1px solid rgb(var(--imperial-rgb)/0.2);border-radius:0.375rem;font-size:0.8rem;background:transparent;color:inherit;" />
              <div id="haf-yt-preview" class="view-hidden" style="width:60px;height:36px;border-radius:4px;overflow:hidden;position:relative;flex-shrink:0;">
                <img id="haf-yt-thumb" src="" style="width:100%;height:100%;object-fit:cover;" alt="" />
                <div class="yt-play-overlay" style="transform:scale(0.55);"></div>
              </div>
            </div>
            <div class="home-about-add-form-btns">
              <button class="btn-imperial px-4 py-2 rounded text-sm font-medium" id="haf-submit-btn">Add Section</button>
              <button class="btn-outline px-4 py-2 rounded text-sm font-medium" id="haf-cancel-btn">Cancel</button>
            </div>
          </div>
        </div>`;

      if (!sections.length) {
        $container.innerHTML = addRowHtml;
        $container.classList.add('cb-grid');
        wireHomeAboutAddForm();
        return;
      }

      $container.classList.add('cb-grid');
      const variants = computeVariants(sections);

      $container.innerHTML = sections.map((s, idx) => {
        const v    = variants[idx];
        const flip = idx % 2 !== 0;

        const toolbar = `
          <div class="section-toolbar">
            <div class="drag-handle" title="Drag to reorder">${SVG_DRAG}</div>
            <button class="haf-edit-btn" data-edit-id="${esc(s.id)}" title="Edit text">${SVG_PENCIL}</button>
            <button class="haf-img-btn" data-img-id="${esc(s.id)}" title="${s.image_url && !isVideoUrl(s.image_url) ? 'Change photo' : 'Add photo'}">${SVG_IMG}</button>
            <button class="haf-vid-btn" data-vid-id="${esc(s.id)}" title="${isVideoUrl(s.image_url) ? 'Change video' : 'Add YouTube video'}">${SVG_VID}</button>
            <button class="haf-del-btn" data-del-id="${esc(s.id)}" title="Delete section">${SVG_TRASH}</button>
          </div>`;

        if (v.kind === 'text') {
          const num = String(idx + 1).padStart(2, '0');
          return `
            <div class="editable-section cb-manifesto reveal" data-section-id="${esc(s.id)}" style="grid-column: 1 / -1">
              ${toolbar}
              <div class="cb-manifesto-num">${num}</div>
              <div class="cb-manifesto-text hp-feature-text">
                <p class="cb-eyebrow haf-eyebrow" data-id="${esc(s.id)}">${esc(s.eyebrow || 'Our Story')}</p>
                <h3 class="cb-manifesto-title hp-feature-heading haf-title" data-id="${esc(s.id)}">${esc(s.title)}</h3>
                <div class="cb-manifesto-body cb-body hp-feature-body haf-body" data-id="${esc(s.id)}">${sanitizeHtml(s.body)}</div>
              </div>
            </div>`;
        }

        const isVid = isVideoUrl(s.image_url);
        const ytId  = isVid ? getYouTubeId(s.image_url) : null;
        const photoContent = isVid
          ? `<div class="yt-thumb-wrap" style="position:absolute;inset:0;width:100%;height:100%;cursor:pointer" data-lburl="${esc(s.image_url)}">
               <img src="https://img.youtube.com/vi/${ytId}/mqdefault.jpg" alt="${esc(s.title)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" />
               <div class="yt-play-overlay"></div>
             </div>`
          : `<img class="hp-feature-img" src="${esc(s.image_url)}" alt="${esc(s.title)}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
             <div class="hp-photo-upload-overlay">${SVG_CAM}<span>Change photo</span></div>
             <input class="haf-photo-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none" />`;
        return `
          <div class="editable-section cb-zigzag${flip ? ' flip' : ''} haf-zigzag-row reveal" data-section-id="${esc(s.id)}" style="grid-column:1/-1; position:relative;">
            ${toolbar}
            <div class="cb-zigzag-photo hp-feature-photo-wrap"${isVid ? '' : ` data-upload-sid="${esc(s.id)}"`}>
              ${photoContent}
            </div>
            <div class="cb-zigzag-text hp-feature-text">
              <p class="cb-eyebrow haf-eyebrow" data-id="${esc(s.id)}">${esc(s.eyebrow || 'Our Story')}</p>
              <h3 class="hp-feature-heading haf-title" data-id="${esc(s.id)}">${esc(s.title)}</h3>
              <div class="cb-body hp-feature-body haf-body" data-id="${esc(s.id)}">${sanitizeHtml(s.body)}</div>
            </div>
          </div>`;
      }).join('') + addRowHtml;

      // Lazy-load images
      $container.querySelectorAll('.hp-feature-img').forEach(img => {
        if (img.complete && img.naturalWidth) img.classList.add('loaded');
        else img.addEventListener('load', () => img.classList.add('loaded'));
      });

      // Inline text editing
      $container.querySelectorAll('.haf-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id       = btn.dataset.editId;
          const block    = $container.querySelector(`[data-section-id="${id}"]`);
          const $eyebrow = block.querySelector('.haf-eyebrow');
          const $title   = block.querySelector('.haf-title');
          const $body    = block.querySelector('.haf-body');
          if ($title.contentEditable === 'true') {
            [$eyebrow, $title, $body].forEach(el => el.contentEditable = 'false');
            const sb = block.querySelector('.inline-save-btn'); if (sb) sb.remove();
            block.querySelector('.format-toolbar')?.remove();
            updateAboutSection(id, { eyebrow: $eyebrow.textContent.trim(), title: $title.textContent.trim(), body: sanitizeHtml($body.innerHTML.trim()) })
              .then(() => renderHomeAboutFeatures());
          } else {
            [$eyebrow, $title, $body].forEach(el => el.contentEditable = 'true'); $eyebrow.focus();
            showFormatToolbar($body);
            if (!block.querySelector('.inline-save-btn')) {
              const sb = document.createElement('button');
              sb.className = 'inline-save-btn'; sb.textContent = 'Save Changes';
              sb.addEventListener('click', async () => {
                await updateAboutSection(id, { eyebrow: $eyebrow.textContent.trim(), title: $title.textContent.trim(), body: sanitizeHtml($body.innerHTML.trim()) });
                [$eyebrow, $title, $body].forEach(el => el.contentEditable = 'false');
                block.querySelector('.format-toolbar')?.remove();
                sb.remove();
                await renderHomeAboutFeatures();
              });
              block.querySelector('.cb-text-pane, .hp-feature-text') ?
                block.querySelector('.cb-text-pane, .hp-feature-text').appendChild(sb) :
                block.appendChild(sb);
            }
          }
        });
      });

      // Delete sections
      $container.querySelectorAll('.haf-del-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this section?')) return;
          if (await deleteAboutSection(btn.dataset.delId)) {
            await renderHomeAboutFeatures();
            await renderHomeAbout();
            await renderAdminAbout();
          }
        });
      });

      // Photo upload via overlay click or toolbar image button
      $container.querySelectorAll('.hp-feature-photo-wrap[data-upload-sid]').forEach(wrap => {
        const sectionId = wrap.dataset.uploadSid;
        const overlay   = wrap.querySelector('.hp-photo-upload-overlay');
        const fileInput = wrap.querySelector('.haf-photo-file');
        const imgEl     = wrap.querySelector('.hp-feature-img');
        overlay.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
        fileInput.addEventListener('change', async () => {
          const file = fileInput.files[0]; if (!file) return;
          overlay.innerHTML = '<span>Uploading…</span>';
          try {
            const url = await uploadImageToStorage(file);
            await updateAboutSection(sectionId, { image_url: url });
            imgEl.src = url; imgEl.classList.remove('loaded');
            imgEl.onload = () => imgEl.classList.add('loaded');
            overlay.innerHTML = SVG_CAM + '<span>Change photo</span>';
          } catch (err) {
            overlay.innerHTML = SVG_CAM + '<span>Change photo</span>';
            alert('Upload failed: ' + err.message);
          }
          fileInput.value = '';
        });
      });

      // Image button on toolbar (for both text-only and photo blocks)
      $container.querySelectorAll('.haf-img-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id    = btn.dataset.imgId;
          const block = $container.querySelector(`[data-section-id="${id}"]`);
          const fi    = block.querySelector('.haf-photo-file');
          if (fi) { fi.click(); return; }
          // Text-only block has no file input yet — create one, upload, and re-render
          const newInput = document.createElement('input');
          newInput.type = 'file'; newInput.accept = 'image/jpeg,image/png,image/webp,image/gif';
          newInput.style.display = 'none';
          block.appendChild(newInput);
          newInput.addEventListener('change', async () => {
            const file = newInput.files[0]; if (!file) return;
            try {
              const url = await uploadImageToStorage(file);
              await updateAboutSection(id, { image_url: url });
              await renderHomeAboutFeatures();
              await renderHomeAbout();
              await renderAdminAbout();
            } catch (err) { alert('Upload failed: ' + err.message); }
          });
          newInput.click();
        });
      });

      // YouTube video button on toolbar
      $container.querySelectorAll('.haf-vid-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id  = btn.dataset.vidId;
          const raw = prompt('Paste a YouTube URL:');
          if (raw === null) return;
          const ytId = getYouTubeId(raw.trim());
          if (!ytId) { alert('Invalid YouTube URL. Please use a youtube.com or youtu.be link.'); return; }
          updateAboutSection(id, { image_url: raw.trim() }).then(ok => {
            if (ok) renderHomeAboutFeatures();
          });
        });
      });

      // Lightbox clicks on YouTube thumbnails in feature cards
      $container.querySelectorAll('.yt-thumb-wrap[data-lburl]').forEach(el => {
        el.addEventListener('click', () => openLightbox(el.dataset.lburl, ''));
      });

      // Wire add-section form
      wireHomeAboutAddForm();

      // Init sortable if in edit mode
      if (editMode) initHomeAboutSortable();

      // Re-observe any newly rendered reveal elements
      if (typeof initReveal === 'function') setTimeout(initReveal, 60);
    }

    function wireHomeAboutAddForm() {
      const $btn      = document.getElementById('home-about-add-btn');
      const $form     = document.getElementById('home-about-add-form');
      const $cancel   = document.getElementById('haf-cancel-btn');
      const $submit   = document.getElementById('haf-submit-btn');
      const $drop     = document.getElementById('haf-img-drop');
      const $imgIn    = document.getElementById('haf-img-input');
      const $prev     = document.getElementById('haf-img-preview');
      const $thumb    = document.getElementById('haf-img-thumb');
      const $clear    = document.getElementById('haf-img-clear');
      const $ytUrl    = document.getElementById('haf-yt-url');
      const $ytPrev   = document.getElementById('haf-yt-preview');
      const $ytThm    = document.getElementById('haf-yt-thumb');
      const $photoRow = document.getElementById('haf-photo-row');
      const $videoRow = document.getElementById('haf-video-row');
      if (!$btn || !$form) return;
      let _file = null;
      let _sectionType = 'text'; // 'text' | 'photo' | 'video'

      // Layout type picker
      document.getElementById('haf-type-picker')?.querySelectorAll('.haf-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.haf-type-btn').forEach(b => {
            b.classList.remove('active');
            b.style.borderColor = 'rgb(var(--imperial-rgb)/0.15)';
            b.style.background  = 'transparent';
          });
          btn.classList.add('active');
          btn.style.borderColor = 'rgb(var(--imperial-rgb)/0.5)';
          btn.style.background  = 'rgb(var(--imperial-rgb)/0.08)';
          _sectionType = btn.dataset.type;
          if (_sectionType === 'photo') {
            $photoRow.style.display = 'flex';
            $videoRow.style.display = 'none';
          } else if (_sectionType === 'video') {
            $photoRow.style.display = 'none';
            $videoRow.style.display = 'flex';
          } else {
            $photoRow.style.display = 'none';
            $videoRow.style.display = 'none';
          }
        });
      });
      // Set initial state: text type = no media rows
      if ($photoRow) $photoRow.style.display = 'none';
      if ($videoRow) $videoRow.style.display = 'none';

      $btn.addEventListener('click', () => { $form.classList.toggle('open'); if ($form.classList.contains('open')) document.getElementById('haf-title')?.focus(); });
      $cancel.addEventListener('click', () => {
        $form.classList.remove('open'); _file = null; $imgIn.value = ''; $prev.classList.add('view-hidden');
        $ytUrl.value = ''; $ytPrev.classList.add('view-hidden'); $ytThm.src = '';
      });
      $drop.addEventListener('click', () => $imgIn.click());
      $drop.addEventListener('dragover', e => { e.preventDefault(); $drop.classList.add('dragover'); });
      $drop.addEventListener('dragleave', () => $drop.classList.remove('dragover'));
      $drop.addEventListener('drop', e => { e.preventDefault(); $drop.classList.remove('dragover'); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) { _file = f; $thumb.src = URL.createObjectURL(f); $prev.classList.remove('view-hidden'); } });
      $imgIn.addEventListener('change', () => { if ($imgIn.files[0]) { _file = $imgIn.files[0]; $thumb.src = URL.createObjectURL(_file); $prev.classList.remove('view-hidden'); } });
      $clear.addEventListener('click', () => { _file = null; $imgIn.value = ''; $prev.classList.add('view-hidden'); });
      $ytUrl.addEventListener('input', () => {
        const id = getYouTubeId($ytUrl.value.trim());
        if (id) { $ytThm.src = `https://img.youtube.com/vi/${id}/mqdefault.jpg`; $ytPrev.classList.remove('view-hidden'); }
        else { $ytPrev.classList.add('view-hidden'); $ytThm.src = ''; }
      });

      $submit.addEventListener('click', async () => {
        const title   = document.getElementById('haf-title').value.trim();
        const body    = document.getElementById('haf-body').value.trim();
        const eyebrow = (document.getElementById('haf-eyebrow')?.value || '').trim();
        if (!title || !body) { alert('Title and body are required.'); return; }
        $submit.disabled = true; $submit.textContent = 'Adding…';
        let imageUrl = null;
        if (_sectionType === 'video') {
          const ytRaw = $ytUrl.value.trim();
          const ytId  = getYouTubeId(ytRaw);
          if (!ytId) { alert('Please paste a valid YouTube URL.'); $submit.disabled = false; $submit.textContent = 'Add Section'; return; }
          imageUrl = ytRaw;
        } else if (_sectionType === 'photo' && _file) {
          try { imageUrl = await uploadImageToStorage(_file); }
          catch (err) { alert('Image upload failed: ' + err.message); $submit.disabled = false; $submit.textContent = 'Add Section'; return; }
        }
        const order = await fetchAboutSections().then(s => s.length);
        if (await addAboutSection(title, body, order, imageUrl, eyebrow || null)) {
          await renderHomeAboutFeatures();
          await renderHomeAbout();
          await renderAdminAbout();
        }
        $submit.disabled = false; $submit.textContent = 'Add Section';
        document.getElementById('haf-eyebrow').value = '';
        $ytUrl.value = ''; $ytPrev.classList.add('view-hidden'); $ytThm.src = '';
      });
    }

    // ════════════════════════════════════════════════