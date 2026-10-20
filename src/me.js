// ===================== MOTEUR DE MATCH v7 : physique du ballon + IA tactique, 10 pas par seconde =====================
// Repère : terrain 105 × 68 m, hauteur z. L'équipe 0 (la tienne) attaque toujours vers x croissant.
// Chaque équipe raisonne en coordonnées locales (u : distance depuis son propre but, v : largeur).
// Le ballon obéit à la physique : gravité, frottement de l'air, effet (Magnus), rebonds, roulement, poteaux, filets.
// Les joueurs l'atteignent (ou non) selon leur vitesse, leur placement et leur technique : passes, interceptions,
// contres, arrêts, poteaux et buts naissent de la trajectoire réelle.
const PL = 105, PW = 68, MDT = 0.1, NSUB = 5, GHW = 3.66, GH = 2.44, BR = .11, PR = .06, GRAV = 9.81, ME_DRAG = .0133;
// Dispositifs : [poste, u, v] (u depuis son but, v de gauche à droite quand on attaque)
const FORMS = {
  '433': [['GK', 5, 34], ['LB', 27, 9], ['CB', 21, 25], ['CB', 21, 43], ['RB', 27, 59], ['DM', 37, 34], ['CM', 47, 21], ['CM', 47, 47], ['LW', 65, 10], ['ST', 71, 34], ['RW', 65, 58]],
  '4231': [['GK', 5, 34], ['LB', 27, 9], ['CB', 21, 25], ['CB', 21, 43], ['RB', 27, 59], ['DM', 38, 27], ['DM', 38, 41], ['AM', 55, 34], ['LW', 63, 10], ['ST', 71, 34], ['RW', 63, 58]],
  '442': [['GK', 5, 34], ['LB', 26, 9], ['CB', 21, 25], ['CB', 21, 43], ['RB', 26, 59], ['CM', 43, 27], ['CM', 43, 41], ['LW', 51, 8], ['ST', 69, 29], ['ST', 66, 39], ['RW', 51, 60]],
  '4141': [['GK', 5, 34], ['LB', 25, 9], ['CB', 20, 25], ['CB', 20, 43], ['RB', 25, 59], ['DM', 33, 34], ['CM', 46, 24], ['CM', 46, 44], ['LW', 53, 8], ['ST', 67, 34], ['RW', 53, 60]],
  '352': [['GK', 5, 34], ['CB', 20, 20], ['CB', 18, 34], ['CB', 20, 48], ['LB', 40, 6], ['DM', 35, 34], ['CM', 46, 24], ['CM', 46, 44], ['RB', 40, 62], ['ST', 68, 29], ['ST', 66, 39]],
  '532': [['GK', 5, 34], ['LB', 27, 6], ['CB', 18, 21], ['CB', 17, 34], ['CB', 18, 47], ['RB', 27, 62], ['CM', 39, 23], ['DM', 36, 34], ['CM', 39, 45], ['ST', 63, 29], ['ST', 61, 39]],
};
const FORM_K = Object.keys(FORMS), FORM_N = { '433': '4-3-3', '4231': '4-2-3-1', '442': '4-4-2', '4141': '4-1-4-1', '352': '3-5-2', '532': '5-3-2' };
const FORM433 = FORMS['433'];
const ROLE_OFF = { GK: [-22, -50, -40, -30, -25, 0, -5], CB: [-10, -32, -25, 4, -6, -60, 4], LB: [-5, -26, -8, -2, 3, -60, -4], RB: [-5, -26, -8, -2, 3, -60, -4], DM: [0, -18, -10, 0, -6, -60, 2], CM: [3, -10, -2, -10, -3, -60, -3], AM: [3, -4, 3, -20, -2, -60, -6], LW: [-3, -3, 4, -30, 5, -60, -6], RW: [-3, -3, 4, -30, 5, -60, -6], ST: [-8, 5, -2, -35, 0, -60, 3] };
const AKEYS = ['pas', 'sho', 'dri', 'def', 'spd', 'gk', 'phy'];
const SLOTS_OF = { GB: ['GK'], DC: ['CB'], DL: ['LB', 'RB'], MDC: ['DM', 'CM'], MC: ['CM', 'DM', 'AM'], MOC: ['AM', 'CM'], AIL: ['LW', 'RW', 'ST'], BU: ['ST'] };
const ROLE_CAR = { GK: 'GB', CB: 'DC', LB: 'DL', RB: 'DL', DM: 'MDC', CM: 'MC', AM: 'MOC', LW: 'AIL', RW: 'AIL', ST: 'BU' };
const ROLE_NUM = [1, 3, 4, 5, 2, 6, 8, 10, 11, 9, 7];
const TACP = { off: { line: 4, press: 1.2, direct: .55, width: 1.1, shoot: 1.2, tempo: .85, drain: 1.1, solid: .85 }, bal: { line: 0, press: 1, direct: .45, width: 1, shoot: 1, tempo: 1, drain: 1, solid: 1 }, def: { line: -3, press: .8, direct: .6, width: .9, shoot: .85, tempo: 1.15, drain: .9, solid: 1.35 }, counter: { line: -2, press: .9, direct: .85, width: 1, shoot: 1.1, tempo: .8, drain: 1, solid: 1.12 }, press: { line: 5, press: 1.45, direct: .4, width: 1, shoot: 1, tempo: .9, drain: 1.25, solid: .95 } };
// gestes visibles à l'écran (rendu 3D/2D)
const GEST = { KICK: 1, HEAD: 2, SLIDE: 3, TACKLE: 4, DIVE: 5, CATCH: 7, CELEB: 8, FALL: 9, THROW: 10, PUNT: 11, CTRL: 12, SAD: 14, CARD: 15, FLAG: 16, BLOCK: 17, HUG: 18 };
const hy = (a, b) => Math.sqrt(a * a + b * b);
const dst = (a, b, c, d) => { const x = a - c, y = b - d; return Math.sqrt(x * x + y * y); };
function segDist(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-9; const f = clamp(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1); return [hy(px - ax - f * dx, py - ay - f * dy), f, ax + f * dx, ay + f * dy]; }
function segD(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-9; let f = ((px - ax) * dx + (py - ay) * dy) / L2; f = f < 0 ? 0 : f > 1 ? 1 : f; const x = px - ax - f * dx, y = py - ay - f * dy; return Math.sqrt(x * x + y * y); }
const loc = (k, x, y) => k === 0 ? [x, y] : [PL - x, PW - y];
const glob = (k, u, v) => k === 0 ? [u, v] : [PL - u, PW - v];
const sgm = x => 1 / (1 + Math.exp(-x));
const posVal = (u, v) => { const d = hy(PL - u, (v - 34) * ME_LAT); let x = .3 * Math.exp(-d / 8) + .06 * Math.exp(-d / 25); if (u > 83) x = Math.min(x, ME_PX * xgOf(u, v, 0)); return x + ME_B + ME_PG * Math.pow(Math.max(0, u) / 105, 1.5); };
const lossCost = (u, v) => posVal(PL - u, PW - v);
function xgOf(u, v, pr, head) { const d = hy(PL - u, v - 34), a = Math.abs(Math.atan2(7.32 * (PL - u), (PL - u) ** 2 + (v - 34) ** 2 - 13.4)); let x = 1 / (1 + Math.exp(-(-1.1 + 1.6 * a - .11 * d))); x *= 1 - .22 * Math.min(2, pr); if (head) x *= .6; return clamp(x, .005, .75); }
function minLabel(c, h) { if (h === 1 && c >= 2700) return '45+' + (Math.floor((c - 2700) / 60) + 1); if (h === 2 && c >= 5400) return '90+' + (Math.floor((c - 5400) / 60) + 1); return String(Math.min(h === 1 ? 45 : 90, Math.floor(c / 60) + 1)); }
const minNum = (c, h) => h === 1 ? Math.min(45, Math.floor(c / 60) + 1) : Math.min(90, Math.floor(c / 60) + 1);

// ---------- Création ----------
let ME_COMP = .55;
function mePlayer(c, role, k, idx, shift, base) {
  const a = {}, bs = base ?? 72;
  if (c.me) { const P = S.p.at, m = { pas: P.PAS, sho: P.TIR, dri: P.DRI * .7 + P.TEC * .3, def: P.DEF, spd: P.VIT + (hasPerk('rocket') ? 4 : 0), gk: P.GAR, phy: P.PHY }; for (const key of AKEYS) a[key] = 72 + (m[key] - bs) * ME_COMP; }
  else AKEYS.forEach((key, i) => a[key] = 72 + (c.o - bs) * ME_COMP + (ROLE_OFF[role] || ROLE_OFF.CM)[i] + (c.noise ?? gauss() * 2));
  for (const key of AKEYS) a[key] = clamp(a[key] + shift, 5, 110);
  return { n: c.n, sn: c.sn || '', role, num: c.num || ROLE_NUM[idx] || 12 + idx, o: c.o, a, x: 0, y: 0, vx: 0, vy: 0, face: k ? Math.PI : 0, sta: 100, me: !!c.me, on: true, onM: 0, offM: null, yc: 0, rc: false, beat: 0, run: 0, runTo: null, carry: null, dive: null, act: 0, actT: -9, actA: 0, busy: 0, st: { g: 0, as: 0, sh: 0, sot: 0, pa: 0, pc: 0, kp: 0, tk: 0, int: 0, drs: 0, dra: 0, sv: 0, lost: 0, fo: 0, cl: 0 } };
}
function formNums(form) { const used = new Set(), pref = { GK: [1], LB: [3], RB: [2], CB: [4, 5, 6, 15], DM: [6, 8, 16], CM: [8, 10, 6, 14], AM: [10, 8], LW: [11, 7], RW: [7, 11], ST: [9, 10, 11, 19] }; return (FORMS[form] || FORM433).map(([r], i) => { const n = (pref[r] || [20 + i]).find(x => !used.has(x)) || 20 + i; used.add(n); return n; }); }
// dispositif cohérent avec la tactique (et avec le poste du joueur s'il est dans l'équipe)
function pickForm(tac, pos) {
  const pool = ({ off: ['433', '4231', '433'], bal: ['433', '4231', '442', '4141'], def: ['4141', '532', '442'], counter: ['442', '4231', '532', '352'], press: ['433', '4231', '352'] })[tac] || ['433'];
  const ok = f => !pos || FORMS[f].some(s => (SLOTS_OF[pos] || ['ST']).slice(0, pos === 'AIL' ? 2 : 3).includes(s[0]));
  const c = pool.filter(ok); return c.length ? pick(c) : '433';
}
function meLineup(cands, s, nat, me, form) {
  const F = FORMS[form] || FORM433, pool = cands.slice().sort((a, b) => b.o - a.o), used = new Set(), xi = new Array(11).fill(null);
  if (me) { const want = SLOTS_OF[S.p.pos] || ['ST']; let slot = -1; for (const r of want) { const o = []; F.forEach((f, i) => { if (f[0] === r && !xi[i]) o.push(i); }); if (o.length) { slot = pick(o); break; } } xi[slot >= 0 ? slot : F.findIndex(f => f[0] === 'ST')] = me; }
  F.forEach(([role], i) => {
    if (xi[i]) return;
    let c = pool.find(x => !used.has(x) && SLOTS_OF[x.pos] && SLOTS_OF[x.pos][0] === role) || pool.find(x => !used.has(x) && SLOTS_OF[x.pos] && SLOTS_OF[x.pos].includes(role));
    if (!c) c = { n: genName(nat), o: Math.round(s - 1.5 + gauss() * 2.5), pos: ROLE_CAR[role] };
    used.add(c); xi[i] = c;
  });
  const bench = pool.filter(x => !used.has(x)).slice(0, 7);
  while (bench.length < 7) bench.push({ n: genName(nat), o: Math.round(s - 3 + gauss() * 2.5), pos: ['DC', 'MC', 'AIL', 'BU', 'DL', 'MDC', 'GB'][bench.length] });
  return { xi, bench };
}
// plan de jeu concret : hauteur du bloc, pressing, largeur, jeu direct (selon la tactique et l'humeur du moment)
function mePlan(T) {
  const t = T.tac, m = T.mood || 0;
  T.plan = { block: clamp(.5 + t.line * .07 + m * .22, .05, 1), press: clamp((t.press - .75) * 1.4 + m * .22, 0, 1), width: t.width, direct: clamp(t.direct + m * .1, .2, .95), tempo: t.tempo * (m < 0 ? 1.2 : m > 0 ? .85 : 1), trap: t.line >= 4, counter: T.tacK === 'counter', cp: t.press >= 1.15 || m > 0, k: T.tacK, m };
  T.planK = T.tacK + m;
}
function condPhys(E) { const C = E.cond || {}; E.crl = (C.snow ? .12 : C.rain ? .048 : .066) + (C.wear || 0) * .012; E.cbo = C.snow ? .36 : C.rain ? .46 : .55; E.cbf = C.snow ? .7 : C.rain ? .9 : .8; E.cdr = (C.rain ? .02 : 0) + (C.snow ? .04 : 0) + (C.wear || 0) * .025; E.cpa = (C.rain ? .015 : 0) + (C.snow ? .035 : 0) + (C.wear || 0) * .02; E.cfr = C.snow ? .94 : C.rain ? .965 : .955; }
function meCreate(cfg) {
  const sAvg = (cfg.teams[0].s + cfg.teams[1].s) / 2, shift = 0;
  const E = { v: 7, time: 0, clock: 0, half: 1, s1: (1 + ri(0, 2)) * 60 + ri(0, 50), s2: (2 + ri(0, 3)) * 60 + ri(0, 40), T: [], ball: { x: 52.5, y: 34, z: 0, vx: 0, vy: 0, vz: 0, cu: 0, tp: 0, st: 'dead', own: null, f: null, kick: null, hand: false, pv: 0 }, timer: 0, rs: null, poss: 0, last: null, lastPass: null, ev: [], dec: null, decB: cfg.decB || 0, decLast: -999, over: false, stop: null, coach: !!cfg.coach, cstops: cfg.coach ? [0, 'half', 4200] : [], ko: !!cfg.ko, big: !!cfg.big, meOut: cfg.meOut ?? null, meIn: cfg.meIn ?? null, home: cfg.home, neutral: !!cfg.neutral, tick: 0, goals: [0, 0], subPlan: [ri(3500, 4300), ri(4100, 4900)], base: sAvg, cond: cfg.cond || {}, cm: [], hm: new Array(384).fill(0), shots: [], arb: { x: 46, y: 22, vx: 0, vy: 0, act: 0, actT: -9 }, var: null, pk: -1, cel: null, wood: null, flag: [-1, -9] };
  condPhys(E);
  cfg.teams.forEach((tc, k) => {
    // niveau moyen ramené à la force de l'équipe (les vedettes restent au-dessus, les autres en dessous)
    const oth = tc.xi.filter(c => !c.me), avg = oth.reduce((x, c) => x + c.o, 0) / Math.max(1, oth.length), off = tc.s - avg;
    tc = Object.assign({}, tc, { xi: tc.xi.map(c => c.me ? c : Object.assign({}, c, { o: c.o + off })), bench: tc.bench.map(c => Object.assign({}, c, { o: c.o + off })) });
    const form = FORMS[tc.form] ? tc.form : '433', F = FORMS[form], nums = formNums(form);
    const hb = !E.neutral && E.home === k ? 1.2 : 0, tac = Object.assign({}, TACP[tc.tac || 'bal']);
    const pl = tc.xi.map((c, i) => mePlayer(Object.assign({}, c, { num: c.num || nums[i] }), F[i][0], k, i, shift + hb + (tc.lead ? 1 : 0), sAvg));
    pl.forEach((p, i) => { p.au = F[i][1]; p.av = F[i][2]; });
    const bench = tc.bench.map(c => ({ c, used: false }));
    const T = { bB: clamp((tc.s - cfg.teams[1 - k].s) * ME_DOM, -.02, .02), n: tc.n, s: tc.s, col: tc.col, col2: tc.col2, gkc: tc.gkc, pl, bench, subs: 0, tac, tacK: tc.tac || 'bal', form, mood: 0, lostT: -9, L: [20, 35, 50], st: { pos: 0, sh: 0, sot: 0, blk: 0, wood: 0, cor: 0, fo: 0, yc: 0, rc: 0, off: 0, pa: 0, pc: 0, sv: 0 }, shift: shift + hb };
    mePlan(T); E.T.push(T);
  });
  if (cfg.meBench) { const T = E.T[0], mi = T.pl.findIndex(p => p.me); if (mi >= 0) { const sub = T.bench.find(b => !b.used && SLOTS_OF[b.c.pos] && SLOTS_OF[b.c.pos].includes(T.pl[mi].role)) || T.bench.find(b => !b.used); E.meStore = T.pl[mi]; const np = mePlayer(sub.c, T.pl[mi].role, 0, mi, T.shift, E.base); np.au = T.pl[mi].au; np.av = T.pl[mi].av; np.num = sub.c.num || 12 + mi; sub.used = true; T.pl[mi] = np; } }
  meKickoff(E, 0, true);
  return E;
}
// actions commentables (pas des statistiques)
function meCm(E, type, k, p, x) { E.cm.push(Object.assign({ t: E.time, c: E.clock, h: E.half, type, k, n: p ? p.n : '', me: p ? !!p.me : false }, x || {})); if (E.cm.length > 600) E.cm.splice(0, 300); }
function meEv(E, type, k, p, extra) { const e = Object.assign({ t: E.time, c: E.clock, h: E.half, type, k, n: p ? p.n : '', me: p ? !!p.me : false, x: E.ball.x, y: E.ball.y }, extra || {}); E.ev.push(e); return e; }
const setAct = (E, p, a, ang, delay) => { p.act = a; p.actT = E.time + (delay || 0); p.actA = ang || 0; };

// ---------- Outils de situation ----------
const onPl = T => T.pl.filter(p => p.on && !p.rc);
function pressure(E, k, p) { let s = 0; const O = E.T[1 - k].pl; for (let n = 0; n < O.length; n++) { const o = O[n]; if (!o.on || o.rc || o.busy > E.time) continue; const x = p.x - o.x, y = p.y - o.y; if (x > 4 || x < -4 || y > 4 || y < -4) continue; const d = Math.sqrt(x * x + y * y); if (d < 4) s += (4 - d) / 4; } return s; }
// ligne du hors-jeu pour l'équipe k (avant-dernier adversaire, jamais avant la médiane), en u local
function offLine(E, k) { const c = E.olC || (E.olC = [-1, 0, -1, 0]); if (c[k * 2] === E.tick && !E.olX) return c[k * 2 + 1]; let a = -1, b = -1; const O = E.T[1 - k].pl; for (let n = 0; n < O.length; n++) { const o = O[n]; if (!o.on || o.rc) continue; const u = k === 0 ? o.x : PL - o.x; if (u > a) { b = a; a = u; } else if (u > b) b = u; } const r = Math.max(b, 52.5); c[k * 2] = E.tick; c[k * 2 + 1] = r; return r; }
function frontOpp(E, k, p) { const [u, v] = loc(k, p.x, p.y); let best = null; for (const [i, o] of E.T[1 - k].pl.entries()) { if (!o.on || o.rc || o.beat > E.time || o.busy > E.time) continue; const [ou, ov] = loc(k, o.x, o.y); const du = ou - u, dv = Math.abs(ov - v); if (du > -1 && du < 7 && dv < du * 1.2 + 2) { const d = hy(du, dv); if (!best || d < best.d) best = { o, i, d }; } } return best; }
function keeper(E, k) { return E.T[k].pl.find(p => p.on && !p.rc && p.role === 'GK') || E.T[k].pl.find(p => p.on && !p.rc); }
function owner(E) { const o = E.ball.own; return o ? E.T[o[0]].pl[o[1]] : null; }
const pMax = p => (7.83 + (p.a.spd - 72) * ME_SPK) * (.82 + p.sta * .0018);
const inBoxL = (u, v) => u >= 88.5 && Math.abs(v - 34) <= 20.16;
// temps pour qu'un joueur arrive à portée d'un point
function tReach(p, x, y, r) { const dx = x - p.x, dy = y - p.y, d = Math.sqrt(dx * dx + dy * dy) - r; if (d <= 0) return 0; const vp = (p.vx * dx + p.vy * dy) / (d + r); return .2 + Math.max(0, d - Math.max(0, vp) * .22) / pMax(p); }

