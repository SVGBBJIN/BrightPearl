import { getYouTubeId } from './utils.js';

    //  LIGHTBOX
    // ════════════════════════════════════════════════
    const $lb = document.getElementById('lightbox');
    export function openLightbox(url, cap) {
      const $img = document.getElementById('lightbox-img');
      const $yt  = document.getElementById('lightbox-yt');
      const ytId = getYouTubeId(url);
      if (ytId) {
        $img.classList.add('view-hidden'); $img.src = '';
        $yt.src = `https://www.youtube.com/embed/${ytId}?autoplay=1`;
        $yt.classList.remove('view-hidden');
      } else {
        $yt.classList.add('view-hidden'); $yt.src = '';
        $img.src = url; $img.classList.remove('view-hidden');
      }
      document.getElementById('lightbox-caption').textContent = cap || '';
      document.getElementById('lightbox-caption').classList.toggle('view-hidden', !cap);
      $lb.classList.add('active'); $lb.setAttribute('aria-hidden','false');
    }
    function closeLightbox() {
      document.getElementById('lightbox-yt').src = '';
      document.getElementById('lightbox-yt').classList.add('view-hidden');
      $lb.classList.remove('active'); $lb.setAttribute('aria-hidden','true');
    }
    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    $lb.addEventListener('click', e => { if (e.target === $lb) closeLightbox(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });