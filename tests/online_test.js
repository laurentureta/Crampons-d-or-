// Sauvegarde en ligne et classement, contre un faux Supabase (fonctions de tools/supabase.sql imitées en mémoire)
const { chromium } = require('playwright');
const DB = { sv: {}, cl: {} };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 760 } }); const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.route(/fonts\.googleapis|fonts\.gstatic|cdnjs/, r => r.abort());
  await ctx.route('https://test.supabase.co/rest/v1/rpc/*', async r => {
    const fn = r.request().url().split('/').pop(), a = JSON.parse(r.request().postData() || '{}');
    if (r.request().headers().apikey !== 'cle-anon') return r.fulfill({ status: 401, body: '{"message":"clé"}' });
    let out = null;
    if (fn === 'cdo_sauver') { if (!/^[A-Z0-9]{12}$/.test(a.p_code) || !a.p_data.startsWith('CDO2')) return r.fulfill({ status: 400, body: '{"message":"invalide"}' }); DB.sv[a.p_code] = a; out = new Date().toISOString(); }
    else if (fn === 'cdo_charger') out = DB.sv[a.p_code.toUpperCase()] ? [{ data: DB.sv[a.p_code.toUpperCase()].p_data }] : [];
    else if (fn === 'cdo_publier') { DB.cl[a.p.joueur] = a.p; out = null; }
    else if (fn === 'cdo_retirer') { delete DB.cl[a.p_joueur]; out = null; }
    else if (fn === 'cdo_top') out = Object.values(DB.cl).concat([{ joueur: 'ffffffffffffffff', nom: 'Rival Legende', poste: 'MC', nation: 'ES', club: 'FC Barcelone', age: 31, score: 250, buts: 120, trophees: 14, ballons_or: 1, fini: false }]).sort((x, y) => y.score - x.score)
      .map(({ joueur, ...r }) => ({ cle: require('crypto').createHash('sha256').update(joueur).digest('hex').slice(0, 16), nom: r.nom, poste: r.poste, nation: r.nation, club: r.club, age: r.age, score: r.score, buts: r.buts, trophees: r.trophees, ballons_or: r.ballons_or, fini: r.fini }));
    r.fulfill({ status: 200, contentType: 'application/json', body: out === null ? '' : JSON.stringify(out) });
  });
  await pg.goto('file://' + __dirname + '/../dist/test.html'); await pg.waitForSelector('.menu');
  const click = async s => { await pg.click(s, { timeout: 8000 }); await pg.waitForTimeout(150); };
  // éteint : rien d'en ligne n'apparaît
  await pg.evaluate(() => { const T = window.__T(); T.ONL.url = ''; T.render(); });
  console.log('éteint, menu sans classement :', !(await pg.$('[data-v=ranks]')));
  await pg.evaluate(() => { const T = window.__T(); T.ONL.url = 'https://test.supabase.co'; T.ONL.key = 'cle-anon'; T.render(); });
  console.log('allumé, menu avec classement :', !!(await pg.$('[data-v=ranks]')));
  await click('[data-a=newCareer]'); await pg.fill('#cFirst', 'Lucas'); await pg.fill('#cLast', 'Moreau'); await click('[data-a=wizNext]'); await click('[data-a=wizNext]'); await click('[data-a=cPos][data-v=BU]'); await click('[data-a=wizNext]'); await click('[data-a=wizNext]');
  await pg.waitForSelector('[data-a=introGo]', { timeout: 30000 }); await pg.waitForTimeout(3600); await click('[data-a=introGo]');
  for (let i = 0; i < 14; i++) { if (await pg.$('.ov [data-a=mbtn]')) await click('.ov [data-a=mbtn] >> nth=0'); else if (await pg.$('.ov [data-a=pickNum]:not([disabled])')) await click('.ov [data-a=pickNum]:not([disabled]) >> nth=0'); else break; }
  // sauvegarde en ligne depuis la page Sauvegardes
  await pg.evaluate(() => { const T = window.__T(); T.ACT.open('saves'); });
  console.log('carte en jeu :', await pg.$('[data-a=onlSave]') ? 'bouton « Sauvegarder en ligne » présent' : 'ABSENTE');
  const code = await pg.evaluate(async () => { const T = window.__T(); await T.ACT.onlSave(); return T.S.onl && T.S.onl.code; });
  console.log('code reçu :', code, '· stocké côté serveur :', !!DB.sv[code], Math.round((DB.sv[code] || { p_data: '' }).p_data.length / 1024) + ' Ko');
  console.log('classement publié :', Object.keys(DB.cl).length === 1 ? 'oui (' + Object.values(DB.cl)[0].nom + ', score ' + Object.values(DB.cl)[0].score + ')' : 'NON');
  // récupération sur un « autre téléphone » (stockage vidé)
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push(e.message));
  await p2.route(/fonts\.googleapis|fonts\.gstatic|cdnjs/, r => r.abort()); await p2.goto('about:blank');
  await pg.evaluate(() => localStorage.clear());
  await p2.goto('file://' + __dirname + '/../dist/test.html'); await p2.waitForSelector('.menu');
  await p2.evaluate(() => { const T = window.__T(); T.ONL.url = 'https://test.supabase.co'; T.ONL.key = 'cle-anon'; });
  await p2.evaluate(() => { const T = window.__T(); T.ACT.page('saves'); });
  await p2.waitForSelector('#onlCode'); await p2.fill('#onlCode', code.slice(0, 4) + '-' + code.slice(4, 8).toLowerCase() + '-' + code.slice(8));
  await p2.click('[data-a=onlLoad][data-v="2"]'); await p2.waitForTimeout(6000);
  console.log('récupérée sur un autre téléphone :', JSON.stringify(await p2.evaluate(() => { const T = window.__T(); return T.S ? { nom: T.S.p.first + ' ' + T.S.p.last, slot: T.S.slot, code: T.S.onl && T.S.onl.code } : null; })));
  // mauvais code
  await p2.evaluate(() => { const T = window.__T(); T.UI.screen = 'menu'; T.ACT.page('saves'); });
  await p2.fill('#onlCode', 'ZZZZ-ZZZZ-ZZZZ'); await p2.click('[data-a=onlLoad][data-v="3"]'); await p2.waitForTimeout(800);
  console.log('mauvais code :', await p2.textContent('#toast'));
  // masquer puis remontrer sa carrière
  await p2.evaluate(() => { const T = window.__T(); T.UI.screen = 'game'; T.ACT.open('saves'); });
  await p2.click('[data-a=onlPub][data-v="0"]'); await p2.waitForTimeout(500); const hidden = Object.keys(DB.cl).length;
  await p2.click('[data-a=onlPub][data-v="1"]'); await p2.waitForTimeout(500);
  console.log('masquer / remontrer :', hidden === 0 && Object.keys(DB.cl).length === 1 ? 'ok' : 'ÉCHEC ' + hidden + '/' + Object.keys(DB.cl).length);
  // classement
  await p2.evaluate(() => { const T = window.__T(); T.UI.screen = 'menu'; T.ACT.page('ranks'); }); await p2.waitForTimeout(800);
  await p2.screenshot({ path: '/tmp/claude-0/ranks.png' });
  console.log('classement affiché :', await p2.$$eval('.rk', x => x.map(e => e.querySelector('b').textContent + (e.classList.contains('me') ? ' (moi)' : '')).join(' / ')));
  console.log(errs.length ? 'erreurs : ' + errs.slice(0, 5).join(' | ') : 'aucune erreur');
  await b.close();
})();
