// ===================== ÉCRAN D'OUVERTURE : le retourné qui casse l'écran =====================
// Nuit de match. Un joueur, de dos, jongle, s'envole et enchaîne un retourné acrobatique : le ballon fonce vers la
// caméra au ralenti puis explose la vitre du téléphone (fissures qui courent, flash, écran qui bave), et le titre
// apparaît derrière la vitre brisée. Tout est construit en code (Three.js intégré + canvas), sons synthétisés.
const INTRO = { on: false, seek: null, seed: 0 };
const IN_T = { flick: .85, strike: 1.95, hit: 2.27 };
const IN_SLOW = [1.84, .32, 2.1]; // ralenti : début, vitesse, fin (temps de l'animation)
function inAnim(r) { const [a, k, e] = IN_SLOW, b = a + (e - a) / k; return r < a ? r : r < b ? a + (r - a) * k : e + (r - b); }
function inReal(t) { const [a, k, e] = IN_SLOW, b = a + (e - a) / k; return t < a ? t : t < e ? a + (t - a) / k : b + (t - e); }
function inRng(seed) { let s = seed >>> 0; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const inSm = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

// ---------- Le mouvement : images clés (radians), interpolées en douceur ----------
const INK = [0, .55, .85, 1.05, 1.40, 1.62, 1.80, 1.95, 2.20, 2.60, 3.4];
const INP = {
  y: [.98, .97, .96, .98, .80, 1.06, 1.40, 1.52, 1.30, .66, .34],
  z: [0, 0, 0, 0, 0, .04, .12, .2, .32, .5, .62],
  rx: [0, .03, -.06, .08, -.22, .45, 1.0, 1.48, 1.82, 2.0, 1.72],
  rz: [0, 0, 0, 0, 0, .04, .09, .12, .14, .12, .08],
  sp: [0, .02, .06, .14, .12, .18, .08, -.18, -.24, -.2, -.1],
  hd: [0, -.28, -.32, .45, .5, .42, .22, -.25, -.35, -.3, -.2],
  hR: [0, .22, .78, .06, .62, .12, -.25, 1.95, 1.25, .55, .3],
  kR: [-.04, -.4, -.28, -.08, -1.05, -.55, -1.35, -.18, -.45, -.35, -.3],
  aR: [0, -.1, -.25, 0, -.3, -.2, -.5, -1.15, -.6, -.3, -.2],
  hL: [0, -.04, -.1, 0, .62, 1.02, 1.62, -.05, -.15, .2, .3],
  kL: [-.04, -.05, -.06, -.05, -1.05, -.25, -.65, -.3, -.4, -.5, -.4],
  aL: [0, 0, 0, 0, -.3, -.4, -.6, -.5, -.4, -.3, -.2],
  sRz: [.12, .22, .32, .28, .22, .85, 1.25, 1.2, 1.35, 1.45, 1.3],
  sLz: [-.12, -.2, -.3, -.26, -.22, -.8, -1.2, -1.15, -1.3, -1.45, -1.3],
  sRx: [0, .12, -.18, .15, -.65, .95, .35, -.35, -.9, -1.5, -1.6],
  sLx: [0, -.1, .22, .15, -.65, 1.05, .6, -.2, -.9, -1.5, -1.6],
  eR: [.25, .35, .45, .3, .9, .45, .35, .25, .2, .25, .3],
  eL: [.25, .3, .4, .3, .9, .5, .4, .3, .2, .25, .3],
};
// spline cubique (tangentes de Catmull-Rom) sur des temps irréguliers
function inTrack(V, t) {
  const K = INK, n = K.length; if (t <= K[0]) return V[0]; if (t >= K[n - 1]) return V[n - 1];
  let i = 0; while (t > K[i + 1]) i++;
  const h = K[i + 1] - K[i], s = (t - K[i]) / h, m = j => j <= 0 || j >= n - 1 ? 0 : (V[j + 1] - V[j - 1]) / (K[j + 1] - K[j - 1]);
  const m0 = m(i) * h, m1 = m(i + 1) * h, s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * V[i] + (s3 - 2 * s2 + s) * m0 + (-2 * s3 + 3 * s2) * V[i + 1] + (s3 - s2) * m1;
}
// caméra : position et point visé
const INC = { t: [0, 1.0, 1.84, 2.1, 3], p: [[1.35, 1.2, 7.6], [1.0, 1.0, 6.3], [.78, .86, 5.3], [.7, .84, 4.95], [.7, .84, 4.9]], l: [[0, 1.2, -1], [0, 1.15, -.6], [0, 1.95, 0], [0, 2.05, .15], [0, 2.05, .15]], f: [50, 49, 46, 41, 41] };
function inCamAt(t) {
  const T = INC.t; let i = 0; while (i < T.length - 2 && t > T[i + 1]) i++;
  const s = inSm((t - T[i]) / (T[i + 1] - T[i])), L = (a, b) => a + (b - a) * s, V = (A, B) => [L(A[0], B[0]), L(A[1], B[1]), L(A[2], B[2])];
  return { p: V(INC.p[i], INC.p[i + 1]), l: V(INC.l[i], INC.l[i + 1]), f: L(INC.f[i], INC.f[i + 1]) };
}

// ---------- Construction de la scène ----------
function inCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function inTex(cv, rep, aniso) { const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } if (aniso) t.anisotropy = aniso; return t; }
function inGlowTex() { const [c, g] = inCanvas(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.12, 'rgba(255,252,240,.85)'); gr.addColorStop(.35, 'rgba(255,240,210,.22)'); gr.addColorStop(1, 'rgba(255,230,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }
function inDotTex() { const [c, g] = inCanvas(32, 32), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.6, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); }
function inName() {
  try { const ls = typeof lastSlot === 'function' ? lastSlot() : null, m = ls ? slotsMeta()[ls] : null; const n = m && m.name ? String(m.name).trim().split(/\s+/).pop() : ''; return n && n.length <= 11 ? n.toUpperCase() : ''; } catch (e) { return ''; }
}
function inJersey() {
  const W = 1024, H = 512, [c, g] = inCanvas(W, H);
  const base = '#0e4b32'; g.fillStyle = base; g.fillRect(0, 0, W, H);
  // fines rayures ton sur ton et grain du tissu
  for (let x = 0; x < W; x += 16) { g.fillStyle = 'rgba(0,0,0,.07)'; g.fillRect(x, 0, 7, H); }
  const R = inRng(7); for (let i = 0; i < 2600; i++) { g.fillStyle = R() < .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.06)'; g.fillRect(R() * W, R() * H, 2, 2); }
  // col et bas du maillot dorés
  g.fillStyle = '#e9ad2c'; g.fillRect(0, 0, W, 26); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 26, W, 4);
  g.fillStyle = '#e9ad2c'; g.fillRect(0, H - 16, W, 16);
  // bandes dorées sur les côtés
  for (const x of [W * .25, W * .75]) { g.fillStyle = 'rgba(233,173,44,.9)'; g.fillRect(x - 9, 30, 18, H - 46); }
  // nom et numéro dans le dos (centre de la texture = dos)
  const cx = W / 2, nm = inName();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if (nm) { g.font = '900 52px "Arial Black", "Helvetica Neue", Arial, sans-serif'; g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,.45)'; g.strokeText(nm, cx, 118); g.fillStyle = '#f2bd3f'; g.fillText(nm, cx, 118); }
  g.font = '900 230px "Arial Black", Impact, "Helvetica Neue", Arial, sans-serif';
  g.lineWidth = 14; g.strokeStyle = 'rgba(0,0,0,.5)'; g.strokeText('10', cx, nm ? 285 : 260);
  const gr = g.createLinearGradient(0, 160, 0, 400); gr.addColorStop(0, '#ffe08a'); gr.addColorStop(.5, '#f2b331'); gr.addColorStop(1, '#c98a14');
  g.fillStyle = gr; g.fillText('10', cx, nm ? 285 : 260);
  return c;
}
function inPlayer(sc, aniso) {
  const P = {}, G = () => new THREE.Group();
  const mat = (c, r, m, map) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m || 0, map: map || null });
  const skin = mat(0x9c6644, .55), shirt = mat(0xffffff, .82, 0, inTex(inJersey(), null, aniso)), green = mat(0x0e4b32, .82), gold = mat(0xf0b432, .3, .85), goldTrim = mat(0xe9ad2c, .6), black = mat(0x111513, .75), hairM = mat(0x16100c, .95), sole = mat(0x202020, .6);
  const mesh = (geo, m, parent, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; parent.add(o); return o; };
  const cyl = (r1, r2, h, seg) => new THREE.CylinderGeometry(r1, r2, h, seg || 14);
  const root = P.root = G(); sc.add(root);
  // short
  const sh = cyl(.17, .195, .27, 18); sh.scale(1, 1, .74); mesh(sh, black, root, 0, -.03, 0);
  // buste (profil tourné, aplati devant-derrière) avec le maillot
  const spine = P.spine = G(); spine.position.set(0, .08, 0); root.add(spine);
  const prof = [[.15, 0], [.158, .07], [.168, .17], [.188, .29], [.21, .39], [.215, .45], [.2, .5], [.15, .535], [.08, .555], [.055, .56]].map(([r, y]) => new THREE.Vector2(r, y));
  const tor = new THREE.LatheGeometry(prof, 32, Math.PI, Math.PI * 2); tor.scale(1, 1, .64); mesh(tor, shirt, spine, 0, 0, 0);
  for (const s of [-1, 1]) { const d = new THREE.SphereGeometry(.072, 16, 12); d.scale(1.05, .95, .95); mesh(d, green, spine, s * .19, .445, 0); }
  mesh(cyl(.052, .056, .12, 12), skin, spine, 0, .6, 0);
  const head = P.head = G(); head.position.set(0, .62, 0); spine.add(head);
  const hg = new THREE.SphereGeometry(.106, 24, 18); hg.scale(.93, 1.1, 1); mesh(hg, skin, head, 0, .085, 0);
  const hair = new THREE.SphereGeometry(.112, 24, 14, 0, Math.PI * 2, 0, Math.PI * .6); hair.scale(.95, 1.08, 1.02); mesh(hair, hairM, head, 0, .097, .004);
  for (const s of [-1, 1]) { const e = new THREE.SphereGeometry(.026, 10, 8); e.scale(.45, 1, .75); mesh(e, skin, head, s * .098, .08, .01); }
  // bras
  const arm = s => {
    const sj = G(); sj.position.set(s * .205, .455, 0); spine.add(sj);
    mesh(cyl(.07, .064, .15), green, sj, 0, -.06, 0); mesh(cyl(.066, .066, .022), goldTrim, sj, 0, -.135, 0);
    mesh(cyl(.052, .045, .28), skin, sj, 0, -.15, 0);
    const el = G(); el.position.set(0, -.285, 0); sj.add(el);
    mesh(cyl(.045, .034, .25), skin, el, 0, -.125, 0);
    const hd = new THREE.SphereGeometry(.043, 12, 10); hd.scale(.75, 1.25, .55); mesh(hd, skin, el, 0, -.28, 0);
    return [sj, el];
  };
  [P.sR, P.eR] = arm(1); [P.sL, P.eL] = arm(-1);
  // jambes
  const leg = s => {
    const hp = G(); hp.position.set(s * .094, -.07, 0); root.add(hp);
    mesh(cyl(.1, .093, .2), black, hp, 0, -.08, 0);
    mesh(cyl(.083, .058, .44), skin, hp, 0, -.22, 0);
    const kn = G(); kn.position.set(0, -.43, 0); hp.add(kn);
    mesh(cyl(.062, .041, .41), green, kn, 0, -.205, 0); mesh(cyl(.064, .062, .05), goldTrim, kn, 0, -.04, 0);
    const an = G(); an.position.set(0, -.395, 0); kn.add(an);
    const bt = new THREE.BoxGeometry(.098, .078, .265, 2, 2, 3); bt.translate(0, -.034, -.072);
    const pa = bt.attributes.position; for (let i = 0; i < pa.count; i++) { const z = pa.getZ(i), y = pa.getY(i); if (z < -.15) pa.setX(i, pa.getX(i) * .72); if (y > -.01 && z < -.1) pa.setY(i, y - .02); }
    bt.computeVertexNormals(); mesh(bt, gold, an, 0, 0, 0);
    const so = new THREE.BoxGeometry(.09, .014, .25); so.translate(0, -.078, -.07); mesh(so, sole, an, 0, 0, 0);
    return [hp, kn, an];
  };
  [P.hR, P.kR, P.aR] = leg(1); [P.hL, P.kL, P.aL] = leg(-1);
  P.mats = [skin, shirt, green, gold, goldTrim, black, hairM, sole];
  return P;
}
function inPose(P, t, idle) {
  const v = k => inTrack(INP[k], t), br = idle ? Math.sin(t * 2.6) * .006 : 0;
  P.root.position.set(0, v('y') + br, v('z')); P.root.rotation.set(v('rx'), 0, v('rz'));
  P.spine.rotation.set(v('sp') + br, 0, 0); P.head.rotation.set(v('hd'), 0, 0);
  P.hR.rotation.set(v('hR'), 0, .03); P.kR.rotation.set(v('kR'), 0, 0); P.aR.rotation.set(v('aR'), 0, 0);
  P.hL.rotation.set(v('hL'), 0, -.03); P.kL.rotation.set(v('kL'), 0, 0); P.aL.rotation.set(v('aL'), 0, 0);
  P.sR.rotation.set(v('sRx'), 0, v('sRz')); P.sL.rotation.set(v('sLx'), 0, v('sLz'));
  P.eR.rotation.set(v('eR'), 0, 0); P.eL.rotation.set(v('eL'), 0, 0);
  P.root.updateMatrixWorld(true);
}
// point du coup de pied (lacets) et direction qu'il pousse
function inInstep(P) {
  const m = P.aR.matrixWorld, p = new THREE.Vector3(0, -.01, -.085).applyMatrix4(m), n = new THREE.Vector3(0, 1, 0).transformDirection(m);
  return { p, n };
}
function inBallTex() {
  const [c, x] = inCanvas(512, 256); x.fillStyle = '#f6f6f2'; x.fillRect(0, 0, 512, 256);
  const pent = (cx, cy, r, col) => { x.fillStyle = col; x.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; x.lineTo(cx + Math.cos(a) * r * 1.6, cy + Math.sin(a) * r); } x.closePath(); x.fill(); };
  for (let i = 0; i < 6; i++) { pent(i * 85 + 30, 64, 24, '#16161c'); pent(i * 85 + 72, 192, 24, '#16161c'); }
  pent(256, 6, 30, '#16161c'); pent(256, 250, 30, '#16161c');
  x.fillStyle = '#e9ad2c'; for (let i = 0; i < 6; i++) { x.fillRect(i * 85 + 50, 120, 26, 8); }
  x.strokeStyle = 'rgba(0,0,0,.22)'; x.lineWidth = 3; for (let i = 0; i < 12; i++) { x.beginPath(); x.moveTo(i * 43, 0); x.lineTo(i * 43 + 30, 256); x.stroke(); }
  return c;
}
function inStadium(sc, R, aniso) {
  const S = {};
  // ciel de nuit, éclairé par le stade vers l'horizon
  const [skc, skg] = inCanvas(4, 512), sg = skg.createLinearGradient(0, 0, 0, 512);
  sg.addColorStop(0, '#010309'); sg.addColorStop(.28, '#040b1a'); sg.addColorStop(.43, '#0c1a33'); sg.addColorStop(.5, '#1c2d4a'); sg.addColorStop(1, '#1c2d4a'); skg.fillStyle = sg; skg.fillRect(0, 0, 4, 512);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 16), new THREE.MeshBasicMaterial({ map: inTex(skc), side: THREE.BackSide, fog: false, depthWrite: false })); sc.add(sky);
  // pelouse tondue en bandes + grain
  const [gc, gg] = inCanvas(512, 512);
  gg.fillStyle = '#2f7a35'; gg.fillRect(0, 0, 512, 256); gg.fillStyle = '#286d2f'; gg.fillRect(0, 256, 512, 256);
  for (let i = 0; i < 26000; i++) { const y = R() * 512, l = R(); gg.fillStyle = l < .5 ? `rgba(20,60,22,${.15 + R() * .25})` : `rgba(120,190,100,${.06 + R() * .12})`; gg.fillRect(R() * 512, y, 1.5, 2 + R() * 4); }
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ map: inTex(gc, [26, 240 / 11], aniso), roughness: .95, metalness: 0 }));
  grass.rotation.x = -Math.PI / 2; grass.position.set(0, 0, -40); grass.receiveShadow = true; sc.add(grass);
  // lignes du terrain : surface de réparation (le joueur est au point de penalty, but derrière la caméra)
  const lineM = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: .9 }), Y = .012, W = .12;
  const strip = (x1, z1, x2, z2) => { const dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz), m = new THREE.Mesh(new THREE.PlaneGeometry(W, L), lineM); m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(dx, -dz); m.position.set((x1 + x2) / 2, Y, (z1 + z2) / 2); m.receiveShadow = true; sc.add(m); };
  const arc = (cx, cz, r, a0, a1) => { const m = new THREE.Mesh(new THREE.RingGeometry(r - W / 2, r + W / 2, 64, 1, a0, a1 - a0), lineM); m.rotation.x = -Math.PI / 2; m.position.set(cx, Y, cz); m.receiveShadow = true; sc.add(m); };
  const gl = 11, box = gl - 16.5, six = gl - 5.5, half = gl - 52.5, far = gl - 105;
  strip(-20.16, box, 20.16, box); strip(-20.16, box, -20.16, gl); strip(20.16, box, 20.16, gl);
  strip(-9.16, six, 9.16, six); strip(-9.16, six, -9.16, gl); strip(9.16, six, 9.16, gl);
  const aa = Math.acos(5.5 / 9.15); arc(0, 0, 9.15, Math.PI / 2 - aa, Math.PI / 2 + aa);
  strip(-34, gl, -34, far); strip(34, gl, 34, far); strip(-34, half, 34, half); arc(0, half, 9.15, 0, Math.PI * 2);
  strip(-20.16, far + 16.5, 20.16, far + 16.5); strip(-20.16, far, -20.16, far + 16.5); strip(20.16, far, 20.16, far + 16.5); strip(-34, far, 34, far);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(.12, 20), lineM); spot.rotation.x = -Math.PI / 2; spot.position.set(0, Y, 0); sc.add(spot);
  // but au loin
  const postM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .4 });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.44, 8), postM); p.position.set(s * 3.66, 1.22, far); sc.add(p); }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 7.32, 8), postM); bar.rotation.z = Math.PI / 2; bar.position.set(0, 2.44, far); sc.add(bar);
  // panneaux LED autour du terrain (texte qui défile)
  const [lc, lg] = inCanvas(1024, 64); lg.fillStyle = '#05080b'; lg.fillRect(0, 0, 1024, 64); lg.font = '900 40px "Arial Black", Arial, sans-serif'; lg.textBaseline = 'middle';
  for (let i = 0; i < 2; i++) { lg.fillStyle = '#f2b331'; lg.fillText("CRAMPONS D'OR", i * 512 + 24, 34); lg.fillStyle = '#e8f2ec'; lg.fillText('★', i * 512 + 432, 34); }
  const ledT = inTex(lc, [6, 1]); S.led = ledT;
  const ledM = new THREE.MeshBasicMaterial({ map: ledT, color: 0xffffff, fog: true });
  const led = (x, z, w, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, .95), ledM); m.position.set(x, .48, z); m.rotation.y = ry; sc.add(m); };
  led(0, far - 4, 96, 0); led(-38, -40, 100, Math.PI / 2); led(38, -40, 100, -Math.PI / 2);
  // tribunes : gradins sombres + foule en points colorés
  const standM = new THREE.MeshStandardMaterial({ color: 0x0a0d13, roughness: 1 });
  const crowdPos = [], crowdCol = [], pal = [[.06, .42, .25], [.95, .7, .2], [.92, .92, .9], [.08, .1, .12], [.6, .1, .12], [.15, .3, .7]], pw = [.3, .22, .2, .18, .05, .05];
  const pickC = () => { let r = R(), i = 0; while (i < pw.length - 1 && r > pw[i]) { r -= pw[i]; i++; } const c = pal[i], k = .55 + R() * .5; return [c[0] * k, c[1] * k, c[2] * k]; };
  const tier = (x0, x1, z0, y0, depth, h, n, side) => {
    // plan incliné (dos à la pelouse)
    const g = new THREE.PlaneGeometry(1, 1), m = new THREE.Mesh(g, standM), L = Math.hypot(depth, h);
    if (!side) { m.scale.set(x1 - x0, L, 1); m.position.set((x0 + x1) / 2, y0 + h / 2, z0 - depth / 2); m.rotation.x = -Math.atan2(depth, h); }
    else { m.scale.set(x1 - x0, L, 1); m.rotation.order = 'YXZ'; m.rotation.y = -side * Math.PI / 2; m.rotation.x = -Math.atan2(depth, h); m.position.set(z0 + side * depth / 2, y0 + h / 2, (x0 + x1) / 2); }
    sc.add(m);
    for (let i = 0; i < n; i++) { const u = R(), v = R(), a = x0 + (x1 - x0) * u, d = depth * v, y = y0 + h * v + .45;
      if (!side) crowdPos.push(a, y, z0 - d + .3); else crowdPos.push(z0 + side * d - side * .3, y, a);
      crowdCol.push(...pickC()); }
  };
  tier(-62, 62, far - 6, 0, 16, 13, 7000); tier(-66, 66, far - 24, 15, 18, 16, 7000); tier(-70, 70, far - 44, 33, 14, 13, 5200);
  for (const s of [-1, 1]) { tier(-95, 12, s * 42, 0, 16, 13, 3200, s); tier(-95, 12, s * 60, 15, 18, 16, 2600, s); }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(crowdPos, 3)); cg.setAttribute('color', new THREE.Float32BufferAttribute(crowdCol, 3));
  const dot = inDotTex(); S.dot = dot;
  const crowd = new THREE.Points(cg, new THREE.PointsMaterial({ size: .55, vertexColors: true, map: dot, alphaTest: .4, transparent: false, sizeAttenuation: true })); sc.add(crowd);
  // flashs d'appareils photo dans la foule
  const NF = 70, fp = new Float32Array(NF * 3), fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  const glow = inGlowTex(); S.glow = glow;
  S.flash = { geo: fg, pos: fp, life: new Float32Array(NF), src: crowdPos, n: crowdPos.length / 3 };
  S.flashPts = new THREE.Points(fg, new THREE.PointsMaterial({ size: 3.2, map: glow, color: 0xf4f8ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, sizeAttenuation: true })); sc.add(S.flashPts);
  // toit et rampe de projecteurs + halos, faisceaux dans la brume
  const roof = new THREE.Mesh(new THREE.BoxGeometry(160, 2.2, 26), new THREE.MeshStandardMaterial({ color: 0x0b0e13, roughness: 1 })); roof.position.set(0, 50, far - 52); sc.add(roof);
  const lampM = new THREE.MeshBasicMaterial({ color: 0xfff6e0 });
  for (let i = 0; i < 26; i++) { const x = -75 + i * 6; const b = new THREE.Mesh(new THREE.BoxGeometry(2.6, .8, .3), lampM); b.position.set(x, 48.6, far - 39.5); sc.add(b);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xfff1d6, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .75 })); sp.position.set(x, 48.6, far - 39); sp.scale.set(14, 14, 1); sc.add(sp); }
  for (const s of [-1, 1]) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xfff4e2, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .9 })); sp.position.set(s * 70, 52, far - 40); sp.scale.set(60, 60, 1); sc.add(sp);
    const st = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xcfe2ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .35 })); st.position.set(s * 70, 52, far - 39); st.scale.set(220, 7, 1); sc.add(st);
  }
  const beamM = new THREE.MeshBasicMaterial({ color: 0xfff3dc, transparent: true, opacity: .028, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  for (const x of [-48, -18, 18, 48]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 16, 62, 20, 1, true), beamM); c.position.set(x, 18, far - 12); c.rotation.x = -.62; sc.add(c); }
  // brume lumineuse au-dessus du stade
  const haze = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x8fb0e8, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .14, fog: false })); haze.position.set(0, 40, far - 60); haze.scale.set(320, 120, 1); sc.add(haze);
  return S;
}
function inBuild(cv) {
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.12;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  const aniso = Math.min(8, r.capabilities.getMaxAnisotropy());
  const sc = new THREE.Scene(); sc.fog = new THREE.FogExp2(0x0d1828, .0058);
  const cam = new THREE.PerspectiveCamera(50, 1, .05, 900);
  sc.add(new THREE.HemisphereLight(0x9db4e0, 0x1c3320, .55));
  const key = new THREE.DirectionalLight(0xffe9cf, 1.7); key.position.set(-7, 13, 15); key.target.position.set(0, 1, 0); key.castShadow = true;
  const sh = key.shadow; sh.mapSize.set(1024, 1024); sh.camera.left = -4; sh.camera.right = 4; sh.camera.top = 5; sh.camera.bottom = -3; sh.camera.near = 2; sh.camera.far = 40; sh.bias = -.0008; sh.normalBias = .02;
  sc.add(key); sc.add(key.target);
  const rim = new THREE.DirectionalLight(0xdbe8ff, 1.5); rim.position.set(9, 10, -16); sc.add(rim);
  const rim2 = new THREE.DirectionalLight(0xfff0dd, .8); rim2.position.set(-11, 8, -13); sc.add(rim2);
  const R = inRng(INTRO.seed || 11);
  const st = inStadium(sc, R, aniso);
  const P = inPlayer(sc, aniso);
  // ballon + traînée
  const bt = inTex(inBallTex(), null, aniso);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.11, 32, 24), new THREE.MeshStandardMaterial({ map: bt, roughness: .38 })); ball.castShadow = true; sc.add(ball);
  const ghosts = []; for (let i = 0; i < 5; i++) { const g = new THREE.Mesh(new THREE.SphereGeometry(.11, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .2 - i * .035, depthWrite: false })); g.visible = false; sc.add(g); ghosts.push(g); }
  // onde de choc à la frappe
  const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: st.glow, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })); sc.add(ring);
  // points clés du ballon calculés sur le squelette : décollage du pied et contact au retourné
  inPose(P, IN_T.flick); const f = inInstep(P); const B0 = f.p.clone().addScaledVector(f.n, .12);
  inPose(P, IN_T.strike); const k = inInstep(P); const C = k.p.clone().addScaledVector(k.n, .125);
  inPose(P, .3); const f0 = inInstep(P); const REST = new THREE.Vector3(f0.p.x + .02, .11, f0.p.z - .2);
  Object.assign(INTRO, { r, sc, cam, P, st, ball, ghosts, ring, B0, C, REST, trail: [], spin: new THREE.Quaternion(), tmpQ: new THREE.Quaternion(), ax: new THREE.Vector3(1, .3, .2).normalize(), R });
}
// position du ballon à l'instant t (temps de l'animation)
function inBallAt(t, out) {
  const I = INTRO, { B0, C, REST } = I;
  if (t < .62) return out.copy(REST);
  if (t < IN_T.flick) { inPose(I.P, t); const f = inInstep(I.P); const on = f.p.clone().addScaledVector(f.n, .12); return out.copy(REST).lerp(on, inSm((t - .62) / (IN_T.flick - .62))); }
  if (t < IN_T.strike) { const T = IN_T.strike - IN_T.flick, s = t - IN_T.flick, g = 9.81, v0 = (C.y - B0.y + g * T * T / 2) / T, u = s / T; return out.set(B0.x + (C.x - B0.x) * u, B0.y + v0 * s - g * s * s / 2, B0.z + (C.z - B0.z) * u); }
  const p = Math.min(1, (t - IN_T.strike) / (IN_T.hit - IN_T.strike)), tgt = inTarget();
  out.copy(C).lerp(tgt, Math.pow(p, 1.08)); out.y += Math.sin(p * Math.PI) * .25; return out;
}
// point d'impact : juste devant l'objectif, en haut de l'écran
function inTarget() {
  const c = INTRO.cam, d = .26, hh = Math.tan(c.fov * Math.PI / 360), v = new THREE.Vector3(INTRO.hitN[0] * hh * c.aspect * d, INTRO.hitN[1] * hh * d, -d);
  return v.applyMatrix4(c.matrixWorld);
}
function inCamera(t) {
  const I = INTRO, c = inCamAt(t), cam = I.cam;
  cam.position.set(c.p[0], c.p[1], c.p[2]);
  // tremblement à la frappe
  const sk = t > IN_T.strike && t < IN_T.strike + .12 ? (1 - (t - IN_T.strike) / .12) * .02 : 0;
  if (sk) { cam.position.x += (I.R() - .5) * sk; cam.position.y += (I.R() - .5) * sk; }
  cam.fov = c.f * (cam.aspect < .8 ? 1 : .8); cam.updateProjectionMatrix();
  cam.lookAt(c.l[0], c.l[1], c.l[2]);
  cam.rotateZ(t > 1.6 ? -inSm((t - 1.6) / .5) * .05 : 0);
  cam.updateMatrixWorld(true);
}
function inFlashes(dt) {
  const F = INTRO.st.flash, R = INTRO.R;
  for (let i = 0; i < F.life.length; i++) {
    F.life[i] -= dt;
    if (F.life[i] <= 0) {
      if (F.life[i] < -(R() * 1.2)) { const j = (R() * F.n | 0) * 3; F.pos[i * 3] = F.src[j]; F.pos[i * 3 + 1] = F.src[j + 1] + .3; F.pos[i * 3 + 2] = F.src[j + 2] + .4; F.life[i] = .05 + R() * .07; }
      else F.pos[i * 3 + 1] = -500;
    }
  }
  F.geo.attributes.position.needsUpdate = true;
}
function inRender3D(t, dt) {
  const I = INTRO;
  inPose(I.P, t, t < .5);
  inCamera(t);
  const b = inBallAt(t, I.ball.position), kb = I.kHit;
  if (kb != null) { const tg = inTarget(), back = I.C.clone().sub(tg).normalize(); b.copy(tg).addScaledVector(back, 7.5 * kb); b.y += 1.2 * kb - 4.9 * kb * kb; }
  // rotation du ballon : roule au jonglage, tourne vite après la frappe
  const w = t < IN_T.flick ? 0 : t < IN_T.strike ? 9 : kb != null ? 14 : 34;
  I.tmpQ.setFromAxisAngle(I.ax, w * dt); I.ball.quaternion.premultiply(I.tmpQ);
  I.ball.visible = kb == null ? t < IN_T.hit : kb > .03 && kb < 1.6;
  // traînée de mouvement après la frappe
  if (t > IN_T.strike && I.ball.visible && kb == null) { I.trail.unshift(b.clone()); I.trail.length = Math.min(I.trail.length, 6); } else I.trail.length = 0;
  I.ghosts.forEach((g, i) => { const p = I.trail[i + 1]; g.visible = !!p && I.ball.visible; if (p) g.position.copy(p); });
  // onde de choc
  const rp = (t - IN_T.strike) / .16; if (rp > 0 && rp < 1) { I.ring.position.copy(I.C); I.ring.material.opacity = (1 - rp) * .8; const s = .3 + rp * 1.4; I.ring.scale.set(s, s, 1); } else I.ring.material.opacity = 0;
  if (I.st.led) I.st.led.offset.x = (I.st.led.offset.x + dt * .05) % 1;
  inFlashes(t > 1.5 && t < 2.6 ? dt * .45 : dt);
  I.r.render(I.sc, I.cam);
}

