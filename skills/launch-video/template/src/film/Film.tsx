import React from 'react';
import { AbsoluteFill, Audio, Img, Loop, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { CONFIG, SfxName } from '../config';
import { CursorBurst, Flash, GlitchFilters, Shake, punchScale, whipIn } from './effects';
import { useMuted } from './mute';
import { ProductShot } from './ProductShot';
import { Button95, Cursor95, Window } from './Win95';

/* ============================== timeline ============================== */

const FPS = CONFIG.fps;
const BEAT = 60 / CONFIG.music.bpm;
const fr = (sec: number) => Math.round(sec * FPS);
const beats = (n: number) => fr(n * BEAT);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

type Shot = { id: string; beats: number };
const SHOTS: Shot[] = [
  ...CONFIG.opening.flatMap((o) => [
    { id: `clip-${o.id}`, beats: o.clipBeats },
    { id: `meme-${o.id}`, beats: o.memeBeats },
  ]),
  { id: 'pullback', beats: CONFIG.pullback.beats },
  ...CONFIG.product.map((p) => ({ id: `product-${p.id}`, beats: p.beats })),
  { id: 'payoff', beats: Math.ceil(CONFIG.payoff.seconds / BEAT) },
  { id: 'formats', beats: CONFIG.formats.beats },
  ...(CONFIG.callback ? [{ id: 'callback', beats: CONFIG.callback.beats }] : []),
  { id: 'end', beats: CONFIG.end.beats },
];

export const TIMELINE = (() => {
  let at = 0;
  const map: Record<string, { from: number; dur: number }> = {};
  for (const s of SHOTS) {
    const dur = beats(s.beats);
    map[s.id] = { from: at, dur };
    at += dur;
  }
  return { map, total: at };
})();
export const FILM_FRAMES = TIMELINE.total;

/* ============================== helpers ============================== */

const Sfx: React.FC<{ at: number; name: SfxName; volume?: number }> = ({ at, name, volume = 1 }) => {
  const muted = useMuted();
  if (muted) return null;
  return (
    <Sequence from={at} durationInFrames={fr(4)} layout="none">
      <Audio src={staticFile(CONFIG.sfx[name])} volume={volume} />
    </Sequence>
  );
};
const SfxFile: React.FC<{ at: number; src: string; volume?: number }> = ({ at, src, volume = 1 }) => {
  const muted = useMuted();
  if (muted) return null;
  return (
    <Sequence from={at} durationInFrames={fr(4)} layout="none">
      <Audio src={staticFile(src)} volume={volume} />
    </Sequence>
  );
};

const Wallpaper: React.FC = () => <Img src={staticFile(CONFIG.theme.wallpaper)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />;
const pixel = CONFIG.theme.pixelFont ? 'BrandPixel, monospace' : CONFIG.theme.uiFont;

const WhipIn: React.FC<{ dir: number; children: React.ReactNode }> = ({ dir, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={whipIn(f, 4, dir)}>{children}</AbsoluteFill>;
};

/* ============================== opening ============================== */

// The original moment. Punches in on every word listed in `pulseAt` (great for chants).
const OpenClip: React.FC<{ i: number; dur: number }> = ({ i, dur }) => {
  const f = useCurrentFrame();
  const muted = useMuted();
  const o = CONFIG.opening[i];
  const t = f / FPS + o.clipStart;
  const last = [...o.pulseAt].reverse().find((w) => w <= t);
  const since = last === undefined ? 99 : (t - last) * FPS;
  const pulse = since < 6 ? interpolate(since, [0, 6], [1.07, 1], clamp) : 1;
  const drift = interpolate(f, [0, dur], [1, 1.06], clamp);
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shake at={last === undefined ? 99999 : fr(last - o.clipStart)} frames={5} amp={10} seed={`ch${i}${last}`}>
        <OffthreadVideo src={staticFile(o.clip)} trimBefore={fr(o.clipStart)} muted={muted} style={{ width: '100%', height: '100%', objectFit: o.fit, transform: `scale(${pulse * drift})` }} />
      </Shake>
    </AbsoluteFill>
  );
};

// The meme the moment became: punch-in, shake, white flash.
const OpenMeme: React.FC<{ i: number; dur: number }> = ({ i, dur }) => {
  const f = useCurrentFrame();
  const o = CONFIG.opening[i];
  const zoom = punchScale(f, 0, 1.18, 6) * interpolate(f, [6, dur], [1, 1.06], clamp);
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shake at={0} frames={8} amp={18} seed={`m${i}`}>
        <Img src={staticFile(o.meme)} style={{ width: '100%', height: '100%', objectFit: o.fit, transform: `scale(${zoom})` }} />
      </Shake>
      <Flash frames={5} />
    </AbsoluteFill>
  );
};

/* ============================== pullback ============================== */

const Pullback: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { mascot, appWindowTitle } = CONFIG.brand;
  const meme = CONFIG.opening[CONFIG.pullback.memeIndex].meme;
  const out = spring({ frame: f, fps, config: { damping: 20, stiffness: 140 } });
  const s = interpolate(out, [0, 1], [1, 0.42]);
  const winX = interpolate(out, [0, 1], [0, 90]);
  const winY = interpolate(out, [0, 1], [0, 150]);
  const rot = spring({ frame: f - beats(1.5), fps, config: { damping: 12 } });
  const grab = mascot.grab ? spring({ frame: f - beats(3), fps, config: { damping: 10, stiffness: 160 } }) : 0;
  const app = spring({ frame: f - beats(5), fps, config: { damping: 13, stiffness: 190 } });
  const dive = interpolate(f, [beats(6.6), dur], [0, 1], { ...clamp, easing: (t) => t * t * t });
  const framed = out > 0.03;
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${1 + dive * 0.9})`, transformOrigin: '960px 520px' }}>
        <Wallpaper />
        <Window title={CONFIG.pullback.playerTitle} style={{ left: winX, top: winY, width: 1920 * s + 12, height: 1080 * s + 60, opacity: framed ? 1 : 0 }} />
        <Img
          src={staticFile(meme)}
          style={{
            position: 'absolute', left: winX + (framed ? 9 : 0), top: winY + (framed ? 57 : 0), width: 1920 * s - (framed ? 6 : 0),
            // pulled towards the mascot; ends in open space so it never covers the app window
            transform: `translate(${grab * 330}px, ${grab * 150}px) rotate(${grab * 6}deg) scale(${1 - grab * 0.12})`,
            boxShadow: grab > 0.05 ? '22px 22px 0 rgba(0,0,0,0.45)' : undefined, zIndex: 3,
          }}
        />
        {mascot.grab && (
          <Img src={staticFile(mascot.grab)} style={{ position: 'absolute', height: 900, bottom: -40, left: interpolate(rot, [0, 1], [2000, 1180]) + grab * 60, transform: `rotate(${(1 - rot) * 10}deg)`, zIndex: 4 }} />
        )}
        {f > beats(5) && (
          <>
            <AbsoluteFill style={{ background: 'rgba(0,0,40,0.35)', opacity: app, zIndex: 5 }} />
            <Window title={appWindowTitle} style={{ left: 260, top: 80, width: 1400, height: 880, transform: `scale(${app})`, zIndex: 6 }} bodyStyle={{ background: '#fff' }}>
              <OffthreadVideo src={staticFile(CONFIG.pullback.appPreview)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Window>
          </>
        )}
      </AbsoluteFill>
      <CursorBurst at={dur - 5} frames={5} seed="pb" />
    </AbsoluteFill>
  );
};

/* ============================== product overlays ============================== */

const Stamp: React.FC<{ text: string }> = ({ text }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 9, stiffness: 220 } });
  return (
    <div style={{ position: 'absolute', top: 70, left: '50%', transform: `translateX(-50%) scale(${s}) rotate(-3deg)`, background: CONFIG.theme.titleBar, color: '#fff', border: '4px solid #fff', boxShadow: '8px 8px 0 #000', fontFamily: pixel, fontSize: 44, padding: '10px 26px', zIndex: 70, whiteSpace: 'nowrap' }}>
      {text}
    </div>
  );
};

/* ============================== payoff ============================== */

const Payoff: React.FC = () => {
  const f = useCurrentFrame();
  const muted = useMuted();
  const p = CONFIG.payoff;
  const hit = fr(p.hitAt);
  const z = punchScale(f, hit, 1.07, 8);
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Wallpaper />
      <Shake at={hit} frames={12} amp={22} seed="pay">
        <Window title={p.windowTitle} style={{ left: 330, top: 26, width: 1260, height: 1028, transform: `scale(${z})` }}>
          <OffthreadVideo src={staticFile(p.video)} muted={muted || !!p.audio} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          {p.audio && !muted && <Audio src={staticFile(p.audio)} />}
        </Window>
      </Shake>
      <Flash at={hit} frames={4} strength={0.55} />
    </AbsoluteFill>
  );
};

/* ============================== formats ============================== */

const Formats: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const x = CONFIG.formats;
  const pop = (n: number) => spring({ frame: f - beats(n), fps, config: { damping: 12, stiffness: 200 } });
  return (
    <AbsoluteFill>
      <Wallpaper />
      <Window title="meme.png" style={{ left: 70, top: 90, width: 760, height: 610, transform: `scale(${pop(0)}) rotate(${(1 - pop(0)) * -8}deg)` }} bodyStyle={{ background: '#fff' }}>
        <Img src={staticFile(x.image)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </Window>
      <Window title="meme.mp4" style={{ left: 860, top: 60, width: 700, height: 620, transform: `scale(${pop(1)}) rotate(${(1 - pop(1)) * 8}deg)` }}>
        <Loop durationInFrames={fr(x.videoSeconds)}>
          <OffthreadVideo src={staticFile(x.video)} muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </Loop>
      </Window>
      <Window title="meme.gif" style={{ left: 1240, top: 540, width: 600, height: 500, transform: `scale(${pop(2)}) rotate(${(1 - pop(2)) * -8}deg)` }} bodyStyle={{ background: '#fff' }}>
        <Loop durationInFrames={fr(x.gifSeconds)}>
          <OffthreadVideo src={staticFile(x.gif)} muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </Loop>
      </Window>
    </AbsoluteFill>
  );
};

/* ============================== callback ============================== */

const Callback: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = CONFIG.callback!;
  const dlg = 0.35 + 0.65 * spring({ frame: f, fps, config: { damping: 11, stiffness: 300 } });
  const rot = spring({ frame: f - 2, fps, config: { damping: 12 } });
  const k = (a: number, b: number) => interpolate(f, [beats(a), beats(b)], [0, 1], { ...clamp, easing: (t) => t * t * (3 - 2 * t) });
  const toYes = k(0.5, 1.6); // drift towards "Yes"...
  const toNo = k(2.6, 3.3); // ...hesitate, then slide to "No"
  const cx = 1500 + (870 - 1500) * toYes + (1100 - 870) * toNo;
  const cy = 1010 + (655 - 1010) * toYes;
  const clickF = beats(3.5);
  return (
    <AbsoluteFill>
      <Wallpaper />
      <AbsoluteFill style={{ background: 'rgba(0,0,0,0.25)' }} />
      {f < clickF + 3 && (
        <Window title={CONFIG.brand.appWindowTitle} style={{ left: 600, top: 430, width: 720, height: 320, transform: `scale(${dlg})` }} bodyStyle={{ background: CONFIG.theme.face, boxShadow: 'none', padding: 28 }}>
          <div style={{ display: 'flex', gap: 22, alignItems: 'center', marginBottom: 40 }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: CONFIG.theme.titleBar, color: '#fff', fontFamily: CONFIG.theme.uiFont, fontWeight: 700, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>?</div>
            <div style={{ fontFamily: CONFIG.theme.uiFont, fontSize: 34, color: '#000' }}>{c.question}</div>
          </div>
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center' }}>
            <Button95 label={c.yes} />
            <Button95 label={c.no} pressed={f >= clickF} />
          </div>
        </Window>
      )}
      {CONFIG.brand.mascot.nervous && (
        <Img src={staticFile(CONFIG.brand.mascot.nervous)} style={{ position: 'absolute', height: 860, bottom: -60, left: interpolate(rot, [0, 1], [-640, 40]), transform: `rotate(${toYes > 0.9 && toNo < 0.1 ? -3 : 0}deg)` }} />
      )}
      <Cursor95 x={cx} y={cy} pressed={f >= clickF && f < clickF + 4} />
    </AbsoluteFill>
  );
};

/* ============================== end card ============================== */

export const END_PRESS_BEAT = 6;
const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = CONFIG.brand;
  const slam = spring({ frame: f, fps, config: { damping: 10, stiffness: 260 } });
  const typed = Math.min(b.name.length, Math.floor(interpolate(f, [beats(0.5), beats(1.5)], [0, b.name.length], clamp)));
  const tag = interpolate(f, [beats(1.5), beats(2.2)], [0, 1], clamp);
  const rot = spring({ frame: f - beats(2.5), fps, config: { damping: 12 } });
  const pressAt = beats(END_PRESS_BEAT);
  const pressed = f >= pressAt && f < pressAt + 6;
  const ease = { ...clamp, easing: (t: number) => t * t * (3 - 2 * t) };
  const cx = interpolate(f, [beats(4), beats(5.6)], [1760, 1090], ease);
  const cy = interpolate(f, [beats(4), beats(5.6)], [1040, 788], ease);

  if (f >= pressAt + 7) {
    // full-colour screen: URL types on with a blinking block cursor, punch + flash when complete
    const lf = f - (pressAt + 7);
    const n = Math.min(b.url.length, Math.floor(lf / 2) + 1);
    const done = n >= b.url.length;
    const doneAt = (b.url.length - 1) * 2;
    const punch = done ? punchScale(lf, doneAt, 1.14, 7) : 1;
    const blink = Math.floor(lf / 8) % 2 === 0;
    return (
      <AbsoluteFill style={{ background: CONFIG.theme.titleBar, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: pixel, fontSize: 110, color: '#fff', letterSpacing: 6, transform: `scale(${punch})`, display: 'flex', alignItems: 'center' }}>
          <span>{b.url.slice(0, n)}</span>
          <span style={{ display: 'inline-block', width: 56, height: 96, marginLeft: 10, background: '#fff', opacity: !done || blink ? 1 : 0 }} />
        </div>
        <Flash at={doneAt} frames={4} strength={0.35} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <Wallpaper />
      <Shake at={0} frames={9} amp={20} seed="end">
        <Window title={b.appWindowTitle} style={{ left: 330, top: 170, width: 1100, height: 700, transform: `scale(${0.6 + slam * 0.4})`, opacity: Math.min(1, slam * 2) }} bodyStyle={{ background: CONFIG.theme.face, boxShadow: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34 }}>
          <Img src={staticFile(b.logo)} style={{ width: 150, height: 150, imageRendering: 'pixelated' }} />
          <div style={{ fontFamily: pixel, fontSize: 128, color: CONFIG.theme.titleBar, letterSpacing: 10, minHeight: 140 }}>{b.name.slice(0, typed)}</div>
          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 44, color: '#000', opacity: tag, transform: `translateY(${(1 - tag) * 20}px)` }}>{b.tagline}</div>
          <div style={{ display: 'flex', gap: 44, alignItems: 'center', opacity: tag }}>
            <div style={{ fontFamily: pixel, fontSize: 50, color: '#000' }}>{b.url}</div>
            <Button95 label={b.button} pressed={pressed} />
          </div>
        </Window>
      </Shake>
      {b.mascot.press && <Img src={staticFile(b.mascot.press)} style={{ position: 'absolute', height: 880, bottom: -60, right: interpolate(rot, [0, 1], [-700, -20]) }} />}
      {f > beats(4) && <Cursor95 x={cx} y={cy} pressed={pressed} />}
      <Flash frames={4} strength={0.7} />
    </AbsoluteFill>
  );
};

/* ============================== the film ============================== */

export const Film: React.FC = () => {
  const T = TIMELINE.map;
  const muted = useMuted();
  const m = CONFIG.music;
  const musicStart = T[m.anchorShot].from - fr(m.drop); // the drop lands on the anchor shot
  const payoff = T['payoff'];
  const musicVolume = (abs: number) =>
    m.volume *
    interpolate(abs, [payoff.from - 3, payoff.from, payoff.from + payoff.dur - 4, payoff.from + payoff.dur], [1, 0, 0, 1], clamp) * // let the payoff's own audio land
    interpolate(abs, [TIMELINE.total - fr(1.2), TIMELINE.total], [1, 0], clamp) * // fade out at the end
    interpolate(abs, [T[m.duckBeforeShot].from - 2, T[m.duckBeforeShot].from], [0.3, 1], clamp); // sit under the opening clip

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {CONFIG.theme.pixelFont && <style>{`@font-face { font-family: 'BrandPixel'; src: url('${staticFile(CONFIG.theme.pixelFont)}') format('woff2'); }`}</style>}
      <GlitchFilters />

      {!muted && (
        <Sequence from={Math.max(0, musicStart)} layout="none">
          <Audio src={staticFile(m.file)} trimBefore={Math.max(0, -musicStart)} volume={(f) => musicVolume(f + Math.max(0, musicStart))} />
        </Sequence>
      )}

      {/* opening pairs */}
      {CONFIG.opening.map((o, i) => {
        const clip = T[`clip-${o.id}`];
        const meme = T[`meme-${o.id}`];
        const last = i === CONFIG.opening.length - 1;
        return (
          <React.Fragment key={o.id}>
            <Sequence from={clip.from} durationInFrames={clip.dur}><OpenClip i={i} dur={clip.dur} /></Sequence>
            <Sequence from={meme.from} durationInFrames={meme.dur}><OpenMeme i={i} dur={meme.dur} /></Sequence>
            <Sfx at={meme.from} name="shutter" volume={0.9} />
            <Sfx at={meme.from} name={last ? 'boom' : 'impact'} volume={last ? 1 : 0.8} />
            {o.tailAudio && <SfxFile at={meme.from} src={o.tailAudio} />}
          </React.Fragment>
        );
      })}

      {/* pullback */}
      <Sequence from={T['pullback'].from} durationInFrames={T['pullback'].dur}><Pullback dur={T['pullback'].dur} /></Sequence>
      <Sfx at={T['pullback'].from} name="whoosh" volume={0.8} />
      <Sfx at={T['pullback'].from + beats(1.5)} name="pop" />
      <Sfx at={T['pullback'].from + beats(3)} name="swoosh" />
      <Sfx at={T['pullback'].from + beats(5)} name="pop" />
      <Sfx at={T['pullback'].from + beats(6.6)} name="whoosh" volume={0.8} />

      {/* product */}
      {CONFIG.product.map((p, i) => {
        const s = T[`product-${p.id}`];
        return (
          <React.Fragment key={p.id}>
            <Sequence from={s.from} durationInFrames={s.dur}>
              <WhipIn dir={i % 2 ? -1 : 1}>
                <ProductShot src={p.src} events={p.events} from={p.from} speed={p.speed} durationInFrames={s.dur} cam={p.cam} cursor={p.cursor} />
              </WhipIn>
              {p.stamp && <Stamp text={p.stamp} />}
              {p.flash && <Flash frames={5} strength={0.8} />}
            </Sequence>
            {i > 0 && <Sfx at={s.from} name="swoosh" volume={0.45} />}
            {(p.sfx as SfxName[]).map((n) => <Sfx key={n} at={s.from} name={n} volume={0.8} />)}
            {p.flash && <Sfx at={s.from + 8} name="success" volume={0.6} />}
          </React.Fragment>
        );
      })}

      {/* payoff */}
      <Sequence from={payoff.from} durationInFrames={payoff.dur}><Payoff /></Sequence>
      <Sfx at={payoff.from - 4} name="scratch" volume={0.8} />
      <Sfx at={payoff.from} name="pop" />
      <Sfx at={payoff.from + fr(CONFIG.payoff.hitAt)} name="glassShatter" volume={0.7} />

      {/* formats */}
      <Sequence from={T['formats'].from} durationInFrames={T['formats'].dur}><Formats /></Sequence>
      {[0, 1, 2].map((n) => <Sfx key={`f${n}`} at={T['formats'].from + beats(n)} name="pop" volume={0.9} />)}

      {/* callback */}
      {CONFIG.callback && (
        <>
          <Sequence from={T['callback'].from} durationInFrames={T['callback'].dur}><Callback /></Sequence>
          <Sfx at={T['callback'].from} name="errorChime" volume={0.8} />
          <Sfx at={T['callback'].from + beats(3.5)} name="click" />
          <Sfx at={T['callback'].from + beats(3.6)} name="windowClose" />
        </>
      )}

      {/* end card: the big hit lands on the bar together with the window slam */}
      <Sequence from={T['end'].from} durationInFrames={T['end'].dur}><EndCard /></Sequence>
      <Sfx at={T['end'].from} name="bigBoom" />
      <Sfx at={T['end'].from + beats(END_PRESS_BEAT)} name="click" />
      <Sfx at={T['end'].from + beats(END_PRESS_BEAT) + 7} name="impact" />
      <Sfx at={T['end'].from + beats(END_PRESS_BEAT) + 7} name="typing" volume={0.6} />
    </AbsoluteFill>
  );
};
