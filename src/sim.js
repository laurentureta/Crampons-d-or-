// ===================== JOURNÉES : activités, argent, matchs, compétitions =====================
const TRAIN = {
  POSTE: { n: 'Spécifique au poste', w: null },
  TECH: { n: 'Technique & dribble', w: { TEC: .5, DRI: .5 } },
  PHYS: { n: 'Physique & cardio', w: { END: .5, PHY: .5, VIT: .2 } },
  VIT: { n: 'Vitesse & explosivité', w: { VIT: .7, END: .2 } },
  PASS: { n: 'Passes & vision', w: { PAS: .6, MEN: .3 } },
  SHOT: { n: 'Finition', w: { TIR: .7, TEC: .2 } },
  DEF: { n: 'Défense & duels', w: { DEF: .6, PHY: .3 } },
  GK: { n: 'Gardien de but', w: { GAR: .8, MEN: .2 } },
  MENT: { n: 'Vidéo & mental', w: { MEN: .7 }, e: .5 },
};
const INTENS = { L: { n: 'Léger', m: .6, e: -4, inj: .0012 }, N: { n: 'Normal', m: 1, e: -8, inj: .0035 }, H: { n: 'Intense', m: 1.45, e: -13, inj: .009 } };
const JOBS = [
  { n: 'Distribuer des prospectus', age: 14, pay: 25, e: -7 }, { n: 'Aider au marché', age: 14, pay: 35, e: -9 }, { n: 'Laver des voitures', age: 15, pay: 40, e: -9 },
  { n: 'Plonge au restaurant', age: 16, pay: 55, e: -11 }, { n: 'Livreur à vélo', age: 16, pay: 60, e: -12 }, { n: 'Animateur foot pour enfants', age: 17, pay: 55, e: -7 }, { n: 'Caissier au supermarché', age: 18, pay: 75, e: -11 },
];
const ACTS = {
  rest: { n: 'Repos complet', e: 12, d: 'Récupère beaucoup d\'énergie.' },
  free: { n: 'Journée libre', e: 4, d: 'Un peu de repos, un peu de moral.' },
  family: { n: 'Temps en famille', e: -2, d: 'Relation avec tes parents +, moral +.' },
  friends: { n: 'Sortie entre amis', e: -3, d: 'Moral ++, coûte un peu d\'argent.' },
  date: { n: 'Rendez-vous amoureux', e: -3, d: 'Renforce ton couple.' },
  drive: { n: 'Leçon de conduite', e: -4, d: '50 € la leçon de 2 h.' },
  study: { n: 'Réviser les cours', e: -4, d: 'Prépare le bac (plan B).' },
};
const SERVICES = [
  { id: 'boots', n: 'Crampons de qualité', p: 140, once: true, d: '+4 % de progression à l\'entraînement' },
  { id: 'coachp', n: 'Coach particulier', wk: 120, d: '+12 % de progression' },
  { id: 'prep', n: 'Préparateur physique perso', wk: 900, d: 'Risque de blessure −40 %' },
  { id: 'chef', n: 'Chef & nutritionniste', wk: 1600, d: '+1 d\'énergie chaque jour' },
  { id: 'mental', n: 'Préparateur mental', wk: 700, d: 'Moral plus stable, meilleures décisions en match' },
];
const SHOP = {
  houses: [{ id: 'studio', n: 'Studio en ville', p: 95000, m: 2 }, { id: 'appart', n: 'Appartement 3 pièces', p: 260000, m: 4 }, { id: 'maison', n: 'Maison avec jardin', p: 560000, m: 6 }, { id: 'villa', n: 'Villa avec piscine', p: 1800000, m: 9 }, { id: 'manoir', n: 'Manoir avec parc', p: 6500000, m: 12 }, { id: 'pent', n: 'Penthouse vue mer', p: 14000000, m: 14 }, { id: 'ile', n: 'Île privée', p: 45000000, m: 18 }],
  cars: [{ id: 'cit', n: 'Citadine d\'occasion', p: 9000, m: 1 }, { id: 'suv', n: 'SUV familial', p: 42000, m: 2 }, { id: 'coupe', n: 'Coupé sportif', p: 120000, m: 3 }, { id: 'super', n: 'Supercar italienne', p: 330000, m: 5 }, { id: 'hyper', n: 'Hypercar', p: 2800000, m: 8 }],
  gifts: [{ id: 'gtrip', n: 'Vacances pour toute la famille', p: 12000 }, { id: 'gcar', n: 'Voiture neuve pour tes parents', p: 35000 }, { id: 'gfriend', n: 'Appartement pour ton meilleur ami', p: 280000 }, { id: 'gparents', n: 'Maison pour tes parents', p: 450000 }, { id: 'gvilla', n: 'Villa de rêve pour tes parents', p: 1500000 }],
};
const BRANDS = [
  { n: 'Strider', t: 'équipementier sportif', f: 8000, k: 1.0 }, { n: 'Volt+', t: 'boisson énergisante', f: 40000, k: 1.2 }, { n: 'PixelPitch', t: 'jeu vidéo de foot', f: 150000, k: 1.6 },
  { n: 'Chronos', t: 'montres de luxe', f: 600000, k: 2.4 }, { n: 'Aurea Motors', t: 'constructeur automobile', f: 2500000, k: 3.5 }, { n: 'BetMax', t: 'site de paris sportifs', f: 100000, k: 2.2, bad: true },
];
const has = id => (S.assets.serv || []).includes(id);
function actEnergy(a) {
  if (!a) return 0;
  if (a.k === 'train') return Math.round(INTENS[a.i].e * (TRAIN[a.s].e || 1));
  if (a.k === 'job') return JOBS[a.j].e;
  return ACTS[a.k] ? ACTS[a.k].e : 0;
}
function actLabel(a) {
  if (!a) return 'Rien de prévu';
  if (a.k === 'train') return TRAIN[a.s].n;
  if (a.k === 'job') return JOBS[a.j].n;
  if (a.k === 'date') return S.love ? 'Rendez-vous avec ' + S.love.n.split(' ')[0] : 'Rendez-vous';
  return ACTS[a.k] ? ACTS[a.k].n : '?';
}
function actSub(a) { if (!a) return ''; if (a.k === 'train') return INTENS[a.i].n; if (a.k === 'job') return '+' + JOBS[a.j].pay + ' €'; return ''; }
function actAllowed(a) {
  if (!a) return true;
  if (a.k === 'job') return S.club.kind === 'amateur' && S.p.age >= JOBS[a.j].age;
  if (a.k === 'date') return !!S.love;
  if (a.k === 'drive') return S.p.age >= 17 && !S.permis.ok;
  if (a.k === 'study') return S.p.age <= 19 && !S.school.done;
  if (a.k === 'train' && a.s === 'GK') return S.p.pos === 'GB';
  return true;
}

// ---------- Progression ----------
function facility() {
  if (S.club.kind === 'amateur') return S.club.free ? .7 : .78;
  const c = myClub(); if (!c) return .8;
  if (S.club.kind === 'academy') return .95 + (c.s - 70) / 90;
  return 1 + (c.s - 72) / 80;
}
function ageMult(a) { return a <= 15 ? 1.35 : a <= 17 ? 1.3 : a <= 19 ? 1.2 : a <= 21 ? 1.08 : a <= 24 ? .92 : a <= 27 ? .62 : a <= 30 ? .38 : .2; }
function trainGain(weights, mult, log) {
  const p = S.p, gains = {};
  const fac = facility() * (1 + (has('boots') ? .04 : 0) + (has('coachp') ? .12 : 0)) * (.82 + p.moral / 400) * DF().grow;
  for (const k in weights) {
    const pm = clamp((p.cap[k] - p.at[k]) / 18, .02, 1.25);
    const g = .23 * weights[k] * mult * ageMult(p.age) * pm * fac * rf(.7, 1.3);
    p.at[k] = Math.min(p.cap[k] + .4, p.at[k] + g); gains[k] = g;
  }
  if (log) for (const k in gains) log.gains[k] = (log.gains[k] || 0) + gains[k];
}
function doActivity(a, log) {
  const p = S.p;
  if (!a || !actAllowed(a)) { p.energy += 4; return; }
  p.energy += actEnergy(a);
  if (a.k === 'train') {
    if (p.inj > 0) { trainGain({ MEN: .25 }, .5, log); log.lines.push('Rééducation (blessé).'); return; }
    S.flags.trainedWeek = true;
    trainGain(TRAIN[a.s].w || POSW[p.pos], INTENS[a.i].m * (TRAIN[a.s].w ? 1 : .9), log);
    p.forme = clamp(p.forme + INTENS[a.i].m * 1.6, 0, 100);
    const risk = INTENS[a.i].inj * (p.energy < 25 ? 3 : 1) * (has('prep') ? .6 : 1) * DF().inj;
    if (R() < risk) injure(log, 'à l\'entraînement');
    log.lines.push(`Entraînement : ${TRAIN[a.s].n.toLowerCase()} (${INTENS[a.i].n.toLowerCase()}).`);
  } else if (a.k === 'job') { const j = JOBS[a.j]; earn(j.pay, j.n); p.moral -= .5; log.lines.push(`${j.n} : +${j.pay} €.`); }
  else if (a.k === 'rest') { p.moral += 1; log.lines.push('Repos complet.'); }
  else if (a.k === 'free') { p.moral += .5; }
  else if (a.k === 'family') { S.fam.dad.rel += 1.5; S.fam.mom.rel += 1.5; p.moral += 2; S.fam.stress -= 1; log.lines.push('Journée en famille.'); }
  else if (a.k === 'friends') { S.friend.rel += 3; p.moral += 3; const c = p.money > 30 ? 25 : 0; spend(c, 'Sorties'); log.lines.push('Sortie avec les amis.'); if (R() < .04) { p.energy -= 8; log.lines.push('Soirée trop tardive : fatigue.'); } }
  else if (a.k === 'date') { const c = Math.round(clamp(p.money * .002, 25, 3000)); spend(c, 'Sorties en couple'); S.love.rel = clamp(S.love.rel + 5, 0, 100); p.moral += 3; log.lines.push(`Rendez-vous avec ${S.love.n.split(' ')[0]}.`); }
  else if (a.k === 'drive') { if (p.money < 50) { log.lines.push('Pas assez d\'argent pour la leçon de conduite.'); return; } spend(50, 'Auto-école'); S.permis.h += 2; log.lines.push(`Leçon de conduite (${S.permis.h} h au total).`); }
  else if (a.k === 'study') { S.school.lvl = clamp(S.school.lvl + 3 + (p.at.MEN - 50) / 40, 0, 100); log.lines.push('Révisions.'); }
}
function injure(log, where) {
  const p = S.p, r = R(); let d, nm;
  if (r < .55) { d = ri(4, 13); nm = pick(['Contracture', 'Coup au genou', 'Petite entorse']); }
  else if (r < .88) { d = ri(18, 42); nm = pick(['Élongation', 'Entorse de la cheville', 'Lésion musculaire']); }
  else if (r < .97) { d = ri(56, 98); nm = pick(['Déchirure musculaire', 'Fracture du pied']); }
  else { d = ri(180, 240); nm = 'Rupture des ligaments croisés'; }
  if (p.age > 31) d = Math.round(d * 1.25);
  p.inj = d; p.injName = nm;
  const wk = Math.max(1, Math.round(d / 7));
  log.lines.push(`Blessure ${where} : ${nm.toLowerCase()} (${wk} sem.).`);
  addNews('Blessure', `${pName()} est blessé ${where} : ${nm.toLowerCase()}, environ ${wk} semaine${wk > 1 ? 's' : ''} d'absence.`);
  log.injured = true;
}

