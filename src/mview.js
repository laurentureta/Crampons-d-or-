// ===================== AFFICHAGE DU MATCH : Canvas 2D, caméra TV =====================
// Le moteur calcule quelques secondes d'avance et enregistre une image par pas (10/s).
// L'affichage relit ces images avec interpolation : ralenti sur les actions chaudes,
// avance rapide sur les phases calmes et les arrêts de jeu, ralentis (caméra derrière le but),
// arbitre et juges de touche, météo, nocturne, pelouse, fumigènes, VAR.
const LV = { M: null, raf: 0, cv: null, cx: null, w: 0, h: 0, dpr: 1, frames: [], ros: {}, pt: 0, last: 0, spd: 1, cam: { x: 52.5, y: 34, z: 0 }, hl: [], hli: 0, pops: [], replay: null, lastRep: -99, trail: [], lastShow: 0, light: 0, crowd: null, off: false, varOn: null, fx: null, sayT: 0 };
const LV_MULT = [1, 2, 4, 8], LV_RESUME = 4, LV_FIG = 1.3;
const SKIN = ['#f1c9a5', '#e0ac85', '#c48a60', '#9a6643', '#6e4429', '#4d2f1d'];
const hashN = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

function lvReset(M) {
  const E = M.E;
  LV.M = M; LV.frames = [meFrame(E)]; LV.ros = {}; LV.ros[E.rv || 0] = meRoster(E); LV.pt = M.clockAt != null ? Math.min(M.clockAt, E.time) : E.time;
  LV.hl = []; LV.hli = E.ev.length; LV.pops = []; LV.replay = null; LV.repPend = null; if (typeof TV !== 'undefined') TV.goal = TV.wipe = TV.intro = null; LV.lastRep = -99; LV.trail = []; LV.spd = 1; LV.cam.x = clamp(E.ball.x, 20, 85); LV.varOn = null; M.vis = []; M.say = [];
  // décor propre au match : taches de pelouse, fumigènes, gouttes, flocons
  const c = M.cond || {}, sd = c.seed || 1; let r = sd * 9301 + 49297; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const patches = []; if (c.wear > .2) { for (const gx of [3, PL - 3]) for (let i = 0; i < 5; i++) patches.push([gx + (rnd() - .5) * 7, 34 + (rnd() - .5) * 14, 1.5 + rnd() * 3, .5 + rnd() * .5]); for (let i = 0; i < 4; i++) patches.push([52.5 + (rnd() - .5) * 12, 34 + (rnd() - .5) * 12, 1.5 + rnd() * 2.5, .4 + rnd() * .4]); for (let i = 0; i < Math.round(c.wear * 12); i++) patches.push([10 + rnd() * 85, 4 + rnd() * 60, 1 + rnd() * 2.5, .25 + rnd() * .35]); }
  const flares = []; const nf = c.derby ? 7 : c.big && c.att > 30000 ? 2 : 0; for (let i = 0; i < nf; i++) flares.push([rnd(), .35 + rnd() * .55, rnd() < .5 ? '255,70,40' : '255,140,30', rnd() * 6]);
  const drops = []; for (let i = 0; i < (c.snow ? 90 : c.rain ? 110 : 0); i++) drops.push([rnd(), rnd(), .6 + rnd() * .8]);
  LV.fx = { patches, flares, drops, crowdA: clamp((c.att || 20000) / 26000, .12, .7) };
}
function lvRec(E) { LV.frames.push(meFrame(E)); const rv = E.rv || 0; if (!LV.ros[rv]) LV.ros[rv] = meRoster(E); }
// Temps forts à venir (connus grâce à la simulation d'avance) : [début, fin, vitesse]
function lvScanHl(M) {
  const E = M.E;
  for (; LV.hli < E.ev.length; LV.hli++) {
    const e = E.ev[LV.hli]; let a = 0, b = 0, sp = 1;
    if (e.type === 'goal') { a = 8; b = 2; }
    else if (e.type === 'wood' || e.type === 'penalty' || e.type === 'red') { a = 6; b = 2; }
    else if ((e.type === 'save' || e.type === 'miss') && ((e.xg || 0) >= .06 || e.me || e.shMe)) { a = 6; b = 1.5; }
    else if (e.type === 'block' && e.me) { a = 4; b = 1; }
    else if (e.type === 'yellow' && e.me) { a = 3; b = 1; }
    else if (e.type === 'varchk') { a = 0; b = 90; sp = 4; }
    else if (e.type === 'var') { a = 0; b = 3; sp = 2; }
    if (a || b) LV.hl.push([e.t - a, e.t + b, sp]);
  }
}
function lvNextHl(t) { let n = null; for (const h of LV.hl) if (h[0] > t && (n == null || h[0] < n)) n = h[0]; return n; }
function lvHlSpeed(t) { let sp = 0; for (let i = LV.hl.length - 1; i >= 0; i--) { const h = LV.hl[i]; if (t >= h[0] && t <= h[1]) sp = sp ? Math.min(sp, h[2]) : h[2]; if (h[1] < t - 120) break; } return sp; }

