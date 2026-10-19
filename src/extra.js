// ===================== OBJECTIFS, DÉFIS, TALENTS, VESTIAIRE, RIVAL, COURBES, ENTRAÎNEUR =====================
function logRes(m) { const mine = m.side === 'h' ? m.hg : m.ag, th = m.side === 'h' ? m.ag : m.hg; return mine > th || (mine === th && m.pen === m.side) ? 'V' : mine < th || (mine === th && m.pen) ? 'D' : 'N'; }
function tblLid(id) { const c = club(id); if (S.W.leagues[c.lid].table[id]) return c.lid; for (const k in S.W.leagues) if (S.W.leagues[k].table[id]) return k; return c.lid; }
const clubPos = id => leagueOrder(tblLid(id)).indexOf(id) + 1;
const clubRow = id => S.W.leagues[tblLid(id)].table[id] || { pts: 0, f: [] };
const hasPerk = id => !!(S && S.perks && S.perks[id]);
const proLike = () => S.club.kind === 'pro' || S.club.kind === 'coach';
const isCoach = () => S && S.club && S.club.kind === 'coach';
function ensureV3() {
  if (!S) return;
  S.perks = S.perks || {};
  S.cnt = Object.assign({ g: 0, a: 0, fk: 0, pen: 0, stop: 0, save: 0, drib: 0, m: 0, big: 0 }, S.cnt || {});
  S.curve = S.curve || [];
  S.mates2 = S.mates2 || [];
  S.toasts = S.toasts || [];
  S.yellows = S.yellows || 0; S.susp = S.susp || 0;
  S.settings = Object.assign({ live: 'all', speed: 1, mg: true, interrupt: 'all' }, S.settings || {});
  if (!S.rival) newRival();
  if (!S.mates2.length) buildMates();
  if (!S.obj) genObjectives();
  if (S.chal === undefined) genChallenge();
  if (S.wkMinE === undefined) S.wkMinE = S.p.energy;
}

// ---------- Objectifs de saison ----------
function genObjectives() {
  const k = S.club.kind, pos = S.p.pos, role = S.club.role || '', list = [];
  if (k === 'coach') {
    const c = myClub(); if (!c) { S.obj = { season: S.season, club: null, list: [] }; return; }
    list.push({ id: 'rank', t: 'Objectif du président', target: expectedRank(c), rank: true });
    list.push({ id: 'pts', t: 'Points en championnat', target: Math.round((S.W.leagues[c.lid].rounds.length) * (c.s >= 82 ? 2 : c.s >= 74 ? 1.55 : 1.3)) });
  } else if (k === 'pro') {
    const r = /Star/.test(role) ? 1.35 : /Titulaire/.test(role) ? 1 : /Rotation/.test(role) ? .55 : .3;
    const gBase = { BU: 16, AIL: 9, MOC: 8, MC: 4, MDC: 2, DL: 2, DC: 2, GB: 0 }[pos];
    if (pos === 'GB') list.push({ id: 'cs', t: 'Matchs sans encaisser de but', target: Math.max(4, Math.round(12 * r)) });
    else if (gBase >= 4) list.push({ id: 'g', t: 'Buts sur la saison', target: Math.max(2, Math.round(gBase * r)) });
    else list.push({ id: 'ga', t: 'Buts + passes décisives', target: Math.max(2, Math.round(5 * r)) });
    list.push({ id: 'apps', t: 'Matchs joués', target: Math.max(8, Math.round(32 * Math.min(1, r))) });
    list.push({ id: 'avg', t: 'Note moyenne', target: /Star|Titulaire/.test(role) ? 7 : 6.7, min: 8 });
    list.push({ id: 'rank', t: 'Classement du club', target: expectedRank(myClub()), rank: true });
  } else if (k === 'academy') {
    list.push({ id: 'apps', t: 'Matchs avec les jeunes', target: 16 }, { id: 'avg', t: 'Note moyenne', target: 6.9, min: 6 });
    if (S.p.age >= 17) list.push({ id: 'pro', t: 'Signer ton premier contrat pro', target: 1 });
  } else if (!S.club.free) {
    list.push({ id: 'avg', t: 'Note moyenne', target: 6.8, min: 6 });
    if (GOALW[pos] >= 2) list.push({ id: 'g', t: 'Buts en ' + youthCat(), target: 8 });
    else list.push({ id: 'apps', t: 'Matchs joués', target: 18 });
    if (S.p.age >= 15) list.push({ id: 'scout', t: 'Être repéré ou réussir un essai', target: 1 });
  }
  S.obj = { season: S.season, club: S.club.id, list: list.map(o => Object.assign({ done: false }, o)) };
}
function expectedRank(c) { if (!c) return 1; const ord = S.W.leagues[c.lid].members.slice().sort((a, b) => club(b).s - club(a).s); return Math.max(1, ord.indexOf(c.id) + 1); }
function objProgress(o) {
  const ss = S.ss, c = myClub();
  switch (o.id) {
    case 'g': return ss.g; case 'ga': return ss.g + ss.a; case 'cs': return ss.cs; case 'apps': return ss.apps;
    case 'avg': return ss.apps ? ss.rs / ss.apps : 0;
    case 'rank': return c ? clubPos(c.id) : 99;
    case 'pts': return c ? clubRow(c.id).pts : 0;
    case 'pro': return S.club.kind === 'pro' ? 1 : 0;
    case 'scout': return S.flags.scoutedSeason === S.season || S.club.kind !== 'amateur' ? 1 : 0;
  }
  return 0;
}
function objMet(o) { const v = objProgress(o); if (o.rank) return v <= o.target; if (o.id === 'avg') return S.ss.apps >= (o.min || 5) && v >= o.target; return v >= o.target; }
function objPct(o) { const v = objProgress(o); if (o.rank) return clamp(o.target / Math.max(1, v), 0, 1); if (o.id === 'avg') return clamp((v - 5.5) / (o.target - 5.5), 0, 1); return clamp(v / o.target, 0, 1); }
function objTxt(o) { const v = objProgress(o); if (o.rank) return v + 'e / objectif ' + o.target + 'e'; if (o.id === 'avg') return (v ? dec1(v) : '–') + ' / ' + dec1(o.target); return Math.round(v) + ' / ' + o.target; }
const dec1 = v => v.toFixed(1).replace('.', ',');
function evalObjectives() {
  if (!S.obj || S.obj.season !== S.season || !S.obj.list.length || isCoach()) return;
  let ok = 0;
  const lines = S.obj.list.map(o => { const m = objMet(o); o.done = m; if (m) ok++; return `<div class="mline"><span>${o.t}</span><b class="${m ? 'ok' : 'bad'}">${m ? 'Réussi' : 'Raté'} · ${objTxt(o)}</b></div>`; }).join('');
  const n = S.obj.list.length, ratio = ok / n;
  let rw = '';
  if (S.club.kind === 'pro') {
    const b = Math.round(monthly(S.club.wage) * .3 * ok); if (b) { earn(b, 'Primes d\'objectifs'); rw += `Primes : <b>${eur(b)}</b>. `; }
    const cr = ratio >= .75 ? 8 : ratio >= .5 ? 2 : -8; S.coach.rel = clamp(S.coach.rel + cr, 0, 100); rw += cr > 0 ? 'Le coach est satisfait.' : 'Le coach attendait plus de toi : ta place est menacée.';
  } else { S.fam.dad.rel += ok * 2; S.fam.mom.rel += ok * 2; rw += ratio >= .5 ? 'Tes parents sont fiers de ta saison.' : 'Saison compliquée, mais tu apprends.'; }
  S.p.moral = clamp(S.p.moral + (ratio >= .5 ? 6 : -5), 0, 100); S.p.rep = clamp(S.p.rep + ok * .4, 0, 100);
  queueEvent({ title: 'Bilan des objectifs', text: lines + `<p>${ok} objectif${ok > 1 ? 's' : ''} sur ${n}. ${rw}</p>`, ch: [{ t: 'Continuer', f: () => null }] });
}

