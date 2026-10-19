// ===================== SONS GÉNÉRÉS PAR TON COMPTE ELEVENLABS (OU OPENAI) =====================
// 1. Pack de voix : toutes les répliques fixes de Lo Sol et Nathalie (histoires, réactions, analyses…) sont
//    fabriquées une seule fois avec ta clé puis gardées sur le téléphone : ensuite elles partent instantanément,
//    même sans réseau, et ne sont plus jamais facturées.
// 2. Bruitages réalistes : frappe, poteau, filet, sifflet, tacle, arrêt, vitre qui casse (ElevenLabs Sound Effects).
// 3. Nouvelles voix : le speaker du stade, le coach à la mi-temps, ton agent, la journaliste en conférence de presse.
const VOX = { S: 'Lo Sol', N: 'Nathalie', P: 'Le speaker', C: 'Le coach', A: 'Ton agent', J: 'La journaliste' };
// voix ElevenLabs par défaut (Nathalie, coach, agent et journaliste viennent de la bibliothèque ElevenLabs :
// si ton compte ne peut pas les utiliser, le jeu prend automatiquement une voix de ton compte)
const VOX_EL = { N: 'vq479zipNPD44hpCdbIh', P: '5l4ttmr4SKNgi0HnOelT', C: 'cEjGxRhK5rId1bacJPJr', A: '9tZ0TkblLDiUBWp2EbTv', J: 'DZeU95FfxvXu8aNMqcMZ' };
const VOX_ELN = { N: 'Atma', P: 'Paul K', C: 'Bakumba', A: 'Lucas', J: 'Aude' };
const VOX_OAI = { P: 'onyx', C: 'ash', A: 'verse', J: 'coral' };
const VOX_G = { S: 'male', N: 'female', P: 'male', C: 'male', A: 'male', J: 'female' };
const VOX_TEST = {
  P: 'Mesdames et messieurs, bonsoir et bienvenue au stade ! Le coup d\'envoi sera donné dans quelques instants.',
  C: 'Écoute-moi bien. On est dans le match, mais j\'ai besoin de plus d\'intensité. Tu peux faire la différence, alors vas-y.',
  A: 'Salut champion ! J\'ai eu un club au téléphone ce matin. Ils te suivent de près. Reste concentré, je m\'occupe du reste.',
  J: 'Bonsoir. Une question rapide : comment abordez-vous ce match, après votre dernière performance ?',
};

// ---------- stockage durable du pack (base à part : jamais vidée par le petit cache des voix) ----------
const PK = { p: null, have: new Set(), run: false, stop: false, n: 0, tot: 0, fail: 0, err: '', kind: '' };
function pkdb() {
  if (PK.p) return PK.p;
  PK.p = new Promise(res => {
    try {
      const r = indexedDB.open('cdo-pack', 1);
      r.onupgradeneeded = () => { try { r.result.createObjectStore('a'); } catch (e) { } };
      r.onsuccess = () => { const db = r.result; try { const q = db.transaction('a').objectStore('a').getAllKeys(); q.onsuccess = () => { for (const k of q.result || []) PK.have.add(k); res(db); sfxGenLoad(); }; q.onerror = () => res(db); } catch (e) { res(db); } };
      r.onerror = () => res(null);
    } catch (e) { res(null); }
  });
  return PK.p;
}
function pkGet(k) { return pkdb().then(db => db && new Promise(res => { try { const q = db.transaction('a').objectStore('a').get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); } catch (e) { res(null); } })); }
function pkPut(k, v) { return pkdb().then(db => db && new Promise(res => { try { const tx = db.transaction('a', 'readwrite'); tx.objectStore('a').put(v, k); tx.oncomplete = () => { PK.have.add(k); res(true); }; tx.onerror = () => res(false); } catch (e) { res(false); } })); }
const pkKey = (prov, voice, txt) => prov + '|' + voice + '|' + String(txt).trim();

