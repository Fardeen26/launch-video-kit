#!/usr/bin/env python3
"""Key a pure-green (#00FF00) background to transparency, despill the green fringe, erode 1px, trim.
Generate poses ON GREEN (say so in the prompt), then run this. Needs: pip install pillow numpy

usage: python3 key_greenscreen.py IN.png OUT.png [flip]   # flip = mirror horizontally
"""
import sys
import numpy as np
from PIL import Image, ImageFilter
src, out = sys.argv[1:3]
a = np.asarray(Image.open(src).convert("RGB")).astype(np.int16)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
green = g - np.maximum(r, b)
alpha = np.clip(255 - (green - 30) * 5, 0, 255).astype(np.uint8)
rgb = a.copy()
rgb[..., 1] = np.where(green > 0, np.maximum(r, b), g)
im = Image.fromarray(np.dstack([rgb.astype(np.uint8), alpha]), "RGBA")
al = im.getchannel("A").filter(ImageFilter.MinFilter(3))
im.putalpha(al)
im = im.crop(im.getbbox())
if len(sys.argv) > 3: im = im.transpose(Image.FLIP_LEFT_RIGHT)
im.save(out)
print(out, im.size)
