// ===================== GRANDES SOIRÉES EN 3D =====================
// Trois moments de carrière en plein écran, construits en code avec le vrai modèle du joueur :
//  - « pres »  : présentation au nouveau club — l'écharpe au-dessus de la tête, devant son public (flashs, feux d'artifice) ;
//  - « titre » : le trophée soulevé avec les coéquipiers, pluie de confettis aux couleurs du club ;
//  - « bdo »   : la cérémonie du Ballon d'Or — scène, projecteurs, mur d'écrans, le ballon doré dans les mains.
// Elles passent juste avant la fenêtre d'événement correspondante (flow, ui3.js). On touche l'écran pour passer.
const FQ = { q: [] };
const FETE = { on: false };
const feteRank = n => /Coupe du monde/.test(n) ? 7 : /Ligue des champions|Coupe des champions/.test(n) ? 6 : /Euro|Copa América|CAN|Gold Cup|Coupe d'Asie/.test(n) ? 5 : /Ligue Europa|Conference/.test(n) ? 3 : /Coupe|Cup|Pokal|Coppa|Copa del Rey|Taça|Beker/.test(n) ? 1 : 2;
function feteOk() {
  try { if (typeof document === 'undefined' || !document.body || typeof THREE === 'undefined' || typeof g3Avail !== 'function' || !g3Avail()) return false; } catch (e) { return false; }
  if (typeof OPTS !== 'undefined' && OPTS.fetes === false) return false;
  if (typeof navigator !== 'undefined' && navigator.webdriver && !window.__FETE) return false;
  return true;
}
// plusieurs trophées d'un coup (doublé, triplé) : une seule fête, pour le plus prestigieux
function feteQueue(f) {
  if (f.k === 'titre') {
    const o = FQ.q.find(x => x.k === 'titre');
    if (o) { o.list.push(f.name); if (feteRank(f.name) > feteRank(o.name)) Object.assign(o, { name: f.name, club: f.club, season: f.season }); return; }
    f.list = [f.name];
  }
  FQ.q.push(f);
}
// ---------- outils de scène ----------
function feteSky(sc, night) {
  const top = night ? '#02040a' : '#3f78c4', hor = night ? '#16213a' : '#b9d4ee';
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { a: { value: g3Col(top) }, b: { value: g3Col(hor) } }, vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }', fragmentShader: 'uniform vec3 a; uniform vec3 b; varying vec3 vP; void main(){ float h = clamp(normalize(vP).y * 2.2, 0.0, 1.0); gl_FragColor = vec4(mix(b, a, h), 1.0); }' });
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(400, 24, 12), m));
}
// public instancié qui saute (même principe que les tribunes du match)
function feteCrowd(sc, spots, cols, U) {
  const body = g3Merge([new THREE.BoxGeometry(.42, .62, .28).translate(0, .31, 0), g3Tint(new THREE.BoxGeometry(.2, .22, .2).translate(0, .74, 0), 0xe0b090)]);
  const cA = body.attributes.color.array; for (let i = 0; i < body.attributes.position.count; i++) if (body.attributes.position.array[i * 3 + 1] < .63) { cA[i * 3] = cA[i * 3 + 1] = cA[i * 3 + 2] = 1; }
  const ph = new Float32Array(spots.length); body.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 1));
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  mat.onBeforeCompile = s => { s.uniforms.uT = U.uT; s.uniforms.uE = U.uE; s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute float aPh; uniform float uT; uniform float uE;').replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.y += max(0.0, sin(uT * (6.0 + aPh * 3.0) + aPh * 40.0)) * uE * 0.34;'); };
  const im = new THREE.InstancedMesh(body, mat, spots.length); im.frustumCulled = false;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  spots.forEach(([x, y, z, ry, c, r], i) => { q.setFromAxisAngle(Y, ry); const s = .9 + r * .25; one.set(s, s, s); m4.compose(v.set(x, y, z), q, one); im.setMatrixAt(i, m4); im.setColorAt(i, c); ph[i] = r; });
  sc.add(im); return im;
}
// flashs d'appareils photo (points qui clignotent au hasard)
function feteFlashes(sc, pts, U) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(pts.length * 3), sd = new Float32Array(pts.length);
  pts.forEach((p, i) => { pos.set(p, i * 3); sd[i] = Math.random() * 100; });
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('sd', new THREE.BufferAttribute(sd, 1));
  const m = new THREE.ShaderMaterial({ uniforms: { uT: U.uT, uK: U.uK }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float sd; uniform float uT; uniform float uK; varying float vA; void main(){ float f = fract(uT * (0.35 + fract(sd) * 0.6) + sd); vA = smoothstep(0.985 - uK * 0.02, 1.0, f) * 1.6; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(900.0 / max(1.0, -mv.z), 36.0) * vA; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(d)); gl_FragColor = vec4(1.0, 0.97, 0.9, a * vA); if (gl_FragColor.a < 0.01) discard; }' });
  const o = new THREE.Points(g, m); o.frustumCulled = false; o.renderOrder = 7; sc.add(o);
}
// stade de nuit aux couleurs du club : pelouse, quatre tribunes pleines, projecteurs
function feteStade(sc, cols, night, U) {
  feteSky(sc, night);
  const [pc, px] = g3Canvas(512, 512); for (let i = 0; i < 16; i++) { px.fillStyle = i % 2 ? '#2f7a35' : '#3a8a40'; px.fillRect(i * 32, 0, 32, 512); }
  px.globalAlpha = .06; for (let i = 0; i < 6000; i++) { px.fillStyle = Math.random() < .5 ? '#000' : '#fff'; px.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); } px.globalAlpha = 1;
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(100, 70), new THREE.MeshStandardMaterial({ map: g3Tex(pc, [2, 1]), roughness: .92 })); grass.rotation.x = -Math.PI / 2; sc.add(grass);
  const lineM = new THREE.MeshBasicMaterial({ color: 0xdfe8e0 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(9.06, 9.2, 96), lineM); ring.rotation.x = -Math.PI / 2; ring.position.y = .012; sc.add(ring);
  const mid = new THREE.Mesh(new THREE.PlaneGeometry(.13, 68), lineM); mid.rotation.x = -Math.PI / 2; mid.position.y = .012; sc.add(mid);
  const dot = new THREE.Mesh(new THREE.CircleGeometry(.22, 16), lineM); dot.rotation.x = -Math.PI / 2; dot.position.y = .013; sc.add(dot);
  // tribunes : [x, z, rotY, longueur] ; le devant est à 36 m du centre en largeur, 50 m en longueur
  const wallM = new THREE.MeshLambertMaterial({ color: night ? 0x1d2129 : 0x5b6068 }), seatM = new THREE.MeshLambertMaterial({ color: new THREE.Color(cols[0]).multiplyScalar(.35) });
  const spots = [], flash = [], C1 = cols[0], C2 = cols[1];
  for (const [x, z, ry, len] of [[0, -36, 0, 100], [0, 36, Math.PI, 100], [-50, 0, Math.PI / 2, 72], [50, 0, -Math.PI / 2, 72]]) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; sc.add(g);
    const dep = 22, h0 = 1.2, h1 = 15, sl = new THREE.PlaneGeometry(len, Math.hypot(dep, h1 - h0)); sl.rotateX(-Math.PI / 2 + Math.atan2(h1 - h0, dep)); sl.translate(0, (h0 + h1) / 2, -dep / 2);
    g.add(new THREE.Mesh(sl, seatM));
    const front = new THREE.Mesh(new THREE.BoxGeometry(len, h0 + .3, .3), wallM); front.position.set(0, (h0 + .3) / 2, .15); g.add(front);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(len + 2, .6, dep * .75), new THREE.MeshLambertMaterial({ color: 0x15181d })); roof.position.set(0, h1 + 6, -dep * .62); g.add(roof);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(len * .92, .3, .3), new THREE.MeshBasicMaterial({ color: 0xfff4d6 })); strip.position.set(0, h1 + 5.6, -dep * .25); g.add(strip);
    const rows = 22, per = Math.round(len / 1.05);
    for (let r = 0; r < rows; r++) for (let c = 0; c < per; c++) {
      if (Math.random() < .28) continue;
      const lx = -len / 2 + (c + .5) * len / per + (Math.random() - .5) * .3, ld = (r + .5) * dep / rows, ly = h0 + (h1 - h0) * ld / dep;
      const wx = x + Math.cos(ry) * lx - Math.sin(ry) * ld, wz = z - Math.sin(ry) * lx - Math.cos(ry) * ld, u = Math.random();
      spots.push([wx, ly, wz, ry + Math.PI, u < .55 ? C1 : u < .85 ? C2 : new THREE.Color().setHSL(Math.random(), .2, .3 + Math.random() * .4), Math.random()]);
      if (Math.random() < .05) flash.push([wx, ly + 1.1, wz]);
    }
  }
  const cap = typeof g3Low === 'function' && g3Low() ? 2600 : 5200; if (spots.length > cap) spots.length = cap;
  feteCrowd(sc, spots, cols, U); feteFlashes(sc, flash, U);
  // projecteurs (halos) dans les coins et sous les toits
  for (const [x, z] of [[-46, -33], [46, -33], [-46, 33], [46, 33]]) g3Glow(sc, x, 27, z, 30);
  sc.add(new THREE.HemisphereLight(night ? 0x9fb3e8 : 0xcfe3ff, 0x22341f, night ? .55 : .7));
  const key = new THREE.DirectionalLight(0xfff4e6, night ? 1.3 : 1.6); key.position.set(6, 22, 14); sc.add(key);
  const rim = new THREE.DirectionalLight(0xffc870, .8); rim.position.set(-8, 10, -12); sc.add(rim);
  sc.fog = new THREE.Fog(night ? 0x0b1220 : 0xb9d4ee, 90, 260);
}
// trophée doré (coupe tournée, anses ; « grandes oreilles » pour la Ligue des champions)
function feteCup(name) {
  const g = new THREE.Group(), gold = new THREE.MeshStandardMaterial({ color: 0xe0b043, metalness: .75, roughness: .26, emissive: 0x3a2706 });
  if (/Coupe du monde/.test(name)) {
    const pts = [[0, 0], [.11, 0], [.11, .05], [.07, .07], [.05, .16], [.075, .26], [.06, .33], [0, .36]].map(([x, y]) => new THREE.Vector2(x, y));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 28), gold)); const gl = new THREE.Mesh(new THREE.SphereGeometry(.075, 20, 14), gold); gl.position.y = .38; g.add(gl);
    const band = new THREE.Mesh(new THREE.TorusGeometry(.105, .012, 8, 28), new THREE.MeshStandardMaterial({ color: 0x1f6b3a, roughness: .5 })); band.rotation.x = Math.PI / 2; band.position.y = .03; g.add(band);
    return g;
  }
  const pts = [[0, 0], [.1, 0], [.1, .03], [.06, .05], [.03, .1], [.025, .18], [.05, .2], [.12, .26], [.15, .34], [.15, .40], [.14, .41], [.11, .33], [0, .3]].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 32), gold));
  const big = /Ligue des champions|Coupe des champions/.test(name);
  for (const sd of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(big ? .09 : .055, .012, 8, 20, Math.PI * 1.25), gold); h.position.set(sd * (big ? .19 : .16), .31, 0); h.rotation.z = sd > 0 ? -Math.PI * .62 : Math.PI * .38; g.add(h); }
  return g;
}
// Ballon d'Or : ballon doré sur un petit socle
// ---------- trophées en vrai modèle 3D (assets/trophees, préparés par tools/trophee3d.py) ----------
// Ballon d'Or : modèle « BALLON D'OR » de tahahosseini (Sketchfab, CC-BY 4.0). Le trophée dessiné en code sert en attendant.
const TROPH = { model: null, loading: null, fail: false };
function trophLoad() {
  if (TROPH.model || TROPH.loading || TROPH.fail) return TROPH.loading;
  if (typeof TROPHEES_3D === 'undefined' || !TROPHEES_3D || !TROPHEES_3D.items || typeof fetch !== 'function') { TROPH.fail = true; return null; }
  const J = TROPHEES_3D, q = typeof MEDIA_H !== 'undefined' && MEDIA_H.troph ? '?h=' + MEDIA_H.troph : '';
  TROPH.loading = fetch('assets/trophees/' + J.bin + q).then(r => { if (!r.ok) throw new Error('trophées'); return r.arrayBuffer(); }).then(buf => {
    const out = {};
    for (const [k, it] of Object.entries(J.items)) {
      const parts = it.parts.map(p => {
        const A = p.arr, P = new Int16Array(buf, A.pos[0], A.pos[1]), F32 = new Float32Array(P.length);
        for (let i = 0; i < P.length; i++) F32[i] = P[i] * it.qs + (i % 3 === 1 ? it.oy : 0);
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(F32, 3));
        g.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(buf, A.nor[0], A.nor[1]), 3, true));
        g.setIndex(new THREE.BufferAttribute(new Uint16Array(buf, A.idx[0], A.idx[1]), 1)); g.computeBoundingBox(); g.computeBoundingSphere();
        return { mat: p.mat, col: p.col, rough: p.rough, metal: p.metal, geo: g };
      });
      // hauteur du centre de la boule dorée (le plus gros morceau doré) : c'est là que les mains la tiennent
      const gold = parts.filter(p => /gold/i.test(p.mat)).sort((a, b) => b.geo.boundingSphere.radius - a.geo.boundingSphere.radius)[0];
      out[k] = { parts, ballY: gold ? gold.geo.boundingSphere.center.y : .66, ballR: gold ? gold.geo.boundingSphere.radius : .3 };
    }
    TROPH.model = out; return out;
  }).catch(() => { TROPH.fail = true; return null; });
  return TROPH.loading;
}
// reflets dorés : petite carte d'environnement (salle sombre, projecteurs chauds), préfiltrée pour les matériaux métalliques
function trophEnv(r) {
  const [c, x] = g3Canvas(256, 128), gr = x.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#2a2018'); gr.addColorStop(.45, '#5a4632'); gr.addColorStop(.55, '#140f0a'); gr.addColorStop(1, '#050403');
  x.fillStyle = gr; x.fillRect(0, 0, 256, 128);
  for (const [px, py, rr, a] of [[40, 30, 26, .95], [128, 18, 34, 1], [205, 34, 22, .85], [90, 70, 14, .5], [170, 64, 16, .55]]) { const g2 = x.createRadialGradient(px, py, 0, px, py, rr); g2.addColorStop(0, `rgba(255,246,220,${a})`); g2.addColorStop(1, 'rgba(255,230,180,0)'); x.fillStyle = g2; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
  const tex = new THREE.CanvasTexture(c); tex.mapping = THREE.EquirectangularReflectionMapping; tex.encoding = THREE.sRGBEncoding;
  try { const pm = new THREE.PMREMGenerator(r), rt = pm.fromEquirectangular(tex); pm.dispose(); tex.dispose(); return rt.texture; } catch (e) { return tex; }
}
// le trophée k, haut de h mètres, base à y = 0
function trophMesh(k, h, env) {
  const M = TROPH.model && TROPH.model[k]; if (!M) return null;
  const g = new THREE.Group(); g.scale.setScalar(h);
  for (const p of M.parts) {
    const text = /text/i.test(p.mat), silver = /silver/i.test(p.mat);
    const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(p.col[0], p.col[1], p.col[2]).multiplyScalar(text ? 1.15 : 1.25), metalness: p.metal == null ? 1 : p.metal, roughness: clamp(p.rough, silver ? .3 : .14, .8), envMap: env || null, envMapIntensity: silver ? 1 : 1.5, side: THREE.DoubleSide });
    if (!env) m.emissive = new THREE.Color(silver ? 0x111111 : 0x3a2606);
    g.add(new THREE.Mesh(p.geo, m));
  }
  g.userData.ballY = M.ballY * h; g.userData.ballR = M.ballR * h;
  return g;
}
function feteBallonOr() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(.11, 32, 22), new THREE.MeshStandardMaterial({ map: g3Tex(g3BallPaint('gold')), metalness: .7, roughness: .25, emissive: 0x2a1c04 })); b.position.y = .145; g.add(b);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.05, .065, .04, 24), new THREE.MeshStandardMaterial({ color: 0xc89a34, metalness: .8, roughness: .3 })); base.position.y = .02; g.add(base);
  return g;
}
// pluie de confettis (instances qui tombent en virevoltant)
function feteConfetti(sc, cols, n) {
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(.07, .04), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), n); im.frustumCulled = false;
  const pal = cols.concat([new THREE.Color(0xffd23d), new THREE.Color(0xffffff), new THREE.Color(0xffd23d)]), P = [];
  for (let i = 0; i < n; i++) { im.setColorAt(i, pal[i % pal.length]); P.push({ x: (Math.random() - .5) * 14, y: 4 + Math.random() * 14, z: (Math.random() - .5) * 10, v: .8 + Math.random() * .9, ph: Math.random() * 6.28, r: Math.random() * 6.28, w: 2 + Math.random() * 5 }); }
  sc.add(im); im.userData.P = P; im.count = 0; return im;
}
function feteConfettiStep(im, dt, t, on) {
  const P = im.userData.P, m4 = _m.cf || (_m.cf = new THREE.Matrix4()), e = _m.ce || (_m.ce = new THREE.Euler()), q = _m.cq || (_m.cq = new THREE.Quaternion()), v = _m.cv || (_m.cv = new THREE.Vector3()), one = _m.co || (_m.co = new THREE.Vector3(1, 1, 1));
  im.count = on ? P.length : 0; if (!on) return;
  for (let i = 0; i < P.length; i++) { const p = P[i]; p.y -= p.v * dt; p.x += Math.sin(t * 1.3 + p.ph) * .5 * dt; if (p.y < 0) { p.y = 10 + Math.random() * 6; } e.set(t * p.w + p.r, p.ph + t, t * p.w * .7); q.setFromEuler(e); m4.compose(v.set(p.x, p.y, p.z), q, one); im.setMatrixAt(i, m4); }
  im.instanceMatrix.needsUpdate = true;
}
// joueurs : corps du jeu, remplacé par le vrai modèle dès qu'il est chargé
function feteRig(parent, N) { const P = g3Parts(parent, N); P.num = { setMatrixAt() { } }; for (const k of Object.keys(P)) if (P[k] && P[k].castShadow != null) P[k].castShadow = false; P.N = N; P.parent = parent; return P; }
function feteSk(P) {
  if (P.sk || typeof G3SK === 'undefined' || G3SK.fail) return;
  const skm = G3SK.standIn ? (G3SK.model || (G3SK.model = g3SkStandIn())) : G3SK.model; if (!skm) { if (typeof g3SkLoad === 'function') g3SkLoad(); return; }
  try { P.sk = g3SkMesh(P.parent, P.N, skm); P.sk.meshes.forEach(m => { m.castShadow = false; }); if (skm.rig) G3RIG = Object.assign({}, G3RIG_DEF, skm.rig); for (const k of ['torso', 'shorts', 'head', 'hair', 'uarm', 'ubare', 'farm', 'hand', 'thigh', 'shin', 'boot']) P[k].visible = false; P.kitDone = false; } catch (e) { P.sk = null; }
}
function feteKit(P, kits) {
  kits.forEach((c, n) => {
    P.torso.setColorAt(n, c.shirt); P.shorts.setColorAt(n, c.shorts); P.head.setColorAt(n, c.skin); P.hair.setColorAt(n, c.hair);
    for (const k of [0, 1]) { const i = n * 2 + k; P.uarm.setColorAt(i, c.shirt); P.ubare.setColorAt(i, c.skin); P.farm.setColorAt(i, c.skin); P.hand.setColorAt(i, c.skin); P.thigh.setColorAt(i, c.skin); P.shin.setColorAt(i, c.socks); P.boot.setColorAt(i, c.boots); }
    if (P.sk) g3SkColors(P.sk, n, c);
  });
  for (const k of Object.keys(P)) if (P[k] && P[k].instanceColor) P[k].instanceColor.needsUpdate = true;
}
const feteHand = (P, n, k) => { const m = _m.fh || (_m.fh = new THREE.Matrix4()); P.hand.getMatrixAt(n * 2 + k, m); return new THREE.Vector3().setFromMatrixPosition(m); };
// ---------- la soirée elle-même ----------
function fetePlay(f, done) {
  if (FETE.on) return done && done();
  const low = typeof g3Low === 'function' && g3Low();
  const el = document.createElement('div'); el.id = 'fete'; el.setAttribute('aria-label', 'Grande soirée');
  const hasS = typeof S !== 'undefined' && S && S.p, me = hasS && typeof pName === 'function' ? pName() : 'Ton joueur', coach = hasS && typeof isCoach === 'function' && isCoach();
  const kick = f.k === 'pres' ? 'Présentation officielle' : f.k === 'bdo' ? 'Cérémonie · ' + f.yr : f.list && f.list.length > 1 ? (['', '', 'Doublé !', 'Triplé !', 'Quadruplé !'][f.list.length] || 'Razzia !') : 'Champion !';
  const big = f.k === 'pres' ? f.club : f.k === 'bdo' ? 'Ballon d\'Or' : f.name;
  const sub = f.k === 'pres' ? `${esc(me)} · n°${f.num}` : f.k === 'bdo' ? `${esc(me)}` : `${esc(f.club)} · ${esc(f.season || '')}`;
  const small = f.k === 'pres' ? (f.until ? `Sous contrat jusqu'en juin ${f.until}` : '') : f.k === 'bdo' ? `Meilleur joueur du monde ${f.yr}${f.club ? ' · ' + esc(f.club) : ''}` : f.list && f.list.length > 1 ? f.list.map(esc).join(' · ') : coach ? 'Ton équipe soulève le trophée' : 'Tu soulèves le trophée';
  el.innerHTML = `<canvas></canvas><div class="fete-txt"><div class="fete-kick">${esc(kick)}</div><h1 class="fete-big">${esc(big)}</h1><div class="fete-sub">${sub}</div>${small ? `<div class="fete-small">${small}</div>` : ''}</div><div class="fete-hint">Touche l'écran pour continuer</div><div class="fete-flash"></div>`;
  document.body.appendChild(el);
  const F = FETE; Object.assign(F, { on: true, el, done, f, t0: performance.now(), last: performance.now(), dur: f.k === 'pres' ? 9.5 : 10.5, ending: false, fx: {} });
  try {
    const cv = el.querySelector('canvas'), r = new THREE.WebGLRenderer({ canvas: cv, antialias: !low, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(low ? 1.25 : 2, window.devicePixelRatio || 1)); r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.12; r.setClearColor(0x000000, 1);
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(38, 1, .1, 600), U = { uT: { value: 0 }, uE: { value: f.k === 'bdo' ? .15 : 1 }, uK: { value: 1 } };
    Object.assign(F, { r, cv, sc, cam, U });
    g3Tmp();
    const kc = typeof kitColors === 'function' ? kitColors(f.club || '') : { col: '#1f3a8a', col2: '#ffffff' }, cols = [g3Lin(kc.col), g3Lin(kc.col2 || '#ffffff')];
    const skin = g3Lin(typeof SKIN !== 'undefined' && typeof hashN === 'function' ? SKIN[hashN(me) % SKIN.length] : '#c48a60'), hair = new THREE.Color(0x1b1410);
    const boots = g3Lin(typeof shopEq === 'function' ? shopEq('boots') : '#111111'), suit = new THREE.Color(0x0e0f12), shirtW = new THREE.Color(0xe8e8e8);
    const kitMe = (f.k === 'bdo' || coach) ? { shirt: suit, shorts: suit, socks: suit, skin, hair, boots: new THREE.Color(0x07080a) } : { shirt: cols[0], shorts: cols[1], socks: cols[0], skin, hair, boots };
    if (f.k === 'bdo') {
      // salle de cérémonie : scène, mur d'écrans doré, public en tenue de soirée, projecteurs qui balaient
      sc.background = new THREE.Color(0x020203); sc.fog = new THREE.Fog(0x020203, 18, 46);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshStandardMaterial({ color: 0x0b0c10, metalness: .3, roughness: .6 })); floor.rotation.x = -Math.PI / 2; sc.add(floor);
      const stage = new THREE.Mesh(new THREE.BoxGeometry(12, .45, 6), new THREE.MeshStandardMaterial({ color: 0x121318, metalness: .5, roughness: .3 })); stage.position.set(0, .225, -.6); sc.add(stage);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(12.05, .04, .04), new THREE.MeshBasicMaterial({ color: 0xffc44a })); edge.position.set(0, .45, 2.42); sc.add(edge);
      const [wc, wx] = g3Canvas(1024, 448), gr = wx.createRadialGradient(512, 230, 20, 512, 230, 560); gr.addColorStop(0, '#8a5a12'); gr.addColorStop(.4, '#4a2e08'); gr.addColorStop(.8, '#140c03'); gr.addColorStop(1, '#050302'); wx.fillStyle = gr; wx.fillRect(0, 0, 1024, 448);
      wx.globalAlpha = .25; for (let i = 0; i < 240; i++) { wx.fillStyle = '#fff3c4'; wx.beginPath(); wx.arc(Math.random() * 1024, Math.random() * 448, Math.random() * 3, 0, 7); wx.fill(); } wx.globalAlpha = 1;
      wx.fillStyle = '#ffe6a8'; wx.textAlign = 'center'; wx.font = '800 112px Arial, sans-serif'; wx.fillText('BALLON D\'OR', 512, 240); wx.font = '700 64px Arial, sans-serif'; wx.fillStyle = '#ffe3a0'; wx.fillText(String(f.yr || ''), 512, 330);
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), new THREE.MeshBasicMaterial({ map: g3Tex(wc), color: 0x7a7a7a, toneMapped: false })); wall.position.set(0, 4.2, -4.2); sc.add(wall);
      for (const sd of [-1, 1]) { const col = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 8), new THREE.MeshBasicMaterial({ color: 0xffb93d, transparent: true, opacity: .16, toneMapped: false })); col.position.set(sd * 9.5, 4, -4); sc.add(col); }
      // public assis, face à la scène
      const spots = []; for (let r = 0; r < 9; r++) for (let c = 0; c < 26; c++) { if (Math.random() < .1) continue; const x = (c - 12.5) * .95 + (r % 2) * .4, z = 5 + r * .75, u = Math.random(); spots.push([x, r * .18, z, Math.PI, u < .7 ? new THREE.Color(0x15161b) : u < .85 ? new THREE.Color(0x3a1220) : new THREE.Color(0xd9d9d9), Math.random()]); }
      feteCrowd(sc, spots, cols, U);
      const fl = []; for (let i = 0; i < 50; i++) fl.push([(Math.random() - .5) * 26, 1.2 + Math.random() * 1.5, 5 + Math.random() * 5]); feteFlashes(sc, fl, U);
      // faisceaux de projecteurs (cônes lumineux)
      F.beams = []; for (let i = 0; i < 4; i++) { const cg = new THREE.ConeGeometry(1.6, 13, 24, 1, true); cg.translate(0, -6.5, 0); const b = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffe2a6 : 0xffffff, transparent: true, opacity: .07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); b.position.set((i - 1.5) * 4.5, 13, 1); sc.add(b); F.beams.push(b); }
      sc.add(new THREE.HemisphereLight(0xffe9c4, 0x111111, .35));
      const key = new THREE.SpotLight(0xfff1d6, 1.5, 40, .32, .5); key.position.set(2, 12, 9); key.target.position.set(0, 1.2, 0); sc.add(key); sc.add(key.target);
      const back = new THREE.DirectionalLight(0xffb84a, .9); back.position.set(0, 6, -8); sc.add(back);
      const g = new THREE.Group(); g.position.y = .45; sc.add(g); F.stageY = .45;
      F.P = feteRig(g, 1); F.kits = [kitMe]; F.prop = feteBallonOr(); g.add(F.prop); F.prop.visible = false;
      const swap = () => { if (!F.on || F.f !== f) return; const m = trophMesh('ballon_dor', .5, trophEnv(r)); if (!m) return; F.prop.clear(); F.prop.add(m); F.prop.userData.ballY = m.userData.ballY; F.prop.userData.real = true; };
      if (TROPH.model) swap(); else { const pr = trophLoad(); if (pr) pr.then(swap); }
      F.conf = feteConfetti(sc, [new THREE.Color(0xffd23d), new THREE.Color(0xfff2c0)], low ? 260 : 600);
    } else {
      feteStade(sc, cols, f.k === 'pres' || f.night !== false, U);
      const N = f.k === 'titre' ? 7 : 1; F.P = feteRig(sc, N); F.stageY = 0;
      F.kits = [kitMe]; for (let i = 1; i < N; i++) F.kits.push({ shirt: cols[0], shorts: cols[1], socks: cols[0], skin: g3Lin(typeof SKIN !== 'undefined' ? SKIN[(i * 7) % SKIN.length] : '#c48a60'), hair: new THREE.Color(i % 3 ? 0x1b1410 : 0x6b4a2a), boots: new THREE.Color(0x111111) });
      if (f.k === 'pres') {
        // écharpe aux couleurs du club, avec son nom
        const [ec, ex] = g3Canvas(512, 64); for (let i = 0; i < 16; i++) { ex.fillStyle = '#' + (i % 2 ? cols[1] : cols[0]).clone().convertLinearToSRGB().getHexString(); ex.fillRect(i * 32, 0, 32, 64); }
        ex.fillStyle = '#' + cols[0].clone().convertLinearToSRGB().getHexString(); ex.fillRect(70, 8, 372, 48); ex.fillStyle = '#' + cols[1].clone().convertLinearToSRGB().getHexString(); ex.font = '900 34px Arial, sans-serif'; ex.textAlign = 'center'; ex.textBaseline = 'middle'; ex.fillText(String(f.club || '').toUpperCase().slice(0, 18), 256, 33);
        F.prop = new THREE.Mesh(new THREE.PlaneGeometry(1, .2), new THREE.MeshStandardMaterial({ map: g3Tex(ec), side: THREE.DoubleSide, roughness: .9 })); sc.add(F.prop); F.prop.visible = false;
      } else { F.prop = feteCup(f.name); sc.add(F.prop); F.conf = feteConfetti(sc, cols, low ? 300 : 700); }
    }
    feteKit(F.P, F.kits);
  } catch (e) { console.warn('soirée 3D', e); return feteEnd(true); }
  // le son : le stade (ou la salle) qui chante, puis l'explosion de joie
  try {
    if (typeof smpLoad === 'function' && typeof AU !== 'undefined' && AU.ctx) {
      const pr = smpLoad(), go = () => { if (!F.on) return; const lp = f.k === 'bdo' ? 1800 : 0; F.snd = [smpPlay('cheer_loop', f.k === 'bdo' ? .5 : .85, { loop: true, fade: 1.2, lp: lp || undefined })]; F.snd.push(smpPlay(f.k === 'bdo' ? 'surge' : 'roar', .95, { at: f.k === 'pres' ? 1.4 : 1.1, len: 6, lp: lp || undefined })); if (f.k === 'pres') F.snd.push(smpPlay('chant', .75, { at: 3.4, len: 6 })); };
      if (pr && pr.then) pr.then(go); else go();
    }
  } catch (e) { }
  el.addEventListener('click', () => feteEnd());
  addEventListener('resize', feteSize); feteSize();
  requestAnimationFrame(feteFrame);
}
function feteSize() { const F = FETE; if (!F.on || !F.r) return; const w = innerWidth, h = innerHeight; F.r.setSize(w, h, false); F.cam.aspect = w / h; F.cam.updateProjectionMatrix(); F.w = w; F.h = h; }
function feteFrame(now) {
  const F = FETE; if (!F.on || !F.r) return; requestAnimationFrame(feteFrame);
  const dt = Math.min(.05, (now - F.last) / 1000); F.last = now; const t = (now - F.t0) / 1000, f = F.f, cam = F.cam, P = F.P;
  F.U.uT.value = now / 1000; F.U.uE.value = f.k === 'bdo' ? (t > 1.6 ? .35 : .1) : t > 1.2 ? 1 : .35;
  feteSk(P); if (P.sk && !P.kitDone) { P.kitDone = true; feteKit(P, F.kits); }
  // poses : le joueur (n° 0) et, pour un titre, les coéquipiers qui sautent autour de lui
  const face = Math.PI / 2;
  if (f.k === 'pres') g3Pose(P, 0, { x: 0, z: 0, yaw: face, v: 0, ph: 0, act: t > 1.3 ? 8 : 0, at: Math.min(t - 1.3, 9), cel: 'echarpe', tm: now / 1000, gdt: dt, snap: t < .05, key: 'fete0', idle: 0 });
  else if (f.k === 'bdo') g3Pose(P, 0, { x: 0, z: 0, yaw: face, v: 0, ph: 0, act: 8, at: Math.min(t, 9), cel: t > 1.7 ? 'ballon' : 'salut', tm: now / 1000, gdt: dt, snap: t < .05, key: 'fete0', idle: 0 });
  else {
    g3Pose(P, 0, { x: 0, z: 0, yaw: face, v: 0, ph: 0, act: 8, at: Math.min(t, 9), cel: 'trophee', tm: now / 1000, gdt: dt, snap: t < .05, key: 'fete0', idle: 0 });
    for (let i = 1; i < P.N; i++) { const a = Math.PI * (1.12 + .76 * (i - 1) / (P.N - 2)), rr = 1.7 + (i % 2) * .7; g3Pose(P, i, { x: Math.cos(a) * rr, z: Math.sin(a) * rr * .8 - .3, yaw: face + (i - 3.5) * .06, v: 0, ph: 0, act: 18, at: Math.min(t + i * .13, 8.9), tm: now / 1000 + i, gdt: dt, snap: t < .05, key: 'fete' + i, idle: 0 }); }
  }
  for (const k of ['torso', 'shorts', 'head', 'hair', 'uarm', 'ubare', 'farm', 'hand', 'thigh', 'shin', 'boot']) P[k].instanceMatrix.needsUpdate = true;
  if (P.sk) g3SkFlush(P.sk);
  // objet tenu : entre les deux mains
  const hl = feteHand(P, 0, 0), hr = feteHand(P, 0, 1), mid = hl.clone().add(hr).multiplyScalar(.5), Y = F.stageY || 0;
  if (f.k === 'pres') {
    const on = t > 1.5; F.prop.visible = on;
    if (on) { const dx = hr.x - hl.x, dz = hr.z - hl.z, d = Math.max(.35, Math.hypot(dx, dz, hr.y - hl.y)); F.prop.position.set(mid.x, mid.y - .02, mid.z + .04); let a = -Math.atan2(dz, dx), tilt = Math.atan2(hr.y - hl.y, Math.hypot(dx, dz)) * .6; if (Math.sin(a) * (cam.position.x - mid.x) + Math.cos(a) * (cam.position.z - mid.z) < 0) { a += Math.PI; tilt = -tilt; } F.prop.rotation.set(0, a, tilt); F.prop.scale.set(d + .28, 1, 1); }
  } else if (f.k === 'bdo') { F.prop.visible = t > 1.7; F.prop.position.set(mid.x, mid.y - (F.prop.userData.real ? F.prop.userData.ballY - .08 : .14), mid.z + .06); F.prop.rotation.y = t * .6; }
  else { F.prop.position.set(mid.x, mid.y - .12, mid.z + .02); F.prop.rotation.set(0, Math.sin(t * .7) * .3, 0); }
  // effets : feux d'artifice et confettis aux grands moments
  const fx = (key, at, type, x, z) => { if (t > at && !F.fx[key]) { F.fx[key] = 1; g3FxGoal(F.sc, cam, type, x, z, f.k === 'bdo' ? ['#ffd23d', '#fff2c0'] : (k => [k.col, k.col2 || '#ffffff'])(typeof kitColors === 'function' ? kitColors(f.club || '') : { col: '#ffd23d' })); } };
  if (f.k === 'pres') { fx('a', 1.6, 'fireworks', 0, -6); fx('b', 4.2, 'fireworks', -6, -10); fx('c', 6.4, 'fireworks', 6, -10); }
  else if (f.k === 'titre') { fx('a', .9, 'confetti', 0, 0); fx('b', 2.4, 'fireworks', 0, -8); fx('c', 4.8, 'fireworks', -7, -12); fx('d', 7, 'fireworks', 7, -12); }
  else { fx('a', 1.75, 'confetti', 0, 0); }
  if (F.conf) feteConfettiStep(F.conf, dt, t, t > (f.k === 'bdo' ? 1.7 : .9));
  if (F.beams) F.beams.forEach((b, i) => { b.rotation.z = Math.sin(t * .5 + i * 1.7) * .32; b.rotation.x = Math.cos(t * .37 + i) * .18; b.material.opacity = .05 + .03 * Math.sin(t * 2 + i); });
  g3FxUpdate(F.sc, cam, dt, (F.h || 600) * F.r.getPixelRatio());
  // caméra
  const E = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  if (f.k === 'pres') { const k = E(t / 4.2), ang = Math.PI * 1.5 * (1 - k) + Math.PI * .5 + .35 * k + Math.sin(t * .15) * .05, R = 7.5 - 3.4 * k; cam.position.set(Math.cos(ang) * R, 1.9 - .45 * k, Math.sin(ang) * R); cam.lookAt(0, 1.35, 0); cam.fov = 40; }
  else if (f.k === 'titre') { const k = E(t / 6), ang = Math.PI * .5 + Math.sin(t * .22) * .5, R = 6.2 - 1.2 * k; cam.position.set(Math.cos(ang) * R, .55 + 1.4 * k, Math.sin(ang) * R); cam.lookAt(0, 1.7 - .4 * k, 0); cam.fov = 42; }
  else {
    const k = E(t / 5.5), z = F.prop.userData.real ? E((t - 6) / 2.2) : 0, tp = F.prop.position, ty = tp.y + Y + (F.prop.userData.ballY || .14);
    // plan large qui avance… puis gros plan sur le Ballon d'Or qui tourne entre ses mains
    const cx = Math.sin(t * .12) * 1.2 * (1 - k * .6), cy = 3.1 - 1.3 * k, cz = 13.5 - 8.2 * k, lx = 0, ly = 1.55 + Y * .5, lz = 0;
    cam.position.set(cx + (tp.x + .45 - cx) * z, cy + (ty + .05 - cy) * z, cz + (tp.z + 2.1 - cz) * z); cam.lookAt(lx + (tp.x - lx) * z, ly + (ty - .32 - ly) * z, lz + (tp.z - lz) * z); cam.fov = 36 - 2 * z;
  }
  cam.updateProjectionMatrix();
  if (t > 1.1 && !F.txt) { F.txt = 1; F.el.classList.add('txt'); }
  if (t > 1.6 && !F.flash && f.k !== 'pres') { F.flash = 1; F.el.classList.add('flash'); }
  if (t > F.dur) feteEnd();
  try { F.r.render(F.sc, cam); } catch (e) { feteEnd(true); }
}
function feteEnd(now) {
  const F = FETE; if (!F.on || F.ending) return; F.ending = true;
  try { const c = AU.ctx; for (const s of F.snd || []) if (s) { s.g.gain.setTargetAtTime(0, c.currentTime, .35); s.src.stop(c.currentTime + 1.8); } } catch (e) { }
  const el = F.el; if (el) el.classList.add('out');
  setTimeout(() => {
    removeEventListener('resize', feteSize);
    try { if (F.sc) F.sc.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } }); if (F.r) { F.r.dispose(); if (F.r.forceContextLoss) F.r.forceContextLoss(); } } catch (e) { }
    if (el) el.remove(); const d = F.done; Object.assign(F, { on: false, el: null, r: null, sc: null, P: null, prop: null, conf: null, beams: null, snd: null, txt: 0, flash: 0, done: null });
    if (typeof G3JS !== 'undefined') for (let i = 0; i < 8; i++) G3JS.delete('fete' + i);
    if (d) d();
  }, now ? 0 : 520);
}
