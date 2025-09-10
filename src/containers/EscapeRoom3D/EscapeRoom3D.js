import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Text, 
  Box, 
  Sphere, 
  Cylinder,
  Plane,
  Html
} from '@react-three/drei';
import { useEscapeRoomStore } from '../../stores/escapeRoomStore';
import './EscapeRoom3D.css';

// 3D Room Component
const Room3D = ({ roomType = 'mystery' }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  const getRoomTheme = () => {
    switch (roomType) {
      case 'mystery':
        return {
          wallColor: '#2C1810',
          floorColor: '#8B4513',
          ceilingColor: '#1A1A1A',
          ambientLight: '#4A4A4A',
          fogColor: '#2C1810'
        };
      case 'scifi':
        return {
          wallColor: '#0A0A2E',
          floorColor: '#16213E',
          ceilingColor: '#0F3460',
          ambientLight: '#00FFFF',
          fogColor: '#0A0A2E'
        };
      case 'horror':
        return {
          wallColor: '#1C1C1C',
          floorColor: '#2F2F2F',
          ceilingColor: '#000000',
          ambientLight: '#8B0000',
          fogColor: '#1C1C1C'
        };
      default:
        return {
          wallColor: '#2C1810',
          floorColor: '#8B4513',
          ceilingColor: '#1A1A1A',
          ambientLight: '#4A4A4A',
          fogColor: '#2C1810'
        };
    }
  };

  const theme = getRoomTheme();

  return (
    <group>
      {/* Floor */}
      <Plane 
        args={[20, 20]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -2, 0]}
        receiveShadow
      >
        <meshLambertMaterial color={theme.floorColor} />
      </Plane>

      {/* Walls */}
      <Box args={[20, 8, 0.5]} position={[0, 2, -10]}>
        <meshLambertMaterial color={theme.wallColor} />
      </Box>
      <Box args={[20, 8, 0.5]} position={[0, 2, 10]}>
        <meshLambertMaterial color={theme.wallColor} />
      </Box>
      <Box args={[0.5, 8, 20]} position={[-10, 2, 0]}>
        <meshLambertMaterial color={theme.wallColor} />
      </Box>
      <Box args={[0.5, 8, 20]} position={[10, 2, 0]}>
        <meshLambertMaterial color={theme.wallColor} />
      </Box>

      {/* Ceiling */}
      <Plane 
        args={[20, 20]} 
        rotation={[Math.PI / 2, 0, 0]} 
        position={[0, 6, 0]}
      >
        <meshLambertMaterial color={theme.ceilingColor} />
      </Plane>

      {/* Atmospheric Fog */}
      <fog attach="fog" args={[theme.fogColor, 1, 50]} />
    </group>
  );
};

// Interactive 3D Scrabble Tile
const ScrabbleTile3D = ({ letter, position, isSelected, onSelect, index }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1;
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.2;
      } else if (hovered) {
        meshRef.current.position.y = position[1] + 0.2;
        meshRef.current.scale.setScalar(1.1);
      } else {
        meshRef.current.position.y = position[1];
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <Box
      ref={meshRef}
      args={[0.8, 0.1, 0.8]}
      position={position}
      onClick={() => onSelect(letter, index)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
      receiveShadow
    >
      <meshLambertMaterial 
        color={isSelected ? '#4ECDC4' : hovered ? '#FFD93D' : '#F5F5DC'} 
        emissive={isSelected ? '#4ECDC4' : '#000000'}
        emissiveIntensity={isSelected ? 0.3 : 0}
      />
      <Text
        position={[0, 0.1, 0]}
        fontSize={0.4}
        color={isSelected ? '#FFFFFF' : '#000000'}
        anchorX="center"
        anchorY="middle"
        font="/fonts/helvetiker_regular.typeface.json"
      >
        {letter}
      </Text>
    </Box>
  );
};

