import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { CONFIG, Cam, RecEvent } from '../config';
import { useMuted } from './mute';

// A real screen recording with a virtual camera (pan/zoom keys), a drawn cursor that
// follows the logged clicks, and click/typing sounds placed on the logged events.
// Coordinates are CSS px of the recording viewport (CONFIG.viewport).

const smooth = (t: number) => t * t * (3 - 2 * t);

function camAt(keys: Cam[], t: number) {
  if (t <= keys[0][0]) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = keys[i - 1];
      const b = keys[i];
      const p = smooth((t - a[0]) / Math.max(b[0] - a[0], 0.001));
      return [t, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p, a[3] + (b[3] - a[3]) * p] as Cam;
    }
  }
  return keys[keys.length - 1];
}

// The cursor arrives 0.3s before each click and follows drags.
function cursorAt(events: RecEvent[], t: number) {
  const pts: { t: number; x: number; y: number }[] = [];
  for (const e of events) {
    if (e.type === 'click' && e.x !== undefined && e.y !== undefined) pts.push({ t: e.vt, x: e.x, y: e.y });
    if (e.type === 'drag' && e.x1 !== undefined) {
      pts.push({ t: e.vt - 0.45, x: e.x1, y: e.y1! });
      pts.push({ t: e.vt, x: e.x2!, y: e.y2! });
    }
  }
  if (!pts.length) return null;
  if (t <= pts[0].t - 0.3) return { x: pts[0].x + 180, y: pts[0].y + 140 };
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const prev = i ? pts[i - 1] : { t: p.t - 0.6, x: p.x + 180, y: p.y + 140 };
    if (t <= p.t) {
      const start = Math.max(prev.t, p.t - 0.3);
      const k = smooth(Math.min(1, Math.max(0, (t - start) / Math.max(p.t - start, 0.001))));
      return { x: prev.x + (p.x - prev.x) * k, y: prev.y + (p.y - prev.y) * k };
    }
  }
  return pts[pts.length - 1];
}

export const ProductShot: React.FC<{ src: string; events: RecEvent[]; from: number; speed: number; durationInFrames: number; cam: Cam[]; cursor: boolean }> = ({ src, events, from, speed, durationInFrames, cam, cursor }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const muted = useMuted();
  const VW = CONFIG.viewport.width;
  const VH = CONFIG.viewport.height;
  const K = width / VW; // CSS px -> output px at zoom 1
  const t = from + (f / fps) * speed;
  const [, ccx, ccy, z] = camAt(cam, t);
  const cx = Math.min(Math.max(ccx, VW / 2 / z), VW - VW / 2 / z);
  const cy = Math.min(Math.max(ccy, VH / 2 / z), VH - VH / 2 / z);
  const tx = width / 2 - cx * K * z;
  const ty = height / 2 - cy * K * z;
  const cur = cursor ? cursorAt(events, t) : null;
  const to = from + (durationInFrames / fps) * speed;
  const inShot = events.filter((e) => e.vt >= from && e.vt < to);
  const pressed = inShot.some((e) => e.type === 'click' && t >= e.vt && t < e.vt + 0.12);

  return (
    <AbsoluteFill style={{ background: CONFIG.theme.titleBar, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width, height, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${z})` }}>
        <OffthreadVideo src={staticFile(src)} muted playbackRate={speed} trimBefore={Math.round(from * fps)} style={{ width, height, objectFit: 'fill' }} />
        {cur && (
          <svg viewBox="0 0 12 20" style={{ position: 'absolute', left: cur.x * K, top: cur.y * K, width: 12 * 2.4, height: 20 * 2.4, transform: `scale(${pressed ? 0.85 : 1})`, transformOrigin: '0 0' }}>
            <polygon points="0,0 0,16 4,12 7,19 9,18 6,11 11,11" fill="#fff" stroke="#000" strokeWidth="1" />
          </svg>
        )}
      </div>
      {!muted &&
        inShot
          .filter((e) => e.type === 'click')
          .map((e, i) => (
            <Sequence key={`c${i}`} from={Math.round(((e.vt - from) / speed) * fps)} durationInFrames={10} layout="none">
              <Audio src={staticFile(CONFIG.sfx.click)} volume={0.9} />
            </Sequence>
          ))}
      {!muted &&
        inShot
          .filter((e) => e.type === 'type')
          .map((e, i) => (
            <Sequence key={`t${i}`} from={Math.round(((e.vt - from) / speed) * fps)} durationInFrames={Math.round(fps * 1.4)} layout="none">
              <Audio src={staticFile(CONFIG.sfx.typing)} volume={0.8} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};