// ---------- Argent ----------
function earn(v, why) { S.p.money += v; S.month.inc += v; if (why) addLine(why, v); }
function spend(v, why) { S.p.money -= v; S.month.exp += v; if (why) addLine(why, -v); }
function addLine(why, v) { const L = S.month.lines; const e = L.find(x => x[0] === why); if (e) e[1] += v; else L.push([why, v]); }
function marketWage(o, lid) { const L = L_BY(lid), k = L ? L.wage : 1; return Math.round(Math.max(420 * k + 180, 380 * Math.pow(1.19, o - 60) * k)); }
function marketValue(o, age) { const af = age <= 21 ? 1.4 : age <= 25 ? 1.2 : age <= 28 ? 1 : age <= 30 ? .75 : age <= 32 ? .5 : .3; return Math.round(Math.pow(1.28, o - 60) * 60000 * af / 1000) * 1000; }
function wealth() { const A = S.assets; return S.p.money + A.liv + A.etf + A.cry + A.immo.reduce((x, i) => x + i.v, 0) + A.houses.reduce((x, h) => x + h.p * .9, 0) + A.cars.reduce((x, c) => x + c.p * .5, 0) + A.st.filter(s => !s.done).reduce((x, s) => x + s.amt, 0); }
function rentWeek() { if (S.club.kind !== 'pro' || S.assets.houses.length) return 0; return Math.round(clamp(S.club.wage * .25, 120, 260 * (L_BY(myClub().lid).wage + .3))); }
function weeklyMoney(log) {
  const p = S.p, A = S.assets;
  if (S.club.kind === 'amateur' && p.age < 19 && !S.flags.moved) { const al = Math.round([6, 18, 45][S.fam.w] * DF().money); earn(al, 'Argent de poche'); }
  A.liv *= 1 + .02 / 52; A.etf *= 1 + .07 / 52 + gauss() * .15 / Math.sqrt(52); A.cry *= Math.max(.3, 1 + .1 / 52 + gauss() * .85 / Math.sqrt(52));
  for (const im of A.immo) im.v *= 1 + .03 / 52 + gauss() * .05 / Math.sqrt(52);
  for (const st of A.st) if (!st.done && absDay() >= st.end) {
    st.done = true; const r = R(); const mult = r < .12 ? ri(6, 12) : r < .35 ? 2 : r < .55 ? .5 : 0;
    const back = Math.round(st.amt * mult); p.money += back;
    inbox('info', 'Start-up « ' + st.n + ' »', `${mult >= 2 ? 'Rachat réussi' : mult > 0 ? 'Revente à perte' : 'Faillite'} : tu récupères ${eur(back)} (mise ${eur(st.amt)}).`);
  }
  S.fam.savings += [15, 60, 300][S.fam.w];
}
function monthEnd(log, monthName) {
  const p = S.p, A = S.assets;
  if (S.acc.wage > 0) { const w = Math.round(S.acc.wage); earn(w, S.club.kind === 'academy' ? 'Indemnité de formation' : 'Salaire'); if (S.agent && S.agent.comm) spend(Math.round(w * S.agent.comm / 100), 'Commission de l\'agent'); }
  if (S.acc.sp > 0) earn(Math.round(S.acc.sp), 'Sponsors');
  S.acc = { wage: 0, sp: 0 };
  for (const im of A.immo) earn(Math.round(im.v * .04 / 12), 'Loyers perçus');
  const rent = monthly(rentWeek()); if (rent) spend(rent, 'Loyer');
  let up = 0; for (const h of A.houses) up += h.p * .0022; for (const c of A.cars) up += c.p * .004; if (up) spend(Math.round(up), 'Entretien maisons & voitures');
  let sv = 0; for (const id of A.serv) { const s = SERVICES.find(x => x.id === id); if (s && s.wk) sv += monthly(s.wk); } if (sv) spend(sv, 'Staff personnel');
  if (S.love && S.love.kids.length) spend(S.love.kids.length * 450, 'Enfants');
  const M = S.month, avg = M.apps ? (M.rs / M.apps).toFixed(1).replace('.', ',') : '–';
  const net = M.inc - M.exp;
  const lines = M.lines.slice().sort((a, b) => b[1] - a[1]).map(([w, v]) => `<div class="mline"><span>${w}</span><b class="${v >= 0 ? 'ok' : 'bad'}">${v >= 0 ? '+' : ''}${eur(v)}</b></div>`).join('');
  const body = `${lines || '<p class="note">Aucun mouvement d\'argent.</p>'}<div class="mline tot"><span>Solde du mois</span><b class="${net >= 0 ? 'ok' : 'bad'}">${net >= 0 ? '+' : ''}${eur(net)}</b></div><p class="note">Matchs : ${M.apps} · Buts : ${M.g} · Passes D : ${M.a} · Note moy. : ${avg} · Abonnés : ${S.p.followers - M.f0 >= 0 ? '+' : ''}${fnum(S.p.followers - M.f0)}</p>`;
  inbox('month', 'Bilan de ' + monthName, body);
  curveSample(monthName);
  if (S.settings.interrupt === 'key') S.toasts.push('Bilan de ' + monthName + ' disponible dans tes messages.');
  else queueEvent({ title: 'Bilan de ' + monthName, text: body, ch: [{ t: 'Continuer', f: () => null }], kind: 'month' });
  if (p.money < 0) { p.moral -= 4; if (A.serv.length) { A.serv = A.serv.filter(id => id === 'boots'); inbox('info', 'Compte à découvert', 'Tes services personnels sont arrêtés faute d\'argent.'); } }
  S.month = newMonth();
}

// ---------- Semaine : calendrier des matchs du joueur ----------
function buildWeek() {
  const w = S.week, fx = [], taken = new Set();
  const put = (prefs, job) => { for (const d of prefs) if (!taken.has(d) && d >= S.day) { taken.add(d); fx.push({ d, job }); return true; } return false; };
  if (proLike() && S.club.id) {
    const c = myClub(), LG = S.W.leagues[c.lid], rounds = LG.weekMap[w] || [];
    const conf = contOf(c.lid);
    if (conf) {
      const C = S.W.cl[conf];
      if (conf === 'UEFA' && UCL_LP.includes(w) && C.teams.includes(c.id)) put([1, 2], { k: 'uclp', i: UCL_LP.indexOf(w) });
      for (const key of KO_ORDER) { const wk = KO[key]; if (!C.pairs || C.key !== key) continue; const leg = wk[0] === w ? 1 : wk[1] === w ? 2 : 0; if (leg && C.pairs.some(pr => pr.includes(c.id))) put(key === 'f' ? [5, 6] : [1, 2], { k: 'ko', conf, key, leg: key === 'f' ? 0 : leg }); }
    }
    rounds.forEach((r, i) => { const d0 = leagueDays(rounds.length, i)[0]; if (d0 < S.day || (d0 === S.day && S.jobs)) return; const m = LG.rounds[r].find(([h, a]) => h === c.id || a === c.id); if (m) put(leagueDays(rounds.length, i), { k: 'league', lid: c.lid, r, h: m[0], a: m[1] }); });
    const cup = S.W.cups[c.cc];
    if (CUP_WEEKS.includes(w) && cup.alive && cup.round === CUP_WEEKS.indexOf(w)) put([2, 3, 4], { k: 'cup', cc: c.cc, idx: cup.round });
  } else if (!S.club.free && S.club.kind !== 'coach' && LEAGUE_WEEKS.includes(w)) put([5, 6], { k: 'youth' });
  if (S.intlCall) { put([3], { k: 'intl', n: 0, lvl: S.intlCall }); put([6, 5], { k: 'intl', n: 1, lvl: S.intlCall }); }
  S.wk = { w, fx };
}
function fixturesOn(d) { return (S.wk ? S.wk.fx : []).filter(f => f.d === d).map(f => f.job).concat(tourFixturesOn(d)); }
function fixtureLabel(job) {
  const me = S.club.id;
  if (job.k === 'league') { const opp = job.h === me ? job.a : job.h; return { comp: L_BY(job.lid).name + ' · J' + (job.r + 1), txt: (job.h === me ? 'vs ' : 'à ') + club(opp).n, derby: derbyOf(job.h, job.a) }; }
  if (job.k === 'cup') return { comp: L_BY(myClub().lid).cup, txt: CUP_ROUNDS[job.idx] };
  if (job.k === 'uclp') return { comp: 'Ligue des champions', txt: 'Phase de ligue · J' + (job.i + 1) };
  if (job.k === 'ko') { const C = S.W.cl[job.conf], pr = (C.pairs || []).find(x => x.includes(me)); const opp = pr ? (pr[0] === me ? pr[1] : pr[0]) : null; return { comp: CONT_CUP[job.conf], txt: KO_N[job.key] + (job.leg ? ' (' + (job.leg === 1 ? 'aller' : 'retour') + ')' : '') + (opp ? ' · ' + team(opp).n : '') }; }
  if (job.k === 'youth') return { comp: 'Championnat ' + youthCat(), txt: 'Match avec ' + (S.club.kind === 'amateur' ? S.club.n : myClub().n) };
  if (job.k === 'reserve') return { comp: 'Réserve', txt: 'Match de la réserve' };
  if (job.k === 'intl') return { comp: job.lvl === 'A' ? 'Équipe nationale' : 'Sélection ' + job.lvl, txt: nation().n + (job.n ? ' · 2e match' : ' · 1er match') };
  if (job.k === 'tour') { const T = S.W.tours[job.ti]; return { comp: T.name, txt: job.stage + ' · vs ' + job.oppN }; }
  return { comp: '', txt: '' };
}