// ---------- le pack de voix : toutes les répliques sans nom propre ----------
const PK_HOT = /^(goal|wood|bar|pen|var|red|save|miss|late|added|interrupt|woodOpp|block)/;
function pkLines() {
  if (typeof CMX === 'undefined') return [];
  const out = [], seen = new Set();
  const add = (raw, key) => {
    if (typeof raw !== 'string' || raw[0] === '#' || /\{\w+\}/.test(raw)) return;
    const who = cmIsN(raw) ? 'N' : 'S', txt = cmFill(who === 'N' ? raw.slice(2) : raw, {});
    if (!txt || seen.has(who + txt)) return; seen.add(who + txt);
    out.push({ who, txt, pri: PK_HOT.test(key) ? 3 : 2, dig: key === 'dig' || /^intro/.test(key) || key === 'second' });
  };
  for (const key of Object.keys(CMX)) { if (key === 'songs') continue; const v = CMX[key]; if (!Array.isArray(v)) continue; for (const e of v) { if (Array.isArray(e)) e.forEach(x => add(x, key)); else add(e, key); } }
  if (typeof CM_CUT !== 'undefined') CM_CUT.forEach(x => add(x, 'interrupt'));
  return out;
}
function pkStat() {
  if (!aivKey() || (OPTS.aiv !== 'openai' && OPTS.aiv !== 'eleven')) return { ok: 0, tot: 0, chars: 0 };
  const L = pkLines(), prov = OPTS.aiv; let ok = 0, chars = 0;
  for (const x of L) { if (PK.have.has(pkKey(prov, aivVoice(x.who), x.txt))) ok++; else chars += x.txt.length; }
  return { ok, tot: L.length, chars };
}
function pkProg() {
  const el = typeof document !== 'undefined' && document.getElementById('pkProg'); if (!el) return;
  el.textContent = PK.run ? `${PK.kind === 'sfx' ? 'Bruitages' : 'Répliques'} : ${PK.n} / ${PK.tot}${PK.fail ? ` · ${PK.fail} en échec` : ''}…` : PK.err || '';
  const bar = document.getElementById('pkBar'); if (bar) bar.style.width = (PK.tot ? PK.n / PK.tot * 100 : 0).toFixed(1) + '%';
}
async function pkRun() {
  if (PK.run || !aivKey()) return; await pkdb();
  const prov = OPTS.aiv, todo = pkLines().filter(x => !PK.have.has(pkKey(prov, aivVoice(x.who), x.txt)));
  Object.assign(PK, { run: true, stop: false, n: 0, tot: todo.length, fail: 0, err: '', kind: 'vox' }); pkProg();
  let i = 0;
  const worker = async () => {
    while (!PK.stop && i < todo.length) {
      const x = todo[i++], voice = aivVoice(x.who);
      try { const ab = await aivNet(x, voice); await pkPut(pkKey(prov, voice, x.txt), ab); aivUse(x.txt.length); }
      catch (e) { PK.fail++; PK.err = 'Dernière erreur : ' + aivErr(e); if (e && (e.st === 401 || e.st === 402 || e.st === 429)) PK.stop = true; }
      PK.n++; pkProg();
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  PK.run = false;
  if (!PK.err) PK.err = PK.stop ? 'Pack en pause.' : 'Pack de voix prêt : les commentaires partent sans attendre, même hors connexion.';
  pkProg(); if (typeof render === 'function') render();
}

// ---------- bruitages réalistes (ElevenLabs Sound Effects) ----------
const SFXG = [
  ['kick', 'Close-up sound of a soccer ball kicked on grass, a single crisp leather thump, no crowd, no music', .6],
  ['shot', 'Powerful soccer shot, leather ball struck with full force, deep punchy thump with a short whoosh, no crowd', .8],
  ['post', 'Soccer ball smashing into a metal goal post, loud ringing clang, no crowd', 1.6],
  ['net', 'Soccer ball flying into the back of the goal net, net rustle and swish, no crowd', 1.1],
  ['whistle1', 'Football referee blowing one sharp whistle in an outdoor stadium', 1.0],
  ['whistle3', 'Football referee final whistle: two short blasts then one long blast, outdoor stadium', 2.6],
  ['tackle', 'Soccer slide tackle on wet grass, body sliding and boot hitting the ball, no crowd', 1.0],
  ['header', 'Soccer ball headed by a player, dull leather thud on the forehead, no crowd', .5],
  ['catch', 'Goalkeeper catching a soccer ball firmly with padded gloves, no crowd', .6],
  ['glass', 'Smartphone screen glass hit by a ball: sharp crack then shattering, tiny shards tinkling', 1.6],
];
AU.gen = AU.gen || {};
function sfxGenLoad() {
  if (!AU.ctx) return;
  // bruitages livrés avec le jeu (assets/sons/), sinon ceux fabriqués sur ce téléphone
  if (typeof SONS_FILES !== 'undefined') for (const k of SONS_FILES) if (!AU.gen[k]) fetch(mediaUrl('sons', k)).then(r => r.ok ? r.arrayBuffer() : null).then(ab => { if (ab) AU.ctx.decodeAudioData(ab, b => { AU.gen[k] = b; }, () => { }); }).catch(() => { });
  for (const [k] of SFXG) if (!AU.gen[k] && PK.have.has('sfx|' + k)) pkGet('sfx|' + k).then(ab => { if (ab) try { AU.ctx.decodeAudioData(ab.slice(0), b => { AU.gen[k] = b; }, () => { }); } catch (e) { } });
}
const sfxGenCount = () => SFXG.filter(([k]) => PK.have.has('sfx|' + k)).length;
async function sfxGenRun() {
  if (PK.run || !aivKey() || OPTS.aiv !== 'eleven') return; await pkdb();
  const todo = SFXG.filter(([k]) => !PK.have.has('sfx|' + k));
  Object.assign(PK, { run: true, stop: false, n: 0, tot: todo.length, fail: 0, err: '', kind: 'sfx' }); pkProg();
  for (const [k, text, dur] of todo) {
    if (PK.stop) break;
    try {
      const r = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_64', { method: 'POST', headers: { 'Content-Type': 'application/json', 'xi-api-key': aivKey(), Accept: 'audio/mpeg' }, body: JSON.stringify({ text, duration_seconds: dur, prompt_influence: .6 }) });
      if (!r.ok) { let m = ''; try { m = (await r.text()).slice(0, 300); } catch (e) { } throw Object.assign(new Error(m || ('HTTP ' + r.status)), { st: r.status }); }
      const ab = await r.arrayBuffer(); await pkPut('sfx|' + k, ab);
    } catch (e) { PK.fail++; PK.err = 'Dernière erreur : ' + aivErr(e) + (e && (e.st === 401 || e.st === 403) ? ' (autorise « Sound Effects » sur ta clé ElevenLabs)' : ''); if (e && (e.st === 401 || e.st === 402 || e.st === 403 || e.st === 429)) PK.stop = true; }
    PK.n++; pkProg();
  }
  PK.run = false; sfxGenLoad();
  if (!PK.err) PK.err = 'Bruitages prêts : frappes, poteaux, filets, sifflets et tacles réalistes en match.';
  pkProg(); if (typeof render === 'function') render();
}
// joue un bruitage généré (renvoie false s'il n'existe pas : le son de synthèse prend le relais)
function sfxG(k, v, at) {
  const b = AU.gen && AU.gen[k]; if (!b || !AU.ctx || !AU.unlocked || (OPTS.svol ?? .8) <= 0) return false;
  const c = AU.ctx, src = c.createBufferSource(), g = c.createGain(); src.buffer = b; src.playbackRate.value = .96 + Math.random() * .08;
  g.gain.value = (v ?? 1) * clamp((OPTS.svol ?? .8) * 1.1, 0, 1.3); src.connect(g); g.connect(AU.fx); src.start(c.currentTime + (at || 0));
  return true;
}

// ---------- le speaker : sono de stade (réverbération synthétique) ----------
function paOut() {
  if (AU.pa) return AU.pa; const c = AU.ctx; if (!c) return null;
  const len = Math.floor(c.sampleRate * 2.4), ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) { const t = i / c.sampleRate; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2) * (t < .06 ? t / .06 : 1) * (1 + (t > .18 && t < .21 ? 1.6 : 0)); } }
  const inp = c.createGain(), dry = c.createGain(), wet = c.createGain(), conv = c.createConvolver(), hp = c.createBiquadFilter(), lp = c.createBiquadFilter();
  conv.buffer = ir; hp.type = 'highpass'; hp.frequency.value = 320; lp.type = 'lowpass'; lp.frequency.value = 5200;
  dry.gain.value = .7; wet.gain.value = .55;
  inp.connect(hp); hp.connect(lp); lp.connect(dry); lp.connect(conv); conv.connect(wet); dry.connect(AU.master); wet.connect(AU.master);
  AU.pa = inp; return inp;
}

