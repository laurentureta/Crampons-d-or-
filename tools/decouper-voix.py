#!/usr/bin/env python3
"""Découpe un enregistrement ElevenLabs de plusieurs répliques (séparées par [long pause]) en un fichier par réplique.

  python3 tools/decouper-voix.py lots.json media-raw/voix/          → écrit assets/voix/<qui>/<empreinte>.mp3 + assets/voix/index.json

lots.json : [{ "id": "S_01", "who": "S", "lines": ["réplique 1", "réplique 2", …] }, …]
Chaque lot <id> doit avoir son enregistrement media-raw/voix/<id>.mp3.
Les N-1 plus longs silences d'un lot de N répliques servent de coupures ; un lot dont le découpage
paraît douteux (débit anormal, coupures pas nettement plus longues que les respirations) est ignoré et signalé.
Besoin : ffmpeg, numpy.
"""
import hashlib, json, os, subprocess, sys
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SR, HOP = 22050, 220  # trames de 10 ms


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


def runs(mask):
    out, start = [], None
    for i, m in enumerate(mask):
        if m and start is None: start = i
        if not m and start is not None: out.append((start, i)); start = None
    if start is not None: out.append((start, len(mask)))
    return out


def split(x, n):
    k = len(x) // HOP
    db = 20 * np.log10(np.sqrt((x[:k * HOP].reshape(k, HOP) ** 2).mean(1)) + 1e-9)
    thr = max(np.percentile(db, 95) - 32, -55)
    quiet = db < thr
    sil = [r for r in runs(quiet) if r[0] > 0 and r[1] < k and r[1] - r[0] >= 20]  # ≥ 0,2 s, hors début et fin
    if len(sil) < n - 1: return None, f'{len(sil)} silences pour {n} répliques'
    sil.sort(key=lambda r: r[1] - r[0], reverse=True)
    cuts, rest = sorted(sil[:n - 1]), sil[n - 1:]
    shortest = min((r[1] - r[0] for r in cuts), default=999)
    longest_rest = max((r[1] - r[0] for r in rest), default=0)
    bounds, prev = [], 0
    for a, b in cuts: bounds.append((prev, (a + b) // 2)); prev = (a + b) // 2
    bounds.append((prev, k))
    segs = []
    for a, b in bounds:
        loud = np.where(~quiet[a:b])[0]
        if not len(loud): return None, 'segment vide'
        s, e = a + max(loud[0] - 4, 0), a + min(loud[-1] + 14, b - a)
        segs.append((s * HOP, e * HOP))
    margin = shortest / max(longest_rest, 1)
    return (segs, db, thr), f'coupure la plus courte {shortest * 10} ms, respiration la plus longue {longest_rest * 10} ms (×{margin:.1f})'


def main():
    lots = json.load(open(sys.argv[1], encoding='utf-8'))
    raw_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'media-raw/voix')
    idx_path = os.path.join(ROOT, 'assets/voix/index.json')
    index = json.load(open(idx_path, encoding='utf-8')) if os.path.exists(idx_path) else {}
    ok = bad = 0
    for lot in lots:
        src = os.path.join(raw_dir, lot['id'] + '.mp3')
        if not os.path.exists(src): print(f"· {lot['id']} : pas d'enregistrement"); continue
        x = decode(src); n = len(lot['lines'])
        res, info = split(x, n)
        if not res: print(f"✗ {lot['id']} : {info}"); bad += n; continue
        segs, db, thr = res
        rates = [len(t) / ((e - s) / SR) for t, (s, e) in zip(lot['lines'], segs)]
        med = float(np.median(rates))
        odd = [i for i, r in enumerate(rates) if r < med / 1.9 or r > med * 1.9 or r < 6 or r > 30]
        margin = float(info.split('×')[1].rstrip(')'))
        if odd or margin < 1.15:
            print(f"✗ {lot['id']} : découpage douteux ({info} ; répliques suspectes {odd}, débits {[round(r) for r in rates]})"); bad += n; continue
        # même volume pour tous les lots : la parole est ramenée vers -20 dBFS efficaces
        speech = db[db > thr]; gain = -20 - float(10 * np.log10(np.mean(10 ** (speech / 10))))
        gain = max(min(gain, 12), -12)
        for txt, (s, e) in zip(lot['lines'], segs):
            key = lot['who'] + '|' + txt.strip()
            name = f"{lot['who']}/{hashlib.sha1(key.encode('utf-8')).hexdigest()[:12]}.mp3"
            dst = os.path.join(ROOT, 'assets/voix', name); os.makedirs(os.path.dirname(dst), exist_ok=True)
            d = (e - s) / SR
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{s / SR:.3f}', '-t', f'{d:.3f}', '-i', src, '-af',
                            f'volume={gain:.2f}dB,afade=t=in:d=0.015,afade=t=out:st={max(d - 0.08, 0):.3f}:d=0.08', '-ac', '1', '-ar', '44100',
                            '-c:a', 'libmp3lame', '-b:a', '64k', dst], check=True)
            index[key] = name; ok += 1
        print(f"✓ {lot['id']} : {n} répliques · {info} · débit médian {med:.0f} car/s · gain {gain:+.1f} dB")
    json.dump(dict(sorted(index.items())), open(idx_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(f'{ok} répliques rangées, {bad} à refaire · index : {len(index)} répliques')


if __name__ == '__main__':
    main()
