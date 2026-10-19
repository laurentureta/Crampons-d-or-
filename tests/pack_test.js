// Pack de voix et bruitages : ElevenLabs simulé (aucun appel réel, aucun crédit)
const { chromium } = require('playwright');
const fs = require('fs');
const MP3 = fs.readFileSync(process.env.MP3 || __dirname + '/../assets/sons/kick.mp3');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const pg = await b.newPage({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });
  const errs = []; pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
  const calls = { tts: 0, sfx: 0, bad: 0, voices: {} };
  await pg.route(/fonts\.googleapis|fonts\.gstatic|cdnjs/, r => r.abort());
  await pg.route(/api\.elevenlabs\.io/, async r => {
    const u = r.request().url();
    if (u.includes('/v1/voices')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ voices: [{ voice_id: 'EQHLm8eFXUqKbFzlvnSA', name: 'Commentateur sportif', labels: { language: 'fr' } }, { voice_id: 'acctF', name: 'Ma voix femme', labels: { gender: 'female' } }, { voice_id: 'acctM', name: 'Ma voix homme', labels: { gender: 'male' } }] }) });
    if (u.includes('sound-generation')) { calls.sfx++; return r.fulfill({ status: 200, contentType: 'audio/mpeg', body: MP3 }); }
    const v = decodeURIComponent((u.match(/text-to-speech\/([^?]+)/) || [])[1] || '');
    calls.voices[v] = (calls.voices[v] || 0) + 1;
    if (v === 'cEjGxRhK5rId1bacJPJr') { calls.bad++; return r.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: { status: 'voice_not_found', message: 'A voice with voice_id cEjGxRhK5rId1bacJPJr was not found.' } }) }); }
    calls.tts++; return r.fulfill({ status: 200, contentType: 'audio/mpeg', body: MP3 });
  });
  await pg.goto('file://' + __dirname + '/../dist/test.html'); await pg.waitForSelector('.menu');
  await pg.evaluate(() => { localStorage.setItem('cdo_aikey', 'cle-de-test'); const T = window.__T(); T.OPTS.aiv = 'eleven'; T.OPTS.aivM = 'eleven_v3'; });
  await pg.click('[data-a=page][data-v=options]'); await pg.click('[data-a=oTab][data-v=ia]'); await pg.waitForTimeout(300);
  await pg.click('[data-a=aivLoad]'); await pg.waitForTimeout(500);
  console.log('pack avant', await pg.evaluate(() => document.querySelector('.pack') && document.querySelector('.pack').innerText.split('\n').slice(0, 4).join(' | ')));
  await pg.click('[data-a=pkRun]');
  for (let i = 0; i < 120; i++) { await pg.waitForTimeout(500); const run = await pg.evaluate(() => window.__T().PK.run); if (!run) break; }
  console.log('pack après', await pg.evaluate(() => { const T = window.__T(); return { have: T.PK.have.size, err: T.PK.err, fail: T.PK.fail, stat: T.pkStat() }; }));
  await pg.click('[data-a=sfxGen]');
  for (let i = 0; i < 60; i++) { await pg.waitForTimeout(400); const run = await pg.evaluate(() => window.__T().PK.run); if (!run) break; }
  await pg.waitForTimeout(800);
  console.log('bruitages', await pg.evaluate(() => { const T = window.__T(); return { gen: Object.keys(T.AU.gen || {}).length, err: T.PK.err }; }));
  await pg.click('[data-a=vTest][data-v=C]'); await pg.waitForTimeout(1500);
  console.log('coach', await pg.evaluate(() => { const T = window.__T(); return { bad: [...T.AIV.bad], voixCoach: T.aivVoice('C'), voixN: T.aivVoice('N'), voixP: T.aivVoice('P') }; }));
  // une réplique du pack ne repasse pas par le réseau
  const before = calls.tts;
  await pg.evaluate(() => { const T = window.__T(); const L = T.pkLines(); return T.aivFetch(L[5]); });
  console.log('appel réseau pour une réplique du pack :', calls.tts - before, '· appels', JSON.stringify({ tts: calls.tts, sfx: calls.sfx, bad: calls.bad }));
  await pg.screenshot({ path: '/tmp/claude-0/shots14/pack.png', fullPage: false });
  console.log(errs.length ? errs.join('\n') : 'Aucune erreur navigateur');
  await b.close();
})();
