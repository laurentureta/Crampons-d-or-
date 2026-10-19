// Robot « médias » : télécharge les fichiers listés dans media-queue/*.json puis supprime les listes.
// Format d'une liste : [{ "url": "https://…", "out": "assets/sons/kick.mp3" }, …]
// Sécurité : seulement des liens https vers ElevenLabs / Google Cloud Storage, seulement vers assets/ ou media-raw/,
// seulement des fichiers audio de moins de 25 Mo.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), Q = path.join(ROOT, 'media-queue');
const HOSTS = [/\.elevenlabs\.io$/, /^elevenlabs\.io$/, /^storage\.googleapis\.com$/, /\.storage\.googleapis\.com$/, /\.googleusercontent\.com$/];
const MAX = 25 * 1024 * 1024;

function okUrl(u) { try { const x = new URL(u); return x.protocol === 'https:' && HOSTS.some(h => h.test(x.hostname)); } catch (e) { return false; } }
function okOut(o) { const n = path.posix.normalize(String(o || '')); return /^(assets|media-raw)\/[\w\-./]+\.(mp3|wav|ogg|m4a)$/.test(n) && !n.includes('..') ? n : null; }
function isAudio(b) {
  if (b.length < 200) return false;
  const h = b.subarray(0, 4).toString('latin1');
  return h.startsWith('ID3') || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) || h === 'RIFF' || h === 'OggS' || b.subarray(4, 8).toString('latin1') === 'ftyp';
}
async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { redirect: 'follow' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const b = Buffer.from(await r.arrayBuffer());
      if (b.length > MAX) throw new Error('fichier trop gros');
      return b;
    } catch (e) { if (i === 2) throw e; await new Promise(r => setTimeout(r, 1500 * (i + 1))); }
  }
}
(async () => {
  if (!fs.existsSync(Q)) return console.log('Pas de file d\'attente.');
  const lists = fs.readdirSync(Q).filter(f => f.endsWith('.json')).sort();
  let ok = 0, ko = 0; const log = [];
  for (const f of lists) {
    let items = [];
    try { items = JSON.parse(fs.readFileSync(path.join(Q, f), 'utf8')); } catch (e) { console.log(`✗ ${f} illisible`); log.push(`✗ ${f} illisible`); }
    if (!Array.isArray(items)) items = [];
    for (const it of items) {
      const out = okOut(it && it.out);
      if (!out || !okUrl(it.url)) { console.log(`✗ refusé : ${it && it.out}`); log.push(`✗ refusé : ${it && it.out}`); ko++; continue; }
      try {
        const b = await get(it.url);
        if (!isAudio(b)) throw new Error('ce n\'est pas un fichier audio');
        const dst = path.join(ROOT, out); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, b);
        console.log(`✓ ${out} (${Math.round(b.length / 1024)} Ko)`); ok++;
      } catch (e) { console.log(`✗ ${out} : ${e.message}`); log.push(`✗ ${out} : ${e.message}`); ko++; }
    }
    fs.unlinkSync(path.join(Q, f));
  }
  console.log(`${ok} fichier(s) importé(s), ${ko} échec(s).`);
  // trace lisible depuis le dépôt (le robot n'a pas d'autre moyen de rendre compte)
  if (ok || ko) fs.appendFileSync(path.join(Q, 'journal.txt'), `${new Date().toISOString()} · ${ok} importé(s), ${ko} échec(s)\n` + log.map(l => '    ' + l + '\n').join(''));
})();
