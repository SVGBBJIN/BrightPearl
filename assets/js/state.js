
    // ── Backend ────────────────────────────────────
    // This app previously ran against a live Supabase project. It has
    // since been disconnected — see SUPABASE_SCHEMA.md at the repo root
    // for the full schema/table/bucket reference that used to live there.
    // `supabase` below is now a local, localStorage-backed stub that
    // implements the same call shapes this codebase uses, so the app
    // keeps working for local development without any network backend.
    export { supabase } from './local-store.js';

    // ── State ──────────────────────────────────────
    export let currentView  = 'home';
    export let currentProgram = null;
    export let session      = null;
    export let selectedFile = null;
    export let selectedPdf  = null;
    export let editMode     = false;
    export let selectedAboutImg  = null;
    export let selectedHeroFile  = null;
    export let selectedFacultyPhoto = null;
    export let destModalFile    = null;
    export let destModalResolve = null;
    export let aboutSortable          = null;
    export let homeAboutSortable      = null;
    export let gallerySortable        = null;
    export let concertSortable        = null;
    export let galleryPageSortable    = null;
    export let tosSortable            = null;
    export let programSortable        = null;
    export let homeValuesSortable     = null;
    export let homeProgramsSortable   = null;

    export const DEFAULT_PROGRAMS = [
      {
        id: 'default-dance-program',
        name: 'Elite Dance Program',
        slug: 'elite-dance-program',
        description: 'Classical Chinese Dance, Contemporary Dance, and Ballet for dedicated young performers.',
        content: 'Our Elite Dance Program trains students across three company levels — Company A, Company B, and Company D — each designed to match a student\'s experience and commitment level. Students develop strong technical foundations in Classical Chinese Dance, Contemporary Dance, and Ballet, while building cultural expression, artistry, and performance confidence. Training includes guided rehearsals, stage presence coaching, and curated performance opportunities throughout the year.',
        display_order: 0,
        icon_url: null,
      },
      {
        id: 'default-adult-dance-program',
        name: 'Adult Dance Classes',
        slug: 'adult-dance',
        description: 'Dance classes designed specifically for adult students of all levels.',
        content: 'It\'s never too late to dance. Our Adult Dance Classes welcome beginners and returning students alike, offering a supportive environment to explore Classical Chinese Dance, Contemporary movement, and more. Classes focus on technique, expression, and the joy of movement — no prior experience required.',
        display_order: 1,
        icon_url: null,
      },
      {
        id: 'default-mandarin-program',
        name: 'Mandarin Afterschool Enrichment',
        slug: 'mandarin-afterschool',
        description: 'Language, culture, and creativity in a joyful afterschool format.',
        content: 'This program blends practical Mandarin, cultural literacy, and project-based activities to help students build confidence speaking, reading, and expressing themselves in Chinese. Lessons are structured by age and level to support steady growth.',
        display_order: 2,
        icon_url: null,
      },
      {
        id: 'default-stem-program',
        name: 'Coding & STEM Program',
        slug: 'coding-stem',
        description: 'Hands-on computing, logic, and maker projects for young innovators.',
        content: 'Students explore coding fundamentals, computational thinking, and problem-solving through interactive challenges and guided projects. The curriculum emphasizes creativity, collaboration, and practical digital skills.',
        display_order: 3,
        icon_url: null,
      },
      {
        id: 'default-vacation-camp',
        name: 'School Vacation Camp',
        slug: 'school-vacation-camp',
        description: 'Seasonal camps during Winter, Spring, and Summer school breaks.',
        content: 'Bright Pearl Academy\'s School Vacation Camp offers enriching full-day and half-day programs during school break weeks — Winter, Spring, and Summer. Campers enjoy a blend of dance, Mandarin, STEM projects, arts and crafts, and cultural activities in a fun, structured environment. A great option for families looking for engaging, educational programming during school vacations.',
        display_order: 4,
        icon_url: null,
      },
    ];

    // ── Values card icon library ───────────────────
    export const VALUE_CARD_ICONS = {
      dance: `<svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="34" cy="16" r="9" fill="rgb(var(--imperial-rgb) / 0.22)" stroke="rgb(var(--imperial-rgb) / 0.5)" stroke-width="1.5"/><path d="M18 44 Q26 28 34 36 Q42 28 50 44" stroke="rgb(var(--imperial-rgb) / 0.6)" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M22 44 Q20 54 16 58" stroke="rgb(var(--imperial-rgb) / 0.4)" stroke-width="2" stroke-linecap="round"/><path d="M46 44 Q48 54 52 58" stroke="rgb(var(--imperial-rgb) / 0.4)" stroke-width="2" stroke-linecap="round"/><path d="M22 14 A14 14 0 0 1 46 14" stroke="rgba(248,113,113,0.55)" stroke-width="1.5" stroke-dasharray="3 3" fill="none"/></svg>`,
      heritage: `<svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="14" width="44" height="6" rx="3" fill="rgb(var(--imperial-rgb) / 0.18)" stroke="rgb(var(--imperial-rgb) / 0.45)" stroke-width="1.2"/><rect x="22" y="14" width="5" height="38" rx="2.5" fill="rgb(var(--imperial-rgb) / 0.25)"/><rect x="41" y="14" width="5" height="38" rx="2.5" fill="rgb(var(--imperial-rgb) / 0.25)"/><rect x="17" y="36" width="34" height="5" rx="2.5" fill="rgb(var(--imperial-rgb) / 0.18)" stroke="rgb(var(--imperial-rgb) / 0.35)" stroke-width="1"/><circle cx="34" cy="34" r="26" stroke="rgba(248,113,113,0.3)" stroke-width="1.2" stroke-dasharray="4 3"/></svg>`,
      music: `<svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="46" r="7" fill="rgb(var(--imperial-rgb) / 0.2)" stroke="rgb(var(--imperial-rgb) / 0.5)" stroke-width="1.5"/><line x1="22" y1="46" x2="22" y2="18" stroke="rgb(var(--imperial-rgb) / 0.5)" stroke-width="2" stroke-linecap="round"/><line x1="22" y1="18" x2="42" y2="22" stroke="rgb(var(--imperial-rgb) / 0.4)" stroke-width="2" stroke-linecap="round"/><path d="M36 34 Q40 26 44 34 Q48 42 52 34" stroke="rgba(248,113,113,0.55)" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M30 38 Q34 30 38 38 Q42 46 46 38" stroke="rgb(var(--imperial-rgb) / 0.3)" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`,
      community: `<svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="18" r="7" fill="rgb(var(--imperial-rgb) / 0.2)" stroke="rgb(var(--imperial-rgb) / 0.45)" stroke-width="1.5"/><circle cx="46" cy="18" r="7" fill="rgba(248,113,113,0.2)" stroke="rgba(248,113,113,0.45)" stroke-width="1.5"/><path d="M10 52 Q10 36 22 36 Q30 36 34 42 Q38 36 46 36 Q58 36 58 52" stroke="rgb(var(--imperial-rgb) / 0.4)" stroke-width="2.5" stroke-linecap="round" fill="rgb(var(--imperial-rgb) / 0.06)"/><path d="M22 10 A12 12 0 0 1 46 10" stroke="rgba(248,113,113,0.4)" stroke-width="1.5" stroke-dasharray="3 3" fill="none"/></svg>`,
      star: `<svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M34 10 L39 26 H56 L42 36 L47 52 L34 42 L21 52 L26 36 L12 26 H29 Z" fill="rgb(var(--imperial-rgb) / 0.18)" stroke="rgb(var(--imperial-rgb) / 0.55)" stroke-width="1.5" stroke-linejoin="round"/><path d="M34 18 L37 28 H48 L39 34 L42 44 L34 38 L26 44 L29 34 L20 28 H31 Z" fill="rgba(248,113,113,0.18)"/></svg>`,
      book: `<svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="12" width="30" height="44" rx="3" fill="rgb(var(--imperial-rgb) / 0.15)" stroke="rgb(var(--imperial-rgb) / 0.45)" stroke-width="1.5"/><rect x="26" y="12" width="30" height="44" rx="3" fill="rgb(var(--imperial-rgb) / 0.1)" stroke="rgb(var(--imperial-rgb) / 0.35)" stroke-width="1.5"/><line x1="20" y1="24" x2="34" y2="24" stroke="rgb(var(--imperial-rgb) / 0.4)" stroke-width="1.5" stroke-linecap="round"/><line x1="20" y1="32" x2="34" y2="32" stroke="rgb(var(--imperial-rgb) / 0.3)" stroke-width="1.5" stroke-linecap="round"/><line x1="20" y1="40" x2="28" y2="40" stroke="rgba(248,113,113,0.45)" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      heart: `<svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M34 54 C34 54 10 40 10 24 C10 16 16 10 24 10 C28.4 10 32.4 12.4 34 16 C35.6 12.4 39.6 10 44 10 C52 10 58 16 58 24 C58 40 34 54 34 54Z" fill="rgb(var(--imperial-rgb) / 0.2)" stroke="rgb(var(--imperial-rgb) / 0.55)" stroke-width="1.5" stroke-linejoin="round"/><path d="M26 26 C26 22 28.7 20 32 22" stroke="rgba(248,113,113,0.6)" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`,
      award: `<svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="34" cy="28" r="16" fill="rgb(var(--imperial-rgb) / 0.15)" stroke="rgb(var(--imperial-rgb) / 0.5)" stroke-width="1.5"/><path d="M26 42 L22 58 L34 52 L46 58 L42 42" stroke="rgb(var(--imperial-rgb) / 0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="rgb(var(--imperial-rgb) / 0.08)"/><path d="M34 18 L36 24 H42 L37 28 L39 34 L34 30 L29 34 L31 28 L26 24 H32 Z" fill="rgba(248,113,113,0.35)" stroke="rgba(248,113,113,0.5)" stroke-width="0.8" stroke-linejoin="round"/></svg>`,
    };
    export const VALUE_ICON_LABELS = { dance: 'Dance', heritage: 'Heritage', music: 'Music', community: 'Community', star: 'Excellence', book: 'Learning', heart: 'Passion', award: 'Awards' };

    export const DEFAULT_VALUES = [
      { id: 'val-1', title: 'Artistic Discipline', body: 'Students build precision, presence, and lasting confidence through rigorous classical training that carries far beyond the stage.', icon_key: 'dance',     display_order: 0 },
      { id: 'val-2', title: 'Cultural Heritage',   body: 'We honor Chinese tradition through language, dance, and performance — keeping culture alive and meaningful across generations.',    icon_key: 'heritage',  display_order: 1 },
      { id: 'val-3', title: 'Creative Expression', body: 'Every student discovers their voice through music, movement, and collaborative performance — creativity nurtured, not constrained.',  icon_key: 'music',     display_order: 2 },
      { id: 'val-4', title: 'Community & Growth',  body: 'Students form genuine, lasting bonds — supporting each other on stage and off, growing together as artists and as people.',          icon_key: 'community', display_order: 3 },
    ];

    // ── DOM refs ───────────────────────────────────
    export const $homeView        = document.getElementById('home-view');
    export const $aboutView       = document.getElementById('about-view');
    export const $registerView    = document.getElementById('register-view');
    export const $adminView       = document.getElementById('admin-view');
    export const $facultyView     = document.getElementById('faculty-view');
    export const $concertView     = document.getElementById('concert-view');
    export const $programsView    = document.getElementById('programs-view');
    export const $galleryPageView = document.getElementById('gallery-page-view');
    export const $tosView         = document.getElementById('tos-view');
    export const $adminLogin      = document.getElementById('admin-login');
    export const $adminDashboard  = document.getElementById('admin-dashboard');
    export const $parentView2     = document.getElementById('parent-view');
    export const $navLogin        = document.getElementById('nav-login');
    export const $navPortal       = document.getElementById('nav-portal');
    export const $navLogout       = document.getElementById('nav-logout');
    export const $navAdmin        = document.getElementById('nav-admin');
    export const ADMIN_EMAIL      = 'admin@brightpearl.academy';

    // ════════════════════════════════════════════════

