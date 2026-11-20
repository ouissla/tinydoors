/* Cloud storage is opt-in; local prototypes keep the original IndexedDB adapter. */
(function () {
  const A = window.Advent;
  const local = A.DB;
  const sharedPhotos = new Map(), shares = new Map();
  const params = new URLSearchParams(location.search);
  const owned = async () => {
    const session = await A.Auth.session();
    return session.user;
  };
  const checked = ({ data, error }) => { if (error) throw error; return data; };
  const planOf = (entitlements) => entitlements?.status === 'active' && Date.parse(entitlements.expires_at) > Date.now() ? 'season' : 'free';
  const fromRow = (row) => row ? { ...row.document, id: row.id, plan: planOf(row.calendar_entitlements) } : null;

  A.DBReady = A.Auth.ready.then(() => {
    if (A.Auth.mode !== 'cloud') return;
    const client = A.Auth.client;
    const bucket = () => client.storage.from(A.Auth.config.photoBucket);
    A.DB = {
      isCloud: true,
      newId: local.newId,
      async saveCalendar(cal) {
        const user = await owned();
        const { plan, ...document } = structuredClone(cal);
        document.updatedAt = Date.now();
        checked(await client.from('calendars').upsert({ id: cal.id, owner_id: user.id, document }, { onConflict: 'id' }));
        cal.updatedAt = document.updatedAt;
        return cal;
      },
      async getCalendar(id) {
        const token = params.get('s');
        if (token && !document.body.classList.contains('editor')) {
          const response = await fetch('/api/shared/' + encodeURIComponent(token), { cache: 'no-store' });
          if (response.status === 404 || response.status === 410) return null;
          if (!response.ok) throw new Error('Could not load this calendar. Please try again.');
          const data = await response.json();
          if (data.calendar.id !== id) return null;
          Object.entries(data.photos).forEach(([path, url]) => sharedPhotos.set(path, url));
          return data.calendar;
        }
        if (!A.Auth.user) return null;
        const row = checked(await client.from('calendars').select('id,document,calendar_entitlements(status,expires_at)').eq('id', id).maybeSingle());
        return fromRow(row);
      },
      async listCalendars() {
        await owned();
        return checked(await client.from('calendars').select('id,document,updated_at').order('updated_at', { ascending: false })).map((row) => ({
          id: row.id, to: row.document.to, theme: row.document.theme, updatedAt: row.updated_at,
        }));
      },
      async putPhoto(blob) {
        const user = await owned();
        const path = user.id + '/' + local.newId(24) + '.jpg';
        checked(await bucket().upload(path, blob, { contentType: 'image/jpeg', upsert: false }));
        return path;
      },
      async putVideo(blob) {
        if (!['video/webm', 'video/mp4'].includes(blob.type.split(';')[0]) || blob.size > 10 * 1024 * 1024) throw new Error('Video must be WebM or MP4 and under 10 MB.');
        const user = await owned();
        const type = blob.type.split(';')[0];
        const path = user.id + '/' + local.newId(24) + (type === 'video/mp4' ? '.mp4' : '.webm');
        checked(await bucket().upload(path, blob, { contentType: type, upsert: false }));
        return path;
      },
      async getPhotoURL(path) {
        if (!path) return null;
        if (sharedPhotos.has(path)) return sharedPhotos.get(path);
        await owned();
        return checked(await bucket().createSignedUrl(path, 3600)).signedUrl;
      },
      async deletePhoto(path) {
        if (!path) return;
        const user = await owned();
        if (!path.startsWith(user.id + '/')) throw new Error('This photo belongs to another account.');
        checked(await bucket().remove([path]));
      },
      async shareCalendar(id) {
        if (!shares.has(id)) {
          const data = await A.Auth.request('/api/calendars/' + encodeURIComponent(id) + '/share', { method: 'POST' });
          shares.set(id, data.token);
        }
        return shares.get(id);
      },
    };
  });
  A.DBReady.catch(() => {});
})();