// ---------- Déroulé d'une journée ----------
let EVQ = [];
function queueEvent(e) { EVQ.push(e); }
function newDayLog() { return { date: fmtDay(today()), dow: S.day, lines: [], matches: [], gains: {}, money0: S.p.money, act: null }; }
function weekStartTasks() {
  S.weekLog = []; S.flags.trainedWeek = false;
  const w = S.week;
  if (w === 12) ballonDor();
  if (w === 43) { summerWorld(); rivalSummer(); }
  if (w === 44) createTournaments();
  if (w === 24) finishLeaguePhase();
  for (const conf of ['UEFA', 'AFC', 'CONCACAF']) for (const key of KO_ORDER) if (KO[key][0] === w) drawKo(conf, key);
  S.offers = S.offers.filter(o => o.exp > absDay());
  S.intlCall = INTL_WEEKS.includes(w) ? decideCallup() : null;
  buildWeek();
  S.wkMinE = S.p.energy;
  if (w === 1) genObjectives();
  genChallenge();
}
function beginDay() {
  S.dayLog = newDayLog();
  const jobs = [];
  for (const lid in S.W.leagues) { const LG = S.W.leagues[lid], rs = LG.weekMap[S.week] || []; rs.forEach((r, i) => { if (leagueDays(rs.length, i)[0] === S.day) jobs.push({ k: 'aiRound', lid, r }); }); }
  if (S.week === 44 && S.day === 2) jobs.push({ k: 'bac' });
  const mine = fixturesOn(S.day).map(j => Object.assign({ pm: true }, j));
  jobs.push(...mine);
  if (S.day === 6 && S.needReserve) { jobs.push({ pm: true, k: 'reserve' }); S.needReserve = false; }
  for (const conf of ['UEFA', 'AFC', 'CONCACAF']) { const C = S.W.cl[conf]; if (!C.pairs) continue; const wk = KO[C.key]; if ((C.key === 'f' ? wk[0] === S.week && S.day === 5 : wk[1] === S.week && S.day === 1)) jobs.push({ k: 'aiKo', conf }); }
  tourDayJobs(jobs);
  if (!jobs.some(j => j.pm)) jobs.push({ k: 'act' });
  S.jobs = jobs; S.jobi = 0;
}
function runJobs() {
  while (S.jobi < S.jobs.length) {
    const job = S.jobs[S.jobi];
    if (job.pm) {
      const prep = prepMatch(job);
      if (!prep) { S.jobi++; continue; }
      if ((prep.min > 0 || prep.coach) && liveWanted(prep)) { S.live = { job, prep, M: liveSetup(prep) }; return { live: true }; }
      const r = prep.coach ? coachQuick(prep) : simMatch(prep.h, prep.a, { p: { side: prep.side, min: prep.min, ovr: prep.ovr, youth: prep.youth }, squad: prep.club, ko: prep.ko && !prep.leg1, neutral: prep.neutral });
      if (prep.agg) resolveAgg(prep, r);
      afterMatch(job, prep, r);
    } else runSimple(job);
    S.jobi++;
  }
  return null;
}
function liveWanted(prep) { const m = S.settings.live; return m === 'all' || (m === 'big' && prep.big); }
function runSimple(job) {
  const log = S.dayLog;
  if (job.k === 'aiRound') { const LG = S.W.leagues[job.lid]; for (const [h, a] of LG.rounds[job.r]) { if (proLike() && (h === S.club.id || a === S.club.id)) continue; const m = simMatch(team(h), team(a)); applyTable(job.lid, h, a, m.hg, m.ag); } }
  else if (job.k === 'act') { if (isCoach()) return; const a = S.plan[S.day]; log.act = a; doActivity(a, log); }
  else if (job.k === 'aiKo') resolveKoRound(job.conf);
  else if (job.k === 'bac') bacExam();
  else if (job.k === 'tourStage') tourStage(job.ti, job.stage);
}
function endDay() {
  const p = S.p, log = S.dayLog;
  const d0 = today();
  p.energy = clamp(p.energy + 7 + (has('chef') ? 1 : 0), 0, 100);
  if (p.inj > 0) { p.inj--; if (p.inj === 0) { log.lines.push('Tu es guéri, retour sur les terrains !'); p.injName = ''; p.backD = absDay(); } }
  S.acc.wage += (S.club.wage || 0) / 7;
  S.acc.sp += S.assets.spons.reduce((x, s) => x + s.wk, 0) / 7;
  for (const s of S.W.stars) if (s.inj > 0) s.inj--;
  S.wkMinE = Math.min(S.wkMinE ?? 100, p.energy);
  checkChallenge(false);
  if (S.day === 6) weekEnd();
  log.money = p.money - log.money0;
  S.weekLog.push(log); S.lastDay = log;
  // avancer
  S.jobs = null; S.jobi = 0;
  S.day++;
  if (S.day > 6) {
    S.day = 0; S.week++;
    if (S.week > 52) { S.week = 1; S.season++; newSeason(false); addNews('Nouvelle saison', `La saison ${seasonLabel(S.season)} commence.`); if (proLike() && S.club.id) refreshSquadStars(); }
    weekStartTasks();
  }
  const d1 = today();
  if (d1.getMonth() !== d0.getMonth()) monthEnd(log, MONTHS[d0.getMonth()] + ' ' + d0.getFullYear());
}
function stepDay() {
  if (S.over) return { done: true };
  if (S.live) return { live: true };
  if (!S.jobs) beginDay();
  const r = runJobs(); if (r) return r;
  endDay();
  return { done: true, log: S.lastDay };
}
function weekEnd() {
  const p = S.p;
  weeklyMoney(S.dayLog);
  if (S.club.kind !== 'amateur' && S.club.kind !== 'coach' && !S.flags.trainedWeek && p.inj <= 0) { S.coach.rel -= 5; inbox('coach', S.coach.n, 'Je ne t\'ai pas vu à l\'entraînement cette semaine. Ce n\'est pas acceptable.'); }
  S.club.role = computeRole();
  if (p.age >= 30) for (const k of ATTR) { const phys = ['VIT', 'END', 'PHY'].includes(k); p.at[k] = Math.max(20, p.at[k] - (phys ? .014 * (p.age - 29) : .004 * (p.age - 30)) * rf(.6, 1.4)); }
  p.moral = clamp(p.moral + (60 - p.moral) * .05 - S.fam.stress / 60 + (has('mental') ? 1 : 0) + (S.love ? (S.love.rel - 50) / 50 : 0), 0, 100);
  p.forme = clamp(p.forme - 1, 0, 100); p.pop = clamp(p.pop, 0, 100); p.rep = clamp(p.rep * .996, 0, 100);
  S.fam.stress = clamp(S.fam.stress - .5, 0, 100);
  for (const o of [S.fam.dad, S.fam.mom, S.friend, S.coach]) o.rel = clamp(o.rel, 0, 100);
  S.mateRel = clamp(S.mateRel, 0, 100);
  if (S.love) { S.love.rel = clamp(S.love.rel - 1.2, 0, 100); }
  if (p.age <= 19 && !S.school.done) S.school.lvl = clamp(S.school.lvl - .6, 0, 100);
  { const T = fameTarget(); p.followers = Math.max(0, Math.round(p.followers < T ? p.followers + (T - p.followers) * .025 : p.followers * .997)); }
  genOffers();
  randomEvent(); sponsorCheck(); agentApplications(); lifeEvents(); captainCheck(); recruitCheck(); academyChecks();
  checkChallenge(true); checkPerks(); matesEvents(); rivalWeek(); coachWeek();
  if (S.club.kind === 'pro' && S.week === 30 && S.season >= S.club.until && !S.club.loanFrom && /Titulaire|Star|Rotation/.test(S.club.role)) renewalOffer();
  if (S.week === p.bweek) { p.age++; addNews('Anniversaire', `${p.first} fête ses ${p.age} ans.`); inbox('info', 'Joyeux anniversaire !', `Tu as ${p.age} ans aujourd'hui.${p.age === 17 ? ' Tu peux passer ton permis de conduire.' : p.age === 18 ? ' Tu peux signer partout dans le monde et acheter une voiture ou un logement.' : ''}`); }
  if (S.week === 42) { evalObjectives(); endSeason(); }
  if (S.club.kind === 'pro' && S.week === 43 && p.age >= 40) queueEvent({ title: 'La fin d\'une époque', text: 'À 40 ans passés, ton corps te dit stop.', ch: [{ t: 'Prendre ma retraite', f: () => { retire(); return null; } }] });
  checkAchievements();
}

