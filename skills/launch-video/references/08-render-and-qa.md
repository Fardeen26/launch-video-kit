# 08 · Render and QA

## Render (high quality)

```bash
npm run render
# = remotion render src/index.ts Film out/film-4k.mp4 --scale=2 --image-format=png --crf=14 --x264-preset=slow --audio-bitrate=320k
#   then lanczos downscale to out/film-1080p.mp4 (supersampled: sharper text, cleaner edges)
npm run render:vertical     # out/film-vertical.mp4, 1080x1920
```
- `--image-format=png` removes the default JPEG frame compression (visible blockiness on UI text).
- `--scale=2` renders 4K; downscaling with lanczos gives a cleaner 1080p than rendering 1080p directly.
- Old/low-res sources (2000s speeches, 720p movie clips) can't gain detail; find better sources if it matters.
- Use `npm run preview` (half res) while iterating; only do the full render at the end.

## Disk space

The 4K render needs several GB of temp space. Below ~4 GB free, Remotion fails with
"Failed to fetch … This could be caused by Chrome rejecting the request because the disk space is low". Delete
intermediate files you created (raw screencast JPEG folders after the MP4s exist, old renders, download folders);
never delete the user's files without asking.

## QA checklist

```bash
python3 scripts/check_render.py out/film-1080p.mp4
# duration, black frames (should be none), integrated LUFS (~-11 to -14), per-second loudness
python3 scripts/sync_probe.py out/film-1080p.mp4 <end-card-start - 0.7> <end-card-start + 0.4>
# the bass jump and the "grey window" jump must be on the SAME frame
```
Then look at it:
```bash
ffmpeg -v error -y -i out/film-1080p.mp4 -vf "fps=2,scale=240:-1,tile=10x9" -frames:v 1 /tmp/sheet.jpg
```
Check: first meme by ~2s; nothing covers the app window; captions are proper banners/Impact; no personal info; the
hero AI result is readable small; ending slam on the hit.

## Before launch

- Upload the 1080p to YouTube as **unlisted** a day early; check Studio -> Content -> Copyright for claims (music and
  movie clips are the usual suspects). Swap whatever gets claimed.
- Product Hunt wants a YouTube link; X, Reddit, Instagram take the file directly (Instagram: the vertical cut).
- Keep `sources.md` and `LICENSES.md` with the project.
