import { t } from './i18n.js';

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mqerzazd';

export function initQuickContactForm() {
  const $form    = document.getElementById('quick-contact-form');
  if (!$form) return;
  const $submit  = document.getElementById('quick-contact-submit');
  const $success = document.getElementById('quick-contact-success');
  const $error   = document.getElementById('quick-contact-error');
  const $fieldErr = document.getElementById('quick-contact-field-error');

  $form.addEventListener('submit', async (e) => {
    e.preventDefault();
    $success.classList.add('view-hidden');
    $error.classList.add('view-hidden');
    $fieldErr.classList.add('view-hidden');
    $fieldErr.textContent = '';
    $submit.disabled = true;
    const originalLabel = $submit.textContent;
    $submit.textContent = t('contactForm.sending');

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    $form.name.value,
          email:   $form.email.value,
          message: $form.message.value,
          _subject: 'New inquiry from Bright Pearl Academy website',
        }),
      });

      if (res.ok) {
        $form.reset();
        $success.classList.remove('view-hidden');
      } else {
        const data = await res.json().catch(() => null);
        const msg = data?.errors?.map(err => err.message).join(' ');
        $fieldErr.textContent = msg || '';
        if (msg) $fieldErr.classList.remove('view-hidden');
        $error.classList.remove('view-hidden');
      }
    } catch {
      $error.classList.remove('view-hidden');
    } finally {
      $submit.disabled = false;
      $submit.textContent = originalLabel;
    }
  });
}
