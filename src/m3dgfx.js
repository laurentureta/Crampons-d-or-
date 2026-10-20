// ---------- Embellissements des matchs en 3D ----------
// Lumière d'appoint côté caméra (visages et maillots éclairés), pelouse vivante (bandes de tonte qui changent
// selon l'angle, grain du gazon de près), public dessiné (silhouettes qui s'assoient, applaudissent, se lèvent),
// ciel (nuages le jour, étoiles et lune la nuit), faisceaux des projecteurs la nuit.

// pelouse : bandes de tonte qui s'inversent selon d'où on regarde, et grain du gazon près de la caméra
function g3GrassShader(m) {
  const GU = g3GrassU();
  m.onBeforeCompile = s => {
    Object.assign(s.uniforms, GU);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGw;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvGw = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vGw;\nuniform sampler2D gTx; uniform float gK; uniform float gM;\nfloat gHash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }')
      .replace('#include <map_fragment>', `#include <map_fragment>
      { float band = mod(floor((vGw.x + 52.5) / 5.8333), 2.0) * 2.0 - 1.0; vec3 vd = normalize(cameraPosition - vGw); float sd = clamp(vd.x * 2.5, -1.0, 1.0);
        float dist = length(cameraPosition - vGw), near = 1.0 - smoothstep(12.0, 55.0, dist);
        float n = gHash(floor(vGw.xz * 9.0)) * .6 + gHash(floor(vGw.xz * 23.0)) * .4;
        float hd = mix(1.0, 0.9 + 0.2 * n, near), pd = 1.0;
        if (gK > 0.0) { // gazon photographié : brins de près, plaques plus claires ou plus foncées de loin (mipmaps : pas de scintillement)
          vec3 lw = vec3(0.299, 0.587, 0.114); float p1 = dot(texture2D(gTx, vGw.xz * 0.42).rgb, lw) / gM, p2 = dot(texture2D(gTx, vGw.zx * 0.061 + 0.37).rgb, lw) / gM;
          pd = clamp(1.0 + (p1 - 1.0) * 1.35, 0.6, 1.4) * (0.86 + 0.14 * p2); hd = mix(hd, 1.0, gK); }
        diffuseColor.rgb *= (1.0 + 0.075 * band * sd) * hd * mix(1.0, pd, gK); }`);
  };
  m.envMapIntensity = .45;
}
// ---------- public dessiné : silhouettes (assis, debout qui applaudit, bras levés, écharpe), tournées vers la caméra ----------
function g3CrowdAtlas() {
  if (G3.crowdAtlas) return G3.crowdAtlas;
  const W = 128, [c, x] = g3Canvas(W * 4, W * 2);
  const skins = ['#e9c2a0', '#8a5a3c'], hairs = ['#2a1d14', '#120c08'];
  for (let row = 0; row < 2; row++) for (let pose = 0; pose < 4; pose++) {
    const ox = pose * W, oy = row * W, cx = ox + W / 2, sk = skins[row], hr = hairs[row];
    const seated = pose === 0, top = oy + (seated ? 30 : 12), shY = top + 26, hipY = top + 70;
    x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
    // jambes (pantalon foncé) — assis : on ne voit que le haut des cuisses
    x.fillStyle = 'rgba(38,42,52,1)'; if (seated) x.fillRect(cx - 17, hipY - 2, 34, 14); else { x.fillRect(cx - 16, hipY - 4, 14, W - (hipY - oy) - 2); x.fillRect(cx + 2, hipY - 4, 14, W - (hipY - oy) - 2); }
    // bras (manches = maillot, mains = peau)
    const arm = (sx, sy, ex, ey, hx, hy) => { x.strokeStyle = 'rgba(236,236,236,0.78)'; x.lineWidth = 11; x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); x.lineTo(hx, hy); x.stroke(); x.fillStyle = sk; x.beginPath(); x.arc(hx, hy, 5.5, 0, 7); x.fill(); };
    if (pose === 0) { arm(cx - 19, shY + 4, cx - 23, shY + 26, cx - 16, shY + 42); arm(cx + 19, shY + 4, cx + 23, shY + 26, cx + 16, shY + 42); }
    else if (pose === 1) { arm(cx - 19, shY + 4, cx - 22, shY + 24, cx - 3, shY + 22); arm(cx + 19, shY + 4, cx + 22, shY + 24, cx + 3, shY + 20); }
    else if (pose === 2) { arm(cx - 19, shY + 2, cx - 30, shY - 18, cx - 36, shY - 40); arm(cx + 19, shY + 2, cx + 30, shY - 18, cx + 36, shY - 40); }
    else { arm(cx - 19, shY + 4, cx - 22, shY + 26, cx - 15, shY + 42); arm(cx + 19, shY + 2, cx + 26, shY - 20, cx + 24, shY - 44);
      x.strokeStyle = 'rgba(236,236,236,0.78)'; x.lineWidth = 7; x.beginPath(); x.moveTo(cx + 24, shY - 44); x.quadraticCurveTo(cx + 44, shY - 38, cx + 40, shY - 14); x.stroke(); } // écharpe
    // torse (maillot, teinté par la couleur de chaque spectateur)
    x.fillStyle = 'rgba(236,236,236,0.78)'; x.beginPath(); x.moveTo(cx - 20, shY); x.quadraticCurveTo(cx, shY - 6, cx + 20, shY); x.lineTo(cx + 17, hipY); x.lineTo(cx - 17, hipY); x.closePath(); x.fill();
    // ombre douce sous les bras et le col
    x.fillStyle = 'rgba(150,150,150,0.78)'; x.fillRect(cx - 6, shY, 12, 5);
    // tête, cheveux
    x.fillStyle = sk; x.beginPath(); x.ellipse(cx, top + 12, 11, 13, 0, 0, 7); x.fill(); x.fillRect(cx - 4, top + 22, 8, 6);
    x.fillStyle = hr; x.beginPath(); x.ellipse(cx, top + 5, 11.5, 8, 0, Math.PI, 0); x.fill(); if (row === 0) { x.beginPath(); x.ellipse(cx, top + 4, 12, 6, 0, 0, 7); x.fill(); }
    x.restore();
  }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.LinearEncoding; t.premultiplyAlpha = false; t.anisotropy = 2; G3.crowdAtlas = t; return t;
}
// people : [x, y, z, ry, couleur, r] ; renvoie l'InstancedMesh (uniforms partagés dans G3.crowdU)
function g3CrowdMesh(people, night) {
  const g = new THREE.PlaneGeometry(1, 1).translate(0, .5, 0), n = people.length, ph = new Float32Array(n);
  g.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 1));
  G3.crowdU = { uT: { value: 0 }, uE: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { map: { value: g3CrowdAtlas() }, uLight: { value: night ? .78 : 1 } }]), fog: true, transparent: false,
    vertexShader: `attribute float aPh; uniform float uT; uniform float uE; varying vec2 vUv; varying vec3 vCol; varying float vFd;
      void main(){
        vec3 base = instanceMatrix[3].xyz; float sc = length(instanceMatrix[0].xyz);
        float pose = 0.0, r2 = fract(aPh * 7.31), r3 = fract(aPh * 13.7);
        if (uE > 0.62 && aPh < uE * 1.1 - 0.15) pose = r2 < 0.55 ? 2.0 : 3.0; else if (uE > 0.25 && aPh < uE + 0.2) pose = 1.0; else if (r3 < 0.06) pose = 1.0;
        if (pose == 1.0 && sin(uT * (2.0 + r2) + aPh * 30.0) > 0.7) pose = r3 < 0.5 ? 1.0 : 0.0;
        float jump = pose >= 2.0 ? max(0.0, sin(uT * (6.0 + aPh * 3.0) + aPh * 40.0)) * uE * 0.3 : 0.0;
        vec3 camR = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]); camR.y = 0.0; camR = normalize(camR);
        vec3 wp = base + camR * position.x * sc + vec3(0.0, position.y * sc + jump - 0.1, 0.0);
        vec4 mv = viewMatrix * vec4(wp, 1.0); gl_Position = projectionMatrix * mv; vFd = -mv.z;
        vUv = vec2((uv.x + pose) * 0.25, (uv.y + (r3 < 0.62 ? 1.0 : 0.0)) * 0.5);
        #ifdef USE_INSTANCING_COLOR
        vCol = pow(instanceColor, vec3(1.0 / 2.2));
        #else
        vCol = vec3(1.0);
        #endif
      }`,
    fragmentShader: `uniform sampler2D map; uniform float uLight; uniform vec3 fogColor; uniform float fogNear; uniform float fogFar; varying vec2 vUv; varying vec3 vCol; varying float vFd;
      void main(){ vec4 t = texture2D(map, vUv); if (t.a < 0.5) discard; float shirt = t.a < 0.9 ? 1.0 : 0.0; vec3 c = t.rgb * mix(vec3(1.0), vCol, shirt) * uLight;
        c = mix(c, pow(fogColor, vec3(1.0 / 2.2)), smoothstep(fogNear, fogFar, vFd)); gl_FragColor = vec4(c, 1.0); }`,
  });
  mat.toneMapped = false; mat.uniforms.uT = G3.crowdU.uT; mat.uniforms.uE = G3.crowdU.uE;
  const im = new THREE.InstancedMesh(g, mat, n); im.frustumCulled = false;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3();
  people.forEach(([x, y, z, ry, col, r], i) => { const s = .92 + r * .2; one.set(s, s, s); m4.compose(v.set(x, y, z), q, one); im.setMatrixAt(i, m4); im.setColorAt(i, col); ph[i] = r; });
  return im;
}
// ciel : nuages le jour (plus gris sous la pluie), étoiles et lune la nuit
function g3SkyExtras(S3, night, wet, snow, rnd, photo) {
  G3.clouds = null; G3.cloudMesh = null;
  if (photo === 'ok') return; // ciel photographié déjà prêt : ses propres nuages suffisent
  if (night) {
    const n = 700, pos = new Float32Array(n * 3), sz = new Float32Array(n);
    for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, e = .12 + Math.pow(rnd(), .7) * 1.35, R = 820; pos[i * 3] = Math.cos(a) * Math.cos(e) * R; pos[i * 3 + 1] = Math.sin(e) * R; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * R; sz[i] = .6 + Math.pow(rnd(), 3) * 2.4; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('sz', new THREE.BufferAttribute(sz, 1));
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
      vertexShader: 'attribute float sz; varying float vA; void main(){ vA = 0.4 + 0.6 * fract(sz * 7.13); vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = sz * 1.6; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(d)); gl_FragColor = vec4(0.92, 0.95, 1.0, a * vA); }' });
    m.fog = false; const st = new THREE.Points(g, m); st.frustumCulled = false; S3.add(st);
    const moon = g3Glow(S3, -380, 300, -560, 120, '#dfe8ff'); moon.material.opacity = .55;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(14, 32), new THREE.MeshBasicMaterial({ color: 0xf2f4ff, fog: false, toneMapped: false })); disc.position.set(-380, 300, -560); disc.lookAt(0, 0, 0); S3.add(disc);
    return;
  }
  // nuages : dôme à moitié transparent, texture peinte (amas de bulles blanches au ventre gris), qui dérive lentement
  const W = 1024, H = 256, [c, x] = g3Canvas(W, H), dense = wet || snow;
  const blob = (bx, by, r, a, grey) => { const gr = x.createRadialGradient(bx, by - r * .2, 0, bx, by, r); gr.addColorStop(0, `rgba(${grey ? '205,210,216' : '255,255,255'},${a})`); gr.addColorStop(.6, `rgba(${grey ? '170,176,184' : '236,240,246'},${a * .55})`); gr.addColorStop(1, 'rgba(220,226,232,0)'); x.fillStyle = gr; x.beginPath(); x.arc(bx, by, r, 0, 7); x.fill(); };
  const clusters = dense ? 120 : 46;
  for (let k = 0; k < clusters; k++) {
    const vy = Math.pow(rnd(), dense ? 1 : 1.8), cy = H - 10 - vy * (H * .8), scale = .35 + (1 - vy) * .65, cx = rnd() * W, n = 6 + Math.floor(rnd() * 10);
    for (let i = 0; i < n; i++) blob((cx + (rnd() - .5) * 90 * scale + W) % W, cy + (rnd() - .5) * 18 * scale, (14 + rnd() * 26) * scale, (dense ? .55 : .7) * (.6 + rnd() * .4), dense || rnd() < .3);
  }
  const t = g3Tex(c); t.wrapS = THREE.RepeatWrapping;
  const geo = new THREE.SphereGeometry(860, 48, 10, 0, Math.PI * 2, 0, Math.PI * .47); // v = 0 près de l'horizon, 1 au zénith
  const cl = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.BackSide, fog: false, opacity: dense ? .95 : .9 }));
  cl.renderOrder = -1; cl.userData.op = cl.material.opacity; S3.add(cl); G3.clouds = t; G3.cloudMesh = cl;
}
// faisceaux des projecteurs (nuit) : cônes de lumière très légers, du mât vers la pelouse
function g3Beams(S3) {
  if (!G3.night || !G3.lamps || S3.userData.beams) return; S3.userData.beams = true;
  const [c, x] = g3Canvas(4, 128), gr = x.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,248,226,.9)'); gr.addColorStop(.25, 'rgba(255,244,214,.35)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = gr; x.fillRect(0, 0, 4, 128);
  const t = g3Tex(c), mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: .05, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, toneMapped: false });
  for (const [lx, ly, lz] of G3.lamps.slice(0, 4)) {
    const tx = lx * .35, tz = lz * .3, L = Math.hypot(lx - tx, ly, lz - tz), g = new THREE.CylinderGeometry(.6, 13, L, 24, 1, true);
    const m = new THREE.Mesh(g, mat); m.position.set((lx + tx) / 2, ly / 2, (lz + tz) / 2);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(lx - tx, ly, lz - tz).normalize()); m.renderOrder = 3; S3.add(m);
  }
}