// ---------- 2D de secours (sans WebGL) ----------
function inBall2D(g, x, y, r, rot) {
  const gr = g.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.7, '#dcdcd6'); gr.addColorStop(1, '#8f8f8a');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip(); g.fillStyle = '#17171d';
  for (let i = 0; i < 6; i++) { const a = rot + i * 1.26, d = i ? r * .62 : 0, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * .9, s = r * (i ? .26 : .3); g.beginPath(); for (let k = 0; k < 5; k++) { const b = rot * 1.3 + k * Math.PI * 2 / 5; g.lineTo(px + Math.cos(b) * s, py + Math.sin(b) * s); } g.fill(); }
  g.restore();
}
function inRender2D(t) {
  const I = INTRO, cv = I.cv, g = I.g2, w = cv.width, h = cv.height;
  const bg = g.createRadialGradient(w / 2, h * .42, 10, w / 2, h * .42, h * .9); bg.addColorStop(0, '#24406a'); bg.addColorStop(.5, '#0b1526'); bg.addColorStop(1, '#03060c'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = '#245f2c'; g.fillRect(0, h * .6, w, h * .4);
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.03)'; g.fillRect(0, h * (.6 + i * .067), w, h * .067); }
  for (const s of [.12, .88]) { const gr = g.createRadialGradient(w * s, h * .14, 0, w * s, h * .14, w * .35); gr.addColorStop(0, 'rgba(255,248,230,.95)'); gr.addColorStop(.15, 'rgba(255,240,210,.35)'); gr.addColorStop(1, 'rgba(255,240,210,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  if (t > IN_T.hit) return;
  let x, y, r;
  if (t < IN_T.strike) { const s = Math.max(0, t - IN_T.flick) / (IN_T.strike - IN_T.flick); x = w * .5; y = h * (.66 - Math.sin(s * Math.PI) * .2); r = w * .02; }
  else { const p = (t - IN_T.strike) / (IN_T.hit - IN_T.strike), e = Math.pow(p, 2.2); x = w * .5 + (I.hitPx[0] * I.dpr - w * .5) * p; y = h * .58 + (I.hitPx[1] * I.dpr - h * .58) * p; r = w * .02 + e * w * .5; }
  inBall2D(g, x, y, r, t * 9);
}

// ---------- Vitre brisée ----------
function inCrackGen(w, h, x, y, R) {
  const D = Math.hypot(Math.max(x, w - x), Math.max(y, h - y)), N = 13 + (R() * 5 | 0), base = R() * Math.PI * 2, rad = [], lines = [];
  for (let i = 0; i < N; i++) {
    const a0 = base + i / N * Math.PI * 2 + (R() - .5) * (Math.PI * 2 / N) * .55, L = R() < .7 ? D * 1.1 : D * (.25 + R() * .45);
    let a = a0, d = 5, px = x + Math.cos(a) * 5, py = y + Math.sin(a) * 5; const pts = [[px, py, d]];
    while (d < L) { const seg = 5 + R() * 12 * (1 + d / D * 1.5); a += (R() - .5) * .34; a += (a0 - a) * .12; px += Math.cos(a) * seg; py += Math.sin(a) * seg; d += seg; pts.push([px, py, d]); if (px < -30 || py < -30 || px > w + 30 || py > h + 30) break; }
    rad.push(pts); lines.push({ pts, w0: 2.4, w1: .7 });
    for (let k = 3; k < pts.length - 2; k++) if (R() < .075) {
      let [bx, by, bd] = pts[k]; let b = Math.atan2(by - y, bx - x) + (R() < .5 ? -1 : 1) * (.35 + R() * .7); const bp = [[bx, by, bd]], BL = bd + 25 + R() * (110 + bd * .3);
      while (bd < BL) { const seg = 4 + R() * 11; b += (R() - .5) * .45; bx += Math.cos(b) * seg; by += Math.sin(b) * seg; bd += seg; bp.push([bx, by, bd]); }
      lines.push({ pts: bp, w0: 1.2, w1: .5 });
    }
  }
  const at = (pts, r) => { for (const p of pts) if (Math.hypot(p[0] - x, p[1] - y) >= r) return p; return null; };
  const RR = [D * .045, D * .1, D * .18, D * .3, D * .46], keep = [.98, .85, .65, .45, .25], cells = [];
  const ringPts = RR.map(r0 => rad.map(p => at(p, r0 * (.88 + R() * .24))));
  RR.forEach((r0, ri) => {
    for (let i = 0; i < N; i++) {
      const A = ringPts[ri][i], B = ringPts[ri][(i + 1) % N]; if (!A || !B || R() > keep[ri]) continue;
      const pts = [], n = 3 + (R() * 3 | 0); for (let k = 0; k <= n; k++) { const s = k / n, mx = A[0] + (B[0] - A[0]) * s, my = A[1] + (B[1] - A[1]) * s, ox = mx - x, oy = my - y, ol = Math.hypot(ox, oy) || 1, bow = Math.sin(s * Math.PI) * r0 * .06 + (k && k < n ? (R() - .5) * 5 : 0); pts.push([mx + ox / ol * bow, my + oy / ol * bow, Math.max(A[2], B[2])]); }
      lines.push({ pts, w0: 1.1 - ri * .12, w1: .6, ring: 1 });
    }
  });
  // éclats : chaque morceau de verre renvoie un peu la lumière différemment
  for (let ri = 0; ri < RR.length; ri++) for (let i = 0; i < N; i++) {
    const a = ri ? ringPts[ri - 1][i] : [x, y, 0], b = ri ? ringPts[ri - 1][(i + 1) % N] : null, c = ringPts[ri][(i + 1) % N], d = ringPts[ri][i];
    if (!a || !c || !d || (ri && !b)) continue; const poly = ri ? [a, b, c, d] : [a, c, d], lv = R();
    cells.push({ poly, d: Math.max(c[2], d[2]), f: lv < .55 ? `rgba(255,255,255,${(.015 + R() * .07).toFixed(3)})` : lv < .85 ? `rgba(0,0,0,${(.04 + R() * .12).toFixed(3)})` : `rgba(170,210,255,${(.04 + R() * .08).toFixed(3)})` });
  }
  const crush = []; for (let i = 0; i < 70; i++) { const a = R() * Math.PI * 2, r1 = R() * D * .05, l = 3 + R() * 10, b = a + (R() - .5) * 2; crush.push([x + Math.cos(a) * r1, y + Math.sin(a) * r1, x + Math.cos(a) * r1 + Math.cos(b) * l, y + Math.sin(a) * r1 + Math.sin(b) * l]); }
  return { x, y, D, lines, cells, crush };
}
function inCrackDraw(g, C, rev, dpr) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, g.canvas.width, g.canvas.height);
  for (const c of C.cells) if (c.d <= rev) { g.fillStyle = c.f; g.beginPath(); for (const p of c.poly) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); }
  // poussière de verre au point d'impact
  const cr = C.D * .055, gr = g.createRadialGradient(C.x, C.y, 0, C.x, C.y, cr * 1.6); gr.addColorStop(0, 'rgba(255,255,255,.6)'); gr.addColorStop(.45, 'rgba(225,235,250,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(C.x, C.y, cr * 1.6, 0, Math.PI * 2); g.fill();
  g.lineCap = 'round'; g.lineJoin = 'round';
  const stroke = (pass) => {
    for (const L of C.lines) {
      const P = L.pts; if (P[0][2] > rev) continue;
      for (let i = 1; i < P.length; i++) {
        const a = P[i - 1], b = P[i]; if (a[2] > rev) break; let bx = b[0], by = b[1];
        if (b[2] > rev && !L.ring) { const s = (rev - a[2]) / (b[2] - a[2]); bx = a[0] + (b[0] - a[0]) * s; by = a[1] + (b[1] - a[1]) * s; }
        const q = Math.min(1, a[2] / (C.D * .7)), wd = L.w0 + (L.w1 - L.w0) * q;
        g.beginPath(); g.moveTo(a[0] + (pass ? 0 : .9), a[1] + (pass ? 0 : .9)); g.lineTo(bx + (pass ? 0 : .9), by + (pass ? 0 : .9));
        if (pass === 0) { g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = wd + 1.1; }
        else if (pass === 1) { g.strokeStyle = `rgba(236,244,255,${(.92 - q * .35).toFixed(2)})`; g.lineWidth = wd; }
        else { g.strokeStyle = 'rgba(160,205,255,.5)'; g.lineWidth = wd * 2.6; }
        g.stroke(); if (pass === 2 && i > 5) break;
      }
    }
  };
  stroke(0); stroke(1); g.globalCompositeOperation = 'lighter'; stroke(2); g.globalCompositeOperation = 'source-over';
  g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = .8; for (const c of C.crush) { g.beginPath(); g.moveTo(c[0], c[1]); g.lineTo(c[2], c[3]); g.stroke(); }
}
// écran LCD abîmé : tache d'encre et lignes de pixels
function inBlotDraw(g, C, k, t, dpr, R) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, g.canvas.width, g.canvas.height);
  const r = C.D * .07 * inSm(k);
  if (r > 1) {
    for (const [dx, dy, s] of C.blob) { const gr = g.createRadialGradient(C.x + dx * r, C.y + dy * r, 0, C.x + dx * r, C.y + dy * r, r * s); gr.addColorStop(0, 'rgba(0,0,0,.96)'); gr.addColorStop(.65, 'rgba(6,2,14,.85)'); gr.addColorStop(.85, 'rgba(90,30,140,.28)'); gr.addColorStop(1, 'rgba(20,160,120,0)'); g.fillStyle = gr; g.beginPath(); g.arc(C.x + dx * r, C.y + dy * r, r * s, 0, Math.PI * 2); g.fill(); }
  }
  for (const L of C.pix) { if (t < L.on || (t < L.on + .7 && R() < .35)) continue; g.fillStyle = L.c; g.fillRect(L.x, 0, L.w, g.canvas.height / dpr); }
}

