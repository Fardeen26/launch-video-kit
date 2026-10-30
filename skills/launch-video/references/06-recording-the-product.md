# 06 · Recording the real product

Every product shot is a recording of the real app doing the real thing. `scripts/record.mjs` drives Chrome over the
DevTools protocol, so recordings are repeatable: if the UI changes or a take is bad, re-run the steps file.

## Setup

```bash
# 1. A dedicated Chrome profile with remote debugging. Use a VISIBLE window: headless captures at 1x only.
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --remote-debugging-port=9222 --user-data-dir=$HOME/.launch-video-chrome
# 2. In that window, log into the app yourself (the agent never types passwords).
# 3. Probe the page: list inputs, buttons, take a screenshot
node scripts/record.mjs --match yourapp.com --steps '[{"eval":"[...document.querySelectorAll(\"button\")].filter(b=>b.offsetParent).map(b=>b.getAttribute(\"aria-label\")||b.textContent.trim())"},{"shot":"/tmp/probe.png"}]'
```
`record.mjs` forces a 1280x720 CSS viewport at 2x DPR (2560x1440 frames) so camera coordinates match
`CONFIG.viewport`.

## State hygiene (each of these bit us)

- **Clean canvas:** the editor restored an autosaved draft from an earlier take. Clear the app's autosave (we cleared
  an IndexedDB store via an `eval` step) and reload before recording.
- **Deselect:** a selected text box's handles sat over the hero AI result. Click empty space + `Escape` first.
- **Default junk:** "Add Text" inserted "MEMEHUB" placeholder text; the video editor defaulted captions to Impact 900
  UPPERCASE. Set fonts/case BEFORE recording, or record the change deliberately.
- **Personal info:** the site header showed the account name. Crop it, rename the account, or start the recording
  after that screen.
- **File pickers:** use `{"suppressFilePicker":true}` then `{"upload":{...}}`; native dialogs can't be recorded.

## A take, step by step

`steps-ai.json` (AI edit; long generation skipped with pause/resume):
```json
[
  {"suppressFilePicker": true},
  {"wait": 800},
  {"clickText": "AI"}, {"wait": 900},
  {"clickText": "Edit this template"}, {"wait": 500},
  {"click": "textarea[placeholder]"},
  {"typeSlow": "turn the whole cybertruck behind him into one giant cracked windows 95 error popup with a blue title bar, a big red X icon and an OK button, keep him exactly the same", "cps": 40},
  {"wait": 400},
  {"clickText": "Edit template"}, {"mark": "submitted"},
  {"wait": 4000},
  {"recPause": true},
  {"waitFor": "document.body.innerText.includes('AI image applied')", "timeout": 400000},
  {"recResume": true}, {"mark": "done"},
  {"wait": 9000}
]
```
```bash
node scripts/record.mjs --match yourapp.com --steps steps-ai.json --rec rec/ai-raw
MAXGAP=0.4 python3 scripts/frames2mp4.py rec/ai-raw public/rec/ai.mp4
python3 scripts/map_events.py rec/ai-raw src/data/ai.events.json 0.4      # prints click/type/mark times on the MP4 timeline
```
Then in `config.ts`: `import aiEvents from './data/ai.events.json'` and add product shots using those times.

Other takes we recorded: search (`typeSlow` query, `enter`, `waitFor` results), upload-as-template (`upload` +
dialog buttons), caption (format "Top banner", "White banner", set banner height via a React-safe range setter in
`eval`, `typeSlow` the caption), video editor (upload clip, caption, play), export panel (`clickText "Export GIF"`).

## The hero AI result must be BIG

First prompt ("turn the cracked windows into windows 95 error popups") made two tiny popups: invisible at phone size.
Second took 271s and was weak. Final prompt asked for "the whole cybertruck… one giant cracked windows 95 error popup
with a blue title bar, a big red X icon and an OK button, keep him exactly the same" and reads in one glance. Iterate
the prompt in the app until the change is obvious; generation times varied 57-271s.

## Real exports, not screenshots

The formats scene and payoff use the app's own exported files:
```json
[{"downloadsTo": "/abs/project/exports"}, {"clickText": "Export"}, {"wait": 1000}, {"clickText": "Export GIF"},
 {"waitFor": "!/exporting|%/i.test([...document.querySelectorAll('button')].find(b=>/gif/i.test(b.textContent))?.textContent||'')", "timeout": 180000}]
```
Convert GIFs for Remotion: `ffmpeg -i meme.gif -movflags +faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" meme-gif.mp4`.
Normalise the exported video's audio for the payoff: `ffmpeg -i meme.mp4 -vn -af loudnorm=I=-13:TP=-1 -ar 48000 meme-audio.wav`.

## Check every take

```bash
ffmpeg -v error -y -i public/rec/ai.mp4 -vf "fps=1,scale=480:-1,tile=6x3" -frames:v 1 /tmp/take.jpg   # look at it
```
Look for: restored drafts, selection handles, personal info, error toasts, letterboxed AI output, loading copy that
doesn't fit. Note product bugs for the user; don't silently hide them.

## Camera keys

Camera coordinates are CSS px in the 1280x720 viewport, so you can read them straight off the event log (click x/y)
or element rects (`getBoundingClientRect` via `eval`). Typical moves: start wide (zoom 1.2-1.5), push in on the
clicked control (2-2.4), pull back to show the result (1.5-1.8). Hero reveals: start tight on the detail (2.7),
pull out to the whole canvas.
