#!/usr/bin/env python3
# Prépare les photos de l'écran d'ouverture (assets/intro) à partir des originaux rangés par le robot médias (media-raw/intro) :
#  - joueur_detoure.png : le joueur en plein retourné, détouré par le robot (rembg), photo Unsplash de Chaim Weingarten
#  - joueur_src.jpg     : la même photo non détourée (pour découper le vrai ballon)
#  - stade_src.jpg      : le Parc des Princes de nuit, photo Unsplash de Chris Kursikowski
# Sortie : stade.jpg (flou d'objectif, étalonné), joueur.webp (sans le ballon), ballon.png (le ballon seul), intro.json (repères)
# Usage : python3 tools/intro_photos.py
import json, os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(ROOT, 'media-raw', 'intro')
OUT = os.path.join(ROOT, 'assets', 'intro')
os.makedirs(OUT, exist_ok=True)

# repères dans la photo d'origine en 2400 px de large (relevés à l'œil)
BALL = (1232, 720, 106)   # centre et rayon du ballon
FOOT = (1390, 880)        # pied qui frappe
HIPS = (1430, 1730)       # pivot du corps (le travelling tourne autour)

# ---- le joueur détouré ----
cut = Image.open(os.path.join(SRC, 'joueur_detoure.png')).convert('RGBA')
src = Image.open(os.path.join(SRC, 'joueur_src.jpg')).convert('RGB')
k = cut.width / src.width
bx, by, br = BALL[0] * k, BALL[1] * k, BALL[2] * k
a = cut.split()[3]
# on ne garde que le grand morceau (le joueur), pas les restes de filet ou les autres joueurs
a = a.point(lambda v: 0 if v < 10 else v)
L = int(420 * k / (1600 / 2400))  # à gauche de la main : la tête d'un autre joueur et un débris
ImageDraw.Draw(a).rectangle([0, 0, L, a.height], fill=0)
# le ballon est retiré de la découpe : il est dessiné à part (il part vers l'objectif)
m = Image.new('L', cut.size, 255); ImageDraw.Draw(m).ellipse([bx - br * 1.08, by - br * 1.08, bx + br * 1.08, by + br * 1.08], fill=0)
a = Image.composite(a, Image.new('L', cut.size, 0), m)
cut.putalpha(a)
bb = cut.split()[3].getbbox()
pad = int(10 * k)
# la boîte comprend aussi l'emplacement du ballon, pour garder les repères simples
x0, y0 = max(0, min(bb[0], int(bx - br)) - pad), max(0, min(bb[1], int(by - br)) - pad)
x1, y1 = min(cut.width, max(bb[2], int(bx + br)) + pad), min(cut.height, max(bb[3], int(by + br)) + pad)
J = cut.crop((x0, y0, x1, y1))
# étalonnage : un peu plus de contraste, des noirs un peu bleutés comme sous des projecteurs de stade
rgb = J.convert('RGB'); rgb = ImageEnhance.Contrast(rgb).enhance(1.06); rgb = ImageEnhance.Color(rgb).enhance(.92)
J = Image.merge('RGBA', (*rgb.split(), J.split()[3]))
H = 1400
if J.height > H: s = H / J.height; J = J.resize((round(J.width * s), H), Image.LANCZOS)
else: s = 1
sj = s  # échelle découpe → joueur.webp
J.save(os.path.join(OUT, 'joueur.webp'), 'WEBP', quality=86, alpha_quality=92, method=6)
jw, jh = J.size
def rel(x, y): return [round((x * k - x0) * sj / jw, 4), round((y * k - y0) * sj / jh, 4)]

# ---- le ballon, découpé dans la photo d'origine (bord adouci) ----
B = 320
bsrc = src.crop((BALL[0] - BALL[2], BALL[1] - BALL[2], BALL[0] + BALL[2], BALL[1] + BALL[2])).resize((B, B), Image.LANCZOS)
bm = Image.new('L', (B * 4, B * 4), 0); ImageDraw.Draw(bm).ellipse([6, 6, B * 4 - 6, B * 4 - 6], fill=255)
bm = bm.resize((B, B), Image.LANCZOS).filter(ImageFilter.GaussianBlur(.6))
ball = bsrc.convert('RGBA'); ball.putalpha(bm)
ball.save(os.path.join(OUT, 'ballon.png'), optimize=True)

# ---- le stade : flou d'objectif (on regarde le joueur), un peu plus sombre et froid ----
st = Image.open(os.path.join(SRC, 'stade_src.jpg')).convert('RGB')
SW = 1200
st = st.resize((SW, round(st.height * SW / st.width)), Image.LANCZOS)
st = st.filter(ImageFilter.GaussianBlur(4))
st = ImageEnhance.Brightness(st).enhance(.86); st = ImageEnhance.Color(st).enhance(.9)
r, g, b = st.split(); b = b.point(lambda v: min(255, int(v * 1.05 + 4))); st = Image.merge('RGB', (r, g, b))
st.save(os.path.join(OUT, 'stade.jpg'), 'JPEG', quality=80, optimize=True, progressive=True)

meta = {
  'stade': {'f': 'stade.jpg', 'w': st.width, 'h': st.height, 'fx': .5, 'hz': .595, 'st': [.46, .58]},
  'joueur': {'f': 'joueur.webp', 'w': jw, 'h': jh, 'cx': .5, 'cy': .5, 'ball': rel(BALL[0], BALL[1]) + [round(BALL[2] * k * sj / jw, 4)], 'foot': rel(*FOOT), 'px': rel(*HIPS)[0], 'py': rel(*HIPS)[1]},
  'ballon': {'f': 'ballon.png', 'w': B},
  'credits': ['Joueur : photo de Chaim Weingarten (Unsplash, licence Unsplash)', 'Stade : Parc des Princes, photo de Chris Kursikowski (Unsplash, licence Unsplash)'],
}
json.dump(meta, open(os.path.join(OUT, 'intro.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps(meta, ensure_ascii=False))
for f in sorted(os.listdir(OUT)): print(f, os.path.getsize(os.path.join(OUT, f)) // 1024, 'Ko')
