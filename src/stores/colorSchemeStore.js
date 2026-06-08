import { create } from 'zustand';

/** Classic protile tints — warm browns, not bright orange */
export const DEFAULT_TILE_COLOR = {
  dark: '#B45309',
  light: '#C47F36',
};

/** Previous theme defaults — reset guests still on these when defaults change */
export const LEGACY_TILE_DEFAULTS = ['#F97316', '#92400E'];

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