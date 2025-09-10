import React, { useState, useEffect } from 'react';
import { useEscapeRoom3DStore } from '../../stores/escapeRoom3DStore';
import { PhysicalPuzzle } from './PhysicalPuzzles';
import './EscapeRoom3D.css';
import './PhysicalPuzzles.css';

// Real 3D Escape Room with Room Navigation
const RealEscapeRoom = () => {
  const {
    currentRoom,
    rooms,
    gameStarted,
    gameEnded,
    timeRemaining,
    score,
    currentPuzzle,
    currentWord: storeCurrentWord,
    selectedTiles: storeSelectedTiles,
    hintsUsed,
    maxHints,
    soundEnabled,
    startGame,
    endGame,
    moveToRoom,
    interactWithObject,
    submitWord,
    selectTile,
    useHint: hintAction,
    tickTimer,
    resetGame,
    toggleSound
  } = useEscapeRoom3DStore();

  const [selectedTiles, setSelectedTiles] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [showInventory, setShowInventory] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Timer effect
  useEffect(() => {
    if (gameStarted && !gameEnded) {
      const timer = setInterval(() => {
        tickTimer();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted, gameEnded, tickTimer]);

  const handleStartGame = () => {
    startGame('library');
  };

  const handleMoveToRoom = (direction) => {
    moveToRoom(direction);
    setSelectedTiles([]);
    setCurrentWord('');
  };

  const handleObjectClick = (object) => {
    console.log('Object clicked:', object);
    if (object.locked) {
      console.log('Object is locked, starting puzzle...');
      interactWithObject(object.id);
      setSelectedTiles([]);
      setCurrentWord('');
    } else {
      // Object is unlocked, can interact
      alert(`You examine the ${object.type}. It's unlocked and ready to use!`);
    }
  };

  const handleTileClick = (tile, tileIndex) => {
    selectTile(tile, tileIndex);
  };

  const handleSubmit = () => {
    if (storeCurrentWord.toUpperCase() === currentPuzzle.solution) {
      submitWord();
      alert('Puzzle solved! You can now use this object!');
      // The puzzle overlay will close automatically when currentPuzzle becomes null
    } else {
      alert('Wrong answer! Try again.');
    }
  };

  const handleHint = () => {
    hintAction();
  };

  const handleReset = () => {
    resetGame();
    setSelectedTiles([]);
    setCurrentWord('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!gameStarted) {
    return (
      <div className="escape-room-3d-container">
        <div className="room-select-screen-3d">
          <h1 className="escape-room-title-3d">🚪 Real 3D Escape Room 🚪</h1>
          <p className="escape-room-subtitle-3d">Navigate through interconnected rooms, solve puzzles, and escape!</p>
          
          <div className="escape-room-story">
            <h2>📖 The Story</h2>
            <p>You wake up in a mysterious library with no memory of how you got there. The doors are locked with word puzzles, and you must solve them to progress through the interconnected rooms and find your way out!</p>
            
            <h3>🎯 How to Play</h3>
            <ul>
              <li>Click on objects to interact with them</li>
              <li>Solve word puzzles to unlock doors and progress</li>
              <li>Navigate between rooms using the directional controls</li>
              <li>Collect items and clues to help you escape</li>
              <li>Find the final exit to win!</li>
            </ul>
          </div>
          
          <button onClick={handleStartGame} className="start-game-btn-3d">
            Start Your Escape! 🚀
          </button>
          
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
            </div>
          </div>
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

      {/* Room Navigation */}
      <div className="room-navigation">
        <div className="room-info">
          <h2 className="room-name">{room.name}</h2>
          <p className="room-description">{room.description}</p>
        </div>
        
        <div className="navigation-controls">
          <button 
            onClick={() => handleMoveToRoom('north')} 
            className={`nav-btn north ${!room.exits.north ? 'disabled' : ''}`}
            disabled={!room.exits.north}
          >
            ↑ North
          </button>
          <div className="nav-row">
            <button 
              onClick={() => handleMoveToRoom('west')} 
              className={`nav-btn west ${!room.exits.west ? 'disabled' : ''}`}
              disabled={!room.exits.west}
            >
              ← West
            </button>
            <button 
              onClick={() => handleMoveToRoom('east')} 
              className={`nav-btn east ${!room.exits.east ? 'disabled' : ''}`}
              disabled={!room.exits.east}
            >
              East →
            </button>
          </div>
          <button 
            onClick={() => handleMoveToRoom('south')} 
            className={`nav-btn south ${!room.exits.south ? 'disabled' : ''}`}
            disabled={!room.exits.south}
          >
            ↓ South
          </button>
        </div>
      </div>

      {/* Room Objects */}
      <div className="room-objects">
        {room.objects.map((object) => (
          <div
            key={object.id}
            className={`room-object ${object.type} ${object.locked ? 'locked' : 'unlocked'}`}
            style={{
              left: object.position.x,
              top: object.position.y
            }}
            onClick={() => handleObjectClick(object)}
          >
            <div className="object-icon">
              {object.type === 'door' && '🚪'}
              {object.type === 'bookshelf' && '📚'}
              {object.type === 'crystal' && '💎'}
              {object.type === 'desk' && '🪑'}
              {object.type === 'chair' && '🪑'}
              {object.type === 'scroll' && '📜'}
              {object.type === 'cauldron' && '⚗️'}
              {object.type === 'fountain' && '⛲'}
              {object.type === 'tree' && '🌳'}
              {object.type === 'window' && '🪟'}
            </div>
            <div className="object-label">
              {object.type} {object.locked ? '🔒' : '🔓'}
            </div>
          </div>
        ))}
      </div>

      {/* Current Puzzle */}
      {puzzle && (
        <div className="puzzle-overlay">
          <div className="puzzle-container">
            <div className="puzzle-header">
              <h3>Puzzle: {puzzle.type.replace('_', ' ').toUpperCase()}</h3>
              <button 
                onClick={() => {
                  // Close puzzle by clearing currentPuzzle in store
                  useEscapeRoom3DStore.setState({ 
                    currentPuzzle: null,
                    selectedTiles: [], 
                    selectedTileIndices: [],
                    currentWord: '' 
                  });
                }}
                className="close-puzzle-btn"
              >
                ✕ Close
              </button>
            </div>
            <p>Solve this puzzle to unlock the object!</p>
            
            <div className="tiles-container">
              {puzzle.tiles.map((tile, index) => (
                <button
                  key={index}
                  className={`tile-3d ${storeSelectedTiles.includes(index) ? 'selected' : ''}`}
                  onClick={() => handleTileClick(tile, index)}
                >
                  {tile}
                </button>
              ))}
            </div>
            
            <div className="current-word-display">
              Current Word: {storeCurrentWord || 'Select tiles...'}
            </div>
            
            <div className="puzzle-controls">
              <button 
                onClick={handleSubmit}
                disabled={storeCurrentWord.length === 0}
                className="submit-btn-3d"
              >
                Submit Word
              </button>
              <button 
                onClick={() => {
                  useEscapeRoom3DStore.setState({ 
                    selectedTiles: [], 
                    selectedTileIndices: [],
                    currentWord: '' 
                  });
                }}
                className="clear-btn-3d"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory and Map Toggle */}
      <div className="game-controls">
        <button 
          onClick={() => setShowInventory(!showInventory)}
          className="inventory-btn"
        >
          🎒 Inventory
        </button>
        <button 
          onClick={() => setShowMap(!showMap)}
          className="map-btn"
        >
          🗺️ Map
        </button>
      </div>

      {/* Inventory Modal */}
      {showInventory && (
        <div className="modal-overlay" onClick={() => setShowInventory(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🎒 Inventory</h3>
            <div className="inventory-items">
              {room.inventory.length === 0 ? (
                <p>No items yet. Solve puzzles to collect items!</p>
              ) : (
                room.inventory.map((item, index) => (
                  <div key={index} className="inventory-item">
                    {item}
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setShowInventory(false)} className="close-btn">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMap && (
        <div className="modal-overlay" onClick={() => setShowMap(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🗺️ Room Map</h3>
            <div className="room-map">
              {Object.values(rooms).map((roomData) => (
                <div 
                  key={roomData.id} 
                  className={`map-room ${roomData.id === currentRoom ? 'current' : ''} ${roomData.unlocked ? 'unlocked' : 'locked'}`}
                >
                  {roomData.name}
                </div>
              ))}
            </div>
            <button onClick={() => setShowMap(false)} className="close-btn">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealEscapeRoom;
