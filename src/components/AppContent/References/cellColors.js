const lightCellColors = {
  0: {
    value: '',
    color: 'var(--board-color, white)',
  },
  1: {
    value: '',
    color: 'linear-gradient(to right bottom, rgba(126, 214, 221, 0.5), rgba(126, 214, 221, 0.95))',
  },
  2: {
    value: '',
    color: 'linear-gradient(to right bottom, rgba(114, 105, 214, 0.6), rgba(114, 105, 214, 0.95))',
  },
  3: {
    value: '',
    color: 'linear-gradient(to right bottom, rgba(244, 159, 212, 0.6), rgba(244, 159, 212, 0.9))',
  },
  4: {
    value: '',
    color: 'linear-gradient(to right bottom, rgba(206, 34, 34, 0.6), rgba(206, 34, 34, 0.9))',
  },
};

// Dark mode: same hues as light mode, flat fill — sharp gradient corners read as muddy on dark boards
const darkCellColors = {
  0: {
    value: '',
    color: 'var(--board-color, white)',
  },
  1: {
    value: '',
    color: 'rgba(126, 214, 221, 0.72)',
  },
  2: {
    value: '',
    color: 'rgba(114, 105, 214, 0.75)',
  },
  3: {
    value: '',
    color: 'rgba(244, 159, 212, 0.72)',
  },
  4: {
    value: '',
    color: 'rgba(206, 34, 34, 0.72)',
  },
};

export const getCellColors = (lightMode = 'dark') => {
  return lightMode === 'dark' ? darkCellColors : lightCellColors;
};

// Keep the old export for backward compatibility
export const cellColors = getCellColors('dark');
