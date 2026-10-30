# launch-video-kit

The workflow behind the [Rotware](https://rotware.app) launch film, packaged as a **Claude Code skill**: a fast,
meme-native, 40-50 second product launch video made from **real product recordings**, real memes, a mascot,
licensed music and sound effects cut exactly on the beat. Rendered in [Remotion](https://remotion.dev).
The original cost under $1 in API calls.

You describe your product; Claude walks you through the whole thing, with checkpoints for your approval:

1. **Brief + references** — breaks down launch videos you like (cuts per second, hook, structure, sound).
2. **Story + hero meme** — picks "moment -> meme" openers your audience knows, and one hero meme to build on screen.
3. **Footage** — finds the source clips, verifies each meme really comes from that moment, cuts on exact words,
   crops watermarks, normalises audio, logs sources and rights holders.
4. **Music + SFX** — finds licensed tracks (Mixkit, FMA CC-BY/CC0…), detects BPM and the drop, anchors the drop to
   the reveal, places ~20 sound effects (or synthesizes a royalty-free set).
5. **Mascot** — generates scene-specific poses from your existing art on green screen and keys them.
6. **Product recordings** — drives a real Chrome tab, records at retina, logs every click for a clean drawn
   cursor and click sounds, skips long AI waits honestly, captures your app's real exports.
7. **Edit** — a config-driven Remotion template: punch-ins, shakes, flashes, whip pans, a desktop pullback,
   product camera moves, a payoff, a callback gag, an end card with a URL type-on. 16:9 and 9:16.
8. **Render + QA** — 4K PNG-frame render supersampled to 1080p, black-frame/loudness/sync checks, Content ID test.

## Install

In Claude Code:

```
/plugin marketplace add Fardeen26/launch-video-kit
/plugin install launch-video-kit@launch-video-kit
```

Then, in the folder where you want your video project, ask Claude something like
*"make a launch video for my product"* (or invoke the `launch-video` skill directly).

Manual install instead: copy `skills/launch-video` into `~/.claude/skills/`.

## Requirements

- Node 20+, ffmpeg/ffprobe, Python 3.10-3.12, Google Chrome
- `OPENROUTER_API_KEY` (image generation, ~$0.07/image). Optional: `ELEVENLABS_API_KEY` (free tier, word timestamps),
  `yt-dlp` (downloading clips)
- ~10 GB free disk for 4K renders

## Try the template without any assets

```bash
cp -R skills/launch-video/template my-launch-film && cd my-launch-film
npm install
npm run demo-assets     # synthesizes placeholder clips, recordings, a 130 BPM track and 16 sound effects
npm run preview         # renders out/preview.mp4 (a full demo film with placeholders)
npm run studio          # live preview while you edit src/config.ts
```

Everything in the film is in `src/config.ts`: memes, clips, recordings and camera moves, music + drop, theme, brand,
mascot poses, sound effects.

## What's inside

```
skills/launch-video/
  SKILL.md                       the process, hard rules, script index
  references/01-09*.md           creative direction, references, footage, music/SFX, mascot,
                                 recording, editing, render/QA, and the full Rotware case study
  scripts/                       record.mjs, frames2mp4.py, map_events.py, beats.py, transcribe.py,
                                 genimg.py, key_greenscreen.py, meme_caption.py, check_render.py, sync_probe.py
  template/                      Remotion project (Film + FilmVertical), demo-asset and SFX synth scripts
```

## Licences and rights

The code is MIT. This repo ships **no** third-party footage, music or sound effects: the demo assets are synthesized.
When you make your own film, you're responsible for clearing the clips, music and memes you use. The skill keeps a
`sources.md` and `LICENSES.md` for you and only recommends music whose licence allows commercial use with edits.
Remotion has its own licence (free for individuals and small companies): see remotion.dev/license.

Made while launching [Rotware](https://rotware.app), the only software you need for memes.
