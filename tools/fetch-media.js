// Robot « médias » : télécharge les fichiers listés dans media-queue/*.json puis supprime les listes.
// Format d'une liste : [{ "url": "https://…", "out": "assets/sons/kick.mp3" }, …]
// Images (textures photo libres de droits CC0 de Poly Haven) : on peut ajouter de quoi les réduire avant de les ranger,
//   { "url": "https://dl.polyhaven.org/…", "out": "assets/textures/ciel_jour.jpg", "resize": "4096x2048", "crop": "4096x1024+0+0", "quality": 84 }
//   (le fichier d'origine, souvent énorme, n'est jamais enregistré dans le dépôt : seulement la version réduite)
// Sécurité : seulement des liens https vers ElevenLabs / Google Cloud Storage / Poly Haven / Pexels / Unsplash (photos libres), seulement vers assets/ ou media-raw/,
// seulement des fichiers audio ou image (vérifiés à leurs premiers octets).
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), Q = path.join(ROOT, 'media-queue');
const HOSTS = [/\.elevenlabs\.io$/, /^elevenlabs\.io$/, /^storage\.googleapis\.com$/, /\.storage\.googleapis\.com$/, /\.googleusercontent\.com$/, /^dl\.polyhaven\.org$/, /^images\.pexels\.com$/, /^images\.unsplash\.com$/];
const MAX = 45 * 1024 * 1024, MAX_OUT = 8 * 1024 * 1024;
let sharp = null; try { sharp = require('sharp'); } catch (e) { }

function okUrl(u) { try { const x = new URL(u); return x.protocol === 'https:' && HOSTS.some(h => h.test(x.hostname)); } catch (e) { return false; } }
function okOut(o) { const n = path.posix.normalize(String(o || '')); return /^(assets|media-raw)\/[\w\-./]+\.(mp3|wav|ogg|m4a|jpg|jpeg|png|webp)$/.test(n) && !n.includes('..') ? n : null; }
const imgOut = o => /\.(jpg|jpeg|png|webp)$/.test(o);
function isAudio(b) {
  if (b.length < 200) return false;
  const h = b.subarray(0, 4).toString('latin1');
  return h.startsWith('ID3') || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) || h === 'RIFF' || h === 'OggS' || b.subarray(4, 8).toString('latin1') === 'ftyp';
}
function isImage(b) {
  if (b.length < 200) return false;
  return (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) || b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) || (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP');
}
// réduction / recadrage d'une image (sharp, installé par le robot juste avant)
async function shrink(b, it, out) {
  const want = it.resize || it.crop || it.quality;
  if (!want) return b;
  if (!sharp) throw new Error('outil d\'images absent (sharp)');
  let p = sharp(b, { limitInputPixels: 6e8 }).rotate();
  const rs = /^(\d{2,5})x(\d{2,5})(!?)$/.exec(String(it.resize || ''));
  if (it.resize && !rs) throw new Error('taille demandée invalide');
  if (rs) p = p.resize(+rs[1], +rs[2], { fit: rs[3] ? 'fill' : 'inside', kernel: 'lanczos3' });
  const cr = /^(\d{1,5})x(\d{1,5})\+(\d{1,5})\+(\d{1,5})$/.exec(String(it.crop || ''));
  if (it.crop && !cr) throw new Error('recadrage invalide');
  if (cr) { p = sharp(await p.toBuffer(), { limitInputPixels: 6e8 }).extract({ width: +cr[1], height: +cr[2], left: +cr[3], top: +cr[4] }); }
  const q = Math.max(40, Math.min(95, +it.quality || 84));
  if (/\.png$/.test(out)) p = p.png({ compressionLevel: 9 });
  else if (/\.webp$/.test(out)) p = p.webp({ quality: q });
  else p = p.jpeg({ quality: q, mozjpeg: true, progressive: true });
  return p.toBuffer();
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
        let b = await get(it.url);
        if (imgOut(out)) {
          if (!isImage(b)) throw new Error('ce n\'est pas une image');
          const n0 = b.length; b = await shrink(b, it, out);
          if (b.length > MAX_OUT) throw new Error('image encore trop lourde après réduction');
          if (b.length !== n0) log.push(`  ${out} : ${Math.round(n0 / 1024)} Ko → ${Math.round(b.length / 1024)} Ko`);
        } else if (!isAudio(b)) throw new Error('ce n\'est pas un fichier audio');
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
