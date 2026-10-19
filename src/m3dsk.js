// ===================== 3D : joueurs « skinnés » (un vrai modèle 3D, un seul dessin pour les 25 joueurs) =====================
// Le squelette est celui de g3Pose : bassin, buste, tête, bras (3 os), jambes (3 os) — 15 os.
// Chaque frame, g3Pose écrit la matrice monde de chaque os ; on la multiplie par l'inverse de la pose de repos du modèle
// et on range tout dans une texture lue par le shader (une ligne par joueur).
const G3_NB = 15, G3_SKW = G3_NB * 4 + 6; // par joueur : 15 os (4 texels chacun) + 6 couleurs (peau, maillot, short, chaussettes, crampons, cheveux)
const G3SK = { model: null, mesh: null, tex: null, data: null, out: null, N: 0, loading: null, standIn: false, fail: false };
// matrice d'os -> case du tableau (appelé par g3Pose)
function g3SkPut(out, n, b, m) { out.set(m.elements, (n * G3_NB + b) * 16); }
// --- modèle de remplacement (le corps actuel, chaque pièce collée à son os) : sert aux tests du pipeline ---
function g3SkStandIn() {
  const B = g3Body(), parts = [[B.torso, 1, 1], [B.shorts, 0, 2], [B.head, 2, 0], [B.hair, 2, 5],
    [B.uarm, 3, 1], [B.ubare, 3, 0], [B.farm, 4, 0], [B.hand, 5, 0], [B.uarm, 6, 1], [B.ubare, 6, 0], [B.farm, 7, 0], [B.hand, 8, 0],
    [B.thigh, 9, 0], [B.shin, 10, 3], [B.boot, 11, 4], [B.thigh, 12, 0], [B.shin, 13, 3], [B.boot, 14, 4]];
  let n = 0; const geos = parts.map(([g]) => g.index ? g.toNonIndexed() : g); for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), bi = new Float32Array(n * 4), bw = new Float32Array(n * 4), reg = new Float32Array(n), shade = new Float32Array(n);
  let o = 0;
  geos.forEach((g, k) => { const c = g.attributes.position.count, [, bone, r] = parts[k]; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
    const col = g.attributes.color; for (let i = 0; i < c; i++) { bi[(o + i) * 4] = bone; bw[(o + i) * 4] = 1; reg[o + i] = r; shade[o + i] = col ? col.getX(i) : 1; } o += c; });
  const bind = []; for (let b = 0; b < G3_NB; b++) bind.push(new THREE.Matrix4()); // pièces déjà dans le repère de leur os
  return { pos, nor, uv, bi, bw, reg, shade, bind, map: null, name: 'remplacement' };
}
// --- vrai modèle : assets/joueur/joueur.json + joueur.bin (+ textures), préparé par tools/joueur3d.py ---
function g3SkLoad() {
  if (G3SK.model || G3SK.loading || G3SK.fail) return G3SK.loading;
  if (typeof JOUEUR_3D === 'undefined' || !JOUEUR_3D || !JOUEUR_3D.parts) { G3SK.fail = true; return null; }
  const J = JOUEUR_3D, base = 'assets/joueur/', q = typeof MEDIA_H !== 'undefined' && MEDIA_H['joueur'] ? '?h=' + MEDIA_H['joueur'] : '';
  const img = f => f ? new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = base + f + q; }) : Promise.resolve(null);
  const tex = (im, srgb) => { if (!im) return null; const t = new THREE.Texture(im); t.encoding = srgb ? THREE.sRGBEncoding : THREE.LinearEncoding; t.flipY = false; t.anisotropy = 4; t.needsUpdate = true; return t; };
  G3SK.loading = fetch(base + J.bin + q).then(r => { if (!r.ok) throw new Error('modèle'); return r.arrayBuffer(); })
    .then(buf => Promise.all(J.parts.map(p => Promise.all([img(p.map), img(p.nmap)]).then(([m, n]) => {
      const f = k => { const a = p.arr[k]; return a ? new Float32Array(buf, a[0], a[1]) : null; };
      return { name: p.name, alpha: !!p.alpha, pos: f('pos'), nor: f('nor'), uv: f('uv'), bi: f('bi'), bw: f('bw'), reg: f('reg'), idx: p.arr.idx ? new Uint32Array(buf, p.arr.idx[0], p.arr.idx[1]) : null, map: tex(m, true), nmap: tex(n, false) };
    }))))
    .then(parts => { G3SK.model = { parts, bind: J.bind.map(e => new THREE.Matrix4().fromArray(e)), rig: J.rig, lum: J.lum || [.5, .5, .5, .5, .5, .5], name: J.name }; return G3SK.model; })
    .catch(() => { G3SK.fail = true; return null; });
  return G3SK.loading;
}
// --- maillages instanciés (un par pièce : corps, cheveux) + matériau qui fait le skinning à partir de la texture d'os ---
function g3SkMesh(sc, N, model) {
  const parts = model.parts || [model], meshes = [];
  const data = new Float32Array(N * G3_SKW * 4), tex = new THREE.DataTexture(data, G3_SKW, N, THREE.RGBAFormat, THREE.FloatType); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.needsUpdate = true;
  const lum = model.lum || [.5, .5, .5, .5, .5, .5];
  const U = { uBones: { value: tex }, uTex: { value: new THREE.Vector2(G3_SKW, N) }, uLum: { value: lum.slice(0, 6) } };
  const head = 'attribute vec4 aBi; attribute vec4 aBw; attribute float aReg; attribute float aShade; attribute float aPid;\nuniform sampler2D uBones; uniform vec2 uTex; uniform float uLum[6]; varying vec3 vTint; varying float vRec; varying float vShade; varying float vLum; varying float vSkinR;\n' +
    'mat4 g3Bone(float b){ float x = b * 4.0, y = (aPid + 0.5) / uTex.y; return mat4(texture2D(uBones, vec2((x + 0.5) / uTex.x, y)), texture2D(uBones, vec2((x + 1.5) / uTex.x, y)), texture2D(uBones, vec2((x + 2.5) / uTex.x, y)), texture2D(uBones, vec2((x + 3.5) / uTex.x, y))); }\n';
  const SK = 'mat4 gSk = g3Bone(aBi.x) * aBw.x + g3Bone(aBi.y) * aBw.y + g3Bone(aBi.z) * aBw.z + g3Bone(aBi.w) * aBw.w;\n';
  const TINT = 'float r = floor(aReg + 0.5); vSkinR = r < 0.5 ? 1.0 : 0.0; vShade = aShade; vRec = r > 5.5 ? 0.0 : 1.0; vLum = r < 0.5 ? uLum[0] : r < 1.5 ? uLum[1] : r < 2.5 ? uLum[2] : r < 3.5 ? uLum[3] : r < 4.5 ? uLum[4] : uLum[5]; vTint = r > 5.5 ? vec3(1.0) : texture2D(uBones, vec2((' + (G3_NB * 4) + '.5 + r) / uTex.x, (aPid + 0.5) / uTex.y)).rgb;\n';
  const skinV = s => s.replace('#include <common>', '#include <common>\n' + head)
    .replace('#include <beginnormal_vertex>', SK + 'vec3 objectNormal = normalize((gSk * vec4(normal, 0.0)).xyz);\n#ifdef USE_TANGENT\nvec3 objectTangent = vec3(tangent.xyz);\n#endif')
    .replace('#include <begin_vertex>', 'vec3 transformed = (gSk * vec4(position, 1.0)).xyz;\n' + TINT);
  const skinD = s => s.replace('#include <common>', '#include <common>\n' + head).replace('#include <begin_vertex>', SK + 'vec3 transformed = (gSk * vec4(position, 1.0)).xyz;\n' + TINT);
  const ia = new THREE.InstancedBufferAttribute(new Float32Array(N), 1); for (let i = 0; i < N; i++) ia.array[i] = i;
  for (const pt of parts) {
    const geo = new THREE.BufferGeometry(), A = (a, k) => new THREE.BufferAttribute(a, k), nv = pt.pos.length / 3;
    geo.setAttribute('position', A(pt.pos, 3)); geo.setAttribute('normal', A(pt.nor, 3)); geo.setAttribute('uv', A(pt.uv && pt.uv.length ? pt.uv : new Float32Array(nv * 2), 2));
    geo.setAttribute('aBi', A(pt.bi, 4)); geo.setAttribute('aBw', A(pt.bw, 4)); geo.setAttribute('aReg', A(pt.reg, 1)); geo.setAttribute('aShade', A(pt.shade || new Float32Array(nv).fill(1), 1)); geo.setAttribute('aPid', ia);
    if (pt.idx) geo.setIndex(A(pt.idx, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: pt.alpha ? .9 : .78, metalness: 0, map: pt.map || null, normalMap: pt.nmap || null, side: pt.alpha ? THREE.DoubleSide : THREE.FrontSide, alphaTest: pt.alpha ? .45 : 0 });
    if (pt.nmap) mat.normalScale = new THREE.Vector2(.9, .9);
    const recol = pt.map ? 'clamp(l / max(.05, vLum), .25, 1.9)' : '1.0';
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U); sh.vertexShader = skinV(sh.vertexShader);
      // recoloration : la texture garde ses détails (plis, coutures), la teinte vient du club / du joueur
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vTint; varying float vRec; varying float vShade; varying float vLum; varying float vSkinR;')
        // sur la peau, on ne teinte que les texels « couleur peau » (le blanc des yeux, les sourcils et les lèvres gardent leur couleur)
        .replace('#include <map_fragment>', '#include <map_fragment>\n{ vec3 c = diffuseColor.rgb; float l = dot(c, vec3(.299, .587, .114)); float k = vRec * mix(1.0, smoothstep(.015, .08, c.r - c.b) * smoothstep(.04, .14, l), vSkinR); diffuseColor.rgb = mix(c, vTint * ' + recol + ', k) * vShade; }');
    };
    const mesh = new THREE.InstancedMesh(geo, mat, N); mesh.frustumCulled = false; mesh.castShadow = true; mesh.receiveShadow = false;
    const id = new THREE.Matrix4(); for (let i = 0; i < N; i++) mesh.setMatrixAt(i, id);
    const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: pt.alpha ? pt.map : null, alphaTest: pt.alpha ? .45 : 0 }); dm.onBeforeCompile = sh => { Object.assign(sh.uniforms, U); sh.vertexShader = skinD(sh.vertexShader); };
    mesh.customDepthMaterial = dm;
    sc.add(mesh); meshes.push(mesh);
  }
  return { mesh: meshes[0], meshes, tex, data, out: new Float32Array(N * G3_NB * 16), bindInv: model.bind.map(m => m.clone().invert()), N, hid: new Uint8Array(N) };
}
// après g3Pose de tous les joueurs : matrices d'os × pose de repos inverse -> texture
const _skM = { a: null, b: null };
function g3SkFlush(K) {
  if (!_skM.a) { _skM.a = new THREE.Matrix4(); _skM.b = new THREE.Matrix4(); }
  const { out, data, bindInv, N } = K, A = _skM.a, Bm = _skM.b;
  for (let n = 0; n < N; n++) { const row = n * G3_SKW * 4; if (K.hid[n]) { data.fill(0, row, row + G3_NB * 16); continue; }
    for (let b = 0; b < G3_NB; b++) { const o = (n * G3_NB + b) * 16; A.fromArray(out, o); Bm.multiplyMatrices(A, bindInv[b]); data.set(Bm.elements, row + b * 16); } }
  K.tex.needsUpdate = true;
}
function g3SkColors(K, n, c) { [c.skin, c.shirt, c.shorts, c.socks, c.boots, c.hair].forEach((v, i) => { const o = (n * G3_SKW + G3_NB * 4 + i) * 4; K.data[o] = v.r; K.data[o + 1] = v.g; K.data[o + 2] = v.b; K.data[o + 3] = 1; }); K.tex.needsUpdate = true; }

// branche le vrai modèle sur la scène du match dès qu'il est chargé (les anciennes pièces restent pour les ombres et la 2D rapide)
function g3SkAttach(P) {
  if (P.sk || G3SK.fail) return;
  const model = G3SK.standIn ? (G3SK.model || (G3SK.model = g3SkStandIn())) : G3SK.model;
  if (!model) { g3SkLoad(); return; }
  try {
    P.sk = g3SkMesh(G3.sc, G3N, model); if (model.rig) G3RIG = Object.assign({}, G3RIG_DEF, model.rig);
    for (const k of ['torso', 'shorts', 'head', 'hair', 'uarm', 'ubare', 'farm', 'hand', 'thigh', 'shin', 'boot']) P[k].visible = false;
    G3.kitKey = null;
  } catch (e) { G3SK.fail = true; P.sk = null; }
}
