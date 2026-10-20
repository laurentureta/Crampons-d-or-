// ===================== 3D : animations en vraie capture de mouvement =====================
// Base de capture de mouvement de Carnegie Mellon (mocap.cs.cmu.edu ; libre, y compris dans un jeu), ramenée sur le
// squelette du jeu par tools/mocap.py : course, footing, marche, sprint, attente, frappes (pied droit et pied gauche),
// passe, saut de la tête, célébrations (joie, salto, roue, vrille, danse). g3Pose (m3d.js) mélange ces mouvements
// avec ses gestes dessinés à la main (tacles, plongeons, gardien…) : la capture remplace ce qu'elle sait faire.
const G3MC = { ok: false, clips: {}, loading: null, fail: false, st: new Map() };
function g3McLoad() {
  if (G3MC.ok || G3MC.loading || G3MC.fail) return;
  if (typeof ANIM_3D === 'undefined' || !ANIM_3D || !ANIM_3D.clips || typeof fetch !== 'function') { G3MC.fail = true; return; }
  const q = typeof MEDIA_H !== 'undefined' && MEDIA_H.anim ? '?h=' + MEDIA_H.anim : '';
  G3MC.loading = fetch('assets/anim/anim.bin' + q).then(r => { if (!r.ok) throw new Error('anim'); return r.arrayBuffer(); }).then(buf => {
    const I = new Int16Array(buf);
    for (const c of ANIM_3D.clips) {
      const n = c.fr, o = c.o, Q = new Float32Array(n * 60), H = new Float32Array(n);
      for (let i = 0; i < n * 60; i++) Q[i] = I[o + i] / 32767;
      for (let i = 0; i < n; i++) H[i] = I[o + n * 60 + i] / 1000;
      let T = null; if (c.tr) { T = new Float32Array(n * 3); for (let i = 0; i < n * 3; i++) T[i] = I[o + n * 61 + i] / 1000; }
      G3MC.clips[c.n] = Object.assign({}, c, { Q, H, T });
    }
    G3MC.ok = true;
  }).catch(() => { G3MC.fail = true; });
}
// échantillon d'une animation au temps tc (s) → out (15 quaternions), renvoie la hauteur du bassin ; tr : déplacement
function g3McAt(c, tc, out, tr) {
  const fps = (ANIM_3D && ANIM_3D.fps) || 30, n = c.fr; let f = tc * fps;
  if (c.loop) { f = ((f % (n)) + n) % n; } else f = clamp(f, 0, n - 1);
  const i0 = Math.floor(f), i1 = c.loop ? (i0 + 1) % n : Math.min(n - 1, i0 + 1), a = f - i0, Q = c.Q;
  for (let b = 0; b < 15; b++) {
    const o0 = i0 * 60 + b * 4, o1 = i1 * 60 + b * 4, sg = Q[o0] * Q[o1] + Q[o0 + 1] * Q[o1 + 1] + Q[o0 + 2] * Q[o1 + 2] + Q[o0 + 3] * Q[o1 + 3] < 0 ? -1 : 1;
    let x = Q[o0] * (1 - a) + Q[o1] * a * sg, y = Q[o0 + 1] * (1 - a) + Q[o1 + 1] * a * sg, z = Q[o0 + 2] * (1 - a) + Q[o1 + 2] * a * sg, w = Q[o0 + 3] * (1 - a) + Q[o1 + 3] * a * sg; const l = Math.hypot(x, y, z, w) || 1;
    out[b * 4] = x / l; out[b * 4 + 1] = y / l; out[b * 4 + 2] = z / l; out[b * 4 + 3] = w / l;
  }
  if (tr && c.T) { const T = c.T; tr[0] = T[i0 * 3] * (1 - a) + T[i1 * 3] * a; tr[1] = T[i0 * 3 + 1] * (1 - a) + T[i1 * 3 + 1] * a; tr[2] = T[i0 * 3 + 2] * (1 - a) + T[i1 * 3 + 2] * a; }
  return c.H[i0] * (1 - a) + c.H[i1] * a;
}
// mélange (nlerp) de deux jeux de quaternions : out = a → b (k)
function g3McMix(out, A, B, k) {
  for (let b = 0; b < 15; b++) { const o = b * 4, sg = A[o] * B[o] + A[o + 1] * B[o + 1] + A[o + 2] * B[o + 2] + A[o + 3] * B[o + 3] < 0 ? -1 : 1;
    let x = A[o] + (B[o] * sg - A[o]) * k, y = A[o + 1] + (B[o + 1] * sg - A[o + 1]) * k, z = A[o + 2] + (B[o + 2] * sg - A[o + 2]) * k, w = A[o + 3] + (B[o + 3] * sg - A[o + 3]) * k; const l = Math.hypot(x, y, z, w) || 1;
    out[o] = x / l; out[o + 1] = y / l; out[o + 2] = z / l; out[o + 3] = w / l; }
}
// gestes dessinés à la main qui gardent la main (tacles, plongeons, gardien, touche, contrôle…) : durée de chaque geste
const G3_ACTDUR = { 1: .55, 11: .7, 2: .8, 3: 1.1, 4: .6, 17: .6, 5: 1.4, 10: .9, 12: .35, 15: 2.2, 14: 6, 18: 9, 8: 11 };
const G3_MCCEL = { flip: 'salto', spin: 'vrille', dance: 'danse', classic: 'joie', roue: 'roue' };
const _mc = { L: null, A: null, B: null, C: null, tr: null, out: null };
// mouvement capturé pour le joueur n (ou null) : { w (poids), q (15 quaternions), h (bassin), tr (déplacement), hw (poids de la tête) }
function g3McPick(s, n, a, t) {
  if (!G3MC.ok) { g3McLoad(); return null; }
  if (s.flagUp || (typeof OPTS !== 'undefined' && OPTS.mocap === false)) return null;
  if (!_mc.L) { for (const k of ['L', 'A', 'B', 'C']) _mc[k] = new Float32Array(60); _mc.tr = new Float32Array(3); _mc.out = { w: 0, q: new Float32Array(60), h: 0, tr: _mc.tr, has: false, hw: 1 }; }
  const key = s.key ?? n; let S = G3MC.st.get(key); if (!S) { S = { wl: 0, wa: 0, clip: null, tc: 0, celT: null }; G3MC.st.set(key, S); }
  const C = G3MC.clips, actOn = a && t >= 0 && (a === 7 ? (s.hold || t < .8) : a === 9 ? t < (s.busy || 1.6) + .6 : t < (G3_ACTDUR[a] || 1));
  // geste capturé ?
  let ac = null, tc = 0;
  if (actOn && (a === 1 || a === 11)) { const sideR = (n % 2) === 1, nm = ((n >> 1) % 3 === 2 ? 'passe' : (n >> 1) % 3 === 1 ? 'frappe2' : 'frappe') + (sideR ? '' : '_g'); ac = C[nm]; if (ac) tc = t - G3_CONTACT[a] + ac.c; }
  else if (a === 1 || a === 11) { const nm = S.clip; if (nm && C[nm] && (nm.startsWith('frappe') || nm.startsWith('passe'))) { ac = C[nm]; tc = t - G3_CONTACT[a] + ac.c; } }
  if (a === 2 && t >= 0 && t < 1.2 && C.saut) { ac = C.saut; tc = t - G3_CONTACT[2] + ac.c; }
  if (a === 8 && t >= 0 && t < 11) {
    const cel = s.cel || G3_CELS[n % G3_CELS.length], nm = G3_MCCEL[cel];
    if (nm && C[nm]) { if (S.celT == null && s.v < 1.3) S.celT = t; if (S.celT != null && t >= S.celT) { ac = C[nm]; tc = t - S.celT; if (!ac.loop && (nm === 'joie' || nm === 'danse')) tc = tc % ac.dur; } }
  } else S.celT = null;
  const actOk = ac && tc >= 0 && tc <= ac.dur;
  if (actOk) { S.clip = ac.n; S.tc = tc; }
  // les autres gestes restent dessinés à la main
  const procAct = actOn && !actOk && !(a === 1 || a === 11 || a === 2 || (a === 8 && S.celT != null));
  const gkCrouch = s.gk && s.v < 1.5 && s.alert;
  const tl = !procAct && !gkCrouch && !(actOn && actOk) ? 1 : 0, ta = actOk ? 1 : 0;
  const k = s.snap ? 1 : 1 - Math.exp(-(s.gdt || 0) * 12);
  S.wl += (tl - S.wl) * k; S.wa += (ta - S.wa) * k;
  if (S.wl < .02 && S.wa < .02) return null;
  const O = _mc.out; O.has = false; O.tr[0] = O.tr[1] = O.tr[2] = 0; O.hw = 1;
  let hL = 0, hA = 0;
  // course, footing, marche, sprint, attente : selon la vitesse ; la foulée suit la phase de course du jeu
  if (S.wl > .02) {
    const v = s.v || 0, u = (((s.ph || 0) / (Math.PI * 2) - .25) % 1 + 1) % 1, at = (c, ph) => g3McAt(c, ((ph + (c.p0 || 0)) % 1) * c.dur, _mc.B);
    const run = (n % 2) ? C.course : C.course2 || C.course;
    if (v < .35 && C.idle) { hL = g3McAt(C.idle, (s.tm || 0) + n * 1.7, _mc.L); }
    else {
      const seq = [[1.3, C.marche], [3.3, C.footing], [3.9, run], [7.2, C.sprint]].filter(x => x[1]);
      let lo = seq[0], hi = seq[seq.length - 1]; for (let i = 0; i < seq.length - 1; i++) if (v >= seq[i][0] && v <= seq[i + 1][0]) { lo = seq[i]; hi = seq[i + 1]; }
      const kk = lo === hi ? 0 : clamp((v - lo[0]) / (hi[0] - lo[0]), 0, 1);
      hL = at(lo[1], u); _mc.L.set(_mc.B);
      if (kk > 0 && hi !== lo) { const h2 = at(hi[1], u); g3McMix(_mc.L, _mc.L, _mc.B, kk); hL += (h2 - hL) * kk; }
      if (v < 1.1 && C.idle) { const w0 = clamp((1.1 - v) / .75, 0, 1), h0 = g3McAt(C.idle, (s.tm || 0) + n * 1.7, _mc.C); g3McMix(_mc.L, _mc.L, _mc.C, w0 * .6); hL += (h0 - hL) * w0 * .6; }
    }
  }
  // geste capturé (encore un peu après sa fin, le temps du fondu)
  if (S.wa > .02 && S.clip && C[S.clip]) { const c = C[S.clip]; hA = g3McAt(c, actOk ? tc : S.tc, _mc.A, c.tr ? O.tr : null); if (a === 2) O.hw = .45; }
  if (S.wl > .02 && S.wa > .02) { g3McMix(O.q, _mc.L, _mc.A, clamp(S.wa / (S.wa + S.wl), 0, 1)); O.h = hL + (hA - hL) * clamp(S.wa / (S.wa + S.wl), 0, 1); O.w = Math.max(S.wl, S.wa); }
  else if (S.wa > .02) { O.q.set(_mc.A); O.h = hA; O.w = S.wa; }
  else { O.q.set(_mc.L); O.h = hL; O.w = S.wl; }
  O.tr[0] *= .45 * S.wa; O.tr[2] *= .45 * S.wa; O.tr[1] = 0;
  return O;
}
