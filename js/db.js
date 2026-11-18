/* Calendar storage.
   Prototype: everything lives in this browser's IndexedDB, so a share link only opens on this device.
   This is the one file to swap for the real backend (e.g. Supabase tables + private storage bucket) —
   keep the same function names and the rest of the app won't notice. */
(function () {
  const A = (window.Advent = window.Advent || {});

  const DB_NAME = 'littledoors';
  const memory = { calendars: new Map(), photos: new Map() }; // fallback when IndexedDB is unavailable
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          db.createObjectStore('calendars', { keyPath: 'id' });
          db.createObjectStore('photos', { keyPath: 'id' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
    return dbp;
  }

  async function tx(store, mode, fn) {
    const db = await open();
    if (!db) {
      const out = fn(null, memory[store]);
      return out && typeof out === 'object' && 'result' in out ? out.result : out;
    }
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const s = t.objectStore(store);
      const req = fn(s);
      t.oncomplete = () => resolve(req && req.result);
      t.onerror = () => reject(t.error);
    });
  }

  const newId = (n = 10) => {
    const b = new Uint8Array(n);
    crypto.getRandomValues(b);
    return Array.from(b, (x) => 'abcdefghijkmnpqrstuvwxyz23456789'[x % 32]).join('');
  };

  A.DB = {
    newId,

    async saveCalendar(cal) {
      cal.updatedAt = Date.now();
      await tx('calendars', 'readwrite', (s, mem) => (s ? s.put(cal) : mem.set(cal.id, structuredClone(cal))));
      return cal;
    },

    async getCalendar(id) {
      const r = await tx('calendars', 'readonly', (s, mem) => (s ? s.get(id) : { result: mem.get(id) }));
      return r ? structuredClone(r) : null;
    },

    async putPhoto(blob) {
      const id = newId(14);
      await tx('photos', 'readwrite', (s, mem) => (s ? s.put({ id, blob }) : mem.set(id, { id, blob })));
      return id;
    },

    async getPhotoURL(id) {
      if (!id) return null;
      const r = await tx('photos', 'readonly', (s, mem) => (s ? s.get(id) : { result: mem.get(id) }));
      return r ? URL.createObjectURL(r.blob) : null;
    },

    async deletePhoto(id) {
      if (!id) return;
      await tx('photos', 'readwrite', (s, mem) => (s ? s.delete(id) : mem.delete(id)));
    },
  };

  // Downscale + re-encode in the browser before saving (what the real upload would do too).
  A.preparePhoto = async function (file, max = 1600) {
    let src;
    try {
      src = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (e) {
      src = await new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = URL.createObjectURL(file);
      });
    }
    const w = src.width, h = src.height;
    const k = Math.min(1, max / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.round(w * k);
    c.height = Math.round(h * k);
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
  };
})();
