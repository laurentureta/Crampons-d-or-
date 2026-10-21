// ===================== MATCH EN DIRECT : piloté par le moteur de simulation (me.js) =====================
// Le moteur joue le match action par action. Ici : préparation des équipes, décisions du joueur,
// révélation des événements au rythme de l'affichage, mi-temps, tirs au but, note finale.
const MOM = {
  pen: { k: 'atk', q: c => `Penalty pour ton équipe ! ${c.gk} se balance sur sa ligne. Tu prends le ballon.`, o: c => [['Placé à ras de terre', 'TIR', .3, 'pen'], ['En force sous la barre', 'TIR', .26, 'pen'], ['Panenka', 'TEC', .12, 'pen']] },
  gkpen: { k: 'def', q: c => `Penalty pour ${c.opp}. ${c.att} pose le ballon…`, o: c => [['Plonger à gauche', 'GAR', 0, 'gkpen'], ['Plonger à droite', 'GAR', 0, 'gkpen'], ['Rester au centre', 'GAR', -.05, 'gkpen']] },
};
const MOM_BASE = { goal: .25, assist: .26, stop: .55, save: .6, pen: .5, gkpen: .1, safe: 1 };
const sfx = (M, k) => { (M.sfx = M.sfx || []).push(k); if (M.sfx.length > 12) M.sfx.shift(); };
const vis = (M, v) => { (M.vis = M.vis || []).push(v); if (M.vis.length > 20) M.vis.shift(); };
const onPitch = M => !!(M.E && !M.coach && M.E.T[0].pl.some(p => p.me && p.on && !p.rc));
const myMinute = M => M.E ? minNum(M.E.clock, M.E.half) : M.min;

function teamNat(t) { const c = t && t.id && S.W && S.W.clubs && S.W.clubs[t.id]; return c ? (LEAGUE_NAT[c.cc] || 'FRA') : (t && t.nat) || (S.p && S.p.nat) || 'FRA'; }
function liveNames(M) {
  const E = M.E, my = E.T[0].pl.filter(p => p.on && !p.me && p.role !== 'GK'), op = E.T[1].pl.filter(p => p.on && !p.rc);
  return { mate: my.length ? pick(my).n : 'un coéquipier', def: (op.find(p => ['CB', 'LB', 'RB', 'DM'].includes(p.role)) || {}).n || 'le défenseur adverse', att: (op.find(p => p.role === 'ST') || {}).n || 'l\'attaquant adverse', gk: (op.find(p => p.role === 'GK') || {}).n || 'le gardien', opp: M.op };
}
function mkOpts(t, c) { return MOM[t].o(c).map(o => ({ t: o[0], at: o[1], mod: o[2], out: o[3], card: o[4] || 0, mt: t })); }

// ---------- Conditions du match : météo, nocturne, pelouse, affluence ----------
function matchCond(prep) {
  const d = today(), m = d.getMonth(), winter = m === 11 || m <= 1, cold = winter || m === 10 || m === 2;
  const hn = teamNat(prep.h), big = !!(prep.big || prep.cont), youth = !!prep.youth, amateur = !prep.intl && !prep.tour && S.club && S.club.kind === 'amateur';
  const night = big ? R() < .85 : youth ? R() < .1 : R() < .4;
  const snow = winter && !youth && R() < .05;
  const rain = !snow && R() < .15 + (cold ? .1 : 0) + (['ENG', 'GER', 'NED'].includes(hn) ? .08 : 0);
  const wear = clamp((youth || amateur ? .55 : .1) + (cold ? .2 : 0) + rf(-.1, .1), 0, 1);
  const hs = prep.h.s || 60, cap = clamp(4000 + (hs - 60) * 3000, 3000, 81000);
  const att = youth ? ri(40, 400) : amateur ? ri(150, 1500) : prep.intl || prep.tour ? ri(30000, 78000) : Math.round(Math.min(cap, cap * rf(.7, 1.02) * (big ? 1.1 : 1)) / 100) * 100;
  const temp = Math.round((winter ? 4 : cold ? 10 : m >= 5 && m <= 7 ? 26 : 17) + rf(-4, 4) - (night ? 3 : 0));
  return { night, rain, snow, mo: m, wear: Math.round(wear * 100) / 100, att, derby: !!prep.derby, big, youth, seed: hueOf(prep.h.n), temp };
}
function condTxt(c) { if (!c) return ''; const a = []; if (c.night) a.push('Nocturne'); a.push(c.snow ? 'Neige' : c.rain ? 'Pluie' : c.night ? 'Ciel dégagé' : 'Soleil'); a.push(c.temp + ' °C'); if (c.wear > .45) a.push('Pelouse abîmée'); a.push(c.att.toLocaleString('fr-FR') + ' spectateurs'); return a.join(' · '); }

