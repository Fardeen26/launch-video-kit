# 04 · Music and sound effects

The user's verdict on the final film: "you cooked with the music". Music + SFX replace a voiceover entirely, so this
stage matters more than it looks.

## What the track needs

- Energetic, modern, hard drums: electro-house, phonk, trap, breakbeat. Not "upbeat corporate ukulele".
- A short intro and an **early, obvious drop** (Rotware's: 6.94s into "Anthem #01"), then full energy with no
  breakdown for ~40s.
- 120-140 BPM. At 130 BPM a beat is 0.46s: cuts of 2-6 beats feel fast without being unreadable.

## Where to find it (licence first)

Only use tracks whose licence explicitly allows **commercial use in an ad/promo on social platforms, with edits**
(syncing to video counts as an adaptation). Record everything in `LICENSES.md`.

| Source | Licence | Notes |
|---|---|---|
| **Mixkit** music — mixkit.co/free-stock-music/ (genre pages: electro-house, trap, workout) | Mixkit Stock Music Free License | No attribution. Social ads/YouTube OK. Can't register with Content ID; claims can still happen -> forward to team@mixkit.co. Direct files: `https://assets.mixkit.co/music/<id>/<id>.mp3` |
| **Mixkit** SFX — mixkit.co/free-sound-effects/ (click, whoosh, impact, glitch, scratch, camera…) | Mixkit SFX Free License | No attribution. `https://assets.mixkit.co/active_storage/sfx/<id>/<id>.wav` |
| Free Music Archive | per track | Only CC0 / CC BY. Reject NC and ND (most phonk there is ND). CC BY needs the credit line in the post. |
| Kevin MacLeod / incompetech | CC BY | Credit required. |
| YouTube Audio Library | "no attribution required" tracks | Needs login. |
| Pixabay | Pixabay Content License | Often blocked from scripts; many tracks marked "Content ID registered" -> claim risk. |

What Rotware used: "Anthem #01" by Eugenio Mininni (Mixkit, asset 567). Backups analysed: "Electro Dreams" and
"Thunder" by Arulo (Mixkit). A phonk alternative from FMA was flagged AI-generated and Content-ID-risky; avoid.

**Honesty note for agents:** you cannot hear audio. Pick by measurements (BPM, drop, loudness, spectrogram), give the
user 2-3 candidates, and let THEM judge by ear. Swapping tracks is a one-line config change.

## Analyse the track

```bash
python3 -m venv .venv && .venv/bin/pip install librosa numpy     # Python 3.10-3.12
.venv/bin/python scripts/beats.py public/audio/music/track.mp3
# bpm=129.97  drop=6.934s  (other candidates [7.396, 6.473])
```
Put `bpm` and `drop` in `CONFIG.music`. Audition the drop in Remotion Studio; the detector is a hint.

## Anchoring and the sync rule

`CONFIG.music.anchorShot` (default: the last opening meme) is where the drop lands. The engine positions the track
so `drop` hits that shot's first frame; every shot length is in beats, so every later cut lands on a beat.

**After the anchor, change shot lengths only in whole bars (multiples of 4 beats).** Shots line up with beats either
way, but the music's accents (bar downbeats, big bass hits) only line up with your scene changes if you stay on
the bar grid. In v6 the AI-result shot grew by 2 beats; the end-card slam then landed half a bar after the big bass
hit. Fix: give the time back (or take a whole bar). Before the anchor (the opening), any length is fine, because the
music is positioned relative to the anchor.

## Mixing

- Music volume 0.8; ducked to 30% under the first opening clip (`duckBeforeShot`) so the real audio (a chant, a
  movie line) is heard, then full at the first meme.
- Payoff: record scratch 4 frames before, music fades to 0 for the finished meme's own audio, back after.
- Fade the music out over the last 1.2s.
- Normalise every clip/payoff audio with `loudnorm=I=-13:TP=-1` so nothing is buried. Final film: about -11 LUFS.

## Sound effect placement (what goes where)

| Moment | SFX |
|---|---|
| Each opening meme pop | camera shutter + impact (last meme: big meme-boom) |
| Pullback start / mascot enters / grab / app opens / dive in | whoosh, pop, swoosh, pop, whoosh |
| Every product cut | short swoosh (vol 0.45) |
| Every logged click / typing burst | click / keyboard (placed from the recording's events) |
| AI "generation skipped" stamp | tape stop |
| AI result reveal | retro error chime + glitch + white flash, success ding 8 frames later |
| Before payoff | record scratch; then the payoff's own audio; glass shatter on the hit |
| Formats windows | pop on each of 3 beats |
| Callback dialog | error chime; click on "No"; window-close blip |
| End card | big boom ON the window slam (on the bar); click on the button; impact + typing on the URL type-on |

`template/scripts/synth_sfx.sh` synthesizes all of these with ffmpeg (no rights issues) if you don't want stock SFX.
Never use the actual Windows sounds or the original Vine boom recording.
