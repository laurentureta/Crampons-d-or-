// ===================== ÉCRAN D'OUVERTURE : le retourné qui casse l'écran =====================
// De vraies photos libres de droits : un joueur photographié en plein retourné, de nuit, sous les projecteurs
// (Unsplash, Chaim Weingarten), détouré et posé devant le Parc des Princes de nuit vu du bord du terrain
// (Unsplash, Chris Kursikowski), flouté comme par un objectif. Travelling lent, flashs dans les tribunes ; la frappe :
// le vrai ballon de la photo fonce vers l'objectif et brise la vitre du téléphone (éclats qui décalent l'image,
// fissures, flash, écran qui bave), puis le titre apparaît derrière la vitre. Tout en canvas 2D, léger pour l'iPhone.
const INTRO = { on: false, seek: null, seed: 0 };
const IN_T = { rise: .9, strike: 1.75, hit: 2.3 }; // secondes
function inRng(seed) { let s = seed >>> 0; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const inSm = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
function inCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }

// ---------- Les photos (assets/intro, préparées par tools/intro_photos.py) ----------
const IN_PH = { im: {}, ok: false, bad: false, wait: null };
function inPhotos() { return typeof INTRO_PH !== 'undefined' && INTRO_PH && INTRO_PH.stade && INTRO_PH.joueur && INTRO_PH.ballon ? INTRO_PH : null; }
// chargées en avance (pendant l'écran de chargement) pour que l'ouverture démarre sans attendre
function inPreload() {
  const P = inPhotos(); if (!P || IN_PH.wait || typeof Image === 'undefined') return IN_PH.wait;
  const q = typeof MEDIA_H !== 'undefined' && MEDIA_H.intro ? '?h=' + MEDIA_H.intro : '';
  IN_PH.wait = Promise.all(['stade', 'joueur', 'ballon'].map(k => new Promise((ok, ko) => {
    const im = new Image(); im.decoding = 'async'; im.onload = () => { (im.decode ? im.decode().catch(() => { }) : Promise.resolve()).then(() => { IN_PH.im[k] = im; ok(); }); }; im.onerror = ko; im.src = 'assets/intro/' + P[k].f + q;
  }))).then(() => { IN_PH.ok = true; }, () => { IN_PH.bad = true; });
  return IN_PH.wait;
}

// ---------- Mise en place à l'écran (pixels CSS) ----------
function inLayout() {
  const I = INTRO, P = inPhotos(), w = I.w, h = I.h, S = P.stade, J = P.joueur;
  // stade : couvre tout l'écran, la ligne des tribunes vers 60 % de la hauteur
  const ks = Math.max(w / S.w, h / S.h) * 1.08, sw = S.w * ks, sh = S.h * ks;
  const sx = clampN(w / 2 - S.fx * sw, w - sw, 0), sy = clampN(h * .6 - S.hz * sh, h - sh, 0);
  // joueur : presque toute la largeur, le corps au-dessus de la ligne des tribunes (il est en l'air)
  const jw = Math.min(w * .94, h * .58 * J.w / J.h), jh = jw * J.h / J.w, kj = jw / J.w;
  const jx = w / 2 - J.cx * jw, jy = h * .39 - J.cy * jh;
  I.L = { ks, sx, sy, sw, sh, kj, jx, jy, jw, jh, piv: [jx + J.px * jw, jy + J.py * jh], ball: [jx + J.ball[0] * jw, jy + J.ball[1] * jh, J.ball[2] * jw], foot: [jx + J.foot[0] * jw, jy + J.foot[1] * jh] };
  I.hitPx = [w * .5, h * .33];
}
function clampN(v, a, b) { return v < a ? a : v > b ? b : v; }
// transformation du travelling au temps r : zoom lent, puis coup de zoom juste avant la frappe ; le joueur avance plus vite que le décor
function inCam(r) {
  const p = inSm(r / IN_T.strike), punch = inSm((r - (IN_T.strike - .3)) / .3) * (1 - inSm((r - IN_T.strike) / .5) * .4);
  const sh = r > IN_T.strike && r < IN_T.strike + .25 ? (1 - (r - IN_T.strike) / .25) : 0, R = Math.sin(r * 91) * 3 * sh, R2 = Math.cos(r * 77) * 3 * sh;
  return { zb: 1 + .035 * p + .03 * punch, zj: 1 + .08 * p + .07 * punch, rot: -.035 * p - .02 * punch, dx: R, dy: R2 };
}
// point de l'image du joueur → écran, avec le travelling (zoom autour du centre, rotation autour des hanches)
function inJXY(C, x, y) {
  const I = INTRO, L = I.L, [px, py] = L.piv, c = Math.cos(C.rot), s = Math.sin(C.rot);
  let X = x - px, Y = y - py; [X, Y] = [X * c - Y * s, X * s + Y * c];
  const ox = I.w / 2, oy = I.h * .42; return [ox + (px + X - ox) * C.zj + C.dx, oy + (py + Y - oy) * C.zj + C.dy];
}

