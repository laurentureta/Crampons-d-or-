#!/usr/bin/env python3
"""Prépare un modèle 3D de joueur « riggé » (fichier .glb, squelette type Mixamo) pour le jeu.

  python3 tools/joueur3d.py modele.glb [--nom ...] [--auteur ...] [--licence ...] [--source URL] [--apercu vue.png]

Pour alléger le modèle avant (conseillé, 25 000 triangles environ) :
  gltfpack -i modele.glb -o leger.glb -si 0.5 -noq -kn -km     (gltfpack : github.com/zeux/meshoptimizer)

Écrit dans assets/joueur/ : joueur.bin (géométrie), corps.jpg + corps_n.jpg (couleur + relief), cheveux.png, joueur.json.
Le squelette du modèle est ramené aux 15 os du jeu (ceux de g3Pose) : les mouvements du jeu (course, frappes, plongeons,
célébrations) s'appliquent tels quels. Les vêtements sont repérés par le nom des pièces (Shirt, Shorts, Socks, Shoes, Hair…)
pour être recolorés aux couleurs de chaque club. Besoin : numpy, Pillow, scipy.
"""
import argparse, io, json, math, os, re, struct
import numpy as np
from PIL import Image
from scipy.spatial import cKDTree

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets', 'joueur')
H = 1.84  # taille du joueur dans le jeu (m)
CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
# os du modèle -> os du jeu : 0 bassin 1 buste 2 tête 3-5 bras gauche 6-8 bras droit 9-11 jambe gauche 12-14 jambe droite
BONE_MAP = [('Hips', 0), ('Spine', 1), ('Neck', 2), ('Head', 2), ('LeftShoulder', 1), ('LeftForeArm', 4), ('LeftArm', 3), ('LeftHand', 5),
            ('RightShoulder', 1), ('RightForeArm', 7), ('RightArm', 6), ('RightHand', 8), ('LeftUpLeg', 9), ('LeftLeg', 10), ('LeftFoot', 11), ('LeftToe', 11),
            ('RightUpLeg', 12), ('RightLeg', 13), ('RightFoot', 14), ('RightToe', 14)]  # par début de nom (les doigts suivent la main, les orteils le pied)
REGION = [(r'shirt|jersey|maillot|top', 1), (r'short', 2), (r'sock|chaussette', 3), (r'shoe|boot|crampon|cleat', 4), (r'hair|eyelash|cheveu|brow', 5), (r'body|skin|head|face|corps', 0)]

def read_glb(path):
    b = open(path, 'rb').read(); magic, ver, ln = struct.unpack('<4sII', b[:12]); assert magic == b'glTF', 'pas un fichier .glb'
    o, js, bin_ = 12, None, b''
    while o < ln:
        cl, ct = struct.unpack('<I4s', b[o:o + 8]); d = b[o + 8:o + 8 + cl]; o += 8 + cl
        if ct == b'JSON': js = json.loads(d)
        elif ct == b'BIN\x00': bin_ = d
    return js, bin_

def accessor(js, bin_, i):
    a = js['accessors'][i]; bv = js['bufferViews'][a['bufferView']]; dt = CT[a['componentType']]; n = NC[a['type']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0); stride = bv.get('byteStride', 0); size = np.dtype(dt).itemsize * n
    if stride and stride != size:
        raw = np.frombuffer(bin_, np.uint8, count=stride * (a['count'] - 1) + size, offset=off)
        arr = np.lib.stride_tricks.as_strided(raw, (a['count'], size), (stride, 1)).copy().view(dt).reshape(a['count'], n)
    else: arr = np.frombuffer(bin_, dt, count=a['count'] * n, offset=off).reshape(a['count'], n).copy()
    if a.get('normalized'): return arr.astype(np.float64) / np.iinfo(dt).max
    return arr

def quat_mat(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])

def node_mat(n):
    if 'matrix' in n: return np.array(n['matrix'], np.float64).reshape(4, 4).T
    M = np.eye(4); M[:3, :3] = quat_mat(n.get('rotation', [0, 0, 0, 1])) @ np.diag(n.get('scale', [1, 1, 1])); M[:3, 3] = n.get('translation', [0, 0, 0]); return M

