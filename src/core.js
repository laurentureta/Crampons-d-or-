// ===================== NOYAU : outils, calendrier, joueur, monde, match =====================
const VERSION = 2;
let S = null;
const R = () => Math.random();
const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
const rf = (a, b) => a + R() * (b - a);
const pick = a => a[Math.floor(R() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const gauss = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
function poisson(l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= R(); } while (p > L); return k - 1; }
function wpick(items, wf) { let t = 0; const ws = items.map(x => { const w = Math.max(0, wf(x)); t += w; return w; }); if (t <= 0) return null; let r = R() * t; for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; } return items[items.length - 1]; }
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- Ligues : 1re et 2e divisions ----------
for (const L of LEAGUES) { L.cc = L.id; L.tier = 1; }
for (const L2 of SECOND) { const P_ = LEAGUES.find(x => x.id === L2.parent); LEAGUES.push(Object.assign({ cc: L2.parent, tier: 2, cont: null, slots: 0, cup: P_.cup }, L2)); }
const L_BY = id => LEAGUES.find(l => l.id === id);
const TOP = LEAGUES.filter(l => l.tier === 1);

// ---------- Constantes de jeu ----------
const ATTR = ['VIT', 'END', 'PHY', 'TEC', 'DRI', 'PAS', 'TIR', 'DEF', 'MEN', 'GAR'];
const ATTR_N = { VIT: 'Vitesse', END: 'Endurance', PHY: 'Physique', TEC: 'Technique', DRI: 'Dribble', PAS: 'Passe', TIR: 'Tir', DEF: 'Défense', MEN: 'Mental', GAR: 'Gardien' };
const POS_N = { GB: 'Gardien', DC: 'Défenseur central', DL: 'Latéral', MDC: 'Milieu défensif', MC: 'Milieu central', MOC: 'Meneur de jeu', AIL: 'Ailier', BU: 'Buteur' };
const POSW = { GB: { GAR: .55, MEN: .15, PHY: .1, PAS: .1, VIT: .1 }, DC: { DEF: .35, PHY: .2, VIT: .1, PAS: .1, MEN: .15, END: .1 }, DL: { DEF: .25, VIT: .2, END: .15, PAS: .15, DRI: .1, MEN: .05, PHY: .1 }, MDC: { DEF: .25, PAS: .2, END: .15, PHY: .15, MEN: .15, TEC: .1 }, MC: { PAS: .25, TEC: .2, MEN: .15, END: .15, DRI: .1, TIR: .05, DEF: .1 }, MOC: { PAS: .2, TEC: .2, DRI: .2, TIR: .15, MEN: .15, VIT: .1 }, AIL: { VIT: .25, DRI: .25, TEC: .15, TIR: .15, PAS: .1, END: .1 }, BU: { TIR: .35, VIT: .15, PHY: .15, TEC: .1, DRI: .1, MEN: .15 } };
const GROUP = { GB: 'GB', DC: 'DC', DL: 'DL', MDC: 'MIL', MC: 'MIL', MOC: 'MIL', AIL: 'AIL', BU: 'BU' };
const SLOTS = { GB: 1, DC: 2, DL: 2, MIL: 3, AIL: 2, BU: 1 };
const GOALW = { BU: 5, AIL: 3, MOC: 2.6, MC: 1.2, MDC: .5, DL: .5, DC: .45, GB: 0 };
const ASSW = { BU: 1.5, AIL: 2.6, MOC: 3, MC: 2, MDC: .8, DL: 1.4, DC: .4, GB: .05 };
const FEM = ['Sophie', 'Nadia', 'Fatou', 'Maria', 'Sarah', 'Amina', 'Laura', 'Inès', 'Claire', 'Yasmina', 'Ana', 'Julia', 'Leïla', 'Camille', 'Aïcha', 'Léa', 'Chloé', 'Emma', 'Lina', 'Jade', 'Manon', 'Zoé', 'Elena', 'Noémie'];
const DIFF = [
  { n: 'Facile', d: 'Progression rapide, essais plus accessibles, plus d\'argent.', grow: 1.25, trial: -3, money: 1.4, inj: .7, mom: .08 },
  { n: 'Normal', d: 'L\'expérience prévue.', grow: 1, trial: 0, money: 1, inj: 1, mom: 0 },
  { n: 'Difficile', d: 'Il faudra vraiment travailler.', grow: .86, trial: 3, money: .85, inj: 1.25, mom: -.05 },
  { n: 'Légende', d: 'Pour ceux qui veulent tout mériter.', grow: .74, trial: 5, money: .7, inj: 1.4, mom: -.1 },
];
const DF = () => DIFF[S ? S.diff : 1];

