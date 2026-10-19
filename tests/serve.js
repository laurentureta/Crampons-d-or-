// Petit serveur local du vrai site (multi-fichiers). Avec TEST=1, jeu.js est remplacé par dist/jeu-test.js (accès window.__T pour les tests).
// node tests/serve.js [port]  →  http://localhost:8767/
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), PORT = +(process.argv[2] || 8767);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.mp3': 'audio/mpeg', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
http.createServer((q, r) => {
  let f = decodeURIComponent(q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html';
  if (process.env.TEST && f === '/jeu.js') f = '/dist/jeu-test.js';
  const p = path.join(root, f); if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); fs.createReadStream(p).pipe(r);
}).listen(PORT, () => console.log('http://localhost:' + PORT + '/'));