// ---------- Défi de la semaine ----------
const wkLogs = () => S.weekLog.concat(S.dayLog && !S.weekLog.includes(S.dayLog) ? [S.dayLog] : []);
const wkMatches = () => wkLogs().flatMap(l => l.matches).filter(m => m.p && m.p.min > 0);
const wkActs = k => wkLogs().filter(l => l.act && l.act.k === k && !l.matches.length).length;
const wkHasMatch = () => !!(S.wk && S.wk.fx.length);
const CHAL = [
  { id: 'train3', t: 'Faire au moins 3 entraînements', target: 3, ok: () => !isCoach(), prog: () => wkActs('train') },
  { id: 'goal', t: 'Marquer au moins un but', target: 1, ok: () => wkHasMatch() && GOALW[S.p.pos] >= 1 && !isCoach(), prog: () => wkMatches().reduce((x, m) => x + m.p.g, 0) },
  { id: 'assist', t: 'Délivrer une passe décisive', target: 1, ok: () => wkHasMatch() && ASSW[S.p.pos] >= 1.4 && !isCoach(), prog: () => wkMatches().reduce((x, m) => x + m.p.a, 0) },
  { id: 'rt', t: 'Obtenir une note de 7,5 ou plus', target: 1, ok: () => wkHasMatch() && !isCoach(), prog: () => wkMatches().some(m => m.p.rt >= 7.5) ? 1 : 0 },
  { id: 'cs', t: 'Ne pas encaisser de but', target: 1, ok: () => wkHasMatch() && (['GB', 'DC'].includes(S.p.pos) || isCoach()), prog: () => wkLogs().flatMap(l => l.matches).some(m => (m.side === 'h' ? m.ag : m.hg) === 0) ? 1 : 0, coach: true },
  { id: 'win', t: 'Gagner un match', target: 1, ok: () => wkHasMatch(), prog: () => wkLogs().flatMap(l => l.matches).filter(m => logRes(m) === 'V').length, coach: true },
  { id: 'win2', t: 'Gagner deux matchs', target: 2, ok: () => S.wk && S.wk.fx.length >= 2 && isCoach(), prog: () => wkLogs().flatMap(l => l.matches).filter(m => logRes(m) === 'V').length, coach: true },
  { id: 'family', t: 'Passer une journée en famille', target: 1, ok: () => !isCoach(), prog: () => wkActs('family') },
  { id: 'study', t: 'Réviser au moins 2 fois', target: 2, ok: () => S.p.age <= 19 && !S.school.done && S.p.age >= 15, prog: () => wkActs('study') },
  { id: 'drive', t: 'Prendre 2 leçons de conduite', target: 2, ok: () => S.p.age >= 17 && !S.permis.ok, prog: () => wkActs('drive') },
  { id: 'energy', t: 'Ne jamais descendre sous 35 d\'énergie', target: 1, ok: () => !isCoach(), prog: () => (S.wkMinE ?? 100) >= 35 ? 1 : 0, end: true },
  { id: 'post', t: 'Publier sur les réseaux sociaux', target: 1, ok: () => true, prog: () => S.postWeek === weekKey() ? 1 : 0, coach: true },
  { id: 'date', t: 'Avoir un rendez-vous amoureux', target: 1, ok: () => !!S.love && !isCoach(), prog: () => wkActs('date') },
  { id: 'friends', t: 'Sortir avec tes amis', target: 1, ok: () => !isCoach(), prog: () => wkActs('friends') },
];
const chalBy = id => CHAL.find(c => c.id === id);
function genChallenge() {
  const pool = CHAL.filter(c => c.ok() && (!isCoach() || c.coach));
  if (!pool.length) { S.chal = null; return; }
  const c = pick(pool), keyA = ATTR.filter(k => POSW[S.p.pos][k] >= .15);
  const rws = isCoach() ? [{ k: 'board', v: 4 }, { k: 'mates', v: 5 }, { k: 'foll', v: .03 }] : [{ k: 'attr', v: .45, a: pick(keyA) }, { k: 'attr', v: .45, a: pick(keyA) }, { k: 'money', v: S.club.kind === 'pro' ? Math.max(500, Math.round(monthly(S.club.wage) * .06)) : 40 }, { k: 'moral', v: 8 }, { k: 'foll', v: .04 }];
  S.chal = { id: c.id, t: c.t, target: c.target, rw: pick(rws), done: false, w: weekKey() };
}
function rwTxt(rw) { return rw.k === 'attr' ? `+${dec1(rw.v)} en ${ATTR_N[rw.a]}` : rw.k === 'money' ? `+${eur(rw.v)}` : rw.k === 'moral' ? `+${rw.v} de moral` : rw.k === 'foll' ? 'Abonnés +' + Math.round(rw.v * 100) + ' %' : rw.k === 'board' ? `Confiance du président +${rw.v}` : `Vestiaire +${rw.v}`; }
function chalProg() { const c = S.chal && chalBy(S.chal.id); return c ? Math.min(S.chal.target, c.prog()) : 0; }
function checkChallenge(final) {
  const ch = S.chal; if (!ch || ch.done) return;
  const c = chalBy(ch.id); if (!c || (c.end && !final)) return;
  if (c.prog() >= ch.target) {
    ch.done = true; const rw = ch.rw, p = S.p;
    if (rw.k === 'attr') p.at[rw.a] = Math.min(p.cap[rw.a] + .4, p.at[rw.a] + rw.v);
    else if (rw.k === 'money') earn(rw.v, 'Défis de la semaine');
    else if (rw.k === 'moral') p.moral = clamp(p.moral + rw.v, 0, 100);
    else if (rw.k === 'foll') p.followers = Math.round(p.followers * (1 + rw.v) + 50);
    else if (rw.k === 'board' && S.mgr) S.mgr.board = clamp(S.mgr.board + rw.v, 0, 100);
    else if (rw.k === 'mates') S.mateRel = clamp(S.mateRel + rw.v, 0, 100);
    S.toasts.push('Défi réussi : ' + rwTxt(rw));
    S.stats.chal = (S.stats.chal || 0) + 1;
  }
}

