import { supabase } from './state.js';
import { updateRegStatus } from './data.js';
import { esc } from './utils.js';

    //  PAYMENT — DATA + RENDER
    // ════════════════════════════════════════════════
    async function fetchActivePaymentSetting() {
      const { data, error } = await supabase.from('payment_settings')
        .select('*').eq('is_active', true).limit(1).maybeSingle();
      if (error) { console.error(error); return null; }
      return data;
    }
    async function fetchAnyPaymentSetting() {
      const { data, error } = await supabase.from('payment_settings')
        .select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) { console.error(error); return null; }
      return data;
    }
    async function savePaymentSettings({ id, method_name, handle, instructions, qr_code_url, is_active }) {
      if (id) {
        const { error } = await supabase.from('payment_settings')
          .update({ method_name, handle, instructions, qr_code_url, is_active }).eq('id', id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('payment_settings')
          .insert({ method_name, handle, instructions, qr_code_url, is_active });
        if (error) throw new Error(error.message);
      }
    }

    export async function renderPaymentStep(regId) {
      const setting = await fetchActivePaymentSetting();
      const $content = document.getElementById('reg-payment-content');
      if (!setting) {
        // No payment method configured — skip to success
        document.getElementById('reg-payment-step').classList.add('view-hidden');
        document.getElementById('reg-success').classList.remove('view-hidden');
        return;
      }
      const isVenmo  = setting.method_name === 'Venmo';
      const isZelle  = setting.method_name === 'Zelle';
      const deepLink = isVenmo ? `https://venmo.com/u/${encodeURIComponent(setting.handle)}`
                     : isZelle ? `https://enroll.zellepay.com/qr-codes?data=${encodeURIComponent(setting.handle)}`
                     : null;
      // Payment method icon
      const icon = isVenmo
        ? `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.21 2c.8 1.33 1.16 2.69 1.16 4.4 0 5.49-4.69 12.63-8.49 17.6H4.61L1 2.94l7.49-.71 2.17 8.62C12.44 8.25 14 4.72 14 2.64c0-1.06-.18-1.79-.46-2.39L19.21 2z"/></svg>`
        : isZelle
        ? `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.5 16.5h-7.83l5.08-6H7.5V9H15l-5.08 6H17.5v1.5z"/></svg>`
        : `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75"/></svg>`;

      $content.innerHTML = `
        <div class="flex items-center gap-3 pb-4 border-b border-imperial/10">
          <div class="w-10 h-10 rounded-lg bg-imperial/10 text-imperial flex items-center justify-center flex-shrink-0">
            ${icon}
          </div>
          <div>
            <p class="text-xs font-medium text-ink/50 uppercase tracking-wider">Payment Method</p>
            <p class="font-display text-lg text-ink leading-tight">${esc(setting.method_name)}
              <span class="text-base text-ink/60 font-normal font-body">— ${esc(setting.handle)}</span>
            </p>
          </div>
        </div>
        ${setting.instructions ? `
        <div class="pl-4 border-l-2 border-imperial/25 py-1">
          <p class="text-ink/65 text-sm leading-relaxed">${esc(setting.instructions)}</p>
        </div>` : ''}
        ${deepLink ? `
        <a href="${esc(deepLink)}" target="_blank" rel="noopener noreferrer"
          class="btn-imperial w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-medium">
          ${icon}
          Open ${esc(setting.method_name)} — ${esc(setting.handle)}
        </a>` : `
        <div class="bg-imperial/5 rounded-lg p-4 text-center">
          <p class="font-medium text-ink text-sm">Handle / Number</p>
          <p class="text-imperial font-semibold text-lg mt-1">${esc(setting.handle)}</p>
        </div>`}
        ${setting.qr_code_url ? `
        <div class="text-center pt-2">
          <p class="text-xs text-ink/45 mb-3 uppercase tracking-wider">Or scan the QR code</p>
          <img src="${esc(setting.qr_code_url)}" alt="Payment QR Code"
            class="mx-auto max-w-[180px] rounded-xl border border-imperial/10 shadow-sm" />
        </div>` : ''}`;

      // Wire up "I have sent" button
      const $sentBtn = document.getElementById('reg-payment-sent-btn');
      const newBtn = $sentBtn.cloneNode(true); // remove old listeners
      $sentBtn.parentNode.replaceChild(newBtn, $sentBtn);
      newBtn.addEventListener('click', async () => {
        newBtn.disabled = true; newBtn.textContent = 'Recording…';
        try {
          await updateRegStatus(regId, 'awaiting_verification');
          document.getElementById('reg-payment-step').classList.add('view-hidden');
          document.getElementById('reg-success').classList.remove('view-hidden');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) { console.error(err); newBtn.disabled = false; newBtn.textContent = 'I Have Sent the Payment'; }
      });
    }

    // ════════════════════════════════════════════════

    //  ADMIN — PAYMENT SETTINGS
    // ════════════════════════════════════════════════
    export async function renderAdminPaymentSettings() {
      const setting = await fetchAnyPaymentSetting();
      if (!setting) return;
      document.getElementById('ps-method').value        = setting.method_name  || 'Venmo';
      document.getElementById('ps-handle').value        = setting.handle       || '';
      document.getElementById('ps-instructions').value  = setting.instructions || '';
      document.getElementById('ps-qr-url').value        = setting.qr_code_url  || '';
      document.getElementById('ps-active').checked      = setting.is_active;
      document.getElementById('payment-settings-form').dataset.settingId = setting.id;
    }

    document.getElementById('payment-settings-form').addEventListener('submit', async e => {
      e.preventDefault();
      const $status = document.getElementById('ps-status');
      $status.classList.add('view-hidden');
      const id = document.getElementById('payment-settings-form').dataset.settingId || null;
      try {
        await savePaymentSettings({
          id:           id || undefined,
          method_name:  document.getElementById('ps-method').value,
          handle:       document.getElementById('ps-handle').value.trim(),
          instructions: document.getElementById('ps-instructions').value.trim() || null,
          qr_code_url:  document.getElementById('ps-qr-url').value.trim() || null,
          is_active:    document.getElementById('ps-active').checked,
        });
        $status.textContent = '✓ Settings saved'; $status.classList.remove('view-hidden');
        setTimeout(() => $status.classList.add('view-hidden'), 2500);
        await renderAdminPaymentSettings();
      } catch (err) { $status.textContent = 'Error: ' + err.message; $status.classList.remove('view-hidden'); }
    });

    // ════════════════════════════════════════════════