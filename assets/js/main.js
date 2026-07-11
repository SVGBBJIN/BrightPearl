import { supabase } from './state.js';
import { showView } from './auth.js';
import { fetchSetting, saveSetting } from './data.js';
import { fetchContactInfo, renderFooterSocial, renderHeroContent, renderHeroPhoto, renderHomeAboutFeatures, renderHomeAwards, renderHomeContactInfo, renderHomeFaq, renderHomeGallery, renderHomeValuesCards } from './home.js';
import { initProgramsHeaderEdit, loadProgramsHeaderText, renderHomePrograms, renderTestimonials } from './programs.js';
import { populateProgramsDropdown } from './gallery.js';
import { getLang, initI18n, setLang } from './i18n.js';
import { initQuickContactForm } from './contact-form.js';

    // ── i18n: apply static translations before anything paints ──
    initI18n();

    function updateLangToggleLabel() {
      const label = getLang() === 'zh' ? 'EN' : '中文';
      const $nav = document.getElementById('nav-lang-toggle');
      const $mob = document.getElementById('mob-nav-lang-toggle');
      if ($nav) $nav.textContent = label;
      if ($mob) $mob.textContent = label;
    }
    updateLangToggleLabel();
    document.addEventListener('bp:langchange', updateLangToggleLabel);
    [document.getElementById('nav-lang-toggle'), document.getElementById('mob-nav-lang-toggle')].forEach($btn => {
      $btn?.addEventListener('click', () => {
        setLang(getLang() === 'zh' ? 'en' : 'zh');
      });
    });


    // ── Seed default content if DB is empty ────────
    async function initSeedData() {
      // 1. Seed contact_info if not present
      try {
        const existingContact = await fetchSetting('contact_info');
        if (!existingContact || typeof existingContact !== 'object' || !existingContact.email) {
          await saveSetting('contact_info', {
            email:       'brightpearlacademy@gmail.com',
            phone:       '617-971-8866',
            location:    '61 Chestnut St, West Newton, MA 02465',
            wechat:      'J3477495715',
            facebook:    'https://www.facebook.com/BrightPearlAcademy',
            youtube:     'https://www.youtube.com/@BrightPearlAcademy',
            helper_text: 'Have questions before registering? We usually reply within 1 business day.',
          });
        }
      } catch (e) { console.warn('Contact seed skipped:', e); }

      // 2. Seed faculty_data if empty
      try {
        const existingFaculty = await fetchSetting('faculty_data');
        if (!Array.isArray(existingFaculty) || existingFaculty.length === 0) {
          await saveSetting('faculty_data', [
            {
              id: crypto.randomUUID(),
              name: 'Ms. Li Wei',
              title: 'Lead Dance Instructor',
              bio: 'Ms. Li Wei brings over 15 years of classical Chinese dance experience to Bright Pearl Academy. She trained at the Beijing Dance Academy and has choreographed award-winning performances for students across New England. She leads Company A and oversees curriculum for all dance levels.',
              category: 'Dance',
              photo_url: '',
              display_order: 0,
            },
            {
              id: crypto.randomUUID(),
              name: 'Mr. Zhang Ming',
              title: 'Mandarin Language Teacher',
              bio: 'A native Mandarin speaker and certified language educator, Mr. Zhang designs engaging, immersive curriculum that helps students of all ages build real-world Chinese language skills with confidence. His lessons combine conversation, reading, and cultural projects.',
              category: 'Chinese / Mandarin',
              photo_url: '',
              display_order: 1,
            },
            {
              id: crypto.randomUUID(),
              name: 'Ms. Sarah Chen',
              title: 'STEM & Coding Instructor',
              bio: 'Ms. Chen combines a background in software engineering with a passion for education. Her project-based STEM curriculum inspires young innovators to explore technology, computational thinking, and problem-solving in a fun, collaborative environment.',
              category: 'STEM / Coding',
              photo_url: '',
              display_order: 2,
            },
          ]);
        }
      } catch (e) { console.warn('Faculty seed skipped:', e); }

      // 3. Seed gallery if empty
      try {
        const { data: existingGallery } = await supabase.from('gallery').select('id').limit(1);
        if (!existingGallery || existingGallery.length === 0) {
          await supabase.from('gallery').insert([
            { image_url: 'https://picsum.photos/seed/bpa-dance1/800/600',   caption: 'Classical Chinese Dance performance' },
            { image_url: 'https://picsum.photos/seed/bpa-dance2/600/800',   caption: 'Students rehearsing for the annual concert' },
            { image_url: 'https://picsum.photos/seed/bpa-stem1/800/600',    caption: 'STEM coding class in action' },
            { image_url: 'https://picsum.photos/seed/bpa-lang1/600/800',    caption: 'Mandarin language enrichment program' },
            { image_url: 'https://picsum.photos/seed/bpa-concert1/800/600', caption: 'Spring concert performance' },
            { image_url: 'https://picsum.photos/seed/bpa-dance3/800/600',   caption: 'Dance company rehearsal' },
          ]);
        }
      } catch (e) { console.warn('Gallery seed skipped:', e); }

      // 4. Seed concert_data if empty
      try {
        const existingConcert = await fetchSetting('concert_data');
        if (!Array.isArray(existingConcert) || existingConcert.length === 0) {
          await saveSetting('concert_data', [
            {
              id: crypto.randomUUID(),
              title: '2026 Summer Concert',
              body: '<p><strong>Date:</strong> Saturday, June 6, 2026</p><p><strong>Time:</strong> 2:00 PM – 6:00 PM</p><p><strong>Location:</strong> TBD — venue details will be announced soon. Please check back or contact us at brightpearlacademy@gmail.com for updates.</p><p>Join us for an afternoon of stunning dance performances, Mandarin language showcases, and STEM demonstrations. Students from all programs will take the stage for our biggest event of the year. Family and friends are warmly welcome!</p>',
              images: [],
              image_url: null,
              display_order: 0,
            },
          ]);
        }
      } catch (e) { console.warn('Concert seed skipped:', e); }

      // 5. Seed awards if empty
      try {
        const { data: existingAwards } = await supabase.from('awards').select('id').limit(1);
        if (!existingAwards || existingAwards.length === 0) {
          await supabase.from('awards').insert([
            { title: 'Speech Competition Award',   year: '2024', description: 'Students earned top recognition at regional speech competitions.' },
            { title: 'Visual Arts Excellence',     year: '2023', description: 'Award-winning artwork displayed at cultural exhibitions.' },
            { title: 'STEM Innovation Award',      year: '2024', description: 'Coding & STEM students recognized for innovative projects.' },
            { title: 'Dance Festival Gold',        year: '2023', description: 'Classical Chinese dance team earned gold at the Northeast Cultural Festival.' },
            { title: 'Academic Achievement',       year: '2024', description: 'Graduates advanced to top private high schools and leading colleges.' },
          ]);
        }
      } catch (e) { console.warn('Awards seed skipped:', e); }
    }

    // ── Init ───────────────────────────────────────
    showView('home');
    // Seed DB with default content first, then refresh renders
    initSeedData().then(async () => {
      await Promise.all([
        renderHomeAwards().catch(console.error),
        renderHomeGallery().catch(console.error),
        renderHomeContactInfo().catch(console.error),
        renderHomeFaq().catch(console.error),
      ]);
    }).catch(console.error);
    renderHeroPhoto().catch(console.error);
    renderHeroContent().catch(console.error);
    renderHomeContactInfo().catch(console.error);
    renderHomeFaq().catch(console.error);
    renderHomeAboutFeatures().catch(console.error);
    renderHomeValuesCards().catch(console.error);
    renderHomePrograms().catch(console.error);
    loadProgramsHeaderText().catch(console.error);
    populateProgramsDropdown().catch(console.error);
    renderTestimonials().catch(console.error);
    initProgramsHeaderEdit();
    fetchContactInfo().then(renderFooterSocial).catch(console.error);
    initQuickContactForm();

    // ── Scroll Reveal ───────────────────────────────
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
    );
    export function initReveal() {
      document.querySelectorAll('.reveal, .reveal-left, .reveal-group, .reveal-scale, .reveal-fade').forEach((el) => {
        if (!el.classList.contains('is-visible')) revealObserver.observe(el);
      });
    }
    initReveal();
    // Re-init after SPA route changes
    const _pushState = history.pushState.bind(history);
    history.pushState = function (...args) {
      _pushState(...args);
      setTimeout(initReveal, 120);
    };