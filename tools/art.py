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
