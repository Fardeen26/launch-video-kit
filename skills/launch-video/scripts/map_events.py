#!/usr/bin/env python3
"""Map record.mjs event times (wall clock) onto the assembled video's timeline (after MAXGAP collapsing).
Writes a JSON list of events, each with "vt" = seconds into the MP4. Import this file in config.ts.

usage: python3 map_events.py <rec-dir> <out.events.json> <maxgap, same as frames2mp4>
"""
import json, os, sys

raw, out, maxgap = sys.argv[1], sys.argv[2], float(sys.argv[3])
fs = sorted(f for f in os.listdir(raw) if f.startswith("f_"))
ts = [int(f[2:9]) / 1000 for f in fs]
vt = [0.0]
for i in range(1, len(ts)):
    vt.append(vt[-1] + min(ts[i] - ts[i - 1], maxgap))

def to_video(t):
    if t <= ts[0]:
        return 0.0
    for i in range(1, len(ts)):
        if t < ts[i]:
            return vt[i - 1] + min(t - ts[i - 1], min(ts[i] - ts[i - 1], maxgap))
    return vt[-1] + (t - ts[-1])

ev = json.load(open(os.path.join(raw, "events.json")))["events"]
res = [dict(e, vt=round(to_video(e["t"]), 3)) for e in ev]
json.dump(res, open(out, "w"), indent=1)
for e in res:
    if e["type"] in ("click", "type", "drag", "mark"):
        print(f'{e["vt"]:7.3f}  {e["type"]:5}  {e.get("label") or e.get("name") or e.get("text", "")[:40]}')
