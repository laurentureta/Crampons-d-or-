const fs = require('fs'), vm = require('vm');
const els = {}; const mk = id => ({ id, innerHTML: '', className: '', textContent: '', style: {}, value: id === 'cFirst' ? 'Léo' : id === 'cLast' ? 'Martin' : '', setAttribute() { }, querySelector: () => null });
const el = id => els[id] || (els[id] = mk(id));
const store = {}; let errs = 0;
const ctx = { console: { log: console.log, error: (...a) => { errs++; console.log('ERR', ...a); }, warn() { } }, Math, Date, JSON, Promise, btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary'), unescape, escape, encodeURIComponent, decodeURIComponent,
  setTimeout: f => { f(); return 0; }, clearTimeout() { }, setInterval: () => 1, clearInterval() { },
  localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  document: { querySelector: s => el(s.replace('#', '')), addEventListener() { }, createElement: () => ({ getContext: () => null }) } };
ctx.window = { scrollTo() { } };
vm.createContext(ctx);
const code = 'const Math = globalThis.Math, Object = globalThis.Object, Array = globalThis.Array, JSON = globalThis.JSON;\n' + ['data.js', 'core.js', 'sim.js', 'life.js', 'extra.js', 'me.js', 'live.js', 'comm.js', 'audio.js', 'media.js', 'art.js', 'mview.js', 'intro.js', 'ui.js', 'ui2.js', 'ui3.js', 'ui4.js'].map(f => fs.readFileSync(__dirname + '/../src/' + f, 'utf8')).join('\n');
vm.runInContext(code + `\nglobalThis.__T = { ACT, UI, get S(){return S}, get MODAL(){return MODAL}, render, slotsMeta, exportSave, start };`, ctx);
const T = ctx.__T, A = (a, v) => { try { T.ACT[a](v); } catch (e) { errs++; console.log('ERREUR', a, e.stack.split('\n').slice(0, 4).join('\n')); } };
const chk = (c, m) => { if (!c) { errs++; console.log('ÉCHEC :', m); } };
const close = () => { let n = 30; while (T.MODAL && n--) A('mbtn', '0'); };
// carrière 1
A('newCareer'); A('wizNext'); A('wizNext'); A('wizNext'); A('wizNext'); A('introGo'); close();
for (let i = 0; i < 6; i++) { A('month'); close(); while (T.UI.screen === 'live') { A('lAuto'); A('lDone'); close(); } }
const date1 = T.S.week + '/' + T.S.day, name1 = T.S.p.last;
A('quitMenu'); chk(T.UI.screen === 'menu', 'retour menu');
chk(/Continuer/.test(el('app').innerHTML), 'bouton Continuer');
A('continue'); close(); chk(T.UI.screen === 'game' && T.S.week + '/' + T.S.day === date1, 'continuer reprend la partie');
// export puis import vers l'emplacement 3
const code1 = T.exportSave(); chk(code1.startsWith('CDO2'), 'code export');
A('quitMenu'); A('page', 'saves'); el('impCode').value = code1; A('import', '3'); close();
chk(T.UI.screen === 'game' && T.S.slot === 3 && T.S.p.last === name1, 'import vers slot 3');
chk(Object.keys(T.slotsMeta()).length === 2, 'deux emplacements remplis');
// nouvelle carrière -> slot 2
A('quitMenu'); A('newCareer'); A('wizNext'); A('wizNext'); A('cPos', 'GB'); A('wizNext'); A('wizNext'); A('introGo'); close();
chk(T.S.slot === 2 && T.S.p.pos === 'GB', 'nouvelle carrière slot 2');
A('next'); close(); while (T.UI.screen === 'live') { A('lAuto'); A('lDone'); close(); }
// slots pleins : nouvelle carrière demande lequel remplacer
A('quitMenu'); A('newCareer'); chk(T.MODAL && /pleins/.test(T.MODAL.title), 'choix emplacement à remplacer'); A('mbtn', String(T.MODAL.btns.length - 1));
// charger le slot 1
A('page', 'saves'); A('loadSlot', '1'); close(); chk(T.S.slot === 1 && T.S.p.last === name1, 'charger slot 1');
// hot reload
const snap = JSON.parse(JSON.stringify(T.S, (k, v) => k === 'ref' ? undefined : v)); T.start({ S: snap, screen: 'game' }); chk(T.UI.screen === 'game', 'hot reload');
// options et pages menu
A('quitMenu'); for (const p of ['help', 'options', 'credits', 'saves']) { A('page', p); chk(el('app').innerHTML.length > 500, 'page ' + p); A('toMenu'); }
A('page', 'options'); A('optLive', 'none'); A('optSpeed', '3'); A('toMenu');
A('delSlot', '3'); A('mbtn', '0'); chk(!T.slotsMeta()[3], 'suppression slot 3');
console.log(errs ? 'ÉCHEC menus · ' + errs : 'OK menus, sauvegardes, import/export, reprise');
