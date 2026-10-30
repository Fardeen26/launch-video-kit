#!/usr/bin/env node
// record.mjs — drive a real Chrome tab over the DevTools protocol, screen-record it, and log every click.
//
// Why: product shots must be REAL. This records the actual app with frame-accurate timestamps and writes
// an events log (click positions, typing, marks) that the Remotion template uses to draw a clean cursor
// and drop click/typing sounds exactly on the action.
//
// Start Chrome once with remote debugging and a throwaway profile, then log into your app in that window:
//   macOS:  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --remote-debugging-port=9222 --user-data-dir=$HOME/.launch-video-chrome
//   Linux:  google-chrome --remote-debugging-port=9222 --user-data-dir=$HOME/.launch-video-chrome
//
// Usage:
//   node record.mjs --steps steps.json [--rec out/rec-search-raw] [--match yourapp.com] [--port 9222] [--viewport 1280x720@2]
//   node record.mjs --steps '[{"shot":"page.png"}]'          # steps can be inline JSON too
//
// Without --rec it just drives the page (use that for setup / resetting state / probing selectors).
// With --rec it writes timestamped JPEG frames + events.json into that folder. Then run:
//   MAXGAP=0.4 python3 frames2mp4.py <rec> <out.mp4>      # assemble video (idle gaps capped at 0.4s)
//   python3 map_events.py <rec> <out.events.json> 0.4      # map event times onto that video's timeline
//
// Step vocabulary (one object per step, run in order):
//   {"navigate":"https://..."}                       go to a URL and wait for load
//   {"click":"css selector"}                         real mouse click at the element centre (logged)
//   {"clickText":"Export", "within":"[role=dialog]"} click the last visible element whose text matches (case-insensitive)
//   {"clickXY":[x,y]}                                click CSS coords (e.g. empty space to deselect)
//   {"type":"text"}                                  insert text instantly (not logged)
//   {"typeSlow":"text", "cps":18}                    type character by character, logged as a "type" event
//   {"enter":true} | {"key":"Escape"}                key presses
//   {"dragExpr":"js returning {x1,y1,x2,y2}"}        smooth eased drag (logged)
//   {"upload":{"selector":"input[type=file]","file":"/abs/path.png"}}   set a file input without a picker
//   {"suppressFilePicker":true}                      stop native file dialogs from opening on click
//   {"downloadsTo":"/abs/dir"}                       send downloads (real exports!) to a folder
//   {"wait":800}                                     sleep ms
//   {"waitFor":"js boolean expr", "timeout":300000}  poll until true (e.g. an AI job finished)
//   {"recPause":true} / {"recResume":true}           stop/start capture (skip a long AI wait without gigabytes of frames)
//   {"mark":"name"}                                  drop a named marker into the log
//   {"eval":"js"}                                    print the JSON result of an expression
//   {"shot":"/abs/file.png"}                         full-resolution screenshot
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true]] : acc), []));
if (!args.steps) { console.error("usage: node record.mjs --steps steps.json [--rec dir] [--match url-substring] [--port 9222] [--viewport 1280x720@2] [--ws ws://...]"); process.exit(1); }
const steps = JSON.parse(existsSync(args.steps) ? readFileSync(args.steps, "utf8") : args.steps);
const port = args.port || 9222;

let wsUrl = args.ws;
if (!wsUrl) {
  const tabs = await (await fetch(`http://localhost:${port}/json`)).json();
  const pages = tabs.filter((t) => t.type === "page" && (!args.match || t.url.includes(args.match)));
  if (!pages.length) { console.error(`no Chrome tab${args.match ? ` matching "${args.match}"` : ""} on port ${port}. Is Chrome running with --remote-debugging-port=${port}?`); process.exit(1); }
  wsUrl = pages[0].webSocketDebuggerUrl;
}

const ws = new WebSocket(wsUrl);
let id = 0;
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const myId = ++id;
  const h = (e) => { const m = JSON.parse(e.data); if (m.id !== myId) return; ws.removeEventListener("message", h); m.error ? reject(new Error(method + ": " + m.error.message)) : resolve(m.result); };
  ws.addEventListener("message", h); ws.send(JSON.stringify({ id: myId, method, params }));
});
const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await new Promise((r) => ws.addEventListener("open", r, { once: true }));
await send("Page.enable");
await send("Runtime.enable");

// Fixed viewport so camera coordinates in the template match (CONFIG.viewport). @2 = retina-sharp frames.
const vp = String(args.viewport || "1280x720@2").match(/(\d+)x(\d+)(?:@(\d+(?:\.\d+)?))?/);
await send("Emulation.setDeviceMetricsOverride", { width: +vp[1], height: +vp[2], deviceScaleFactor: +(vp[3] || 2), mobile: false });

const REC = args.rec && args.rec !== true ? args.rec : null;
const t0 = Date.now();
const events = [];
let frames = 0;
const log = (type, extra) => events.push({ t: (Date.now() - t0) / 1000, type, ...extra });
const dpr = +(vp[3] || 2);
const startCapture = () => send("Page.startScreencast", { format: "jpeg", quality: 100, everyNthFrame: 1, maxWidth: Math.round(+vp[1] * dpr), maxHeight: Math.round(+vp[2] * dpr) });
if (REC) {
  mkdirSync(REC, { recursive: true });
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.method !== "Page.screencastFrame") return;
    writeFileSync(`${REC}/f_${String(Date.now() - t0).padStart(7, "0")}.jpg`, Buffer.from(m.params.data, "base64"));
    frames++;
    ws.send(JSON.stringify({ id: 900000 + frames, method: "Page.screencastFrameAck", params: { sessionId: m.params.sessionId } }));
  });
  await startCapture();
}