// ---------- Préparation ----------
function liveSetup(prep) {
  const coach = !!prep.coach, side = prep.side, other = side === 'h' ? 'a' : 'h', my = side === 'h' ? prep.h : prep.a, op = side === 'h' ? prep.a : prep.h;
  const me = coach ? null : { n: pName(), me: true, pos: S.p.pos, o: OVR(), num: S.club.num || 10 };
  const mine = meTeamFrom(my, my.s, teamNat(my), { squad: prep.club && !coach ? S.squad : null }).filter(c => c.n !== pName());
  const theirs = meTeamFrom(op, op.s, teamNat(op), null);
  // dispositifs : le tien dépend du plan de jeu (et de ton poste), celui de l'adversaire de sa tactique
  const dlt = op.s - my.s, opTac = dlt < -6 ? pick(['def', 'counter', 'bal', 'bal']) : dlt > 6 ? pick(['off', 'press', 'bal', 'bal']) : pick(['bal', 'bal', 'press', 'counter']);
  const myTac = coach ? (S.mgr.tactic || 'bal') : 'bal', fA = pickForm(myTac, coach ? null : S.p.pos), fB = pickForm(opTac, null);
  const A = meLineup(mine, my.s, teamNat(my), me, fA), B = meLineup(theirs, op.s, teamNat(op), null, fB);
  // noms de famille tous différents sur le terrain (lisibilité des commentaires)
  { const used = new Set(), lnOf = n => LN(n); const fix = (L, nat) => L.forEach((c, i) => { if (!c) return; let n = c.n, k = 0; while (used.has(lnOf(n)) && !c.me && !c.sn && k++ < 30) n = genName(k > 20 ? pick(Object.keys(NAMEPOOL)) : nat); if (n !== c.n) L[i] = Object.assign({}, c, { n }); used.add(lnOf(L[i].n)); });
    fix(A.xi.filter(c => c && (c.me || c.sn)), teamNat(my)); fix(B.xi.filter(c => c && c.sn), teamNat(op)); for (const c of A.xi) if (c && (c.me || c.sn)) used.add(lnOf(c.n)); for (const c of B.xi) if (c && c.sn) used.add(lnOf(c.n));
    fix(A.xi, teamNat(my)); fix(A.bench, teamNat(my)); fix(B.xi, teamNat(op)); fix(B.bench, teamNat(op)); }
  const kh = kitColors(prep.h.n), ka = kitColors(prep.a.n, kh.hue), kM = side === 'h' ? kh : ka, kO = side === 'h' ? ka : kh;
  const starter = coach || prep.min >= 45, playMin = coach ? 0 : prep.min;
  const nDec = coach ? 0 : prep.min >= 60 ? 2 + (R() < .55 ? 1 : 0) : prep.min >= 25 ? 2 : 1;
  const cond = matchCond(prep);
  const E = meCreate({
    teams: [{ n: my.n, s: my.s, xi: A.xi, bench: A.bench, tac: myTac, form: fA, col: kM.col, col2: kM.col2, gkc: kM.gkc }, { n: op.n, s: op.s, xi: B.xi, bench: B.bench, tac: opTac, form: fB, col: kO.col, col2: kO.col2, gkc: kO.gkc }],
    home: prep.neutral ? -1 : side === 'h' ? 0 : 1, neutral: !!prep.neutral, coach, ko: !!(prep.ko && !prep.leg1), big: !!prep.big, decB: nDec,
    meOut: !coach && starter && prep.min < 88 ? prep.min * 60 + ri(0, 50) : null, meIn: !coach && !starter ? Math.max(60, (90 - prep.min) * 60) : null, meBench: !coach && !starter, cond,
  });
  const mp = mePlayerMe(E); if (mp) mp.sta = starter ? clamp(S.p.energy * .85 + 18, 30, 100) : 98;
  if (coach) { const F = S.mgr.focus, key = { att: 'sho', def: 'def', tact: 'pas' }[F]; for (const p of E.T[0].pl) { if (key) p.a[key] += 1.5; if (F === 'phys') p.sta = 100; } if (F === 'phys') E.T[0].tac.drain *= .85; }
  const M = {
    eng: true, E, coach, side, other, my: my.n, op: op.n, myS: my.s, opS: op.s, comp: prep.comp, label: prep.label || '', derby: prep.derby || null, big: !!prep.big,
    clubMatch: !!prep.club && !prep.youth && !prep.intl, starter, playMin, start: starter ? 0 : 90 - prep.min, end: starter ? (coach ? 90 : Math.min(90, prep.min)) : 90,
    min: '0', hg: 0, ag: 0, ev: [], feed: [], evi: 0, succ: 0, fail: 0, g: 0, a: 0, malus: 0, onMin: starter ? 0 : null, offMin: null,
    pending: null, last: null, lastAt: null, half: null, done: false, press: coach ? null : prematchQuestion(prep), pressRes: null,
    ko: !!(prep.ko && !prep.leg1), agg: prep.agg || null, shoot: null, pen: null, stopAt: null,
    stam: mp ? mp.sta : 100, yellow: false, sent: false, injOut: false, rested: false, sfx: ['whistle1'], vis: [], rivalDuel: !!prep.rivalDuel,
    tac: coach ? (S.mgr.tactic || 'bal') : null, focus: coach ? S.mgr.focus : null, kits: [kM, kO], st: null,
    cond, com: [], cmT: 0, comLast: -99, say: [],
  };
  comIntro(M);
  M.feed.push({ min: '0', t: `Coup d'envoi : ${prep.h.n} – ${prep.a.n}${M.derby ? ' (' + M.derby + ')' : ''}.`, k: 'info' });
  if (coach) M.feed.push({ min: '0', t: 'Tu es sur le banc, en costume.', k: 'info' });
  if (M.rivalDuel) M.feed.push({ min: '0', t: `Face à toi : ${S.rival.n}, ton rival de toujours.`, k: 'me' });
  if (!starter && !coach) M.feed.push({ min: '0', t: `Tu commences sur le banc. Entrée prévue vers la ${M.start}e minute.`, k: 'info' });
  if (coach) { liveSim(M, .01); }
  return M;
}

