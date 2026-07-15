import React, { useEffect, useRef, useState, useCallback, useMemo, useContext } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { Modal, Box, Typography } from '@mui/material';
import styles from './Scrabble3DPlay.module.css';
import { ThemeContext } from '../../App';
import { origPool, origBoard } from "../../components/AppContent/References/staticData.js";
import { TEST_RACKS } from "../../components/AppContent/References/testRacks.js";
import { useGameStore } from '../../stores/gameStore';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
import Rack from '../../components/AppContent/Board/Rack';
import { handleKeyDown } from '../../functions/play/keyboardFunctions';
import { handleTileClick } from '../../functions/play/tileFunctions';
import { handleBoardPositionSelect } from '../../functions/play/boardFunctions';
import { initializeSounds } from '../../functions/play/soundFunctions';
import { formatTime } from '../../functions/play/timeUtils';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav';
import Topbar from '../../components/AppContent/Topbar/Topbar';
import {
  Smiley, Robot, UserCircle, Cube, ArrowsClockwise, CaretDown, CaretUp
} from '@phosphor-icons/react';
import {
  CAMERA,
  RENDERER,
  SCENE,
  LIGHTS,
  MATERIALS,
  ENVIRONMENT,
  TABLE,
  FUTON,
  BOARD,
  RACK,
  TILE,
  POINT_VALUES,
  GAME,
  CONTROLS,
  ANIMATION,
  PRELOAD
} from './constants';
import { createBoard as createBoardScene } from './scrabble3DScene';

// Preload all protile images
let allLetters = PRELOAD.LETTERS;
let preloadedImages = {};
let preloadedTextures = {};

function preloadProtiles() {
  allLetters.forEach(letter => {
    let srcString = '/images/compressed-clean-protiles/' + letter + '.png';
    preloadedImages[letter] = new Image();
    preloadedImages[letter].src = srcString;
  });
}

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

      const imageData = context.getImageData(0, 0, 128, 128);
      const data = new Uint32Array(imageData.data.buffer);
      const len = data.length;

      const r = 255, g = 255, b = 255;
      const colorValue = (255 << 24) | (b << 16) | (g << 8) | r;

      for (let i = 0; i < len; i++) {
        if (data[i] & 0xff000000) {
          data[i] = colorValue;
        }
      }

      context.putImageData(imageData, 0, 0);
      preloadedTextures[letter] = new THREE.CanvasTexture(canvas);
    }
  });
}

function cleanupPreloadedResources() {
  Object.values(preloadedTextures).forEach(texture => {
    if (texture && texture.dispose) {
      texture.dispose();
    }
  });
  preloadedTextures = {};
  preloadedImages = {};
}

preloadProtiles();

// Bot options
const bots = [
  { name: 'Theo', img: '/images/theomascot.png', desc: 'Clever and quick, Theo prefers bold, aggressive moves.' },
  { name: 'Tess', img: '/images/tessmascot.png', desc: 'Calm and strategic, Tess loves defense.' },
  { name: 'Novice', desc: 'Makes random moves.', icon: <Smiley size={20} color="#60A5FA" /> },
  { name: 'Beginner', desc: 'Plays simple, easy-to-beat moves.', icon: <UserCircle size={20} color="#8B7355" /> },
  { name: 'Intermediate', desc: 'A bit more challenging.', icon: <Robot size={20} color="#3D5A80" /> },
  { name: 'Custom', desc: 'Set a custom rank.', icon: <Robot size={20} color="#9CA3AF" /> },
  { name: 'Defense Bot', desc: 'Focuses on defensive play.', icon: <Robot size={20} color="#3D5A80" /> },
];

