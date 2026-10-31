const CACHE = 'union-vault-v373';
const SHELL = [
  '/', '/index.html',
  '/css/fonts.css', '/css/app.css', '/css/landing.css',
  '/js/wallpaper.js', '/js/state.js', '/js/utils.js', '/js/navigation.js',
  '/js/dashboard.js', '/js/details.js', '/js/guests.js', '/js/timeline.js',
  '/js/send-sheet.js', '/js/rsvp.js', '/js/checklist.js', '/js/vendors.js',
  '/js/budget.js', '/js/seating.js', '/js/supabase.js', '/js/subscription.js', '/js/autocomplete.js',
  '/js/floorplan.js', '/js/inspiration.js', '/js/visionboard.js',
  '/js/wishingwell.js', '/js/website.js', '/js/invitations.js', '/js/events.js',
  '/js/settings.js', '/js/import.js', '/js/attachments.js', '/js/export.js',
  '/js/tags.js', '/js/undo.js', '/js/payments.js', '/js/auth.js',
  '/js/storage.js', '/js/media.js', '/js/welcome.js', '/js/dots.js',
  '/js/init.js', '/js/logos.js', '/js/sw-register.js', '/js/landing.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.cache === 'reload') {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp.ok) caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        return resp;
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
