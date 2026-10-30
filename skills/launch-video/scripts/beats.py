#!/usr/bin/env python3
"""Analyse a music track: BPM, every beat, bar downbeats, and the DROP (biggest sustained energy jump).

The film is cut in beats and the drop is anchored to one shot (CONFIG.music.anchorShot), so you need:
  bpm  -> CONFIG.music.bpm
  drop -> CONFIG.music.drop  (seconds into the track)
Always check the drop BY EAR in Remotion Studio; the detector is a strong hint, not gospel.

usage: python3 beats.py track.mp3 [out.beats.json]
Needs: pip install librosa numpy   (use a venv; librosa pulls in numba/scipy)
"""
import json, sys
import numpy as np
import librosa

path = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else path.rsplit(".", 1)[0] + ".beats.json"
y, sr = librosa.load(path, sr=22050, mono=True)
tempo, frames = librosa.beat.beat_track(y=y, sr=sr, units="frames")
beats = librosa.frames_to_time(frames, sr=sr)
bpm = float(np.atleast_1d(tempo)[0])
# straight-line fit through the detected beats -> a clean grid
if len(beats) > 8:
    k = np.arange(len(beats)); a, b = np.polyfit(k, beats, 1); bpm = 60.0 / a
    # extend the grid over the whole track (the tracker often skips a quiet intro, which is where drops hide)
    first = b % a
    grid = first + a * np.arange(int((len(y) / sr - first) / a) + 1)
else:
    grid = beats
# drop = beat with the largest jump of mean RMS over the next 4 beats vs the previous 4 beats
rms = librosa.feature.rms(y=y)[0]; rt = librosa.frames_to_time(np.arange(len(rms)), sr=sr)
def mean_between(t0, t1):
    m = (rt >= t0) & (rt < t1)
    return float(rms[m].mean()) if m.any() else 0.0
beat = 60.0 / bpm
scores = [(mean_between(t, t + 4 * beat) / (mean_between(t - 4 * beat, t) + 1e-6), t) for t in grid if t > 4 * beat]
top = sorted(scores, reverse=True)[:3]
drop = top[0][1] if top else 0.0
# downbeats: assume the drop is beat 1 of a bar
downbeats = [round(t, 3) for t in grid if abs(((t - drop) / beat) % 4) < 0.25 or abs(((t - drop) / beat) % 4 - 4) < 0.25]
res = {"bpm": round(bpm, 2), "drop": round(float(drop), 3), "beats": [round(float(t), 3) for t in grid], "downbeats": downbeats,
       "duration": round(len(y) / sr, 2), "drop_candidates": [round(float(t), 3) for _, t in top], "note": "drop = biggest 4-beat energy jump; verify by ear. Phrase = 8 bars = 32 beats."}
json.dump(res, open(out, "w"), indent=1)
print(f"bpm={res['bpm']}  drop={res['drop']}s  (other candidates {res['drop_candidates'][1:]})  beats={len(grid)}  duration={res['duration']}s  -> {out}")
