// ---------- Décors autour du stade : terrain, route éclairée, chemin forestier, forêt de chênes et de sapins, sous-bois ----------
// Arbres et plantes : « Oak trees pack » de LOLIPOP et « a forest (3) with a road at night » de dasy444 (CC BY 4.0),
// préparés par tools/decor3d.py. Le terrain, la route et les lampadaires sont dessinés ici. Les chênes changent de feuillage
// avec la saison du match (printemps, été, automne, fin d'automne, hiver) et tous les feuillages bougent au vent.
const G3DC = { model: null, loading: null, fail: false, tex: {}, wind: { uT: { value: 0 } } };
function g3DcLoad() {
  if (G3DC.model || G3DC.loading || G3DC.fail) return G3DC.loading;
  if (typeof DECOR_3D === 'undefined' || !DECOR_3D || !DECOR_3D.pieces) { G3DC.fail = true; return null; }
  const J = DECOR_3D, q = typeof MEDIA_H !== 'undefined' && MEDIA_H.decor ? '?h=' + MEDIA_H.decor : '';
  G3DC.loading = fetch('assets/decor/' + J.bin + q).then(r => { if (!r.ok) throw new Error('décor'); return r.arrayBuffer(); })
    .then(buf => {
      const out = {};
      for (const [k, pc] of Object.entries(J.pieces)) out[k] = { unit: pc.unit, size: pc.size, parts: pc.parts.map(p => {
        const g = new THREE.BufferGeometry(), A = p.arr;
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buf, A.pos[0], A.pos[1]), 3));
        g.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(buf, A.nor[0], A.nor[1]), 3, true));
        g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(buf, A.uv[0], A.uv[1]), 2));
        g.setIndex(new THREE.BufferAttribute(new Uint16Array(buf, A.idx[0], A.idx[1]), 1)); g.computeBoundingSphere();
        return { tex: p.tex, alpha: p.alpha, geo: g };
      }) };
      G3DC.model = out; return out;
    }).catch(() => { G3DC.fail = true; return null; });
  return G3DC.loading;
}
// texture du dossier assets/decor (chargée une seule fois ; se met à jour toute seule une fois l'image arrivée)
function g3DcTex(name) {
  if (G3DC.tex[name]) return G3DC.tex[name];
  const J = DECOR_3D, f = J.tex[name], q = typeof MEDIA_H !== 'undefined' && MEDIA_H.decor ? '?h=' + MEDIA_H.decor : '';
  const t = new THREE.Texture(); t.encoding = THREE.sRGBEncoding; t.flipY = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = G3.r ? Math.min(4, G3.r.capabilities.getMaxAnisotropy()) : 1;
  if (f) { const im = new Image(); im.onload = () => { t.image = im; t.needsUpdate = true; }; im.src = 'assets/decor/' + f + q; }
  G3DC.tex[name] = t; return t;
}
// saison du match (mois de la date du jeu) → feuillage des chênes et couleur des prés
function g3DcSeason(C) {
  if (C.snow) return 'hiver';
  const m = C.mo != null ? C.mo : (typeof today === 'function' ? today().getMonth() : 5);
  return m === 11 || m <= 1 ? 'hiver' : m <= 3 ? 'printemps' : m <= 7 ? 'ete' : m <= 9 ? 'automne' : 'fin_automne';
}
function g3DcMat(p, season, night) {
  const tn = p.tex === 'feuilles' ? 'feuilles_' + season : p.tex, K = tn + (night ? 'n' : 'd') + (p.alpha ? 'a' : '');
  if (G3DC['_m' + K]) return G3DC['_m' + K];
  const m = new THREE.MeshLambertMaterial({ map: g3DcTex(tn), side: p.alpha ? THREE.DoubleSide : THREE.FrontSide, alphaTest: p.alpha ? .42 : 0, color: night ? 0x8a93a0 : 0xffffff });
  if (p.alpha) m.onBeforeCompile = s => { // le feuillage se balance au vent (plus fort en haut de l'arbre)
    s.uniforms.uT = G3DC.wind.uT;
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;').replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat gPh = instanceMatrix[3].x * 0.07 + instanceMatrix[3].z * 0.05;\n#else\nfloat gPh = 0.0;\n#endif\nfloat gW = max(0.0, position.y) * 0.012; transformed.x += sin(uT * 1.2 + gPh) * gW; transformed.z += cos(uT * 0.9 + gPh * 1.7) * gW * 0.6;');
  };
  G3DC['_m' + K] = m; return m;
}
// terrain et route : dessinés tout de suite (sans fichier), les arbres arrivent avec g3DcDress
function g3DcGround(S3, cls, C, rnd) {
  const night = !!C.night, season = g3DcSeason(C), low = g3Low();
  const E = [[66, 50], [72, 57], [80, 66], [95, 80]][cls], zr = -(E[1] + 22);
  // prés autour du stade (couleur selon la saison, neige l'hiver)
  const base = C.snow ? ['#dfe6e8', '#cdd6d9', '#eef3f4'] : { printemps: ['#4d7a33', '#41692b', '#5e8a3c'], ete: ['#4a7232', '#3d6229', '#5a8139'], automne: ['#55703a', '#485f30', '#6b7a3f'], fin_automne: ['#5d653c', '#4e5532', '#6e6e44'], hiver: ['#56614a', '#4a5440', '#646c55'] }[season];
  const [gc, gx] = g3Canvas(256, 256); gx.fillStyle = base[0]; gx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { gx.fillStyle = base[1 + (i % 2)]; gx.globalAlpha = .25 + rnd() * .35; const r = 1 + rnd() * 5; gx.beginPath(); gx.arc(rnd() * 256, rnd() * 256, r, 0, 7); gx.fill(); }
  gx.globalAlpha = .18; for (let i = 0; i < 260; i++) { gx.fillStyle = C.snow ? '#b8c2c6' : '#7a6a4a'; gx.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 3, 1 + rnd() * 3); } gx.globalAlpha = 1;
  const gt = g3Tex(gc, [300, 300]), gg = new THREE.PlaneGeometry(3600, 3600, 72, 72), gn = gg.attributes.position.count, gcol = new Float32Array(gn * 3);
  for (let i = 0; i < gn; i++) { const x = gg.attributes.position.getX(i), y = gg.attributes.position.getY(i), n = .5 + .5 * Math.sin(x * .021 + Math.sin(y * .013) * 2.1) * Math.cos(y * .017 - x * .006), f = .82 + n * .3 + (rnd() - .5) * .08; gcol[i * 3] = f * (C.snow ? 1 : 1.02); gcol[i * 3 + 1] = f; gcol[i * 3 + 2] = f * (C.snow ? 1 : .94); }
  gg.setAttribute('color', new THREE.BufferAttribute(gcol, 3));
  const ground = new THREE.Mesh(gg, new THREE.MeshLambertMaterial({ map: gt, vertexColors: true, color: night ? 0x56606b : 0xffffff })); ground.rotation.x = -Math.PI / 2; ground.position.y = -.04; ground.receiveShadow = false; S3.add(ground);
  // grands stades : parvis en béton autour de l'enceinte
  if (cls >= 2) { // en 4 bandes autour de la pelouse (jamais par-dessus)
    const X = E[0] + 8, Z = E[1] + 8, gx2 = 62.5, gz2 = 44, pm2 = new THREE.MeshLambertMaterial({ color: night ? 0x3b3f45 : 0x9a9a96, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    for (const [w2, d2, x2, z2] of [[2 * X, Z - gz2, 0, (Z + gz2) / 2], [2 * X, Z - gz2, 0, -(Z + gz2) / 2], [X - gx2, 2 * gz2, (X + gx2) / 2, 0], [X - gx2, 2 * gz2, -(X + gx2) / 2, 0]]) { const pv = new THREE.Mesh(new THREE.PlaneGeometry(w2, d2), pm2); pv.rotation.x = -Math.PI / 2; pv.position.set(x2, -.03, z2); S3.add(pv); }
  }
  // route goudronnée derrière la tribune principale : bandes blanches, accotements, lampadaires
  const [rc, rx] = g3Canvas(128, 256); rx.fillStyle = '#3a3c3f'; rx.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 900; i++) { rx.fillStyle = rnd() < .5 ? '#2f3134' : '#45484b'; rx.fillRect(rnd() * 128, rnd() * 256, 1 + rnd() * 2, 1 + rnd() * 2); }
  rx.fillStyle = '#d9d9d2'; rx.fillRect(4, 0, 4, 256); rx.fillRect(120, 0, 4, 256); rx.fillRect(62, 0, 4, 150); // rives continues, ligne médiane pointillée
  const rt = g3Tex(rc); rt.wrapS = rt.wrapT = THREE.RepeatWrapping; rt.repeat.set(1, 1600 / 14);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 1600), new THREE.MeshLambertMaterial({ map: rt, color: night ? 0x8a929c : 0xffffff, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); road.rotation.set(-Math.PI / 2, 0, Math.PI / 2); road.position.set(0, -.02, zr); S3.add(road);
  for (const s of [-1, 1]) { const sh = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1.6), new THREE.MeshLambertMaterial({ color: C.snow ? 0xc9d0d2 : night ? 0x4a4436 : 0x8a7c5e, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); sh.rotation.x = -Math.PI / 2; sh.position.set(0, -.025, zr + s * 4.5); S3.add(sh); }
  const lamps = [], step = 32; for (let x = -320; x <= 320; x += step) lamps.push([x + 6, zr - 5.2]);
  const pole = g3Merge([new THREE.CylinderGeometry(.08, .12, 8, 6).translate(0, 4, 0), new THREE.BoxGeometry(.12, .12, 2.2).translate(0, 7.9, 1.05), new THREE.BoxGeometry(.5, .16, .9).translate(0, 7.8, 2.0)]);
  const pm = new THREE.InstancedMesh(pole, new THREE.MeshLambertMaterial({ color: night ? 0x3a3f45 : 0x6c7278 }), lamps.length), m4 = new THREE.Matrix4();
  lamps.forEach(([x, z], i) => { m4.makeTranslation(x, 0, z); pm.setMatrixAt(i, m4); }); S3.add(pm);
  if (night) { const hm = new THREE.InstancedMesh(new THREE.BoxGeometry(.42, .04, .8).translate(0, 7.71, 2.0), new THREE.MeshBasicMaterial({ color: 0xffe3a6 }), lamps.length); lamps.forEach(([x, z], i) => { m4.makeTranslation(x, 0, z); hm.setMatrixAt(i, m4); }); S3.add(hm); if (!low) for (const [x, z] of lamps) if (Math.abs(x) < 220) g3Glow(S3, x, 7.6, z + 2, 7, '#ffd9a0'); }
  // chemin forestier (texture du modèle) qui part de la route dans les bois
  const cx0 = 42, [pc, px] = g3Canvas(512, 512), pt = g3Tex(pc), img = new Image();
  img.onload = () => { px.drawImage(img, 0, 0, 512, 512); px.globalCompositeOperation = 'destination-in'; const gr = px.createRadialGradient(256, 256, 120, 256, 256, 256); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); px.fillStyle = gr; px.fillRect(0, 0, 512, 512); px.globalCompositeOperation = 'source-over'; pt.needsUpdate = true; };
  if (typeof DECOR_3D !== 'undefined' && DECOR_3D && DECOR_3D.tex && DECOR_3D.tex.chemin && !C.snow) { img.src = 'assets/decor/' + DECOR_3D.tex.chemin + (typeof MEDIA_H !== 'undefined' && MEDIA_H.decor ? '?h=' + MEDIA_H.decor : '');
    const path = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), new THREE.MeshLambertMaterial({ map: pt, transparent: true, depthWrite: false, color: night ? 0x7f8a96 : 0xffffff, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); path.rotation.x = -Math.PI / 2; path.position.set(cx0, -.015, zr - 21); S3.add(path); }
  return { E, zr, season, path: [cx0, zr - 21] };
}
// forêt et sous-bois (quand les arbres sont chargés)
function g3DcDress(S3) {
  const U = S3 && S3.userData, D = U && U.deco; if (!D || U.decoDone) return;
  const md = G3DC.model; if (!md) { if (G3DC.fail) U.decoDone = true; else g3DcLoad(); return; }
  U.decoDone = true;
  try {
    const { E, zr, season, night, low, seed } = D; let rs = seed * 7919 + 13; const rnd = () => (rs = (rs * 9301 + 49297) % 233280) / 233280;
    if (D.treeG) { S3.remove(D.treeG); g3Dispose(D.treeG); D.treeG = null; }
    const out = (x, z, m) => Math.abs(x) > E[0] + m || Math.abs(z) > E[1] + m;
    const free = (x, z) => out(x, z, 6) && Math.abs(z - zr) > 8.5 && !(Math.abs(x - D.path[0]) < 9 && z < zr - 4 && z > zr - 40);
    const inst = {}; const add = (k, x, z, s, ry) => (inst[k] = inst[k] || []).push([x, z, s, ry]);
    // arbres : forêt dense au-delà de la route, bosquets ailleurs ; plus clairsemé en allant vers l'horizon
    const N = low ? 150 : 300; let tries = 0, n = 0;
    while (n < N && tries++ < N * 30) {
      const a = rnd() * Math.PI * 2, r = 40 + Math.pow(rnd(), .75) * 340, x = Math.cos(a) * r, z = Math.sin(a) * r * .85;
      if (!free(x, z)) continue;
      const forest = z < zr - 8.5;
      if (!forest && rnd() > .45) continue; // moins d'arbres autour du stade qu'en forêt
      const near = Math.hypot(x, z) < 170, u = rnd();
      const k = near ? (u < .1 ? 'chene_a' : u < .17 ? 'chene_b' : u < .33 ? 'chene_c' : u < .45 ? 'chene_d' : u < .5 ? 'chene_e' : 'sapin') : (u < .05 ? 'chene_a' : u < .14 ? 'chene_c' : 'sapin');
      add(k, x, z, k === 'sapin' ? 11 + rnd() * 11 : .8 + rnd() * .45, rnd() * Math.PI * 2); n++;
      // sous-bois au pied des arbres proches
      if (near && !low) { const c = 1 + Math.floor(rnd() * 3); for (let i = 0; i < c; i++) { const bx = x + (rnd() - .5) * 9, bz = z + (rnd() - .5) * 9; if (!free(bx, bz)) continue; const v = rnd(); add(v < .45 ? 'herbe' : v < .75 ? 'fougere' : 'buisson', bx, bz, v < .45 ? .45 + rnd() * .35 : v < .75 ? .7 + rnd() * .5 : 1.1 + rnd() * .9, rnd() * 7); } }
    }
    // touffes d'herbe et buissons le long du stade et de la route
    const tufts = low ? 90 : 260; for (let i = 0; i < tufts; i++) {
      const side = rnd(); let x, z;
      if (side < .55) { const t = rnd() * 2 - 1, f = rnd() < .5; x = f ? t * (E[0] + 4) : Math.sign(rnd() - .5) * (E[0] + 3 + rnd() * 6); z = f ? Math.sign(rnd() - .5) * (E[1] + 3 + rnd() * 6) : t * (E[1] + 4); }
      else { x = (rnd() - .5) * 400; z = zr + Math.sign(rnd() - .5) * (5.5 + rnd() * 2.5); }
      if (!out(x, z, 2) || Math.abs(z - zr) < 4.6) continue;
      const v = rnd(); add(v < .7 ? 'herbe' : v < .88 ? 'fougere' : 'buisson', x, z, v < .7 ? .4 + rnd() * .35 : .6 + rnd() * .6, rnd() * 7);
    }
    // un maillage instancié par pièce, par matériau et par secteur (6 parts de gâteau autour du stade) :
    // chaque secteur a sa propre sphère englobante, la caméra ne dessine que les secteurs qu'elle voit
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
    const sector = (x, z) => Math.floor((Math.atan2(z, x) + Math.PI) / (Math.PI * 2) * 6) % 6;
    for (const [k, all] of Object.entries(inst)) {
      const pc = md[k]; if (!pc) continue;
      const h = pc.unit === 'h' ? 1 : pc.size[1], rad = Math.max(pc.size[0], pc.size[2]) / (pc.unit === 'h' ? 1 : 1) * .6;
      for (let sct = 0; sct < 6; sct++) {
        const list = all.filter(([x, z]) => sector(x, z) === sct); if (!list.length) continue;
        let cx = 0, cz = 0, sm = 0; for (const [x, z, s] of list) { cx += x; cz += z; sm = Math.max(sm, s); } cx /= list.length; cz /= list.length;
        let r = 0; for (const [x, z] of list) r = Math.max(r, Math.hypot(x - cx, z - cz)); r += (rad + h) * sm;
        for (const p of pc.parts) {
          const g = new THREE.BufferGeometry(); for (const a of ['position', 'normal', 'uv']) g.setAttribute(a, p.geo.attributes[a]); g.setIndex(p.geo.index);
          g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, h * sm / 2, cz), r);
          const im = new THREE.InstancedMesh(g, g3DcMat(p, season, night), list.length);
          list.forEach(([x, z, s, ry], i) => { q.setFromAxisAngle(Y, ry); m4.compose(v.set(x, 0, z), q, sc.set(s, s, s)); im.setMatrixAt(i, m4); });
          S3.add(im);
        }
      }
    }
    D.count = Object.fromEntries(Object.entries(inst).map(([k, l]) => [k, l.length]));
  } catch (e) { console.warn('décor 3D', e); }
}
