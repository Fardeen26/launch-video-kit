#!/usr/bin/env bash
# Generate placeholder assets so the template renders a complete demo film out of the box.
# Everything is synthesized with ffmpeg: no third-party footage, music or sounds.
# Replace these files with your real ones (see config.ts), keeping or updating the paths.
set -euo pipefail
cd "$(dirname "$0")/.."
P=public; mkdir -p $P/brand $P/opening $P/rec $P/exports $P/audio/music $P/audio/sfx
FONT=""; for f in /System/Library/Fonts/Supplemental/Impact.ttf /usr/share/fonts/truetype/msttcorefonts/Impact.ttf /System/Library/Fonts/Supplemental/Arial\ Bold.ttf /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf; do [ -f "$f" ] && FONT="fontfile='$f':" && break; done
txt() { echo "drawtext=${FONT}text='$1':fontcolor=$2:fontsize=$3:x=(w-text_w)/2:y=$4:borderw=$5:bordercolor=black"; }
V() { ffmpeg -v error -y "$@"; }

echo "brand..."
V -f lavfi -i "gradients=s=1920x1080:c0=0x1d4e89:c1=0x7fb8e6:x0=0:y0=0:x1=0:y1=1080" -frames:v 1 $P/brand/wallpaper.png
V -f lavfi -i "color=c=0xffcc00:s=256x256" -vf "$(txt A black 180 '(h-text_h)/2' 0)" -frames:v 1 $P/brand/logo.png
for pose in grab nervous press; do
  V -f lavfi -i "color=c=0x00ff00:s=600x900" -vf "drawbox=x=150:y=180:w=300:h=520:color=0xd62828:t=fill,drawbox=x=210:y=40:w=180:h=160:color=0xf1c27d:t=fill,drawbox=x=170:y=700:w=110:h=200:color=0x222222:t=fill,drawbox=x=320:y=700:w=110:h=200:color=0x222222:t=fill,$(txt "$(echo $pose | tr a-z A-Z)" white 64 400 4),format=rgba,colorkey=0x00ff00:0.25:0" -frames:v 1 $P/brand/mascot-$pose.png
done

echo "opening clips + memes..."
i=0; for spec in "3:speech":"PRODUCT MANAGERS WHEN|SOMETHING BREAKS AT 3 AM" "3:movie":"THIS IS HOW I WIN|" "2:launch":"IT DIDNT GO THROUGH|"; do
  i=$((i+1)); dur=${spec%%:*}; rest=${spec#*:}; label=${rest%%:*}; caps=${rest#*:}; top=${caps%%|*}; bot=${caps#*|}
  V -f lavfi -i "testsrc2=s=1920x1080:r=30:d=$dur" -f lavfi -i "sine=f=$((180+i*60)):d=$dur" -vf "$(txt "ORIGINAL MOMENT $i ($label)" white 80 '(h-text_h)/2' 6)" -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -shortest $P/opening/clip-$i.mp4
  vf="$(txt "$top" white 110 30 7)"; [ -n "$bot" ] && vf="$vf,$(txt "$bot" white 110 'h-text_h-40' 7)"
  V -f lavfi -i "color=c=0x444455:s=1920x1080" -vf "drawbox=x=660:y=240:w=600:h=700:color=0x8899aa:t=fill,$vf" -frames:v 1 $P/opening/meme-$i.png
done

echo "product recordings (stand-ins for scripts/record.mjs output)..."
for r in search:10 ai:9 caption:5; do
  n=${r%%:*}; d=${r#*:}
  V -f lavfi -i "testsrc2=s=2560x1440:r=30:d=$d" -vf "drawbox=x=0:y=0:w=2560:h=110:color=0x000080:t=fill,$(txt "YOUR APP - $(echo $n | tr a-z A-Z) FLOW" white 90 '(h-text_h)/2' 6),$(txt "replace with a real recording" white 48 'h-120' 4)" -c:v libx264 -crf 20 -pix_fmt yuv420p $P/rec/demo-$n.mp4
done

echo "exports (stand-ins for your product's real exports)..."
V -f lavfi -i "testsrc2=s=1320x1086:r=30:d=5.2" -f lavfi -i "sine=f=330:d=5.2" -vf "drawbox=x=0:y=0:w=1320:h=186:color=white:t=fill,$(txt 'pov - your video meme' black 90 50 0)" -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -shortest $P/exports/meme.mp4
V -i $P/exports/meme.mp4 -vn -af "loudnorm=I=-13:TP=-1" -ar 48000 $P/exports/meme-audio.wav
V -i $P/exports/meme.mp4 -an -vf "hue=s=0" -c:v libx264 -crf 22 -pix_fmt yuv420p $P/exports/meme-gif.mp4
V -f lavfi -i "color=c=0x667788:s=1320x1086" -vf "drawbox=x=0:y=0:w=1320:h=186:color=white:t=fill,$(txt 'me after the live demo' black 90 50 0)" -frames:v 1 $P/exports/meme.png

echo "music: synthesized 130 BPM track, drop at 6.92s..."
B=0.4615385
V -f lavfi -i "aevalsrc='(sin(2*PI*(50+130*exp(-mod(t,$B)*30))*mod(t,$B))*exp(-mod(t,$B)*8)*0.9 + (random(0)*2-1)*exp(-mod(t+$B/2,$B)*70)*0.25*gte(t,6.92) + sin(2*PI*55*(1+lt(mod(t,$B*8),$B*4)*0.335)*t)*0.25*gte(t,6.92))*if(lt(t,6.92),0.3,1)':s=48000:d=60" -af "alimiter=limit=0.89" -ac 2 $P/audio/music/demo-track.wav

echo "sound effects..."
bash scripts/synth_sfx.sh $P/audio/sfx
echo "done. try: npm run preview"
