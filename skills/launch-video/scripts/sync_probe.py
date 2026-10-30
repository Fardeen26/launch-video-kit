#!/usr/bin/env python3
"""Per-frame sync probe: how much of the centre is Win95 grey (#c0c0c0, i.e. a window is on screen)
next to the bass energy (<150 Hz) of that frame. Use it to prove a big hit lands on the frame a
window slams in. Example: python3 sync_probe.py out/film-1080p.mp4 38.7 39.8
A good sync shows bass jumping on the SAME frame grey jumps; a 0.5s lead means you drifted off the bar.

usage: python3 sync_probe.py VIDEO START_SEC END_SEC
"""
import sys, subprocess, struct, math
v, a, b = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
raw = subprocess.run(["ffmpeg","-v","error","-ss",str(a),"-t",str(b-a),"-i",v,"-vf","fps=30,scale=64:36","-f","rawvideo","-pix_fmt","rgb24","-"],capture_output=True).stdout
n=64*36*3; frames=[raw[i:i+n] for i in range(0,len(raw),n)]
def grey(fr):  # fraction of pixels close to win95 grey c0c0c0 in center region
    c=0;t=0
    for y in range(8,28):
        for x in range(14,50):
            i=(y*64+x)*3; r,g,bb=fr[i],fr[i+1],fr[i+2]; t+=1
            if abs(r-192)<20 and abs(g-192)<20 and abs(bb-192)<20: c+=1
    return c/t
au = subprocess.run(["ffmpeg","-v","error","-ss",str(a),"-t",str(b-a),"-i",v,"-vn","-ac","1","-ar","48000","-af","lowpass=f=150","-f","s16le","-"],capture_output=True).stdout
s=struct.unpack("<%dh"%(len(au)//2),au); spf=1600
for k,fr in enumerate(frames):
    seg=s[k*spf:(k+1)*spf]; rms=math.sqrt(sum(x*x for x in seg)/max(len(seg),1)) if seg else 0
    print(f"{a+k/30:6.2f} grey={grey(fr):.2f} bass={20*math.log10(rms+1):5.1f}")