def image_of(js, bin_, tex):
    if tex is None: return None
    src = js['textures'][tex['index']].get('source'); im = js['images'][src]; bv = js['bufferViews'][im['bufferView']]
    return Image.open(io.BytesIO(bin_[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]))

# --- squelette du jeu (même calcul que g3J / g3Pose) ---
def euler_yzx(rx, ry, rz):
    cx, sx, cy, sy, cz, sz = math.cos(rx), math.sin(rx), math.cos(ry), math.sin(ry), math.cos(rz), math.sin(rz)
    return np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]]) @ np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]]) @ np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])

def J(parent, x, y, z, rx=0, ry=0, rz=0):
    L = np.eye(4); L[:3, :3] = euler_yzx(rx, ry, rz); L[:3, 3] = [x, y, z]; return parent @ L

def skeleton(rig, arm, leg):
    """Matrices monde des 15 os dans la pose de repos du modèle. arm/leg : (écart, avant) en radians pour chaque côté."""
    R = np.eye(4); R[:3, 3] = [0, rig['hp'], 0]
    tor = J(R, 0, rig['torY'], 0); hd = J(tor, 0, rig['neck'], 0); B = [R, tor, hd]
    for k, sd in enumerate((-1, 1)):
        ab, sh = arm[k]; ua = J(tor, 0, rig['shY'], sd * rig['shW'], -sd * ab, 0, sh); fa = J(ua, 0, -rig['ua'], 0); hand = J(fa, 0, -rig['fa'], 0); B += [ua, fa, hand]
    for k, sd in enumerate((-1, 1)):
        ab, hp_ = leg[k]; th = J(R, 0, rig['hipY'], sd * rig['hipW'], -sd * ab, 0, hp_); sn = J(th, 0, -rig['thigh'], 0); ft = J(sn, 0, -rig['shin'], 0); B += [th, sn, ft]
    return B

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('glb'); ap.add_argument('--nom', default=''); ap.add_argument('--auteur', default=''); ap.add_argument('--licence', default=''); ap.add_argument('--source', default='')
    ap.add_argument('--apercu', default=''); ap.add_argument('--tex', type=int, default=1024)
    ap.add_argument('--noms', default='', help='fichier .glb d\'origine, si l\'allègement a effacé le nom des pièces')
    a = ap.parse_args()
    js, bin_ = read_glb(a.glb); ex = (js.get('asset') or {}).get('extras') or {}
    if a.noms:  # noms des pièces repris du fichier d'origine (nœud par nœud)
        jo, _ = read_glb(a.noms); ex = ex or (jo.get('asset') or {}).get('extras') or {}
        byNode = {n.get('name'): jo['meshes'][n['mesh']].get('name', '') for n in jo['nodes'] if 'mesh' in n}
        for n in js['nodes']:
            if 'mesh' in n and not js['meshes'][n['mesh']].get('name') and n.get('name') in byNode: js['meshes'][n['mesh']]['name'] = byNode[n['name']]
    nodes = js['nodes']; parent = {}
    for i, n in enumerate(nodes):
        for c in n.get('children', []): parent[c] = i
    world = {}
    def W(i):
        if i not in world: world[i] = (W(parent[i]) if i in parent else np.eye(4)) @ node_mat(nodes[i])
        return world[i]
    assert js.get('skins'), 'Ce modèle n\'a pas de squelette : il faut un modèle « riggé » (Mixamo ou équivalent).'
    skin = js['skins'][0]; jn = [nodes[j].get('name', '') for j in skin['joints']]
    ibm = accessor(js, bin_, skin['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1) if 'inverseBindMatrices' in skin else np.tile(np.eye(4), (len(jn), 1, 1))
    jw = np.array([W(j) for j in skin['joints']])
    def bone_of(name):
        nm = re.sub(r'_\d+$', '', name.split(':')[-1])
        for pat, b in BONE_MAP:
            if nm.startswith(pat): return b
        return None
    jmap = np.array([bone_of(n) if bone_of(n) is not None else 1 for n in jn]); print('os non reconnus :', [n for n in jn if bone_of(n) is None][:8])
    jpos = {re.sub(r'_\d+$', '', n.split(':')[-1]): jw[i][:3, 3] for i, n in enumerate(jn)}
    # --- pièces : sommets mis dans la pose de repos (comme le moteur 3D du modèle les afficherait) ---
    parts = {}
    for ni, nd in enumerate(nodes):
        if 'mesh' not in nd: continue
        names, k_ = [js['meshes'][nd['mesh']].get('name', ''), nd.get('name', '')], ni
        while k_ in parent: k_ = parent[k_]; names.append(nodes[k_].get('name', ''))  # le nom de la pièce est souvent sur un nœud parent
        mname = ' '.join(names).lower()
        reg = next((r for pat, r in REGION if re.search(pat, js['meshes'][nd['mesh']].get('name', '').lower())), None)
        if reg is None: reg = next((r for nm in names for pat, r in REGION if re.search(pat, nm.lower())), 6)
        for pr in js['meshes'][nd['mesh']]['primitives']:
            at = pr['attributes']; pos = accessor(js, bin_, at['POSITION']).astype(np.float64); nor = accessor(js, bin_, at['NORMAL']).astype(np.float64)
            uv = accessor(js, bin_, at['TEXCOORD_0']).astype(np.float64) if 'TEXCOORD_0' in at else np.zeros((len(pos), 2))
            idx = accessor(js, bin_, pr['indices']).reshape(-1).astype(np.int64)
            jt = accessor(js, bin_, at['JOINTS_0']).astype(np.int64); wt = accessor(js, bin_, at['WEIGHTS_0']).astype(np.float64); wt /= np.maximum(1e-9, wt.sum(1, keepdims=True))
            Sk = np.einsum('vk,vkij->vij', wt, (jw @ ibm)[jt])  # matrice de skinning par sommet
            p4 = np.concatenate([pos, np.ones((len(pos), 1))], 1); P = np.einsum('vij,vj->vi', Sk, p4)[:, :3]
            Nn = np.einsum('vij,vj->vi', Sk[:, :3, :3], nor); Nn /= np.maximum(1e-9, np.linalg.norm(Nn, axis=1, keepdims=True))
            # poids ramenés aux 15 os du jeu
            BW = np.zeros((len(pos), 15)); np.add.at(BW, (np.repeat(np.arange(len(pos)), 4), jmap[jt].reshape(-1)), wt.reshape(-1))
            mat = js['materials'][pr['material']] if 'material' in pr else {}
            hair = mat.get('alphaMode') in ('BLEND', 'MASK') or reg == 5
            key = 'cheveux' if hair else 'corps'
            parts.setdefault(key, []).append({'P': P, 'N': Nn, 'uv': uv, 'idx': idx, 'BW': BW, 'reg': np.full(len(pos), float(reg)), 'mat': mat, 'name': mname})
    allP = np.concatenate([p['P'] for L in parts.values() for p in L])
    # --- orientation : vertical = +y, regard = +x (les orteils sont devant les chevilles) ---
    up = np.array([0, 1, 0.]); spread = allP.max(0) - allP.min(0)
    if np.argmax(spread) != 1: up = np.eye(3)[int(np.argmax(spread))] * (1 if (jpos.get('Head', allP.mean(0)) - jpos.get('Hips', allP.mean(0)))[int(np.argmax(spread))] > 0 else -1)
    fwd = (jpos['LeftToeBase'] + jpos['RightToeBase']) / 2 - (jpos['LeftFoot'] + jpos['RightFoot']) / 2; fwd -= up * (fwd @ up); fwd /= np.linalg.norm(fwd)
    right = np.cross(fwd, up); Rm = np.stack([fwd, up, right])  # nouvelles coordonnées : x = devant, y = haut, z = droite
    def tf(p): return p @ Rm.T
    for L in parts.values():
        for p in L: p['P'] = tf(p['P']); p['N'] = tf(p['N'])
    jp = {k: tf(v) for k, v in jpos.items()}
    allP = np.concatenate([p['P'] for L in parts.values() for p in L]); lo, hi = allP.min(0), allP.max(0)
    s = H / (hi[1] - lo[1]); hipsC = jp['Hips'].copy()
    def norm(p): q = (p - [hipsC[0], lo[1], hipsC[2]]) * s; return q
    for L in parts.values():
        for p in L: p['P'] = norm(p['P'])
    jp = {k: norm(v) for k, v in jp.items()}
    # --- proportions du squelette du jeu, mesurées sur le modèle (moyenne gauche / droite) ---
    dist = lambda a_, b_: float(np.linalg.norm(jp[a_] - jp[b_]))
    avg = lambda f: (f('Left') + f('Right')) / 2
    hp = float(jp['Hips'][1]); spine = jp.get('Spine', jp['Hips'] + [0, .1, 0])
    rig = {'hp': hp, 'hipY': float(avg(lambda s_: jp[s_ + 'UpLeg'][1]) - hp), 'hipW': float(avg(lambda s_: abs(jp[s_ + 'UpLeg'][2]))),
           'thigh': float(avg(lambda s_: dist(s_ + 'UpLeg', s_ + 'Leg'))), 'shin': float(avg(lambda s_: dist(s_ + 'Leg', s_ + 'Foot'))),
           'torY': float(spine[1] - hp), 'shY': float(avg(lambda s_: jp[s_ + 'Arm'][1]) - spine[1]), 'shW': float(avg(lambda s_: abs(jp[s_ + 'Arm'][2]))),
           'ua': float(avg(lambda s_: dist(s_ + 'Arm', s_ + 'ForeArm'))), 'fa': float(avg(lambda s_: dist(s_ + 'ForeArm', s_ + 'Hand'))), 'neck': float(jp['Head'][1] - spine[1])}
    def angles(a_, b_, sd):  # écart (vers l'extérieur) puis avant, dans l'ordre des rotations du jeu
        d = jp[b_] - jp[a_]; d = d / np.linalg.norm(d); ab = math.asin(max(-1, min(1, sd * d[2])))
        return (ab, math.atan2(d[0], -d[1]) if math.cos(ab) > .3 else 0.0)
    arm = [angles('LeftArm', 'LeftForeArm', -1), angles('RightArm', 'RightForeArm', 1)]
    leg = [angles('LeftUpLeg', 'LeftLeg', -1), angles('RightUpLeg', 'RightLeg', 1)]
    # numéro dans le dos : collé au maillot, entre les omoplates
    shirt = np.concatenate([p['P'][p['reg'] == 1] for L in parts.values() for p in L]) if any((p['reg'] == 1).any() for L in parts.values() for p in L) else None
    if shirt is not None:
        yN = hp + rig['torY'] + rig['shY'] * .62; band = shirt[(np.abs(shirt[:, 1] - yN) < .05) & (np.abs(shirt[:, 2]) < .06)]
        if len(band): rig['numX'] = float(band[:, 0].min() - .006); rig['numY'] = float(yN - (hp + rig['torY']))
    print('proportions :', {k: round(v, 3) for k, v in rig.items()})
    print('bras au repos (écart°, avant°) :', [tuple(round(math.degrees(x)) for x in v) for v in arm], ' jambes :', [tuple(round(math.degrees(x)) for x in v) for v in leg])
    B = skeleton(rig, arm, leg)
    # --- textures ---
    os.makedirs(OUT, exist_ok=True); files = {}
    def mat_tex(mat):
        sg = (mat.get('extensions') or {}).get('KHR_materials_pbrSpecularGlossiness') or {}
        base = (mat.get('pbrMetallicRoughness') or {}).get('baseColorTexture') or sg.get('diffuseTexture')
        return image_of(js, bin_, base), image_of(js, bin_, mat.get('normalTexture'))
    out_parts = []; blob = b''; off = 0
    def put(arr):
        nonlocal blob, off
        by = arr.tobytes(); r = [off, int(arr.size)]; blob += by; off += len(by); pad = (-off) % 4; blob += b'\0' * pad; off += pad; return r
    lum = {}
    for key in ('corps', 'cheveux'):
        if key not in parts: continue
        L = parts[key]; base = 0; P, N, UV, IDX, BWs, REG = [], [], [], [], [], []
        for p in L:
            P.append(p['P']); N.append(p['N']); UV.append(p['uv']); IDX.append(p['idx'] + base); BWs.append(p['BW']); REG.append(p['reg']); base += len(p['P'])
        P, N, UV, IDX, BW, REG = map(np.concatenate, (P, N, UV, IDX, BWs, REG))
        # peau cachée sous les vêtements : retirée (moins de triangles à dessiner, pas de peau qui traverse le tissu)
        if key == 'corps':
            cloth = REG != 0; body = ~cloth
            if cloth.any() and body.any():
                d, _ = cKDTree(P[cloth]).query(P, k=1); hidden = body & (d < .022 * (H / 1.84))
                tri = IDX.reshape(-1, 3); keep = ~hidden[tri].all(1); print(f'peau cachée retirée : {(~keep).sum()} triangles sur {len(tri)}'); IDX = tri[keep].reshape(-1)
        top = np.argsort(-BW, 1)[:, :4]; tw = np.take_along_axis(BW, top, 1); tw /= np.maximum(1e-9, tw.sum(1, keepdims=True))
        img, nimg = mat_tex(L[0]['mat'])
        part = {'name': key, 'tris': int(len(IDX) // 3), 'alpha': key == 'cheveux',
                'arr': {'pos': put(P.astype(np.float32)), 'nor': put(N.astype(np.float32)), 'uv': put(UV.astype(np.float32)), 'bi': put(top.astype(np.float32)), 'bw': put(tw.astype(np.float32)), 'reg': put(REG.astype(np.float32)), 'idx': put(IDX.astype(np.uint32))}}
        if img is not None:
            size = a.tex if key == 'corps' else a.tex // 2
            if key == 'cheveux': img.convert('RGBA').resize((size, size), Image.LANCZOS).save(os.path.join(OUT, 'cheveux.png'), optimize=True); part['map'] = 'cheveux.png'
            else:
                im = img.convert('RGB').resize((size, size), Image.LANCZOS); im.save(os.path.join(OUT, 'corps.jpg'), quality=88, optimize=True); part['map'] = 'corps.jpg'
                # luminosité moyenne de chaque zone (pour recolorer sans perdre plis et coutures)
                A_ = np.asarray(im, np.float32) / 255; ah, aw = A_.shape[:2]; cl = A_[np.clip(((UV[:, 1] % 1) * ah).astype(int), 0, ah - 1), np.clip(((UV[:, 0] % 1) * aw).astype(int), 0, aw - 1)]
                l = cl @ np.array([.299, .587, .114])
                for r in range(6):
                    sel = REG == r
                    if sel.any(): lum[r] = float(np.median(l[sel]))
        if nimg is not None and key == 'corps': nimg.convert('RGB').resize((a.tex, a.tex), Image.LANCZOS).save(os.path.join(OUT, 'corps_n.jpg'), quality=92); part['nmap'] = 'corps_n.jpg'
        out_parts.append(part)
    open(os.path.join(OUT, 'joueur.bin'), 'wb').write(blob)
    info = {'name': a.nom or ex.get('title') or 'Joueur', 'auteur': a.auteur or ex.get('author', ''), 'licence': a.licence or ex.get('license', ''), 'source': a.source or ex.get('source', ''),
            'bin': 'joueur.bin', 'parts': out_parts, 'bind': [list(map(float, m.T.reshape(-1))) for m in B], 'rig': {k: round(v, 4) for k, v in rig.items()},
            'lum': [round(lum.get(r, .5), 3) for r in range(6)]}
    json.dump(info, open(os.path.join(OUT, 'joueur.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print('pièces :', [(p['name'], p['tris']) for p in out_parts], '· fichiers :', {f: os.path.getsize(os.path.join(OUT, f)) // 1024 for f in os.listdir(OUT)}, 'Ko')
    if a.apercu:
        from PIL import ImageDraw
        im = Image.new('RGB', (900, 520), (12, 20, 16)); d = ImageDraw.Draw(im); cols = [(230, 180, 140), (60, 120, 255), (240, 240, 240), (90, 200, 90), (255, 200, 40), (60, 40, 30), (160, 160, 160)]
        for vx, (u, v) in enumerate([(2, 1), (0, 1)]):
            ox = 220 + vx * 450; sc = 250 / H
            for L in parts.values():
                for p in L:
                    for q, r in zip(p['P'][::4], p['reg'][::4]): d.point((ox + q[u] * sc, 500 - q[1] * sc), fill=cols[int(r)])
            for m in B: q = m[:3, 3]; d.ellipse((ox + q[u] * sc - 4, 500 - q[1] * sc - 4, ox + q[u] * sc + 4, 500 - q[1] * sc + 4), outline=(255, 60, 60), width=2)
        im.save(a.apercu)

if __name__ == '__main__':
    main()