// ---------- Calendrier réel ----------
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAYS_S = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MONTHS_S = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const INTL_WEEKS = [5, 9, 13, 29];
const LEAGUE_WEEKS = (() => { const a = []; for (let w = 1; w <= 41; w++) if (!INTL_WEEKS.includes(w)) a.push(w); return a; })();
const CUP_WEEKS = [8, 16, 22, 27, 33, 40];
const CUP_ROUNDS = ['32es de finale', '16es de finale', '8es de finale', 'Quarts de finale', 'Demi-finale', 'Finale'];
const UCL_LP = [4, 7, 10, 12, 15, 18, 21, 23];
const KO = { po: [25, 26], r16: [28, 29], qf: [32, 33], sf: [35, 36], f: [42] };
const KO_N = { po: 'Barrages', r16: '8es de finale', qf: 'Quarts de finale', sf: 'Demi-finales', f: 'Finale' };
const KO_ORDER = ['po', 'r16', 'qf', 'sf', 'f'];
function seasonStart(y) { const d = new Date(y, 7, 14); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; }
function dateAt(season, w, day) { const d = seasonStart(season); d.setDate(d.getDate() + (w - 1) * 7 + (day || 0)); return d; }
const today = () => dateAt(S.season, S.week, S.day);
function fmtDay(d) { return DAYS[(d.getDay() + 6) % 7] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
function fmtShort(d) { return d.getDate() + ' ' + MONTHS_S[d.getMonth()] + ' ' + d.getFullYear(); }
const dateStr = () => fmtShort(today());
const absDay = () => (S.season - 2026) * 364 + (S.week - 1) * 7 + S.day;
const seasonLabel = y => y + '-' + String(y + 1).slice(2);
const SUMMER = w => w >= 43 || w <= 3;
const WINTER = w => w >= 20 && w <= 23;

// ---------- Format ----------
function eur(n) {
  const s = n < 0 ? '−' : ''; n = Math.abs(n);
  if (n >= 1e9) return s + (n / 1e9).toFixed(2).replace('.', ',') + ' Md€';
  if (n >= 1e6) return s + (n / 1e6).toFixed(n >= 1e8 ? 0 : 1).replace('.', ',') + ' M€';
  if (n >= 1e4) return s + Math.round(n / 1e3) + ' k€';
  return s + Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ') + ' €';
}
const fnum = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' M' : n >= 1e4 ? Math.round(n / 1e3) + ' k' : Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ');
const monthly = wk => Math.round(wk * 52 / 12);

// ---------- Joueur ----------
function ovrOf(at, pos) { let s = 0; for (const k in POSW[pos]) s += POSW[pos][k] * at[k]; return Math.round(s); }
const OVR = () => ovrOf(S.p.at, S.p.pos);
const club = id => S.W.clubs[id];
const myClub = () => S.club.id ? club(S.club.id) : null;
const nation = () => NATIONS[S.p.nat];
function natName(code) { return NATIONS[code] ? NATIONS[code].n : (OTHER_NATIONS[code] ? OTHER_NATIONS[code][0] : code); }
function genName(nat) { const pool = NAMEPOOL[nat] || NAMEPOOL.FRA; return pick(pool.f) + ' ' + pick(pool.l); }
function initials(n) { const w = String(n).replace(/^(FC|AS|SC|RC|AC|CF|CD|SV|SD|UD|EA|USL|US|OGC|LOSC|RB|TSG|VfB|VfL|SL|GD|ES|AJ|Stade|Olympique|Real|Club|Al-|1\.)\s*/i, '').split(/[\s-]+/).filter(x => x && !/^(de|du|la|le|des|d'|&|et|of|y|·)$/i.test(x)); return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || String(n)).slice(0, 2)).toUpperCase(); }
function hueOf(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
const pName = () => S.p.first + ' ' + S.p.last;

function newGame(o) {
  const pot = clamp(Math.round(82 + gauss() * 6), 70, 97);
  const base = 29 + Math.round((pot - 80) * 0.3);
  const at = {}, cap = {};
  for (const A of ATTR) {
    const w = POSW[o.pos][A] || 0;
    if (A === 'GAR') { at[A] = o.pos === 'GB' ? base + 8 + ri(0, 4) : ri(6, 12); cap[A] = o.pos === 'GB' ? Math.min(99, pot + ri(1, 5)) : 22; continue; }
    if (o.pos === 'GB') { at[A] = base - 4 + Math.round(w * 30) + ri(-4, 4); cap[A] = w ? Math.min(99, pot + ri(-2, 3)) : pot - ri(14, 24); continue; }
    at[A] = base + Math.round(w * 26) + (w ? 2 : -3) + ri(-4, 4);
    cap[A] = w ? Math.min(99, pot + ri(0, 5)) : clamp(pot - ri(6, 16), 40, 92);
  }
  const N = NATIONS[o.nat], pool = NAMEPOOL[o.nat] || NAMEPOOL.FRA, fam = o.fam;
  const amaName = amateurName(o.nat, o.city);
  S = {
    v: VERSION, season: 2026, week: 1, day: 0, over: false, diff: o.diff ?? 1, pref: o.pref || 'F',
    p: { first: o.first, last: o.last, nat: o.nat, city: o.city, pos: o.pos, foot: o.foot, age: 14, bweek: ri(2, 52), at, cap, pot, energy: 85, moral: 72, forme: 50, inj: 0, injName: '', money: Math.round([20, 60, 250][fam] * (DIFF[o.diff ?? 1].money)), rep: 1, followers: ri(40, 160), pop: 50, favNum: o.num || 10, boost: 0 },
    fam: { w: fam, savings: [300, 1600, 9000][fam], dad: { n: pick(pool.f) + ' ' + o.last, rel: 70, age: ri(38, 47) }, mom: { n: pick(FEM) + ' ' + o.last, rel: 76, age: ri(36, 45) }, stress: [25, 12, 4][fam], sac: 0, house: false, car: false, lastAsk: -99 },
    friend: { n: genName(o.nat), rel: 72, house: false },
    love: null, school: { lvl: ri(38, 62), bac: false, done: false }, permis: { h: 0, ok: false, tries: 0 },
    agent: null,
    club: { kind: 'amateur', id: null, n: amaName, wage: 0, until: 0, since: 2026, num: o.num || 10 },
    coach: { n: genName(o.nat), rel: 62 }, mateRel: 62,
    plan: defaultPlan('amateur'), jobs: null, jobi: 0, wk: null, intlCall: null,
    ss: newSS(amaName), hist: [], intl: { caps: 0, g: 0, ycaps: 0, yg: 0, level: '', debut: false, wcs: 0 },
    trophies: [], awards: [], bdo: [], ach: {},
    assets: { houses: [], cars: [], liv: 0, etf: 0, cry: 0, immo: [], st: [], spons: [], serv: [] },
    offers: [], inbox: [], news: [], feed: [], acc: { wage: 0, sp: 0 }, month: newMonth(),
    settings: { live: 'all', speed: 1 }, flags: {}, trialsDone: [], lastTrialD: -99, benchStreak: 0, transferReq: false,
    stats: { proApps: 0, proGoals: 0, hat: 0, tens: 0, derbyGoals: 0, cs: 0, leagues: [] },
    dayLog: null, weekLog: [],
    W: initWorld(),
  };
  newSeason(true);
  buildWeek();
  addNews('Bienvenue', `${o.first} ${o.last}, 14 ans, rejoint les U15 de ${amaName}. Le rêve commence ici.`);
  feedPost('Maman', 'Fière de toi mon fils. Travaille, le reste viendra.');
  ensureV3(); curveSample('août 2026');
  inbox('info', 'Bienvenue dans ta carrière', `Tu joues en U15 à ${amaName}. Planifie ta semaine dans l'Agenda, puis passe les jours depuis l'Accueil. Brille en match pour attirer les recruteurs, ou paie tes essais dans les clubs.`);
  return S;
}
function amateurName(nat, city) { const N = NATIONS[nat]; return (nat === 'ENG' || nat === 'USA') ? city + ' ' + N.pre : N.pre + ' ' + city; }
function newSS(comp) { return { apps: 0, min: 0, g: 0, a: 0, rs: 0, cs: 0, starts: 0, cl: { apps: 0, g: 0 }, comp: comp || '' }; }
function newMonth() { return { inc: 0, exp: 0, apps: 0, g: 0, a: 0, rs: 0, f0: S ? S.p.followers : 0, lines: [] }; }
function defaultPlan(kind) {
  const T = (s, i) => ({ k: 'train', s, i });
  if (kind === 'amateur') return [T('POSTE', 'N'), { k: 'free' }, T('TECH', 'N'), { k: 'free' }, T('PHYS', 'L'), null, { k: 'rest' }];
  return [T('POSTE', 'N'), T('TECH', 'N'), T('PHYS', 'N'), T('POSTE', 'N'), T('MENT', 'L'), null, { k: 'rest' }];
}

// ---------- Messages, actualités, réseau ----------
function addNews(tag, txt) { S.news.unshift({ t: tag, x: txt, d: dateStr() }); if (S.news.length > 80) S.news.length = 80; }
function feedPost(who, txt, kind) { S.feed.unshift({ w: who, x: txt, k: kind || '', d: dateStr() }); if (S.feed.length > 50) S.feed.length = 50; }
function inbox(k, t, x, ref) { S.inbox.unshift({ id: absDay() + '-' + Math.floor(R() * 1e6), k, t, x, d: dateStr(), read: false, ref }); if (S.inbox.length > 60) S.inbox.length = 60; }
const unread = () => S.inbox.filter(m => !m.read).length;

// ---------- Monde ----------
let IDX = null;
function starsOf(cid) { if (!IDX) { IDX = {}; for (const s of S.W.stars) (IDX[s.cid] = IDX[s.cid] || []).push(s); } return IDX[cid] || []; }
function initWorld() {
  const W = { clubs: {}, leagues: {}, stars: [], hist: [], cl: {}, cups: {}, lastOrder: {}, tours: [], lastHon: null };
  for (const L of LEAGUES) {
    const members = [];
    L.clubs.forEach((c, i) => {
      const id = L.id + '_' + i; members.push(id);
      W.clubs[id] = { id, lid: L.id, n: c[0], city: c[1], coach: c[2], s: c[3], base: c[3], cc: L.cc };
      const addStars = str => { if (str) for (const t of str.split(';')) { const [n, pos, o, a] = t.split('|'); if (!W.stars.some(s => s.n === n)) W.stars.push({ n, pos, o: +o, a: +a, cid: id, g: 0, as: 0, ap: 0, inj: 0, ls: null }); } };
      addStars(c[4]); addStars(EXTRA_PLAYERS[c[0]]);
    });
    W.leagues[L.id] = { members, table: {}, rounds: [], weekMap: {} };
  }
  return W;
}
function roundRobin(ids, double) {
  const arr = shuffle(ids.slice()), n = arr.length, rounds = [];
  for (let r = 0; r < n - 1; r++) { const m = []; for (let i = 0; i < n / 2; i++) { const a = arr[i], b = arr[n - 1 - i]; m.push(r % 2 ? [b, a] : [a, b]); } rounds.push(m); arr.splice(1, 0, arr.pop()); }
  if (double) rounds.push(...rounds.map(rd => rd.map(([a, b]) => [b, a])));
  return rounds;
}
function leagueOrder(lid) { const T = S.W.leagues[lid].table; return Object.keys(T).sort((a, b) => (T[b].pts - T[a].pts) || ((T[b].gf - T[b].ga) - (T[a].gf - T[a].ga)) || (T[b].gf - T[a].gf)); }
const leagueDays = (n, i) => n === 1 ? [5, 6] : i === 0 ? [2, 3] : [5, 6];
function newSeason(first) {
  const W = S.W;
  for (const L of LEAGUES) {
    const LG = W.leagues[L.id], ids = LG.members.slice();
    if (first) W.lastOrder[L.id] = ids.slice().sort((a, b) => W.clubs[b].s - W.clubs[a].s);
    LG.table = {}; for (const id of ids) LG.table[id] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, f: [] };
    LG.rounds = roundRobin(ids, ids.length <= 24);
    LG.weekMap = {};
    const R_ = LG.rounds.length;
    for (let r = 0; r < R_; r++) { const wk = LEAGUE_WEEKS[Math.floor(r * LEAGUE_WEEKS.length / R_)]; (LG.weekMap[wk] = LG.weekMap[wk] || []).push(r); }
  }
  for (const L of TOP) W.cups[L.id] = { alive: true, round: 0, winner: null };
  for (const s of W.stars) { s.ls = { g: s.g, as: s.as, ap: s.ap }; s.g = 0; s.as = 0; s.ap = 0; }
  setupContinental();
  if (!first) S.ss = newSS(S.club.n);
}
function setupContinental() {
  const W = S.W, lo = W.lastOrder;
  const UEFA_Q = { ENG: 5, ESP: 5, ITA: 5, GER: 5, FRA: 4, POR: 3, NED: 3, TUR: 2 };
  const ucl = []; for (const k in UEFA_Q) ucl.push(...lo[k].slice(0, UEFA_Q[k]));
  const afc = lo.KSA.slice(0, 4).concat(AFC_EXTRA.map(x => 'X|' + x[0] + '|' + x[1]));
  const cnc = lo.USA.slice(0, 6).concat(CONCACAF_EXTRA.map(x => 'X|' + x[0] + '|' + x[1]));
  W.cl = {
    UEFA: { teams: ucl, pts: {}, alive: [], winner: null, opp: shuffle(ucl.slice()), lpDone: false, pairs: null },
    AFC: { teams: afc, alive: shuffle(afc.slice(0, 16)), winner: null, pairs: null },
    CONCACAF: { teams: cnc, alive: shuffle(cnc.slice(0, 16)), winner: null, pairs: null },
  };
}
function team(id) {
  if (typeof id === 'object') return id;
  if (typeof id === 'string' && id.startsWith('X|')) { const [, n, s] = id.split('|'); return { id, n, s: +s, stars: [] }; }
  const c = club(id); return { id, n: c.n, s: c.s, stars: starsOf(id).filter(x => !x.inj) };
}
const contOf = lid => L_BY(lid).cont;
function derbyOf(a, b) { const na = typeof a === 'string' && S.W.clubs[a] ? club(a).n : null, nb = typeof b === 'string' && S.W.clubs[b] ? club(b).n : null; if (!na || !nb) return null; const d = DERBIES.find(x => (x[0] === na && x[1] === nb) || (x[0] === nb && x[1] === na)); return d ? d[2] : null; }

// ---------- Simulation de match ----------
function simMatch(h, a, ctx = {}) {
  let hs = h.s + rf(-1.5, 1.5), as = a.s + rf(-1.5, 1.5);
  const p = ctx.p;
  if (p && p.min > 0 && !ctx.noCredit) { const d = (p.ovr - (p.side === 'h' ? h.s : a.s)) * 0.1 * p.min / 90 + (S.p.moral - 60) / 120; if (p.side === 'h') hs += d; else as += d; }
  const ha = ctx.neutral ? 0 : 0.22;
  const hx = clamp(1.32 + (hs - as) * 0.068 + ha, 0.12, 4.4), ax = clamp(1.12 + (as - hs) * 0.068, 0.12, 4.4);
  const hg = poisson(hx), ag = poisson(ax);
  const ev = [], res = { hg, ag, ev, pen: null, p: null };
  const pst = p ? { min: p.min, g: 0, a: 0, rt: 0, cs: false } : null;
  const credit = (t, side, n) => {
    const isP = p && p.side === side && p.min > 0 && !ctx.noCredit;
    for (let i = 0; i < n; i++) {
      const min = ri(1, 90);
      const cands = t.stars.map(s => ({ s, w: GOALW[s.pos] * Math.max(.2, 1 + (s.o - 70) / 14) }));
      if (isP) cands.push({ s: 'P', w: GOALW[S.p.pos] * Math.max(.2, 1 + (S.p.at.TIR - 65) / 18) * (p.min / 90) * (p.youth ? 1.6 : 1) });
      const yth = p && p.youth, sw = cands.reduce((x, c) => x + c.w, 0);
      cands.push({ s: null, w: yth ? Math.max(2.2, 9 - sw * .5) : Math.max(6, 16 - sw * .6) });
      const sc = wpick(cands, c => c.w).s;
      const scN = sc === 'P' ? 'P' : sc ? sc.n : (ctx.squad && t.id === S.club.id ? squadName() : null);
      if (sc && sc !== 'P') sc.g++;
      if (sc === 'P') pst.g++;
      let asN = null;
      if (R() < .72) {
        const ac = t.stars.filter(s => s !== sc).map(s => ({ s, w: ASSW[s.pos] * Math.max(.2, 1 + (s.o - 70) / 14) }));
        if (isP && sc !== 'P') ac.push({ s: 'P', w: ASSW[S.p.pos] * Math.max(.2, 1 + (S.p.at.PAS - 65) / 18) * (p.min / 90) * (p.youth ? 1.5 : 1) });
        const aw = ac.reduce((x, c) => x + c.w, 0);
        ac.push({ s: null, w: yth ? Math.max(2, 8 - aw * .5) : Math.max(5, 14 - aw * .5) });
        const as_ = wpick(ac, c => c.w).s;
        if (as_ === 'P') { pst.a++; asN = 'P'; } else if (as_) { as_.as++; asN = as_.n; }
      }
      ev.push({ min, side, sc: scN, as: asN });
    }
  };
  credit(h, 'h', hg); credit(a, 'a', ag);
  ev.sort((x, y) => x.min - y.min);
  for (const t of [h, a]) for (const s of t.stars) s.ap++;
  if (ctx.ko && hg === ag) { const ph = 1 / (1 + Math.exp(-(hs - as) / 8)); res.pen = R() < ph ? 'h' : 'a'; }
  if (pst) { finishRating(pst, p, h, a, hg, ag, 0, 0); res.p = pst; }
  return res;
}
function finishRating(pst, p, h, a, hg, ag, succ, fail) {
  const mine = p.side === 'h' ? hg : ag, theirs = p.side === 'h' ? ag : hg;
  if (pst.min <= 0) return;
  const tS = p.side === 'h' ? h.s : a.s;
  let rt = 6.2 + (p.ovr - tS) * 0.035 + (mine > theirs ? .45 : mine < theirs ? -.4 : 0) + pst.g * .95 + pst.a * .6 + (S.p.forme - 50) / 70 + succ * .32 - fail * .28 + (S.p.boost || 0) + (succ || fail ? gauss() * .3 : gauss() * .55);
  if (S.p.pos === 'GB') rt += theirs === 0 ? .9 : -.3 * theirs + .2;
  else if (GROUP[S.p.pos] === 'DC' || GROUP[S.p.pos] === 'DL') rt += theirs === 0 ? .45 : -.12 * theirs;
  if (S.club.captain) rt += .1;
  if (pst.min < 45) rt = 6 + (rt - 6) * .7;
  pst.rt = Math.round(clamp(rt, 3, 10) * 10) / 10; pst.cs = theirs === 0 && pst.min >= 60;
}
function squadName() { const g = (S.squad || []).filter(x => !x.star); return g.length ? pick(g).n : 'un coéquipier'; }
function applyTable(lid, h, a, hg, ag) {
  const T = S.W.leagues[lid].table, H = T[h], A = T[a]; if (!H || !A) return;
  H.p++; A.p++; H.gf += hg; H.ga += ag; A.gf += ag; A.ga += hg;
  if (hg > ag) { H.w++; A.l++; H.pts += 3; H.f.push('V'); A.f.push('D'); }
  else if (hg < ag) { A.w++; H.l++; A.pts += 3; H.f.push('D'); A.f.push('V'); }
  else { H.d++; A.d++; H.pts++; A.pts++; H.f.push('N'); A.f.push('N'); }
  if (H.f.length > 5) H.f.shift(); if (A.f.length > 5) A.f.shift();
}

// ---------- Effectif & temps de jeu ----------
function buildSquad() {
  const c = myClub(); if (!c) { S.squad = []; return; }
  const sq = starsOf(c.id).map(s => ({ n: s.n, pos: s.pos, o: s.o, star: true, ref: s }));
  const need = { GB: 3, DC: 4, DL: 4, MDC: 2, MC: 3, MOC: 2, AIL: 4, BU: 3 };
  const nat = LEAGUE_NAT[c.cc] || 'FRA';
  for (const pos in need) { let have = sq.filter(x => x.pos === pos).length; while (have < need[pos]) { sq.push({ n: genName(nat), pos, o: clamp(Math.round(c.s - 4 + gauss() * 3.2 - have * 1.5), 48, 90), star: false }); have++; } }
  S.squad = sq;
}
function refreshSquadStars() { const c = myClub(); if (!c) return; const gen = (S.squad || []).filter(x => !x.star); S.squad = starsOf(c.id).map(s => ({ n: s.n, pos: s.pos, o: s.o, star: true, ref: s })).concat(gen); if (!gen.length) buildSquad(); }
function rivals() { const g = GROUP[S.p.pos]; return (S.squad || []).filter(x => GROUP[x.pos] === g && !(x.ref && x.ref.inj)); }
function myRank(noise) {
  const me = OVR() + (S.coach.rel - 55) / 10 + (S.p.forme - 50) / 18 + (noise ? rf(-2.5, 2.5) : 0) + (S.p.age <= 20 ? .8 : 0) + (S.club.promise ? 2 : 0) + (S.club.captain ? 1.5 : 0);
  return rivals().filter(x => x.o + (noise ? rf(-2.5, 2.5) : 0) > me).length;
}
function computeRole() {
  if (S.club.kind === 'coach') return 'Entraîneur';
  if (S.club.kind === 'amateur') return S.club.free ? 'Sans club' : 'Titulaire';
  if (S.club.kind === 'academy') return 'Formation';
  const c = myClub(), o = OVR(), k = SLOTS[GROUP[S.p.pos]], r = myRank(false);
  if (o < c.s - 13) return S.p.age <= 20 ? 'Espoir (réserve)' : 'Réserve';
  if (r < k) { const best = Math.max(0, ...rivals().map(x => x.o)); return (o >= best + 2 && S.p.rep >= 70) ? 'Star de l\'équipe' : 'Titulaire'; }
  if (r < k + 1) return 'Rotation';
  return 'Remplaçant';
}
function selectMinutes() {
  if (S.club.kind === 'coach') return 0;
  if (S.p.inj > 0) return 0;
  if (S.susp > 0 && S.club.kind === 'pro') { S.susp--; if (S.dayLog) S.dayLog.lines.push('Suspendu : tu purges ta suspension.'); return 0; }
  if (S.club.kind !== 'pro') return 85;
  const c = myClub(); if (OVR() < c.s - 13) return -1;
  const k = SLOTS[GROUP[S.p.pos]], r = myRank(true);
  if (r < k) return R() < .06 ? ri(60, 80) : 90;
  if (r < k + 2) return R() < .55 ? ri(12, 35) : 0;
  return R() < .12 ? ri(5, 20) : 0;
}
