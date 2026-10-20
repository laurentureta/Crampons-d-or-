#!/usr/bin/env python3
"""Prépare les décors autour du stade (forêt, sous-bois) à partir de deux modèles Sketchfab (CC BY 4.0).

  python3 tools/decor3d.py --chenes oak_trees_pack.glb --foret a_forest_with_a_road.glb

- chênes : « Oak trees pack (17var, LODs, seasons) » de LOLIPOP — 5 arbres (version allégée LOD2, déjà en mètres),
  avec les feuillages des 5 saisons (printemps, été, début et fin d'automne, hiver) ;
- forêt : « a forest (3) with a road at night » de dasy444 — le sapin, une touffe d'herbe, un buisson, une fougère
  (tailles normalisées à 1 : le jeu choisit la hauteur), l'atlas de feuillages et la texture du chemin forestier.
Le jeu les plante lui-même autour du stade (src/m3ddeco.js). Sortie : assets/decor/ (decor.bin, decor.json, textures).
Besoin : numpy, Pillow (avec WebP).
"""
import argparse, io, json, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from joueur3d import read_glb, accessor, node_mat

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets', 'decor')

def world(js):
    nodes = js['nodes']; par = {}
    for i, n in enumerate(nodes):
        for c in n.get('children', []): par[c] = i
    W = {}
    def w(i):
        if i not in W: W[i] = (w(par[i]) if i in par else np.eye(4)) @ node_mat(nodes[i])
        return W[i]
    return w

def prim(js, b, w, i, pr):
    M = w(i); P = accessor(js, b, pr['attributes']['POSITION']).astype(np.float64) @ M[:3, :3].T + M[:3, 3]
    N = accessor(js, b, pr['attributes']['NORMAL']).astype(np.float64) @ np.linalg.inv(M[:3, :3]) if 'NORMAL' in pr['attributes'] else np.tile([0., 1., 0.], (len(P), 1))
    N /= np.maximum(1e-9, np.linalg.norm(N, axis=1, keepdims=True))
    UV = accessor(js, b, pr['attributes']['TEXCOORD_0']).astype(np.float64) if 'TEXCOORD_0' in pr['attributes'] else np.zeros((len(P), 2))
    I = accessor(js, b, pr['indices']).reshape(-1).astype(np.int64) if 'indices' in pr else np.arange(len(P))
    if np.linalg.det(M[:3, :3]) < 0: I = I.reshape(-1, 3)[:, ::-1].reshape(-1)
    return P, N, UV, I