// ---------- Physique du ballon ----------
// pas d'intégration : gravité, traînée, effet latéral (cu) et vertical (tp), rebond, roulement
function physStep(E, s, dt) {
  if (s.z > 0 || s.vz > 0) {
    const sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy + s.vz * s.vz), dr = ME_DRAG * sp, vh = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
    let ax = -dr * s.vx, ay = -dr * s.vy, az = -GRAV - dr * s.vz;
    if (vh > .5) { ax -= s.vy * s.cu; ay += s.vx * s.cu; az += s.tp * vh; }
    s.vx += ax * dt; s.vy += ay * dt; s.vz += az * dt;
    s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
    if (s.z <= 0) { s.z = 0; if (s.vz < -1.3) { s.vz = -s.vz * E.cbo; s.vx *= E.cbf; s.vy *= E.cbf; s.cu *= .35; s.tp = 0; } else s.vz = 0; }
  } else {
    const vh = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
    if (vh > 0) { const nv = Math.max(0, vh - (E.crl * GRAV + ME_DRAG * vh * vh) * dt), f = nv / vh; s.vx *= f; s.vy *= f; }
    s.x += s.vx * dt; s.y += s.vy * dt; s.cu = 0; s.tp = 0;
  }
  if (s.cu) s.cu *= 1 - .2 * dt;
}
// passes au sol : vitesse de départ pour arriver à vA après L mètres (roulement + traînée), et durée
const vArr = L => 7.5 + L * .2;
function groundV0(E, L, vA) { const c = E.crl * GRAV, k = ME_DRAG; return Math.sqrt(Math.max(1, ((c + k * vA * vA) * Math.exp(2 * k * L) - c) / k)); }
function groundT(E, v0, vA) { const c = E.crl * GRAV, k = ME_DRAG, s = Math.sqrt(k / c); return (Math.atan(v0 * s) - Math.atan(vA * s)) / Math.sqrt(c * k); }
// ballons aériens : table (angle → vitesse, portée, durée) calculée une fois
const LOFT = {};
function loftTab(deg) {
  if (LOFT[deg]) return LOFT[deg];
  const E0 = { crl: .066, cbo: .55, cbf: .8 }, th = deg * Math.PI / 180, rows = [];
  for (let v = 4; v <= 38; v += .5) { const s = { x: 0, y: 0, z: .12, vx: v * Math.cos(th), vy: 0, vz: v * Math.sin(th), cu: 0, tp: 0 }; let t = 0; while (t < 9) { physStep(E0, s, .02); t += .02; if (s.z === 0) break; } rows.push([v, s.x, t]); }
  return (LOFT[deg] = rows);
}
function loftFor(deg, L) { const T = loftTab(deg); if (L <= T[0][1]) return [T[0][0], T[0][2] * L / T[0][1]]; for (let n = 1; n < T.length; n++) if (T[n][1] >= L) { const a = T[n - 1], b = T[n], f = (L - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * f, a[2] + (b[2] - a[2]) * f]; } const z = T[T.length - 1]; return [z[0], z[2]]; }
// collision avec les poteaux et la barre (segment parcouru pendant le sous-pas)
function frameHit(b, gx, ox, oy, oz) {
  const rr = BR + PR;
  for (const s of [-1, 1]) {
    const py = 34 + s * (GHW + PR), [d, f, cx, cy] = segDist(gx, py, ox, oy, b.x, b.y), zz = oz + (b.z - oz) * f;
    if (d < rr && zz < GH + PR) { let nx = cx - gx, ny = cy - py; const n = hy(nx, ny) || 1; nx /= n; ny /= n; const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 1.55 * vn * nx; b.vy -= 1.55 * vn * ny; } b.x = gx + nx * (rr + .01); b.y = py + ny * (rr + .01); b.z = zz; b.cu *= .3; return 'post'; }
  }
  const [d, f, cx, cz] = segDist(gx, GH + PR, ox, oz, b.x, b.z), yy = oy + (b.y - oy) * f;
  if (d < rr && Math.abs(yy - 34) <= GHW + PR) { let nx = cx - gx, nz = cz - (GH + PR); const n = hy(nx, nz) || 1; nx /= n; nz /= n; const vn = b.vx * nx + b.vz * nz; if (vn < 0) { b.vx -= 1.55 * vn * nx; b.vz -= 1.55 * vn * nz; } b.x = gx + nx * (rr + .01); b.z = GH + PR + nz * (rr + .01); b.y = yy; b.cu *= .3; return 'bar'; }
  return null;
}
// trajectoire libre prévue (sans joueurs) par pas de 0,1 s
function predBall(E, n) {
  const b = E.ball; let P = E.pred; if (!P) P = E.pred = { x: new Float32Array(41), y: new Float32Array(41), z: new Float32Array(41), n: 0 };
  const s = { x: b.x, y: b.y, z: b.z, vx: b.vx, vy: b.vy, vz: b.vz, cu: b.cu, tp: b.tp }; P.x[0] = s.x; P.y[0] = s.y; P.z[0] = s.z; let m = 1;
  for (; m <= n; m++) { physStep(E, s, .05); physStep(E, s, .05); P.x[m] = s.x; P.y[m] = s.y; P.z[m] = s.z; if (s.x < -1 || s.x > PL + 1 || s.y < -1 || s.y > PW + 1) { m++; break; } if (s.z === 0 && s.vx * s.vx + s.vy * s.vy < .04) { m++; break; } }
  P.n = m; return P;
}

// ---------- Frappes ----------
function launch(E, k, i, vx, vy, vz, cu, tp, kind, x) {
  const b = E.ball, p = E.T[k].pl[i];
  b.st = 'air'; b.own = null; b.hand = false; b.vx = vx; b.vy = vy; b.vz = vz; b.cu = cu || 0; b.tp = tp || 0; b.pv++;
  b.kick = Object.assign({ k, i, kind, t0: E.time, j: -1 }, x || {});
  E.last = [k, i]; E.poss = k; p.carry = null; p.face = Math.atan2(vy, vx);
  setAct(E, p, kind === 'throw' ? GEST.THROW : kind === 'head' || (x && x.sk === 'head') ? GEST.HEAD : kind === 'punt' ? GEST.PUNT : GEST.KICK, p.face);
  // positions de hors-jeu au moment de la passe
  if (kind === 'pass' || kind === 'thru' || kind === 'long' || kind === 'cross' || kind === 'head') {
    E.olX = true; const line = offLine(E, k), bu = k === 0 ? b.x : PL - b.x; E.olX = false; let offs = null;
    E.T[k].pl.forEach((q, j) => { if (j === i || !q.on || q.rc) return; const qu = k === 0 ? q.x : PL - q.x, m = qu - Math.max(line, bu); if (qu > 52.5 && m > -.3) { (offs = offs || {})[j] = m; } });
    b.kick.offs = offs;
  }
}
function passSig(E, k, p, L, loft) { const pr = Math.min(2, pressure(E, k, p)); return (.3 + L * (loft ? .042 : .028)) * Math.exp(-(p.a.pas - 72) / ME_SKP) * (1 + pr * .28) * (1 + (E.cpa || 0) * 8) * (p.me && hasPerk('pass') ? .85 : 1); }
// lance le ballon vers (tx, ty) : au sol ou en l'air (angle deg), avec une erreur sig (m)
function kickTo(E, k, i, tx, ty, deg, sig, kind, x, cu, vAm) {
  const b = E.ball, p = E.T[k].pl[i];
  let L = dst(b.x, b.y, tx, ty); const ux = (tx - b.x) / (L || 1), uy = (ty - b.y) / (L || 1);
  if (sig) { const e1 = gauss() * sig, e2 = gauss() * sig * .75; tx += -uy * e1 + ux * e2; ty += ux * e1 + uy * e2; L = dst(b.x, b.y, tx, ty); }
  L = Math.max(1, L); const dx = (tx - b.x) / L, dy = (ty - b.y) / L;
  let dur, vx, vy, vz = 0;
  if (!deg) { const vA = vArr(L) * (vAm || 1), v0 = Math.min(30, groundV0(E, L, vA)); dur = groundT(E, v0, Math.min(vA, v0 - .5)); vx = dx * v0; vy = dy * v0; b.z = 0; }
  else { const [v0, t] = loftFor(deg, L), th = deg * Math.PI / 180; dur = t; let ax = dx, ay = dy; if (cu) { const sh = .5 * cu * v0 * Math.cos(th) * t * t * .9, an = -Math.atan2(sh, L); ax = dx * Math.cos(an) - dy * Math.sin(an); ay = dx * Math.sin(an) + dy * Math.cos(an); } vx = ax * v0 * Math.cos(th); vy = ay * v0 * Math.cos(th); vz = v0 * Math.sin(th); }
  launch(E, k, i, vx, vy, vz, cu || 0, 0, kind, Object.assign({ tx, ty, dur }, x || {}));
  return dur;
}
// point de la course d'un appel où le ballon et le joueur arrivent ensemble
function thruPoint(E, k, p, q) {
  const [qu, qv] = loc(k, q.x, q.y); let du = 1, dv = (34 - qv) * .012; if (q.runTo && q.run > E.time) { du = q.runTo[0] - qu; dv = q.runTo[1] - qv; } const n = hy(du, dv) || 1; du /= n; dv /= n;
  let best = null;
  for (const d of [4, 7, 10, 13, 17]) { const tu = Math.min(101.5, qu + du * d), tv = clamp(qv + dv * d, 3, 65), [tx, ty] = glob(k, tu, tv), L = dst(p.x, p.y, tx, ty), loft = L > 30, tb = loft ? loftFor(18, L)[1] : groundT(E, Math.min(30, groundV0(E, L, vArr(L))), vArr(L)), tr = .2 + d / (pMax(q) * .97), df = Math.abs(tr - tb); if (!best || df < best.df) best = { tx, ty, df, loft }; }
  return best;
}
function mePass(E, k, i, j, kind, through, force) {
  const T = E.T[k], p = T.pl[i], q = T.pl[j], b = E.ball;
  let tx = q.x + q.vx * .45, ty = q.y + q.vy * .45, loft = false;
  if (through) { const tp = thruPoint(E, k, p, q); tx = tp.tx; ty = tp.ty; loft = tp.loft; }
  tx = clamp(tx, .5, PL - .5); ty = clamp(ty, .5, PW - .5);
  const L = dst(b.x, b.y, tx, ty); if (kind === 'long' || L > 34) loft = true;
  // ligne de passe bouchée : ballon par-dessus
  if (!loft && L > 14 && kind !== 'throw') { for (const o of E.T[1 - k].pl) { if (!o.on || o.rc) continue; const [d, f] = segDist(o.x, o.y, b.x, b.y, tx, ty); if (d < 1.1 && f > .2 && f < .8) { loft = true; break; } } }
  let sig = passSig(E, k, p, L, loft || kind === 'throw'), fint = -1;
  if (force === 'ok') sig = 0; else if (force === 'mis') sig = sig * 2 + 4;
  else if (force === 'int') { let best = null; for (const [oi, o] of E.T[1 - k].pl.entries()) { if (!o.on || o.rc || o.role === 'GK') continue; const [d, f, sx, sy] = segDist(o.x, o.y, b.x, b.y, tx, ty); if (!best || d - f < best.s) best = { s: d - f, oi, sx: o.x * .6 + sx * .4, sy: o.y * .6 + sy * .4 }; } if (best) { tx = best.sx; ty = best.sy; fint = best.oi; sig = 0; } }
  const tu = k === 0 ? tx : PL - tx, deg = kind === 'throw' ? (L > 10 ? 24 : 0) : loft ? (L > 40 ? 26 : through ? 18 : 30) : 0;
  p.st.pa++; T.st.pa++;
  if (kind !== 'throw') { if (through) meCm(E, 'thru', k, p, { n2: q.n }); else if (L > 38) meCm(E, 'long', k, p, { n2: q.n }); else if (tu > 88) meCm(E, 'box', k, p, { n2: q.n }); }
  const dur = kickTo(E, k, i, tx, ty, deg, sig, kind === 'throw' ? 'throw' : through ? 'thru' : loft ? 'long' : 'pass', { j, safe: force === 'ok', fint }, 0, kind === 'throw' ? .6 : 1);
  E.lastPass = { k, i, t: E.time, to: j, marg: false, mx: q.x, my: q.y };
  b.f = { res: force === 'int' ? 'int' : force === 'mis' ? 'mis' : 'ok', t0: E.time, dur, kind };
}
// centre : vers la zone d'attaque du receveur ; brossé rentrant/sortant ; tendu ou en cloche
function meCross(E, k, i, j, corner, force) {
  const T = E.T[k], p = T.pl[i], q = T.pl[j], b = E.ball;
  const [qu, qv] = loc(k, q.x, q.y), aim = q.runTo && q.run > E.time ? q.runTo : [qu, qv], [bu, bv] = loc(k, b.x, b.y);
  const driven = !corner && R() < .3, deg = driven ? 13 : corner ? 25 : 21;
  const L0 = hy(aim[0] - bu, aim[1] - bv), ex = driven ? 1.2 : 3.2, du = (aim[0] - bu) / L0, dv = (aim[1] - bv) / L0;
  const [tx, ty] = glob(k, clamp(aim[0] + du * ex, 85, 104), clamp(aim[1] + dv * ex, 8, 60));
  const side = bv < 34 ? 1 : -1, inswing = R() < .55, cu = (inswing ? -1 : 1) * side * (k === 0 ? 1 : 1) * rf(.06, .12);
  let sig = passSig(E, k, p, L0, true) * (corner ? 1.05 : 1.15) + .6, fint = -1;
  if (force === true || force === 'ok') sig = .2; else if (force === false || force === 'mis') sig = sig * 1.8 + 3;
  p.st.pa++; T.st.pa++;
  const dur = kickTo(E, k, i, tx, ty, deg, sig, 'cross', { j, safe: force === true || force === 'ok', fint, corner: !!corner }, cu * (k === 0 ? 1 : 1));
  if (!corner) meCm(E, 'cross', k, p, { n2: q.n });
  E.lastPass = { k, i, t: E.time, to: j, marg: false, mx: q.x, my: q.y };
  b.f = { res: force === false || force === 'mis' ? 'mis' : 'duel', t0: E.time, dur, kind: 'cross' };
}
function meClear(E, k, i, gkKick, head) {
  const p = E.T[k].pl[i], [u, v] = loc(k, p.x, p.y), out = !gkKick && !head && R() < ME_CO;
  let tu, tv;
  if (gkKick) { const tgt = E.T[k].pl.filter(q => q.on && !q.rc && (q.role === 'ST' || q.role === 'LW' || q.role === 'RW' || q.role === 'AM')); const q = tgt.length ? pick(tgt) : null; [tu, tv] = q ? loc(k, q.x, q.y) : [u + 50, rf(15, 53)]; tu = clamp(tu + rf(-3, 3), 35, 78); tv = clamp(tv + rf(-5, 5), 6, 62); }
  else if (head) { const o2 = u < 35 && R() < ME_CO * .8; tu = u + rf(8, 20); tv = o2 ? (v < 34 ? -5 : PW + 5) : v + (v < 34 ? -1 : 1) * rf(2, 10); }
  else { tu = clamp(u + rf(out ? 12 : 28, out ? 35 : 52), 20, 96); tv = out ? (v < 34 ? -6 : PW + 6) : rf(6, 62); }
  const [tx, ty] = glob(k, tu, tv);
  p.st.cl++;
  kickTo(E, k, i, tx, ty, head ? 32 : gkKick ? 36 : rf(34, 46), gkKick ? 4 : head ? 3 : 5, head ? 'head' : gkKick ? 'punt' : 'clear', { j: -1 });
  if (u < 30 && !gkKick) meCm(E, 'clear', k, p, { out, head: !!head });
}
// estimation statistique (affichage des chances, choix des options)
function shotModel(E, k, p, o) {
  const [u, v] = loc(k, E.ball.x, E.ball.y), d = hy(PL - u, v - 34), pr = o.kind === 'pen' || o.kind === 'fk' ? 0 : pressure(E, k, p);
  const skill = o.kind === 'head' ? (p.a.phy + p.a.sho) / 2 : p.a.sho, gk = keeper(E, 1 - k), gks = gk.a.gk;
  let pb = 0; if (!o.kind || o.kind === 'fk') { pb = laneBlock(E, k, u, v); if (o.kind === 'fk') pb = Math.min(.6, pb + .2); }
  let g; if (o.kind === 'pen') g = clamp(.76 + (skill - gks) / 220, .6, .9);
  else { const xg = xgOf(u, v, pr, o.kind === 'head') * (o.kind === 'fk' ? .75 : 1); g = clamp(xg * Math.exp((skill - 72) / 28 - (gks - 72) / 34) * (p.me && hasPerk('fin') && !o.kind ? 1.12 : 1) * (p.me && hasPerk('cf') && o.kind === 'fk' ? 1.2 : 1) * (gk.me && hasPerk('cat') ? .9 : 1), .004, .85); }
  if (p.me && hasPerk('pen') && o.kind === 'pen') g = Math.min(.93, g + .06);
  return { g, pb, d, u, v, gk };
}
function laneBlock(E, k, u, v) { let pb = 0; const sol = E.T[1 - k].tac.solid || 1; for (const x of E.T[1 - k].pl) { if (!x.on || x.rc || x.role === 'GK') continue; const xu = k === 0 ? x.x : PL - x.x; if (xu > u && xu - u < 12) { const xv = k === 0 ? x.y : PW - x.y, dd = segDist(xu, xv, u, v, PL, 34)[0]; if (dd < 2.4) pb += ME_BL * sol * (1 - dd / 2.4); } } return Math.min(.65, pb); }
function shotGoalProb(E, k, p, o) { const m = shotModel(E, k, p, o); return (1 - m.pb) * m.g; }
// visée : vitesse initiale pour que le ballon passe en (gx, ty, tz) malgré gravité, traînée et effet
function aimShot(E, x0, y0, z0, gx, ty, tz, v, cu, tp) {
  const dx = gx - x0, dy = ty - y0, D = hy(dx, dy) || 1, ux = dx / D, uy = dy / D;
  let yaw = Math.atan2(dy, dx), pit = Math.atan2(tz - z0, D) + GRAV * D / (2 * v * v) * .9;
  for (let it = 0; it < 5; it++) {
    const s = { x: x0, y: y0, z: z0, vx: v * Math.cos(pit) * Math.cos(yaw), vy: v * Math.cos(pit) * Math.sin(yaw), vz: v * Math.sin(pit), cu, tp }; let t = 0;
    while (t < 4) { physStep(E, s, .02); t += .02; if ((s.x - x0) * ux + (s.y - y0) * uy >= D) break; }
    const lat = -(s.x - x0) * uy + (s.y - y0) * ux, ez = s.z - tz;
    if (Math.abs(lat) < .03 && Math.abs(ez) < .03) break;
    yaw -= lat / D; pit -= ez / D * (s.z === 0 && tz < .3 ? .5 : 1);
  }
  return [v * Math.cos(pit) * Math.cos(yaw), v * Math.cos(pit) * Math.sin(yaw), v * Math.sin(pit)];
}
const SHOT_K = { CM: 3, DM: 2, AM: 2.4, LW: 1.5, RW: 1.5, ST: .5, CB: .6, LB: 1, RB: 1, GK: 0 };
let ME_SI = 14; const ME_PG0 = 0;
let ME_LAT = 1.25, ME_PX = .8;
let ME_ADV = .45, ME_CA = 92, ME_WI = .3, ME_DOM = .0005, ME_HW = .3, ME_PS = .008, ME_TB = 8, ME_QB = 2, ME_RP = .5, ME_RR = 2.2, ME_DF = .35, ME_KO = .5, ME_CO = .3, ME_HC = .3, ME_RB = 1, ME_RM = .2, ME_DP = .1, ME_DN = .1, ME_RS = 1.8, ME_LN = .12, ME_SB = .006, ME_BL = .5, ME_PL = .4, ME_B = .025, ME_QP = .08, ME_CMP = .62, ME_G = .85, ME_SH = .85, ME_CR = .05, ME_TAU = .003, ME_HOLD = 1.1, ME_TK = .01, ME_FT = .11, ME_FB = .003, ME_FD = .15;
let ME_DRV = .8, ME_DRC = .0015, ME_REST = 4, ME_SPK = .04, ME_SKP = 20, ME_SKS = 22, ME_SKC = 120, ME_SKD = 110, ME_GKL = 1.5, ME_URG = .00015, ME_XCO = .7, ME_TCO = .35, ME_PCO = .7, ME_HCO = .35, ME_HV = .86, ME_PG = .03, ME_SE = 1.4, ME_GKR = 1, ME_CTL = 1, ME_INT = 1, ME_BLK = 1, ME_GKB = 1.4, ME_GKO = .11, ME_VOL = .3;
function meShot(E, k, i, o = {}) {
  const T = E.T[k], p = T.pl[i], b = E.ball, gk = keeper(E, 1 - k);
  const [u, v] = loc(k, b.x, b.y), d = hy(PL - u, v - 34), pr = o.kind === 'pen' || o.kind === 'fk' ? 0 : pressure(E, k, p);
  // décision du joueur gardien (avant la frappe)
  if (!o.decided && !o.mg && gk.me && !E.coach && E.decB > 0 && (o.kind === 'pen' || xgOf(u, v, 0) > .06) && E.clock - E.decLast > 240 && R() < .5) {
    const sDir = R() < .42 ? 0 : R() < .72 ? 2 : 1, m = shotModel(E, k, p, o);
    E.dec = { kind: o.kind === 'pen' ? 'gkpen' : 'gk', k: 1 - k, shooter: [k, i], o, sDir, base: clamp(1 - m.g / .62, .1, .9), sn: p.n, d: Math.round(d), head: o.kind === 'head' };
    E.stop = 'decision'; return;
  }
  const [gu, gv] = loc(k, gk.x, gk.y), gkOff = Math.max(0, PL - gu);
  let kind = o.kind || '';
  if (!kind && gkOff > 7 && d > 12 && d < 32 && Math.abs(v - 34) < 18 && R() < .5) kind = 'chip';
  const style = kind === 'head' || kind === 'pen' || kind === 'fk' || kind === 'chip' || kind === 'volley' ? kind : (d > 15 && R() < .4 + (p.a.sho - 72) / 100) ? 'curl' : 'power';
  // cible : le côté le plus ouvert, à ras de terre ou sous la barre
  const far = (gv < 34 ? 1 : -1) * (Math.abs(gv - 34) < .5 ? (R() < .5 ? 1 : -1) : 1), sd = o.sDir != null ? [-1, 0, 1][o.sDir] || (R() < .5 ? -1 : 1) : R() < .72 ? far : -far;
  let ty = 34 + sd * rf(2.2, 3.25), tz = R() < .58 ? rf(.15, .6) : rf(1.1, 2.15), sp = 0, cu = 0, tp = 0, hi = false;
  if (style === 'power') sp = rf(27, 31) + (p.a.sho - 72) * .05;
  else if (style === 'curl') { sp = rf(22, 25.5) + (p.a.sho - 72) * .04; cu = -sd * rf(.08, .14) * (k === 0 ? 1 : 1); }
  else if (style === 'head') { sp = rf(11, 15) + (p.a.phy - 72) * .05; tz = rf(.1, 1.2); }
  else if (style === 'volley') { sp = rf(24, 29); }
  else if (style === 'chip') { sp = rf(15, 18); tz = rf(1.2, 2.1); ty = 34 + sd * rf(0, 2.5); }
  else if (style === 'fk') { sp = rf(24, 27); cu = -sd * rf(.1, .16); tp = -rf(.18, .3); tz = rf(1.3, 2.15); ty = 34 + sd * rf(2.4, 3.3); }
  else if (style === 'pen') { const pw = R() < .3; sp = pw ? rf(27, 31) : rf(22, 25); tz = pw ? rf(.9, 2.1) : rf(.15, .7); ty = 34 + (o.sDir === 1 || (o.sDir == null && R() < .1) ? 0 : sd) * rf(1.8, 3.2); }
  // issues imposées (décisions du joueur, mini-jeux) : la trajectoire est choisie en conséquence
  let force = null;
  if (o.mg) { const vw = o.mg.view, col = vw.zone % 3, top = vw.zone < 3; ty = vw.ty != null ? vw.ty : 34 + [-2.7, 0, 2.7][col]; tz = vw.tz != null ? vw.tz : top ? 1.95 : .3; if (vw.cu != null) cu = vw.cu; if (vw.sp) sp = vw.sp; if (vw.dive != null && o.gkDir == null) o = Object.assign({}, o, { gkDir: [-1, 0, 1][vw.dive] }); if (vw.wide) force = 'off'; else if (R() < o.mg.p) force = 'goal'; else force = R() < .78 ? 'save' : 'wood'; }
  else if (o.forceP != null) force = R() < o.forceP ? 'goal' : (R() < .62 ? 'save' : R() < .8 ? 'off' : 'wood');
  else if (o.forceRes) force = o.forceRes;
  if (force === 'goal') { ty = clamp(ty, 34 - 3.1, 34 + 3.1); tz = Math.min(tz, 2.1); }
  else if (force === 'off') { if (R() < .5) { tz = rf(2.7, 3.4); } else ty = 34 + sd * rf(4.1, 5.2); }
  else if (force === 'wood') { if (R() < .7) { ty = 34 + sd * (GHW + PR + .02); tz = rf(.4, 2.1); } else { tz = GH + PR + .03; ty = 34 + rf(-2.8, 2.8); } }
  else if (force === 'save') { ty = 34 + sd * rf(.6, 2.4); tz = rf(.3, 1.8); }
  // erreur d'exécution (adresse, pression, météo)
  const [gx] = glob(k, PL, 34), [, gy] = glob(k, PL, ty);
  let [vx, vy, vz] = aimShot(E, b.x, b.y, Math.max(b.z, .11), gx, gy, tz, sp, cu * (k === 0 ? 1 : 1), tp);
  if (!force) {
    const base = { power: .085, curl: .058, head: .11, volley: .1, chip: .07, fk: .075, pen: .045 }[style] || .08;
    const sg = base * ME_SE * Math.exp(-((style === 'head' ? (p.a.sho + p.a.phy) / 2 : p.a.sho) - 72) / ME_SKS) * (1 + pr * .32) * (1 + (E.cdr || 0) * 6) * (p.me && hasPerk('fin') ? .9 : 1);
    const ey = gauss() * sg, ep = gauss() * sg * .75, es = 1 + gauss() * .05, h = hy(vx, vy), yaw = Math.atan2(vy, vx) + ey, pit = Math.atan2(vz, h) + ep, V = hy(h, vz) * es;
    vx = V * Math.cos(pit) * Math.cos(yaw); vy = V * Math.cos(pit) * Math.sin(yaw); vz = V * Math.sin(pit);
  }
  p.st.sh++; T.st.sh++;
  const xg = o.kind === 'pen' ? .76 : xgOf(u, v, pr, kind === 'head') * (kind === 'fk' ? .75 : 1);
  const rec = { t: E.time, k, u: Math.round(u * 10) / 10, v: Math.round(v * 10) / 10, res: '', xg: Math.round(xg * 1000) / 1000, me: !!p.me, n: p.n, kind: o.kind || (kind === 'chip' || kind === 'volley' ? kind : ''), c: E.clock, h: E.half };
  E.shots.push(rec);
  meCm(E, 'shot', k, p, { kind: o.kind || kind, style, d: Math.round(d), gk: gk.n, xg });
  if (b.z < .11) b.z = .11;
  launch(E, k, i, vx, vy, vz, cu, tp, 'shot', { shot: true, sk: o.kind || kind || '', style, xg, rec, force, pen: o.kind === 'pen', safe: !!force });
  const K = b.kick; K.gkp = gkPlan(E, 1 - k, force, o.kind === 'pen', o.gkDir != null ? (k === 0 ? o.gkDir : -o.gkDir) : null);
  b.f = { res: force || (K.gkp && K.gkp.on ? (K.gkp.save ? 'save' : 'goal') : 'off'), t0: E.time, dur: K.gkp ? K.gkp.t - E.time : .9, kind: 'shot' };
  E.last = [k, i]; E.poss = k;
}
// plan du gardien : où le ballon passera, peut-il l'atteindre à temps ?
function gkPlan(E, dk, force, pen, gkDir, late) {
  const b = E.ball, gk = keeper(E, dk); if (!gk) return null;
  const gi = E.T[dk].pl.indexOf(gk), gx = dk === 0 ? 0 : PL, dir = dk === 0 ? -1 : 1, gd = Math.max(.3, Math.abs(gk.x - gx));
  const s = { x: b.x, y: b.y, z: b.z, vx: b.vx, vy: b.vy, vz: b.vz, cu: b.cu, tp: b.tp };
  let t = 0, at = null, cross = null;
  while (t < 3.2) {
    const ox = s.x, oy = s.y, oz = s.z; physStep(E, s, .02); t += .02;
    if (!at && Math.abs(s.x - gx) <= gd) at = { t, x: s.x, y: s.y, z: s.z, v: hy(hy(s.vx, s.vy), s.vz) };
    if ((s.x - gx) * dir >= BR) { const f = ((gx + dir * BR) - ox) / ((s.x - ox) || 1e-6); cross = { y: oy + (s.y - oy) * f, z: oz + (s.z - oz) * f }; break; }
    if (s.z === 0 && hy(s.vx, s.vy) < 3) break;
  }
  const on = !!cross && Math.abs(cross.y - 34) < GHW - .02 && cross.z < GH - .02;
  if (!at) at = cross ? { t, x: gx, y: cross.y, z: cross.z, v: hy(hy(s.vx, s.vy), s.vz) } : null;
  if (!at) return null;
  const gs = gk.a.gk, dy = at.y - gk.y, ady = Math.abs(dy);
  let save, tau = (.15 - (gs - 72) * .003) * ME_GKR + (late ? .14 : 0);
  // écran : défenseurs entre le tireur et le gardien
  if (!pen) for (const q of E.T[dk].pl) { if (!q.on || q.rc || q === gk) continue; const [dd, f] = segDist(q.x, q.y, b.x, b.y, gk.x, gk.y); if (f > .15 && f < .9 && dd < .8) { tau += .1; break; } }
  const dReq = hy(Math.max(0, ady - .38), Math.max(0, at.z - 2.05) * 1.3) + (at.z < .5 && ady > 1.3 ? .22 : 0) + (at.z > 1.8 && ady > 2 ? .2 : 0);
  let Ra = Math.min(2.5 + clamp(at.t - .5, 0, .65) * ME_GKL + (gs - 72) * .02, ME_GKB + (gs - 72) * .01 + Math.max(0, at.t - tau) * (4.5 + (gs - 72) * .05));
  let pS = sgm((Ra - dReq) / .2) * (.95 - (E.cond.rain || E.cond.snow ? .04 : 0)) * (gk.me && hasPerk('cat') ? 1.06 : 1);
  if (pen) {
    const bs = Math.abs(at.y - 34) < .7 ? 0 : at.y > 34 ? 1 : -1; let g = gkDir != null ? gkDir : (R() < .44 ? -1 : R() < .79 ? 1 : 0);
    if (gkDir == null && force === 'save') g = bs; else if (gkDir == null && force === 'goal' && R() < .7) g = bs === 0 ? (R() < .5 ? -1 : 1) : -bs;
    pS = g === bs ? (bs === 0 ? .72 : sgm((2.35 + (gs - 72) * .01 - dReq + 1.2) / .25) * .78) : .02; at.guess = g;
  }
  if (force) save = force === 'save'; else save = on && R() < pS;
  if (force === 'goal' || force === 'off' || force === 'wood') save = false;
  const hold = save && at.v < 22 && ady < .9 && at.z < 1.9 && R() < (E.cond.rain ? .42 : .62);
  // plongeon (ou arrêt sur sa ligne) : visible à l'écran
  const lvl = at.z > 1.6 ? .85 : at.z > .7 ? 1.15 : 1.4;
  if (pen) { const g = at.guess; if (g) { setAct(E, gk, GEST.DIVE, g * lvl, 0); gk.dive = { x: gk.x, y: gk.y + g * 2.5, until: E.time + 1.2, from: E.time }; } else setAct(E, gk, save ? GEST.CATCH : GEST.BLOCK, 0, .1); }
  else if (on || ady < 3.5) { if (save && ady < .7) setAct(E, gk, hold ? GEST.CATCH : GEST.BLOCK, 0, Math.max(0, at.t - .3)); else if (ady > .5) { const dl = Math.min(at.t * .7, tau); setAct(E, gk, GEST.DIVE, (dy > 0 ? 1 : -1) * lvl, dl); gk.dive = { x: gk.x + (at.x - gk.x) * .5, y: gk.y + clamp(dy, -2.6, 2.6) * (save ? 1 : .8), until: E.time + 1.2, from: E.time + dl }; } }
  return { t: E.time + at.t, y: at.y, z: at.z, save, hold, on, gi, dk, pv: b.pv, done: false };
}