// 3D Interactive Door
const Door3D = ({ puzzle, isUnlocked, onUnlock, theme }) => {
  const doorRef = useRef();
  const [isAnimating, setIsAnimating] = useState(false);
  
  useFrame((state) => {
    if (doorRef.current && isUnlocked) {
      doorRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  const handleClick = () => {
    if (!isUnlocked) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }
  };

  return (
    <group position={[0, 0, -9.5]}>
      <Box
        ref={doorRef}
        args={[3, 6, 0.2]}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        <meshLambertMaterial 
          color={isUnlocked ? '#8B4513' : '#654321'}
          emissive={isUnlocked ? '#FFD700' : '#000000'}
          emissiveIntensity={isUnlocked ? 0.2 : 0}
        />
      </Box>
      
      {/* Door Handle */}
      <Cylinder args={[0.1, 0.1, 0.2]} position={[1, 0, -0.1]} rotation={[0, 0, Math.PI / 2]}>
        <meshLambertMaterial color="#FFD700" />
      </Cylinder>
      
      {/* Door Lock Tiles */}
      <group position={[0, 1, 0.1]}>
        {puzzle.tiles.map((tile, index) => (
          <ScrabbleTile3D
            key={index}
            letter={tile}
            position={[index * 0.4 - 0.6, 0, 0]}
            isSelected={false}
            onSelect={() => {}}
            index={index}
          />
        ))}
      </group>
    </group>
  );
};

// 3D Crystal Orb
const CrystalOrb3D = ({ puzzle, isSolved, onSolve, theme }) => {
  const orbRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (orbRef.current) {
      orbRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      orbRef.current.position.y = 2 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      
      if (isSolved) {
        orbRef.current.scale.setScalar(1.2);
      } else if (hovered) {
        orbRef.current.scale.setScalar(1.1);
      } else {
        orbRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group position={[5, 0, 0]}>
      <Sphere
        ref={orbRef}
        args={[1, 32, 32]}
        onClick={() => onSolve(puzzle.id)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <meshPhongMaterial 
          color={isSolved ? '#00FF00' : hovered ? '#4ECDC4' : '#00FFFF'}
          transparent
          opacity={0.8}
          emissive={isSolved ? '#00FF00' : '#00FFFF'}
          emissiveIntensity={0.3}
        />
      </Sphere>
      
      {/* Orb Glow Effect */}
      <Sphere args={[1.2, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial 
          color="#00FFFF" 
          transparent 
          opacity={0.1}
        />
      </Sphere>
    </group>
  );
};

// 3D Bookshelf
const Bookshelf3D = ({ puzzle, isSolved, onSolve, theme }) => {
  const shelfRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (shelfRef.current) {
      if (hovered) {
        shelfRef.current.position.z = -8.5;
      } else {
        shelfRef.current.position.z = -9;
      }
    }
  });

  return (
    <group position={[-5, 0, 0]}>
      <Box
        ref={shelfRef}
        args={[2, 4, 0.5]}
        onClick={() => onSolve(puzzle.id)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <meshLambertMaterial color="#8B4513" />
      </Box>
      
      {/* Books */}
      {Array.from({ length: 20 }).map((_, i) => (
        <Box
          key={i}
          args={[0.15, 0.3, 0.4]}
          position={[
            -0.7 + (i % 5) * 0.35,
            -1.5 + Math.floor(i / 5) * 0.4,
            -0.1
          ]}
          castShadow
        >
          <meshLambertMaterial color={i % 3 === 0 ? '#8B0000' : i % 3 === 1 ? '#006400' : '#000080'} />
        </Box>
      ))}
    </group>
  );
};

// 3D UI Overlay
const UI3D = ({ timeRemaining, score, hintsUsed, maxHints, onHint, onReset }) => {
  return (
    <Html position={[0, 4, 0]} center>
      <div className="ui-3d-overlay">
        <div className="ui-timer">
          ⏱️ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
        </div>
        <div className="ui-score">
          🏆 {score}
        </div>
        <div className="ui-hints">
          💡 {hintsUsed}/{maxHints}
          <button onClick={onHint} className="hint-btn-3d">
            Use Hint
          </button>
        </div>
        <button onClick={onReset} className="reset-btn-3d">
          Reset
        </button>
      </div>
    </Html>
  );
};

// Main 3D Scene
const Scene3D = ({ roomType, puzzle, onSolve, onHint, onReset, timeRemaining, score, hintsUsed, maxHints }) => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 3, 5);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#4ECDC4" />
      
      {/* Room */}
      <Room3D roomType={roomType} />
      
      {/* Interactive Objects */}
      {puzzle && (
        <>
          {puzzle.type === 'word_lock' && (
            <Door3D 
              puzzle={puzzle} 
              isUnlocked={false} 
              onUnlock={onSolve}
              theme={roomType}
            />
          )}
          
          {puzzle.type === 'anagram' && (
            <Bookshelf3D 
              puzzle={puzzle} 
              isSolved={false} 
              onSolve={onSolve}
              theme={roomType}
            />
          )}
          
          {puzzle.type === 'word_chain' && (
            <CrystalOrb3D 
              puzzle={puzzle} 
              isSolved={false} 
              onSolve={onSolve}
              theme={roomType}
            />
          )}
        </>
      )}
      
      {/* Floating Scrabble Tiles */}
      {puzzle && puzzle.tiles && (
        <group position={[0, 2, 0]}>
          {puzzle.tiles.map((tile, index) => (
            <ScrabbleTile3D
              key={index}
              letter={tile}
              position={[
                (index - puzzle.tiles.length / 2) * 1.5,
                0,
                0
              ]}
              isSelected={false}
              onSelect={(letter, tileIndex) => onSolve(puzzle.id, letter, tileIndex)}
              index={index}
            />
          ))}
        </group>
      )}
      
      {/* UI Overlay */}
      <UI3D
        timeRemaining={timeRemaining}
        score={score}
        hintsUsed={hintsUsed}
        maxHints={maxHints}
        onHint={onHint}
        onReset={onReset}
      />
    </>
  );
};

// Main 3D Escape Room Component
const EscapeRoom3D = () => {
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
  } = useEscapeRoomStore();

  const [showRoomSelect, setShowRoomSelect] = useState(true);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [currentWord, setCurrentWord] = useState('');

  const handleStartGame = (roomId) => {
    startGame(roomId);
    setShowRoomSelect(false);
  };

  const handleSolve = (puzzleId, letter, tileIndex) => {
    if (letter && tileIndex !== undefined) {
      // Handle tile selection
      const newSelectedTiles = [...selectedTiles, letter];
      setSelectedTiles(newSelectedTiles);
      setCurrentWord(newSelectedTiles.join(''));
      
      // Check if word is complete
      if (currentPuzzle && newSelectedTiles.join('').toUpperCase() === currentPuzzle.solution) {
        // Puzzle solved!
        setTimeout(() => {
          setSelectedTiles([]);
          setCurrentWord('');
        }, 1000);
      }
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

  return (
    <div className="escape-room-3d-container">
      <Canvas
        shadows
        camera={{ position: [0, 3, 5], fov: 75 }}
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
      >
        <Suspense fallback={null}>
          <Scene3D
            roomType={currentRoom}
            puzzle={currentPuzzle}
            onSolve={handleSolve}
            onHint={handleHint}
            onReset={handleReset}
            timeRemaining={timeRemaining}
            score={score}
            hintsUsed={hintsUsed}
            maxHints={maxHints}
          />
        </Suspense>
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 6}
        />
      </Canvas>
      
      {/* 3D Word Display */}
      {currentWord && (
        <div className="word-display-3d">
          <div className="current-word-3d">
            {currentWord || 'Select tiles to form a word...'}
          </div>
        </div>
      )}
    </div>
  );
};

export default EscapeRoom3D;
