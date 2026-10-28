// AxFit service worker: funciona sin internet y revisa recordatorios en segundo plano.
const VERSION = 'axfit-v4';
const ASSETS = [
  './', 'index.html', 'css/styles.css', 'js/icons.js', 'js/data.js', 'js/app.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== 'axfit-config').map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Red primero para que las actualizaciones lleguen; caché si no hay internet.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req.mode === 'navigate' ? req.url : req, { cache: 'no-cache' }) // revalida con el servidor: evita versiones viejas de la caché HTTP
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))),
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.registration.scope)) { c.navigate(url); return c.focus(); }
      }
      return self.clients.openWindow(url);
    }),
  );
});

// Periodic Background Sync (Chrome/Android con la app instalada). El navegador decide la frecuencia.
self.addEventListener('periodicsync', (e) => {
  if (e.tag === 'axfit-reminders') e.waitUntil(checkReminders());
});

// Push real (si en el futuro conectas un servidor de notificaciones).
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data.json(); } catch { d = { title: 'AxFit', body: e.data?.text() || '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'AxFit', { body: d.body, icon: 'icons/icon-192.png', data: { url: d.url || './' } }));
});

function key(d) { const z = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; }
function hm(s) { const [h, m] = s.split(':').map(Number); return h * 60 + (m || 0); }

async function checkReminders() {
  const c = await caches.open('axfit-config');
  const r = await c.match('./__config');
  if (!r) return;
  const cfg = await r.json();
  if (!cfg.notif) return;
  const now = new Date(), k = key(now), dow = now.getDay(), m = now.getHours() * 60 + now.getMinutes();
  cfg.notified = cfg.notified || {};
  const show = async (id, title, body, tab) => {
    if (cfg.notified[id] === k) return;
    cfg.notified[id] = k;
    await self.registration.showNotification(title, { body, icon: 'icons/icon-192.png', tag: `axfit-${id}`, data: { url: `./#${tab}` } });
  };
  const daysSince = cfg.lastVideo ? Math.round((new Date(k) - new Date(cfg.lastVideo)) / 86400000) : 999;
  if (dow === +cfg.videoDay && m >= hm(cfg.videoTime) && daysSince >= 6) {
    await show('video', '🎥 Hoy toca tu video de progreso', 'Pésate, mide tu cintura y graba tu video de la semana.', 'progreso');
  }
  const workoutDone = cfg.today === k && cfg.workoutToday;
  if (cfg.workoutReminder && dow >= 1 && dow <= 4 && m >= hm(cfg.workoutTime) && m < hm(cfg.workoutTime) + 75 && !workoutDone) {
    await show('workout', '🏋️ Entrenamiento a las 8', 'Solo 1 hora. Abre AxFit y dale play.', 'ejercicio');
  }
  if (cfg.sleepReminder && m >= hm(cfg.sleepTime) && m < hm(cfg.sleepTime) + 90) {
    await show('sleep', '😴 Hora de dormir', 'Cierra la laptop. Dormir también es entrenar.', 'hoy');
  }
  await c.put('./__config', new Response(JSON.stringify(cfg), { headers: { 'content-type': 'application/json' } }));
}