// ---------- Une image du film ----------
function inScene(g, r, opt) {
  const I = INTRO, L = I.L, C = inCam(r), w = I.w, h = I.h, ims = IN_PH.im;
  g.setTransform(I.dpr, 0, 0, I.dpr, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  // le stade (flou d'objectif déjà dans la photo), zoom lent
  { const ox = w / 2, oy = h * .6, z = C.zb; g.drawImage(ims.stade, ox + (L.sx - ox) * z + C.dx * .4, oy + (L.sy - oy) * z + C.dy * .4, L.sw * z, L.sh * z); }
  // flashs des photographes dans les tribunes
  const R = inRng(I.seed + Math.floor(r * 24)), S = inPhotos().stade;
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 2; i++) if (R() < .38) {
    const z = C.zb, fx = w / 2 + (L.sx + (.04 + R() * .92) * L.sw - w / 2) * z, fy = h * .6 + (L.sy + (S.st[0] + R() * (S.st[1] - S.st[0])) * L.sh - h * .6) * z, fr = 2 + R() * 5, gr = g.createRadialGradient(fx, fy, 0, fx, fy, fr * 4);
    gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.18, 'rgba(235,242,255,.45)'); gr.addColorStop(1, 'rgba(220,230,255,0)'); g.fillStyle = gr; g.fillRect(fx - fr * 4, fy - fr * 4, fr * 8, fr * 8);
  }
  // halo des projecteurs (respire doucement)
  { const gr = g.createRadialGradient(w * .5, -h * .05, 0, w * .5, -h * .05, h * .7); gr.addColorStop(0, `rgba(255,246,226,${(.14 + .03 * Math.sin(r * 2.1)).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,246,226,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  g.globalCompositeOperation = 'source-over';
  // le joueur, en plein retourné
  { const [px, py] = L.piv, ox = w / 2, oy = h * .42; g.save(); g.translate(ox + C.dx, oy + C.dy); g.scale(C.zj, C.zj); g.translate(px - ox, py - oy); g.rotate(C.rot); g.drawImage(ims.joueur, L.jx - px, L.jy - py, L.jw, L.jh); g.restore(); }
  // le ballon : collé au pied, puis il file vers l'objectif (traînée de flou de mouvement)
  if (!opt || !opt.noBall) inBallDraw(g, r, C);
  // éclair au contact du pied
  const k = (r - IN_T.strike) / .3;
  if (k > 0 && k < 1) {
    const [fx, fy] = inJXY(C, L.ball[0], L.ball[1]), rr = L.ball[2] * (1.5 + k * 5);
    g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(fx, fy, 0, fx, fy, rr * 1.4); gr.addColorStop(0, `rgba(255,255,255,${(.9 * (1 - k)).toFixed(3)})`); gr.addColorStop(.35, `rgba(255,236,190,${(.35 * (1 - k)).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,236,190,0)'); g.fillStyle = gr; g.fillRect(fx - rr * 1.4, fy - rr * 1.4, rr * 2.8, rr * 2.8);
    g.globalCompositeOperation = 'source-over'; g.strokeStyle = `rgba(255,255,255,${(.6 * (1 - k)).toFixed(3)})`; g.lineWidth = 2 * (1 - k) + .5; g.beginPath(); g.arc(fx, fy, L.ball[2] * (1.2 + k * 7), 0, Math.PI * 2); g.stroke();
  }
  // vignette de cinéma
  { const gr = g.createRadialGradient(w / 2, h * .45, Math.min(w, h) * .25, w / 2, h * .45, Math.hypot(w, h) * .62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.62)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
}
// position et taille du ballon au temps r (pixels CSS)
function inBallAt(r, C) {
  const I = INTRO, L = I.L, [bx, by] = inJXY(C, L.ball[0], L.ball[1]), b0 = L.ball[2] * C.zj;
  if (r <= IN_T.strike) return [bx, by, b0, r * .6];
  const k = Math.min(1, (r - IN_T.strike) / (IN_T.hit - IN_T.strike)), e = Math.pow(k, 2.3), m = Math.pow(k, 1.25);
  return [bx + (I.hitPx[0] - bx) * m, by + (I.hitPx[1] - by) * m - Math.sin(k * Math.PI) * I.h * .03, b0 + (Math.min(I.w, I.h) * .36 - b0) * e, IN_T.strike * .6 + (r - IN_T.strike) * 14];
}
function inBallDraw(g, r, C) {
  const im = IN_PH.im.ballon; if (!im) return;
  const one = (x, y, rad, rot, a) => { g.globalAlpha = a; g.save(); g.translate(x, y); g.rotate(rot); g.drawImage(im, -rad, -rad, rad * 2, rad * 2); g.restore(); };
  if (r > IN_T.strike) for (let i = 4; i >= 1; i--) { const [x, y, rad, rot] = inBallAt(r - i * .018, C); one(x, y, rad, rot, .16 * (5 - i) / 4); }
  const [x, y, rad, rot] = inBallAt(r, C); one(x, y, rad, rot, 1); g.globalAlpha = 1;
}
// éclats de la vitre : chaque morceau renvoie l'image figée un peu décalée, et un peu plus clair ou plus sombre
function inShards(g, C, rev) {
  const I = INTRO, snap = I.snap; if (!snap) return;
  g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(snap, 0, 0);
  const R = inRng(I.seed + 11), d = I.dpr;
  for (const c of C.cells) {
    const sx = R(), sy = R(), sr = R(); if (c.d > rev) continue;
    let cx = 0, cy = 0; for (const p of c.poly) { cx += p[0]; cy += p[1]; } cx /= c.poly.length; cy /= c.poly.length;
    const ux = cx - C.x, uy = cy - C.y, ul = Math.hypot(ux, uy) || 1, push = (2 + sx * 7) * (1 - Math.min(1, ul / (C.D * .6)) * .6);
    g.save(); g.setTransform(d, 0, 0, d, 0, 0); g.beginPath(); for (const p of c.poly) g.lineTo(p[0], p[1]); g.closePath(); g.clip();
    g.translate(cx + ux / ul * push + (sy - .5) * 3, cy + uy / ul * push); g.rotate((sr - .5) * .03); g.translate(-cx, -cy);
    g.drawImage(snap, 0, 0, I.w, I.h); g.fillStyle = c.f; g.fillRect(-I.w, -I.h, I.w * 3, I.h * 3); g.restore();
  }
}

// ---------- Vitre brisée ----------
function inCrackGen(w, h, x, y, R) {
  const D = Math.hypot(Math.max(x, w - x), Math.max(y, h - y)), N = 13 + (R() * 5 | 0), base = R() * Math.PI * 2, rad = [], lines = [];
  for (let i = 0; i < N; i++) {
    const a0 = base + i / N * Math.PI * 2 + (R() - .5) * (Math.PI * 2 / N) * .55, L = R() < .7 ? D * 1.1 : D * (.25 + R() * .45);
    let a = a0, d = 5, px = x + Math.cos(a) * 5, py = y + Math.sin(a) * 5; const pts = [[px, py, d]];
    while (d < L) { const seg = 5 + R() * 12 * (1 + d / D * 1.5); a += (R() - .5) * .34; a += (a0 - a) * .12; px += Math.cos(a) * seg; py += Math.sin(a) * seg; d += seg; pts.push([px, py, d]); if (px < -30 || py < -30 || px > w + 30 || py > h + 30) break; }
    rad.push(pts); lines.push({ pts, w0: 2.4, w1: .7 });
    for (let k = 3; k < pts.length - 2; k++) if (R() < .075) {
      let [bx, by, bd] = pts[k]; let b = Math.atan2(by - y, bx - x) + (R() < .5 ? -1 : 1) * (.35 + R() * .7); const bp = [[bx, by, bd]], BL = bd + 25 + R() * (110 + bd * .3);
      while (bd < BL) { const seg = 4 + R() * 11; b += (R() - .5) * .45; bx += Math.cos(b) * seg; by += Math.sin(b) * seg; bd += seg; bp.push([bx, by, bd]); }
      lines.push({ pts: bp, w0: 1.2, w1: .5 });
    }
  }
  const at = (pts, r) => { for (const p of pts) if (Math.hypot(p[0] - x, p[1] - y) >= r) return p; return null; };
  const RR = [D * .045, D * .1, D * .18, D * .3, D * .46], keep = [.98, .85, .65, .45, .25], cells = [];
  const ringPts = RR.map(r0 => rad.map(p => at(p, r0 * (.88 + R() * .24))));
  RR.forEach((r0, ri) => {
    for (let i = 0; i < N; i++) {
      const A = ringPts[ri][i], B = ringPts[ri][(i + 1) % N]; if (!A || !B || R() > keep[ri]) continue;
      const pts = [], n = 3 + (R() * 3 | 0); for (let k = 0; k <= n; k++) { const s = k / n, mx = A[0] + (B[0] - A[0]) * s, my = A[1] + (B[1] - A[1]) * s, ox = mx - x, oy = my - y, ol = Math.hypot(ox, oy) || 1, bow = Math.sin(s * Math.PI) * r0 * .06 + (k && k < n ? (R() - .5) * 5 : 0); pts.push([mx + ox / ol * bow, my + oy / ol * bow, Math.max(A[2], B[2])]); }
      lines.push({ pts, w0: 1.1 - ri * .12, w1: .6, ring: 1 });
    }
  });
  // éclats : chaque morceau de verre renvoie un peu la lumière différemment
  for (let ri = 0; ri < RR.length; ri++) for (let i = 0; i < N; i++) {
    const a = ri ? ringPts[ri - 1][i] : [x, y, 0], b = ri ? ringPts[ri - 1][(i + 1) % N] : null, c = ringPts[ri][(i + 1) % N], d = ringPts[ri][i];
    if (!a || !c || !d || (ri && !b)) continue; const poly = ri ? [a, b, c, d] : [a, c, d], lv = R();
    cells.push({ poly, d: Math.max(c[2], d[2]), f: lv < .55 ? `rgba(255,255,255,${(.015 + R() * .07).toFixed(3)})` : lv < .85 ? `rgba(0,0,0,${(.04 + R() * .12).toFixed(3)})` : `rgba(170,210,255,${(.04 + R() * .08).toFixed(3)})` });
  }
  const crush = []; for (let i = 0; i < 70; i++) { const a = R() * Math.PI * 2, r1 = R() * D * .05, l = 3 + R() * 10, b = a + (R() - .5) * 2; crush.push([x + Math.cos(a) * r1, y + Math.sin(a) * r1, x + Math.cos(a) * r1 + Math.cos(b) * l, y + Math.sin(a) * r1 + Math.sin(b) * l]); }
  return { x, y, D, lines, cells, crush };
}
function inCrackDraw(g, C, rev, dpr) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, g.canvas.width, g.canvas.height);
  for (const c of C.cells) if (c.d <= rev) { g.fillStyle = c.f; g.beginPath(); for (const p of c.poly) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); }
  // poussière de verre au point d'impact
  const cr = C.D * .055, gr = g.createRadialGradient(C.x, C.y, 0, C.x, C.y, cr * 1.6); gr.addColorStop(0, 'rgba(255,255,255,.6)'); gr.addColorStop(.45, 'rgba(225,235,250,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(C.x, C.y, cr * 1.6, 0, Math.PI * 2); g.fill();
  g.lineCap = 'round'; g.lineJoin = 'round';
  const stroke = (pass) => {
    for (const L of C.lines) {
      const P = L.pts; if (P[0][2] > rev) continue;
      for (let i = 1; i < P.length; i++) {
        const a = P[i - 1], b = P[i]; if (a[2] > rev) break; let bx = b[0], by = b[1];
        if (b[2] > rev && !L.ring) { const s = (rev - a[2]) / (b[2] - a[2]); bx = a[0] + (b[0] - a[0]) * s; by = a[1] + (b[1] - a[1]) * s; }
        const q = Math.min(1, a[2] / (C.D * .7)), wd = L.w0 + (L.w1 - L.w0) * q;
        g.beginPath(); g.moveTo(a[0] + (pass ? 0 : .9), a[1] + (pass ? 0 : .9)); g.lineTo(bx + (pass ? 0 : .9), by + (pass ? 0 : .9));
        if (pass === 0) { g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = wd + 1.1; }
        else if (pass === 1) { g.strokeStyle = `rgba(236,244,255,${(.92 - q * .35).toFixed(2)})`; g.lineWidth = wd; }
        else { g.strokeStyle = 'rgba(160,205,255,.5)'; g.lineWidth = wd * 2.6; }
        g.stroke(); if (pass === 2 && i > 5) break;
      }
    }
  };
  stroke(0); stroke(1); g.globalCompositeOperation = 'lighter'; stroke(2); g.globalCompositeOperation = 'source-over';
  g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = .8; for (const c of C.crush) { g.beginPath(); g.moveTo(c[0], c[1]); g.lineTo(c[2], c[3]); g.stroke(); }
}
// écran LCD abîmé : tache d'encre et lignes de pixels
function inBlotDraw(g, C, k, t, dpr, R) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, g.canvas.width, g.canvas.height);
  const r = C.D * .07 * inSm(k);
  if (r > 1) {
    for (const [dx, dy, s] of C.blob) { const gr = g.createRadialGradient(C.x + dx * r, C.y + dy * r, 0, C.x + dx * r, C.y + dy * r, r * s); gr.addColorStop(0, 'rgba(0,0,0,.96)'); gr.addColorStop(.65, 'rgba(6,2,14,.85)'); gr.addColorStop(.85, 'rgba(90,30,140,.28)'); gr.addColorStop(1, 'rgba(20,160,120,0)'); g.fillStyle = gr; g.beginPath(); g.arc(C.x + dx * r, C.y + dy * r, r * s, 0, Math.PI * 2); g.fill(); }
  }
  for (const L of C.pix) { if (t < L.on || (t < L.on + .7 && R() < .35)) continue; g.fillStyle = L.c; g.fillRect(L.x, 0, L.w, g.canvas.height / dpr); }
}