// ---------- Décisions du porteur ----------
// probabilité estimée qu'une passe arrive : vraies lignes de passe (qui peut couper avant le receveur ?) + adresse
function passEst(E, k, p, tx, ty, loft, q) {
  const L = dst(p.x, p.y, tx, ty);
  let tB; if (loft) tB = loftFor(L > 40 ? 26 : 30, L)[1]; else { const vA = vArr(L); tB = groundT(E, Math.min(30, groundV0(E, L, vA)), vA); }
  const sig = passSig(E, k, p, L, loft); let ps = 1 - clamp((sig - .9) * .1, 0, .45) - (E.cpa || 0);
  const O = E.T[1 - k].pl, sol = E.T[1 - k].tac.solid || 1;
  for (let n = 0; n < O.length; n++) {
    const o = O[n]; if (!o.on || o.rc || o.busy > E.time) continue;
    let risk = 0;
    if (loft) { const d = dst(o.x, o.y, tx, ty); if (d < 14) { const to = .3 + Math.max(0, d - 1.1) / pMax(o); risk = sgm((tB - to) / .3) * .5 * (.7 + o.a.def / 240); } }
    else for (let f = .25; f <= 1.001; f += .25) { const px = p.x + (tx - p.x) * f, py = p.y + (ty - p.y) * f, ddx = o.x - px, ddy = o.y - py, d = Math.sqrt(ddx * ddx + ddy * ddy); if (d > 11) continue; const tb = tB * Math.pow(f, .8), to = .25 + Math.max(0, d - .85) / pMax(o), r = sgm((tb - to) / .17) * (f > .99 ? .45 : .8) * (.7 + o.a.def / 240); if (r > risk) risk = r; }
    if (risk > 0) ps *= 1 - Math.min(.95, risk * ME_INT * (sol > 1 ? 1 + (sol - 1) * .4 : 1));
  }
  if (q) { const tq = tReach(q, tx, ty, .8); if (tq > tB + .25) ps *= Math.max(.25, 1 - (tq - tB - .25) * .7); }
  return clamp(ps, .03, .985);
}
function bestPasses(E, k, i) {
  const T = E.T[k], p = T.pl[i], [u, v] = loc(k, p.x, p.y), pr = pressure(E, k, p), lose = lossCost(u, v), out = [];
  const line = offLine(E, k), offL = Math.max(line, u, 52.5), urge = ME_URG * clamp((E.time - (T.possT0 ?? E.time)) / 15, 0, 1.6) * (u < 60 ? 1 : .5);
  // adversaires restant entre le ballon et le but (pour récompenser les passes qui cassent les lignes)
  let ahead0 = 0; for (const o of E.T[1 - k].pl) if (o.on && !o.rc && (k === 0 ? o.x : PL - o.x) > u) ahead0++;
  T.pl.forEach((q, j) => {
    if (!q.on || q.rc || j === i || q.busy > E.time) return; if (q.role === 'GK' && (u > 35 || pr < 1)) return;
    const [qu, qv] = loc(k, q.x, q.y); if (qu < u - 25 && pr < .6) return;
    const offs = qu > offL + .2;
    const L = dst(p.x, p.y, q.x, q.y); if (L > 58) return;
    const lofted = L > 34, ps = passEst(E, k, p, q.x + q.vx * .45, q.y + q.vy * .45, lofted, q);
    let ahead = 0; for (const o of E.T[1 - k].pl) if (o.on && !o.rc && (k === 0 ? o.x : PL - o.x) > qu) ahead++;
    let ev = ps * posVal(qu, qv) * (1 - Math.min(1.5, pressure(E, k, q)) * ME_RP) - (1 - ps) * lose * .9 + ps * Math.max(0, ahead0 - ahead) * .0011; if (qu > u + 8) ev += .0015 * T.plan.direct;
    if (offs) ev -= .06; ev += T.bB * (2 * ps - 1) + (qu - u) * urge * ps;
    out.push({ k: 'pass', j, ps, ev, q });
    // appel en profondeur : ballon dans l'espace
    if (!offs && q.role !== 'GK' && (q.run > E.time || (qu > u && (q.role === 'ST' || q.role === 'LW' || q.role === 'RW' || q.role === 'AM') && line - qu < 3))) {
      const tp = thruPoint(E, k, p, q), [tu, tv] = loc(k, tp.tx, tp.ty);
      if (tu > qu + 2) { const ps2 = passEst(E, k, p, tp.tx, tp.ty, tp.loft, q) * .92; out.push({ k: 'thru', j, ps: ps2, ev: ps2 * posVal(tu, tv) - (1 - ps2) * lose * .9 + .002 * T.plan.direct + T.bB * (2 * ps2 - 1), q }); }
    }
  });
  return out;
}
function meDecide(E, k, i) {
  const T = E.T[k], p = T.pl[i], [u, v] = loc(k, p.x, p.y), pr = pressure(E, k, p), lose = lossCost(u, v), opts = bestPasses(E, k, i), urge = ME_URG * clamp((E.time - (T.possT0 ?? E.time)) / 15, 0, 1.6) * (u < 60 ? 1 : .5);
  if (u > 72) { const xg = xgOf(u, v, pr); if (xg > .012) { const lane = laneBlock(E, k, u, v); opts.push({ k: 'shot', ev: (xg * ME_SH * (.8 + p.a.sho / 360) * (1 - lane) + ME_SB) * T.tac.shoot, xg, lane }); } }
  if (u > 76 && Math.abs(v - 34) > 13) T.pl.forEach((q, j) => { if (!q.on || q.rc || j === i) return; const [qu, qv] = loc(k, q.x, q.y); if (qu > 84 && Math.abs(qv - 34) < 13 && (qu > 86 || q.run > E.time)) { const pc = .6 + (p.a.pas - 72) * .006; opts.push({ k: 'cross', j, ps: pc, ev: pc * ME_CR + T.bB * (2 * pc - 1), q }); } });
  const front = frontOpp(E, k, p);
  const pl = Math.min(.6, pr * ME_PL);
  if (!front) opts.push({ k: 'carry', ev: (1 - pl * .7) * posVal(Math.min(104, u + 6), v + (34 - v) * .1) * .97 - pl * .7 * lose + T.bB * (1 - 1.4 * pl) + 7 * urge });
  else if (front.d < 4.5) { const pd = Math.max(.05, dribProb(p, front.o, pr) - (E.cdr || 0)); opts.push({ k: 'drib', o: front, ps: pd, ev: (pd * posVal(Math.min(104, u + 6), v) - (1 - pd) * lose) * ME_DRV - ME_DRC + (p.a.dri - 72) * .0003 + T.bB * (2 * pd - 1) * .85 }); }
  if (u < 30 && pr > .6) opts.push({ k: 'clear', ev: -.012 - T.bB });
  opts.push({ k: 'hold', ev: (1 - pl) * posVal(u, v) * (u < 52 ? ME_HV - .06 : ME_HV + .04) - pl * lose + T.bB * ((1 - pl) * .92 - pl) });
  // décision réservée au joueur (moments clés)
  const deep = p.me && ['MC', 'MDC', 'DL', 'DC'].includes(S.p.pos);
  if (p.me && !E.coach && E.decB > 0 && E.clock - E.decLast > 300 && u >= (deep ? 58 : 70) && R() < .7) {
    const shot = opts.find(o => o.k === 'shot'), dr = opts.find(o => o.k === 'drib'), cr = opts.filter(o => o.k === 'cross').sort((a, b) => b.ev - a.ev)[0];
    const pa = opts.filter(o => (o.k === 'pass' || o.k === 'thru') && loc(k, o.q.x, o.q.y)[0] > u - 6).sort((a, b) => b.ev - a.ev);
    if ((shot && shot.xg > (deep ? .02 : .03)) || (dr && u > (deep ? 60 : 76)) || cr || (deep && pa.length >= 2 && R() < .5)) {
      const L = [];
      if (shot) L.push({ t: 'Frapper', act: 'shot', at: 'TIR', out: 'goal', p: shotGoalProb(E, k, p, {}) });
      if (dr) L.push({ t: 'Dribbler ' + dr.o.o.n, act: 'drib', at: 'DRI', out: 'drib', p: dr.ps });
      if (cr) L.push({ t: 'Centrer pour ' + cr.q.n, act: 'cross', j: cr.j, at: 'PAS', out: 'assist', p: cr.ps * .45 });
      for (const x of pa.slice(0, cr ? 1 : 2)) L.push({ t: (x.k === 'thru' ? 'Lancer ' : 'Passer à ') + x.q.n + (x.k === 'thru' ? ' en profondeur' : ''), act: x.k, j: x.j, at: 'PAS', out: 'pass', p: x.ps });
      if (L.length >= 2) { E.dec = { kind: 'att', k, i, opts: L.slice(0, 4), d: Math.round(hy(PL - u, v - 34)), fo: front ? front.o.n : '', box: u > 88.5 && Math.abs(v - 34) < 20 }; E.stop = 'decision'; return; }
    }
  }
  // envie de frapper : dépend de l'occasion, du poste et de la liberté de tir
  const so = opts.find(o => o.k === 'shot');
  // servi par ton joueur dans les 25 derniers mètres : il tente sa chance
  if (so && p.chance > E.time && so.xg > .025) { p.chance = 0; meAct(E, k, i, so); return; }
  if (so) {
    const imp = clamp((so.xg - .008) * ME_SI * (p.chance > E.time ? 3 : 1) * (SHOT_K[p.role] || 1) * (1 - so.lane) * (.75 + p.a.sho / 290) * T.tac.shoot * (1 - Math.min(.5, Math.max(0, pr - 1) * .3)), 0, .93);
    if (R() < imp) { meAct(E, k, i, so); return; }
    opts.splice(opts.indexOf(so), 1);
  }
  const tau = ME_TAU * clamp(1.6 - p.a.pas / 120, .4, 1.5);
  const mx = Math.max(...opts.map(o => o.ev)); let tot = 0; const w = opts.map(o => { const x = Math.exp((o.ev - mx) / tau); tot += x; return x; });
  let r = R() * tot, ch = opts[opts.length - 1]; for (let n = 0; n < opts.length; n++) { r -= w[n]; if (r <= 0) { ch = opts[n]; break; } }
  meAct(E, k, i, ch);
}
function dribProb(p, o, pr) { return clamp(.5 + (p.a.dri - o.a.def) / 70 + (p.a.spd - o.a.spd) / 200 + (p.me && hasPerk('drib') ? .05 : 0) - ME_DP * Math.max(0, (pr || 0) - 1), .1, .85); }
function tackleProb(o, p) { return clamp(.4 + (o.a.def - p.a.dri) / 80 + (o.me && hasPerk('wall') ? .06 : 0), .1, .78); }
function meAct(E, k, i, ch, forced) {
  const T = E.T[k], p = T.pl[i], [u, v] = loc(k, p.x, p.y);
  if (ch.k === 'pass' || ch.k === 'thru') { mePass(E, k, i, ch.j, 'pass', ch.k === 'thru', forced || null); return; }
  if (ch.k === 'cross') { meCross(E, k, i, ch.j, false, forced); return; }
  if (ch.k === 'shot') { meShot(E, k, i, ch.o || {}); return; }
  if (ch.k === 'clear') { meClear(E, k, i); return; }
  if (ch.k === 'carry') { p.carry = glob(k, Math.min(103, u + 8), v + (34 - v) * .15); E.timer = (1 + R() * .9) * T.tac.tempo; return; }
  if (ch.k === 'hold') { p.carry = null; E.timer = .5 + R() * .5; return; }
  if (ch.k === 'drib') {
    const fo = ch.o.o, fi = ch.o.i; p.st.dra++;
    const ok = forced != null ? forced : R() < ch.ps;
    if (!ok && R() < (u >= 88.5 && Math.abs(v - 34) <= 20 ? ME_FB : ME_FD)) { if (meFoul(E, 1 - k, fi, k, i)) return; }
    meCm(E, 'drib', k, p, { n2: fo.n, ok });
    if (ok) { p.st.drs++; fo.beat = E.time + 1; p.carry = glob(k, Math.min(102, u + (u > 85 ? 4 : 7)), v + (34 - v) * .15); E.timer = .8 + R() * .6; meEv(E, 'drib', k, p, { o: fo.n }); setAct(E, p, GEST.CTRL, p.face); }
    else { p.st.lost++; fo.st.tk++; setAct(E, fo, GEST.TACKLE, fo.face); if (R() < .5) giveBall(E, 1 - k, fi); else knockLoose(E, 1 - k, fi, 3.5); }
  }
}

