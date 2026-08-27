// ════════════════════════════════════════════════════════════════
//  Local Supabase-compatible stub
// ════════════════════════════════════════════════════════════════
// This app was previously backed by a live Supabase project. It has
// since been disconnected (see SUPABASE_SCHEMA.md at the repo root for
// the full schema that used to live there). This module implements
// just enough of the supabase-js surface — `.from()`, `.storage`, and
// `.auth` — for the app to keep functioning against `localStorage`
// instead of a network backend. No data leaves the browser and no
// requests are made to *.supabase.co.
//
// It intentionally supports only the query shapes this codebase
// actually uses (see grep of `supabase.from(...)` calls across
// assets/js/*.js): select('*'|'id')/insert/update/delete, at most one
// .eq(), optional .order(), optional .limit(), and .single()/
// .maybeSingle() terminators.
// ════════════════════════════════════════════════════════════════

const LS_PREFIX = 'bp_local_db:';
const LS_AUTH_KEY = 'bp_local_auth';
const LS_USERS_KEY = 'bp_local_users';

function readTable(name) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + name);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function writeTable(name, rows) {
  localStorage.setItem(LS_PREFIX + name, JSON.stringify(rows));
}
function uuid() {
  return (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}
function clone(v) { return v === undefined ? v : JSON.parse(JSON.stringify(v)); }

class QueryBuilder {
  constructor(table) {
    this._table = table;
    this._eqCol = null;
    this._eqVal = null;
    this._orderCol = null;
    this._orderAsc = true;
    this._limit = null;
    this._mode = 'select';
    this._selectCols = '*';
    this._payload = null;
    this._single = null; // 'single' | 'maybeSingle' | null
  }
  select(cols = '*') { this._mode = this._mode === 'select' ? 'select' : this._mode; this._selectCols = cols; if (this._mode === 'select-pending') this._mode = 'select'; return this; }
  eq(col, val) { this._eqCol = col; this._eqVal = val; return this; }
  order(col, opts = {}) { this._orderCol = col; this._orderAsc = opts.ascending !== false; return this; }
  limit(n) { this._limit = n; return this; }
  single() { this._single = 'single'; return this._exec(); }
  maybeSingle() { this._single = 'maybeSingle'; return this._exec(); }
  insert(payload) { this._mode = 'insert'; this._payload = payload; return this._exec(); }
  update(payload) { this._mode = 'update'; this._payload = payload; return this._exec(); }
  delete() { this._mode = 'delete'; return this._exec(); }

  _matches(row) {
    if (this._eqCol == null) return true;
    return row[this._eqCol] === this._eqVal;
  }

  // Thenable so `await supabase.from(x).select('*')...` works without an
  // explicit .single()/.maybeSingle() call.
  then(resolve, reject) {
    try { resolve(this._exec()); } catch (e) { reject ? reject(e) : console.error(e); }
  }

  _exec() {
    let rows = readTable(this._table);

    if (this._mode === 'insert') {
      const items = Array.isArray(this._payload) ? this._payload : [this._payload];
      const inserted = items.map(item => {
        const row = { id: uuid(), created_at: new Date().toISOString(), ...clone(item) };
        rows.push(row);
        return row;
      });
      writeTable(this._table, rows);
      return { data: Array.isArray(this._payload) ? inserted : inserted[0], error: null };
    }

    let filtered = rows.filter(r => this._matches(r));

    if (this._mode === 'update') {
      const updated = [];
      rows = rows.map(r => {
        if (this._matches(r)) { const merged = { ...r, ...clone(this._payload) }; updated.push(merged); return merged; }
        return r;
      });
      writeTable(this._table, rows);
      return { data: updated, error: null };
    }

    if (this._mode === 'delete') {
      const remaining = rows.filter(r => !this._matches(r));
      const deleted = rows.filter(r => this._matches(r));
      writeTable(this._table, remaining);
      return { data: deleted, error: null };
    }

    // select
    if (this._orderCol) {
      filtered = [...filtered].sort((a, b) => {
        const av = a[this._orderCol], bv = b[this._orderCol];
        if (av === bv) return 0;
        const cmp = av > bv ? 1 : -1;
        return this._orderAsc ? cmp : -cmp;
      });
    }
    if (this._limit != null) filtered = filtered.slice(0, this._limit);

    if (this._single === 'single' || this._single === 'maybeSingle') {
      const row = filtered[0];
      if (!row && this._single === 'single') return { data: null, error: { message: 'No rows found' } };
      return { data: row ? clone(row) : null, error: null };
    }
    return { data: clone(filtered), error: null };
  }
}

class StorageBucket {
  constructor(bucket) { this._bucket = bucket; }
  async upload(path, file) {
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const key = `bp_local_storage:${this._bucket}:${path}`;
      localStorage.setItem(key, dataUrl);
      return { data: { path }, error: null };
    } catch (err) {
      return { data: null, error: { message: err.message || 'Upload failed' } };
    }
  }
  getPublicUrl(path) {
    const key = `bp_local_storage:${this._bucket}:${path}`;
    const stored = localStorage.getItem(key);
    // Fall back to a stable, non-resolving placeholder path if the blob
    // isn't in localStorage (e.g. quota exceeded) so callers still get a string.
    return { data: { publicUrl: stored || `local-storage://${this._bucket}/${path}` } };
  }
  async remove(paths) {
    (paths || []).forEach(p => localStorage.removeItem(`bp_local_storage:${this._bucket}:${p}`));
    return { data: paths, error: null };
  }
}

