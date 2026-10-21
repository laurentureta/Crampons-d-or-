// ===================== MOTION DESIGN =====================
// 1) Habillage télé des matchs (dessiné sur le calque du direct, en 3D comme en 2D) : entrée des équipes avant le
//    coup d'envoi, bandeau « BUT ! » (buteur, minute, score qui bascule), volet de transition des ralentis.
// 2) Grands moments en plein écran (file MQ, jouée par flow) : annonce de transfert « Here we go », maillot dévoilé,
//    récap de saison façon « stories », exportable en vidéo.
// 3) Interface vivante : compteurs qui défilent, barres qui se remplissent, cartes qui se retournent, transitions d'onglets.
const TV = { intro: null, goal: null, wipe: null };
const TV_FONT = "'Big Shoulders Display', 'Barlow Condensed', system-ui, sans-serif", TV_LBL = "'Barlow Condensed', 'Barlow', system-ui, sans-serif", TV_PUNCH = "'Protest Strike', 'Big Shoulders Display', system-ui, sans-serif";
const tvE = x => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3); // départ rapide, arrivée douce
const tvB = x => { x = clamp(x, 0, 1); const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }; // léger rebond
function tvOn() { return typeof OPTS === 'undefined' || OPTS.tv !== false; }
// les polices des titres ne servent que dans les canvas : on les charge avant le premier dessin
let TV_FL = false;
function tvFonts() { if (TV_FL || typeof document === 'undefined' || !document.fonts || !document.fonts.load) return; TV_FL = true; for (const f of ["400 40px 'Protest Strike'", "800 40px 'Big Shoulders Display'", "700 40px 'Barlow Condensed'", "600 40px 'Barlow Condensed'"]) document.fonts.load(f).catch(() => { }); }
// pastille d'équipe : rond aux couleurs du club, initiales
function tvBadge(cx, x, y, r, name, col, col2) {
  cx.save(); const g = cx.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, col || '#345'); g.addColorStop(1, col2 || '#123');
  cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill(); cx.lineWidth = Math.max(1.5, r * .09); cx.strokeStyle = 'rgba(255,255,255,.85)'; cx.stroke();
  cx.fillStyle = '#fff'; cx.font = `800 ${Math.round(r * .78)}px ${TV_FONT}`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(initials(name || '?'), x, y + r * .04); cx.restore();
}
function tvSkew(cx, x, y, w, h, sk) { cx.beginPath(); cx.moveTo(x + sk, y); cx.lineTo(x + w + sk, y); cx.lineTo(x + w - sk, y + h); cx.lineTo(x - sk, y + h); cx.closePath(); }
// ---------- entrée des équipes (≈ 6,4 s ; on touche pour passer) ----------
const TV_IN = 6.4;
function tvIntroStart(M) { tvFonts(); if (!tvOn() || !M || !M.E) return; if (M.tvIn) return; M.tvIn = 1; TV.intro = { at: performance.now(), M }; }
function tvIntroBusy() { return !!(TV.intro && (performance.now() - TV.intro.at) / 1000 < TV_IN); }
function tvIntroSkip() { if (TV.intro) TV.intro.at = performance.now() - (TV_IN - .35) * 1000; }
function tvDrawIntro(cx, w, h) {
  const I = TV.intro; if (!I) return; const t = (performance.now() - I.at) / 1000; if (t > TV_IN) { TV.intro = null; return; }
  const M = I.M, E = M.E, out = tvE((t - (TV_IN - .55)) / .55), fade = 1 - out;
  cx.save(); cx.globalAlpha = fade;
  // fond : le stade s'assombrit, deux lames aux couleurs des équipes
  cx.fillStyle = `rgba(4,7,12,${.62 * tvE(t / .4)})`; cx.fillRect(0, 0, w, h);
  const hk = M.side === 'h' ? 0 : 1, T = [E.T[hk], E.T[1 - hk]], P = tvE((t - .35) / .6), mid = w / 2;
  for (let s = 0; s < 2; s++) {
    const tm = T[s], dir = s ? 1 : -1, x0 = s ? mid + w * (1 - P) * .6 : mid - w * .5 - w * (1 - P) * .6;
    const g = cx.createLinearGradient(x0, 0, x0 + w * .5, 0); g.addColorStop(s ? 0 : 1, tm.col); g.addColorStop(s ? 1 : 0, 'rgba(0,0,0,.2)');
    cx.save(); cx.globalAlpha = fade * .88; cx.fillStyle = g; tvSkew(cx, x0, h * .17, w * .5, h * .66, dir * 10); cx.fill(); cx.restore();
  }
  // bandeau de la compétition
  { const a = tvE(t / .45), y = h * .06; cx.save(); cx.translate(-w * (1 - a), 0); cx.fillStyle = 'rgba(8,10,16,.88)'; tvSkew(cx, 10, y, w - 20, 26, 6); cx.fill(); cx.fillStyle = '#f5c542'; tvSkew(cx, 10, y, 8, 26, 6); cx.fill();
    cx.fillStyle = '#fff'; cx.font = `700 13px ${TV_LBL}`; cx.textAlign = 'left'; cx.textBaseline = 'middle'; const comp = (M.comp || 'Match') + (M.label ? ' · ' + M.label : ''); cx.fillText(comp.toUpperCase(), 26, y + 13, w - 120);
    cx.textAlign = 'right'; cx.fillStyle = 'rgba(255,255,255,.7)'; cx.font = `600 11px ${TV_LBL}`; const c = M.cond || {}; cx.fillText(((c.night ? 'NOCTURNE' : 'EN DIRECT') + (c.att ? ' · ' + fnum(c.att) + ' SPECT.' : '')), w - 22, y + 13); cx.restore(); }
  // pastilles, noms, système de jeu
  for (let s = 0; s < 2; s++) {
    const tm = T[s], a = tvB((t - .55 - s * .12) / .55), cxp = s ? w * .75 : w * .25, yb = h * .27;
    cx.save(); cx.translate(cxp, yb); cx.scale(a, a); tvBadge(cx, 0, 0, Math.min(34, w * .09), tm.n, tm.col, tm.col2); cx.restore();
    if (t > .8) { const k = tvE((t - .8 - s * .1) / .4); cx.save(); cx.globalAlpha = fade * k; cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.textBaseline = 'top'; cx.font = `800 ${w < 360 ? 17 : 19}px ${TV_FONT}`; cx.fillText(shortTeam(tm.n).toUpperCase(), cxp, yb + 42, w * .46); cx.font = `600 11px ${TV_LBL}`; cx.fillStyle = 'rgba(255,255,255,.75)'; cx.fillText((FORM_N[tm.form] || tm.form || '') + (s === (M.side === 'h' ? 0 : 1) ? '' : ''), cxp, yb + 64); cx.restore(); }
  }
  // les deux onze, en cascade ; toi en or
  const rows = 11, y0 = h * .27 + 84, lh = Math.min(17, (h * .83 - y0 - 6) / rows);
  if (t > 1.2) for (let s = 0; s < 2; s++) {
    const tm = T[s], pl = tm.pl.slice(0, 11), cxp = s ? w * .75 : w * .25;
    pl.forEach((p, i) => { const k = tvE((t - 1.25 - i * .07 - s * .04) / .35); if (k <= 0) return; cx.save(); cx.globalAlpha = fade * k; cx.translate((1 - k) * (s ? 24 : -24), 0);
      const y = y0 + i * lh, me = p.me; cx.textBaseline = 'middle'; cx.font = `${me ? 800 : 600} ${Math.round(lh * .72)}px ${TV_LBL}`;
      if (me) { cx.fillStyle = 'rgba(245,197,66,.22)'; cx.fillRect(cxp - w * .22, y - lh * .45, w * .44, lh * .9); }
      cx.fillStyle = me ? '#f5c542' : 'rgba(255,255,255,.62)'; cx.textAlign = 'right'; cx.fillText(String(p.num || ''), cxp - w * .13, y);
      cx.fillStyle = me ? '#f5c542' : '#fff'; cx.textAlign = 'left'; cx.fillText((me ? '★ ' : '') + LN(p.n).toUpperCase(), cxp - w * .11, y, w * .32); cx.restore(); });
  }
  // VS puis coup d'envoi
  if (t > 4.1) { const k = tvB((t - 4.1) / .45), fl = Math.max(0, 1 - (t - 4.1) / .3); cx.save(); cx.translate(mid, h * .27); cx.scale(k, k); cx.font = `400 ${Math.round(w * .11)}px ${TV_PUNCH}`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineWidth = 6; cx.strokeStyle = 'rgba(0,0,0,.6)'; cx.strokeText('VS', 0, 0); cx.fillStyle = '#f5c542'; cx.fillText('VS', 0, 0); cx.restore(); if (fl > 0) { cx.fillStyle = `rgba(255,255,255,${fl * .5})`; cx.fillRect(0, 0, w, h); } }
  if (t > 4.9) { const k = tvE((t - 4.9) / .4); cx.save(); cx.globalAlpha = fade * k; cx.fillStyle = 'rgba(8,10,16,.9)'; tvSkew(cx, mid - 110, h * .86 - 18, 220, 36, 8); cx.fill(); cx.fillStyle = '#fff'; cx.font = `800 18px ${TV_FONT}`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('COUP D\'ENVOI', mid, h * .86); cx.restore(); }
  cx.restore();
}
// ---------- bandeau « BUT ! » (≈ 3,8 s) ----------
const TV_GOAL = 3.8;
function tvGoalStart(v, M) {
  if (!tvOn() || !M || !M.E) return;
  const mine = !!v.mine, E = M.E, tk = mine ? 0 : 1, T = E.T[tk];
  const was = mine ? (M.side === 'h' ? [v.hg - 1, v.ag] : [v.hg, v.ag - 1]) : (M.side === 'h' ? [v.hg, v.ag - 1] : [v.hg - 1, v.ag]);
  TV.goal = { at: performance.now(), mine, me: !!v.me, n: v.n || '', as: v.as || '', how: v.how || '', min: v.min || M.min, col: T.col, col2: T.col2, hg: v.hg, ag: v.ag, was, hn: M.side === 'h' ? M.my : M.op, an: M.side === 'h' ? M.op : M.my, conf: [] };
  if (mine) { const R2 = inRngSafe(Date.now()); for (let i = 0; i < 70; i++) TV.goal.conf.push([R2(), -R2() * .3, .4 + R2() * .8, R2() * 6.28, R2() < .5 ? T.col : R2() < .5 ? '#f5c542' : '#fff', .5 + R2()]); }
}
function inRngSafe(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function tvDrawGoal(cx, w, h) {
  const G = TV.goal; if (!G) return; const t = (performance.now() - G.at) / 1000; if (t > TV_GOAL) { TV.goal = null; return; }
  const out = tvE((t - (TV_GOAL - .45)) / .45), al = 1 - out, gold = G.mine ? '#f5c542' : '#e8e8e8';
  cx.save(); cx.globalAlpha = al;
  // confettis
  for (const c of G.conf) { const tt = t * c[5], x = (c[0] * w + Math.sin(tt * 3 + c[3]) * 14), y = (c[1] + tt * c[2] * .55) * h; if (y > h) continue; cx.save(); cx.translate(x, y); cx.rotate(tt * 4 + c[3]); cx.fillStyle = c[4]; cx.fillRect(-3, -1.6, 6, 3.2); cx.restore(); }
  // lame aux couleurs de l'équipe qui traverse l'écran
  const bh = Math.min(118, h * .26), by = h * .36 - bh / 2, sweep = tvE(t / .32);
  { const g = cx.createLinearGradient(0, by, w, by + bh); g.addColorStop(0, G.col); g.addColorStop(1, G.col2 || G.col); cx.save(); cx.beginPath(); cx.rect(0, 0, w * sweep, h); cx.clip(); cx.globalAlpha = al * .92; cx.fillStyle = g; tvSkew(cx, -20, by, w + 40, bh, 14); cx.fill();
    cx.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 6; i++) { const x = ((t * 260 + i * 90) % (w + 120)) - 60; tvSkew(cx, x, by, 18, bh, 14); cx.fill(); } cx.restore(); }
  // « BUT ! » : arrive gros, se pose, tremble un peu
  { const k = t < .32 ? 0 : tvB((t - .32) / .4), sc = 1 + (1 - k) * 1.4, sh = t < 1 ? Math.sin(t * 70) * 2.5 * (1 - t) : 0; cx.save(); cx.globalAlpha = al * Math.min(1, k * 1.5); cx.translate(w / 2 + sh, by + bh / 2); cx.scale(sc, sc);
    cx.font = `400 ${Math.round(Math.min(64, bh * .62))}px ${TV_PUNCH}`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineWidth = 7; cx.strokeStyle = 'rgba(0,0,0,.55)'; const txt = G.mine ? (G.me ? 'TU MARQUES !' : 'BUT !') : 'BUT'; cx.strokeText(txt, 0, 0, w * .9); cx.fillStyle = gold; cx.fillText(txt, 0, 0, w * .9); cx.restore(); }
  // sous-titre : buteur, minute, manière, passeur
  if (t > .75) { const k = tvE((t - .75) / .4), y = by + bh + 8; cx.save(); cx.globalAlpha = al * k; cx.translate((1 - k) * -40, 0); cx.fillStyle = 'rgba(8,10,16,.9)'; tvSkew(cx, 16, y, w - 32, 44, 6); cx.fill(); cx.fillStyle = gold; tvSkew(cx, 16, y, 6, 44, 6); cx.fill();
    cx.textAlign = 'left'; cx.textBaseline = 'top'; cx.fillStyle = '#fff'; cx.font = `800 18px ${TV_FONT}`; cx.fillText(('⚽ ' + (G.me ? 'TOI' : LN(G.n)) + "  " + String(G.min).replace(/'?$/, "'")).toUpperCase(), 30, y + 5, w - 70);
    cx.font = `600 12px ${TV_LBL}`; cx.fillStyle = 'rgba(255,255,255,.75)'; cx.fillText(((G.how || '').trim() + (G.as ? (G.how ? ' · ' : '') + 'passe de ' + (G.as === 'P' ? 'toi' : LN(G.as)) : '')).replace(/^ /, '') || (G.mine ? 'Le stade explose !' : 'Coup dur…'), 30, y + 26, w - 70); cx.restore(); }
  // tableau d'affichage : le chiffre bascule
  if (t > 1.05) { const k = tvE((t - 1.05) / .35), y = h * .12, bw = 196, x = w / 2 - bw / 2; cx.save(); cx.globalAlpha = al * k; cx.fillStyle = 'rgba(8,10,16,.92)'; cx.fillRect(x, y, bw, 34); cx.fillStyle = G.col; cx.fillRect(x, y + 32, bw, 2);
    cx.font = `700 12px ${TV_LBL}`; cx.textBaseline = 'middle'; cx.fillStyle = '#fff'; cx.textAlign = 'left'; cx.fillText(initials(G.hn), x + 10, y + 17); cx.textAlign = 'right'; cx.fillText(initials(G.an), x + bw - 10, y + 17);
    const flip = tvE((t - 1.45) / .45), sc2 = [G.was, [G.hg, G.ag]]; cx.font = `800 22px ${TV_FONT}`; cx.textAlign = 'center';
    for (let s = 0; s < 2; s++) { const xx = w / 2 + (s ? 24 : -24), a0 = sc2[0][s], a1 = sc2[1][s]; cx.save(); cx.beginPath(); cx.rect(xx - 14, y + 2, 28, 30); cx.clip();
      if (a0 !== a1) { cx.fillStyle = 'rgba(255,255,255,.9)'; cx.fillText(String(a0), xx, y + 17 - flip * 30); cx.fillStyle = gold; cx.fillText(String(a1), xx, y + 17 + (1 - flip) * 30); } else { cx.fillStyle = '#fff'; cx.fillText(String(a1), xx, y + 17); } cx.restore(); }
    cx.fillStyle = 'rgba(255,255,255,.6)'; cx.fillText('–', w / 2, y + 16); cx.restore(); }
  cx.restore();
}
// ---------- volet de transition des ralentis (0,52 s ; l'image change à mi-course, cachée par le volet) ----------
const TV_WIPE = .52;
function tvWipe(col) { if (!tvOn()) return false; TV.wipe = { at: performance.now(), col: col || '#2f6fd6' }; return true; }
function tvWipeMid() { return TV.wipe && (performance.now() - TV.wipe.at) / 1000 >= TV_WIPE / 2; }
function tvDrawWipe(cx, w, h) {
  const W_ = TV.wipe; if (!W_) return; const p = (performance.now() - W_.at) / 1000 / TV_WIPE; if (p >= 1) { TV.wipe = null; return; }
  const span = w * 2.4, x = -w * 1.2 + p * span * 1.05, sk = h * .35;
  const band = (dx, wd, col) => { cx.fillStyle = col; cx.beginPath(); cx.moveTo(x + dx + sk, 0); cx.lineTo(x + dx + wd + sk, 0); cx.lineTo(x + dx + wd - sk, h); cx.lineTo(x + dx - sk, h); cx.closePath(); cx.fill(); };
  cx.save(); band(-w * .28, w * .14, '#f5c542'); band(-w * .14, w * 1.1, W_.col); band(w * .96, w * .1, '#ffffff'); band(w * 1.06, w * .06, '#f5c542');
  // l'emblème au centre du volet
  const ex = x + w * .41; if (ex > -60 && ex < w + 60) { cx.save(); cx.translate(ex, h / 2); cx.fillStyle = 'rgba(255,255,255,.95)'; cx.font = `400 ${Math.round(Math.min(w, h) * .14)}px ${TV_PUNCH}`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('CO', 0, -6); cx.font = `700 11px ${TV_LBL}`; cx.fillText('RALENTI', 0, Math.min(w, h) * .09); cx.restore(); }
  cx.restore();
}
// dessiné en dernier sur le calque du direct (lvHud)
function tvDraw(cx, w, h) { try { tvDrawGoal(cx, w, h); tvDrawIntro(cx, w, h); tvDrawWipe(cx, w, h); } catch (e) { console.warn('tv', e); TV.intro = TV.goal = TV.wipe = null; } }

// ===================== GRANDS MOMENTS EN PLEIN ÉCRAN (file MQ) =====================
// Un lecteur de « stories » : des scènes dessinées sur un canvas au format 9:16 (centré à l'écran), qui s'enchaînent
// toutes seules ; on touche pour passer à la suivante. Le même dessin sert à fabriquer la vidéo (MediaRecorder).
const MQ = { q: [] }, MP = { on: false };
function mqQueue(m) { if (!m) return; tvFonts(); if (m.k === 'recap') MQ.q = MQ.q.filter(x => x.k !== 'recap'); MQ.q.push(m); }
function mqOk() {
  if (typeof document === 'undefined' || !document.body || typeof requestAnimationFrame !== 'function') return false;
  if (typeof OPTS !== 'undefined' && OPTS.motion === false) return false;
  if (typeof navigator !== 'undefined' && navigator.webdriver && !window.__MOTION) return false;
  return true;
}
// ---------- outils de dessin (coordonnées en « unités » : 100 = largeur du cadre 9:16) ----------
const MD = { W: 0, H: 0, u: 1 };
function mdFont(px, w, fam) { return `${w || 800} ${Math.round(px * MD.u)}px ${fam || TV_FONT}`; }
function mdText(g, t, x, y, px, o = {}) {
  g.save(); g.font = mdFont(px, o.w, o.f); g.textAlign = o.a || 'center'; g.textBaseline = o.b || 'middle'; g.globalAlpha *= o.al ?? 1;
  if (o.ls) { try { g.letterSpacing = (o.ls * MD.u) + 'px'; } catch (e) { } }
  const X = x * MD.u, Y = y * MD.u, mw = o.mw ? o.mw * MD.u : undefined;
  if (o.sh) { g.shadowColor = o.sh; g.shadowBlur = 18 * MD.u / 4; }
  if (o.grad) { const m = g.measureText(t), gr = g.createLinearGradient(X - m.width / 2, 0, X + m.width / 2, 0); o.grad.forEach((c, i) => gr.addColorStop(i / (o.grad.length - 1), c)); g.fillStyle = gr; } else g.fillStyle = o.c || '#fff';
  if (o.st) { g.lineWidth = o.st * MD.u; g.strokeStyle = o.stc || 'rgba(0,0,0,.5)'; g.strokeText(t, X, Y, mw); }
  g.fillText(t, X, Y, mw); g.restore();
}
const mdR = (g, x, y, w, h, r) => { const u = MD.u; g.beginPath(); g.roundRect ? g.roundRect(x * u, y * u, w * u, h * u, r * u) : g.rect(x * u, y * u, w * u, h * u); };
const mdFmt = (v, f) => f === 'eur' ? eur(Math.round(v)) : f === 'r' ? (Math.round(v * 10) / 10).toFixed(1).replace('.', ',') : fnum(Math.round(v));
const mdCount = (v, t, d0, dur, f) => mdFmt(v * tvE(clamp((t - d0) / (dur || 1.1), 0, 1)), f);
// fond animé : dégradé profond, halos aux couleurs du club qui dérivent, grain de lumière
function mdBg(g, t, cols, dark) {
  const W = MD.W, H = MD.H; g.fillStyle = dark || '#06080d'; g.fillRect(0, 0, W, H);
  cols.forEach((c, i) => { const x = W * (.5 + .45 * Math.sin(t * .35 + i * 2.1)), y = H * (.35 + .3 * Math.cos(t * .27 + i * 1.7)), r = W * (.75 + .1 * i), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = .55; g.fillStyle = gr; g.fillRect(0, 0, W, H); });
  g.globalAlpha = 1;
  // rayons de lumière obliques
  g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const x = ((t * 22 + i * 37) % 160 - 30) * MD.u; g.fillStyle = 'rgba(255,255,255,.035)'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 14 * MD.u, 0); g.lineTo(x - 40 * MD.u, H); g.lineTo(x - 54 * MD.u, H); g.fill(); } g.restore();
}
// alpha d'une scène : fondu d'entrée et de sortie
const mdIn = (t, a, d) => tvE(clamp((t - (a || 0)) / (d || .45), 0, 1));
// ---------- lecteur ----------
function mqPlay(m, done) {
  tvFonts();
  const scenes = m.k === 'hwg' ? mqHwg(m) : m.k === 'maillot' ? mqJersey(m) : m.k === 'recap' ? mqRecap(m) : null;
  if (!scenes || !scenes.length || MP.on) { if (done) done(); return false; }
  const el = document.createElement('div'); el.id = 'mq'; el.className = 'mq ' + m.k;
  el.innerHTML = `<canvas class="mqc"></canvas><div class="mqbar">${scenes.map(() => '<i><b></b></i>').join('')}</div><div class="mqbtns"></div><div class="mqhint">Touche pour passer</div>`;
  document.body.appendChild(el);
  Object.assign(MP, { on: true, el, m, scenes, i: 0, t0: performance.now(), done, cv: el.querySelector('.mqc'), end: false });
  MP.g = MP.cv.getContext('2d');
  const size = () => { const w = innerWidth, h = innerHeight, d = Math.min(2, devicePixelRatio || 1); MP.cv.width = w * d; MP.cv.height = h * d; MP.d = d; };
  size(); MP.onr = size; addEventListener('resize', size);
  el.addEventListener('click', e => { if (e.target.closest('button')) return; mqNext(); });
  try { if (typeof sfxG === 'function') sfxG(m.k === 'hwg' ? 'whistle' : 'kick', .5); } catch (e) { }
  requestAnimationFrame(mqFrame);
  return true;
}
function mqNext() { if (!MP.on) return; if (MP.i < MP.scenes.length - 1) { MP.i++; MP.t0 = performance.now(); } else mqEndScreen(); }
function mqEndScreen() {
  if (MP.end) return; MP.end = true; MP.i = MP.scenes.length - 1; MP.t0 = performance.now() - MP.scenes[MP.i].d * 1000 * .999;
  const b = MP.el.querySelector('.mqbtns'), video = MP.m.k === 'recap' && typeof MediaRecorder !== 'undefined' && MP.cv.captureStream;
  b.innerHTML = `${video ? '<button class="btn" data-mq="vid">🎬 Exporter en vidéo</button>' : ''}<button class="btn pri" data-mq="ok">Continuer</button>`;
  b.querySelector('[data-mq=ok]').onclick = mqClose; const v = b.querySelector('[data-mq=vid]'); if (v) v.onclick = () => mqVideo(MP.m);
  MP.el.classList.add('fin');
}
function mqClose() {
  if (!MP.on) return; MP.on = false; removeEventListener('resize', MP.onr);
  const el = MP.el, done = MP.done; el.classList.add('out'); setTimeout(() => el.remove(), 380); if (done) setTimeout(done, 60);
}
function mqFrame(now) {
  if (!MP.on) return;
  const S_ = MP.scenes[MP.i], t = (now - MP.t0) / 1000;
  if (!MP.end && t >= S_.d) { if (MP.i < MP.scenes.length - 1) { MP.i++; MP.t0 = now; } else mqEndScreen(); }
  mqRender(MP.g, MP.cv.width, MP.cv.height, MP.i, Math.min((now - MP.t0) / 1000, MP.scenes[MP.i].d), MP.scenes);
  const bars = MP.el.querySelectorAll('.mqbar b'); bars.forEach((b, k) => { b.style.width = (k < MP.i ? 100 : k > MP.i ? 0 : Math.min(100, t / MP.scenes[MP.i].d * 100)) + '%'; });
  requestAnimationFrame(mqFrame);
}
// dessine la scène i au temps t dans un cadre 9:16 centré (bandes noires sur les côtés si besoin)
function mqRender(g, cw, ch, i, t, scenes) {
  const ar = 9 / 16; let W = cw, H = cw / ar; if (H > ch) { H = ch; W = ch * ar; }
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, cw, ch);
  g.save(); g.translate((cw - W) / 2, (ch - H) / 2); g.beginPath(); g.rect(0, 0, W, H); g.clip();
  MD.W = W; MD.H = H; MD.u = W / 100;
  try { scenes[i].f(g, t); } catch (e) { console.warn('motion', e); }
  // transition : éclair blanc au début de chaque scène
  if (t < .18 && i > 0) { g.fillStyle = `rgba(255,255,255,${(1 - t / .18) * .35})`; g.fillRect(0, 0, W, H); }
  g.restore();
}
// ---------- vidéo du récap (9:16, 720×1280) ----------
async function mqVideo(m) {
  const btn = MP.el && MP.el.querySelector('[data-mq=vid]'); if (!btn || btn.disabled) return;
  const scenes = mqRecap(m), total = scenes.reduce((a, s) => a + s.d, 0), cv = document.createElement('canvas'); cv.width = 720; cv.height = 1280; const g = cv.getContext('2d');
  const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'], type = types.find(x => { try { return MediaRecorder.isTypeSupported(x); } catch (e) { return false; } }) || '';
  let rec; try { rec = new MediaRecorder(cv.captureStream(30), type ? { mimeType: type, videoBitsPerSecond: 4e6 } : undefined); } catch (e) { toast('La vidéo n\'est pas possible sur ce navigateur.'); return; }
  const chunks = []; rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  btn.disabled = true; rec.start(250); const t0 = performance.now();
  await new Promise(res => { const step = now => { const T = (now - t0) / 1000; let acc = 0, i = 0; while (i < scenes.length - 1 && T >= acc + scenes[i].d) { acc += scenes[i].d; i++; } mqRender(g, 720, 1280, i, Math.min(T - acc, scenes[i].d), scenes); btn.textContent = `🎬 Création de la vidéo… ${Math.min(99, Math.round(T / total * 100))} %`; if (T < total + .3) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
  await new Promise(res => { rec.onstop = res; rec.stop(); });
  const ext = /mp4/.test(rec.mimeType || type) ? 'mp4' : 'webm', blob = new Blob(chunks, { type: rec.mimeType || type || 'video/webm' }), name = `crampons-dor-saison-${String(m.s || '').replace(/[^\d-]/g, '')}.${ext}`;
  // le partage doit partir d'un geste : la vidéo prête, le bouton devient « Partager » (un nouveau toucher)
  btn.disabled = false; btn.textContent = '📤 Partager la vidéo'; btn.onclick = () => mqShare(blob, name);
}
async function mqShare(blob, name) {
  try { const f = new File([blob], name, { type: blob.type }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'Ma saison sur Crampons d\'Or' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  toast('Vidéo enregistrée.');
}
// ---------- petits éléments réutilisables ----------
const mh = () => MD.H / MD.u; // hauteur du cadre en unités (≈ 177,8)
const mdGold = ['#fff3c4', '#ffc23d', '#e08a12'];
const mdRtCol = r => r >= 7.5 ? '#3fd68a' : r >= 6.8 ? '#a8dc4c' : r >= 6.2 ? '#ffc23d' : '#ff6b4a';
const mdOrd = n => n === 1 ? '1er' : n + 'e';
function mdClubCols(n) { try { const k = kitColors(n || '?'); return [k.col, k.col2, k.hue]; } catch (e) { return ['#2f6fd6', '#0d1f3a', 215]; } }
function mdConfetti(g, t, cols, seed, n, t0) {
  const R_ = inRngSafe(seed), u = MD.u, H = mh(); if (t < (t0 || 0)) return;
  for (let i = 0; i < (n || 70); i++) {
    const x0 = R_() * 100, sp = 28 + R_() * 40, ph = R_() * 7, del = R_() * .6, c = cols[i % cols.length], sz = 1.1 + R_() * 1.5, tt = t - (t0 || 0) - del; if (tt < 0) continue;
    const y = -6 + tt * sp, x = x0 + Math.sin(tt * 2.3 + ph) * 5; if (y > H + 5) continue;
    g.save(); g.translate(x * u, y * u); g.rotate(tt * 4 + ph); g.scale(1, Math.cos(tt * 6 + ph)); g.fillStyle = c; g.fillRect(-sz * u / 2, -sz * u * .3, sz * u, sz * u * .6); g.restore();
  }
}
function mdRays(g, cx, cy, t, col, n, al) {
  const u = MD.u; g.save(); g.translate(cx * u, cy * u); g.rotate(t * .25); g.globalAlpha = al ?? .16; g.fillStyle = col;
  for (let i = 0; i < (n || 14); i++) { g.rotate(Math.PI * 2 / (n || 14)); g.beginPath(); g.moveTo(0, 0); g.lineTo(-7 * u, -150 * u); g.lineTo(7 * u, -150 * u); g.fill(); }
  g.restore();
}
function mdBadge(g, x, y, r, name, sc) { const [c1, c2] = mdClubCols(name); tvBadge(g, x * MD.u, y * MD.u, r * MD.u * (sc ?? 1), name, c1, c2); }
function mdBall(g, x, y, r) {
  const u = MD.u; g.save(); g.translate(x * u, y * u); const gr = g.createRadialGradient(-r * u * .3, -r * u * .35, r * u * .1, 0, 0, r * u); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#c9ced6');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * u, 0, 7); g.fill(); g.fillStyle = '#1b1f27'; g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; g.lineTo(Math.cos(a) * r * u * .42, Math.sin(a) * r * u * .42); } g.fill(); g.restore();
}
// bandeau incliné (étiquette)
function mdTag(g, txt, x, y, px, bg, fg, a) {
  g.save(); g.font = mdFont(px, 800, TV_LBL); const w = g.measureText(txt).width / MD.u + px * 1.1, h = px * 1.45;
  g.globalAlpha *= a ?? 1; g.fillStyle = bg; tvSkew(g, (x - w / 2) * MD.u, (y - h / 2) * MD.u, w * MD.u, h * MD.u, px * .22 * MD.u); g.fill(); g.restore();
  mdText(g, txt, x, y + px * .04, px, { c: fg || '#fff', f: TV_LBL, al: a ?? 1, mw: 94 });
}
// maillot de foot dessiné : face (écusson) ou dos (nom + numéro) ; sx = écrasement horizontal pour le retournement
function mdShirt(g, cx, cy, s, cols, back, name, num, sx, light) {
  const u = MD.u, P = [[-.12, -.5], [.12, -.5], [.31, -.46], [.53, -.27], [.42, -.12], [.33, -.21], [.34, .5], [-.34, .5], [-.33, -.21], [-.42, -.12], [-.53, -.27], [-.31, -.46]];
  g.save(); g.translate(cx * u, cy * u); g.scale(s * u * Math.max(.02, Math.abs(sx)), s * u);
  // texte dessiné hors de la grande mise à l'échelle (les polices de moins d'un pixel s'affichent mal)
  const K = s * u, T = (str, x, y, px, fam, col, mw, st) => { g.save(); g.scale(1 / K, 1 / K); g.font = `800 ${px * K}px ${fam}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; if (st) { g.lineWidth = st * K; g.strokeStyle = 'rgba(0,0,0,.45)'; g.strokeText(str, x * K, y * K, mw ? mw * K : undefined); } g.fillStyle = col; g.fillText(str, x * K, y * K, mw ? mw * K : undefined); g.restore(); };
  const path = () => { g.beginPath(); P.forEach(([x, y], i) => { if (i === 1) g.quadraticCurveTo(0, back ? -.46 : -.38, x, y); else g[i ? 'lineTo' : 'moveTo'](x, y); }); g.closePath(); };
  g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 30; g.shadowOffsetY = 14; path(); const gr = g.createLinearGradient(0, -.5, 0, .5); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]); g.fillStyle = gr; g.fill(); g.shadowColor = 'transparent';
  g.save(); path(); g.clip();
  // bandes latérales et col
  g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(-.36, -.25, .05, .8); g.fillRect(.31, -.25, .05, .8);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.moveTo(-.53, -.27); g.lineTo(-.42, -.12); g.lineTo(-.45, -.17); g.lineTo(-.55, -.3); g.fill(); g.beginPath(); g.moveTo(.53, -.27); g.lineTo(.42, -.12); g.lineTo(.45, -.17); g.lineTo(.55, -.3); g.fill();
  // plis du tissu
  const fold = g.createLinearGradient(-.5, 0, .5, 0); fold.addColorStop(0, 'rgba(0,0,0,.28)'); fold.addColorStop(.25, 'rgba(255,255,255,.06)'); fold.addColorStop(.5, 'rgba(0,0,0,.05)'); fold.addColorStop(.75, 'rgba(255,255,255,.08)'); fold.addColorStop(1, 'rgba(0,0,0,.3)'); g.fillStyle = fold; g.fillRect(-.6, -.6, 1.2, 1.2);
  if (!back) {
    g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(-.15, -.27, .065, 0, 7); g.fill();
    T(initials(name || '?'), -.15, -.265, .07, TV_FONT, cols[1]); T('CRAMPONS', 0, -.02, .1, TV_LBL, 'rgba(255,255,255,.85)'); T('D\'OR', 0, .07, .06, TV_LBL, 'rgba(255,255,255,.85)');
  } else {
    T(String(name || '').toUpperCase(), 0, -.27, .11, TV_FONT, '#fff', .56, .018); T(String(num ?? ''), 0, .09, .5, TV_FONT, '#fff', null, .03);
  }
  // reflet qui balaie le tissu
  if (light != null) { const lx = -1 + light * 2.4, lg = g.createLinearGradient(lx - .3, -.5, lx + .3, .5); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.5, 'rgba(255,255,255,.4)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = lg; g.fillRect(-.6, -.6, 1.2, 1.2); }
  // ombrage du retournement
  if (Math.abs(sx) < 1) { g.fillStyle = `rgba(0,0,0,${(1 - Math.abs(sx)) * .45})`; g.fillRect(-.6, -.6, 1.2, 1.2); }
  g.restore(); g.restore();
}
// ---------- annonce de transfert « Here we go » ----------
function mqHwg(m) {
  const [c1, c2] = mdClubCols(m.to), H = () => mh(), acad = m.kind === 'academy', head = acad ? 'CENTRE DE FORMATION' : m.back ? 'RETOUR DE PRÊT' : m.loan ? 'PRÊT' : 'INFO MERCATO';
  const big = acad ? 'BIENVENUE !' : m.back ? 'DE RETOUR !' : 'HERE WE GO !';
  const fee = acad ? 'Formation' : m.loan ? 'Prêt' : m.fee ? null : m.from ? 'Libre' : 'Premier contrat';
  return [
    { d: 2.9, f(g, t) {
      mdBg(g, t, ['rgba(200,20,40,.55)', c1], '#07090f'); const h = H();
      // bandeau d'alerte qui clignote
      const blink = .75 + .25 * Math.sin(t * 14);
      mdTag(g, '🚨 ' + head, 50, 30, 5.2, `rgba(225,30,50,${blink})`, '#fff', mdIn(t, 0, .25));
      mdText(g, 'DERNIÈRE MINUTE', 50 - (1 - mdIn(t, .2, .5)) * 60, 46, 9.5, { grad: mdGold, al: mdIn(t, .2, .5), st: .3 });
      mdText(g, (m.name || '').toUpperCase(), 50, 62, 12.5, { al: mdIn(t, .45, .5), mw: 92, sh: 'rgba(0,0,0,.8)' });
      mdText(g, `${m.ppos || ''}${m.age ? ' · ' + m.age + ' ans' : ''}${m.ovr ? ' · note ' + m.ovr : ''}`, 50, 71, 4.2, { f: TV_LBL, w: 600, c: 'rgba(255,255,255,.75)', al: mdIn(t, .6, .5) });
      // départ → arrivée
      const k = tvB((t - .8) / .7), y = 98;
      if (m.from) { mdBadge(g, 24 - (1 - k) * 40, y, 11, m.from); mdText(g, m.from, 24, y + 16, 3.6, { f: TV_LBL, w: 700, mw: 40, al: mdIn(t, 1, .4) }); }
      mdBadge(g, (m.from ? 76 : 50) + (1 - k) * 40, y, 13, m.to); mdText(g, m.to, m.from ? 76 : 50, y + 18, 4, { f: TV_LBL, w: 700, mw: 46, al: mdIn(t, 1.05, .4) });
      if (m.from) { const ak = mdIn(t, 1.2, .5); g.save(); g.globalAlpha = ak; mdText(g, '➜', 50, y, 11, { c: '#ffc23d' }); g.restore(); }
      // fil d'info qui défile en bas
      const u = MD.u; g.fillStyle = 'rgba(225,30,50,.92)'; g.fillRect(0, (h - 19) * u, MD.W, 8 * u);
      const tick = ['ACCORD TOTAL', 'VISITE MÉDICALE OK', 'CONTRAT PRÊT À ÊTRE SIGNÉ', 'ANNONCE IMMINENTE'].join('   ·   ') + '   ·   ';
      g.save(); g.font = mdFont(3.6, 700, TV_LBL); const tw = g.measureText(tick).width; g.fillStyle = '#fff'; g.textBaseline = 'middle'; const off = (t * 26 * u) % tw; g.fillText(tick + tick + tick, -off, (h - 15) * u); g.restore();
    } },
    { d: 3.3, f(g, t) {
      mdBg(g, t, [c1, 'rgba(255,194,61,.35)'], '#05070c'); const h = H();
      mdRays(g, 50, 70, t, '#ffd36b', 16, .1 + .06 * Math.sin(t * 3));
      // coup de tampon : le texte arrive en grand puis se pose, l'écran tremble
      const k = clamp(t / .38, 0, 1), sc = 1 + (1 - tvE(k)) * 1.8, sh = t > .38 && t < .62 ? Math.sin(t * 90) * (.62 - t) * 6 : 0;
      g.save(); g.translate((50 + sh) * MD.u, 70 * MD.u); g.scale(sc, sc); g.translate(-50 * MD.u, -70 * MD.u);
      const words = big.split(' '); words.length > 2 ? (mdText(g, words.slice(0, 2).join(' '), 50, 62, 19, { f: TV_PUNCH, w: 400, grad: mdGold, st: .6, stc: 'rgba(60,30,0,.6)', al: k }), mdText(g, words.slice(2).join(' '), 50, 80, 19, { f: TV_PUNCH, w: 400, grad: mdGold, st: .6, stc: 'rgba(60,30,0,.6)', al: k })) : mdText(g, big, 50, 70, 15, { f: TV_PUNCH, w: 400, grad: mdGold, st: .6, stc: 'rgba(60,30,0,.6)', al: k, mw: 94 });
      g.restore();
      if (t > .38 && t < .7) { g.fillStyle = `rgba(255,240,200,${(.7 - t) * 1.6})`; g.fillRect(0, 0, MD.W, MD.H); }
      mdText(g, (m.name || '').toUpperCase(), 50, 104, 8.5, { al: mdIn(t, .7, .4), mw: 92, sh: 'rgba(0,0,0,.8)' });
      mdText(g, acad ? `intègre le centre de formation de ${m.to}` : m.back ? `revient à ${m.to}` : `${m.loan ? 'est prêté à' : 'signe à'} ${m.to}`, 50, 113, 4.4, { f: TV_LBL, w: 600, c: 'rgba(255,255,255,.85)', al: mdIn(t, .85, .4), mw: 92 });
      mdBadge(g, 50, 138, 14, m.to, tvB((t - 1) / .6));
      mdConfetti(g, t, [c1, '#ffc23d', '#ffffff', c2], 7, 80, .4);
    } },
    { d: 3.6, f(g, t) {
      mdBg(g, t, [c1, c2], '#06080d'); const h = H();
      mdBadge(g, 50, 30, 15, m.to, tvB(t / .55));
      mdText(g, m.to, 50, 53, 7, { al: mdIn(t, .2), mw: 90 });
      mdText(g, m.lg || '', 50, 60, 3.8, { f: TV_LBL, w: 600, c: 'rgba(255,255,255,.65)', al: mdIn(t, .3) });
      const rows = [['Transfert', fee || mdCount(m.fee, t, .7, 1.2, 'eur')], ['Salaire', acad ? eur(monthly(m.wage || 0)) + ' / mois' : mdCount(monthly(m.wage || 0), t, .9, 1.1, 'eur') + ' / mois'], ['Contrat', `jusqu'en juin ${m.until}`], ['Poste', m.ppos || '—']];
      rows.forEach(([a, b], i) => { const k = mdIn(t, .5 + i * .16, .4), y = 74 + i * 14, x = (1 - k) * 30; g.save(); g.globalAlpha = k; g.fillStyle = 'rgba(0,0,0,.42)'; mdR(g, 10 + x, y - 5.5, 80, 11, 2.2); g.fill(); g.fillStyle = c1; mdR(g, 10 + x, y - 5.5, 1.4, 11, .7); g.fill(); g.restore();
        mdText(g, a.toUpperCase(), 15 + x, y, 3.6, { a: 'left', f: TV_LBL, w: 700, c: 'rgba(255,255,255,.6)', al: k }); mdText(g, b, 86 + x, y, 5, { a: 'right', al: k, mw: 52 }); });
      // tampon « OFFICIEL »
      const sk = clamp((t - 1.9) / .25, 0, 1); if (sk > 0) { g.save(); g.translate(68 * MD.u, 140 * MD.u); g.rotate(-.2); const s = 1 + (1 - sk) * 1.5; g.scale(s, s); g.globalAlpha = sk * .92; g.strokeStyle = '#ff4d5e'; g.lineWidth = 1.2 * MD.u; mdR(g, -21, -7, 42, 14, 2); g.stroke(); g.restore(); g.save(); g.translate(68 * MD.u, 140 * MD.u); g.rotate(-.2); g.scale(s, s); mdText(g, 'OFFICIEL', 0, .4, 8, { c: '#ff4d5e', al: sk * .92, ls: .5 }); g.restore(); }
    } }
  ];
}
// ---------- maillot dévoilé ----------
function mqJersey(m) {
  const cols = mdClubCols(m.club);
  return [{ d: 5.6, f(g, t) {
    mdBg(g, t, [cols[0], 'rgba(255,194,61,.25)'], '#05070b');
    mdRays(g, 50, 82, t, '#fff', 12, .06);
    mdTag(g, 'TON NOUVEAU MAILLOT', 50, 22, 4.6, cols[0], '#fff', mdIn(t, 0, .3));
    mdText(g, m.club, 50, 33, 6, { al: mdIn(t, .15), mw: 90 });
    const drop = tvB(t / .7), y = 84 - (1 - drop) * 80, fl = tvE(clamp((t - 1.35) / .9, 0, 1)), ang = fl * Math.PI, sx = Math.cos(ang), back = sx < 0;
    const breathe = 1 + Math.sin(t * 2) * .01;
    mdShirt(g, 50, y, 70 * breathe, cols, back, back ? m.name : m.club, m.num, sx, t > 2.3 ? clamp((t - 2.3) / 1.1, 0, 1) : null);
    // le numéro éclate quand le dos apparaît
    if (t > 2.25) { const k = clamp((t - 2.25) / .5, 0, 1); g.save(); g.globalCompositeOperation = 'lighter'; const r = (10 + k * 60) * MD.u, gr = g.createRadialGradient(50 * MD.u, 90 * MD.u, 0, 50 * MD.u, 90 * MD.u, r); gr.addColorStop(0, `rgba(255,220,140,${(1 - k) * .55})`); gr.addColorStop(1, 'rgba(255,220,140,0)'); g.fillStyle = gr; g.fillRect(0, 0, MD.W, MD.H); g.restore(); }
    mdText(g, `${(m.first || '')} ${(m.name || '')}`.trim().toUpperCase(), 50, 140, 7.5, { al: mdIn(t, 2.6, .45), mw: 92 });
    mdText(g, `porte le n° ${m.num}`, 50, 149, 4.6, { f: TV_LBL, w: 600, grad: mdGold, al: mdIn(t, 2.8, .45) });
    mdConfetti(g, t, [cols[0], '#ffc23d', '#fff'], 3, 50, 2.3);
  } }];
}
// ---------- récap de saison façon « stories » ----------
function mqRecap(m) {
  const cols = mdClubCols(m.club), c1 = cols[0], c2 = cols[1], sc = [];
  const pal = [['#ff3d7f', '#6a2cff'], ['#00c2a8', '#0a3d91'], ['#ffb800', '#ff4d2e'], ['#3ddc84', '#0a6d5a'], ['#5d7cff', '#ff5ad1'], [c1, '#ffc23d'], ['#ff7a00', '#7a1cff']];
  const big = (g, v, x, y, px, o) => mdText(g, v, x, y, px, Object.assign({ f: TV_PUNCH, w: 400 }, o || {}));
  const lbl = (g, v, x, y, px, a, o) => mdText(g, v, x, y, px, Object.assign({ f: TV_LBL, w: 700, c: 'rgba(255,255,255,.82)', al: a, ls: .4 }, o || {}));
  // 1. ouverture
  sc.push({ d: 3.2, f(g, t) {
    mdBg(g, t, pal[0], '#0b0614'); const u = MD.u;
    for (let i = 0; i < 9; i++) { const k = tvE(clamp((t - i * .06) / .6, 0, 1)), y = 20 + i * 16; g.fillStyle = i % 2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)'; g.save(); g.translate(-100 * u + k * 100 * u, 0); tvSkew(g, 0, y * u, 100 * u, 8 * u, 6 * u); g.fill(); g.restore(); }
    lbl(g, 'TA SAISON', 50, 52, 6, mdIn(t, .15));
    big(g, m.s, 50, 80 - (1 - tvB((t - .3) / .6)) * 20, 22, { grad: mdGold, al: mdIn(t, .3, .3), st: .5, stc: 'rgba(0,0,0,.35)' });
    mdText(g, (m.name || '').toUpperCase(), 50, 108, 7.5, { al: mdIn(t, .7), mw: 92 });
    lbl(g, `${m.club}${m.num ? ' · n° ' + m.num : ''}`, 50, 117, 4.4, mdIn(t, .85), { mw: 90 });
    mdBadge(g, 50, 145, 12, m.club, tvB((t - 1) / .6));
  } });
  // 2. sur le terrain
  sc.push({ d: 3.4, f(g, t) {
    mdBg(g, t, pal[1], '#04111a');
    lbl(g, 'SUR LE TERRAIN', 50, 26, 5, mdIn(t, 0));
    big(g, mdCount(m.apps, t, .2, 1.1), 50, 56, 34, { al: mdIn(t, .15), grad: ['#fff', '#bff7ea'] });
    lbl(g, m.apps > 1 ? 'MATCHS JOUÉS' : 'MATCH JOUÉ', 50, 76, 5.4, mdIn(t, .4));
    // chrono qui tourne autour des minutes
    const u = MD.u, k = tvE(clamp((t - .9) / 1.3, 0, 1)); g.save(); g.lineCap = 'round'; g.lineWidth = 2.2 * u; g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(50 * u, 116 * u, 19 * u, 0, 7); g.stroke(); g.strokeStyle = '#00e0c0'; g.beginPath(); g.arc(50 * u, 116 * u, 19 * u, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2 * Math.min(1, m.min / Math.max(1, m.apps * 90))); g.stroke(); g.restore();
    big(g, mdCount(m.min, t, .9, 1.3), 50, 114, 9, { al: mdIn(t, .9) }); lbl(g, 'MINUTES', 50, 123, 3.4, mdIn(t, 1));
    lbl(g, `${m.starts} titularisation${m.starts > 1 ? 's' : ''}${m.cs ? ' · ' + m.cs + ' clean sheet' + (m.cs > 1 ? 's' : '') : ''}${m.cl && m.cl.apps ? ' · ' + m.cl.apps + ' en coupe d\'Europe' : ''}`, 50, 150, 4, mdIn(t, 1.5), { mw: 92 });
  } });
  // 3. décisif
  sc.push({ d: 3.6, f(g, t) {
    mdBg(g, t, pal[2], '#140805');
    lbl(g, 'DÉCISIF', 50, 24, 5, mdIn(t, 0));
    big(g, mdCount(m.g, t, .2, 1.2), 30, 56, 30, { al: mdIn(t, .15), grad: mdGold }); lbl(g, m.g > 1 ? 'BUTS' : 'BUT', 30, 75, 5, mdIn(t, .3));
    big(g, mdCount(m.a, t, .4, 1.2), 72, 56, 22, { al: mdIn(t, .35) }); lbl(g, m.a > 1 ? 'PASSES D.' : 'PASSE D.', 72, 72, 4.4, mdIn(t, .5));
    // un ballon par but, qui tombent un à un
    const n = Math.min(m.g, 40), per = 10, sz = 7.6; for (let i = 0; i < n; i++) { const k = tvB(clamp((t - .9 - i * .045) / .35, 0, 1)); if (k <= 0) continue; const r = Math.floor(i / per), c = i % per, x = 50 - (Math.min(n, per) - 1) * sz / 2 + c * sz, y = 96 + r * sz - (1 - k) * 14; g.save(); g.globalAlpha = clamp(k, 0, 1); mdBall(g, x, y, 3.2); g.restore(); }
    if (m.g > 40) lbl(g, `+ ${m.g - 40}`, 50, 132, 4, mdIn(t, 2.6));
    const ga = m.g + m.a, apps = Math.max(1, m.apps); lbl(g, ga ? `${ga} contributions · une toutes les ${Math.round(m.min / Math.max(1, ga))} min` : 'Le prochain sera le bon', 50, 150, 4, mdIn(t, 2), { mw: 92 });
  } });
  // 4. note moyenne
  sc.push({ d: 3.4, f(g, t) {
    mdBg(g, t, pal[3], '#03100c'); const u = MD.u, col = mdRtCol(m.avg), k = tvE(clamp((t - .3) / 1.4, 0, 1));
    lbl(g, 'NOTE MOYENNE', 50, 26, 5, mdIn(t, 0));
    g.save(); g.lineCap = 'round'; g.lineWidth = 4 * u; g.strokeStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.arc(50 * u, 76 * u, 30 * u, Math.PI * .75, Math.PI * 2.25); g.stroke();
    g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 20; g.beginPath(); g.arc(50 * u, 76 * u, 30 * u, Math.PI * .75, Math.PI * .75 + Math.PI * 1.5 * k * clamp((m.avg - 4) / 6, 0, 1)); g.stroke(); g.restore();
    big(g, mdCount(m.avg, t, .3, 1.4, 'r'), 50, 76, 22, { c: col });
    const verdict = m.avg >= 8 ? 'SAISON LÉGENDAIRE' : m.avg >= 7.4 ? 'SAISON XXL' : m.avg >= 6.9 ? 'TRÈS BONNE SAISON' : m.avg >= 6.4 ? 'SAISON SOLIDE' : 'SAISON D\'APPRENTISSAGE';
    mdTag(g, verdict, 50, 122, 5, col, '#06100c', mdIn(t, 1.6, .3));
    if (m.ovr0 && m.ovr !== m.ovr0) lbl(g, `Niveau : ${m.ovr0} ➜ ${m.ovr}`, 50, 140, 5, mdIn(t, 2), { c: m.ovr > m.ovr0 ? '#9ff2c4' : '#ffb0a0' });
  } });
  // 5. match de l'année
  if (m.best) { const b = m.best; sc.push({ d: 3.6, f(g, t) {
    mdBg(g, t, pal[4], '#08061a'); const u = MD.u;
    lbl(g, 'TON MATCH DE L\'ANNÉE', 50, 26, 5, mdIn(t, 0));
    lbl(g, `${b.comp || ''}${b.d ? ' · ' + b.d : ''}`, 50, 34, 3.6, mdIn(t, .1), { c: 'rgba(255,255,255,.6)', mw: 92 });
    const k = tvB((t - .2) / .6); mdBadge(g, 17, 64, 9.5 * k, b.h); mdBadge(g, 83, 64, 9.5 * k, b.a2);
    mdText(g, b.h, 17, 80, 3.4, { f: TV_LBL, w: 700, mw: 30, al: mdIn(t, .4) }); mdText(g, b.a2, 83, 80, 3.4, { f: TV_LBL, w: 700, mw: 30, al: mdIn(t, .4) });
    big(g, `${b.hg} - ${b.ag}`, 50, 64, 13, { al: mdIn(t, .5), mw: 38 });
    g.save(); g.globalAlpha = mdIn(t, .9); g.fillStyle = mdRtCol(b.rt); mdR(g, 35, 96, 30, 16, 3); g.fill(); g.restore();
    big(g, mdCount(b.rt, t, .9, .9, 'r'), 50, 104.5, 10, { c: '#08100c', al: mdIn(t, .9) });
    const parts = []; if (b.g) parts.push(b.g + (b.g > 1 ? ' buts' : ' but')); if (b.a) parts.push(b.a + (b.a > 1 ? ' passes D.' : ' passe D.'));
    lbl(g, parts.length ? parts.join(' · ') : 'Une prestation de patron', 50, 124, 5.4, mdIn(t, 1.4));
    if (b.g >= 3) mdTag(g, 'TRIPLÉ', 50, 140, 5, '#ffc23d', '#1a1000', mdIn(t, 1.8, .3));
  } }); }
  // 6. le club : classement et trophées
  sc.push({ d: 3.6, f(g, t) {
    mdBg(g, t, [c1, c2], '#06080d');
    mdBadge(g, 50, 36, 12, m.club, tvB(t / .5)); lbl(g, m.club, 50, 54, 5, mdIn(t, .2), { mw: 92 });
    if (m.pos) { big(g, mdOrd(Math.max(1, Math.round(m.pos + (1 - tvE(clamp((t - .3) / 1, 0, 1))) * 12))), 50, 78, 20, { grad: m.pos === 1 ? mdGold : ['#fff', '#d6e2f0'], al: mdIn(t, .3) }); lbl(g, m.lg ? 'de ' + m.lg : 'au classement', 50, 93, 4.4, mdIn(t, .5), { mw: 92 }); }
    const tr = (m.tr || []).slice(0, 5);
    if (tr.length) tr.forEach((x, i) => { const k = tvB(clamp((t - 1 - i * .25) / .45, 0, 1)), y = 108 + i * 11 - (1 - k) * 10; g.save(); g.globalAlpha = clamp(k, 0, 1); g.fillStyle = 'rgba(255,194,61,.16)'; mdR(g, 12, y - 4.5, 76, 9, 2); g.fill(); g.restore(); mdText(g, '🏆 ' + x, 50, y, 4.2, { f: TV_LBL, w: 700, al: clamp(k, 0, 1), mw: 72 }); });
    else lbl(g, 'Pas de trophée cette fois… La saison prochaine ?', 50, 116, 4.2, mdIn(t, 1.1), { mw: 90, c: 'rgba(255,255,255,.7)' });
    if (tr.length) mdConfetti(g, t, ['#ffc23d', '#fff', c1], 11, 60, 1);
  } });
  // 7. cote et récompenses
  sc.push({ d: 3.6, f(g, t) {
    mdBg(g, t, pal[6], '#0c0614');
    lbl(g, 'TA COTE', 50, 26, 5, mdIn(t, 0));
    big(g, mdCount(m.val, t, .2, 1.4, 'eur'), 50, 52, 15, { grad: mdGold, al: mdIn(t, .15), mw: 94 }); lbl(g, 'VALEUR MARCHANDE', 50, 64, 4, mdIn(t, .3));
    if (m.wage) { big(g, mdCount(monthly(m.wage), t, .6, 1.2, 'eur'), 50, 82, 8.5, { al: mdIn(t, .5), mw: 94 }); lbl(g, 'DE SALAIRE PAR MOIS', 50, 90, 3.6, mdIn(t, .6)); }
    big(g, mdCount(m.fol || 0, t, .9, 1.3), 50, 106, 8.5, { al: mdIn(t, .8) }); lbl(g, 'ABONNÉS', 50, 114, 3.6, mdIn(t, .9));
    (m.aw || []).slice(0, 3).forEach((x, i) => mdTag(g, '★ ' + x.toUpperCase(), 50, 132 + i * 10, 3.6, '#ffc23d', '#1a1000', mdIn(t, 1.6 + i * .25, .3)));
  } });
  // 8. affiche finale (c'est elle qui reste à l'écran avec les boutons)
  sc.push({ d: 4.4, f(g, t) {
    mdBg(g, t, [c1, '#ffc23d'], '#05060a'); const u = MD.u, h = mh();
    g.save(); g.globalAlpha = mdIn(t, 0); g.fillStyle = 'rgba(0,0,0,.42)'; mdR(g, 8, 16, 84, 128, 4); g.fill(); g.strokeStyle = 'rgba(255,194,61,.55)'; g.lineWidth = .4 * u; mdR(g, 8, 16, 84, 128, 4); g.stroke(); g.restore();
    lbl(g, 'SAISON ' + m.s, 50, 25, 4.2, mdIn(t, .1), { c: '#ffc23d' });
    mdText(g, (m.name || '').toUpperCase(), 50, 36, 8, { al: mdIn(t, .15), mw: 78 });
    lbl(g, `${m.club}${m.ppos ? ' · ' + m.ppos : ''}`, 50, 44, 3.8, mdIn(t, .2), { mw: 78, c: 'rgba(255,255,255,.7)' });
    const cells = [[m.apps, 'MATCHS'], [m.g, 'BUTS'], [m.a, 'PASSES D.'], [m.avg ? String(m.avg).replace('.', ',') : '–', 'NOTE'], [m.pos ? mdOrd(m.pos) : '–', 'CLASSEMENT'], [(m.tr || []).length, 'TROPHÉES']];
    cells.forEach(([v, l], i) => { const cx = 29 + (i % 2) * 42, cy = 62 + Math.floor(i / 2) * 25, k = tvB(clamp((t - .3 - i * .1) / .45, 0, 1)); g.save(); g.globalAlpha = clamp(k, 0, 1); g.fillStyle = 'rgba(255,255,255,.07)'; mdR(g, cx - 19, cy - 10, 38, 21, 3); g.fill(); g.restore(); big(g, String(v), cx, cy - 1.5, 10 * Math.max(.3, k), { al: clamp(k, 0, 1), c: i === 1 ? '#ffc23d' : '#fff' }); lbl(g, l, cx, cy + 7, 3, clamp(k, 0, 1)); });
    lbl(g, 'Valeur ' + eur(m.val), 50, 137, 4, mdIn(t, 1));
    mdText(g, 'CRAMPONS', 50, 156, 7, { grad: mdGold, al: mdIn(t, 1.2), ls: .3 }); mdText(g, 'D\'OR', 50, 163.5, 4.5, { al: mdIn(t, 1.3), ls: .8 });
  } });
  return sc;
}

// ===================== INTERFACE VIVANTE =====================
// Appelé après chaque rendu (render, renderModal). Le DOM est reconstruit à chaque fois : on garde en mémoire ce qui a
// déjà été vu (clé) pour n'animer que ce qui change ou ce qui apparaît pour la première fois.
//  - [data-cnt] : compteur qui défile (data-ck = clé, data-fmt = eur | r | n | i, data-c0 = valeur de départ au premier affichage)
//  - [data-ain] : animation d'entrée jouée une seule fois par clé (classe .ain)
//  - .bar>i : les jauges se remplissent à l'arrivée sur un écran et glissent quand la valeur change
//  - changement d'onglet : le contenu glisse dans le sens de la navigation, l'icône de l'onglet saute
//  - nouvelle fenêtre : elle s'ouvre (et se retourne comme une carte pour les événements)
const UIM = { view: null, cnt: new Map(), seen: new Set(), bars: new Map(), an: new Map(), raf: 0, modal: null, unread: null };
const UIM_TABS = ['home', 'agenda', 'career', 'life', 'profile'];
function uimOn() {
  if (typeof document === 'undefined' || !document.body) return false;
  if (typeof OPTS !== 'undefined' && OPTS.motion === false) return false;
  try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false; } catch (e) { }
  return true;
}
const uimFmt = (v, f) => f === 'eur' ? eur(Math.round(v)) : f === 'r' ? dec(v) : f === 'n' ? fnum(Math.round(v)) : String(Math.round(v));
function uimTick(now) {
  UIM.raf = 0;
  for (const [k, a] of UIM.an) {
    const p = clamp((now - a.t0) / a.dur, 0, 1), e = 1 - Math.pow(1 - p, 4), v = a.from + (a.to - a.from) * e;
    if (a.el && a.el.isConnected) a.el.textContent = uimFmt(v, a.f);
    if (p >= 1) { if (a.el) a.el.classList.remove('cup', 'cdn'); UIM.an.delete(k); }
  }
  if (UIM.an.size) UIM.raf = requestAnimationFrame(uimTick);
}
function uiMotion(scope) {
  tvFonts(); if (!uimOn() || typeof UI === 'undefined') return;
  const app = document.getElementById('app'); if (!app) return;
  // 1. changement d'écran / d'onglet
  if (!scope) {
    const view = UI.screen + '/' + (UI.screen === 'game' ? UI.tab + '/' + (UI.sub || '') : '');
    if (view !== UIM.view) {
      const prev = UIM.view; UIM.view = view;
      if (prev != null && !/^(live|loading|splash|intro)\//.test(view)) {
        const [ps, pt, pu] = prev.split('/'), [ns, nt, nu] = view.split('/'); let cls = 'vin-f';
        if (ps === 'game' && ns === 'game') { if (pt !== nt) cls = UIM_TABS.indexOf(nt) > UIM_TABS.indexOf(pt) ? 'vin-r' : 'vin-l'; else cls = nu ? 'vin-r' : 'vin-l'; }
        const main = app.querySelector('main') || app.firstElementChild; if (main) { main.classList.add('vin', cls); setTimeout(() => main.classList.remove('vin', cls), 700); }
        if (ns === 'game' && pt !== nt) { const b = document.querySelector('#nav button.on'); if (b) b.classList.add('pop'); }
      }
      app.querySelectorAll('.bar>i').forEach(el => el.dataset.grow = '1');
    }
  }
  const root = scope || document;
  // 2. compteurs
  root.querySelectorAll('[data-cnt]').forEach(el => {
    const k = el.dataset.ck; if (!k) return; const to = +el.dataset.cnt, f = el.dataset.fmt || 'i', a = UIM.an.get(k);
    if (a && a.to === to) { a.el = el; el.textContent = uimFmt(a.from + (a.to - a.from) * (1 - Math.pow(1 - clamp((performance.now() - a.t0) / a.dur, 0, 1), 4)), f); if (a.cls) el.classList.add(a.cls); return; }
    const old = UIM.cnt.get(k); UIM.cnt.set(k, to);
    let from = old; if (old == null) { if (el.dataset.c0 == null) return; from = +el.dataset.c0; }
    if (from === to || !isFinite(from) || !isFinite(to)) return;
    const dur = Math.min(1400, 500 + Math.abs(Math.log10(Math.abs(to - from) + 1)) * 160), cls = old == null ? '' : to > from ? 'cup' : 'cdn';
    UIM.an.set(k, { el, from, to, f, t0: performance.now(), dur, cls }); if (cls) el.classList.add(cls); el.textContent = uimFmt(from, f);
    if (!UIM.raf) UIM.raf = requestAnimationFrame(uimTick);
  });
  // 3. entrées jouées une seule fois
  root.querySelectorAll('[data-ain]').forEach(el => { const k = el.dataset.ain; if (UIM.seen.has(k)) return; UIM.seen.add(k); el.classList.add('ain'); });
  // 4. jauges
  if (!scope) {
    const bars = app.querySelectorAll('.bar>i'); bars.forEach((el, i) => {
      const k = UIM.view + '#' + i, w = el.style.width, old = UIM.bars.get(k); UIM.bars.set(k, w);
      const from = el.dataset.grow ? '0%' : old != null && old !== w ? old : null; if (from == null || !w) return;
      el.style.transition = 'none'; el.style.width = from; void el.offsetWidth; el.style.transition = 'width .9s cubic-bezier(.2,.8,.2,1) ' + Math.min(.4, i * .04) + 's'; el.style.width = w;
    });
    // la cloche sonne quand un message arrive
    try { const n = typeof unread === 'function' && typeof S !== 'undefined' && S ? unread() : null; if (n != null && UIM.unread != null && n > UIM.unread) { const b = document.querySelector('.top .bell .cnt'); if (b) b.parentElement.classList.add('ring'); } UIM.unread = n; } catch (e) { }
  }
}
// nouvelle fenêtre : ouverture animée (les événements se retournent comme une carte)
function uimModal() {
  if (typeof MODAL === 'undefined') return;
  const ov = document.querySelector('#ov .ov'), md = ov && ov.querySelector('.md');
  if (!MODAL || !md) { UIM.modal = null; return; }
  if (MODAL !== UIM.modal) { const was = UIM.modal; UIM.modal = MODAL; if (uimOn()) { if (!was) ov.classList.add('fresh'); md.classList.add('fresh'); if (/\bevc\b/.test(MODAL.cls || '')) md.classList.add('flip'); } else ov.classList.add('fresh'); }
  uiMotion(md);
}
// ---------- démonstrations (Réglages) : données tirées de la carrière en cours ----------
function mqDemoData(k) {
  const has = typeof S !== 'undefined' && S && S.p, c = has && S.club && S.club.n && !S.club.free ? S.club.n : 'Olympique de Marseille', nm = has ? pName() : 'Ton Joueur', ovr = has ? OVR() : 74, age = has ? S.p.age : 21;
  if (k === 'hwg') return { k, kind: 'pro', from: c === 'Olympique de Marseille' ? 'Stade Rennais' : c, to: c === 'Real Madrid' ? 'FC Barcelone' : 'Real Madrid', fee: typeof marketValue === 'function' ? Math.max(5e6, marketValue(ovr, age)) : 42e6, wage: 95000, until: (has ? S.season : 2026) + 5, name: nm, ppos: has ? S.p.pos : 'AT', ovr, age, lg: 'LaLiga' };
  if (k === 'maillot') return { k, club: c, num: has ? (S.club.num || S.p.favNum || 10) : 10, name: has ? S.p.last : 'Joueur', first: has ? S.p.first : 'Ton' };
  const ss = has && S.ss && S.ss.apps ? S.ss : null, lst = has && S.hist && S.hist.length ? S.hist[S.hist.length - 1] : null;
  return { k: 'recap', s: has ? seasonLabel(S.season) : '2026-27', name: nm, club: c, num: has ? S.club.num : 10, ppos: has ? S.p.pos : 'AT', pos: (lst && lst.pos) || 3, lg: 'Ligue 1', apps: ss ? ss.apps : 34, min: ss ? ss.min : 2870, g: ss ? ss.g : 17, a: ss ? ss.a : 8, avg: ss ? Math.round(ss.rs / ss.apps * 10) / 10 : 7.4, cs: ss ? ss.cs : 0, starts: ss ? ss.starts : 30, cl: ss ? ss.cl : { apps: 8, g: 4 }, best: (ss && ss.best) || { rt: 9.1, g: 3, a: 1, h: c, a2: 'Paris FC', hg: 4, ag: 1, comp: 'Ligue 1', d: '' }, tr: (has ? S.trophies.filter(t => t.s === seasonLabel(S.season - 1)).map(t => t.t) : []).concat([]).slice(0, 3), aw: [], val: typeof marketValue === 'function' ? marketValue(ovr, age) : 3e7, wage: has ? S.club.wage || 0 : 60000, ovr, ovr0: ovr - 3, fol: has ? S.p.followers : 125000 };
}
function mqDemo(k) {
  if (!mqOk() && !(typeof navigator !== 'undefined' && navigator.webdriver)) return toast('Active les grands moments dans les réglages pour les voir.');
  mqPlay(mqDemoData(k), () => { });
}
