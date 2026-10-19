// Crampons d'Or 11.0.0 — GÉNÉRÉ par tools/build.js
// Hors connexion : le jeu, la foule et les bruitages sont gardés sur le téléphone ; les voix enregistrées le sont dès qu'elles ont servi.
// Une nouvelle version s'installe en arrière-plan, puis le jeu propose de recharger.
const C = 'cdo-11.0.0-bb32c388a4';
const CORE = ["./","index.html","jeu.js?v=bb32c388a4","jeu.css?v=bb32c388a4","lib/three.min.js?v=bb32c388a4","manifest.webmanifest","assets/icones/icon-180.png","assets/icones/icon-192.png","assets/icones/icon-512.png","assets/foule/chant_2.mp3?h=3ebb4bce","assets/foule/chant_3.mp3?h=4f555b3f","assets/foule/chant_4.mp3?h=e9942adb","assets/foule/cheer_loop.mp3?h=e5b4a150","assets/foule/goal_1.mp3?h=a49bc043","assets/foule/goal_2.mp3?h=db0cbb88","assets/foule/goal_3.mp3?h=05dbbca2","assets/foule/goal_4.mp3?h=09720ea4","assets/foule/ooh_1.mp3?h=155d868a","assets/foule/roar_1.mp3?h=aff56709","assets/foule/roar_2.mp3?h=a3f978be","assets/foule/roar_3.mp3?h=6bed5e29","assets/foule/roar_4.mp3?h=df5f4aa6","assets/foule/surge.mp3?h=ce5de2be","assets/sons/catch.mp3?h=082b1f8c","assets/sons/glass.mp3?h=149bfce3","assets/sons/header.mp3?h=ac052ba0","assets/sons/kick.mp3?h=877b4236","assets/sons/net.mp3?h=fe0694be","assets/sons/post.mp3?h=ae984141","assets/sons/shot.mp3?h=9695a8e3","assets/sons/tackle.mp3?h=601ffa60","assets/sons/whistle1.mp3?h=cc2e8cf9","assets/sons/whistle3.mp3?h=dbccf110"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(CORE)).catch(() => { })
    // venant de l'ancienne version (un seul fichier, cache « cdo-v… ») : on prend la main tout de suite, sans bandeau
    .then(() => caches.keys()).then(ks => { if (ks.some(k => /^cdo-v[0-9]+$/.test(k))) self.skipWaiting(); }));
});
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C && k !== 'cdo-medias').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('message', e => { if (e.data === 'maj') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) {
    if (/(^|\.)fonts\.(googleapis|gstatic)\.com$|^cdnjs\.cloudflare\.com$/.test(u.hostname)) e.respondWith(caches.open(C).then(c => c.match(r).then(m => m || fetch(r).then(res => { c.put(r, res.clone()); return res; }))));
    return;
  }
  // voix et médias : gardés dès la première écoute (leur nom change quand le contenu change)
  if (u.pathname.includes('/assets/')) { e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open('cdo-medias').then(c => c.put(r, cp)); } return res; }))); return; }
  // le reste : copie gardée d'abord (rapide, hors connexion), le réseau sert aux mises à jour
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok && r.mode === 'navigate') { const cp2 = res.clone(); caches.open(C).then(c => c.put(r, cp2)); } return res; }).catch(() => caches.match('index.html'))));
});
