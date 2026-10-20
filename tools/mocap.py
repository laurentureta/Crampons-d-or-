#!/usr/bin/env python3
# Animations en vraie capture de mouvement pour les joueurs 3D.
# Source : base de capture de mouvement de Carnegie Mellon (mocap.cs.cmu.edu, conversion BVH de Bruce Hahne,
# copie github.com/una-dinosauria/cmu-mocap) — utilisation libre, y compris dans un jeu.
# Chaque mouvement est ramené sur le squelette du jeu (15 os : bassin, buste, tête, bras ×3, jambes ×3) :
# on ne garde que les orientations des os (les longueurs restent celles du joueur 3D), la hauteur du bassin,
# et pour les célébrations acrobatiques le déplacement du corps. Sortie : assets/anim/anim.json + anim.bin (int16).
# Usage : python3 tools/mocap.py <dossier data de cmu-mocap> [--apercu dossier]
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from bvh import BVH

ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'assets', 'anim')
FPS = 30
LEG = .9  # longueur cuisse + jambe du joueur 3D (m)

# n : nom dans le jeu ; f : capture CMU ; a, b : début et fin (s) ; loop : cycle de course (une foulée extraite) ;
# c : instant du contact (frappe) ; tr : garder le déplacement du corps ; m : aussi en miroir (pied gauche)
CLIPS = [
  dict(n='idle', f='77_02', a=1.0, b=7.0, loop='idle'),
  dict(n='marche', f='35_01', a=.1, b=3.0, loop='gait'),
  dict(n='footing', f='35_17', a=.05, b=1.4, loop='gait'),
  dict(n='course', f='09_02', a=.05, b=1.09, loop='gait'),
  dict(n='course2', f='127_06', a=.05, b=1.45, loop='gait'),
  dict(n='sprint', f='143_01', a=.05, b=.82, loop='gait'),
  dict(n='frappe', f='10_05', a=2.52 - .55, b=2.52 + .55, c=2.52, m=True),
  dict(n='frappe2', f='11_01', a=3.37 - .55, b=3.37 + .55, c=3.37, m=True),
  dict(n='passe', f='10_03', a=1.13 - .45, b=1.13 + .45, c=1.13, m=True),
  dict(n='saut', f='16_01', a=1.26 - .6, b=1.26 + .55, c=1.26),
  dict(n='joie', f='142_09', a=1.6, b=4.6, tr=True),
  dict(n='salto', f='87_03', a=.75, b=2.05, c=1.38, tr=True),
  dict(n='roue', f='49_06', a=1.1, b=3.2, tr=True),
  dict(n='vrille', f='88_06', a=.2, b=1.3, c=.62, tr=True),
  dict(n='danse', f='05_06', a=3.2, b=6.4, tr=True),
]
# os du jeu → index ; parent de chaque os dans le jeu
GB = ['bassin', 'buste', 'tete', 'brasG', 'avbrasG', 'mainG', 'brasD', 'avbrasD', 'mainD', 'cuisseG', 'jambeG', 'piedG', 'cuisseD', 'jambeD', 'piedD']
GP = [-1, 0, 1, 1, 3, 4, 1, 6, 7, 0, 9, 10, 0, 12, 13]

def nrm(v): return v / np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-9)
def orth(v, y): return v - (v * y).sum(-1, keepdims=True) * y
def frame(X, Y):
    # repère d'os : X avant, Y le long de l'os (vers le parent), Z = X × Y (à droite)
    Y = nrm(Y); X = nrm(orth(X, Y)); Z = np.cross(X, Y); return np.stack([X, Y, Z], axis=-1)  # colonnes

def mat2quat(M):
    q = np.zeros(M.shape[:-2] + (4,)); t = M[..., 0, 0] + M[..., 1, 1] + M[..., 2, 2]
    for idx in np.ndindex(M.shape[:-2]):
        m = M[idx]; tr = m[0, 0] + m[1, 1] + m[2, 2]
        if tr > 0: s = np.sqrt(tr + 1) * 2; w = .25 * s; x = (m[2, 1] - m[1, 2]) / s; y = (m[0, 2] - m[2, 0]) / s; z = (m[1, 0] - m[0, 1]) / s
        elif m[0, 0] > m[1, 1] and m[0, 0] > m[2, 2]: s = np.sqrt(1 + m[0, 0] - m[1, 1] - m[2, 2]) * 2; w = (m[2, 1] - m[1, 2]) / s; x = .25 * s; y = (m[0, 1] + m[1, 0]) / s; z = (m[0, 2] + m[2, 0]) / s
        elif m[1, 1] > m[2, 2]: s = np.sqrt(1 + m[1, 1] - m[0, 0] - m[2, 2]) * 2; w = (m[0, 2] - m[2, 0]) / s; x = (m[0, 1] + m[1, 0]) / s; y = .25 * s; z = (m[1, 2] + m[2, 1]) / s
        else: s = np.sqrt(1 + m[2, 2] - m[0, 0] - m[1, 1]) * 2; w = (m[1, 0] - m[0, 1]) / s; x = (m[0, 2] + m[2, 0]) / s; y = (m[1, 2] + m[2, 1]) / s; z = .25 * s
        q[idx] = (x, y, z, w)
    return q