// ---------- Talents ----------
const PERKS = [
  { id: 'fin', n: 'Finisseur', d: '+5 % sur tes frappes, zone verte plus large au tir.', need: '30 buts en match', pr: () => S.cnt.g / 30, no: ['GB'] },
  { id: 'cf', n: 'Spécialiste des coups francs', d: 'Plus de coups francs à tirer, +8 % de réussite.', need: '4 coups francs marqués ou Technique 85', pr: () => Math.max(S.cnt.fk / 4, S.p.at.TEC / 85), no: ['GB', 'DC'] },
  { id: 'pen', n: 'Sang-froid', d: '+6 % sur les penaltys, tu les tires plus souvent.', need: '5 penaltys marqués ou Mental 85', pr: () => Math.max(S.cnt.pen / 5, S.p.at.MEN / 85), no: ['GB'] },
  { id: 'pass', n: 'Passeur décisif', d: '+5 % sur tes passes décisives.', need: '25 passes décisives', pr: () => S.cnt.a / 25, no: ['GB'] },
  { id: 'drib', n: 'Dribbleur', d: '+5 % sur tes dribbles.', need: '20 dribbles réussis ou Dribble 86', pr: () => Math.max(S.cnt.drib / 20, S.p.at.DRI / 86), no: ['GB', 'DC'] },
  { id: 'wall', n: 'Mur', d: '+6 % sur tacles, duels et interceptions.', need: '40 interventions réussies', pr: () => S.cnt.stop / 40, no: ['GB'] },
  { id: 'cat', n: 'Chat', d: '+6 % sur tes arrêts, timing plus large.', need: '40 arrêts', pr: () => S.cnt.save / 40, only: ['GB'] },
  { id: 'rocket', n: 'Fusée', d: '+5 % sur les actions de vitesse.', need: 'Vitesse 88', pr: () => S.p.at.VIT / 88, no: ['GB'] },
  { id: 'iron', n: 'Increvable', d: 'Fatigue en match −30 %, moins de blessures.', need: 'Endurance 84 et 100 matchs', pr: () => Math.min(S.p.at.END / 84, S.cnt.m / 100) },
  { id: 'big', n: 'Homme des grands matchs', d: '+4 % dans les grands matchs.', need: '8 notes de 7,5 ou plus en grand match', pr: () => S.cnt.big / 8 },
  { id: 'lead', n: 'Leader', d: 'Ton équipe joue mieux (+1 de niveau), vestiaire soudé.', need: 'Capitaine ou 150 matchs pro', pr: () => S.club.captain ? 1 : S.stats.proApps / 150 },
];
const perkFor = P_ => (!P_.only || P_.only.includes(S.p.pos)) && !(P_.no || []).includes(S.p.pos);
function checkPerks() {
  if (isCoach()) return;
  for (const P_ of PERKS) {
    if (S.perks[P_.id] || !perkFor(P_)) continue;
    let ok = false; try { ok = P_.pr() >= 1; } catch (e) { }
    if (!ok) continue;
    S.perks[P_.id] = dateStr();
    inbox('info', 'Nouveau talent : ' + P_.n, P_.d);
    queueEvent({ title: 'Nouveau talent', kind: 'perk', text: `<p class="perkbig">${P_.n}</p><p>${P_.d}</p><p class="note">Débloqué grâce à : ${P_.need.toLowerCase()}.</p>`, ch: [{ t: 'Génial', f: () => null }] });
  }
}
function perkMod(M, o) {
  let d = 0;
  if (hasPerk('fin') && o.out === 'goal' && ['TIR', 'PHY'].includes(o.at)) d += .05;
  if (hasPerk('cf') && o.mt === 'fk' && o.out === 'goal') d += .08;
  if (hasPerk('pen') && o.out === 'pen') d += .06;
  if (hasPerk('pass') && o.out === 'assist') d += .05;
  if (hasPerk('drib') && o.at === 'DRI') d += .05;
  if (hasPerk('wall') && o.out === 'stop') d += .06;
  if (hasPerk('cat') && (o.out === 'save' || o.out === 'gkpen')) d += .06;
  if (hasPerk('rocket') && o.at === 'VIT') d += .05;
  if (hasPerk('big') && M.big) d += .04;
  return d;
}