// ---------- Sons (synthétisés ; joués seulement si le son est déjà débloqué) ----------
function inAu() { return typeof AU !== 'undefined' && AU.ctx && AU.ctx.state === 'running' && AU.unlocked ? AU.ctx : null; }
function inNoise(c, dur, type, f, q, g0, at, out) {
  const t = c.currentTime + (at || 0), s = c.createBufferSource(); s.buffer = AU.white; s.loop = true;
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || .7; const g = c.createGain();
  g.gain.setValueAtTime(g0, t); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  s.connect(fl); fl.connect(g); g.connect(out || AU.fx); s.start(t, Math.random() * 1.5); s.stop(t + dur + .05); return { s, fl, g, t };
}
function inTone(c, f0, f1, dur, g0, at, type, out) {
  const t = c.currentTime + (at || 0), o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur * .8);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(g0, t + .004); g.gain.exponentialRampToValueAtTime(.0005, t + dur); o.connect(g); g.connect(out || AU.fx); o.start(t); o.stop(t + dur + .05);
}
function inSnd(k) {
  const c = inAu(); if (!c || !AU.white) return;
  const I = INTRO;
  try {
    if (k === 'crowd') {
      if (typeof smpHas === 'function' && smpHas('cheer')) { I.bed = smpPlay('cheer_loop', .32, { loop: true, fade: .6 }); }
      else { const s = c.createBufferSource(); s.buffer = AU.brown || AU.white; s.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = .5; const g = c.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(.5, c.currentTime, .4); s.connect(f); f.connect(g); g.connect(AU.fx); s.start(); I.bed = { src: s, g }; }
    } else if (k === 'touch') { inTone(c, 140, 70, .12, .35); inNoise(c, .05, 'bandpass', 1800, 1, .12); }
    else if (k === 'rise') { if (typeof smpHas === 'function' && smpHas('surge')) smpPlay('surge', .45, { rate: 1 }); else { const n = inNoise(c, 1.2, 'bandpass', 500, .6, .25); n.fl.frequency.exponentialRampToValueAtTime(1400, n.t + 1); } }
    else if (k === 'kick') {
      if (typeof sfxG === 'function') sfxG('shot', 1.1);
      inTone(c, 170, 48, .22, .95); inNoise(c, .06, 'bandpass', 2600, 1.2, .5); inNoise(c, .5, 'lowpass', 300, .7, .25, .02);
      // souffle du ballon qui arrive (ralenti puis accélère)
      const n = inNoise(c, I.flight + .05, 'bandpass', 260, 1.4, .02); n.g.gain.cancelScheduledValues(n.t); n.g.gain.setValueAtTime(.02, n.t); n.g.gain.exponentialRampToValueAtTime(.55, n.t + I.flight); n.fl.frequency.setValueAtTime(260, n.t); n.fl.frequency.exponentialRampToValueAtTime(2800, n.t + I.flight);
    } else if (k === 'glass') {
      if (typeof sfxG === 'function') sfxG('glass', 1.2);
      if (I.bed) { try { I.bed.g.gain.cancelScheduledValues(c.currentTime); I.bed.g.gain.setTargetAtTime(.0001, c.currentTime, .02); } catch (e) { } }
      inTone(c, 95, 38, .3, 1); inNoise(c, .09, 'highpass', 1800, .7, 1); inNoise(c, .22, 'bandpass', 900, .8, .55); inNoise(c, .7, 'highpass', 5200, .7, .22, .03);
      for (let i = 0; i < 30; i++) { const at = .015 + Math.pow(Math.random(), 1.7) * .95, f = 2600 + Math.random() * 6200, a = .09 * (1 - at); inTone(c, f, f * .985, .05 + Math.random() * .08, a, at, 'sine'); if (Math.random() < .4) inTone(c, f * 2.71, f * 2.7, .04, a * .5, at, 'sine'); }
      inTone(c, 60, 60, .28, .12, .02, 'square'); // écran qui grésille
    } else if (k === 'title') {
      inTone(c, 58, 44, 1.6, .7); inNoise(c, 1, 'lowpass', 220, .7, .4);
      for (const f of [1046, 1568, 2093]) inTone(c, f, f, 1.8, .04, .05);
    }
  } catch (e) { }
}
function inSndStop() { const I = INTRO; if (I.bed) { try { const c = AU.ctx; I.bed.g.gain.setTargetAtTime(.0001, c.currentTime, .15); const s = I.bed.src; setTimeout(() => { try { s.stop(); } catch (e) { } }, 900); } catch (e) { } I.bed = null; } }

