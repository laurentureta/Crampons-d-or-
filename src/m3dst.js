// ---------- Stade : vraies pièces 3D (mâts d'éclairage, sièges, bancs de touche) + clôtures et pare-ballons ----------
// Les pièces viennent du modèle « football stade » de mohamed ouartassi (CC-BY 4.0), préparé par tools/stade3d.py :
// chaque objet est ramené à sa taille réelle et le jeu les place lui-même autour de son terrain.
// Le stade du match est d'abord construit avec des formes simples ; dès que le fichier (60 Ko) est là, on « l'habille ».
const G3ST = { model: null, loading: null, fail: false };
function g3StLoad() {
  if (G3ST.model || G3ST.loading || G3ST.fail) return G3ST.loading;
  if (typeof STADE_3D === 'undefined' || !STADE_3D || !STADE_3D.pieces) { G3ST.fail = true; return null; }
  const J = STADE_3D, q = typeof MEDIA_H !== 'undefined' && MEDIA_H.stade ? '?h=' + MEDIA_H.stade : '';
  G3ST.loading = fetch('assets/stade/' + J.bin + q).then(r => { if (!r.ok) throw new Error('stade'); return r.arrayBuffer(); })
    .then(buf => {
      const out = {};
      for (const [name, parts] of Object.entries(J.pieces)) out[name] = parts.map(p => {
        const g = new THREE.BufferGeometry(), A = p.arr;
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buf, A.pos[0], A.pos[1]), 3));
        g.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(buf, A.nor[0], A.nor[1]), 3, true));
        g.setIndex(new THREE.BufferAttribute(new Uint16Array(buf, A.idx[0], A.idx[1]), 1)); g.computeBoundingBox(); g.computeBoundingSphere();
        return { mat: p.mat, col: new THREE.Color(p.col[0], p.col[1], p.col[2]), geo: g };
      });
      G3ST.model = out; return out;
    }).catch(() => { G3ST.fail = true; return null; });
  return G3ST.loading;
}
// gradins en marches (petits stades) : une marche par rang, le dessus clair, la contremarche plus sombre
function g3Terraces(len, dep, h0, h1, rows, night) {
  const P = [], N = [], C = [], rd = dep / rows, top = new THREE.Color(night ? 0x3a3f46 : 0x6c7177), rise = new THREE.Color(night ? 0x23272e : 0x474c53);
  const quad = (a, b, c, d, n, col) => { for (const v of [a, b, c, a, c, d]) { P.push(...v); N.push(...n); C.push(col.r, col.g, col.b); } };
  let y0 = h0;
  for (let r = 0; r < rows; r++) {
    const y = h0 + (h1 - h0) * (r + .5) / rows, zf = -r * rd, zb = -(r + 1) * rd, x = len / 2;
    quad([-x, y0, zf], [x, y0, zf], [x, y, zf], [-x, y, zf], [0, 0, 1], rise);
    quad([-x, y, zf], [x, y, zf], [x, y, zb], [-x, y, zb], [0, 1, 0], top);
    y0 = y;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = !g3Low(); return m;
}
// textures de grillage (losanges) et de filet pare-ballons (mailles carrées)
function g3StTex(kind) {
  const K = '_t' + kind; if (G3ST[K]) return G3ST[K];
  const [c, x] = g3Canvas(64, 64); x.clearRect(0, 0, 64, 64);
  if (kind === 'panneau') { x.fillStyle = 'rgba(196,204,208,.95)'; x.fillRect(0, 0, 3, 64); x.fillRect(0, 0, 64, 2.5); x.fillRect(0, 32, 64, 2.5); }
  else if (kind === 'grille') { x.strokeStyle = 'rgba(176,186,182,.95)'; x.lineWidth = 3.2; x.beginPath(); x.moveTo(0, 32); x.lineTo(32, 0); x.lineTo(64, 32); x.lineTo(32, 64); x.closePath(); x.stroke(); }
  else { x.strokeStyle = 'rgba(28,40,34,.95)'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, 61, 61); }
  const t = g3Tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; G3ST[K] = t; return t;
}
// clôtures des petits stades
//  - stade amateur (moins de 900 spectateurs) : le city-stade du modèle — muret, panneaux grillagés de 6 m tout autour,
//    lisses horizontales et poteaux, mâts d'éclairage dans les coins (voir g3StDress), écran du score sur la clôture ;
//  - stade moyen : grands filets pare-ballons derrière les buts.
function g3StFence(S3, cls, night) {
  const low = g3Low(), metal = new THREE.MeshLambertMaterial({ color: night ? 0x3d464c : 0x6d787e }), posts = [], tubes = [];
  const panel = (kind, x1, z1, x2, z2, y0, y1, cell, step, op) => {
    const L = Math.hypot(x2 - x1, z2 - z1), g = new THREE.PlaneGeometry(L, y1 - y0); g.rotateY(-Math.atan2(z2 - z1, x2 - x1)); g.translate((x1 + x2) / 2, (y0 + y1) / 2, (z1 + z2) / 2);
    const t = g3StTex(kind).clone(); t.needsUpdate = true; t.repeat.set(L / cell, (y1 - y0) / cell);
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: t, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: op })); m.renderOrder = 2; S3.add(m);
    const n = Math.max(1, Math.round(L / step)); for (let i = 0; i <= n; i++) posts.push([x1 + (x2 - x1) * i / n, z1 + (z2 - z1) * i / n, y1]);
  };
  if (cls === 0) {
    const X = 59, Z = 40.5, H = 6, sides = [[-X, -Z, X, -Z], [-X, Z, X, Z], [-X, -Z, -X, Z], [X, -Z, X, Z]];
    // muret en béton au pied de la clôture
    const wall = new THREE.MeshLambertMaterial({ color: night ? 0x4a4e54 : 0x9a9c9e }), wg = [];
    for (const [x1, z1, x2, z2] of sides) { const L = Math.hypot(x2 - x1, z2 - z1) + .3, b = new THREE.BoxGeometry(L, 1, .25); b.rotateY(-Math.atan2(z2 - z1, x2 - x1)); b.translate((x1 + x2) / 2, .5, (z1 + z2) / 2); wg.push(b); }
    const wm = new THREE.Mesh(g3Merge(wg), wall); wm.receiveShadow = !low; S3.add(wm);
    // panneaux grillagés + lisses (en bas, au milieu, en haut)
    for (const [x1, z1, x2, z2] of sides) { panel('panneau', x1, z1, x2, z2, 1, H, .2, 2.5, .8); for (const y of [1.05, 3.5, H]) tubes.push([x1, z1, x2, z2, y]); }
  } else if (cls === 1) for (const s of [-1, 1]) panel('filet', s * 61, -24, s * 61, 24, 0, 10, .14, 6, .5);
  if (tubes.length) {
    const geos = []; for (const [x1, z1, x2, z2, y] of tubes) { const L = Math.hypot(x2 - x1, z2 - z1), g = new THREE.CylinderGeometry(.04, .04, L, 5, 1, true); g.rotateZ(Math.PI / 2); g.rotateY(-Math.atan2(z2 - z1, x2 - x1)); g.translate((x1 + x2) / 2, y, (z1 + z2) / 2); geos.push(g); }
    S3.add(new THREE.Mesh(g3Merge(geos), metal));
  }
  if (posts.length) {
    const pm = new THREE.InstancedMesh(new THREE.CylinderGeometry(.05, .06, 1, 6).translate(0, .5, 0), metal, posts.length), m4 = new THREE.Matrix4(), v = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
    posts.forEach(([x, z, h], i) => { m4.compose(v.set(x, 0, z), q, sc.set(1, h, 1)); pm.setMatrixAt(i, m4); }); S3.add(pm);
  }
  if (cls === 1 && !low) for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 48, 4, 1, true).rotateX(Math.PI / 2), metal); c.position.set(s * 61, 10, 0); S3.add(c); }
}
// banc de touche : deux modules de 10 sièges du modèle, abri en polycarbonate
function g3Dugout(S3, md, x, z, night) {
  const g = new THREE.Group(); g.position.set(x, 0, z); S3.add(g);
  for (const p of md.banc) { const mat = g3StMat(p, night); for (const dx of [-1.37, 1.37]) { const m = new THREE.Mesh(p.geo, mat); m.position.x = dx; m.castShadow = !g3Low(); g.add(m); } }
  const frame = new THREE.MeshLambertMaterial({ color: night ? 0x30353c : 0x50575f }), poly = new THREE.MeshStandardMaterial({ color: 0xd6ecf7, transparent: true, opacity: .32, roughness: .15, metalness: 0, side: THREE.DoubleSide, depthWrite: false });
  const back = new THREE.Mesh(new THREE.BoxGeometry(5.9, 2.2, .06), frame); back.position.set(0, 1.1, -.72); g.add(back);
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(5.9, 1.75), poly); roof.rotation.x = -Math.PI / 2 + .16; roof.position.set(0, 2.08, .12); g.add(roof);
  for (const sx of [-1, 1]) { const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.1), poly); sg.rotation.y = Math.PI / 2; sg.position.set(sx * 2.95, 1.05, .1); g.add(sg); const bar = new THREE.Mesh(new THREE.BoxGeometry(.06, 2.15, .06), frame); bar.position.set(sx * 2.95, 1.07, .92); g.add(bar); }
  const fb = new THREE.Mesh(new THREE.BoxGeometry(5.96, .07, .07), frame); fb.position.set(0, 1.94, .96); g.add(fb);
  return g;
}
function g3StMat(p, night) {
  const K = '_m' + p.mat + (night ? 'n' : 'd'); if (G3ST[K]) return G3ST[K];
  let m;
  if (p.mat === 'light_cold') m = night ? new THREE.MeshBasicMaterial({ color: 0xfffbea }) : new THREE.MeshStandardMaterial({ color: 0xc9d0d8, roughness: .3, metalness: .1, emissive: 0x20262c });
  else m = new THREE.MeshStandardMaterial({ color: p.col.clone(), roughness: /metal/i.test(p.mat) ? .5 : .6, metalness: /metal/i.test(p.mat) ? .35 : 0 });
  G3ST[K] = m; return m;
}
// habille le stade du match dès que les pièces sont chargées (appelé à chaque image, ne fait rien une fois fait)
function g3StDress(S3) {
  const U = S3 && S3.userData, st = U && U.st; if (!st || U.dressed) return;
  const md = G3ST.model; if (!md) { if (G3ST.fail) U.dressed = true; else g3StLoad(); return; }
  U.dressed = true;
  try {
    const { cls, night } = st, low = g3Low(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
    // mâts d'éclairage du modèle, projecteurs tournés vers le rond central
    if (cls <= 2 && md.pylone) {
      if (st.mastG) { S3.remove(st.mastG); g3Dispose(st.mastG); st.mastG = null; }
      const pts = cls === 0 ? [[-56.5, -38], [56.5, -38], [-56.5, 38], [56.5, 38]] : [[-66, -52], [66, -52], [-66, 52], [66, 52]], H = cls === 0 ? 18 : cls === 1 ? 29 : 40;
      const head = md.pylone.find(p => p.mat === 'light_cold'), hc = head ? head.geo.boundingBox.getCenter(new THREE.Vector3()) : new THREE.Vector3(0, .97, 0);
      for (const p of md.pylone) {
        const im = new THREE.InstancedMesh(p.geo, g3StMat(p, night), pts.length);
        pts.forEach(([x, z], i) => { q.setFromAxisAngle(Y, Math.atan2(-x, -z)); m4.compose(v.set(x, 0, z), q, sc.set(H, H, H)); im.setMatrixAt(i, m4); });
        im.castShadow = false; S3.add(im);
      }
      G3.lamps = pts.map(([x, z]) => { const a = Math.atan2(-x, -z), c = Math.cos(a), s = Math.sin(a); return [x + (hc.x * c + hc.z * s) * H, hc.y * H, z + (-hc.x * s + hc.z * c) * H]; });
      if (night) for (const [x, y, z] of G3.lamps) g3Glow(S3, x * .985, y, z * .985, cls === 0 ? 13 : cls === 1 ? 22 : 28);
    }
    // sièges des tribunes (petits stades) : un vrai siège coque à chaque place
    const sp = cls === 0 ? md.siege : md.siege_b, n = st.seats ? st.seats.length / 4 : 0;
    if (sp && n && !(low && cls === 1)) for (const p of sp) {
      const mat = new THREE.MeshLambertMaterial({ color: cls === 0 ? p.col : st.seatCol });
      const im = new THREE.InstancedMesh(p.geo, mat, n);
      for (let i = 0; i < n; i++) { const S = st.seats; q.setFromAxisAngle(Y, S[i * 4 + 3]); m4.compose(v.set(S[i * 4], S[i * 4 + 1], S[i * 4 + 2]), q, sc.set(1, 1, 1)); im.setMatrixAt(i, m4); }
      S3.add(im);
    }
    // bancs de touche, de part et d'autre de la ligne médiane (côté tribune principale)
    if (md.banc) for (const x of [-8.6, 8.6]) g3Dugout(S3, md, x, -39.6, night);
  } catch (e) { console.warn('stade 3D', e); }
}
