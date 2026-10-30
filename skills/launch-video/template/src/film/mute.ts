import { createContext, useContext } from 'react';

// The vertical (9:16) composition draws the film twice (blurred background + sharp foreground).
// The background copy is muted through this context so audio is not doubled.
export const MuteContext = createContext(false);
export const useMuted = () => useContext(MuteContext);
