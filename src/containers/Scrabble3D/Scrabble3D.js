import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import styles from './Scrabble3D.module.css';
import { getMoveSet } from '../../axios/api';
import { parseGCG } from '../../utils/gcgParser';
import { createRack } from '../../functions/rackFunctions';
import { origPool, origBoard, letterLookup } from "../../components/AppContent/References/staticData.js";
import { extractLocation } from '../../functions/boardFunctions';
import { handleMove } from '../../functions/moveHandlers';
import { useSearchParams } from 'react-router-dom';
import { 
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ArrowClockwise,
  CaretLeft,
  CaretRight,
  CaretUp,
  CaretDown,
  House,
  Binoculars
} from '@phosphor-icons/react';
import {
  CAMERA,
  RENDERER,
  SCENE,
  LIGHTS,
  MATERIALS,
  ENVIRONMENT,
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
import {
  createFloorAndRug,
  createTableSurface,
  createChairs,
  createScoresheetBase,
  paintScoresheet,
  createBrassStandingConsole,
  paintScoreboardConsole,
  loadFoxCrestIcon,
  attachTileLetter
} from './scrabble3DDecor';

// Preload all protile images like the Cell component does
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

// Cleanup function for preloaded resources
function cleanupPreloadedResources() {
  // Dispose all preloaded textures
  Object.values(preloadedTextures).forEach(texture => {
    if (texture && texture.dispose) {
      texture.dispose();
    }
  });
  
  // Clear references
  preloadedTextures = {};
  preloadedImages = {};
}

// Initialize preloading
preloadProtiles();

const Scrabble3D = () => {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId');
  
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Game state - exactly like viewer
  const [gameData, setGameData] = useState(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1); // Start at -1 like viewer (empty board)
  const [previousMoveIndex, setPreviousMoveIndex] = useState(-1); // Track previous move for direction
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(GAME.PLAYBACK_SPEEDS.NORMAL); // ms per move
  const [boardState, setBoardState] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [rackTiles, setRackTiles] = useState({ player1: [], player2: [] });
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsRender, setNeedsRender] = useState(true);
  
  // Additional state needed for moveHandlers (like viewer)
  const [boardCoords, setBoardCoords] = useState([]);
  const [currentMoveCoords, setCurrentMoveCoords] = useState([]);
  const [player1points, setPlayer1points] = useState(0);
  const [player2points, setPlayer2points] = useState(0);
  const [pointsScored, setPointsScored] = useState(0);

  // Store references to all created resources for cleanup
  const resourcesRef = useRef({
    geometries: [],
    materials: [],
    textures: [],
    meshes: [],
    lights: [],
    controls: null,
    animationId: null
  });

  // Shared geometries to reduce memory usage
  const sharedGeometriesRef = useRef({
    boxGeometry: new THREE.BoxGeometry(1, 1, 1),
    planeGeometry: new THREE.PlaneGeometry(1, 1),
    cylinderGeometry: new THREE.CylinderGeometry(1, 1, 1, 8),
    sphereGeometry: new THREE.SphereGeometry(1, 8, 6)
  });

  const foxIconRef = useRef(null); // Gold-tinted fox crest, pre-rendered once for the scoreboard

  // Add state for full player names
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');

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

    // Renderer setup with optimized settings
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER.PIXEL_RATIO_MAX));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false; // Only update shadows when needed
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = CONTROLS.DAMPING_FACTOR;
    
    // Add constraints to prevent extreme angles that cause distortion
    controls.minDistance = 10; // Don't get too close
    controls.maxDistance = 50; // Don't get too far
    controls.minPolarAngle = Math.PI / 6; // 30 degrees - don't go too horizontal
    controls.maxPolarAngle = Math.PI / 2.5; // About 72 degrees - don't go too vertical
    
    controlsRef.current = controls;
    resourcesRef.current.controls = controls;
    
    // Trigger render on camera movement
    controls.addEventListener('change', () => {
      setNeedsRender(true);
    });

    // Magical lighting setup
    const ambientLight = new THREE.AmbientLight(LIGHTS.AMBIENT.COLOR, LIGHTS.AMBIENT.INTENSITY);
    scene.add(ambientLight);
    resourcesRef.current.lights.push(ambientLight);

    const directionalLight = new THREE.DirectionalLight(LIGHTS.DIRECTIONAL.COLOR, LIGHTS.DIRECTIONAL.INTENSITY);
    directionalLight.position.set(LIGHTS.DIRECTIONAL.POSITION.x, LIGHTS.DIRECTIONAL.POSITION.y, LIGHTS.DIRECTIONAL.POSITION.z);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = RENDERER.SHADOW_MAP_SIZE;
    directionalLight.shadow.mapSize.height = RENDERER.SHADOW_MAP_SIZE;
    directionalLight.shadow.camera.near = LIGHTS.DIRECTIONAL.SHADOW_CAMERA.NEAR;
    directionalLight.shadow.camera.far = LIGHTS.DIRECTIONAL.SHADOW_CAMERA.FAR;
    directionalLight.shadow.camera.left = LIGHTS.DIRECTIONAL.SHADOW_CAMERA.LEFT;
    directionalLight.shadow.camera.right = LIGHTS.DIRECTIONAL.SHADOW_CAMERA.RIGHT;
    directionalLight.shadow.camera.top = LIGHTS.DIRECTIONAL.SHADOW_CAMERA.TOP;
    directionalLight.shadow.camera.bottom = LIGHTS.DIRECTIONAL.SHADOW_CAMERA.BOTTOM;
    scene.add(directionalLight);
    resourcesRef.current.lights.push(directionalLight);

    // Point lights
    LIGHTS.POINT_LIGHTS.forEach(lightConfig => {
      const pointLight = new THREE.PointLight(lightConfig.COLOR, lightConfig.INTENSITY, lightConfig.DISTANCE);
      pointLight.position.set(lightConfig.POSITION.x, lightConfig.POSITION.y, lightConfig.POSITION.z);
      scene.add(pointLight);
      resourcesRef.current.lights.push(pointLight);
    });

    // Create magical environment
    createMagicalEnvironment(scene);

    // Create magical table and chairs
    createTableAndChairs(scene);

    // Create 3D board (shared with 3D Play so scene matches exactly)
    createBoardScene(scene, { resourcesRef, origBoard });

    // Animation loop with frame rate limiting
    let lastTime = 0;
    const targetFPS = RENDERER.TARGET_FPS;
    const frameInterval = ANIMATION.FRAME_INTERVAL;
    
    const animate = (currentTime) => {
      resourcesRef.current.animationId = requestAnimationFrame(animate);
      
      // Frame rate limiting
      if (currentTime - lastTime < frameInterval) {
        return;
      }
      lastTime = currentTime;
      
      controls.update();
      
      // Animate environment elements
      if (sceneRef.current.lamps) {
        const time = currentTime * 0.001;
        sceneRef.current.lamps.forEach((lamp, index) => {
          // Gentle flickering
          lamp.material.emissiveIntensity = LIGHTS.LAMP.ANIMATION.BASE_INTENSITY + 
            Math.sin(time * LIGHTS.LAMP.ANIMATION.FLICKER_SPEED + index) * LIGHTS.LAMP.ANIMATION.FLICKER_AMPLITUDE;
        });
      }
      
      // Animate scoreboard pulse light
      if (sceneRef.current.pulseLight) {
        const time = currentTime * 0.001;
        sceneRef.current.pulseLight.intensity = 0.3 + Math.sin(time * 2) * 0.2;
      }
      
      // Only render when needed
      if (needsRender) {
        renderer.render(scene, camera);
        setNeedsRender(false);
      }
    };
    animate(0);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      setNeedsRender(true); // Trigger render after resize
    };
    window.addEventListener('resize', handleResize);

    setIsLoaded(true);

    return () => {
      // Cancel animation frame
      if (resourcesRef.current.animationId) {
        cancelAnimationFrame(resourcesRef.current.animationId);
      }

      // Remove event listeners
      window.removeEventListener('resize', handleResize);
      
      // Dispose controls
      if (resourcesRef.current.controls) {
        resourcesRef.current.controls.dispose();
      }

      // Dispose all geometries
      resourcesRef.current.geometries.forEach(geometry => {
        geometry.dispose();
      });

      // Dispose shared geometries
      Object.values(sharedGeometriesRef.current).forEach(geometry => {
        if (geometry && geometry.dispose) {
          geometry.dispose();
        }
      });

      // Dispose all materials
      resourcesRef.current.materials.forEach(material => {
        if (material.map) material.map.dispose();
        if (material.lightMap) material.lightMap.dispose();
        if (material.bumpMap) material.bumpMap.dispose();
        if (material.normalMap) material.normalMap.dispose();
        if (material.specularMap) material.specularMap.dispose();
        if (material.envMap) material.envMap.dispose();
        material.dispose();
      });

      // Dispose all textures
      resourcesRef.current.textures.forEach(texture => {
        texture.dispose();
      });

      // Remove all meshes from scene
      resourcesRef.current.meshes.forEach(mesh => {
        if (mesh.parent) {
          mesh.parent.remove(mesh);
        }
      });

      // Clear scene
      if (sceneRef.current) {
        sceneRef.current.clear();
      }

      // Remove renderer from DOM
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }

      // Dispose renderer
      renderer.dispose();

      // Clear resources reference
      resourcesRef.current = {
        geometries: [],
        materials: [],
        textures: [],
        meshes: [],
        lights: [],
        controls: null,
        animationId: null
      };
      
      // Cleanup preloaded resources
      cleanupPreloadedResources();
    };
  }, []);

  // Pre-render the fox crest once, tinted brass gold, so the scoreboard can
  // just drawImage() it on every update instead of re-tinting every frame
  useEffect(() => {
    loadFoxCrestIcon((tintedIcon) => {
      foxIconRef.current = tintedIcon;
      updateScoreboard();
      setNeedsRender(true);
    });
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
        setTimeout(checkAndPreloadTextures, PRELOAD.CHECK_INTERVAL);
      }
    };
    
    checkAndPreloadTextures();
  }, []);

  // handleMoveWrapper - exactly like viewer
  const handleMoveWrapper = (superLastMove, lastMove, thisMove, nextMove, type) => {
    const state = {
      setBoardCoords,
      setCurrentMoveCoords,
      setPlayer1points,
      setPlayer2points,
      setPointsScored,
      boardCoords,
      origBoard
    };
    
    // Calculate move indices - these are now just the move indices directly
    const superLastMoveIndex = superLastMove !== null && superLastMove !== undefined ? superLastMove : -1;
    const lastMoveIndex = lastMove !== null && lastMove !== undefined ? lastMove : -1;
    const thisMoveIndex = thisMove !== null && thisMove !== undefined ? thisMove : -1;
    const nextMoveIndex = nextMove !== null && nextMove !== undefined ? nextMove : -1;
    
    handleMove(superLastMoveIndex, lastMoveIndex, thisMoveIndex, nextMoveIndex, type, state, gameData);
  };

  // Load game data
  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        
        if (!gameId) {
          // Use default game if no gameId
          const gameNum = GAME.DEFAULT_GAME_ID;
          const rawGCG = await getMoveSet('https://www.cross-tables.com/annotated/selfgcg/', gameNum);
          let extractedPlayer1 = null;
          let extractedPlayer2 = null;
          if (rawGCG) {
            const lines = rawGCG.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].startsWith('#player1')) {
                extractedPlayer1 = lines[i].split(' ').slice(2).join(' ').trim();
              }
              if (lines[i].startsWith('#player2')) {
                extractedPlayer2 = lines[i].split(' ').slice(2).join(' ').trim();
              }
            }
            const parsedMoves = parseGCG(rawGCG);
            setGameData(parsedMoves);
            const initialBoard = JSON.parse(origBoard);
            setBoardCoords(initialBoard);
            setBoardState(initialBoard.map(row => row.map(Number)));
            if (extractedPlayer1 && extractedPlayer2) {
              setPlayer1Name(extractedPlayer1);
              setPlayer2Name(extractedPlayer2);
            } else {
              setPlayer1Name(parsedMoves && parsedMoves.length > 0 ? parsedMoves[0].player : 'Player 1');
              setPlayer2Name(parsedMoves && parsedMoves.length > 1 ? parsedMoves[1].player : 'Player 2');
            }
          }
          setLoading(false);
          return;
        }

        // Detect Woogles game
        if (typeof gameId === 'string' && gameId.startsWith('woogles-')) {
          const wooglesId = gameId.replace('woogles-', '');
          try {
            const { getWooglesGameGCG } = await import('../../axios/api');
            const rawGCG = await getWooglesGameGCG(wooglesId);
            if (!rawGCG) throw new Error('Failed to load Woogles GCG');
            // Parse player names from headers
            let extractedPlayer1 = null;
            let extractedPlayer2 = null;
            const lines = rawGCG.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].startsWith('#player1')) {
                extractedPlayer1 = lines[i].split(' ').slice(2).join(' ').trim();
              }
              if (lines[i].startsWith('#player2')) {
                extractedPlayer2 = lines[i].split(' ').slice(2).join(' ').trim();
              }
            }
            const parsedMoves = parseGCG(rawGCG);
            setGameData(parsedMoves);
            const initialBoard = JSON.parse(origBoard);
            setBoardCoords(initialBoard);
            setBoardState(initialBoard.map(row => row.map(Number)));
            setPlayer1Name(extractedPlayer1 || (parsedMoves && parsedMoves.length > 0 ? parsedMoves[0].player : 'Player 1'));
            setPlayer2Name(extractedPlayer2 || (parsedMoves && parsedMoves.length > 1 ? parsedMoves[1].player : 'Player 2'));
          } catch (err) {
            setGameData([]);
            setPlayer1Name('Player 1');
            setPlayer2Name('Player 2');
            setBoardCoords(JSON.parse(origBoard));
            setBoardState(JSON.parse(origBoard).map(row => row.map(Number)));
            console.error('Failed to load Woogles game:', err);
          }
          setLoading(false);
          return;
        }

        // Otherwise, treat as Cross-Tables game
        const gameNum = parseInt(gameId);
        const rawGCG = await getMoveSet('https://www.cross-tables.com/annotated/selfgcg/', gameNum);
        let extractedPlayer1 = null;
        let extractedPlayer2 = null;
        if (rawGCG) {
          const lines = rawGCG.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('#player1')) {
              extractedPlayer1 = lines[i].split(' ').slice(2).join(' ').trim();
            }
            if (lines[i].startsWith('#player2')) {
              extractedPlayer2 = lines[i].split(' ').slice(2).join(' ').trim();
            }
          }
          const parsedMoves = parseGCG(rawGCG);
          setGameData(parsedMoves);
          const initialBoard = JSON.parse(origBoard);
          setBoardCoords(initialBoard);
          setBoardState(initialBoard.map(row => row.map(Number)));
          if (extractedPlayer1 && extractedPlayer2) {
            setPlayer1Name(extractedPlayer1);
            setPlayer2Name(extractedPlayer2);
          } else {
            setPlayer1Name(parsedMoves && parsedMoves.length > 0 ? parsedMoves[0].player : 'Player 1');
            setPlayer2Name(parsedMoves && parsedMoves.length > 1 ? parsedMoves[1].player : 'Player 2');
          }
        }
      } catch (error) {
        console.error('Failed to load game:', error);
        setGameData([]);
        setPlayer1Name('Player 1');
        setPlayer2Name('Player 2');
        setBoardCoords(JSON.parse(origBoard));
        setBoardState(JSON.parse(origBoard).map(row => row.map(Number)));
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gameId]); // Add gameId as dependency

  // Update board when move changes - exactly like viewer
  useEffect(() => {
    if (gameData && gameData.length > 0 && sceneRef.current) {
      updateScoreboard(); // Update amazing scoreboard with current game state
      updateScoresheet(); // Update scoresheet with current game state
      createPlayerNames(); // Create player names with current game data
      setNeedsRender(true); // Trigger render after board update
      
      // Update shadows when board changes significantly
      if (rendererRef.current && rendererRef.current.shadowMap) {
        rendererRef.current.shadowMap.needsUpdate = true;
      }
    }
  }, [currentMoveIndex, gameData]); // Remove boardCoords dependency

  // Watch for boardCoords changes and update 3D tiles
  useEffect(() => {
    if (boardCoords.length > 0 && sceneRef.current) {
      update3DTilesFromBoardCoords();
    }
  }, [boardCoords]);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && gameData && currentMoveIndex < gameData.length - 1) {
      const timer = setTimeout(() => {
        handleNextMove(); // Use the same logic as manual forward
      }, playbackSpeed);
      return () => clearTimeout(timer);
    } else if (isPlaying && currentMoveIndex >= gameData?.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentMoveIndex, gameData, playbackSpeed]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Clear all tiles and their resources
      tiles.forEach(tile => {
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
      
      // Cleanup preloaded resources
      cleanupPreloadedResources();
    };
  }, [tiles]);

  const createMagicalEnvironment = (scene) => {
    // Wood-plank floor + hunter-green rug (shared with 3D Play)
    createFloorAndRug(scene, resourcesRef);

    // Walls and pillars removed for open-air feel

    // Create grounded lamps around the room
    const lamps = [];

    ENVIRONMENT.LAMP_POSITIONS.forEach(pos => {
      // Lamp base
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
      base.receiveShadow = true;
      scene.add(base);
      resourcesRef.current.geometries.push(baseGeometry);
      resourcesRef.current.materials.push(baseMaterial);
      resourcesRef.current.meshes.push(base);

      // Lamp pole
      const poleGeometry = new THREE.CylinderGeometry(LIGHTS.LAMP.POLE_RADIUS, LIGHTS.LAMP.POLE_RADIUS, LIGHTS.LAMP.POLE_HEIGHT, 8);
      const poleMaterial = new THREE.MeshPhongMaterial({ 
        color: MATERIALS.LAMP_POLE.COLOR,
        transparent: true,
        opacity: MATERIALS.LAMP_POLE.OPACITY,
        shininess: MATERIALS.LAMP_POLE.SHININESS
      });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(pos[0], -0.15, pos[2]);
      pole.castShadow = true;
      pole.receiveShadow = true;
      scene.add(pole);
      resourcesRef.current.geometries.push(poleGeometry);
      resourcesRef.current.materials.push(poleMaterial);
      resourcesRef.current.meshes.push(pole);

      // Lamp shade
      const shadeGeometry = new THREE.CylinderGeometry(LIGHTS.LAMP.SHADE_RADIUS_TOP, LIGHTS.LAMP.SHADE_RADIUS_BOTTOM, LIGHTS.LAMP.SHADE_HEIGHT, 8);
      const shadeMaterial = new THREE.MeshPhongMaterial({ 
        color: MATERIALS.LAMP_SHADE.COLOR,
        transparent: true,
        opacity: MATERIALS.LAMP_SHADE.OPACITY,
        shininess: MATERIALS.LAMP_SHADE.SHININESS
      });
      const shade = new THREE.Mesh(shadeGeometry, shadeMaterial);
      shade.position.set(pos[0], 1.1, pos[2]);
      shade.castShadow = true;
      shade.receiveShadow = true;
      scene.add(shade);
      resourcesRef.current.geometries.push(shadeGeometry);
      resourcesRef.current.materials.push(shadeMaterial);
      resourcesRef.current.meshes.push(shade);

      // Lamp light bulb
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
      bulb.castShadow = true;
      scene.add(bulb);
      resourcesRef.current.geometries.push(bulbGeometry);
      resourcesRef.current.materials.push(bulbMaterial);
      resourcesRef.current.meshes.push(bulb);

      // Add lamp light
      const lampLight = new THREE.PointLight(LIGHTS.LAMP.COLOR, LIGHTS.LAMP.INTENSITY, LIGHTS.LAMP.DISTANCE);
      lampLight.position.set(pos[0], 1.1, pos[2]);
      scene.add(lampLight);
      resourcesRef.current.lights.push(lampLight);

      lamps.push(bulb);
    });

    // Store lamps for animation
    sceneRef.current.lamps = lamps;
  };

  const createNameTexture = (playerName, isFlipped = false) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size with high DPI for crisp text
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 512 * dpr;
    canvas.height = 128 * dpr;
    canvas.style.width = '512px';
    canvas.style.height = '128px';
    
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, 512, 128);
    
    // Create engraved effect - white text
    ctx.fillStyle = '#FFFFFF'; // White text
    ctx.font = 'bold 64px Arial'; // Larger font for visibility
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    // Draw the main text
    ctx.fillText(playerName, 256, 64);
    
    // Add highlight for 3D effect
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#F0F0F0'; // Slightly off-white for highlight
    ctx.fillText(playerName, 253, 61);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    
    return texture;
  };

  const createTableAndChairs = (scene) => {
    // Table with honey-oak top + legs (shared with 3D Play)
    createTableSurface(scene, resourcesRef);

    // Create 3D racks for both players
    createPlayerRacks(scene);

    // Create amazing scoreboard on the table
    createAmazingScoreboard(scene);

    // Create scoresheet on the table
    createScoresheet(scene);

    // Tufted leather club chairs (shared with 3D Play)
    createChairs(scene, resourcesRef);

    // Viewer-only: remember futon positions for the player name plaques
    // that sit on top of each chair (createPlayerNames, below)
    sceneRef.current.futonPositions = FUTON.POSITIONS.map((pos, index) => ({
      x: pos.x,
      z: pos.z,
      rotation: pos.rotation,
      index
    }));
  };

  const update3DTilesFromBoardCoords = () => {
    if (!sceneRef.current) return;

    console.log('Updating 3D tiles from boardCoords:', boardCoords);

    // Clear existing tiles and dispose their resources
    tiles.forEach(tile => {
      // Remove from scene
      sceneRef.current.remove(tile);
      
      // Dispose tile resources
      if (tile.geometry) {
        tile.geometry.dispose();
      }
      if (tile.material) {
        if (tile.material.map) tile.material.map.dispose();
        tile.material.dispose();
      }
      
      // Dispose child meshes (letter textures)
      tile.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
    });
    setTiles([]);

    // Create new 3D tiles from the updated boardCoords
    const newTiles = [];
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        const cellValue = boardCoords[row][col];
        if (typeof cellValue === 'string' && cellValue.length === 1) {
          // This is a letter tile
          const tile = createTile(cellValue, row, col, 'Unknown', 0);
          newTiles.push(tile);
          sceneRef.current.add(tile);
          resourcesRef.current.meshes.push(tile);
        }
      }
    }
    setTiles(newTiles);
  };

  const updateRackTilesForMove = (moveIndex) => {
    if (!gameData || moveIndex < 0) return;

        // Get actual rack from parsed moves (after the move was made)
        const actualRack = createRack(moveIndex + 1, gameData);
        
        if (actualRack && actualRack.length > 0) {
          // Determine which player is currently active (next to play)
          // Josh = player 1 (bottom), Noah = player 2 (top)
      const currentMove = gameData[moveIndex];
      const nextPlayer = currentMove && currentMove.player === 'Josh' ? 2 : 1;
          
          // Clear both racks first
          updateRackTiles(1, []);
          updateRackTiles(2, []);
          
          // Show rack for the player whose turn it is
          updateRackTiles(nextPlayer, actualRack);
    } else {
      // Clear both racks if no rack available
      updateRackTiles(1, []);
      updateRackTiles(2, []);
    }
  };

  const updateBoardToMove = (moveIndex) => {
    if (!gameData) return;
    
    console.log(`Updating to move ${moveIndex}, previous was ${previousMoveIndex}, total moves: ${gameData.length}`);

    // Determine if we're going forward or backward
    const isGoingForward = moveIndex > previousMoveIndex;
    const isGoingBackward = moveIndex < previousMoveIndex;
    
    if (isGoingBackward) {
      // Going backward - we need to handle removal properly
      console.log('Going backward - handling removal');

      // Reset board to initial state
      setBoardCoords(JSON.parse(origBoard));
      setPlayer1points(0);
      setPlayer2points(0);
      setPointsScored(0);
      
      // Apply moves up to the target move index
      for (let i = 0; i <= moveIndex; i++) {
        handleMoveWrapper(i - 2, i - 1, i, i + 1, "next");
      }
      } else {
      // Going forward - apply moves from current position to target
      console.log('Going forward - applying moves');
      
      for (let i = previousMoveIndex + 1; i <= moveIndex; i++) {
        handleMoveWrapper(i - 2, i - 1, i, i + 1, "next");
      }
    }

    // Update previous move index
    setPreviousMoveIndex(moveIndex);

    // Update rack tiles for both players
    updateRackTilesForMove(moveIndex);
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
    // Warm walnut wood-grain texture, matching the board's look
    const woodCanvas = document.createElement('canvas');
    woodCanvas.width = 512;
    woodCanvas.height = 128;
    const woodCtx = woodCanvas.getContext('2d');
    const woodGradient = woodCtx.createLinearGradient(0, 0, 0, woodCanvas.height);
    woodGradient.addColorStop(0, '#8a5a34');
    woodGradient.addColorStop(0.5, '#6b4226');
    woodGradient.addColorStop(1, '#4a2f1a');
    woodCtx.fillStyle = woodGradient;
    woodCtx.fillRect(0, 0, woodCanvas.width, woodCanvas.height);
    woodCtx.globalCompositeOperation = 'overlay';
    for (let i = 0; i < 50; i++) {
      const y = Math.random() * woodCanvas.height;
      woodCtx.strokeStyle = Math.random() > 0.5 ? 'rgba(255, 220, 180, 0.12)' : 'rgba(30, 15, 5, 0.18)';
      woodCtx.lineWidth = 0.6 + Math.random() * 1.4;
      woodCtx.beginPath();
      woodCtx.moveTo(0, y);
      for (let x = 0; x <= woodCanvas.width; x += 24) {
        const yy = y + Math.sin(x * 0.03 + i) * 3 + (Math.random() - 0.5) * 2;
        woodCtx.lineTo(x, yy);
      }
      woodCtx.stroke();
    }
    woodCtx.globalCompositeOperation = 'source-over';
    const woodTexture = new THREE.CanvasTexture(woodCanvas);
    woodTexture.wrapS = THREE.RepeatWrapping;
    woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(2, 1);
    woodTexture.needsUpdate = true;

    const rackMaterial = new THREE.MeshPhongMaterial({
      map: woodTexture,
      transparent: true,
      opacity: RACK.MATERIAL.OPACITY,
      shininess: 70
    });

    // Brass cap along the back wall's top edge, matching the board's gold coordinate lettering
    const brassMaterial = new THREE.MeshPhongMaterial({
      color: 0xd97706,
      emissive: 0x92400e,
      emissiveIntensity: 0.15,
      shininess: 120
    });

    const trimHeight = 0.08;

    const buildRack = (pos, slantSign) => {
      const baseGeometry = new RoundedBoxGeometry(RACK.BASE.WIDTH, RACK.BASE.HEIGHT, RACK.BASE.DEPTH, 3, 0.03);
      const base = new THREE.Mesh(baseGeometry, rackMaterial);
      base.position.set(pos.x, pos.y, pos.z);
      base.rotation.x = slantSign * RACK.SLANT_ANGLE;
      base.castShadow = true;
      base.receiveShadow = true;
      scene.add(base);
      resourcesRef.current.geometries.push(baseGeometry);
      resourcesRef.current.meshes.push(base);

      const backGeometry = new RoundedBoxGeometry(RACK.BACK.WIDTH, RACK.BACK.HEIGHT, RACK.BACK.DEPTH, 3, 0.03);
      const back = new THREE.Mesh(backGeometry, rackMaterial);
      back.position.set(pos.x, pos.backY, pos.backZ);
      back.rotation.x = slantSign * RACK.SLANT_ANGLE;
      back.castShadow = true;
      back.receiveShadow = true;
      scene.add(back);
      resourcesRef.current.geometries.push(backGeometry);
      resourcesRef.current.meshes.push(back);

      // Child of the back wall, so it automatically inherits its tilt correctly
      const trimGeometry = new THREE.BoxGeometry(RACK.BACK.WIDTH - 0.1, trimHeight, RACK.BACK.DEPTH + 0.03);
      const trim = new THREE.Mesh(trimGeometry, brassMaterial);
      trim.position.set(0, RACK.BACK.HEIGHT / 2 + trimHeight / 2, 0);
      back.add(trim);
      resourcesRef.current.geometries.push(trimGeometry);
      resourcesRef.current.meshes.push(trim);
    };

    // Player 1 rack (bottom of board)
    buildRack(RACK.POSITIONS.PLAYER1, 1);

    // Player 2 rack (top of board, opposite slant direction)
    buildRack(RACK.POSITIONS.PLAYER2, -1);

    resourcesRef.current.materials.push(rackMaterial, brassMaterial);
    resourcesRef.current.textures.push(woodTexture);
  };

  const createAmazingScoreboard = (scene) => {
    // Standing brass trophy plaque (shared with 3D Play)
    sceneRef.current.scoreboard = createBrassStandingConsole(scene, resourcesRef, { x: 12, z: -12 });
  };

  // Function to update scoresheet with current game data
  const createPlayerNames = () => {
    if (!sceneRef.current || !sceneRef.current.futonPositions || !gameData) return;
    
    console.log('Creating player names, cleaning up old ones...'); // Debug log
    
    // Remove existing name planes - improved cleanup
    const childrenToRemove = [];
    sceneRef.current.children.forEach(child => {
      if (child.userData && child.userData.isNamePlane) {
        childrenToRemove.push(child);
      }
    });
    
    // Remove and dispose of old name planes
    childrenToRemove.forEach(child => {
      sceneRef.current.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (Array.isArray(child.material)) {
        // Handle materials array
        child.material.forEach(mat => {
          if (mat.map) mat.map.dispose();
          mat.dispose();
        });
      } else if (child.material) {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    });
    
    console.log(`Removed ${childrenToRemove.length} old name planes`); // Debug log
    
    // Extract player names from game data
    const player1Name = gameData && gameData.length > 0 ? gameData[0].player : 'Player 1';
    const player2Name = gameData && gameData.length > 1 ? gameData[1].player : 'Player 2';
    
    console.log(`Creating player names: ${player1Name} and ${player2Name}`); // Debug log
    
    // Create name planes for each futon - same logic for both
    sceneRef.current.futonPositions.forEach(futon => {
      const playerName = futon.index === 0 ? player1Name : player2Name;
      const nameTexture = createNameTexture(playerName, false); // Always use same rotation
      const nameGeometry = new THREE.BoxGeometry(3.5, 0.8, 0.3); // Much thicker box
      
      // Create a material with the texture only on the front face
      const materials = [
        new THREE.MeshBasicMaterial({ color: 0x2a4a6b }), // Right face - solid color
        new THREE.MeshBasicMaterial({ color: 0x2a4a6b }), // Left face - solid color
        new THREE.MeshBasicMaterial({ color: 0x2a4a6b }), // Top face - solid color
        new THREE.MeshBasicMaterial({ color: 0x2a4a6b }), // Bottom face - solid color
        new THREE.MeshBasicMaterial({ map: nameTexture, transparent: true, alphaTest: 0.1 }), // Front face - with text
        new THREE.MeshBasicMaterial({ color: 0x2a4a6b })  // Back face - solid color
      ];
      const namePlane = new THREE.Mesh(nameGeometry, materials);
      
      // Position the name on the chair base
      const nameY = FUTON.FRAME.Y_POSITION + 1.2; // Even higher above the frame
      const nameZ = futon.z + (futon.rotation === 0 ? -FUTON.FRAME.DEPTH/2 + 4.5 : FUTON.FRAME.DEPTH/2 - 4.5); // Front of chair
      namePlane.position.set(futon.x, nameY, nameZ);
      
      // Rotate the name to lay flat on the chair base - same for both
      namePlane.rotation.x = -Math.PI / 2; // Lay flat (rotate 90 degrees)
      namePlane.rotation.y = 0; // Always face the same direction
      
      // Add metadata for identification
      namePlane.userData = {
        isNamePlane: true,
        playerName: playerName,
        isFlipped: false, // Always false
        playerIndex: futon.index
      };
      
      sceneRef.current.add(namePlane);
      resourcesRef.current.geometries.push(nameGeometry);
      resourcesRef.current.materials.push(...materials); // Spread the materials array
      resourcesRef.current.meshes.push(namePlane);
    });
  };

  const updateNameTextures = () => {
    // Find and update name textures if they exist
    if (sceneRef.current && sceneRef.current.children) {
      sceneRef.current.children.forEach(child => {
        if (child.userData && child.userData.isNamePlane) {
          const playerName = child.userData.playerName;
          const isFlipped = child.userData.isFlipped;
          const newTexture = createNameTexture(playerName, isFlipped);
          child.material.map = newTexture;
          child.material.needsUpdate = true;
        }
      });
    }
  };

    const createScoresheet = (scene) => {
      // Aged parchment scoresheet (shared with 3D Play)
      sceneRef.current.scoresheet = createScoresheetBase(scene, resourcesRef);

      const player1Name = gameData && gameData.length > 0 ? gameData[0].player : 'Player 1';
      const player2Name = gameData && gameData.length > 1 ? gameData[1].player : 'Player 2';
      let player1Total = 0;
      let player2Total = 0;
      const moves = gameData || [];
      moves.forEach((move) => {
        if (move.player === player1Name) player1Total += move.score || 0;
        else player2Total += move.score || 0;
      });

      paintScoresheet(sceneRef.current.scoresheet.context, {
        p1Name: player1Name,
        p2Name: player2Name,
        moves,
        p1Total: player1Total,
        p2Total: player2Total
      });
      sceneRef.current.scoresheet.scores.material.map.needsUpdate = true;
    };

  const updateScoresheet = () => {
    const sheet = sceneRef.current.scoresheet;
    if (!sheet || !sheet.context || !gameData || gameData.length === 0) return;

    const player1Name = gameData[0].player;
    const player2Name = gameData.length > 1 ? gameData[1].player : 'Player 2';

    // Track the latest cumulative total for each player from the move data
    // (gameData moves carry a precomputed running `total`, unlike Play's
    // live store which only has per-move `score` and needs to sum it)
    let player1LatestTotal = 0;
    let player2LatestTotal = 0;
    const visibleMoves = gameData.slice(0, currentMoveIndex + 1);
    visibleMoves.forEach((move) => {
      const total = move.total || 0;
      if (move.player === player1Name) {
        player1LatestTotal = total;
      } else {
        player2LatestTotal = total;
      }
    });

    paintScoresheet(sheet.context, {
      p1Name: player1Name,
      p2Name: player2Name,
      moves: visibleMoves,
      p1Total: player1LatestTotal,
      p2Total: player2LatestTotal
    });
    sheet.scores.material.map.needsUpdate = true;
  };

  const updateScoreboard = () => {
    const board = sceneRef.current.scoreboard;
    if (!board || !board.context) return;

    const player1Name = gameData && gameData.length > 0 ? gameData[0].player : 'Player 1';
    const player2Name = gameData && gameData.length > 1 ? gameData[1].player : 'Player 2';

    let player1Score = 0;
    let player2Score = 0;
    if (gameData && gameData.length > 0) {
      gameData.slice(0, currentMoveIndex + 1).forEach(move => {
        const score = move.score || 0;
        if (move.player === player1Name) {
          player1Score += score;
        } else {
          player2Score += score;
        }
      });
    }

    paintScoreboardConsole(board.context, board.drawW, board.drawH, {
      p1Name: player1Name,
      p2Name: player2Name,
      p1Score: player1Score,
      p2Score: player2Score,
      foxIcon: foxIconRef.current
    });
    board.texture.needsUpdate = true;
  };

  const createRackTile = (letter, position, player) => {
    // Create a smaller tile for the rack
    const tileGeometry = new THREE.BoxGeometry(TILE.RACK.WIDTH, TILE.RACK.HEIGHT, TILE.RACK.DEPTH);
    const tileMaterial = new THREE.MeshPhongMaterial({ 
      color: TILE.RACK.MATERIAL.COLOR,
      transparent: true,
      opacity: TILE.RACK.MATERIAL.OPACITY,
      shininess: TILE.RACK.MATERIAL.SHININESS
    });
    const tile = new THREE.Mesh(tileGeometry, tileMaterial);
    resourcesRef.current.geometries.push(tileGeometry);
    resourcesRef.current.materials.push(tileMaterial);
    resourcesRef.current.meshes.push(tile);
    
    // Position tile on rack
    const rackZ = player === 1 ? RACK.POSITIONS.PLAYER1.z : RACK.POSITIONS.PLAYER2.z;
    tile.position.set(position * TILE.RACK.SPACING - TILE.RACK.OFFSET, TILE.RACK.Y_POSITION, rackZ);
    tile.rotation.x = player === 1
      ? (3 * Math.PI) / 2 + RACK.SLANT_ANGLE
      : Math.PI / 2 - RACK.SLANT_ANGLE;
    tile.rotation.y = player === 1 ? Math.PI : 0; // Flip letters right-side up
    tile.castShadow = true;
    tile.receiveShadow = true;

    // Create embossed white letter texture (matches 3D Play)
    const displayLetter = letter === '?' ? '*' : letter;
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
    context.fillText(displayLetter, canvas.width / 2 + 2, canvas.height / 2 + 2);

    // Draw main letter (white)
    context.fillStyle = '#FFFFFF';
    context.fillText(displayLetter, canvas.width / 2, canvas.height / 2);

    // Draw highlight
    context.fillStyle = 'rgba(255, 255, 255, 0.35)';
    context.fillText(displayLetter, canvas.width / 2 - 1, canvas.height / 2 - 1);

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
    letterMesh.position.y = TILE.LETTER.Y_OFFSET;
    letterMesh.rotation.x = TILE.LETTER.ROTATION;
    tile.add(letterMesh);
    resourcesRef.current.geometries.push(letterGeometry);
    resourcesRef.current.materials.push(letterMaterial);
    resourcesRef.current.textures.push(texture);
    resourcesRef.current.meshes.push(letterMesh);

    letterMesh.renderOrder = 1;
    letterMaterial.depthTest = false;

    return tile;
  };

  const updateRackTiles = (player, rackLetters) => {
    // Clear existing rack tiles for this player
    const playerKey = player === 1 ? 'player1' : 'player2';
    rackTiles[playerKey].forEach(tile => {
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
    rackLetters.forEach((letter, index) => {
      const rackTile = createRackTile(letter, index, player);
      sceneRef.current.add(rackTile);
      newRackTiles.push(rackTile);
    });

    // Update state
    setRackTiles(prev => ({
      ...prev,
      [playerKey]: newRackTiles
    }));
  };

  const createTile = (letter, row, col, player, moveIndex) => {
    // Enhanced tile geometry
    const tileGeometry = new THREE.BoxGeometry(TILE.BOARD.WIDTH, TILE.BOARD.HEIGHT, TILE.BOARD.DEPTH);
    const tileMaterial = new THREE.MeshPhongMaterial({ 
      color: TILE.BOARD.MATERIAL.COLOR,
      transparent: true,
      opacity: TILE.BOARD.MATERIAL.OPACITY,
      shininess: TILE.BOARD.MATERIAL.SHININESS
    });
    const tile = new THREE.Mesh(tileGeometry, tileMaterial);
    resourcesRef.current.geometries.push(tileGeometry);
    resourcesRef.current.materials.push(tileMaterial);
    resourcesRef.current.meshes.push(tile);
    
    // Position tile on board
    const startX = -(BOARD.GRID.SIZE * BOARD.GRID.SQUARE_SIZE) / 2 + BOARD.GRID.SQUARE_SIZE / 2;
    const startZ = -(BOARD.GRID.SIZE * BOARD.GRID.SQUARE_SIZE) / 2 + BOARD.GRID.SQUARE_SIZE / 2;
    tile.position.set(
      startX + col * BOARD.GRID.SQUARE_SIZE,
      TILE.BOARD.Y_POSITION,
      startZ + row * BOARD.GRID.SQUARE_SIZE
    );
    tile.castShadow = true;
    tile.receiveShadow = true;

    // Blank tiles come through as a lowercase letter (GCG convention - see
    // gcgParser.js); gold+star styling matches 3D Play's blank rendering.
    const isBlank = typeof letter === 'string' && letter.length === 1 && letter !== letter.toUpperCase();
    attachTileLetter(tile, resourcesRef, letter.toUpperCase(), isBlank);

    tile.userData = { moveIndex, player, letter };

    return tile;
  };

  // Timeline controls
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextMove = () => {
    if (gameData && currentMoveIndex < gameData.length - 1) {
      const newIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newIndex);
      
      // Use "next" type like viewer
      handleMoveWrapper(
        newIndex - 2,
        newIndex - 1,
        newIndex,
        newIndex + 1,
        "next"
      );
      
      // Update rack tiles
      updateRackTilesForMove(newIndex);
    }
  };

  const handlePrevMove = () => {
    if (currentMoveIndex > 0) {
      const newIndex = currentMoveIndex - 1;
      setCurrentMoveIndex(newIndex);
      
      // Use "previous" type like viewer
      handleMoveWrapper(
        newIndex - 2,
        newIndex - 1,
        newIndex,
        newIndex + 1,
        "previous"
      );
      
      // Update rack tiles
      updateRackTilesForMove(newIndex);
    }
  };

  const handleReset = () => {
    setCurrentMoveIndex(-1); // Reset to -1 like viewer (empty board)
    setPreviousMoveIndex(-1);
    setIsPlaying(false);
    
    // Reset board to initial state
    setBoardCoords(JSON.parse(origBoard));
    setPlayer1points(0);
    setPlayer2points(0);
    setPointsScored(0);
    
    // Clear rack tiles
    updateRackTiles(1, []);
    updateRackTiles(2, []);
  };

  const resetCamera = () => {
    if (controlsRef.current) {
      // Reset to a better position for viewing the scoresheet
      const camera = controlsRef.current.object;
      camera.position.set(0, 30, 12); // Higher and more centered
      camera.lookAt(0, 0, 0);
      controlsRef.current.update();
      setNeedsRender(true);
    }
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
            <div className={styles.panelTitle}>
              3D Viewer • NWL20 • 
              {gameId && <span style={{ opacity: 0.7, marginLeft: '8px' }}>• Game {gameId}</span>}
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginTop: '4px',
              marginLeft: '8px'
            }}>
              <a href="/" style={{ color: '#60A5FA', textDecoration: 'none' }}>
                <House size={14} weight="regular" />
              </a>
              <a href="/viewer" style={{ color: '#34D399', textDecoration: 'none' }}>
                <Binoculars size={14} weight="regular" />
              </a>
            </div>
          </div>
          
          {/* Sample Game Message */}
          {!gameId && (
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              margin: '8px 0',
              fontSize: '12px',
              color: '#60A5FA',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>Sample game loaded. Pick a game from the Viewer!</span>
            </div>
          )}
          
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
                <button onClick={() => handleSpeedChange(GAME.PLAYBACK_SPEEDS.FAST)} className={styles.speedBtn}>Fast</button>
                <button onClick={() => handleSpeedChange(GAME.PLAYBACK_SPEEDS.NORMAL)} className={styles.speedBtn}>Normal</button>
                <button onClick={() => handleSpeedChange(GAME.PLAYBACK_SPEEDS.SLOW)} className={styles.speedBtn}>Slow</button>
              </div>
              <div className={styles.controlGroup}>
                <button onClick={resetCamera} className={styles.controlBtn}>
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