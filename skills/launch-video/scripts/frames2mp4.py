#!/usr/bin/env python3
"""Assemble a constant-30fps MP4 from record.mjs's timestamped screencast frames.

Chrome only sends a frame when the page changes, so each frame is held until the next one.
MAXGAP (env, seconds) caps how long any single frame is held, which collapses idle waits
(e.g. a page sitting still while an API responds). Use the SAME MAXGAP for map_events.py.

usage: MAXGAP=0.4 python3 frames2mp4.py <rec-dir> <out.mp4>
"""
import os, subprocess, sys

d, out = sys.argv[1:3]
maxgap = float(os.environ.get("MAXGAP", "99"))
fs = sorted(f for f in os.listdir(d) if f.startswith("f_"))
if not fs:
    sys.exit(f"no frames in {d}")
ts = [int(f[2:9]) / 1000 for f in fs]
lines = ["ffconcat version 1.0"]
for i, f in enumerate(fs):
    dur = (ts[i + 1] - ts[i]) if i + 1 < len(fs) else 0.5
    lines += [f"file '{os.path.join(os.path.abspath(d), f)}'", f"duration {min(max(dur, 0.001), maxgap):.3f}"]
lines.append(f"file '{os.path.join(os.path.abspath(d), fs[-1])}'")
lst = os.path.join(d, "list.ffconcat")
open(lst, "w").write("\n".join(lines))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-safe", "0", "-i", lst, "-vf", "fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2",
                "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-pix_fmt", "yuv420p", out], check=True)
print(f"{out}: {len(fs)} frames")
