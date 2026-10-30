#!/usr/bin/env bash
# Synthesize a royalty-free sound-effect set with ffmpeg (no third-party rights).
# usage: bash scripts/synth_sfx.sh public/audio/sfx
set -euo pipefail
OUT="${1:-public/audio/sfx}"; mkdir -p "$OUT"
A() { ffmpeg -v error -y -f lavfi -i "aevalsrc='$1':s=48000:d=$2" -af "${3:-anull},alimiter=limit=0.89" -ac 2 "$OUT/$4"; }
A "(random(0)*2-1)*exp(-t*400)" 0.05 "highpass=f=1500" click.wav
A "(random(0)*2-1)*exp(-mod(t,0.085)*120)*lt(mod(t,0.085),0.03)" 1.4 "highpass=f=1200,volume=0.8" typing.wav
A "(random(0)*2-1)*sin(PI*t/0.55)" 0.55 "bandpass=f=900:width_type=h:w=1200,volume=2.2,afade=t=in:d=0.25" whoosh.wav
A "(random(0)*2-1)*sin(PI*t/0.25)" 0.25 "bandpass=f=1800:width_type=h:w=1500,volume=2" swoosh.wav
A "sin(2*PI*(700-2400*t)*t)*exp(-t*28)" 0.12 "anull" pop.wav
A "sin(2*PI*1200*t)*exp(-t*35)" 0.1 "anull" blip.wav
A "(sin(2*PI*880*t)*lt(t,0.16)+sin(2*PI*659*t)*gte(t,0.16))*exp(-mod(t,0.16)*6)*0.7" 0.45 "anull" error-chime.wav
A "(random(0)*2-1)*exp(-t*5)*(1+0.6*sin(2*PI*37*t))" 0.9 "highpass=f=2500,volume=1.4" shatter.wav
A "sin(2*PI*(60+140*exp(-t*25))*t)*exp(-t*14)+(random(0)*2-1)*exp(-t*60)*0.3" 0.35 "anull" impact.wav
A "sin(2*PI*(45+90*exp(-t*12))*t)*exp(-t*4)" 0.9 "volume=1.6" boom.wav
A "sin(2*PI*(38+110*exp(-t*9))*t)*exp(-t*2.6)+(random(0)*2-1)*exp(-t*40)*0.4" 1.6 "volume=1.6" big-boom.wav
A "(random(0)*2-1)*(exp(-t*300)+exp(-abs(t-0.07)*300)*0.7)" 0.15 "highpass=f=2000" shutter.wav
A "sin(2*PI*220*(t-0.6*t*t))*exp(-t*1.5)*0.7" 0.7 "lowpass=f=1500" tape-stop.wav
A "sgn(sin(2*PI*(200+800*random(0))*t))*0.4*lt(mod(t,0.05),0.03)" 0.3 "lowpass=f=4000" glitch.wav
A "(random(0)*2-1)*(0.6+0.4*sin(2*PI*14*t))" 0.35 "bandpass=f=1400:width_type=h:w=1800,volume=1.6" scratch.wav
A "sin(2*PI*(523*lt(t,0.1)+659*between(t,0.1,0.2)+784*gte(t,0.2))*t)*exp(-mod(t,0.1)*8)*0.6" 0.5 "anull" success.wav
echo "synthesized $(ls "$OUT" | wc -l | tr -d ' ') sound effects into $OUT"
