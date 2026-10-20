#!/usr/bin/env python3
"""Extrait d'un stade 3D (.glb) les pièces réutilisées par le jeu pour construire ses stades.

  python3 tools/stade3d.py stade.glb [--gltfpack chemin/gltfpack]

Le modèle « football stade » (city-stade) mélange les échelles (sièges de 3 m, mâts de 48 m…) :
on n'importe donc pas la scène telle quelle, on en garde les objets réussis, chacun ramené à sa taille réelle,
et le jeu les place lui-même autour de son terrain (assets/stade/) :
- pylone : un mât d'éclairage complet (hauteur normalisée à 1, projecteurs tournés vers +z) ;
- siege  : un siège coque (en mètres, face vers +z) — instancié pour garnir les tribunes ;
- siege_b : le même, très allégé (tribunes plus grandes, vu de loin) ;
- banc   : un module de 10 sièges sur son châssis (en mètres, face vers +z) — les bancs de touche.
Clôtures, buts, filets et pelouse sont redessinés par le jeu (plus légers, et animés).
Les maillages sont simplifiés avec gltfpack (meshoptimizer) : variable GLTFPACK ou --gltfpack.
Besoin : numpy, Pillow.
"""
import argparse, io, json, math, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from joueur3d import read_glb, accessor, node_mat

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets', 'stade')
SEAT_W = .46  # largeur réelle d'un siège coque (m)

def simplify(gp, src, ratio, extra):
    fd, dst = tempfile.mkstemp(suffix='.glb'); os.close(fd)
    subprocess.run([gp, '-i', src, '-o', dst, '-si', str(ratio), *extra, '-noq', '-kn', '-km'], check=True, stdout=subprocess.DEVNULL)
    return dst

def prims(path):
    """Toutes les primitives triangulées, en coordonnées monde : (nom du nœud, matériau, P, N, I)."""
    js, b = read_glb(path); nodes = js['nodes']; par = {}
    for i, n in enumerate(nodes):
        for c in n.get('children', []): par[c] = i
    W = {}
    def w(i):
        if i not in W: W[i] = (w(par[i]) if i in par else np.eye(4)) @ node_mat(nodes[i])
        return W[i]
    out = []
    for i, n in enumerate(nodes):
        if 'mesh' not in n: continue
        M = w(i)
        for pr in js['meshes'][n['mesh']]['primitives']:
            if pr.get('mode', 4) != 4: continue
            mat = js['materials'][pr['material']] if 'material' in pr else {'name': '-'}
            P = accessor(js, b, pr['attributes']['POSITION']).astype(np.float64) @ M[:3, :3].T + M[:3, 3]
            N = accessor(js, b, pr['attributes']['NORMAL']).astype(np.float64) @ np.linalg.inv(M[:3, :3]) if 'NORMAL' in pr['attributes'] else np.zeros_like(P)
            N /= np.maximum(1e-9, np.linalg.norm(N, axis=1, keepdims=True))
            I = accessor(js, b, pr['indices']).reshape(-1).astype(np.int64) if 'indices' in pr else np.arange(len(P))
            if np.linalg.det(M[:3, :3]) < 0: I = I.reshape(-1, 3)[:, ::-1].reshape(-1)
            out.append((n.get('name') or '', mat, P, N, I))
    return js, b, out

def mat_color(js, b, mat):
    """Couleur de base (linéaire) : facteur × moyenne de la texture si elle existe."""
    pbr = mat.get('pbrMetallicRoughness', {}); col = np.array(pbr.get('baseColorFactor', [1, 1, 1, 1])[:3], dtype=float)
    t = (pbr.get('baseColorTexture') or {}).get('index')
    if t is not None:
        im = js['images'][js['textures'][t]['source']]; bv = js['bufferViews'][im['bufferView']]; o = bv.get('byteOffset', 0)
        px = np.asarray(Image.open(io.BytesIO(b[o:o + bv['byteLength']])).convert('RGB').resize((16, 16)), dtype=float) / 255
        col = col * (px.reshape(-1, 3) ** 2.2).mean(0)
    return [round(float(v), 4) for v in col], round(float(pbr.get('roughnessFactor', 1)), 2), round(float(pbr.get('metallicFactor', 1)), 2)