// ---------- Simulation et révélation ----------
// Fait avancer le moteur jusqu'au temps de jeu « until » (ou jusqu'à un arrêt : décision, mi-temps, fin).
function liveSim(M, until, rec) {
  const E = M.E; if (M.done || M.stopAt != null || M.pending || M.half || M.shoot) return 'stop';
  const r = meRun(E, until, rec);
  if (r !== 'time') { M.stopAt = E.time; M.stopWhy = r; }
  return r;
}
// Révèle les événements jusqu'au temps « t » ; crée le panneau d'arrêt quand on l'atteint. Renvoie true si l'affichage doit être reconstruit.
function liveAt(M, t, rt) {
  const E = M.E; let big = false;
  while (M.evi < E.ev.length && E.ev[M.evi].t <= t + 1e-6) { const e = E.ev[M.evi++]; if (liveEvent(M, e)) big = true; }
  // commentaires : écrits en avance par le réalisateur (comm.js), lancés pile au bon moment
  if (M.com) { M.cmT = Math.max(M.cmT || 0, t); comTick(M, t, rt); }
  M.clockAt = t;
  const mp = mePlayerMe(E); if (mp) M.stam = Math.round(mp.sta);
  if (M.lastQ && t >= M.lastQ.at) { M.last = M.lastQ; M.lastQ = null; big = true; }
  if (M.stopAt != null && t >= M.stopAt - 1e-6) { liveOnStop(M); big = true; }
  return big;
}
function evMin(e) { return minLabel(e.c, e.h); }
// ---------- Commentaires ----------
const LN = n => { const s = String(n || '').trim().split(' '); return s.length > 1 ? s.slice(1).join(' ') : s[0]; };
// une réplique : affichée dans la boîte de commentaire et envoyée à la voix (qui = 'S' Lo Sol, 'N' Nathalie)
function com(M, txt, pri, t, who, o) {
  if (!txt || !M.com) return; txt = String(txt).trim(); who = who || 'S'; const song = !!(o && o.song), dig = !!(o && o.dig);
  M.com.push({ t, txt, pri, who, song, dig }); if (M.com.length > 8) M.com.shift(); M.comLast = t;
}
function liveEvent(M, e) {
  const mineK = e.k === 0, tm = mineK ? M.my : M.op, mn = evMin(e), F = (t, k) => M.feed.push({ min: mn, t, k });
  M.min = mn;
  switch (e.type) {
    case 'goal': {
      if (mineK) { if (M.side === 'h') M.hg++; else M.ag++; } else { if (M.side === 'h') M.ag++; else M.hg++; }
      M.ev.push({ min: minNum(e.c, e.h), side: mineK ? M.side : M.other, sc: e.me ? 'P' : e.og ? e.n + ' (csc)' : e.n, as: e.asMe ? 'P' : (e.as || null) });
      if (e.me) { M.g++; if (e.kind === 'fk') S.cnt.fk++; if (e.kind === 'pen') S.cnt.pen++; }
      if (e.asMe) M.a++;
      const how = e.og ? ' (contre son camp)' : e.kind === 'head' ? ' de la tête' : e.kind === 'pen' ? ' sur penalty' : e.kind === 'fk' ? ' sur coup franc' : e.kind === 'chip' ? ' d\'un lob' : e.kind === 'volley' ? ' d\'une reprise de volée' : '';
      if (mineK) F(`⚽ But pour ${M.my} ! ${e.me ? 'Tu marques' : e.n + ' marque'}${how}${e.as ? ' (passe de ' + (e.asMe ? 'toi' : e.as) + ')' : ''}.`, 'goal');
      else F(`But de ${M.op} : ${e.n}${how}.`, 'opp');
      sfx(M, mineK ? 'goal' : 'oppgoal'); vis(M, { k: 'goal', t: e.t, mine: mineK, me: e.me, n: e.og ? e.n + ' (csc)' : e.n, as: e.asMe ? 'P' : (e.as || ''), how: how.replace(/^ \(|\)$/g, '').trim(), min: minNum(e.c, e.h), hg: M.hg, ag: M.ag });
      return true;
    }
    case 'save': {
      const gkMe = !mineK && false; // le gardien est de l'équipe e.k
      if (e.me && mineK) F(`Parade ! Tu sors la frappe de ${e.sh}.`, 'me');
      else if (e.shMe) F(`Ta frappe est arrêtée par ${e.n}.`, 'bad');
      else if ((e.xg || 0) > .07) F(`Arrêt de ${e.n} devant ${e.sh}.`, mineK ? 'info' : 'info');
      sfx(M, mineK ? 'cheer' : 'ooh'); vis(M, { k: 'save', t: e.t, mine: mineK, xg: e.xg, me: !!(e.me || e.shMe) }); return gkMe;
    }
    case 'miss': if ((e.xg || 0) > .1 || e.me) F(`${e.me ? 'Ta frappe' : 'Frappe de ' + e.n} ${e.hi ? 'au-dessus' : 'à côté'}${(e.xg || 0) > .25 ? ', quelle occasion manquée !' : '.'}`, e.me ? 'bad' : 'info'); sfx(M, 'ooh'); vis(M, { k: 'miss', t: e.t, mine: mineK, xg: e.xg, me: !!e.me }); return false;
    case 'wood': F(`${e.bar ? 'Sur la barre' : 'Sur le poteau'} ! ${e.me ? 'Ta frappe' : 'La frappe de ' + e.n} trouve le montant.`, e.me ? 'bad' : 'info'); sfx(M, 'ooh'); vis(M, { k: 'wood', t: e.t, mine: mineK, bar: e.bar }); return false;
    case 'block': if (e.me) F('Ta frappe est contrée.', 'bad'); vis(M, { k: 'block', t: e.t }); return false;
    case 'penalty': F(`Penalty pour ${tm} !`, mineK ? 'me' : 'bad'); sfx(M, 'chance'); vis(M, { k: 'pen', t: e.t }); return false;
    case 'foul': if (e.me) F(`Faute de ta part sur ${e.v}${e.adv ? ' (l\'arbitre laisse l\'avantage)' : ''}.`, 'bad'); if (e.adv) vis(M, { k: 'adv', t: e.t }); return false;
    case 'yellow': case 'red': {
      const red = e.type === 'red';
      if (e.me && mineK) {
        if (red) { M.sent = true; M.offMin = minNum(e.c, e.h); M.malus += 1.2; if (M.clubMatch) S.susp = (S.susp || 0) + 1; F(e.second ? 'Deuxième jaune : carton rouge ! Tu dois sortir.' : 'Carton rouge direct ! Tu rentres au vestiaire.', 'bad'); }
        else { M.yellow = true; M.malus += .2; F('Carton jaune pour toi.', 'bad'); if (M.clubMatch) { S.yellows = (S.yellows || 0) + 1; if (S.yellows >= 5) { S.yellows = 0; S.susp = (S.susp || 0) + 1; F('5e carton jaune de la saison : tu seras suspendu au prochain match.', 'bad'); } } }
      } else F(`${red ? 'Carton rouge' : 'Carton jaune'} pour ${e.n} (${tm}).`, 'info');
      sfx(M, 'card'); vis(M, { k: red ? 'red' : 'yellow', t: e.t, n: e.n }); return !!(e.me && mineK);
    }
    case 'offside': if (e.me) F('Tu es signalé hors-jeu.', 'info'); vis(M, { k: 'off', t: e.t }); return false;
    case 'drib': if (e.me) F(`Tu élimines ${e.o}.`, 'me'); return false;
    case 'steal': case 'tackle': if (e.me && mineK) F(`Ballon récupéré${e.v ? ' sur ' + e.v : ''}.`, 'me'); return false;
    case 'corner': vis(M, { k: 'corner', t: e.t }); return false;
    case 'sub':
      if (mineK && e.me) { M.onMin = minNum(e.c, e.h); F('Tu entres en jeu !', 'me'); sfx(M, 'cheer'); return true; }
      if (mineK && e.outMe) { M.offMin = minNum(e.c, e.h); if (e.why === 'blessure') { M.injOut = true; F('Tu restes au sol… Blessé, tu dois sortir.', 'bad'); } else { if (e.why === 'fatigue' || M.E.meTired) M.rested = true; F('Tu es remplacé. Applaudissements du public.', 'me'); } return true; }
      F(`Changement ${tm} : ${e.n} remplace ${e.out}${e.why === 'blessure' ? ' (blessé)' : ''}.`, 'info'); return false;
    case 'inj': if (!(e.me && mineK)) F(`${e.n} (${tm}) est touché.`, 'info'); return false;
    case 'ht': F(`Mi-temps : ${M.hg}-${M.ag}.`, 'info'); sfx(M, 'whistle2'); return true;
    case 'ft': F(`Coup de sifflet final : ${M.hg}-${M.ag}.`, 'info'); sfx(M, 'whistle3'); return true;
    case 'varchk': F(e.what === 'goal' ? 'VAR : vérification du but en cours…' : 'VAR : vérification d\'un possible penalty…', 'info'); vis(M, { k: 'varchk', t: e.t }); return false;
    case 'var': {
      if (e.what === 'goal' && !e.ok) {
        if (mineK) { if (M.side === 'h') M.hg--; else M.ag--; } else { if (M.side === 'h') M.ag--; else M.hg--; }
        const sc = e.me ? 'P' : e.n, sd = mineK ? M.side : M.other; for (let i = M.ev.length - 1; i >= 0; i--) if (M.ev[i].side === sd && M.ev[i].sc === sc) { M.ev.splice(i, 1); break; }
        if (e.me && mineK) M.g = Math.max(0, M.g - 1); if (e.asMe && mineK) M.a = Math.max(0, M.a - 1);
        F(`But refusé après VAR : ${e.why === 'hors-jeu' ? 'hors-jeu de ' + e.wn : 'main de ' + e.wn}.`, mineK ? 'bad' : 'me'); sfx(M, mineK ? 'oppgoal' : 'cheer');
      } else if (e.what === 'goal') F('VAR : le but est validé.', 'info');
      else if (e.award) F(`VAR : penalty accordé à ${tm} !`, mineK ? 'me' : 'bad');
      else if (!e.ok) F(`VAR : pas de penalty pour ${tm}, coup franc à l'entrée de la surface.`, 'info');
      else F('VAR : penalty confirmé.', 'info');
      vis(M, { k: 'var', t: e.t, ok: e.ok, what: e.what, award: !!e.award }); return true;
    }
  }
  return false;
}
// Arrêt atteint par l'affichage : on ouvre le panneau correspondant
function liveOnStop(M) {
  const E = M.E, why = M.stopWhy; M.stopAt = null; M.stopWhy = null;
  M.min = minLabel(E.clock, E.half);
  if (why === 'decision' && E.dec) { M.pending = buildDecision(M); sfx(M, 'chance'); return; }
  if (why === 'half') {
    if (M.coach) { M.pending = coachDecision(M, 45); return; }
    if (onPitch(M) && M.starter && (E.meOut == null || E.meOut > 3000)) M.half = halfOptions(M);
    return;
  }
  if (why === 'coach') { M.pending = coachDecision(M, E.cstopNow === 0 ? 0 : 70); return; }
  if (why === 'end' || E.over) { M.min = '90'; endOfTime(M); }
}
// Avance sans affichage (tests, repli sans canvas) : ~1 minute de jeu par appel
function liveTick(M) {
  if (M.done || M.pending || M.press || M.shoot || M.half) return;
  if (M.stopAt == null) liveSim(M, M.E.time + 60);
  liveAt(M, M.stopAt != null ? M.stopAt : M.E.time);
}

