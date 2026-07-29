import { create } from 'zustand';

// Ring buffer of captured console output, so a floating in-app panel can
// show logs without needing devtools attached - mainly for mobile, where
// there's usually no easy way to see console output at all.
const MAX_LOGS = 200;

let nextId = 0;

export const useConsoleLogStore = create((set) => ({
  logs: [],
  paused: false,
  isOpen: false,
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (isOpen) => set({ isOpen }),

  addLog: (level, args) => set((state) => {
    if (state.paused) return state;
    const entry = {
      id: nextId++,
      level,
      timestamp: Date.now(),
      message: args.map(formatArg).join(' ')
    };
    const logs = [...state.logs, entry];
    if (logs.length > MAX_LOGS) {
      logs.splice(0, logs.length - MAX_LOGS);
    }
    return { logs };
  }),

  clearLogs: () => set({ logs: [] }),
  setPaused: (paused) => set({ paused }),
}));

// Renders one console argument the way devtools roughly would: strings
// as-is, everything else JSON-stringified (falling back to String() for
// values JSON can't handle, like circular objects or functions).
function formatArg(arg) {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
  try {
    return JSON.stringify(arg, null, 2);
  } catch (err) {
    return String(arg);
  }
}
