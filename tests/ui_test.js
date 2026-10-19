const fs = require('fs'), vm = require('vm');
const els = {};
const mk = id => ({ id, innerHTML: '', className: '', textContent: '', style: {}, value: id === 'cFirst' ? 'Kylian' : id === 'cLast' ? 'Testeur' : id === 'impCode' ? '' : '', setAttribute() { }, querySelector: () => null });
const el = id => els[id] || (els[id] = mk(id));
const store = {};
let errs = 0;
const cons = { log: console.log, error: (...a) => { errs++; console.log('console.error', ...a.map(x => x && x.stack ? x.stack.split('\n').slice(0, 5).join('\n') : x)); }, warn() { } };
const ctx = {
  console: cons, Math, Date, JSON, Promise, btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary'), unescape, escape, encodeURIComponent, decodeURIComponent,
  setTimeout: f => { f(); return 0; }, clearTimeout() { }, setInterval: () => 1, clearInterval() { },
  localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  document: { querySelector: s => el(s.replace('#', '')), addEventListener() { }, createElement: () => ({ getContext: () => null }) },
};
ctx.window = { scrollTo() { } };
vm.createContext(ctx);
const code = 'const Math = globalThis.Math, Object = globalThis.Object, Array = globalThis.Array, JSON = globalThis.JSON;\n' + ['data.js', 'core.js', 'sim.js', 'life.js', 'extra.js', 'me.js', 'live.js', 'comm.js', 'audio.js', 'media.js', 'art.js', 'mview.js', 'intro.js', 'ui.js', 'ui2.js', 'ui3.js', 'ui4.js'].map(f => fs.readFileSync(__dirname + '/../src/' + f, 'utf8')).join('\n');
vm.runInContext(code + `\nglobalThis.__T = { vm: (c) => eval(c), ACT, UI, get S(){return S}, get MODAL(){return MODAL}, render, OVR, slotsMeta };`, ctx, { filename: 'bundle.js' });
const T = ctx.__T;
let clicks = 0;
const seen = {};
function act(a, v) { clicks++; seen[a] = (seen[a] || 0) + 1; try { T.ACT[a](v); } catch (e) { errs++; console.log('ERREUR', a, v, '\n', e.stack.split('\n').slice(0, 5).join('\n')); } if (errs > 8) { console.log('trop d\'erreurs'); process.exit(1); } }
function actions(where) { const h = (where || ['app', 'ov']).map(k => el(k).innerHTML).join(''); const re = /data-a="([^"]+)"(?: data-v=(?:"([^"]*)"|'([^']*)'))?([^>]*)>/g; const out = []; let m; while ((m = re.exec(h))) if (!/disabled/.test(m[4])) out.push([m[1], (m[2] ?? m[3] ?? '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')]); return out; }
const pickR = a => a[Math.floor(Math.random() * a.length)];
function clearModals(n = 60) { while (T.MODAL && n-- > 0) { const btns = T.MODAL.btns.map((b, i) => [b, i]).filter(([b]) => !b.dis); const oa = actions(['ov']).filter(([x]) => x !== 'mbtn'); if (btns.length && !(oa.length && Math.random() < .4)) act('mbtn', String(pickR(btns)[1])); else if (oa.length) { const [x, v] = pickR(oa); act(x, v); } else { console.log('modale bloquée', T.MODAL.title); errs++; return; } } }
function playLive() { let g = 0; while (T.UI.screen === 'live' && g++ < 60) { const M = T.S.live && T.S.live.M; if (M && !M.pending && !M.press && !M.shoot && !M.done && !M.half && !T.UI.mg) { if (Math.random() < .08) { act('lAuto'); continue; } for (let i = 0; i < 130 && !M.pending && !M.shoot && !M.done && !M.half; i++) vm.runInContext('liveTick(S.live.M)', ctx); T.render(); } const a = actions(['app']).filter(([x]) => /^(l(Press|Choose|Shoot|Done|Half)|mg(Zone|Shoot|Dive)|cChoose)$/.test(x)); if (!a.length) { console.log('direct bloqué'); errs++; act('lAuto'); continue; } const [x, v] = pickR(a); act(x, v); clearModals(); } }