// ---------- Préparation des matchs du joueur ----------
function youthCat() { const a = S.p.age; if (S.club.kind === 'pro') return 'Réserve'; if (a <= 14) return 'U15'; if (a <= 16) return 'U17'; if (a <= 18) return 'U19'; return S.club.kind === 'academy' ? 'Réserve' : 'Seniors R1'; }
function youthLevel() {
  const a = S.p.age;
  if (S.club.kind === 'amateur') return a <= 18 ? 30 + (a - 14) * 5.5 : 56;
  const c = myClub();
  if (S.club.kind === 'academy') return a <= 18 ? c.s - 42 + (a - 14) * 5.5 : c.s - 18;
  return c.s - 15;
}
const VILLAGES = ['Les Coteaux', 'Saint-Martin', 'Val-Fleuri', 'La Plaine', 'Bellevue', 'Les Pins', 'Montclar', 'Rivesaltes', 'Port-Neuf', 'Sainte-Croix', 'Haute-Ville', 'Les Tilleuls'];
function prepMatch(job) {
  const p = prepMatch0(job); if (!p) return p;
  if (isCoach()) { p.coach = true; p.min = 0; p.reserve = false; return p; }
  if (p.club && hasPerk('lead')) (p.side === 'h' ? p.h : p.a).s += 1;
  const RV = S.rival, opp = p.side === 'h' ? p.a : p.h;
  if (RV && !RV.done && RV.cid && (opp.id === RV.cid || (opp.stars || []).some(s => s.rival))) { p.rivalDuel = true; p.big = true; p.label = (p.label ? p.label + ' · ' : '') + 'duel face à ' + RV.n; }
  return p;
}
function prepMatch0(job) {
  const me = S.club.id, o = OVR();
  const P = (h, a, side, min, x) => Object.assign({ h, a, side, min, ovr: o, club: true, big: false, ko: false, neutral: false, repW: 1 }, x);
  if (job.k === 'league') {
    let min = selectMinutes(); const reserve = min === -1; if (reserve) { min = 0; S.needReserve = true; }
    const dn = derbyOf(job.h, job.a);
    return P(team(job.h), team(job.a), job.h === me ? 'h' : 'a', min, { comp: L_BY(job.lid).name, label: (dn ? dn + ' · ' : '') + 'J' + (job.r + 1), big: !!dn, derby: dn, reserve });
  }
  if (job.k === 'cup') {
    const cup = S.W.cups[job.cc]; if (!cup.alive) return null;
    const pool = Object.values(S.W.clubs).filter(c => c.cc === job.cc && c.id !== me);
    const opp = job.idx <= 1 && R() < .55 ? { id: 'low', n: pick(['Stade ', 'Olympique ', 'Union ', 'Racing ', 'Athletic ']) + pick(VILLAGES), s: ri(52, 64), stars: [] } : team(pick(pool).id);
    let min = selectMinutes(); if (min < 0) min = 0;
    const home = R() < .5;
    return P(home ? team(me) : opp, home ? opp : team(me), home ? 'h' : 'a', min, { comp: L_BY(myClub().lid).cup, label: CUP_ROUNDS[job.idx], ko: true, neutral: job.idx === 5, big: job.idx >= 4, repW: 1.1, oppN: opp.n });
  }
  if (job.k === 'uclp') {
    const U = S.W.cl.UEFA, opps = U.opp.filter(x => x !== me), opp = opps[(job.i * 3 + U.teams.indexOf(me)) % opps.length], home = job.i % 2 === 0;
    let min = selectMinutes(); if (min < 0) min = 0;
    return P(team(home ? me : opp), team(home ? opp : me), home ? 'h' : 'a', min, { comp: 'Ligue des champions', label: 'Phase de ligue · J' + (job.i + 1), big: true, repW: 1.6, cont: true });
  }
  if (job.k === 'ko') {
    const C = S.W.cl[job.conf], pr = (C.pairs || []).find(x => x.includes(me)); if (!pr) return null;
    const opp = pr[0] === me ? pr[1] : pr[0];
    let min = selectMinutes(); if (min < 0) min = 0;
    const lab = KO_N[job.key] + (job.leg === 1 ? ' (aller)' : job.leg === 2 ? ' (retour)' : '');
    if (job.leg === 1) return P(team(opp), team(me), 'a', min, { comp: CONT_CUP[job.conf], label: lab, big: true, repW: 1.6, cont: true, leg1: true });
    if (job.leg === 2) { const l1 = (C.leg1 || {})[me] || { mine: 0, th: 0 }; return P(team(me), team(opp), 'h', min, { comp: CONT_CUP[job.conf], label: lab, big: true, repW: 1.6, cont: true, ko: true, agg: l1 }); }
    return P(team(me), team(opp), 'h', min, { comp: CONT_CUP[job.conf], label: 'Finale', big: true, repW: 2, cont: true, ko: true, neutral: true });
  }
  if (job.k === 'youth' || job.k === 'reserve') {
    const lvl = youthLevel(), cat = youthCat();
    const myN = (S.club.kind === 'amateur' ? S.club.n : myClub().n) + ' ' + cat;
    const sameL = S.club.kind !== 'amateur' ? Object.values(S.W.clubs).filter(c => c.lid === myClub().lid && c.id !== me).map(c => c.n) : [];
    const opN = (S.club.kind === 'amateur' ? pick(['AS ', 'US ', 'FC ', 'ES ']) + pick(VILLAGES) : pick(sameL) || 'Adversaire') + ' ' + cat;
    const home = R() < .5, mine = { n: myN, s: lvl + rf(-2, 2), stars: [] }, op = { n: opN, s: lvl + rf(-6, 6), stars: [] };
    return P(home ? mine : op, home ? op : mine, home ? 'h' : 'a', S.p.inj > 0 ? 0 : 85, { comp: cat === 'Réserve' ? 'Match de la réserve' : 'Championnat ' + cat, label: '', club: false, youth: true, repW: .25, kindRec: S.club.kind === 'pro' ? 'reserve' : 'youth' });
  }
  if (job.k === 'intl') {
    const N = nation(), isA = job.lvl === 'A', age = S.p.age;
    if (S.p.inj > 0) return null;
    const pool = Object.keys(OTHER_NATIONS).concat(Object.keys(NATIONS)).filter(k => k !== S.p.nat);
    const oc = pick(pool), os = (OTHER_NATIONS[oc] ? OTHER_NATIONS[oc][1] : NATIONS[oc].s) - (isA ? 0 : 12);
    const ns = isA ? N.s : N.s - 12 - (21 - Math.min(age, 21)) * 1.2;
    const me_ = { n: (isA ? '' : job.lvl + ' · ') + N.n, s: ns, stars: [], nat: S.p.nat }, op = { n: (isA ? '' : job.lvl + ' · ') + natName(oc), s: os, stars: [], nat: oc };
    const start = o >= (isA ? N.thr + 2 : youthThr(age) + 3) || R() < .5;
    const min = start ? 90 : (R() < .6 ? ri(15, 35) : 0);
    const home = R() < .5;
    return P(home ? me_ : op, home ? op : me_, home ? 'h' : 'a', min, { comp: isA ? (job.n ? 'Ligue des nations' : 'Match international') : 'Sélection ' + job.lvl, label: '', club: false, big: isA, repW: isA ? 1.8 : .6, intl: true, isA });
  }
  if (job.k === 'tour') {
    const T = S.W.tours[job.ti], N = nation();
    if (S.p.inj > 0) return Object.assign(P({ n: N.n, s: N.s, stars: [] }, { n: job.oppN, s: job.oppS, stars: [] }, 'h', 0, { comp: T.name, label: job.stage, club: false, neutral: true, intl: true, ko: job.stage !== 'Phase de groupes', isA: true, tour: true }));
    const start = OVR() >= N.thr + 1 || R() < .55;
    return P({ n: N.n, s: N.s, stars: [] }, { n: job.oppN, s: job.oppS, stars: [] }, 'h', start ? 90 : (R() < .65 ? ri(15, 40) : 0), { comp: T.name, label: job.stage, club: false, neutral: true, big: true, repW: 2.2, intl: true, isA: true, tour: true, ko: job.stage !== 'Phase de groupes' });
  }
  return null;
}
function resolveAgg(prep, r) { const mine = prep.agg.mine + (prep.side === 'h' ? r.hg : r.ag), th = prep.agg.th + (prep.side === 'h' ? r.ag : r.hg); if (mine === th && !r.pen) r.pen = R() < .5 ? 'h' : 'a'; if (mine !== th) r.pen = null; r.aggTxt = `Score cumulé : ${mine}-${th}`; r.aggWin = mine > th || (mine === th && r.pen === prep.side); }

