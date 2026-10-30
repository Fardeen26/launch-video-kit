#!/usr/bin/env python3
"""Word-level transcript with timestamps (ElevenLabs Scribe). Used to cut clips on exact words:
find where "this is how I win" starts, where a chant ends, which word lands on a camera cut.

usage: python3 transcribe.py media.(mp4|mp3|wav) [START_SEC] [DURATION_SEC]
Needs ELEVENLABS_API_KEY (the free tier is plenty) and ffmpeg.
"""
import json, os, subprocess, sys, tempfile, urllib.request, uuid

src = sys.argv[1]
start = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
dur = sys.argv[3] if len(sys.argv) > 3 else None
tmp = os.path.join(tempfile.mkdtemp(), "a.mp3")
cmd = ["ffmpeg", "-v", "error", "-y", "-ss", str(start)] + (["-t", dur] if dur else []) + ["-i", src, "-vn", "-ac", "1", "-ar", "16000", tmp]
subprocess.run(cmd, check=True)
boundary = uuid.uuid4().hex
body = b""
for k, v in (("model_id", "scribe_v1"), ("tag_audio_events", "true")):
    body += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
body += f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="a.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode() + open(tmp, "rb").read() + f"\r\n--{boundary}--\r\n".encode()
req = urllib.request.Request("https://api.elevenlabs.io/v1/speech-to-text", data=body, headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": f"multipart/form-data; boundary={boundary}"})
d = json.load(urllib.request.urlopen(req, timeout=300))
for w in d.get("words", []):
    if w["type"] != "spacing":
        print(f'{w["start"] + start:7.2f}-{w["end"] + start:7.2f}  {w["text"]}')