// ---------- Fautes, cartons, changements ----------
function penTaker(E, vk) { const V = E.T[vk]; return V.pl.map((p, i) => [p, i]).filter(([p]) => p.on && !p.rc && p.role !== 'GK').sort((a, b) => (b[0].a.sho + (b[0].me && hasPerk('pen') ? 15 : 0)) - (a[0].a.sho + (a[0].me && hasPerk('pen') ? 15 : 0)))[0]; }
function meFoul(E, fk, fi, vk, vi) {
  const F = E.T[fk], f = F.pl[fi], V = E.T[vk], vp = V.pl[vi], [u, v] = loc(vk, vp.x, vp.y);
  f.st.fo++; F.st.fo++;
  const inBox = u >= 88.5 && Math.abs(v - 34) <= 20.16, counter = u > 55 && onPl(F).filter(o => loc(vk, o.x, o.y)[0] > u).length <= 3;
  // l'arbitre juge à l'œil : près de la ligne de surface, il peut se tromper (la VAR corrige)
  const near = Math.abs(u - 88.5) < 2.5 && Math.abs(v - 34) <= 21, refBox = near ? (u + gauss() * .9 >= 88.5 && Math.abs(v - 34) <= 20.16 + gauss() * .4) : inBox;
  const inj = R() < .012, adv = !refBox && !inBox && !inj && u > 45 && R() < ME_ADV;
  meEv(E, 'foul', fk, f, { v: vp.n, pen: refBox, adv });
  setAct(E, f, R() < .45 ? GEST.SLIDE : GEST.TACKLE, Math.atan2(vp.y - f.y, vp.x - f.x));
  if (!adv) { setAct(E, vp, GEST.FALL, vp.face); vp.busy = E.time + (inj ? 9 : 1.6); }
  let card = null;
  if (R() < .002 || (counter && R() < .015)) card = 'R'; else if (R() < (.14 + (counter ? .14 : 0) + (inBox ? .1 : 0)) * (f.yc ? .25 : 1)) card = 'Y';
  if (card) meCard(E, fk, fi, card);
  if (inj) { meEv(E, 'inj', vk, vp); vp.injured = true; meSubOut(E, vk, vi, 'blessure'); }
  if (adv && vp.on) { meCm(E, 'adv', vk, vp, { f: f.n }); giveBall(E, vk, V.pl.indexOf(vp), .3 + R() * .4); return true; }
  E.arb.act = GEST.CARD; E.arb.actT = E.time;
  const [px, py] = glob(vk, PL - 11, 34), tk = penTaker(E, vk);
  if (refBox) {
    setRestart(E, 'pen', vk, px, py, rsd('pen')); E.rs.taker = tk[1]; meEv(E, 'penalty', vk, tk[0]);
    if (!inBox) E.var = { kind: 'pen', ok: false, vk, x: vp.x, y: vp.y, t0: E.time, at: E.time + rf(28, 50) };
    else if (R() < .3) E.var = { kind: 'pen', ok: true, vk, t0: E.time, at: E.time + rf(20, 35) };
  } else {
    setRestart(E, 'fk', vk, vp.x, vp.y, rsd('fk') + (card ? 12 : 0));
    if (inBox) E.var = { kind: 'pen', ok: true, award: true, vk, taker: tk[1], t0: E.time, at: E.time + rf(30, 55) };
  }
  if (E.var && E.var.kind === 'pen' && E.var.t0 === E.time) { meEv(E, 'varchk', vk, null, { what: 'pen' }); E.rs.at = Math.max(E.rs.at, E.var.at + 6); }
  return true;
}
function meCard(E, k, i, c) {
  const T = E.T[k], p = T.pl[i];
  if (c === 'Y') { p.yc++; T.st.yc++; meEv(E, 'yellow', k, p); if (p.yc >= 2) c = 'R2'; }
  if (c === 'R' || c === 'R2') { p.rc = true; p.on = false; p.offM = minNum(E.clock, E.half); T.st.rc++; E.rv = (E.rv || 0) + 1; meEv(E, 'red', k, p, { second: c === 'R2' }); }
}
function meSubOut(E, k, i, why) {
  const T = E.T[k], p = T.pl[i]; if (T.subs >= 5) return false;
  const b = T.bench.find(x => !x.used && SLOTS_OF[x.c.pos] && SLOTS_OF[x.c.pos].includes(p.role)) || T.bench.find(x => !x.used && x.c.pos !== 'GB');
  if (!b) return false;
  b.used = true; T.subs++;
  const np = mePlayer(b.c, p.role, k, i, T.shift, E.base); np.au = p.au; np.av = p.av; np.x = p.x; np.y = p.y; np.num = b.c.num || 12 + T.subs;
  p.on = false; p.offM = minNum(E.clock, E.half); np.onM = p.offM; T.pl[i] = np; if (!T.out) T.out = []; T.out.push(p); E.rv = (E.rv || 0) + 1;
  meEv(E, 'sub', k, np, { out: p.n, outMe: !!p.me, why: why || '' });
  const b0 = E.ball.own; if (b0 && b0[0] === k && b0[1] === i) { E.ball.st = 'air'; E.ball.own = null; E.ball.pv++; }
  return true;
}
function meSubIn(E, k, i, np, why) { const T = E.T[k], p = T.pl[i]; np.au = p.au; np.av = p.av; np.x = p.x; np.y = p.y; np.role = p.role; np.sta = 100; np.on = true; p.on = false; p.offM = minNum(E.clock, E.half); np.onM = p.offM; T.pl[i] = np; if (!T.out) T.out = []; T.out.push(p); T.subs++; E.rv = (E.rv || 0) + 1; meEv(E, 'sub', k, np, { out: p.n, outMe: !!p.me, why: why || '' }); const b0 = E.ball.own; if (b0 && b0[0] === k && b0[1] === i) { E.ball.st = 'air'; E.ball.own = null; E.ball.pv++; } }