const center = `el.scrollIntoView({block:'nearest'});const c=el.getBoundingClientRect();return {x:c.x+c.width/2,y:c.y+c.height/2};`;
async function clickAt(expr, label) {
  let pos = null;
  for (let i = 0; i < 20 && !pos; i++) { pos = await ev(expr); if (!pos) await sleep(250); }
  if (!pos) throw new Error("not found: " + label);
  log("click", { x: pos.x, y: pos.y, label });
  for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: pos.x, y: pos.y, button: "left", clickCount: 1 });
}

for (const s of steps) {
  if (s.navigate) { await send("Page.navigate", { url: s.navigate }); await sleep(500); const until = Date.now() + 30000; while (Date.now() < until && (await ev("document.readyState")) !== "complete") await sleep(250); }
  else if (s.click) await clickAt(`(()=>{const el=document.querySelector(${JSON.stringify(s.click)});if(!el)return null;${center}})()`, s.click);
  else if (s.clickText) await clickAt(`(()=>{const root=${s.within ? `document.querySelector(${JSON.stringify(s.within)})` : "document"};if(!root)return null;const els=[...root.querySelectorAll('button,a,[role=button],[role=tab],[role=option],[role=menuitem],label,li,div,span')].filter(e=>e.offsetParent&&e.textContent.trim().toLowerCase()===${JSON.stringify(s.clickText.toLowerCase())});const el=els[els.length-1];if(!el)return null;${center}})()`, s.clickText);
  else if (s.clickXY) { const [x, y] = s.clickXY; for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 }); }
  else if (s.type) await send("Input.insertText", { text: s.type });
  else if (s.typeSlow) { log("type", { text: s.typeSlow }); for (const ch of s.typeSlow) { await send("Input.insertText", { text: ch }); await sleep(s.cps ? 1000 / s.cps : 45); } }
  else if (s.enter) { for (const type of ["keyDown", "keyUp"]) await send("Input.dispatchKeyEvent", { type, key: "Enter", code: "Enter", text: type === "keyDown" ? "\r" : undefined, windowsVirtualKeyCode: 13 }); }
  else if (s.key) { for (const type of ["keyDown", "keyUp"]) await send("Input.dispatchKeyEvent", { type, key: s.key, code: s.key, windowsVirtualKeyCode: s.code || 27 }); }
  else if (s.dragExpr) {
    const d = await ev(s.dragExpr); if (!d) throw new Error("drag target missing"); log("drag", d);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: d.x1, y: d.y1 });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: d.x1, y: d.y1, button: "left", clickCount: 1 });
    for (let i = 1; i <= 18; i++) { const k = i / 18, e = k * k * (3 - 2 * k); await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: d.x1 + (d.x2 - d.x1) * e, y: d.y1 + (d.y2 - d.y1) * e, button: "left", buttons: 1 }); await sleep(22); }
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: d.x2, y: d.y2, button: "left", clickCount: 1 });
  }
  else if (s.upload) { await send("DOM.enable"); const { root } = await send("DOM.getDocument", { depth: -1, pierce: true }); const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector: s.upload.selector }); if (!nodeId) throw new Error("no input " + s.upload.selector); await send("DOM.setFileInputFiles", { nodeId, files: [s.upload.file] }); log("upload", { file: s.upload.file }); }
  else if (s.suppressFilePicker) await ev(`(()=>{HTMLInputElement.prototype.showPicker=function(){};const oc=HTMLInputElement.prototype.click;HTMLInputElement.prototype.click=function(){if(this.type==='file')return;return oc.call(this)};return true})()`);
  else if (s.downloadsTo) { mkdirSync(s.downloadsTo, { recursive: true }); await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: s.downloadsTo }).catch(() => send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: s.downloadsTo })); }
  else if (s.wait) await sleep(s.wait);
  else if (s.waitFor) { const until = Date.now() + (s.timeout || 300000); while (Date.now() < until && !(await ev(s.waitFor))) await sleep(500); log("waited", { expr: s.waitFor.slice(0, 60) }); }
  else if (s.recPause) { if (REC) await send("Page.stopScreencast"); log("pause", {}); }
  else if (s.recResume) { log("resume", {}); if (REC) await startCapture(); }
  else if (s.mark) log("mark", { name: s.mark });
  else if (s.eval) console.log(JSON.stringify(await ev(s.eval)));
  else if (s.shot) { const { data } = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(s.shot, Buffer.from(data, "base64")); console.log("shot", s.shot); }
  else console.warn("unknown step", JSON.stringify(s));
}

if (REC) {
  await send("Page.stopScreencast");
  writeFileSync(`${REC}/events.json`, JSON.stringify({ duration: (Date.now() - t0) / 1000, events }, null, 1));
  console.log(`recorded ${frames} frames into ${REC}`);
}
await send("Emulation.clearDeviceMetricsOverride").catch(() => {});
ws.close();