// ---------- Sons (synthétisés ; joués seulement si le son est déjà débloqué) ----------
function inAu() { return typeof AU !== 'undefined' && AU.ctx && AU.ctx.state === 'running' && AU.unlocked ? AU.ctx : null; }
function inNoise(c, dur, type, f, q, g0, at, out) {
  const t = c.currentTime + (at || 0), s = c.createBufferSource(); s.buffer = AU.white; s.loop = true;
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || .7; const g = c.createGain();
  g.gain.setValueAtTime(g0, t); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  s.connect(fl); fl.connect(g); g.connect(out || AU.fx); s.start(t, Math.random() * 1.5); s.stop(t + dur + .05); return { s, fl, g, t };
}
function inTone(c, f0, f1, dur, g0, at, type, out) {
  const t = c.currentTime + (at || 0), o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur * .8);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(g0, t + .004); g.gain.exponentialRampToValueAtTime(.0005, t + dur); o.connect(g); g.connect(out || AU.fx); o.start(t); o.stop(t + dur + .05);
}
function inSnd(k) {
  const c = inAu(); if (!c || !AU.white) return;
  const I = INTRO;
  try {
    if (k === 'crowd') {
      if (typeof smpHas === 'function' && smpHas('cheer')) { I.bed = smpPlay('cheer_loop', .32, { loop: true, fade: .6 }); }
      else { const s = c.createBufferSource(); s.buffer = AU.brown || AU.white; s.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = .5; const g = c.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(.5, c.currentTime, .4); s.connect(f); f.connect(g); g.connect(AU.fx); s.start(); I.bed = { src: s, g }; }
    } else if (k === 'touch') { inTone(c, 140, 70, .12, .35); inNoise(c, .05, 'bandpass', 1800, 1, .12); }
    else if (k === 'rise') { if (typeof smpHas === 'function' && smpHas('surge')) smpPlay('surge', .45, { rate: 1 }); else { const n = inNoise(c, 1.2, 'bandpass', 500, .6, .25); n.fl.frequency.exponentialRampToValueAtTime(1400, n.t + 1); } }
    else if (k === 'kick') {
      if (typeof sfxG === 'function') sfxG('shot', 1.1);
      inTone(c, 170, 48, .22, .95); inNoise(c, .06, 'bandpass', 2600, 1.2, .5); inNoise(c, .5, 'lowpass', 300, .7, .25, .02);
      // souffle du ballon qui arrive (ralenti puis accélère)
      const n = inNoise(c, I.flight + .05, 'bandpass', 260, 1.4, .02); n.g.gain.cancelScheduledValues(n.t); n.g.gain.setValueAtTime(.02, n.t); n.g.gain.exponentialRampToValueAtTime(.55, n.t + I.flight); n.fl.frequency.setValueAtTime(260, n.t); n.fl.frequency.exponentialRampToValueAtTime(2800, n.t + I.flight);
    } else if (k === 'glass') {
      if (typeof sfxG === 'function') sfxG('glass', 1.2);
      if (I.bed) { try { I.bed.g.gain.cancelScheduledValues(c.currentTime); I.bed.g.gain.setTargetAtTime(.0001, c.currentTime, .02); } catch (e) { } }
      inTone(c, 95, 38, .3, 1); inNoise(c, .09, 'highpass', 1800, .7, 1); inNoise(c, .22, 'bandpass', 900, .8, .55); inNoise(c, .7, 'highpass', 5200, .7, .22, .03);
      for (let i = 0; i < 30; i++) { const at = .015 + Math.pow(Math.random(), 1.7) * .95, f = 2600 + Math.random() * 6200, a = .09 * (1 - at); inTone(c, f, f * .985, .05 + Math.random() * .08, a, at, 'sine'); if (Math.random() < .4) inTone(c, f * 2.71, f * 2.7, .04, a * .5, at, 'sine'); }
      inTone(c, 60, 60, .28, .12, .02, 'square'); // écran qui grésille
    } else if (k === 'title') {
      inTone(c, 58, 44, 1.6, .7); inNoise(c, 1, 'lowpass', 220, .7, .4);
      for (const f of [1046, 1568, 2093]) inTone(c, f, f, 1.8, .04, .05);
    }
  } catch (e) { }
}
function inSndStop() { const I = INTRO; if (I.bed) { try { const c = AU.ctx; I.bed.g.gain.setTargetAtTime(.0001, c.currentTime, .15); const s = I.bed.src; setTimeout(() => { try { s.stop(); } catch (e) { } }, 900); } catch (e) { } I.bed = null; } }

