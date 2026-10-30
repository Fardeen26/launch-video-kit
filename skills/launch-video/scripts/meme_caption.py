#!/usr/bin/env python3
"""Put a caption on a frame the way memes actually circulate.

Two styles:
  impact  - classic white Impact, black outline, TOP and/or BOTTOM (auto-shrinks to fit the width)
  banner  - modern "tweet-style" white banner above the image, black text (default font Oswald Regular
            if you pass --font path/to/Oswald-Regular.ttf; falls back to Arial Bold). 186px banner per
            1320px of image width is a good height - never a thin strip.

usage:
  python3 meme_caption.py impact IN.png OUT.png "TOP TEXT" "BOTTOM TEXT"
  python3 meme_caption.py banner IN.png OUT.png "me after the live demo:" [--font Oswald-Regular.ttf]
Needs: pip install pillow
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

CANDIDATES = {
    "impact": ["/System/Library/Fonts/Supplemental/Impact.ttf", "/usr/share/fonts/truetype/msttcorefonts/Impact.ttf", "C:/Windows/Fonts/impact.ttf"],
    "banner": ["/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "C:/Windows/Fonts/arialbd.ttf"],
}

def font_path(style, override):
    if override:
        return override
    for p in CANDIDATES[style]:
        if os.path.exists(p):
            return p
    sys.exit(f"no {style} font found; pass --font /path/to/font.ttf")

def fit(draw, text, path, maxw, size):
    while size > 20:
        f = ImageFont.truetype(path, size)
        if draw.textlength(text, font=f) <= maxw:
            return f
        size -= 4
    return ImageFont.truetype(path, size)

args = [a for a in sys.argv[1:] if not a.startswith("--")]
override = sys.argv[sys.argv.index("--font") + 1] if "--font" in sys.argv else None
if override in args:
    args.remove(override)
style, src, out = args[0], args[1], args[2]
im = Image.open(src).convert("RGB")
w = im.width

if style == "impact":
    top, bottom = (args[3] if len(args) > 3 else ""), (args[4] if len(args) > 4 else "")
    d = ImageDraw.Draw(im)
    path = font_path("impact", override)
    size = int(w * 0.075)
    if top:
        f = fit(d, top, path, w * 0.92, size)
        d.text((w // 2, int(w * 0.02)), top, font=f, fill="white", anchor="mt", stroke_width=max(4, size // 16), stroke_fill="black")
    if bottom:
        f = fit(d, bottom, path, w * 0.92, size)
        d.text((w // 2, im.height - int(w * 0.025)), bottom, font=f, fill="white", anchor="ms", stroke_width=max(4, size // 16), stroke_fill="black")
    im.save(out)
elif style == "banner":
    text = args[3]
    band = round(w * 186 / 1320)
    c = Image.new("RGB", (w, im.height + band), "white")
    c.paste(im, (0, band))
    d = ImageDraw.Draw(c)
    f = fit(d, text, font_path("banner", override), w * 0.92, int(band * 0.5))
    d.text((w // 2, band // 2), text, font=f, fill="black", anchor="mm")
    c.save(out)
else:
    sys.exit("style must be impact or banner")
print(out)
