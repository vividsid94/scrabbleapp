import React, { useState } from 'react';
import { useEscapeRoom3DStore } from '../../stores/escapeRoom3DStore';
import { PhysicalPuzzle } from './PhysicalPuzzles';
import './EscapeRoom3D.css';
import './PhysicalPuzzles.css';

// Simple 3D Escape Room Fallback
const EscapeRoom3DSimple = () => {
  const {
    currentRoom,
    rooms,
    gameStarted,
    gameEnded,
    timeRemaining,
    score,
    currentPuzzle,
    hintsUsed,
    maxHints,
    soundEnabled,
    startGame,
    endGame,
    useHint: hintAction,
    tickTimer,
    resetGame,
    toggleSound
  } = useEscapeRoom3DStore();

  const [showRoomSelect, setShowRoomSelect] = useState(true);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [currentWord, setCurrentWord] = useState('');

  const handleStartGame = (roomId) => {
    startGame(roomId);
    setShowRoomSelect(false);
  };

  const handleTileClick = (tile, tileIndex) => {
    if (selectedTiles.includes(tileIndex)) {
      // Remove tile
      const newSelectedTiles = selectedTiles.filter(index => index !== tileIndex);
      setSelectedTiles(newSelectedTiles);
      setCurrentWord(newSelectedTiles.map(i => currentPuzzle.tiles[i]).join(''));
    } else {
      // Add tile
      const newSelectedTiles = [...selectedTiles, tileIndex];
      setSelectedTiles(newSelectedTiles);
      setCurrentWord(newSelectedTiles.map(i => currentPuzzle.tiles[i]).join(''));
    }
  };

  const handleSubmit = () => {
    if (currentWord.toUpperCase() === currentPuzzle.solution) {
      // Puzzle solved!
      alert('Puzzle solved! Moving to next puzzle...');
      setSelectedTiles([]);
      setCurrentWord('');
    } else {
      alert('Wrong answer! Try again.');
      setSelectedTiles([]);
      setCurrentWord('');
    }
  };

  const handleHint = () => {
    hintAction();
  };

  const handleReset = () => {
    resetGame();
    setShowRoomSelect(true);
    setSelectedTiles([]);
    setCurrentWord('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showRoomSelect) {
    return (
      <div className="escape-room-3d-container">
        <div className="room-select-screen-3d">
          <h1 className="escape-room-title-3d">🧩 3D Scrabble Escape Rooms 🧩</h1>
          <p className="escape-room-subtitle-3d">Step into a fully immersive 3D world of word puzzles!</p>
          
          <div className="rooms-grid-3d">
            {Object.values(rooms).map((room) => (
              <div 
                key={room.id} 
                className={`room-card-3d ${room.unlocked ? 'unlocked' : 'locked'}`}
                onClick={() => room.unlocked && handleStartGame(room.id)}
              >
                <div className="room-icon-3d">
                  {room.id === 'mystery' && '📚'}
                  {room.id === 'scifi' && '🔬'}
                  {room.id === 'horror' && '👻'}
                </div>
                <h3>{room.name}</h3>
                <p>{room.description}</p>
                <div className="room-stats-3d">
                  <span>⏱️ {room.timeLimit} min</span>
                  <span>🎯 {room.difficulty}</span>
                  {room.completed && <span>✅ Completed</span>}
                </div>
                {!room.unlocked && (
                  <div className="locked-overlay-3d">
                    <span>🔒 Locked</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="escape-room-controls-3d">
            <button onClick={toggleSound} className="sound-toggle-3d">
              {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameEnded) {
    const success = timeRemaining > 0;
    return (
      <div className="escape-room-3d-container">
        <div className="game-end-screen-3d">
          <div className={`end-message-3d ${success ? 'success' : 'failure'}`}>
            <h1>{success ? '🎉 Congratulations! You Escaped! 🎉' : '⏰ Time\'s Up! Better Luck Next Time!'}</h1>
            <p>Final Score: {score}</p>
            <p>Hints Used: {hintsUsed}/{maxHints}</p>
            <div className="end-buttons-3d">
              <button onClick={handleReset} className="play-again-btn-3d">
                Play Again
              </button>
              <button onClick={() => setShowRoomSelect(true)} className="room-select-btn-3d">
                Choose Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="escape-room-3d-container">
        <div className="loading-screen-3d">
          <h2>Loading your 3D escape room...</h2>
        </div>
      </div>
    );
  }

  const room = rooms[currentRoom];
  const puzzle = currentPuzzle;

  return (
    <div className="escape-room-3d-container">
      {/* 3D Visual Effects Simulation */}
      <div className="room-3d-visual">
        <div className="room-3d-background">
          <div className="room-3d-walls">
            <div className="room-3d-wall front"></div>
            <div className="room-3d-wall back"></div>
            <div className="room-3d-wall left"></div>
            <div className="room-3d-wall right"></div>
            <div className="room-3d-ceiling"></div>
            <div className="room-3d-floor"></div>
          </div>
          
          {/* Floating Particles */}
          <div className="particles-3d">
            {Array.from({ length: 50 }).map((_, i) => (
              <div 
                key={i} 
                className="particle-3d"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 3D UI Overlay */}
      <div className="ui-3d-overlay">
        <div className="ui-timer">
          ⏱️ {formatTime(timeRemaining)}
        </div>
        <div className="ui-score">
          🏆 {score}
        </div>
        <div className="ui-hints">
          💡 {hintsUsed}/{maxHints}
          <button onClick={handleHint} className="hint-btn-3d">
            Use Hint
          </button>
        </div>
        <button onClick={handleReset} className="reset-btn-3d">
          Reset
        </button>
      </div>

      {/* Physical 3D Puzzles */}
      {puzzle && (
        <PhysicalPuzzle
          puzzle={puzzle}
          onSolve={(puzzleId, data) => {
            // Handle puzzle solve
            alert(`Puzzle solved! Moving to next puzzle...`);
            setSelectedTiles([]);
            setCurrentWord('');
          }}
          isSolved={false}
          theme={currentRoom}
        />
      )}
    </div>
  );
};

export default EscapeRoom3DSimple;