def image(js, b, tex_index):
    src = js['textures'][tex_index]['source']; im = js['images'][src]; bv = js['bufferViews'][im['bufferView']]; o = bv.get('byteOffset', 0)
    return Image.open(io.BytesIO(b[o:o + bv['byteLength']]))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--chenes', required=True); ap.add_argument('--foret', required=True); a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT): os.remove(os.path.join(OUT, f))
    pieces, tex, credits = {}, {}, []
    def save(name, img, size, fmt):
        img = img.copy(); img.thumbnail((size, size), Image.LANCZOS); fn = name + ('.webp' if fmt == 'webp' else '.jpg')
        if fmt == 'webp': img.convert('RGBA').save(os.path.join(OUT, fn), 'WEBP', quality=82, method=6)
        else: img.convert('RGB').save(os.path.join(OUT, fn), 'JPEG', quality=84, optimize=True)
        tex[name] = fn
    # ---------- chênes ----------
    js, b = read_glb(a.chenes); w = world(js); mats = js['materials']; ex = js.get('asset', {}).get('extras', {})
    credits.append({'nom': ex.get('title', ''), 'auteur': ex.get('author', ''), 'licence': ex.get('license', ''), 'source': ex.get('source', '')})
    pick = {'chene_a': 'Big_oak_tree__002_LOD2', 'chene_b': 'Big_oak_tree__001_LOD2', 'chene_c': 'Medium_oak_tree__002_LOD2', 'chene_d': 'Medium_oak_tree__003_LOD2', 'chene_e': 'Small_oak_tree__002_LOD2'}
    for key, pref in pick.items():
        parts = []
        for i, n in enumerate(js['nodes']):
            if 'mesh' not in n or not (n.get('name') or '').startswith(pref + '_'): continue
            for pr in js['meshes'][n['mesh']]['primitives']:
                mn = mats[pr['material']]['name']; P, N, UV, I = prim(js, b, w, i, pr)
                parts.append({'tex': 'ecorce_chene' if mn == 'Bark_Mat' else 'feuilles', 'alpha': mn != 'Bark_Mat', 'P': P, 'N': N, 'UV': UV, 'I': I})
        allP = np.concatenate([p['P'] for p in parts]); bark = np.concatenate([p['P'] for p in parts if not p['alpha']])
        foot = bark[bark[:, 1] < bark[:, 1].min() + .3]; c = [(foot[:, 0].min() + foot[:, 0].max()) / 2, allP[:, 1].min(), (foot[:, 2].min() + foot[:, 2].max()) / 2]
        for p in parts: p['P'] = p['P'] - c
        pieces[key] = {'unit': 'm', 'parts': parts}
    cl = {m['name']: m for m in mats}
    for nm, mn in (('feuilles_ete', 'Cluster_Mat'), ('feuilles_printemps', 'Cluster_Mat_Spring_EX'), ('feuilles_automne', 'Cluster_Mat_Early_autumn_EX'), ('feuilles_fin_automne', 'Cluster_Mat_Late_Autumn_EX'), ('feuilles_hiver', 'Cluster_Mat_Winter_EX')):
        save(nm, image(js, b, cl[mn]['pbrMetallicRoughness']['baseColorTexture']['index']), 1024, 'webp')
    save('ecorce_chene', image(js, b, cl['Bark_Mat']['pbrMetallicRoughness']['baseColorTexture']['index']), 512, 'jpg')
    # ---------- forêt : sapins, herbe, buisson, fougère ----------
    js, b = read_glb(a.foret); w = world(js); mats = js['materials']; ex = js.get('asset', {}).get('extras', {})
    credits.append({'nom': ex.get('title', ''), 'auteur': ex.get('author', ''), 'licence': ex.get('license', ''), 'source': ex.get('source', '')})
    byname = {}
    for i, n in enumerate(js['nodes']):
        if 'mesh' not in n: continue
        byname.setdefault((n.get('name') or '').split('_')[0].split('.')[0][:12], []).append(i)
    def grab(i):
        parts = []
        ids = i if isinstance(i, list) else [i]
        for pr, i in [(pr, i) for i in ids for pr in js['meshes'][js['nodes'][i]['mesh']]['primitives']]:
            mn = mats[pr['material']]['name']; P, N, UV, I = prim(js, b, w, i, pr)
            parts.append({'tex': 'ecorce_sapin' if mn == 'Material.004' else 'foret', 'alpha': mn == 'Material', 'P': P, 'N': N, 'UV': UV, 'I': I})
        allP = np.concatenate([p['P'] for p in parts]); lo, hi = allP.min(0), allP.max(0); H = hi[1] - lo[1]
        base = allP[allP[:, 1] < lo[1] + .05 * H]; c = [(base[:, 0].min() + base[:, 0].max()) / 2, lo[1], (base[:, 2].min() + base[:, 2].max()) / 2]
        for p in parts: p['P'] = (p['P'] - c) / H
        return {'unit': 'h', 'parts': parts}
    # un sapin = un nœud « Cylinder.xxx » avec deux enfants (tronc, branches)
    trees = [n['children'] for n in js['nodes'] if (n.get('name') or '').startswith('Cylinder') and 'mesh' not in n and len(n.get('children', [])) == 2]
    pieces['sapin'] = grab(trees[len(trees) // 2])  # les 85 sapins du modèle sont des copies du même arbre
    def first_with_uv(group, u, v):
        for i in byname[group]:
            for pr in js['meshes'][js['nodes'][i]['mesh']]['primitives']:
                if mats[pr['material']]['name'] != 'Material': continue
                uv = accessor(js, b, pr['attributes']['TEXCOORD_0']); cu, cv = (uv.min(0) + uv.max(0)) / 2
                if abs(cu - u) < .03 and abs(cv - v) < .03: return i
        return byname[group][0]
    pieces['herbe'] = grab(first_with_uv('Plane', .14, .14))
    pieces['buisson'] = grab(byname['05ade0e71389'][0])
    pieces['fougere'] = grab(byname['3f84aea6648a'][0])
    fm = {m['name']: m for m in mats}
    save('foret', image(js, b, fm['Material']['pbrMetallicRoughness']['baseColorTexture']['index']), 1024, 'webp')
    save('ecorce_sapin', image(js, b, fm['Material.004']['pbrMetallicRoughness']['baseColorTexture']['index']), 256, 'jpg')
    save('chemin', image(js, b, fm['Material.003']['pbrMetallicRoughness']['baseColorTexture']['index']), 1024, 'jpg')
    # ---------- écriture ----------
    blob, out = bytearray(), {}
    def put(arr):
        r = [len(blob), int(arr.size)]; blob.extend(arr.tobytes()); blob.extend(b'\0' * ((-len(blob)) % 4)); return r
    for key, pc in pieces.items():
        groups = {}
        for p in pc['parts']:
            g = groups.setdefault(p['tex'], {'alpha': p['alpha'], 'P': [], 'N': [], 'UV': [], 'I': [], 'n': 0})
            g['P'].append(p['P']); g['N'].append(p['N']); g['UV'].append(p['UV']); g['I'].append(p['I'] + g['n']); g['n'] += len(p['P'])
        out[key] = {'unit': pc['unit'], 'parts': []}
        for t, g in groups.items():
            P = np.concatenate(g['P']); I = np.concatenate(g['I']); assert len(P) < 65536
            out[key]['parts'].append({'tex': t, 'alpha': g['alpha'], 'tris': int(len(I) // 3), 'arr': {'pos': put(P.astype(np.float32)), 'nor': put(np.round(np.concatenate(g['N']) * 127).astype(np.int8)),
                                      'uv': put(np.concatenate(g['UV']).astype(np.float32)), 'idx': put(I.astype(np.uint16))}})
        allP = np.concatenate([np.concatenate(g['P']) for g in groups.values()])
        out[key]['size'] = [round(float(v), 3) for v in allP.max(0) - allP.min(0)]
        print(f'  {key}: {sum(p["tris"] for p in out[key]["parts"])} triangles, taille {out[key]["size"]} ({pc["unit"]})')
    open(os.path.join(OUT, 'decor.bin'), 'wb').write(bytes(blob))
    json.dump({'bin': 'decor.bin', 'tex': tex, 'credits': credits, 'pieces': out}, open(os.path.join(OUT, 'decor.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print('fichiers :', {f: os.path.getsize(os.path.join(OUT, f)) // 1024 for f in sorted(os.listdir(OUT))}, 'Ko')

if __name__ == '__main__':
    main()
