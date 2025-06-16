// Sound management functions for the Play component

export const initializeSounds = () => {
  const gameStartSound = new Audio('/sounds/game-start.mp3');
  const playerMoveSound = new Audio('/sounds/player-move.mp3');
  const botMoveSound = new Audio('/sounds/bot-move.mp3');
  
  return {
    gameStartSound,
    playerMoveSound,
    botMoveSound
  };
};

export const updateSoundType = (soundRef, soundType, soundName) => {
  try {
    if (!soundRef || !soundType || !soundName) {
      console.error('Missing required parameters for updateSoundType:', { soundRef, soundType, soundName });
      return;
    }
    const soundPath = `/sounds/${soundName}-move${soundType === 'sword' ? '-sword' : ''}.mp3`;
    soundRef.current = new Audio(soundPath);
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