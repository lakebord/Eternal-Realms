#!/usr/bin/env python3
"""Slice 4x4 portrait/icon sheets into clean gutterless atlases (assets/*.webp).
Usage: python3 tools/art.py <dir with items01..06, gear01..02, mon01..06, class01..03 .png>"""
import sys, os
from PIL import Image
src = sys.argv[1]; out = os.path.join(os.path.dirname(__file__), '..', 'assets'); os.makedirs(out, exist_ok=True)
def bounds(im):
    """find the 4 cell spans on one axis by looking for dark gutter lines; falls back to equal cells"""
    g = im.convert('L'); W, H = g.size; px = g.load()
    def axis(n, get, m):
        prof = [sum(get(i, j) for j in range(0, m, 4)) / (m / 4) for i in range(n)]
        cuts = [0]
        for k in (1, 2, 3):
            c = n * k // 4; lo = max(0, c - n // 16); hi = min(n - 1, c + n // 16)
            cuts.append(min(range(lo, hi), key=lambda i: prof[i]))
        cuts.append(n); return cuts
    return axis(W, lambda i, j: px[i, j], H), axis(H, lambda i, j: px[j, i], W)
def atlas(name, cell, padf=0.07):
    im = Image.open(os.path.join(src, name + '.png')).convert('RGB'); xs, ys = bounds(im)
    o = Image.new('RGB', (cell * 4, cell * 4))
    for r in range(4):
        for c in range(4):
            x0, x1, y0, y1 = xs[c], xs[c + 1], ys[r], ys[r + 1]; side = min(x1 - x0, y1 - y0); pad = int(side * padf)
            cx, cy = (x0 + x1) // 2, (y0 + y1) // 2; h = side // 2 - pad
            o.paste(im.crop((cx - h, cy - h, cx + h, cy + h)).resize((cell, cell), Image.LANCZOS), (c * cell, r * cell))
    o.save(os.path.join(out, name + '.webp'), 'WEBP', quality=82, method=6); return o
for n in ['items%02d' % i for i in range(1, 7)] + ['gear01', 'gear02']: atlas(n, 128)
for n in ['mon%02d' % i for i in range(1, 7)] + ['class01', 'class02', 'class03']: atlas(n, 192)
for n,c in (('xmon',192),('xmon2',192),('xmon3',192),('xitems',128),('xgear',128)):
    if os.path.exists(os.path.join(src, n + '.png')): atlas(n, c)
print('atlases written to', os.path.abspath(out))

# location scenes: 2x4 sheets of wide panels -> assets/v/<location>.webp
VISTA_SHEETS={'va':['brookhollow','greenmarch','whisperwood','mine','ember','valeria','watchtower','ironford'],
  'vb':['mirren','grimward','crossroads','thornvale','moonfall','lothirien','crystallake','hollow'],
  'vc':['frostpeak','summit','khazgard','deepforge','undervault','skyreach','duskhaven','aethermoor'],
  'vd':['saltmere','cove','mire','pawhaven','isles','citadel','bloodrock','dunes'],
  've':['oasis','tomb','ashen','necropolis','spire','warrens','crystalcaves','webdepths']}
def gutters(g, n, axis):
    W, H = g.size; px = g.load(); L = W if axis == 0 else H; M = H if axis == 0 else W
    prof = [sum(px[i, j] if axis == 0 else px[j, i] for j in range(0, M, 3)) for i in range(L)]
    cuts = []
    for k in range(1, n):
        c = L * k // n; lo, hi = c - L // 20, c + L // 20
        cuts.append(min(range(lo, hi), key=lambda i: prof[i]))
    return cuts
def vistas():
    vd = os.path.join(out, 'v'); os.makedirs(vd, exist_ok=True)
    for sheet, names in VISTA_SHEETS.items():
        f = os.path.join(src, sheet + '.png')
        if not os.path.exists(f): continue
        im = Image.open(f).convert('RGB'); g = im.convert('L'); W, H = im.size
        # outer frame: trim rows/cols that are much darker than the picture
        xs = [0] + gutters(g, 2, 0) + [W]; ys = [0] + gutters(g, 4, 1) + [H]
        for r in range(4):
            for c in range(2):
                x0, x1, y0, y1 = xs[c], xs[c + 1], ys[r], ys[r + 1]
                ix, iy = int((x1 - x0) * 0.025) + 4, int((y1 - y0) * 0.06) + 4
                im.crop((x0 + ix, y0 + iy, x1 - ix, y1 - iy)).resize((800, 220), Image.LANCZOS).save(os.path.join(vd, names[r * 2 + c] + '.webp'), 'WEBP', quality=80, method=6)
    f = os.path.join(src, 'vf.png')
    if os.path.exists(f):
        im = Image.open(f).convert('RGB'); W, H = im.size; h = int(W * 220 / 800)
        im.crop((0, int(H * 0.3), W, int(H * 0.3) + h)).resize((800, 220), Image.LANCZOS).save(os.path.join(vd, 'crags.webp'), 'WEBP', quality=80, method=6)
vistas()

# icons whose generator added a caption under the emblem: keep a square around the emblem only
def atlas_crop_top(name, cell, top=0.04, side=0.74):
    f = os.path.join(src, name + '.png')
    if not os.path.exists(f): return
    im = Image.open(f).convert('RGB'); xs, ys = bounds(im); o = Image.new('RGB', (cell * 4, cell * 4))
    for r in range(4):
        for c in range(4):
            x0, x1, y0, y1 = xs[c], xs[c + 1], ys[r], ys[r + 1]; h = y1 - y0; s = int(h * side); cx = (x0 + x1) // 2; yy = y0 + int(h * top)
            o.paste(im.crop((cx - s // 2, yy, cx + s // 2, yy + s)).resize((cell, cell), Image.LANCZOS), (c * cell, r * cell))
    o.save(os.path.join(out, name + '.webp'), 'WEBP', quality=82, method=6)
atlas_crop_top('svc', 128)
for n, c in (('skills', 128), ('folk1', 192), ('folk2', 192), ('status', 96), ('ach', 128)):
    if os.path.exists(os.path.join(src, n + '.png')): atlas(n, c)
