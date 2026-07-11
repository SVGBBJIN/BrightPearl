import { $aboutView, $adminDashboard, $adminLogin, $adminView, $concertView, $facultyView, $galleryPageView, $homeView, $navAdmin, $navLogin, $navLogout, $navPortal, $parentView2, $programsView, $registerView, $tosView, ADMIN_EMAIL, currentProgram, editMode, session, setCurrentProgram, setCurrentView, setSession, supabase } from './state.js';
import { toggleEditMode } from './visual-editor.js';
import { renderAdminHeroSettings } from './home.js';
import { renderAboutPdfs, renderAdminContactInfo, renderAdminFaq, renderAdminTestimonials, renderAdminValues, renderHomeAbout, renderTestimonials } from './programs.js';
import { renderConcertPage, renderFacultyPage, renderGalleryPage, renderProgramPage, renderTosPage } from './gallery.js';
import { populateClassDropdown, renderAdminAbout, renderAdminAwards, renderAdminClasses, renderAdminConcert, renderAdminFaculty, renderAdminGallery, renderAdminPdfs, renderAdminPendingRegistrations, renderAdminPrograms, renderAdminRegistrations, renderAdminTosSettings } from './admin.js';
import { renderAdminPaymentSettings } from './payment.js';
import { renderParentPortal } from './portal.js';
import { initReveal } from './main.js';

    //  VIEW SWITCHING
    // ════════════════════════════════════════════════
    function checkSessionExpiry() {
      const start = parseInt(localStorage.getItem('bp_session_start') || '0', 10);
      if (start && Date.now() - start > 4 * 60 * 60 * 1000) {
        supabase.auth.signOut().catch(() => {});
        localStorage.removeItem('bp_session_start');
        setSession(null);
        return true;
      }
      return false;
    }

    function _syncNavSession() {
      const isAdmin  = session && session.user.email === ADMIN_EMAIL;
      const isParent = session && !isAdmin;
      $navLogin.classList.toggle('view-hidden',  !!session);
      $navAdmin.classList.toggle('view-hidden',  !isAdmin);
      $navPortal.classList.toggle('view-hidden', !isParent);
      $navLogout.classList.toggle('view-hidden', !session);
    }

    export function showView(view, subview) {
      setCurrentView(view);
      if (subview !== undefined) setCurrentProgram(subview);

      $homeView.classList.toggle('view-hidden',        view !== 'home');
      $aboutView.classList.toggle('view-hidden',       view !== 'about');
      $registerView.classList.toggle('view-hidden',    view !== 'register');
      $adminView.classList.toggle('view-hidden',       view !== 'admin');
      $facultyView.classList.toggle('view-hidden',     view !== 'faculty');
      $concertView.classList.toggle('view-hidden',     view !== 'concert');
      $programsView.classList.toggle('view-hidden',    view !== 'programs');
      $galleryPageView.classList.toggle('view-hidden', view !== 'gallery-page');
      $tosView.classList.toggle('view-hidden',         view !== 'tos');
      $parentView2.classList.toggle('view-hidden',     view !== 'parent');

      const $toolbar   = document.getElementById('visual-edit-toolbar');
      const $pageLabel = document.getElementById('edit-page-label');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (view === 'admin') {
        if (session) checkSessionExpiry();
        const loggedIn = session && session.user.email === ADMIN_EMAIL;
        $adminLogin.classList.toggle('view-hidden',     loggedIn);
        $adminDashboard.classList.toggle('view-hidden', !loggedIn);
        _syncNavSession();
        $toolbar.classList.remove('visible');
        if (editMode) toggleEditMode();
        if (loggedIn) {
          document.getElementById('admin-email-badge').textContent = session.user.email;
          renderAdminPendingRegistrations();
          renderAdminPaymentSettings();
          renderAdminHeroSettings();
          renderAdminAwards();
          renderAdminClasses();
          renderAdminAbout();
          renderAdminPdfs();
          renderAdminGallery();
          renderAdminRegistrations();
          renderAdminFaculty();
          renderAdminPrograms();
          renderAdminConcert();
          renderAdminTosSettings();
          renderAdminContactInfo();
          renderAdminFaq();
          renderAdminValues();
          renderAdminTestimonials();
        }
      } else if (view === 'about') {
        _syncNavSession();
        renderHomeAbout();
        renderAboutPdfs();
        if (session) { $toolbar.classList.add('visible'); $pageLabel.textContent = 'About Page'; }
        else { $toolbar.classList.remove('visible'); }
      } else if (view === 'register') {
        _syncNavSession();
        $toolbar.classList.remove('visible');
        if (editMode) toggleEditMode();
        // Reset to step-1 state every time the view is entered
        document.getElementById('reg-form').classList.remove('view-hidden');
        document.getElementById('reg-payment-step').classList.add('view-hidden');
        document.getElementById('reg-success').classList.add('view-hidden');
        document.getElementById('step-1-dot').classList.remove('opacity-35');
        document.getElementById('step-2-dot').classList.add('opacity-35');
        document.getElementById('step-2-num').className =
          'w-7 h-7 rounded-full border-2 border-imperial/40 text-ink/40 flex items-center justify-center text-xs font-semibold';
        populateClassDropdown();
        if (typeof initReveal === 'function') setTimeout(initReveal, 60);
      } else if (view === 'faculty') {
        _syncNavSession();
        if (session) { $toolbar.classList.add('visible'); $pageLabel.textContent = 'Faculty Page'; }
        else $toolbar.classList.remove('visible');
        if (typeof initReveal === 'function') setTimeout(initReveal, 60);
        renderFacultyPage();
      } else if (view === 'concert') {
        _syncNavSession();
        if (session) { $toolbar.classList.add('visible'); $pageLabel.textContent = 'Concert Page'; }
        else $toolbar.classList.remove('visible');
        if (typeof initReveal === 'function') setTimeout(initReveal, 60);
        renderConcertPage();
      } else if (view === 'programs') {
        _syncNavSession();
        if (session) { $toolbar.classList.add('visible'); $pageLabel.textContent = 'Programs Page'; }
        else $toolbar.classList.remove('visible');
        if (typeof initReveal === 'function') setTimeout(initReveal, 60);
        renderProgramPage(currentProgram);
      } else if (view === 'gallery-page') {
        _syncNavSession();
        if (session) { $toolbar.classList.add('visible'); $pageLabel.textContent = 'Gallery Page'; }
        else $toolbar.classList.remove('visible');
        if (typeof initReveal === 'function') setTimeout(initReveal, 60);
        renderGalleryPage();
      } else if (view === 'tos') {
        _syncNavSession();
        if (session) { $toolbar.classList.add('visible'); $pageLabel.textContent = 'Terms Page'; }
        else $toolbar.classList.remove('visible');
        renderTosPage();
      } else if (view === 'parent') {
        _syncNavSession();
        $toolbar.classList.remove('visible');
        if (editMode) toggleEditMode();
        if (!session) { showView('admin'); return; }
        renderParentPortal();
      } else {
        // home
        _syncNavSession();
        if (session) { $toolbar.classList.add('visible'); $pageLabel.textContent = 'Home Page'; }
        else { $toolbar.classList.remove('visible'); }
        renderTestimonials();
      }
    }

    // ── Navigation ─────────────────────────────────
    document.getElementById('nav-brand').addEventListener('click',         () => showView('home'));
    document.getElementById('nav-home').addEventListener('click',          () => showView('home'));
    document.getElementById('nav-about').addEventListener('click',         () => showView('about'));
    document.getElementById('nav-concert').addEventListener('click',       () => showView('concert'));
    document.getElementById('nav-faculty').addEventListener('click',       () => showView('faculty'));
    document.getElementById('nav-gallery-page').addEventListener('click',  () => showView('gallery-page'));
    document.getElementById('nav-register').addEventListener('click',      () => showView('register'));
    document.getElementById('nav-admin').addEventListener('click',         () => showView('admin'));
    document.querySelectorAll('.footer-tos-link').forEach(el => el.addEventListener('click', () => showView('tos')));
    document.getElementById('hero-cta-register').addEventListener('click', () => showView('register'));
    document.getElementById('home-midpage-cta')?.addEventListener('click', () => showView('register'));
    document.getElementById('hero-cta-about').addEventListener('click',    () => document.getElementById('home-about-section').scrollIntoView({ behavior: 'smooth' }));
    document.getElementById('nav-logout').addEventListener('click', async () => {
      try { await supabase.auth.signOut(); } catch (err) { console.error(err); }
      localStorage.removeItem('bp_session_start');
      setSession(null); showView('home');
    });

    // Programs dropdown toggle — positioned dynamically so overflow-x:auto doesn't clip it
    const $programsDropdownBtn  = document.getElementById('nav-programs');
    const $programsDropdownMenu = document.getElementById('programs-dropdown');
    const $navInner             = document.getElementById('nav-inner');
    function positionProgramsDropdown() {
      const btnRect  = $programsDropdownBtn.getBoundingClientRect();
      const navRect  = $navInner.getBoundingClientRect();
      let left = btnRect.left - navRect.left;
      // Clamp so dropdown doesn't overflow right edge
      const maxLeft = navRect.width - $programsDropdownMenu.offsetWidth - 4;
      $programsDropdownMenu.style.left = Math.min(left, maxLeft) + 'px';
    }
    export function closeProgramsDropdown() { $programsDropdownMenu.classList.remove('open'); }
    $programsDropdownBtn.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = $programsDropdownMenu.classList.contains('open');
      closeProgramsDropdown();
      if (!isOpen) { positionProgramsDropdown(); $programsDropdownMenu.classList.add('open'); }
    });
    document.addEventListener('click', () => closeProgramsDropdown());
    $programsDropdownMenu.addEventListener('click', e => e.stopPropagation());

    // ── Mobile hamburger drawer ─────────────────────
    const $drawer   = document.getElementById('mobile-nav-drawer');
    const $backdrop = document.getElementById('mobile-nav-backdrop');
    const $hambBtn  = document.getElementById('nav-hamburger');
    const $hambOpen = document.getElementById('hamburger-icon-open');
    const $hambClose= document.getElementById('hamburger-icon-close');

    function openDrawer() {
      $drawer.classList.add('open');
      $backdrop.classList.add('open');
      $drawer.setAttribute('aria-hidden', 'false');
      $hambOpen.style.display  = 'none';
      $hambClose.style.display = '';
      // Sync auth buttons visibility in drawer
      const isAdmin2  = session && session.user.email === ADMIN_EMAIL;
      const isParent2 = session && !isAdmin2;
      document.getElementById('mob-nav-login').classList.toggle('view-hidden',  !!session);
      document.getElementById('mob-nav-portal').classList.toggle('view-hidden', !isParent2);
      document.getElementById('mob-nav-admin').classList.toggle('view-hidden',  !isAdmin2);
      document.getElementById('mob-nav-logout').classList.toggle('view-hidden', !session);
    }
    export function closeDrawer() {
      $drawer.classList.remove('open');
      $backdrop.classList.remove('open');
      $drawer.setAttribute('aria-hidden', 'true');
      $hambOpen.style.display  = '';
      $hambClose.style.display = 'none';
    }
    $hambBtn.addEventListener('click', e => {
      e.stopPropagation();
      $drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });
    $backdrop.addEventListener('click', closeDrawer);
    window.addEventListener('resize', () => { if (window.innerWidth >= 768) closeDrawer(); });

    function mobNavigate(view) { closeDrawer(); showView(view); }
    document.getElementById('mob-nav-home').addEventListener('click',     () => mobNavigate('home'));
    document.getElementById('mob-nav-concert').addEventListener('click',  () => mobNavigate('concert'));
    document.getElementById('mob-nav-faculty').addEventListener('click',  () => mobNavigate('faculty'));
    document.getElementById('mob-nav-gallery').addEventListener('click',  () => mobNavigate('gallery-page'));
    document.getElementById('mob-nav-register').addEventListener('click', () => mobNavigate('register'));
    document.getElementById('mob-nav-login').addEventListener('click',   () => mobNavigate('admin'));
    document.getElementById('mob-nav-portal').addEventListener('click',  () => mobNavigate('parent'));
    document.getElementById('mob-nav-admin').addEventListener('click',   () => mobNavigate('admin'));
    document.getElementById('mob-nav-logout').addEventListener('click', async () => {
      closeDrawer();
      try { await supabase.auth.signOut(); } catch (err) { console.error(err); }
      localStorage.removeItem('bp_session_start');
      setSession(null); showView('home');
    });

    // ── Auth ───────────────────────────────────────
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const $error   = document.getElementById('login-error');
      $error.classList.add('view-hidden');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { $error.textContent = error.message; $error.classList.remove('view-hidden'); return; }
      setSession(data.session);
      localStorage.setItem('bp_session_start', Date.now().toString());
      if (session.user.email === ADMIN_EMAIL) { showView('admin'); } else { showView('parent'); }
    });

    // ── Sign-up form handler ───────────────────────
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email    = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const password2= document.getElementById('signup-password2').value;
      const $err     = document.getElementById('signup-error');
      const $ok      = document.getElementById('signup-success');
      $err.classList.add('view-hidden'); $ok.classList.add('view-hidden');
      if (password !== password2) {
        $err.textContent = 'Passwords do not match.'; $err.classList.remove('view-hidden'); return;
      }
      if (password.length < 6) {
        $err.textContent = 'Password must be at least 6 characters.'; $err.classList.remove('view-hidden'); return;
      }
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { $err.textContent = error.message; $err.classList.remove('view-hidden'); return; }
      if (data.session) {
        setSession(data.session);
        localStorage.setItem('bp_session_start', Date.now().toString());
        showView('parent');
      } else {
        $ok.textContent = 'Account created! Check your email to confirm your account, then sign in.';
        $ok.classList.remove('view-hidden');
        // Switch to sign-in tab
        document.getElementById('tab-signin').click();
      }
    });

    // ── Tab switching (Sign In / Create Account) ───
    document.getElementById('tab-signin').addEventListener('click', () => {
      document.getElementById('login-form').classList.remove('view-hidden');
      document.getElementById('signup-form').classList.add('view-hidden');
      document.getElementById('tab-signin').className =
        'flex-1 py-2 text-sm font-medium bg-imperial text-cream transition-colors';
      document.getElementById('tab-signup').className =
        'flex-1 py-2 text-sm font-medium bg-transparent text-ink/60 hover:text-imperial transition-colors';
    });
    document.getElementById('tab-signup').addEventListener('click', () => {
      document.getElementById('login-form').classList.add('view-hidden');
      document.getElementById('signup-form').classList.remove('view-hidden');
      document.getElementById('tab-signin').className =
        'flex-1 py-2 text-sm font-medium bg-transparent text-ink/60 hover:text-imperial transition-colors';
      document.getElementById('tab-signup').className =
        'flex-1 py-2 text-sm font-medium bg-imperial text-cream transition-colors';
    });

    // ── nav-login click ─────────────────────────────
    document.getElementById('nav-login').addEventListener('click',   () => showView('admin'));
    document.getElementById('nav-portal').addEventListener('click',  () => showView('parent'));

    try {
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) setSession(existingSession);
    } catch (err) { console.error('Session init failed:', err); }
    supabase.auth.onAuthStateChange((_e, s) => { setSession(s); _syncNavSession(); });

    // ════════════════════════════════════════════════