// ---------- Après le match ----------
function afterMatch(job, prep, r) {
  const me = S.club.id, pst = r.p;
  const mine = prep.side === 'h' ? r.hg : r.ag, th = prep.side === 'h' ? r.ag : r.hg;
  const win = mine > th || (mine === th && r.pen === prep.side);
  const kind = prep.intl ? 'intl' : prep.youth ? prep.kindRec : 'club';
  recordMatch(prep, r, kind);
  if (prep.coach) mgrResult(prep, r, win, mine, th);
  if (prep.rivalDuel && S.rival) { const H = S.rival.h2h; if (win) H.w++; else if (mine === th && !r.pen) H.d++; else H.l++; }
  if (job.k === 'league') applyTable(job.lid, job.h, job.a, r.hg, r.ag);
  if (job.k === 'league' && prep.reserve) S.needReserve = true;
  if (job.k === 'cup') { const cup = S.W.cups[job.cc]; if (win) { cup.round++; if (job.idx === 5) { cup.alive = false; cup.winner = me; winTrophy(L_BY(myClub().lid).cup, myClub().n); } } else { cup.alive = false; cup.lostTo = prep.oppN; inbox('info', L_BY(myClub().lid).cup, `${myClub().n} est éliminé en ${CUP_ROUNDS[job.idx].toLowerCase()}.`); } }
  if (job.k === 'uclp') { const U = S.W.cl.UEFA; U.pts[me] = (U.pts[me] || 0) + (mine > th ? 3 : mine === th ? 1 : 0); }
  if (job.k === 'ko') {
    const C = S.W.cl[job.conf];
    if (job.leg === 1) { C.leg1 = C.leg1 || {}; C.leg1[me] = { mine, th }; }
    else { C.myWin = job.leg === 2 ? (r.aggWin ? me : 'opp') : (win ? me : 'opp'); if (r.aggTxt) S.dayLog.lines.push(r.aggTxt + (r.pen ? ' · tirs au but' : '') + '.'); }
  }
  if (job.k === 'youth' && S.club.kind === 'amateur' && pst && pst.min > 0 && pst.rt >= 7.1 && !S.pendingScout) {
    const ch = clamp(.03 + (OVR() - (34 + (S.p.age - 14) * 5.5)) * .013, .01, .3);
    if (R() < ch) scoutInvite();
  }
  if (job.k === 'intl' && pst && pst.min > 0) { if (prep.isA) { S.intl.caps++; S.intl.g += pst.g; } else { S.intl.ycaps++; S.intl.yg += pst.g; } S.intl.level = job.lvl; }
  if (job.k === 'tour') tourResult(job, prep, r, win);
  // conférence de presse après les grands matchs
  if (!prep.coach && pst && pst.min > 0 && !prep.youth && (prep.big || pst.rt >= 8.5 || pst.g >= 3) && (S.settings.interrupt !== 'key' || prep.big) && S.p.rep >= 8 && R() < .35) pressConference(win ? 'win' : mine < th ? 'loss' : 'draw', prep, pst);
  S.p.boost = 0;
}
function recordMatch(prep, r, kind) {
  const pst = r.p, p = S.p, log = S.dayLog;
  log.matches.push({ comp: prep.comp + (prep.label ? ' · ' + prep.label : ''), h: prep.h.n, a: prep.a.n, hg: r.hg, ag: r.ag, pen: r.pen, side: prep.side, p: pst, ev: r.ev, kind, agg: r.aggTxt, derby: prep.derby });
  if (!pst) return;
  p.energy -= pst.min > 0 ? Math.round(6 + pst.min / 12) : 1;
  if (pst.min > 0) {
    const ss = S.ss;
    if (kind !== 'intl' && kind !== 'reserve') { ss.apps++; ss.min += pst.min; ss.g += pst.g; ss.a += pst.a; ss.rs += pst.rt; if (pst.cs) ss.cs++; if (pst.min >= 60) ss.starts++; if (prep.cont) { ss.cl.apps++; ss.cl.g += pst.g; } }
    if (kind === 'club') { S.stats.proApps++; S.stats.proGoals += pst.g; if (pst.cs) S.stats.cs++; if (prep.derby) S.stats.derbyGoals += pst.g; const lid = myClub().lid; if (!S.stats.leagues.includes(lid)) S.stats.leagues.push(lid); }
    if (pst.g >= 3) { S.stats.hat++; if (kind !== 'youth') addNews('Exploit', `Triplé de ${pName()} ! (${prep.h.n} ${r.hg}-${r.ag} ${prep.a.n})`); }
    if (pst.rt >= 10) S.stats.tens++;
    const M = S.month; M.apps++; M.g += pst.g; M.a += pst.a; M.rs += pst.rt;
    S.cnt.m++; S.cnt.g += pst.g; S.cnt.a += pst.a; if (prep.big && pst.rt >= 7.5) S.cnt.big++;
    if (!prep.live) { const gp = GROUP[p.pos]; if (['DC', 'DL', 'MIL'].includes(gp) && pst.rt >= 6.5) S.cnt.stop += ri(0, 2); if (p.pos === 'GB') S.cnt.save += clamp(Math.round(pst.rt - 5), 0, 4); if (['AIL', 'BU', 'MIL'].includes(gp) && R() < .35) S.cnt.drib++; if (pst.g && R() < .1) S.cnt.fk++; if (pst.g && R() < .12) S.cnt.pen++; }
    if (kind === 'club' && !prep.live) { const yc = { DC: .14, MDC: .16, DL: .1, MC: .1, GB: .02 }[p.pos] ?? .05; if (R() < .006) { S.susp = (S.susp || 0) + 1; pst.card = 'R'; log.lines.push('Carton rouge : suspendu au prochain match.'); } else if (R() < yc) { pst.card = 'J'; S.yellows = (S.yellows || 0) + 1; if (S.yellows >= 5) { S.yellows = 0; S.susp = (S.susp || 0) + 1; log.lines.push('5e carton jaune : suspendu au prochain match.'); } } }
    p.forme = clamp(p.forme + 4, 0, 100);
    const lvl = kind === 'intl' ? 1 : S.club.kind === 'pro' ? clamp((myClub().s - 62) / 22, .15, 1.2) : .2;
    p.rep = clamp(p.rep + ((pst.rt - 6.4) * .12 + pst.g * .18 + pst.a * .1) * prep.repW * (prep.derby ? 1.3 : 1) * lvl * clamp((OVR() - 60) / 22, .05, 1.4), 0, 100);
    const mine = prep.side === 'h' ? r.hg : r.ag, th = prep.side === 'h' ? r.ag : r.hg;
    p.moral = clamp(p.moral + (mine > th ? 3 : mine < th ? -2 : 0) + (pst.rt >= 8 ? 3 : pst.rt < 5.5 ? -3 : 0), 0, 100);
    if (typeof shopEarnMatch === 'function') shopEarnMatch(pst, mine, th, prep);
    if (S.club.kind !== 'amateur' && kind === 'club') S.coach.rel = clamp(S.coach.rel + (pst.rt >= 7.6 ? 2 : pst.rt < 5.6 ? -2 : 0), 0, 100);
    if (mine > th) S.mateRel = clamp(S.mateRel + 1, 0, 100);
    const key = ATTR.filter(k => POSW[p.pos][k]); trainGain({ [pick(key)]: .3, MEN: .12 }, pst.min / 90, log);
    const risk = (.008 + (p.energy < 25 ? .03 : 0) + (p.age > 31 ? .006 : 0)) * (has('prep') ? .6 : 1) * DF().inj;
    if (!prep.live && R() < risk * (hasPerk('iron') ? .6 : 1)) injure(log, 'en match');
    p.followers = Math.round(p.followers + pst.g * (5 + p.rep * 15) + Math.max(0, pst.rt - 7) * (2 + p.rep * 5));
    if (R() < .35) feedPost(fanHandle(), pick(pst.rt >= 8 ? CMT.great : pst.rt >= 6.8 ? CMT.good : CMT.bad));
  } else if (kind === 'club' && p.inj <= 0) {
    S.benchStreak++; if (S.benchStreak >= 4) p.moral -= 2; if (R() < .15) feedPost(fanHandle(), pick(CMT.bench));
  }
  if (pst.min > 0 && kind === 'club') S.benchStreak = 0;
}
function winTrophy(name, clubN, extra) {
  S.trophies.push({ t: name, s: seasonLabel(S.season), c: clubN, coach: isCoach() || undefined });
  S.p.rep = clamp(S.p.rep + (/Ligue des champions|Coupe du monde/.test(name) ? 10 : /Euro|Copa|CAN|Gold/.test(name) ? 7 : 4), 0, 100);
  S.p.moral = clamp(S.p.moral + 15, 0, 100); S.p.followers = Math.round(S.p.followers + fameTarget() * .05 + 5000);
  addNews('Trophée', `${pName()} remporte : ${name} ${extra || ''}avec ${clubN} !`);
  feedPost(handle(), `${name} 🏆 Merci à tous ceux qui ont cru en moi.`, 'me');
  inbox('info', 'Trophée : ' + name, `Tu soulèves ${name} avec ${clubN}. ${S.fam.sac ? 'Tes parents, qui se sont tant sacrifiés, sont en tribune.' : ''}`);
  if (name !== 'Ballon d\'Or' && typeof feteQueue === 'function') feteQueue({ k: 'titre', name, club: clubN, season: seasonLabel(S.season) }); // la grande soirée du titre (fete.js)
}
const handle = () => '@' + (S.p.first + S.p.last).toLowerCase().replace(/[^a-z0-9]/g, '');
const HANDLES = ['ultra_', 'fan2', 'le_vrai_', 'kop_', 'tribune_', 'scout_', 'foot_'];
function fanHandle() { const c = myClub(); const tag = (c ? c.n.split(' ').pop() : S.p.city).toLowerCase().replace(/[^a-z]/g, '').slice(0, 8); return '@' + pick(HANDLES) + tag + ri(1, 99); }
const CMT = {
  great: ['Quel match ! Il est déjà au-dessus du lot.', 'On a un crack chez nous.', 'Ce garçon ira très loin.', 'Note : 10/10. Rien à dire.', 'Il faut le blinder tout de suite.'],
  good: ['Solide aujourd\'hui.', 'Belle prestation, continue comme ça.', 'De mieux en mieux.', 'Content de le voir jouer.'],
  bad: ['Pas son jour…', 'Il doit élever son niveau.', 'Trop discret aujourd\'hui.', 'On attend plus de lui.'],
  bench: ['Faites-le jouer !', 'Pourquoi il reste sur le banc ?', 'Libérez-le, il mérite du temps de jeu.'],
};
function fameTarget() {
  const p = S.p, big = S.trophies.filter(t => /Ballon|Coupe du monde|Ligue des champions|Euro|Copa|CAN/.test(t.t)).length;
  return (300 + Math.pow(p.rep, 3) * 40) * (1 + Math.min(big, 10) * .1) * (1 + (S.club.kind === 'pro' ? (myClub().s - 70) / 40 : 0));
}

// ---------- Coupes d'Europe ----------
function myCont() { return proLike() && S.club.id ? contOf(myClub().lid) : null; }
function finishLeaguePhase() {
  const U = S.W.cl.UEFA; if (U.lpDone) return; U.lpDone = true;
  const ranked = U.teams.map(id => {
    if (id === S.club.id && U.pts[id] !== undefined) return { id, pts: U.pts[id] + rf(0, .5) };
    let pts = 0; const t = team(id);
    for (let k = 0; k < 8; k++) { const o = team(pick(U.teams)); const m = simMatch(t, o, { neutral: true }); pts += m.hg > m.ag ? 3 : m.hg === m.ag ? 1 : 0; }
    return { id, pts: pts + rf(0, .5) };
  }).sort((a, b) => b.pts - a.pts);
  U.rank = ranked.map(x => x.id); U.direct = U.rank.slice(0, 8); U.playoff = U.rank.slice(8, 24); U.alive = U.rank.slice(0, 24);
  if (U.teams.includes(S.club.id)) { const pos = U.rank.indexOf(S.club.id) + 1; inbox('info', 'Ligue des champions', `Fin de la phase de ligue : ${team(S.club.id).n} termine ${pos}e${pos <= 8 ? ', qualifié directement pour les 8es.' : pos <= 24 ? ', direction les barrages.' : ', éliminé.'}`); }
}
function drawKo(conf, key) {
  const C = S.W.cl[conf];
  if (conf !== 'UEFA' && key === 'po') return;
  if (!C.alive || C.alive.length < 2 || C.winner) { C.pairs = null; return; }
  const list = conf === 'UEFA' && key === 'po' ? shuffle((C.playoff || []).slice()) : shuffle(C.alive.slice());
  const pairs = []; for (let i = 0; i + 1 < list.length; i += 2) pairs.push([list[i], list[i + 1]]);
  C.pairs = pairs; C.key = key; C.leg1 = {}; C.myWin = null;
  const me = S.club.id;
  if (myCont() === conf && pairs.some(p => p.includes(me))) { const pr = pairs.find(p => p.includes(me)); inbox('info', CONT_CUP[conf] + ' · ' + KO_N[key], `Tirage au sort : ${team(me).n} affrontera ${team(pr[0] === me ? pr[1] : pr[0]).n}.`); }
}
function resolveKoRound(conf) {
  const C = S.W.cl[conf]; if (!C.pairs) return;
  const me = S.club.id, key = C.key, winners = [];
  for (const [x, y] of C.pairs) {
    if (myCont() === conf && (x === me || y === me)) { winners.push(C.myWin === me ? me : (x === me ? y : x)); continue; }
    if (key === 'f') { const m = simMatch(team(x), team(y), { ko: true, neutral: true }); winners.push(m.hg > m.ag ? x : m.hg < m.ag ? y : (m.pen === 'h' ? x : y)); continue; }
    const a1 = simMatch(team(x), team(y)), a2 = simMatch(team(y), team(x), { ko: true });
    const gx = a1.hg + a2.ag, gy = a1.ag + a2.hg;
    winners.push(gx > gy ? x : gx < gy ? y : (a2.pen === 'h' ? y : x));
  }
  if (myCont() === conf && C.pairs.some(p => p.includes(me)) && C.myWin !== me) addNews(CONT_CUP[conf], `${team(me).n} est éliminé en ${KO_N[key].toLowerCase()}.`);
  C.alive = conf === 'UEFA' && key === 'po' ? shuffle((C.direct || []).concat(winners)) : winners;
  C.pairs = null;
  if (key === 'f') {
    C.winner = winners[0];
    if (C.winner === me && myCont() === conf) winTrophy(CONT_CUP[conf], team(me).n);
    else addNews(CONT_CUP[conf], `${team(C.winner).n} remporte la ${CONT_CUP[conf]} ${seasonLabel(S.season)}.`);
  }
}
function contStatus() {
  const conf = myCont(); if (!conf) return null;
  const C = S.W.cl[conf];
  if (!(C.teams || []).includes(S.club.id)) return { conf, txt: 'Non qualifié cette saison' };
  if (C.winner) return { conf, txt: C.winner === S.club.id ? 'Vainqueur !' : 'Vainqueur : ' + team(C.winner).n };
  if (conf === 'UEFA' && !C.lpDone) return { conf, txt: 'Phase de ligue · ' + (C.pts[S.club.id] || 0) + ' pts' };
  return { conf, txt: (C.alive || []).includes(S.club.id) ? 'Encore en course' : 'Éliminé' };
}