// ---------- Décisions du joueur ----------
function engP(M, o) { return clamp(o.p + DF().mom + (hasPerk('big') && M.big ? .04 : 0) + (M.boost2 || 0) + (S.p.forme - 50) / 500 + (o.out !== 'save' && M.stam < 40 ? -(40 - M.stam) / 200 : 0), .03, o.out === 'pen' ? .95 : .92); }
function buildDecision(M) {
  const E = M.E, D = E.dec, c = liveNames(M);
  if (D.kind === 'att' && D.pen) return { dec: true, q: `Penalty pour ton équipe ! ${D.gkn || c.gk} se balance sur sa ligne. Tu prends le ballon.`, o: D.opts.map(o => Object.assign({}, o, { mt: 'pen' })) };
  if (D.kind === 'att' && D.fk) return { dec: true, q: `Coup franc à ${D.d} mètres du but ! Le mur est en place, ${D.gkn || c.gk} replace ses défenseurs. C'est toi qui le tires.`, o: D.opts.map(o => Object.assign({}, o)) };
  if (D.kind === 'corner') return { dec: true, q: D.mode === 'take' ? 'Corner pour ton équipe ! Tu poses le ballon près du drapeau. Où l\'envoies-tu ?' : `Corner pour ton équipe, ${D.tn || 'ton coéquipier'} va le tirer. Tu montes dans la surface : quelle zone attaques-tu ?`, o: D.opts.map(o => Object.assign({}, o)) };
  if (D.kind === 'att') {
    const where = D.box ? 'dans la surface' : `à ${D.d} mètres du but`;
    return { dec: true, q: `Tu as le ballon ${where}${D.fo ? ', ' + D.fo + ' sort sur toi' : ''}. À toi de jouer !`, o: D.opts.map(o => Object.assign({}, o)) };
  }
  if (D.kind === 'def') return { dec: true, q: `${D.on} fonce vers le but${D.u > 85 ? ' et entre dans la surface' : ''}. Tu es au duel !`, o: D.opts.map(o => Object.assign({}, o, { out: 'stop' })) };
  if (D.kind === 'gkpen') { const b = clamp(.24 + (S.p.at.GAR - (M.opS - 6)) / 200, .12, .4); return { dec: true, sDir: D.sDir, q: `Penalty pour ${M.op}. ${D.sn} pose le ballon…`, o: [{ t: 'Plonger à gauche', at: 'GAR', out: 'gkpen', p: b }, { t: 'Plonger à droite', at: 'GAR', out: 'gkpen', p: b }, { t: 'Rester au centre', at: 'GAR', out: 'gkpen', p: b - .05 }] }; }
  const b = clamp(D.base, .08, .92);
  return { dec: true, sDir: D.sDir, q: `${D.sn} ${D.head ? 'reprend de la tête' : 'arme une frappe'}${D.d > 18 ? ' de loin' : D.d < 11 ? ' à bout portant' : ''} !`, o: [{ t: 'Plongeon', at: 'GAR', out: 'save', p: b }, { t: 'Rester debout et fermer l\'angle', at: 'GAR', out: 'save', p: clamp(b + (D.d < 12 ? .05 : -.06), .05, .92) }] };
}
function momProb(M, o) {
  if (o.p != null) return engP(M, o);
  if (o.out === 'safe') return 1;
  const v = o.at ? S.p.at[o.at] : 50, oppRef = M.opS - 6;
  let p = MOM_BASE[o.out] + (v - oppRef) / 120 + o.mod + DF().mom + (has('mental') ? .03 : 0) + (S.p.forme - 50) / 400 + (S.p.boost || 0) * .1;
  if (o.out === 'gkpen') p = .22 + (S.p.at.GAR - oppRef) / 160 + o.mod + DF().mom;
  if (o.out === 'pen') p = .7 + (v - oppRef) / 120 + (o.mod - .26) + DF().mom + (S.p.at.MEN - 60) / 300;
  p += perkMod(M, o) + (M.boost2 || 0);
  if (M.stam < 45) p -= (45 - M.stam) / 150;
  return clamp(p, .05, o.out === 'pen' ? .92 : o.out === 'goal' ? .72 : .85);
}
const LIVE_OK = { goal: ['BUUUT ! Imparable !', 'Quel but ! Le stade explose !', 'Lucarne ! Tu cours vers tes supporters.'], pass: ['Passe parfaite.', 'Ballon dans la course de ton coéquipier.'], assist: ['Centre parfait, ton coéquipier est à la réception !'], drib: ['Tu l\'élimines d\'un crochet !', 'Grand pont ! Le public se lève.'], stop: ['Intervention parfaite, le danger est écarté.', 'Superbe lecture du jeu, ballon récupéré.'], save: ['Arrêt réflexe exceptionnel !', 'Parade magnifique, le public scande ton nom.'], pen: ['Penalty transformé !', 'Imparable, le gardien n\'a rien pu faire.'], gkpen: ['Tu arrêtes le penalty !! Énorme !'] };
LIVE_OK.head = ['Le centre arrive dans ta zone, tu t\'élèves…']; LIVE_OK.corner = LIVE_OK.assist;
const LIVE_KO = { goal: ['Frappe à côté…', 'Le gardien s\'interpose.', 'Ta tentative est contrée.'], pass: ['Ta passe est interceptée.', 'Le ballon est trop long.'], assist: ['Ton centre est repoussé.'], drib: ['Il te prend le ballon.', 'Tu perds ton duel.'], stop: ['Tu es éliminé…', 'Trop tard, il t\'a pris de vitesse.'], save: ['Pas cette fois.', 'Le ballon file sous ton corps.'], pen: ['Raté ! Le gardien a deviné.', 'Sur le poteau !'], gkpen: ['Il te prend à contre-pied.'] };
LIVE_KO.head = ['Le centre est mal tiré : il ne t\'arrive pas.']; LIVE_KO.corner = LIVE_KO.assist;
function liveChoose(M, i, mg) {
  if (M.coach) return coachChoose(M, i);
  const m = M.pending; if (!m) return;
  const E = M.E, D = E.dec, o = m.o[i]; if (!D || !o) { M.pending = null; return; }
  const opt = Object.assign({}, o, { pp: momProb(M, o) });
  const meP = mePlayerMe(E), st0 = meP ? Object.assign({}, meP.st) : {};
  meApply(E, opt, mg ? { view: mg.view, p: mg.p } : null);
  // issue de l'action (connue du moteur, montrée quand le ballon arrive)
  const f = E.ball.f; let ok = false, out = o.out === 'goal' || o.out === 'pen' ? o.out : o.act === 'drib' ? 'drib' : o.act === 'cross' ? 'assist' : o.out === 'pass' ? 'pass' : o.out, at = E.time + .4;
  if (o.act === 'shot' || D.kind === 'gk' || D.kind === 'gkpen') {
    const res = f ? f.res : null; at = f ? f.t0 + f.dur + .3 : at;
    ok = D.kind === 'gk' || D.kind === 'gkpen' ? res !== 'goal' : res === 'goal';
    if (D.kind === 'gk' || D.kind === 'gkpen') { if (ok) S.cnt.save++; }
  } else if (o.act === 'pass' || o.act === 'thru' || o.act === 'cross') { ok = !!f && (f.res === 'ok' || f.res === 'duel'); at = f ? f.t0 + f.dur + .2 : at; }
  else if (o.act === 'corner' || o.act === 'head') { ok = !!D.ok; at = f ? f.t0 + Math.min(f.dur, 1.2) : at; }
  else ok = !!D.ok;
  if (D.kind === 'def' && ok) S.cnt.stop++;
  if (o.act === 'drib' && ok) S.cnt.drib++;
  if (ok) M.succ++; else M.fail++;
  let txt = (mg && (ok ? mg.okTxt : mg.koTxt)) || pick((ok ? LIVE_OK : LIVE_KO)[out] || (ok ? LIVE_OK.stop : LIVE_KO.stop));
  if (o.act === 'shot' && f && f.res === 'wood') txt = 'Sur le poteau ! Si près du but…';
  if ((o.act === 'pass' || o.act === 'thru') && ok && o.j != null) txt = `Passe réussie pour ${E.T[D.k].pl[o.j].n}.`;
  if (o.act === 'foul') txt = 'Faute tactique : l\'action est cassée.';
  M.lastQ = { ok, txt, pr: opt.pp, mg: mg ? mg.view : null, at };
  M.last = null; M.pending = null;
  if (meP && !meP.on && !M.offMin) M.offMin = myMinute(M);
}
function halfOptions(M) {
  const mine = M.side === 'h' ? M.hg : M.ag, th = M.side === 'h' ? M.ag : M.hg, o = [{ k: 'more', t: 'Je veux plus de ballons' }, { k: 'def', t: 'Je vais faire le travail défensif' }];
  if (M.stam < 55) o.push({ k: 'tired', t: 'Je suis cuit, coach' });
  o.push(mine < th ? { k: 'fire', t: 'On va le renverser, je m\'en occupe !' } : { k: 'calm', t: 'On continue comme ça' });
  return { q: `Mi-temps, ${M.hg}-${M.ag}. ${S.club.kind === 'amateur' || !S.coach.n || S.coach.n === '—' ? 'Ton coach' : S.coach.n.split(' (')[0]} te prend à part dans le vestiaire.`, o };
}
function liveHalf(M, i) {
  const h = M.half; if (!h) return; const o = h.o[i], E = M.E, mine = M.side === 'h' ? M.hg : M.ag, th = M.side === 'h' ? M.ag : M.hg;
  let res = '';
  if (o.k === 'more') { E.decB++; E.meDrift = 4; S.coach.rel = clamp(S.coach.rel + (mine < th ? 1 : -1), 0, 100); res = 'Le coach te donne les clés de l\'attaque.'; }
  else if (o.k === 'def') { E.decB++; E.meDrift = -4; S.coach.rel = clamp(S.coach.rel + 2, 0, 100); res = 'Le coach apprécie ton esprit d\'équipe.'; }
  else if (o.k === 'tired') { E.meOut = (60 + ri(0, 5)) * 60; M.rested = true; S.coach.rel = clamp(S.coach.rel - 1, 0, 100); res = 'Il te fera sortir vers l\'heure de jeu.'; }
  else if (o.k === 'fire') { for (const p of E.T[0].pl) for (const k of AKEYS) p.a[k] += .8; M.boost2 = .03; S.mateRel = clamp(S.mateRel + 1, 0, 100); res = 'Tes mots réveillent le vestiaire.'; }
  else { S.p.moral = clamp(S.p.moral + 1, 0, 100); res = 'Concentration maximale pour la seconde période.'; }
  M.feed.push({ min: '45', t: res, k: 'me' }); M.halfRes = res; M.half = null; sfx(M, 'whistle1');
}
function endOfTime(M) {
  const mine = M.side === 'h' ? M.hg : M.ag, th = M.side === 'h' ? M.ag : M.hg;
  const tie = M.agg ? (M.agg.mine + mine === M.agg.th + th) : (M.ko && mine === th);
  if (tie) {
    if (M.coach) M.shoot = { coach: true, q: 'Égalité : séance de tirs au but. Qui envoies-tu au point de penalty ?', o: [{ t: 'Les cadres les plus expérimentés' }, { t: 'Les joueurs les plus en confiance' }] };
    else { const isGK = S.p.pos === 'GB', c = liveNames(M), t = isGK ? 'gkpen' : 'pen'; M.shoot = { t, q: isGK ? `Séance de tirs au but ! Le dernier tireur de ${M.op} s'avance…` : 'Séance de tirs au but ! Tu es le 5e tireur, tout se joue sur toi.', o: mkOpts(t, c) }; if (!onPitch(M)) M.shoot.auto = true; }
    M.feed.push({ min: '90', t: M.agg ? `Égalité au cumul (${M.agg.mine + mine}-${M.agg.th + th}) : tirs au but.` : 'Égalité : tirs au but.', k: 'info' });
  } else M.done = true;
}