// ---------- Déroulé ----------
function introOk(replay) {
  if (typeof document === 'undefined' || !document.body || typeof document.body.appendChild !== 'function' || typeof requestAnimationFrame !== 'function') return false;
  if (replay) return true;
  if (typeof OPTS !== 'undefined' && OPTS.intro === false) return false;
  if (typeof navigator !== 'undefined' && navigator.webdriver && !window.__INTRO) return false;
  try { if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return false; } catch (e) { }
  return true;
}
function introPlay(replay) {
  if (INTRO.on || !introOk(replay)) return false;
  const el = document.createElement('div'); el.id = 'intro'; el.setAttribute('data-a', 'introSkip'); el.setAttribute('aria-label', "Crampons d'Or");
  el.innerHTML = `<div class="iwrap"><canvas class="i3"></canvas><div class="ishade"></div><canvas class="iblot"></canvas>
    <div class="ititle"><div class="lbl">Carrière de footballeur · 2026-27</div><h1 class="logo"><b class="ln">Crampons</b><span class="ln">d'Or</span></h1><div class="iload"><i></i></div><div class="ilt">&nbsp;</div></div>
    <canvas class="icrack"></canvas><div class="iflash"></div></div><div class="ihint">Touche l'écran pour passer</div>`;
  document.body.appendChild(el);
  const I = INTRO;
  Object.assign(I, { on: true, el, cv: el.querySelector('.i3'), cc: el.querySelector('.icrack'), cb: el.querySelector('.iblot'), r0: 0, last: 0, hit: false, done: false, phase: 0, fired: {}, flat: false, crack: null, endT: 0, replay: !!replay, seed: I.seedFix || (Date.now() & 0xffff) || 1 });
  I.hitN = [-.08, .42];
  I.flight = inReal(IN_T.hit) - inReal(IN_T.strike);
  I.rHit = inReal(IN_T.hit);
  try { if (typeof THREE === 'undefined' || typeof g3Avail !== 'function' || !g3Avail()) throw new Error('2d'); inBuild(I.cv); }
  catch (e) { I.flat = true; I.g2 = I.cv.getContext('2d'); I.R = inRng(I.seed); }
  introSize();
  addEventListener('resize', introSize);
  if (replay && typeof smpLoad === 'function') try { smpLoad(); } catch (e) { }
  requestAnimationFrame(introFrame);
  return true;
}
function introSize() {
  const I = INTRO; if (!I.on) return;
  const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio || 1, I.lowDpr ? 1.25 : 2); I.w = w; I.h = h; I.dpr = dpr;
  if (I.flat) { I.cv.width = w * dpr; I.cv.height = h * dpr; }
  else { I.r.setPixelRatio(dpr); I.r.setSize(w, h, false); I.cam.aspect = w / h; I.cam.updateProjectionMatrix(); }
  const cd = Math.min(devicePixelRatio || 1, 3); I.cdpr = cd;
  for (const c of [I.cc, I.cb]) { c.width = w * cd; c.height = h * cd; }
  I.hitPx = [(I.hitN[0] + 1) / 2 * w, (1 - I.hitN[1]) / 2 * h];
  if (I.crack) { I.crack = null; I.hitAt = null; I.cracked = false; }
}
function introFrame(now) {
  const I = INTRO; if (!I.on) return;
  if (!I.r0) { I.r0 = now; I.last = now; }
  let r = (now - I.r0) / 1000; if (I.seek != null) r = I.seek;
  const dt = I.seek != null ? 1 / 60 : Math.min(.05, (now - I.last) / 1000); I.last = now;
  // iPhone lent : on baisse la définition
  if (!I.flat && I.seek == null) { I.fc = (I.fc || 0) + 1; if (I.fc > 8 && I.fc < 40) { I.slow = (I.slow || 0) + (dt > .045 ? 1 : 0); if (I.slow > 12 && !I.lowDpr) { I.lowDpr = true; introSize(); } } }
  // le temps de l'animation : ralenti autour de la frappe ; après l'impact, la scène continue tout doucement derrière la vitre
  const t = r < I.rHit ? inAnim(r) : IN_T.hit + (r - I.rHit) * .12, adt = r < I.rHit ? (inAnim(r) - inAnim(Math.max(0, r - dt))) : dt * .12;
  if (r > .05 && !I.fired.in) { I.fired.in = 1; I.el.classList.add('lit'); inSnd('crowd'); }
  if (t >= .66 && !I.fired.touch) { I.fired.touch = 1; inSnd('touch'); }
  if (t >= 1.3 && !I.fired.rise) { I.fired.rise = 1; inSnd('rise'); }
  if (t >= IN_T.strike && !I.fired.kick) { I.fired.kick = 1; inSnd('kick'); }
  I.kHit = r >= I.rHit ? r - I.rHit : null;
  try { if (I.flat) inRender2D(t); else inRender3D(t, Math.max(0, adt)); } catch (e) { if (!I.flat) { I.flat = true; I.g2 = I.cv.getContext('2d'); introSize(); } }
  if (r >= I.rHit) introHit(r);
  if (I.on && I.seek == null) requestAnimationFrame(introFrame);
}
function introHit(r) {
  const I = INTRO, k = r - I.rHit;
  if (!I.crack) {
    I.crack = inCrackGen(I.w, I.h, I.hitPx[0], I.hitPx[1], inRng(I.seed + 3));
    const R = inRng(I.seed + 5); I.crack.blob = []; for (let i = 0; i < 9; i++) I.crack.blob.push([(R() - .5) * 1.1, (R() - .5) * .9, .45 + R() * .5]);
    I.crack.pix = []; const cols = ['rgba(255,40,214,.5)', 'rgba(40,255,140,.42)', 'rgba(60,200,255,.42)', 'rgba(255,255,255,.35)'];
    for (let i = 0; i < 3; i++) I.crack.pix.push({ x: I.hitPx[0] + (R() - .5) * I.w * .5, w: 1, c: cols[i], on: .15 + R() * .5 });
    if (!I.fired.glass) { I.fired.glass = 1; inSnd('glass'); try { navigator.vibrate && navigator.vibrate([25, 30, 60]); } catch (e) { } I.el.classList.add('hit'); setTimeout(() => I.el && I.el.classList.add('dim'), 120); }
  }
  const rev = Math.min(1, k / .38), C = I.crack;
  if (!I.cracked) { inCrackDraw(I.cc.getContext('2d'), C, C.D * 1.6 * (1 - Math.pow(1 - rev, 2.2)) + 4, I.cdpr); if (rev >= 1) I.cracked = true; }
  inBlotDraw(I.cb.getContext('2d'), C, Math.min(1, k / 1.6), k, I.cdpr, I.R || Math.random);
  if (I.seekLoad) { const st = ['Préparation du terrain…', 'Championnats…', 'Clubs et entraîneurs…', 'Joueurs et effectifs 2026…', 'Sélections…', 'Prêt !'], n = Math.max(0, Math.min(st.length - 1, Math.floor((k - .67) / .29))); const bar = I.el.querySelector('.iload i'), lt = I.el.querySelector('.ilt'); if (k > .67) { if (bar) bar.style.width = [12, 34, 55, 74, 90, 100][n] + '%'; if (lt) lt.textContent = st[n]; if (n === st.length - 1) I.el.classList.add('ready'); } }
  if (k > .42 && !I.fired.title) { I.fired.title = 1; I.el.classList.add('title'); introFit(); inSnd('title'); introLoad(); }
}
// le titre doit tenir en largeur, quelle que soit la police chargée
function introFit() {
  const lg = INTRO.el && INTRO.el.querySelector('.ititle .logo'); if (!lg) return;
  lg.style.fontSize = ''; const box = lg.clientWidth - 6;
  for (let i = 0; i < 6; i++) { const w = Math.max(...[...lg.querySelectorAll('.ln')].map(e => e.offsetWidth)); if (!w || w <= box) break; lg.style.fontSize = (parseFloat(getComputedStyle(lg).fontSize) * box / w * .98) + 'px'; }
}
function introLoad() {
  const I = INTRO, bar = I.el.querySelector('.iload i'), lt = I.el.querySelector('.ilt');
  if (I.seek != null) { I.seekLoad = true; return; } // images fixes (bande-annonce, tests) : la barre suit le temps de l'animation
  // le chargement a déjà eu lieu sur l'écran du stade (loading.js) : plus de barre ici, le titre reste affiché un instant
  const steps = [['Prêt !', 100], ['Prêt !', 100], ['Prêt !', 100], ['Prêt !', 100]];
  let i = 0; const tick = () => { if (!I.on || I.done) return; const [t, p] = steps[i]; if (bar) bar.style.width = p + '%'; if (lt) lt.textContent = t; i++; if (i < steps.length) setTimeout(tick, 230 + Math.random() * 120); else { I.el.classList.add('ready'); const hint = I.el.querySelector('.ihint'); if (hint) hint.textContent = 'Touche pour jouer'; I.auto = setTimeout(() => introEnd(), 2400); } };
  setTimeout(tick, 250);
}
function introEnd() {
  const I = INTRO; if (!I.on || I.done) return; I.done = true; clearTimeout(I.auto);
  inSndStop();
  const el = I.el; el.classList.add('out');
  setTimeout(() => {
    I.on = false; removeEventListener('resize', introSize);
    try { if (I.r) { I.sc.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { for (const k of ['map']) if (o.material[k]) o.material[k].dispose(); o.material.dispose(); } }); I.r.dispose(); if (I.r.forceContextLoss) I.r.forceContextLoss(); } } catch (e) { }
    I.r = I.sc = I.P = I.ball = null; el.remove();
  }, 520);
}
