# 02 · Breaking down reference videos

Ask the user for 3-6 launch videos they love (downloaded files are best: X bookmarks -> download). Then measure them;
don't just "watch".

## Contact sheet (what happens when)

```bash
# one frame every 1.5s, 6x7 grid with timestamps
ffmpeg -v error -y -i ref.mp4 -vf "fps=1/1.5,scale=384:-1,drawtext=text='%{pts\:hms}':x=5:y=5:fontsize=18:fontcolor=yellow:box=1:boxcolor=black,tile=6x7" -frames:v 1 ref-sheet.jpg
```
Read the image. For fast edits use `fps=2` or `fps=4` on a short window (`-ss 40 -t 8`).

## Pace (cuts per second)

```bash
ffmpeg -i ref.mp4 -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 | grep -c pts_time
```
Rotware's references: a culture-montage opener had 113 cuts in 53s (~2/s); a Win95 desktop launch had 3 cuts in 50s
(long animated takes). Pick a rhythm per section, not one for the whole film.

## Audio (what they say, what sounds they use)

```bash
python3 scripts/transcribe.py ref.mp4          # word timestamps + [audio events] like [laughing], [notification sound]
```
A mostly-music reference transcribes as just `[upbeat music]` + a few lines: that tells you the sound design carries it.

## What to extract (write it down for the user)

- Hook: what happens in the first 2 seconds, and does it work muted?
- Structure: sections and their lengths.
- Type treatment: size, case, where text sits, how much of the speech is subtitled.
- Mascot use: physical presence vs logo.
- Sound: music genre, where the drop lands, which SFX recur.
- One thing to steal, one thing to avoid (e.g. "glitchy pixel-cursor bursts: steal for 4-frame transitions only;
  heavy glitch over everything: avoid, the product must stay readable").
