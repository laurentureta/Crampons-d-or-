const fs = require('fs'), vm = require('vm');
const dir = __dirname + '/../src';
const files = ['data.js', 'core.js', 'sim.js', 'life.js', 'extra.js', 'me.js', 'live.js', 'comm.js'];
const code = 'const Math = globalThis.Math, Object = globalThis.Object, Array = globalThis.Array, JSON = globalThis.JSON;\n' + files.map(f => fs.readFileSync(dir + '/' + f, 'utf8')).join('\n');
const store = {};
const ctx = { console, Math, Date, JSON, btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary'), unescape, escape, encodeURIComponent, decodeURIComponent,
  localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } } };
vm.createContext(ctx);
const RUNS = +(process.argv[2] || 6), YEARS = +(process.argv[3] || 20);
const test = `
const out = [];
for (let run = 0; run < ${RUNS}; run++) {
  const nat = pick(Object.keys(NATIONS));
  newGame({ first: 'Test', last: 'Joueur' + run, nat, city: NATIONS[nat].cities[0], pos: pick(Object.keys(POS_N)), foot: 'Droit', fam: ri(0, 2), diff: run % 4, pref: run % 2 ? 'M' : 'F', num: 10 });
  S.settings.live = ['all', 'big', 'none'][run % 3];
  let proOvr = 0, days = 0, lives = 0, maxOvr = 0, minMoney = 0, firstPro = null, trials = 0, ev = 0;
  while (!S.over && days < 364 * ${YEARS}) {
    const r = stepDay();
    if (r.live) { lives++; liveAuto(S.live.M); liveEnd(); continue; }
    days++;
    let g = 0;
    while ((EVQ.length || S.trial || S.pendingNum) && g++ < 50) {
      if (EVQ.length) { const e = EVQ.shift(); ev++; const c = e.ch[ri(0, e.ch.length - 1)]; c.f(); continue; }
      if (S.trial) { while (S.trial.step < 3) { const T = S.trial; const m = T.moments[T.step] === 'GK' ? GK_MOMENT : TRIAL_MOMENTS[T.moments[T.step]]; trialAnswer(ri(0, m.o.length - 1)); } const res = trialResult(); if (res.kind !== 'no' && joinRule(res.cid).ok) joinClub(res.cid, res.kind, res.wage, res.years); S.trial = null; continue; }
      if (S.pendingNum) { S.club.num = ri(1, 99); S.pendingNum = false; }
    }
    if (S.day === 0) {
      // décisions hebdo de l'IA
      if (S.club.kind === 'pro' && !firstPro) { firstPro = S.p.age; proOvr = OVR(); }
      if (S.club.kind === 'amateur' && S.p.age >= 15 && absDay() - S.lastTrialD > 28 && S.p.inj <= 0) {
        const o = OVR(); const pool = Object.values(S.W.clubs).filter(c => joinRule(c.id).ok && (S.p.age >= 18 ? proThr(c) : acadThr(c, S.p.age)) - o <= 2);
        if (pool.length) { const c = pick(pool); const tr = travelOptions(c.id).sort((a, b) => a.cost - b.cost)[0]; if (S.p.money < tr.cost && S.fam.sac < 3) sacrifice(); if (S.p.money >= tr.cost) { startTrial(c.id, tr); trials++; } }
      }
      for (const off of S.offers.slice()) { if (R() < .5) { const t = negoStart(off); t.wm = 1.1; const rr = negoTry(off, t); if (rr.ok) signOffer(off, t); else if (rr.counter && R() < .7) signOffer(off, rr.counter); } }
      if (R() < .3) doPost(pick(Object.keys(POSTS)));
      if (S.p.age >= 18 && S.p.money > 600000 && !S.assets.houses.length) buy('houses', 'maison');
      if (S.p.money > 2e6 && !S.fam.house) buy('gifts', 'gparents');
      if (S.p.age >= 17 && !S.permis.ok && S.p.money > 300) { S.plan[3] = { k: 'drive' }; if (S.permis.h >= 24) permisExam(); }
      if (S.permis.ok && S.plan[3] && S.plan[3].k === 'drive') S.plan[3] = { k: 'train', s: 'TECH', i: 'N' };
      if (S.p.money > 1e6) invest('etf', S.p.money * .3);
      if (!S.agent && S.p.age >= 16) setAgent(agentCandidates()[3]);
      if (S.p.age >= 35 && S.club.kind === 'pro' && R() < .05) retire();
      if (planBOk() && S.p.age >= 24 && R() < .01) planB();
      maxOvr = Math.max(maxOvr, OVR()); minMoney = Math.min(minMoney, S.p.money);
    }
    if (days % 364 === 0) { save(); const code = exportSave(); const err = importSave(code, 2); if (err) throw new Error('import ' + err); }
  }
  let coach = '-';
  if (S.flags.pro && run % 2 === 0) {
    if (!S.over) retire();
    reconvert('coach'); let cd = 0;
    while (!S.over && cd < 364 * 8) {
      const r = stepDay(); if (r.live) { liveAuto(S.live.M); liveEnd(); continue; } cd++;
      let g = 0; while (EVQ.length && g++ < 50) { const e = EVQ.shift(); const c = e.ch[ri(0, e.ch.length - 1)]; c.f(); }
      if (S.day === 0 && S.club.id && windowOpen() && R() < .2) { const l = coachRecruitList(); if (l.length) coachSign(l[l.length - 1].s.n); }
      if (S.day === 0 && R() < .05) { S.mgr.tactic = pick(Object.keys(TACTICS)); S.mgr.focus = pick(Object.keys(FOCUS)); }
    }
    coach = S.mgr.w + '-' + S.mgr.d + '-' + S.mgr.l + ' tr' + S.trophies.filter(t => t.coach).length + ' ' + (S.club.n || '').slice(0, 14) + ' lim' + S.mgr.sacked;
    if (!S.over) endCoaching();
  }
  if (S.over && !S.ended) reconvert('family');
  out.push({ live: S.settings.live, pos: S.p.pos, nat: S.p.nat, diff: S.diff, age: S.p.age, ovr: OVR(), maxOvr, pot: S.p.pot, firstPro, proOvr, club: S.club.n, apps: S.stats.proApps, goals: S.stats.proGoals, caps: S.intl.caps, trophies: S.trophies.length, bdo: S.awards.filter(a => a.t === "Ballon d'Or").length, money: eur(wealth()), minMoney: Math.round(minMoney), foll: fnum(S.p.followers), ach: Object.keys(S.ach).length, lives, trials, ev, love: S.love ? S.love.st + '/' + S.love.kids.length : '-', permis: S.permis.ok, bac: S.school.bac, perks: Object.keys(S.perks).length, chal: S.stats.chal || 0, rival: Math.round(S.rival.o) + '/' + S.rival.g + 'b', coach });
}
out;
`;
const t0 = Date.now();
let res;
try { res = vm.runInContext(code + '\n' + test, ctx, { filename: 'game.js' }); }
catch (e) { console.error(e.stack.split('\n').slice(0, 8).join('\n')); process.exit(1); }
console.table(res.map(r => ({ pos: r.pos, ovr: r.maxOvr, apps: r.apps, g: r.goals, perks: r.perks, chal: r.chal, rival: r.rival, coach: r.coach })));
console.log('temps', ((Date.now() - t0) / 1000).toFixed(1) + 's');