const Scrabble3DPlay = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const mouseDownPosRef = useRef({ x: 0, y: 0 });

  // Track clickable objects
  const boardSquaresRef = useRef([]);
  const rackTilesRef = useRef({ player1: [], player2: [] });
  const boardTilesRef = useRef([]);
  // Our side = positive Z (camera side). Swapped so player 1 rack is on our side.
  const rackPositionsRef = useRef({
    player1: RACK.POSITIONS.PLAYER2,
    player2: RACK.POSITIONS.PLAYER1
  });
  const rack2MeshesRef = useRef([]); // Bot's rack furniture - hide when isBotMode
  const boardGroupRef = useRef(null); // Board + grid + tiles; rotated when bot is thinking
  const arrowIndicatorRef = useRef(null); // 3D arrow for selected board position
  const botThinkingRef = useRef(false);
  const boardTurnSpeed = 0.06; // Lerp factor for board rotation
  const timerRef = useRef(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [needsRender, setNeedsRender] = useState(true);

  const { lightMode } = useContext(ThemeContext);
  const tileColor = useColorSchemeStore(state => state.color?.current ?? '#E8D5B5');

  // Store references for cleanup
  const resourcesRef = useRef({
    geometries: [],
    materials: [],
    textures: [],
    meshes: [],
    lights: [],
    controls: null,
    animationId: null
  });

  // Shared geometries
  const sharedGeometriesRef = useRef({
    boxGeometry: new THREE.BoxGeometry(1, 1, 1),
    planeGeometry: new THREE.PlaneGeometry(1, 1),
    cylinderGeometry: new THREE.CylinderGeometry(1, 1, 1, 8),
    sphereGeometry: new THREE.SphereGeometry(1, 8, 6)
  });

  // Zustand store subscriptions
  const {
    boardCoords,
    tempBoardCoords,
    origBoardCoords,
    player1points,
    player2points,
    player1Rack,
    player2Rack,
    player1Name,
    player2Name,
    currentPlayer,
    pool,
    moveHistory,
    player1Time,
    player2Time,
    gameStarted,
    gameEnded,
    isBotMode,
    selectedTiles,
    selectedBoardPosition,
    arrowDirection,
    blankTiles,
    isBotThinking,
    isPlayerThinking,
    selectedBot,
    tilesToExchange,
    invalidWordCoords,
    setInvalidWordCoords,
    setSelectedBot,
    setPlayer2Name,
    setBoardCoords,
    setTempBoardCoords,
    setOrigBoardCoords,
    setSelectedTiles,
    setSelectedBoardPosition,
    setArrowDirection,
    setPlayer1Rack,
    setPlayer2Rack,
    setBlankTiles,
    setTilesToExchange,
    initializeGame,
    startBotGame,
    handleWordSubmit,
    handlePass,
    handleExchange,
    makeBotMove,
    handleKeyDownWrapper,
    updatePreviewScore,
    timerActive,
    startTimer,
    topMoves,
    isLoadingTopMoves,
    isDictionaryLoading,
    setTopMoves,
    handleGetTopMovesForExpandable,
    handleMoveSelectClick,
  } = useGameStore();

  // Exchange modal state
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  // Scouting Report: custom rank input (mirrors 2D Play)
  const [customRank, setCustomRank] = useState('');
  const [customBotSelected, setCustomBotSelected] = useState(false);

  // Ask Theo panel state
  const [isAskTheoExpanded, setIsAskTheoExpanded] = useState(false);

  // Calculate latest move tiles for highlighting
  const latestMoveTiles = useMemo(() => {
    if (!moveHistory || moveHistory.length === 0) return [];
    const latestMove = moveHistory[moveHistory.length - 1];
    if (!latestMove || !latestMove.boardDiff) return [];
    return latestMove.boardDiff.map(tile => ({
      row: tile.row,
      col: tile.col
    }));
  }, [moveHistory]);

  // Sounds
  const [sounds, setSounds] = useState(null);

  useEffect(() => {
    const soundObjects = initializeSounds() || {};
    setSounds(soundObjects);
  }, []);

  const { gameStartSound, playerMoveSound, botMoveSound } = sounds || {};

  // Initialize game if not started
  useEffect(() => {
    if (sounds && !gameStarted) {
      initializeGame(origBoard, origPool, gameStartSound, botMoveSound);
    }
  }, [sounds, gameStarted, initializeGame, gameStartSound, botMoveSound]);

  // Bot turn handler
  const botMoveMadeRef = useRef(false);

  useEffect(() => {
    if (isBotMode && currentPlayer === 2 && !isBotThinking && !gameEnded && !botMoveMadeRef.current) {
      botMoveMadeRef.current = true;
      makeBotMove(botMoveSound);
    }
  }, [currentPlayer, isBotMode, isBotThinking, gameEnded, makeBotMove, botMoveSound]);

  useEffect(() => {
    if (currentPlayer === 1) {
      botMoveMadeRef.current = false;
    }
  }, [currentPlayer]);

  // Update 3D clock display from game store (your time, bot time)
  const updateClockDisplay = useCallback(() => {
    const clock = sceneRef.current?.clock;
    if (!clock) return;
    const state = useGameStore.getState();
    const p1Time = state.player1Time ?? 20 * 60;
    const p2Time = state.player2Time ?? 20 * 60;
    const current = state.currentPlayer ?? 1;
    const isBot = state.isBotMode ?? false;
    const botLabel = state.selectedBot?.name || state.player2Name || 'Bot';
    const w = clock.drawW;
    const h = clock.drawH;
    const ctx = clock.context;
    const C = TABLE.CLOCK.DISPLAY;
    ctx.fillStyle = C.COLOR_BG;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = C.COLOR_TEXT;
    ctx.textBaseline = 'middle';
    // Left half: current player (you) time
    const leftCenter = w * 0.28;
    ctx.font = 'bold 44px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(current === 1 ? 'You' : isBot ? botLabel : 'P2', leftCenter, h * 0.35);
    ctx.font = 'bold 80px monospace';
    ctx.fillText(formatTime(current === 1 ? p1Time : p2Time), leftCenter, h * 0.62);
    // Right half: other player (bot) time
    const rightCenter = w * 0.72;
    ctx.font = 'bold 44px monospace';
    ctx.fillText(current === 1 ? (isBot ? botLabel : 'P2') : 'You', rightCenter, h * 0.35);
    ctx.font = 'bold 80px monospace';
    ctx.fillText(formatTime(current === 1 ? p2Time : p1Time), rightCenter, h * 0.62);
    clock.texture.needsUpdate = true;
  }, []);

  // Keep 3D clock in sync with game timer and move count
  useEffect(() => {
    updateClockDisplay();
    setNeedsRender(true);
  }, [player1Time, player2Time, currentPlayer, moveHistory, updateClockDisplay]);

  // Start game timer when active (so 3D clock ticks)
  useEffect(() => {
    if (!timerActive || !gameStarted) return;
    return startTimer(timerRef);
  }, [timerActive, gameStarted, startTimer]);

  // Three.js Scene Setup
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE.BACKGROUND_COLOR);
    scene.fog = new THREE.Fog(SCENE.FOG_COLOR, SCENE.FOG_NEAR, SCENE.FOG_FAR);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      CAMERA.FOV,
      window.innerWidth / window.innerHeight,
      CAMERA.NEAR,
      CAMERA.FAR
    );
    camera.position.set(CAMERA.INITIAL_POSITION.x, CAMERA.INITIAL_POSITION.y, CAMERA.INITIAL_POSITION.z);
    camera.lookAt(CAMERA.TARGET.x, CAMERA.TARGET.y, CAMERA.TARGET.z);
    cameraRef.current = camera;

    // Renderer setup (alpha: false avoids compositing artefacts that can show as a centre grey patch)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER.PIXEL_RATIO_MAX));
    renderer.setClearColor(SCENE.BACKGROUND_COLOR, 1);
    renderer.shadowMap.enabled = false;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = CONTROLS.DAMPING_FACTOR;
    controls.minDistance = 10;
    controls.maxDistance = 50;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2.5;
    controlsRef.current = controls;
    resourcesRef.current.controls = controls;

    controls.addEventListener('change', () => {
      setNeedsRender(true);
    });

    // Lighting
    const ambientLight = new THREE.AmbientLight(LIGHTS.AMBIENT.COLOR, LIGHTS.AMBIENT.INTENSITY);
    scene.add(ambientLight);
    resourcesRef.current.lights.push(ambientLight);

    const directionalLight = new THREE.DirectionalLight(LIGHTS.DIRECTIONAL.COLOR, LIGHTS.DIRECTIONAL.INTENSITY);
    directionalLight.position.set(LIGHTS.DIRECTIONAL.POSITION.x, LIGHTS.DIRECTIONAL.POSITION.y, LIGHTS.DIRECTIONAL.POSITION.z);
    directionalLight.castShadow = false; // Off to avoid centre grey patch from shadow map
    scene.add(directionalLight);
    resourcesRef.current.lights.push(directionalLight);

    LIGHTS.POINT_LIGHTS.forEach(lightConfig => {
      const pointLight = new THREE.PointLight(lightConfig.COLOR, lightConfig.INTENSITY, lightConfig.DISTANCE);
      pointLight.position.set(lightConfig.POSITION.x, lightConfig.POSITION.y, lightConfig.POSITION.z);
      scene.add(pointLight);
      resourcesRef.current.lights.push(pointLight);
    });

    // Create environment (same as 3D viewer)
    createMagicalEnvironment(scene);
    createTableAndChairs(scene);
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);
    boardGroupRef.current = boardGroup;
    // Board from shared scene module - identical to 3D viewer, no grey patch
    createBoardScene(scene, {
      resourcesRef,
      origBoard,
      boardParent: boardGroup,
      boardSquaresRef: boardSquaresRef
    });
    // Arrow indicator for selected board square (position/visibility updated in useEffect)
    const arrowGeom = new THREE.ConeGeometry(0.25, 0.5, 8);
    const arrowMat = new THREE.MeshPhongMaterial({
      color: 0xF59E0B,
      shininess: 80,
      transparent: true,
      opacity: 0.95,
    });
    const arrowMesh = new THREE.Mesh(arrowGeom, arrowMat);
    arrowMesh.visible = false;
    arrowMesh.renderOrder = 10;
    boardGroup.add(arrowMesh);
    arrowIndicatorRef.current = arrowMesh;
    resourcesRef.current.geometries.push(arrowGeom);
    resourcesRef.current.materials.push(arrowMat);
    resourcesRef.current.meshes.push(arrowMesh);
    createMascot(scene, selectedBot?.img || '/images/theomascot.png');
    createScoresheet(scene);
    createScoreboard(scene);
    createClock(scene);
    updateClockDisplay();
    createBlankSlip(scene);

    // Animation loop
    let lastTime = 0;
    const frameInterval = ANIMATION.FRAME_INTERVAL;

    const animate = (currentTime) => {
      resourcesRef.current.animationId = requestAnimationFrame(animate);

      if (currentTime - lastTime < frameInterval) return;
      lastTime = currentTime;

      controls.update();

      // Turn board toward Theo when bot is thinking
      if (boardGroupRef.current) {
        const targetY = botThinkingRef.current ? Math.PI : 0;
        const dy = targetY - boardGroupRef.current.rotation.y;
        if (Math.abs(dy) > 0.001) {
          boardGroupRef.current.rotation.y += dy * boardTurnSpeed;
          setNeedsRender(true);
        }
      }

      // Animate lamps
      if (sceneRef.current.lamps) {
        const time = currentTime * 0.001;
        sceneRef.current.lamps.forEach((lamp, index) => {
          lamp.material.emissiveIntensity = LIGHTS.LAMP.ANIMATION.BASE_INTENSITY +
            Math.sin(time * LIGHTS.LAMP.ANIMATION.FLICKER_SPEED + index) * LIGHTS.LAMP.ANIMATION.FLICKER_AMPLITUDE;
        });
      }

      if (needsRender) {
        renderer.render(scene, camera);
        setNeedsRender(false);
      }
    };
    animate(0);

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      setNeedsRender(true);
    };
    window.addEventListener('resize', handleResize);

    setIsLoaded(true);

    return () => {
      if (resourcesRef.current.animationId) {
        cancelAnimationFrame(resourcesRef.current.animationId);
      }
      window.removeEventListener('resize', handleResize);

      if (resourcesRef.current.controls) {
        resourcesRef.current.controls.dispose();
      }

      resourcesRef.current.geometries.forEach(g => g.dispose());
      Object.values(sharedGeometriesRef.current).forEach(g => g?.dispose?.());
      resourcesRef.current.materials.forEach(m => {
        if (m.map) m.map.dispose();
        m.dispose();
      });
      resourcesRef.current.textures.forEach(t => t.dispose());
      resourcesRef.current.meshes.forEach(mesh => {
        if (mesh.parent) mesh.parent.remove(mesh);
      });

      if (sceneRef.current) sceneRef.current.clear();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();

      resourcesRef.current = {
        geometries: [],
        materials: [],
        textures: [],
        meshes: [],
        lights: [],
        controls: null,
        animationId: null
      };

      cleanupPreloadedResources();
    };
  }, []);

  // Preload textures
  useEffect(() => {
    const checkAndPreloadTextures = () => {
      const allImagesLoaded = allLetters.every(letter => {
        const img = preloadedImages[letter];
        return img && img.complete && img.naturalWidth > 0;
      });

      if (allImagesLoaded) {
        preloadTextures();
      } else {
        setTimeout(checkAndPreloadTextures, PRELOAD.CHECK_INTERVAL);
      }
    };

    checkAndPreloadTextures();
  }, []);

  // Update 3D board when boardCoords, tempBoardCoords, or moveHistory change
  useEffect(() => {
    if (sceneRef.current && tempBoardCoords?.length > 0) {
      update3DBoard();
      setNeedsRender(true);
    }
  }, [tempBoardCoords, boardCoords, moveHistory]);

  // Update rack tiles when racks change; hide bot's rack tiles in bot mode
  useEffect(() => {
    if (sceneRef.current) {
      updateRackTiles(1, player1Rack);
      updateRackTiles(2, isBotMode ? [] : player2Rack);
      setNeedsRender(true);
    }
  }, [player1Rack, player2Rack, isBotMode]);

  // Hide bot's rack furniture when in bot mode
  useEffect(() => {
    rack2MeshesRef.current.forEach((mesh) => {
      if (mesh) mesh.visible = !isBotMode;
    });
    setNeedsRender(true);
  }, [isBotMode]);

  // Keep ref in sync for animation loop (board turn when bot thinking)
  useEffect(() => {
    botThinkingRef.current = isBotThinking;
  }, [isBotThinking]);

  // Update physical scoresheet and scoreboard when game state changes
  useEffect(() => {
    if (!sceneRef.current?.scoresheet || !sceneRef.current?.scoreboard) return;
    updateScoresheet();
    updateScoreboard();
    setNeedsRender(true);
  }, [player1points, player2points, moveHistory, player1Name, player2Name]);

  // Update blank slip when blanks are played
  useEffect(() => {
    if (sceneRef.current?.blankSlip) {
      updateBlankSlip();
      setNeedsRender(true);
    }
  }, [blankTiles, tempBoardCoords]);

  // Calculate preview score when tiles are placed (same as 2D Play component)
  useEffect(() => {
    updatePreviewScore();
  }, [selectedTiles, tempBoardCoords]);

  // Clear top moves when turn changes
  useEffect(() => {
    setTopMoves([]);
    setIsAskTheoExpanded(false);
  }, [currentPlayer, setTopMoves]);

  // Auto-expand Ask Theo when moves are loaded
  useEffect(() => {
    if (topMoves && topMoves.length > 0) {
      setIsAskTheoExpanded(true);
    }
  }, [topMoves]);

  // Update mascot when selected bot changes
  useEffect(() => {
    if (sceneRef.current && selectedBot?.img) {
      updateMascot(selectedBot.img);
    }
  }, [selectedBot]);

  // Flash invalid word tiles in pinkish-red
  useEffect(() => {
    if (!invalidWordCoords || invalidWordCoords.length === 0 || !boardTilesRef.current) return;

    // Find tiles that match invalid word coordinates
    const invalidTiles = boardTilesRef.current.filter(tile => {
      const { row, col } = tile.userData;
      return invalidWordCoords.some(coord => coord.row === row && coord.col === col);
    });

    if (invalidTiles.length === 0) return;

    // Store original materials and colors
    const originalStates = invalidTiles.map(tile => ({
      tile,
      color: tile.material.color.clone(),
      emissive: tile.material.emissive ? tile.material.emissive.clone() : new THREE.Color(0x000000),
      emissiveIntensity: tile.material.emissiveIntensity || 0,
    }));

    // Flash animation parameters
    const flashColor = new THREE.Color(0xef4444); // Red
    const flashEmissive = new THREE.Color(0xff6b6b); // Pinkish-red glow
    const flashDuration = 350; // ms per flash
    const numFlashes = 5;
    const totalDuration = flashDuration * numFlashes;
    let startTime = null;
    let animationId = null;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;

      if (elapsed >= totalDuration) {
        // Restore original colors
        originalStates.forEach(({ tile, color, emissive, emissiveIntensity }) => {
          tile.material.color.copy(color);
          if (tile.material.emissive) {
            tile.material.emissive.copy(emissive);
            tile.material.emissiveIntensity = emissiveIntensity;
          }
        });
        setNeedsRender(true);
        // Clear invalid word coords after animation
        setInvalidWordCoords([]);
        return;
      }

      // Calculate flash intensity using sine wave for pulsing effect
      const flashProgress = (elapsed % flashDuration) / flashDuration;
      const intensity = Math.sin(flashProgress * Math.PI); // 0 -> 1 -> 0

      // Apply flash effect to each invalid tile
      invalidTiles.forEach((tile, index) => {
        const original = originalStates[index];
        // Lerp between original color and flash color
        tile.material.color.copy(original.color).lerp(flashColor, intensity * 0.6);
        if (tile.material.emissive) {
          tile.material.emissive.copy(flashEmissive);
          tile.material.emissiveIntensity = intensity * 0.8;
        }
      });

      setNeedsRender(true);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      // Restore on cleanup
      originalStates.forEach(({ tile, color, emissive, emissiveIntensity }) => {
        if (tile.material) {
          tile.material.color.copy(color);
          if (tile.material.emissive) {
            tile.material.emissive.copy(emissive);
            tile.material.emissiveIntensity = emissiveIntensity;
          }
        }
      });
    };
  }, [invalidWordCoords, setInvalidWordCoords]);

  // Update arrow indicator position/rotation/visibility when selected square or direction changes
  useEffect(() => {
    const arrow = arrowIndicatorRef.current;
    if (!arrow || !boardGroupRef.current) return;

    if (selectedBoardPosition == null || selectedBoardPosition.row == null || selectedBoardPosition.col == null) {
      arrow.visible = false;
      setNeedsRender(true);
      return;
    }

    const { row, col } = selectedBoardPosition;
    const size = BOARD.GRID.SIZE;
    const sq = BOARD.GRID.SQUARE_SIZE;
    const startX = -(size * sq) / 2 + sq / 2;
    const startZ = -(size * sq) / 2 + sq / 2;
    const x = startX + col * sq;
    const z = startZ + row * sq;
    const y = BOARD.GRID.Y_POSITION + 0.15;

    arrow.position.set(x, y, z);
    // Cone defaults to +Y; rotate to point right (+X) or down (-Y into board)
    if (arrowDirection === 'right') {
      arrow.rotation.order = 'XYZ';
      arrow.rotation.set(0, 0, -Math.PI / 2);
    } else {
      arrow.rotation.order = 'XYZ';
      arrow.rotation.set(Math.PI / 2, 0, 0);
    }
    arrow.visible = true;
    setNeedsRender(true);
  }, [selectedBoardPosition, arrowDirection, isLoaded]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDownEvent = (e) => {
      // Key "2" opens exchange modal
      if (e.key === '2' && gameStarted && !gameEnded && currentPlayer === 1 && !isBotThinking) {
        const target = e.target && e.target.closest ? e.target.closest('input, textarea, [contenteditable="true"]') : null;
        if (!target) {
          e.preventDefault();
          setTilesToExchange([]);
          setShowExchangeModal(true);
          return;
        }
      }
      handleKeyDownWrapper(e, playerMoveSound, origBoard);
    };

    window.addEventListener('keydown', handleKeyDownEvent);
    return () => window.removeEventListener('keydown', handleKeyDownEvent);
  }, [handleKeyDownWrapper, playerMoveSound, gameStarted, gameEnded, currentPlayer, isBotThinking]);

  // Track mouse down position to distinguish clicks from drags
  const handleMouseDown = useCallback((event) => {
    mouseDownPosRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  // Cursor: pointer when hovering a board square, grab otherwise
  const handleCanvasMouseMove = useCallback((event) => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas || !cameraRef.current) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const boardIntersects = raycasterRef.current.intersectObjects(boardSquaresRef.current, false);
    canvas.style.cursor = boardIntersects.length > 0 ? 'pointer' : 'grab';
  }, []);

  // Click handling for raycasting
  const handleCanvasClick = useCallback((event) => {
    if (!rendererRef.current || !cameraRef.current) return;

    // Check if mouse moved significantly (was a drag, not a click)
    const dx = Math.abs(event.clientX - mouseDownPosRef.current.x);
    const dy = Math.abs(event.clientY - mouseDownPosRef.current.y);
    const CLICK_THRESHOLD = 5; // pixels

    if (dx > CLICK_THRESHOLD || dy > CLICK_THRESHOLD) {
      // This was a drag (camera rotation), not a click
      return;
    }

    const rect = rendererRef.current.domElement.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    // Check rack tiles first
    const allRackTiles = [...(rackTilesRef.current.player1 || []), ...(rackTilesRef.current.player2 || [])];
    const rackIntersects = raycasterRef.current.intersectObjects(allRackTiles, true);

    if (rackIntersects.length > 0) {
      let clickedObj = rackIntersects[0].object;
      while (clickedObj && !clickedObj.userData?.type) {
        clickedObj = clickedObj.parent;
      }

      if (clickedObj?.userData?.type === 'rackTile' && clickedObj.userData.player === currentPlayer) {
        const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
        handleTileClick({
          tile: clickedObj.userData.letter,
          index: clickedObj.userData.index,
          currentPlayer,
          player1Rack,
          player2Rack,
          selectedTiles,
          setSelectedTiles,
          tilesToExchange: [],
          setTilesToExchange: () => {}
        });
        return;
      }
    }

    // Check board squares
    const boardIntersects = raycasterRef.current.intersectObjects(boardSquaresRef.current, false);

    if (boardIntersects.length > 0) {
      const clickedSquare = boardIntersects[0].object;
      if (clickedSquare.userData?.type === 'boardSquare') {
        const { row, col } = clickedSquare.userData;
        handleBoardPositionSelect({
          row,
          col,
          boardCoords,
          selectedBoardPosition,
          setSelectedBoardPosition,
          arrowDirection,
          setArrowDirection
        });
      }
    }
  }, [currentPlayer, player1Rack, player2Rack, selectedTiles, boardCoords, selectedBoardPosition, arrowDirection,
      setSelectedTiles, setSelectedBoardPosition, setArrowDirection]);

  useEffect(() => {
    const canvas = rendererRef.current?.domElement;
    if (canvas) {
      canvas.style.cursor = 'grab';
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleCanvasMouseMove);
      canvas.addEventListener('click', handleCanvasClick);
      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleCanvasMouseMove);
        canvas.removeEventListener('click', handleCanvasClick);
      };
    }
  }, [handleCanvasClick, handleMouseDown, handleCanvasMouseMove]);

  // Helper functions for 3D scene
  const createMagicalEnvironment = (scene) => {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(ENVIRONMENT.FLOOR.WIDTH, ENVIRONMENT.FLOOR.HEIGHT);
    const floorMaterial = new THREE.MeshPhongMaterial({
      color: MATERIALS.FLOOR.COLOR,
      transparent: true,
      opacity: MATERIALS.FLOOR.OPACITY,
      shininess: MATERIALS.FLOOR.SHININESS
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = ENVIRONMENT.FLOOR.Y_POSITION;
    floor.receiveShadow = true;
    scene.add(floor);
    resourcesRef.current.geometries.push(floorGeometry);
    resourcesRef.current.materials.push(floorMaterial);
    resourcesRef.current.meshes.push(floor);

    // Carpet
    const carpetGeometry = new THREE.PlaneGeometry(60, 45);
    const carpetMaterial = new THREE.MeshPhongMaterial({
      color: 0x8B0000,
      transparent: true,
      opacity: 1.0,
      shininess: 5
    });
    const carpet = new THREE.Mesh(carpetGeometry, carpetMaterial);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.y = ENVIRONMENT.FLOOR.Y_POSITION + 0.05;
    carpet.receiveShadow = true;
    scene.add(carpet);
    resourcesRef.current.geometries.push(carpetGeometry);
    resourcesRef.current.materials.push(carpetMaterial);
    resourcesRef.current.meshes.push(carpet);

    // Lamps
    const lamps = [];
    ENVIRONMENT.LAMP_POSITIONS.forEach(pos => {
      const baseGeometry = new THREE.CylinderGeometry(LIGHTS.LAMP.BASE_RADIUS, LIGHTS.LAMP.BASE_RADIUS + 0.1, LIGHTS.LAMP.BASE_HEIGHT, 8);
      const baseMaterial = new THREE.MeshPhongMaterial({
        color: MATERIALS.LAMP_BASE.COLOR,
        transparent: true,
        opacity: MATERIALS.LAMP_BASE.OPACITY,
        shininess: MATERIALS.LAMP_BASE.SHININESS
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(pos[0], -1.4, pos[2]);
      base.castShadow = true;
      scene.add(base);
      resourcesRef.current.geometries.push(baseGeometry);
      resourcesRef.current.materials.push(baseMaterial);
      resourcesRef.current.meshes.push(base);

      const poleGeometry = new THREE.CylinderGeometry(LIGHTS.LAMP.POLE_RADIUS, LIGHTS.LAMP.POLE_RADIUS, LIGHTS.LAMP.POLE_HEIGHT, 8);
      const poleMaterial = new THREE.MeshPhongMaterial({
        color: MATERIALS.LAMP_POLE.COLOR,
        transparent: true,
        opacity: MATERIALS.LAMP_POLE.OPACITY,
        shininess: MATERIALS.LAMP_POLE.SHININESS
      });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(pos[0], -0.15, pos[2]);
      scene.add(pole);
      resourcesRef.current.geometries.push(poleGeometry);
      resourcesRef.current.materials.push(poleMaterial);
      resourcesRef.current.meshes.push(pole);

      const shadeGeometry = new THREE.CylinderGeometry(LIGHTS.LAMP.SHADE_RADIUS_TOP, LIGHTS.LAMP.SHADE_RADIUS_BOTTOM, LIGHTS.LAMP.SHADE_HEIGHT, 8);
      const shadeMaterial = new THREE.MeshPhongMaterial({
        color: MATERIALS.LAMP_SHADE.COLOR,
        transparent: true,
        opacity: MATERIALS.LAMP_SHADE.OPACITY,
        shininess: MATERIALS.LAMP_SHADE.SHININESS
      });
      const shade = new THREE.Mesh(shadeGeometry, shadeMaterial);
      shade.position.set(pos[0], 1.1, pos[2]);
      scene.add(shade);
      resourcesRef.current.geometries.push(shadeGeometry);
      resourcesRef.current.materials.push(shadeMaterial);
      resourcesRef.current.meshes.push(shade);

      const bulbGeometry = new THREE.SphereGeometry(LIGHTS.LAMP.BULB_RADIUS, 8, 6);
      const bulbMaterial = new THREE.MeshPhongMaterial({
        color: MATERIALS.LAMP_BULB.COLOR,
        emissive: MATERIALS.LAMP_BULB.EMISSIVE,
        emissiveIntensity: MATERIALS.LAMP_BULB.EMISSIVE_INTENSITY,
        transparent: true,
        opacity: MATERIALS.LAMP_BULB.OPACITY
      });
      const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
      bulb.position.set(pos[0], 1.1, pos[2]);
      scene.add(bulb);
      resourcesRef.current.geometries.push(bulbGeometry);
      resourcesRef.current.materials.push(bulbMaterial);
      resourcesRef.current.meshes.push(bulb);

      const lampLight = new THREE.PointLight(LIGHTS.LAMP.COLOR, LIGHTS.LAMP.INTENSITY, LIGHTS.LAMP.DISTANCE);
      lampLight.position.set(pos[0], 1.1, pos[2]);
      scene.add(lampLight);
      resourcesRef.current.lights.push(lampLight);

      lamps.push(bulb);
    });

    sceneRef.current.lamps = lamps;
  };

  const createTableAndChairs = (scene) => {
    // Table
    const tableGeometry = new THREE.BoxGeometry(TABLE.WIDTH, TABLE.HEIGHT, TABLE.DEPTH);
    const tableMaterial = new THREE.MeshPhongMaterial({
      color: TABLE.MATERIAL.COLOR,
      transparent: true,
      opacity: TABLE.MATERIAL.OPACITY,
      shininess: TABLE.MATERIAL.SHININESS
    });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.y = TABLE.Y_POSITION;
    table.castShadow = true;
    table.receiveShadow = true;
    scene.add(table);
    resourcesRef.current.geometries.push(tableGeometry);
    resourcesRef.current.materials.push(tableMaterial);
    resourcesRef.current.meshes.push(table);

    // Racks
    createPlayerRacks(scene);

    // Table legs
    const legGeometry = new THREE.BoxGeometry(TABLE.LEG.WIDTH, TABLE.LEG.HEIGHT, TABLE.LEG.DEPTH);
    const legMaterial = new THREE.MeshPhongMaterial({
      color: TABLE.LEG.MATERIAL.COLOR,
      transparent: true,
      opacity: TABLE.LEG.MATERIAL.OPACITY,
      shininess: TABLE.LEG.MATERIAL.SHININESS
    });

    TABLE.LEG.POSITIONS.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(...pos);
      leg.castShadow = true;
      scene.add(leg);
      resourcesRef.current.meshes.push(leg);
    });

    resourcesRef.current.geometries.push(legGeometry);
    resourcesRef.current.materials.push(legMaterial);

    // Futons
    FUTON.POSITIONS.forEach((pos, index) => {
      const cushionGeometry = new THREE.BoxGeometry(FUTON.CUSHION.WIDTH, FUTON.CUSHION.HEIGHT, FUTON.CUSHION.DEPTH);
      const cushionMaterial = new THREE.MeshPhongMaterial({
        color: FUTON.CUSHION.MATERIAL.COLOR,
        transparent: true,
        opacity: FUTON.CUSHION.MATERIAL.OPACITY,
        shininess: FUTON.CUSHION.MATERIAL.SHININESS
      });
      const cushion = new THREE.Mesh(cushionGeometry, cushionMaterial);
      cushion.position.set(pos.x, FUTON.CUSHION.Y_POSITION, pos.z);
      cushion.castShadow = true;
      scene.add(cushion);
      resourcesRef.current.geometries.push(cushionGeometry);
      resourcesRef.current.materials.push(cushionMaterial);
      resourcesRef.current.meshes.push(cushion);

      const backCushionGeometry = new THREE.BoxGeometry(FUTON.BACK_CUSHION.WIDTH, FUTON.BACK_CUSHION.HEIGHT, FUTON.BACK_CUSHION.DEPTH);
      const backCushionMaterial = new THREE.MeshPhongMaterial({
        color: FUTON.BACK_CUSHION.MATERIAL.COLOR,
        transparent: true,
        opacity: FUTON.BACK_CUSHION.MATERIAL.OPACITY,
        shininess: FUTON.BACK_CUSHION.MATERIAL.SHININESS
      });
      const backCushion = new THREE.Mesh(backCushionGeometry, backCushionMaterial);
      backCushion.position.set(pos.x, FUTON.BACK_CUSHION.Y_POSITION, pos.z + (pos.rotation === 0 ? -FUTON.BACK_CUSHION.Z_OFFSET : FUTON.BACK_CUSHION.Z_OFFSET));
      scene.add(backCushion);
      resourcesRef.current.geometries.push(backCushionGeometry);
      resourcesRef.current.materials.push(backCushionMaterial);
      resourcesRef.current.meshes.push(backCushion);

      const frameGeometry = new THREE.BoxGeometry(FUTON.FRAME.WIDTH, FUTON.FRAME.HEIGHT, FUTON.FRAME.DEPTH);
      const frameMaterial = new THREE.MeshPhongMaterial({
        color: FUTON.FRAME.MATERIAL.COLOR,
        transparent: true,
        opacity: FUTON.FRAME.MATERIAL.OPACITY,
        shininess: FUTON.FRAME.MATERIAL.SHININESS
      });
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(pos.x, FUTON.FRAME.Y_POSITION, pos.z);
      scene.add(frame);
      resourcesRef.current.geometries.push(frameGeometry);
      resourcesRef.current.materials.push(frameMaterial);
      resourcesRef.current.meshes.push(frame);
    });
  };

  const createPlayerRacks = (scene) => {
    const rackMaterial = new THREE.MeshPhongMaterial({
      color: RACK.MATERIAL.COLOR,
      transparent: true,
      opacity: RACK.MATERIAL.OPACITY,
      shininess: RACK.MATERIAL.SHININESS
    });

    const pos1 = rackPositionsRef.current.player1;
    const pos2 = rackPositionsRef.current.player2;

    // Player 1 rack (our side - positive Z, near camera)
    const rack1BaseGeometry = new THREE.BoxGeometry(RACK.BASE.WIDTH, RACK.BASE.HEIGHT, RACK.BASE.DEPTH);
    const rack1Base = new THREE.Mesh(rack1BaseGeometry, rackMaterial);
    rack1Base.position.set(pos1.x, pos1.y, pos1.z);
    rack1Base.rotation.x = -RACK.SLANT_ANGLE;
    rack1Base.castShadow = true;
    scene.add(rack1Base);
    resourcesRef.current.geometries.push(rack1BaseGeometry);
    resourcesRef.current.materials.push(rackMaterial);
    resourcesRef.current.meshes.push(rack1Base);

    const rack1BackGeometry = new THREE.BoxGeometry(RACK.BACK.WIDTH, RACK.BACK.HEIGHT, RACK.BACK.DEPTH);
    const rack1Back = new THREE.Mesh(rack1BackGeometry, rackMaterial);
    rack1Back.position.set(pos1.x, pos1.backY, pos1.backZ);
    rack1Back.rotation.x = -RACK.SLANT_ANGLE;
    scene.add(rack1Back);
    resourcesRef.current.geometries.push(rack1BackGeometry);
    resourcesRef.current.meshes.push(rack1Back);

    // Player 2 rack (bot's side - hidden when isBotMode)
    const rack2BaseGeometry = new THREE.BoxGeometry(RACK.BASE.WIDTH, RACK.BASE.HEIGHT, RACK.BASE.DEPTH);
    const rack2Base = new THREE.Mesh(rack2BaseGeometry, rackMaterial);
    rack2Base.position.set(pos2.x, pos2.y, pos2.z);
    rack2Base.rotation.x = RACK.SLANT_ANGLE;
    scene.add(rack2Base);
    resourcesRef.current.geometries.push(rack2BaseGeometry);
    resourcesRef.current.meshes.push(rack2Base);
    rack2MeshesRef.current.push(rack2Base);

    const rack2BackGeometry = new THREE.BoxGeometry(RACK.BACK.WIDTH, RACK.BACK.HEIGHT, RACK.BACK.DEPTH);
    const rack2Back = new THREE.Mesh(rack2BackGeometry, rackMaterial);
    rack2Back.position.set(pos2.x, pos2.backY, pos2.backZ);
    rack2Back.rotation.x = RACK.SLANT_ANGLE;
    scene.add(rack2Back);
    resourcesRef.current.geometries.push(rack2BackGeometry);
    resourcesRef.current.meshes.push(rack2Back);
    rack2MeshesRef.current.push(rack2Back);
  };

  const createMascot = (scene, mascotImage = '/images/theomascot.png') => {
    const loader = new THREE.TextureLoader();
    loader.load(mascotImage, (texture) => {
      const w = 5;
      const h = 6;
      const depth = 0.4;
      const backTexture = texture.clone();

      // Solid edge material for the four sides (fills space between front and back)
      const sideMaterial = new THREE.MeshPhongMaterial({
        color: 0x3d3630,
        shininess: 15,
      });
      const frontMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.FrontSide,
      });
      const backMaterial = new THREE.MeshBasicMaterial({
        map: backTexture,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.FrontSide,
      });

      // Box: right, left, top, bottom, front (+z), back (-z)
      const boxGeometry = new THREE.BoxGeometry(w, h, depth);
      const mascotMesh = new THREE.Mesh(boxGeometry, [
        sideMaterial,
        sideMaterial,
        sideMaterial,
        sideMaterial,
        frontMaterial,
        backMaterial,
      ]);
      mascotMesh.position.set(0, 3, -14);
      mascotMesh.castShadow = true;
      scene.add(mascotMesh);

      resourcesRef.current.geometries.push(boxGeometry);
      resourcesRef.current.materials.push(sideMaterial, frontMaterial, backMaterial);
      resourcesRef.current.textures.push(texture, backTexture);
      resourcesRef.current.meshes.push(mascotMesh);
      sceneRef.current.mascot = mascotMesh; // material[4]=front, material[5]=back for updateMascot
      setNeedsRender(true);
    });
  };

  const updateMascot = (mascotImage) => {
    if (!sceneRef.current?.mascot) return;
    const mesh = sceneRef.current.mascot;
    if (!Array.isArray(mesh.material)) return;

    const loader = new THREE.TextureLoader();
    loader.load(mascotImage, (texture) => {
      const frontMat = mesh.material[4];
      const backMat = mesh.material[5];
      if (frontMat.map) frontMat.map.dispose();
      if (backMat.map) backMat.map.dispose();
      const backTex = texture.clone();
      frontMat.map = texture;
      frontMat.needsUpdate = true;
      backMat.map = backTex;
      backMat.needsUpdate = true;
      resourcesRef.current.textures.push(texture, backTex);
      setNeedsRender(true);
    });
  };

  const createScoresheet = (scene) => {
    const scoresheetGeometry = new THREE.PlaneGeometry(TABLE.SCORESHEET.WIDTH, TABLE.SCORESHEET.HEIGHT);
    const scoresheetMaterial = new THREE.MeshPhongMaterial({
      color: TABLE.SCORESHEET.MATERIAL.COLOR,
      transparent: true,
      opacity: TABLE.SCORESHEET.MATERIAL.OPACITY,
      shininess: TABLE.SCORESHEET.MATERIAL.SHININESS
    });
    const scoresheet = new THREE.Mesh(scoresheetGeometry, scoresheetMaterial);
    scoresheet.rotation.x = -Math.PI / 2;
    scoresheet.position.set(
      TABLE.SCORESHEET.POSITION.x,
      TABLE.SCORESHEET.Y_POSITION,
      TABLE.SCORESHEET.POSITION.z
    );
    scoresheet.castShadow = true;
    scoresheet.receiveShadow = true;
    scene.add(scoresheet);
    resourcesRef.current.geometries.push(scoresheetGeometry);
    resourcesRef.current.materials.push(scoresheetMaterial);
    resourcesRef.current.meshes.push(scoresheet);

    const scoresCanvas = document.createElement('canvas');
    const scale = window.devicePixelRatio || 1;
    scoresCanvas.width = 360 * scale;
    scoresCanvas.height = 416 * scale;
    scoresCanvas.style.width = '360px';
    scoresCanvas.style.height = '416px';
    const scoresContext = scoresCanvas.getContext('2d');
    scoresContext.scale(scale, scale);

    const scoresTexture = new THREE.CanvasTexture(scoresCanvas);
    const scoresGeometry = new THREE.PlaneGeometry(TABLE.SCORESHEET.WIDTH - 0.5, TABLE.SCORESHEET.HEIGHT - 0.5);
    const scoresMaterial = new THREE.MeshBasicMaterial({
      map: scoresTexture,
      transparent: true,
      alphaTest: 0.01
    });
    const scoresMesh = new THREE.Mesh(scoresGeometry, scoresMaterial);
    scoresMesh.position.set(
      TABLE.SCORESHEET.POSITION.x,
      TABLE.SCORESHEET.Y_POSITION + 0.01,
      TABLE.SCORESHEET.POSITION.z
    );
    scoresMesh.rotation.x = -Math.PI / 2;
    scene.add(scoresMesh);
    resourcesRef.current.geometries.push(scoresGeometry);
    resourcesRef.current.materials.push(scoresMaterial);
    resourcesRef.current.textures.push(scoresTexture);
    resourcesRef.current.meshes.push(scoresMesh);

    sceneRef.current.scoresheet = { base: scoresheet, scores: scoresMesh, canvas: scoresCanvas, context: scoresContext };
  };

  const createScoreboard = (scene) => {
    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    const scoreboardTexture = new THREE.CanvasTexture(canvas);
    const scoreboardDisplayGeometry = new THREE.PlaneGeometry(6.8, 1.6);
    const scoreboardDisplayMaterial = new THREE.MeshBasicMaterial({
      map: scoreboardTexture,
      transparent: true,
      alphaTest: 0.01
    });
    const scoreboardDisplayTable = new THREE.Mesh(scoreboardDisplayGeometry, scoreboardDisplayMaterial);
    scoreboardDisplayTable.position.set(
      TABLE.SCORESHEET.POSITION.x + 34,
      TABLE.HEIGHT + 0.05,
      TABLE.SCORESHEET.POSITION.z
    );
    scoreboardDisplayTable.rotation.x = -Math.PI / 2;
    scoreboardDisplayTable.renderOrder = 1;
    scene.add(scoreboardDisplayTable);
    resourcesRef.current.geometries.push(scoreboardDisplayGeometry);
    resourcesRef.current.materials.push(scoreboardDisplayMaterial);
    resourcesRef.current.textures.push(scoreboardTexture);
    resourcesRef.current.meshes.push(scoreboardDisplayTable);
    sceneRef.current.scoreboard = { scoreboardDisplay: scoreboardDisplayTable, texture: scoreboardTexture };
  };

  const createClock = (scene) => {
    const C = TABLE.CLOCK;
    // Larger clock: ~1.6x size for visibility on back of table
    const clockWidth = 8.5;
    const clockHeight = 2.5;
    const clockDepth = 0.35;
    const canvasW = 850;
    const canvasH = 250;
    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    const clockTexture = new THREE.CanvasTexture(canvas);
    const clockGeometry = new THREE.PlaneGeometry(clockWidth, clockHeight);
    const clockMaterial = new THREE.MeshBasicMaterial({
      map: clockTexture,
      transparent: true,
      alphaTest: 0.01
    });
    const clockDisplay = new THREE.Mesh(clockGeometry, clockMaterial);
    clockDisplay.position.z = clockDepth / 2; // Face in front of body
    clockDisplay.renderOrder = 1;

    // Back / body: shallow box so the clock has depth
    const bodyGeometry = new THREE.BoxGeometry(clockWidth, clockHeight, clockDepth);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      shininess: 30,
    });
    const clockBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    clockBody.position.z = -clockDepth / 2;
    clockBody.castShadow = true;

    const clockGroup = new THREE.Group();
    clockGroup.add(clockBody);
    clockGroup.add(clockDisplay);
    clockGroup.rotation.y = 0; // Face toward front / room
    const tableTopY = TABLE.Y_POSITION + TABLE.HEIGHT / 2;
    clockGroup.position.set(
      -12,
      tableTopY + clockHeight / 2,
      -12
    );
    scene.add(clockGroup);
    resourcesRef.current.geometries.push(clockGeometry, bodyGeometry);
    resourcesRef.current.materials.push(clockMaterial, bodyMaterial);
    resourcesRef.current.textures.push(clockTexture);
    resourcesRef.current.meshes.push(clockDisplay, clockBody);
    sceneRef.current.clock = { canvas, context: ctx, texture: clockTexture, drawW: canvasW, drawH: canvasH };
  };

  const createBlankSlip = (scene) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    const blankSlipTexture = new THREE.CanvasTexture(canvas);
    const blankSlipGeometry = new THREE.PlaneGeometry(5, 3);
    const blankSlipMaterial = new THREE.MeshBasicMaterial({
      map: blankSlipTexture,
      transparent: true,
      alphaTest: 0.01
    });
    const blankSlipDisplay = new THREE.Mesh(blankSlipGeometry, blankSlipMaterial);
    // Position at bottom right of table (right side, toward camera / bottom of view)
    blankSlipDisplay.position.set(
      20,
      TABLE.HEIGHT + 0.05,
      9
    );
    blankSlipDisplay.rotation.x = -Math.PI / 2;
    blankSlipDisplay.renderOrder = 1;
    blankSlipDisplay.visible = true;
    scene.add(blankSlipDisplay);
    resourcesRef.current.geometries.push(blankSlipGeometry);
    resourcesRef.current.materials.push(blankSlipMaterial);
    resourcesRef.current.textures.push(blankSlipTexture);
    resourcesRef.current.meshes.push(blankSlipDisplay);
    sceneRef.current.blankSlip = {
      display: blankSlipDisplay,
      canvas,
      context: ctx,
      texture: blankSlipTexture
    };
  };

  const updateBlankSlip = () => {
    if (!sceneRef.current?.blankSlip) return;
    const { display, canvas, context: ctx, texture } = sceneRef.current.blankSlip;

    // Get blank tiles and their letters from tempBoardCoords
    const playedBlanks = [];
    if (blankTiles && blankTiles.length > 0) {
      blankTiles.forEach((bt, index) => {
        const letter = tempBoardCoords?.[bt.row]?.[bt.col];
        if (letter && typeof letter === 'string') {
          playedBlanks.push({ index: index + 1, letter: letter.toUpperCase(), row: bt.row, col: bt.col });
        }
      });
    }

    display.visible = true;

    // Clear and draw background
    ctx.fillStyle = '#F5F5DC'; // Beige paper color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // Draw title
    ctx.fillStyle = '#2D1F14';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('BLANKS', canvas.width / 2, 16);

    // Draw line under title
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 60);
    ctx.lineTo(canvas.width - 40, 60);
    ctx.stroke();

    // Draw each blank's letter
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    playedBlanks.forEach((blank, i) => {
      const y = 100 + i * 70;
      // Label
      ctx.fillStyle = '#666';
      ctx.font = '28px Arial';
      ctx.fillText(`Blank ${blank.index}:`, 30, y);
      // Letter (large)
      ctx.fillStyle = '#2D1F14';
      ctx.font = 'bold 52px Arial';
      ctx.fillText(blank.letter, 200, y);
    });

    texture.needsUpdate = true;
  };

  const updateScoresheet = () => {
    if (!sceneRef.current?.scoresheet?.scores) return;
    const { canvas, context: scoresContext } = sceneRef.current.scoresheet;
    const state = useGameStore.getState();
    const p1Name = state.player1Name || 'Player 1';
    const p2Name = state.player2Name || 'Player 2';
    const history = state.moveHistory || [];

    const scale = window.devicePixelRatio || 1;
    scoresContext.setTransform(1, 0, 0, 1, 0, 0);
    scoresContext.scale(scale, scale);
    scoresContext.fillStyle = '#F5F5DC';
    scoresContext.fillRect(0, 0, 360, 416);
    scoresContext.strokeStyle = '#000000';
    scoresContext.lineWidth = 1;
    scoresContext.beginPath();
    scoresContext.moveTo(80, 0); scoresContext.lineTo(80, 416);
    scoresContext.moveTo(160, 0); scoresContext.lineTo(160, 416);
    scoresContext.moveTo(200, 0); scoresContext.lineTo(200, 416);
    scoresContext.moveTo(280, 0); scoresContext.lineTo(280, 416);
    scoresContext.moveTo(360, 0); scoresContext.lineTo(360, 416);
    scoresContext.stroke();
    scoresContext.beginPath();
    for (let i = 0; i <= 21; i++) {
      scoresContext.moveTo(0, 20 + i * 18);
      scoresContext.lineTo(360, 20 + i * 18);
    }
    scoresContext.stroke();

    scoresContext.fillStyle = '#000000';
    scoresContext.font = 'bold 14px monospace';
    scoresContext.textAlign = 'center';
    scoresContext.textBaseline = 'middle';
    scoresContext.fillText(p1Name, 120, 10);
    scoresContext.fillText(p2Name, 320, 10);
    scoresContext.fillText('Word(s)', 40, 29);
    scoresContext.fillText('Score', 120, 29);
    scoresContext.fillText('Turn', 180, 29);
    scoresContext.fillText('Word(s)', 240, 29);
    scoresContext.fillText('Score', 320, 29);
    scoresContext.font = '12px monospace';
    for (let i = 1; i <= 20; i++) {
      scoresContext.fillText(i.toString(), 180, 29 + i * 18);
    }
    scoresContext.fillText('+', 180, 29 + 21 * 18);

    let player1Total = 0;
    let player2Total = 0;
    history.slice(0, 20).forEach((move, index) => {
      const row = index + 1;
      const y = 29 + row * 18;
      const score = move.score || 0;
      const word = move.word || 'Pass';
      const isPlayer1 = move.player === p1Name;
      if (isPlayer1) {
        player1Total += score;
        scoresContext.fillText(word, 40, y);
        scoresContext.fillText(`+${score}`, 120, y);
      } else {
        player2Total += score;
        scoresContext.fillText(word, 240, y);
        scoresContext.fillText(`+${score}`, 320, y);
      }
    });
    const totalY = 29 + 21 * 18;
    scoresContext.fillText(state.player1points ?? player1Total, 120, totalY);
    scoresContext.fillText(state.player2points ?? player2Total, 320, totalY);

    sceneRef.current.scoresheet.scores.material.map.needsUpdate = true;
  };

  const updateScoreboard = () => {
    if (!sceneRef.current?.scoreboard?.scoreboardDisplay) return;
    const state = useGameStore.getState();
    const p1Name = state.player1Name || 'Player 1';
    const p2Name = state.player2Name || 'Player 2';
    const p1Score = state.player1points ?? 0;
    const p2Score = state.player2points ?? 0;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = window.devicePixelRatio || 1;
    canvas.width = 700 * scale;
    canvas.height = 180 * scale;
    ctx.scale(scale, scale);

    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.5, '#1a1a3a');
    gradient.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 700, 180);
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 700; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 180);
      ctx.stroke();
    }
    for (let i = 0; i < 180; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(700, i);
      ctx.stroke();
    }
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 696, 176);
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 1;
    ctx.strokeRect(6, 6, 688, 168);
    ctx.fillStyle = '#4ecdc4';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p1Name, 175, 40);
    ctx.shadowColor = '#4ecdc4';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.fillText(String(p1Score), 175, 100);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(p2Name, 525, 40);
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.fillText(String(p2Score), 525, 100);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(350, 20);
    ctx.lineTo(350, 160);
    ctx.stroke();

    const newTexture = new THREE.CanvasTexture(canvas);
    if (sceneRef.current.scoreboard.texture?.dispose) {
      sceneRef.current.scoreboard.texture.dispose();
    }
    sceneRef.current.scoreboard.scoreboardDisplay.material.map = newTexture;
    sceneRef.current.scoreboard.scoreboardDisplay.material.needsUpdate = true;
    sceneRef.current.scoreboard.texture = newTexture;
  };

  const createTile = (letter, row, col, isTemp = false, isLastMove = false, isBlank = false) => {
    // Use rounded box geometry for realistic tile edges
    const tileGeometry = new RoundedBoxGeometry(
      TILE.BOARD.WIDTH,
      TILE.BOARD.HEIGHT,
      TILE.BOARD.DEPTH,
      4, // segments for smoothness
      0.04 // radius for rounded corners
    );

    // Create wood grain/ivory texture for realistic appearance
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = 256;
    tileCanvas.height = 256;
    const tileCtx = tileCanvas.getContext('2d');

    // Base color with slight variation per tile for natural look
    const colorVariation = (row * 15 + col) % 20 - 10;
    let baseR = 232 + colorVariation;
    let baseG = 213 + colorVariation;
    let baseB = 181 + colorVariation;

    // Color priority: temp tiles (gold) > last move tiles (cyan) > normal tiles
    if (isTemp) {
      baseR = 255; baseG = 215; baseB = 100; // Gold tint
    } else if (isLastMove) {
      baseR = 180; baseG = 225; baseB = 220; // Cyan tint
    }

    // Fill base color
    tileCtx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
    tileCtx.fillRect(0, 0, 256, 256);

    // Add subtle wood grain effect
    tileCtx.globalAlpha = 0.08;
    for (let i = 0; i < 40; i++) {
      const y = Math.random() * 256;
      const thickness = Math.random() * 2 + 0.5;
      tileCtx.strokeStyle = `rgb(${baseR - 30}, ${baseG - 25}, ${baseB - 20})`;
      tileCtx.lineWidth = thickness;
      tileCtx.beginPath();
      tileCtx.moveTo(0, y);
      // Wavy grain lines
      for (let x = 0; x < 256; x += 10) {
        tileCtx.lineTo(x, y + Math.sin(x * 0.05 + i) * 3);
      }
      tileCtx.stroke();
    }

    // Add subtle noise for texture
    tileCtx.globalAlpha = 0.03;
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const shade = Math.random() > 0.5 ? 255 : 0;
      tileCtx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
      tileCtx.fillRect(x, y, 1, 1);
    }
    tileCtx.globalAlpha = 1.0;

    const woodTexture = new THREE.CanvasTexture(tileCanvas);
    woodTexture.wrapS = THREE.RepeatWrapping;
    woodTexture.wrapT = THREE.RepeatWrapping;

    // Create bump map for surface texture
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 128;
    bumpCanvas.height = 128;
    const bumpCtx = bumpCanvas.getContext('2d');
    bumpCtx.fillStyle = '#808080';
    bumpCtx.fillRect(0, 0, 128, 128);
    // Add subtle bumps
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const brightness = 128 + (Math.random() - 0.5) * 20;
      bumpCtx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      bumpCtx.beginPath();
      bumpCtx.arc(x, y, Math.random() * 2 + 0.5, 0, Math.PI * 2);
      bumpCtx.fill();
    }
    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);

    // Use MeshStandardMaterial for realistic lighting
    const tileMaterial = new THREE.MeshStandardMaterial({
      map: woodTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.002,
      roughness: 0.35,
      metalness: 0.0,
      envMapIntensity: 0.3,
      transparent: isTemp,
      opacity: isTemp ? 0.92 : 1.0,
    });

    const tile = new THREE.Mesh(tileGeometry, tileMaterial);

    const startX = -(BOARD.GRID.SIZE * BOARD.GRID.SQUARE_SIZE) / 2 + BOARD.GRID.SQUARE_SIZE / 2;
    const startZ = -(BOARD.GRID.SIZE * BOARD.GRID.SQUARE_SIZE) / 2 + BOARD.GRID.SQUARE_SIZE / 2;
    tile.position.set(
      startX + col * BOARD.GRID.SQUARE_SIZE,
      TILE.BOARD.Y_POSITION,
      startZ + row * BOARD.GRID.SQUARE_SIZE
    );
    tile.castShadow = true;
    tile.receiveShadow = true;

    // Create embossed letter texture (only if not a blank tile)
    if (!isBlank) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = TILE.LETTER.CANVAS_SIZE * 2; // Higher resolution for clarity
      canvas.height = TILE.LETTER.CANVAS_SIZE * 2;

      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw embossed shadow (offset for depth)
      context.fillStyle = 'rgba(80, 60, 40, 0.6)';
      context.font = `bold ${100 * 2}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(letter.toUpperCase(), canvas.width / 2 + 2, canvas.height / 2 + 2);

      // Draw main letter (white)
      context.fillStyle = '#FFFFFF';
      context.fillText(letter.toUpperCase(), canvas.width / 2, canvas.height / 2);

      // Draw highlight (top-left offset for emboss effect)
      context.fillStyle = 'rgba(255, 255, 255, 0.35)';
      context.fillText(letter.toUpperCase(), canvas.width / 2 - 1, canvas.height / 2 - 1);

      const pointValue = POINT_VALUES[letter.toUpperCase()] || 0;
      if (pointValue > 0) {
        // Point value shadow
        context.fillStyle = 'rgba(80, 60, 40, 0.5)';
        context.font = `bold ${45 * 2}px Arial`;
        context.textAlign = 'right';
        context.textBaseline = 'bottom';
        context.fillText(pointValue.toString(), canvas.width - 8, canvas.height - 6);

        // Point value main (white)
        context.fillStyle = '#FFFFFF';
        context.fillText(pointValue.toString(), canvas.width - 10, canvas.height - 8);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = 4;
      const letterGeometry = new THREE.PlaneGeometry(TILE.LETTER.BOARD_SIZE, TILE.LETTER.BOARD_SIZE);
      const letterMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
      });
      const letterMesh = new THREE.Mesh(letterGeometry, letterMaterial);
      letterMesh.position.y = TILE.BOARD.HEIGHT / 2 + 0.001; // Just above tile surface
      letterMesh.rotation.x = TILE.LETTER.ROTATION;
      letterMesh.renderOrder = 1;
      tile.add(letterMesh);

      resourcesRef.current.textures.push(texture);
      resourcesRef.current.materials.push(letterMaterial);
      resourcesRef.current.geometries.push(letterGeometry);
    }

    tile.userData = { type: 'boardTile', letter, row, col, isTemp, isBlank };

    // Store textures for cleanup
    resourcesRef.current.textures.push(woodTexture, bumpTexture);
    resourcesRef.current.materials.push(tileMaterial);
    resourcesRef.current.geometries.push(tileGeometry);

    return tile;
  };

  const createRackTile = (letter, position, player) => {
    // Use rounded box geometry for realistic tile edges
    const tileGeometry = new RoundedBoxGeometry(
      TILE.RACK.WIDTH,
      TILE.RACK.HEIGHT,
      TILE.RACK.DEPTH,
      4, // segments for smoothness
      0.03 // radius for rounded corners
    );

    // Check if this tile is selected
    const isSelected = selectedTiles?.some(t => t.tile === letter && t.index === position);

    // Create wood grain/ivory texture
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = 256;
    tileCanvas.height = 256;
    const tileCtx = tileCanvas.getContext('2d');

    // Base color with position-based variation
    const colorVariation = (position * 7) % 15 - 7;
    let baseR = isSelected ? 180 : 232 + colorVariation;
    let baseG = isSelected ? 238 : 213 + colorVariation;
    let baseB = isSelected ? 180 : 181 + colorVariation;

    // Fill base color
    tileCtx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
    tileCtx.fillRect(0, 0, 256, 256);

    // Add subtle wood grain effect
    tileCtx.globalAlpha = 0.08;
    for (let i = 0; i < 35; i++) {
      const y = Math.random() * 256;
      const thickness = Math.random() * 2 + 0.5;
      tileCtx.strokeStyle = `rgb(${baseR - 30}, ${baseG - 25}, ${baseB - 20})`;
      tileCtx.lineWidth = thickness;
      tileCtx.beginPath();
      tileCtx.moveTo(0, y);
      for (let x = 0; x < 256; x += 10) {
        tileCtx.lineTo(x, y + Math.sin(x * 0.05 + i) * 3);
      }
      tileCtx.stroke();
    }

    // Add subtle noise
    tileCtx.globalAlpha = 0.03;
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const shade = Math.random() > 0.5 ? 255 : 0;
      tileCtx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
      tileCtx.fillRect(x, y, 1, 1);
    }
    tileCtx.globalAlpha = 1.0;

    const woodTexture = new THREE.CanvasTexture(tileCanvas);

    // Create bump map for surface texture
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 64;
    bumpCanvas.height = 64;
    const bumpCtx = bumpCanvas.getContext('2d');
    bumpCtx.fillStyle = '#808080';
    bumpCtx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 64;
      const y = Math.random() * 64;
      const brightness = 128 + (Math.random() - 0.5) * 15;
      bumpCtx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      bumpCtx.beginPath();
      bumpCtx.arc(x, y, Math.random() * 1.5 + 0.3, 0, Math.PI * 2);
      bumpCtx.fill();
    }
    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);

    const tileMaterial = new THREE.MeshStandardMaterial({
      map: woodTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.002,
      roughness: 0.35,
      metalness: 0.0,
      emissive: isSelected ? 0x2d5a2d : 0x000000,
      emissiveIntensity: isSelected ? 0.3 : 0,
    });

    const tile = new THREE.Mesh(tileGeometry, tileMaterial);

    const rackZ = player === 1 ? rackPositionsRef.current.player1.z : rackPositionsRef.current.player2.z;
    tile.position.set(position * TILE.RACK.SPACING - TILE.RACK.OFFSET, TILE.RACK.Y_POSITION, rackZ);
    tile.rotation.x = player === 1
      ? Math.PI / 2 - RACK.SLANT_ANGLE
      : Math.PI / 2 + RACK.SLANT_ANGLE;
    tile.rotation.y = player === 1 ? 0 : Math.PI;
    tile.castShadow = true;

    // Blank tiles ('?' or '_') don't show a letter
    const isBlankTile = letter === '?' || letter === '_';

    if (!isBlankTile) {
      // Create embossed letter texture
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = TILE.LETTER.CANVAS_SIZE * 2;
      canvas.height = TILE.LETTER.CANVAS_SIZE * 2;

      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw embossed shadow
      context.fillStyle = 'rgba(80, 60, 40, 0.5)';
      context.font = `bold ${80 * 2}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(letter, canvas.width / 2 + 2, canvas.height / 2 + 2);

      // Draw main letter (white)
      context.fillStyle = '#FFFFFF';
      context.fillText(letter, canvas.width / 2, canvas.height / 2);

      // Draw highlight
      context.fillStyle = 'rgba(255, 255, 255, 0.35)';
      context.fillText(letter, canvas.width / 2 - 1, canvas.height / 2 - 1);

      const pointValue = POINT_VALUES[letter] || 0;
      if (pointValue > 0) {
        context.fillStyle = 'rgba(80, 60, 40, 0.4)';
        context.font = `bold ${35 * 2}px Arial`;
        context.textAlign = 'right';
        context.textBaseline = 'bottom';
        context.fillText(pointValue.toString(), canvas.width - 8, canvas.height - 6);

        context.fillStyle = '#FFFFFF';
        context.fillText(pointValue.toString(), canvas.width - 10, canvas.height - 8);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = 4;
      const letterGeometry = new THREE.PlaneGeometry(TILE.LETTER.RACK_SIZE, TILE.LETTER.RACK_SIZE);
      const letterMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
      });
      const letterMesh = new THREE.Mesh(letterGeometry, letterMaterial);
      letterMesh.position.y = TILE.RACK.HEIGHT / 2 + 0.001;
      letterMesh.rotation.x = TILE.LETTER.ROTATION;
      letterMesh.renderOrder = 1;
      tile.add(letterMesh);
    }

    tile.userData = { type: 'rackTile', letter, index: position, player, isBlank: isBlankTile };

    return tile;
  };

  const update3DBoard = () => {
    if (!sceneRef.current || !boardGroupRef.current || !tempBoardCoords) return;

    // Clear existing board tiles (they live in the board group)
    const group = boardGroupRef.current;
    boardTilesRef.current.forEach(tile => {
      group.remove(tile);
      if (tile.geometry) tile.geometry.dispose();
      if (tile.material) {
        if (tile.material.map) tile.material.map.dispose();
        tile.material.dispose();
      }
      tile.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
    });
    boardTilesRef.current = [];

    // Get latest move tiles for highlighting
    const latestMove = moveHistory?.length > 0 ? moveHistory[moveHistory.length - 1] : null;
    const lastMoveTilePositions = latestMove?.boardDiff?.map(t => `${t.row},${t.col}`) || [];

    // Create tiles
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        const cellValue = tempBoardCoords[row]?.[col];
        if (typeof cellValue === 'string' && cellValue.length === 1) {
          const isCommitted = typeof boardCoords[row]?.[col] === 'string';
          const isLastMove = lastMoveTilePositions.includes(`${row},${col}`);
          // Check if this tile is a blank
          const isBlank = blankTiles?.some(bt => bt.row === row && bt.col === col);
          const tile = createTile(cellValue, row, col, !isCommitted, isLastMove, isBlank);
          group.add(tile);
          boardTilesRef.current.push(tile);
        }
      }
    }
  };

  const updateRackTiles = (player, rackLetters) => {
    if (!sceneRef.current) return;

    const playerKey = player === 1 ? 'player1' : 'player2';

    // Clear existing rack tiles
    (rackTilesRef.current[playerKey] || []).forEach(tile => {
      sceneRef.current.remove(tile);
      if (tile.geometry) tile.geometry.dispose();
      if (tile.material) {
        if (tile.material.map) tile.material.map.dispose();
        tile.material.dispose();
      }
      tile.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
    });

    // Create new rack tiles
    const newRackTiles = [];
    (rackLetters || []).forEach((letter, index) => {
      const rackTile = createRackTile(letter, index, player);
      sceneRef.current.add(rackTile);
      newRackTiles.push(rackTile);
    });

    rackTilesRef.current[playerKey] = newRackTiles;
  };

  // Bot selection handler (called from scouting report)
  const handleBotSelect = (bot) => {
    setSelectedBot(bot);
    setPlayer2Name(bot.name);
    startBotGame({ origBoard, origPool, TEST_RACKS, gameStartSound, botMoveSound });
  };

  // Action button handlers
  const handleSubmit = () => {
    if (selectedTiles?.length > 0) {
      handleWordSubmit(playerMoveSound);
    }
  };

  const handlePassClick = () => {
    handlePass();
  };

  const handleExchangeClick = () => {
    // Open exchange modal instead of directly exchanging
    setTilesToExchange([]); // Clear any previously selected tiles
    setShowExchangeModal(true);
  };

  // Handle tile selection in exchange modal
  const handleExchangeTileToggle = (tile, index) => {
    const isSelected = tilesToExchange.some(t => t.index === index);
    if (isSelected) {
      setTilesToExchange(tilesToExchange.filter(t => t.index !== index));
    } else {
      setTilesToExchange([...tilesToExchange, { tile, index }]);
    }
  };

  // Confirm exchange
  const handleExchangeConfirm = () => {
    if (tilesToExchange.length > 0) {
      handleExchange();
      setShowExchangeModal(false);
    }
  };

  // Cancel exchange
  const handleExchangeCancel = () => {
    setTilesToExchange([]);
    setShowExchangeModal(false);
  };

  // Get bot icon
  const getBotIcon = (botName) => {
    const bot = bots.find(b => b.name === botName);
    if (bot?.img) {
      return <img src={bot.img} alt={botName} width={24} height={24} style={{ borderRadius: '4px' }} />;
    }
    return bot?.icon || <Robot size={24} color="#9CA3AF" />;
  };

  // Format move location for display (e.g., "8H" or "H8")
  const formatMoveLocation = (move) => {
    if (!move.tiles || move.tiles.length === 0) return null;
    const firstTile = move.tiles[0];
    const isHorizontal = move.tiles.some(t => t.row === firstTile.row && t.col === firstTile.col + 1);
    const row = firstTile.row + 1;
    const col = String.fromCharCode(65 + firstTile.col);
    return isHorizontal ? `${row}${col}` : `${col}${row}`;
  };

  // Handle Ask Theo click
  const handleAskTheoClick = () => {
    if (topMoves && topMoves.length > 0) {
      setIsAskTheoExpanded(!isAskTheoExpanded);
    } else {
      handleGetTopMovesForExpandable();
    }
  };

  // Handle move selection from Ask Theo
  const handleTopMoveSelect = (move) => {
    handleMoveSelectClick(move);
    setIsAskTheoExpanded(false);
  };

  return (
    <div className={styles.container}>
      {/* Topbar */}
      <Topbar />

      {/* Sidenav */}
      <Sidenav />

      <div ref={mountRef} className={styles.canvas} />

      {/* Loading indicator */}
      {!isLoaded && (
        <div className={styles.loading}>
          Loading 3D Scene...
        </div>
      )}

      {/* Scouting Report - compact modal when game not started */}
      {isLoaded && !gameStarted && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 1.5,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: 420,
              maxHeight: 'calc(100vh - 24px)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
              backgroundColor: lightMode === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              boxShadow: lightMode === 'dark'
                ? '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                : '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
            }}
          >
            <Typography
              component="div"
              sx={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: lightMode === 'dark' ? 'rgba(251, 191, 36, 0.95)' : '#B45309',
                textAlign: 'center',
                pb: 1,
                borderBottom: '1px solid',
                borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              }}
            >
              Scouting Report
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: 1.5,
              }}
            >
              {bots.filter(b => b.name !== 'Custom' && b.name !== 'Defense Bot').map((bot) => (
                <Box
                  key={bot.name}
                  component="button"
                  onClick={() => { setCustomBotSelected(false); handleBotSelect(bot); }}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.75,
                    py: 1.25,
                    px: 0.75,
                    borderRadius: 1.5,
                    border: '1px solid transparent',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    background: lightMode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    '&:hover': {
                      background: lightMode === 'dark' ? 'rgba(251, 191, 36, 0.12)' : 'rgba(245, 158, 11, 0.1)',
                      borderColor: lightMode === 'dark' ? 'rgba(251, 191, 36, 0.35)' : 'rgba(245, 158, 11, 0.35)',
                      transform: 'translateY(-2px)',
                    },
                    '&:active': { transform: 'translateY(0)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      bgcolor: lightMode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.06)',
                    }}
                  >
                    {bot.img ? (
                      <img src={bot.img} alt={bot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Box sx={{ color: lightMode === 'dark' ? '#94A3B8' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {bot.icon}
                      </Box>
                    )}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: lightMode === 'dark' ? '#F1F5F9' : '#1E293B',
                      lineHeight: 1.2,
                      textAlign: 'center',
                    }}
                  >
                    {bot.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 10,
                      color: lightMode === 'dark' ? 'rgba(255,255,255,0.6)' : '#64748B',
                      textAlign: 'center',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {bot.desc}
                  </Typography>
                </Box>
              ))}
            </Box>
            {/* Custom rank row - type a number and choose */}
            <Box
              onClick={() => { if (/^\d+$/.test(customRank) && parseInt(customRank, 10) > 0) { setCustomBotSelected(true); handleBotSelect({ name: 'Custom', desc: `Plays the ${customRank}th best move by points + leave.`, customRank: parseInt(customRank, 10) }); } }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.25,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: customBotSelected ? (lightMode === 'dark' ? 'rgba(251, 191, 36, 0.5)' : 'rgba(245, 158, 11, 0.5)') : (lightMode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'),
                background: customBotSelected ? (lightMode === 'dark' ? 'rgba(251, 191, 36, 0.08)' : 'rgba(245, 158, 11, 0.08)') : (lightMode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { background: lightMode === 'dark' ? 'rgba(251, 191, 36, 0.06)' : 'rgba(245, 158, 11, 0.06)' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 1.5, bgcolor: lightMode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.06)', color: lightMode === 'dark' ? '#94A3B8' : '#64748B' }}>
                <Robot size={20} color="currentColor" />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: lightMode === 'dark' ? '#F1F5F9' : '#1E293B', lineHeight: 1.3, textAlign: 'left' }}>Custom</Typography>
                <Box
                  component="span"
                  sx={{
                    fontSize: 10,
                    color: lightMode === 'dark' ? 'rgba(255,255,255,0.6)' : '#64748B',
                    lineHeight: 1.4,
                    display: 'flex',
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                    gap: 0.5,
                    textAlign: 'left',
                  }}
                >
                  Play{' '}
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customRank}
                    onChange={e => { if (/^\d*$/.test(e.target.value)) setCustomRank(e.target.value); }}
                    onClick={e => e.stopPropagation()}
                    placeholder="X"
                    style={{
                      width: 28,
                      fontSize: 10,
                      lineHeight: 1.4,
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      border: lightMode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0',
                      borderRadius: 4,
                      margin: 0,
                      padding: '2px 4px',
                      background: lightMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#fff',
                      color: lightMode === 'dark' ? '#fff' : '#1E293B',
                    }}
                  />
                  th by points + leave
                </Box>
              </Box>
              <Box
                component="button"
                disabled={!/^\d+$/.test(customRank) || parseInt(customRank, 10) <= 0}
                onClick={e => { e.stopPropagation(); if (/^\d+$/.test(customRank) && parseInt(customRank, 10) > 0) { setCustomBotSelected(true); handleBotSelect({ name: 'Custom', desc: `Plays the ${customRank}th best move by points + leave.`, customRank: parseInt(customRank, 10) }); } }}
                sx={{
                  flexShrink: 0,
                  px: 1.25,
                  py: 0.75,
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#fff',
                  border: 0,
                  borderRadius: 1,
                  cursor: /^\d+$/.test(customRank) && parseInt(customRank, 10) > 0 ? 'pointer' : 'not-allowed',
                  background: /^\d+$/.test(customRank) && parseInt(customRank, 10) > 0 ? (lightMode === 'dark' ? '#3D5A80' : '#B45309') : (lightMode === 'dark' ? '#374151' : '#94A3B8'),
                  opacity: /^\d+$/.test(customRank) && parseInt(customRank, 10) > 0 ? 1 : 0.7,
                }}
              >
                {customBotSelected ? 'Selected' : 'Choose'}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Ask Theo Panel */}
      {gameStarted && currentPlayer === 1 && !isBotThinking && !gameEnded && (
        <Box
          sx={{
            position: 'fixed',
            top: 80,
            right: 16,
            width: 280,
            zIndex: 100,
          }}
        >
          {/* Header */}
          <Box
            onClick={handleAskTheoClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              background: 'linear-gradient(135deg, rgba(55, 65, 81, 0.95) 0%, rgba(31, 41, 55, 0.98) 100%)',
              borderRadius: '8px 8px 0 0',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(65, 75, 91, 0.95) 0%, rgba(41, 51, 65, 0.98) 100%)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {topMoves && topMoves.length > 0 ? (
                <>
                  <Box sx={{
                    backgroundColor: 'rgba(251, 191, 36, 0.2)',
                    color: '#FBBF24',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>
                    1
                  </Box>
                  {formatMoveLocation(topMoves[0]) && (
                    <Box sx={{
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}>
                      {formatMoveLocation(topMoves[0])}
                    </Box>
                  )}
                  <Box sx={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                    {topMoves[0].word}
                  </Box>
                  <Box sx={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#4ADE80',
                  }}>
                    {topMoves[0].score}
                  </Box>
                </>
              ) : (
                <>
                  <Box sx={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    <img
                      src="/images/theomascot.png"
                      alt="Theo"
                      style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                    />
                  </Box>
                  <Box sx={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                    {isLoadingTopMoves ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{isDictionaryLoading ? 'Loading dictionary...' : 'Thinking...'}</span>
                        <Box className={styles.thinkingBadgeDots} sx={{ display: 'inline-flex' }}>
                          <span></span>
                          <span></span>
                          <span></span>
                        </Box>
                      </Box>
                    ) : (
                      'Ask Theo'
                    )}
                  </Box>
                </>
              )}
            </Box>
            {topMoves && topMoves.length > 0 && (
              <Box sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'flex', alignItems: 'center' }}>
                {isAskTheoExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
              </Box>
            )}
          </Box>

          {/* Expanded moves list */}
          {isAskTheoExpanded && topMoves && topMoves.length > 0 && (
            <Box
              sx={{
                background: 'rgba(31, 41, 55, 0.98)',
                borderRadius: '0 0 8px 8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderTop: 'none',
                maxHeight: '400px',
                overflowY: 'auto',
              }}
            >
              {topMoves.map((move, index) => (
                <Box
                  key={index}
                  onClick={() => handleTopMoveSelect(move)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderBottom: index < topMoves.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <Box sx={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.5)',
                    width: '18px',
                    textAlign: 'center',
                  }}>
                    {index + 1}
                  </Box>
                  {formatMoveLocation(move) && (
                    <Box sx={{
                      fontSize: '10px',
                      color: 'rgba(255, 255, 255, 0.4)',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      padding: '2px 5px',
                      borderRadius: '3px',
                      minWidth: '28px',
                      textAlign: 'center',
                    }}>
                      {formatMoveLocation(move)}
                    </Box>
                  )}
                  <Box sx={{
                    flex: 1,
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#fff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {move.word}
                  </Box>
                  <Box sx={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#4ADE80',
                  }}>
                    {move.score}
                  </Box>
                  {move.leaveValue !== undefined && (
                    <Box sx={{
                      fontSize: '10px',
                      color: '#60A5FA',
                      backgroundColor: 'rgba(96, 165, 250, 0.15)',
                      padding: '2px 5px',
                      borderRadius: '3px',
                    }}>
                      {Math.round(move.leaveValue)}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* Action buttons + instructions under Ask Theo (compact) */}
          <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', p: 1, borderRadius: '0 0 8px 8px', background: 'rgba(31, 41, 55, 0.98)' }}>
            <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', mb: 0.75 }}>
              <button
                className={`${styles.actionButton} ${styles.submitButton}`}
                onClick={handleSubmit}
                disabled={!selectedTiles || selectedTiles.length === 0}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Submit (Enter)
              </button>
              <button
                className={`${styles.actionButton} ${styles.passButton}`}
                onClick={handlePassClick}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Pass (1)
              </button>
              <button
                className={`${styles.actionButton} ${styles.exchangeButton}`}
                onClick={handleExchangeClick}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Exchange (2)
              </button>
            </Box>
            <Box sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '10px', lineHeight: 1.3 }}>
              <p style={{ margin: 0 }}>Click squares for position · Type letters · Enter = Submit</p>
              <p style={{ margin: 0 }}>1 = Pass · 2 = Exchange · Click rack to select</p>
            </Box>
          </Box>
        </Box>
      )}

      {/* Bot thinking: instructions + indicator at top right (no overlay) */}
      {gameStarted && !gameEnded && isBotThinking && (
        <Box
          sx={{
            position: 'fixed',
            top: 80,
            right: 16,
            width: 280,
            zIndex: 100,
            p: 1.5,
            borderRadius: 2,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(31, 41, 55, 0.98)',
          }}
        >
          <Box sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '10px', lineHeight: 1.3, mb: 1 }}>
            <p style={{ margin: 0 }}>Click squares for position · Type letters · Enter = Submit</p>
            <p style={{ margin: 0 }}>1 = Pass · 2 = Exchange · Click rack to select</p>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
            <img
              src={selectedBot?.img || '/images/theomascot.png'}
              alt=""
              style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'contain' }}
            />
            <span style={{ color: '#FBBF24', fontSize: 12, fontWeight: 600 }}>{selectedBot?.name || 'Theo'} thinking</span>
            <Box className={styles.thinkingBadgeDots} sx={{ display: 'inline-flex' }}>
              <span></span>
              <span></span>
              <span></span>
            </Box>
          </Box>
        </Box>
      )}

      {/* Victory Overlay */}
      {gameEnded && (
        <div className={styles.victoryOverlay}>
          <div className={styles.victoryCard}>
            <h2>Game Over!</h2>
            <p className={styles.winner}>
              {player1points > player2points ? `${player1Name} Wins!` :
               player2points > player1points ? `${player2Name} Wins!` : "It's a Tie!"}
            </p>
            <p className={styles.finalScore}>
              {player1Name}: {player1points} - {player2Name}: {player2points}
            </p>
            <button
              className={styles.rematchButton}
              onClick={() => {
                useGameStore.getState().handleNewGame();
              }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Exchange Modal - consistent with Scouting Report / site modals */}
      <Modal
        open={showExchangeModal}
        onClose={handleExchangeCancel}
        aria-labelledby="exchange-modal-title"
        BackdropProps={{ sx: { backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)' } }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            maxWidth: 420,
            p: 2.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
            backgroundColor: lightMode === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            boxShadow: lightMode === 'dark'
              ? '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
              : '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
          }}
        >
          <Typography
            id="exchange-modal-title"
            component="h2"
            sx={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: lightMode === 'dark' ? 'rgba(251, 191, 36, 0.95)' : '#B45309',
              textAlign: 'center',
              mb: 1,
              pb: 1,
              borderBottom: '1px solid',
              borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }}
          >
            Exchange Tiles
          </Typography>
          <Typography sx={{ color: lightMode === 'dark' ? '#94A3B8' : '#64748B', textAlign: 'center', fontSize: 13, mb: 2 }}>
            Click tiles to select ({tilesToExchange.length} selected)
          </Typography>

          {/* Tile rack - same Rack component as 2D Play */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Rack
              rack={currentPlayer === 1 ? player1Rack : player2Rack}
              color={tileColor}
              onTileClick={(letter, index) => handleExchangeTileToggle(letter, index)}
              selectedTiles={tilesToExchange}
            />
          </Box>

          {pool.length < 7 && (
            <Typography sx={{ color: '#EF4444', textAlign: 'center', fontSize: 12, mb: 1.5 }}>
              Fewer than 7 tiles in pool ({pool.length} remaining)
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 2 }}>
            <Box
              component="button"
              onClick={handleExchangeCancel}
              sx={{
                px: 2,
                py: 1,
                fontSize: 14,
                fontWeight: 600,
                color: lightMode === 'dark' ? '#94A3B8' : '#64748B',
                border: '1px solid',
                borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                borderRadius: 1.5,
                cursor: 'pointer',
                background: 'transparent',
                '&:hover': { background: lightMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
              }}
            >
              Cancel
            </Box>
            <Box
              component="button"
              onClick={handleExchangeConfirm}
              disabled={tilesToExchange.length === 0 || pool.length < 7}
              sx={{
                px: 2,
                py: 1,
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                border: 'none',
                borderRadius: 1.5,
                cursor: tilesToExchange.length > 0 && pool.length >= 7 ? 'pointer' : 'not-allowed',
                opacity: tilesToExchange.length > 0 && pool.length >= 7 ? 1 : 0.5,
                background: tilesToExchange.length > 0 && pool.length >= 7
                  ? (lightMode === 'dark' ? 'linear-gradient(135deg, #D97706, #B45309)' : 'linear-gradient(135deg, #EA580C, #C2410C)')
                  : (lightMode === 'dark' ? '#374151' : '#94A3B8'),
                '&:hover': (tilesToExchange.length > 0 && pool.length >= 7) ? { opacity: 0.95 } : {},
              }}
            >
              Exchange {tilesToExchange.length > 0 ? `(${tilesToExchange.length})` : ''}
            </Box>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default Scrabble3DPlay;
