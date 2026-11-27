// Persists files the game writes (player profiles, saved games, scenarios, registry) in IndexedDB,
// so they survive reloads like files in a Windows installation folder. The supplied game folder is
// mirrored read-only from the server; stored files are restored over it at startup.
const DB = 'aoe-rise-of-rome', STORE = 'files';
// /c holds the game's debug logs (C:\); they are not kept between sessions.
const SKIP = new Set(['/dev', '/proc', '/tmp', '/home', '/c']);

function request(r) { return new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); }); }

export async function openStorage() {
  if (typeof indexedDB === 'undefined') return null;
  try {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    return await request(open);
  } catch { return null; } // storage blocked: the game still runs, nothing persists
}

export async function loadFiles(db) {
  if (!db) return new Map();
  const tx = db.transaction(STORE, 'readonly'), store = tx.objectStore(STORE);
  const [keys, values] = await Promise.all([request(store.getAllKeys()), request(store.getAll())]);
  return new Map(keys.map((k, i) => [k, values[i]]));
}

function walk(FS, dir, out) {
  for (const name of FS.readdir(dir)) {
    if (name === '.' || name === '..') continue;
    const path = dir === '/' ? '/' + name : dir + '/' + name;
    if (SKIP.has(path)) continue;
    const stat = FS.stat(path);
    if (FS.isDir(stat.mode)) walk(FS, path, out);
    else if (FS.isFile(stat.mode)) out.set(path, stat.mtime.getTime());
  }
  return out;
}

// Tracks file modification times after startup and stores files that changed since the last check.
export class FileSaver {
  constructor(db, FS) { this.db = db; this.FS = FS; this.known = walk(FS, '/', new Map()); this.busy = false; }
  async save() {
    if (!this.db || this.busy) return 0;
    this.busy = true;
    try {
      const now = walk(this.FS, '/', new Map()), changed = [];
      for (const [path, time] of now) if (this.known.get(path) !== time) changed.push(path);
      this.known = now;
      if (!changed.length) return 0;
      const tx = this.db.transaction(STORE, 'readwrite'), store = tx.objectStore(STORE);
      for (const path of changed) store.put(this.FS.readFile(path), path);
      await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
      return changed.length;
    } finally { this.busy = false; }
  }
}