// grandes tribunes : texture « public » (une rangée de sièges tous les 85 cm, des spectateurs selon le remplissage)
// vue de loin, elle donne la foule dense et bariolée des retransmissions ; les silhouettes animées s'ajoutent par-dessus
function g3CrowdTex(seatCol, hc, oc, fill, rnd, night) {
  const W = 256, H = 256, [c, x] = g3Canvas(W, H), rows = 4, per = 6, rh = H / rows, cw = W / per;
  const hex = col => '#' + col.clone().convertLinearToSRGB().getHexString(), seat = hex(seatCol), seatD = hex(seatCol.clone().multiplyScalar(.7));
  const skin = ['#f0c8a8', '#d9a47c', '#a86e4c', '#6e4630'];
  for (let r = 0; r < rows; r++) {
    x.fillStyle = r % 2 ? seat : seatD; x.fillRect(0, r * rh, W, rh); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, r * rh + rh - 6, W, 6);
    for (let k = 0; k < per; k++) {
      if (rnd() > fill * 1.08) continue;
      const u = rnd(), col = u < .5 ? hc : u < .6 ? oc : new THREE.Color().setHSL(rnd(), .25 + rnd() * .4, .25 + rnd() * .45);
      const cx = k * cw + cw / 2 + (rnd() - .5) * 10, by = r * rh + rh - 8;
      x.fillStyle = hex(col); x.beginPath(); x.ellipse(cx, by - 14, 13, 17, 0, 0, 7); x.fill();
      x.fillStyle = skin[Math.floor(rnd() * skin.length)]; x.beginPath(); x.arc(cx, by - 36, 7.5, 0, 7); x.fill();
      x.fillStyle = rnd() < .5 ? '#1c140e' : '#4a3020'; x.beginPath(); x.arc(cx, by - 39, 7.5, Math.PI, 0); x.fill();
      if (rnd() < .18) { x.strokeStyle = hex(col); x.lineWidth = 6; x.beginPath(); x.moveTo(cx + 8, by - 24); x.lineTo(cx + 14, by - 50); x.stroke(); } // un bras levé
    }
  }
  if (night) { x.fillStyle = 'rgba(0,0,10,.18)'; x.fillRect(0, 0, W, H); }
  const t = g3Tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// ---------- textures photo (Poly Haven, CC0 : réduites et rangées dans assets/textures par le robot médias) ----------
