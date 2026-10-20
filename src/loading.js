// ---------- Écran de chargement : stade de nuit, projecteurs qui s'allument, poussière d'or, ballon qui roule ----------
// Un seul canvas 2D (léger pour l'iPhone) : décor fixe pré-dessiné, effets animés par-dessus.
const LD = { raf: 0, cv: null, g: null, bg: null, w: 0, h: 0, dpr: 1, t0: 0, last: 0, shown: 0, dust: [], sparks: [], flash: [], crowd: [], roll: 0, tip: '', out: false, rm: false };
const LD_TIPS = [
  'Un bon match en direct vaut plus qu\'une saison simulée : c\'est là que les recruteurs regardent.',
  'Le moral compte autant que les jambes : une famille et des amis contents, c\'est des points de forme.',
  'Les Pépites se gagnent en jouant : buts, passes décisives, victoires, trophées… et le bonus du jour.',
  'Dans la Boutique, tes crampons, ton ballon et ta célébration apparaissent pendant les matchs en 3D.',
  'Lo Sol parle beaucoup. Nathalie essaie de le ramener au match. Elle n\'y arrive pas toujours.',
  'Un agent malin négocie mieux ton salaire, mais il prend sa commission.',
  'Avant 18 ans, l\'école compte aussi : un bac en poche, c\'est un plan B si le foot ne suit pas.',
  'Un essai réussi dans un grand club peut changer une carrière en une après-midi.',
  'Les sélectionneurs regardent ta forme sur plusieurs semaines, pas un seul match.',
  'Sauvegarde ta carrière en ligne : un code de 12 caractères suffit pour la retrouver sur un autre téléphone.',
  'Le classement mondial compare les carrières de tous les joueurs : vise le score de légende.',
  'En 3D, touche l\'écran pendant un temps fort pour revoir l\'action au ralenti.',
  'Un tacle mal placé dans la surface, et c\'est le penalty. Parfois, temporiser est plus sage.',
  'Les blessures arrivent plus vite quand la fatigue s\'accumule : écoute le staff médical.',
  'Un derby rapporte plus de réputation… et plus de pression.',
  'Le Ballon d\'Or se joue sur toute l\'année : buts, trophées et grands matchs.',
];
const LD_COLS = ['#d8473b', '#f2f2f2', '#2f6fd6', '#f2c230', '#2fa35c', '#e67a2e', '#8a5cd6'];

