// Construit Crampons d'Or à partir de src/ et assets/.
//  - Le site publié par GitHub Pages, à la racine : index.html, jeu.js, jeu.css, sw.js, manifest.webmanifest, version.json
//    (le code, les sons et les images sont des fichiers séparés, gardés hors connexion par le service worker)
//  - Dans dist/ (non publié) : des versions « un seul fichier » pour l'aperçu Claude, Netlify Drop et les tests
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..'), R = p => path.join(ROOT, p), read = p => fs.readFileSync(R(p), 'utf8');
// ordre de chargement des modules (ils partagent une même portée)
const ORDER = ['data.js', 'core.js', 'sim.js', 'life.js', 'extra.js', 'me.js', 'live.js', 'comm.js', 'audio.js', 'media.js', 'art.js', 'mview.js', 'geste.js', 'm3d.js', 'm3dgfx.js', 'm3dsk.js', 'm3dmc.js', 'm3dfx.js', 'm3dst.js', 'm3dnet.js', 'm3ddeco.js', 'intro.js', 'fete.js', 'loading.js', 'online.js', 'shop.js', 'ui.js', 'ui2.js', 'ui3.js', 'ui4.js'].filter(f => fs.existsSync(R('src/' + f)));
const pkg = JSON.parse(read('package.json')), VERSION = pkg.version;
// empreintes : le même contenu donne toujours les mêmes fichiers (ici comme chez le robot) ; un contenu modifié change d'adresse,
// ce qui force les téléphones à le retélécharger
const sha = b => crypto.createHash('sha1').update(b).digest('hex').slice(0, 10);
const ls = d => fs.existsSync(R(d)) ? fs.readdirSync(R(d)) : [];
const crowd = ls('assets/foule').filter(f => f.endsWith('.mp3')).sort().map(f => f.slice(0, -4));
const sons = ls('assets/sons').filter(f => f.endsWith('.mp3')).sort().map(f => f.slice(0, -4));
const voix = fs.existsSync(R('assets/voix/index.json')) ? JSON.parse(read('assets/voix/index.json')) : {};
const JOUEUR = fs.existsSync(R('assets/joueur/joueur.json')) ? JSON.parse(read('assets/joueur/joueur.json')) : null;
const STADE = fs.existsSync(R('assets/stade/stade.json')) ? JSON.parse(read('assets/stade/stade.json')) : null;
const DECOR = fs.existsSync(R('assets/decor/decor.json')) ? JSON.parse(read('assets/decor/decor.json')) : null;
// textures photo libres (Poly Haven, CC0), réduites par le robot médias : ciel, gazon, prés, route, parvis
const TEX = Object.fromEntries(ls('assets/textures').filter(f => /\.(jpg|webp|png)$/.test(f)).sort().map(f => [f.replace(/\.\w+$/, ''), f]));
// écran d'ouverture : photos libres (Unsplash) du retourné et du stade, préparées par tools/intro_photos.py
const INTRO_PH = fs.existsSync(R('assets/intro/intro.json')) ? JSON.parse(read('assets/intro/intro.json')) : null;
// animations en capture de mouvement (base CMU), préparées par tools/mocap.py
const ANIM = fs.existsSync(R('assets/anim/anim.json')) ? JSON.parse(read('assets/anim/anim.json')) : null;
const MEDIA_H = {}; for (const [d, ks] of [['foule', crowd], ['sons', sons]]) for (const k of ks) MEDIA_H[d + '/' + k] = sha(fs.readFileSync(R(`assets/${d}/${k}.mp3`))).slice(0, 8);
if (Object.keys(TEX).length) MEDIA_H.tex = sha(Buffer.concat(Object.values(TEX).map(f => fs.readFileSync(R('assets/textures/' + f))))).slice(0, 8);
if (ANIM) MEDIA_H.anim = sha(Buffer.concat(ls('assets/anim').sort().map(f => fs.readFileSync(R('assets/anim/' + f))))).slice(0, 8);
if (INTRO_PH) MEDIA_H.intro = sha(Buffer.concat(ls('assets/intro').sort().map(f => fs.readFileSync(R('assets/intro/' + f))))).slice(0, 8);
if (DECOR) MEDIA_H.decor = sha(Buffer.concat(ls('assets/decor').sort().map(f => fs.readFileSync(R('assets/decor/' + f))))).slice(0, 8);
if (STADE) MEDIA_H.stade = sha(Buffer.concat(ls('assets/stade').sort().map(f => fs.readFileSync(R('assets/stade/' + f))))).slice(0, 8);
if (JOUEUR) MEDIA_H.joueur = sha(Buffer.concat(ls('assets/joueur').sort().map(f => fs.readFileSync(R('assets/joueur/' + f))))).slice(0, 8);
const murl = (d, k) => `assets/${d}/${k}.mp3?h=${MEDIA_H[d + '/' + k]}`;
const code = ORDER.map(f => `// ===== src/${f} =====\n` + read('src/' + f)).join('\n');
const css = read('src/style.css');
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600;700&family=Big+Shoulders+Display:wght@700;800&family=Graduate&family=Protest+Strike&display=swap">';
const LZ = 'https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js';
// écran de démarrage : le même stade de nuit que l'écran de chargement du jeu (src/loading.js), dessiné dès l'ouverture de la page,
// avant que le jeu soit téléchargé ; le jeu reprend ensuite la même scène au même instant (ldBootFinish)
const BOOT_JS = '(function(){try{if(!window.requestAnimationFrame||!window.performance)return;var c0=document.createElement("canvas");if(!c0.getContext||!c0.getContext("2d"))return;\n'
  + 'var UI={screen:"splash",load:{title:"Saison 2026-27",t:"Préparation du stade…",p:0}};var clamp=function(v,a,b){return v<a?a:v>b?b:v};var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c]})};\n'
  + read('src/loading.js') + '\n'
  + 'var app=document.getElementById("app");if(!app)return;app.innerHTML=vLoadScreen(UI.load,"Simulateur de carrière");LD.load=UI.load;window.__ldBoot=LD;\n'
  + 'var T0=performance.now(),ST=[[0,"Préparation du stade…"],[22,"Chargement du moteur 3D…"],[40,"Chargement des données…"]];\n'
  + '(function prog(){if(LD.stop||!document.getElementById("ldx"))return;var t=(performance.now()-T0)/1000;UI.load.p=Math.round(58*(1-Math.exp(-t/1.7)));var s=ST[0][1];for(var i=0;i<ST.length;i++)if(UI.load.p>=ST[i][0])s=ST[i][1];if(s!==UI.load.t){UI.load.t=s;var lt=document.getElementById("lt");if(lt){lt.textContent=s;lt.classList.remove("in");void lt.offsetWidth;lt.classList.add("in");}}setTimeout(prog,150);})();\n'
  + 'ldStart();}catch(e){}})();';
