import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import styles from './Scrabble3D.module.css';
import { getMoveSet } from '../../axios/api';
import { parseGCG } from '../../utils/gcgParser';
import { origPool, origBoard } from "../../components/AppContent/References/staticData.js";
import { 
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ArrowClockwise,
  CaretLeft,
  CaretRight,
  CaretUp,
  CaretDown
} from '@phosphor-icons/react';
import LatestMove from './components/LatestMove';

// Preload all protile images like the Cell component does
let allLetters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'];
let preloadedImages = {};
let preloadedTextures = {};

function preloadProtiles() {
  allLetters.forEach(letter => {
    let srcString = '/images/compressed-clean-protiles/' + letter + '.png';
    preloadedImages[letter] = new Image();
    preloadedImages[letter].src = srcString;
  });
}

// Preload all textures once
function preloadTextures() {
  allLetters.forEach(letter => {
    const img = preloadedImages[letter];
    if (img && img.complete && img.naturalWidth > 0) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 128;
      canvas.height = 128;
      
      context.clearRect(0, 0, 128, 128);
      context.drawImage(img, 0, 0, 128, 128);
      
      // Use the same logic as modifyImageColor function
      const imageData = context.getImageData(0, 0, 128, 128);
      const data = new Uint32Array(imageData.data.buffer);
      const len = data.length;
      
      // For silver tiles, we want white letters (since silver is light)
      const isDark = false; // Silver is light, so we want white letters
      const r = isDark ? 255 : 255; // White letters
      const g = isDark ? 255 : 255;
      const b = isDark ? 255 : 255;
      const colorValue = (255 << 24) | (b << 16) | (g << 8) | r;
      
      // Process pixels - only modify non-transparent pixels
      for (let i = 0; i < len; i++) {
        if (data[i] & 0xff000000) { // Check alpha channel
          data[i] = colorValue;
        }
      }
      
      context.putImageData(imageData, 0, 0);
      preloadedTextures[letter] = new THREE.CanvasTexture(canvas);
    }
  });
}

