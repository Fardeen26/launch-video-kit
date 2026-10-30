import React from 'react';
import { AbsoluteFill, Composition } from 'remotion';
import { CONFIG } from './config';
import { FILM_FRAMES, Film } from './film/Film';
import { MuteContext } from './film/mute';

// 9:16 cut for Reels / TikTok / Shorts: the 16:9 film sits in the middle at full width,
// over a blurred, muted, zoomed copy of itself.
const FilmVertical: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <MuteContext.Provider value>
      <AbsoluteFill style={{ width: CONFIG.width, height: CONFIG.height, transformOrigin: '0 0', transform: `scale(${1920 / CONFIG.height}) translateX(-${(CONFIG.width - (1080 * CONFIG.height) / 1920) / 2}px)`, filter: 'blur(28px) brightness(0.55)' }}>
        <Film />
      </AbsoluteFill>
    </MuteContext.Provider>
    <AbsoluteFill style={{ width: CONFIG.width, height: CONFIG.height, top: (1920 - (1080 * CONFIG.height) / CONFIG.width) / 2, transformOrigin: '0 0', transform: `scale(${1080 / CONFIG.width})` }}>
      <Film />
    </AbsoluteFill>
  </AbsoluteFill>
);

export const Root: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={FILM_FRAMES} fps={CONFIG.fps} width={CONFIG.width} height={CONFIG.height} />
    <Composition id="FilmVertical" component={FilmVertical} durationInFrames={FILM_FRAMES} fps={CONFIG.fps} width={1080} height={1920} />
  </>
);