def retarget(b, i0, i1):
    """Repères des 15 os (dans le repère « personnage » : X avant, Y haut, Z droite), hauteur et déplacement du bassin."""
    P = lambda n: b.pos(n)[i0:i1]
    H, LUL, RUL, LK, RK, LA, RA, LT, RT = P('Hips'), P('LeftUpLeg'), P('RightUpLeg'), P('LeftLeg'), P('RightLeg'), P('LeftFoot'), P('RightFoot'), P('LeftToeBase'), P('RightToeBase')
    LB, SP1, NK, NK1, HD = P('LowerBack'), P('Spine1'), P('Neck'), P('Neck1'), P('Head')
    HDE = b.endpos('Head')[i0:i1]
    LS, LE, LW, LF = P('LeftArm'), P('LeftForeArm'), P('LeftHand'), P('LeftFingerBase')
    RS, RE, RW, RF = P('RightArm'), P('RightForeArm'), P('RightHand'), P('RightFingerBase')
    LTE, RTE = b.endpos('LeftToeBase')[i0:i1], b.endpos('RightToeBase')[i0:i1]
    up = np.array([0, 1., 0])
    # bassin
    Zp = nrm(RUL - LUL); Yp = nrm(orth(SP1 - H, Zp)); Xp = np.cross(Yp, Zp); Rp = np.stack([Xp, Yp, Zp], -1)
    Yt = nrm(NK - LB); Zt = nrm(orth(RS - LS, Yt)); Xt = np.cross(Yt, Zt); Rt = np.stack([Xt, Yt, Zt], -1)
    Rh = frame(Xt, HDE - NK1)
    def arm(S, E, W, F):
        Yu = nrm(S - E); bend = orth(W - E, Yu); X = nrm(bend + .15 * nrm(orth(Xt, Yu)) * np.linalg.norm(W - E, axis=-1, keepdims=True))
        Ru = frame(X, Yu); Rf = frame(Ru[..., 0], E - W); Rm = frame(Ru[..., 0], W - F); return Ru, Rf, Rm
    def leg(UL, K, A, T, TE):
        fwd = nrm(TE - A); Yth = nrm(UL - K); kneeF = -orth(A - K, Yth)
        Rth = frame(orth(fwd, Yth) + kneeF * 1.5, Yth); Rsh = frame(fwd, K - A)
        Xf = nrm(TE - A); Rft = frame(Xf, orth(K - A, Xf)); Rft = np.stack([Xf, nrm(orth(K - A, Xf)), np.cross(Xf, nrm(orth(K - A, Xf)))], -1)
        return Rth, Rsh, Rft
    Ra = arm(LS, LE, LW, LF); Rb = arm(RS, RE, RW, RF); La = leg(LUL, LK, LA, LT, LTE); Lb = leg(RUL, RK, RA, RT, RTE)
    W = [Rp, Rt, Rh, *Ra, *Rb, *La, *Lb]
    legLen = np.linalg.norm(b.offset[b.idx['LeftLeg']]) + np.linalg.norm(b.offset[b.idx['LeftFoot']])
    return W, H, (LUL + RUL) / 2, np.minimum(LTE[:, 1], RTE[:, 1]), legLen, LT, RT

def heading(Rp, how='mean'):
    f = Rp[:, :, 0].copy(); f[:, 1] = 0; f = nrm(f)
    v = nrm(f.mean(0)) if how == 'mean' else f[how]
    return np.stack([v, np.array([0, 1., 0]), np.cross(v, np.array([0, 1., 0]))], -1)  # colonnes : avant, haut, droite

def cycle(b, i0, i1):
    # une foulée qui boucle : deux images éloignées d'une période (0,45 à 1,3 s) dont les poses se ressemblent le plus
    W = retarget(b, i0, i1)[0]; Q = np.stack([mat2quat(W[j][::2]) for j in (9, 10, 12, 13, 3, 6)], 1)  # jambes et bras, une image sur deux
    n = len(Q); best = None; lo, hi = int(.45 / (2 * b.dt)), int(1.3 / (2 * b.dt))
    for i in range(0, max(1, n - lo)):
        for j in range(i + lo, min(n, i + hi + 1)):
            d = np.minimum(np.linalg.norm(Q[i] - Q[j], axis=-1), np.linalg.norm(Q[i] + Q[j], axis=-1)).sum() + i * .002
            if best is None or d < best[0]: best = (d, i, j)
    return i0 + best[1] * 2, i0 + best[2] * 2

