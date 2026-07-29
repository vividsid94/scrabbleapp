import { useConsoleLogStore } from '../stores/consoleLogStore';

// Patches the console methods once, at import time, so every console call
// anywhere in the app - including ones logged before any component mounts -
// also lands in consoleLogStore for the in-app dev console overlay to show.
// The original console behavior is preserved (devtools still get everything
// too); this only adds a second destination, never replaces the first.
const LEVELS = ['log', 'warn', 'error', 'info'];
let patched = false;

export function initConsoleLogCapture() {
  if (patched) return;
  patched = true;

  LEVELS.forEach((level) => {
    const original = console[level].bind(console);
    console[level] = (...args) => {
      original(...args);
      useConsoleLogStore.getState().addLog(level, args);
    };
  });
}