function ldOn() { return UI.screen === 'loading' || UI.screen === 'splash'; }
function ldStart() {
  const cv = document.getElementById('ldCv'); if (!cv || !cv.getContext) return;
  LD.cv = cv; LD.g = cv.getContext('2d'); LD.w = 0; LD.out = false;
  try { if (typeof inPreload === 'function' && typeof introOk === 'function' && introOk(false)) inPreload(); } catch (e) { } // photos de l'écran d'ouverture, en avance
  LD.rm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // le titre tient toujours sur la largeur de l'écran
  const lg = document.querySelector('.ldx-logo'); if (lg) { lg.style.fontSize = ''; const cw = lg.parentElement.clientWidth - 40; lg.style.display = 'inline-block'; const sw = lg.offsetWidth; lg.style.display = ''; if (sw > cw && sw > 0) lg.style.fontSize = (parseFloat(getComputedStyle(lg).fontSize) * cw / sw) + 'px'; }
  // écran déjà affiché (nouveau rendu, ou relais de l'écran de démarrage) : l'animation continue sans repartir de zéro
  const now = performance.now(), cont = !!(LD.raf || LD.boot);
  if (LD.raf) cancelAnimationFrame(LD.raf); LD.raf = 0;
  if (!cont) { LD.t0 = now; LD.shown = 0; LD.sparks = []; LD.flash = []; LD.roll = 0; }
  LD.boot = false; LD.last = now;
  const sp = lg && lg.querySelector('span'); if (sp && cont) sp.style.animationDelay = -(((now - LD.t0) / 1000) % 2.8) + 's';
  ldFrame(now); // dessin immédiat : pas d'image vide entre deux rendus
}
function ldStop() { if (LD.raf) cancelAnimationFrame(LD.raf); LD.raf = 0; LD.cv = null; }
// fin de l'écran de démarrage (dessiné par index.html avant même que le jeu soit chargé) : le jeu reprend la même scène,
// au même instant, et termine la barre avant d'ouvrir le menu
function ldBootFinish(done) {
  const B = typeof window !== 'undefined' ? window.__ldBoot : null; if (!B || !B.t0 || !B.cv || !B.cv.isConnected || typeof render !== 'function') return false;
  window.__ldBoot = null; B.stop = true;
  Object.assign(LD, { t0: B.t0, shown: B.shown, tip: B.tip, tipFor: B.tipFor, roll: B.roll, bootDust: B.dust, boot: true });
  const p0 = Math.max(1, Math.round(B.shown)), L0 = B.load || {};
  UI.load = { title: L0.title || '', t: L0.t || '', p: p0, kick: 'Simulateur de carrière' }; UI.screen = 'loading'; render();
  const nL = typeof LEAGUES !== 'undefined' ? LEAGUES.length : 0, nC = nL ? Object.values(LEAGUES).reduce((a, l) => a + (l.clubs ? l.clubs.length : 0), 0) : 0;
  const steps = [nL ? `${nL} championnats…` : 'Championnats…', nC ? `${nC} clubs et leurs entraîneurs…` : 'Clubs et entraîneurs…', 'Joueurs et effectifs 2026…', 'Coup d\'envoi !'];
  let i = 0;
  const tick = () => {
    if (UI.screen !== 'loading') return;
    UI.load.t = steps[i]; UI.load.p = Math.round(p0 + (100 - p0) * (i + 1) / steps.length);
    const lt = document.getElementById('lt'); if (lt) { lt.textContent = UI.load.t; if (lt.classList) { lt.classList.remove('in'); void lt.offsetWidth; lt.classList.add('in'); } }
    i++;
    if (i < steps.length) setTimeout(tick, 210 + Math.random() * 120);
    else setTimeout(() => { const d = document.getElementById('ldx'); if (d && d.classList) d.classList.add('out'); setTimeout(done, d && d.classList ? 280 : 0); }, 480);
  };
  setTimeout(tick, 140);
  return true;
}
function ldRnd(seed) { let s = seed >>> 0; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// géométrie commune (en pixels CSS)
function ldGeo() {
  const w = LD.w, h = LD.h, hz = h * .58; // ligne d'horizon (haut de la pelouse)
  return { w, h, hz, lamps: [[w * .1, h * .125], [w * .9, h * .125], [w * .3, h * .16], [w * .7, h * .16]], barY: h * .845, barX0: w * .12, barX1: w * .88 };
}
function ldResize() {
  const cv = LD.cv, w = cv.clientWidth || innerWidth, h = cv.clientHeight || innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
  if (w === LD.w && h === LD.h && dpr === LD.dpr) return;
  LD.w = w; LD.h = h; LD.dpr = dpr; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const G = ldGeo(), R = ldRnd(7);
  // décor fixe : ciel, tribunes, public, pelouse en perspective
  const bg = document.createElement('canvas'); bg.width = cv.width; bg.height = cv.height; const g = bg.getContext('2d'); g.scale(dpr, dpr);
  let gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#010305'); gr.addColorStop(.45, '#05100b'); gr.addColorStop(.58, '#081a11'); gr.addColorStop(1, '#03120a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // tribunes : deux anneaux sombres
  const tier = (top, bot, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(-10, bot); g.quadraticCurveTo(w / 2, top - (bot - top) * .35, w + 10, bot); g.lineTo(w + 10, G.hz + 2); g.lineTo(-10, G.hz + 2); g.closePath(); g.fill(); };
  tier(h * .3, h * .4, '#070d0b'); tier(h * .43, h * .5, '#0a1310');
  g.fillStyle = 'rgba(255,190,80,.10)'; g.fillRect(0, h * .425, w, 1.2); g.fillRect(0, G.hz - 3, w, 1); // rambardes éclairées
  // public : petits points colorés (le scintillement est animé)
  LD.crowd = [];
  for (let i = 0; i < 1300; i++) {
    const x = R() * w, band = R() < .5 ? 0 : 1, yTop = band ? h * .44 : h * .32, yBot = band ? G.hz - 6 : h * .415;
    const curve = (1 - Math.pow((x - w / 2) / (w / 2), 2)) * (band ? h * .02 : h * .045), y = yTop + R() * (yBot - yTop) - curve * (1 - (R() * .3));
    g.fillStyle = LD_COLS[Math.floor(R() * LD_COLS.length)]; g.globalAlpha = .2 + R() * .32; g.fillRect(x, y, 1.6, 1.6);
    if (R() < .25) LD.crowd.push([x, y]);
  }
  g.globalAlpha = 1;
  // pelouse : bandes en perspective
  const vp = [w / 2, G.hz - h * .9]; // point de fuite (loin au-dessus)
  const rows = 14;
  for (let i = 0; i < rows; i++) {
    const a = i / rows, b = (i + 1) / rows, ya = G.hz + (h - G.hz) * a * a, yb = G.hz + (h - G.hz) * b * b;
    g.fillStyle = i % 2 ? '#0d3a20' : '#0f4425'; g.fillRect(0, ya, w, yb - ya + 1);
  }
  gr = g.createLinearGradient(0, G.hz, 0, h); gr.addColorStop(0, 'rgba(2,8,5,.75)'); gr.addColorStop(.35, 'rgba(2,8,5,.15)'); gr.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = gr; g.fillRect(0, G.hz, w, h - G.hz);
  // lignes blanches
  g.strokeStyle = 'rgba(235,245,238,.38)'; g.lineWidth = 1.4;
  const px = (fx, y) => vp[0] + (fx - .5) * (w * 2.6) * (y - vp[1]) / (h - vp[1]);
  g.beginPath(); for (const fx of [.08, .92]) { g.moveTo(px(fx, G.hz), G.hz); g.lineTo(px(fx, h), h); } g.stroke();
  const yMid = G.hz + (h - G.hz) * .2; g.beginPath(); g.moveTo(px(.08, yMid), yMid); g.lineTo(px(.92, yMid), yMid); g.stroke();
  g.beginPath(); g.ellipse(w / 2, yMid, w * .2, (h - G.hz) * .09, 0, 0, Math.PI * 2); g.stroke();
  // toit du stade : bord incurvé, liseré éclairé
  g.fillStyle = '#020405'; g.beginPath(); g.moveTo(-10, -10); g.lineTo(w + 10, -10); g.lineTo(w + 10, h * .13); g.quadraticCurveTo(w / 2, h * .2, -10, h * .13); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,214,150,.16)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-10, h * .13); g.quadraticCurveTo(w / 2, h * .2, w + 10, h * .13); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.04)'; for (let i = 1; i < 9; i++) { const x = w * i / 9; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h * .135 + (1 - Math.pow((x - w / 2) / (w / 2), 2)) * h * .035); g.stroke(); }
  // vignette
  gr = g.createRadialGradient(w / 2, h * .45, Math.min(w, h) * .25, w / 2, h * .5, Math.max(w, h) * .8); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  LD.bg = bg;
  // poussière d'or
  LD.dust = []; const nd = LD.rm ? 20 : 70; for (let i = 0; i < nd; i++) LD.dust.push({ x: R() * w, y: R() * h, s: .6 + R() * 1.8, v: 6 + R() * 18, ph: R() * 6.28, a: .25 + R() * .6 });
  if (LD.bootDust) { if (LD.bootDust.length === LD.dust.length) LD.dust = LD.bootDust; LD.bootDust = null; } // relais de l'écran de démarrage : la poussière reste où elle était
  // halo pré-rendu (réutilisé pour lampes, flashs, étincelles)
  if (!LD.glow) { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), r = x.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,236,190,.55)'); r.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = r; x.fillRect(0, 0, 64, 64); LD.glow = c; }
}
// ballon en vraie 3D (pentagones d'un icosaèdre), éclairé
const LD_ICO = (() => { const p = (1 + Math.sqrt(5)) / 2, v = [[0, 1, p], [0, -1, p], [0, 1, -p], [0, -1, -p], [1, p, 0], [-1, p, 0], [1, -p, 0], [-1, -p, 0], [p, 0, 1], [-p, 0, 1], [p, 0, -1], [-p, 0, -1]]; return v.map(a => { const l = Math.hypot(...a); return a.map(c => c / l); }); })();
const LD_PENT = LD_ICO.map(c => { const up = Math.abs(c[1]) < .9 ? [0, 1, 0] : [1, 0, 0], u = ldN(ldX(up, c)), v = ldX(c, u), a = .37, pts = []; for (let k = 0; k < 5; k++) { const th = k / 5 * Math.PI * 2; pts.push(ldN([0, 1, 2].map(i => c[i] * Math.cos(a) + (u[i] * Math.cos(th) + v[i] * Math.sin(th)) * Math.sin(a)))); } return { c, pts }; });
function ldX(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function ldN(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
function ldRot(p, k, th) { const c = Math.cos(th), s = Math.sin(th), d = k[0] * p[0] + k[1] * p[1] + k[2] * p[2], x = ldX(k, p); return [0, 1, 2].map(i => p[i] * c + x[i] * s + k[i] * d * (1 - c)); }
function ldBall(g, x, y, r, th) {
  const ax = ldN([.25, .35, 1]);
  g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip();
  let gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r * 1.05); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.6, '#e9ece8'); gr.addColorStop(1, '#8d948f'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  g.fillStyle = '#16181d';
  for (const P of LD_PENT) {
    const c = ldRot(P.c, ax, th); if (c[2] < -.25) continue;
    g.beginPath(); P.pts.forEach((p, i) => { const q = ldRot(p, ax, th); i ? g.lineTo(x + q[0] * r, y - q[1] * r) : g.moveTo(x + q[0] * r, y - q[1] * r); }); g.closePath(); g.fill();
  }
  gr = g.createRadialGradient(x - r * .3, y - r * .35, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(.35, 'rgba(255,255,255,0)'); gr.addColorStop(.85, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
}
function ldFrame(now) {
  if (LD.stop || !LD.cv || !LD.cv.isConnected || !ldOn()) { LD.raf = 0; LD.cv = null; return; }
  LD.raf = requestAnimationFrame(ldFrame);
  const dt = Math.min(.05, (now - LD.last) / 1000); LD.last = now; const t = (now - LD.t0) / 1000;
  ldResize(); const g = LD.g, G = ldGeo(), { w, h } = G, dpr = LD.dpr, glow = LD.glow;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  g.drawImage(LD.bg, 0, 0, w, h);
  // progression affichée : rattrape la vraie, en douceur
  const target = (UI.load && UI.load.p) || 0; LD.shown += (target - LD.shown) * Math.min(1, dt * 6); if (target >= 100 && LD.shown > 99.4) LD.shown = 100;
  const lp = document.getElementById('lp'); if (lp) lp.textContent = Math.round(LD.shown) + ' %';
  g.globalCompositeOperation = 'lighter';
  // projecteurs : ils s'allument l'un après l'autre (avec un coup d'éclat), puis vibrent légèrement
  G.lamps.forEach(([lx, ly], i) => {
    const on = clamp((t - .12 - i * .16) / .12, 0, 1); if (!on) return;
    const burst = 1 + 1.6 * Math.max(0, 1 - (t - .12 - i * .16) / .5), fl = .92 + .08 * Math.sin(t * 13 + i * 2) * Math.sin(t * 7.3 + i), k = on * burst * fl;
    // cône de lumière vers la pelouse
    const tx = w * (.5 + (lx < w / 2 ? -.12 : .12) + .05 * Math.sin(t * .4 + i)), ty = G.hz + (h - G.hz) * .45, spread = w * .34;
    const gr = g.createLinearGradient(lx, ly, tx, ty); gr.addColorStop(0, `rgba(255,236,200,${.16 * k})`); gr.addColorStop(.6, `rgba(255,220,160,${.05 * k})`); gr.addColorStop(1, 'rgba(255,210,150,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(lx - 8, ly); g.lineTo(tx - spread / 2, ty); g.lineTo(tx + spread / 2, ty); g.lineTo(lx + 8, ly); g.closePath(); g.fill();
    // rampe de lampes
    for (let a = 0; a < 4; a++) for (let b = 0; b < 2; b++) { const x = lx + (a - 1.5) * 7, y = ly + (b - .5) * 7, s = 26 * k; g.globalAlpha = Math.min(1, .55 * k); g.drawImage(glow, x - s / 2, y - s / 2, s, s); }
    g.globalAlpha = Math.min(1, .35 * k); const S2 = 150 * k; g.drawImage(glow, lx - S2 / 2, ly - S2 / 2, S2, S2);
    // reflet horizontal (objectif de caméra)
    g.globalAlpha = Math.min(.5, .22 * k); g.drawImage(glow, lx - 120 * k, ly - 3, 240 * k, 6); g.globalAlpha = 1;
  });
  // rayons qui tournent derrière le titre
  if (!LD.rm) { const cx = w / 2, cy = h * .25, R = Math.max(w, h) * .7; g.save(); g.translate(cx, cy); g.rotate(t * .08); for (let i = 0; i < 14; i++) { g.rotate(Math.PI * 2 / 14); const gr = g.createLinearGradient(0, 0, R, 0); gr.addColorStop(0, `rgba(255,190,90,${.07 * clamp(t / .8, 0, 1)})`); gr.addColorStop(1, 'rgba(255,190,90,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(R, -R * .06); g.lineTo(R, R * .06); g.closePath(); g.fill(); } g.restore(); }
  // flashs d'appareils photo dans le public
  if (LD.crowd.length && Math.random() < dt * (LD.rm ? 2 : 9)) { const c = LD.crowd[Math.floor(Math.random() * LD.crowd.length)]; LD.flash.push([c[0], c[1], 0]); }
  LD.flash = LD.flash.filter(f => (f[2] += dt) < .3); for (const f of LD.flash) { const k = 1 - f[2] / .3, s = 14 * k + 4; g.globalAlpha = k; g.drawImage(glow, f[0] - s / 2, f[1] - s / 2, s, s); } g.globalAlpha = 1;
  // poussière d'or qui monte dans la lumière
  for (const d of LD.dust) { d.y -= d.v * dt; d.x += Math.sin(t * .8 + d.ph) * 6 * dt; if (d.y < -10) { d.y = h + 10; d.x = Math.random() * w; } const tw = .5 + .5 * Math.sin(t * 3 + d.ph * 3), s = d.s * 6; g.globalAlpha = d.a * tw; g.drawImage(glow, d.x - s / 2, d.y - s / 2, s, s); } g.globalAlpha = 1;
  // barre de progression lumineuse
  const x0 = G.barX0, x1 = G.barX1, y = G.barY, hx = x0 + (x1 - x0) * LD.shown / 100;
  g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x0, y - 1.5, x1 - x0, 3);
  g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(x0, 0, hx, 0); gr.addColorStop(0, 'rgba(201,134,26,.25)'); gr.addColorStop(.7, 'rgba(255,190,70,.9)'); gr.addColorStop(1, 'rgba(255,240,200,1)');
  g.fillStyle = gr; g.fillRect(x0, y - 1.5, Math.max(0, hx - x0), 3);
  g.globalAlpha = .55; g.drawImage(glow, x0, y - 9, Math.max(0, hx - x0), 18); g.globalAlpha = 1;
  // étincelles à la tête de la barre
  if (LD.shown > 1 && LD.shown < 100 && !LD.rm) for (let i = 0; i < 2; i++) LD.sparks.push({ x: hx, y, vx: -20 - Math.random() * 60, vy: -30 + Math.random() * 60, l: 0, m: .35 + Math.random() * .4 });
  LD.sparks = LD.sparks.filter(s => (s.l += dt) < s.m); for (const s of LD.sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 80 * dt; const k = 1 - s.l / s.m, z = 7 * k + 2; g.globalAlpha = k; g.drawImage(glow, s.x - z / 2, s.y - z / 2, z, z); } g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  // le ballon roule sur la barre (avec son ombre)
  const r = Math.max(13, Math.min(22, w * .045)), bx = clamp(hx, x0 + r * .2, x1), by = y - r - 3;
  LD.roll += dt * (6 + (target - LD.shown) * .5);
  g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(bx, y + 2, r * .9, r * .22, 0, 0, Math.PI * 2); g.fill();
  ldBall(g, bx, by, r, LD.roll);
}
// l'écran lui-même (le texte reste en HTML pour rester net)
function vLoadScreen(L, kicker) {
  const ttl = UI.load ? UI.load.title : ''; if (!LD.tip || LD.tipFor !== ttl) { LD.tip = LD_TIPS[Math.floor(Math.random() * LD_TIPS.length)]; LD.tipFor = ttl; }
  return `<div class="ldx${LD.raf || LD.boot ? ' cont' : ''}" id="ldx"><canvas id="ldCv" aria-hidden="true"></canvas>
    <div class="ldx-top"><div class="ldx-kick">${esc(kicker || 'Chargement')}</div><h1 class="ldx-logo">Crampons<span>d'Or</span></h1>${L.title && L.title !== 'Chargement' ? `<div class="ldx-title">${esc(L.title)}</div>` : ''}</div>
    <div class="ldx-bot"><div class="ldx-row"><span id="lt" class="ldx-step">${esc(L.t)}</span><span id="lp" class="ldx-pct">${Math.round(LD.shown || 0)} %</span></div>
    <p class="ldx-tip"><b>Astuce</b> ${esc(LD.tip)}</p></div><div class="ldx-flash"></div></div>`;
}