// ---------- Vestiaire : mentor, rival, pote ----------
function buildMates() {
  const c = myClub(); S.mates2 = [];
  if (isCoach()) return;
  const nat = c ? (LEAGUE_NAT[c.cc] || S.p.nat) : S.p.nat;
  if (!c) { const nm = []; while (nm.length < 3) { const x = genName(nat); if (!nm.some(y => y.split(' ')[0] === x.split(' ')[0])) nm.push(x); } S.mates2 = [{ n: nm[0], role: 'mentor', rel: 55, pos: pick(['DC', 'MC', 'MDC']), age: S.p.age + ri(3, 6) }, { n: nm[1], role: 'rival', rel: 45, pos: S.p.pos, age: S.p.age }, { n: nm[2], role: 'pote', rel: 62, pos: pick(Object.keys(POS_N)), age: S.p.age }]; return; }
  const sq = S.squad || [], used = new Set();
  const vet = sq.filter(x => x.star && x.ref && x.ref.a >= 28).sort((a, b) => b.ref.a - a.ref.a)[0];
  const mentor = vet ? { n: vet.n, pos: vet.pos, age: vet.ref.a } : { n: genName(nat), pos: pick(['DC', 'MC', 'GB']), age: ri(31, 35) };
  used.add(mentor.n);
  const rv = sq.filter(x => GROUP[x.pos] === GROUP[S.p.pos] && !used.has(x.n)).sort((a, b) => Math.abs(a.o - OVR()) - Math.abs(b.o - OVR()))[0];
  const rival = rv ? { n: rv.n, pos: rv.pos, age: rv.ref ? rv.ref.a : S.p.age + ri(-1, 3) } : { n: genName(nat), pos: S.p.pos, age: S.p.age + 2 };
  used.add(rival.n);
  const pt = sq.filter(x => !used.has(x.n) && !x.star); const pote = pt.length ? { n: pick(pt).n, pos: pick(pt).pos, age: S.p.age + ri(-1, 2) } : { n: genName(nat), pos: pick(Object.keys(POS_N)), age: S.p.age };
  S.mates2 = [Object.assign({ role: 'mentor', rel: 55 }, mentor), Object.assign({ role: 'rival', rel: 42 }, rival), Object.assign({ role: 'pote', rel: 60 }, pote)];
  S.flags.bizut = S.club.kind === 'pro' && S.flags.bizutDone !== S.club.id ? absDay() + 21 : 0;
}
const mate = role => (S.mates2 || []).find(m => m.role === role);
const ROLE_N = { mentor: 'Mentor', rival: 'Rival au poste', pote: 'Pote' };
function mateAction(role, act) {
  const m = mate(role); if (!m) return '';
  S.mateAct = S.mateAct || {};
  const key = role + weekKey(); if (S.mateAct[key]) return 'Déjà fait cette semaine.';
  S.mateAct[key] = true;
  if (role === 'pote') { const c = Math.round(clamp(S.p.money * .003, 20, 2500)); spend(c, 'Sorties'); m.rel = clamp(m.rel + 8, 0, 100); S.p.moral = clamp(S.p.moral + 4, 0, 100); S.p.energy -= 5; S.mateRel = clamp(S.mateRel + 1, 0, 100); return `Soirée avec ${m.n.split(' ')[0]} : vous rigolez jusqu'à tard.`; }
  if (role === 'mentor') { const k = ATTR.filter(a => POSW[S.p.pos][a] >= .15); trainGain({ [pick(k)]: .5, MEN: .4 }, 1); m.rel = clamp(m.rel + 3, 0, 100); return `${m.n.split(' ')[0]} reste après la séance pour te montrer ses secrets. Tu progresses.`; }
  if (act === 'hand') { if (R() < .55) { m.rel = clamp(m.rel + 12, 0, 100); return `${m.n.split(' ')[0]} accepte ta main tendue. La concurrence reste saine.`; } m.rel = clamp(m.rel - 3, 0, 100); return `${m.n.split(' ')[0]} t'ignore. L'ambiance reste tendue.`; }
  m.rel = clamp(m.rel - 12, 0, 100); S.p.boost = Math.max(S.p.boost || 0, .15); S.mateRel = clamp(S.mateRel - 2, 0, 100); return `Tu le chambres devant tout le monde. Ça te motive pour le prochain match… lui aussi.`;
}
function matesEvents() {
  if (isCoach() || !S.mates2.length) return;
  const M_ = mate('mentor'), RV = mate('rival'), PT = mate('pote');
  if (S.flags.bizut && absDay() <= S.flags.bizut && S.flags.bizutDone !== S.club.id && R() < .5) {
    S.flags.bizutDone = S.club.id;
    queueEvent({ title: 'Le bizutage', text: `Tradition à ${S.club.n} : chaque nouveau doit chanter debout sur une chaise devant tout le groupe.`, ch: [
      { t: 'Chanter à pleins poumons', f: () => { S.mateRel = clamp(S.mateRel + 8, 0, 100); if (PT) PT.rel += 5; return 'Fausse note magistrale, fou rire général. Tu fais partie du groupe.'; } },
      { t: 'Refuser poliment', f: () => { S.mateRel = clamp(S.mateRel - 6, 0, 100); return 'Certains trouvent que tu te prends trop au sérieux.'; } }] });
    return;
  }
  if (R() > .12) return;
  const r = R();
  if (r < .34 && M_) queueEvent({ title: 'Ton mentor', text: `${M_.n} te prend à part : « Tu veux un conseil ? Arrive une heure avant tout le monde, et regarde comment je travaille. »`, ch: [
    { t: 'Suivre son conseil', f: () => { trainGain({ MEN: .6 }, 1); M_.rel = clamp(M_.rel + 6, 0, 100); S.p.energy -= 4; return 'Tu gagnes en maturité. Il apprécie ton sérieux.'; } },
    { t: 'Je gère, merci', f: () => { M_.rel = clamp(M_.rel - 5, 0, 100); return 'Il hausse les épaules.'; } }] });
  else if (r < .67 && RV) queueEvent({ title: 'Concurrence', text: `${RV.n}, ton concurrent direct, affirme dans la presse qu'il mérite ta place.`, ch: [
    { t: 'Répondre sur le terrain', f: () => { S.p.boost = Math.max(S.p.boost || 0, .12); RV.rel = clamp(RV.rel - 3, 0, 100); return 'Tu ne dis rien. Tu t\'entraînes deux fois plus.'; } },
    { t: 'Répondre dans la presse', f: () => { RV.rel = clamp(RV.rel - 10, 0, 100); S.p.followers += Math.round(fameTarget() * .01) + 50; S.coach.rel = clamp(S.coach.rel - 3, 0, 100); return 'Petit buzz… le coach n\'aime pas ça.'; } },
    { t: 'Lui parler en face', f: () => { if (R() < .5) { RV.rel = clamp(RV.rel + 10, 0, 100); return 'Discussion franche. Vous vous respectez.'; } RV.rel = clamp(RV.rel - 5, 0, 100); return 'Le ton monte. Les autres doivent vous séparer.'; } }] });
  else if (PT) queueEvent({ title: 'Ton pote du vestiaire', text: `${PT.n} t'invite à une soirée jeux vidéo chez lui la veille d'un jour de repos.`, ch: [
    { t: 'Y aller', f: () => { PT.rel = clamp(PT.rel + 8, 0, 100); S.p.moral = clamp(S.p.moral + 5, 0, 100); S.p.energy -= 4; return 'Défaite cuisante à FIFA, mais quelle soirée.'; } },
    { t: 'Rester te reposer', f: () => { PT.rel = clamp(PT.rel - 3, 0, 100); return 'Il comprend, la prochaine fois.'; } }] });
}