// ── Setters (allow other modules to mutate this shared state) ──
export function setAboutSortable(v) { aboutSortable = v; }
export function setConcertSortable(v) { concertSortable = v; }
export function setCurrentProgram(v) { currentProgram = v; }
export function setCurrentView(v) { currentView = v; }
export function setDestModalFile(v) { destModalFile = v; }
export function setDestModalResolve(v) { destModalResolve = v; }
export function setEditMode(v) { editMode = v; }
export function setGalleryPageSortable(v) { galleryPageSortable = v; }
export function setGallerySortable(v) { gallerySortable = v; }
export function setHomeAboutSortable(v) { homeAboutSortable = v; }
export function setHomeProgramsSortable(v) { homeProgramsSortable = v; }
export function setHomeValuesSortable(v) { homeValuesSortable = v; }
export function setProgramSortable(v) { programSortable = v; }
export function setSelectedAboutImg(v) { selectedAboutImg = v; }
export function setSelectedFacultyPhoto(v) { selectedFacultyPhoto = v; }
export function setSelectedFile(v) { selectedFile = v; }
export function setSelectedHeroFile(v) { selectedHeroFile = v; }
export function setSelectedPdf(v) { selectedPdf = v; }
export function setSession(v) { session = v; }
export function setTosSortable(v) { tosSortable = v; }