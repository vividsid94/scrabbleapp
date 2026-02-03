import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useNavigate } from 'react-router-dom';
import styles from './Scrabble3DPlay.module.css';
import { origPool, origBoard } from "../../components/AppContent/References/staticData.js";
import { TEST_RACKS } from "../../components/AppContent/References/testRacks.js";
import { useGameStore } from '../../stores/gameStore';
import { handleKeyDown } from '../../functions/play/keyboardFunctions';
import { handleTileClick } from '../../functions/play/tileFunctions';
import { handleBoardPositionSelect } from '../../functions/play/boardFunctions';
import { initializeSounds } from '../../functions/play/soundFunctions';
import {
  Smiley, Robot, UserCircle, ArrowLeft, Play, Cube
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
  const navigate = useNavigate();
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
  const arrowIndicatorRef = useRef(null);
  // Our side = positive Z (camera side). Swapped so player 1 rack is on our side.
  const rackPositionsRef = useRef({
    player1: RACK.POSITIONS.PLAYER2,
    player2: RACK.POSITIONS.PLAYER1
  });
  const rack2MeshesRef = useRef([]); // Bot's rack furniture - hide when isBotMode

  const [isLoaded, setIsLoaded] = useState(false);
  const [needsRender, setNeedsRender] = useState(true);
  const [botSelectorOpen, setBotSelectorOpen] = useState(false);

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
    initializeGame,
    startBotGame,
    handleWordSubmit,
    handlePass,
    handleExchange,
    makeBotMove,
    handleKeyDownWrapper,
  } = useGameStore();

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
      initializeGame(origBoard, origPool, TEST_RACKS, gameStartSound, botMoveSound);
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

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER.PIXEL_RATIO_MAX));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
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
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = RENDERER.SHADOW_MAP_SIZE;
    directionalLight.shadow.mapSize.height = RENDERER.SHADOW_MAP_SIZE;
    scene.add(directionalLight);
    resourcesRef.current.lights.push(directionalLight);

    LIGHTS.POINT_LIGHTS.forEach(lightConfig => {
      const pointLight = new THREE.PointLight(lightConfig.COLOR, lightConfig.INTENSITY, lightConfig.DISTANCE);
      pointLight.position.set(lightConfig.POSITION.x, lightConfig.POSITION.y, lightConfig.POSITION.z);
      scene.add(pointLight);
      resourcesRef.current.lights.push(pointLight);
    });

    // Create environment
    createMagicalEnvironment(scene);
    createTableAndChairs(scene);
    createBoard(scene);
    createArrowIndicator(scene);
    createScoresheet(scene);
    createScoreboard(scene);

    // Animation loop
    let lastTime = 0;
    const frameInterval = ANIMATION.FRAME_INTERVAL;

    const animate = (currentTime) => {
      resourcesRef.current.animationId = requestAnimationFrame(animate);

      if (currentTime - lastTime < frameInterval) return;
      lastTime = currentTime;

      controls.update();

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

  // Update 3D board when boardCoords or tempBoardCoords change
  useEffect(() => {
    if (sceneRef.current && tempBoardCoords?.length > 0) {
      update3DBoard();
      setNeedsRender(true);
    }
  }, [tempBoardCoords, boardCoords]);

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

  // Update physical scoresheet and scoreboard when game state changes
  useEffect(() => {
    if (!sceneRef.current?.scoresheet || !sceneRef.current?.scoreboard) return;
    updateScoresheet();
    updateScoreboard();
    setNeedsRender(true);
  }, [player1points, player2points, moveHistory, player1Name, player2Name]);

  // Update arrow indicator when selection changes
  useEffect(() => {
    if (arrowIndicatorRef.current && sceneRef.current) {
      updateArrowIndicator();
      setNeedsRender(true);
    }
  }, [selectedBoardPosition, arrowDirection]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDownEvent = (e) => {
      handleKeyDownWrapper(e, playerMoveSound, origBoard);
    };

    window.addEventListener('keydown', handleKeyDownEvent);
    return () => window.removeEventListener('keydown', handleKeyDownEvent);
  }, [handleKeyDownWrapper, playerMoveSound]);

  // Track mouse down position to distinguish clicks from drags
  const handleMouseDown = useCallback((event) => {
    mouseDownPosRef.current = { x: event.clientX, y: event.clientY };
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
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('click', handleCanvasClick);
      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('click', handleCanvasClick);
      };
    }
  }, [handleCanvasClick, handleMouseDown]);

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

  const createBoard = (scene) => {
    // Circular board base
    const boardGeometry = new THREE.CylinderGeometry(BOARD.RADIUS, BOARD.RADIUS, BOARD.HEIGHT, BOARD.SEGMENTS);
    const boardMaterial = new THREE.MeshPhongMaterial({
      color: BOARD.MATERIAL.COLOR,
      transparent: true,
      opacity: BOARD.MATERIAL.OPACITY,
      shininess: BOARD.MATERIAL.SHININESS,
      reflectivity: BOARD.MATERIAL.REFLECTIVITY
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.receiveShadow = true;
    board.position.y = BOARD.Y_POSITION;
    scene.add(board);
    resourcesRef.current.geometries.push(boardGeometry);
    resourcesRef.current.materials.push(boardMaterial);
    resourcesRef.current.meshes.push(board);

    // Create squares
    const startX = -(BOARD.GRID.SIZE * BOARD.GRID.SQUARE_SIZE) / 2 + BOARD.GRID.SQUARE_SIZE / 2;
    const startZ = -(BOARD.GRID.SIZE * BOARD.GRID.SQUARE_SIZE) / 2 + BOARD.GRID.SQUARE_SIZE / 2;

    const parsedOrigBoard = JSON.parse(origBoard);

    for (let row = 0; row < BOARD.GRID.SIZE; row++) {
      for (let col = 0; col < BOARD.GRID.SIZE; col++) {
        const squareGeometry = new THREE.BoxGeometry(
          BOARD.GRID.SQUARE_SIZE * BOARD.GRID.SQUARE_SCALE,
          BOARD.GRID.SQUARE_HEIGHT,
          BOARD.GRID.SQUARE_SIZE * BOARD.GRID.SQUARE_SCALE
        );

        const boardValue = parsedOrigBoard[row][col];
        let squareColor = BOARD.SQUARE_COLORS.EMPTY;

        if (boardValue === GAME.BOARD_VALUES.TRIPLE_WORD) {
          squareColor = BOARD.SQUARE_COLORS.TRIPLE_WORD;
        } else if (boardValue === GAME.BOARD_VALUES.DOUBLE_WORD) {
          squareColor = BOARD.SQUARE_COLORS.DOUBLE_WORD;
        } else if (boardValue === GAME.BOARD_VALUES.TRIPLE_LETTER) {
          squareColor = BOARD.SQUARE_COLORS.TRIPLE_LETTER;
        } else if (boardValue === GAME.BOARD_VALUES.DOUBLE_LETTER) {
          squareColor = BOARD.SQUARE_COLORS.DOUBLE_LETTER;
        }

        const squareMaterial = new THREE.MeshPhongMaterial({
          color: squareColor,
          shininess: 100,
          transparent: true,
          opacity: 0.9
        });
        const square = new THREE.Mesh(squareGeometry, squareMaterial);
        square.position.set(
          startX + col * BOARD.GRID.SQUARE_SIZE,
          BOARD.GRID.Y_POSITION,
          startZ + row * BOARD.GRID.SQUARE_SIZE
        );
        square.castShadow = true;
        square.receiveShadow = true;

        // Store metadata for raycasting
        square.userData = {
          type: 'boardSquare',
          row,
          col
        };

        scene.add(square);
        boardSquaresRef.current.push(square);
        resourcesRef.current.geometries.push(squareGeometry);
        resourcesRef.current.materials.push(squareMaterial);
        resourcesRef.current.meshes.push(square);
      }
    }

    // Grid lines
    const gridLineMaterial = new THREE.MeshPhongMaterial({
      color: BOARD.GRID.GRID_LINE.MATERIAL.COLOR,
      transparent: true,
      opacity: BOARD.GRID.GRID_LINE.MATERIAL.OPACITY,
      shininess: BOARD.GRID.GRID_LINE.MATERIAL.SHININESS
    });

    for (let row = 0; row <= BOARD.GRID.SIZE; row++) {
      const gridLineGeometry = new THREE.BoxGeometry(
        BOARD.GRID.SIZE * BOARD.GRID.SQUARE_SIZE,
        BOARD.GRID.GRID_LINE.HEIGHT,
        BOARD.GRID.GRID_LINE.WIDTH
      );
      const gridLine = new THREE.Mesh(gridLineGeometry, gridLineMaterial);
      gridLine.position.set(
        0,
        BOARD.GRID.GRID_LINE.Y_POSITION,
        startZ + row * BOARD.GRID.SQUARE_SIZE - BOARD.GRID.SQUARE_SIZE / 2
      );
      scene.add(gridLine);
      resourcesRef.current.geometries.push(gridLineGeometry);
      resourcesRef.current.meshes.push(gridLine);
    }

    for (let col = 0; col <= BOARD.GRID.SIZE; col++) {
      for (let row = 0; row < BOARD.GRID.SIZE; row++) {
        const gridLineGeometry = new THREE.BoxGeometry(
          BOARD.GRID.GRID_LINE.WIDTH,
          BOARD.GRID.GRID_LINE.HEIGHT,
          BOARD.GRID.SQUARE_SIZE - BOARD.GRID.GRID_LINE.WIDTH
        );
        const gridLine = new THREE.Mesh(gridLineGeometry, gridLineMaterial);
        gridLine.position.set(
          startX + col * BOARD.GRID.SQUARE_SIZE - BOARD.GRID.SQUARE_SIZE / 2,
          BOARD.GRID.GRID_LINE.Y_POSITION,
          startZ + row * BOARD.GRID.SQUARE_SIZE
        );
        scene.add(gridLine);
        resourcesRef.current.geometries.push(gridLineGeometry);
        resourcesRef.current.meshes.push(gridLine);
      }
    }

    resourcesRef.current.materials.push(gridLineMaterial);
  };

  const createArrowIndicator = (scene) => {
    // Create arrow shape (pointing down)
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(0, -0.3);
    arrowShape.lineTo(0.15, 0);
    arrowShape.lineTo(0.05, 0);
    arrowShape.lineTo(0.05, 0.2);
    arrowShape.lineTo(-0.05, 0.2);
    arrowShape.lineTo(-0.05, 0);
    arrowShape.lineTo(-0.15, 0);
    arrowShape.lineTo(0, -0.3);

    const extrudeSettings = { depth: 0.05, bevelEnabled: false };
    const arrowGeometry = new THREE.ExtrudeGeometry(arrowShape, extrudeSettings);
    const arrowMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFD700,
      emissive: 0xFFD700,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9
    });

    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.visible = false;
    scene.add(arrow);

    arrowIndicatorRef.current = arrow;
    resourcesRef.current.geometries.push(arrowGeometry);
    resourcesRef.current.materials.push(arrowMaterial);
    resourcesRef.current.meshes.push(arrow);
  };

  const updateArrowIndicator = () => {
    const arrow = arrowIndicatorRef.current;
    if (!arrow) return;

    if (selectedBoardPosition) {
      const { row, col } = selectedBoardPosition;
      const startX = -(BOARD.GRID.SIZE * BOARD.GRID.SQUARE_SIZE) / 2 + BOARD.GRID.SQUARE_SIZE / 2;
      const startZ = -(BOARD.GRID.SIZE * BOARD.GRID.SQUARE_SIZE) / 2 + BOARD.GRID.SQUARE_SIZE / 2;

      arrow.position.set(
        startX + col * BOARD.GRID.SQUARE_SIZE,
        0.3,
        startZ + row * BOARD.GRID.SQUARE_SIZE
      );

      arrow.rotation.x = -Math.PI / 2;
      arrow.rotation.z = arrowDirection === 'right' ? Math.PI / 2 : 0;

      arrow.visible = true;
    } else {
      arrow.visible = false;
    }
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

  const createTile = (letter, row, col, isTemp = false) => {
    const tileGeometry = new THREE.BoxGeometry(TILE.BOARD.WIDTH, TILE.BOARD.HEIGHT, TILE.BOARD.DEPTH);
    const tileMaterial = new THREE.MeshPhongMaterial({
      color: isTemp ? 0xFFD700 : TILE.BOARD.MATERIAL.COLOR,
      transparent: true,
      opacity: isTemp ? 0.9 : TILE.BOARD.MATERIAL.OPACITY,
      shininess: TILE.BOARD.MATERIAL.SHININESS
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

    // Letter texture
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = TILE.LETTER.CANVAS_SIZE;
    canvas.height = TILE.LETTER.CANVAS_SIZE;

    context.clearRect(0, 0, TILE.LETTER.CANVAS_SIZE, TILE.LETTER.CANVAS_SIZE);
    context.fillStyle = TILE.LETTER.COLORS.LETTER;
    context.font = TILE.LETTER.FONT.BOARD;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter.toUpperCase(), TILE.LETTER.CANVAS_SIZE/2, TILE.LETTER.CANVAS_SIZE/2);

    const pointValue = POINT_VALUES[letter.toUpperCase()] || 0;
    if (pointValue > 0) {
      context.fillStyle = TILE.LETTER.COLORS.POINTS;
      context.font = TILE.LETTER.FONT.POINTS;
      context.textAlign = 'right';
      context.textBaseline = 'bottom';
      context.fillText(pointValue.toString(), TILE.LETTER.CANVAS_SIZE, TILE.LETTER.CANVAS_SIZE);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const letterGeometry = new THREE.PlaneGeometry(TILE.LETTER.BOARD_SIZE, TILE.LETTER.BOARD_SIZE);
    const letterMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.01
    });
    const letterMesh = new THREE.Mesh(letterGeometry, letterMaterial);
    letterMesh.position.y = TILE.LETTER.Y_OFFSET;
    letterMesh.rotation.x = TILE.LETTER.ROTATION;
    tile.add(letterMesh);

    tile.userData = { type: 'boardTile', letter, row, col, isTemp };

    return tile;
  };

  const createRackTile = (letter, position, player) => {
    const tileGeometry = new THREE.BoxGeometry(TILE.RACK.WIDTH, TILE.RACK.HEIGHT, TILE.RACK.DEPTH);

    // Check if this tile is selected
    const isSelected = selectedTiles?.some(t => t.tile === letter);

    const tileMaterial = new THREE.MeshPhongMaterial({
      color: isSelected ? 0x90EE90 : TILE.RACK.MATERIAL.COLOR,
      transparent: true,
      opacity: TILE.RACK.MATERIAL.OPACITY,
      shininess: TILE.RACK.MATERIAL.SHININESS,
      emissive: isSelected ? 0x00FF00 : 0x000000,
      emissiveIntensity: isSelected ? 0.3 : 0
    });
    const tile = new THREE.Mesh(tileGeometry, tileMaterial);

    const rackZ = player === 1 ? rackPositionsRef.current.player1.z : rackPositionsRef.current.player2.z;
    tile.position.set(position * TILE.RACK.SPACING - TILE.RACK.OFFSET, TILE.RACK.Y_POSITION, rackZ);
    // Use same tile rotation as original bot's rack (PI/2 - slant, no Y flip) for our side so lettering is forward
    tile.rotation.x = player === 1
      ? Math.PI / 2 - RACK.SLANT_ANGLE
      : Math.PI / 2 + RACK.SLANT_ANGLE;
    tile.rotation.y = player === 1 ? 0 : Math.PI;
    tile.castShadow = true;

    // Letter texture
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = TILE.LETTER.CANVAS_SIZE;
    canvas.height = TILE.LETTER.CANVAS_SIZE;

    context.clearRect(0, 0, TILE.LETTER.CANVAS_SIZE, TILE.LETTER.CANVAS_SIZE);
    context.fillStyle = TILE.LETTER.COLORS.LETTER;
    context.font = TILE.LETTER.FONT.RACK;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter === '?' ? '*' : letter, TILE.LETTER.CANVAS_SIZE/2, TILE.LETTER.CANVAS_SIZE/2);

    const pointValue = POINT_VALUES[letter] || 0;
    if (pointValue > 0) {
      context.fillStyle = TILE.LETTER.COLORS.POINTS;
      context.font = TILE.LETTER.FONT.RACK_POINTS;
      context.textAlign = 'right';
      context.textBaseline = 'bottom';
      context.fillText(pointValue.toString(), TILE.LETTER.CANVAS_SIZE, TILE.LETTER.CANVAS_SIZE);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const letterGeometry = new THREE.PlaneGeometry(TILE.LETTER.RACK_SIZE, TILE.LETTER.RACK_SIZE);
    const letterMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.01
    });
    const letterMesh = new THREE.Mesh(letterGeometry, letterMaterial);
    letterMesh.position.y = TILE.LETTER.Y_OFFSET;
    letterMesh.rotation.x = TILE.LETTER.ROTATION;
    tile.add(letterMesh);

    letterMesh.renderOrder = 1;
    letterMaterial.depthTest = false;

    tile.userData = { type: 'rackTile', letter, index: position, player };

    return tile;
  };

  const update3DBoard = () => {
    if (!sceneRef.current || !tempBoardCoords) return;

    // Clear existing board tiles
    boardTilesRef.current.forEach(tile => {
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
    boardTilesRef.current = [];

    // Create tiles
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        const cellValue = tempBoardCoords[row]?.[col];
        if (typeof cellValue === 'string' && cellValue.length === 1) {
          const isCommitted = typeof boardCoords[row]?.[col] === 'string';
          const tile = createTile(cellValue, row, col, !isCommitted);
          sceneRef.current.add(tile);
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

  // Bot selection handler
  const handleBotSelect = (bot) => {
    setSelectedBot(bot);
    setPlayer2Name(bot.name);
    setBotSelectorOpen(false);
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
    handleExchange();
  };

  // Get bot icon
  const getBotIcon = (botName) => {
    const bot = bots.find(b => b.name === botName);
    if (bot?.img) {
      return <img src={bot.img} alt={botName} width={24} height={24} style={{ borderRadius: '4px' }} />;
    }
    return bot?.icon || <Robot size={24} color="#9CA3AF" />;
  };

  return (
    <div className={styles.container}>
      <div ref={mountRef} className={styles.canvas} />

      {/* Loading indicator */}
      {!isLoaded && (
        <div className={styles.loading}>
          Loading 3D Scene...
        </div>
      )}

      {/* Back to 2D button */}
      <button
        className={styles.backButton}
        onClick={() => navigate('/play')}
      >
        <ArrowLeft size={20} />
        <span>2D Mode</span>
      </button>

      {/* Bot Selector Dropdown */}
      <div className={styles.botSelectorContainer}>
        <button
          className={styles.botSelectorButton}
          onClick={() => setBotSelectorOpen(!botSelectorOpen)}
        >
          {getBotIcon(selectedBot?.name || 'Theo')}
          <span>{selectedBot?.name || 'Select Bot'}</span>
        </button>

        {botSelectorOpen && (
          <div className={styles.botDropdown}>
            {bots.map((bot) => (
              <div
                key={bot.name}
                className={styles.botOption}
                onClick={() => handleBotSelect(bot)}
              >
                {bot.img ? (
                  <img src={bot.img} alt={bot.name} width={24} height={24} style={{ borderRadius: '4px' }} />
                ) : (
                  bot.icon
                )}
                <div className={styles.botInfo}>
                  <span className={styles.botName}>{bot.name}</span>
                  <span className={styles.botDesc}>{bot.desc}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {gameStarted && currentPlayer === 1 && !isBotThinking && (
        <div className={styles.actionButtons}>
          <button
            className={`${styles.actionButton} ${styles.submitButton}`}
            onClick={handleSubmit}
            disabled={!selectedTiles || selectedTiles.length === 0}
          >
            Submit (Enter)
          </button>
          <button
            className={`${styles.actionButton} ${styles.passButton}`}
            onClick={handlePassClick}
          >
            Pass (1)
          </button>
          <button
            className={`${styles.actionButton} ${styles.exchangeButton}`}
            onClick={handleExchangeClick}
          >
            Exchange (2)
          </button>
        </div>
      )}

      {/* Start Game Button */}
      {!gameStarted && (
        <div className={styles.startGameContainer}>
          <button
            className={styles.startGameButton}
            onClick={() => setBotSelectorOpen(true)}
          >
            <Play size={24} />
            <span>Start Game</span>
          </button>
        </div>
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

      {/* Instructions */}
      <div className={styles.instructions}>
        <p>Click board squares to select position | Type letters to place tiles | Enter to submit</p>
        <p>1 = Pass | 2 = Exchange | Click rack tiles to select</p>
      </div>
    </div>
  );
};

export default Scrabble3DPlay;
