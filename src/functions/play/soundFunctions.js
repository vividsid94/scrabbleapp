// Sound management functions for the Play component

export const initializeSounds = () => {
  try {
    const gameStartSound = new Audio('/sounds/game-start.mp3');
    const playerMoveSound = new Audio('/sounds/player-move.mp3');
    const botMoveSound = new Audio('/sounds/bot-move.mp3');
    
    // Add error handlers for debugging
    gameStartSound.addEventListener('error', (e) => {
      console.error('Error loading game-start sound:', e);
    });
    
    playerMoveSound.addEventListener('error', (e) => {
      console.error('Error loading player-move sound:', e);
    });
    
    botMoveSound.addEventListener('error', (e) => {
      console.error('Error loading bot-move sound:', e);
    });
    
    return {
      gameStartSound,
      playerMoveSound,
      botMoveSound
    };
  } catch (error) {
    console.error('Error initializing sounds:', error);
    // Return dummy audio objects to prevent crashes
    return {
      gameStartSound: { play: () => {}, addEventListener: () => {}, removeEventListener: () => {} },
      playerMoveSound: { play: () => {}, addEventListener: () => {}, removeEventListener: () => {} },
      botMoveSound: { play: () => {}, addEventListener: () => {}, removeEventListener: () => {} }
    };
  }
};

export const updateSoundType = (soundRef, soundType, soundName) => {
  try {
    if (!soundRef || !soundType || !soundName) {
      console.error('Missing required parameters for updateSoundType:', { soundRef, soundType, soundName });
      return;
    }
    const soundPath = `/sounds/${soundName}-move${soundType === 'sword' ? '-sword' : ''}.mp3`;
    console.log(`Loading sound from path: ${soundPath}`);
    soundRef.current = new Audio(soundPath);
    
    // Add error handler for debugging
    soundRef.current.addEventListener('error', (e) => {
      console.error(`Error loading ${soundName} move sound from ${soundPath}:`, e);
    });
    
    console.log(`${soundName} move sound updated:`, soundType);
  } catch (error) {
    console.error(`Error updating ${soundName} move sound:`, error);
  }
};

export const handleSoundError = (sound, name, setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen) => {
  console.error(`Error playing ${name} sound:`, sound.error);
  setSnackbarMessage(`Error playing ${name} sound`);
  setSnackbarSeverity('error');
  setSnackbarOpen(true);
}; 