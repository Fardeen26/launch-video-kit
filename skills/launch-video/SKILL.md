---
name: launch-video
description: Make a fast, meme-native product launch video (35-50s) with real product footage, a mascot, licensed music and beat-synced sound effects, rendered in Remotion. Use when the user wants a launch video, launch film, promo video, product announcement video, Product Hunt / X / Reels launch clip, or asks "how was that launch video made". Covers creative direction, sourcing meme clips, finding royalty-free music, generating mascot poses, screen-recording the real app, beat-locked editing, high-quality rendering and QA.
---

# Launch video

This skill reproduces the workflow behind the Rotware launch film: a 44-second, Windows-95-themed, meme-driven launch
video built from **real product recordings**, real memes, a mascot, licensed music and sound effects cut on the beat.
Total out-of-pocket cost for the original was under $1.

Read `references/09-case-study-rotware.md` first if you want to see the whole thing play out, including every
mistake and every piece of feedback. The process below is the distilled version.

## What you are making

```
0:00  OPENING      three "moment -> meme" pairs. The internet keeps a tiny piece of something bigger.
                   (original clip with its real audio, then the meme it became: punch-in, flash, impact)
                   The first meme must land by ~2s so it works MUTED.
0:09  PULLBACK     the last meme freezes; camera pulls back onto a desktop; the mascot yanks the frame out;
                   the app window opens on top.
0:13  PRODUCT      real screen recordings of making ONE hero meme: find -> AI edit -> caption -> make it move -> export.
                   Fast (2-6 beats per shot), virtual camera, drawn cursor, click/typing sounds on the real events.
                   Long AI waits are cut with an honest "⏩ 62s generation skipped" stamp.
0:25  PAYOFF       music cuts on a record scratch; the finished video meme plays with its own audio.
0:31  FORMATS      the same joke as PNG, MP4 and GIF windows popping in on the beat.
0:33  CALLBACK     a "Start live demo?" dialog: the cursor drifts to Yes, hesitates, clicks No. Mascot sweats.
0:35  END CARD     window slams in ON THE BAR with a bass hit; brand types on; tagline; mascot presses the button;
                   full-colour screen types the URL with a blinking cursor.
```

There is no voiceover and there are no subtitles. Music and sound effects carry it.

## Prerequisites (check before starting)

- Claude Code, Node 20+, ffmpeg + ffprobe, Python 3.10-3.12 (librosa does not support newer Pythons yet), Google Chrome.
- `OPENROUTER_API_KEY` for image generation (~$0.07/image; whole film ~$1). Optional `ELEVENLABS_API_KEY`
  (free tier) for word-level transcripts. Optional `yt-dlp` for downloading reference/source clips.
- 10 GB free disk. 4K renders fail with a misleading "Chrome rejected the request" error below ~4 GB free.
- The user logs into their own app in the Chrome window you record. Never type their passwords.

## Process (stage-gated: stop and get the user's approval at each ⛔)

1. **Brief and references.** Ask for: product URL, what it does, audience, launch channels, tagline, mascot art (if any),
   brand colours/theme, and 3-6 reference launch videos they love. Break the references down
   (`references/02-reference-videos.md`): contact sheets, cuts per second, hook, structure, sound.
2. **Story + hero meme.** Pick the opening moments and ONE hero meme that runs through the product demo
   (`references/01-creative-direction.md`). The hero meme must be about something the audience cares about and be
   funny as a still. Make it as a rough still first. ⛔ Show the opening contact sheet + hero meme rough.
3. **Source the opening clips** (`references/03-sourcing-moments.md`): verify each meme genuinely comes from the shown
   moment, cut on exact words, crop watermarks/letterbox, normalise audio, log sources and rights holders in `sources.md`.
4. **Music + sound effects** (`references/04-music-and-sfx.md`): only clearly licensed tracks; analyse with
   `scripts/beats.py`; anchor the drop to the last opening meme. Keep `LICENSES.md`.
5. **Mascot poses** (`references/05-mascot-and-art.md`): one pose per scene (grab, nervous, press), generated on green
   screen from the existing art, keyed with `scripts/key_greenscreen.py`. 2.5D cutouts beat auto-3D.
