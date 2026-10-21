#!/usr/bin/env python3
"""Prépare les trophées 3D (.glb) pour le jeu : assets/trophees/trophees.json + trophees.bin.

  python3 tools/trophee3d.py media-raw/trophees/ballon_dor.glb ballon_dor

Chaque trophée est posé à plat (base à y = 0), centré, ramené à une hauteur de 1 (le jeu choisit sa taille),
ses matériaux résumés (couleur, rugosité, métal). Positions en entiers 16 bits (échelle commune),
normales en 8 bits, indices 16 bits par morceau : le Ballon d'Or (≈ 33 000 sommets) tient en ~700 Ko.
Besoin : numpy.
"""
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from joueur3d import read_glb, accessor, node_mat

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets', 'trophees')

def prims(js, b):
    nodes = js['nodes']; par = {}
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
            out.append((mat, P, N, I))
    return out

def main():
    if len(sys.argv) < 3: print(__doc__); sys.exit(1)
    src, name = sys.argv[1], sys.argv[2]
    js, b = read_glb(src); ex = (js.get('asset') or {}).get('extras') or {}
    parts = prims(js, b)
    allP = np.concatenate([p[1] for p in parts]); lo, hi = allP.min(0), allP.max(0)
    h = hi[1] - lo[1]; c = (lo + hi) / 2
    os.makedirs(OUT, exist_ok=True)
    jp = os.path.join(OUT, 'trophees.json'); J = json.load(open(jp)) if os.path.exists(jp) else {'bin': 'trophees.bin', 'items': {}}
    # on reconstruit le binaire à partir de tous les trophées déjà préparés + celui-ci
    blobs = {}
    if os.path.exists(os.path.join(OUT, J['bin'])):
        old = open(os.path.join(OUT, J['bin']), 'rb').read()
        for k, it in J['items'].items():
            if k != name: blobs[k] = (it, old)
    buf = bytearray(); items = {}
    def put(arr):
        while len(buf) % 4: buf.append(0)
        o = len(buf); buf.extend(arr.tobytes()); return [o, int(arr.size)]
    for k, (it, old) in blobs.items():
        nparts = []
        for p in it['parts']:
            q = dict(p); A = p['arr']; arr = {}
            for key, dt in (('pos', np.int16), ('nor', np.int8), ('idx', np.uint16)):
                o, n = A[key]; arr[key] = put(np.frombuffer(old, dt, count=n, offset=o))
            q['arr'] = arr; nparts.append(q)
        items[k] = dict(it, parts=nparts)
    S = 32767 / 0.6  # positions normalisées dans [-0.6, 0.6] × hauteur 1
    nparts = []
    for mat, P, N, I in parts:
        Q = (P - [c[0], lo[1], c[2]]) / h  # base à 0, hauteur 1
        Q[:, 1] -= .5                       # centré pour la quantification, recalé au chargement (oy)
        pbr = mat.get('pbrMetallicRoughness', {}); col = [round(float(v), 4) for v in pbr.get('baseColorFactor', [1, 1, 1, 1])[:3]]
        if len(P) > 65535: raise SystemExit('morceau trop gros pour des indices 16 bits')
        arr = {'pos': put(np.clip(np.round(Q * S), -32767, 32767).astype(np.int16).reshape(-1)),
               'nor': put(np.clip(np.round(N * 127), -127, 127).astype(np.int8).reshape(-1)),
               'idx': put(I.astype(np.uint16))}
        nparts.append({'mat': mat.get('name', '-'), 'col': col, 'rough': round(float(pbr.get('roughnessFactor', 1)), 3), 'metal': round(float(pbr.get('metallicFactor', 1)), 3), 'arr': arr})
    items[name] = {'name': ex.get('title', name), 'auteur': ex.get('author', ''), 'licence': ex.get('license', ''), 'source': ex.get('source', ''), 'qs': 0.6 / 32767, 'oy': .5, 'parts': nparts}
    open(os.path.join(OUT, J['bin']), 'wb').write(bytes(buf))
    J['items'] = items; json.dump(J, open(jp, 'w'), ensure_ascii=False, indent=1)
    print(name, len(nparts), 'morceaux,', sum(len(p[1]) for p in parts), 'sommets,', len(buf) // 1024, 'Ko (', ex.get('author', ''), ')')

if __name__ == '__main__': main()
