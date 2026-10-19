const fs = require('fs'), vm = require('vm');
const code = 'const Math = globalThis.Math, Object = globalThis.Object, Array = globalThis.Array, JSON = globalThis.JSON;\n' + ['data.js', 'core.js', 'sim.js', 'life.js', 'extra.js', 'me.js', 'live.js', 'comm.js'].map(f => fs.readFileSync(__dirname + '/../src/' + f, 'utf8')).join('\n');
const store = {}; const ctx = { console, Math, Date, JSON, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } } };
vm.createContext(ctx);
vm.runInContext(code + `
newGame({ first: 'Old', last: 'Save', nat: 'FRA', city: 'Paris', pos: 'BU', foot: 'Droit', fam: 1, diff: 1, pref: 'F', num: 9 });
for (let i = 0; i < 400; i++) { const r = stepDay(); if (r.live) { liveAuto(S.live.M); liveEnd(); } EVQ.length = 0; }
// simuler une sauvegarde v2 (sans les nouveaux champs)
const old = JSON.parse(JSON.stringify(S, (k, v) => k === 'ref' ? undefined : v));
for (const k of ['perks', 'cnt', 'curve', 'mates2', 'rival', 'obj', 'chal', 'toasts', 'yellows', 'susp', 'wkMinE']) delete old[k];
old.settings = { live: 'all', speed: 1 };
old.W.stars = old.W.stars.filter(s => !s.rival);
hydrate(old);
let ok = !!(S.rival && S.perks && S.cnt && S.obj && S.mates2.length && S.settings.mg === true);
for (let i = 0; i < 800; i++) { const r = stepDay(); if (r.live) { liveAuto(S.live.M); liveEnd(); } while (EVQ.length) { const e = EVQ.shift(); e.ch[0].f(); } }
console.log(ok ? 'OK migration v2 → v3' : 'ÉCHEC migration', '· saison', S.season, '· rival', S.rival.n, Math.round(S.rival.o), '· défis', S.stats.chal || 0, '· courbe', S.curve.length, 'points');
`, ctx);
