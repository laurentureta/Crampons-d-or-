// Écran de match plein écran : captures à différentes tailles d'iPhone, vérifie qu'aucune page ne défile
const { chromium } = require('playwright');
const OUT = process.env.OUT || '/tmp/claude-0/shots13';
require('fs').mkdirSync(OUT, { recursive: true });
const VW = +process.env.VW || 390, VH = +process.env.VH || 664;
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = []; pg.on('pageerror', e => errs.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  await pg.route(/fonts\.googleapis|fonts\.gstatic|cdnjs/, r => r.abort());
  const net = []; pg.on('requestfinished', q => { if (/\/assets\//.test(q.url())) net.push(q.url().replace(/^.*\/assets\//, '')); });
  await pg.goto(process.env.URL || 'file://' + __dirname + '/../dist/test.html');
  const click = async sel => { await pg.click(sel, { timeout: 8000 }); await pg.waitForTimeout(150); };
  const shot = async n => pg.screenshot({ path: `${OUT}/${VW}x${VH}_${n}.png` });
  const scrollInfo = async () => pg.evaluate(() => ({ docH: document.documentElement.scrollHeight, winH: innerHeight, bodyScroll: document.scrollingElement.scrollHeight > innerHeight + 2 }));
  const closeMods = async () => { for (let i = 0; i < 14; i++) { if (await pg.$('.ov [data-a=mbtn]')) await click('.ov [data-a=mbtn] >> nth=0'); else if (await pg.$('.ov [data-a=pickNum]:not([disabled])')) await click('.ov [data-a=pickNum]:not([disabled]) >> nth=0'); else break; } };
  await pg.waitForSelector('.menu'); await shot('menu');
  await click('[data-a=newCareer]'); await pg.fill('#cFirst', 'Lucas'); await pg.fill('#cLast', 'Moreau'); await click('[data-a=wizNext]'); await click('[data-a=wizNext]'); await click('[data-a=cPos][data-v=BU]'); await click('[data-a=wizNext]'); await click('[data-a=wizNext]');
  await pg.waitForSelector('[data-a=introGo]'); await pg.waitForTimeout(3600); await click('[data-a=introGo]'); await closeMods();
  await shot('home'); console.log('accueil', JSON.stringify(await scrollInfo()));
  for (const t of ['agenda', 'career', 'life', 'profile']) { await click(`[data-a=tab][data-v=${t}]`); await shot(t); console.log(t, JSON.stringify(await scrollInfo())); }
  await click('[data-a=tab][data-v=home]');
  await pg.evaluate(() => { const T = window.__T(); T.S.settings.live = 'all'; T.save(); });
  for (let k = 0; k < 60 && !(await pg.$('.live')); k++) { if (await pg.$('.ov .md')) { await closeMods(); continue; } await click('[data-a=nextMatch]:not([disabled]), [data-a=next]').catch(() => {}); }
  await pg.waitForTimeout(800); await shot('live_press'); console.log('match (avant-match)', JSON.stringify(await scrollInfo()));
  if (await pg.$('[data-a=lPress]')) await click('[data-a=lPress] >> nth=0');
  await click('[data-a="lSpeed"][data-v="1"]'); await pg.waitForTimeout(4000); await shot('live_play'); console.log('match', JSON.stringify(await scrollInfo()));
  const geo = await pg.evaluate(() => { const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.top), Math.round(b.height)]; }; return { sb: r('.lsb'), stage: r('.lstage'), cv: r('#lCan'), com: r('.lcom'), bar: r('.lbar') }; });
  console.log('géométrie', JSON.stringify(geo));
  await click('[data-a=lStat]'); await pg.waitForTimeout(400); await shot('live_stats'); await click('[data-a=lStatTab][data-v=fd]'); await pg.waitForTimeout(300); await shot('live_feed'); await click('[data-a=lStat]');
  // jusqu'à une décision
  const t0 = Date.now(); let dec = false;
  await click('[data-a="lSpeed"][data-v="3"]');
  while (Date.now() - t0 < 120000 && await pg.$('.live') && !(await pg.$('[data-a=lDone]'))) { if (await pg.$('[data-a=lChoose]')) { await shot('live_decision'); dec = true; await click('[data-a=lChoose] >> nth=0'); await pg.waitForTimeout(400); if (await pg.$('[data-a=mgZone]')) { await shot('live_minigame'); await click('[data-a=mgZone] >> nth=1'); await pg.waitForTimeout(300); } if (await pg.$('[data-a=mgShoot]')) await click('[data-a=mgShoot] >> nth=0'); if (await pg.$('[data-a=mgDive]')) await click('[data-a=mgDive] >> nth=0'); break; } if (await pg.$('[data-a=lHalf]')) { await shot('live_half'); await click('[data-a=lHalf] >> nth=0'); } await pg.waitForTimeout(300); }
  console.log('décision vue', dec);
  await click('[data-a="lSpeed"][data-v="4"]').catch(() => {});
  const t1 = Date.now();
  while (Date.now() - t1 < 300000 && await pg.$('.live') && !(await pg.$('[data-a=lDone]'))) { for (const s of ['[data-a=mgZone] >> nth=1', '[data-a=mgShoot] >> nth=0', '[data-a=mgDive] >> nth=0', '[data-a=lHalf] >> nth=0', '[data-a=lChoose] >> nth=0']) if (await pg.$(s.split(' >>')[0])) await click(s).catch(() => {}); await pg.waitForTimeout(400); }
  if (await pg.$('[data-a=lDone]')) { await pg.waitForTimeout(600); await shot('live_end'); for (const t of ['rt', 'sh', 'st']) { if (await pg.$(`[data-a=lEnd][data-v=${t}]`)) { await click(`[data-a=lEnd][data-v=${t}]`); await shot('live_end_' + t); } } console.log('fin', JSON.stringify(await scrollInfo())); }
  if (net.length) console.log('médias chargés :', net.length, [...new Set(net.map(x => x.split('/')[0]))].join(', '));
  console.log(errs.length ? errs.slice(0, 8).join('\n') : 'Aucune erreur navigateur');
  await b.close();
})();