// ---------- Sélection nationale ----------
function youthThr(age) { return nation().thr - 26 + (age - 15) * 4; }
function roleFactor() { const r = S.club.role || ''; if (S.club.kind === 'amateur') return S.club.free ? 0 : .35; if (S.club.kind === 'academy') return .9; return r.startsWith('Star') || r === 'Titulaire' ? 1 : r === 'Rotation' ? .8 : r === 'Remplaçant' ? .45 : .15; }
function decideCallup() {
  if (S.p.inj > 0 || isCoach()) return null;
  const N = nation(), o = OVR(), age = S.p.age;
  const pA = clamp((o - N.thr + 5) / 8, 0, .97) * roleFactor();
  let level = null;
  if (R() < pA) level = 'A';
  else if (age <= 21) { const pY = clamp((o - youthThr(age) + 4) / 8, 0, .95) * roleFactor(); if (R() < pY) level = age <= 17 ? 'U17' : age <= 19 ? 'U19' : 'Espoirs'; }
  if (!level) return null;
  if (level === 'A' && !S.intl.debut) {
    S.intl.debut = true;
    queueEvent({ title: 'Première convocation', text: `${N.coach}, le sélectionneur, te convoque pour la première fois en équipe nationale (${N.n}). Toute ta ville est en fête.`, ch: [{ t: 'Un rêve d\'enfant', f: () => { S.p.moral = 100; S.fam.dad.rel += 5; S.fam.mom.rel += 5; return 'Ta mère t\'appelle en pleurant. Ton père encadre la convocation.'; } }] });
  }
  inbox('info', 'Convocation · ' + (level === 'A' ? N.n : N.n + ' ' + level), `${level === 'A' ? N.coach + ' te convoque' : 'Tu es convoqué avec la sélection ' + level} pour la trêve internationale : matchs jeudi et dimanche.`);
  return level;
}

// ---------- Tournois internationaux (calendrier jour par jour) ----------
const CONT_T = { UEFA: 'Euro', CONMEBOL: 'Copa América', CAF: 'CAN', CONCACAF: 'Gold Cup' };
function tourneyFor(y, conf) { if (y % 4 === 2 && y >= 2030) return 'WC'; if ((conf === 'UEFA' || conf === 'CONMEBOL') && y % 4 === 0) return 'CONT'; if ((conf === 'CAF' || conf === 'CONCACAF') && y % 2 === 1) return 'CONT'; return null; }
function allNations() { const a = []; for (const k in NATIONS) a.push({ k, n: NATIONS[k].n, s: NATIONS[k].s, conf: NATIONS[k].conf }); for (const k in OTHER_NATIONS) { const [n, s, conf] = OTHER_NATIONS[k]; a.push({ k, n, s, conf }); } return a; }
const TOUR_OFF = { g: [2, 6, 10], gEnd: 11, 16: 15, 8: 19, 4: 23, 2: 27 };
const STAGE_N = { 16: '8es de finale', 8: 'Quarts de finale', 4: 'Demi-finale', 2: 'Finale' };
function createTournaments() {
  const y = S.season + 1; S.W.tours = [];
  const kinds = []; if (y % 4 === 2 && y >= 2030) kinds.push(['WC', null]);
  for (const conf of ['UEFA', 'CONMEBOL', 'CAF', 'CONCACAF']) if (tourneyFor(y, conf) === 'CONT') kinds.push(['CONT', conf]);
  for (const [kind, conf] of kinds) {
    const name = kind === 'WC' ? 'Coupe du monde ' + y : CONT_T[conf] + ' ' + y;
    const pool = allNations().filter(n => kind === 'WC' || n.conf === conf); pool.forEach(n => n.r = n.s + rf(-5, 5)); pool.sort((a, b) => b.r - a.r);
    const size = kind === 'WC' ? 32 : pool.length >= 16 ? 16 : 8;
    const field = shuffle(pool.slice(0, size).map(n => ({ k: n.k, n: n.n, s: n.s })));
    const groups = []; for (let i = 0; i < field.length; i += 4) groups.push(field.slice(i, i + 4).map(n => n.k));
    const T = { name, kind, conf, start: absDay(), field, groups, res: {}, alive: null, done: false, mine: false, inField: field.some(n => n.k === S.p.nat), log: [], champ: null };
    if (T.inField && !isCoach()) {
      const sel = !isCoach() && S.p.inj <= 0 && (S.intl.caps > 0 || OVR() >= nation().thr - 1) && R() < clamp((OVR() - nation().thr + 5) / 7, 0, .98) * Math.max(.5, roleFactor());
      T.mine = sel;
      queueEvent({ title: name, text: sel ? `${nation().coach} te retient dans la liste des ${kind === 'WC' ? 26 : 23} pour le tournoi. Premier match dans quelques jours.` : `${nation().n} est qualifiée, mais ${nation().coach} ne t'a pas retenu. Tu suivras le tournoi devant ta télé.`, ch: [{ t: sel ? 'Allez !' : 'Dommage…', f: () => null }] });
    }
    // matchs de groupe hors joueur
    for (const g of groups) for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const A = g[i], B = g[j]; if (T.mine && (A === S.p.nat || B === S.p.nat)) continue; const m = simMatch(natTeam(A), natTeam(B), { neutral: true }); T.res[A + '-' + B] = [m.hg, m.ag]; }
    S.W.tours.push(T);
  }
}
function natTeam(k) { const x = NATIONS[k] ? { n: NATIONS[k].n, s: NATIONS[k].s } : { n: OTHER_NATIONS[k][0], s: OTHER_NATIONS[k][1] }; return { n: x.n, s: x.s, stars: [], k }; }
function tourFixturesOn(d) {
  const out = []; if (!S.W.tours) return out;
  S.W.tours.forEach((T, ti) => {
    if (!T.mine || T.done) return;
    const off = absDay() - T.start + (d - S.day);
    const g = T.groups.find(x => x.includes(S.p.nat));
    const gi = TOUR_OFF.g.indexOf(off);
    if (gi >= 0 && !T.alive) { const opps = g.filter(k => k !== S.p.nat); const o = opps[gi]; out.push({ k: 'tour', ti, stage: 'Phase de groupes', opp: o, oppN: natTeam(o).n, oppS: natTeam(o).s, gm: true }); }
    if (T.alive && T.alive.includes(S.p.nat)) { const n = T.alive.length; if (TOUR_OFF[n] === off && T.pairs) { const pr = T.pairs.find(p => p.includes(S.p.nat)); if (pr) { const o = pr[0] === S.p.nat ? pr[1] : pr[0]; out.push({ k: 'tour', ti, stage: STAGE_N[n], opp: o, oppN: natTeam(o).n, oppS: natTeam(o).s }); } } }
  });
  return out;
}
function tourDayJobs(jobs) {
  if (!S.W.tours) return;
  S.W.tours.forEach((T, ti) => {
    if (T.done) return;
    const off = absDay() - T.start;
    if (off === TOUR_OFF.gEnd) jobs.push({ k: 'tourStage', ti, stage: 'groups' });
    for (const n of [16, 8, 4, 2]) if (TOUR_OFF[n] === off) jobs.push({ k: 'tourStage', ti, stage: n });
    if (!T.mine && off === TOUR_OFF[2] + 1) jobs.push({ k: 'tourStage', ti, stage: 'auto' });
  });
}
function tourStage(ti, stage) {
  const T = S.W.tours[ti]; if (T.done) return;
  if (stage === 'auto') { // tournoi sans le joueur : tout simuler
    if (!T.alive) groupsToKo(T);
    while (T.alive.length > 1) { makePairs(T); playPairs(T, true); }
    finishTour(T); return;
  }
  if (stage === 'groups') { groupsToKo(T); makePairs(T); return; }
  if (T.alive && T.alive.length === stage) { if (!T.pairs) makePairs(T); playPairs(T, false); if (T.alive.length === 1) finishTour(T); else makePairs(T); }
}
function groupsToKo(T) {
  const ko = [], ords = T.groups.map(g => { const pts = {}; g.forEach(k => pts[k] = 0); for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const r = T.res[g[i] + '-' + g[j]] || [0, 0]; if (r[0] > r[1]) pts[g[i]] += 3; else if (r[0] < r[1]) pts[g[j]] += 3; else { pts[g[i]]++; pts[g[j]]++; } } return g.slice().sort((a, b) => pts[b] - pts[a] + rf(-.1, .1)); });
  for (let i = 0; i < ords.length; i += 2) ko.push(ords[i][0], ords[i + 1][1], ords[i + 1][0], ords[i][1]);
  T.alive = ko;
  if (T.inField && !ko.includes(S.p.nat)) { T.out = 'en phase de groupes'; inbox('info', T.name, `${nation().n} est éliminée en phase de groupes.`); }
}
function makePairs(T) { T.pairs = []; for (let i = 0; i + 1 < T.alive.length; i += 2) T.pairs.push([T.alive[i], T.alive[i + 1]]); }
function playPairs(T, all) {
  const nx = [], n = T.alive.length;
  for (const [A, B] of T.pairs) {
    const mineP = T.mine && (A === S.p.nat || B === S.p.nat);
    if (mineP && !all) { nx.push(T.myWin === S.p.nat ? S.p.nat : (A === S.p.nat ? B : A)); continue; }
    const m = simMatch(natTeam(A), natTeam(B), { neutral: true, ko: true });
    const w = m.hg > m.ag ? A : m.hg < m.ag ? B : (m.pen === 'h' ? A : B); nx.push(w);
    if (T.inField && (A === S.p.nat || B === S.p.nat) && w !== S.p.nat) T.out = 'en ' + (STAGE_N[n] || '').toLowerCase();
  }
  if (T.mine && T.pairs.some(p => p.includes(S.p.nat)) && T.myWin !== S.p.nat && !all) T.out = 'en ' + (STAGE_N[n] || '').toLowerCase();
  T.alive = nx; T.pairs = null; T.myWin = null;
}
function finishTour(T) {
  T.done = true; T.champ = T.alive[0];
  const cn = natTeam(T.champ).n;
  S.W.lastTour = S.W.lastTour || {}; S.W.lastTour[T.kind === 'WC' ? 'WC' : T.conf] = T.champ;
  if (T.mine && T.champ === S.p.nat) winTrophy(T.kind === 'WC' ? 'Coupe du monde' : CONT_T[T.conf], nation().n, (S.season + 1) + ' ');
  else addNews(T.name, `${cn} remporte la ${T.name}.`);
  if (T.inField) inbox('info', T.name, `Vainqueur : ${cn}.${T.out ? ' ' + nation().n + ' a été éliminée ' + T.out + '.' : ''}`);
  if (T.mine && T.kind === 'WC') S.intl.wcs++;
}
function tourResult(job, prep, r, win) {
  const T = S.W.tours[job.ti];
  if (job.gm) T.res[S.p.nat + '-' + job.opp] = [r.hg, r.ag];
  else T.myWin = win ? S.p.nat : job.opp;
  if (r.p && r.p.min > 0) { S.intl.caps++; S.intl.g += r.p.g; }
}

