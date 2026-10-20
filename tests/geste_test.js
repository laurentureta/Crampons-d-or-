// Moments clés au doigt : on provoque des décisions (jeu, coup franc, corner, penalty), on joue le geste à la souris
// (événements pointeur) et on vérifie que le moteur reçoit bien le choix. Captures dans OUT. Site servi par tests/serve.js (TEST=1).
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.env.OUT || '/tmp/claude-0/geste'; fs.mkdirSync(OUT, { recursive: true });
const KINDS = (process.env.KINDS || 'att,fk,corner,pen').split(',');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: 390, height: 720 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const errs = []; pg.on('pageerror', e => errs.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | '))); pg.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|TUNNEL/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  await pg.addInitScript(() => { window.__GE_TIME = 90000; });
  await pg.route(/fonts\.googleapis|fonts\.gstatic|cdnjs|supabase/, r => r.abort());
  await pg.goto(process.env.URL || 'http://localhost:8775/');
  const click = async sel => { await pg.click(sel, { timeout: 40000 }); await pg.waitForTimeout(150); };
  const closeMods = async () => { for (let i = 0; i < 14; i++) { if (await pg.$('.ov [data-a=mbtn]')) await click('.ov [data-a=mbtn] >> nth=0'); else if (await pg.$('.ov [data-a=pickNum]:not([disabled])')) await click('.ov [data-a=pickNum]:not([disabled]) >> nth=0'); else break; } };
  await pg.waitForSelector('.menu', { timeout: 60000 });
  await click('[data-a=newCareer]'); await pg.fill('#cFirst', 'Lucas'); await pg.fill('#cLast', 'Moreau'); await click('[data-a=wizNext]'); await click('[data-a=wizNext]'); await click('[data-a=cPos][data-v=BU]'); await click('[data-a=wizNext]'); await click('[data-a=wizNext]');
  await pg.waitForSelector('[data-a=introGo]'); await pg.waitForTimeout(3600); await click('[data-a=introGo]'); await closeMods();
  await pg.evaluate(() => { const T = window.__T(); T.S.settings.live = 'all'; T.S.settings.mg = true; T.OPTS.geste = true; T.OPTS.cam = 'tv'; T.save(); });
  for (let k = 0; k < 60 && !(await pg.$('.live')); k++) { if (await pg.$('.ov .md')) { await closeMods(); continue; } await click('[data-a=nextMatch]:not([disabled]), [data-a=next]').catch(() => { }); }
  for (let k = 0; k < 10 && await pg.$('[data-a=lChoose]'); k++) await click('[data-a=lChoose] >> nth=0').catch(() => { });
  await pg.waitForFunction(() => window.__T().S.live && window.__T().S.live.M && window.__T().S.live.M.E, null, { timeout: 60000 }).catch(async () => { console.log('pas de match en direct', await pg.evaluate(() => [window.__T().UI.screen, !!window.__T().S.live])); });
  await pg.waitForTimeout(2500);
  // passe les écrans d'avant-match (micro tendu)
  for (let k = 0; k < 4 && await pg.$('[data-a=lPress]'); k++) await click('[data-a=lPress] >> nth=0').catch(() => { });
  const shot = async n => { const cdp = pg.__cdp || (pg.__cdp = await pg.context().newCDPSession(pg)); const r = await pg.evaluate(() => { const e = document.querySelector('.live'); const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; }); const s = await cdp.send('Page.captureScreenshot', { format: 'png', clip: Object.assign(r, { scale: 1 }) }); fs.writeFileSync(`${OUT}/${n}.png`, Buffer.from(s.data, 'base64')); };
  // provoque une décision du type voulu, puis amène l'affichage dessus
  const force = kind => pg.evaluate(kind => {
    const T = window.__T(), M = T.S.live.M, E = M.E; M.pending = null; M.stopAt = null; M.last = M.lastQ = null; E.dec = null; E.decB = Math.max(E.decB, 3); E.decLast = -999;
    const mi = E.T[0].pl.findIndex(p => p.me && p.on);
    if (kind === 'fk') T.setRestart(E, 'fk', 0, 105 - 21, 26, .05);
    if (kind === 'corner') { T.setRestart(E, 'corner', 0, 105, 0, .05); }
    if (kind === 'pen') { T.setRestart(E, 'pen', 0, 105 - 11, 34, .05); E.rs.taker = mi; }
    if (kind === 'take' || kind === 'corner') { if (kind === 'take') { const p = E.T[0].pl[mi]; p.role = 'CM'; p.a.pas = 99; } for (let n = 0; n < 30 && !E.dec; n++) { E.decLast = -999; E.decB = 3; T.meCorner(E, 0, { type: 'corner', k: 0, x: 105, y: 0, at: E.time }); } if (E.dec) { E.stop = null; M.stopAt = E.time; M.stopWhy = 'decision'; T.LV.pt = E.time; T.liveAt(M, T.LV.pt); T.render(); return { ok: !!M.pending, kind: E.dec.kind, mode: E.dec.mode, opts: M.pending ? M.pending.o.map(o => o.t) : null }; } }
    if (kind === 'def' || kind === 'gk') {
      const oi = E.T[1].pl.findIndex(p => p.on && p.role !== 'GK'), att = E.T[1].pl[oi];
      E.dec = kind === 'def' ? { kind: 'def', k: 0, i: mi, opp: [1, oi], on: att.n, u: 80, opts: [{ t: 'Tacler', act: 'tackle', at: 'DEF', out: 'stop', p: .45, card: .18 }, { t: 'Temporiser', act: 'contain', at: 'MEN', out: 'stop', p: .6 }, { t: 'Faute tactique', act: 'foul', at: 'MEN', out: 'stop', p: .95, card: .6 }] }
        : { kind: 'gk', k: 0, shooter: [1, oi], o: {}, sDir: 0, base: .5, sn: att.n, d: 16 };
      M.stopAt = E.time; M.stopWhy = 'decision'; T.LV.pt = E.time; T.liveAt(M, T.LV.pt); T.render();
      return { ok: !!M.pending, kind: E.dec.kind, opts: M.pending ? M.pending.o.map(o => o.t) : null };
    }
    let g = 0, why = ''; while (!E.dec && !M.done && g++ < 3000) { M.stopAt = null; M.half = null; const r = T.liveSim(M, E.time + .4, T.lvRec); if (r !== 'time' && r !== 'decision') why = r; if (E.dec) break; if (g % 40 === 0) { E.decLast = -999; E.decB = Math.max(E.decB, 3); if (kind === 'corner') T.setRestart(E, 'corner', 0, 105, 0, .05); if (kind === 'fk') T.setRestart(E, 'fk', 0, 105 - 21, 26, .05); } }
    if (!E.dec) return { ok: false, why: 'pas de décision ' + why, g, t: E.time, over: E.over };
    T.LV.pt = M.stopAt != null ? M.stopAt : E.time; T.liveAt(M, T.LV.pt); T.render();
    return { ok: true, kind: E.dec.kind, fk: !!E.dec.fk, pen: !!E.dec.pen, mode: E.dec.mode || '', opts: M.pending ? M.pending.o.map(o => o.t) : null };
  }, kind);
  const state = () => pg.evaluate(() => { const T = window.__T(), M = T.S.live.M; return { gest: T.UI.gest ? T.UI.gest.kind : null, pending: !!M.pending, lastQ: M.lastQ && M.lastQ.txt, last: M.last && M.last.txt }; });
  // point écran (dans le canvas) d'une cible du moment
  const pts = (what) => pg.evaluate(what => {
    const T = window.__T(), M = T.S.live.M, Gg = T.geGeo(M), G = T.UI.gest, cv = document.getElementById('lCan').getBoundingClientRect();
    const B = window.__T().G3 && Gg ? (() => { const [x, y, z] = Gg.ball; const v = new (window.THREE.Vector3)(x - 52.5, Math.max(.2, z), y - 34).project(T.G3.cam); return [(v.x + 1) / 2 * T.G3.w, (1 - v.y) / 2 * T.G3.h]; })() : [cv.width / 2, cv.height * .8];
    const Go = T.geGoal(Gg, false), at = (u, w) => { const xl = Go.L[0] + (Go.LT[0] - Go.L[0]) * w, xr = Go.R[0] + (Go.RT[0] - Go.R[0]) * w, yb = (Go.L[1] + Go.R[1]) / 2, yt = (Go.LT[1] + Go.RT[1]) / 2; return [xl + (xr - xl) * u, yb + (yt - yb) * w]; };
    const tg = T.geTargets(M, G, Gg);
    return { ox: cv.x, oy: cv.y, ball: B, goalTL: at(.1, .85), goalBR: at(.9, .15), goalC: at(.5, .2), targets: tg.map(q => ({ i: q.i, t: q.t, x: q.x, y: q.y, z: q.zone })) };
  }, what);
  const swipe = async (P, from, to, ms, bend) => {
    const steps = Math.max(ms < 60 ? 3 : 6, Math.round(ms / 16)); await pg.mouse.move(P.ox + from[0], P.oy + from[1]); await pg.mouse.down();
    for (let i = 1; i <= steps; i++) { const t = i / steps, bx = bend ? Math.sin(t * Math.PI) * bend : 0; await pg.mouse.move(P.ox + from[0] + (to[0] - from[0]) * t + bx, P.oy + from[1] + (to[1] - from[1]) * t); await pg.waitForTimeout(ms / steps); }
    await pg.mouse.up();
  };
  const res = [];
  for (const kind of KINDS) {
    const f = await force(kind); console.log('décision', kind, JSON.stringify(f));
    if (!f.ok) { res.push([kind, 'ÉCHEC décision']); continue; }
    for (let w = 0; w < (f.kind === 'gk' || f.kind === 'def' ? 0 : 3); w++) { await pg.waitForTimeout(1500); console.log('   ', JSON.stringify(await state()), await pg.evaluate(() => { const T = window.__T(), M = T.S.live.M; return JSON.stringify({ d3: T.LV.d3, scr: T.UI.screen, mg: !!T.UI.mg, done: M.done, half: !!M.half, dec: !!M.E.dec, stopAt: M.stopAt, pt: T.LV.pt, et: M.E.time }); })); }
    if (f.kind === 'gk') await pg.waitForTimeout(500); const s0 = await state(); if (f.kind !== 'gk') await shot(`${kind}_0`); if (!s0.pending) { res.push([kind, 'décision perdue']); continue; }
    const P = await pts(); console.log('  état', JSON.stringify(s0), 'cibles', JSON.stringify(P.targets));
    if (!s0.gest) { res.push([kind, 'pas de geste (liste)']); continue; }
    const gk = s0.gest;
    if (gk === 'def') { const t = await pg.evaluate(() => { const T = window.__T(), M = T.S.live.M, Gg = T.geGeo(M), D = M.E.dec, G = T.UI.gest; const pj = (x, y) => { const v = new (window.THREE.Vector3)(x - 52.5, 1, y - 34).project(T.G3.cam); return [(v.x + 1) / 2 * T.G3.w, (1 - v.y) / 2 * T.G3.h]; }; const [ax, ay] = Gg.P(D.opp[0], D.opp[1]), [mx, my] = Gg.P(D.k, D.i); return { a: pj(ax, ay), m: pj(mx, my), T: G.T, el: performance.now() - G.t0 }; }); const ph = (t.el % t.T) / t.T, wait = ((.78 - ph + 1) % 1) * t.T - 150; await pg.waitForTimeout(Math.max(0, wait)); await swipe(P, t.m, t.a, 150); }
    else if (gk === 'gk' || gk === 'gkpen') { console.log('  plongeon', await pg.evaluate(async () => { const T = window.__T(), G = T.UI.gest, w = G.t0 + .78 * G.T - performance.now(); await new Promise(r => setTimeout(r, Math.max(0, w))); const n = performance.now(); const info = JSON.stringify({ gs: G.sDir, ps: T.S.live.M.pending.sDir, ds: T.S.live.M.E.dec && T.S.live.M.E.dec.sDir }); T.geGesture([[195, 300, n - 60], [250, 300, n - 30], [300, 300, n]]); return info + ' ' + (T.S.live.M.lastQ && T.S.live.M.lastQ.txt); })); }
    else if (gk === 'head') { const z = P.targets[0]; await swipe(P, [z.x, z.y], [z.x + 1, z.y], 60); await pg.waitForTimeout(1150); await swipe(P, [195, 300], [196, 300], 40); }
    else if (gk === 'corner') { const z = P.targets.find(q => q.z === 0) || P.targets[0]; await swipe(P, [120, 120], [z.x, z.y], 220, 0); }
    else await swipe(P, [P.ball[0], P.ball[1]], gk === 'pen' ? P.goalBR : P.goalTL, gk === 'fk' ? 220 : 170, gk === 'fk' ? -40 : 0);
    await pg.waitForTimeout(300); const s1 = await state(); await shot(`${kind}_1`);
    await pg.waitForTimeout(2600); await shot(`${kind}_2`); const s2 = await state();
    console.log('  après', JSON.stringify(s1), '→', JSON.stringify(s2));
    res.push([kind + '→' + s0.gest, s1.gest ? 'geste non pris' : 'ok', s1.lastQ || s2.last || '']);
  }
  console.log(res.map(r => r.join(' · ')).join('\n'));
  console.log(errs.slice(0, 8).join('\n') || 'aucune erreur');
  await b.close();
})();