// ---------- Rival personnel ----------
function newRival() {
  const nats = Object.keys(NATIONS).filter(k => k !== S.p.nat), nat = pick(nats);
  const pos = S.p.pos === 'GB' || R() < .6 ? S.p.pos : pick(Object.keys(POS_N).filter(p => p !== 'GB'));
  S.rival = { n: genName(nat), nat, pos, age: S.p.age, bw: ri(1, 52), o: clamp(OVR() + ri(-2, 3), 25, 75), pot: clamp(S.p.pot + ri(-3, 4), 76, 97), cid: null, club: amateurName(nat, pick(NATIONS[nat].cities)), g: 0, a: 0, apps: 0, caps: 0, tr: [], bdo: 0, best: 0, hist: [], h2h: { w: 0, d: 0, l: 0 }, done: false };
}
const rivalStar = () => S.rival && S.rival.cid ? S.W.stars.find(s => s.rival) : null;
const rivalClubN = () => S.rival.cid ? club(S.rival.cid).n : S.rival.club;
const rivalHandle = () => '@' + S.rival.n.toLowerCase().replace(/[^a-z0-9]/g, '');
function rivalWeek() {
  const R_ = S.rival; if (!R_ || R_.done) return;
  const a = R_.age;
  if (a <= 27) { const rate = a <= 17 ? .21 : a <= 21 ? .27 : a <= 24 ? .2 : .08; R_.o += (R_.pot - R_.o) * rate / 52 * rf(.5, 1.5); }
  else if (a >= 31) R_.o -= (a - 30) * .03 * rf(.5, 1.5);
  R_.o = clamp(R_.o, 25, 97);
  if (S.week === R_.bw) R_.age++;
  const st = rivalStar(); if (st) { st.o = Math.round(R_.o); st.a = R_.age; }
  if (!R_.cid && (R_.age >= 17 && R_.o >= 54 || R_.age >= 19 && R_.o >= 48)) {
    const pref = NAT_LEAGUE[R_.nat];
    const pool = Object.values(S.W.clubs).filter(c => c.s >= R_.o + 6 && c.s <= R_.o + 13);
    const c = pick(pool.filter(x => x.cc === pref).length ? pool.filter(x => x.cc === pref) : pool.length ? pool : Object.values(S.W.clubs).sort((x, y) => x.s - y.s).slice(0, 10));
    R_.cid = c.id;
    S.W.stars.push({ n: R_.n, pos: R_.pos, o: Math.round(R_.o), a: R_.age, cid: c.id, g: 0, as: 0, ap: 0, inj: 0, ls: { g: 0, as: 0, ap: 0 }, rival: true }); IDX = null;
    addNews('Ton rival', `${R_.n} signe son premier contrat pro à ${c.n}.`);
    feedPost(rivalHandle(), `Premier contrat pro à ${c.n} ✍️ ${handle()} on se retrouve en haut ?`);
  }
  if (INTL_WEEKS.includes(S.week) && S.day === 6 && R_.o >= NATIONS[R_.nat].thr - 1 && R() < .8) R_.caps += 2;
  if (R() < .035) { const ahead = R_.o > OVR() + 1; feedPost(rivalHandle(), ahead ? pick(['Toujours un temps d\'avance 😏', 'Le travail paie. Certains devraient s\'en inspirer.', 'Le niveau monte. Pas pour tout le monde.']) : pick(['Profite, ça ne va pas durer.', 'Je reviens plus fort. Note bien ça.', 'Une saison ne fait pas une carrière.'])); }
  if (R_.age >= 37 || (R_.age >= 34 && R_.o < 70)) { R_.done = true; S.W.stars = S.W.stars.filter(s => !s.rival); IDX = null; addNews('Ton rival', `${R_.n} prend sa retraite. Fin d'une longue rivalité.`); }
}
function rivalSummer() {
  const R_ = S.rival, st = rivalStar(); if (!R_ || !st || R_.done) return;
  const c = club(st.cid);
  if (R_.o > c.s + 2 && R() < .75) {
    const pool = Object.values(S.W.clubs).filter(x => x.id !== c.id && x.s >= R_.o - 1 && x.s <= R_.o + 5 && L_BY(x.lid).tier === 1);
    if (pool.length) { const t = pick(pool), fee = marketValue(Math.round(R_.o), R_.age); st.cid = t.id; R_.cid = t.id; IDX = null; addNews('Ton rival', `${R_.n} quitte ${c.n} pour ${t.n} (${eur(fee)}).`); feedPost(rivalHandle(), `Nouveau défi : ${t.n} 🔥`); }
  }
}
function rivalSeasonEnd(champs) {
  const R_ = S.rival, st = rivalStar(); if (!R_ || R_.done) return null;
  if (!st) return null;
  const row = { s: seasonLabel(S.season), c: club(st.cid).n, g: st.g, a: st.as, ap: st.ap, o: Math.round(R_.o) };
  R_.hist.push(row); R_.g += st.g; R_.a += st.as; R_.apps += st.ap;
  const cn = club(st.cid).n;
  for (const lid in champs) if (champs[lid] === cn) R_.tr.push(L_BY(lid).name + ' ' + seasonLabel(S.season));
  const U = S.W.cl.UEFA; if (U.winner === st.cid) R_.tr.push('Ligue des champions ' + seasonLabel(S.season));
  return row;
}

