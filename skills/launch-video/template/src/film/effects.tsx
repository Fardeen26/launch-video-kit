import React from 'react';
import { AbsoluteFill, interpolate, random, useCurrentFrame } from 'remotion';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// White (or any colour) flash that decays over `frames`.
export const Flash: React.FC<{ at?: number; frames?: number; color?: string; strength?: number }> = ({ at = 0, frames = 5, color = '#fff', strength = 0.9 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at, at + frames], [strength, 0], clamp);
  if (f < at || o <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, zIndex: 80, pointerEvents: 'none' }} />;
};

// Decaying random shake applied to children, starting at `at`.
export const Shake: React.FC<{ at: number; frames?: number; amp?: number; seed?: string; children: React.ReactNode }> = ({ at, frames = 10, amp = 26, seed = 's', children }) => {
  const f = useCurrentFrame();
  const k = f >= at ? interpolate(f, [at, at + frames], [1, 0], clamp) : 0;
  const dx = (random(`${seed}x${f}`) - 0.5) * 2 * amp * k;
  const dy = (random(`${seed}y${f}`) - 0.5) * 2 * amp * k;
  const rot = (random(`${seed}r${f}`) - 0.5) * 2 * k;
  return <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)` }}>{children}</AbsoluteFill>;
};

// Scale punch: jumps to `peak` at `at` then settles to 1.
export const punchScale = (f: number, at: number, peak = 1.12, frames = 7) =>
  f < at ? 1 : interpolate(f, [at, at + frames], [peak, 1], clamp);

// RGB-split glitch frames: render children three times with offsets during [at, at+frames).
export const Glitch: React.FC<{ at: number; frames?: number; children: React.ReactNode; seed?: string }> = ({ at, frames = 6, children, seed = 'g' }) => {
  const f = useCurrentFrame();
  const on = f >= at && f < at + frames;
  if (!on) return <AbsoluteFill>{children}</AbsoluteFill>;
  const off = 14 + random(`${seed}${f}`) * 22;
  const slice = random(`${seed}s${f}`) * 900;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${-off}px)`, mixBlendMode: 'screen', filter: 'url(#red)', opacity: 0.9 }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${off}px)`, mixBlendMode: 'screen', filter: 'url(#cyan)', opacity: 0.9 }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(${slice}px 0 ${1080 - slice - 90}px 0)`, transform: `translateX(${off * 2}px)` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export const GlitchFilters: React.FC = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <filter id="red"><feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" /></filter>
    <filter id="cyan"><feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" /></filter>
  </svg>
);

// Horizontal whip: content slides in from the side with motion blur over `frames`.
export const whipIn = (f: number, frames = 6, dir = 1) => {
  const p = interpolate(f, [0, frames], [0.45, 0], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  return { transform: `translateX(${dir * p * 1920}px)`, filter: p > 0.02 ? `blur(${p * 50}px)` : undefined };
};

// Flying Win95 cursors burst (ref: pixel-cursor transitions), used for 4-8 frames between shots.
export const CursorBurst: React.FC<{ at: number; frames?: number; seed?: string }> = ({ at, frames = 8, seed = 'c' }) => {
  const f = useCurrentFrame();
  if (f < at || f >= at + frames) return null;
  const p = (f - at) / frames;
  return (
    <AbsoluteFill style={{ zIndex: 90, pointerEvents: 'none' }}>
      {Array.from({ length: 26 }).map((_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const r = 120 + random(`${seed}r${i}`) * 1100 * p;
        const s = 1.5 + random(`${seed}s${i}`) * 4;
        return (
          <svg key={i} viewBox="0 0 12 20" style={{ position: 'absolute', left: 960 + Math.cos(a) * r, top: 540 + Math.sin(a) * r * 0.6, width: 12 * s, height: 20 * s, transform: `rotate(${a * 57}deg)` }}>
            <polygon points="0,0 0,16 4,12 7,19 9,18 6,11 11,11" fill="#fff" stroke="#000" strokeWidth="1" />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};
