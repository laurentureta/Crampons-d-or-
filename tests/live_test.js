const fs = require('fs'), vm = require('vm');
const dir = __dirname + '/../src';
const code = 'const Math = globalThis.Math, Object = globalThis.Object, Array = globalThis.Array, Set = globalThis.Set, JSON = globalThis.JSON;\n' + ['data.js', 'core.js', 'sim.js', 'life.js', 'extra.js', 'me.js', 'live.js', 'comm.js'].map(f => fs.readFileSync(dir + '/' + f, 'utf8')).join('\n');
const ctx = { console, Date, process, localStorage: { getItem: () => null, setItem() { }, removeItem() { } } };
vm.createContext(ctx);
vm.runInContext(code + `
const rows = [];
for (const pos of (process.env.POS ? process.env.POS.split(',') : Object.keys(POS_N))) for (const lvl of (process.env.LVL ? process.env.LVL.split(',').map(Number) : [72, 82, 92])) {
  newGame({ first: 'T', last: 'T', nat: 'FRA', city: 'Paris', pos, foot: 'Droit', fam: 1, diff: 1, pref: 'F', num: 9 });
  for (const k of ATTR) S.p.at[k] = POSW[pos][k] ? lvl : lvl - 12;
  const cid = Object.values(S.W.clubs).filter(c => c.lid === 'FRA').sort((a, b) => Math.abs(a.s - (lvl - 2)) - Math.abs(b.s - (lvl - 2)))[0].id;
  joinClub(cid, 'pro', 1000, 3, 0);
  let g = 0, a = 0, rt = 0, n = 0, gfS = 0, gaS = 0, gfL = 0, gaL = 0;
  for (let i = 0; i < (+process.argv[2] || 400); i++) {
    const opp = pick(S.W.leagues.FRA.members.filter(x => x !== cid));
    const prep = { h: team(cid), a: team(opp), side: 'h', min: 90, ovr: OVR(), club: true, big: false, ko: false, neutral: false, comp: 'x', label: '' };
    const M = liveSetup(prep); liveAuto(M);
    const pst = { min: 90, g: M.g, a: M.a, rt: 0, cs: false }; finishRating(pst, { side: 'h', min: 90, ovr: OVR() }, prep.h, prep.a, M.hg, M.ag, M.succ, M.fail);
    g += M.g; a += M.a; rt += pst.rt; n++; gfL += M.hg; gaL += M.ag;
    const r = simMatch(prep.h, prep.a, { p: { side: 'h', min: 90, ovr: OVR() } }); gfS += r.hg; gaS += r.ag;
  }
  rows.push({ pos, lvl, club: club(cid).n + ' ' + club(cid).s, gpm: (g / n).toFixed(2), apm: (a / n).toFixed(2), rt: (rt / n).toFixed(2), live: (gfL / n).toFixed(2) + '-' + (gaL / n).toFixed(2), sim: (gfS / n).toFixed(2) + '-' + (gaS / n).toFixed(2) });
}
console.table(rows);
`, ctx);
