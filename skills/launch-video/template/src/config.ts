// =============================================================================
// FILM CONFIG — the only file you normally edit.
//
// Every meme, clip, recording, sound and line of text in the film lives here.
// Swap a path (files go in /public) or a string, then re-render.
// Timing is in BEATS of the music track, so every cut lands on the beat.
//
// The demo values point at placeholder assets made by `npm run demo-assets`.
// =============================================================================

import searchEvents from './data/demo-search.events.json';
import aiEvents from './data/demo-ai.events.json';
import captionEvents from './data/demo-caption.events.json';

export type Cam = [t: number, cx: number, cy: number, zoom: number]; // source seconds, CSS px in the recording viewport, zoom
export type RecEvent = { vt: number; type: string; x?: number; y?: number; x1?: number; y1?: number; x2?: number; y2?: number };

export const CONFIG = {
  fps: 30,
  width: 1920,
  height: 1080,

  // ---------------------------------------------------------------------------
  // MUSIC: the drop is anchored to `anchorShot`. Everything after the anchor
  // must only change length in WHOLE BARS (multiples of 4 beats), otherwise
  // every later sound effect drifts off the music (see references/06-editing.md).
  // ---------------------------------------------------------------------------
  music: {
    file: 'audio/music/demo-track.wav',
    bpm: 130,
    drop: 6.92, // seconds into the track where the drop lands (from scripts/beats.py)
    anchorShot: 'meme-3', // shot id the drop lands on
    volume: 0.8,
    duckBeforeShot: 'meme-1', // music sits at 30% until this shot (lets the opening clip audio breathe)
  },

  // Recording viewport (CSS px) used by scripts/record.mjs. Camera coords use this space.
  viewport: { width: 1280, height: 720 },

  theme: {
    titleBar: '#000080', // Win95 navy
    face: '#c0c0c0', // Win95 grey
    wallpaper: 'brand/wallpaper.png',
    pixelFont: null as string | null, // optional .woff2 in /public for the brand name + URL, e.g. 'fonts/pixel.woff2'
    uiFont: 'Tahoma, Verdana, Arial, sans-serif',
  },

  brand: {
    name: 'ACMEWARE', // typed on the end card
    appWindowTitle: 'Acmeware', // title bar of the app window
    tagline: 'the only software you need for memes',
    url: 'acmeware.app',
    button: 'open acmeware',
    logo: 'brand/logo.png',
    // Mascot poses (transparent PNGs). Set any to null to leave the mascot out of that scene.
    mascot: {
      grab: 'brand/mascot-grab.png' as string | null, // pullback: yanks the meme out of the player
      nervous: 'brand/mascot-nervous.png' as string | null, // callback dialog
      press: 'brand/mascot-press.png' as string | null, // end card: jabs the button
    },
  },

  // ---------------------------------------------------------------------------
  // OPENING: "the internet keeps the moment". Each pair = original clip, then the meme it became.
  // pulseAt: seconds (into the clip) of words to punch-in on, e.g. a chant. Optional.
  // tailAudio: audio that rings over the meme pop (e.g. the last word, if the clip cuts away). Optional.
  // ---------------------------------------------------------------------------
  opening: [
    { id: 1, clip: 'opening/clip-1.mp4', meme: 'opening/meme-1.png', clipBeats: 4.5, memeBeats: 4, clipStart: 0, fit: 'contain', pulseAt: [0.15, 0.95, 1.7] as number[], tailAudio: null as string | null },
    { id: 2, clip: 'opening/clip-2.mp4', meme: 'opening/meme-2.png', clipBeats: 6, memeBeats: 4, clipStart: 0, fit: 'cover', pulseAt: [] as number[], tailAudio: null as string | null },
    { id: 3, clip: 'opening/clip-3.mp4', meme: 'opening/meme-3.png', clipBeats: 2, memeBeats: 4, clipStart: 0, fit: 'cover', pulseAt: [] as number[], tailAudio: null as string | null },
  ] as const,

  // Pullback: the last opening meme freezes, the camera pulls back to a desktop,
  // the mascot yanks the frame out, then the app window opens on top.
  pullback: { beats: 8, memeIndex: 2, playerTitle: 'launch.mp4 - Media Player', appPreview: 'rec/demo-search.mp4' },

  // ---------------------------------------------------------------------------
  // PRODUCT: real screen recordings (scripts/record.mjs). One entry per shot.
  // from/speed are in source seconds; cam keys pan/zoom the recording;
  // stamp shows an honest "generation skipped" badge; flash marks a reveal.
  // ---------------------------------------------------------------------------
  product: [
    { id: 'search', src: 'rec/demo-search.mp4', events: searchEvents as RecEvent[], beats: 4, from: 0.2, speed: 1.4, cursor: true, cam: [[0.2, 640, 360, 1.15], [1.2, 300, 260, 2.2], [3.0, 300, 260, 2.2]] as Cam[], stamp: null as string | null, flash: false, sfx: [] as string[] },
    { id: 'results', src: 'rec/demo-search.mp4', events: searchEvents as RecEvent[], beats: 2, from: 3.2, speed: 1, cursor: true, cam: [[3.2, 300, 430, 2.2], [4.1, 300, 470, 1.9]] as Cam[], stamp: null as string | null, flash: false, sfx: [] as string[] },
    { id: 'ai-type', src: 'rec/demo-ai.mp4', events: aiEvents as RecEvent[], beats: 4, from: 0.2, speed: 2.5, cursor: true, cam: [[0.2, 760, 470, 1.4], [1.2, 1050, 260, 2.1], [4.6, 1050, 330, 2.0]] as Cam[], stamp: null as string | null, flash: false, sfx: [] as string[] },
    { id: 'ai-wait', src: 'rec/demo-ai.mp4', events: aiEvents as RecEvent[], beats: 2, from: 4.7, speed: 1.5, cursor: false, cam: [[4.7, 1050, 450, 2.1], [6.0, 1050, 470, 2.0]] as Cam[], stamp: '⏩ 62s generation skipped' as string | null, flash: false, sfx: ['tapeStop'] as string[] },
    { id: 'ai-result', src: 'rec/demo-ai.mp4', events: aiEvents as RecEvent[], beats: 4, from: 6.2, speed: 1, cursor: false, cam: [[6.2, 640, 330, 2.6], [7.0, 640, 340, 2.3], [7.9, 640, 360, 1.6]] as Cam[], stamp: null as string | null, flash: true, sfx: ['errorChime', 'glitch'] as string[] },
    { id: 'caption', src: 'rec/demo-caption.mp4', events: captionEvents as RecEvent[], beats: 6, from: 0.2, speed: 1.4, cursor: true, cam: [[0.2, 960, 320, 1.5], [0.9, 640, 200, 1.75], [3.0, 640, 210, 1.75], [3.9, 640, 330, 1.45]] as Cam[], stamp: null as string | null, flash: false, sfx: [] as string[] },
  ],

  // Payoff: the finished video meme (a REAL export from your product) plays with its own audio.
  // The music cuts out on a record scratch right before it and comes back after.
  payoff: { video: 'exports/meme.mp4', audio: 'exports/meme-audio.wav' as string | null, seconds: 5.2, hitAt: 0.72, windowTitle: 'meme.mp4' },

  // One joke, three formats (all real exports).
  formats: { image: 'exports/meme.png', video: 'exports/meme.mp4', gif: 'exports/meme-gif.mp4', videoSeconds: 5.2, gifSeconds: 5.2, beats: 4 },

  // Callback joke: a dialog pops up, the cursor drifts to "Yes", hesitates, clicks "No". Set to null to skip.
  callback: { question: 'Start live demo?', yes: 'Yes', no: 'No', beats: 5 } as { question: string; yes: string; no: string; beats: number } | null,

  // End card: app window slams in on the bar, brand types on, mascot presses the button,
  // then a full-colour screen types the URL with a blinking block cursor.
  end: { beats: 10 },

  // Sound effects (scripts/synth_sfx.sh makes a royalty-free set; swap in licensed ones if you like).
  sfx: {
    click: 'audio/sfx/click.wav',
    typing: 'audio/sfx/typing.wav',
    whoosh: 'audio/sfx/whoosh.wav',
    swoosh: 'audio/sfx/swoosh.wav',
    pop: 'audio/sfx/pop.wav',
    windowClose: 'audio/sfx/blip.wav',
    errorChime: 'audio/sfx/error-chime.wav',
    glassShatter: 'audio/sfx/shatter.wav',
    impact: 'audio/sfx/impact.wav',
    boom: 'audio/sfx/boom.wav',
    bigBoom: 'audio/sfx/big-boom.wav',
    shutter: 'audio/sfx/shutter.wav',
    tapeStop: 'audio/sfx/tape-stop.wav',
    glitch: 'audio/sfx/glitch.wav',
    scratch: 'audio/sfx/scratch.wav',
    success: 'audio/sfx/success.wav',
  },
};

export type SfxName = keyof typeof CONFIG.sfx;