6. **Record the real product** (`references/06-recording-the-product.md`) with `scripts/record.mjs`: clean state, real
   AI results, real exports (PNG/MP4/GIF) downloaded through the app's own Export buttons.
7. **Assemble** (`references/07-editing-in-remotion.md`): copy `template/` into the user's project folder, run
   `npm install && npm run demo-assets && npm run preview` to prove the toolchain, then replace assets and edit
   `src/config.ts`. ⛔ Show a preview render.
8. **Iterate on feedback** in small, precise passes. Re-render only what is needed.
9. **Render + QA** (`references/08-render-and-qa.md`): 4K with PNG frames, lanczos down to 1080p, `scripts/check_render.py`,
   `scripts/sync_probe.py` on the end card, 9:16 cut, Content ID test via an unlisted YouTube upload. ⛔ Deliver.

## Hard rules (each one was learned the hard way)

- **No fake UI, no fake traction.** Every product shot is a recording of the real app; every meme in the formats scene
  is a real export. No invented likes, comments or customers.
- **Meme-native, not AI slop.** Real footage, real memes, crude-but-intentional edits. A glossy AI illustration of a
  generic joke ("me skipping the tutorial") was rejected twice: it had no reason to exist in the video.
- **Muted-first.** Most people watch muted: the first meme with readable text must land by ~2s.
- **Bars, not beats, after the drop.** Shots after the music anchor may only change length in multiples of 4 beats.
  Adding 2 beats to one product shot pushed every later hit half a bar early; the user heard it immediately.
- **Captions look like real memes.** Classic Impact top/bottom, or a proper white top banner (186px per 1320px width,
  Oswald Regular, as written). Never a thin banner, never bold uppercase Impact inside a banner.
- **Give the hero AI moment room.** It must be huge and readable at phone size. Tiny popups on a busy frame read as
  nothing. Re-prompt until the change is obvious in a 1-second glance.
- **Licensing is tracked, not assumed.** `sources.md` for footage, `LICENSES.md` for audio. Music must allow commercial
  use with edits (no NC, no ND). The user owns the decision about celebrity footage; you keep the record.
- **Don't burn the user's money or data.** Image gen ~$0.07 each; check the OpenRouter key's remaining limit first. Use
  a throwaway Chrome profile; clear the app's autosave drafts you created; never commit `.env` keys.

## Scripts (all in `scripts/`, each has usage in its header)

| Script | What it does |
|---|---|
| `record.mjs` | Drives a real Chrome tab over CDP, screen-records at retina, logs clicks/typing/marks, pauses capture during long waits, captures downloads |
| `frames2mp4.py` | Turns recorded frames into a 30fps MP4, capping idle gaps (`MAXGAP`) |
| `map_events.py` | Maps logged event times onto that MP4's timeline (for the drawn cursor + click sounds) |
| `genimg.py` | Image generation / edits via OpenRouter (mascot poses, previews) |
| `key_greenscreen.py` | Green screen -> transparent, trimmed PNG |
| `meme_caption.py` | Impact top/bottom or white-banner captions |
| `beats.py` | BPM, beat grid, downbeats, drop candidates (librosa) |
| `transcribe.py` | Word-level timestamps (ElevenLabs Scribe) to cut on exact words |
| `check_render.py` | Black frames, integrated LUFS, per-second loudness |
| `sync_probe.py` | Per-frame "window on screen" vs bass energy, to prove hits land on the slam |
| `template/scripts/synth_sfx.sh` | 16 royalty-free synthesized sound effects |
| `template/scripts/make-demo-assets.sh` | Placeholder assets so the template renders before you have real ones |

## Template

`template/` is a Remotion 4 project. Everything is driven by `template/src/config.ts`: memes, clips, recordings with
camera keys, music + drop anchor, theme colours, brand strings, mascot poses, sound effects. Compositions: `Film`
(1920x1080) and `FilmVertical` (1080x1920 with a blurred fill). Commands: `npm run studio`, `npm run preview`,
`npm run render`, `npm run render:vertical`. See `references/07-editing-in-remotion.md`.