// ---------- Coups d'envoi et arrêts de jeu ----------
function meKickoff(E, k, first) {
  const b = E.ball; b.x = 52.5; b.y = 34; b.z = 0; b.vx = b.vy = b.vz = 0; b.st = 'dead'; b.own = null; b.f = null; b.kick = null; b.hand = false;
  E.rs = { type: 'ko', k, at: E.time + (first ? .8 : 2.5) };
  for (let t = 0; t < 2; t++) E.T[t].pl.forEach(p => { const [x, y] = glob(t, Math.min(p.au * .5 + 2, 48), p.av); if (first) { p.x = x; p.y = y; p.face = t ? Math.PI : 0; } p.carry = null; p.run = 0; p.dive = null; });
}
const RSD = { pen: [35, 55], fk: [9, 17], off: [7, 12], corner: [14, 24], gk: [10, 18], throw: [5, 11], goal: [35, 50] };
const rsd = t => rf(RSD[t][0], RSD[t][1]) * ME_RS;
function setRestart(E, type, k, x, y, delay) { const b = E.ball; b.st = 'dead'; b.own = null; b.f = null; b.kick = null; b.hand = false; b.vx = b.vy = b.vz = 0; b.z = 0; b.x = clamp(x, 0, PL); b.y = clamp(y, 0, PW); const T = E.T[k]; if (T.plan && T.plan.m < 0) delay *= 1.25; E.rs = { type, k, x: b.x, y: b.y, at: E.time + delay }; E.poss = k; }
function giveBall(E, k, i, tm, hand) {
  const b = E.ball, p = E.T[k].pl[i];
  if (E.pk !== k) { if (E.pk >= 0) E.T[E.pk].lostT = E.time; E.pk = k; E.T[k].possT0 = E.time; if (!E.rs && E.cm) { const pu = k === 0 ? p.x : PL - p.x; if (pu > 28 && pu < 70) { let ahead = 0; for (const o of E.T[1 - k].pl) if (o.on && !o.rc && (k === 0 ? o.x : PL - o.x) > pu) ahead++; if (ahead <= 5) meCm(E, 'counter', k, p, { u: Math.round(pu) }); } } }
  b.st = 'own'; b.own = [k, i]; b.f = null; b.kick = null; b.z = hand ? 1.1 : 0; b.vx = b.vy = b.vz = 0; b.cu = b.tp = 0; b.x = p.x; b.y = p.y; b.hand = !!hand; b.pv++;
  E.poss = k; E.last = [k, i]; E.timer = tm ?? (ME_HOLD + R() * ME_HOLD * 2.5) * E.T[k].tac.tempo; p.carry = null; p.run = 0;
  if (hand) setAct(E, p, GEST.CATCH, p.face);
}
// ballon qui échappe après un contact : souvent en touche près des lignes
function knockLoose(E, tk, ti, sp) {
  const b = E.ball; b.st = 'air'; b.own = null; b.f = null; b.kick = { k: tk, i: ti, kind: 'loose', t0: E.time, j: -1 }; b.hand = false; b.pv++; E.last = [tk, ti]; E.poss = tk;
  const s = sp || 4; b.vx = rf(-s, s); b.vy = rf(-s, s); b.vz = R() < .3 ? rf(1, 3) : 0; b.cu = b.tp = 0;
  if ((b.y < 9 || b.y > PW - 9) && R() < ME_KO) { b.vy = (b.y < 34 ? -1 : 1) * rf(6, 9); }
}
// un ballon renvoyé vers sa propre ligne de but doit passer à côté des poteaux (sinon il repart devant)
function safeWide(b, gx) { if (Math.sign(b.vx) !== Math.sign(gx - b.x) || Math.abs(b.vx) < .1) return; const t = Math.abs((gx - b.x) / b.vx), yc = b.y + b.vy * t; if (Math.abs(yc - 34) < 4.6) { if (Math.abs(b.y - 34) > 5 && Math.sign(yc - 34) === Math.sign(b.y - 34)) { b.vy = (b.y < 34 ? -1 : 1) * Math.max(Math.abs(b.vy), 4); } else b.vx = -b.vx; } }
// ballon dévié : direction et vitesse changent
function deflect(E, k, i, keep, spread, up) { const b = E.ball, v = hy(b.vx, b.vy), a = Math.atan2(b.vy, b.vx) + gauss() * spread, s = Math.max(2, v * keep); b.vx = Math.cos(a) * s; b.vy = Math.sin(a) * s; if ((b.y < 8 || b.y > PW - 8) && R() < ME_KO * .7) b.vy = (b.y < 34 ? -1 : 1) * rf(4, 8); b.vz = up ? Math.abs(b.vz) * .3 + rf(0, up) : b.vz * .3; b.cu = 0; b.tp = 0; b.pv++; E.last = [k, i]; const K = b.kick; if (K) { K.defl = (K.defl || 0) + 1; K.dk = k; K.di = i; K.dt = E.time; K.lk = k; K.li = i; K.lt = E.time; K.safe = false; K.fint = -1; if (!K.shot) K.kind = 'loose'; } }
function nearestTo(E, k, x, y, excl) { let best = -1, bd = 1e9; E.T[k].pl.forEach((p, i) => { if (!p.on || p.rc || i === excl) return; const d = dst(p.x, p.y, x, y); if (d < bd) { bd = d; best = i; } }); return best; }
function roleIdx(E, k, roles, x, y, excl) { let best = -1, bd = 1e9; E.T[k].pl.forEach((p, i) => { if (!p.on || p.rc || i === excl || !roles.includes(p.role)) return; const d = x == null ? 0 : dst(p.x, p.y, x, y); if (d < bd) { bd = d; best = i; } }); return best; }
function doRestart(E) {
  const rs = E.rs, k = rs.k, T = E.T[k]; E.rs = null; E.cel = null;
  if (rs.type === 'ko') { const i = roleIdx(E, k, ['ST'], 52.5, 34); const ii = i >= 0 ? i : nearestTo(E, k, 52.5, 34); T.pl[ii].x = 52.5 - (k ? -.6 : .6); T.pl[ii].y = 34; giveBall(E, k, ii, .3); E.ball.x = 52.5; E.ball.y = 34; const back = roleIdx(E, k, ['DM', 'CM', 'AM'], ...glob(k, 40, 34)); if (back >= 0) mePass(E, k, ii, back, 'pass', false, 'ok'); return; }
  if (rs.type === 'gk') {
    const g = T.pl.findIndex(p => p.on && p.role === 'GK'); const gi = g >= 0 ? g : nearestTo(E, k, rs.x, rs.y); const [x, y] = glob(k, 5.5, 34 + (R() < .5 ? -7 : 7)); T.pl[gi].x = x - (k ? -.5 : .5); T.pl[gi].y = y; giveBall(E, k, gi, 0); E.ball.x = x; E.ball.y = y;
    const oppPress = E.T[1 - k].plan.press, short = R() < clamp(.62 - T.plan.direct * .4 - oppPress * .25 + .15, .1, .85);
    if (short) { const cb = T.pl.map((p, i) => [p, i]).filter(([p]) => p.on && !p.rc && ['CB', 'LB', 'RB', 'DM'].includes(p.role)).sort((a, b) => dst(a[0].x, a[0].y, x, y) - dst(b[0].x, b[0].y, x, y)); if (cb.length) { mePass(E, k, gi, cb[ri(0, Math.min(1, cb.length - 1))][1], 'pass'); return; } }
    meClear(E, k, gi, true); return;
  }
  if (rs.type === 'throw') { const i = nearestTo(E, k, rs.x, rs.y); const p = T.pl[i]; p.x = rs.x; p.y = rs.y; giveBall(E, k, i, 0); E.ball.z = 2.1; const j = nearestTo(E, k, rs.x, rs.y, i); if (j >= 0) mePass(E, k, i, j, 'throw'); else knockLoose(E, k, i, 3); return; }
  if (rs.type === 'corner') { meCorner(E, k, rs); return; }
  if (rs.type === 'fk') { meFreeKick(E, k, rs); return; }
  if (rs.type === 'pen') { const i = rs.taker, p = T.pl[i] && T.pl[i].on ? T.pl[i] : null, ti = p ? i : penTaker(E, k)[1], pp = T.pl[ti];
    const [x0, y0] = glob(k, PL - 11, 34); pp.x = x0 - (k ? -1 : 1); pp.y = y0;
    if (pp.me && !E.coach) { giveBall(E, k, ti, 99); E.ball.x = x0; E.ball.y = y0; const pg = shotGoalProb(E, k, pp, { kind: 'pen' }); E.dec = { kind: 'att', pen: true, k, i: ti, gkn: keeper(E, 1 - k).n, opts: [{ t: 'Placé à ras de terre', act: 'shot', at: 'TIR', out: 'pen', p: pg }, { t: 'En force sous la barre', act: 'shot', at: 'TIR', out: 'pen', p: Math.max(.3, pg - .04) }, { t: 'Panenka', act: 'shot', at: 'TEC', out: 'pen', p: Math.max(.3, pg - .12) }] }; E.stop = 'decision'; E.decB++; return; }
    giveBall(E, k, ti, 0); E.ball.x = x0; E.ball.y = y0; meCm(E, 'penk', k, pp, { gk: keeper(E, 1 - k).n }); meShot(E, k, ti, { kind: 'pen' }); return; }
}
// positions pendant un arrêt de jeu (corner, coup franc, penalty, célébration, sortie de but)
function restartTargets(E, t, p, i) {
  const rs = E.rs; if (!rs) return null;
  const [bu, bv] = loc(t, rs.x ?? 52.5, rs.y ?? 34), att = rs.k === t;
  if (rs.type === 'ko') {
    const C = E.cel;
    if (C && E.time < C.until) { if (C.k === t) { if (C.i === i) return [C.x, C.y, 1]; const sc = E.T[t].pl[C.i]; if (sc && dst(p.x, p.y, sc.x, sc.y) < 26 && p.role !== 'GK') return [sc.x + Math.cos(i * 2.4) * 1.3, sc.y + Math.sin(i * 2.4) * 1.3, .95]; } else return [...glob(t, Math.min(p.au * .5 + 2, 48), p.av), .32]; }
    return [...glob(t, Math.min(p.au * .5 + 2, 48), p.av), .55];
  }
  if (rs.type === 'corner') {
    if (p.role === 'GK') return glob(t, att ? 30 : 1.2, att ? 34 : 34 + (bv < 34 ? -1.2 : 1.2) * (t === 0 ? 1 : 1));
    if (att) { const zones = [[93, 30], [96, 38], [99, 33], [94.5, 34], [99.5, 28], [97, 41], [86, 34]]; if (['CB', 'ST', 'LW', 'RW', 'AM'].includes(p.role)) { const z = zones[i % zones.length]; return glob(t, z[0], bv < 34 ? z[1] : PW - z[1]); } if (p.role === 'DM' || p.role === 'LB' || p.role === 'RB') return glob(t, 60 + (i % 3) * 4, 20 + (i * 7) % 30); return glob(t, 84 + (i % 2) * 2, 22 + (i * 5) % 24); }
    return glob(t, p.role === 'ST' ? 30 : 3 + (i % 5) * 1.6, p.role === 'ST' ? 34 : 28 + (i * 3.1) % 12);
  }
  if (rs.type === 'pen') { if (p.role === 'GK' && !att) return glob(t, .3, 34); if (p.role === 'GK') return glob(t, 50, 34); if (rs.taker === i && att) return null; return glob(t, att ? 80 + (i % 3) * 2.6 : 17 + (i % 3) * 2.6, 13 + ((i * 7.3 + (att ? 0 : 3.5)) % 42)); }
  if (rs.type === 'gk') { if (att && (p.role === 'CB')) return glob(t, 12, p.av < 34 ? 18 : 50); return glob(t, clamp(p.au + (att ? -6 : 10), 4, 95), p.av); }
  if (rs.type === 'fk') {
    if (!att && rs.wall && rs.wall.includes(i)) { const n = rs.wall.indexOf(i), [x0, y0] = glob(1 - t, rs.x, rs.y), [gx, gy] = [t === 0 ? 0 : PL, 34], d = dst(x0, y0, gx, gy) || 1, ux = (gx - x0) / d, uy = (gy - y0) / d; return [x0 + ux * 9.15 - uy * (n - (rs.wall.length - 1) / 2) * .62, y0 + uy * 9.15 + ux * (n - (rs.wall.length - 1) / 2) * .62, .9]; }
    if (!att && bu < 40) return glob(t, Math.min(bu - 9.5, p.au + 4), p.av);
    if (att && rs.cross && ['CB', 'ST', 'LW', 'RW', 'AM', 'CM'].includes(p.role)) { const z = [[94, 30], [96, 37], [92, 34], [97, 42], [90, 26]][i % 5]; return glob(t, z[0], z[1]); }
  }
  return null;
}
// zones visées sur corner (repère de l'équipe qui attaque) : premier poteau, point de penalty, second poteau
function cornerZones(bv) { const s = bv < 34 ? 1 : -1; return [[99.2, 34 - s * 3.6], [94, 34], [98.6, 34 + s * 3.9]]; }
function meCorner(E, k, rs) {
  const T = E.T[k];
  let takerI = T.pl.map((p, i) => [p, i]).filter(([p]) => p.on && !p.rc && p.role !== 'GK').sort((a, b) => b[0].a.pas - a[0].a.pas)[0][1];
  // coup de pied arrêté joué au doigt (pas à chaque corner : comme les autres moments clés, selon le budget du match)
  const mi = k === 0 && !E.coach ? T.pl.findIndex(p => p.me && p.on && !p.rc && p.role !== 'GK') : -1, mp = mi >= 0 ? T.pl[mi] : null;
  if (mp && E.decB > 0 && E.clock - E.decLast > 240 && R() < .6) {
    const [, bv] = loc(k, rs.x, rs.y), Z = cornerZones(bv), take = mi === takerI || (['LW', 'RW', 'AM', 'CM', 'LB', 'RB'].includes(mp.role) && mp.a.pas >= T.pl[takerI].a.pas - 6);
    if (take) takerI = mi;
    const tk = T.pl[takerI]; tk.x = rs.x; tk.y = rs.y; giveBall(E, k, takerI, 99); E.ball.x = rs.x; E.ball.y = rs.y;
    const box = T.pl.map((p, i) => [p, i]).filter(([p, i]) => p.on && !p.rc && i !== takerI && p.role !== 'GK');
    if (take) {
      // pour chaque zone, le partenaire qui l'attaque (le plus proche, un seul par zone)
      const used = new Set(), opts = Z.map((z, zi) => { const c = box.filter(([, i]) => !used.has(i)).map(([p, i]) => [hy(loc(k, p.x, p.y)[0] - z[0], loc(k, p.x, p.y)[1] - z[1]) - (p.a.phy - 70) * .05, i]).sort((a, b) => a[0] - b[0])[0]; if (!c) return null; used.add(c[1]); const q = T.pl[c[1]]; return { t: ['Premier poteau', 'Point de penalty', 'Second poteau'][zi] + ' pour ' + q.n, act: 'corner', z: zi, j: c[1], at: 'PAS', out: 'assist', p: clamp(.36 + (mp.a.pas - 70) / 140 + [0, -.04, .02][zi], .15, .8) }; }).filter(Boolean);
      const sj = nearestTo(E, k, rs.x, rs.y, takerI); if (sj >= 0) opts.push({ t: 'Corner à deux avec ' + T.pl[sj].n, act: 'pass', j: sj, at: 'PAS', out: 'pass', p: .9 });
      if (opts.length >= 2) { E.dec = { kind: 'corner', mode: 'take', k, i: mi, taker: mi, bv, opts }; E.stop = 'decision'; return; }
    } else if (['ST', 'CB', 'LW', 'RW', 'AM'].includes(mp.role) || mp.a.phy >= 72) {
      const hp = clamp(.1 + (mp.a.phy + mp.a.sho - 140) / 420, .05, .35);
      const opts = Z.map((z, zi) => ({ t: ['Attaquer le premier poteau', 'Attaquer le point de penalty', 'Attaquer le second poteau'][zi], act: 'head', z: zi, at: 'TIR', out: 'head', p: clamp(hp + [.03, -.04, .01][zi], .04, .5) }));
      E.dec = { kind: 'corner', mode: 'head', k, i: mi, taker: takerI, bv, tn: tk.n, opts }; E.stop = 'decision'; return;
    }
  }
  const tk = T.pl[takerI]; tk.x = rs.x; tk.y = rs.y; giveBall(E, k, takerI, 0); meCm(E, 'corner', k, tk);
  const box = T.pl.map((p, i) => [p, i]).filter(([p, i]) => p.on && !p.rc && i !== takerI && loc(k, p.x, p.y)[0] > 86 && Math.abs(loc(k, p.x, p.y)[1] - 34) < 13);
  if (!box.length || R() < .12) { const j = nearestTo(E, k, rs.x, rs.y, takerI); mePass(E, k, takerI, j, 'pass'); return; }
  const [tp, ti] = box.sort((a, b) => b[0].a.phy - a[0].a.phy)[ri(0, Math.min(2, box.length - 1))];
  meCross(E, k, takerI, ti, true);
}
function meFreeKick(E, k, rs) {
  const T = E.T[k], [u, v] = loc(k, rs.x, rs.y);
  const cand = T.pl.map((p, i) => [p, i]).filter(([p]) => p.on && !p.rc && p.role !== 'GK');
  if (u >= 76 && Math.abs(v - 34) < 22 && R() < .55 && !rs.done) {
    // mur adverse puis frappe directe
    if (!rs.wall) { const O = E.T[1 - k]; const w = O.pl.map((p, i) => [p, i]).filter(([p]) => p.on && !p.rc && p.role !== 'GK').sort((a, b) => dst(a[0].x, a[0].y, rs.x, rs.y) - dst(b[0].x, b[0].y, rs.x, rs.y)).slice(0, u > 85 ? 5 : u > 80 ? 4 : 3).map(x => x[1]); E.rs = Object.assign({}, rs, { wall: w, at: E.time + 7, done: true }); E.wall = { k: 1 - k, ids: w }; return; }
  }
  if (rs.wall) {
    let [sp, si] = cand.sort((a, b) => (b[0].a.sho + (b[0].me && hasPerk('cf') ? 12 : 0)) - (a[0].a.sho + (a[0].me && hasPerk('cf') ? 12 : 0)))[0];
    // coup de pied arrêté joué au doigt : c'est toi qui le tires si tu es le meilleur tireur, ou un attaquant à peine moins adroit
    const mi = k === 0 && !E.coach ? T.pl.findIndex(p => p.me && p.on && !p.rc && p.role !== 'GK') : -1, mp = mi >= 0 ? T.pl[mi] : null;
    if (mp && (mi === si || (['ST', 'LW', 'RW', 'AM', 'CM'].includes(mp.role) && mp.a.sho >= sp.a.sho - 7) || hasPerk('cf'))) {
      sp = mp; si = mi; sp.x = rs.x - .8; sp.y = rs.y; giveBall(E, k, si, 99); E.ball.x = rs.x; E.ball.y = rs.y;
      const pg = shotGoalProb(E, k, sp, { kind: 'fk' }), box = T.pl.map((p, i) => [p, i]).filter(([p, i]) => p.on && !p.rc && i !== si && loc(k, p.x, p.y)[0] > 86).sort((a, b) => b[0].a.phy - a[0].a.phy);
      const opts = [{ t: 'Frapper le coup franc', act: 'shot', at: 'TIR', out: 'goal', p: pg }];
      if (box.length) opts.push({ t: 'Centrer pour ' + box[0][0].n, act: 'cross', j: box[0][1], at: 'PAS', out: 'assist', p: .3 });
      E.dec = { kind: 'att', fk: true, k, i: si, d: Math.round(hy(PL - u, v - 34)), gkn: keeper(E, 1 - k).n, opts }; E.stop = 'decision'; E.decB++; return;
    }
    sp.x = rs.x - (k ? -.8 : .8); sp.y = rs.y; giveBall(E, k, si, 0); E.ball.x = rs.x; E.ball.y = rs.y;
    for (const wi of rs.wall) { const w = E.T[1 - k].pl[wi]; if (w && w.on) setAct(E, w, GEST.HEAD, 0, .25); }
    meCm(E, 'fkshot', k, sp, { d: Math.round(hy(PL - u, v - 34)) }); meShot(E, k, si, { kind: 'fk' }); return;
  }
  if (u > 66 && (Math.abs(v - 34) > 12 || u < 76) && R() < .7 && !rs.cross) { E.rs = Object.assign({}, rs, { cross: true, at: E.time + 5 }); return; }
  if (rs.cross) { const tkI = cand.sort((a, b) => b[0].a.pas - a[0].a.pas)[0][1], tk = T.pl[tkI]; tk.x = rs.x; tk.y = rs.y; giveBall(E, k, tkI, 0); E.ball.x = rs.x; E.ball.y = rs.y; const box = T.pl.map((p, i) => [p, i]).filter(([p, i]) => p.on && !p.rc && i !== tkI && loc(k, p.x, p.y)[0] > 86); if (box.length) { meCross(E, k, tkI, pick(box)[1], true); meCm(E, 'fk', k, tk, { u: Math.round(u) }); return; } }
  const i = nearestTo(E, k, rs.x, rs.y); T.pl[i].x = rs.x; T.pl[i].y = rs.y; giveBall(E, k, i, .6 + R() * .6); E.ball.x = rs.x; E.ball.y = rs.y; if (u > 60) meCm(E, 'fk', k, T.pl[i], { u: Math.round(u) });
}

