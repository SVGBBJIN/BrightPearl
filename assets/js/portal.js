import { session, supabase } from './state.js';
import { showView } from './auth.js';

    //  PARENT PORTAL
    // ════════════════════════════════════════════════
    export async function renderParentPortal() {
      if (!session) { showView('admin'); return; }
      const email = session.user.email;
      const $welcome = document.getElementById('portal-welcome');
      const $list    = document.getElementById('portal-registrations-list');
      const $empty   = document.getElementById('portal-no-registrations');
      if ($welcome) $welcome.textContent = email;

      $list.innerHTML = '<p class="text-ink/40 text-sm py-4">Loading…</p>';
      $empty.classList.add('view-hidden');

      const { data: regs, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false });

      if (error) {
        $list.innerHTML = '<p class="text-imperial text-sm py-4">Could not load registrations.</p>';
        return;
      }
      if (!regs || regs.length === 0) {
        $list.innerHTML = '';
        $empty.classList.remove('view-hidden');
        return;
      }

      const statusColor = s => {
        if (s === 'approved')  return 'bg-green-100 text-green-700 border-green-200';
        if (s === 'rejected')  return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-amber-100 text-amber-700 border-amber-200';
      };
      const statusLabel = s => {
        if (s === 'approved') return 'Approved';
        if (s === 'rejected') return 'Not Approved';
        return 'Pending';
      };

      $list.innerHTML = regs.map(r => `
        <div class="bg-surface/70 backdrop-blur rounded-xl border border-imperial/10 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="space-y-0.5">
            <p class="font-medium text-ink">${r.student_name || r.name || '—'}</p>
            <p class="text-sm text-ink/55">${r.program_name || r.class_name || r.program || '—'}</p>
            <p class="text-xs text-ink/35">${r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</p>
          </div>
          <span class="self-start sm:self-auto text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor(r.status)}">${statusLabel(r.status)}</span>
        </div>
      `).join('');
    }

    // ════════════════════════════════════════════════