def build(clip, D):
    s = clip['f'].split('_')[0]; b = BVH(os.path.join(D, '%03d' % int(s), clip['f'] + '.bvh'))
    i0 = max(3, int(round(clip['a'] / b.dt))); i1 = min(b.n, int(round(clip['b'] / b.dt)) + 1)
    if clip.get('loop') == 'gait': i0, i1 = cycle(b, i0, i1)
    W, H, HJ, toeY, legLen, LT, RT = retarget(b, i0, i1)
    n0 = i1 - i0
    # repère de cap : moyenne pour les cycles, au contact pour les frappes, au début pour le reste
    hk = 'mean' if clip.get('loop') else (int(round((clip['c'] - clip['a']) / b.dt)) if clip.get('c') and not clip.get('tr') else 0)
    Hf = heading(W[0], hk); HfT = Hf.T
    Wc = [np.einsum('ij,fjk->fik', HfT, R) for R in W]
    L = []
    for j in range(15):
        L.append(Wc[j] if GP[j] < 0 else np.einsum('fji,fjk->fik', Wc[GP[j]], Wc[j]))
    # hauteur du bassin en mètres du jeu ; sol = plus bas des orteils sur le morceau
    ground = np.percentile(toeY, 3) if clip.get('loop') or not clip.get('tr') else toeY.min()
    k = LEG / legLen
    hy = (HJ[:, 1] - ground) * k + .07
    off = np.einsum('ij,fj->fi', HfT, (H - H[0])) * k
    # rééchantillonnage à 30 images/s (sphérique pour les rotations)
    t = np.arange(n0) * b.dt; dur = t[-1]; m = max(2, int(round(dur * FPS)) + 1); ts = np.linspace(0, dur, m)
    Q = np.stack([mat2quat(Lj) for Lj in L], 1)  # (n0, 15, 4)
    for j in range(15):  # continuité des signes
        for f in range(1, n0):
            if (Q[f, j] * Q[f - 1, j]).sum() < 0: Q[f, j] *= -1
    def lerp(A, x): return np.stack([np.interp(x, t, A[:, i]) for i in range(A.shape[1])], -1)
    Qs = np.stack([nrm(lerp(Q[:, j], ts)) for j in range(15)], 1)
    hs = np.interp(ts, t, hy); os_ = lerp(off, ts)
    # cycles : on referme la boucle en douceur (les dernières images rejoignent la première)
    if clip.get('loop'):
        nb = min(6, m // 4)
        for f in range(nb):
            w = (f + 1) / (nb + 1); src = Qs[m - nb + f]; dst = Qs[0] * np.sign((Qs[0] * src).sum(-1, keepdims=True))
            Qs[m - nb + f] = nrm(src * (1 - w) + dst * w); hs[m - nb + f] = hs[m - nb + f] * (1 - w) + hs[0] * w
    info = dict(n=clip['n'], src='CMU ' + clip['f'], fr=m, dur=round(float(dur), 3))
    if clip.get('loop'): info['loop'] = 1
    if clip.get('c'): info['c'] = round(clip['c'] - clip['a'], 3)
    if clip.get('loop') == 'gait':
        # vitesse (m/s du jeu) et phase où la cuisse gauche est la plus en avant (le jeu y met sin(ph) = 1)
        dist = np.linalg.norm((H[-1] - H[0])[[0, 2]]) * k; info['v'] = round(float(dist / dur), 2)
        info['p0'] = round(float(np.argmax(-np.array([L[9][f][0, 1] for f in range(n0)])) * b.dt / dur), 3)
    if clip.get('tr'): info['tr'] = 1
    return info, Qs, hs, os_

def mirror(Qs, hs, os_):
    # miroir gauche ↔ droite (plan XY du personnage) : quaternion (x, y, z, w) → (-x, -y, z, w), os échangés
    sw = [0, 1, 2, 6, 7, 8, 3, 4, 5, 12, 13, 14, 9, 10, 11]
    Q = Qs[:, sw].copy(); Q[..., 0] *= -1; Q[..., 1] *= -1
    o = os_.copy(); o[:, 2] *= -1
    return Q, hs.copy(), o

def main():
    D = sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/mocap/cmu/data'
    os.makedirs(OUT, exist_ok=True)
    buf, index = [], []
    def put(info, Qs, hs, os_):
        info = dict(info); info['o'] = sum(len(x) for x in buf)
        q16 = np.round(np.clip(Qs, -1, 1) * 32767).astype(np.int16).reshape(-1)
        h16 = np.round(hs * 1000).astype(np.int16); o16 = np.round(np.clip(os_, -30, 30) * 1000).astype(np.int16).reshape(-1)
        buf.append(q16); buf.append(h16); buf.append(o16 if info.get('tr') else np.zeros(0, np.int16)); index.append(info)
    for c in CLIPS:
        info, Qs, hs, os_ = build(c, D); put(info, Qs, hs, os_)
        if c.get('m'): mi = dict(info); mi['n'] = c['n'] + '_g'; put(mi, *mirror(Qs, hs, os_))
        print(info)
    data = np.concatenate(buf).astype('<i2')
    open(os.path.join(OUT, 'anim.bin'), 'wb').write(data.tobytes())
    meta = dict(fps=FPS, bones=GB, clips=index, credit='Capture de mouvement : base CMU (mocap.cs.cmu.edu), conversion BVH de Bruce Hahne ; utilisation libre.')
    json.dump(meta, open(os.path.join(OUT, 'anim.json'), 'w'), ensure_ascii=False)
    print('anim.bin', len(data) * 2 // 1024, 'Ko,', len(index), 'animations')

if __name__ == '__main__':
    main()
