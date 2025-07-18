import { create } from 'zustand';

export const useColorSchemeStore = create((set, get) => {
  // Initial state - using the viewer's color scheme as the global default
  const initialState = {
    color: { current: '#7878a4' },
    boardColor: { current: '#ffffff' },
  };

  return {
    ...initialState,
    
    // Actions
    setColor: (colorRef) => set({ color: colorRef }),
    setBoardColor: (colorRef) => set({ boardColor: colorRef }),
    
    // Helper function to update color values
    updateColor: (newColor) => {
      set({ color: { current: newColor } });
    },
    
    updateBoardColor: (newBoardColor) => {
      set({ boardColor: { current: newBoardColor } });
    },
  };
}); 