// ---------- Déroulé ----------
function introOk(replay) {
  if (typeof document === 'undefined' || !document.body || typeof document.body.appendChild !== 'function' || typeof requestAnimationFrame !== 'function') return false;
  if (replay) return true;
  if (typeof OPTS !== 'undefined' && OPTS.intro === false) return false;
  if (typeof navigator !== 'undefined' && navigator.webdriver && !window.__INTRO) return false;
  try { if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return false; } catch (e) { }
  return true;
}
function introPlay(replay) {
  if (INTRO.on || !introOk(replay) || !inPhotos() || IN_PH.bad) return false;
  const el = document.createElement('div'); el.id = 'intro'; el.setAttribute('data-a', 'introSkip'); el.setAttribute('aria-label', "Crampons d'Or");
  el.innerHTML = `<div class="iwrap"><canvas class="i3"></canvas><div class="ishade"></div><canvas class="iblot"></canvas>
    <div class="ititle"><div class="lbl">Carrière de footballeur · 2026-27</div><h1 class="logo"><b class="ln">Crampons</b><span class="ln">d'Or</span></h1><div class="iload"><i></i></div><div class="ilt">&nbsp;</div></div>
    <canvas class="icrack"></canvas><div class="iflash"></div></div><div class="ihint">Touche l'écran pour passer</div>`;
  document.body.appendChild(el);
  const I = INTRO;
  Object.assign(I, { on: true, el, cv: el.querySelector('.i3'), cc: el.querySelector('.icrack'), cb: el.querySelector('.iblot'), r0: 0, last: 0, done: false, fired: {}, crack: null, cracked: false, snap: null, replay: !!replay, seed: I.seedFix || (Date.now() & 0xffff) || 1, t0: performance.now() });
  I.g = I.cv.getContext('2d'); I.flight = IN_T.hit - IN_T.strike; I.rHit = IN_T.hit; I.R = inRng(I.seed);
  introSize();
  addEventListener('resize', introSize);
  if (replay && typeof smpLoad === 'function') try { smpLoad(); } catch (e) { }
  inPreload();
  requestAnimationFrame(introFrame);
  return true;
}
function introSize() {
  const I = INTRO; if (!I.on) return;
  const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio || 1, I.lowDpr ? 1.25 : 2); I.w = w; I.h = h; I.dpr = dpr;
  I.cv.width = Math.round(w * dpr); I.cv.height = Math.round(h * dpr);
  const cd = Math.min(devicePixelRatio || 1, 3); I.cdpr = cd;
  for (const c of [I.cc, I.cb]) { c.width = w * cd; c.height = h * cd; }
  if (inPhotos()) inLayout();
  if (I.crack) { I.crack = null; I.cracked = false; I.snap = null; } // nouvelle taille : la vitre se refait au prochain dessin
}
function introFrame(now) {
  const I = INTRO; if (!I.on) return;
  // on attend les photos (déjà chargées pendant l'écran de chargement, d'habitude) ; trop long ou en échec : pas d'ouverture
  if (!IN_PH.ok) { if (IN_PH.bad || now - I.t0 > 3500) { introEnd(); return; } if (I.seek == null) requestAnimationFrame(introFrame); return; }
  if (!I.r0) { I.r0 = now; I.last = now; }
  const r = I.seek != null ? I.seek : (now - I.r0) / 1000, dt = I.seek != null ? 1 / 60 : Math.min(.05, (now - I.last) / 1000); I.last = now;
  // iPhone lent : on baisse la définition
  if (I.seek == null) { I.fc = (I.fc || 0) + 1; if (I.fc > 8 && I.fc < 40) { I.slow = (I.slow || 0) + (dt > .045 ? 1 : 0); if (I.slow > 12 && !I.lowDpr) { I.lowDpr = true; introSize(); } } }
  if (r > .05 && !I.fired.in) { I.fired.in = 1; I.el.classList.add('lit'); inSnd('crowd'); }
  if (r >= IN_T.rise && !I.fired.rise) { I.fired.rise = 1; inSnd('rise'); }
  if (r >= IN_T.strike && !I.fired.kick) { I.fired.kick = 1; inSnd('kick'); }
  if (r < IN_T.hit) inScene(I.g, r);
  else introHit(r);
  if (I.on && I.seek == null) requestAnimationFrame(introFrame);
}
function introHit(r) {
  const I = INTRO, k = r - I.rHit;
  if (!I.crack) {
    // l'image figée au moment du choc (sans le ballon, qui a percuté la vitre) : c'est elle que les éclats renvoient
    inScene(I.g, I.rHit, { noBall: true });
    const [sc, sg] = inCanvas(I.cv.width, I.cv.height); sg.drawImage(I.cv, 0, 0); I.snap = sc;
    I.crack = inCrackGen(I.w, I.h, I.hitPx[0], I.hitPx[1], inRng(I.seed + 3));
    const R = inRng(I.seed + 5); I.crack.blob = []; for (let i = 0; i < 9; i++) I.crack.blob.push([(R() - .5) * 1.1, (R() - .5) * .9, .45 + R() * .5]);
    I.crack.pix = []; const cols = ['rgba(255,40,214,.5)', 'rgba(40,255,140,.42)', 'rgba(60,200,255,.42)', 'rgba(255,255,255,.35)'];
    for (let i = 0; i < 3; i++) I.crack.pix.push({ x: I.hitPx[0] + (R() - .5) * I.w * .5, w: 1, c: cols[i], on: .15 + R() * .5 });
    if (!I.fired.glass) { I.fired.glass = 1; inSnd('glass'); try { navigator.vibrate && navigator.vibrate([25, 30, 60]); } catch (e) { } I.el.classList.add('hit'); setTimeout(() => I.el && I.el.classList.add('dim'), 120); }
  }
  const rev = Math.min(1, k / .38), C = I.crack, R0 = C.D * 1.6 * (1 - Math.pow(1 - rev, 2.2)) + 4;
  if (!I.cracked) { inShards(I.g, C, R0); inCrackDraw(I.cc.getContext('2d'), C, R0, I.cdpr); if (rev >= 1) I.cracked = true; }
  inBlotDraw(I.cb.getContext('2d'), C, Math.min(1, k / 1.6), k, I.cdpr, I.R || Math.random);
  if (I.seekLoad) { const st = ['Préparation du terrain…', 'Championnats…', 'Clubs et entraîneurs…', 'Joueurs et effectifs 2026…', 'Sélections…', 'Prêt !'], n = Math.max(0, Math.min(st.length - 1, Math.floor((k - .67) / .29))); const bar = I.el.querySelector('.iload i'), lt = I.el.querySelector('.ilt'); if (k > .67) { if (bar) bar.style.width = [12, 34, 55, 74, 90, 100][n] + '%'; if (lt) lt.textContent = st[n]; if (n === st.length - 1) I.el.classList.add('ready'); } }
  if (k > .42 && !I.fired.title) { I.fired.title = 1; I.el.classList.add('title'); introFit(); inSnd('title'); introLoad(); }
}
function introFit() {
  const lg = INTRO.el && INTRO.el.querySelector('.ititle .logo'); if (!lg) return;
  lg.style.fontSize = ''; const box = lg.clientWidth - 6;
  for (let i = 0; i < 6; i++) { const w = Math.max(...[...lg.querySelectorAll('.ln')].map(e => e.offsetWidth)); if (!w || w <= box) break; lg.style.fontSize = (parseFloat(getComputedStyle(lg).fontSize) * box / w * .98) + 'px'; }
}
function introLoad() {
  const I = INTRO, bar = I.el.querySelector('.iload i'), lt = I.el.querySelector('.ilt');
  if (I.seek != null) { I.seekLoad = true; return; } // images fixes (bande-annonce, tests) : la barre suit le temps de l'animation
  // le chargement a déjà eu lieu sur l'écran du stade (loading.js) : plus de barre ici, le titre reste affiché un instant
  const steps = [['Prêt !', 100], ['Prêt !', 100], ['Prêt !', 100], ['Prêt !', 100]];
  let i = 0; const tick = () => { if (!I.on || I.done) return; const [t, p] = steps[i]; if (bar) bar.style.width = p + '%'; if (lt) lt.textContent = t; i++; if (i < steps.length) setTimeout(tick, 230 + Math.random() * 120); else { I.el.classList.add('ready'); const hint = I.el.querySelector('.ihint'); if (hint) hint.textContent = 'Touche pour jouer'; I.auto = setTimeout(() => introEnd(), 2400); } };
  setTimeout(tick, 250);
}
function introEnd() {
  const I = INTRO; if (!I.on || I.done) return; I.done = true; clearTimeout(I.auto);
  inSndStop();
  const el = I.el; el.classList.add('out');
  setTimeout(() => { I.on = false; removeEventListener('resize', introSize); I.snap = I.g = null; el.remove(); }, 520);
}
