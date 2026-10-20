# Lecture de fichiers BVH (capture de mouvement) et cinématique directe, avec numpy.
# Utilisé par tools/mocap.py.
import numpy as np

class BVH:
    def __init__(self, path):
        txt = open(path).read().split('\n')
        self.names, self.parent, self.offset, self.chans, self.end = [], [], [], [], []
        stack, i = [], 0
        while i < len(txt):
            ln = txt[i].strip()
            if ln.startswith('ROOT') or ln.startswith('JOINT'):
                self.names.append(ln.split()[1]); self.parent.append(stack[-1] if stack else -1); self.offset.append(None); self.chans.append([]); self.end.append(None)
                stack.append(len(self.names) - 1)
            elif ln.startswith('End Site'):
                # le bout de l'os : on garde son décalage dans le joint parent
                j = stack[-1]; i += 1
                while not txt[i].strip().startswith('OFFSET'): i += 1
                self.end[j] = np.array([float(v) for v in txt[i].split()[1:4]]);
                while txt[i].strip() != '}': i += 1
            elif ln.startswith('OFFSET'):
                self.offset[stack[-1]] = np.array([float(v) for v in ln.split()[1:4]])
            elif ln.startswith('CHANNELS'):
                self.chans[stack[-1]] = ln.split()[2:]
            elif ln == '}':
                stack.pop()
            elif ln.startswith('Frames:'):
                n = int(ln.split()[1]); self.dt = float(txt[i + 1].split()[-1])
                data = [list(map(float, l.split())) for l in txt[i + 2:i + 2 + n] if l.strip()]
                self.data = np.array(data); break
            i += 1
        self.n = len(self.data); self.idx = {nm: k for k, nm in enumerate(self.names)}
        self.fk()

    def fk(self):
        # rotations locales : ordre des canaux (Z puis Y puis X pour CMU) ; R = Rz @ Ry @ Rx
        J, F = len(self.names), self.n
        self.R = np.zeros((F, J, 3, 3)); self.P = np.zeros((F, J, 3)); col = 0
        loc = []
        for j in range(J):
            ch = self.chans[j]; pos = np.zeros((F, 3)); rot = np.tile(np.eye(3), (F, 1, 1))
            for c in ch:
                v = self.data[:, col]; col += 1
                if c.endswith('position'): pos[:, 'XYZ'.index(c[0])] = v
                else:
                    a = np.radians(v); ca, sa = np.cos(a), np.sin(a); M = np.tile(np.eye(3), (F, 1, 1))
                    if c[0] == 'X': M[:, 1, 1] = ca; M[:, 1, 2] = -sa; M[:, 2, 1] = sa; M[:, 2, 2] = ca
                    elif c[0] == 'Y': M[:, 0, 0] = ca; M[:, 0, 2] = sa; M[:, 2, 0] = -sa; M[:, 2, 2] = ca
                    else: M[:, 0, 0] = ca; M[:, 0, 1] = -sa; M[:, 1, 0] = sa; M[:, 1, 1] = ca
                    rot = rot @ M
            loc.append((pos, rot))
        for j in range(J):
            pos, rot = loc[j]; p = self.parent[j]
            if p < 0: self.R[:, j] = rot; self.P[:, j] = pos + self.offset[j]
            else:
                self.R[:, j] = self.R[:, p] @ rot
                self.P[:, j] = self.P[:, p] + np.einsum('fij,j->fi', self.R[:, p], self.offset[j])

    def pos(self, name): return self.P[:, self.idx[name]]
    def endpos(self, name):
        j = self.idx[name]; return self.P[:, j] + np.einsum('fij,j->fi', self.R[:, j], self.end[j])