// ---------- Déplacements ----------
function stepTo(E, p, tx, ty, sp) {
  if (p.beat > E.time) sp *= .45;
  if (p.busy > E.time) sp *= p.act === GEST.FALL ? 0 : .4;
  const mx = pMax(p), dx = tx - p.x, dy = ty - p.y, d = hy(dx, dy), want = d < .25 ? 0 : Math.min(mx * sp, d / MDT * .45);
  const vx = d ? dx / d * want : 0, vy = d ? dy / d * want : 0;
  p.vx += (vx - p.vx) * .3; p.vy += (vy - p.vy) * .3; p.x += p.vx * MDT; p.y += p.vy * MDT;
  const s2 = p.vx * p.vx + p.vy * p.vy, s = Math.sqrt(s2); p.sta = Math.max(0, p.sta - s2 / (mx * mx) * .0026 * (p.drain || 1) * (E.cond.snow ? 1.1 : 1) * (p.me && hasPerk('iron') ? .7 : 1));
  if (s > .9) { let da = Math.atan2(p.vy, p.vx) - p.face; if (da > Math.PI) da -= 6.2832; else if (da < -Math.PI) da += 6.2832; p.face += da * .35; if (p.face > Math.PI) p.face -= 6.2832; else if (p.face < -Math.PI) p.face += 6.2832; }
}
const isBack = r => r === 'CB' || r === 'LB' || r === 'RB';
const isRunner = r => r === 'LW' || r === 'RW' || r === 'ST' || r === 'CM' || r === 'AM';
// lignes de l'équipe qui défend (u local) : défense, milieu, attaque
function defLines(E, k, bu) {
  const T = E.T[k], P = T.plan, ow = owner(E);
  let Ld = clamp(bu - (13 + 11 * (1 - P.block)), 7 + 4 * P.block, 19 + 28 * P.block);
  if (ow && E.ball.own[0] !== k) { const ok = E.ball.own[0], pr = pressure(E, ok, ow), back = (ok === 0 ? ow.vx : -ow.vx) < -1.5; if (pr > .8 || back) Ld += (P.trap ? 4 : 2) * P.block; else if (bu - Ld < 40 && pr < .3) Ld -= 4 * (1 - P.block * .5); }
  T.ld = T.ld == null ? Ld : T.ld + (Ld - T.ld) * .2;
  const L0 = Math.max(5, T.ld), L1 = L0 + 10 + 6 * P.block, L2 = L1 + 12 + (P.counter ? 4 : 0);
  return (T.L = [L0, L1, L2]);
}
// lignes de l'équipe qui attaque
function attLines(E, k, bu) { const T = E.T[k], P = T.plan, off = offLine(E, k); let fo = 105; for (const o of E.T[1 - k].pl) { if (!o.on || o.rc || o.role === 'GK') continue; const ou = k === 0 ? o.x : PL - o.x; if (ou < fo) fo = ou; } const L0 = clamp(Math.min(bu - 20 + 7 * P.block, fo - ME_REST), 10, 56), L2 = Math.max(L0 + 18, Math.min(off - .7, bu + 46)), L1 = Math.max(L0 + 9, (L0 + L2) / 2 - 2); T.ld = null; return (T.L = [L0, L1, L2]); }
// cible de placement en attaque (u, v, vitesse)
function attTarget(E, k, p, i, L, bu, bv, own) {
  const T = E.T[k], r = p.role, side = p.av < 34 ? -1 : 1, bs = bv < 34 ? -1 : 1, two = T.form === '442' || T.form === '352' || T.form === '532', F = T.form;
  let u, v, sp = .6;
  if (r === 'CB') { u = L[0]; v = 34 + (p.av - 34) * (bu < 32 ? 1.55 : 1.12) + (bv - 34) * .15; }
  else if (r === 'LB' || r === 'RB') { const wb = F === '352'; if (wb || (bs === side && bu > 48)) { u = clamp(bu + (wb ? 1 : 4), L[0] + 8, L[2] - 2); v = side < 0 ? 4 : 64; sp = .8; } else { u = L[0] + 9; v = 34 + (p.av - 34) * 1.05; } }
  else if (r === 'DM') { u = L[0] + 10; v = 34 + (bv - 34) * .3 + (p.av - 34) * .8; }
  else if (r === 'CM') { u = L[1] + (bs === side ? 2 : -2); v = 34 + (p.av - 34) * .95 + (bv - 34) * .3; }
  else if (r === 'AM') { u = (L[1] + L[2]) / 2 + 2; v = 34 + (bv - 34) * .35; }
  else if (r === 'LW' || r === 'RW') { if ((F === '442' || F === '4141') && bu < 55) { u = L[1] + 4; v = side < 0 ? 6 : 62; } else { u = L[2] - 1.2; v = side < 0 ? 5 : 63; const fb = T.pl.find(q => q.on && (q.role === (side < 0 ? 'LB' : 'RB'))); if (bs === side && bu > 60 && fb && (k === 0 ? fb.x : PL - fb.x) > bu - 2) v = 34 + side * 12; } }
  else { u = L[2]; v = 34 + (bv - 34) * .25 + (two ? (p.av - 34) * .9 : 0); }
  // centres : chacun attaque une zone de la surface
  if (bu > 74 && Math.abs(bv - 34) > 12) {
    const z = r === 'ST' ? (two && p.av > 34 === bs > 0 ? 0 : two ? 1 : 0) : (r === 'LW' || r === 'RW') && side !== bs ? 1 : r === 'AM' ? 2 : r === 'CM' && side !== bs ? 3 : -1;
    if (z >= 0) { const Z = [[99, 34 + bs * 3.2], [98.5, 34 - bs * 4.8], [94, 34], [86, 34 - bs * 3]][z]; u = Z[0]; v = Z[1]; sp = .92; }
  }
  if (p.me && E.meDrift) u += E.meDrift;
  // appel en profondeur
  if (own && p.run <= E.time && (r === 'ST' || r === 'LW' || r === 'RW' || r === 'AM' || (r === 'CM' && R() < .3)) ) {
    const ou = k === 0 ? own.x : PL - own.x, off = offLine(E, k), opr = pressure(E, k, own);
    if (ou < u + 4 && off - ou < 42 && off < 95 && opr < .65 && R() < ME_RUN * (r === 'ST' ? 1.2 : r === 'CM' ? .5 : 1) * (1 + T.plan.direct)) { p.run = E.time + rf(2.4, 3.4); p.runTo = [Math.min(101, off + rf(7, 14)), clamp(v + (34 - v) * rf(.1, .4), 6, 62)]; }
  }
  if (p.run > E.time && p.runTo) { u = p.runTo[0]; v = p.runTo[1]; sp = 1; }
  else u = Math.min(u, offLine(E, k) - .6);
  return [clamp(u, 3, 102), clamp(v, 2, 66), sp];
}
// cible de placement en défense
function defTarget(E, k, p, i, L, bu, bv, OL) {
  const T = E.T[k], P = T.plan, r = p.role, F = T.form, wideMid = (r === 'LW' || r === 'RW') && F !== '433';
  const line = isBack(r) ? 0 : r === 'ST' ? 2 : (r === 'LW' || r === 'RW') ? (wideMid ? 1 : 2) : 1;
  let u = L[line] + (r === 'DM' ? -4 : r === 'AM' ? (F === '4231' ? 7 : 3) : (r === 'LW' || r === 'RW') && !wideMid ? -3 : 0), v = 34 + (p.av - 34) * .72 * P.width + (bv - 34) * .42, sp = .7;
  if ((r === 'LB' || r === 'RB') && (bv < 34 ? -1 : 1) !== (p.av < 34 ? -1 : 1)) v = 34 + (v - 34) * .72;
  if (line === 2) u = Math.min(u, P.counter ? Math.max(bu + 18, 50) : Math.max(bu + 12, 38));
  // marquage : rester côté but de l'attaquant le plus proche (sans casser la ligne du hors-jeu)
  if (line === 0 || r === 'DM' || (bu < 30 && line === 1)) {
    let bd = line === 0 ? 9 : 7, mu = 0, mv = 0; for (let n = 0; n < OL.length; n += 2) { const x = OL[n] - u, y = OL[n + 1] - v; if (x > bd || x < -bd || y > bd || y < -bd) continue; const d = Math.sqrt(x * x + y * y); if (d < bd) { bd = d; mu = OL[n]; mv = OL[n + 1]; } }
    if (mu && (mu < L[0] + 1.5 || bu < 30)) { const w = bu < 30 ? .75 : .55; u = Math.min(u, mu - 1.3) * w + u * (1 - w); v = v * (1 - w) + mv * w; sp = .85; }
  }
  // repli : le ballon est derrière moi
  if (bu < u - 2 && !E.rs) sp = 1;
  return [clamp(u, 2, 100), clamp(v, 2, 66), sp];
}
// gardien : sur la bissectrice, plus haut si le bloc est haut, sort sur les face-à-face
function gkTarget(E, k, p, bu, bv) {
  const P = E.T[k].plan, ow = owner(E);
  let tu, tv, sp = .7;
  if (bu < 40) { const d = hy(bu, bv - 34) || 1, off = clamp(.6 + d * ME_GKO, .8, 4.2); tu = bu / d * off; tv = 34 + (bv - 34) / d * off; sp = .8; }
  else { tu = clamp(1.2 + Math.max(0, bu - 25) * .1 * (.4 + P.block), .8, 6 + 10 * P.block); tv = 34 + (bv - 34) * .2; }
  if (ow && E.ball.own[0] !== k && bu < 26) { let cover = 0; for (const q of E.T[k].pl) if (q.on && q !== p && dst(q.x, q.y, ow.x, ow.y) < 6 && (k === 0 ? q.x < ow.x : q.x > ow.x)) cover++; if (!cover && Math.abs(bv - 34) < 16) { const d = hy(bu, bv - 34); tu = Math.min(bu - 2, 1 + d * .3); tv = 34 + (bv - 34) * .55; sp = 1; } }
  return [tu, tv, sp];
}
// qui va au ballon libre ? le plus rapide de chaque équipe (le receveur désigné d'une passe en priorité)
function chasePlan(E) {
  const b = E.ball, K = b.kick, out = E.ch || (E.ch = [[-1, 0, 0, 9], [-1, 0, 0, 9]]);
  if (E.chT === E.tick - 1 && E.chV === b.pv) { E.chT = E.tick + 1; return out; }
  E.chT = E.tick; E.chV = b.pv;
  const P = predBall(E, 30), N = P.n, cand = E.chC || (E.chC = []);
  for (let k = 0; k < 2; k++) {
    let best = -1, bt = 1e9, bx = 0, by = 0, rcv = null;
    const pl = E.T[k].pl, [lu0, lv0] = loc(k, b.x, b.y), gkZone = lu0 <= 16.5 && Math.abs(lv0 - 34) <= 20.16;
    // les 4 plus proches du ballon (et le receveur désigné)
    cand.length = 0;
    for (let i = 0; i < pl.length; i++) { const p = pl[i]; if (!p.on || p.rc || p.busy > E.time) continue; if (K && K.k === k && K.i === i && E.time - K.t0 < .5) continue; if (K && K.shot && K.k !== k && p.role === 'GK') continue; const dx = p.x - b.x, dy = p.y - b.y; cand.push(dx * dx + dy * dy, i); }
    const sel = []; for (let m = 0; m < 4; m++) { let bi = -1, bd = 1e18; for (let n = 0; n < cand.length; n += 2) if (cand[n] < bd) { bd = cand[n]; bi = n; } if (bi < 0) break; sel.push(cand[bi + 1]); cand[bi] = 1e19; }
    if (K && K.k === k && K.j >= 0 && !sel.includes(K.j) && pl[K.j] && pl[K.j].on) sel.push(K.j);
    for (const i of sel) {
      const p = pl[i], gkB = p.role === 'GK' && gkZone, zMax = gkB ? 2.7 : 2.4, reach = gkB ? 1 : .8, zz = gkB ? zMax : K && K.k === k ? 1.5 : zMax;
      let t = -1, x = P.x[N - 1], y = P.y[N - 1], hit = -1;
      for (let n = 0; n < N; n += 3) { if (P.z[n] > zz) continue; if (tReach(p, P.x[n], P.y[n], reach) <= n * .1 + .05) { hit = n; break; } }
      if (hit >= 0) { let h = hit; for (let n = Math.max(0, hit - 2); n < hit; n++) { if (P.z[n] > zz) continue; if (tReach(p, P.x[n], P.y[n], reach) <= n * .1 + .05) { h = n; break; } } t = h * .1; x = P.x[h]; y = P.y[h]; }
      else t = (N - 1) * .1 + tReach(p, x, y, reach);
      if (p.role === 'GK' && !gkB && t > .6) t += 3;
      if (K && K.k === k && K.j === i) rcv = [i, x, y, t];
      if (t < bt) { bt = t; best = i; bx = x; by = y; }
    }
    const o = out[k], r = rcv && rcv[3] < bt + 1.2 ? rcv : [best, bx, by, bt]; o[0] = r[0]; o[1] = r[1]; o[2] = r[2]; o[3] = r[3];
  }
  return out;
}
function meMove(E) {
  const b = E.ball, ow = owner(E), tk = E.tick, free = b.st === 'air' && !E.rs;
  const CH = free ? chasePlan(E) : null;
  for (let k = 0; k < 2; k++) {
    const T = E.T[k], inPoss = E.poss === k, [bu, bv] = loc(k, b.x, b.y), tac = T.tac, P = T.plan;
    if (T.planK !== T.tacK + T.mood) mePlan(T);
    const L = inPoss ? attLines(E, k, bu) : defLines(E, k, bu);
    // pressing : qui sort sur le porteur ?
    let p1 = -1, p2 = -1, p3 = -1, lane = null;
    if (!inPoss && b.st === 'own' && ow && !E.rs) {
      let a1 = 1e9, a2 = 1e9, a3 = 1e9, n1 = -1, n2 = -1, n3 = -1; for (let n = 0; n < T.pl.length; n++) { const p = T.pl[n]; if (!p.on || p.rc || p.role === 'GK' || p.busy > E.time) continue; const dx = p.x - b.x, dy = p.y - b.y, dd = dx * dx + dy * dy; if (dd < a1) { a3 = a2; n3 = n2; a2 = a1; n2 = n1; a1 = dd; n1 = n; } else if (dd < a2) { a3 = a2; n3 = n2; a2 = dd; n2 = n; } else if (dd < a3) { a3 = dd; n3 = n; } }
      const d = n1 < 0 ? [] : n2 < 0 ? [[a1, n1]] : n3 < 0 ? [[a1, n1], [a2, n2]] : [[a1, n1], [a2, n2], [Math.sqrt(a3), n3]];
      const ok = E.ball.own[0], [ou, ov] = loc(ok, ow.x, ow.y), trig = ov < 8 || ov > 60 || (ok === 0 ? ow.vx : -ow.vx) < -2 || E.timer > 1.6;
      const slow = E.time - (E.T[ok].possT0 ?? E.time) > 14 - 6 * P.press, engage = bu < 40 + 65 * P.press || trig || bu < 30 || slow, cp = P.cp && E.time - T.lostT < 3.5;
      if (d.length) { p1 = d[0][1]; if (!engage) { const [gx, gy] = glob(k, 0, 34), dd = dst(b.x, b.y, gx, gy) || 1; lane = [b.x + (gx - b.x) / dd * 4.5, b.y + (gy - b.y) / dd * 4.5]; } }
      if (d.length > 1 && engage && (P.press > .55 && bu > 45 || cp || (trig && P.press > .3))) p2 = d[1][1];
      if (d.length > 2 && cp && d[2][0] < 15) p3 = d[2][1];
    }
    let OL = null;
    for (let i = 0; i < T.pl.length; i++) {
      const p = T.pl[i];
      if (!p.on || p.rc) continue;
      p.drain = tac.drain;
      if (ow === p) { if (b.hand) { stepTo(E, p, p.x, p.y, 0); continue; } if (p.carry) stepTo(E, p, p.carry[0], p.carry[1], .78); else { const gu = Math.min(104, bu + 2); stepTo(E, p, k === 0 ? gu : PL - gu, k === 0 ? bv : PW - bv, .07); } continue; }
      if (p.busy > E.time && p.act === GEST.FALL) { stepTo(E, p, p.x, p.y, 0); continue; }
      if (E.rs) { const rt = restartTargets(E, k, p, i); if (rt) { stepTo(E, p, rt[0], rt[1], rt[2] || .8); faceBall(E, p); continue; } }
      if (p.dive && p.dive.until > E.time && E.time >= (p.dive.from || 0)) { stepTo(E, p, p.dive.x, p.dive.y, 1.9); continue; }
      if (CH && CH[k][0] === i && CH[k][3] < 4 && (!b.kick || b.kick.kind === 'loose' || b.kick.k === k || CH[k][3] < CH[1 - k][3] + .7)) { stepTo(E, p, CH[k][1], CH[k][2], 1); continue; }
      if (i === p1) { if (lane) stepTo(E, p, lane[0], lane[1], .8); else { const [gx, gy] = glob(k, 0, 34), dd = dst(b.x, b.y, gx, gy) || 1; stepTo(E, p, b.x + (gx - b.x) / dd * .7, b.y + (gy - b.y) / dd * .7, 1); } faceBall(E, p); continue; }
      if (i === p2 || i === p3) {
        // le 2e presseur coupe la passe la plus simple
        const ok = 1 - k; let tq = null, td = 1e9; for (const q of E.T[ok].pl) { if (!q.on || q.rc || q === ow) continue; const d = dst(q.x, q.y, b.x, b.y); if (d < td && d > 4) { td = d; tq = q; } }
        if (tq && i === p2 && !(P.cp && E.time - T.lostT < 3.5)) stepTo(E, p, b.x + (tq.x - b.x) * .45, b.y + (tq.y - b.y) * .45, .95); else stepTo(E, p, b.x, b.y, 1);
        faceBall(E, p); continue;
      }
      // cible de placement recalculée tous les 3 pas (décalés par joueur)
      if (!p.tg || (tk + i) % 3 === 0 || p.tgK !== inPoss) {
        let tu, tv, sp;
        if (p.role === 'GK') [tu, tv, sp] = gkTarget(E, k, p, bu, bv);
        else if (inPoss) {
          [tu, tv, sp] = attTarget(E, k, p, i, L, bu, bv, ow && b.own[0] === k ? ow : null);
          // soutien : se décaler pour ouvrir une ligne de passe
          if (ow && b.own[0] === k && p.run <= E.time && (tk + i) % 9 === 0 && dst(p.x, p.y, b.x, b.y) < 32 && tu < 96) {
            let best = -1e9, bu2 = tu, bv2 = tv; const off = offLine(E, k), O = E.T[1 - k].pl;
            for (let c = 0; c < 10; c += 2) { const du = SUPC[c], dv = SUPC[c + 1], cu = tu + du, cv = clamp(tv + dv, 3, 65); if (cu > off - .5) continue; const cx = k === 0 ? cu : PL - cu, cy = k === 0 ? cv : PW - cv; let open = 7; for (let n = 0; n < O.length; n++) { const o = O[n]; if (!o.on || o.rc) continue; const dd = segD(o.x, o.y, b.x, b.y, cx, cy); if (dd < open) open = dd; } const sc = Math.min(open, 6) + du * .08 - Math.sqrt(du * du + dv * dv) * .12; if (sc > best) { best = sc; bu2 = cu; bv2 = cv; } }
            tu = bu2; tv = bv2;
          }
        } else {
          if (!OL) { OL = []; for (const o of E.T[1 - k].pl) { if (!o.on || o.rc || o.role === 'GK') continue; OL.push(k === 0 ? o.x : PL - o.x, k === 0 ? o.y : PW - o.y); } }
          [tu, tv, sp] = defTarget(E, k, p, i, L, bu, bv, OL);
          if (p.me && E.meDrift) tu = clamp(tu + E.meDrift * .5, 3, 100);
        }
        tv = clamp(tv + Math.sin(E.time * .5 + i * 1.7) * (inPoss ? 1.6 : .8), 2, 66);
        if (!p.tg) p.tg = [0, 0, 0];
        p.tg[0] = k === 0 ? tu : PL - tu; p.tg[1] = k === 0 ? tv : PW - tv; p.tg[2] = sp; p.tgK = inPoss;
      }
      stepTo(E, p, p.tg[0], p.tg[1], p.tg[2]);
      if ((tk + i) & 1 && p.vx * p.vx + p.vy * p.vy < 1.44) faceBall(E, p);
    }
  }
}
const SUPC = [0, 0, 3.5, 0, -3.5, 0, 0, 4, 0, -4];
function faceBall(E, p) { let da = Math.atan2(E.ball.y - p.y, E.ball.x - p.x) - p.face; if (da > Math.PI) da -= 6.2832; else if (da < -Math.PI) da += 6.2832; p.face += da * .25; if (p.face > Math.PI) p.face -= 6.2832; else if (p.face < -Math.PI) p.face += 6.2832; }