// ---------- Recruteurs & essais ----------
const NAT_LEAGUE = { FRA: 'FRA', ESP: 'ESP', ENG: 'ENG', GER: 'GER', ITA: 'ITA', POR: 'POR', NED: 'NED', USA: 'USA' };
const EU_NAT = ['FRA', 'ESP', 'ITA', 'GER', 'POR', 'NED', 'BEL', 'CRO'];
const EU_CC = ['FRA', 'ESP', 'ITA', 'GER', 'POR', 'NED'];
const EUROPE_CC = ['FRA', 'ESP', 'ITA', 'GER', 'POR', 'NED', 'ENG', 'TUR'];
function acadThr(c, age) { return c.s - 36 + (age - 14) * 4.6 + DF().trial; }
function proThr(c) { return c.s - 13 + DF().trial + (L_BY(c.lid).tier === 2 ? 3 : 0); }
function joinRule(cid) {
  const c = club(cid), age = S.p.age, nat = S.p.nat;
  if (NAT_LEAGUE[nat] === c.cc) return { ok: true };
  if (age >= 18) return { ok: true };
  if (S.flags.famMoved === c.city) return { ok: true };
  if (age >= 16 && EU_NAT.includes(nat) && EU_CC.includes(c.cc)) return { ok: true, note: 'Autorisé dès 16 ans dans l\'Union européenne.' };
  return { ok: false, note: 'Règle FIFA : transfert international interdit avant 18 ans, sauf si ta famille déménage avec toi.' };
}
function distClass(cid) {
  const c = club(cid);
  if (c.city === S.p.city) return 'local';
  if (NAT_LEAGUE[S.p.nat] === c.cc) return 'nat';
  const homeEU = nation().conf === 'UEFA' || ['MAR', 'ALG'].includes(S.p.nat);
  if (homeEU && EUROPE_CC.includes(c.cc)) return 'eu';
  return 'far';
}
function travelOptions(cid) {
  const d = distClass(cid), minor = S.p.age < 16, mult = minor ? 2 : 1;
  const T = { local: [['Transports en commun', 6, 0, 0]], nat: [['Bus de nuit', 30, -1, -2], ['Train', 80, 0, 0], ['Avion', 130, 0, 0]], eu: [['Bus de nuit', 80, -1, -4], ['Train', 170, 0, 0], ['Avion low-cost', 150, 0, -1]], far: [['Avion long-courrier', 950, 0, -3]] }[d];
  const nights = d === 'local' ? 0 : 2;
  return T.map(([n, price, extraN, fat]) => ({ n, cost: Math.round(price * 2 * mult + (nights + extraN) * 45 * mult), fat, d, minor }));
}
function scoutInvite() {
  const age = S.p.age, o = OVR();
  const thr = c => age >= 18 ? proThr(c) : acadThr(c, age);
  const pool = Object.values(S.W.clubs).filter(c => joinRule(c.id).ok && thr(c) - o <= 5 && thr(c) - o >= -8 && !S.trialsDone.some(t => t.cid === c.id && absDay() - t.d < 180));
  if (!pool.length) return;
  const c = wpick(pool, x => (NAT_LEAGUE[S.p.nat] === x.cc ? 3 : 1) * (x.s - 58));
  S.pendingScout = true; S.flags.scouted = true; S.flags.scoutedSeason = S.season;
  queueEvent({ title: 'Un recruteur t\'a repéré !', text: `Après ton match, un recruteur de ${c.n} (${L_BY(c.lid).name}) t'invite à un essai. Le club paie le voyage.`, ch: [
    { t: 'Accepter l\'essai', f: () => { S.pendingScout = false; startTrial(c.id, { n: 'Voyage payé par le club', cost: 0, fat: 0 }); return null; } },
    { t: 'Refuser', f: () => { S.pendingScout = false; return 'Tu préfères rester ici pour l\'instant.'; } }] });
}
const TRIAL_MOMENTS = [
  { q: 'Match d\'essai, 30e minute : tu reçois le ballon à 25 mètres du but.', o: [['Frapper en force', 'TIR'], ['Dribbler le défenseur', 'DRI'], ['Chercher la passe décisive', 'PAS']] },
  { q: 'Le coach te demande de jouer à un poste qui n\'est pas le tien.', o: [['Accepter avec le sourire', 'MEN', 2], ['Expliquer poliment que tu es meilleur à ton poste', 'RISK']] },
  { q: 'Test physique : sprints et navettes chronométrés.', o: [['Tout donner', 'VIT'], ['Gérer ton effort pour finir fort', 'END']] },
  { q: 'Un joueur du centre te met un coup en traître pendant l\'opposition.', o: [['Répondre physiquement', 'PHY', -3], ['Ignorer et lui mettre un petit pont', 'TEC']] },
  { q: 'Exercice de conservation sous pression devant les recruteurs.', o: [['Jouer simple et propre', 'PAS', 1], ['Tenter un geste technique', 'DRI']] },
  { q: 'Duel en un contre un face au meilleur attaquant du centre.', o: [['Tacle engagé', 'DEF'], ['Temporiser et lire le jeu', 'MEN']] },
  { q: 'Séance de penalties à la fin de l\'entraînement.', o: [['Placer en force', 'TIR'], ['Panenka pour impressionner', 'RISKT']] },
  { q: 'Entretien avec le directeur du centre : « Pourquoi toi ? »', o: [['Parler de ta famille et de ton envie', 'MEN', 2], ['Dire que tu seras le meilleur du monde', 'RISK']] },
];
const GK_MOMENT = { q: 'Exercice de tirs face aux attaquants du centre.', o: [['Rester sur ta ligne', 'GAR'], ['Sortir au-devant des tireurs', 'GAR']] };
function startTrial(cid, tr) {
  const pool = shuffle(TRIAL_MOMENTS.slice()).slice(0, 2);
  pool.push(S.p.pos === 'GB' ? GK_MOMENT : pick(TRIAL_MOMENTS.filter(m => !pool.includes(m))));
  S.trial = { cid, tr, step: 0, score: 0, moments: pool.map(m => TRIAL_MOMENTS.indexOf(m) >= 0 ? TRIAL_MOMENTS.indexOf(m) : 'GK'), log: [] };
  if (tr.cost) spend(tr.cost, 'Voyages pour les essais');
  S.p.energy -= 15;
  S.trialsDone.push({ cid, d: absDay() }); S.lastTrialD = absDay();
}
function trialAnswer(i) {
  const T = S.trial, m = T.moments[T.step] === 'GK' ? GK_MOMENT : TRIAL_MOMENTS[T.moments[T.step]];
  const [lab, key, bonus] = m.o[i];
  const c = club(T.cid), need = acadThr(c, S.p.age) + 6;
  let d, txt;
  let ok;
  if (key === 'RISK') { ok = R() < .45; d = ok ? 3 : -3; txt = ok ? 'Ta confiance plaît beaucoup.' : 'Ça passe mal, on te trouve arrogant.'; }
  else if (key === 'RISKT') { ok = R() < .35 + (S.p.at.TEC - need) / 60; d = ok ? 5 : -5; txt = ok ? 'Le geste parfait. Tout le monde applaudit.' : 'Le gardien bloque sans bouger. Silence gêné.'; }
  else { const v = S.p.at[key], pr = clamp(.45 + (v - need) / 35, .08, .93); ok = R() < pr; d = (ok ? 4 : -2) + (bonus || 0); txt = ok ? `Réussi ! (${ATTR_N[key]})` : `Raté… (${ATTR_N[key]} encore un peu juste)`; }
  T.score += d; T.log.push({ q: m.q, a: lab, d, txt }); T.step++;
  return { d, txt, ok };
}
function trialResult() {
  const T = S.trial, c = club(T.cid), age = S.p.age;
  const score = OVR() + T.score + T.tr.fat + rf(-3, 3) + (S.p.energy < 30 ? -3 : 0);
  const thrA = acadThr(c, age), thrP = proThr(c);
  let res;
  if (age >= 17 && score >= thrP) res = { kind: 'pro', wage: Math.round(marketWage(OVR(), c.lid) * .55 * (1 + agentNego())), years: 3 };
  else if (age <= 19 && score >= thrA) res = { kind: 'academy', wage: Math.round(40 + (c.s - 60) * 6), years: 3 };
  else res = { kind: 'no', gap: Math.max(1, Math.round((age <= 19 ? thrA : thrP) - score)) };
  res.score = Math.round(score); res.cid = T.cid;
  return res;
}
function joinClub(cid, kind, wage, years, fee, opt = {}) {
  const c = club(cid), prev = S.club;
  if (S.ss.apps > 0 && prev.n) S.hist.push(histRow());
  const moving = c.city !== S.p.city;
  S.club = { kind, id: cid, n: c.n, wage, until: S.season + years - (S.week >= 43 ? 0 : 1), since: S.season, num: prev.num || S.p.favNum, captain: false, promise: false, clause: 0 };
  S.coach = kind === 'academy' ? { n: genName(LEAGUE_NAT[c.cc] || 'FRA') + ' (directeur du centre)', rel: 60 } : { n: c.coach, rel: 58 + (S.agent ? S.agent.nego * 20 : 0) };
  S.mateRel = 55; S.transferReq = false; S.benchStreak = 0; S.pendingPro = false;
  S.ss = newSS(c.n);
  if (moving && S.p.age < 18 && NAT_LEAGUE[S.p.nat] !== c.cc) S.flags.moved = true;
  buildSquad(); buildMates();
  S.club.role = computeRole(); genObjectives();
  if (kind === 'academy') { addNews('Centre de formation', `${pName()} intègre le centre de formation de ${c.n}.`); S.flags.academy = true; }
  else { addNews('Officiel', `${pName()} signe à ${c.n}${fee ? ' pour ' + eur(fee) : ''} (contrat jusqu'en juin ${S.club.until + 1}, ${eur(monthly(wage))} par mois).`); S.flags.pro = true; if (fee >= 1e8) S.flags.fee100 = true; S.pendingNum = true; S.club.pres = 0; }
  if (moving) { S.fam.mom.rel = clamp(S.fam.mom.rel - 3, 0, 100); feedPost('Maman', kind === 'academy' ? 'Mon bébé quitte la maison… Sois sérieux là-bas, on t\'aime.' : 'Nouvelle aventure, on est derrière toi !'); }
  S.p.moral = clamp(S.p.moral + 10, 0, 100);
  if (kind === 'pro' && S.plan.filter(a => a && a.k === 'train').length < 3) S.plan = defaultPlan('pro');
  if (opt.loanFrom) S.club.loanFrom = opt.loanFrom;
  buildWeek();
}
function histRow() { const s = S.ss; return { s: seasonLabel(S.season), c: S.club.n + (S.club.kind === 'academy' ? ' (formation)' : S.club.kind === 'amateur' ? ' (amateur)' : ''), ap: s.apps, g: s.g, a: s.a, avg: s.apps ? Math.round(s.rs / s.apps * 10) / 10 : 0 }; }