// ---------- Courbes ----------
function curveSample(label) {
  if (!S.curve) S.curve = [];
  S.curve.push({ t: label, y: S.season, ovr: isCoach() ? null : OVR(), val: isCoach() ? null : marketValue(OVR(), S.p.age), rov: S.rival && !S.rival.done ? Math.round(S.rival.o) : null, foll: S.p.followers, w: Math.round(wealth()) });
  if (S.curve.length > 700) S.curve.shift();
}

// ===================== CARRIÈRE D'ENTRAÎNEUR =====================
const TACTICS = { off: ['Offensif', 'Tout le monde attaque : plus de buts… des deux côtés.', 1.3, 1.22], bal: ['Équilibré', 'Le bloc reste compact, aucune prise de risque.', 1, 1], def: ['Bloc bas', 'On ferme tout et on joue les coups.', .72, .7], counter: ['Contre-attaque', 'On laisse le ballon et on frappe vite.', 1.08, .86], press: ['Pressing haut', 'On étouffe l\'adversaire dès la relance.', 1.18, 1.04] };
const FOCUS = { tact: ['Tactique', 'Le groupe maîtrise mieux ton plan de jeu.'], att: ['Attaque', 'Plus d\'automatismes devant (+6 % de buts).'], def: ['Défense', 'Une défense plus solide (−6 % de buts encaissés).'], phys: ['Physique', 'Plus de jus en fin de match.'], rest: ['Récupération', 'Groupe frais et heureux, mais moins affûté.'] };
function startCoaching() {
  S.over = false; S.ended = null;
  S.mgr = { since: S.season, w: 0, d: 0, l: 0, gf: 0, ga: 0, hist: [], board: 60, tactic: 'bal', focus: 'tact', budget: 0, signed: 0, sacked: 0, ss: { w: 0, d: 0, l: 0 }, rep: clamp(20 + legendScore() / 6 + S.p.rep / 4, 15, 85), jobs: [] };
  S.club = { kind: 'coach', id: null, n: 'Entraîneur sans club', wage: 0, until: 0, since: S.season, num: S.club.num };
  S.coach = { n: '—', rel: 60 }; S.squad = []; S.mates2 = []; S.offers = []; S.intlCall = null;
  S.plan = [null, null, null, null, null, null, null];
  addNews('Reconversion', `${pName()} passe ses diplômes et se lance comme entraîneur.`);
  buildWeek();
  coachJobOffers(true);
}
function coachLevel() { return clamp(56 + S.mgr.rep * .32, 58, 90); }
function coachJobOffers(first) {
  const lvl = coachLevel();
  const pool = Object.values(S.W.clubs).filter(c => c.id !== S.club.id && c.s >= lvl - 7 && c.s <= lvl + 1);
  const picks = shuffle(pool.slice()).slice(0, 3);
  if (!picks.length) return;
  S.mgr.jobs = picks.map(c => ({ cid: c.id, wage: Math.round(marketWage(c.s, c.lid) * .55), years: 2, exp: absDay() + 28 }));
  queueEvent({ title: first ? 'Tes premières offres' : 'Offres d\'emploi', text: `<p>${first ? 'Diplômes en poche, ton téléphone sonne.' : 'Des clubs pensent à toi pour leur banc.'} Choisis ton club :</p>` + S.mgr.jobs.map(j => { const c = club(j.cid); return `<div class="mline"><span>${c.n} <span class="note">${L_BY(c.lid).name} · niveau ${c.s}</span></span><b>${eur(monthly(j.wage))}/mois</b></div>`; }).join(''), ch: S.mgr.jobs.map(j => ({ t: club(j.cid).n, f: () => { takeCoachJob(j.cid, j.wage, j.years); return `Bienvenue à ${club(j.cid).n}. Objectif du président : finir ${expectedRank(club(j.cid))}e.`; } })).concat([{ t: 'Attendre d\'autres offres', f: () => 'Tu prends le temps de choisir.' }]) });
}
function takeCoachJob(cid, wage, years) {
  const c = club(cid), prev = myClub();
  if (prev && prev.coachOld) { prev.coach = prev.coachOld; delete prev.coachOld; }
  c.coachOld = c.coach; c.coach = pName();
  S.club = { kind: 'coach', id: cid, n: c.n, wage, until: S.season + years - (S.week >= 43 ? 0 : 1), since: S.season, num: S.club.num, role: 'Entraîneur' };
  S.coach = { n: 'Président de ' + c.n, rel: 60 };
  S.mgr.board = 62; S.mgr.ss = { w: 0, d: 0, l: 0 }; S.mgr.signed = 0; S.mgr.budget = coachBudget(c); S.mgr.jobs = [];
  S.mateRel = 60; S.offers = [];
  buildSquad(); buildWeek(); genObjectives();
  addNews('Officiel', `${pName()} est nommé entraîneur de ${c.n}.`);
  feedPost(handle(), `Fier de rejoindre ${c.n} comme entraîneur. Au travail. 📋`, 'me');
}
function coachBudget(c) { return Math.round(Math.exp((c.s - 58) / 5.2) * 1e6 / 1e5) * 1e5; }
function coachRecruitList() {
  const c = myClub(); if (!c) return [];
  return S.W.stars.filter(s => s.cid !== c.id && !s.rival && s.o >= c.s - 1 && s.o <= c.s + 7 && s.a <= 31).map(s => ({ s, v: marketValue(s.o, s.a) })).sort((a, b) => b.s.o - a.s.o).slice(0, 10);
}
function coachSign(name) {
  const c = myClub(), it = coachRecruitList().find(x => x.s.n === name);
  if (!it) return 'Joueur indisponible.';
  if (!windowOpen()) return 'Le mercato est fermé.';
  if (S.mgr.signed >= 3) return 'Le président limite à 3 recrues par mercato.';
  if (it.v > S.mgr.budget) return 'Budget insuffisant.';
  const from = club(it.s.cid).n;
  it.s.cid = c.id; IDX = null; S.mgr.budget -= it.v; S.mgr.signed++;
  if (it.s.o > c.s) c.s = Math.min(93, c.s + 1);
  refreshSquadStars();
  addNews('Mercato', `${it.s.n} quitte ${from} et rejoint ${c.n} pour ${eur(it.v)}.`);
  S.mateRel = clamp(S.mateRel + 2, 0, 100);
  return `${it.s.n} signe à ${c.n} (${eur(it.v)}).`;
}
function mgrResult(prep, r, win, mine, th) {
  const M = S.mgr, myS = prep.side === 'h' ? prep.h.s : prep.a.s, opS = prep.side === 'h' ? prep.a.s : prep.h.s;
  const e = 1 / (1 + Math.exp(-(myS - opS) / 6));
  const draw = mine === th && !r.pen;
  if (win) { M.w++; M.ss.w++; } else if (draw) { M.d++; M.ss.d++; } else { M.l++; M.ss.l++; }
  M.gf += mine; M.ga += th;
  const delta = win ? 2 + (1 - e) * 4 : draw ? (e > .6 ? -1.5 : 1) : -(2 + e * 5);
  M.board = clamp(M.board + delta, 0, 100);
  S.mateRel = clamp(S.mateRel + (win ? 1 : draw ? 0 : -1), 0, 100);
  S.p.rep = clamp(S.p.rep + (win ? .15 : -.05) * (prep.big ? 2 : 1), 0, 100);
  if (M.board < 12 && S.club.id) coachSacked();
}
function coachSacked() {
  const c = myClub(), n = c.n;
  if (c.coachOld) { c.coach = c.coachOld; delete c.coachOld; }
  S.mgr.sacked++; S.mgr.rep = clamp(S.mgr.rep - 8, 5, 100);
  S.mgr.hist.push({ s: seasonLabel(S.season), c: n, pos: clubPos(c.id), w: S.mgr.ss.w, d: S.mgr.ss.d, l: S.mgr.ss.l, end: 'Limogé' });
  S.club = { kind: 'coach', id: null, n: 'Entraîneur sans club', wage: 0, until: 0, since: S.season, num: S.club.num };
  S.squad = []; S.obj = { season: S.season, club: null, list: [] }; buildWeek();
  addNews('Limogeage', `${pName()} est démis de ses fonctions à ${n}.`);
  queueEvent({ title: 'Limogé', text: `<p>Le président de ${n} met fin à ta mission après une série de mauvais résultats.</p><p class="note">D'autres clubs se manifesteront dans les prochaines semaines.</p>`, ch: [{ t: 'Rebondir', f: () => null }] });
}
function coachWeek() {
  if (!isCoach()) return;
  const M = S.mgr;
  if (M.focus === 'rest') S.mateRel = clamp(S.mateRel + 1.5, 0, 100);
  if (!S.club.id && (S.week % 3 === 0 || !M.jobs.length) && R() < .6) coachJobOffers(false);
  if (S.club.id && R() < .07) coachEvent();
  if (S.club.id && M.board >= 80 && R() < .025) { const lvl = myClub().s; const pool = Object.values(S.W.clubs).filter(c => c.s >= lvl + 3 && c.s <= lvl + 9); if (pool.length) { const t = pick(pool); M.jobs = [{ cid: t.id, wage: Math.round(marketWage(t.s, t.lid) * .6), years: 3, exp: absDay() + 21 }]; queueEvent({ title: 'Un grand club t\'appelle', text: `<p>${t.n} (${L_BY(t.lid).name}, niveau ${t.s}) veut faire de toi son entraîneur : ${eur(monthly(M.jobs[0].wage))} par mois.</p>`, ch: [{ t: 'Accepter', f: () => { takeCoachJob(t.id, M.jobs[0].wage, 3); return `Tu prends les commandes de ${t.n}.`; } }, { t: 'Rester fidèle', f: () => { M.board = clamp(M.board + 6, 0, 100); S.mateRel = clamp(S.mateRel + 5, 0, 100); return 'Ton président et tes joueurs apprécient ta fidélité.'; } }] }); } }
  if (S.p.age >= 70 && S.week === 43) queueEvent({ title: 'Une vie de football', text: '<p>À 70 ans, il est temps de laisser le banc aux jeunes.</p>', ch: [{ t: 'Prendre ma retraite', f: () => { endCoaching(); return null; } }, { t: 'Encore une saison', f: () => 'Le feu brûle encore.' }] });
}
const COACH_EV = [
  () => { const st = (S.squad || []).filter(x => x.star); if (!st.length) return null; const s = pick(st); return { title: 'Réclamation', text: `${s.n} vient te voir : il veut plus de temps de jeu.`, ch: [{ t: 'Lui promettre une titularisation', f: () => { S.mateRel = clamp(S.mateRel + 3, 0, 100); return 'Il repart motivé.'; } }, { t: 'Le recadrer', f: () => { S.mateRel = clamp(S.mateRel - 4, 0, 100); S.mgr.board = clamp(S.mgr.board + 2, 0, 100); return 'Le message est passé. Le président apprécie ta fermeté.'; } }] }; },
  () => ({ title: 'Conférence de presse', text: 'Un journaliste critique ouvertement ta tactique.', ch: [{ t: 'Rester calme et expliquer', f: () => { S.p.pop = clamp(S.p.pop + 2, 0, 100); return 'Réponse posée, appréciée.'; } }, { t: 'Le remettre à sa place', f: () => { S.p.followers += 2000; S.mgr.board = clamp(S.mgr.board - 2, 0, 100); return 'Le clash fait le buzz. Le président grimace.'; } }] }),
  () => { const st = (S.squad || []).filter(x => x.star && x.ref).sort((a, b) => b.o - a.o)[0]; if (!st || !windowOpen()) return null; return { title: 'Offre pour ta star', text: `Un club étranger propose une fortune pour ${st.n}. Le président est tenté.`, ch: [{ t: 'Refuser la vente', f: () => { S.mgr.board = clamp(S.mgr.board - 4, 0, 100); S.mateRel = clamp(S.mateRel + 3, 0, 100); return 'Tu gardes ta star. Le président fait la tête.'; } }, { t: 'Accepter et réinvestir', f: () => { const t = pick(Object.values(S.W.clubs).filter(c => c.s > myClub().s)); if (t) { st.ref.cid = t.id; IDX = null; refreshSquadStars(); myClub().s = Math.max(58, myClub().s - 1); } S.mgr.budget += marketValue(st.o, st.ref.a); S.mgr.board = clamp(S.mgr.board + 5, 0, 100); return 'Vente record. Ton budget mercato grossit.'; } }] }; },
  () => ({ title: 'Vestiaire', text: 'Deux cadres se sont accrochés à l\'entraînement.', ch: [{ t: 'Réunion de crise', f: () => { S.mateRel = clamp(S.mateRel + 5, 0, 100); return 'Tout le monde vide son sac. Le groupe ressort plus soudé.'; } }, { t: 'Laisser couler', f: () => { S.mateRel = clamp(S.mateRel - 5, 0, 100); return 'La tension persiste.'; } }] }),
];
function coachEvent() { for (let k = 0; k < 4; k++) { const e = pick(COACH_EV)(); if (e) { queueEvent(e); return; } } }
function mgrSeasonEnd(pos) {
  const M = S.mgr, c = myClub(); if (!c) return;
  const target = S.obj && S.obj.list[0] ? S.obj.list[0].target : expectedRank(c);
  const ok = pos <= target;
  M.hist.push({ s: seasonLabel(S.season), c: c.n, pos, w: M.ss.w, d: M.ss.d, l: M.ss.l, end: ok ? 'Objectif atteint' : 'Objectif manqué' });
  M.board = clamp(M.board + (ok ? 15 : -18), 0, 100); M.rep = clamp(M.rep + (ok ? 5 : -4) + (pos === 1 ? 6 : 0), 5, 100);
  M.ss = { w: 0, d: 0, l: 0 }; M.signed = 0; M.budget = coachBudget(c) + (ok ? Math.round(M.budget * .3) : 0);
  queueEvent({ title: 'Bilan du président', text: `<p>${c.n} termine <b>${pos}e</b> (objectif : ${target}e). ${ok ? 'Le président est ravi.' : 'Le président est déçu.'}</p><p class="note">Confiance : ${Math.round(M.board)} / 100 · budget mercato : ${eur(M.budget)}</p>`, ch: [{ t: 'Continuer', f: () => null }] });
  if (S.season >= S.club.until) {
    if (M.board >= 45) queueEvent({ title: 'Fin de contrat', text: `<p>Ton contrat se termine. ${c.n} te propose de prolonger de 2 saisons avec une augmentation.</p>`, ch: [{ t: 'Prolonger', f: () => { S.club.until = S.season + 2; S.club.wage = Math.round(S.club.wage * 1.15); return 'Prolongation signée.'; } }, { t: 'Partir', f: () => { leaveCoachJob('Fin de contrat'); return 'Tu quittes le club la tête haute.'; } }] });
    else { leaveCoachJob('Non prolongé'); }
  } else if (M.board < 25) coachSacked();
}
function leaveCoachJob(why) {
  const c = myClub(); if (!c) return;
  if (c.coachOld) { c.coach = c.coachOld; delete c.coachOld; }
  S.club = { kind: 'coach', id: null, n: 'Entraîneur sans club', wage: 0, until: 0, since: S.season, num: S.club.num };
  S.squad = []; buildWeek(); addNews('Entraîneur', `${pName()} quitte ${c.n} (${why.toLowerCase()}).`);
  coachJobOffers(false);
}
function endCoaching() {
  const M = S.mgr, c = myClub();
  if (c && c.coachOld) { c.coach = c.coachOld; delete c.coachOld; }
  const tr = S.trophies.filter(t => t.coach).length, games = M.w + M.d + M.l;
  S.over = true;
  S.ended = { id: 'coachdone', txt: `Après ${S.season - M.since} saisons sur les bancs, ${games} matchs dirigés (${M.w} victoires, ${M.d} nuls, ${M.l} défaites) et ${tr} trophée${tr > 1 ? 's' : ''} comme entraîneur, tu prends ta retraite. ${tr >= 3 ? 'Ton nom restera dans l\'histoire des bancs de touche.' : tr ? 'Tes joueurs parlent de toi avec respect.' : 'Tu as transmis ta passion à des centaines de joueurs.'}` };
  addNews('Retraite', `${pName()} prend sa retraite d'entraîneur.`);
}
