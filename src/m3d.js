// ===================== RENDU 3D DU MATCH : WebGL (Three.js intégré) =====================
// Stade construit selon l'affluence, pelouse tondue, joueurs articulés et animés (course, frappe, tête,
// tacle glissé, plongeon, célébrations, chutes), ballon qui tourne, ombres, nocturne, pluie, neige,
// filets qui tremblent, écran géant, caméras TV / large / tactique et caméras de ralenti.
// Repère 3D : X = longueur (centre du terrain en 0), Z = largeur (vers la caméra principale), Y = hauteur.
const G3 = { ok: null, lost: false, fail: false, r: null, cv: null, sc: null, cam: null, M: null, w: 0, h: 0, q: '', ft: [], lowAuto: false, cm: { x: 0, tx: 0, tz: 0, fov: 30, y: 18, z: 74, lx: 0, ly: 0, lz: 0, init: false }, ph: new Float32Array(25), lastT: null, stad: null, P: null, sb: null, sbKey: '' };
function g3Avail() {
  if (G3.ok != null) return G3.ok;
  try { const c = document.createElement('canvas'); G3.ok = !!(typeof THREE !== 'undefined' && THREE.WebGLRenderer && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { G3.ok = false; }
  return G3.ok;
}
const g3Mode = () => (typeof OPTS !== 'undefined' && OPTS.gfx) || '3d';
function g3On() { return g3Mode() !== '2d' && !G3.lost && !G3.fail && typeof document !== 'undefined' && g3Avail(); }
const g3Low = () => g3Mode() === '3dl' || G3.lowAuto;
const W3 = (x, y) => [x - 52.5, y - 34];
function g3Col(c) { const t = new THREE.Color(); c = String(c).replace(/hsl\(\s*([\d.]+)\s+([\d.]+%)\s+([\d.]+%)\s*\)/, 'hsl($1, $2, $3)'); try { t.setStyle(c); } catch (e) { t.set(0x888888); } return t; }
const g3Lin = c => g3Col(c).convertSRGBToLinear();
function g3Tex(cv, rep) { const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = G3.r ? Math.min(8, G3.r.capabilities.getMaxAnisotropy()) : 1; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
function g3Canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
// fusion simple de géométries (sans index)
function g3Merge(list) {
  const geos = list.map(g => g.index ? g.toNonIndexed() : g); let n = 0; for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3); let o = 0, hasC = geos.some(g => g.attributes.color);
  for (const g of geos) { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2); if (hasC) { if (g.attributes.color) col.set(g.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + c) * 3); } o += c; }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); if (hasC) m.setAttribute('color', new THREE.BufferAttribute(col, 3)); return m;
}
const g3Tint = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3), cc = new THREE.Color(c); for (let i = 0; i < n; i++) { a[i * 3] = cc.r; a[i * 3 + 1] = cc.g; a[i * 3 + 2] = cc.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };

// ---------- Initialisation (une fois) ----------
function g3Init() {
  if (G3.r) return true;
  try {
    const cv = document.createElement('canvas'); cv.className = 'g3';
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
    r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    cv.addEventListener('webglcontextlost', e => { e.preventDefault(); G3.lost = true; }, false);
    cv.addEventListener('webglcontextrestored', () => { G3.lost = false; G3.M = null; }, false);
    G3.r = r; G3.cv = cv;
    const sc = new THREE.Scene(); G3.sc = sc;
    G3.cam = new THREE.PerspectiveCamera(30, 1.6, .5, 1400);
    // lumières
    G3.hemi = new THREE.HemisphereLight(0xcfe3ff, 0x40613a, .6); sc.add(G3.hemi);
    const sun = new THREE.DirectionalLight(0xfff0dc, 1.5); sun.position.set(-45, 70, -35); sun.castShadow = true;
    const sh = sun.shadow; sh.mapSize.set(2048, 2048); sh.camera.left = -64; sh.camera.right = 64; sh.camera.top = 44; sh.camera.bottom = -44; sh.camera.near = 10; sh.camera.far = 220; sh.bias = -.0006; sh.normalBias = .03;
    sc.add(sun); sc.add(sun.target); G3.sun = sun;
    g3Players(); g3Ball();
    return true;
  } catch (e) { G3.fail = true; return false; }
}
// ---------- Joueurs : un maillage instancié par partie du corps ----------
const G3N = 25; // 22 joueurs + arbitre + 2 assistants
// géométrie d'un joueur (avant = +x, côtés = z) ; les teintes de sommets assombrissent col, poignets, sourcils, semelles…
function g3Body() {
  const V2 = (a) => a.map(([r, y]) => new THREE.Vector2(r, y)), lathe = (pts, seg) => new THREE.LatheGeometry(V2(pts), seg || 16);
  const T = (g, c) => g3Tint(g, c == null ? 0xffffff : c), sph = (r, w, h) => new THREE.SphereGeometry(r, w || 12, h || 9);
  const torso = g3Merge([
    T(lathe([[.001, 0], [.15, 0], [.153, .07], [.162, .18], [.183, .3], [.2, .4], [.206, .46], [.195, .51], [.15, .545], [.08, .565], [.062, .572]], 18).scale(.64, 1, 1)),
    T(sph(.074, 12, 9).scale(.85, .8, 1).translate(0, .475, .19)), T(sph(.074, 12, 9).scale(.85, .8, 1).translate(0, .475, -.19)),
    T(new THREE.TorusGeometry(.062, .016, 6, 18).rotateX(Math.PI / 2).scale(.85, 1, 1).translate(.004, .566, 0), 0x6b6b6b),
    T(new THREE.CylinderGeometry(.152, .151, .035, 18, 1, true).scale(.64, 1, 1).translate(0, .02, 0), 0x8a8a8a)]);
  const shorts = lathe([[.001, .075], [.158, .075], [.168, .03], [.182, -.06], [.195, -.15], [.2, -.2]], 16).scale(.78, 1, 1);
  const head = g3Merge([
    T(sph(.106, 22, 16).scale(1, 1.12, .9)),
    T(sph(.016, 8, 6).scale(1.1, 1.5, .9).translate(.103, -.008, 0)), T(sph(.024, 8, 6).scale(.5, 1, .8).translate(-.004, -.004, .1)), T(sph(.024, 8, 6).scale(.5, 1, .8).translate(-.004, -.004, -.1)),
    T(sph(.0125, 8, 6).translate(.094, .022, .036), 0x1a1a1a), T(sph(.0125, 8, 6).translate(.094, .022, -.036), 0x1a1a1a),
    T(new THREE.BoxGeometry(.01, .011, .042).translate(.099, .047, .036), 0x3a3a3a), T(new THREE.BoxGeometry(.01, .011, .042).translate(.099, .047, -.036), 0x3a3a3a),
    T(new THREE.BoxGeometry(.006, .008, .036).translate(.098, -.052, 0), 0x7a4a4a),
    T(new THREE.CylinderGeometry(.05, .058, .15, 10).translate(-.005, -.125, 0))]);
  const hair = new THREE.SphereGeometry(.115, 18, 10, 0, Math.PI * 2, 0, Math.PI * .55).scale(1.02, 1, .97).rotateZ(.32).translate(-.01, .018, 0);
  const uarm = g3Merge([T(sph(.064, 10, 8)), T(new THREE.CylinderGeometry(.064, .058, .15, 10).translate(0, -.075, 0)), T(new THREE.TorusGeometry(.056, .009, 5, 12).rotateX(Math.PI / 2).translate(0, -.148, 0), 0x707070)]);
  const ubare = new THREE.CylinderGeometry(.051, .045, .17, 10).translate(0, -.215, 0);
  const farm = g3Merge([T(sph(.046, 9, 7)), T(lathe([[.046, 0], [.048, -.06], [.042, -.14], [.034, -.25], [.032, -.27]], 10))]);
  const hand = g3Merge([sph(.045, 9, 7).scale(.62, 1.22, .92).translate(0, -.03, 0), sph(.018, 6, 5).translate(.03, -.01, 0)]);
  const thigh = g3Merge([lathe([[.092, 0], [.094, -.07], [.088, -.19], [.075, -.33], [.062, -.42], [.058, -.45]], 12), sph(.06, 10, 8).scale(1.05, .9, 1).translate(.006, -.45, 0)]);
  const shin = g3Merge([T(lathe([[.063, 0], [.066, -.05], [.069, -.13], [.06, -.25], [.047, -.37], [.043, -.45]], 12)), T(new THREE.CylinderGeometry(.068, .069, .045, 12, 1, true).translate(0, -.06, 0), 0xb0b0b0)]);
  const bt = new THREE.BoxGeometry(.26, .075, .1, 4, 2, 2); const pa = bt.attributes.position;
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i); if (x > .05) { const k = 1 - (x - .05) / .1 * .38; pa.setZ(i, pa.getZ(i) * k); if (y > 0) pa.setY(i, y - (x - .05) * .25); } if (x < -.1) pa.setZ(i, pa.getZ(i) * .9); }
  bt.computeVertexNormals(); bt.translate(.055, -.035, 0);
  const boot = g3Merge([T(bt), T(new THREE.BoxGeometry(.25, .014, .092).translate(.055, -.077, 0), 0x2a2a2a)]);
  return { torso, shorts, head, hair, uarm, ubare, farm, hand, thigh, shin, boot };
}
// les 11 maillages d'un corps (instanciés N fois) : utilisés par le match et par la vitrine de la Boutique
function g3Parts(sc, N) {
  const P = {};
  const std = (rough) => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: rough, metalness: 0 });
  const mk = (geo, mat, n, shadow) => { const m = new THREE.InstancedMesh(geo, mat, n); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.castShadow = shadow !== false; m.receiveShadow = false; for (let i = 0; i < n; i++) m.setColorAt(i, new THREE.Color(1, 1, 1)); sc.add(m); return m; };
  // corps plus réaliste (v11) : buste galbé, visage, manches, chaussettes, crampons profilés
  const B = g3Body(), stdV = rough => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: rough, metalness: 0, vertexColors: true });
  const shortM = std(.7); shortM.side = THREE.DoubleSide;
  P.torso = mk(B.torso, stdV(.78), N); P.shorts = mk(B.shorts, shortM, N); P.head = mk(B.head, stdV(.55), N); P.hair = mk(B.hair, std(.9), N);
  P.uarm = mk(B.uarm, stdV(.78), N * 2); P.ubare = mk(B.ubare, std(.55), N * 2); P.farm = mk(B.farm, std(.55), N * 2); P.hand = mk(B.hand, std(.6), N * 2);
  P.thigh = mk(B.thigh, std(.55), N * 2); P.shin = mk(B.shin, stdV(.8), N * 2); P.boot = mk(B.boot, stdV(.35), N * 2);
  return P;
}
function g3Players() {
  const sc = G3.sc, P = g3Parts(sc, G3N);
  // numéros dans le dos (atlas 10×10)
  // numéros de maillot en police « collège » (Graduate), redessinés dès que la police est chargée
  const [ac, ax] = g3Canvas(1024, 1024);
  const drawNums = () => { ax.clearRect(0, 0, 1024, 1024); ax.textAlign = 'center'; ax.textBaseline = 'middle'; ax.font = "64px Graduate, 'Arial Black', Arial, sans-serif"; for (let n = 0; n < 100; n++) { const cx = (n % 10) * 102.4 + 51.2, cy = Math.floor(n / 10) * 102.4 + 54; ax.lineWidth = 9; ax.strokeStyle = 'rgba(0,0,0,.55)'; ax.strokeText(String(n), cx, cy); ax.fillStyle = '#fff'; ax.fillText(String(n), cx, cy); } };
  drawNums();
  const atlas = g3Tex(ac);
  try { if (document.fonts && !document.fonts.check('64px Graduate')) document.fonts.load('64px Graduate').then(() => { if (document.fonts.check('64px Graduate')) { drawNums(); atlas.needsUpdate = true; } }).catch(() => { }); } catch (e) { } const numG = new THREE.PlaneGeometry(.2, .2); numG.rotateY(-Math.PI / 2);
  numG.setAttribute('aNum', new THREE.InstancedBufferAttribute(new Float32Array(G3N * 2), 2));
  const numM = new THREE.MeshBasicMaterial({ map: atlas, transparent: true, depthWrite: false });
  numM.onBeforeCompile = s => { s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aNum;').replace('#include <uv_vertex>', 'vUv = uv * 0.1 + aNum;'); };
  P.num = new THREE.InstancedMesh(numG, numM, G3N); P.num.instanceMatrix.setUsage(THREE.DynamicDrawUsage); P.num.frustumCulled = false; sc.add(P.num);
  // ombres douces (nocturne : 4 ombres vers les pylônes)
  const [bc, bx] = g3Canvas(64, 64); const gr = bx.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); bx.fillStyle = gr; bx.fillRect(0, 0, 64, 64);
  const blobG = new THREE.PlaneGeometry(1, 1); blobG.rotateX(-Math.PI / 2);
  P.blob = new THREE.InstancedMesh(blobG, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bc), transparent: true, depthWrite: false, opacity: .5 }), G3N * 4 + 4); P.blob.instanceMatrix.setUsage(THREE.DynamicDrawUsage); P.blob.frustumCulled = false; P.blob.renderOrder = 1; sc.add(P.blob);
  // repère de ton joueur
  const ring = new THREE.Mesh(new THREE.RingGeometry(.55, .72, 32), new THREE.MeshBasicMaterial({ color: 0xf5c542, transparent: true, opacity: .9, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.renderOrder = 2; sc.add(ring); P.ring = ring;
  // drapeaux des assistants
  const flagG = g3Merge([g3Tint(new THREE.CylinderGeometry(.012, .012, .5, 4).translate(0, -.25, 0), 0xdddddd), g3Tint(new THREE.BoxGeometry(.01, .2, .28).translate(0, -.1, .14), 0xff9a1f)]);
  P.flag = new THREE.InstancedMesh(flagG, new THREE.MeshLambertMaterial({ vertexColors: true }), 2); P.flag.frustumCulled = false; sc.add(P.flag);
  G3.P = P;
}
function g3Ball() {
  const [c, x] = g3Canvas(512, 256); x.fillStyle = '#f7f7f4'; x.fillRect(0, 0, 512, 256);
  // panneaux : motif moderne (triangles et pentagones sombres)
  const pent = (cx, cy, r, col) => { x.fillStyle = col; x.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; x.lineTo(cx + Math.cos(a) * r * 1.6, cy + Math.sin(a) * r); } x.closePath(); x.fill(); };
  for (let i = 0; i < 6; i++) { pent(i * 85 + 30, 60, 22, '#1d1d24'); pent(i * 85 + 72, 190, 22, '#1d1d24'); }
  pent(256, 6, 30, '#1d1d24'); pent(256, 250, 30, '#1d1d24');
  x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 3; for (let i = 0; i < 12; i++) { x.beginPath(); x.moveTo(i * 43, 0); x.lineTo(i * 43 + 30, 256); x.stroke(); }
  G3.ballTex = g3Tex(c); G3.ballTexSnow = null;
  const m = new THREE.Mesh(new THREE.SphereGeometry(.11, 22, 16), new THREE.MeshStandardMaterial({ map: G3.ballTex, roughness: .42, metalness: 0 }));
  m.castShadow = true; G3.sc.add(m); G3.ball = m; G3.bq = new THREE.Quaternion();
}

// ---------- Stade (par match) ----------
function g3Dispose(o) { o.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material) { const ms = Array.isArray(n.material) ? n.material : [n.material]; for (const mt of ms) { for (const k of ['map', 'emissiveMap', 'alphaMap']) if (mt[k]) mt[k].dispose(); mt.dispose(); } } }); }
function g3Match(M) {
  const sc = G3.sc, C = M.cond || {}, low = g3Low();
  if (G3.stad) { sc.remove(G3.stad); g3Dispose(G3.stad); G3.stad = null; }
  if (G3.wx) { sc.remove(G3.wx); g3Dispose(G3.wx); G3.wx = null; } G3.wxU = null; G3.crowdU = null;
  const S3 = new THREE.Group(); G3.stad = S3; sc.add(S3);
  let rs = (C.seed || 7) * 9301 + 49297; const rnd = () => (rs = (rs * 9301 + 49297) % 233280) / 233280;
  const night = !!C.night, wet = !!C.rain, snow = !!C.snow, att = C.att || 15000;
  const cls = att < 900 ? 0 : att < 8000 ? 1 : att < 30000 ? 2 : 3; G3.cls = cls;
  G3.camB = [[74, 16], [76, 17], [53, 17], [60, 24]][cls];
  // ciel et brouillard
  const top = night ? '#03060d' : wet || snow ? '#566070' : '#3f78c4', hor = night ? '#16213a' : wet || snow ? '#9aa3ad' : '#b9d4ee';
  const skyM = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { a: { value: g3Col(top) }, b: { value: g3Col(hor) } }, vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }', fragmentShader: 'uniform vec3 a; uniform vec3 b; varying vec3 vP; void main(){ float h = clamp(normalize(vP).y * 2.2, 0.0, 1.0); gl_FragColor = vec4(mix(b, a, h), 1.0); }' });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 12), skyM); S3.add(sky);
  sc.fog = new THREE.Fog(g3Lin(hor), snow ? 90 : wet ? 140 : 260, snow ? 380 : wet ? 520 : 900);
  // lumières selon l'heure et la météo
  G3.hemi.color.set(night ? 0x9fb3e8 : wet || snow ? 0xc7ced6 : 0xcfe3ff); G3.hemi.groundColor.set(night ? 0x16241a : 0x40613a); G3.hemi.intensity = night ? .42 : wet || snow ? .85 : .6;
  G3.sun.color.set(night ? 0xeef3ff : wet || snow ? 0xdfe4ea : 0xfff0dc); G3.sun.intensity = night ? 1.05 : wet || snow ? .75 : 1.55;
  G3.sun.position.set(night ? -8 : -45, night ? 80 : 70, night ? -6 : -35);
  G3.sun.castShadow = !low && !night; G3.sun.shadow.mapSize.set(low ? 1024 : 2048, low ? 1024 : 2048); if (G3.sun.shadow.map) { G3.sun.shadow.map.dispose(); G3.sun.shadow.map = null; }
  G3.r.toneMappingExposure = night ? 1.12 : wet || snow ? 1.1 : 1.02;
  G3.night = night;
  // pelouse : bandes tondues, grain, usure
  const TW = low ? 1024 : 2048, TH = TW / 2, [pc, px] = g3Canvas(TW, TH), fx = TW / 125, fy = TH / 88;
  const g1 = snow ? '#d9e0e2' : wet ? '#25692d' : '#2f7a35', g2 = snow ? '#e3e9ea' : wet ? '#2c7836' : '#3a8a40';
  px.fillStyle = snow ? '#cfd7d9' : '#2c6e31'; px.fillRect(0, 0, TW, TH);
  for (let i = 0; i < 18; i++) { px.fillStyle = i % 2 ? g2 : g1; px.fillRect((10 + i * PL / 18) * fx, 10 * fy, PL / 18 * fx + 1, PW * fy); }
  px.globalAlpha = .07; for (let i = 0; i < (low ? 9000 : 26000); i++) { const l = rnd(); px.fillStyle = l < .5 ? '#000' : '#fff'; px.fillRect(rnd() * TW, rnd() * TH, 1 + rnd() * 2.5, 1 + rnd() * 2.5); } px.globalAlpha = 1;
  const FX = LV.fx || { patches: [] };
  for (const [x0, y0, r, al] of FX.patches) { const g = px.createRadialGradient((x0 + 10) * fx, (y0 + 10) * fy, 0, (x0 + 10) * fx, (y0 + 10) * fy, r * fx * 1.3); g.addColorStop(0, `rgba(${snow ? '120,110,95' : '118,92,55'},${al * .75})`); g.addColorStop(1, 'rgba(118,92,55,0)'); px.fillStyle = g; px.fillRect((x0 + 10 - r * 1.4) * fx, (y0 + 10 - r * 1.4) * fy, r * 2.8 * fx, r * 2.8 * fy); }
  if (snow) { px.globalAlpha = .12; for (let i = 0; i < 30; i++) { px.fillStyle = '#93b58b'; px.beginPath(); px.ellipse((10 + rnd() * PL) * fx, (10 + rnd() * PW) * fy, (2 + rnd() * 5) * fx, (1 + rnd() * 3) * fy, rnd() * 3, 0, 7); px.fill(); } px.globalAlpha = 1; }
  const grassM = new THREE.MeshStandardMaterial({ map: g3Tex(pc), roughness: wet ? .5 : snow ? .8 : .93, metalness: 0 });
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(125, 88), grassM); pitch.rotation.x = -Math.PI / 2; pitch.receiveShadow = true; S3.add(pitch);
  // lignes peintes
  const L = [], seg = (x1, z1, x2, z2, w) => { const dx = x2 - x1, dz = z2 - z1, d = Math.hypot(dx, dz) || 1, nx = -dz / d * w / 2, nz = dx / d * w / 2; L.push(x1 + nx, .015, z1 + nz, x2 + nx, .015, z2 + nz, x2 - nx, .015, z2 - nz, x1 + nx, .015, z1 + nz, x2 - nx, .015, z2 - nz, x1 - nx, .015, z1 - nz); };
  const poly = (pts, w) => { for (let i = 1; i < pts.length; i++) seg(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], w); };
  const arc = (cx, cz, r, a0, a1, n) => { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } poly(p, .12); };
  poly([[-52.5, -34], [52.5, -34], [52.5, 34], [-52.5, 34], [-52.5, -34]], .12); seg(0, -34, 0, 34, .12); arc(0, 0, 9.15, 0, Math.PI * 2, 64); arc(0, 0, .2, 0, Math.PI * 2, 10); arc(0, 0, .12, 0, Math.PI * 2, 8);
  for (const s of [-1, 1]) { const x0 = s * 52.5, d = -s; poly([[x0, -20.16], [x0 + d * 16.5, -20.16], [x0 + d * 16.5, 20.16], [x0, 20.16]], .12); poly([[x0, -9.16], [x0 + d * 5.5, -9.16], [x0 + d * 5.5, 9.16], [x0, 9.16]], .12); arc(x0 + d * 11, 0, .13, 0, Math.PI * 2, 8); const a0 = Math.acos(5.5 / 9.15); arc(x0 + d * 11, 0, 9.15, s > 0 ? Math.PI - a0 : -a0, s > 0 ? Math.PI + a0 : a0, 24); for (const sz of [-1, 1]) arc(x0, sz * 34, 1, s > 0 ? (sz > 0 ? Math.PI : Math.PI / 2) : (sz > 0 ? -Math.PI / 2 : 0), s > 0 ? (sz > 0 ? Math.PI * 1.5 : Math.PI) : (sz > 0 ? 0 : Math.PI / 2), 8); }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(L, 3)); lg.computeVertexNormals();
  const lines = new THREE.Mesh(lg, new THREE.MeshLambertMaterial({ color: snow ? 0x2f6fd0 : 0xffffff, emissive: snow ? 0x0a2050 : 0x404040, polygonOffset: true, polygonOffsetFactor: -2 })); lines.receiveShadow = true; S3.add(lines);
  // buts et filets
  G3.nets = [];
  const postM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .35, metalness: .1 });
  G3.netWind = wet || snow ? 1.7 : .6;
  for (const s of [-1, 1]) {
    const gx = s * 52.5, g = new THREE.Group(); g.position.x = gx; S3.add(g);
    const post = new THREE.CylinderGeometry(.06, .06, 2.44, 10); post.translate(0, 1.22, 0);
    for (const z of [-3.72, 3.72]) { const m = new THREE.Mesh(post, postM); m.position.z = z; m.castShadow = true; g.add(m); }
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 7.56, 10), postM); bar.rotation.x = Math.PI / 2; bar.position.y = 2.44; bar.castShadow = true; g.add(bar);
    G3.nets.push(g3NetBuild(g, s, low, postM)); // filet déformable (m3dnet.js)
  }
  // poteaux de corner
  for (const x of [-52.5, 52.5]) for (const z of [-34, 34]) { const f = new THREE.Mesh(g3Merge([g3Tint(new THREE.CylinderGeometry(.025, .025, 1.5, 5).translate(0, .75, 0), 0xffffff), g3Tint(new THREE.BoxGeometry(.01, .32, .45).translate(0, 1.33, .23), night ? 0xffd23a : 0xf3c12a)]), new THREE.MeshLambertMaterial({ vertexColors: true })); f.position.set(x, 0, z); S3.add(f); }
  // panneaux publicitaires (défilants)
  const [ac, ax] = g3Canvas(1024, 64); ax.fillStyle = '#0b2f28'; ax.fillRect(0, 0, 1024, 64); ax.font = '900 34px Arial, sans-serif'; ax.textBaseline = 'middle';
  const ads = ['CRAMPONS D\'OR', 'LIGUE DES RÊVES', 'SPORT 66', 'ÉNERGIE BLEUE', 'MAISON COSY']; let xx = 10; for (let i = 0; i < 8; i++) { const t = ads[i % ads.length]; ax.fillStyle = i % 2 ? '#ffd166' : '#ffffff'; ax.fillText(t, xx, 33); xx += ax.measureText(t).width + 50; }
  const adT = g3Tex(ac, [3, 1]); G3.adT = adT;
  const adM = new THREE.MeshBasicMaterial({ map: adT }), adB = new THREE.MeshLambertMaterial({ color: 0x14181c });
  if (cls >= 1) {
    const board = (len, x, z, ry) => { const g = new THREE.Mesh(new THREE.BoxGeometry(len, .9, .12), [adB, adB, adB, adB, adM, adB]); g.position.set(x, .45, z); g.rotation.y = ry; S3.add(g); };
    board(110, 0, -38, 0); board(110, 0, 38.5, Math.PI); board(60, -57, 0, Math.PI / 2); board(60, 57, 0, -Math.PI / 2);
  }
  // tribunes et public
  g3Stands(S3, M, cls, rnd, night);
  // météo
  if (wet || snow) g3Weather(snow, low);
  G3.sbKey = ''; G3.M = M; G3.cm.init = false; G3.lastT = null;
  G3.ball.material.color.set(snow ? 0xff8a1c : 0xffffff);
}
// Tribunes (taille selon l'affluence) + public animé + pylônes d'éclairage
function g3Stands(S3, M, cls, rnd, night) {
  const C = M.cond || {}, att = C.att || 15000, kc = M.kits ? M.kits[M.side === 'h' ? 0 : 1] : null, hc = kc ? g3Lin(kc.col) : g3Lin('#c33'), oc = M.kits ? g3Lin(M.kits[M.side === 'h' ? 1 : 0].col) : g3Lin('#33c');
  const seatCol = cls >= 2 ? hc.clone().multiplyScalar(.55) : new THREE.Color(0x5a6068), wallM = new THREE.MeshLambertMaterial({ color: night ? 0x2a2f38 : 0x8a8f96 }), roofM = new THREE.MeshLambertMaterial({ color: 0x2d3238 }), sideM = new THREE.MeshLambertMaterial({ color: night ? 0x1d2129 : 0x4b515a, side: THREE.DoubleSide });
  const stands = []; // [x, z, rotY, longueur, profondeur, h0, h1]
  if (cls === 0) stands.push([0, -41, 0, 30, 6, .4, 3]);
  else if (cls === 1) { stands.push([0, -42, 0, 84, 12, .6, 6.5]); stands.push([0, 42, Math.PI, 70, 9, .6, 5]); }
  else if (cls === 2) { stands.push([0, -42, 0, 106, 20, 1, 12]); stands.push([0, 42, Math.PI, 106, 18, 1, 11]); stands.push([-59, 0, Math.PI / 2, 66, 15, 1, 10]); stands.push([59, 0, -Math.PI / 2, 66, 15, 1, 10]); for (const sx of [-1, 1]) stands.push([sx * 60, -45, Math.atan2(-sx, 1), 16, 15, 1, 10]); }
  else { stands.push([0, -42, 0, 112, 32, 1, 26]); stands.push([0, 42, Math.PI, 112, 30, 1, 24]); stands.push([-59, 0, Math.PI / 2, 76, 28, 1, 23]); stands.push([59, 0, -Math.PI / 2, 76, 28, 1, 23]); for (const sx of [-1, 1]) for (const sz of [-1, 1]) stands.push([sx * 63, sz * 46, Math.atan2(-sx, -sz), 26, 26, 1, 23]); }
  // gradins : pente texturée (rangées de sièges)
  const [sc2, sx] = g3Canvas(64, 256); for (let r = 0; r < 32; r++) { sx.fillStyle = r % 2 ? '#' + seatCol.getHexString() : '#' + seatCol.clone().multiplyScalar(.75).getHexString(); sx.fillRect(0, r * 8, 64, 8); sx.fillStyle = 'rgba(0,0,0,.35)'; sx.fillRect(0, r * 8 + 6, 64, 2); }
  const seatT = g3Tex(sc2);
  const cap = { 0: 400, 1: 6000, 2: 30000, 3: 80000 }[cls], fill = clamp(att / cap, .05, 1), perM2 = cls === 0 ? .7 : 1;
  const people = []; let budget = clamp(Math.round(att / (cls >= 2 ? 22 : cls === 1 ? 4 : 1)), 30, g3Low() ? 1800 : 3600);
  const totalArea = stands.reduce((a, s) => a + s[3] * s[4], 0), seats = [];
  for (const [x, z, ry, len, dep, h0, h1] of stands) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S3.add(g);
    // pente (le devant de la tribune est en z = 0, elle s'élève vers -z)
    if (cls <= 1) g.add(g3Terraces(len, dep, h0, h1, Math.max(3, Math.round(dep / .85)), night)); // petits stades : de vraies marches (les sièges du modèle 3D s'y posent)
    else {
      const slope = new THREE.PlaneGeometry(len, Math.hypot(dep, h1 - h0)); const a = Math.atan2(h1 - h0, dep); slope.rotateX(-Math.PI / 2 + a); slope.translate(0, (h0 + h1) / 2, -dep / 2);
      const tex = seatT.clone(); tex.needsUpdate = true; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(len / 2, Math.max(2, dep / 8));
      const sm = new THREE.Mesh(slope, new THREE.MeshLambertMaterial({ map: tex })); sm.receiveShadow = !g3Low(); g.add(sm);
    }
    const front = new THREE.Mesh(new THREE.BoxGeometry(len, h0 + .2, .3), wallM); front.position.set(0, (h0 + .2) / 2, .15); g.add(front);
    const camSide = ry === Math.PI && cls <= 1; // tribune sous la caméra : ni toit ni mur du fond
    if (!camSide) { const back = new THREE.Mesh(new THREE.BoxGeometry(len, h1 + (cls >= 2 ? 6 : 2), .6), wallM); back.position.set(0, (h1 + (cls >= 2 ? 6 : 2)) / 2, -dep - .3); g.add(back); }
    for (const sx2 of [-1, 1]) { const tg = new THREE.BufferGeometry(), H = h1 + (cls >= 2 ? 6 : 2); tg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, .2, 0, h0 + .3, .2, 0, H, -dep - .6, 0, 0, .2, 0, H, -dep - .6, 0, 0, -dep - .6], 3)); tg.computeVertexNormals(); const sw = new THREE.Mesh(tg, sideM); sw.position.x = sx2 * len / 2; g.add(sw); }
    if (cls >= 1 && !camSide && ry !== Math.PI) { const rh = h1 + (cls >= 2 ? 7 : 3), rd = dep * (cls === 3 ? .85 : .7); const roof = new THREE.Mesh(new THREE.BoxGeometry(len + 1, .5, rd), roofM); roof.position.set(0, rh, -dep + rd / 2 - .3); g.add(roof); if (night && cls >= 2) { const strip = new THREE.Mesh(new THREE.BoxGeometry(len * .9, .25, .25), new THREE.MeshBasicMaterial({ color: 0xfff6dc })); strip.position.set(0, rh - .35, -dep + rd); g.add(strip); } for (let i = -2; i <= 2; i++) { const pil = new THREE.Mesh(new THREE.BoxGeometry(.4, rh, .4), roofM); pil.position.set(i * len / 5, rh / 2, -dep - .2); g.add(pil); } }
    // public : réparti selon la surface et l'affluence
    const n = Math.round(budget * len * dep / totalArea), rows = Math.max(3, Math.round(dep / .85)), perRow = Math.max(4, Math.round(len / .62)), taken = cls <= 1 ? new Set() : null;
    const toW = (lx, ld) => [x + Math.cos(ry) * lx - Math.sin(ry) * ld, z - Math.sin(ry) * lx - Math.cos(ry) * ld];
    if (taken) for (let r = 0; r < rows; r++) for (let c = 0; c < perRow; c++) { const lx = -len / 2 + (c + .5) * len / perRow, ld = (r + .5) * dep / rows, [wx, wz] = toW(lx, ld); seats.push(wx, h0 + (h1 - h0) * ld / dep, wz, ry); }
    for (let k = 0; k < n; k++) {
      let r, c; if (fill > .85) { r = Math.floor(rnd() * rows); c = Math.floor(rnd() * perRow); } else { r = Math.floor(Math.pow(rnd(), 1.4) * rows); c = Math.floor((.5 + (rnd() - .5) * Math.min(1, fill * 1.6)) * perRow); }
      if (taken) { let key = r * perRow + c, tries = 0; while (taken.has(key) && tries++ < 8) { c = (c + 1) % perRow; key = r * perRow + c; } if (taken.has(key)) continue; taken.add(key); }
      const lx = -len / 2 + (c + .5) * len / perRow + (taken ? 0 : (rnd() - .5) * .2), ld = (r + .5) * dep / rows, ly = h0 + (h1 - h0) * ld / dep;
      const wx = x + Math.cos(ry) * lx - Math.sin(ry) * ld, wz = z - Math.sin(ry) * lx - Math.cos(ry) * ld;
      const col = rnd() < (C.derby ? .5 : .62) ? (rnd() < .82 ? hc : oc) : new THREE.Color().setHSL(rnd(), .15 + rnd() * .3, .25 + rnd() * .5);
      people.push([wx, ly, wz, ry, col, rnd()]);
    }
  }
  // spectateurs instanciés, qui se lèvent et sautent selon l'ambiance (shader)
  if (people.length) {
    const body = g3Merge([new THREE.BoxGeometry(.42, .62, .28).translate(0, .31, 0), g3Tint(new THREE.BoxGeometry(.2, .22, .2).translate(0, .74, 0), 0xe0b090)]);
    if (!body.attributes.color) g3Tint(body, 0xffffff);
    // le torse prend la couleur de l'instance, la tête reste couleur peau
    const cA = body.attributes.color.array; for (let i = 0; i < body.attributes.position.count; i++) if (body.attributes.position.array[i * 3 + 1] < .63) { cA[i * 3] = cA[i * 3 + 1] = cA[i * 3 + 2] = 1; }
    const ph = new Float32Array(people.length); body.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 1));
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    G3.crowdU = { uT: { value: 0 }, uE: { value: 0 } };
    mat.onBeforeCompile = s => { s.uniforms.uT = G3.crowdU.uT; s.uniforms.uE = G3.crowdU.uE; s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute float aPh; uniform float uT; uniform float uE;').replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.y += max(0.0, sin(uT * (6.0 + aPh * 3.0) + aPh * 40.0)) * uE * 0.32 + sin(uT * 0.9 + aPh * 17.0) * 0.015;'); };
    const im = new THREE.InstancedMesh(body, mat, people.length); im.frustumCulled = false;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    people.forEach(([x, y, z, ry, col, r], i) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry + Math.PI + (r - .5) * .4); const s = .9 + r * .25; one.set(s, s, s); m4.compose(v.set(x, y, z), q, one); im.setMatrixAt(i, m4); im.setColorAt(i, col); ph[i] = r; });
    S3.add(im);
  }
  // pylônes d'éclairage (ou poteaux pour les petits terrains) — remplacés par les mâts du modèle 3D dès qu'il est chargé
  let mastG = null;
  if (cls <= 2) {
    const pts = cls === 0 ? [[-40, -45], [0, -46], [40, -45], [-40, 45], [0, 46], [40, 45]] : [[-66, -52], [66, -52], [-66, 52], [66, 52]];
    const hgt = cls === 0 ? 16 : cls === 1 ? 30 : 42, mastM = new THREE.MeshLambertMaterial({ color: 0x6b7178 }), lampM = new THREE.MeshBasicMaterial({ color: night ? 0xfffbea : 0xd7dbe0 }), mg = new THREE.Group(); S3.add(mg); mastG = mg;
    for (const [x, z] of pts) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.25, .45, hgt, 8), mastM); m.position.set(x, hgt / 2, z); mg.add(m); const p = new THREE.Mesh(new THREE.BoxGeometry(cls === 0 ? 1.5 : 5, cls === 0 ? 1 : 3.5, .4), lampM); p.position.set(x, hgt + 1, z); p.lookAt(0, 0, 0); mg.add(p); if (night) g3Glow(mg, x * .98, hgt + 1, z * .98, cls === 0 ? 10 : 26); }
    G3.lamps = pts.map(([x, z]) => [x, hgt, z]);
  } else { G3.lamps = [[-58, 30, -46], [58, 30, -46], [-58, 30, 46], [58, 30, 46]]; if (night) for (const [x, y, z] of G3.lamps) g3Glow(S3, x, y, z, 20); }
  // petits terrains : arbres et barrière
  if (cls === 0) {
    const tr = new THREE.InstancedMesh(g3Merge([g3Tint(new THREE.CylinderGeometry(.2, .3, 3, 6).translate(0, 1.5, 0), 0x5a4026), g3Tint(new THREE.ConeGeometry(2.4, 6, 8).translate(0, 5.5, 0), 0x2f5a2c)]), new THREE.MeshLambertMaterial({ vertexColors: true }), 40);
    const m4 = new THREE.Matrix4(); for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, rr = 78 + rnd() * 20; m4.makeTranslation(Math.cos(a) * rr, 0, Math.sin(a) * rr * .75); tr.setMatrixAt(i, m4); } S3.add(tr);
  }
  // main courante, grillage et pare-ballons (petits stades)
  if (cls <= 1) g3StFence(S3, cls, night);
  // ce qu'il faut pour « habiller » le stade avec les vraies pièces 3D (mâts, sièges, bancs) dès qu'elles sont chargées
  S3.userData.st = { cls, night, seats: seats.length ? new Float32Array(seats) : null, seatCol: hc.clone().multiplyScalar(.6), mastG };
  // écran géant (grands stades)
  if (cls >= 2) { const [c, x] = g3Canvas(512, 160); G3.sb = { c, x, t: g3Tex(c) }; const scr = new THREE.Mesh(new THREE.PlaneGeometry(16, 5), new THREE.MeshBasicMaterial({ map: G3.sb.t })); scr.position.set(-(cls === 3 ? 59 + 30 : 59 + 17), cls === 3 ? 30 : 17, -10); scr.rotation.y = Math.PI / 2; S3.add(scr); } else G3.sb = null;
  // fumigènes (derbies)
  G3.flares = []; if (LV.fx && LV.fx.flares.length && cls >= 1) { for (const [fx, fy, col] of LV.fx.flares) { const z = 44 + fy * 8, x = (fx - .5) * 90; const s = g3Glow(S3, x, 2 + fy * 6, z * (rnd() < .5 ? -1 : 1), 5, 'rgb(' + col + ')'); G3.flares.push(s); } }
}
function g3Glow(S3, x, y, z, size, col) { if (!G3.glowT) { const [c, g] = g3Canvas(64, 64); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.2, 'rgba(255,250,230,.6)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); G3.glowT = new THREE.CanvasTexture(c); } const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: G3.glowT, color: col ? g3Col(col) : 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); s.position.set(x, y, z); s.scale.set(size, size, 1); S3.add(s); return s; }
// pluie / neige : particules animées par le GPU autour de la caméra
function g3Weather(snow, low) {
  const n = snow ? (low ? 900 : 2200) : (low ? 1200 : 3000), pos = new Float32Array(n * (snow ? 3 : 6)), sd = new Float32Array(n * (snow ? 1 : 2));
  for (let i = 0; i < n; i++) { const x = Math.random() * 120 - 60, y = Math.random() * 40, z = Math.random() * 90 - 45, r = Math.random(); if (snow) { pos.set([x, y, z], i * 3); sd[i] = r; } else { pos.set([x, y, z, x, y + .7, z], i * 6); sd[i * 2] = r; sd[i * 2 + 1] = r; } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('sd', new THREE.BufferAttribute(sd, 1));
  G3.wxU = { uT: { value: 0 } };
  const vs = `attribute float sd; uniform float uT; varying float vA; void main(){ vec3 p = position; float sp = ${snow ? '1.6 + sd * 1.2' : '22.0 + sd * 8.0'}; p.y = mod(p.y - uT * sp, 40.0); p.x += ${snow ? 'sin(uT * 0.7 + sd * 30.0) * 1.2' : 'uT * 2.0 * (0.5 - sd) * 0.0 - (40.0 - p.y) * 0.06'}; vA = ${snow ? '0.9' : '0.35'}; vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; ${snow ? 'gl_PointSize = clamp(220.0 / -mv.z, 1.5, 7.0);' : ''} }`;
  const fs = `varying float vA; void main(){ ${snow ? 'vec2 d = gl_PointCoord - 0.5; if (dot(d, d) > 0.25) discard;' : ''} gl_FragColor = vec4(${snow ? '1.0, 1.0, 1.0' : '0.78, 0.84, 0.92'}, vA); }`;
  const mat = new THREE.ShaderMaterial({ uniforms: G3.wxU, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false });
  const o = snow ? new THREE.Points(g, mat) : new THREE.LineSegments(g, mat); o.frustumCulled = false; G3.wx = o; G3.sc.add(o);
}

// ---------- Animation des joueurs ----------
const _m = { e: null }, G3M = {};
function g3Tmp() { if (_m.e) return; _m.e = new THREE.Euler(); _m.q = new THREE.Quaternion(); _m.v = new THREE.Vector3(); _m.s = new THREE.Vector3(1, 1, 1); _m.l = new THREE.Matrix4(); for (const k of ['root', 'tor', 'sh', 'ua', 'fa', 'hip', 'th', 'sn', 'hd', 'z']) G3M[k] = new THREE.Matrix4(); G3M.z.makeScale(0, 0, 0); }
// out = parent × T(x,y,z) × R(rx,ry,rz ordre YZX)
function g3J(out, parent, x, y, z, rx, ry, rz) { _m.e.set(rx || 0, ry || 0, rz || 0, 'YZX'); _m.q.setFromEuler(_m.e); _m.l.compose(_m.v.set(x, y, z), _m.q, _m.s); return out.multiplyMatrices(parent, _m.l); }
const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
const bell = (p, a, b) => p < a || p > b ? 0 : Math.sin((p - a) / (b - a) * Math.PI);
// pose : { x, z, yaw, v (vitesse), ph (phase de course), act, at (temps depuis le geste), aa (paramètre), gk, hold,
//          look (tête vers le ballon), turn (vitesse de virage), idle (immobile depuis), tm (horloge), cel (célébration),
//          key (mémoire du lissage), gdt (temps de jeu écoulé), snap (pas de lissage) }
// proportions du squelette (celles du corps en pièces ; remplacées par celles du vrai modèle 3D quand il est chargé)
const G3RIG_DEF = { hp: .97, hipY: -.07, hipW: .1, thigh: .45, shin: .45, torY: .04, shY: .5, shW: .225, ua: .3, fa: .28, neck: .7 };
let G3RIG = Object.assign({}, G3RIG_DEF);
const G3JS = new Map(), G3_JK = ['hp', 'lean', 'roll', 'twist', 'nod', 'look', 'hipL', 'hipR', 'kneeL', 'kneeR', 'shL', 'shR', 'abL', 'abR', 'elL', 'elR', 'ab2'];
const G3_CELS = ['plane', 'classic', 'ear', 'heart', 'knee', 'dance'];
function g3Pose(P, n, s) {
  const run = clamp(s.v / 7, 0, 1), walk = clamp(s.v / 1.6, 0, 1), ph = s.ph, sn = Math.sin(ph), cs = Math.cos(ph), tm = s.tm || 0;
  const H0 = G3RIG.hp, KN = G3RIG.thigh - G3RIG.hipY + .03; let hp = H0, lean = .04 + .2 * run, roll = 0, pitch = 0, twist = 0, nod = 0, look = s.look || 0, yawAdd = 0;
  let hipL = sn * (.12 + .75 * run) * walk, hipR = -hipL, kneeL = (.08 + (.25 + 1.15 * run) * Math.max(0, cs)) * walk + .05, kneeR = (.08 + (.25 + 1.15 * run) * Math.max(0, -cs)) * walk + .05;
  let shL = -sn * (.15 + .6 * run) * walk, shR = -shL, abL = .12, abR = .12, elL = .35 + 1.0 * run, elR = elL, ab2 = 0;
  hp -= .045 * run * Math.abs(Math.sin(ph)) - .02 * run;
  twist = -sn * .16 * run * walk;                     // épaules à contre-temps des hanches
  nod = -lean * .45;                                   // le regard reste à l'horizontale
  roll = clamp((s.turn || 0) * s.v * .025, -.28, .28); // on se penche dans les virages
  // à l'arrêt : respiration, transfert d'appui, puis mains sur les hanches
  if (s.v < .4 && !s.gk && !(s.act && s.at >= 0 && s.at < 3)) {
    const br = Math.sin(tm * 2.1 + n * 1.7); shL += .03 * br; shR += .03 * br; nod += .02 * br; roll += .025 * Math.sin(tm * .6 + n);
    if ((s.idle || 0) > 3.5) { const w = clamp((s.idle - 3.5) / .6, 0, 1); abL = abR = .12 + .62 * w; shL = shL * (1 - w) - .32 * w; shR = shR * (1 - w) - .32 * w; elL = elR = .35 + 1.55 * w; }
  }
  if (s.gk && s.v < 1.5 && s.alert) { kneeL = kneeR = .5; hipL = hipR = .35; hp = H0 - .11; lean = .3; shL = shR = .5; abL = abR = .45; elL = elR = .6; nod = -.2; }
  const a = s.act, t = s.at, side = (n % 2) ? 1 : -1;
  if (a && t >= 0) {
    if (a === 1 || a === 11) { const p = t / (a === 11 ? .7 : .55); if (p < 1) { const back = ease(p / .4), fwd = ease((p - .4) / .25), k = side > 0; const hk = -.75 * back * (1 - fwd) + 1.3 * fwd * (1 - ease((p - .75) / .25) * .6), kk = 1.45 * back * (1 - fwd) + .15 * fwd; if (k) { hipR = hk; kneeR = kk; hipL = -.15; kneeL = .3; } else { hipL = hk; kneeL = kk; hipR = -.15; kneeR = .3; } abL = abR = .6 * bell(p, .2, 1); shL = shR = .2; if (k) shL = .6 * bell(p, .3, 1); else shR = .6 * bell(p, .3, 1); lean = .12 - .3 * fwd; twist = side * .3 * bell(p, .2, .9); roll = -side * .12 * bell(p, .3, 1); look *= .3; } }
    else if (a === 2) { const p = t / .8; if (p < 1) { const j = bell(p, 0, 1); hp += .55 * j; kneeL = kneeR = .9 * j + .1; hipL = hipR = .5 * j; shL = shR = 1.1 * j; abL = abR = .5 * j; nod = .55 * bell(p, .35, .7) - .3 * bell(p, 0, .35); lean = -.15 * j; look *= .2; } }
    else if (a === 3) { const p = t / 1.1; if (p < 1) { const w = Math.min(1, p * 5) * (1 - ease((p - .8) / .2)); pitch = 1.15 * w; hp = H0 - .7 * w; hipL = side > 0 ? .3 * w : 1.3 * w; hipR = side > 0 ? 1.3 * w : .3 * w; kneeL = side > 0 ? 1.3 * w : .1; kneeR = side > 0 ? .1 : 1.3 * w; shL = shR = -.6 * w; abL = abR = .6 * w; lean = 0; } }
    else if (a === 4) { const p = t / .6; if (p < 1) { const w = bell(p, 0, 1); if (side > 0) { hipR = 1 * w; kneeR = .2; abR = .1; } else { hipL = 1 * w; kneeL = .2; } lean = .3 * w; hp -= .14 * w; abL = abR = .4 * w; } }
    else if (a === 17) { const p = t / .6; if (p < 1) { const w = bell(p, 0, 1); shL = shR = -.2; abL = abR = .1; elL = elR = 1.6 * w; twist = .5 * w * side; hp += .1 * w; } }
    else if (a === 5) { const p = t / 1.4; if (p < 1) { const sg = s.aa === 0 ? 0 : Math.sign(s.aa), lvl = Math.abs(s.aa) || 1.1; const fly = ease(p / .3), land = ease((p - .45) / .2), w = fly; roll = sg * 1.45 * w; hp = H0 + (lvl < 1 ? .55 : lvl < 1.3 ? .25 : -.2) * bell(p, 0, .55) - (H0 - .25) * land; shL = shR = 2.8 * w; abL = abR = .2; elL = elR = .05; hipL = hipR = .15; kneeL = kneeR = .25 + .2 * bell(p, 0, .4); if (!sg) { hp = H0 - .35 * bell(p, 0, .8); kneeL = kneeR = 1; hipL = hipR = .8; shL = shR = .6; abL = abR = .9; } } }
    else if (a === 7) { if (s.hold || t < .8) { shL = shR = .95; elL = elR = 1.4; abL = abR = .15; nod = .2; } }
    else if (a === 8 && t < 11) {
      // célébrations : en courant, les bras font déjà la fête ; une fois arrêté, le geste complet
      const cel = s.cel || G3_CELS[n % G3_CELS.length], en = ease(t / .3) * (1 - ease((t - 9.5) / 1.2)), rw = clamp((s.v - 1.2) / 3, 0, 1) * en, A = (1 - clamp((s.v - 1.2) / 3, 0, 1)) * en, mx = (c, g, w) => c + (g - c) * w;
      look = 0;
      if (cel === 'plane') { const w = Math.max(rw, A); abL = mx(abL, 1.45, w); abR = mx(abR, 1.45, w); shL = mx(shL, .05, w); shR = mx(shR, .05, w); elL = mx(elL, .05, w); elR = mx(elR, .05, w); roll += .38 * Math.sin(t * 2.4) * w; lean += .08 * w; }
      else if (cel === 'knee') { const K = ease((t - .7) / .25) * en; hp = mx(hp, KN, K); hipL = mx(hipL, .12, K); hipR = mx(hipR, .12, K); kneeL = mx(kneeL, 1.62, K); kneeR = mx(kneeR, 1.62, K); lean = mx(lean, -.45, K); shL = mx(shL, 2.6, Math.max(K, rw * .5)); shR = mx(shR, 2.6, Math.max(K, rw * .5)); abL = mx(abL, .65, K); abR = mx(abR, .65, K); elL = mx(elL, .15, K); elR = mx(elR, .15, K); nod = mx(nod, -.4, K); roll = mx(roll, 0, K); }
      else if (cel === 'calm') { const pp = Math.sin(t * 9); shL = mx(shL, .55 + .12 * pp, A); shR = mx(shR, .55 + .12 * pp, A); abL = mx(abL, .5, A); abR = mx(abR, .5, A); elL = mx(elL, .35, A); elR = mx(elR, .35, A); lean = mx(lean, -.06, A); nod = mx(nod, -.12, A); ab2 = .1 * A; kneeL = mx(kneeL, .2, A); kneeR = mx(kneeR, .2, A); hp -= .03 * A; }
      else if (cel === 'heart') { shL = mx(shL, 1.3, A); shR = mx(shR, 1.3, A); abL = mx(abL, -.14, A); abR = mx(abR, -.14, A); elL = mx(elL, 1.35, A); elR = mx(elR, 1.35, A); lean = mx(lean, .02, A); roll += .06 * Math.sin(t * 2) * A; nod = mx(nod, .05, A); }
      else if (cel === 'ear') { shR = mx(shR, .35, A); abR = mx(abR, 1.35, A); elR = mx(elR, 2.35 + .1 * Math.sin(t * 5), A); shL = mx(shL, .45, A); abL = mx(abL, 1.05, A); elL = mx(elL, .2, A); lean = mx(lean, -.12, A); roll += .12 * A; twist += .2 * A; }
      else if (cel === 'spin') { const J = t - .5, p = clamp(J / .75, 0, 1), air = bell(p, 0, 1) * A, land = (J > .75 ? 1 : 0) * A; hp += .55 * air; yawAdd = Math.PI * 2 * ease(p) * (A > .5 ? 1 : 0); kneeL = mx(kneeL, 1, air); kneeR = mx(kneeR, 1, air); shL = mx(shL, .3, air); shR = mx(shR, .3, air); elL = mx(elL, 1.5, air); elR = mx(elR, 1.5, air); abL = mx(abL, .98, land); abR = mx(abR, .98, land); shL = mx(shL, -.3, land); shR = mx(shR, -.3, land); elL = mx(elL, .05, land); elR = mx(elR, .05, land); ab2 = .2 * land; lean = mx(lean, -.18, land); nod = mx(nod, -.18, land); hp -= .06 * land; }
      else if (cel === 'dance') { const b = Math.sin(t * 6.4); roll += .12 * b * A; kneeL = mx(kneeL, .3 + .18 * Math.sin(t * 12.8), A); kneeR = mx(kneeR, .3 + .18 * Math.sin(t * 12.8 + 1), A); hp -= .06 * A * (1 + Math.sin(t * 12.8)) / 2; shL = mx(shL, 1.5 + 1.1 * b, A); shR = mx(shR, 1.5 - 1.1 * b, A); elL = mx(elL, 1.1, A); elR = mx(elR, 1.1, A); abL = mx(abL, .45, A); abR = mx(abR, .45, A); twist += .28 * Math.sin(t * 6.4 + .8) * A; }
      else if (cel === 'flip') { const J = t - .6, p = clamp(J / .8, 0, 1), crouch = bell(J, -.3, .05) * A, air = bell(p, 0, 1) * A, after = (J > .8 ? 1 : 0) * A; hp += -.28 * crouch + 1.05 * air; kneeL = mx(kneeL, 1, crouch); kneeR = mx(kneeR, 1, crouch); pitch = J > 0 && J < .8 && A > .5 ? Math.PI * 2 * ease(p) : 0; hipL = mx(hipL, 1.5, air); hipR = mx(hipR, 1.5, air); kneeL = mx(kneeL, 1.8, air); kneeR = mx(kneeR, 1.8, air); shL = mx(shL, 1.3, air); shR = mx(shR, 1.3, air); shL = mx(shL, 2.8, after); shR = mx(shR, 2.8, after); abL = mx(abL, .55, after); abR = mx(abR, .55, after); elL = mx(elL, .1, after); elR = mx(elR, .1, after); lean = mx(lean, -.12, after); }
      else { // classic : le poing levé, l'autre main sur le cœur
        const w = Math.max(rw, A), pump = Math.sin(t * 7.5); shR = mx(shR, 2.6 + .3 * pump * A, w); abR = mx(abR, .2, w); elR = mx(elR, .2 + .5 * Math.max(0, -pump) * A, w); shL = mx(shL, .85, A); elL = mx(elL, 2, A); abL = mx(abL, .05, A); lean = mx(lean, -.1, A); hp += .1 * Math.max(0, pump) * A; }
    }
    else if (a === 18) { if (t < 9) { const j = s.v < 1 ? Math.max(0, Math.sin(t * 6 + n)) : 0; shL = shR = 2.2 + .3 * Math.sin(t * 6 + n); abL = abR = .4; elL = elR = .3; hp += .14 * j; kneeL += .3 * j; kneeR += .3 * j; look = 0; } }
    else if (a === 9) { const dur = s.busy || 1.6; if (t < dur + .6) { const down = ease(t / .4), up = ease((t - dur) / .6), w = down * (1 - up); pitch = -1.45 * w; hp = H0 - .8 * w; shL = shR = 1.6 * w; elL = elR = .3; abL = abR = .5 * w; kneeL = kneeR = .3 * w; } }
    else if (a === 10) { const p = t / .9; if (p < 1) { const w = bell(p, 0, 1); shL = shR = 2.9 - 1.2 * ease((p - .45) / .3); elL = elR = 1.6 * (1 - ease((p - .45) / .3)); abL = abR = .2; lean = -.25 * w + .25 * ease((p - .45) / .3); } }
    else if (a === 12) { const p = t / .35; if (p < 1) { const w = bell(p, 0, 1); if (side > 0) { hipR = .5 * w; kneeR = .7 * w; } else { hipL = .5 * w; kneeL = .7 * w; } abL = abR = .5 * w; nod = .25 * w; } }
    else if (a === 14) { if (t < 6) { shL = shR = 2.5; abL = abR = .9; elL = elR = 2.3; nod = .35; lean = .1; look = 0; } }
    else if (a === 15) { if (t < 2.2) { shR = 3; abR = .1; elR = 0; } }
  }
  if (s.flagUp) { shR = 3; abR = .2; elR = 0; }
  // lissage : les gestes s'enchaînent sans à-coups (en temps de jeu, donc juste aussi en accéléré et au ralenti)
  { const key = s.key ?? n; let J = G3JS.get(key); const cur = [hp, lean, roll, twist, nod, look, hipL, hipR, kneeL, kneeR, shL, shR, abL, abR, elL, elR, ab2];
    if (!J || s.snap) { J = Float32Array.from(cur); G3JS.set(key, J); }
    else { const k = 1 - Math.exp(-(s.gdt || 0) * (a && t >= 0 && t < 1.5 ? 26 : 14)); for (let i = 0; i < cur.length; i++) J[i] += (cur[i] - J[i]) * k; }
    [hp, lean, roll, twist, nod, look, hipL, hipR, kneeL, kneeR, shL, shR, abL, abR, elL, elR, ab2] = J; }
  // composition
  const R = G3M.root, sq = n * 2;
  _m.e.set(roll, -s.yaw - yawAdd, pitch, 'YZX'); _m.q.setFromEuler(_m.e); R.compose(_m.v.set(s.x, Math.max(.12, hp), s.z), _m.q, _m.s);
  g3J(G3M.tor, R, 0, G3RIG.torY, 0, 0, twist + look * .2, -lean);
  P.torso.setMatrixAt(n, G3M.tor); P.shorts.setMatrixAt(n, R);
  g3J(G3M.hd, G3M.tor, 0, G3RIG.neck, 0, 0, look * .8, -nod); P.head.setMatrixAt(n, G3M.hd); P.hair.setMatrixAt(n, G3M.hd);
  const SKo = P.sk && P.sk.out; if (SKo) { P.sk.hid[n] = 0; g3SkPut(SKo, n, 0, R); g3SkPut(SKo, n, 1, G3M.tor); g3SkPut(SKo, n, 2, G3M.hd); }
  if (n < 22) { g3J(G3M.z, G3M.tor, G3RIG.numX ?? -.128, G3RIG.numY ?? .33, 0, 0, 0, 0); P.num.setMatrixAt(n, G3M.z); G3M.z.makeScale(0, 0, 0); } else P.num.setMatrixAt(n, G3M.z);
  for (let k = 0; k < 2; k++) {
    const sd = k ? 1 : -1, sh = k ? shR : shL, ab = k ? abR : abL, el = k ? elR : elL;
    g3J(G3M.ua, G3M.tor, 0, G3RIG.shY, sd * G3RIG.shW, -sd * ab, 0, sh); // ab > 0 : le bras s'écarte du corps P.uarm.setMatrixAt(sq + k, G3M.ua); if (P.ubare) P.ubare.setMatrixAt(sq + k, G3M.ua);
    g3J(G3M.fa, G3M.ua, 0, -G3RIG.ua, 0, 0, 0, el); P.farm.setMatrixAt(sq + k, G3M.fa);
    g3J(G3M.sh, G3M.fa, 0, -G3RIG.fa, 0, 0, 0, 0); P.hand.setMatrixAt(sq + k, G3M.sh);
    if (SKo) { g3SkPut(SKo, n, 3 + k * 3, G3M.ua); g3SkPut(SKo, n, 4 + k * 3, G3M.fa); g3SkPut(SKo, n, 5 + k * 3, G3M.sh); }
    const hip = k ? hipR : hipL, kn = k ? kneeR : kneeL;
    g3J(G3M.th, R, 0, G3RIG.hipY, sd * G3RIG.hipW, -sd * (.04 + ab2), 0, hip); // ab2 > 0 : jambes écartées P.thigh.setMatrixAt(sq + k, G3M.th);
    g3J(G3M.sn, G3M.th, 0, -G3RIG.thigh, 0, 0, 0, -kn); P.shin.setMatrixAt(sq + k, G3M.sn);
    g3J(G3M.hip, G3M.sn, 0, -G3RIG.shin, 0, 0, 0, Math.min(.6, kn * .3)); P.boot.setMatrixAt(sq + k, G3M.hip);
    if (SKo) { g3SkPut(SKo, n, 9 + k * 3, G3M.th); g3SkPut(SKo, n, 10 + k * 3, G3M.sn); g3SkPut(SKo, n, 11 + k * 3, G3M.hip); }
  }
}
function g3Hide(P, n) { const Z = G3M.z; if (P.sk) P.sk.hid[n] = 1; for (const k of ['torso', 'shorts', 'head', 'hair', 'num']) P[k].setMatrixAt(n, Z); for (const k of ['uarm', 'ubare', 'farm', 'hand', 'thigh', 'shin', 'boot']) if (P[k]) { P[k].setMatrixAt(n * 2, Z); P[k].setMatrixAt(n * 2 + 1, Z); } }
// couleurs des maillots (une fois par effectif)
function g3Kits(M, ros) {
  const P = G3.P, E = M.E, key = JSON.stringify(ros.map(t => t.map(r => r.n + r.num)));
  if (G3.kitKey === key) return; G3.kitKey = key;
  const hairC = ['#1b1410', '#2b1d14', '#3b2a1a', '#6b4a2b', '#b48a4a', '#121212'];
  const set = (n, shirt, shorts, socks, skin, hair, num, gloves, me) => { P.torso.setColorAt(n, shirt); P.uarm.setColorAt(n * 2, shirt); P.uarm.setColorAt(n * 2 + 1, shirt); P.shorts.setColorAt(n, shorts); for (const k of [0, 1]) { P.thigh.setColorAt(n * 2 + k, skin); P.shin.setColorAt(n * 2 + k, socks); P.farm.setColorAt(n * 2 + k, skin); if (P.ubare) P.ubare.setColorAt(n * 2 + k, skin); P.hand.setColorAt(n * 2 + k, gloves || skin); P.boot.setColorAt(n * 2 + k, me ? g3Lin(typeof shopEq === 'function' ? shopEq('boots') : '#f2b632') : (n % 3) ? new THREE.Color(0x111111) : new THREE.Color(0xf0f0f0)); } if (P.sk) g3SkColors(P.sk, n, { shirt, shorts, socks, skin, hair, boots: me ? g3Lin(typeof shopEq === 'function' ? shopEq('boots') : '#f2b632') : (n % 3) ? new THREE.Color(0x111111) : new THREE.Color(0xf0f0f0) }); P.head.setColorAt(n, skin); P.hair.setColorAt(n, hair); const a = P.num.geometry.attributes.aNum; const nn = clamp(num | 0, 0, 99); a.setXY(n, (nn % 10) * .1, 1 - (Math.floor(nn / 10) + 1) * .1); a.needsUpdate = true; };
  for (let k = 0; k < 2; k++) {
    const T = E.T[k], col = g3Lin(T.col), c2 = g3Lin(T.col2), gk = g3Lin(T.gkc), wShorts = hashN(T.n) % 3 === 0, shortsC = wShorts ? new THREE.Color(0xf2f2f2) : c2, socks = hashN(T.n + 's') % 2 ? col : (wShorts ? new THREE.Color(0xf2f2f2) : c2);
    for (let i = 0; i < 11; i++) { const r = (ros[k] && ros[k][i]) || {}, n = k * 11 + i, skin = g3Lin(SKIN[hashN(r.n || 'x') % SKIN.length]), hair = g3Lin(hairC[hashN((r.n || 'x') + 'h') % hairC.length]);
      if (r.gk) set(n, gk, new THREE.Color(0x1a1a1a), gk, skin, hair, r.num || 1, new THREE.Color(0xf4f4f4), r.me); else set(n, col, shortsC, socks, skin, hair, r.num || 0, null, r.me); }
  }
  for (let n = 22; n < 25; n++) set(n, n === 22 ? g3Lin('#e9d22b') : g3Lin('#1e1e24'), new THREE.Color(0x0b0b0b), new THREE.Color(0x0b0b0b), g3Lin(SKIN[(n * 2) % SKIN.length]), new THREE.Color(0x150f0c), 0);
  for (const k of Object.keys(P)) if (P[k].instanceColor) P[k].instanceColor.needsUpdate = true;
}

// ---------- Image ----------
function g3Size(w, h) {
  const low = g3Low(), dpr = Math.min(low ? 1.25 : 2, window.devicePixelRatio || 1), q = w + 'x' + h + '@' + dpr;
  if (q !== G3.q) { G3.q = q; G3.r.setPixelRatio(dpr); G3.r.setSize(w, h, false); G3.cv.style.width = w + 'px'; G3.cv.style.height = h + 'px'; G3.cam.aspect = w / h; G3.cam.updateProjectionMatrix(); }
  G3.w = w; G3.h = h;
}
// pose de la caméra : TV, large, tactique ; ralentis : derrière le but ou au ras du sol
function g3Camera(M, t, dt, bx, bz, by, paused, celeb) {
  const cam = G3.cam, C = G3.cm, RP = LV.replay, RC = RP ? (RP.cam3 || RP.cam) : null, view = (typeof OPTS !== 'undefined' && OPTS.cam) || 'tv';
  let px, py, pz, lx, ly, lz, fov;
  // écran en portrait : caméra plus haute et plus plongeante, pour que le terrain remplisse l'image (moins de ciel)
  const pf = G3.w && G3.h ? clamp((1 / .6) / (G3.w / G3.h) - 1, 0, 1.2) : 0;
  const k = 1 - Math.exp(-dt * (RP ? 2.5 : 2.2));
  if (!C.init) { C.tx = bx; C.tz = bz; C.init = true; }
  C.tx += (bx - C.tx) * (paused ? 1 : k); C.tz += (bz - C.tz) * (paused ? 1 : k * .8);
  if (RC === 'goal') { const e = RP.end; px = e * (52.5 + 5.5); py = 3.4; pz = clamp(C.tz * .4, -6, 6); lx = C.tx * .8 + e * 52.5 * .2; ly = 1; lz = C.tz; fov = 48; }
  else if (RC === 'cine') { const e = RP.end, sd = RP.sd || 1; px = C.tx - e * 9; py = 1.7; pz = C.tz + sd * 11; lx = C.tx + e * 4; ly = 1.1; lz = C.tz; fov = 38; }
  else if (celeb) { const B = G3.camB || [74, 16]; px = celeb[0] * .85; py = B[1]; pz = B[0]; lx = celeb[0]; ly = 1; lz = celeb[1]; fov = 9; }
  else if (view === 'joueur' && G3.me) { // derrière ton joueur, dans le sens de l'attaque
    const me = G3.me; if (C.mx == null || paused) { C.mx = me.x; C.mz = me.z; } C.mx += (me.x - C.mx) * k * 1.4; C.mz += (me.z - C.mz) * k * 1.4; C.md = C.md == null ? me.dir : C.md + (me.dir - C.md) * k * .5;
    px = C.mx - C.md * 10; py = 4.6; pz = C.mz + (C.tz - C.mz) * .15; lx = C.mx + C.md * 12; ly = .4; lz = C.mz + (C.tz - C.mz) * .4; fov = 54; }
  else if (view === 'drone') { const sw = Math.sin(t * .05) * 7; px = C.tx * .9 + sw; py = 25; pz = C.tz + 21; lx = C.tx; ly = 0; lz = C.tz - 2; fov = 46; }
  else if (view === 'but') { // derrière le but du côté du ballon (change de côté quand le jeu bascule)
    if (!C.gs || Math.abs(C.tx) > 10 && Math.sign(C.tx) !== C.gs) C.gs = Math.sign(C.tx) || 1; const e = C.gs;
    px = e * 60; py = 5.4; pz = clamp(C.tz * .25, -6, 6); lx = C.tx * .9 + e * 3; ly = 0; lz = C.tz * .8; fov = 48; }
  else if (view === 'bord') { px = clamp(C.tx * .92, -50, 50); py = 3.3; pz = 40.5; lx = C.tx; ly = .8; lz = C.tz * .85; fov = 40 + Math.min(8, Math.max(0, 15 - Math.abs(41 - C.tz)) * .5); }
  else if (view === 'tac') { const cx = clamp(C.tx * .6, -22, 22); px = cx; py = 92; pz = 30; lx = cx; ly = 0; lz = 3; fov = 46; }
  else if (view === 'large') { const cx = clamp(C.tx * .85, -34, 34), B = G3.camB || [74, 16]; px = cx * .9; py = (B[1] + 8) * (1 + .6 * pf); pz = (B[0] + 2) * (1 - .1 * pf); lx = cx; ly = 0; lz = C.tz * .35 - pf * 7; fov = 33; }
  else { const cx = clamp(C.tx, -40, 40), near = Math.abs(bx) > 34 ? 1 : 0, B = G3.camB || [74, 16], fd = Math.hypot(B[0], B[1]) / 78; px = cx * .9; py = B[1] * (1 + .85 * pf); pz = B[0] * (1 - .1 * pf); lx = cx; ly = Math.min(3, by * .3); lz = C.tz * .55 - 2 + pf * 4; fov = (18.5 - near * 1.5 + Math.min(3, Math.abs(bz) * .04) + (LV.spd > 6 ? 4 : 0) + (paused ? -1 : 0)) / fd; }
  const s = RP || celeb ? 1 - Math.exp(-dt * 3) : 1;
  if (!C.p) C.p = [px, py, pz, lx, ly, lz, fov];
  const P = C.p, f = RP && !C.wasRP ? 1 : s; C.wasRP = !!RP;
  P[0] += (px - P[0]) * f; P[1] += (py - P[1]) * f; P[2] += (pz - P[2]) * f; P[3] += (lx - P[3]) * f; P[4] += (ly - P[4]) * f; P[5] += (lz - P[5]) * f; P[6] += (fov - P[6]) * Math.min(1, dt * 2);
  cam.position.set(P[0], P[1], P[2]); cam.lookAt(P[3], P[4], P[5]);
  // écran plus haut que large (plein écran sur téléphone) : on élargit l'angle vertical pour garder la même largeur de terrain
  const A0 = 1 / .6, A = G3.w && G3.h ? G3.w / G3.h : A0, fv = A < A0 ? 2 * Math.atan(Math.tan(P[6] * Math.PI / 360) * A0 / A) * 180 / Math.PI : P[6];
  if (Math.abs(cam.fov - fv) > .01) { cam.fov = fv; cam.updateProjectionMatrix(); }
  // largeur visible (pour la mini-carte)
  LV.cam.x = P[3] + 52.5; LV.cam.z = clamp(2 * Math.tan(P[6] * Math.PI / 360) * Math.hypot(P[2], P[1]) * (G3.w / G3.h), 20, 105);
}
// projection écran d'un point du terrain (repère moteur, déjà mis en miroir)
function g3Proj(x, y, z) { const v = _m.pv || (_m.pv = new THREE.Vector3()); v.set(x - 52.5, z || 0, y - 34).project(G3.cam); return [(v.x + 1) / 2 * G3.w, (1 - v.y) / 2 * G3.h, v.z < 1]; }
function g3Draw(M, t, dt, paused) {
  if (!g3Init()) return false;
  const T0 = performance.now();
  g3Tmp();
  if (G3.M !== M || G3.lowWas !== g3Low()) { G3.lowWas = g3Low(); g3Match(M); }
  const pr = lvPair(t); if (!pr) return false;
  const [fa, fb, a] = pr, L = i => fa[i] + (fb[i] - fa[i]) * a, mir = fa[2] === 2, E = M.E, P = G3.P;
  const X = x => (mir ? PL - x : x) - 52.5, Z = y => (mir ? PW - y : y) - 34, YAW = f => mir ? f + Math.PI : f;
  g3SkAttach(P); g3StDress(G3.stad);
  const ros = LV.ros[fa[8]] || LV.ros[Object.keys(LV.ros).pop()] || meRoster(E); g3Kits(M, ros);
  // temps de jeu écoulé depuis l'image précédente (phases de course)
  const snap = G3.lastT == null || Math.abs(t - G3.lastT) > 1;
  let gdt = G3.lastT == null ? 0 : t - G3.lastT; if (gdt < 0 || gdt > 1) gdt = 0; G3.lastT = t;
  if (!G3.idle) G3.idle = new Float32Array(25);
  const tm = performance.now() / 1000, myCel = typeof shopEq === 'function' ? shopEq('celeb') : 'classic';
  g3BallSkin();
  const bx = X(L(3)), bz = Z(L(4)), by = L(5), own = fa[6] >= 0 ? [fa[6], fa[7]] : null, hold = fa[10] > .5;
  const fdt = Math.max(.05, fb[0] - fa[0]);
  let celeb = null, meIdx = -1; G3.me = null;
  for (let kk = 0; kk < 2; kk++) for (let i = 0; i < 11; i++) {
    const n = kk * 11 + i, o = MF_H + n * MF_S;
    if (fa[o + 2] < .5 && fb[o + 2] < .5) { g3Hide(P, n); continue; }
    const x = X(L(o)), z = Z(L(o + 1)), vx = (fb[o] - fa[o]) / fdt, vy = (fb[o + 1] - fa[o + 1]) / fdt, v = Math.hypot(vx, vy);
    let fA = fa[o + 3], fB = fb[o + 3], d = Math.atan2(Math.sin(fB - fA), Math.cos(fB - fA)); const yaw = YAW(fA + d * a);
    G3.ph[n] = (G3.ph[n] + gdt * Math.PI * 2 * v / (1.5 + .24 * v)) % (Math.PI * 200);
    const r = (ros[kk] && ros[kk][i]) || {}, act = fa[o + 4], at = t - fa[o + 5];
    G3.idle[n] = v < .4 ? G3.idle[n] + gdt : 0;
    const rel = Math.atan2(bz - z, bx - x) - yaw, dB = Math.hypot(bz - z, bx - x), look = clamp(-Math.atan2(Math.sin(rel), Math.cos(rel)), -1.1, 1.1) * (dB < 40 ? 1 : .5);
    const st = { x, z, yaw, v, ph: G3.ph[n] + n, act, at, aa: fa[o + 6], gk: !!r.gk, alert: r.gk && Math.abs(bx - (kk === 0 ? (mir ? 52.5 : -52.5) : (mir ? -52.5 : 52.5))) < 30, hold: hold && own && own[0] === kk && own[1] === i, busy: 1.6,
      look, turn: d / fdt, idle: G3.idle[n], tm, cel: r.me ? myCel : null, gdt, snap };
    // ton but : le spectacle choisi dans la Boutique
    if (r.me && act === 8 && at >= 0 && at < .6 && G3.fxAt !== fa[o + 5] && typeof shopEq === 'function') { G3.fxAt = fa[o + 5]; g3FxGoal(G3.sc, G3.cam, shopEq('fx'), x, z, E.T[kk] ? [E.T[kk].col, E.T[kk].col2] : null); }
    // le plongeon : sens dans le repère de l'écran
    if (act === 5) st.aa = (mir ? -1 : 1) * fa[o + 6] * (Math.cos(yaw) >= 0 ? 1 : -1);
    g3Pose(P, n, st);
    if (act === 8 && at >= 0 && at < 10) celeb = [x, z];
    if (r.me) { meIdx = n; G3.me = { x, z, dir: (kk === 0) !== mir ? 1 : -1 }; } // sens d'attaque de ton équipe (caméra « Mon joueur »)
  }
  // arbitres
  if (fa.length >= MF_N) {
    const rx = X(L(MF_R)), rz = Z(L(MF_R + 1)), rv = Math.hypot(fb[MF_R] - fa[MF_R], fb[MF_R + 1] - fa[MF_R + 1]) / fdt;
    G3.ph[22] = (G3.ph[22] + gdt * Math.PI * 2 * rv / (1.5 + .24 * rv)) % 600;
    g3Pose(P, 22, { x: rx, z: rz, yaw: YAW(fa[MF_R + 2]), v: rv, ph: G3.ph[22], act: fa[MF_R + 3], at: t - fa[MF_R + 4], tm, gdt, snap });
    if (!G3.lin) G3.lin = [null, null];
    for (let k = 0; k < 2; k++) {
      const lx = X(L(MF_R + 5 + k * 2)), lz = Z(k === 0 ? -1.3 : PW + 1.3), up = t - fa[MF_R + 6 + k * 2] < 3, prev = G3.lin[k] ?? lx, lv = gdt > 0 ? Math.abs(lx - prev) / gdt : 0; G3.lin[k] = lx;
      G3.ph[23 + k] = (G3.ph[23 + k] + gdt * Math.PI * 2 * lv / (1.5 + .24 * lv)) % 600;
      g3Pose(P, 23 + k, { x: lx, z: lz, yaw: lz < 0 ? Math.PI / 2 : -Math.PI / 2, v: Math.min(6, lv), ph: G3.ph[23 + k], act: 0, at: -1, flagUp: up, tm, gdt, snap });
      P.hand.getMatrixAt((23 + k) * 2 + 1, G3M.fa); P.flag.setMatrixAt(k, G3M.fa);
    }
    P.flag.instanceMatrix.needsUpdate = true;
  }
  for (const k of ['torso', 'shorts', 'head', 'hair', 'num', 'uarm', 'ubare', 'farm', 'hand', 'thigh', 'shin', 'boot']) P[k].instanceMatrix.needsUpdate = true;
  if (P.sk) g3SkFlush(P.sk);
  // ombres « projecteurs » (nuit) ou ombre douce sous les joueurs (mode rapide)
  { const bl = P.blob, m4 = _m.m4 || (_m.m4 = new THREE.Matrix4()); let c = 0; const lamps = G3.night ? G3.lamps : null, useBlob = G3.night || !G3.sun.castShadow;
    if (useBlob) { const q = _m.q2 || (_m.q2 = new THREE.Quaternion()), v3 = _m.v3 || (_m.v3 = new THREE.Vector3()), sc3 = _m.s3 || (_m.s3 = new THREE.Vector3());
      for (let n = 0; n < 25; n++) { P.torso.getMatrixAt(n, G3M.l || (G3M.l = new THREE.Matrix4())); const e = G3M.l.elements; if (e[0] === 0 && e[1] === 0 && e[2] === 0) continue; const x = e[12], z = e[14];
        if (lamps) for (const [lx2, , lz2] of lamps.slice(0, 4)) { const dx = x - lx2, dz = z - lz2, d = Math.hypot(dx, dz) || 1, ang = Math.atan2(dz, dx); q.setFromAxisAngle(v3.set(0, 1, 0), -ang); m4.compose(v3.set(x + dx / d * .9, .02, z + dz / d * .9), q, sc3.set(2.2, 1, .7)); bl.setMatrixAt(c++, m4); }
        else { m4.compose(v3.set(x + .25, .02, z + .15), q.identity(), sc3.set(1.1, 1, .8)); bl.setMatrixAt(c++, m4); } }
      if (lamps) { m4.compose(v3.set(bx, .02, bz), q.identity(), sc3.set(.5, 1, .5)); bl.setMatrixAt(c++, m4); } }
    bl.count = c; bl.instanceMatrix.needsUpdate = true; bl.material.opacity = lamps ? .22 : .45; }
  // anneau de ton joueur
  if (meIdx >= 0) { P.torso.getMatrixAt(meIdx, G3M.l || (G3M.l = new THREE.Matrix4())); const e = G3M.l.elements; P.ring.visible = !(e[0] === 0 && e[1] === 0); P.ring.position.set(e[12], .03, e[14]); g3Halo(P.ring, tm); } else P.ring.visible = false;
  g3FxUpdate(G3.sc, G3.cam, dt, G3.h * G3.r.getPixelRatio());
  // ballon : rotation selon la vitesse, plus gros de loin pour rester lisible
  { const b = G3.ball, vx = (fb[3] - fa[3]) / fdt * (mir ? -1 : 1), vz = (fb[4] - fa[4]) / fdt * (mir ? -1 : 1), sp = Math.hypot(vx, vz);
    const camD = G3.cam.position.distanceTo(b.position), sc2 = clamp(camD / 34, 1, 2.3); b.scale.setScalar(sc2);
    b.position.set(bx, by + .11 * sc2, bz);
    if (sp > .2 && gdt > 0) { const ax = _m.av || (_m.av = new THREE.Vector3()); ax.set(vz, 0, -vx).normalize(); const qq = _m.bq || (_m.bq = new THREE.Quaternion()); qq.setFromAxisAngle(ax, sp * gdt / .11); b.quaternion.premultiply(qq); } }
  // filets : la toile épouse le ballon et ondule (temps de jeu : ralenti au ralenti, figée en pause)
  { const rb = .11 * G3.ball.scale.x; g3NetUpdate(snap ? 0 : gdt, bx, by + rb, bz, rb); }
  // ambiance du public, panneaux, météo, écran géant
  const now = performance.now() / 1000;
  if (G3.crowdU) { G3.crowdU.uT.value = now; const hot = lvHlSpeed(t) ? .55 : 0, gl = celeb ? 1 : 0; G3.crowdExc = (G3.crowdExc || 0) + ((Math.max(hot, gl, .08)) - (G3.crowdExc || 0)) * Math.min(1, dt * 2); G3.crowdU.uE.value = G3.crowdExc; }
  if (G3.adT) G3.adT.offset.x = (now * .04) % 1;
  if (G3.wxU) { G3.wxU.uT.value = now; G3.wx.position.set(G3.cm.p ? G3.cm.p[3] : 0, 0, 0); }
  for (const s of G3.flares || []) s.material.opacity = .6 + .4 * Math.sin(now * 9 + s.position.x);
  if (G3.sb) { const key = M.hg + '-' + M.ag + '-' + M.min; if (key !== G3.sbKey) { G3.sbKey = key; const { c, x } = G3.sb, h0 = M.side === 'h'; x.fillStyle = '#05070b'; x.fillRect(0, 0, 512, 160); x.fillStyle = '#ffd166'; x.font = '900 30px Arial'; x.textAlign = 'center'; x.fillText(M.min + "'", 256, 40); x.fillStyle = '#fff'; x.font = '800 30px Arial'; const hn = String(h0 ? M.my : M.op).slice(0, 12).toUpperCase(), an = String(h0 ? M.op : M.my).slice(0, 12).toUpperCase(); x.fillText(hn, 128, 100); x.fillText(an, 384, 100); x.font = '900 56px Arial'; x.fillText(M.hg + ' - ' + M.ag, 256, 112); G3.sb.t.needsUpdate = true; } }
  g3Camera(M, t, dt, bx, bz, by, paused, celeb && fa[9] > .5 ? celeb : null);
  // vue tactique : lignes des deux équipes au sol
  g3TacLines(fa, mir, E);
  const T1 = performance.now();
  try { G3.r.render(G3.sc, G3.cam); } catch (e) { G3.fail = true; return false; }
  const T2 = performance.now(); G3.cpu = (G3.cpu || 0) * .95 + (T1 - T0) * .05; G3.gpu = (G3.gpu || 0) * .95 + (T2 - T1) * .05;
  // ça rame ? on passe en mode rapide
  if (!g3Low() && dt > 0) { G3.ft.push(dt); if (G3.ft.length > 120) { const avg = G3.ft.reduce((x, y) => x + y, 0) / G3.ft.length; G3.ft = []; if (avg > .034) G3.lowAuto = true; } }
  return true;
}
function g3TacLines(fa, mir, E) {
  const on = ((typeof OPTS !== 'undefined' && OPTS.cam) || 'tv') === 'tac' && !LV.replay;
  if (!G3.tac) { const g = new THREE.Group(); G3.tac = g; G3.sc.add(g); g.lines = []; for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.35, 66).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: k === 0 ? 0xff5a4e : 0x4ea2ff, transparent: true, opacity: j === 0 ? .85 : .5, depthWrite: false })); m.position.y = .03; m.renderOrder = 3; g.add(m); g.lines.push(m); } }
  G3.tac.visible = on; if (!on || fa.length < MF_N) return;
  const ck = E.T[0].col + E.T[1].col; if (G3.tacCk !== ck) { G3.tacCk = ck; for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) G3.tac.lines[k * 3 + j].material.color.copy(g3Lin(E.T[k].col)).multiplyScalar(1.25); }
  for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) { const x = fa[MF_T + k * 6 + j]; G3.tac.lines[k * 3 + j].position.x = (mir ? PL - x : x) - 52.5; }
}