const SHELL = '<div id="app"><div class="boot" aria-label="Chargement"><div class="boot-l">Crampons<span>d\'Or</span></div><div class="boot-bar"><i></i></div></div></div><script>' + BOOT_JS + '</script><nav id="nav" class="nav"></nav><div id="adv"></div><div id="ov"></div><div id="toast" aria-live="polite"></div>';
const HEAD = (icon, extra) => `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Crampons d'Or">
<meta name="theme-color" content="#09130f">
<link rel="apple-touch-icon" href="${icon}">
<title>Crampons d'Or</title>
${BOOT_CSS}
${FONTS}
${extra || ''}`;
const BOOT_CSS = '<style>html,body{margin:0;background:#03080a}.boot{position:fixed;inset:0;background:radial-gradient(120% 70% at 50% 0%,#0d2418 0%,#03080a 62%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;overflow:hidden}.boot:before,.boot:after{content:"";position:absolute;top:-12%;width:70%;height:125%;background:linear-gradient(180deg,rgba(255,228,175,.26),rgba(255,228,175,0) 72%);clip-path:polygon(46% 0,54% 0,100% 100%,0 100%);animation:bootBeam 2.4s ease-in-out infinite alternate}.boot:before{left:-18%;transform:rotate(-22deg);transform-origin:50% 0}.boot:after{right:-18%;transform:rotate(22deg);transform-origin:50% 0;animation-delay:-1.2s}.boot-l{position:relative;font:800 clamp(52px,16vw,104px)/.84 "Big Shoulders Display","Arial Narrow",Impact,sans-serif;text-transform:uppercase;color:#f3f6f3;text-align:center;letter-spacing:-.01em;filter:drop-shadow(0 8px 24px rgba(0,0,0,.9))}.boot-l span{display:block;color:#ffc23d}.boot-bar{position:relative;width:44%;max-width:260px;height:3px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden}.boot-bar i{position:absolute;inset:0;width:40%;background:linear-gradient(90deg,transparent,#ffd36b,transparent);animation:bootRun 1.1s ease-in-out infinite}@keyframes bootRun{from{transform:translateX(-100%)}to{transform:translateX(260%)}}@keyframes bootBeam{from{opacity:.45}to{opacity:1}}@media (prefers-reduced-motion:reduce){.boot:before,.boot:after,.boot-bar i{animation:none}}</style>';
const BASE_CSS = 'html,body{margin:0;height:100%}\n:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}\n[hidden]{display:none!important}\nimg{max-width:100%}\n';
const data = (c, s, v) => `var GAME_VERSION = ${JSON.stringify(VERSION)};\nvar CRWD_FILES = ${JSON.stringify(c)};\nvar SONS_FILES = ${JSON.stringify(s)};\nvar MEDIA_H = ${JSON.stringify(c.length || s.length ? MEDIA_H : {})};\nvar VOIX_INDEX = ${JSON.stringify(v)};\nvar JOUEUR_3D = ${JSON.stringify(JOUEUR)};\nvar STADE_3D = ${JSON.stringify(STADE)};\nvar DECOR_3D = ${JSON.stringify(DECOR)};\nvar TEX_3D = ${JSON.stringify(TEX)};\nvar INTRO_PH = ${JSON.stringify(INTRO_PH)};\nvar ANIM_3D = ${JSON.stringify(ANIM)};\n`;
const wrap = js => `(function(){\n${js}\n})();\n`;

