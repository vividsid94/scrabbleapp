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
    scene.background = new THREE.Color(0x000033); // Deep blue background
    scene.fog = new THREE.Fog(0x000033, 20, 100); // Magical fog
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 15);
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

    // Magical lighting setup
    const ambientLight = new THREE.AmbientLight(0x4040ff, 0.3); // Good ambient light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
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

    // Magical colored point lights (balanced with lamps)
    const purpleLight = new THREE.PointLight(0x9933ff, 0.5, 40);
    purpleLight.position.set(-20, 15, -20);
    scene.add(purpleLight);

    const cyanLight = new THREE.PointLight(0x00ffff, 0.5, 40);
    cyanLight.position.set(20, 15, 20);
    scene.add(cyanLight);

    const pinkLight = new THREE.PointLight(0xff69b4, 0.5, 40);
    pinkLight.position.set(0, 20, -25);
    scene.add(pinkLight);

    const goldLight = new THREE.PointLight(0xffd700, 0.4, 35);
    goldLight.position.set(-15, 10, 15);
    scene.add(goldLight);

    // Create magical environment
    createMagicalEnvironment(scene);

    // Create magical table and chairs
    createTableAndChairs(scene);

    // Create 3D board
    createBoard(scene);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      
      // Animate environment elements
      if (sceneRef.current.lamps) {
        const time = Date.now() * 0.001;
        sceneRef.current.lamps.forEach((lamp, index) => {
          // Gentle flickering
          lamp.material.emissiveIntensity = 0.4 + Math.sin(time * 2 + index) * 0.05;
        });
      }
      
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

  const createMagicalEnvironment = (scene) => {
    // Create stone floor
    const floorGeometry = new THREE.PlaneGeometry(80, 80);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x696969, // Dim gray
      transparent: true,
      opacity: 0.9,
      shininess: 10
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.5;
    floor.receiveShadow = true;
    scene.add(floor);

    // Create stone walls
    const wallGeometry = new THREE.BoxGeometry(80, 32, 1);
    const wallMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8B7355, // Saddle brown
      transparent: true,
      opacity: 0.9,
      shininess: 5
    });

    // Back wall
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.set(0, 14, -40);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Side walls
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(-40, 14, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(40, 14, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Create ceiling
    const ceilingGeometry = new THREE.BoxGeometry(80, 0.5, 80);
    const ceilingMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xF5DEB3, // Light wheat color
      transparent: true,
      opacity: 1.0,
      shininess: 5
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = 30;
    ceiling.receiveShadow = true;
    scene.add(ceiling);

    // Create stone pillars
    const pillarGeometry = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
    const pillarMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x696969,
      transparent: true,
      opacity: 0.9,
      shininess: 15
    });

    const pillarPositions = [
      [-30, 4, -30], [30, 4, -30],
      [-30, 4, 30], [30, 4, 30]
    ];

    pillarPositions.forEach(pos => {
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(...pos);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
    });

    // Create grounded lamps around the room
    const lamps = [];
    const lampPositions = [
      [-25, 0, -25], [25, 0, -25], [-25, 0, 25], [25, 0, 25]
    ];

    lampPositions.forEach(pos => {
      // Lamp base
      const baseGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.2, 8);
      const baseMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x654321, // Dark brown
        transparent: true,
        opacity: 0.9,
        shininess: 20
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(pos[0], -1.4, pos[2]);
      base.castShadow = true;
      base.receiveShadow = true;
      scene.add(base);

      // Lamp pole
      const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8);
      const poleMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8B4513, // Saddle brown
        transparent: true,
        opacity: 0.9,
        shininess: 30
      });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(pos[0], -0.15, pos[2]);
      pole.castShadow = true;
      pole.receiveShadow = true;
      scene.add(pole);

      // Lamp shade
      const shadeGeometry = new THREE.CylinderGeometry(0.8, 0.6, 0.4, 8);
      const shadeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xF5DEB3, // Wheat
        transparent: true,
        opacity: 0.7,
        shininess: 10
      });
      const shade = new THREE.Mesh(shadeGeometry, shadeMaterial);
      shade.position.set(pos[0], 1.1, pos[2]);
      shade.castShadow = true;
      shade.receiveShadow = true;
      scene.add(shade);

      // Lamp light bulb
      const bulbGeometry = new THREE.SphereGeometry(0.2, 8, 6);
      const bulbMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFFFFE0,
        emissive: 0xFFFFE0,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.9
      });
      const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
      bulb.position.set(pos[0], 1.1, pos[2]);
      bulb.castShadow = true;
      scene.add(bulb);

      // Add lamp light
      const lampLight = new THREE.PointLight(0xFFFFE0, 3.0, 40);
      lampLight.position.set(pos[0], 1.1, pos[2]);
      scene.add(lampLight);

      lamps.push(bulb);
    });

    // Store lamps for animation
    sceneRef.current.lamps = lamps;

    // Add some magical books on the table
    const bookGeometry = new THREE.BoxGeometry(0.8, 0.1, 1.2);
    const bookMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8B4513,
      transparent: true,
      opacity: 0.9,
      shininess: 10
    });

    const bookPositions = [
      { x: -6, z: -6, rotation: 0.3 },
      { x: 6, z: -6, rotation: -0.2 },
      { x: -6, z: 6, rotation: 0.1 }
    ];

    bookPositions.forEach(pos => {
      const book = new THREE.Mesh(bookGeometry, bookMaterial);
      book.position.set(pos.x, -0.1, pos.z);
      book.rotation.y = pos.rotation;
      book.castShadow = true;
      book.receiveShadow = true;
      scene.add(book);
    });
  };

  const createTableAndChairs = (scene) => {
    // Create magical wooden table
    const tableGeometry = new THREE.BoxGeometry(50, 0.3, 25);
    const tableMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xD2B48C, // Tan (subtle brown)
      transparent: true,
      opacity: 0.9,
      shininess: 20
    });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.y = -0.5;
    table.castShadow = true;
    table.receiveShadow = true;
    scene.add(table);

    // Create table legs
    const legGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.4);
    const legMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x654321, // Dark brown
      transparent: true,
      opacity: 0.9,
      shininess: 15
    });

    // Position legs at corners
    const legPositions = [
      [-9.5, -1.1, -9.5], [9.5, -1.1, -9.5],
      [-9.5, -1.1, 9.5], [9.5, -1.1, 9.5]
    ];

    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(...pos);
      leg.castShadow = true;
      leg.receiveShadow = true;
      scene.add(leg);
    });

    // Create two cozy futons
    const futonPositions = [
      { x: 0, z: -16, rotation: 0 },    // Futon facing the board
      { x: 0, z: 16, rotation: Math.PI } // Futon behind the board
    ];

    futonPositions.forEach((pos, index) => {
      // Futon base/cushion
      const cushionGeometry = new THREE.BoxGeometry(5.0, 1.0, 5.0);
      const cushionMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4682B4, // Steel blue
        transparent: true,
        opacity: 0.9,
        shininess: 10
      });
      const cushion = new THREE.Mesh(cushionGeometry, cushionMaterial);
      cushion.position.set(pos.x, -0.6, pos.z);
      cushion.castShadow = true;
      cushion.receiveShadow = true;
      scene.add(cushion);

      // Futon back cushion (folded up)
      const backCushionGeometry = new THREE.BoxGeometry(5.0, 3.5, 1.0);
      const backCushionMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4682B4,
        transparent: true,
        opacity: 0.9,
        shininess: 10
      });
      const backCushion = new THREE.Mesh(backCushionGeometry, backCushionMaterial);
      backCushion.position.set(pos.x, 0.65, pos.z + (pos.rotation === 0 ? -2.15 : 2.15));
      backCushion.castShadow = true;
      backCushion.receiveShadow = true;
      scene.add(backCushion);

      // Futon frame/legs (low profile)
      const frameGeometry = new THREE.BoxGeometry(5.3, 0.4, 5.3);
      const frameMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x191970, // Midnight blue
        transparent: true,
        opacity: 0.9,
        shininess: 20
      });
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(pos.x, -1.0, pos.z);
      frame.castShadow = true;
      frame.receiveShadow = true;
      scene.add(frame);

      // Add some decorative pillows
      const pillowGeometry = new THREE.BoxGeometry(1.2, 0.4, 1.2);
      const pillowMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFF69B4, // Hot pink
        transparent: true,
        opacity: 0.9,
        shininess: 5
      });

      // Two pillows on each futon
      const pillowPositions = [
        { x: -1.5, z: 0.8 }, { x: 1.5, z: 0.8 }
      ];

      pillowPositions.forEach(pillowPos => {
        const pillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
        pillow.position.set(pos.x + pillowPos.x, -0.2, pos.z + pillowPos.z);
        pillow.castShadow = true;
        pillow.receiveShadow = true;
        scene.add(pillow);
      });
    });
  };

  const createBoard = (scene) => {
    // Create circular board base
    const boardRadius = 11.5;
    const boardGeometry = new THREE.CylinderGeometry(boardRadius, boardRadius, 0.2, 64);
    const boardMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xB0B0B0, // Light gray (neutral)
      transparent: true,
      opacity: 0.95,
      shininess: 30
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.receiveShadow = true;
    board.position.y = -0.1;
    scene.add(board);

    // Create grid of squares inside the circular board
    const squareSize = 1;
    const gridSize = 15;
    const startX = -(gridSize * squareSize) / 2 + squareSize / 2;
    const startZ = -(gridSize * squareSize) / 2 + squareSize / 2;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const squareGeometry = new THREE.BoxGeometry(squareSize * 0.9, 0.1, squareSize * 0.9);
        
        // Get the actual board value from origBoard
        const boardValue = JSON.parse(origBoard)[row][col];
        
        // Different colors for different square types - using Viewer defaults
        let squareColor = 0xFFFFFF; // Default white
        
        if (boardValue === 4) {
          squareColor = 0xCE2222; // Triple word - red (from cellColors)
        } else if (boardValue === 3) {
          squareColor = 0xF49FD4; // Double word - pink (from cellColors)
        } else if (boardValue === 2) {
          squareColor = 0x7269D6; // Triple letter - purple (from cellColors)
        } else if (boardValue === 1) {
          squareColor = 0x7ED6DD; // Double letter - cyan (from cellColors)
        } else if (boardValue === 0) {
          squareColor = 0xFFFFFF; // Empty squares - white
        }
        
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
    const tileGeometry = new THREE.BoxGeometry(0.8, 0.15, 0.8);
    const tileColor = 0xC0C0C0; // Silver tile color
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
      0.175,
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
    
    // Add main letter - clean and clear
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 100px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter, 64, 64);
    
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