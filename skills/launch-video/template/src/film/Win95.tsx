import React from 'react';
import { CONFIG } from '../config';

const { titleBar, face, uiFont } = CONFIG.theme;
const bevelOut = 'inset -2px -2px 0 #000, inset 2px 2px 0 #fff, inset -4px -4px 0 #808080, inset 4px 4px 0 #dfdfdf';
const bevelIn = 'inset 2px 2px 0 #000, inset -2px -2px 0 #fff, inset 4px 4px 0 #808080';

// Square, bevelled Win95 window with a solid title bar. No gradients, no rounded corners.
export const Window: React.FC<{ title: string; style?: React.CSSProperties; bodyStyle?: React.CSSProperties; children?: React.ReactNode }> = ({ title, style, bodyStyle, children }) => (
  <div style={{ position: 'absolute', background: face, boxShadow: `${bevelOut}, 12px 12px 0 rgba(0,0,0,0.35)`, padding: 6, display: 'flex', flexDirection: 'column', ...style }}>
    <div style={{ background: titleBar, color: '#fff', height: 42, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 0 12px', fontFamily: uiFont, fontWeight: 700, fontSize: 23 }}>
      <span>{title}</span>
      <span style={{ display: 'flex', gap: 4 }}>
        {['_', '□', '×'].map((c) => (
          <span key={c} style={{ width: 30, height: 28, background: face, color: '#000', boxShadow: bevelOut, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{c}</span>
        ))}
      </span>
    </div>
    <div style={{ flex: 1, marginTop: 6, boxShadow: bevelIn, overflow: 'hidden', position: 'relative', background: '#000', ...bodyStyle }}>{children}</div>
  </div>
);

export const Button95: React.FC<{ label: string; pressed?: boolean; style?: React.CSSProperties }> = ({ label, pressed, style }) => (
  <div style={{ background: face, boxShadow: pressed ? bevelIn : bevelOut, padding: '14px 38px', fontFamily: uiFont, fontSize: 30, fontWeight: 700, color: '#000', transform: pressed ? 'translate(2px,2px)' : undefined, ...style }}>{label}</div>
);

// Classic arrow cursor. Scales down for a couple of frames on click.
export const Cursor95: React.FC<{ x: number; y: number; scale?: number; pressed?: boolean }> = ({ x, y, scale = 2.6, pressed }) => (
  <svg viewBox="0 0 12 20" style={{ position: 'absolute', left: x, top: y, width: 12 * scale, height: 20 * scale, zIndex: 60, transform: `scale(${pressed ? 0.85 : 1})`, transformOrigin: '0 0' }}>
    <polygon points="0,0 0,16 4,12 7,19 9,18 6,11 11,11" fill="#fff" stroke="#000" strokeWidth="1" />
  </svg>
);