// ---------- 1. site publié (multi-fichiers) ----------
const JS = data(crowd, sons, voix) + wrap(code), CSS = BASE_CSS + css;
const HASH = sha(JS + CSS + fs.readFileSync(R('lib/three.min.js'))), q = '?v=' + HASH;
fs.writeFileSync(R('jeu.js'), `/* Crampons d'Or ${VERSION} — fichier GÉNÉRÉ par tools/build.js à partir de src/ : ne pas le modifier à la main */\n${JS}`);
fs.writeFileSync(R('jeu.css'), `/* Crampons d'Or ${VERSION} — GÉNÉRÉ à partir de src/style.css */\n${CSS}`);
fs.writeFileSync(R('index.html'), `<!doctype html>
<html lang="fr">
<head>
${HEAD('assets/icones/icon-180.png', `<link rel="manifest" href="manifest.webmanifest">\n<link rel="stylesheet" href="jeu.css${q}">`)}
</head>
<body>
${SHELL}
<script src="${LZ}"></script>
<script src="lib/three.min.js${q}"></script>
<script src="jeu.js${q}"></script>
</body>
</html>
`);
fs.writeFileSync(R('version.json'), JSON.stringify({ version: VERSION, empreinte: HASH }, null, 1) + '\n');
fs.writeFileSync(R('manifest.webmanifest'), JSON.stringify({
  name: "Crampons d'Or", short_name: "Crampons d'Or", description: "Simulateur de carrière de footballeur, de 14 ans jusqu'au Ballon d'Or.", lang: 'fr',
  start_url: './', scope: './', display: 'standalone', orientation: 'portrait', background_color: '#09130f', theme_color: '#09130f',
  icons: [{ src: 'assets/icones/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'assets/icones/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: 'assets/icones/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
}, null, 1) + '\n');
const CORE = ['./', 'index.html', 'jeu.js' + q, 'jeu.css' + q, 'lib/three.min.js' + q, 'manifest.webmanifest', 'assets/icones/icon-180.png', 'assets/icones/icon-192.png', 'assets/icones/icon-512.png', ...crowd.map(k => murl('foule', k)), ...sons.map(k => murl('sons', k))];
fs.writeFileSync(R('sw.js'), `// Crampons d'Or ${VERSION} — GÉNÉRÉ par tools/build.js
// Hors connexion : le jeu, la foule et les bruitages sont gardés sur le téléphone ; les voix enregistrées le sont dès qu'elles ont servi.
// Une nouvelle version s'installe en arrière-plan, puis le jeu propose de recharger.
const C = 'cdo-${VERSION}-${HASH}';
const CORE = ${JSON.stringify(CORE)};
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
    if (/(^|\\.)fonts\\.(googleapis|gstatic)\\.com$|^cdnjs\\.cloudflare\\.com$/.test(u.hostname)) e.respondWith(caches.open(C).then(c => c.match(r).then(m => m || fetch(r).then(res => { c.put(r, res.clone()); return res; }))));
    return;
  }
  // voix et médias : gardés dès la première écoute (leur nom change quand le contenu change)
  if (u.pathname.includes('/assets/')) { e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open('cdo-medias').then(c => c.put(r, cp)); } return res; }))); return; }
  // le reste : copie gardée d'abord (rapide, hors connexion), le réseau sert aux mises à jour
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok && r.mode === 'navigate') { const cp2 = res.clone(); caches.open(C).then(c => c.put(r, cp2)); } return res; }).catch(() => caches.match('index.html'))));
});
`);

// ---------- 2. versions « un seul fichier » (dist/, non publiées) ----------
fs.mkdirSync(R('dist'), { recursive: true });
const three = read('lib/three.min.js').replace(/<\/script/gi, '<\\/script');
const b64 = p => fs.readFileSync(R(p)).toString('base64');
const crowdB64 = Object.fromEntries(crowd.map(k => [k, b64(`assets/foule/${k}.mp3`)]));
const body = (withCrowd, extraJs) => `${SHELL}
<script src="${LZ}"></script>
<script>
${three}
</script>
${withCrowd ? `<script>var CRWD_B64 = ${JSON.stringify(crowdB64)};</script>` : ''}
<script>
${data([], [], {})}${wrap(code + (extraJs || ''))}</script>`;
const single = (withCrowd, extraJs) => `<!doctype html>
<html lang="fr">
<head>
${HEAD('data:image/png;base64,' + b64('assets/icones/icon-180.png'))}
<style>
${BASE_CSS}${css}
</style>
</head>
<body>
${body(withCrowd, extraJs)}
</body>
</html>
`;
fs.writeFileSync(R('dist/crampons-dor.html'), single(true));
fs.writeFileSync(R('dist/crampons-dor-leger.html'), single(false));
fs.writeFileSync(R('dist/artifact.html'), `<title>Crampons d'Or</title>\n${BOOT_CSS}\n${FONTS}\n<style>\n${css}\n</style>\n${body(true)}\n`);
const TEST_EXPORTS = "\nwindow.__T = () => ({ get S() { return S; }, retire, reconvert, render, flow, UI, save, ACT, AU, auStartTrack, auUnlock, sfxPlay, crowdStart, crowdStop, TRACKS, OPTS, LV, liveStats, meFrame, lvDraw, lvReset, G3, G3TX, SAY, CMX, sayPush, AIV, SMP, smpPlay, INTRO, IN_PH, inPreload, GE, geNew, geGesture, geShape, geCam, geAvail, geGeo, geGoal, geTargets, liveSim, liveAt, lvRec, lvPair, meFreeKick, meCorner, setRestart: typeof setRestart === 'function' ? setRestart : null, introPlay, introFrame, introEnd, PK, pkStat, pkLines, aivVoice, aivFetch, sfxG, voixFile: typeof voixFile === 'function' ? voixFile : null, ONL: typeof ONL !== 'undefined' ? ONL : null, BTQ: typeof BTQ !== 'undefined' ? BTQ : null, shopW: typeof shopW === 'function' ? shopW : null, shopEquip: typeof shopEquip === 'function' ? shopEquip : null, shopGain: typeof shopGain === 'function' ? shopGain : null, G3PV: typeof G3PV !== 'undefined' ? G3PV : null, G3SK: typeof G3SK !== 'undefined' ? G3SK : null, G3ST: typeof G3ST !== 'undefined' ? G3ST : null, G3DC: typeof G3DC !== 'undefined' ? G3DC : null, FETE: typeof FETE !== 'undefined' ? FETE : null, FQ: typeof FQ !== 'undefined' ? FQ : null, fetePlay: typeof fetePlay === 'function' ? fetePlay : null, G3NET: typeof G3NET !== 'undefined' ? G3NET : null, g3NetUpdate: typeof g3NetUpdate === 'function' ? g3NetUpdate : null, g3Camera: typeof g3Camera === 'function' ? g3Camera : null, G3: typeof G3 !== 'undefined' ? G3 : null, g3Pose: typeof g3Pose === 'function' ? g3Pose : null, G3MC: typeof G3MC !== 'undefined' ? G3MC : null, g3SkFlush: typeof g3SkFlush === 'function' ? g3SkFlush : null, g3Hide: typeof g3Hide === 'function' ? g3Hide : null });";
fs.writeFileSync(R('dist/test.html'), single(true, TEST_EXPORTS));
fs.writeFileSync(R('dist/jeu-test.js'), data(crowd, sons, voix) + wrap(code + TEST_EXPORTS)); // version multi-fichiers testable (tests/serve.js)
const sz = f => (fs.statSync(R(f)).size / 1024).toFixed(0) + ' Ko';
console.log(`Crampons d'Or ${VERSION} · jeu.js ${sz('jeu.js')} · ${crowd.length} sons de foule · ${sons.length} bruitages · ${Object.keys(voix).length} répliques enregistrées · dist/crampons-dor.html ${sz('dist/crampons-dor.html')}`);