// ---------- les autres personnages parlent (voix IA si activée, sinon voix du téléphone) ----------
const VOSAID = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
function voOnce(obj, txt, who, aiOnly) {
  if (!obj || !txt || !VOSAID || VOSAID.has(obj)) return; VOSAID.add(obj);
  if (aiOnly && !aivOn()) return;
  setTimeout(() => { try { sayPush({ txt: String(txt).replace(/[«»]/g, ''), pri: 2, who }); } catch (e) { } }, 250);
}
function coachHalfLine(M) {
  const mine = M.side === 'h' ? M.hg : M.ag, th = M.side === 'h' ? M.ag : M.hg, n = S && S.p ? S.p.first : '';
  return mine < th ? `${n}, écoute-moi. On est menés, mais rien n'est perdu. J'ai besoin de toi en deuxième mi-temps. Dis-moi ce que tu ressens.`
    : mine > th ? `Bien, ${n}. On mène, mais rien n'est fait. Reste concentré, on ne lâche rien. Alors, comment tu te sens ?`
      : `C'est serré, ${n}. Le match va se jouer sur un détail. Dis-moi ce dont tu as besoin.`;
}
// annonces du speaker
function paIntro(M) {
  const C = M.cond || {}; if ((C.att || 0) < 300) return [];
  const home = M.side === 'h' ? M.my : M.op, away = M.side === 'h' ? M.op : M.my, out = [{ who: 'P', txt: `Mesdames et messieurs, ${C.night ? 'bonsoir' : 'bonjour'} et bienvenue ! ${home} reçoit ${away}. Le coup d'envoi sera donné dans quelques instants.` }];
  if (M.side === 'h' && M.starter && S && S.p && !M.coach) out.push({ who: 'P', txt: `Et avec le numéro ${S.club.num || 10}… ${S.p.first}… ${String(S.p.last).toUpperCase()} !` });
  return out;
}
function paGoal(M, e, mn) {
  const homeK = M.side === 'h' ? 0 : 1; if (e.k !== homeK || e.og || !e.n || ((M.cond || {}).att || 0) < 300) return null;
  const home = M.side === 'h' ? M.my : M.op, me = e.me && e.k === 0 && !M.coach && S && S.p;
  const who = me ? `le numéro ${S.club.num || 10}, ${S.p.first}… ${String(S.p.last).toUpperCase()}` : `${String(e.n).split(' ').slice(0, -1).join(' ')}… ${LN(e.n).toUpperCase()}`.replace(/^…\s*/, '');
  return { who: 'P', txt: `But pour ${home}, marqué à la ${mn}e minute par ${who} !`, pri: 2 };
}
function paEnd(M) {
  if (((M.cond || {}).att || 0) < 300) return null;
  const home = M.side === 'h' ? M.my : M.op, away = M.side === 'h' ? M.op : M.my;
  return { who: 'P', txt: `Score final : ${home}, ${M.hg}. ${away}, ${M.ag}. Merci de votre présence, et bon retour chez vous !`, pri: 2 };
}
if (typeof indexedDB !== 'undefined' && typeof window !== 'undefined') pkdb();
