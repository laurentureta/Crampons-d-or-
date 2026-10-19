// Écran d'ouverture : captures à des instants précis (temps réel de l'animation)
const { chromium } = require('playwright');
const OUT = process.env.OUT || '/tmp/claude-0/shots_intro';
require('fs').mkdirSync(OUT, { recursive: true });
const VW = +process.env.VW || 390, VH = +process.env.VH || 844;
const TIMES = (process.env.TIMES || '0.3,0.9,1.5,1.8,2.1,2.4,2.6,2.7').split(',').map(Number);
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = []; pg.on('pageerror', e => errs.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | '))); pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.addInitScript(() => { window.__INTRO = true; });
  await pg.route(/fonts\.googleapis|fonts\.gstatic|cdnjs/, r => r.abort());
  await pg.goto('file://' + __dirname + '/../dist/test.html');
  await pg.waitForSelector('#intro');
  await pg.evaluate(() => { const T = window.__T(); T.INTRO.seek = 0; });
  const info = await pg.evaluate(() => { const I = window.__T().INTRO; return { flat: I.flat, rHit: I.rHit, flight: I.flight, C: I.C && I.C.toArray().map(v => +v.toFixed(2)), B0: I.B0 && I.B0.toArray().map(v => +v.toFixed(2)), REST: I.REST && I.REST.toArray().map(v => +v.toFixed(2)) }; });
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
