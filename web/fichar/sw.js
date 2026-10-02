// ═══ AVISOS DE FICHAJE ═══
// El aviso llega sin carga útil: solo el hecho de que hay que fichar. Así no
// viaja ningún dato personal por los servidores de push de Google o Apple,
// y además evita tener que cifrar el contenido.
self.addEventListener('push', (e) => {
  let titulo = 'Recuerda fichar';
  let cuerpo = 'No nos consta tu fichaje de hoy.';
  try {
    if (e.data) {
      const d = e.data.json();
      if (d && d.t) titulo = String(d.t);
      if (d && d.c) cuerpo = String(d.c);
    }
  } catch (x) {}
  e.waitUntil(self.registration.showNotification(titulo, {
    body: cuerpo,
    icon: '/app/icon-192.png',
    badge: '/app/icon-192.png',
    tag: 'bh10-fichaje',        // uno solo: no se acumulan avisos repetidos
    renotify: true,
    requireInteraction: false,
    data: { url: '/fichar/' },
  }));
});

// Al tocar el aviso, se abre la app: si ya estaba abierta, se trae al frente
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const destino = (e.notification.data && e.notification.data.url) || '/fichar/';
  e.waitUntil((async () => {
    const abiertas = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of abiertas) {
      if (c.url.includes('/fichar')) { await c.focus(); return; }
    }
    await clients.openWindow(destino);
  })());
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
