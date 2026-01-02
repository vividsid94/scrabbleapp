import { create } from 'zustand';

export const useColorSchemeStore = create((set, get) => {
  // Initial state - using the viewer's color scheme as the global default
  // Default lightMode is 'dark', so protiles color starts as light grey
  const initialState = {
    color: { current: '#d1d5db' },
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