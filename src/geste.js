// ===================== MOMENTS CLÉS JOUÉS AU DOIGT (vue 3D) =====================
// Au moment clé, le match se fige, la caméra se place derrière toi et tu joues au geste, directement sur la scène :
//  · attaque : glisse vers le but pour frapper (là où ton doigt s'arrête = là où part le ballon ; vitesse du geste = puissance ;
//    un geste courbé enroule le ballon) · glisse vers un coéquipier (ou touche-le) pour lui passer · petit coup sec sur le côté,
//    quand le cercle autour du défenseur devient vert, pour le dribbler
//  · défense : glisse vers l'attaquant quand le cercle devient vert pour tacler ; touche ton joueur pour temporiser
//  · gardien : glisse du côté où part le ballon au moment où le cercle touche le ballon ; touche pour rester debout
//  · coups de pied arrêtés : penalty (Panenka : geste lent et court au centre), coup franc (enroule le ballon autour du mur),
//    corner (envoie le ballon sur une zone, ou va reprendre de la tête : choisis ta zone puis saute au bon moment)
// Les probabilités restent celles du moteur (tes qualités, l'adversaire, la fatigue) ; le geste les fait monter ou baisser.
const GE = { pts: null, id: null, cv: null };
const GE_TIME = (typeof window !== 'undefined' && window.__GE_TIME) || 10000; // temps pour jouer une action de jeu (ms) ; ensuite, ton joueur choisit seul
function geOn() { return typeof OPTS === 'undefined' || OPTS.geste !== false; }
function geKind(D) { return D.kind === 'att' ? (D.pen ? 'pen' : D.fk ? 'fk' : 'att') : D.kind === 'corner' ? (D.mode === 'head' ? 'head' : 'corner') : D.kind; }
function geAvail(M) {
  if (!geOn() || !M || M.coach || !M.pending || M.pending.list || !M.E || !M.E.dec || UI.mg) return false;
  if (!LV.d3 || LV.off || typeof g3On !== 'function' || !g3On() || !G3.cam || !G3.w) return false;
  return ['att', 'def', 'gk', 'gkpen', 'corner'].includes(M.E.dec.kind);
}
function geNew(M) {
  const D = M.E.dec, kind = geKind(D), at = a => S.p.at[a] || 60, rel = v => v - (M.opS - 6);
  return { m: M.pending, kind, t0: performance.now() + (kind === 'gk' || kind === 'gkpen' || kind === 'def' ? 450 : 0), /* le cercle part quand la caméra est en place */ dive: wpick([0, 1, 2], d => [.38, .24, .38][d]), sDir: M.pending.sDir != null ? M.pending.sDir : D.sDir,
    T: kind === 'gk' || kind === 'gkpen' ? Math.round(clamp(1250 + rel(at('GAR')) * 8, 900, 1600)) : kind === 'def' ? Math.round(clamp(1500 - rel(at('DEF')) * 6, 1050, 1800)) : kind === 'head' ? 1250 : Math.round(clamp(1450 - rel(at('DRI')) * 6, 1000, 1750)),
    zone: null, t1: 0, msg: '', flash: 0 };
}
// positions de la scène au moment figé (repère du moteur, déjà dans le sens de l'affichage)
function geGeo(M) {
  const pr = lvPair(LV.pt); if (!pr) return null;
  const [fa, fb, a] = pr, mir = fa[2] === 2, L = i => fa[i] + (fb[i] - fa[i]) * a;
  const P = (kk, i) => { const o = MF_H + (kk * 11 + i) * MF_S; let x = L(o), y = L(o + 1); if (mir) { x = PL - x; y = PW - y; } return [x, y, fa[o + 2] >= .5]; };
  let bx = L(3), by = L(4); if (mir) { bx = PL - bx; by = PW - by; }
  // repère d'équipe (u, v) → affichage
  const toD = (k, u, v) => { const [x, y] = glob(k, u, v); return mir ? [PL - x, PW - y] : [x, y]; };
  return { P, ball: [bx, by, L(5)], mir, toD, atkX: mir ? 0 : PL, ownX: mir ? PL : 0 };
}
const geProj = (x, y, z) => g3Proj(x, y, z || 0);
// le but visé à l'écran : coin gauche/droit (à l'écran), haut/bas
function geGoal(Gg, own) {
  const gx = own ? Gg.ownX : Gg.atkX, a = geProj(gx, 34 - GHW, 0), b = geProj(gx, 34 + GHW, 0), at = geProj(gx, 34 - GHW, GH), bt = geProj(gx, 34 + GHW, GH);
  const lft = a[0] <= b[0];
  // y moteur de chaque poteau, pour convertir la visée en repère d'équipe (v)
  const yd = lft ? [34 - GHW, 34 + GHW] : [34 + GHW, 34 - GHW], ye = Gg.mir ? [PW - yd[0], PW - yd[1]] : yd;
  return { L: lft ? a : b, R: lft ? b : a, LT: lft ? at : bt, RT: lft ? bt : at, ye };
}
// visée (point écran) → fractions dans le cadre (u : 0 gauche → 1 droite ; w : 0 bas → 1 barre)
function geAim(Go, x, y) {
  const yb = (Go.L[1] + Go.R[1]) / 2, yt = (Go.LT[1] + Go.RT[1]) / 2, w = (yb - y) / Math.max(8, yb - yt);
  const xl = Go.L[0] + (Go.LT[0] - Go.L[0]) * clamp(w, 0, 1), xr = Go.R[0] + (Go.RT[0] - Go.R[0]) * clamp(w, 0, 1), u = (x - xl) / Math.max(8, xr - xl);
  return { u, w };
}
// cibles du moment (coéquipiers, défenseur, attaquant, zones de corner)
function geTargets(M, G, Gg) {
  const D = M.E.dec, out = [], o = M.pending.o;
  o.forEach((op, i) => {
    if (op.j != null && (op.act === 'pass' || op.act === 'thru' || op.act === 'cross') && G.kind !== 'corner') { const [x, y, on] = Gg.P(D.k, op.j); if (!on) return; const p = geProj(x, y, 1.1); out.push({ i, t: op.act === 'thru' ? 'Profondeur' : op.act === 'cross' ? 'Centre' : 'Passe', n: LN(M.E.T[D.k].pl[op.j].n), x: p[0], y: p[1], vis: p[2] }); }
    if (G.kind === 'corner' || G.kind === 'head') {
      if (op.z != null) { const Z = cornerZones(D.bv)[op.z], [x, y] = Gg.toD(D.k, Z[0], Z[1]), p = geProj(x, y, 0); out.push({ i, zone: op.z, t: ['1er poteau', 'Penalty', '2e poteau'][op.z], n: G.kind === 'corner' && op.j != null ? LN(M.E.T[D.k].pl[op.j].n) : '', x: p[0], y: p[1], vis: p[2] }); }
      else if (op.act === 'pass' && op.j != null) { const [x, y] = Gg.P(D.k, op.j), p = geProj(x, y, 1.1); out.push({ i, t: 'À deux', n: LN(M.E.T[D.k].pl[op.j].n), x: p[0], y: p[1], vis: p[2] }); }
    }
  });
  const w = LV.w || 360, h = LV.h || 400;
  for (const q of out) if (!q.vis || q.x < 14 || q.x > w - 14 || q.y < 26 || q.y > h - 36) { if (!q.vis) { q.x = q.x < w / 2 ? 24 : w - 24; q.y = h - 60; } q.x = clamp(q.x, 22, w - 22); q.y = clamp(q.y, 34, h - 44); q.vis = true; q.edge = true; }
  return out;
}
// ---------- le geste ----------
function gePointer(e) {
  const G = UI.gest; if (!G || G.done || !LV.cv) return;
  const r = LV.cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, t = performance.now();
  if (e.type === 'pointerdown') { GE.pts = [[x, y, t]]; GE.id = e.pointerId; try { LV.cv.setPointerCapture(e.pointerId); } catch (er) { } }
  else if (e.type === 'pointermove') { if (!GE.pts || e.pointerId !== GE.id) return; GE.pts.push([x, y, t]); if (GE.pts.length > 160) GE.pts.splice(1, 1); }
  else { if (!GE.pts) return; GE.pts.push([x, y, t]); const pts = GE.pts; GE.pts = null; try { geGesture(pts); } catch (er) { console.warn('geste', er); } }
  if (e.cancelable) e.preventDefault(); e.stopPropagation();
}
function geHook(cv) {
  if (!cv || cv === GE.cv) return; GE.cv = cv;
  for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) cv.addEventListener(ev, gePointer, { passive: false });
}
// analyse du tracé : départ, arrivée, longueur, vitesse (px/ms), courbure signée (enroulé)
function geShape(pts) {
  const [x0, y0, t0] = pts[0], [x1, y1, t1] = pts[pts.length - 1], dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
  let path = 0, dev = 0; for (let i = 1; i < pts.length; i++) path += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  for (const [x, y] of pts) { const c = ((x - x0) * dy - (y - y0) * dx) / len; if (Math.abs(c) > Math.abs(dev)) dev = c; }
  // vitesse mesurée sur la fin du geste (le doigt qui « frappe »), pas sur l'hésitation du début
  let k = pts.length - 1; while (k > 0 && t1 - pts[k][2] < 110) k--; const vs = Math.hypot(x1 - pts[k][0], y1 - pts[k][1]) / Math.max(16, t1 - pts[k][2]);
  return { x0, y0, x1, y1, dx, dy, len, dur: Math.max(1, t1 - t0), sp: Math.max(vs, path / Math.max(1, t1 - t0)), curl: dev / len, tap: len < 14 && t1 - t0 < 450, t1 };
}
const geNear = (L, x, y, r) => { let b = null, bd = r; for (const q of L) { if (!q.vis) continue; const d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; b = q; } } return b ? Object.assign({ d: bd }, b) : null; };
// phase d'un cercle qui se resserre (0 → 1 par cycle) et qualité du moment (1 = pile quand il devient vert, à .78)
const gePh = (G, t) => ((t - G.t0) % G.T) / G.T, geQ = ph => clamp(1 - Math.abs(ph - .78) / .22, 0, 1);
function geGesture(pts) {
  const M = S.live && S.live.M, G = UI.gest; if (!M || !G || !M.pending) return;
  const D = M.E.dec, Gg = geGeo(M); if (!D || !Gg) return;
  const g = geShape(pts), o = M.pending.o, has = a => o.findIndex(x => x.act === a), T = geTargets(M, G, Gg);
  if (G.kind === 'att' || G.kind === 'fk' || G.kind === 'pen') {
    const Go = geGoal(Gg, false), si = has('shot'), di = has('drib'), A = geAim(Go, g.x1, g.y1);
    const gcx = (Go.L[0] + Go.R[0] + Go.LT[0] + Go.RT[0]) / 4, gcy = (Go.L[1] + Go.R[1] + Go.LT[1] + Go.RT[1]) / 4, ang = (g.dx * (gcx - g.x0) + g.dy * (gcy - g.y0)) / (g.len * (Math.hypot(gcx - g.x0, gcy - g.y0) || 1));
    const shoot = (opt) => geResolve(M, G.kind === 'pen' ? gePenOpt(A, g) : si, geShotG(M, o[si], G, g, A, Go, Gg));
    // 1) le doigt finit dans le cadre (ou juste autour) : frappe
    if (si >= 0 && !g.tap && g.len > 30 && (g.dy < -20 || G.kind === 'pen') && A.u > -.25 && A.u < 1.25 && A.w > -.3 && A.w < 1.6) return shoot();
    // 2) sur un coéquipier : passe (toucher = passe simple)
    const tgt = G.kind === 'pen' ? null : !g.tap ? geNear(T, g.x1, g.y1, 46) : geNear(T, g.x0, g.y0, 40);
    if (tgt) return geResolve(M, tgt.i, gePass(M, o[tgt.i], g.tap ? 30 : tgt.d, tgt));
    // 3) coup sec sur le côté : dribble
    if (di >= 0 && !g.tap && Math.abs(g.dx) > 36 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4 && g.len < 260) return geResolve(M, di, geDrib(M, o[di], G, g));
    // 4) un geste nettement vers le but, qui finit hors du cadre : frappe ratée (au-dessus, à côté)
    if (si >= 0 && !g.tap && g.dy < -24 && ang > .8) return shoot();
    return geHint(G, G.kind === 'pen' ? 'Glisse vers le but : ton doigt s\'arrête là où part le ballon.' : 'Glisse vers le but pour frapper, vers un coéquipier pour passer' + (di >= 0 ? ', ou d\'un coup sec sur le côté pour dribbler.' : '.'));
  }
  if (G.kind === 'def') {
    const [ax, ay] = Gg.P(D.opp[0], D.opp[1]), A = geProj(ax, ay, 1), [mx, my] = Gg.P(D.k, D.i), Me = geProj(mx, my, 1), ph = gePh(G, g.t1), q = geQ(ph);
    if (g.tap) { const nf = Math.hypot(g.x0 - (G.foul ? G.foul[0] : -999), g.y0 - (G.foul ? G.foul[1] : -999)) < 40, fi = has('foul'); if (nf && fi >= 0) return geResolve(M, fi, { p: null }); const ci = has('contain'); return geResolve(M, ci >= 0 ? ci : 0, { p: null, okTxt: 'Tu temporises, il ne passe pas.', koTxt: 'Tu recules trop, il s\'engouffre.' }); }
    const toward = (g.dx * (A[0] - g.x0) + g.dy * (A[1] - g.y0)) / (g.len * (Math.hypot(A[0] - g.x0, A[1] - g.y0) || 1));
    const ti = has('tackle'); if (ti >= 0 && (toward > .5 || Math.hypot(g.x1 - A[0], g.y1 - A[1]) < 70)) { const base = momProb(M, o[ti]); return geResolve(M, ti, { p: clamp(base + (q - .5) * .4, .03, .93), okTxt: q > .7 ? 'Tacle parfait, au bon moment ! Ballon récupéré.' : 'Tu récupères le ballon.', koTxt: q < .25 ? 'Trop tôt… il t\'a vu venir et t\'efface.' : 'Il protège le ballon et passe.' }); }
    void Me; return geHint(G, 'Glisse vers l\'attaquant quand le cercle devient vert pour tacler, ou touche l\'écran pour temporiser.');
  }
  if (G.kind === 'gk' || G.kind === 'gkpen') {
    const r = (g.t1 - G.t0) / G.T, dir = g.tap || Math.abs(g.dx) < 30 ? 1 : g.dx > 0 ? 0 : 2; // droite de l'écran = sDir 0 (repère du tireur)
    const oi = G.kind === 'gkpen' ? (dir === 1 ? 2 : dir === 0 ? 1 : 0) : (dir === 1 && g.tap ? Math.min(1, o.length - 1) : 0);
    const sD = G.sDir != null ? G.sDir : 1, mg = mgSave(M, o[oi], dir, sD, r), ks = ['à droite', 'au centre', 'à gauche'][sD]; // côtés vus par toi, gardien
    if (mg.okTxt.startsWith('Plongeon parfait')) mg.okTxt = `Plongeon parfait ${ks} : arrêt !`;
    if (dir !== sD) mg.koTxt = `Frappe ${ks}, tu étais parti ${dir === 1 ? 'trop tard, resté au centre' : 'de l\'autre côté'}.`;
    return geResolve(M, oi, mg);
  }
  if (G.kind === 'corner') {
    const tgt = geNear(T, g.tap ? g.x0 : g.x1, g.tap ? g.y0 : g.y1, g.tap ? 44 : 80); if (!tgt) return geHint(G, 'Glisse le ballon vers une zone de la surface (ou touche ton coéquipier pour le jouer à deux).');
    const op = o[tgt.i]; if (op.act === 'pass') return geResolve(M, tgt.i, { p: .92, okTxt: 'Corner joué à deux, ton équipe garde le ballon.', koTxt: 'Ta passe est trop molle.' });
    const pq = clamp(1 - tgt.d / 80, 0, 1), sq = g.sp < .5 ? .3 : g.sp > 2.8 ? .4 : 1, q = pq * .6 + sq * .4;
    return geResolve(M, tgt.i, { p: clamp(momProb(M, op) + (q - .55) * .5, .08, .92), okTxt: q > .75 ? `Centre parfait ${['au premier poteau', 'au point de penalty', 'au second poteau'][op.z]} !` : 'Ton centre arrive dans la zone.', koTxt: sq < .5 ? (g.sp < .5 ? 'Centre trop court, la défense dégage.' : 'Centre trop fort, il file derrière.') : 'Le gardien sort et capte ton centre.' });
  }
  if (G.kind === 'head') {
    if (G.zone == null) { const tgt = geNear(T, g.x0, g.y0, 80); if (!tgt) return geHint(G, 'Touche la zone que tu veux attaquer.'); G.zone = tgt.zone; G.zi = tgt.i; G.t1 = performance.now(); G.msg = 'Saute (touche l\'écran) quand le cercle se referme sur toi.'; return; }
    const r = (g.t1 - G.t1) / G.T, q = clamp(1 - Math.abs(r - 1) / .3, 0, 1), op = o[G.zi];
    return geResolve(M, G.zi, { p: clamp(momProb(M, op) * (.45 + q * 1.1), .02, .7), view: { kind: 'shot', zone: R() < .5 ? 3 + (R() < .5 ? 0 : 2) : (R() < .5 ? 0 : 2), dive: ri(0, 2), tq: q > .7 ? 2 : 1 }, okTxt: q > .7 ? 'Détente parfaite, tu reprends de la tête !' : 'Tu sautes, le ballon arrive…', koTxt: q < .3 ? (r < 1 ? 'Tu as sauté trop tôt.' : 'Tu as sauté trop tard.') : 'Ta tête manque de précision.' });
  }
}
function geHint(G, t) { G.msg = t; G.flash = performance.now(); }
// passe : précision du geste (fin du geste sur le coéquipier)
function gePass(M, op, d, tgt) {
  const base = momProb(M, op), b = d < 18 ? .07 : d < 32 ? .03 : 0;
  return { p: clamp(base + b, .03, .97), okTxt: `${op.act === 'cross' ? 'Centre' : op.act === 'thru' ? 'Ballon en profondeur' : 'Passe'} ${b > .05 ? 'millimétrée' : 'réussie'} pour ${tgt.n}.`, koTxt: `${op.act === 'cross' ? 'Ton centre' : 'Ta passe'} pour ${tgt.n} est interceptée.` };
}
// dribble : un coup sec quand le cercle autour du défenseur devient vert
function geDrib(M, op, G, g) {
  const q = geQ(gePh(G, g.t1)), fast = clamp((g.sp - .5) / 1, 0, 1), base = momProb(M, op), k = q * .7 + fast * .3;
  return { p: clamp(base + (k - .5) * .36, .04, .93), okTxt: k > .7 ? 'Crochet parfait, il est dans le vent !' : 'Tu passes ton adversaire.', koTxt: q < .3 ? 'Trop tôt : il ne mord pas et te prend le ballon.' : 'Il te reprend le ballon.' };
}
// penalty : en bas → placé ; en haut → en force ; lent, court et au centre → Panenka
function gePenOpt(A, g) { if (g.sp < .45 && g.len < 150 && Math.abs(A.u - .5) < .2) return 2; return A.w > .5 ? 1 : 0; }
// frappe : visée (u, w), puissance (vitesse du geste), effet (courbure), plongeon du gardien
function geShotG(M, op, G, g, A, Go, Gg) {
  const fk = G.kind === 'fk', pen = G.kind === 'pen', base = momProb(M, op), col = A.u < .36 ? 0 : A.u > .64 ? 2 : 1, top = A.w > .5, zone = (top ? 0 : 3) + col;
  const lo = pen ? .42 : .5, hi = pen ? 2.8 : 3.2, tq = g.sp >= lo + .3 && g.sp <= hi - .5 ? 2 : g.sp >= lo && g.sp <= hi ? 1 : 0;
  const wide = A.u < -.03 || A.u > 1.03 || A.w > 1.08 || (tq === 0 && g.sp > hi && top && R() < .6) || (A.u < .05 || A.u > .95 ? R() < .3 : false);
  const curl = clamp(g.curl, -.6, .6), toFar = (col === 0 && curl < -.05) || (col === 2 && curl > .05);
  const panenka = pen && gePenOpt(A, g) === 2;
  let p;
  if (panenka) p = G.dive !== 1 ? .9 : .08;
  else if (fk) {
    // le mur : à ras de terre du côté du mur, sans effet, il renvoie le ballon
    p = base * [2.3, .8, 2.3, 1.15, .35, 1.15][zone] * [.35, 1, 1.35][tq] * (Math.abs(curl) > .07 ? 1.3 : 1) * (G.dive === col ? .6 : 1);
    if (!top && Math.abs(curl) < .05 && col !== 1 && R() < .5) p *= .25;
    p = clamp(p, 0, .5);
  } else {
    p = base + (tq === 2 ? .12 : tq === 1 ? 0 : -.25) + [.1, -.02, .1, .05, -.1, .05][zone] + (toFar ? .04 : 0) + (pen ? .03 : 0);
    if (G.dive === col) p -= top && col !== 1 ? .12 : .28;
    p = clamp(p, 0, .96);
  }
  if (wide) p = 0;
  // la trajectoire suit le geste : point visé dans le cadre (repère d'équipe), effet du geste
  const ty = clamp(Go.ye[0] + clamp(A.u, -.1, 1.1) * (Go.ye[1] - Go.ye[0]), 34 - GHW - 1.5, 34 + GHW + 1.5), tz = clamp(A.w, 0, 1.25) * GH * .92 + .12;
  const view = { kind: 'shot', zone, dive: G.dive, tq, wide, ty: wide ? ty : clamp(ty, 34 - GHW + .2, 34 + GHW - .2), tz: wide ? Math.max(tz, A.w > 1 ? 2.8 : tz) : Math.min(tz, 2.25), cu: Math.abs(curl) > .05 ? clamp(-curl * .35, -.18, .18) : undefined, sp: panenka ? 12 : tq === 0 && g.sp < lo ? 17 : undefined };
  const side = ['à gauche', 'au centre', 'à droite'][col], hgt = top ? (col === 1 ? 'sous la barre' : 'en pleine lucarne') : 'à ras de terre';
  const guess = G.dive === col, gk = guess ? 'le gardien avait deviné' : 'le gardien part du mauvais côté';
  return { p, view, okTxt: panenka ? 'Panenka ! Le gardien a plongé, le ballon tombe doucement au centre !' : `${tq === 2 ? 'Frappe parfaite' : 'Frappe'} ${hgt} ${side}${fk && Math.abs(curl) > .07 ? ', enroulée par-dessus le mur' : ''}, ${guess ? 'imparable quand même !' : gk + ' : BUT !'}`,
    koTxt: wide ? (A.w > 1 ? 'Trop haut, le ballon passe au-dessus.' : 'Trop croisé, le ballon file à côté.') : panenka ? 'Panenka… mais le gardien est resté au centre !' : tq === 0 && g.sp < lo ? 'Frappe trop molle, le gardien s\'en saisit.' : `Frappe ${side}, ${guess ? gk + ' et la sort' : 'mais le gardien s\'interpose'}.` };
}
function geResolve(M, i, mg) {
  const G = UI.gest; if (!G || G.done) return; G.done = true;
  try { navigator.vibrate && navigator.vibrate(12); } catch (e) { }
  UI.gest = null; if (mg && mg.p == null) mg = null;
  liveChoose(M, i, mg); save(); render(); liveRun();
}
// temps écoulé (action de jeu) : ton joueur décide seul ; gardien sans geste : il reste planté
function geTick(M, now) {
  const G = UI.gest; if (!G || G.done || !M.pending) return;
  if ((G.kind === 'att' || G.kind === 'def') && now - G.t0 > GE_TIME) { G.done = true; UI.gest = null; liveChoose(M, autoPick(M)); save(); render(); liveRun(); return; }
  if ((G.kind === 'gk' || G.kind === 'gkpen') && now - G.t0 > G.T * 1.35) { const o = M.pending.o, oi = G.kind === 'gkpen' ? 2 : Math.min(1, o.length - 1), mg = mgSave(M, o[oi], 1, G.sDir != null ? G.sDir : 0, 2); mg.okTxt = 'Il tire sur toi : arrêt sans bouger !'; mg.koTxt = 'Tu es resté figé sur ta ligne…'; G.done = true; UI.gest = null; liveChoose(M, oi, mg); save(); render(); liveRun(); }
  if (G.kind === 'head' && G.zone != null && now - G.t1 > G.T * 1.4) { geGesture([[0, 0, now], [0, 0, now]]); }
}
// ---------- caméra du moment clé (g3Camera) : derrière toi, vers l'action ----------
function geCam(M) {
  const G = UI.gest; if (!G || !M.E || !M.E.dec) return null;
  const D = M.E.dec, Gg = geGeo(M); if (!Gg) return null;
  const W = (x, y) => [x - 52.5, y - 34], nrm = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  if (G.kind === 'att' || G.kind === 'fk' || G.kind === 'pen') {
    const [bx, by] = Gg.ball, [ux, uy] = nrm(Gg.atkX - bx, 34 - by), d = Math.hypot(Gg.atkX - bx, 34 - by), back = G.kind === 'pen' ? 6 : G.kind === 'fk' ? 6.5 : 9, h = G.kind === 'pen' ? 2.5 : G.kind === 'fk' ? 2.4 : 4.6, sd = G.kind === 'att' ? 0 : 1.3; // de côté : le tireur ne cache pas le but
    const [px, pz] = W(bx - ux * back - uy * sd, by - uy * back + ux * sd), [lx, lz] = W(bx + ux * Math.min(d, 26) * .85, by + uy * Math.min(d, 26) * .85);
    return [px, h, pz, lx, G.kind === 'att' ? .2 : 1.1, lz, G.kind === 'pen' ? 46 : G.kind === 'att' ? 50 : 54];
  }
  if (G.kind === 'def') { const [mx, my] = Gg.P(D.k, D.i), [ax, ay] = Gg.P(D.opp[0], D.opp[1]), [ux, uy] = nrm(ax - mx, ay - my), [px, pz] = W(mx - ux * 6, my - uy * 6), [lx, lz] = W(ax + ux * 4, ay + uy * 4); return [px, 2.7, pz, lx, .7, lz, 56]; }
  if (G.kind === 'gk' || G.kind === 'gkpen') { const [mx, my] = Gg.P(D.k, geKeeperIdx(M.E, D.k)), [sx, sy] = Gg.P(D.shooter[0], D.shooter[1]), [ux, uy] = nrm(sx - mx, sy - my), [px, pz] = W(mx - ux * 3.6, my - uy * 3.6), [lx, lz] = W(sx, sy); return [px, 1.75, pz, lx, .9, lz, 58]; }
  if (G.kind === 'corner') { const [cx, cy] = Gg.toD(D.k, 99, 34), [ex, ey] = Gg.toD(D.k, 79, 34), [px, pz] = W(ex, ey), [lx, lz] = W(cx, cy); return [px, 11, pz, lx, 0, lz, 44]; } // en hauteur, face au but : premier poteau, point de penalty et second poteau bien séparés
  if (G.kind === 'head') { const [gx, gy] = Gg.toD(D.k, PL, 34), [cx, cy] = Gg.toD(D.k, 76, 34), [px, pz] = W(cx, cy), [lx, lz] = W(gx, gy); return [px, 4.4, pz, lx, .6, lz, 42]; }
  return null;
}
// identifiant du gardien (décisions de gardien : le moteur ne donne pas D.i)
function geKeeperIdx(E, k) { const T = E.T[k]; const i = T.pl.findIndex(p => p.on && !p.rc && p.role === 'GK'); return i >= 0 ? i : 0; }
// ---------- dessin par-dessus la 3D ----------
function geDraw(cx, M) {
  const G = UI.gest; if (!G || !M.pending || !M.E.dec) return;
  const D = M.E.dec, Gg = geGeo(M); if (!Gg) return;
  const now = performance.now(), w = LV.w, h = LV.h, T = geTargets(M, G, Gg);
  cx.save();
  const vg = cx.createRadialGradient(w / 2, h * .45, Math.min(w, h) * .3, w / 2, h * .45, Math.hypot(w, h) * .6); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.38)'); cx.fillStyle = vg; cx.fillRect(0, 0, w, h);
  const ring = (x, y, r0, ph, lab) => { const q = geQ(ph), rr = r0 * (2.6 - 1.6 * Math.min(1, ph / .78)) + (ph > .78 ? r0 * 1.6 * (ph - .78) : 0); cx.lineWidth = 2.4; cx.strokeStyle = q > .55 ? `rgba(80,230,120,${.6 + q * .4})` : 'rgba(255,255,255,.75)'; cx.beginPath(); cx.arc(x, y, rr, 0, 7); cx.stroke(); cx.lineWidth = 1.2; cx.strokeStyle = 'rgba(255,255,255,.45)'; cx.beginPath(); cx.arc(x, y, r0, 0, 7); cx.stroke(); if (lab) geLabel(cx, x, y + r0 * 2.7 + 8, lab, q > .55 ? '#5be37a' : '#fff'); };
  const bubble = q => { if (q.edge) return geEdge(cx, q, w, h); cx.fillStyle = 'rgba(245,197,66,.16)'; cx.strokeStyle = '#f5c542'; cx.lineWidth = 2; cx.beginPath(); cx.arc(q.x, q.y, 17, 0, 7); cx.fill(); cx.stroke(); geLabel(cx, q.x, q.y - 26, q.t + (q.n ? ' · ' + q.n : ''), '#f5c542'); };
  if (G.kind === 'att' || G.kind === 'fk' || G.kind === 'pen') {
    const Go = geGoal(Gg, false), pulse = .55 + .25 * Math.sin(now / 260);
    cx.strokeStyle = `rgba(255,255,255,${pulse})`; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(Go.L[0], Go.L[1]); cx.lineTo(Go.LT[0], Go.LT[1]); cx.lineTo(Go.RT[0], Go.RT[1]); cx.lineTo(Go.R[0], Go.R[1]); cx.stroke();
    // lucarnes : les zones qui paient
    for (const [a, b] of [[Go.LT, Go.L], [Go.RT, Go.R]]) { const x = a[0] + (b[0] - a[0]) * .18, y = a[1] + (b[1] - a[1]) * .18; cx.fillStyle = `rgba(245,197,66,${.18 + .12 * Math.sin(now / 300)})`; cx.beginPath(); cx.arc(x, y, Math.max(6, Math.abs(Go.R[0] - Go.L[0]) * .09), 0, 7); cx.fill(); }
    T.forEach(bubble);
    const di = M.pending.o.findIndex(x => x.act === 'drib');
    if (di >= 0) { const E = M.E, fo = E.T[1 - D.k].pl.map((p, i) => [p, i]).filter(([p]) => p.on).map(([p, i]) => [Gg.P(1 - D.k, i), i]).sort((a, b) => Math.hypot(a[0][0] - Gg.ball[0], a[0][1] - Gg.ball[1]) - Math.hypot(b[0][0] - Gg.ball[0], b[0][1] - Gg.ball[1]))[0]; if (fo) { const p = geProj(fo[0][0], fo[0][1], 1); if (p[2]) ring(p[0], p[1], 12, gePh(G, now), '↔ Crochet'); } }
    if (G.kind === 'fk' && M.E.wall) { const ids = M.E.wall.ids || []; for (const i of ids) { const [x, y] = Gg.P(M.E.wall.k, i), p = geProj(x, y, 2.1); if (p[2]) { cx.fillStyle = 'rgba(255,90,90,.85)'; cx.fillRect(p[0] - 5, p[1] - 2, 10, 4); } } }
  } else if (G.kind === 'def') {
    const [ax, ay] = Gg.P(D.opp[0], D.opp[1]), A = geProj(ax, ay, 1); if (A[2]) ring(A[0], A[1], 13, gePh(G, now), 'Tacle : glisse vers lui');
    const fi = M.pending.o.findIndex(x => x.act === 'foul'); if (fi >= 0) { G.foul = [w - 46, h - 70]; cx.fillStyle = 'rgba(200,40,40,.85)'; cx.beginPath(); cx.arc(G.foul[0], G.foul[1], 22, 0, 7); cx.fill(); geLabel(cx, G.foul[0], G.foul[1], 'Faute', '#fff', true); }
  } else if (G.kind === 'gk' || G.kind === 'gkpen') {
    const [bx, by, bz] = Gg.ball, B = geProj(bx, by, Math.max(.2, bz)), r = (now - G.t0) / G.T;
    if (B[2]) { const rr = 14 * (1 + Math.max(0, 1 - r / .78) * 4), q = clamp(1 - Math.abs(r - .78) / .3, 0, 1); cx.lineWidth = 3; cx.strokeStyle = q > .5 ? '#5be37a' : '#fff'; cx.beginPath(); cx.arc(B[0], B[1], rr, 0, 7); cx.stroke(); }
    geLabel(cx, w / 2, h * .16, '← Glisse du côté du tir · touche pour rester debout →', '#fff');
  } else if (G.kind === 'corner') { T.forEach(bubble); }
  else if (G.kind === 'head') {
    if (G.zone == null) T.forEach(bubble);
    else { const q = T.find(x => x.zone === G.zone); if (q && q.vis) { const r = (now - G.t1) / G.T, rr = 16 * (1 + Math.max(0, 1 - r) * 4); cx.lineWidth = 3; cx.strokeStyle = Math.abs(r - 1) < .15 ? '#5be37a' : '#fff'; cx.beginPath(); cx.arc(q.x, q.y, rr, 0, 7); cx.stroke(); cx.strokeStyle = 'rgba(255,255,255,.5)'; cx.lineWidth = 1.2; cx.beginPath(); cx.arc(q.x, q.y, 16, 0, 7); cx.stroke(); } }
  }
  // le tracé du doigt
  if (GE.pts && GE.pts.length > 1) { cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = 'rgba(255,255,255,.9)'; cx.lineWidth = 5; cx.shadowColor = 'rgba(245,197,66,.9)'; cx.shadowBlur = 12; cx.beginPath(); for (const [x, y] of GE.pts) cx.lineTo(x, y); cx.stroke(); cx.shadowBlur = 0; }
  // temps restant (actions de jeu)
  if (G.kind === 'att' || G.kind === 'def') { const f = clamp(1 - (now - G.t0) / GE_TIME, 0, 1); cx.fillStyle = 'rgba(0,0,0,.35)'; cx.fillRect(12, 8, w - 24, 4); cx.fillStyle = f < .3 ? '#ff6b5b' : '#f5c542'; cx.fillRect(12, 8, (w - 24) * f, 4); }
  if (G.msg && now - G.flash < 2600) geLabel(cx, w / 2, h - 28, G.msg, '#fff', false, true);
  cx.restore();
}
function geLabel(cx, x, y, t, col, center, wide) {
  cx.font = `700 ${wide ? 11 : 10}px system-ui, sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  const tw = Math.min(cx.measureText(t).width, LV.w - 20); x = clamp(x, tw / 2 + 8, LV.w - tw / 2 - 8);
  if (!center) { cx.fillStyle = 'rgba(8,10,14,.74)'; cx.fillRect(x - tw / 2 - 5, y - 8, tw + 10, 16); }
  cx.fillStyle = col || '#fff'; cx.fillText(t, x, y, LV.w - 20);
}
// coéquipier hors champ : flèche au bord de l'écran
function geEdge(cx, q, w, h) {
  const x = q.x, y = q.y;
  cx.fillStyle = 'rgba(245,197,66,.85)'; cx.beginPath(); cx.arc(x, y, 13, 0, 7); cx.fill(); geLabel(cx, x, y - 22, q.t + (q.n ? ' · ' + q.n : ''), '#f5c542');
}
// panneau du bas pendant le moment au doigt : la consigne, et la liste pour qui préfère choisir
function vGest(M) {
  const G = UI.gest, m = M.pending, k = G.kind;
  const how = { att: 'Glisse vers le but pour frapper · vers un coéquipier pour passer' + (m.o.some(x => x.act === 'drib') ? ' · coup sec sur le côté pour dribbler' : ''), pen: 'Glisse vers le but : là où ton doigt s\'arrête. Lent et court au centre : Panenka.', fk: 'Glisse vers le but en courbant le geste pour enrouler par-dessus le mur.', def: 'Glisse vers l\'attaquant quand le cercle devient vert · touche pour temporiser', gk: 'Glisse du côté où part le ballon quand le cercle touche le ballon', gkpen: 'Glisse du côté où tu plonges, au moment où le cercle touche le ballon', corner: 'Glisse le ballon vers une zone de la surface', head: G.zone == null ? 'Touche la zone que tu attaques' : 'Touche l\'écran pour sauter quand le cercle se referme' }[k] || '';
  return `<div class="moment gest"><div class="row between"><div class="lbl acc">${k === 'pen' ? 'Penalty' : k === 'fk' ? 'Coup franc' : k === 'corner' || k === 'head' ? 'Corner' : 'Moment clé'} · ${M.min}'</div><button class="link" data-a="geList">Choisir dans la liste</button></div><p class="q">${esc(m.q)}</p><p class="note ghow">☝︎ ${esc(how)}</p></div>`;
}