// ---------- Ballon ----------
function meBall(E) {
  const b = E.ball;
  if (b.st === 'own') {
    const [k, i] = b.own, p = E.T[k].pl[i];
    if (!p.on || p.rc) { b.st = 'air'; b.own = null; b.pv++; b.kick = { k, i, kind: 'loose', t0: E.time, j: -1 }; return; }
    if (b.hand) { b.x = p.x + Math.cos(p.face) * .3; b.y = p.y + Math.sin(p.face) * .3; b.z = 1.1; }
    else { const sp = hy(p.vx, p.vy), lead = .35 + Math.min(1, sp / 6) * (.35 + .25 * Math.abs(Math.sin(E.time * 4.3))); b.x = p.x + Math.cos(p.face) * lead; b.y = p.y + Math.sin(p.face) * lead; b.z = 0; }
    b.vx = p.vx; b.vy = p.vy; b.vz = 0;
    E.T[k].st.pos += MDT; E.bip = (E.bip || 0) + MDT;
    // pressing et tacles
    if (!b.hand) for (const [oi, o] of E.T[1 - k].pl.entries()) {
      if (!o.on || o.rc || o.beat > E.time || o.busy > E.time) continue;
      if (dst(o.x, o.y, p.x, p.y) > 1.6) continue;
      // décision défensive du joueur
      if (o.me && !E.coach && E.decB > 0 && E.clock - E.decLast > 300 && loc(k, p.x, p.y)[0] > (['DC', 'DL', 'MDC', 'MC'].includes(S.p.pos) ? 55 : 66) && R() < .5) {
        E.dec = { kind: 'def', k: 1 - k, i: oi, opp: [k, i], on: p.n, u: Math.round(loc(k, p.x, p.y)[0]), opts: [{ t: 'Tacler', act: 'tackle', at: 'DEF', out: 'stop', p: tackleProb(o, p), card: .18 }, { t: 'Temporiser', act: 'contain', at: 'MEN', out: 'stop', p: clamp(.55 + (o.a.def - p.a.dri) / 100, .2, .85) }, { t: 'Faute tactique', act: 'foul', at: 'MEN', out: 'stop', p: .95, card: .6 }] };
        E.stop = 'decision'; return;
      }
      const pu = k === 0 ? p.x : PL - p.x, pv = k === 0 ? p.y : PW - p.y, inB = pu >= 88.5 && Math.abs(pv - 34) <= 20;
      if (R() < ME_TK * E.T[1 - k].tac.press * (p.carry ? 1 : 1.5) * (inB ? ME_TB : 1)) {
        const tp = tackleProb(o, p), slide = !inB && R() < .25;
        setAct(E, o, slide ? GEST.SLIDE : GEST.TACKLE, Math.atan2(p.y - o.y, p.x - o.x)); if (slide) o.busy = E.time + 1;
        if (R() < (inB ? ME_FB : ME_FT * (slide ? 1.4 : 1))) { if (meFoul(E, 1 - k, oi, k, i)) return; }
        if (R() < tp) { o.st.tk++; p.st.lost++; meCm(E, 'tackle', 1 - k, o, { n2: p.n, u: Math.round(PL - pu), slide }); if (R() < .5) giveBall(E, 1 - k, oi); else knockLoose(E, 1 - k, oi, 4); return; }
        o.beat = E.time + .8;
      }
    }
    E.timer -= MDT;
    if (E.timer <= 0) { if (b.hand) gkDistribute(E, k, i); else meDecide(E, k, i); }
    return;
  }
  if (b.st === 'air') return ballAir(E);
  if (b.st === 'net' || b.st === 'dead') {
    if (b.st === 'net') { const gx = b.x > 52.5 ? PL : 0, dir = gx ? 1 : -1; physStep(E, b, MDT); if ((b.x - gx) * dir > 1.7) { b.x = gx + dir * 1.7; b.vx = -b.vx * .1; b.vy *= .3; } if (Math.abs(b.y - 34) > GHW - .1) { b.y = 34 + Math.sign(b.y - 34) * (GHW - .1); b.vy = 0; } if (b.z > GH - .1) { b.z = GH - .1; b.vz = 0; } b.vx *= .7; b.vy *= .7; }
  }
}
// le gardien relance à la main ou au pied
function gkDistribute(E, k, i) {
  const T = E.T[k], p = T.pl[i], b = E.ball; b.hand = false; b.z = .3;
  const opts = T.pl.map((q, j) => [q, j]).filter(([q, j]) => j !== i && q.on && !q.rc && q.busy <= E.time && ['CB', 'LB', 'RB', 'DM'].includes(q.role) && pressure(E, k, q) < .5);
  if (opts.length && R() < .6 - T.plan.direct * .3) { const [q, j] = pick(opts); const L = dst(p.x, p.y, q.x, q.y); p.st.pa++; T.st.pa++; setAct(E, p, GEST.THROW, Math.atan2(q.y - p.y, q.x - p.x)); const dur = kickTo(E, k, i, q.x, q.y, L > 22 ? 20 : 0, .6, 'pass', { j }); E.lastPass = { k, i, t: E.time, to: j, marg: false, mx: q.x, my: q.y }; b.f = { res: 'ok', t0: E.time, dur, kind: 'pass' }; return; }
  meClear(E, k, i, true);
}
// le ballon vole ou roule : physique, poteaux, sorties, puis contacts avec les joueurs
function ballAir(E) {
  const b = E.ball, K = b.kick, dt = MDT / NSUB, path = E.path || (E.path = new Float32Array((NSUB + 1) * 3));
  path[0] = b.x; path[1] = b.y; path[2] = b.z;
  if (K) E.T[K.k].st.pos += MDT; E.bip = (E.bip || 0) + MDT;
  for (let s = 1; s <= NSUB; s++) {
    const px = b.x, py = b.y, pz = b.z, tS = E.time - MDT + s * dt;
    physStep(E, b, dt);
    // arrêt du gardien à l'instant prévu
    if (K && K.gkp && !K.gkp.done && K.gkp.pv === b.pv && tS >= K.gkp.t - 1e-6) { K.gkp.done = true; if (K.gkp.save && gkSave(E, K)) return; }
    const gx = b.x > 52.5 ? PL : 0;
    if (Math.abs(b.x - gx) < 1.6 || Math.abs(px - gx) < 1.6) { const h = frameHit(b, gx, px, py, pz); if (h) { b.pv++; if (K) K.postHit = true; if (K && K.shot && !K.res) { E.wood = { t: E.time + .6, k: K.k, i: K.i, bar: h === 'bar', K }; } } }
    if (b.x > PL + BR || b.x < -BR) {
      const gl = b.x > 52.5 ? PL + BR : -BR, f = (gl - px) / ((b.x - px) || 1e-6), yc = py + (b.y - py) * f, zc = pz + (b.z - pz) * f;
      if (Math.abs(yc - 34) < GHW && zc < GH) { meGoal(E, b.x > 52.5 ? 0 : 1); return; }
      meOut(E, zc); return;
    }
    if (b.y < -BR || b.y > PW + BR) { meOut(E, b.z); return; }
    path[s * 3] = b.x; path[s * 3 + 1] = b.y; path[s * 3 + 2] = b.z;
  }
  touches(E, path);
  // tir arrivé à l'arrêt sans contact : ramassé par la défense
  if (b.st === 'air' && K && K.shot && !K.res && hy(b.vx, b.vy) < 1.5 && b.z === 0) shotEnd(E, 'miss', { hi: false });
}
// contacts : le premier joueur qui atteint la trajectoire joue le ballon (duel si plusieurs)
function touches(E, path) {
  const b = E.ball, K = b.kick, C = [];
  for (let k = 0; k < 2; k++) {
    const pl = E.T[k].pl;
    for (let i = 0; i < pl.length; i++) {
      const p = pl[i]; if (!p.on || p.rc || p.busy > E.time) continue;
      if (K) {
        if (E.time - K.t0 < .15) continue;
        if (K.lk === k && K.li === i && E.time - K.lt < .4) continue;
        if (K.k === k && K.i === i && E.time - K.t0 < (K.shot ? .5 : .3)) continue;
        if (K.shot && K.k === k && E.time - K.t0 < .45 && !K.defl) continue;
        const win = E.time - K.t0 < (K.dur || 2) + .8;
        if (K.safe && win && !(K.k === k && K.j === i)) continue;
        if (K.fint >= 0 && win && !(K.k !== k && K.fint === i)) continue;
        if (K.shot && !K.res && K.k !== k && p.role === 'GK' && K.gkp && K.gkp.pv === b.pv) continue;
        if (!K.shot && K.k === k && K.j >= 0 && K.j !== i && K.kind !== 'loose' && E.time - K.t0 < (K.dur || 2) * .8 && b.vx * b.vx + b.vy * b.vy > 25) continue;
      }
      const [lu, lv] = loc(k, b.x, b.y), gkB = p.role === 'GK' && lu < 17 && Math.abs(lv - 34) < 21;
      const zMax = gkB ? 2.75 : 2.55;
      for (let s = 0; s <= NSUB; s++) {
        const x = path[s * 3], y = path[s * 3 + 1], z = path[s * 3 + 2]; if (z > zMax) continue;
        // ballon à hauteur de tête sans adversaire : on le laisse redescendre (sauf dans les surfaces)
        if (z > 1.6 && !gkB && !(lu > 86 && Math.abs(lv - 34) < 14) && lu > 35) { let con = false; for (const o of E.T[1 - k].pl) { if (o.on && !o.rc && Math.abs(o.x - x) < 2.5 && Math.abs(o.y - y) < 2.5) { con = true; break; } } if (!con) continue; }
        const reach = gkB ? (z > 1.5 ? .95 : 1.05) : z < .6 ? .78 : z < 1.6 ? .55 : .6;
        const dx = x - p.x, dy = y - p.y; if (dx > reach || dx < -reach || dy > reach || dy < -reach) continue;
        const d = Math.sqrt(dx * dx + dy * dy); if (d <= reach) { C.push({ k, i, p, s, d, z, gkB }); break; }
      }
    }
  }
  if (!C.length) return;
  C.sort((a, c) => a.s - c.s || a.d - c.d);
  let w = C[0];
  const riv = C.filter(c => c.s <= w.s + 1 && c !== w);
  if (riv.length) {
    // duel : au sol l'adresse, en l'air la puissance et la détente
    const sc = c => (c.gkB && c.z > .8 ? 1.6 : 1) * (c.z > 1.6 ? .6 + c.p.a.phy / 180 : .6 + (c.k === (K ? K.k : -1) ? c.p.a.dri : c.p.a.def) / 180) * (1.2 - c.d * .4) * (K && K.k === c.k && K.j === c.i ? 1.15 : 1);
    const all = [w, ...riv], ws = all.map(sc), tot = ws.reduce((a, c) => a + c, 0); let r = R() * tot; for (let n = 0; n < all.length; n++) { r -= ws[n]; if (r <= 0) { w = all[n]; break; } }
    for (const c of all) if (c !== w && c.z > 1.6) setAct(E, c.p, GEST.HEAD, c.p.face);
  }
  touchBall(E, w.k, w.i, w);
}
function touchBall(E, k, i, c) {
  const b = E.ball, K = b.kick, p = E.T[k].pl[i], s = c.s, path = E.path;
  b.x = path[s * 3]; b.y = path[s * 3 + 1]; b.z = path[s * 3 + 2];
  if (K && K.shot && !K.res && E.wood && E.wood.K === K) { shotEnd(E, 'wood', { bar: E.wood.bar }); E.wood = null; K.shot = false; K.kind = 'loose'; }
  if (K && K.shot && !K.res && K.k === k) { shotEnd(E, 'miss', { quiet: true }); K.shot = false; K.kind = 'loose'; }
  const vb = hy(hy(b.vx, b.vy), b.vz), [u, v] = loc(k, b.x, b.y), mine = K && K.k === k, pass = K && (K.kind === 'pass' || K.kind === 'thru' || K.kind === 'long' || K.kind === 'cross' || K.kind === 'throw' || K.kind === 'head');
  // hors-jeu : premier contact d'un joueur parti en position illicite
  if (mine && pass && K.offs && K.offs[i] != null && !K.offChk) {
    K.offChk = true; const m = K.offs[i];
    if (m > 0) { const flag = m > .45 ? R() < .96 : R() < .5; if (flag) { E.T[k].st.off++; meEv(E, 'offside', k, p); E.flag = [k === 0 ? 1 : 0, E.time]; setRestart(E, 'fk', 1 - k, b.x, b.y, rsd('off')); return; } if (E.lastPass) E.lastPass.marg = true; }
    else if (m > -.25 && R() < .04) { E.T[k].st.off++; meEv(E, 'offside', k, p); E.flag = [k === 0 ? 1 : 0, E.time]; setRestart(E, 'fk', 1 - k, b.x, b.y, rsd('off')); return; }
  }
  if (K && pass && mine) K.offChk = true;
  // tir : contre d'un défenseur, ou tir dévié
  if (K && K.shot && !K.res) {
    if (!mine && p.role !== 'GK') {
      if (R() < .82 * ME_BLK) { setAct(E, p, GEST.BLOCK, p.face); shotEnd(E, 'block', {}); if (R() < .5) { deflect(E, k, i, rf(.4, .75), .35, 2.5); b.vy += (b.y < 34 ? -1 : 1) * rf(2, 6); } else deflect(E, k, i, rf(.2, .5), 1.6, 3); b.kick.shot = false; return; }
      setAct(E, p, GEST.BLOCK, p.face); deflect(E, k, i, rf(.75, .95), .25, 0); if (K.gkp) K.gkp = gkPlan(E, k, null, false, null, true); return;
    }
    if (!mine && p.role === 'GK') { shotEnd(E, 'save', { gk: p, k: 1 - K.k }); if (vb < 16 && c.z < 2 && R() < .75) { giveBall(E, k, i, rf(2.5, 5), true); return; } setAct(E, p, GEST.DIVE, 0); deflect(E, k, i, rf(.25, .5), 1.3, 2); return; }
  }
  // centre ou ballon long touché par un défenseur près de son but, ou passe le long de la ligne : souvent en corner ou en touche
  if (!mine && pass && !c.gkB && (((K.kind === 'cross' || K.kind === 'long') && u < 30 && R() < ME_XCO) || ((b.y < 7 || b.y > PW - 7) && R() < ME_TCO))) {
    setAct(E, p, c.z > 1.4 ? GEST.HEAD : GEST.BLOCK, p.face); E.last = [k, i]; b.pv++;
    const [gx] = glob(k, 0, 34), toGoal = u < 30 && R() < .7; b.vx = toGoal ? Math.sign(gx - b.x) * rf(4, 10) : rf(-4, 4); b.vy = (b.y < 34 ? -1 : 1) * rf(toGoal ? 2 : 4, 9); b.vz = rf(.5, 4); b.cu = b.tp = 0; if (toGoal) safeWide(b, gx);
    K.kind = 'loose'; K.safe = false; K.fint = -1; K.k = k; K.i = i; K.t0 = E.time; K.lk = k; K.li = i; K.lt = E.time; p.st.cl++; return;
  }
  // tête
  if (c.z > 1.6 || (c.gkB && c.z > 1.2)) {
    setAct(E, p, GEST.HEAD, p.face);
    if (c.gkB) { const hold = R() < (E.cond.rain ? .7 : .85); if (hold) { if (K && K.kind === 'cross' && !mine) { p.st.sv++; meEv(E, 'claim', k, p); meCm(E, 'claim', k, p); } giveBall(E, k, i, rf(2.5, 5), true); return; } deflect(E, k, i, .4, 1.2, 3); meCm(E, 'claim', k, p, { punch: true }); return; }
    if (u > 86 && Math.abs(v - 34) < 14 && (mine || K.kind === 'cross' || R() < .5)) { if (mine && pass) { E.T[k].st.pc++; const ps = E.T[K.k].pl[K.i]; if (ps) ps.st.pc++; E.lastPass = Object.assign(E.lastPass || {}, { to: i, t: E.time }); } giveBall(E, k, i, 0); const hm = p.headMg && p.headMg.until > E.time ? p.headMg : null; p.headMg = null; meShot(E, k, i, hm ? { kind: 'head', decided: true, mg: hm } : { kind: 'head' }); return; }
    if (u < 35) { if (!mine && u < 20 && R() < ME_HCO) { const [gx] = glob(k, 0, 34); b.vx = (gx - b.x) / Math.abs(gx - b.x || 1) * rf(3, 8); b.vy = (b.y < 34 ? -1 : 1) * rf(2, 6); b.vz = rf(2, 5); safeWide(b, gx); b.pv++; E.last = [k, i]; if (b.kick) { b.kick.kind = 'loose'; b.kick.safe = false; } return; } meClear(E, k, i, false, true); return; }
    // déviation de la tête vers un partenaire
    const mates = E.T[k].pl.map((q, j) => [q, j]).filter(([q, j]) => j !== i && q.on && !q.rc && dst(q.x, q.y, p.x, p.y) < 22 && dst(q.x, q.y, p.x, p.y) > 5 && (k === 0 ? q.x > p.x - 4 : q.x < p.x + 4));
    if (mates.length && R() < .55 + (p.a.phy - 72) / 100) { const [q, j] = pick(mates); if (mine && pass) { E.T[k].st.pc++; const ps = E.T[K.k].pl[K.i]; if (ps) ps.st.pc++; } else if (!mine && K && K.k >= 0) { p.st.int++; } E.poss = k; p.st.pa++; E.T[k].st.pa++; kickTo(E, k, i, q.x + q.vx * .4, q.y + q.vy * .4, 12, 2, 'head', { j }); return; }
    // sinon : tête vers l'avant, le ballon repart vraiment
    const a0 = (k === 0 ? 0 : Math.PI) + gauss() * .7, d0 = rf(8, 16); if (!mine) p.st.cl++; E.poss = k; kickTo(E, k, i, clamp(p.x + Math.cos(a0) * d0, 1, PL - 1), clamp(p.y + Math.sin(a0) * d0, 1, PW - 1), 24, 1.5, 'head', { j: -1 }); b.kick.kind = 'loose'; return;
  }
  // reprise de volée près du but
  if (mine && pass && c.z > .4 && c.z < 1.5 && K.kind === 'cross' && u > 87 && Math.abs(v - 34) < 12 && R() < ME_VOL) { E.T[k].st.pc++; const ps = E.T[K.k].pl[K.i]; if (ps) ps.st.pc++; E.lastPass = Object.assign(E.lastPass || {}, { to: i, t: E.time }); giveBall(E, k, i, 0); meShot(E, k, i, { kind: 'volley' }); return; }
  // contrôle (ou interception)
  if (c.gkB && !mine) { const hold = vb < 24 && R() < (E.cond.rain ? .78 : .92); if (hold) { giveBall(E, k, i, rf(2.5, 5), true); if (K && (K.kind === 'cross' || K.kind === 'thru' || K.kind === 'long')) meCm(E, 'claim', k, p); return; } deflect(E, k, i, .35, 1.2, 1.5); return; }
  const pr = Math.min(2, pressure(E, k, p));
  let pc;
  if (mine && K.safe && K.j === i) pc = 1;
  else if (!mine && K && K.fint === i) pc = 1;
  else if (mine) pc = clamp(.95 * ME_CTL - Math.max(0, vb - 13) * .022 - (c.z > .6 ? .07 : 0) - pr * .07 + ((p.a.dri + p.a.pas) / 2 - 72) / ME_SKC - (E.cdr || 0), .35, .99);
  else pc = clamp(.68 * ME_CTL - Math.max(0, vb - 11) * .03 - (c.z > .6 ? .1 : 0) + (p.a.def - 72) / ME_SKD - (E.cdr || 0), .2, .96);
  if (R() < pc) {
    if (pass && mine) { E.T[k].st.pc++; const ps = E.T[K.k].pl[K.i]; if (ps && K.i !== i) ps.st.pc++; if (E.lastPass && E.lastPass.k === k) { E.lastPass.to = i; E.lastPass.t = E.time; } const [lu, lv] = [u, v]; if (lu > 92 && Math.abs(lv - 34) < 12 && pressure(E, k, p) < .8) meCm(E, 'chance', k, p); }
    else if (pass && !mine) { p.st.int++; const ps = E.T[K.k].pl[K.i]; if (ps) ps.st.lost++; meCm(E, 'int', k, p, { n2: ps ? ps.n : '' }); }
    setAct(E, p, c.z > .6 ? GEST.CTRL : GEST.CTRL, p.face);
    // réception sous pression : un défenseur collé peut chiper le ballon
    const qu = u; let dd = ME_RR, di = -1; const O = E.T[1 - k].pl;
    for (let n = 0; n < O.length; n++) { const o = O[n]; if (!o.on || o.rc || o.role === 'GK' || o.busy > E.time) continue; const d = dst(o.x, o.y, p.x, p.y); if (d < dd) { dd = d; di = n; } }
    if (di >= 0 && R() < (qu > 85 ? ME_RB : ME_RM) * (E.T[1 - k].tac.solid || 1) * (ME_RR - dd) / ME_RR * clamp(1 + (O[di].a.def - p.a.dri) / 60, .5, 1.5)) { const o = O[di]; o.st.tk++; p.st.lost++; setAct(E, o, GEST.TACKLE, o.face); if (R() < .5) giveBall(E, 1 - k, di); else knockLoose(E, 1 - k, di, 4); meEv(E, 'steal', 1 - k, o, { v: p.n }); meCm(E, 'tackle', 1 - k, o, { n2: p.n }); return; }
    // passe de ton joueur dans les 25 derniers mètres : le receveur tente vite sa chance
    const ps0 = K && pass && mine ? E.T[K.k].pl[K.i] : null, hot = ps0 && ps0.me && u > 76 && K.i !== i;
    giveBall(E, k, i, hot ? .15 + R() * .3 : pr > 1 ? .2 + R() * .5 : undefined); if (hot) p.chance = E.time + 2.5;
    return;
  }
  // contrôle raté : le ballon rebondit
  if (!mine && pass) { const ps = E.T[K.k].pl[K.i]; if (ps && R() < .5) { p.st.int++; } }
  deflect(E, k, i, rf(.25, .55), 1.1, .8);
}
// arrêt du gardien au moment prévu
function gkSave(E, K) {
  const b = E.ball, dk = K.gkp.dk, gi = K.gkp.gi, gk = E.T[dk].pl[gi]; if (!gk || !gk.on) return false;
  shotEnd(E, 'save', { gk, k: dk });
  if (K.gkp.hold) { giveBall(E, dk, gi, rf(2.5, 5), true); return true; }
  // parade : sur le côté, en corner ou devant (second ballon)
  const dir = dk === 0 ? 1 : -1, high = b.z > 1.9, ly = b.y > 34 ? 1 : -1;
  if (R() < ME_PCO) { b.vx = -dir * rf(1.5, 4); b.vy = ly * rf(6, 11); b.vz = high ? rf(3.5, 5.5) : rf(.5, 3); if (high && R() < .6) { b.vy *= .3; b.vz = rf(5, 7); } else safeWide(b, dk === 0 ? 0 : PL); }
  else { b.vx = dir * rf(3, 9); b.vy = ly * rf(1, 8); b.vz = high ? rf(2, 4) : rf(.3, 3); }
  b.cu = b.tp = 0; b.pv++; E.last = [dk, gi]; if (b.kick) { b.kick.shot = false; b.kick.k = dk; b.kick.i = gi; b.kick.t0 = E.time + .5; b.kick.kind = 'loose'; b.kick.safe = false; b.kick.fint = -1; }
  return true;
}
// fin d'un tir (une seule fois) : statistiques et événement
function shotEnd(E, res, x) {
  const b = E.ball, K = b.kick; if (!K || !K.shot || K.res) return; K.res = res;
  const T = E.T[K.k], p = T.pl[K.i] || (T.out || []).find(q => q.n === K.rec.n), O = E.T[1 - K.k], lp = E.lastPass;
  if (lp && lp.k === K.k && lp.to === K.i && E.time - lp.t < 9 && lp.i !== K.i && res !== 'goal') { const a = T.pl[lp.i]; if (a) a.st.kp++; }
  if (K.rec) K.rec.res = res === 'block' ? 'block' : res;
  if (res === 'save') { if (p) p.st.sot++; T.st.sot++; const gk = x.gk; gk.st.sv++; O.st.sv++; meEv(E, 'save', 1 - K.k, gk, { sh: p ? p.n : '', shMe: p ? !!p.me : false, kind: K.sk, xg: K.xg }); }
  else if (res === 'block') { T.st.blk++; meEv(E, 'block', K.k, p, {}); }
  else if (res === 'miss' && !x.quiet) meEv(E, 'miss', K.k, p, { xg: K.xg, kind: K.sk, hi: !!x.hi });
  else if (res === 'wood') { T.st.wood++; meEv(E, 'wood', K.k, p, { bar: !!x.bar, xg: K.xg }); }
}
function meGoal(E, k) {
  const b = E.ball, K = b.kick, T = E.T[k], O = E.T[1 - k];
  // buteur : le tireur (même si le ballon a été dévié), sinon le dernier joueur de l'équipe ; contre son camp sinon
  let si = -1, og = null;
  const shotK = K && K.k === k && K.rec && E.time - K.t0 < 4;
  if (shotK) si = K.i; else if (E.last && E.last[0] === k) si = E.last[1]; else if (E.last) og = O.pl[E.last[1]] || null;
  if (si < 0) { si = T.pl.findIndex(p => p.on && p.role === 'ST'); if (si < 0) si = 9; }
  const p = T.pl[si] || T.pl[9];
  if (shotK) { if (K.res === 'block') T.st.blk--; if (K.res !== 'goal') { p.st.sot++; T.st.sot++; } K.res = 'goal'; K.rec.res = 'goal'; }
  E.wood = null;
  E.goals[k]++;
  const lp = E.lastPass, as = !og && lp && lp.k === k && lp.to === si && E.time - lp.t < 9 && lp.i !== si ? T.pl[lp.i] : null;
  if (!og) p.st.g++; if (as) { as.st.as++; as.st.kp++; }
  const kind = K && K.sk ? K.sk : '';
  meEv(E, 'goal', k, og ? null : p, Object.assign({ as: as ? as.n : '', asMe: as ? !!as.me : false, kind: kind === 'chip' || kind === 'volley' ? kind : kind === 'head' || kind === 'pen' || kind === 'fk' ? kind : '', xg: K && K.xg ? K.xg : .1, score: E.goals.slice(), post: !!(K && K.postHit) }, og ? { n: og.n, og: true, me: false } : {}));
  b.st = 'net'; b.own = null; b.kick = null;
  E.rs = { type: 'ko', k: 1 - k, at: E.time + rsd('goal') }; E.poss = 1 - k;
  // célébration : le buteur file vers le poteau de corner côté caméra, les partenaires le rejoignent
  if (!og) { const cx = (k === 0 ? PL - 4 : 4) - (R() < .3 ? (k === 0 ? 14 : -14) : 0); E.cel = { k, i: si, until: E.time + 12, x: cx, y: PW - 1.5 }; setAct(E, p, GEST.CELEB, 0); T.pl.forEach((q, j) => { if (j !== si && q.on && !q.rc && q.role !== 'GK') setAct(E, q, GEST.HUG, 0, 1.5); }); O.pl.forEach(q => { if (q.on && !q.rc) setAct(E, q, GEST.SAD, 0, .4); }); }
  // VAR : hors-jeu limite sur la dernière passe, main, ou simple vérification
  if (kind !== 'pen' && !og) {
    const recent = lp && lp.k === k && E.time - lp.t < 12;
    let why = null, wn = '';
    if (recent && lp.marg) { why = 'hors-jeu'; wn = (T.pl[lp.to] || {}).n || ''; }
    else if (R() < .012) { why = 'main'; wn = p.n; }
    if (why || R() < .1) {
      E.var = { kind: 'goal', k, ok: !why, why, wn, gi: E.ev.length - 1, sn: p.n, an: as ? as.n : '', x: why === 'hors-jeu' ? lp.mx : b.x, y: why === 'hors-jeu' ? lp.my : 34, t0: E.time, at: E.time + rf(why ? 40 : 22, why ? 70 : 38) };
      meEv(E, 'varchk', k, null, { what: 'goal' }); E.rs.at = Math.max(E.rs.at, E.var.at + 8);
    }
  }
  setTimeoutKick(E);
}
function meVar(E) {
  const V = E.var; E.var = null;
  if (V.kind === 'goal') {
    if (V.ok) meEv(E, 'var', V.k, null, { what: 'goal', ok: true });
    else {
      const T = E.T[V.k], all = T.pl.concat(T.out || []), sc = all.find(p => p.n === V.sn), as = V.an ? all.find(p => p.n === V.an) : null;
      E.goals[V.k]--; if (sc) sc.st.g--; if (as) { as.st.as--; as.st.kp--; }
      if (E.ev[V.gi]) E.ev[V.gi].annul = true;
      const sh = [...E.shots].reverse().find(x => x.k === V.k && x.res === 'goal'); if (sh) sh.res = 'annul';
      meEv(E, 'var', V.k, sc, { what: 'goal', ok: false, why: V.why, wn: V.wn, asMe: as ? !!as.me : false, score: E.goals.slice() });
      E.rs = null; E.cel = null; setRestart(E, 'fk', 1 - V.k, clamp(V.x, 1, PL - 1), clamp(V.y, 1, PW - 1), 9);
    }
  } else if (V.award) { const tk = E.T[V.vk].pl[V.taker] && E.T[V.vk].pl[V.taker].on ? [E.T[V.vk].pl[V.taker], V.taker] : penTaker(E, V.vk); const [px, py] = glob(V.vk, PL - 11, 34); E.rs = null; setRestart(E, 'pen', V.vk, px, py, rf(18, 30)); E.rs.taker = tk[1]; meEv(E, 'var', V.vk, null, { what: 'pen', ok: true, award: true }); meEv(E, 'penalty', V.vk, tk[0], { var: true }); }
  else if (!V.ok) { E.rs = null; setRestart(E, 'fk', V.vk, V.x, V.y, 9); meEv(E, 'var', V.vk, null, { what: 'pen', ok: false }); }
  else meEv(E, 'var', V.vk, null, { what: 'pen', ok: true });
  if (E.half === 1) E.s1 += (E.time - V.t0) * .8; else E.s2 += (E.time - V.t0) * .8;
}
function meRef(E) {
  if (!E.arb) E.arb = { x: 46, y: 22, vx: 0, vy: 0, act: 0, actT: -9 };
  const b = E.ball, r = E.arb, dir = E.poss === 0 ? 1 : -1;
  let tx = b.x - dir * 10, ty = b.y + (b.y < 34 ? 12 : -12);
  if (E.rs && E.rs.type === 'pen') { tx = E.rs.x > 52.5 ? PL - 18 : 18; ty = 20; }
  else if (E.rs && E.rs.type === 'corner') { tx = E.rs.x > 52.5 ? PL - 14 : 14; ty = E.rs.y < 34 ? 30 : 38; }
  tx = clamp(tx, 4, PL - 4); ty = clamp(ty, 4, PW - 4);
  const dx = tx - r.x, dy = ty - r.y, d = Math.sqrt(dx * dx + dy * dy), want = d < .6 ? 0 : Math.min(6.8, d * 1.4);
  r.vx += ((d ? dx / d * want : 0) - r.vx) * .12; r.vy += ((d ? dy / d * want : 0) - r.vy) * .12; r.x += r.vx * MDT; r.y += r.vy * MDT;
}
function lineOf(E, k, hi) { let a = hi ? -1 : 999, b2 = a; for (const o of E.T[k].pl) { if (!o.on || o.rc) continue; if (hi ? o.x > a : o.x < a) { b2 = a; a = o.x; } else if (hi ? o.x > b2 : o.x < b2) b2 = o.x; } return b2; }
function setTimeoutKick(E) { for (let t = 0; t < 2; t++) E.T[t].pl.forEach(p => { p.carry = null; p.run = 0; p.dive = null; }); }
function meOut(E, z) {
  const b = E.ball, lk = E.last ? E.last[0] : E.poss, K = b.kick;
  if (K && K.shot && !K.res) { if (E.wood && E.wood.K === K) { shotEnd(E, 'wood', { bar: E.wood.bar }); E.wood = null; } else shotEnd(E, 'miss', { hi: (z ?? b.z) > GH - .05 }); }
  if (b.y < -BR || b.y > PW + BR) { setRestart(E, 'throw', 1 - lk, clamp(b.x, 1, PL - 1), b.y < 34 ? 0 : PW, rsd('throw')); return; }
  const atRight = b.x > 52.5, attK = atRight ? 0 : 1;
  if (lk === attK) { const [gx, gy] = glob(1 - attK, 5.5, 34); setRestart(E, 'gk', 1 - attK, gx, gy, rsd('gk')); }
  else { E.T[attK].st.cor++; meEv(E, 'corner', attK, null); setRestart(E, 'corner', attK, atRight ? PL : 0, b.y < 34 ? 0 : PW, rsd('corner')); }
}