// ---------- Mini-jeux d'adresse ----------
function mgKind(o) { if (!S.settings || S.settings.mg === false || !o) return null; if (o.out === 'goal' || o.out === 'pen') return 'shot'; if (o.out === 'save' || o.out === 'gkpen') return 'gk'; return null; }
const ZONES = ['en haut à gauche', 'en haut au centre', 'en haut à droite', 'à ras de terre à gauche', 'au centre', 'à ras de terre à droite'];
function mgWidth(M, o, zone) { const v = o.at ? S.p.at[o.at] : 60; let w = clamp(.13 + (v - (M.opS - 6)) / 260 + (hasPerk('fin') || (o.out === 'pen' && hasPerk('pen')) ? .03 : 0), .07, .26); if (zone === 0 || zone === 2) w *= .7; if (zone === 4) w *= 1.35; return w; }
function mgShot(M, o, zone, x, dive) {
  const base = momProb(M, o), col = zone % 3, top = zone < 3, w = mgWidth(M, o, zone), dist = Math.abs(x - .5);
  const tq = dist <= w / 2 ? 2 : dist <= w ? 1 : 0;
  let p = base + (tq === 2 ? .14 : tq === 1 ? 0 : -.3) + [.1, -.02, .1, .05, -.1, .05][zone] + (o.out === 'pen' ? .04 : 0);
  const guess = dive === col; if (guess) p -= top && col !== 1 ? .12 : .28;
  const wide = tq === 0 && R() < .5; if (wide) p = 0;
  const kTxt = guess ? 'le gardien a deviné le côté' : 'le gardien part du mauvais côté';
  return { p: clamp(p, 0, .96), okTxt: `${tq === 2 ? 'Frappe parfaite' : 'Frappe correcte'} ${ZONES[zone]}, ${guess ? 'mais elle passe quand même !' : kTxt + ' : BUT !'}`, koTxt: wide ? `Frappe mal dosée, le ballon file ${top ? 'au-dessus' : 'à côté'}.` : `${tq === 2 ? 'Belle frappe' : 'Frappe'} ${ZONES[zone]}, ${guess ? kTxt + ' et sort le ballon.' : 'mais elle manque de précision.'}`, view: { kind: 'shot', zone, dive, tq, wide } };
}
function mgSave(M, o, dir, sDir, r) {
  const q = r > 1.05 ? 0 : clamp(1 - Math.abs(r - .78) / .3, 0, 1), base = momProb(M, o), wide = hasPerk('cat') ? .05 : 0;
  let p;
  if (o.out === 'gkpen') p = dir === sDir ? .22 + q * .58 + wide : .03;
  else p = dir === sDir ? base + .12 + (q - .5) * .32 + wide : dir === 1 ? base - .25 : base - .42;
  const side = ['à gauche', 'au centre', 'à droite'][sDir];
  return { p: clamp(p, .02, .95), okTxt: q >= .6 ? `Plongeon parfait ${side} : arrêt !` : 'Tu touches le ballon du bout des gants !', koTxt: dir !== sDir ? `Frappe ${side}, tu étais parti de l'autre côté.` : q < .3 ? 'Tu as plongé trop tard.' : 'Le ballon passe juste au-dessus de ta main.', view: { kind: 'gk', dir, sDir, q } };
}
function liveShoot(M, i, mg) {
  const sh = M.shoot; if (!sh) return;
  const base = 1 / (1 + Math.exp(-(M.myS - M.opS) / 8));
  let ok = null;
  if (sh.coach) { const win = R() < clamp(base + (i === 0 ? .03 : -.01) + rf(-.05, .05), .1, .9); M.pen = win ? M.side : M.other; M.feed.push({ min: '120', t: win ? `${M.my} remporte la séance !` : `${M.op} remporte la séance.`, k: win ? 'goal' : 'opp' }); sfx(M, win ? 'goal' : 'oppgoal'); M.shoot = null; M.done = true; return; }
  if (!sh.auto && i !== undefined) { const o = sh.o[i]; ok = R() < (mg && mg.p != null ? mg.p : momProb(M, o)); }
  const win = R() < clamp(base + (ok === null ? 0 : ok ? .2 : -.2), .05, .95);
  M.pen = win ? M.side : M.other;
  M.feed.push({ min: '120', t: (ok === null ? '' : ok ? (S.p.pos === 'GB' ? 'Tu arrêtes la tentative ! ' : 'Tu marques ton tir au but ! ') : (S.p.pos === 'GB' ? 'Tu es pris à contre-pied. ' : 'Tu rates ton tir au but… ')) + (win ? `${M.my} remporte la séance !` : `${M.op} remporte la séance.`), k: win ? 'goal' : 'opp' });
  sfx(M, win ? 'goal' : 'oppgoal');
  if (ok !== null) { if (ok) M.succ++; else M.fail++; }
  M.last = mg ? { ok, txt: ok ? mg.okTxt : mg.koTxt, mg: mg.view } : null;
  M.shoot = null; M.done = true;
}
function liveAnswerPress(M, i) { const q = M.press; if (!q) return; const [, e, res] = q.a[i]; pressApply(e); M.pressRes = res; M.press = null; }
function autoPick(M) { const ps = M.pending.o.map(o => momProb(M, o) * (o.out === 'goal' ? 1.4 : o.out === 'pass' ? .8 : 1) - (o.card || 0) * .6); return ps.indexOf(Math.max(...ps)); }
// Résultat direct : le moteur termine le match sans affichage
function liveAuto(M) {
  if (M.press) liveAnswerPress(M, 0);
  let guard = 0;
  while (!M.done && guard++ < 400) {
    if (M.pending) { if (M.coach) coachChoose(M, coachDefault(M)); else liveChoose(M, autoPick(M)); continue; }
    if (M.half) { liveHalf(M, M.half.o.length - 1); continue; }
    if (M.shoot) { liveShoot(M, M.shoot.auto ? undefined : 0); continue; }
    if (M.stopAt == null) liveSim(M, 1e9);
    liveAt(M, M.stopAt != null ? M.stopAt : M.E.time);
  }
  if (M.lastQ) { M.last = M.lastQ; M.lastQ = null; }
  M.say = []; M.vis = [];
}
function liveStats(M) {
  const E = M.E, sh = [0, 0], sot = [0, 0], cor = [0, 0], fo = [0, 0], yc = [0, 0], off = [0, 0];
  for (let n = 0; n < M.evi; n++) { const e = E.ev[n], k = e.k; if (e.type === 'goal' || e.type === 'save' || e.type === 'miss' || e.type === 'wood' || e.type === 'block') { if (e.type === 'save') { sh[1 - k]++; sot[1 - k]++; } else { sh[k]++; if (e.type === 'goal') sot[k]++; } } else if (e.type === 'corner') cor[k]++; else if (e.type === 'foul') fo[k]++; else if (e.type === 'yellow' || e.type === 'red') yc[k]++; else if (e.type === 'offside') off[k]++; }
  const p0 = E.T[0].st.pos, p1 = E.T[1].st.pos, pos = p0 + p1 ? Math.round(p0 / (p0 + p1) * 100) : 50, tm = M.clockAt ?? E.time, xg = [0, 0];
  for (const x of E.shots || []) if (x.t <= tm + 1e-6) xg[x.k] += x.xg;
  const pa = E.T.map(T => T.st.pa), pc = E.T.map(T => T.st.pa ? Math.round(T.st.pc / T.st.pa * 100) : 0);
  const o = { pos: [pos, 100 - pos], sh, sot, cor, fo, yc, off, pa, pc, xg: xg.map(x => Math.round(x * 100) / 100) };
  if (M.side === 'a') for (const k in o) o[k] = [o[k][1], o[k][0]];
  return o;
}
function liveFinal(M, prep) {
  if (M.fin) return M.fin;
  if (M.coach) return (M.fin = null);
  const E = M.E, me = mePlayerMe(E), st = me ? me.st : {};
  const on = M.onMin != null, played = prep.min > 0 && on ? Math.max(1, Math.min(90, M.offMin ?? 90) - M.onMin) : 0;
  const pst = { min: played, g: M.g, a: M.a, rt: 0, cs: false, card: M.sent ? 'R' : M.yellow ? 'J' : null, st: { sh: st.sh || 0, sot: st.sot || 0, pa: st.pa || 0, pc: st.pc || 0, tk: (st.tk || 0) + (st.int || 0), drs: st.drs || 0, sv: st.sv || 0, kp: st.kp || 0 } };
  const succE = Math.min(4, (st.tk + st.int) * .22 + st.drs * .2 + st.kp * .3 + st.sv * .35 + st.sot * .15), failE = Math.min(3, st.lost * .07 + (st.pa - st.pc) * .05 + (st.sh - st.sot) * .05);
  finishRating(pst, { side: prep.side, min: played, ovr: prep.ovr }, prep.h, prep.a, M.hg, M.ag, M.succ + (succE || 0), M.fail + (failE || 0));
  if (played > 0) pst.rt = Math.round(clamp(pst.rt - M.malus, 3, 10) * 10) / 10;
  return (M.fin = pst);
}
function liveRatings(M) {
  if (M.rts && M.done) return M.rts;
  const E = M.E, gf = E.goals, res = [];
  for (let k = 0; k < 2; k++) {
    const T = E.T[k], all = T.pl.concat(T.out || []).filter((p, i, a) => a.indexOf(p) === i && p !== E.meStore);
    for (const p of all) {
      const min = Math.max(0, Math.min(90, p.offM ?? 90) - (p.onM ?? 0)), s = p.st;
      if (min <= 0) continue;
      const gk = p.role === 'GK', def = isBack(p.role) || p.role === 'DM', ga = gf[1 - k];
      let r = 6.1 + s.g * 1 + s.as * .6 + s.kp * .12 + s.sot * .1 + s.drs * .07 + (s.tk + s.int) * .06 + s.sv * .3 - s.lost * .03 - (s.pa - s.pc) * .02 - (s.sh - s.sot) * .04 + (gf[k] > ga ? .35 : gf[k] < ga ? -.3 : 0);
      if (gk) r += ga === 0 ? .7 : -.25 * ga; else if (def) r += ga === 0 ? .35 : -.1 * ga;
      if (p.rc) r -= 1.2; else if (p.yc) r -= .15;
      r += ((hueOf(p.n) % 7) - 3) * .03;
      if (min < 30) r = 6 + (r - 6) * .6;
      res.push({ k, n: p.n, num: p.num, role: p.role, me: !!p.me, min, rt: Math.round(clamp(r, 3, 10) * 10) / 10, g: s.g, as: s.as, yc: p.yc, rc: p.rc });
    }
  }
  if (M.fin) { const r = res.find(x => x.me); if (r && M.fin.rt) r.rt = M.fin.rt; }
  const best = res.filter(x => x.min >= 30).sort((a, b) => b.rt - a.rt)[0]; if (best) best.motm = true;
  if (M.done) M.rts = res;
  return res;
}
function liveCredit(M, prep) {
  const my = M.side === 'h' ? prep.h : prep.a, op = M.side === 'h' ? prep.a : prep.h;
  for (const t of [prep.h, prep.a]) for (const s of t.stars || []) s.ap++;
  for (const e of M.E.ev) if (e.type === 'goal' && !e.annul) { const t = e.k === 0 ? my : op, sc = (t.stars || []).find(s => s.n === e.n), as = e.as ? (t.stars || []).find(s => s.n === e.as) : null; if (sc) sc.g++; if (as) as.as++; }
}
function liveEnd() {
  const L = S.live, M = L.M, prep = L.prep;
  if (!M.done) liveAuto(M);
  const pst = liveFinal(M, prep);
  const r = { hg: M.hg, ag: M.ag, ev: M.ev.slice().sort((a, b) => a.min - b.min), pen: M.pen, p: pst };
  liveCredit(M, prep);
  if (prep.agg) resolveAgg(prep, r);
  prep.live = true;
  afterMatch(L.job, prep, r);
  if (M.injOut) injure(S.dayLog, 'en match');
  if (M.rested) S.p.energy = clamp(S.p.energy + 6, 0, 100);
  S.jobi++; S.live = null;
  return r;
}