// ---------- Boucle ----------
function lvAttach() {
  if (typeof requestAnimationFrame !== 'function' || typeof performance === 'undefined') { LV.off = true; return; }
  if (UI.screen !== 'live' || !S || !S.live) return lvStop();
  const M = S.live.M; if (!M.eng) return;
  if (LV.M !== M) lvReset(M);
  if (LV.d3) lvCanvas(); // remet tout de suite la vue 3D dans la page reconstruite (pas de clignotement)
  if (!LV.raf) { LV.last = performance.now(); LV.raf = requestAnimationFrame(lvFrame); }
}
function lvStop() { const was = !!LV.raf; if (LV.raf) cancelAnimationFrame(LV.raf); LV.raf = 0; if (was && typeof sayStop === 'function') sayStop(); }
function lvCanvas() {
  const cv = document.getElementById('lCan');
  if (!cv) { LV.cv = null; return false; }
  if (cv !== LV.cv) { LV.cv = cv; LV.cx = cv.getContext && cv.getContext('2d'); if (!LV.cx) { LV.off = true; return false; } LV.w = 0; if (typeof geHook === 'function') geHook(cv); }
  // le terrain prend toute la hauteur disponible (3D : jusqu'à un format portrait ; 2D : format télé)
  const stage = cv.closest ? cv.closest('.lstage') : null, sh = stage ? stage.clientHeight : 0, w = cv.clientWidth || 360;
  const maxA = typeof g3On === 'function' && g3On() ? 1.2 : .74, h = Math.round(sh > 40 ? Math.max(Math.min(sh, w * maxA), Math.min(sh, w * .5)) : w * .6), dpr = Math.min(2.5, window.devicePixelRatio || 1);
  if (w !== LV.w || h !== LV.h || dpr !== LV.dpr) { LV.w = w; LV.h = h; LV.dpr = dpr; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + 'px'; }
  // 3D : le canvas WebGL passe sous le canvas 2D, qui ne garde que l'habillage (score, bandeaux, mini-carte)
  const host = cv.parentElement;
  if (typeof g3On === 'function' && g3On() && g3Init()) { if (G3.cv.parentElement !== host) host.insertBefore(G3.cv, cv); host.classList.add('on3d'); g3Size(w, h); LV.d3 = true; }
  else { if (typeof G3 !== 'undefined' && G3.cv && G3.cv.parentElement) G3.cv.remove(); if (host) host.classList.remove('on3d'); LV.d3 = false; }
  return true;
}
function lvFrame(now) {
  LV.raf = 0;
  if (UI.screen !== 'live' || !S || !S.live) return;
  const M = S.live.M; if (!M.eng) return;
  if (LV.M !== M) lvReset(M);
  const dt = Math.min(.25, Math.max(0, (now - LV.last) / 1000)); LV.last = now;
  // habillage télé : entrée des équipes avant le coup d'envoi (le match attend la fin)
  if (!M.tvIn && typeof tvIntroStart === 'function' && LV.pt < 3 && !M.done && String(M.min || '0') === '0' && UI.screen === 'live') tvIntroStart(M);
  const E = M.E, paused = !!(M.press || M.pending || M.half || M.shoot || M.done || UI.mg || (typeof tvIntroBusy === 'function' && tvIntroBusy()));
  const hold = typeof TV !== 'undefined' && !!(TV.goal || LV.repPend); // pendant le bandeau « BUT ! », le direct passe en temps réel
  let rebuild = false;
  if (!paused) {
    // garder de l'avance sur l'affichage
    // petits morceaux de 0,3 s de jeu, avec un budget de quelques millisecondes par image : plus d'à-coup quand le moteur calcule la suite
    const s0 = performance.now(), lead = E.time - LV.pt, budget = lead < 2 ? 60 : lead < 6 ? 7 : 3.5; let g = 0;
    while (M.stopAt == null && !M.done && E.time < LV.pt + 16 && g++ < 400 && (g === 1 || performance.now() - s0 < budget)) liveSim(M, E.time + .3, lvRec);
    lvScanHl(M);
    // ralenti en attente : il démarre derrière le volet (après le bandeau « BUT ! »)
    if (LV.repPend && !LV.replay && now >= LV.repPend.at) { const P_ = LV.repPend; if (!P_.w) { P_.w = 1; if (typeof tvWipe !== 'function' || !tvWipe(P_.rep.col)) { LV.replay = P_.rep; LV.repPend = null; } } else if (!TV.wipe || tvWipeMid()) { LV.replay = P_.rep; LV.repPend = null; } }
    if (LV.replay) {
      const R_ = LV.replay; R_.pt += dt * R_.rate;
      if (R_.pt >= R_.t1 && !R_.out) lvRepOut();
      if (R_.out && (typeof TV === 'undefined' || !TV.wipe || tvWipeMid())) LV.replay = null;
    } else {
      // vitesse choisie = vitesse réelle du jeu (×1 = temps réel) ; « Résumé » = temps forts en temps réel, coupes entre eux
      const mode = UI.lspeed ?? 1; let np;
      if (mode === LV_RESUME) {
        const hs = lvHlSpeed(LV.pt) || (hold ? 1 : 0) || (M.stopAt != null && M.stopAt - LV.pt <= 6.05 ? 1 : 0);
        if (hs) { LV.spd = hs; np = LV.pt + dt * hs; }
        else {
          let nx = lvNextHl(LV.pt), g2 = 0;
          while (nx == null && M.stopAt == null && !M.done && g2++ < 10) { liveSim(M, E.time + 30, lvRec); lvScanHl(M); nx = lvNextHl(LV.pt); if (nx == null) { let c2 = 0; while (c2 < LV.frames.length - 2 && LV.frames[c2][0] < E.time - 20) c2++; if (c2 > 0) LV.frames.splice(0, c2); } }
          const tgt = nx != null ? nx : M.stopAt != null ? M.stopAt - 6 : E.time;
          np = Math.max(LV.pt + dt, tgt); LV.spd = 1; if (np - LV.pt > 3) { LV.cut = now; LV.cutFrom = M.min; }
        }
      } else { LV.spd = hold ? Math.min(1, LV_MULT[mode] || 2) : LV_MULT[mode] || 2; np = LV.pt + dt * LV.spd; }
      const lim = M.stopAt != null ? M.stopAt : E.time;
      if (np > lim) np = lim;
      LV.pt = np;
      if (liveAt(M, LV.pt, now / 1000)) rebuild = true;
      lvVis(M);
      // le ballon quitte le pied d'un joueur : petit bruit de frappe (pack de bruitages)
      if (AU.gen && AU.gen.kick && !LV.replay) { const f = lvAt(LV.pt); if (f) { const o = f[6] >= 0 ? f[6] + ':' + f[7] : ''; if (LV.own && o !== LV.own && !f[9] && now - (LV.kickT || 0) > 280) { sfxG('kick', .3); LV.kickT = now; } LV.own = o; } }
    }
    // élaguer les vieilles images (on garde de quoi rejouer une action)
    const keep = Math.min(LV.pt - 14, LV.repPend ? LV.repPend.rep.pt - 1 : Infinity); let cut = 0; while (cut < LV.frames.length - 2 && LV.frames[cut][0] < keep) cut++;
    if (cut > 40) LV.frames.splice(0, cut);
  }
  if (lvCanvas()) lvDraw(M, LV.replay ? LV.replay.pt : LV.pt, dt, paused);
  if (M.sfx && M.sfx.length) sfxDrain(M);
  if (UI.gest && typeof geTick === 'function') geTick(M, now);
  // pendant les pauses et les ralentis, le temps du match est figé mais les commentateurs continuent (temps réel)
  if ((paused || LV.replay) && M.com && typeof comTick === 'function') comTick(M, M.clockAt ?? LV.pt, now / 1000);
  if (rebuild) { save(); render(); }
  else if (now - LV.light > 180) { LV.light = now; liveLight(); }
  if (M.last && !paused && now - LV.lastShow > 4500 && LV.lastShow) { M.last = null; LV.lastShow = 0; render(); }
  if (M.last && !LV.lastShow) LV.lastShow = now;
  if (!LV.raf) LV.raf = requestAnimationFrame(lvFrame);
}
// Événements visuels : bandeaux, ralentis, VAR
function lvVis(M) {
  const V = M.vis; if (!V || !V.length) return;
  const rep = (typeof OPTS !== 'undefined' && OPTS.replay) || 'all';
  for (const v of V.splice(0)) {
    if (v.k === 'varchk') { LV.varOn = { at: performance.now() }; continue; }
    if (v.k === 'var') LV.varOn = null;
    const T = { goal: v.mine ? 'BUT !' : 'BUT', save: 'ARRÊT !', miss: 'À CÔTÉ', wood: v.bar ? 'LA BARRE !' : 'POTEAU !', block: 'CONTRÉ', pen: 'PENALTY !', yellow: 'CARTON JAUNE', red: 'CARTON ROUGE', off: 'HORS-JEU', corner: 'CORNER', adv: 'AVANTAGE', var: v.what === 'goal' ? (v.ok ? 'BUT VALIDÉ' : 'BUT REFUSÉ') : v.award ? 'PENALTY ACCORDÉ' : v.ok ? 'PENALTY CONFIRMÉ' : 'PAS DE PENALTY' }[v.k];
    if (!T) continue;
    // bruits du ballon (pack de bruitages) : filet, poteau, arrêt, frappe
    if (typeof sfxG === 'function') { const B = { goal: 'net', wood: 'post', save: 'catch', miss: 'shot', block: 'kick' }[v.k]; if (B) { if (v.k === 'goal') sfxG('shot', .75); sfxG(B, v.k === 'block' ? .6 : .95, v.k === 'goal' ? .12 : 0); } }
    const big = v.k === 'goal' || v.k === 'pen' || v.k === 'red' || v.k === 'wood' || v.k === 'var';
    if ((v.k === 'corner' || v.k === 'adv') && !lvHlSpeed(LV.pt)) continue;
    const tvG = v.k === 'goal' && typeof tvOn === 'function' && tvOn();
    if (tvG) tvGoalStart(v, M); else LV.pops.push({ t: T, at: performance.now(), dur: big ? 2400 : 1300, big, col: v.k === 'goal' ? (v.mine ? '#f5c542' : '#e6e6e6') : v.k === 'yellow' ? '#f5c542' : v.k === 'red' || (v.k === 'var' && !v.ok) ? '#e5484d' : v.k === 'var' ? '#4fd28f' : '#ffffff' });
    // ralentis : buts toujours, autres grosses actions selon l'option
    const want = rep !== 'none' && (v.k === 'goal' || (rep === 'all' && (v.k === 'wood' || (v.k === 'save' && ((v.xg || 0) >= .15 || v.me)) || (v.k === 'miss' && (v.xg || 0) >= .3) || (v.k === 'pen' && v.me))));
    if (want && LV.frames.length && LV.frames[0][0] < v.t - 4.5 && (v.k === 'goal' || v.t - LV.lastRep > 20)) {
      const fe = lvAt(v.t), ex = fe ? (fe[2] === 2 ? PL - fe[3] : fe[3]) : 80, ey = fe ? (fe[2] === 2 ? PW - fe[4] : fe[4]) : 34;
      const rep_ = { pt: v.t - (v.k === 'pen' ? 3 : 5.5), t1: v.t + .8, rate: v.k === 'goal' ? .5 : .6, cam: v.k === 'pen' ? 'side' : 'goal', cam3: v.k === 'goal' ? 'cine' : 'goal', end: ex > 52.5 ? 1 : -1, ey, lab: v.k === 'goal' ? 'RALENTI' : v.k === 'wood' ? 'POTEAU · RALENTI' : v.k === 'save' ? 'L\'ARRÊT · RALENTI' : 'RALENTI', col: M.E && M.E.T ? M.E.T[v.mine ? 0 : 1].col : null };
      if (typeof tvOn === 'function' && tvOn()) LV.repPend = { rep: rep_, at: performance.now() + (tvG ? 3300 : 250) }; else LV.replay = rep_;
      LV.lastRep = v.t;
    }
  }
  if (LV.pops.length > 2) LV.pops.splice(0, LV.pops.length - 2);
}
function lvRepOut() { const R_ = LV.replay; if (!R_ || R_.out) return; R_.out = 1; if (typeof tvWipe !== 'function' || !tvWipe(R_.col)) LV.replay = null; }
function lvTap() { if (typeof TV !== 'undefined' && TV.intro) { tvIntroSkip(); return; } if (LV.replay) lvRepOut(); else if (LV.repPend) LV.repPend = null; }

