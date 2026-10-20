// Écran d'ouverture : captures à des instants précis (temps réel de l'animation)
const { chromium } = require('playwright');
const OUT = process.env.OUT || '/tmp/claude-0/shots_intro';
require('fs').mkdirSync(OUT, { recursive: true });
const VW = +process.env.VW || 390, VH = +process.env.VH || 844;
const TIMES = (process.env.TIMES || '0.3,1.0,1.6,1.8,1.95,2.1,2.25').split(',').map(Number);
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = []; pg.on('pageerror', e => errs.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | '))); pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.addInitScript(() => { window.__INTRO = true; });
  await pg.route(/fonts\.googleapis|fonts\.gstatic|cdnjs/, r => r.abort());
  // servi par tests/serve.js (TEST=1) : les photos de l'ouverture sont dans assets/intro
  await pg.goto(process.env.URL || 'http://localhost:8775/');
  await pg.waitForSelector('#intro', { timeout: 60000 });
  await pg.waitForFunction(() => window.__T && window.__T().IN_PH.ok, null, { timeout: 30000 });
  await pg.evaluate(() => { const T = window.__T(); T.INTRO.seek = 0; });
  const info = await pg.evaluate(() => { const I = window.__T().INTRO; return { rHit: I.rHit, flight: I.flight, w: I.w, h: I.h, dpr: I.dpr, L: I.L && { jw: Math.round(I.L.jw), ball: I.L.ball.map(Math.round) } }; });
  console.log('intro', JSON.stringify(info));
  const at = async r => { await pg.evaluate(r => { const T = window.__T(); T.INTRO.seek = r; T.introFrame(performance.now()); }, r); await pg.waitForTimeout(60); };
  // dérouler les images pour que la rotation/traînée soient cohérentes
  let cur = 0;
  for (const r of TIMES) { while (cur < r - .02) { cur = Math.min(r, cur + 1 / 30); await at(cur); } await at(r); cur = r; await pg.screenshot({ path: `${OUT}/${VW}x${VH}_t${r.toFixed(2)}.png` }); }
  if (!process.env.NOHIT) {
    const rh = info.rHit;
    for (const [k, w] of (process.env.HITS ? JSON.parse(process.env.HITS) : [[.04, 30], [.2, 30], [.5, 700], [1.4, 400], [2.6, 2600]])) { await at(rh + k); await pg.waitForTimeout(w); await pg.screenshot({ path: `${OUT}/${VW}x${VH}_hit+${k}.png` }); }
    console.log('classes', await pg.evaluate(() => (document.getElementById('intro') || {}).className));
  }
  console.log(errs.length ? errs.slice(0, 8).join('\n') : 'Aucune erreur navigateur');
  await b.close();
})();
