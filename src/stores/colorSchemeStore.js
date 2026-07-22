import { create } from 'zustand';

/** Dark mode back to the last-committed classic amber-brown; light mode
 * keeps the coffee-brown from this session's tweaking. */
export const DEFAULT_TILE_COLOR = {
  dark: '#B45309',
  light: '#9C8563',
};

/** Previous theme defaults — reset guests still on these when defaults change */
export const LEGACY_TILE_DEFAULTS = ['#F97316', '#92400E', '#C47F36', '#7D7364', '#6B2B4A', '#7A4A5E', '#5E2A45', '#7C5468', '#6B5F3E', '#8C8064', '#6C5842', '#9A8868', '#8A6D2C', '#B39B5E', '#96700F', '#C2A24E', '#584C34', '#8C7F60', '#4A3520', '#7C6847', '#5E4630', '#857154', '#716047'];

export const getDefaultTileColor = (lightMode = 'dark') =>
  lightMode === 'dark' ? DEFAULT_TILE_COLOR.dark : DEFAULT_TILE_COLOR.light;

export const useColorSchemeStore = create((set, get) => {
  const initialState = {
    color: { current: DEFAULT_TILE_COLOR.dark },
    boardColor: { current: '#fff' },
    showWoodenCircle: { current: false },
    showApplePolygon: { current: false },
  };

  return {
    ...initialState,
    
    // Actions
    setColor: (colorRef) => set({ color: colorRef }),
    setBoardColor: (colorRef) => set({ boardColor: colorRef }),
    setShowWoodenCircle: (showRef) => set({ showWoodenCircle: showRef }),
    setShowApplePolygon: (showRef) => set({ showApplePolygon: showRef }),
    
    // Helper function to update color values
    updateColor: (newColor) => {
      set({ color: { current: newColor } });
    },
    
    updateBoardColor: (newBoardColor) => {
      set({ boardColor: { current: newBoardColor } });
    },
    
    updateShowWoodenCircle: (show) => {
      set({ showWoodenCircle: { current: show } });
    },
    
    updateShowApplePolygon: (show) => {
      set({ showApplePolygon: { current: show } });
    },
  };
}); 