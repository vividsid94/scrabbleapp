// Simple sound management functions for the Play component

// Simple sound player that doesn't fail
class SimpleSoundPlayer {
  constructor(soundPath) {
    this.path = soundPath;
    // Preload the audio immediately
    this.audio = new Audio(soundPath);
    this.audio.volume = 0.3; // Lower volume
    this.audio.preload = 'auto';
    // Start loading the audio file
    this.audio.load();
  }

  play() {
    console.log('🔊 SimpleSoundPlayer.play() called for:', this.path);
    try {
      // Reset to beginning and play
      this.audio.currentTime = 0;
      this.audio.play().catch(() => {
        // Silently fail - most browsers block autoplay anyway
      });
    } catch (error) {
      // Silently fail - sounds are not critical
    }
  }
}

// Create sound players for each type
const gameStartSound = new SimpleSoundPlayer('/sounds/game-start.mp3');
const playerMoveSoundClassic = new SimpleSoundPlayer('/sounds/player-move.mp3');
const playerMoveSoundSword = new SimpleSoundPlayer('/sounds/player-move-sword.mp3');
const playerMoveSoundPuzzle = new SimpleSoundPlayer('/sounds/player-move-puzzle.mp3');
const botMoveSoundClassic = new SimpleSoundPlayer('/sounds/bot-move.mp3');
const botMoveSoundSword = new SimpleSoundPlayer('/sounds/bot-move-sword.mp3');
const botMoveSoundPuzzle = new SimpleSoundPlayer('/sounds/bot-move-puzzle.mp3');
const puzzleClickSound = new SimpleSoundPlayer('/sounds/puzzle-click.mp3');

export const initializeSounds = () => {
  // Return simple objects that just wrap the sound players
  const sounds = {
    gameStartSound: { play: () => gameStartSound.play() },
    playerMoveSound: { play: () => playerMoveSoundPuzzle.play() },
    botMoveSound: { play: () => botMoveSoundPuzzle.play() },
    puzzleClickSound: { play: () => puzzleClickSound.play() }
  };
  console.log('🎵 initializeSounds returning:', sounds);
  return sounds;
};

export const updateSoundType = (soundRef, soundType, soundName) => {
  console.log(`🎵 Updating ${soundName} sound to: ${soundType}`);
  
  if (soundName === 'player') {
    if (soundType === 'sword') {
      soundRef.current = { play: () => playerMoveSoundSword.play() };
    } else if (soundType === 'puzzle') {
      soundRef.current = { play: () => playerMoveSoundPuzzle.play() };
    } else {
      soundRef.current = { play: () => playerMoveSoundClassic.play() };
    }
  } else if (soundName === 'bot') {
    if (soundType === 'sword') {
      soundRef.current = { play: () => botMoveSoundSword.play() };
    } else if (soundType === 'puzzle') {
      soundRef.current = { play: () => botMoveSoundPuzzle.play() };
    } else {
      soundRef.current = { play: () => botMoveSoundClassic.play() };
    }
  }
};

export const handleSoundError = (sound, name, setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen) => {
  // Don't show errors for sounds - they're not critical
  console.log(`Sound error for ${name} - ignoring`);
}; 