// ---------- Agent ----------
const AGENCIES = ['Elite Foot Management', 'Prime Sport Agency', 'Horizon Football', 'Stellar Pro Sports', 'Atlas Players Group', 'Nova Talent', 'Crescendo Sports', 'Blue Line Agency'];
function agentNego() { return S.agent ? S.agent.nego : -.1; }
function agentNet() { return S.agent ? S.agent.net : .45; }
function agentCandidates() {
  const p = S.p, list = [];
  list.push({ kind: 'parent', n: S.fam.dad.n, t: 'Ton père', comm: 0, net: .55, nego: -.05, stars: 1 });
  list.push({ kind: 'parent', n: S.fam.mom.n, t: 'Ta mère', comm: 0, net: .5, nego: 0, stars: 1 });
  list.push({ kind: 'friend', n: S.friend.n, t: 'Ton meilleur ami', comm: 3, net: .6, nego: .02, stars: 1 });
  const lvl = clamp(Math.floor(p.rep / 20) + (OVR() >= 70 ? 1 : 0), 1, 5);
  for (let i = 0; i < 3; i++) { const st = clamp(lvl - i + ri(-1, 0), 1, 5); list.push({ kind: 'pro', n: genName(pick(['FRA', 'ESP', 'POR', 'ITA', 'ENG'])), t: pick(AGENCIES), comm: 5 + st * 1.5 + ri(0, 2), net: .7 + st * .25, nego: .03 + st * .05, stars: st }); }
  return list;
}
function setAgent(c) { if (S.agent && S.agent.kind === 'parent') S.fam.dad.rel -= 3; S.agent = c; if (c.kind === 'parent') { S.fam.dad.rel += 5; S.fam.mom.rel += 5; } if (c.kind === 'friend') S.friend.rel += 8; }

// ---------- Transferts & négociation ----------
function windowOpen() { return SUMMER(S.week) || WINTER(S.week); }
function estRole(c) { const o = OVR(); return o >= c.s + 3 ? 'Titulaire indiscutable' : o >= c.s - 2 ? 'Titulaire probable' : o >= c.s - 7 ? 'Rotation' : o >= c.s - 13 ? 'Remplaçant' : 'Réserve'; }
function genOffers() {
  const free = S.club.kind === 'amateur' && S.p.age >= 17;
  if (S.club.kind === 'academy' || isCoach()) return;
  if (!free && !(S.club.kind === 'pro' && windowOpen())) return;
  S.offers = S.offers.filter(o => o.exp > absDay());
  const o = OVR(), age = S.p.age;
  let prob = (free ? .04 : .12) + S.p.rep / 260 + agentNet() * (free ? .05 : .08) + (S.transferReq ? .3 : 0);
  if (S.offers.length >= 4 || R() > prob) return;
  const pool = Object.values(S.W.clubs).filter(c => c.id !== S.club.id && o >= c.s - (free ? 9 : 9) && o <= c.s + 4 && !S.offers.some(x => x.cid === c.id));
  if (!pool.length) return;
  const c = wpick(pool, x => { let w = (x.s - 55) * (1 + agentNet() / 2) * (L_BY(x.lid).tier === 2 ? .6 : 1); if (x.cc === 'KSA') w *= age >= 28 ? 2.5 : .35; if (x.cc === 'USA') w *= age >= 30 ? 2 : .3; if (x.cc === 'TUR') w *= age >= 27 ? 1.3 : .6; return w; });
  const wage = Math.round(marketWage(o, c.lid) * (o < c.s - 8 ? .6 : 1) * (1 + agentNego()) * rf(.9, 1.25));
  const under = S.club.kind === 'pro' && S.club.until > S.season;
  const fee = under ? Math.round(marketValue(o, age) * rf(.85, 1.3) / 1e5) * 1e5 : 0;
  const loan = under && age <= 21 && o < myClub().s - 8 && R() < .5;
  const off = { id: absDay() + '-' + c.id, cid: c.id, wage: loan ? Math.max(S.club.wage, Math.round(wage * .7)) : wage, years: loan ? 1 : ri(2, 5), fee: loan ? 0 : fee, loan, kind: loan ? 'loan' : 'transfer', exp: absDay() + 21 };
  S.offers.push(off);
  inbox('offer', 'Offre de ' + c.n, `${c.n} (${L_BY(c.lid).name}) te propose ${loan ? 'un prêt' : 'un contrat'} : ${eur(monthly(off.wage))} par mois${off.fee ? ', indemnité ' + eur(off.fee) : ''}. Réponds dans l'onglet Carrière → Transferts.`, off.id);
  if (R() < .5) addNews('Rumeur', `Selon la presse, ${c.n} s'intéresse à ${pName()}${fee ? ' (environ ' + eur(fee) + ')' : ''}.`);
}
function negoStart(off) { return { wm: 1, years: off.years, bonus: 0, clause: false, starter: false }; }
function negoChance(off, t) {
  if (off.loan) return 1;
  const c = club(off.cid), o = OVR();
  const lev = clamp((o - c.s) / 10, -1, 1) + (S.club.kind === 'amateur' ? .1 : 0) + (off.kind === 'renew' && /Star|Titulaire/.test(S.club.role) ? .25 : 0);
  const starterOk = estRole(c).startsWith('Titulaire');
  const cost = (t.wm - 1) * 2.2 + t.bonus * .06 + (t.clause ? .22 : 0) + (t.starter ? (starterOk ? .08 : .45) : 0) + Math.abs(t.years - off.years) * .05;
  return clamp(.86 + lev * .35 + agentNego() * 1.5 - cost, .02, .98);
}
function negoTry(off, t) {
  const p = negoChance(off, t);
  off.pat = off.pat ?? 3;
  if (R() < p) return { ok: true };
  off.pat--;
  if (off.pat <= 0) { S.offers = S.offers.filter(x => x !== off); return { ok: false, end: true }; }
  const counter = Object.assign({}, t, { wm: Math.round((1 + (t.wm - 1) / 2) * 100) / 100, bonus: t.bonus >= 3 ? 1 : 0 });
  return { ok: false, counter };
}
function signOffer(off, t) {
  const c = club(off.cid), wage = Math.round(off.wage * t.wm);
  if (off.kind === 'renew') { S.club.wage = wage; S.club.until = S.season + t.years; S.coach.rel += 5; addNews('Contrat', `${pName()} prolonge à ${c.n} jusqu'en juin ${S.club.until + 1}.`); }
  else {
    if (S.club.kind === 'pro' && S.club.until > S.season && !off.loan && off.kind === 'transfer') {
      const key = /Titulaire|Star/.test(S.club.role) && !S.transferReq;
      const clauseOk = S.club.clause && off.fee >= S.club.clause;
      if (key && !clauseOk && R() < .3) { S.offers = S.offers.filter(x => x !== off); S.p.moral -= 6; return `${myClub().n} refuse de te laisser partir à ${c.n}. Tu es trop important.`; }
    }
    const loanFrom = off.loan ? { id: S.club.id, wage: S.club.wage, until: S.club.until } : null;
    joinClub(off.cid, 'pro', wage, t.years, off.fee, { loanFrom });
  }
  S.club.promise = !!t.starter;
  S.club.clause = t.clause ? Math.round(marketValue(OVR(), S.p.age) * 1.6 / 1e5) * 1e5 : 0;
  if (t.bonus) { const b = monthly(wage) * t.bonus; earn(b, 'Prime à la signature'); }
  S.offers = S.offers.filter(x => x.id !== off.id);
  if (off.kind !== 'renew') S.offers = [];
  return off.kind === 'renew' ? 'Prolongation signée !' : off.loan ? `Prêt d'une saison à ${c.n}.` : `Contrat signé : bienvenue à ${c.n} !`;
}
function renewalOffer() {
  const c = myClub(), w = Math.round(Math.max(S.club.wage * 1.1, marketWage(OVR(), c.lid) * (1 + agentNego())));
  const off = { id: 'renew-' + absDay(), cid: c.id, wage: w, years: 3, fee: 0, kind: 'renew', exp: absDay() + 60 };
  S.offers = S.offers.filter(o => o.kind !== 'renew'); S.offers.push(off);
  inbox('offer', 'Prolongation proposée', `${c.n} veut prolonger ton contrat : ${eur(monthly(w))} par mois pendant 3 saisons. Négocie dans Carrière → Transferts.`, off.id);
}
