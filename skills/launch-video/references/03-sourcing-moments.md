# 03 · Sourcing the opening moments (footage)

## 1. Find a good upload

```bash
brew install yt-dlp     # or pipx install yt-dlp
yt-dlp "ytsearch10:steve ballmer developers developers" --get-title --get-id --get-duration   # list candidates
yt-dlp -f "bv*[height<=1080]+ba/b" -o "src/%(id)s.%(ext)s" "https://www.youtube.com/watch?v=XxbJw8PrIkc"
```
Prefer the rights holder's own channel or a major outlet (ESPN, Bloomberg). Note the uploader and URL.
If the user already has the clip (e.g. a movie scene in Downloads), use theirs.

## 2. Verify the meme really comes from this moment

Search Know Your Meme / Daily Dot for the meme, compare the meme image to frames of the source. If no upload contains
the frame, or the line was never said, drop it and pick another. Never fabricate a meme's origin, views, or influence.

## 3. Find the exact moment

Word-level timing beats scrubbing:
```bash
python3 scripts/transcribe.py src/clip.mp4 30 30      # words with timestamps for 0:30-1:00
```
Example (Uncut Gems): `10.94 This · 11.16 is · 11.38 my · 11.72 fucking · 12.16 way. · 12.44 This · 12.62 is · 12.78 how · 13.18 I · 13.30 win`.
Ballmer's chant: 14 "developers" between 41.64 and 50.46 -> use the word times as `pulseAt` punch-ins.

Camera cuts inside a scene:
```bash
ffmpeg -ss 10 -t 5 -i src/clip.mp4 -vf "select='gt(scene,0.25)',showinfo" -f null - 2>&1 | grep -o "pts_time:[0-9.]*"
```
Uncut Gems cuts to Kevin Garnett at 13.23s, mid-"…I win". Fix: end the picture at 13.22 on Sandler, and play the
rest of the word ("win") as `tailAudio` over the meme pop. The line lands, the shot stays on the right face.

## 4. Cut it

```bash
# picture + normalised audio, exactly N beats long (N*60/BPM seconds)
ffmpeg -ss 10.455 -t 2.767 -i src/clip.mp4 -c:v libx264 -crf 16 -c:a aac -b:a 192k -af "loudnorm=I=-13:TP=-1:LRA=9" public/opening/clip-2.mp4
```
- **Loudness:** old speeches are quiet (Ballmer was -30 dB vs -12 for the rest). Always `loudnorm=I=-13`.
- **Letterbox bars:** `ffmpeg -i clip.mp4 -vf cropdetect=24:2:0 -f null - 2>&1 | grep -o "crop=[0-9:]*" | sort | uniq -c | sort -rn | head -1`
  then crop and scale to 1920x1080 (`crop=1280:538:0:54,crop=956:538:162:0,scale=1920:1080`).
- **Burned-in watermarks** (news logos, "SOURCE: TESLA"): crop past them (`crop=1440:810:440:90,scale=1920:1080`).
- Keep the clip SHORT. The user's note: "the first video should end at 0:04, you stretched it too much".

## 5. The freeze frame and meme

```bash
ffmpeg -ss 54.187 -i src/clip.mp4 -frames:v 1 freeze.png
python3 scripts/meme_caption.py impact freeze.png public/opening/meme-1.png "PRODUCT MANAGERS WHEN" "SOMETHING BREAKS AT 3 AM"
```
Use the meme's authentic form (Impact top/bottom, or the circulating image itself, e.g. a screenshot with movie
subtitles). If the user hands you their meme image, use it as-is.

## 6. Record sources

`sources.md` per clip: URL, uploader, original rights holder (e.g. A24, Tesla, ESPN/NBA, Microsoft), in/out times,
meme evidence links, and a one-line rights note. The user decides on clearance; you keep the record. Platforms:
YouTube Content ID is the realistic risk (test with an unlisted upload); X/Reddit rarely claim.