// Initialize preloading
preloadProtiles();

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
  const [isExpanded, setIsExpanded] = useState(false);

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

    // Renderer setup with HD settings
    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // HD pixel ratio
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Soft white ambient light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Clean white directional light
    directionalLight.position.set(15, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    // Magical colored point lights (balanced with lamps)
    const whiteLight1 = new THREE.PointLight(0xffffff, 0.6, 40);
    whiteLight1.position.set(-20, 15, -20);
    scene.add(whiteLight1);

    const whiteLight2 = new THREE.PointLight(0xffffff, 0.6, 40);
    whiteLight2.position.set(20, 15, 20);
    scene.add(whiteLight2);

    const whiteLight3 = new THREE.PointLight(0xffffff, 0.6, 40);
    whiteLight3.position.set(0, 20, -25);
    scene.add(whiteLight3);

    const whiteLight4 = new THREE.PointLight(0xffffff, 0.5, 35);
    whiteLight4.position.set(-15, 10, 15);
    scene.add(whiteLight4);

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

  // Preload textures once images are ready
  useEffect(() => {
    const checkAndPreloadTextures = () => {
      const allImagesLoaded = allLetters.every(letter => {
        const img = preloadedImages[letter];
        return img && img.complete && img.naturalWidth > 0;
      });
      
      if (allImagesLoaded) {
        preloadTextures();
        console.log('All protile textures preloaded!');
      } else {
        // Check again in 100ms
        setTimeout(checkAndPreloadTextures, 100);
      }
    };
    
    checkAndPreloadTextures();
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
    // Create magical white table
    const tableGeometry = new THREE.BoxGeometry(50, 0.3, 25);
    const tableMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xFFFFFF, // Pure white
      transparent: true,
      opacity: 0.9,
      shininess: 20
    });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.y = -0.5;
    table.castShadow = true;
    table.receiveShadow = true;
    scene.add(table);

    // Create 3D racks for both players
    createPlayerRacks(scene);

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
    // Create circular board base (raised to create groove effect)
    const boardRadius = 10.8;
    const boardGeometry = new THREE.CylinderGeometry(boardRadius, boardRadius, 0.3, 64);
    const boardMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xB0B0B0, // Light gray (neutral)
      transparent: true,
      opacity: 0.95,
      shininess: 30
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.receiveShadow = true;
    board.position.y = -0.1; // Raised higher to create groove effect
    scene.add(board);

    // Create colored squares on the board surface (simple boxes to avoid rendering issues)
    const squareSize = 1;
    const gridSize = 15;
    const startX = -(gridSize * squareSize) / 2 + squareSize / 2;
    const startZ = -(gridSize * squareSize) / 2 + squareSize / 2;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Create colored square boxes on the board surface
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
          squareColor = 0xFFFFFF; // Empty squares - bright white
        }
        
        const squareMaterial = new THREE.MeshPhongMaterial({ 
          color: squareColor,
          shininess: 100,
          transparent: true,
          opacity: 0.9
        });
        const square = new THREE.Mesh(squareGeometry, squareMaterial);
        square.position.set(
          startX + col * squareSize,
          0.025, // Slightly above the board surface
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

  const createPlayerRacks = (scene) => {
    const rackMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8B4513, // Dark brown wood
      transparent: true,
      opacity: 0.9,
      shininess: 15
    });

    // Create L-shaped rack for Player 1 (bottom of board)
    // Base of the L
    const rack1Base = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 0.8), rackMaterial);
    rack1Base.position.set(0, 0.05, -12);
    rack1Base.castShadow = true;
    rack1Base.receiveShadow = true;
    scene.add(rack1Base);

    // Back of the L
    const rack1Back = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 0.1), rackMaterial);
    rack1Back.position.set(0, 0.35, -11.65);
    rack1Back.castShadow = true;
    rack1Back.receiveShadow = true;
    scene.add(rack1Back);

    // Create L-shaped rack for Player 2 (top of board)
    // Base of the L
    const rack2Base = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 0.8), rackMaterial);
    rack2Base.position.set(0, 0.05, 12);
    rack2Base.castShadow = true;
    rack2Base.receiveShadow = true;
    scene.add(rack2Base);

    // Back of the L
    const rack2Back = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 0.1), rackMaterial);
    rack2Back.position.set(0, 0.35, 11.65);
    rack2Back.castShadow = true;
    rack2Back.receiveShadow = true;
    scene.add(rack2Back);
  };

  const createTile = (letter, row, col, player, moveIndex) => {
    // Enhanced tile geometry
    const tileGeometry = new THREE.BoxGeometry(0.9, 0.15, 0.9);
    const tileColor = 0xE8D5B5; // More beige tile color
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
      0.125, // Lower position to sit in the grooves
      startZ + row * 1
    );
    tile.castShadow = true;
    tile.receiveShadow = true;

    // Create clean white lettering
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;
    
    context.clearRect(0, 0, 128, 128);
    
    // Add white fill for main letter
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 100px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter, 64, 64);
    
    // Add point value in bottom right
    const pointValues = {
      'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3,
      'N': 1, 'O': 1, 'P': 3, 'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10, '_': 0
    };
    
    const pointValue = pointValues[letter] || 0;
    if (pointValue > 0) {
      context.fillStyle = '#FFFFFF';
      context.font = 'bold 45px Arial';
      context.textAlign = 'right';
      context.textBaseline = 'bottom';
      context.fillText(pointValue.toString(), 128, 128);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const letterGeometry = new THREE.PlaneGeometry(0.8, 0.8);
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
      <div ref={mountRef} className={styles.canvas} />
      
      {loading && <div className={styles.loading}>Loading game data...</div>}
      

      
      {/* Latest Move Component with Controls */}
      {gameData && gameData.length > 0 && (
        <div className={styles.moveInfoOverlay}>
          {/* Header with Title and Dictionary Info */}
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>3D Viewer • NWL20</div>
          </div>
          
          <LatestMove 
            latestMove={currentMove}
            player1Name="Player 1"
            player2Name="Player 2"
            allMoves={gameData.slice(0, currentMoveIndex + 1)} // Only show moves up to current view
            boardCoords={[]}
            player1Rack={[]}
            player2Rack={[]}
            pool={[]}
          />
          
          {/* Control Icons */}
          <div className={styles.controlIcons}>
            <div className={styles.controlGroup}>
              <button onClick={handleReset} className={styles.controlBtn}>
                <SkipBack size={16} />
              </button>
              <button onClick={handlePrevMove} className={styles.controlBtn}>
                <CaretLeft size={16} />
              </button>
              <button onClick={handlePlayPause} className={styles.controlBtn}>
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button onClick={handleNextMove} className={styles.controlBtn}>
                <CaretRight size={16} />
              </button>
              <button onClick={() => setIsExpanded(!isExpanded)} className={styles.controlBtn}>
                {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
              </button>
            </div>
            

            
          </div>
          
          {/* Expandable Content */}
          {isExpanded && (
            <div className={styles.expandableContent}>
              <div className={styles.controlGroup}>
                <button onClick={() => handleSpeedChange(500)} className={styles.speedBtn}>Fast</button>
                <button onClick={() => handleSpeedChange(1000)} className={styles.speedBtn}>Normal</button>
                <button onClick={() => handleSpeedChange(2000)} className={styles.speedBtn}>Slow</button>
              </div>
              <div className={styles.controlGroup}>
                <button onClick={() => controlsRef.current?.reset()} className={styles.controlBtn}>
                  <ArrowClockwise size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Scrabble3D; 