def rot_y(P, a):
    c, s = math.cos(a), math.sin(a); R = np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]]); return P @ R.T

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('glb'); ap.add_argument('--gltfpack', default=os.environ.get('GLTFPACK', 'gltfpack'))
    a = ap.parse_args()
    js0, _ = read_glb(a.glb); ex = (js0.get('asset') or {}).get('extras') or {}
    tours = simplify(a.gltfpack, a.glb, .03, ['-sp', '-se', '0.03'])   # ~1 700 triangles par mât
    sieges = simplify(a.gltfpack, a.glb, .02, ['-sa'])                 # ~200 triangles par siège
    loin = simplify(a.gltfpack, a.glb, .004, ['-sa'])                  # ~40 triangles par siège (vu de loin)
    pieces = {}
    # --- mât d'éclairage : celui du coin (+x, +z) ---
    js, b, L = prims(tours)
    lamps = [p for p in L if p[0].startswith('lamp_tall')]
    corner = max({p[0].split('_')[2] for p in lamps}, key=lambda k: sum(p[2].mean(0)[0] + p[2].mean(0)[2] for p in lamps if p[0].split('_')[2] == k))
    tw = [p for p in lamps if p[0].split('_')[2] == corner]
    allP = np.concatenate([p[2] for p in tw]); y0, y1 = allP[:, 1].min(), allP[:, 1].max(); H = y1 - y0
    foot = allP[allP[:, 1] < y0 + .02 * H]; base = (foot.min(0) + foot.max(0)) / 2
    head = np.concatenate([p[2] for p in tw if p[1].get('name') == 'light_cold']); hs = head.max(0) - head.min(0)
    face = np.array([-np.sign(base[0]), 0, 0]) if hs[0] < hs[2] else np.array([0, 0, -np.sign(base[2])])  # projecteurs tournés vers le terrain
    ang = -math.atan2(face[0], face[2])
    pieces['pylone'] = [(m, rot_y((P - [base[0], y0, base[2]]) / H, ang), rot_y(N, ang), I, js, b) for _, m, P, N, I in tw]
    print(f'mât {corner} : hauteur modèle {H:.1f}, face {face}')
    # --- sièges et banc : le module de droite ---
    def module(path):
        js, b, L = prims(path)
        keep = ('PlasticRAL3018', 'MetalPaint_RAL5010', 'MetalPaint_RAL5010_riffl')
        unit = [p for p in L if p[1].get('name') in keep and p[2].mean(0)[0] > 0]
        allP = np.concatenate([p[2] for p in unit]); lo, hi = allP.min(0), allP.max(0)
        seats = [p for p in unit if p[1].get('name') == 'PlasticRAL3018']
        sw = np.median([p[2].max(0)[0] - p[2].min(0)[0] for p in seats]); s = SEAT_W / sw
        # le rang du fond est plus haut et plus loin en z : les spectateurs regardent vers -z → demi-tour
        tr = lambda P, cc: rot_y((P - cc) * s, math.pi)
        one = min(seats, key=lambda p: (round(p[2].mean(0)[2]), p[2].mean(0)[0])); olo, ohi = one[2].min(0), one[2].max(0)
        siege = [(one[1], tr(one[2], [(olo[0] + ohi[0]) / 2, olo[1], (olo[2] + ohi[2]) / 2]), rot_y(one[3], math.pi), one[4], js, b)]
        banc = [(m, tr(P, [(lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2]), rot_y(N, math.pi), I, js, b) for _, m, P, N, I in unit]
        print(f'siège : {sw:.2f} → {SEAT_W} m (échelle {s:.3f}) ; banc {((hi - lo) * s).round(2)} m')
        return siege, banc
    pieces['siege'], pieces['banc'] = module(sieges)
    pieces['siege_b'], _ = module(loin)  # version très allégée pour les grandes tribunes
    # --- écriture : un matériau = une partie, indices 16 bits ---
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT): os.remove(os.path.join(OUT, f))
    blob, out = bytearray(), {}
    def put(arr):
        r = [len(blob), int(arr.size)]; blob.extend(arr.tobytes()); blob.extend(b'\0' * ((-len(blob)) % 4)); return r
    for name, parts in pieces.items():
        groups = {}
        for m, P, N, I, js_, b_ in parts:
            g = groups.setdefault(m.get('name'), {'m': m, 'js': js_, 'b': b_, 'P': [], 'N': [], 'I': [], 'n': 0})
            g['P'].append(P); g['N'].append(N); g['I'].append(I + g['n']); g['n'] += len(P)
        out[name] = []
        for mn, g in groups.items():
            P = np.concatenate(g['P']); N = np.concatenate(g['N']); I = np.concatenate(g['I'])
            assert len(P) < 65536
            col, rough, metal = mat_color(g['js'], g['b'], g['m'])
            out[name].append({'mat': mn, 'col': col, 'rough': rough, 'metal': metal, 'tris': int(len(I) // 3),
                              'arr': {'pos': put(P.astype(np.float32)), 'nor': put(np.round(N * 127).astype(np.int8)), 'idx': put(I.astype(np.uint16))}})
        bb = np.concatenate([np.asarray(p[1]) for p in parts]); print(f'  {name}: {sum(e["tris"] for e in out[name])} triangles, taille {(bb.max(0) - bb.min(0)).round(2)}')
    open(os.path.join(OUT, 'stade.bin'), 'wb').write(bytes(blob))
    info = {'name': ex.get('title', 'Stade'), 'auteur': ex.get('author', ''), 'licence': ex.get('license', ''), 'source': ex.get('source', ''), 'bin': 'stade.bin', 'pieces': out}
    json.dump(info, open(os.path.join(OUT, 'stade.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    for f in (tours, sieges, loin): os.remove(f)
    print('fichiers :', {f: os.path.getsize(os.path.join(OUT, f)) // 1024 for f in sorted(os.listdir(OUT))}, 'Ko')

if __name__ == '__main__':
    main()