// ---------- Interpolation ----------
function lvAt(t) {
  const F = LV.frames; if (!F.length) return null;
  let lo = 0, hi = F.length - 1;
  if (t <= F[0][0]) return F[0]; if (t >= F[hi][0]) return F[hi];
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (F[m][0] <= t) lo = m; else hi = m; }
  return F[lo];
}
function lvPair(t) {
  const F = LV.frames; if (!F.length) return null;
  let lo = 0, hi = F.length - 1;
  if (t <= F[0][0] || hi === 0) { LV.pi = 0; return [F[0], F[0], 0]; }
  if (t >= F[hi][0]) { LV.pi = hi; return [F[hi], F[hi], 0]; }
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (F[m][0] <= t) lo = m; else hi = m; }
  LV.pi = lo; const a = F[lo], b = F[hi]; return [a, b, clamp((t - a[0]) / Math.max(1e-6, b[0] - a[0]), 0, 1)];
}

// ---------- Caméras ----------
// « side » : caméra principale en tribune ; « goal » : derrière un but (ralentis).
function lvCamera(mode, w, h, cam, end) {
  if (mode === 'goal') {
    const D1 = 21, far = 62, F = w * (D1 + 16) / 44, FH = h * .78 / (1 / D1 - 1 / (D1 + far)), cy = h * .2 - FH / (D1 + far), H = FH / F;
    const dep = end > 0 ? (x => PL + D1 - x) : (x => x + D1), lat = end > 0 ? (y => cam.y - y) : (y => y - cam.y);
    return { P: (x, y, z) => { const d = Math.max(1, dep(x)), s = F / d; return [w / 2 + lat(y) * s, cy + (H - (z || 0)) * s, s]; }, depth: (x, y) => dep(x), farY: cy + FH / (PL + D1 + 6), nearGoal: end > 0 ? 1 : 0 };
  }
  const D0 = 95, F = w * (PW / 2 + D0) / cam.z, FH = h * .8 / (1 / D0 - 1 / (PW + D0)), cy = h * .17 - FH / (PW + D0), H = FH / F;
  return { P: (x, y, z) => { const d = PW - y + D0, s = F / d; return [w / 2 + (x - cam.x) * s, cy + (H - (z || 0)) * s, s]; }, depth: (x, y) => PW - y + D0, farY: cy + FH / (PW + D0), nearGoal: -1 };
}

