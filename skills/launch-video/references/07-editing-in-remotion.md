# 07 · Editing in Remotion

## Get the template running first

```bash
cp -R <skill-dir>/template ./launch-film && cd launch-film
npm install
npm run demo-assets        # placeholders: clips, memes, recordings, exports, a 130 BPM track, 16 SFX
npm run preview            # out/preview.mp4 at half res, ~40s
npm run studio             # live preview while you edit config.ts
```
If the demo renders, the toolchain works. Then replace assets in `public/` and edit `src/config.ts`.

## Architecture

- `src/config.ts` — the whole film as data. Shot lengths in beats.
- `src/film/Film.tsx` — builds the timeline from the config; one component per scene; all SFX placement.
- `src/film/ProductShot.tsx` — plays a recording with a virtual camera (`cam` keys), draws the cursor from the event
  log, places click/typing sounds on logged events.
- `src/film/effects.tsx` — `Flash`, `Shake`, `punchScale`, `whipIn` (motion-blurred slide), `CursorBurst` (flying
  pixel cursors for 4-5 frames), `Glitch` (RGB split).
- `src/film/Win95.tsx` — `Window`, `Button95`, `Cursor95`, coloured from `CONFIG.theme`.
- `src/Root.tsx` — `Film` (16:9) and `FilmVertical` (9:16, blurred fill; background copy muted via `MuteContext`).

## Beat math

`beats(n) = round(n * 60/bpm * fps)` frames. Every shot is `n` beats; the timeline is the running sum.
Music: `musicStart = anchorShot.from - drop*fps`. Rule: after the anchor, change lengths only in multiples of 4 beats.

## Scene recipes (what each animation is)

- **Opening clip:** real clip, real audio; `pulseAt` word times give a 1.07x punch + small shake per word (the
  Ballmer chant); slow 6% drift. Fit `contain` for 4:3 sources so captions aren't cropped.
- **Opening meme:** cut on the beat, 1.18x punch settling over 6 frames, 8-frame shake, 5-frame white flash, shutter +
  impact SFX.
- **Pullback:** spring the full-frame meme down to a 0.42x "Media Player" window; mascot slides in rotated and settles
  (spring, damping 12); at beat 3 the mascot yanks the frame out (translate + rotate, hard shadow) into OPEN space;
  at beat 5 the app window springs in ON TOP with a dark dim behind (never let the meme cover the app window: that was
  a real bug); from beat 6.6 a cubic zoom dives into the app; cursor burst on the cut.
- **Product shots:** whip in from alternating sides (start the whip 45% off-screen, never 100%, or the first frame is
  black); camera keys smooth-stepped; cursor arrives 0.3s before each click, shrinks on press; stamp ("⏩ 62s
  generation skipped") springs in rotated -3deg; reveal = flash + chime.
- **Payoff:** app-style window with the real exported meme video; punch + 12-frame shake + flash on `hitAt` (the
  smash); glass SFX there.
- **Formats:** three windows pop on consecutive beats with springy scale + rotate.
- **Callback:** dialog springs from 35%; cursor eases to Yes (beats 0.5-1.6), hesitates, eases to No (2.6-3.3),
  clicks at 3.5; dialog vanishes; nervous mascot.
- **End card:** window slams (scale 0.6->1 spring, shake 9 frames, flash) on the bar with the big boom; brand types
  on (beats 0.5-1.5); tagline fades up; mascot slides in; cursor travels to the button and presses at beat 6; then a
  full-colour screen types the URL 2 frames per character with a blinking block cursor, punch + flash on completion.

## Pacing rules

- Cut every 2-6 beats in the product section; nothing static for more than ~2s except the payoff.
- Recordings are sped up 1.0-4.5x (typing long prompts: 4x). Don't go faster on the hero result: 1x.
- Give the hero result its time without breaking the bar grid (lengthen by 4 beats or not at all).
- Muted test: first meme on screen with readable text by ~2s.

## Swapping things

- New meme/clip: replace the file in `public/` (or change the path) and re-render.
- New recording: run record -> frames2mp4 -> map_events, import the events JSON in `config.ts`, add/adjust shots.
- Different theme: `CONFIG.theme` colours, wallpaper, pixel font (`.woff2` in `public/fonts`).
- Remove the mascot: set its poses to `null`. Remove the callback: `callback: null`.