function readUsers() {
  try { return JSON.parse(localStorage.getItem(LS_USERS_KEY) || '{}'); } catch { return {}; }
}
function writeUsers(u) { localStorage.setItem(LS_USERS_KEY, JSON.stringify(u)); }
function readAuth() {
  try { return JSON.parse(localStorage.getItem(LS_AUTH_KEY) || 'null'); } catch { return null; }
}
function writeAuth(session) {
  if (session) localStorage.setItem(LS_AUTH_KEY, JSON.stringify(session));
  else localStorage.removeItem(LS_AUTH_KEY);
}
function makeSession(email) {
  return { user: { id: `local-${email}`, email }, access_token: 'local-dev-token' };
}

const authChangeListeners = [];

// Seed a default local admin account (email/password only — this app has
// no server, so there's nothing to protect it from local users on the
// same browser profile). Change the password below if you want a
// different one; it's stored in plain localStorage either way.
(function seedDefaultAdmin() {
  const users = readUsers();
  if (!users['admin@brightpearl.academy']) {
    users['admin@brightpearl.academy'] = { password: 'admin123' };
    writeUsers(users);
  }
})();

const localAuth = {
  async signUp({ email, password }) {
    const users = readUsers();
    if (users[email]) return { data: null, error: { message: 'An account with this email already exists.' } };
    users[email] = { password };
    writeUsers(users);
    const session = makeSession(email);
    writeAuth(session);
    authChangeListeners.forEach(cb => cb('SIGNED_IN', session));
    return { data: { session, user: session.user }, error: null };
  },
  async signInWithPassword({ email, password }) {
    const users = readUsers();
    const record = users[email];
    if (!record || record.password !== password) {
      return { data: null, error: { message: 'Invalid login credentials' } };
    }
    const session = makeSession(email);
    writeAuth(session);
    authChangeListeners.forEach(cb => cb('SIGNED_IN', session));
    return { data: { session, user: session.user }, error: null };
  },
  async signOut() {
    writeAuth(null);
    authChangeListeners.forEach(cb => cb('SIGNED_OUT', null));
    return { error: null };
  },
  async getSession() {
    return { data: { session: readAuth() }, error: null };
  },
  onAuthStateChange(cb) {
    authChangeListeners.push(cb);
    return { data: { subscription: { unsubscribe: () => {
      const i = authChangeListeners.indexOf(cb);
      if (i !== -1) authChangeListeners.splice(i, 1);
    } } } };
  },
};

export const supabase = {
  from(table) { return new QueryBuilder(table); },
  storage: { from(bucket) { return new StorageBucket(bucket); } },
  auth: localAuth,
};