// ---------- Horloge, remplacements, boucle ----------
// humeur tactique : l'équipe menée pousse, celle qui mène gère
function meMood(E) {
  for (let k = 0; k < 2; k++) {
    if (E.coach && k === 0) continue;
    const T = E.T[k], df = E.goals[k] - E.goals[1 - k], c = E.half === 2 ? E.clock : 0;
    const m = c > 3900 && df < 0 ? 1 : c > 4500 && df === 1 ? -1 : c > 4800 && df > 1 ? -.5 : 0;
    if (m !== T.mood) { T.mood = m; mePlan(T); if (m) meCm(E, 'tac', k, null, { m, f: FORM_N[T.form] }); }
  }
}
function meTick(E) {
  if (E.over || E.stop) return;
  if (E.coach && E.cstops.length && (E.cstops[0] === 0 && E.clock === 0 || (E.cstops[0] === 4200 && E.clock >= 4200))) { E.stop = 'coach'; E.cstopNow = E.cstops.shift(); return; }
  E.tick++; E.time += MDT; E.clock += MDT;
  if (E.var && E.time >= E.var.at) meVar(E);
  if (E.rs && E.time >= E.rs.at && !E.var) doRestart(E);
  if (E.stop) return;
  if (E.wood && E.time >= E.wood.t) { const W = E.wood; E.wood = null; if (W.K.shot && !W.K.res) shotEnd(E, 'wood', { bar: W.bar }); W.K.postHit = true; }
  meMove(E); meRef(E); meBall(E);
  if (E.stop) return;
  if (E.tick % 5 === 0) { const mp = E.T[0].pl.find(p => p.me && p.on && !p.rc); if (mp) { const cx = clamp(Math.floor(mp.x / PL * 24), 0, 23), cy = clamp(Math.floor(mp.y / PW * 16), 0, 15); E.hm[cy * 24 + cx]++; } }
  if (E.tick % 600 === 300) meMood(E);
  // remplacements du joueur
  if (E.tick % 50 === 25 && E.meOut == null && !E.coach) { const mp = E.T[0].pl.find(p => p.me && p.on); if (mp && mp.sta < 12 && E.clock < 5300) { E.meOut = E.clock; E.meTired = true; } }
  if (E.meOut != null && E.clock >= E.meOut) { const T = E.T[0], i = T.pl.findIndex(p => p.me); if (i >= 0) { meSubOut(E, 0, i, 'prévu'); } E.meOut = null; }
  if (E.meIn != null && E.clock >= E.meIn && E.meStore) { const T = E.T[0], i = T.pl.findIndex((p, j) => p.on && p.role === E.meStore.role && !p.me); const ii = i >= 0 ? i : T.pl.findIndex(p => p.on && p.role !== 'GK'); meSubIn(E, 0, ii, E.meStore, 'entrée'); E.meStore = null; E.meIn = null; }
  // remplacements de l'IA
  if (E.tick % 50 === 0 && E.clock > 3300) for (let k = 0; k < 2; k++) { const T = E.T[k]; if (T.subs >= 3 || (E.coach && k === 0)) continue; if (E.clock < E.subPlan[T.subs > 0 ? 1 : 0] && T.subs < 2) continue; const tired = T.pl.map((p, i) => [p, i]).filter(([p]) => p.on && !p.rc && !p.me && p.role !== 'GK' && p.sta < 58).sort((a, b) => a[0].sta - b[0].sta)[0]; if (tired && !(E.ball.own && E.ball.own[0] === k && E.ball.own[1] === tired[1])) meSubOut(E, k, tired[1], 'fatigue'); }
  // mi-temps et fin
  const live = E.ball.st === 'air' && E.ball.kick && E.ball.kick.shot && !E.ball.kick.res;
  if (E.half === 1 && E.clock >= 2700 + E.s1 && !live) { meEv(E, 'ht', 0, null, { score: E.goals.slice() }); E.half = 2; E.clock = 2700; E.cel = null; meKickoff(E, 1, true); E.rs.at = E.time + 2; if (E.coach) E.cstops = E.cstops.filter(x => x !== 'half'); E.stop = 'half'; return; }
  if (E.half === 2 && E.clock >= 5400 + E.s2 && !live) { E.over = true; meEv(E, 'ft', 0, null, { score: E.goals.slice() }); E.stop = 'end'; }
}
function meRun(E, until, rec) { if (E.dec) return 'decision'; E.stop = null; let n = 0; while (!E.stop && !E.over && E.time < until && n < 200000) { meTick(E); if (rec) rec(E); n++; } return E.over ? 'end' : E.stop || 'time'; }
// Applique la décision du joueur (mini-jeux inclus)
function meApply(E, opt, mg) {
  const D = E.dec; if (!D) return; E.dec = null; E.stop = null; E.decB--; E.decLast = E.clock;
  const T = E.T[D.k];
  if (D.kind === 'att') {
    const p = T.pl[D.i];
    if (opt.act === 'shot') { meShot(E, D.k, D.i, Object.assign({ decided: true }, D.pen ? { kind: 'pen' } : D.fk ? { kind: 'fk' } : {}, mg && mg.view ? { mg } : { forceP: mg && mg.p != null ? mg.p : opt.pp ?? opt.p + DF().mom })); return; }
    const ok = R() < (mg && mg.p != null ? mg.p : opt.pp ?? clamp(opt.p + DF().mom, .03, .97)); D.ok = ok;
    if (opt.act === 'drib') { const fr = frontOpp(E, D.k, p); if (fr) meAct(E, D.k, D.i, { k: 'drib', o: fr, ps: opt.p }, ok); else meAct(E, D.k, D.i, { k: 'carry' }); return; }
    if (opt.act === 'cross') { meAct(E, D.k, D.i, { k: 'cross', j: opt.j }, ok); return; }
    meAct(E, D.k, D.i, { k: opt.act, j: opt.j }, ok ? 'ok' : (R() < .7 ? 'int' : 'mis'));
    return;
  }
  if (D.kind === 'corner') {
    const zi = opt.z != null ? opt.z : 1, Z = cornerZones(D.bv)[zi], tk = T.pl[D.taker], me = T.pl[D.i];
    if (D.mode === 'take') {
      if (opt.act === 'pass') { const ok = R() < (mg && mg.p != null ? mg.p : .9); D.ok = ok; mePass(E, D.k, D.taker, opt.j, 'pass'); return; }
      const q = T.pl[opt.j]; if (q) { const [x, y] = glob(D.k, Z[0] + rf(-.6, .6), Z[1] + rf(-.6, .6)); q.x = x; q.y = y; q.runTo = [Z[0], Z[1]]; q.run = E.time + 2; }
      const ok = R() < (mg && mg.p != null ? mg.p : opt.pp ?? opt.p); D.ok = ok;
      meCm(E, 'corner', D.k, tk); meCross(E, D.k, D.taker, opt.j, true, ok ? 'ok' : R() < .5 ? 'mis' : undefined); return;
    }
    // reprise de la tête : tu files dans la zone, le centre arrive (plus ou moins bien), ta tête est jouée selon ton saut
    const [x, y] = glob(D.k, Z[0] + rf(-.4, .4), Z[1] + rf(-.4, .4)); me.x = x; me.y = y; me.runTo = [Z[0], Z[1]]; me.run = E.time + 2;
    const deliv = R() < clamp(.62 + (tk.a.pas - 70) / 120, .35, .9); D.ok = deliv;
    if (deliv) me.headMg = { p: mg && mg.p != null ? mg.p : opt.pp ?? opt.p, view: mg && mg.view ? mg.view : { kind: 'shot', zone: R() < .5 ? 3 : 5, dive: ri(0, 2), tq: 1 }, until: E.time + 4 };
    meCm(E, 'corner', D.k, tk); meCross(E, D.k, D.taker, D.i, true, deliv ? 'ok' : undefined); return;
  }
  if (D.kind === 'def') {
    const me = T.pl[D.i], [ok_, oi] = D.opp, op = E.T[ok_].pl[oi];
    const ok = R() < (mg && mg.p != null ? mg.p : opt.pp ?? clamp(opt.p + DF().mom, .03, .97)); D.ok = ok;
    if (opt.act === 'foul') { const y0 = me.yc; meFoul(E, D.k, D.i, ok_, oi); D.ok = true; if (me.yc === y0 && !me.rc && R() < .45) meCard(E, D.k, D.i, 'Y'); return; }
    if (opt.act === 'tackle') { setAct(E, me, R() < .5 ? GEST.SLIDE : GEST.TACKLE, Math.atan2(op.y - me.y, op.x - me.x)); if (ok) { me.st.tk++; op.st.lost++; giveBall(E, D.k, D.i); meEv(E, 'tackle', D.k, me); } else { me.beat = E.time + 1.4; op.carry = glob(ok_, Math.min(103, loc(ok_, op.x, op.y)[0] + 8), loc(ok_, op.x, op.y)[1]); E.timer = .8; if (R() < (opt.card || 0) * .6) meCard(E, D.k, D.i, 'Y'); } return; }
    if (ok) { me.st.int++; E.timer = .2; op.carry = null; op.beat = 0; const pas = bestPasses(E, ok_, oi).filter(x => loc(ok_, x.q.x, x.q.y)[0] < loc(ok_, op.x, op.y)[0]).sort((a, b) => b.ev - a.ev)[0]; if (pas) mePass(E, ok_, oi, pas.j, 'pass'); } else { me.beat = E.time + 1.2; op.carry = glob(ok_, Math.min(103, loc(ok_, op.x, op.y)[0] + 9), 34); E.timer = .9; }
    return;
  }
  if (D.kind === 'gk' || D.kind === 'gkpen') {
    const [sk, si] = D.shooter, saved = R() < clamp(mg ? mg.p : (opt.pp ?? D.base + DF().mom), .02, .97); D.ok = saved;
    const gd = mg && mg.view ? [-1, 0, 1][mg.view.dir] : null;
    meShot(E, sk, si, Object.assign({}, D.o, { decided: true, forceRes: saved ? 'save' : 'goal', gkDir: gd, sDir: D.sDir }));
    return;
  }
}
// Équipes depuis le contexte de carrière
function meTeamFrom(t, s, nat, opts) {
  const cands = [];
  for (const st of (t.stars || [])) if (!st.inj) cands.push({ n: st.n, pos: st.pos, o: st.o, sn: st.n });
  if (opts && opts.squad) for (const x of opts.squad) if (!x.star && !cands.some(c => c.n === x.n)) cands.push({ n: x.n, pos: x.pos, o: x.o });
  return cands;
}
function kitColors(name, avoid) { let h = hueOf(name); if (h > 70 && h < 170) h = (h + 110) % 360; if (avoid != null) { const d = Math.abs(((h - avoid) + 540) % 360 - 180); if (d < 75) { h = (avoid + 180) % 360; if (h > 70 && h < 170) h = (avoid + 240) % 360; } } return { col: `hsl(${h} 62% 46%)`, col2: `hsl(${h} 40% 18%)`, hue: h, gkc: `hsl(${(h + 120) % 360} 70% 55%)` }; }
let ME_RUN = .022;

// ---------- Images pour l'affichage ----------
// en-tête 12 : t, horloge, mi-temps, ballon x y z, porteur k i, version effectif, arrêt, ballon en mains, possession
// 22 joueurs × 7 : x, y, sur le terrain, orientation, geste, début du geste, paramètre du geste
// arbitres 9 : x, y, orientation, geste, début ; assistant 1 x, drapeau ; assistant 2 x, drapeau
// équipes 2 × 6 : lignes défense/milieu/attaque (x), humeur, dispositif, pressing
const MF_H = 12, MF_S = 7, MF_R = MF_H + 22 * MF_S, MF_T = MF_R + 9, MF_N = MF_T + 12;
// moteur sauvegardé par une version précédente : on complète l'état
function meUpgrade(E) {
  if (!E) return; if (!E.arb) E.arb = { x: 46, y: 22, vx: 0, vy: 0 }; if (E.arb.act == null) { E.arb.act = 0; E.arb.actT = -9; } if (!E.cm) E.cm = []; if (!E.hm) E.hm = new Array(384).fill(0); if (!E.shots) E.shots = []; if (!E.cond) E.cond = {}; if (E.pk == null) E.pk = -1; if (E.var === undefined) E.var = null;
  if (E.crl == null) condPhys(E); if (!E.flag || E.flag.length !== 2) E.flag = [-1, -9];
  const b = E.ball; if (b.vz == null) b.vz = 0; if (b.cu == null) b.cu = 0; if (b.tp == null) b.tp = 0; if (b.pv == null) b.pv = 0; if (b.st === 'fly' || b.st === 'loose') { const f = b.f; b.st = 'air'; if (f && f.tx != null) { const d = dst(b.x, b.y, f.tx, f.ty) || 1; b.vx = (f.tx - b.x) / d * 8; b.vy = (f.ty - b.y) / d * 8; } b.z = 0; b.kick = { k: E.poss, i: 0, kind: 'loose', t0: E.time, j: -1 }; }
  if (b.kick === undefined) b.kick = null;
  for (const T of E.T) { if (!T.form) T.form = '433'; if (T.mood == null) T.mood = 0; if (T.lostT == null) T.lostT = -9; if (!T.L) T.L = [20, 35, 50]; if (!T.plan) mePlan(T); for (const p of T.pl.concat(T.out || [])) { if (p.face == null) p.face = 0; if (p.act == null) { p.act = 0; p.actT = -9; p.actA = 0; } if (p.busy == null) p.busy = 0; } }
}
function meFrame(E) {
  if (E.crl == null || !E.arb) meUpgrade(E);
  const f = new Float32Array(MF_N), b = E.ball, o = b.own;
  f[0] = E.time; f[1] = E.clock; f[2] = E.half; f[3] = b.x; f[4] = b.y; f[5] = b.z; f[6] = o ? o[0] : -1; f[7] = o ? o[1] : -1; f[8] = E.rv || 0; f[9] = (E.rs || b.st === 'dead' || b.st === 'net') ? 1 : 0; f[10] = b.hand ? 1 : 0; f[11] = E.poss;
  let n = MF_H;
  for (let k = 0; k < 2; k++) { const P = E.T[k].pl; for (let i = 0; i < 11; i++) { const p = P[i]; f[n++] = p.x; f[n++] = p.y; f[n++] = p.on && !p.rc ? 1 : 0; f[n++] = p.face; f[n++] = p.act || 0; f[n++] = p.actT; f[n++] = p.actA || 0; } }
  const r = E.arb; f[n++] = r.x; f[n++] = r.y; f[n++] = Math.atan2(b.y - r.y, b.x - r.x); f[n++] = r.act || 0; f[n++] = r.actT ?? -9;
  f[n++] = clamp(Math.max(lineOf(E, 1, true), b.x), 52.5, PL); f[n++] = E.flag && E.flag[0] === 1 ? E.flag[1] : -9; f[n++] = clamp(Math.min(lineOf(E, 0, false), b.x), 0, 52.5); f[n++] = E.flag && E.flag[0] === 0 ? E.flag[1] : -9;
  for (let k = 0; k < 2; k++) { const T = E.T[k], L = T.L || [20, 35, 50]; for (let j = 0; j < 3; j++) f[n++] = k === 0 ? L[j] : PL - L[j]; f[n++] = T.mood || 0; f[n++] = FORM_K.indexOf(T.form); f[n++] = T.plan ? T.plan.press : .4; }
  return f;
}
function meRoster(E) { return E.T.map(T => T.pl.map(p => ({ n: p.n, num: p.num, me: !!p.me, gk: p.role === 'GK', role: p.role }))); }
function mePlayerMe(E) { return E.T[0].pl.find(p => p.me) || E.meStore || (E.T[0].out || []).find(p => p.me) || null; }
