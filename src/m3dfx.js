// ===================== 3D : ballons de la Boutique, halo, effets de but, vitrine de ton joueur =====================

// ---------- ballons (texture plaquée sur la sphère) ----------
function g3BallPaint(skin, W, H) {
  W = W || 512; H = H || 256; const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), k = W / 512;
  const pent = (cx, cy, r, col) => { x.fillStyle = col; x.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; x.lineTo((cx + Math.cos(a) * r * 1.6) * k, (cy + Math.sin(a) * r) * k); } x.closePath(); x.fill(); };
  const panels = (col, col2) => { for (let i = 0; i < 6; i++) { pent(i * 85 + 30, 60, 22, col); pent(i * 85 + 72, 190, 22, col2 || col); } pent(256, 6, 30, col); pent(256, 250, 30, col2 || col); };
  const seams = (a) => { x.strokeStyle = `rgba(0,0,0,${a})`; x.lineWidth = 3 * k; for (let i = 0; i < 12; i++) { x.beginPath(); x.moveTo(i * 43 * k, 0); x.lineTo((i * 43 + 30) * k, H); x.stroke(); } };
  if (skin === 'retro') {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#a5642b'); g.addColorStop(.5, '#8a4b1f'); g.addColorStop(1, '#6d3814'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(40,18,4,.75)'; x.lineWidth = 2.5 * k; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(i * 64 * k, 0); x.bezierCurveTo((i * 64 + 30) * k, H * .3, (i * 64 - 30) * k, H * .7, i * 64 * k, H); x.stroke(); }
    for (let y = 1; y < 4; y++) { x.beginPath(); x.moveTo(0, H * y / 4); x.lineTo(W, H * y / 4); x.stroke(); }
    x.strokeStyle = '#f3ead8'; x.lineWidth = 3 * k; for (let i = 0; i < 6; i++) { const cx = (236 + i * 8) * k; x.beginPath(); x.moveTo(cx - 5 * k, 118 * k); x.lineTo(cx + 5 * k, 138 * k); x.moveTo(cx + 5 * k, 118 * k); x.lineTo(cx - 5 * k, 138 * k); x.stroke(); }
  } else if (skin === 'gold') {
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#fff1b8'); g.addColorStop(.3, '#f2c94c'); g.addColorStop(.6, '#c8901e'); g.addColorStop(1, '#f7d26a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    panels('#7a5208'); seams(.18);
  } else if (skin === 'night') {
    x.fillStyle = '#0b1430'; x.fillRect(0, 0, W, H);
    let r = 11; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,255,255,${.3 + rnd() * .7})`; x.fillRect(rnd() * W, rnd() * H, (1 + rnd() * 2) * k, (1 + rnd() * 2) * k); }
    panels('#2fd2ff', '#a46bff'); seams(.35);
  } else if (skin === 'fire') {
    x.fillStyle = '#f7f6f2'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) { const cx = i * 58 * k, g = x.createLinearGradient(0, H * .2, 0, H * .85); g.addColorStop(0, '#ffd23d'); g.addColorStop(.5, '#ff7a1a'); g.addColorStop(1, '#d92b1c'); x.fillStyle = g; x.beginPath(); x.moveTo(cx, H * .85); x.bezierCurveTo(cx + 10 * k, H * .55, cx + 34 * k, H * .5, cx + 18 * k, H * .18); x.bezierCurveTo(cx + 50 * k, H * .45, cx + 56 * k, H * .62, cx + 46 * k, H * .85); x.closePath(); x.fill(); }
    seams(.2);
  } else if (skin === 'tri') {
    x.fillStyle = '#f7f7f4'; x.fillRect(0, 0, W, H); panels('#1f4bd1', '#e5322d');
    x.fillStyle = '#1f4bd1'; x.fillRect(0, H * .47, W, H * .03); x.fillStyle = '#e5322d'; x.fillRect(0, H * .5, W, H * .03); seams(.2);
  } else { x.fillStyle = '#f7f7f4'; x.fillRect(0, 0, W, H); panels('#1d1d24'); seams(.25); }
  return c;
}
function g3BallSkin() {
  if (!G3.ball) return; const sk = typeof shopEq === 'function' ? shopEq('ball') : 'classic'; if (G3.ballSkin === sk) return; G3.ballSkin = sk;
  const m = G3.ball.material; if (m.map && m.map !== G3.ballTex) m.map.dispose();
  m.map = g3Tex(g3BallPaint(sk)); m.metalness = sk === 'gold' ? .65 : 0; m.roughness = sk === 'gold' ? .28 : sk === 'retro' ? .7 : .42; m.needsUpdate = true;
}

// ---------- halo sous ton joueur ----------
function g3Halo(ring, tm) {
  const hv = typeof shopEq === 'function' ? shopEq('halo') : '#f5c542', m = ring.material;
  if (hv === 'rainbow') { m.color.setHSL((tm * .18) % 1, .9, .6); ring.scale.setScalar(1); m.opacity = .9; }
  else if (hv === 'pulse') { const p = (tm * 1.3) % 1; m.color.set('#f5c542'); ring.scale.setScalar(1 + .45 * p); m.opacity = .95 * (1 - p) + .15; }
  else { m.color.set(hv); ring.scale.setScalar(1); m.opacity = .9; }
}

// ---------- effets de but : particules (une réserve lumineuse, une réserve « matière ») ----------
function g3SpriteTex(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  if (kind === 'glow') { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.2, 'rgba(255,255,255,.8)'); g.addColorStop(.5, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
  else if (kind === 'smoke') { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(.6, 'rgba(255,255,255,.3)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
  else { x.fillStyle = '#fff'; x.fillRect(14, 22, 36, 20); }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
function g3FxPool(sc, kind, N) {
  const geo = new THREE.BufferGeometry(), mk = (n, k) => { const a = new THREE.BufferAttribute(new Float32Array(n * k), k); a.setUsage(THREE.DynamicDrawUsage); return a; };
  geo.setAttribute('position', mk(N, 3)); geo.setAttribute('aColor', mk(N, 3)); geo.setAttribute('aSize', mk(N, 1)); geo.setAttribute('aAlpha', mk(N, 1)); geo.setDrawRange(0, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: g3SpriteTex(kind) }, uScale: { value: 400 } },
    vertexShader: 'attribute vec3 aColor; attribute float aSize; attribute float aAlpha; uniform float uScale; varying vec3 vC; varying float vA; void main(){ vC = aColor; vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = clamp(aSize * uScale / max(0.1, -mv.z), 1.0, 256.0); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform sampler2D map; varying vec3 vC; varying float vA; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC * t.rgb, t.a * vA); if (gl_FragColor.a < 0.01) discard; }',
    transparent: true, depthWrite: false, blending: kind === 'glow' ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = kind === 'glow' ? 6 : 5; sc.add(pts);
  return { pts, geo, N, list: [] };
}
function g3Fx(sc) { if (!sc.userData.fx) sc.userData.fx = { glow: g3FxPool(sc, 'glow', 1600), conf: g3FxPool(sc, 'conf', 700), smoke: g3FxPool(sc, 'smoke', 160), em: [] }; return sc.userData.fx; }
const g3Rgb = c => { const t = g3Col(c); return [t.r, t.g, t.b]; };
function g3FxAdd(F, pool, p) { const L = F[pool].list; if (L.length < F[pool].N) L.push(Object.assign({ l: 0, drag: 1, g: 0, s1: null, a: 1, fl: 0, tw: 0 }, p)); }
// le spectacle : derrière le buteur, dans l'axe de la caméra, pour qu'il soit dans le cadre du gros plan
function g3FxGoal(sc, cam, type, x, z, cols) {
  if (!sc || !type || type === 'none') return; const F = g3Fx(sc), R = Math.random;
  const dx = x - cam.position.x, dz = z - cam.position.z, dl = Math.hypot(dx, dz) || 1, fx = dx / dl, fz = dz / dl, sx = -fz, sz = fx;
  const club = (cols || ['#ffd23d', '#ffffff']).map(g3Rgb);
  if (type === 'confetti') {
    const pal = [[1, .82, .25], [1, .95, .7], [1, 1, 1], club[0]];
    for (const off of [-3.2, -1.2, 1.2, 3.2]) for (let i = 0; i < 80; i++) { const c = pal[Math.floor(R() * pal.length)]; g3FxAdd(F, 'conf', { x: x + fx * 2.5 + sx * off, y: .3, z: z + fz * 2.5 + sz * off, vx: (R() - .5) * 3 - sx * off * .4, vy: 8 + R() * 6, vz: (R() - .5) * 3 - sz * off * .4, m: 4 + R() * 2.5, s: .14 + R() * .12, c, drag: .9, g: -4.5, fl: 1 + R() * 2, ph: R() * 6 }); }
  } else if (type === 'stars') {
    for (let i = 0; i < 260; i++) { const r = R() * 7, a = R() * 6.28; g3FxAdd(F, 'glow', { x: x + fx * 3 + Math.cos(a) * r, y: 7 + R() * 9, z: z + fz * 3 + Math.sin(a) * r, vx: 0, vy: -1.4 - R() * 2, vz: 0, m: 3.5 + R() * 2, s: .3 + R() * .35, c: R() < .7 ? [1, .85, .35] : [1, 1, 1], tw: 8 + R() * 8, ph: R() * 6 }); }
    for (let i = 0; i < 90; i++) { const a = R() * 6.28, v = 3 + R() * 5; g3FxAdd(F, 'glow', { x, y: .4, z, vx: Math.cos(a) * v, vy: 2 + R() * 4, vz: Math.sin(a) * v, m: .9 + R() * .6, s: .25, c: [1, .9, .5], drag: .92, g: -6 }); }
  } else if (type === 'smoke') {
    for (let k = -2; k <= 2; k++) F.em.push({ kind: 'smoke', x: x + fx * (14 + R() * 6) + sx * k * 5, y: 1, z: z + fz * (14 + R() * 6) + sz * k * 5, until: 4.5, l: 0, acc: 0, c: club[(k + 2) % 2] });
  } else if (type === 'fireworks') {
    F.em.push({ kind: 'fw', x: x + fx * 26, y: 0, z: z + fz * 26, sx, sz, until: 4.2, l: 0, acc: .6 });
  }
}
function g3FxBurst(F, x, y, z) {
  const R = Math.random, pal = [[1, .35, .3], [1, .85, .3], [.4, .8, 1], [.6, 1, .5], [1, .5, .9], [1, 1, 1]], c = pal[Math.floor(R() * pal.length)], c2 = R() < .4 ? pal[Math.floor(R() * pal.length)] : c;
  g3FxAdd(F, 'glow', { x, y, z, vx: 0, vy: 0, vz: 0, m: .35, s: 9, s1: 2, c: [1, .95, .85] });
  for (let i = 0; i < 110; i++) { const u = R() * 2 - 1, a = R() * 6.28, r = Math.sqrt(1 - u * u), v = 9 + R() * 3; g3FxAdd(F, 'glow', { x, y, z, vx: Math.cos(a) * r * v, vy: u * v, vz: Math.sin(a) * r * v, m: 1.4 + R() * .8, s: .55, s1: .2, c: i % 2 ? c : c2, drag: .955, g: -4, tw: R() < .3 ? 14 : 0, ph: R() * 6 }); }
}
function g3FxUpdate(sc, cam, dt, hpx) {
  const F = sc && sc.userData.fx; if (!F) return; dt = Math.min(dt, .05); const R = Math.random;
  // émetteurs (fumigènes, fusées)
  F.em = F.em.filter(e => (e.l += dt) < e.until);
  for (const e of F.em) {
    if (e.kind === 'smoke') { e.acc += dt * 14; while (e.acc > 1) { e.acc--; g3FxAdd(F, 'smoke', { x: e.x + (R() - .5), y: e.y, z: e.z + (R() - .5), vx: (R() - .5) * .8, vy: 1.6 + R() * 1.4, vz: (R() - .5) * .8, m: 3.5 + R() * 1.5, s: 1.2, s1: 6 + R() * 3, a: .55, c: e.c.map(v => Math.min(1, v * .9 + .1)), drag: .985 }); g3FxAdd(F, 'glow', { x: e.x, y: e.y + .3, z: e.z, vx: (R() - .5) * 2, vy: 3 + R() * 3, vz: (R() - .5) * 2, m: .5, s: .25, c: [1, .6, .3], g: -4 }); } }
    else if (e.kind === 'fw') { e.acc += dt; if (e.acc > .42) { e.acc = 0; const lat = (R() - .5) * 30, h = 16 + R() * 12; g3FxBurst(F, e.x + e.sx * lat, h, e.z + e.sz * lat); } }
  }
  for (const k of ['glow', 'conf', 'smoke']) {
    const Pq = F[k], A = Pq.geo.attributes, pos = A.position.array, col = A.aColor.array, siz = A.aSize.array, al = A.aAlpha.array;
    Pq.list = Pq.list.filter(p => (p.l += dt) < p.m); let i = 0;
    for (const p of Pq.list) {
      const d = Math.pow(p.drag, dt * 60); p.vx *= d; p.vy *= d; p.vz *= d; p.vy += p.g * dt;
      p.x += p.vx * dt + (p.fl ? Math.sin(p.l * 7 + p.ph) * p.fl * dt : 0); p.y += p.vy * dt; p.z += p.vz * dt + (p.fl ? Math.cos(p.l * 6 + p.ph) * p.fl * dt : 0);
      if (p.y < .02 && k === 'conf') { p.y = .02; p.vy = 0; p.vx *= .5; p.vz *= .5; }
      const q = p.l / p.m, fade = q < .1 ? q / .1 : q > .65 ? 1 - (q - .65) / .35 : 1;
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; col[i * 3] = p.c[0]; col[i * 3 + 1] = p.c[1]; col[i * 3 + 2] = p.c[2];
      siz[i] = p.s1 != null ? p.s + (p.s1 - p.s) * q : p.s * (k === 'conf' ? .6 + .4 * Math.abs(Math.sin(p.l * 9 + p.ph)) : 1);
      al[i] = p.a * fade * (p.tw ? .55 + .45 * Math.sin(p.l * p.tw + p.ph) : 1); i++;
    }
    Pq.geo.setDrawRange(0, i); for (const n of ['position', 'aColor', 'aSize', 'aAlpha']) A[n].needsUpdate = true;
    Pq.pts.material.uniforms.uScale.value = (hpx || 600) / (2 * Math.tan((cam.fov || 30) * Math.PI / 360));
  }
}

// ---------- vitrine de la Boutique : ton joueur, ses crampons, son ballon, sa célébration ----------
const G3PV = { r: null, cv: null, sc: null, cam: null, P: null, ball: null, ring: null, raf: 0, t0: 0, last: 0, tab: '', x: 0, ph: 0, fxDone: false, skin: '', kit: '' };
function g3PreviewOk() { try { return typeof THREE !== 'undefined' && g3Avail(); } catch (e) { return false; } }
function g3Preview(cv, tab) {
  if (!g3PreviewOk()) return;
  if (G3PV.cv !== cv) { g3PreviewStop(); if (!g3PvBuild(cv)) return; }
  if (G3PV.tab !== tab) { G3PV.tab = tab; g3PreviewReplay(); }
  g3PvKit();
  if (!G3PV.raf) { G3PV.last = performance.now(); G3PV.raf = requestAnimationFrame(g3PvFrame); }
}
function g3PreviewReplay() { G3PV.t0 = performance.now(); G3PV.x = G3PV.tab === 'celeb' || G3PV.tab === 'fx' ? -5 : 0; G3PV.fxDone = false; G3PV.snap = true; }
function g3PreviewStop() {
  if (G3PV.raf) cancelAnimationFrame(G3PV.raf); G3PV.raf = 0;
  if (G3PV.r) { try { G3PV.sc.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material) { const ms = Array.isArray(n.material) ? n.material : [n.material]; ms.forEach(m => { if (m.map) m.map.dispose(); if (m.uniforms && m.uniforms.map && m.uniforms.map.value) m.uniforms.map.value.dispose(); m.dispose(); }); } }); G3PV.r.dispose(); G3PV.r.forceContextLoss(); } catch (e) { } }
  Object.assign(G3PV, { r: null, cv: null, sc: null, P: null, ball: null, ring: null, tab: '', skin: '', kit: '' });
}
function g3PvBuild(cv) {
  try {
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.1; r.setClearColor(0x000000, 0);
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, .1, 200);
    sc.add(new THREE.HemisphereLight(0xd8e8ff, 0x2a4a2e, .75));
    const key = new THREE.DirectionalLight(0xfff0dc, 1.6); key.position.set(4, 7, 5); sc.add(key);
    const rim = new THREE.DirectionalLight(0xffc870, .9); rim.position.set(-5, 4, -6); sc.add(rim);
    // pelouse ronde éclairée par un projecteur
    const [gc, gx] = g3Canvas(256, 256), gg = gx.createRadialGradient(128, 128, 10, 128, 128, 128); gg.addColorStop(0, '#2f7a3f'); gg.addColorStop(.55, '#1d5a2c'); gg.addColorStop(1, 'rgba(10,30,16,0)'); gx.fillStyle = gg; gx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 8; i++) { gx.fillStyle = i % 2 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.03)'; gx.fillRect(i * 32, 0, 32, 256); }
    const gt = new THREE.CanvasTexture(gc); gt.encoding = THREE.sRGBEncoding;
    const ground = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48), new THREE.MeshBasicMaterial({ map: gt, transparent: true, depthWrite: false })); ground.rotation.x = -Math.PI / 2; sc.add(ground);
    const P = g3Parts(sc, 1); P.num = { setMatrixAt() { } }; for (const k of Object.keys(P)) if (P[k].castShadow != null) P[k].castShadow = false;
    if (typeof g3SkLoad === 'function') g3SkLoad();
    const ring = new THREE.Mesh(new THREE.RingGeometry(.55, .72, 40), new THREE.MeshBasicMaterial({ color: 0xf5c542, transparent: true, opacity: .9, depthWrite: false, toneMapped: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .01; ring.renderOrder = 2; sc.add(ring);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.11, 26, 18), new THREE.MeshStandardMaterial({ roughness: .42, metalness: 0 })); sc.add(ball);
    Object.assign(G3PV, { r, cv, sc, cam, P, ring, ball, skin: '', kit: '' }); g3Tmp(); g3PreviewReplay();
    return true;
  } catch (e) { return false; }
}
// le vrai modèle 3D (dès qu'il est chargé) remplace le corps en pièces
function g3PvSk() {
  const V = G3PV, P = V.P; if (!P || P.sk || typeof G3SK === 'undefined' || G3SK.fail) return;
  const skm = G3SK.standIn ? (G3SK.model || (G3SK.model = g3SkStandIn())) : G3SK.model; if (!skm) return;
  try { P.sk = g3SkMesh(V.sc, 1, skm); P.sk.meshes.forEach(m => { m.castShadow = false; }); if (skm.rig) G3RIG = Object.assign({}, G3RIG_DEF, skm.rig);
    for (const k of ['torso', 'shorts', 'head', 'hair', 'uarm', 'ubare', 'farm', 'hand', 'thigh', 'shin', 'boot']) P[k].visible = false; V.kit = ''; V.snap = true; } catch (e) { P.sk = null; }
}
function g3PvKit() {
  if (!G3PV.P) return; const P = G3PV.P, kc = typeof kitColors === 'function' && typeof S !== 'undefined' && S && S.club ? kitColors(S.club.n) : { col: '#1f3a8a', col2: '#ffffff' };
  const key = JSON.stringify([kc.col, kc.col2, shopEq('boots')]); if (G3PV.kit === key) return; G3PV.kit = key;
  const skin = g3Lin(typeof SKIN !== 'undefined' && S && S.p ? SKIN[hashN(pName()) % SKIN.length] : '#c48a60'), shirt = g3Lin(kc.col), shorts = g3Lin(kc.col2 || '#ffffff'), boots = g3Lin(shopEq('boots')), hair = new THREE.Color(0x1b1410);
  P.torso.setColorAt(0, shirt); P.shorts.setColorAt(0, shorts); P.head.setColorAt(0, skin); P.hair.setColorAt(0, hair);
  for (const k of [0, 1]) { P.uarm.setColorAt(k, shirt); P.ubare.setColorAt(k, skin); P.farm.setColorAt(k, skin); P.hand.setColorAt(k, skin); P.thigh.setColorAt(k, skin); P.shin.setColorAt(k, shirt); P.boot.setColorAt(k, boots); }
  for (const k of Object.keys(P)) if (P[k].instanceColor) P[k].instanceColor.needsUpdate = true;
  if (P.sk) g3SkColors(P.sk, 0, { shirt, shorts, socks: shirt, skin, hair, boots });
}
// ---------- jongles ----------
// Programme : pied droit, pied gauche… une cuisse toutes les 6 touches. Le ballon suit une parabole (g = 9,81) d'un point de
// contact au suivant ; chaque point de contact est mesuré sur le vrai pied (ou la vraie cuisse) du modèle au moment du toucher,
// et réutilisé la fois suivante : le ballon retombe pile sur le cou-de-pied.
const JG_G = 9.81, JG_YAW = -.5;
function g3PvJgPlan(i) { const th = i % 6 === 5, side = th ? 1 : i % 2; return { side, thigh: th, T: th ? .82 : (i % 6 === 4 ? .7 : .6) }; }
function g3PvJuggle(V, t, dt, tm) {
  let J = V.jg; const cy = Math.cos(JG_YAW), sy = Math.sin(JG_YAW);
  if (!J || V.snap || t < J.t0) {
    // départ : le ballon lâché des mains tombe sur le pied droit
    J = V.jg = { t0: t, i: 0, cache: {}, tc: t + .55, tp: t, from: [cy * .25, 1.05, sy * .25], plan: g3PvJgPlan(0), spin: 0 };
    // mesure à l'avance des trois points de contact (pied gauche, pied droit, cuisse droite), pose figée hors écran
    if (V.P) for (const pl of [{ side: 0, thigh: false }, { side: 1, thigh: false }, { side: 1, thigh: true }]) {
      g3Pose(V.P, 0, { x: 0, z: 0, yaw: JG_YAW, v: 0, ph: 0, act: 19, at: .5, aa: 0, jug: { side: pl.side, k: 1, thigh: pl.thigh }, tm, gdt: 0, snap: true, key: 'pvm', idle: 0 });
      J.cache[(pl.thigh ? 't' : 'f') + pl.side] = g3PvJgMeasure(V.P, pl);
    }
    J.to = J.cache['f' + J.plan.side] || g3PvJgEst(J.plan); J.T = J.tc - J.tp;
  }
  // levée de la jambe : monte ~0,3 s avant le contact, culmine juste après (le pied frappe en montant), redescend
  const pl = J.plan, u = t - J.tc, rise = pl.thigh ? .34 : .3, k = u < 0 ? Math.max(0, 1 - Math.pow(-u / rise, 2)) : Math.max(0, 1 - Math.pow(u / .24, 2));
  const kk = u < 0 ? k * k * (3 - 2 * k) : k;
  return { x: 0, z: 0, yaw: JG_YAW, v: 0, ph: 0, act: 19, at: .5, aa: 0, jug: { side: pl.side, k: kk, thigh: pl.thigh }, tm, gdt: dt, snap: V.snap, key: 'pv', idle: 0 };
}
// point de contact estimé (avant la première mesure)
function g3PvJgEst(pl) { const cy = Math.cos(JG_YAW), sy = Math.sin(JG_YAW), lat = pl.side ? .12 : -.12, f = pl.thigh ? .22 : .3, y = pl.thigh ? .7 : .34; return [cy * f - sy * lat, y, sy * f + cy * lat]; }
// point de contact réel : cou-de-pied (devant la cheville) ou dessus de la cuisse, + rayon du ballon
function g3PvJgMeasure(P, pl) {
  const m = _m.jm || (_m.jm = new THREE.Matrix4()), cy = Math.cos(JG_YAW), sy = Math.sin(JG_YAW);
  if (pl.thigh) { P.shin.getMatrixAt(pl.side, m); const e = m.elements; return [e[12] - cy * .12, e[13] + .17, e[14] - sy * .12]; } // genou → milieu de la cuisse
  P.boot.getMatrixAt(pl.side, m); const e = m.elements; return [e[12] + cy * .1, e[13] + .1, e[14] + sy * .1];
}
function g3PvJuggleBall(V, P, t, dt) {
  const J = V.jg; if (!J) return;
  // contact : on mesure le pied, on corrige la fin de la trajectoire si besoin, on lance la suivante
  if (t >= J.tc) {
    const key = (J.plan.thigh ? 't' : 'f') + J.plan.side, hit = g3PvJgMeasure(P, J.plan); J.cache[key] = hit;
    J.from = hit; J.tp = J.tc; J.i++; J.plan = g3PvJgPlan(J.i); J.T = J.plan.T; J.tc = J.tp + J.T;
    J.to = J.cache[(J.plan.thigh ? 't' : 'f') + J.plan.side] || g3PvJgEst(J.plan);
    J.spin = J.plan.thigh ? 4 : 9;
    if (typeof sfxG === 'function' && V.cv && V.cv.isConnected && document.visibilityState === 'visible' && J.i > 1) { try { sfxG('kick', .12); } catch (e) { } }
  }
  // parabole de « from » à « to » en T secondes
  const tau = clamp(t - J.tp, 0, J.T), T = J.T, f = J.from, g2 = J.to, w = tau / T;
  const y = f[1] + (g2[1] - f[1]) * w + JG_G * tau * (T - tau) / 2;
  V.ball.position.set(f[0] + (g2[0] - f[0]) * w, y, f[2] + (g2[2] - f[2]) * w);
  // effet rétro (le ballon tourne vers le joueur), axe = côté du joueur
  const ax = _m.jax || (_m.jax = new THREE.Vector3()), q = _m.jq || (_m.jq = new THREE.Quaternion()); ax.set(-Math.sin(JG_YAW), 0, Math.cos(JG_YAW)); q.setFromAxisAngle(ax, -J.spin * dt); V.ball.quaternion.premultiply(q);
}
function g3PvFrame(now) {
  const V = G3PV; if (!V.r || !V.cv || !V.cv.isConnected) { g3PreviewStop(); return; }
  V.raf = requestAnimationFrame(g3PvFrame);
  const dt = Math.min(.05, (now - V.last) / 1000); V.last = now; const t = V.freeze != null ? V.freeze : (now - V.t0) / 1000, tm = now / 1000; if (V.freeze != null) V.snap = true;
  const w = V.cv.clientWidth || 300, h = V.cv.clientHeight || 300; if (V.w !== w || V.h !== h) { V.w = w; V.h = h; V.r.setSize(w, h, false); V.cam.aspect = w / h; V.cam.updateProjectionMatrix(); }
  g3PvSk(); g3PvKit();
  // ballon équipé
  const sk = shopEq('ball'); if (V.skin !== sk) { V.skin = sk; const m = V.ball.material; if (m.map) m.map.dispose(); m.map = g3Tex(g3BallPaint(sk)); m.metalness = sk === 'gold' ? .65 : 0; m.roughness = sk === 'gold' ? .28 : sk === 'retro' ? .7 : .42; m.needsUpdate = true; }
  const cel = V.tab === 'celeb' || V.tab === 'fx', P = V.P;
  let st;
  if (cel) {
    // il arrive en courant, marque son but… et célèbre face à toi
    const L = 9, tt = t % L; if (tt < (V.ptt || 0)) { V.fxDone = false; V.snap = true; } V.ptt = tt;
    // course calculée (indépendante de la fluidité) : 4,6 m/s puis freinage
    const ta = Math.min(tt, .9), tb = clamp(tt - .9, 0, 4.6 / 14), dist = 4.6 * ta + 4.6 * tb - 7 * tb * tb, v = tt < .9 ? 4.6 : Math.max(0, 4.6 - (tt - .9) * 14);
    V.x = -5 + dist; V.ph = dist * Math.PI * 2 / 2.6;
    const face = Math.atan2(V.cam.position.z - 0, V.cam.position.x - V.x), yaw = tt < .9 ? 0 : face * ease((tt - .9) / .5);
    st = { x: V.x, z: 0, yaw, v, ph: V.ph, act: 8, at: tt - .2, aa: 0, tm, cel: shopEq('celeb'), gdt: dt, snap: V.snap, key: 'pv' };
    if (V.tab === 'fx' && !V.fxDone && tt > 1.1) { V.fxDone = true; g3FxGoal(V.sc, V.cam, shopEq('fx') === 'none' ? 'confetti' : shopEq('fx'), V.x, 0, typeof kitColors === 'function' && typeof S !== 'undefined' && S && S.club ? (k => [k.col, k.col2])(kitColors(S.club.n)) : null); }
  } else {
    // jongles : vrai ballon (gravité), touché par le pied qui monte à sa rencontre — droit, gauche… et la cuisse de temps en temps
    st = g3PvJuggle(V, t, dt, tm);
  }
  if (!cel) g3PvJuggleBall(V, P, t, dt);
  V.snap = false; V.ball.visible = !cel;
  // la caméra tourne doucement autour de lui
  const ang = cel ? .62 : .35 + Math.sin(tm * .25) * .45, R0 = cel ? 6.2 : 5, cx = cel ? V.x * .35 : 0;
  V.cam.position.set(cx + Math.cos(ang) * R0, cel ? 1.6 : 1.4, Math.sin(ang) * R0); V.cam.lookAt(cx, cel ? 1 : .92, 0);
  g3Pose(P, 0, st);
  for (const k of ['torso', 'shorts', 'head', 'hair', 'uarm', 'ubare', 'farm', 'hand', 'thigh', 'shin', 'boot']) P[k].instanceMatrix.needsUpdate = true;
  if (P.sk) g3SkFlush(P.sk);
  V.ring.position.set(st.x, .01, st.z); g3Halo(V.ring, tm);
  g3FxUpdate(V.sc, V.cam, dt, h * V.r.getPixelRatio());
  V.r.render(V.sc, V.cam);
}
