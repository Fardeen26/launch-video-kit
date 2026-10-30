#!/usr/bin/env python3
"""Generate or edit an image through OpenRouter (Gemini image models), ~$0.07 per image.

Used for: mascot poses on green screen (pass the mascot art as a reference), product-meme previews,
and quick concept frames. Needs OPENROUTER_API_KEY in the environment.

usage: python3 genimg.py MODEL OUT.png PROMPT_FILE [REF_IMAGE ...]
  MODEL: google/gemini-3.1-flash-image (good + cheap) | google/gemini-3-pro-image (higher fidelity)
  List current image models: curl -s https://openrouter.ai/api/v1/models | jq -r '.data[]|select(.architecture.output_modalities|index("image"))|.id'
"""
import sys, json, base64, os, urllib.request, mimetypes
model, out, prompt_file, *refs = sys.argv[1:]
content = [{"type": "text", "text": open(prompt_file).read()}]
for r in refs:
    mt = mimetypes.guess_type(r)[0] or "image/png"
    content.append({"type": "image_url", "image_url": {"url": f"data:{mt};base64," + base64.b64encode(open(r, "rb").read()).decode()}})
body = {"model": model, "modalities": ["image", "text"], "messages": [{"role": "user", "content": content}]}
req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions", data=json.dumps(body).encode(),
    headers={"Authorization": "Bearer " + os.environ["OPENROUTER_API_KEY"], "Content-Type": "application/json"})
resp = json.load(urllib.request.urlopen(req, timeout=300))
msg = resp["choices"][0]["message"]
imgs = msg.get("images") or []
if not imgs:
    print("NO IMAGE:", (msg.get("content") or "")[:500]); sys.exit(1)
url = imgs[0]["image_url"]["url"]
open(out, "wb").write(base64.b64decode(url.split(",", 1)[1]))
print("saved", out, "| cost", resp.get("usage", {}).get("cost"), "| text:", (msg.get("content") or "")[:200])