// ---------- Dessin ----------
function lvDraw(M, t, dt, paused) {
  if (LV.d3) { let ok = false; try { ok = g3Draw(M, t, dt, paused); } catch (e) { G3.fail = true; if (typeof console !== 'undefined') console.warn('3D désactivée :', e && e.message); } if (ok) return lvOverlay(M, t); }
  if (LV.d3) { LV.d3 = false; if (G3.cv && G3.cv.parentElement) { G3.cv.parentElement.classList.remove('on3d'); G3.cv.remove(); } }
  return lvDraw2D(M, t, dt, paused);
}
// habillage par-dessus la 3D : repère de ton joueur, nom du porteur, mini-carte, bandeaux
function lvOverlay(M, t) {
  const cx = LV.cx, w = LV.w, h = LV.h, E = M.E, pr = lvPair(t); if (!pr) return;
  const [fa, fb, a] = pr, mir = fa[2] === 2, L = i => fa[i] + (fb[i] - fa[i]) * a;
  cx.setTransform(LV.dpr, 0, 0, LV.dpr, 0, 0); cx.clearRect(0, 0, w, h);
  const ros = LV.ros[fa[8]] || LV.ros[Object.keys(LV.ros).pop()] || meRoster(E), own = fa[6] >= 0 ? [fa[6], fa[7]] : null, slow = LV.replay || LV.spd < 4 || M.pending || M.half;
  for (let kk = 0; kk < 2; kk++) for (let i = 0; i < 11; i++) {
    const r = ros[kk] && ros[kk][i]; if (!r) continue; const isOwn = own && own[0] === kk && own[1] === i; if (!r.me && !(slow && isOwn)) continue;
    const o = MF_H + (kk * 11 + i) * MF_S; if (fa[o + 2] < .5) continue;
    let x = L(o), y = L(o + 1); if (mir) { x = PL - x; y = PW - y; }
    const [sx, sy, vis] = g3Proj(x, y, 2.25); if (!vis || sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;
    if (r.me) { cx.fillStyle = '#f5c542'; cx.beginPath(); cx.moveTo(sx, sy); cx.lineTo(sx - 5, sy - 8); cx.lineTo(sx + 5, sy - 8); cx.closePath(); cx.fill(); }
    if (slow && isOwn && r.n) { const txt = r.me ? 'Toi' : r.n.split(' ').slice(-1)[0]; cx.font = '600 9px system-ui, sans-serif'; const tw = cx.measureText(txt).width, yy = sy - (r.me ? 16 : 6); cx.fillStyle = 'rgba(8,10,14,.72)'; cx.fillRect(sx - tw / 2 - 3, yy - 6, tw + 6, 12); cx.fillStyle = r.me ? '#f5c542' : '#fff'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(txt, sx, yy); cx.textAlign = 'left'; }
  }
  // vue tactique : dispositif et attitude de chaque équipe
  if ((OPTS.cam || 'tv') === 'tac' && !LV.replay && fa.length >= MF_N) {
    // pions de tableau tactique
    for (let kk = 0; kk < 2; kk++) { cx.fillStyle = E.T[kk].col; for (let i = 0; i < 11; i++) { const o = MF_H + (kk * 11 + i) * MF_S; if (fa[o + 2] < .5) continue; let x = L(o), y = L(o + 1); if (mir) { x = PL - x; y = PW - y; } const [sx, sy, vis] = g3Proj(x, y, 0); if (!vis) continue; cx.beginPath(); cx.arc(sx, sy, 4.2, 0, 7); cx.fill(); cx.strokeStyle = 'rgba(255,255,255,.9)'; cx.lineWidth = 1.2; cx.stroke(); } }
    { let x = L(3), y = L(4); if (mir) { x = PL - x; y = PW - y; } const [sx, sy] = g3Proj(x, y, L(5)); cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(sx, sy, 2.6, 0, 7); cx.fill(); cx.strokeStyle = '#000'; cx.lineWidth = 1; cx.stroke(); }
    cx.font = '700 10px system-ui, sans-serif'; cx.textBaseline = 'middle';
    for (let k = 0; k < 2; k++) { const o = MF_T + k * 6, mood = fa[o + 3], form = FORM_N[FORM_K[fa[o + 4]]] || '', pr = fa[o + 5], att = mood > 0 ? 'tout le monde monte' : mood < 0 ? 'gère le score' : pr > .6 ? 'pressing haut' : pr < .15 ? 'bloc bas' : 'bloc médian', nm = String((k === 0 ? M.my : M.op) || ''), txt = (nm.length > 18 ? nm.slice(0, 17) + '…' : nm) + ' · ' + form + ' · ' + att, tw = cx.measureText(txt).width, y = 40 + k * 18;
      cx.fillStyle = 'rgba(8,10,14,.72)'; cx.fillRect(8, y - 8, tw + 18, 16); cx.fillStyle = E.T[k].col; cx.fillRect(12, y - 4, 6, 8); cx.fillStyle = '#fff'; cx.fillText(txt, 22, y); }
  }
  lvHud(cx, w, h, E, fa, own, M.cond || {});
  if (UI.gest && typeof geDraw === 'function') geDraw(cx, M);
}
function lvDraw2D(M, t, dt, paused) {
  const cx = LV.cx, w = LV.w, h = LV.h, E = M.E, C = M.cond || {}, FX = LV.fx || { patches: [], flares: [], drops: [], crowdA: .5 };
  const pr = lvPair(t); if (!pr) return;
  const [fa, fb, a] = pr, L = (i) => fa[i] + (fb[i] - fa[i]) * a;
  const half = fa[2], mir = half === 2;
  const X = x => mir ? PL - x : x, Y = y => mir ? PW - y : y;
  const bx = X(L(3)), by = Y(L(4)), bz = L(5), now = performance.now();
  cx.setTransform(LV.dpr, 0, 0, LV.dpr, 0, 0);
  // caméra : suit le ballon, zoom selon le rythme
  const RP = LV.replay, mode = RP ? RP.cam : 'side';
  const fast = !RP && LV.spd > 6, zoomW = RP ? 24 : paused ? 30 : fast ? 44 : 34;
  const k = 1 - Math.exp(-dt * (RP ? 2 : 2.4 + Math.min(10, LV.spd / 3)));
  LV.cam.z = LV.cam.z ? LV.cam.z + (zoomW - LV.cam.z) * Math.min(1, dt * 1.5) : zoomW;
  const hz = LV.cam.z / 2, txc = clamp(bx, hz - 6, PL - hz + 6);
  LV.cam.x = LV.cam.x + (txc - LV.cam.x) * (paused ? 1 : k);
  LV.cam.y = RP && RP.cam === 'goal' ? LV.cam.y + (clamp(by, 20, 48) - LV.cam.y) * Math.min(1, dt * 2) : 34;
  const CAM = lvCamera(mode, w, h, LV.cam, RP ? RP.end : 1), P = CAM.P;
  // fond (abords du terrain), ciel et tribunes
  cx.fillStyle = C.snow ? '#b9c3c6' : '#1f5a2b'; cx.fillRect(0, 0, w, h);
  const yFar = clamp(CAM.farY, 10, h * .5);
  const g1 = cx.createLinearGradient(0, 0, 0, yFar);
  if (C.night) { g1.addColorStop(0, '#03050a'); g1.addColorStop(1, '#101724'); } else { g1.addColorStop(0, C.rain || C.snow ? '#3b4350' : '#4d6f93'); g1.addColorStop(.35, '#1b2230'); g1.addColorStop(1, '#232b3a'); }
  cx.fillStyle = g1; cx.fillRect(0, 0, w, yFar);
  lvCrowd(cx, w, yFar, mode === 'goal' ? LV.cam.y * 4 : LV.cam.x, FX.crowdA * (C.night ? .8 : 1));
  if (C.night) lvFloodlights(cx, w, yFar);
  lvFlares(cx, w, yFar, FX.flares, now);
  // panneaux publicitaires
  const adY = yFar - 7;
  cx.fillStyle = C.night ? '#063126' : '#0b3d2e'; cx.fillRect(0, adY, w, 6);
  cx.fillStyle = C.night ? 'rgba(255,214,102,.98)' : 'rgba(245,197,66,.85)'; cx.font = '700 5px system-ui, sans-serif'; cx.textBaseline = 'middle';
  const scroll = mode === 'goal' ? LV.cam.y * 6 : LV.cam.x * 3;
  for (let i = -2; i < 14; i++) { const x0 = ((i * 60 - scroll) % 720 + 720) % 720 - 60; cx.fillText(i % 2 ? 'CRAMPONS D\'OR' : 'LIGUE DES RÊVES', x0, adY + 3); }
  // pelouse : bandes tondues
  const strip = PL / 18, gA = C.snow ? ['#c9d3d6', '#d3dcdf'] : C.rain ? ['#2a7234', '#2f7c3a'] : ['#2f7d3b', '#358a42'];
  for (let i = 0; i < 18; i++) {
    const x0 = i * strip - (i === 0 ? 4 : 0), x1 = (i + 1) * strip + (i === 17 ? 4 : 0);
    const p1 = P(x0, -2), p2 = P(x1, -2), p3 = P(x1, PW + 3), p4 = P(x0, PW + 3);
    cx.fillStyle = gA[i % 2];
    cx.beginPath(); cx.moveTo(p1[0], p1[1]); cx.lineTo(p2[0], p2[1]); cx.lineTo(p3[0], p3[1]); cx.lineTo(p4[0], p4[1]); cx.closePath(); cx.fill();
  }
  // pelouse abîmée
  if (FX.patches.length) for (const [px, py, r, al] of FX.patches) { const q = P(X(px), Y(py), 0); cx.fillStyle = `rgba(${C.snow ? '120,110,95' : '112,86,48'},${al * clamp(C.wear || .3, .3, 1) * .7})`; cx.beginPath(); cx.ellipse(q[0], q[1], r * q[2], r * q[2] * (mode === 'goal' ? .45 : .32), 0, 0, Math.PI * 2); cx.fill(); }
  // lignes
  cx.strokeStyle = C.snow ? 'rgba(40,90,170,.75)' : 'rgba(255,255,255,.82)'; cx.lineWidth = 1.2; cx.lineCap = 'round';
  const line = pts => { cx.beginPath(); pts.forEach(([x, y], i) => { const p = P(x, y); i ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1]); }); cx.stroke(); };
  const arc = (ox, oy, r, a0, a1, n) => { const pts = []; for (let i = 0; i <= n; i++) { const an = a0 + (a1 - a0) * i / n; pts.push([ox + Math.cos(an) * r, oy + Math.sin(an) * r]); } line(pts); };
  line([[0, 0], [PL, 0], [PL, PW], [0, PW], [0, 0]]); line([[52.5, 0], [52.5, PW]]); arc(52.5, 34, 9.15, 0, Math.PI * 2, 40);
  for (const s of [0, 1]) {
    const x0 = s ? PL : 0, d = s ? -1 : 1;
    line([[x0, 13.84], [x0 + d * 16.5, 13.84], [x0 + d * 16.5, 54.16], [x0, 54.16]]);
    line([[x0, 24.84], [x0 + d * 5.5, 24.84], [x0 + d * 5.5, 43.16], [x0, 43.16]]);
    const ps = P(x0 + d * 11, 34); cx.fillStyle = cx.strokeStyle; cx.fillRect(ps[0] - 1, ps[1] - .6, 2, 1.2);
    const a0 = Math.acos(5.5 / 9.15); arc(x0 + d * 11, 34, 9.15, s ? Math.PI - a0 : -a0, s ? Math.PI + a0 : a0, 14);
  }
  const cs = P(52.5, 34); cx.fillRect(cs[0] - 1, cs[1] - .6, 2, 1.2);
  // reflets de pluie / éclairage nocturne sur la pelouse
  if (C.rain) { const sh = cx.createLinearGradient(0, yFar, 0, h); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.5, 'rgba(200,220,255,.07)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = sh; cx.fillRect(0, yFar, w, h - yFar); }
  // buts du fond
  for (const s of [0, 1]) if (s !== CAM.nearGoal) lvGoal(P, cx, s);
  // joueurs, arbitres et ballon, triés du fond vers l'avant
  const ros = LV.ros[fa[8]] || LV.ros[Object.keys(LV.ros).pop()] || meRoster(E);
  const items = [];
  for (let kk = 0; kk < 2; kk++) for (let i = 0; i < 11; i++) {
    const o = MF_H + (kk * 11 + i) * MF_S; if (fa[o + 2] < .5 && fb[o + 2] < .5) continue;
    const x = X(fa[o] + (fb[o] - fa[o]) * a), y = Y(fa[o + 1] + (fb[o + 1] - fa[o + 1]) * a), v = Math.hypot(fb[o] - fa[o], fb[o + 1] - fa[o + 1]) / Math.max(.05, fb[0] - fa[0]);
    const ac = fa[o + 4], at = t - fa[o + 5];
    items.push({ y, x, kk, i, v, dive: ac === GEST.DIVE && at >= 0 && at < 1.4, r: ros[kk] && ros[kk][i], d: CAM.depth(x, y) });
  }
  if (fa.length >= MF_N) {
    const rx = X(L(MF_R)), ry = Y(L(MF_R + 1)), rv = Math.hypot(fb[MF_R] - fa[MF_R], fb[MF_R + 1] - fa[MF_R + 1]) / Math.max(.05, fb[0] - fa[0]);
    items.push({ x: rx, y: ry, i: 30, v: rv, ref: '#1b1b1f', d: CAM.depth(rx, ry) });
    const l1 = X(L(MF_R + 5)), l2 = X(L(MF_R + 7)), y1 = Y(-1.2), y2 = Y(PW + 1.2);
    items.push({ x: l1, y: y1, i: 31, v: 2, ref: '#e7f23a', flag: true, d: CAM.depth(l1, y1) }, { x: l2, y: y2, i: 32, v: 2, ref: '#e7f23a', flag: true, d: CAM.depth(l2, y2) });
  }
  items.push({ y: by, x: bx, ball: true, d: CAM.depth(bx, by) });
  items.sort((p, q) => q.d - p.d);
  const own = fa[6] >= 0 ? [fa[6], fa[7]] : null, slow = RP || LV.spd < 4 || paused;
  { const q = lvPair(t - .22); LV.trail = []; if (q && q[0][2] === half) { const [qa, qb, qf] = q, Lq = i => qa[i] + (qb[i] - qa[i]) * qf; LV.trail = [[X(Lq(3)), Y(Lq(4)), Lq(5)], 0, 0]; } }
  for (const it of items) {
    if (it.ball) { lvBall(cx, P, bx, by, bz, C.snow); continue; }
    if (it.ref) { lvPlayer(cx, P, it, it.ref, '#111', { n: it.i === 30 ? 'Arbitre' : 'Assistant' }, t, C.night); if (it.flag) lvFlag(cx, P, it); continue; }
    const T = E.T[it.kk], r = it.r || {}, col = r.gk ? T.gkc : T.col, sh = r.gk ? '#222' : T.col2;
    lvPlayer(cx, P, it, col, sh, r, t, C.night);
    if (r.me) lvMe(cx, P, it);
    if (slow && own && own[0] === it.kk && own[1] === it.i && r.n) lvLabel(cx, P, it, r.me ? 'Toi' : r.n.split(' ').slice(-1)[0], r.me);
  }
  if (CAM.nearGoal >= 0) lvGoal(P, cx, CAM.nearGoal);
  // nuit : halo des projecteurs ; météo par-dessus
  if (C.night) { const vg = cx.createRadialGradient(w / 2, h * .62, h * .2, w / 2, h * .62, w * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,4,12,.42)'); cx.fillStyle = vg; cx.fillRect(0, yFar, w, h - yFar); }
  if (FX.drops.length) lvWeather(cx, w, h, FX.drops, now, C.snow);
  lvHud(cx, w, h, E, fa, own, C);
}
function lvCrowd(cx, w, yFar, camX, al) {
  if (!LV.crowd) { const c = document.createElement('canvas'); c.width = 240; c.height = 60; const g = c.getContext('2d'); for (let i = 0; i < 900; i++) { g.fillStyle = `hsla(${(i * 47) % 360},${20 + (i * 13) % 40}%,${25 + (i * 7) % 35}%,.85)`; g.fillRect((i * 37) % 240, (i * 53) % 60, 2, 2); } LV.crowd = c; }
  const off = ((-camX * 2.2) % 240 + 240) % 240;
  cx.globalAlpha = al; for (let x = off - 240; x < w; x += 240) cx.drawImage(LV.crowd, x, Math.max(0, yFar - 68), 240, Math.min(60, yFar - 8)); cx.globalAlpha = 1;
}
function lvFloodlights(cx, w, yFar) {
  for (const fx of [.08, .36, .64, .92]) {
    const x = w * fx, y = Math.max(6, yFar * .22), g = cx.createRadialGradient(x, y, 0, x, y, w * .22);
    g.addColorStop(0, 'rgba(255,250,225,.95)'); g.addColorStop(.06, 'rgba(255,245,210,.55)'); g.addColorStop(.3, 'rgba(255,240,200,.12)'); g.addColorStop(1, 'rgba(255,240,200,0)');
    cx.fillStyle = g; cx.fillRect(x - w * .22, 0, w * .44, yFar + 10);
    cx.fillStyle = 'rgba(255,255,240,.95)'; for (let i = -2; i <= 2; i++) cx.fillRect(x + i * 3 - 1, y - 2, 2, 3);
  }
}
function lvFlares(cx, w, yFar, flares, now) {
  for (const [fx, fy, col, ph] of flares) {
    const x = fx * w, y = fy * yFar, fl = .7 + .3 * Math.sin(now / 90 + ph * 7) * Math.sin(now / 37 + ph);
    const g = cx.createRadialGradient(x, y, 0, x, y, 16 * fl); g.addColorStop(0, `rgba(${col},.95)`); g.addColorStop(.35, `rgba(${col},.45)`); g.addColorStop(1, `rgba(${col},0)`);
    cx.fillStyle = g; cx.fillRect(x - 18, y - 18, 36, 36);
    for (let i = 0; i < 4; i++) { const sy = y - ((now / 40 + i * 25 + ph * 20) % 60), al = .18 * (1 - ((now / 40 + i * 25 + ph * 20) % 60) / 60); cx.fillStyle = `rgba(190,190,195,${al})`; cx.beginPath(); cx.arc(x + Math.sin(now / 700 + i) * 6, Math.max(0, sy), 7 + i * 2, 0, Math.PI * 2); cx.fill(); }
  }
}
function lvWeather(cx, w, h, drops, now, snow) {
  if (snow) { cx.fillStyle = 'rgba(255,255,255,.85)'; for (const [dx, dy, sp] of drops) { const y = ((dy * h + now * .03 * sp) % h), x = (dx * w + Math.sin(now / 900 + dx * 20) * 8 + now * .006) % w; cx.beginPath(); cx.arc(x, y, 1 + sp * .8, 0, Math.PI * 2); cx.fill(); } return; }
  cx.strokeStyle = 'rgba(200,215,235,.35)'; cx.lineWidth = 1; cx.beginPath();
  for (const [dx, dy, sp] of drops) { const y = (dy * h + now * .55 * sp) % h, x = (dx * w + now * .12 * sp) % w; cx.moveTo(x, y); cx.lineTo(x - 2.5 * sp, y - 9 * sp); }
  cx.stroke();
}
function lvGoal(P, cx, s) {
  const x0 = s ? PL : 0, d = s ? 1 : -1, y1 = 30.34, y2 = 37.66, gh = 2.44, dep = 1.8;
  const a = P(x0, y1, 0), b = P(x0, y2, 0), at = P(x0, y1, gh), bt = P(x0, y2, gh), ab = P(x0 + d * dep, y1, 0), bb = P(x0 + d * dep, y2, 0), abt = P(x0 + d * dep, y1, gh * .8), bbt = P(x0 + d * dep, y2, gh * .8);
  cx.fillStyle = 'rgba(255,255,255,.08)'; cx.beginPath(); cx.moveTo(at[0], at[1]); cx.lineTo(bt[0], bt[1]); cx.lineTo(bbt[0], bbt[1]); cx.lineTo(abt[0], abt[1]); cx.closePath(); cx.fill();
  cx.strokeStyle = 'rgba(255,255,255,.28)'; cx.lineWidth = .6;
  for (let i = 1; i < 6; i++) { const f = i / 6, p = [at[0] + (bt[0] - at[0]) * f, at[1] + (bt[1] - at[1]) * f], q = [abt[0] + (bbt[0] - abt[0]) * f, abt[1] + (bbt[1] - abt[1]) * f]; cx.beginPath(); cx.moveTo(p[0], p[1]); cx.lineTo(q[0], q[1]); cx.stroke(); }
  for (let i = 1; i < 4; i++) { const f = i / 4, p = [a[0] + (at[0] - a[0]) * f, a[1] + (at[1] - a[1]) * f], q = [b[0] + (bt[0] - b[0]) * f, b[1] + (bt[1] - b[1]) * f]; cx.beginPath(); cx.moveTo(p[0], p[1]); cx.lineTo(q[0], q[1]); cx.stroke(); }
  cx.beginPath(); cx.moveTo(abt[0], abt[1]); cx.lineTo(ab[0], ab[1]); cx.moveTo(bbt[0], bbt[1]); cx.lineTo(bb[0], bb[1]); cx.moveTo(at[0], at[1]); cx.lineTo(abt[0], abt[1]); cx.moveTo(bt[0], bt[1]); cx.lineTo(bbt[0], bbt[1]); cx.stroke();
  cx.strokeStyle = '#f4f4f4'; cx.lineWidth = Math.max(1.4, a[2] * .12);
  cx.beginPath(); cx.moveTo(a[0], a[1]); cx.lineTo(at[0], at[1]); cx.lineTo(bt[0], bt[1]); cx.lineTo(b[0], b[1]); cx.stroke();
}
function lvPlayer(cx, P, it, col, sh, r, t, night) {
  const [sx, sy, s0] = P(it.x, it.y, 0), s = s0 * LV_FIG, skin = SKIN[hashN(r.n || 'x') % SKIN.length];
  if (night) { cx.fillStyle = 'rgba(0,0,0,.13)'; for (const [ox, oy] of [[.45, .1], [-.45, .1], [.3, -.08], [-.3, -.08]]) { cx.beginPath(); cx.ellipse(sx + s * ox, sy + s * oy * .3, s * .42, s * .1, ox * .5, 0, Math.PI * 2); cx.fill(); } }
  else { cx.fillStyle = 'rgba(0,0,0,.28)'; cx.beginPath(); cx.ellipse(sx + s * .18, sy, s * .42, s * .13, 0, 0, Math.PI * 2); cx.fill(); }
  if (it.dive) {
    cx.save(); cx.translate(sx, sy - s * .5); cx.rotate(it.x < 52.5 === (it.y < 34) ? -1.2 : 1.2);
    cx.fillStyle = col; cx.fillRect(-s * .25, -s * .7, s * .5, s * .8); cx.fillStyle = skin; cx.beginPath(); cx.arc(0, -s * .85, s * .15, 0, 7); cx.fill(); cx.restore(); return;
  }
  const run = Math.min(1, it.v / 6), ph = (t * 9 + it.i * 1.3) % (Math.PI * 2), sw = Math.sin(ph) * s * .22 * run;
  cx.strokeStyle = skin; cx.lineWidth = Math.max(1, s * .13);
  cx.beginPath(); cx.moveTo(sx - s * .08, sy - s * .8); cx.lineTo(sx - s * .08 + sw, sy - s * .04); cx.moveTo(sx + s * .08, sy - s * .8); cx.lineTo(sx + s * .08 - sw, sy - s * .04); cx.stroke();
  cx.fillStyle = sh; cx.fillRect(sx - s * .22, sy - s * 1.02, s * .44, s * .26);
  cx.fillStyle = col; const tw = s * .5; cx.beginPath(); cx.moveTo(sx - tw / 2, sy - s * .98); cx.lineTo(sx - tw / 2 - s * .05, sy - s * 1.5); cx.lineTo(sx + tw / 2 + s * .05, sy - s * 1.5); cx.lineTo(sx + tw / 2, sy - s * .98); cx.closePath(); cx.fill();
  cx.strokeStyle = col; cx.lineWidth = Math.max(1, s * .11); cx.beginPath(); cx.moveTo(sx - tw / 2, sy - s * 1.42); cx.lineTo(sx - tw / 2 - s * .1 - sw * .4, sy - s * 1.05); cx.moveTo(sx + tw / 2, sy - s * 1.42); cx.lineTo(sx + tw / 2 + s * .1 + sw * .4, sy - s * 1.05); cx.stroke();
  cx.fillStyle = skin; cx.beginPath(); cx.arc(sx, sy - s * 1.66, s * .15, 0, Math.PI * 2); cx.fill();
  cx.fillStyle = 'rgba(20,14,10,.85)'; cx.beginPath(); cx.arc(sx, sy - s * 1.71, s * .15, Math.PI, 0); cx.fill();
}
function lvFlag(cx, P, it) {
  const [sx, sy, s0] = P(it.x, it.y, 0), s = s0 * LV_FIG;
  cx.strokeStyle = '#ddd'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(sx + s * .3, sy - s * 1.1); cx.lineTo(sx + s * .3, sy - s * 1.75); cx.stroke();
  cx.fillStyle = '#ff9a1f'; cx.fillRect(sx + s * .3, sy - s * 1.75, s * .28, s * .2); cx.fillStyle = '#ffe14d'; cx.fillRect(sx + s * .3, sy - s * 1.65, s * .28, s * .1);
}
function lvMe(cx, P, it) {
  const [sx, sy, s0] = P(it.x, it.y, 0), s = s0 * LV_FIG;
  cx.strokeStyle = '#f5c542'; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(sx, sy, s * .55, s * .18, 0, 0, Math.PI * 2); cx.stroke();
  cx.fillStyle = '#f5c542'; cx.beginPath(); cx.moveTo(sx, sy - s * 1.95); cx.lineTo(sx - 4, sy - s * 1.95 - 6); cx.lineTo(sx + 4, sy - s * 1.95 - 6); cx.closePath(); cx.fill();
}
function lvLabel(cx, P, it, txt, me) {
  const [sx, sy, s0] = P(it.x, it.y, 0), s = s0 * LV_FIG;
  cx.font = '600 9px system-ui, sans-serif'; const tw = cx.measureText(txt).width, y = sy - s * 1.95 - (me ? 16 : 8);
  cx.fillStyle = 'rgba(8,10,14,.72)'; cx.fillRect(sx - tw / 2 - 3, y - 6, tw + 6, 12);
  cx.fillStyle = me ? '#f5c542' : '#fff'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(txt, sx, y); cx.textAlign = 'left';
}
function lvBall(cx, P, x, y, z, snow) {
  const g = P(x, y, 0), b = P(x, y, z * LV_FIG + .14), r = Math.max(2.4, g[2] * .2);
  const T = LV.trail; if (T.length > 2) { const p0 = T[0]; const dd = Math.hypot(x - p0[0], y - p0[1]); if (dd > 3.2 && dd < 12) { const q = P(p0[0], p0[1], p0[2] * LV_FIG + .14); const gr = cx.createLinearGradient(q[0], q[1], b[0], b[1]); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.55)'); cx.strokeStyle = gr; cx.lineWidth = r * 1.3; cx.beginPath(); cx.moveTo(q[0], q[1]); cx.lineTo(b[0], b[1]); cx.stroke(); } }
  cx.fillStyle = `rgba(0,0,0,${clamp(.35 - z * .04, .08, .35)})`; cx.beginPath(); cx.ellipse(g[0], g[1], r * (1 + z * .08), r * .45, 0, 0, Math.PI * 2); cx.fill();
  cx.fillStyle = snow ? '#ff8a1c' : '#fff'; cx.strokeStyle = '#222'; cx.lineWidth = .8; cx.beginPath(); cx.arc(b[0], b[1], r, 0, Math.PI * 2); cx.fill(); cx.stroke();
  cx.fillStyle = snow ? '#7a3500' : '#333'; cx.beginPath(); cx.arc(b[0] - r * .25, b[1] - r * .2, r * .32, 0, Math.PI * 2); cx.fill();
}
function lvHud(cx, w, h, E, fa, own, C) {
  const now = performance.now();
  // mini-carte (pas pendant les ralentis)
  if (!LV.replay) {
    const mw = Math.round(w * .2), mh = Math.round(mw * PW / PL), mx = w - mw - 6, my = h - mh - 6, mir = fa[2] === 2;
    cx.fillStyle = 'rgba(10,30,18,.72)'; cx.fillRect(mx, my, mw, mh); cx.strokeStyle = 'rgba(255,255,255,.45)'; cx.lineWidth = .7; cx.strokeRect(mx + .5, my + .5, mw - 1, mh - 1); cx.beginPath(); cx.moveTo(mx + mw / 2, my); cx.lineTo(mx + mw / 2, my + mh); cx.stroke();
    for (let kk = 0; kk < 2; kk++) { cx.fillStyle = E.T[kk].col; for (let i = 0; i < 11; i++) { const o = MF_H + (kk * 11 + i) * MF_S; if (fa[o + 2] < .5) continue; const x = mir ? PL - fa[o] : fa[o], y = mir ? PW - fa[o + 1] : fa[o + 1]; cx.fillRect(mx + x / PL * mw - 1.2, my + y / PW * mh - 1.2, 2.4, 2.4); } }
    const bxm = mir ? PL - fa[3] : fa[3], bym = mir ? PW - fa[4] : fa[4]; cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(mx + bxm / PL * mw, my + bym / PW * mh, 1.8, 0, 7); cx.fill();
    cx.strokeStyle = 'rgba(255,255,255,.7)'; const vx = (LV.cam.x - LV.cam.z / 2) / PL * mw; cx.strokeRect(mx + Math.max(0, vx), my, Math.min(mw, LV.cam.z / PL * mw), mh);
  }
  // coupe (mode résumé) : fondu au noir et minute de reprise
  if (LV.cut && now - LV.cut < 650) { const e = (now - LV.cut) / 650; cx.fillStyle = `rgba(4,6,10,${(1 - e) * .85})`; cx.fillRect(0, 0, w, h); cx.fillStyle = `rgba(255,255,255,${1 - e})`; cx.font = '800 14px system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('▶▶ ' + (LV.M && LV.M.min ? LV.M.min + "'" : ''), w / 2, h / 2); cx.textAlign = 'left'; }
  // rythme, ralenti, VAR
  cx.font = '700 10px system-ui, sans-serif'; cx.textBaseline = 'top';
  if (LV.replay) { const lab = '● ' + (LV.replay.lab || 'RALENTI'), tw = cx.measureText(lab).width; cx.fillStyle = 'rgba(229,72,77,.92)'; cx.fillRect(8, 8, tw + 10, 16); cx.fillStyle = '#fff'; cx.fillText(lab, 13, 11); cx.fillStyle = 'rgba(255,255,255,.75)'; cx.font = '600 9px system-ui, sans-serif'; cx.fillText('Touchez pour passer', 8, h - 16); }
  else { const md = UI.lspeed ?? 1, lab = md === LV_RESUME ? 'RÉSUMÉ' : '×' + (LV_MULT[md] || 2), tw = cx.measureText(lab).width; cx.fillStyle = 'rgba(8,10,14,.6)'; cx.fillRect(8, 8, tw + 12, 16); cx.fillStyle = '#fff'; cx.fillText(lab, 14, 11); }
  if (LV.varOn) { const bl = Math.floor(now / 450) % 2; cx.fillStyle = 'rgba(10,14,24,.85)'; cx.fillRect(w / 2 - 66, 8, 132, 26); cx.strokeStyle = '#70bbff'; cx.lineWidth = 1.2; cx.strokeRect(w / 2 - 66 + .5, 8.5, 131, 25); cx.fillStyle = '#70bbff'; cx.font = '900 13px system-ui, sans-serif'; cx.textAlign = 'center'; cx.fillText('VAR', w / 2 - 38, 14); cx.fillStyle = '#fff'; cx.font = '600 10px system-ui, sans-serif'; cx.fillText(bl ? 'Vérification…' : 'Vérification', w / 2 + 14, 16); cx.textAlign = 'left'; }
  // bandeaux
  LV.pops = LV.pops.filter(p => now - p.at < p.dur);
  LV.pops.forEach((p, n) => {
    const e = (now - p.at) / p.dur, al = e < .12 ? e / .12 : e > .75 ? (1 - e) / .25 : 1, sc = p.big ? 1 + (e < .15 ? (1 - e / .15) * .4 : 0) : 1;
    cx.save(); cx.globalAlpha = clamp(al, 0, 1); cx.translate(w / 2, h * (p.big ? .4 : .24) + (n - LV.pops.length + 1) * (p.big ? 36 : 24)); cx.scale(sc, sc);
    cx.font = `${p.big ? (p.t.length > 12 ? 24 : 34) : 16}px 'Protest Strike', 'Big Shoulders Display', system-ui, sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.lineWidth = p.big ? 5 : 3; cx.strokeStyle = 'rgba(0,0,0,.65)'; cx.strokeText(p.t, 0, 0); cx.fillStyle = p.col; cx.fillText(p.t, 0, 0); cx.restore();
  });
  if (typeof tvDraw === 'function') tvDraw(cx, w, h);
}
