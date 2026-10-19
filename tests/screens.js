// Captures rapides des écrans hors match (accueil, onglets, réglages, options, sous-pages) à une taille donnée
const { chromium } = require('playwright');
const OUT = process.env.OUT || '/tmp/claude-0/shots14';
require('fs').mkdirSync(OUT, { recursive: true });
const VW = +process.env.VW || 390, VH = +process.env.VH || 664;
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = []; pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await pg.route(/fonts\.googleapis|fonts\.gstatic|cdnjs/, r => r.abort());
  await pg.goto('file://' + __dirname + '/../dist/test.html');
  const click = async sel => { await pg.click(sel, { timeout: 8000 }); await pg.waitForTimeout(120); };
  const info = async () => pg.evaluate(() => { const m = document.querySelector('main.scroll'), bar = document.querySelector('.actbar'); return { body: document.scrollingElement.scrollHeight > innerHeight + 2, inner: m ? m.scrollHeight - m.clientHeight : null, bar: bar ? Math.round(bar.getBoundingClientRect().bottom) : null }; });
  const shot = async n => { await pg.screenshot({ path: `${OUT}/${VW}x${VH}_${n}.png` }); console.log(n, JSON.stringify(await info())); };
  const closeMods = async () => { for (let i = 0; i < 14; i++) { if (await pg.$('.ov [data-a=mbtn]')) await click('.ov [data-a=mbtn] >> nth=0'); else if (await pg.$('.ov [data-a=pickNum]:not([disabled])')) await click('.ov [data-a=pickNum]:not([disabled]) >> nth=0'); else break; } };
  await pg.waitForSelector('.menu'); await shot('menu');
  await click('[data-a=newCareer]'); await pg.fill('#cFirst', 'Lucas'); await pg.fill('#cLast', 'Moreau'); await click('[data-a=wizNext]'); await click('[data-a=wizNext]'); await click('[data-a=cPos][data-v=BU]'); await click('[data-a=wizNext]'); await click('[data-a=wizNext]');
  await pg.waitForSelector('[data-a=introGo]'); await pg.waitForTimeout(3600); await click('[data-a=introGo]'); await closeMods();
  await shot('home');
  for (const t of ['agenda', 'career', 'life', 'profile']) { await click(`[data-a=tab][data-v=${t}]`); await shot(t); }
  await click('[data-a=tab][data-v=home]');
  await click('[data-a=open][data-v=settings]'); await shot('settings');
  await click('[data-a=open][data-v=options]'); await shot('options');
  for (const v of ['jeu', 'son', 'ia']) if (await pg.$(`[data-a=oTab][data-v=${v}]`)) { await click(`[data-a=oTab][data-v=${v}]`); await shot('options_' + v); }
  if (process.env.MORE) {
    await pg.goBack().catch(() => {});
    await pg.evaluate(() => { const T = window.__T(); T.UI.screen = 'game'; T.UI.tab = 'career'; T.UI.sub = null; T.render && T.render(); });
    for (const s of ['goals', 'club', 'transfers', 'stats']) { await pg.evaluate(s => { const T = window.__T(); T.ACT.open && T.ACT.open(s); }, s).catch(() => {}); await pg.waitForTimeout(150); await shot('sub_' + s); }
  }
  console.log(errs.length ? errs.slice(0, 8).join('\n') : 'Aucune erreur navigateur');
  await b.close();
})();
