import { DEFAULT_PROGRAMS, supabase } from './state.js';

    //  DATA FUNCTIONS
    // ════════════════════════════════════════════════
    export async function fetchAwards() {
      const { data, error } = await supabase.from('awards').select('*').order('created_at', { ascending: false });
      if (error) { console.error(error); return []; } return data || [];
    }
    export async function fetchClasses() {
      const { data, error } = await supabase.from('classes').select('*').order('created_at', { ascending: false });
      if (error) { console.error(error); return []; } return data || [];
    }
    let _galleryCache = null;
    export async function fetchGallery(bustCache = false) {
      if (_galleryCache && !bustCache) return _galleryCache;
      const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
      if (error) { console.error(error); return []; }
      _galleryCache = data || [];
      return _galleryCache;
    }
    function invalidateGalleryCache() { _galleryCache = null; }
    export async function fetchAboutSections() {
      const { data, error } = await supabase.from('about_sections').select('*').order('display_order', { ascending: true });
      if (error) { console.error(error); return []; } return data || [];
    }
    export async function fetchPdfs() {
      const { data, error } = await supabase.from('pdfs').select('*').order('display_order', { ascending: true });
      if (error) { console.error(error); return []; } return data || [];
    }
    export async function fetchRegistrations() {
      const { data, error } = await supabase.from('registrations').select('*').order('created_at', { ascending: false });
      if (error) { console.error(error); return []; } return data || [];
    }

    // ── Generic key-value settings (JSON storage) ──
    export async function fetchSetting(key) {
      const { data, error } = await supabase.from('site_settings').select('*').eq('key', key).maybeSingle();
      if (error || !data) return null;
      try { return JSON.parse(data.value); } catch { return data.value; }
    }
    export async function saveSetting(key, value) {
      const jsonStr = typeof value === 'string' ? value : JSON.stringify(value);
      const { data: existing } = await supabase.from('site_settings').select('id').eq('key', key).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('site_settings').update({ value: jsonStr }).eq('key', key);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('site_settings').insert({ key, value: jsonStr });
        if (error) throw new Error(error.message);
      }
    }

    // ── Faculty CRUD (stored as JSON in site_settings) ──
    export async function fetchFaculty() {
      const data = await fetchSetting('faculty_data');
      const list = Array.isArray(data) ? data : [];
      return list.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
    export async function addFacultyMember(name, title, bio, photo_url, display_order, category) {
      const members = await fetchFaculty();
      members.push({ id: crypto.randomUUID(), name, title, bio, photo_url, display_order, category: category || '' });
      await saveSetting('faculty_data', members);
      return true;
    }
    export async function deleteFacultyMember(id) {
      const members = await fetchFaculty();
      await saveSetting('faculty_data', members.filter(m => m.id !== id));
      return true;
    }
    export function inferFacultyCategory(text) {
      const t = (text || '').toLowerCase();
      if (/dance|ballet|contemporary|choreograph/.test(t)) return 'Dance';
      if (/chinese|mandarin|language|culture|中文/.test(t)) return 'Chinese / Mandarin';
      if (/stem|cod|math|science|tech|program|enrich/.test(t)) return 'STEM / Coding';
      if (/music|vocal|instrument|piano|violin|sing/.test(t)) return 'Music';
      return 'Other';
    }
    async function migrateFacultyCategories() {
      const members = await fetchFaculty();
      if (!members.length) return;
      // Run whenever any member is missing a meaningful category
      const needsMigration = members.some(m => !m.category || m.category === '');
      if (!needsMigration) return;
      const migrated = members.map(m => ({
        ...m,
        category: m.category || inferFacultyCategory((m.title || '') + ' ' + (m.role || ''))
      }));
      await saveSetting('faculty_data', migrated);
    }

    // ── Programs CRUD ──
    export async function fetchPrograms(includeDefaults = true) {
      const data = await fetchSetting('programs_data');
      const list = Array.isArray(data) ? data : [];
      if (!list.length && includeDefaults) return DEFAULT_PROGRAMS;
      // Guard against accidental duplicate entries (most often duplicate slugs)
      // so navigation dropdowns/pages don't appear repeated.
      const seen = new Set();
      const deduped = [];
      for (const [idx, program] of list.entries()) {
        const slugKey = String(program?.slug || '').trim().toLowerCase();
        const idKey = String(program?.id || '').trim().toLowerCase();
        const key = slugKey || idKey || `fallback-${idx}`;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(program);
      }
      return deduped.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
    export async function addProgramItem(name, slug, description, content, display_order) {
      const programs = await fetchPrograms(false);
      programs.push({ id: crypto.randomUUID(), name, slug, description, content, display_order });
      await saveSetting('programs_data', programs);
      return true;
    }
    export async function deleteProgramItem(id) {
      const programs = await fetchPrograms(false);
      await saveSetting('programs_data', programs.filter(p => p.id !== id));
      return true;
    }

    // ── Concert sections CRUD ──
    export async function fetchConcertSections() {
      const data = await fetchSetting('concert_data');
      const list = Array.isArray(data) ? data : [];
      return list.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
    export async function addConcertSection(title, body, display_order) {
      const sections = await fetchConcertSections();
      sections.push({ id: crypto.randomUUID(), title, body, display_order });
      await saveSetting('concert_data', sections);
      return true;
    }
    export async function deleteConcertSection(id) {
      const sections = await fetchConcertSections();
      await saveSetting('concert_data', sections.filter(s => s.id !== id));
      return true;
    }

    export async function fetchTosSettings() {
      const data = await fetchSetting('tos_data');
      const fallbackSections = [
        { id: 'default-tos-1', title: 'Acceptance of Terms', body: 'By accessing Bright Pearl Academy services, you agree to these terms.', display_order: 0 },
        { id: 'default-tos-2', title: 'Enrollment & Conduct', body: 'Families agree to provide accurate registration details and follow academy conduct guidelines.', display_order: 1 },
        { id: 'default-tos-3', title: 'Updates', body: 'These terms may be updated periodically; continued use indicates acceptance of updates.', display_order: 2 },
      ];
      const fallback = {
        title: 'Terms of Service',
        subtitle: 'Please review these terms before using our services.',
        sections: fallbackSections,
      };
      if (!data || typeof data !== 'object') return fallback;
      const merged = { ...fallback, ...data };
      // Backward compat: migrate old body string to sections array
      if (!Array.isArray(merged.sections) || !merged.sections.length) {
        if (merged.body) {
          merged.sections = merged.body.split(/\n\s*\n/g).map((s, i) => {
            s = s.trim(); if (!s) return null;
            const [first, ...rest] = s.split('\n');
            return { id: crypto.randomUUID(), title: first.trim(), body: rest.join('\n').trim() || first.trim(), display_order: i };
          }).filter(Boolean);
        } else {
          merged.sections = fallbackSections;
        }
      }
      return merged;
    }
    export async function saveTosSettings(payload) {
      await saveSetting('tos_data', payload);
      return true;
    }
    export async function addTosSection(title, body) {
      const tos = await fetchTosSettings();
      const sections = Array.isArray(tos.sections) ? tos.sections : [];
      const order = sections.length ? Math.max(...sections.map(s => s.display_order || 0)) + 1 : 0;
      sections.push({ id: crypto.randomUUID(), title, body, display_order: order });
      await saveTosSettings({ ...tos, sections });
      return true;
    }
    export async function updateTosSection(id, fields) {
      const tos = await fetchTosSettings();
      const sections = Array.isArray(tos.sections) ? tos.sections : [];
      const idx = sections.findIndex(s => s.id === id);
      if (idx === -1) return false;
      sections[idx] = { ...sections[idx], ...fields };
      await saveTosSettings({ ...tos, sections });
      return true;
    }
    export async function deleteTosSection(id) {
      const tos = await fetchTosSettings();
      const sections = (Array.isArray(tos.sections) ? tos.sections : []).filter(s => s.id !== id);
      await saveTosSettings({ ...tos, sections });
      return true;
    }
    export async function reorderTosSections(orderedIds) {
      const tos = await fetchTosSettings();
      const sections = Array.isArray(tos.sections) ? tos.sections : [];
      const ordered = orderedIds.map((id, i) => {
        const s = sections.find(s => s.id === id); return s ? { ...s, display_order: i } : null;
      }).filter(Boolean);
      await saveTosSettings({ ...tos, sections: ordered });
    }

    export async function addAward(title, year, description) {
      const { error } = await supabase.from('awards').insert({ title, year, description });
      if (error) { alert('Error: ' + error.message); return false; } return true;
    }
    export async function deleteAward(id) {
      const { error } = await supabase.from('awards').delete().eq('id', id);
      if (error) { alert('Error: ' + error.message); return false; } return true;
    }
    export async function addClass(name, schedule_time, level, description) {
      const { error } = await supabase.from('classes').insert({ name, schedule_time, level, description });
      if (error) { alert('Error: ' + error.message); return false; } return true;
    }
    export async function deleteClass(id) {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) { alert('Error: ' + error.message); return false; } return true;
    }
    export async function updateAward(id, fields) {
      const { error } = await supabase.from('awards').update(fields).eq('id', id);
      if (error) { alert('Error: ' + error.message); return false; } return true;
    }
    export async function updateClass(id, fields) {
      const { error } = await supabase.from('classes').update(fields).eq('id', id);
      if (error) { alert('Error: ' + error.message); return false; } return true;
    }
    export async function addAboutSection(title, body, display_order, image_url, eyebrow) {
      const row = { title, body, display_order };
      if (image_url) row.image_url = image_url;
      if (eyebrow) row.eyebrow = eyebrow;
      const { error } = await supabase.from('about_sections').insert(row);
      if (error) { alert('Error: ' + error.message); return false; } return true;
    }
    export async function deleteAboutSection(id) {
      const { error } = await supabase.from('about_sections').delete().eq('id', id);
      if (error) { alert('Error: ' + error.message); return false; } return true;
    }
    export async function deletePdf(id, fileUrl) {
      const parts = fileUrl.split('/pdfs/');
      if (parts.length > 1) await supabase.storage.from('pdfs').remove([decodeURIComponent(parts[1])]);
      const { error } = await supabase.from('pdfs').delete().eq('id', id);
      if (error) { alert('Error: ' + error.message); return false; } return true;
    }
    export async function submitRegistration(payload) {
      const id = crypto.randomUUID();
      const { error } = await supabase.from('registrations').insert({ ...payload, id });
      if (error) throw new Error(error.message);
      return id;
    }
    export async function updateRegStatus(id, status) {
      const { error } = await supabase.from('registrations').update({ status }).eq('id', id);
      if (error) { alert('Error: ' + error.message); return false; } return true;
    }
    export async function deleteRegistration(id) {
      const { error } = await supabase.from('registrations').delete().eq('id', id);
      if (error) { alert('Error: ' + error.message); return false; } return true;
    }

    // ════════════════════════════════════════════════