// ---------- Match de l'entraîneur ----------
function coachDecision(M, at) {
  const mine = M.side === 'h' ? M.hg : M.ag, th = M.side === 'h' ? M.ag : M.hg;
  if (at === 0) return { k: 'tac', q: 'Avant le coup d\'envoi : quel plan de jeu ?', o: Object.keys(TACTICS).map(v => ({ v, t: TACTICS[v][0], d: TACTICS[v][1] })) };
  if (at === 45) return { k: 'half', q: `Mi-temps, ${M.hg}-${M.ag}. Ton discours dans le vestiaire ?`, o: [{ v: 'calm', t: 'Rester calme et précis', d: 'Défense un peu plus concentrée.' }, { v: 'fire', t: 'Hausser le ton', d: mine < th ? 'Réveille l\'équipe quand elle est menée.' : 'Risqué quand tout va bien.' }, { v: 'praise', t: 'Encourager le groupe', d: 'Idéal quand on mène.' }, { v: 'switch', t: M.tac === 'off' ? 'Passer en équilibré' : 'Passer en offensif', d: 'Changer de plan de jeu.' }] };
  return { k: 'sub', q: `70e minute, ${M.hg}-${M.ag}. Tes changements ?`, o: [{ v: 'att', t: 'Faire entrer un attaquant', d: 'Plus de buts, plus de risques.' }, { v: 'def', t: 'Renforcer la défense', d: 'On verrouille le score.' }, { v: 'fresh', t: 'Sang neuf poste pour poste', d: 'Des jambes fraîches.' }, { v: 'keep', t: 'Ne rien changer', d: 'L\'équipe tourne bien.' }] };
}
function coachDefault(M) {
  const d = M.pending, mine = M.side === 'h' ? M.hg : M.ag, th = M.side === 'h' ? M.ag : M.hg;
  const idx = v => Math.max(0, d.o.findIndex(o => o.v === v));
  if (d.k === 'tac') return idx(S.mgr.tactic || 'bal');
  if (d.k === 'half') return idx(mine < th ? 'fire' : mine > th ? 'praise' : 'calm');
  return idx(mine < th ? 'att' : mine > th ? 'def' : 'fresh');
}
function setTac(M, v) { const T = M.E.T[0]; T.tac = Object.assign({}, TACP[v] || TACP.bal); T.tacK = v; M.tac = v; }
function coachSubs(M, n, pref) {
  const E = M.E, T = E.T[0]; let done = 0;
  const cand = T.pl.map((p, i) => [p, i]).filter(([p]) => p.on && !p.rc && p.role !== 'GK' && (!pref || pref.includes(p.role))).sort((a, b) => a[0].sta - b[0].sta);
  for (const [, i] of cand) { if (done >= n) break; if (E.ball.own && E.ball.own[0] === 0 && E.ball.own[1] === i) continue; if (meSubOut(E, 0, i, 'choix du coach')) done++; }
  return done;
}
function coachChoose(M, i) {
  const d = M.pending; if (!d) return; const o = d.o[i], E = M.E, mine = M.side === 'h' ? M.hg : M.ag, th = M.side === 'h' ? M.ag : M.hg, T = E.T[0];
  const bump = v => { for (const p of T.pl) for (const k of AKEYS) p.a[k] += v; };
  let txt = '';
  if (d.k === 'tac') { setTac(M, o.v); txt = `Plan de jeu : ${TACTICS[o.v][0].toLowerCase()}.`; }
  else if (d.k === 'half') {
    if (o.v === 'fire') { bump(mine < th ? 1.5 : -.5); if (mine >= th) S.mateRel = clamp(S.mateRel - 2, 0, 100); txt = 'Tu hausses le ton. Les joueurs baissent les yeux.'; }
    else if (o.v === 'praise') { bump(mine > th ? .6 : 0); S.mateRel = clamp(S.mateRel + 2, 0, 100); txt = 'Tu félicites le groupe. Ambiance positive.'; }
    else if (o.v === 'switch') { const nv = M.tac === 'off' ? 'bal' : 'off'; setTac(M, nv); txt = `Changement de plan : ${TACTICS[nv][0].toLowerCase()}.`; }
    else { for (const p of T.pl) p.a.def += 1; txt = 'Discours calme et précis.'; }
  } else {
    if (o.v === 'att') { coachSubs(M, 2, ['DM', 'CM', 'LB', 'RB']); setTac(M, 'off'); txt = 'Tu lances des attaquants supplémentaires.'; }
    else if (o.v === 'def') { coachSubs(M, 1, ['LW', 'RW', 'ST']); setTac(M, 'def'); txt = 'Tu fais entrer un défenseur et le bloc recule.'; }
    else if (o.v === 'fresh') { const n = coachSubs(M, 3); txt = n ? `${n} changement${n > 1 ? 's' : ''} poste pour poste.` : 'Plus de changement possible.'; }
    else txt = 'Tu ne changes rien.';
  }
  M.feed.push({ min: M.min, t: txt, k: 'me' });
  M.pending = null;
}
// Match d'entraîneur non regardé : simulation rapide
function coachQuick(prep) {
  const side = prep.side, my = side === 'h' ? prep.h : prep.a, op = side === 'h' ? prep.a : prep.h;
  const hs = prep.h.s + rf(-1.5, 1.5), as = prep.a.s + rf(-1.5, 1.5), ha = prep.neutral ? 0 : .22, F = S.mgr.focus, T = TACTICS[S.mgr.tactic || 'bal'];
  let hx = clamp(1.32 + (hs - as) * .068 + ha, .12, 4.4), ax = clamp(1.12 + (as - hs) * .068, .12, 4.4);
  let myL = side === 'h' ? hx : ax, opL = side === 'h' ? ax : hx;
  myL *= (F === 'att' ? 1.06 : F === 'rest' ? .97 : F === 'tact' ? 1.02 : 1) * (1 + (S.mateRel - 50) / 400) * (S.mgr.tactic === 'counter' ? (op.s > my.s ? 1.12 : .95) : T[2]);
  opL *= (F === 'def' ? .94 : F === 'tact' ? .98 : 1) * T[3];
  for (const t of [prep.h, prep.a]) for (const s of t.stars || []) s.ap++;
  const ng = poisson(myL), na = poisson(opL), ev = [];
  const scorer = list => { const c = list.map(s => ({ s, w: GOALW[s.pos] * Math.max(.2, 1 + (s.o - 70) / 14) })); const sw = c.reduce((x, y) => x + y.w, 0); c.push({ s: null, w: Math.max(6, 16 - sw * .6) }); const p = wpick(c, x => x.w).s; if (p) p.g++; return p ? p.n : null; };
  for (let i = 0; i < ng; i++) ev.push({ min: ri(1, 90), side, sc: scorer(my.stars || []) || squadName(), as: null });
  for (let i = 0; i < na; i++) ev.push({ min: ri(1, 90), side: side === 'h' ? 'a' : 'h', sc: scorer(op.stars || []), as: null });
  const hg = side === 'h' ? ng : na, ag = side === 'h' ? na : ng;
  let pen = null; if (prep.ko && !prep.leg1 && hg === ag) pen = R() < 1 / (1 + Math.exp(-(prep.h.s - prep.a.s) / 8)) ? 'h' : 'a';
  return { hg, ag, ev: ev.sort((a, b) => a.min - b.min), pen, p: null };
}