if (T.UI.screen !== 'menu') { console.log('écran initial', T.UI.screen); errs++; }
act('newCareer');
act('cNum', '7'); act('cFoot', 'Gauche'); act('wizNext');
const nat = process.argv[4] || pickR(['FRA', 'ESP', 'MAR', 'BRA', 'ENG', 'SEN', 'USA']);
act('cNat', nat); act('wizNext');
act('cPos', process.argv[2] || pickR(['BU', 'AIL', 'MC', 'DC', 'GB', 'MOC', 'DL', 'MDC'])); act('wizNext');
act('cFam', 'rnd'); act('cDiff', '1'); act('cPref', 'F'); act('wizNext');
if (T.UI.screen !== 'intro') { console.log('pas d\'intro', T.UI.screen); errs++; }
act('introGo'); clearModals();
const seasons = +(process.argv[3] || 10);
const SAFE_EX = ['newCareer', 'quitMenu', 'wipe', 'delSlot', 'retire', 'planB', 'breakup', 'agentFire', 'toMenu', 'page', 'continue', 'loadSlot', 'import', 'next', 'week', 'month', 'export', 'nRefuse', 'offerDec', 'amateur', 'endCoach'];
const tilesAll = ['goals', 'locker', 'rival', 'perks', 'curves', 'music', 'recruit', 'jobs', 'mgr', 'club', 'transfers', 'trials', 'agent', 'nat', 'comps', 'stats', 'world', 'money', 'family', 'love', 'friends', 'assets', 'invest', 'staff', 'school', 'sheet', 'card', 'social', 'ach', 'inbox', 'bdo', 'saves', 'options', 'help', 'settings'];
let loops = 0, coachFrom = 0, COACH2 = false; const COACH = process.argv[5] === 'coach';
while (T.S && T.S.season < 2026 + seasons && loops++ < 30000) {
  if (T.S.over) { if (!T.S.mgr && T.S.flags.pro && !COACH2) { COACH2 = true; act('reconv', 'coach'); clearModals(); coachFrom = T.S.season; continue; } break; }
  if (Math.random() < .5) act('tab', pickR(['home', 'agenda', 'career', 'life', 'profile']));
  if (Math.random() < .35) { act('open', pickR(tilesAll)); if (Math.random() < .5) act('back'); }
  const a = actions().filter(([x]) => !SAFE_EX.includes(x));
  for (let k = 0; k < 2 && a.length; k++) { const [x, v] = pickR(a); act(x, v); clearModals(); playLive(); }
  if (T.UI.screen === 'live') playLive();
  if (T.UI.screen !== 'game') { if (T.UI.screen !== 'live') { console.log('écran inattendu', T.UI.screen); errs++; T.UI.screen = 'game'; } }
  // essais
  if (T.S.club.kind === 'amateur' && T.S.p.age >= 15 && Math.random() < .05) { act('tab', 'career'); act('open', 'trials'); const tr = actions().filter(([x]) => x === 'tryClub'); if (tr.length) { act('tryClub', tr[tr.length - 1 - Math.floor(Math.random() * Math.min(6, tr.length))][1]); clearModals(); } act('back'); }
  if (T.S.offers.length && Math.random() < .3) { act('tab', 'career'); act('open', 'transfers'); act('nego', T.S.offers[0].id); act('nT', 'wm:1.1'); act(Math.random() < .6 ? 'nPropose' : 'nAccept'); clearModals(); }
  act('tab', 'home');
  act(pickR(['next', 'next', 'week', 'week', 'month'])); clearModals(); playLive(); clearModals();
  if (T.S.p.age >= 35 && T.S.week === 44 && !T.S.mgr) { act('retire'); clearModals(); }
  if (COACH && T.S.flags.pro && T.S.p.age >= 19 && !T.S.mgr) { T.vm('retire()'); act('reconv', 'coach'); clearModals(); coachFrom = T.S.season; }
  if (T.S.over && !T.S.mgr && T.S.flags.pro && !COACH2) { COACH2 = true; act('reconv', 'coach'); clearModals(); coachFrom = T.S.season; }
  if (T.S.mgr && coachFrom && T.S.season >= coachFrom + 4) { act('endCoach'); clearModals(); break; }
}
if (T.S.over) { act('reconv', 'family'); T.render(); const a = actions(); if (!a.length) { console.log('fin sans actions'); errs++; } }
console.log((errs ? 'ÉCHEC' : 'OK') + ' · clics', clicks, '· erreurs', errs, '· saison', T.S.season, 'sem', T.S.week, '· âge', T.S.p.age, '·', T.S.p.pos, '·', T.S.club.n, '· note', T.OVR(), '· matchs pro', T.S.stats.proApps, '· buts', T.S.stats.proGoals, '· trophées', T.S.trophies.length, '· live', seen.lDone || 0, '· coach', T.S.mgr ? T.S.mgr.w + '-' + T.S.mgr.d + '-' + T.S.mgr.l : '-', '· mg', (seen.mgShoot || 0) + (seen.mgDive || 0), '· sauvegarde', Math.round((store.cdo2_slot_1 || '').length / 1024) + ' Ko');
const miss = ['next', 'week', 'month', 'editDay', 'setAct', 'preset', 'open', 'back', 'lChoose', 'lDone', 'tryClub', 'nego', 'calSel'].filter(x => !seen[x]);
if (miss.length) console.log('jamais utilisés :', miss.join(', '));