// ciel photographié (cumulus le jour, couvert sous la pluie ou la neige), grain du gazon, prés, route, parvis.
// Tant qu'une photo n'est pas arrivée, le dessin d'origine reste ; elle le remplace ensuite en douceur.
const G3TX = { im: {}, cb: {}, st: {}, sky: {}, gU: null };
const G3_SKY_SUN = { ciel_jour: .6, ciel_gris: .582 }; // où se trouve le soleil dans chaque photo (fraction de tour)
function g3TxUrl(n) { const T = typeof TEX_3D !== 'undefined' ? TEX_3D : null; return T && T[n] ? 'assets/textures/' + T[n] + (typeof MEDIA_H !== 'undefined' && MEDIA_H.tex ? '?h=' + MEDIA_H.tex : '') : null; }
// charge une photo une seule fois ; cb tout de suite si elle est déjà là. Rend 'ok', 'wait' ou false (pas de photo)
function g3TxImg(n, cb) {
  const im = G3TX.im[n];
  if (im && im.ok) { if (cb) cb(im); return 'ok'; }
  if (im === false) return false;
  const u = g3TxUrl(n); if (!u) { G3TX.im[n] = false; return false; }
  if (cb) (G3TX.cb[n] = G3TX.cb[n] || []).push(cb);
  if (im) return 'wait';
  const I = new Image(); G3TX.im[n] = I; I.decoding = 'async';
  I.onload = () => { I.ok = true; const L = G3TX.cb[n] || []; G3TX.cb[n] = []; for (const f of L) try { f(I); } catch (e) { console.warn('texture', n, e); } };
  I.onerror = () => { G3TX.im[n] = false; G3TX.cb[n] = []; };
  I.src = u; return 'wait';
}
// couleur moyenne d'une bande horizontale de la photo (y0..y1 en fraction de hauteur) : horizon du ciel, teinte du gazon
function g3TxAvg(n, im, y0, y1) {
  const K = n + y0 + '-' + y1; if (G3TX.st[K]) return G3TX.st[K];
  let r = .5, g = .5, b = .5;
  try { const [c, x] = g3Canvas(64, 32); x.drawImage(im, 0, 0, 64, 32); const a = Math.floor(y0 * 32), h = Math.max(1, Math.ceil(y1 * 32) - a), d = x.getImageData(0, a, 64, h).data; let s0 = 0, s1 = 0, s2 = 0; for (let i = 0; i < d.length; i += 4) { s0 += d[i]; s1 += d[i + 1]; s2 += d[i + 2]; } const N = d.length / 4 * 255; r = s0 / N; g = s1 / N; b = s2 / N; } catch (e) { }
  return G3TX.st[K] = { r, g, b, l: .299 * r + .587 * g + .114 * b, hex: '#' + [r, g, b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('') };
}
// photo « sans ses grandes taches » : on garde le grain (rapport à la moyenne locale) et on retire les variations d'éclairage
// de la prise de vue, qui feraient voir la répétition du motif (bandes au loin) ; le motif reste raccordable (flou en boucle)
function g3TxDetail(im, S) {
  const K = im.src + S, mm = G3TX.det || (G3TX.det = {}), hit = mm[K];
  if (hit) { const [c, x] = g3Canvas(S, S), D = x.createImageData(S, S); D.data.set(hit.d); return { c, x, D, L: hit.L }; } // déjà calculé (match précédent)
  const [c, x] = g3Canvas(S, S); x.drawImage(im, 0, 0, S, S); const D = x.getImageData(0, 0, S, S), d = D.data;
  const N = 32, cell = S / N, low = new Float32Array(N * N), bl = new Float32Array(N * N), R = 3, L = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let xx = 0; xx < S; xx++) { const i = (y * S + xx) * 4, l = .299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2]; L[y * S + xx] = l; low[((y / cell) | 0) * N + ((xx / cell) | 0)] += l / (cell * cell); }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { let t = 0; for (let v = -R; v <= R; v++) for (let u = -R; u <= R; u++) t += low[((j + v + N) % N) * N + (i + u + N) % N]; bl[j * N + i] = t / ((2 * R + 1) * (2 * R + 1)); }
  const g = (i, j) => bl[((j + N) % N) * N + (i + N) % N];
  for (let y = 0; y < S; y++) { const fy = y / cell - .5, j0 = Math.floor(fy), ty = fy - j0; for (let xx = 0; xx < S; xx++) { const fx = xx / cell - .5, i0 = Math.floor(fx), tx = fx - i0, lo = (g(i0, j0) * (1 - tx) + g(i0 + 1, j0) * tx) * (1 - ty) + (g(i0, j0 + 1) * (1 - tx) + g(i0 + 1, j0 + 1) * tx) * ty; L[y * S + xx] /= Math.max(1, lo); } }
  mm[K] = { d: new Uint8ClampedArray(d), L };
  return { c, x, D, L };
}
// ciel du match : la photo s'applique sur le dôme (uniforms de g3Match) ; brouillard et bas du ciel prennent la couleur de son horizon
function g3SkyPhoto(U, night, wet, snow) {
  if (night) return false;
  const n = wet || snow ? 'ciel_gris' : 'ciel_jour';
  let sync = true;
  const r = g3TxImg(n, im => {
    if (G3.skyU !== U) return; // le match a changé entre-temps
    let t = G3TX.sky[n];
    if (!t) { t = new THREE.Texture(im); t.encoding = THREE.LinearEncoding; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.generateMipmaps = false; t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true; G3TX.sky[n] = t; }
    const hz = g3TxAvg(n, im, .94, 1);
    U.tx.value = t; U.b.value.setRGB(hz.r, hz.g, hz.b);
    const sp = G3.sun.position; U.rot0 = (G3_SKY_SUN[n] || .5) - Math.atan2(sp.z, sp.x) / (Math.PI * 2); U.rot.value = U.rot0;
    // brouillard (appliqué après la conversion des couleurs dans three r128 : on lui donne la couleur telle qu'affichée)
    const fg = G3.sc && G3.sc.fog; if (fg) { U.fog0 = fg.color.clone(); U.fog1 = g3Col(hz.hex); if (sync) fg.color.copy(U.fog1); }
    U.k.value = sync ? 1 : .001; // déjà en mémoire : tout de suite ; sinon fondu (g3SkyTick)
  });
  sync = false;
  return r;
}
function g3SkyTick(now, dt) {
  const U = G3.skyU; if (!U || !U.tx.value) return;
  if (U.k.value < 1) { U.k.value = Math.min(1, U.k.value + dt / 1.8); const fg = G3.sc && G3.sc.fog; if (fg && U.fog1) fg.color.copy(U.fog0).lerp(U.fog1, U.k.value); }
  const cm = G3.cloudMesh; if (cm && cm.visible) { cm.material.opacity = cm.userData.op * (1 - U.k.value); if (U.k.value >= 1) cm.visible = false; }
  U.rot.value = U.rot0 + now * .00003; // les nuages photographiés glissent très lentement
}
// grain du gazon photographié (uniforms partagés par toutes les pelouses)
function g3GrassU() {
  if (G3TX.gU) return G3TX.gU;
  const U = G3TX.gU = { gTx: { value: null }, gK: { value: 0 }, gM: { value: .5 } };
  g3TxImg('herbe', im => {
    const { c, x, D, L } = g3TxDetail(im, 512), d = D.data; // niveaux de gris centrés sur 0,5 : seul le grain des brins compte
    for (let i = 0; i < L.length; i++) { const v = Math.max(0, Math.min(255, 128 * L[i])); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; }
    x.putImageData(D, 0, 0); const t = new THREE.CanvasTexture(c); t.encoding = THREE.LinearEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = G3.r ? Math.min(8, G3.r.capabilities.getMaxAnisotropy()) : 1;
    U.gTx.value = t; U.gM.value = .5; U.gK.value = 1; });
  return U;
}
// une photo répétée dans un canevas déjà affiché (prés, route, parvis) : on redessine, puis la texture se met à jour
function g3TxPaint(n, tex, paint) { return g3TxImg(n, im => { try { paint(im); tex.needsUpdate = true; } catch (e) { console.warn('texture', n, e); } }); }
// au démarrage du moteur : on va déjà chercher le ciel du jour et le gazon
function g3TxPreload() { g3TxImg('ciel_jour'); g3GrassU(); }
