import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import styles from './Scrabble3D.module.css';
import { getMoveSet } from '../../axios/api';
import { parseGCG } from '../../utils/gcgParser';
import { origPool, origBoard } from "../../components/AppContent/References/staticData.js";

const Scrabble3D = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Game state
  const [gameData, setGameData] = useState(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms per move
  const [boardState, setBoardState] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 20, 20);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(15, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    // Add point light for dramatic effect
    const pointLight = new THREE.PointLight(0xff6b6b, 0.5, 30);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    // Create 3D board
    createBoard(scene);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    setIsLoaded(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Load game data
  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        // Load a sample game (you can change this to any game number)
        const gameNum = 37033;
        const rawGCG = await getMoveSet('https://www.cross-tables.com/annotated/selfgcg/', gameNum);
        
        if (rawGCG) {
          const parsedMoves = parseGCG(rawGCG);
          console.log('Raw GCG:', rawGCG.substring(0, 500)); // Debug first 500 chars
          console.log('Parsed moves:', parsedMoves); // Debug parsed moves
          setGameData(parsedMoves);
          
          // Initialize board state
          const initialBoard = JSON.parse(origBoard).map(row => row.map(Number));
          setBoardState(initialBoard);
        }
      } catch (error) {
        console.error('Failed to load game:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, []);

  // Update board when move changes
  useEffect(() => {
    if (gameData && gameData.length > 0 && sceneRef.current) {
      updateBoardToMove(currentMoveIndex);
    }
  }, [currentMoveIndex, gameData]);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && gameData && currentMoveIndex < gameData.length - 1) {
      const timer = setTimeout(() => {
        setCurrentMoveIndex(prev => prev + 1);
      }, playbackSpeed);
      return () => clearTimeout(timer);
    } else if (isPlaying && currentMoveIndex >= gameData?.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentMoveIndex, gameData, playbackSpeed]);

  const createBoard = (scene) => {
    // Board base with better material
    const boardGeometry = new THREE.BoxGeometry(15, 0.5, 15);
    const boardMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8B4513,
      transparent: true,
      opacity: 0.95,
      shininess: 30
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.receiveShadow = true;
    board.position.y = -0.25;
    scene.add(board);

    // Create grid of squares with better spacing
    const squareSize = 1;
    const gridSize = 15;
    const startX = -(gridSize * squareSize) / 2 + squareSize / 2;
    const startZ = -(gridSize * squareSize) / 2 + squareSize / 2;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const squareGeometry = new THREE.BoxGeometry(squareSize * 0.9, 0.1, squareSize * 0.9);
        
        // Different colors for different square types
        let squareColor = 0xF5DEB3; // Default light brown
        if ((row === 0 || row === 14) && (col === 0 || col === 7 || col === 14)) squareColor = 0xFF6B6B; // Triple word
        else if ((row === 1 || row === 13) && (col === 1 || col === 13)) squareColor = 0x4ECDC4; // Double word
        else if ((row === 2 || row === 12) && (col === 2 || col === 12)) squareColor = 0x45B7D1; // Triple letter
        else if ((row === 3 || row === 11) && (col === 3 || col === 11)) squareColor = 0x96CEB4; // Double letter
        
        const squareMaterial = new THREE.MeshPhongMaterial({ 
          color: squareColor,
          transparent: true,
          opacity: 0.8
        });
        const square = new THREE.Mesh(squareGeometry, squareMaterial);
        square.position.set(
          startX + col * squareSize,
          0.1,
          startZ + row * squareSize
        );
        square.castShadow = true;
        square.receiveShadow = true;
        scene.add(square);
      }
    }
  };

  const updateBoardToMove = (moveIndex) => {
    if (!gameData || !sceneRef.current) return;

    console.log(`Updating to move ${moveIndex}, total moves: ${gameData.length}`);

    // Clear existing tiles
    tiles.forEach(tile => {
      sceneRef.current.remove(tile);
    });
    setTiles([]);

    // Start with a fresh board
    const newBoard = JSON.parse(origBoard).map(row => row.map(Number));
    const newTiles = [];

    // Apply moves one by one, building up the board state
    for (let i = 0; i <= moveIndex && i < gameData.length; i++) {
      const move = gameData[i];
      console.log(`Processing move ${i}:`, move);
      if (move && move.word && move.word !== "--" && move.location) {
        const moveTiles = applyMoveToBoard(newBoard, move, i);
        newTiles.push(...moveTiles);
      }
    }

    setBoardState(newBoard);
    setTiles(newTiles);
  };

  const applyMoveToBoard = (board, move, moveIndex) => {
    const tiles = [];
    const { location, word, player } = move;
    
    console.log(`Applying move: word="${word}", location="${location}", player=${player}`);
    
    // Parse location - handle both "H7" and "7H" formats
    let locationParts = location.match(/([A-O])(\d+)/); // Letter first: "H7"
    let col, row, direction;
    
    if (locationParts) {
      // Format: "H7" (letter first, then number) = VERTICAL play
      col = locationParts[1].charCodeAt(0) - 65; // A=0, B=1, etc.
      row = parseInt(locationParts[2]) - 1;
      direction = 'vertical';
    } else {
      // Try format: "7H" (number first, then letter) = HORIZONTAL play
      locationParts = location.match(/(\d+)([A-O])/);
      if (locationParts) {
        row = parseInt(locationParts[1]) - 1;
        col = locationParts[2].charCodeAt(0) - 65; // A=0, B=1, etc.
        direction = 'horizontal';
      } else {
        console.log('Failed to parse location:', location);
        return tiles;
      }
    }
    
    console.log(`Parsed location: row=${row}, col=${col}, direction=${direction}`);
    
    console.log(`Direction: ${direction}, word length: ${word.length}`);

    // Place each letter
    for (let i = 0; i < word.length; i++) {
      const letter = word[i];
      let tileRow, tileCol;

      if (direction === 'horizontal') {
        tileRow = row;
        tileCol = col + i;
      } else {
        tileRow = row + i;
        tileCol = col;
      }

      console.log(`Placing letter "${letter}" at (${tileRow}, ${tileCol}), current board value: ${board[tileRow][tileCol]}`);

      // Only place tile if position is empty (0) or has a multiplier (1-4)
      // Board values: 0=empty, 1=double letter, 2=triple letter, 3=double word, 4=triple word
      if (board[tileRow][tileCol] <= 4) {
        board[tileRow][tileCol] = letter;
        
        const tile = createTile(letter, tileRow, tileCol, player, moveIndex);
        tiles.push(tile);
        sceneRef.current.add(tile);
      } else {
        console.log(`Position (${tileRow}, ${tileCol}) already occupied with letter: ${board[tileRow][tileCol]}`);
      }
    }

    return tiles;
  };

  const canPlaceWordHorizontally = (board, row, col, word) => {
    // Check if word can fit horizontally
    for (let i = 0; i < word.length; i++) {
      if (col + i >= 15) return false;
      if (board[row][col + i] !== 0) return false;
    }
    return true;
  };

  const createTile = (letter, row, col, player, moveIndex) => {
    // Enhanced tile geometry
    const tileGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);
    const tileColor = player === 1 ? 0xDAA520 : 0xCD853F; // Different colors for players
    const tileMaterial = new THREE.MeshPhongMaterial({ 
      color: tileColor,
      transparent: true,
      opacity: 0.95,
      shininess: 50
    });
    const tile = new THREE.Mesh(tileGeometry, tileMaterial);
    
    // Position tile on board
    const startX = -(15 * 1) / 2 + 1 / 2;
    const startZ = -(15 * 1) / 2 + 1 / 2;
    tile.position.set(
      startX + col * 1,
      0.25,
      startZ + row * 1
    );
    tile.castShadow = true;
    tile.receiveShadow = true;

    // Add letter texture with better visibility
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;
    
    // Clear canvas with transparent background
    context.clearRect(0, 0, 128, 128);
    
    // Add main letter with high contrast
    context.fillStyle = '#000000';
    context.font = 'bold 90px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter, 64, 64);
    
    // Add white outline for better visibility
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 3;
    context.strokeText(letter, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const letterGeometry = new THREE.PlaneGeometry(0.6, 0.6);
    const letterMaterial = new THREE.MeshBasicMaterial({ 
      map: texture,
      transparent: true,
      alphaTest: 0.01
    });
    const letterMesh = new THREE.Mesh(letterGeometry, letterMaterial);
    letterMesh.position.y = 0.11;
    letterMesh.rotation.x = -Math.PI / 2;
    tile.add(letterMesh);
    
    // Make sure the letter is visible
    letterMesh.renderOrder = 1;
    letterMaterial.depthTest = false;

    // Add move index for animation
    tile.userData = { moveIndex, player, letter };

    return tile;
  };

  // Timeline controls
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextMove = () => {
    if (gameData && currentMoveIndex < gameData.length - 1) {
      setCurrentMoveIndex(currentMoveIndex + 1);
    }
  };

  const handlePrevMove = () => {
    if (currentMoveIndex > 0) {
      setCurrentMoveIndex(currentMoveIndex - 1);
    }
  };

  const handleReset = () => {
    setCurrentMoveIndex(0);
    setIsPlaying(false);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
  };

  const currentMove = gameData?.[currentMoveIndex];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎮 3D Annotated Game Viewer</h1>
        <p>Watch Scrabble games come to life in 3D!</p>
        {loading && <div className={styles.loading}>Loading game data...</div>}
      </div>
      
      <div ref={mountRef} className={styles.canvas} />
      
      {/* Timeline Controls */}
      <div className={styles.timeline}>
        <div className={styles.controls}>
          <button onClick={handleReset} className={styles.controlBtn}>
            ⏮️ Reset
          </button>
          <button onClick={handlePrevMove} className={styles.controlBtn}>
            ⏪ Previous
          </button>
          <button onClick={handlePlayPause} className={styles.controlBtn}>
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          <button onClick={handleNextMove} className={styles.controlBtn}>
            ⏩ Next
          </button>
        </div>
        
        <div className={styles.speedControls}>
          <button onClick={() => handleSpeedChange(500)} className={styles.speedBtn}>Fast</button>
          <button onClick={() => handleSpeedChange(1000)} className={styles.speedBtn}>Normal</button>
          <button onClick={() => handleSpeedChange(2000)} className={styles.speedBtn}>Slow</button>
        </div>
        
        <div className={styles.moveInfo}>
          <span>Move {currentMoveIndex + 1} of {gameData?.length || 0}</span>
          {currentMove && (
            <div className={styles.moveDetails}>
              <span>Player {currentMove.player}: {currentMove.word}</span>
              <span>Location: {currentMove.location}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.controls}>
        <button onClick={() => controlsRef.current?.reset()}>
          Reset View
        </button>
      </div>
    </div>
  );
};

export default Scrabble3D; 