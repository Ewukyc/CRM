// Простейшая обёртка над IndexedDB без сторонних библиотек
const DB_NAME = "crm_zero_v1";
const DB_VERSION = 1;
const STORES = { clients: "clients", deals: "deals" };

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.clients)) {
        const s = db.createObjectStore(STORES.clients, { keyPath: "id", autoIncrement: true });
        s.createIndex("by_name", "name", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.deals)) {
        const s = db.createObjectStore(STORES.deals, { keyPath: "id", autoIncrement: true });
        s.createIndex("by_client", "clientId", { unique: false });
        s.createIndex("by_status", "status", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(store, mode = "readonly") {
  const db = await openDB();
  return db.transaction(store, mode).objectStore(store);
}

export async function all(store) {
  const os = await tx(store);
  return new Promise((res, rej) => {
    const out = [];
    const cur = os.openCursor(null, "prev");
    cur.onsuccess = () => {
      const c = cur.result;
      if (c) { out.push(c.value); c.continue(); } else res(out);
    };
    cur.onerror = () => rej(cur.error);
  });
}

export async function add(store, value) {
  const os = await tx(store, "readwrite");
  return new Promise((res, rej) => {
    const req = os.add({ ...value, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export async function put(store, value) {
  const os = await tx(store, "readwrite");
  return new Promise((res, rej) => {
    const req = os.put({ ...value, updatedAt: new Date().toISOString() });
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export async function get(store, id) {
  const os = await tx(store);
  return new Promise((res, rej) => {
    const req = os.get(id);
    req.onsuccess = () => res(req.result || null);
    req.onerror = () => rej(req.error);
  });
}

export async function del(store, id) {
  const os = await tx(store, "readwrite");
  return new Promise((res, rej) => {
    const req = os.delete(id);
    req.onsuccess = () => res(true);
    req.onerror = () => rej(req.error);
  });
}

export async function byIndex(store, indexName, key) {
  const os = await tx(store);
  return new Promise((res, rej) => {
    const idx = os.index(indexName);
    const out = [];
    const rq = idx.openCursor(IDBKeyRange.only(key));
    rq.onsuccess = () => {
      const c = rq.result;
      if (c) { out.push(c.value); c.continue(); } else res(out);
    };
    rq.onerror = () => rej(rq.error);
  });
}

export async function dumpDB() {
  const [clients, deals] = await Promise.all([all(STORES.clients), all(STORES.deals)]);
  return { meta: { name: DB_NAME, version: DB_VERSION, exportedAt: new Date().toISOString() }, clients, deals };
}

export async function importDB(json) {
  if (!json || !Array.isArray(json.clients) || !Array.isArray(json.deals)) throw new Error("Неверный формат файла");
  // зальём поверх (upsert по id если есть)
  const db = await openDB();
  const t = db.transaction([STORES.clients, STORES.deals], "readwrite");
  const sc = t.objectStore(STORES.clients);
  const sd = t.objectStore(STORES.deals);
  await Promise.all(json.clients.map(v => new Promise((res, rej) => { const r = sc.put(v); r.onsuccess = () => res(); r.onerror = () => rej(r.error); })));
  await Promise.all(json.deals.map(v => new Promise((res, rej) => { const r = sd.put(v); r.onsuccess = () => res(); r.onerror = () => rej(r.error); })));
  return new Promise((res, rej) => { t.oncomplete = () => res(true); t.onerror = () => rej(t.error); });
}

export const STORES_CONST = STORES;
