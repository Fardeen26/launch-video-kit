# 05 · Mascot and art

## 2.5D cutouts, not auto-3D

We tested free image-to-3D on Hugging Face Spaces (via `gradio_client`):
- **tencent/Hunyuan3D-2.1** worked (untextured, 227k faces, ~17s GPU). TRELLIS / TRELLIS.2 refused (anonymous ZeroGPU
  quota too small), Hunyuan3D-2 texturing crashed, stable-fast-3d failed.
- Projected the 2D art as texture, auto-rigged a 19-bone armature in Blender headless, rendered poses.
- Verdict: reads as the mascot from the front, but looks like a rubbery action figure; fused fists; painted-on grin
  (no expressions); soft face. Unusable for close-ups.

**Use 2.5D:** flat comic-art cutouts with motion (springs, slides, rotation), one generated pose per scene. It keeps
the art crisp and on-model. Put real 3D/motion in the props around the mascot if you need depth.

## Generate poses from the existing art

Pass the official mascot image as the reference. Generate ON GREEN, one pose per scene.

```bash
python3 scripts/genimg.py google/gemini-3.1-flash-image poses/grab-green.png prompt-grab.txt brand/mascot.png
python3 scripts/key_greenscreen.py poses/grab-green.png public/brand/mascot-grab.png
```

Prompt skeleton that held the style (Rotware's ROT-1):
```
Redraw this exact same character in the exact same comic illustration style, line weight, colouring and
proportions: same face, same <hair>, same <build>, same <outfit>, same <shoes>. Full body, whole character visible
including feet, nothing cropped. Plain flat solid pure green (#00FF00) chroma-key background, no shadows on the
background, no props unless described, no text.

New pose: <pose>
```
Poses used:
- **grab** (pullback): "three-quarter view facing the viewer's left, leaning forward with weight on the front foot,
  his left arm stretched far out to the viewer's left, hand open and empty, fingers curled as if pinching the corner
  of an invisible sheet of paper in mid-air and yanking it towards himself. His hands hold NOTHING, absolutely no
  objects, no frame, no props". (Without the last sentence the model drew a picture frame in his hand.)
- **nervous** (callback): "body slightly turned away, shoulders hunched, one hand near the chest with the index finger
  hovering hesitantly, sweat drops flying off his forehead, eyes darting sideways, awkward clenched-teeth grimace".
- **press** (end card): "three-quarter view facing the viewer's left, confidently jabbing a big index finger forward
  as if pressing a button, other fist on his hip, huge smug grin, chin up". Mascot stands RIGHT of the button, so
  he must point LEFT (don't mirror this one).
- **point** (spare): "pointing straight at the viewer, other hand flexing a bicep, cocky open-mouth grin".

Check every pose before keying: hands, extra props, face consistency. ~$0.07 each; regenerate one pose, not all.

The user's feedback that triggered this: the same static flex image in every scene "does not fit and looks weird".
Each scene needs a pose that does the scene's action.

## Meme-native edits (when you need art in a meme)

Keep official art untouched and paste real photo props in crudely ("like a low-effort photoshop meme edit"). Avoid
glossy full AI illustrations of jokes; they read as slop.
