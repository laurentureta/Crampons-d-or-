// ---------- Embellissements des matchs en 3D ----------
// Lumière d'appoint côté caméra (visages et maillots éclairés), pelouse vivante (bandes de tonte qui changent
// selon l'angle, grain du gazon de près), public dessiné (silhouettes qui s'assoient, applaudissent, se lèvent),
// ciel (nuages le jour, étoiles et lune la nuit), faisceaux des projecteurs la nuit.

// pelouse : bandes de tonte qui s'inversent selon d'où on regarde, et grain du gazon près de la caméra
function g3GrassShader(m) {
  m.onBeforeCompile = s => {
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGw;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvGw = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vGw;\nfloat gHash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }')
      .replace('#include <map_fragment>', `#include <map_fragment>
      { float band = mod(floor((vGw.x + 52.5) / 5.8333), 2.0) * 2.0 - 1.0; vec3 vd = normalize(cameraPosition - vGw); float sd = clamp(vd.x * 2.5, -1.0, 1.0);
        float dist = length(cameraPosition - vGw), near = 1.0 - smoothstep(12.0, 55.0, dist);
        float n = gHash(floor(vGw.xz * 9.0)) * .6 + gHash(floor(vGw.xz * 23.0)) * .4;
        diffuseColor.rgb *= (1.0 + 0.075 * band * sd) * mix(1.0, 0.9 + 0.2 * n, near); }`);
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
function g3SkyExtras(S3, night, wet, snow, rnd) {
  G3.clouds = null;
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
  cl.renderOrder = -1; S3.add(cl); G3.clouds = t;
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
