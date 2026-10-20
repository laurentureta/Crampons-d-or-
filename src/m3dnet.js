// ---------- Filets de but : une vraie toile qui ondule ----------
// Chaque filet est une grille de nœuds (toit + fond, et deux côtés). Chaque nœud se déplace le long de la normale de la toile
// selon une onde amortie : le ballon qui entre pousse la toile (elle se creuse autour de lui), l'onde se propage puis s'éteint ;
// un ballon qui tombe sur le toit ou frappe le côté de l'extérieur l'enfonce vers l'intérieur ; un léger vent fait respirer le filet.
// Forme « à l'européenne » : toit court, fond incliné jusqu'au sol. Repère local : x = profondeur derrière la ligne, y = hauteur, z = largeur.
const G3NET = { R: 1.0, B: 1.9, H: 2.44, W: 3.66, mesh: .12 };
function g3NetTex() {
  if (G3NET.tex) return G3NET.tex;
  const [c, x] = g3Canvas(64, 64); x.clearRect(0, 0, 64, 64); x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 5; x.strokeRect(0, 0, 64, 64);
  x.fillStyle = '#fff'; for (const [a, b] of [[0, 0], [64, 0], [0, 64], [64, 64]]) { x.beginPath(); x.arc(a, b, 5, 0, 7); x.fill(); } // nœuds
  const t = g3Tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; G3NET.tex = t; return t;
}
// une toile : (nu+1)×(nv+1) nœuds ; f(i, j) → [x, y, z] au repos ; bord fixé (poteaux, barre, sol, coutures)
function g3NetSheet(nu, nv, f, inside, side) {
  const n = (nu + 1) * (nv + 1), rest = new Float32Array(n * 3), nrm = new Float32Array(n * 3), uv = new Float32Array(n * 2), pin = new Uint8Array(n), lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const k = j * (nu + 1) + i, p = f(i, j); rest.set(p.slice(0, 3), k * 3); uv[k * 2] = p[3] / G3NET.mesh; uv[k * 2 + 1] = p[4] / G3NET.mesh; pin[k] = i === 0 || j === 0 || i === nu || j === nv ? 1 : 0; for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], p[a]); hi[a] = Math.max(hi[a], p[a]); } }
  // normales vers l'extérieur du but (différences centrées sur la grille)
  const P = k => [rest[k * 3], rest[k * 3 + 1], rest[k * 3 + 2]];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const k = j * (nu + 1) + i, a = P(j * (nu + 1) + Math.min(nu, i + 1)), b = P(j * (nu + 1) + Math.max(0, i - 1)), c = P(Math.min(nv, j + 1) * (nu + 1) + i), d = P(Math.max(0, j - 1) * (nu + 1) + i);
    const du = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dv = [c[0] - d[0], c[1] - d[1], c[2] - d[2]];
    let x = du[1] * dv[2] - du[2] * dv[1], y = du[2] * dv[0] - du[0] * dv[2], z = du[0] * dv[1] - du[1] * dv[0]; const l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l;
    const p = P(k); if ((p[0] - inside[0]) * x + (p[1] - inside[1]) * y + (p[2] - inside[2]) * z < 0) { x = -x; y = -y; z = -z; }
    nrm[k * 3] = x; nrm[k * 3 + 1] = y; nrm[k * 3 + 2] = z;
  }
  const idx = []; for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  return { nu, nv, n, rest, nrm, uv, pin, idx, d: new Float32Array(n), v: new Float32Array(n), lo, hi, side, sd: 0, off: 0 };
}
// construit le filet d'un but (dans le groupe du but, placé sur la ligne ; s = ±1 : sens vers l'extérieur du terrain)
function g3NetBuild(g, s, low, postM) {
  const { R, B, H, W } = G3NET, h = low ? .3 : .2, sheets = [], inside = [.4, 1, 0];
  // toit + fond : u sur la largeur, v le long du profil (barre → arrière du toit → sol)
  const Lb = Math.hypot(B - R, H), nR = Math.max(2, Math.round(R / h)), nB = Math.max(4, Math.round(Lb / h)), nU = Math.round(2 * W / h);
  const prof = j => { if (j <= nR) return [R * j / nR, H, R * j / nR]; const k = (j - nR) / nB; return [R + (B - R) * k, H * (1 - k), R + k * Lb]; };
  sheets.push(g3NetSheet(nU, nR + nB, (i, j) => { const [x, y, t] = prof(j), z = -W + 2 * W * i / nU; return [x, y, z, z + W, t]; }, inside, 'main'));
  // côtés : a = fraction de profondeur, b = fraction de hauteur (trapèze : B au sol, R en haut)
  const nA = Math.max(4, Math.round(B / h)), nH = Math.max(6, Math.round(H / h));
  for (const sz of [-1, 1]) sheets.push(g3NetSheet(nA, nH, (i, j) => { const y = H * j / nH, dd = B + (R - B) * y / H, x = dd * i / nA; return [x, y, sz * W, x, y]; }, inside, sz));
  // une seule géométrie par filet
  let nv = 0, ni = 0; for (const S of sheets) { S.off = nv; nv += S.n; ni += S.idx.length; }
  const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), index = new (nv > 65535 ? Uint32Array : Uint16Array)(ni); let o = 0;
  for (const S of sheets) { for (let k = 0; k < S.n; k++) { pos[(S.off + k) * 3] = s * S.rest[k * 3]; pos[(S.off + k) * 3 + 1] = S.rest[k * 3 + 1]; pos[(S.off + k) * 3 + 2] = S.rest[k * 3 + 2]; } uv.set(S.uv, S.off * 2); for (const q of S.idx) index[o++] = q + S.off; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(new THREE.BufferAttribute(index, 1)); geo.computeVertexNormals();
  geo.attributes.position.setUsage(THREE.DynamicDrawUsage);
  const mat = new THREE.MeshLambertMaterial({ map: g3NetTex(), transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: .95 });
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = 2; mesh.frustumCulled = false; g.add(mesh);
  // armature : barres du toit, montants arrière inclinés, barre au sol
  const tube = (a, b, r) => { const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d), c = new THREE.CylinderGeometry(r, r, L, 6, 1, true); c.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(d[0] / L, d[1] / L, d[2] / L)))); c.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); return c; };
  const fr = []; for (const z of [-W, W]) { fr.push(tube([0, H, z], [s * R, H, z], .025), tube([s * R, H, z], [s * B, .02, z], .03), tube([0, .02, z], [s * B, .02, z], .025)); }
  fr.push(tube([s * B, .02, -W], [s * B, .02, W], .025)); const fm = new THREE.Mesh(g3Merge(fr), postM); fm.castShadow = !low; g.add(fm);
  return { s, sheets, geo, mesh, t: 0, last: null, wind: 0, live: 2 };
}
// une étape de simulation pour tous les filets : dt = temps de jeu écoulé (ralenti → filet au ralenti, pause → figé)
function g3NetUpdate(dt, bx, by, bz, rb) {
  const nets = G3.nets || []; if (!nets.length) return;
  if (!(dt > 0)) { for (const N of nets) N.last = null; return; }
  const steps = Math.min(12, Math.ceil(dt / (1 / 120))), h = Math.min(dt, .12) / steps, wind = G3.netWind || .6;
  for (const N of nets) {
    // ballon dans le repère du filet (x = profondeur derrière la ligne)
    const lx = (bx - N.s * 52.5) * N.s, ly = by, lz = bz, last = N.last; N.last = [lx, ly, lz];
    const vb = last ? [(lx - last[0]) / dt, (ly - last[1]) / dt, (lz - last[2]) / dt] : [0, 0, 0];
    let touch = false;
    for (const S of N.sheets) {
      const near = lx > S.lo[0] - rb - .7 && lx < S.hi[0] + rb + .7 && ly > S.lo[1] - rb - .7 && ly < S.hi[1] + rb + .7 && lz > S.lo[2] - rb - .7 && lz < S.hi[2] + rb + .7;
      // de quel côté de la toile est le ballon ? (mémorisé tant qu'il est au contact, pour ne pas « traverser »)
      if (!near || S.sd === 0) { const { R, B, H, W } = G3NET; S.sd = S.side === 'main' ? (ly < H && lx < B + (R - B) * Math.max(0, ly) / H && Math.abs(lz) < W + .3 ? -1 : 1) : (S.side * lz < W ? -1 : 1); }
      if (!near) { S.sd = 0; continue; }
      S.near = true;
    }
    for (let st = 0; st < steps; st++) {
      N.t += h; const T = N.t;
      for (const S of N.sheets) {
        const { nu, nv, d, v, pin, rest, nrm } = S, w1 = nu + 1, K = 900, Sk = 28, C = 3.2;
        for (let j = 1; j < nv; j++) for (let i = 1; i < nu; i++) {
          const k = j * w1 + i; if (pin[k]) continue;
          const lap = d[k - 1] + d[k + 1] + d[k - w1] + d[k + w1] - 4 * d[k];
          const y = rest[k * 3 + 1], z = rest[k * 3 + 2], F = wind * (.6 * Math.sin(1.3 * T + .8 * z + .5 * y) + .4 * Math.sin(2.7 * T - 1.7 * z + y));
          v[k] += (K * lap - Sk * d[k] - C * v[k] + F) * h;
        }
        for (let k = 0; k < S.n; k++) if (!pin[k]) { d[k] += v[k] * h; if (d[k] > 1.1) { d[k] = 1.1; v[k] = Math.min(0, v[k]); } else if (d[k] < -.7) { d[k] = -.7; v[k] = Math.max(0, v[k]); } }
        // contact avec le ballon : la toile épouse le ballon (creux en cloche autour du point d'impact)
        if (S.near) {
          const sg = .28 + rb, side = S.sd;
          for (let k = 0; k < S.n; k++) {
            if (pin[k]) continue;
            const ex = lx - rest[k * 3], ey = ly - rest[k * 3 + 1], ez = lz - rest[k * 3 + 2], r2 = ex * ex + ey * ey + ez * ez; if (r2 > 1.6) continue;
            const nx = nrm[k * 3], ny = nrm[k * 3 + 1], nz = nrm[k * 3 + 2], sd = ex * nx + ey * ny + ez * nz, lat2 = Math.max(0, r2 - sd * sd), w = Math.exp(-lat2 / (2 * sg * sg));
            if (w < .02 || (side < 0 ? sd + rb < -.02 : sd - rb > .02)) continue;
            const vn = vb[0] * nx + vb[1] * ny + vb[2] * nz;
            // la toile prend la vitesse du ballon (la moitié : elle freine), ce qui lance l'onde
            if (side < 0) { const tg = (sd + rb) * w; if (d[k] < tg) { d[k] = tg; v[k] = Math.max(v[k], .5 * Math.max(0, vn) * w); touch = true; } }
            else { const tg = (sd - rb) * w; if (d[k] > tg) { d[k] = tg; v[k] = Math.min(v[k], .5 * Math.min(0, vn) * w); touch = true; } }
          }
        }
      }
    }
    for (const S of N.sheets) S.near = false;
    // géométrie (seulement si la toile bouge encore de façon visible)
    let mx = 0; for (const S of N.sheets) for (let k = 0; k < S.n; k++) mx = Math.max(mx, Math.abs(S.d[k]));
    if (mx < .002 && !touch) { if (N.live-- <= 0) continue; } else N.live = 2;
    const pa = N.geo.attributes.position.array;
    for (const S of N.sheets) for (let k = 0; k < S.n; k++) { const o = (S.off + k) * 3, dd = S.d[k]; pa[o] = N.s * (S.rest[k * 3] + S.nrm[k * 3] * dd); pa[o + 1] = S.rest[k * 3 + 1] + S.nrm[k * 3 + 1] * dd; pa[o + 2] = S.rest[k * 3 + 2] + S.nrm[k * 3 + 2] * dd; }
    N.geo.attributes.position.needsUpdate = true; N.geo.computeVertexNormals();
  }
}
