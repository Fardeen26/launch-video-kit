#!/usr/bin/env python3
"""Final QA for a render: duration, black/blank frames, integrated loudness, per-second loudness map.

Targets: no black frames (a whip/transition starting fully off-screen causes them), integrated loudness
around -11 to -14 LUFS for social, no silent holes except deliberate ones (e.g. the beat before a payoff).

usage: python3 check_render.py out/film-1080p.mp4
"""
import re, subprocess, sys

v = sys.argv[1]
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", v], capture_output=True, text=True).stdout)
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", v, "-vf", "scale=32:18,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
n = 32 * 18
lum = [sum(raw[i:i + n]) / n for i in range(0, len(raw), n)]
dark = [i for i, x in enumerate(lum) if x < 12]
lufs = re.search(r"I:\s+(-?[\d.]+) LUFS", subprocess.run(["ffmpeg", "-i", v, "-af", "ebur128=framelog=quiet", "-vn", "-f", "null", "-"], capture_output=True, text=True).stderr)
print(f"duration     {dur:.2f}s  ({len(lum)} frames)")
print(f"black frames {dark if dark else 'none'}")
print(f"loudness     {lufs.group(1) if lufs else '?'} LUFS integrated")
row = []
for s in range(int(dur) + 1):
    o = subprocess.run(["ffmpeg", "-ss", str(s), "-t", "1", "-i", v, "-vn", "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.search(r"mean_volume: (-?[\d.]+)", o)
    row.append(f"{s:2d}s:{m.group(1) if m else '-inf':>6}")
for i in range(0, len(row), 8):
    print("  ".join(row[i:i + 8]))
