import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
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
import LatestMove from './components/LatestMove';
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

    // Create 3D board
    createBoard(scene);

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
        
        // Use gameId from URL if provided, otherwise use default
        const gameNum = gameId ? parseInt(gameId) : GAME.DEFAULT_GAME_ID;
        console.log('Loading game:', gameNum);
        
        const rawGCG = await getMoveSet('https://www.cross-tables.com/annotated/selfgcg/', gameNum);
        
        if (rawGCG) {
          const parsedMoves = parseGCG(rawGCG);
          console.log('Raw GCG:', rawGCG.substring(0, 500)); // Debug first 500 chars
          console.log('Parsed moves:', parsedMoves); // Debug parsed moves
          setGameData(parsedMoves);
          
          // Initialize board state exactly like viewer
          const initialBoard = JSON.parse(origBoard);
          setBoardCoords(initialBoard);
          setBoardState(initialBoard.map(row => row.map(Number)));
        }
      } catch (error) {
        console.error('Failed to load game:', error);
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
        setCurrentMoveIndex(prev => prev + 1);
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
    // Create stone floor
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

    // Create carpet on top of the floor
    const carpetGeometry = new THREE.PlaneGeometry(60, 45); // Much larger carpet
    const carpetMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8B0000, // Lighter red carpet color
      transparent: true,
      opacity: 1.0,
      shininess: 5
    });
    
    // Add carpet texture
    const carpetTexture = new THREE.CanvasTexture(createCarpetTexture());
    carpetMaterial.map = carpetTexture;
    const carpet = new THREE.Mesh(carpetGeometry, carpetMaterial);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.y = ENVIRONMENT.FLOOR.Y_POSITION + 0.05; // Higher above floor
    carpet.receiveShadow = true;
    scene.add(carpet);
    resourcesRef.current.geometries.push(carpetGeometry);
    resourcesRef.current.materials.push(carpetMaterial);
    resourcesRef.current.meshes.push(carpet);

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

  const createCarpetTexture = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    
    // Fill with base color
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(0, 0, size, size);
    
    // Create elegant carpet pattern
    ctx.strokeStyle = '#660000';
    ctx.lineWidth = 1;
    
    // Create subtle diagonal lines for texture
    for (let i = -size; i < size * 2; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.stroke();
    }
    
    // Add some subtle shading
    ctx.fillStyle = '#660000';
    ctx.globalAlpha = 0.3;
    for (let x = 0; x < size; x += 64) {
      for (let y = 0; y < size; y += 64) {
        ctx.beginPath();
        ctx.arc(x + 32, y + 32, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Reset alpha
    ctx.globalAlpha = 1.0;
    
    return canvas;
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
    // Create magical white table
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

    // Create 3D racks for both players
    createPlayerRacks(scene);

    // Create amazing scoreboard on the table
    createAmazingScoreboard(scene);
    
    // Create scoresheet on the table
    createScoresheet(scene);

    // Create table legs
    const legGeometry = new THREE.BoxGeometry(TABLE.LEG.WIDTH, TABLE.LEG.HEIGHT, TABLE.LEG.DEPTH);
    const legMaterial = new THREE.MeshPhongMaterial({ 
      color: TABLE.LEG.MATERIAL.COLOR,
      transparent: true,
      opacity: TABLE.LEG.MATERIAL.OPACITY,
      shininess: TABLE.LEG.MATERIAL.SHININESS
    });

    // Position legs at corners
    TABLE.LEG.POSITIONS.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(...pos);
      leg.castShadow = true;
      leg.receiveShadow = true;
      scene.add(leg);
      resourcesRef.current.meshes.push(leg);
    });
    
    resourcesRef.current.geometries.push(legGeometry);
    resourcesRef.current.materials.push(legMaterial);

    // Create two cozy futons
    FUTON.POSITIONS.forEach((pos, index) => {
      // Futon base/cushion
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
      cushion.receiveShadow = true;
      scene.add(cushion);
      resourcesRef.current.geometries.push(cushionGeometry);
      resourcesRef.current.materials.push(cushionMaterial);
      resourcesRef.current.meshes.push(cushion);

      // Futon back cushion (folded up)
      const backCushionGeometry = new THREE.BoxGeometry(FUTON.BACK_CUSHION.WIDTH, FUTON.BACK_CUSHION.HEIGHT, FUTON.BACK_CUSHION.DEPTH);
      const backCushionMaterial = new THREE.MeshPhongMaterial({ 
        color: FUTON.BACK_CUSHION.MATERIAL.COLOR,
        transparent: true,
        opacity: FUTON.BACK_CUSHION.MATERIAL.OPACITY,
        shininess: FUTON.BACK_CUSHION.MATERIAL.SHININESS
      });
      const backCushion = new THREE.Mesh(backCushionGeometry, backCushionMaterial);
      backCushion.position.set(pos.x, FUTON.BACK_CUSHION.Y_POSITION, pos.z + (pos.rotation === 0 ? -FUTON.BACK_CUSHION.Z_OFFSET : FUTON.BACK_CUSHION.Z_OFFSET));
      backCushion.castShadow = true;
      backCushion.receiveShadow = true;
      scene.add(backCushion);
      resourcesRef.current.geometries.push(backCushionGeometry);
      resourcesRef.current.materials.push(backCushionMaterial);
      resourcesRef.current.meshes.push(backCushion);

      // Store futon position for later name creation
      if (!sceneRef.current.futonPositions) {
        sceneRef.current.futonPositions = [];
      }
      sceneRef.current.futonPositions.push({
        x: pos.x,
        z: pos.z,
        rotation: pos.rotation,
        index: index
      });

      // Futon frame/legs (low profile)
      const frameGeometry = new THREE.BoxGeometry(FUTON.FRAME.WIDTH, FUTON.FRAME.HEIGHT, FUTON.FRAME.DEPTH);
      const frameMaterial = new THREE.MeshPhongMaterial({ 
        color: FUTON.FRAME.MATERIAL.COLOR,
        transparent: true,
        opacity: FUTON.FRAME.MATERIAL.OPACITY,
        shininess: FUTON.FRAME.MATERIAL.SHININESS
      });
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(pos.x, FUTON.FRAME.Y_POSITION, pos.z);
      frame.castShadow = true;
      frame.receiveShadow = true;
      scene.add(frame);
      resourcesRef.current.geometries.push(frameGeometry);
      resourcesRef.current.materials.push(frameMaterial);
      resourcesRef.current.meshes.push(frame);

      // Add some decorative pillows
      const pillowGeometry = new THREE.BoxGeometry(FUTON.PILLOW.WIDTH, FUTON.PILLOW.HEIGHT, FUTON.PILLOW.DEPTH);
      const pillowMaterial = new THREE.MeshPhongMaterial({ 
        color: FUTON.PILLOW.MATERIAL.COLOR,
        transparent: true,
        opacity: FUTON.PILLOW.MATERIAL.OPACITY,
        shininess: FUTON.PILLOW.MATERIAL.SHININESS
      });

      // Two pillows on each futon
      FUTON.PILLOW.POSITIONS.forEach(pillowPos => {
        const pillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
        pillow.position.set(pos.x + pillowPos.x, FUTON.PILLOW.Y_POSITION, pos.z + pillowPos.z);
        pillow.castShadow = true;
        pillow.receiveShadow = true;
        scene.add(pillow);
        resourcesRef.current.meshes.push(pillow);
      });
      
      resourcesRef.current.geometries.push(pillowGeometry);
      resourcesRef.current.materials.push(pillowMaterial);
    });
  };

  const createBoard = (scene) => {
    // Create circular board base (raised to create groove effect)
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

    // Create colored squares on the board surface
    const startX = -(BOARD.GRID.SIZE * BOARD.GRID.SQUARE_SIZE) / 2 + BOARD.GRID.SQUARE_SIZE / 2;
    const startZ = -(BOARD.GRID.SIZE * BOARD.GRID.SQUARE_SIZE) / 2 + BOARD.GRID.SQUARE_SIZE / 2;

    for (let row = 0; row < BOARD.GRID.SIZE; row++) {
      for (let col = 0; col < BOARD.GRID.SIZE; col++) {
        // Create colored square boxes on the board surface
        const squareGeometry = new THREE.BoxGeometry(
          BOARD.GRID.SQUARE_SIZE * BOARD.GRID.SQUARE_SCALE, 
          BOARD.GRID.SQUARE_HEIGHT, 
          BOARD.GRID.SQUARE_SIZE * BOARD.GRID.SQUARE_SCALE
        );
        
        // Get the actual board value from origBoard
        const boardValue = JSON.parse(origBoard)[row][col];
        
        // Different colors for different square types
        let squareColor = BOARD.SQUARE_COLORS.EMPTY; // Default white
        
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
        scene.add(square);
        resourcesRef.current.geometries.push(squareGeometry);
        resourcesRef.current.materials.push(squareMaterial);
        resourcesRef.current.meshes.push(square);
      }
    }

    // Create grid lines between squares
    const gridLineMaterial = new THREE.MeshPhongMaterial({ 
      color: BOARD.GRID.GRID_LINE.MATERIAL.COLOR,
      transparent: true,
      opacity: BOARD.GRID.GRID_LINE.MATERIAL.OPACITY,
      shininess: BOARD.GRID.GRID_LINE.MATERIAL.SHININESS
    });

    // Horizontal grid lines (full width)
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
      gridLine.castShadow = true;
      gridLine.receiveShadow = true;
      scene.add(gridLine);
      resourcesRef.current.geometries.push(gridLineGeometry);
      resourcesRef.current.materials.push(gridLineMaterial);
      resourcesRef.current.meshes.push(gridLine);
    }

    // Vertical grid lines (broken into segments to avoid corner intersections)
    for (let col = 0; col <= BOARD.GRID.SIZE; col++) {
      // Create 15 segments for each vertical line (one for each row gap)
      for (let row = 0; row < BOARD.GRID.SIZE; row++) {
        const gridLineGeometry = new THREE.BoxGeometry(
          BOARD.GRID.GRID_LINE.WIDTH, 
          BOARD.GRID.GRID_LINE.HEIGHT, 
          BOARD.GRID.SQUARE_SIZE - BOARD.GRID.GRID_LINE.WIDTH // Slightly shorter than square to create gaps
        );
        const gridLine = new THREE.Mesh(gridLineGeometry, gridLineMaterial);
        gridLine.position.set(
          startX + col * BOARD.GRID.SQUARE_SIZE - BOARD.GRID.SQUARE_SIZE / 2,
          BOARD.GRID.GRID_LINE.Y_POSITION,
          startZ + row * BOARD.GRID.SQUARE_SIZE
        );
        gridLine.castShadow = true;
        gridLine.receiveShadow = true;
        scene.add(gridLine);
        resourcesRef.current.geometries.push(gridLineGeometry);
        resourcesRef.current.materials.push(gridLineMaterial);
        resourcesRef.current.meshes.push(gridLine);
      }
    }
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
    const rackMaterial = new THREE.MeshPhongMaterial({ 
      color: RACK.MATERIAL.COLOR,
      transparent: true,
      opacity: RACK.MATERIAL.OPACITY,
      shininess: RACK.MATERIAL.SHININESS
    });

    // Create slanted rack for Player 1 (bottom of board)
    // Base of the rack (slanted)
    const rack1BaseGeometry = new THREE.BoxGeometry(RACK.BASE.WIDTH, RACK.BASE.HEIGHT, RACK.BASE.DEPTH);
    const rack1Base = new THREE.Mesh(rack1BaseGeometry, rackMaterial);
    rack1Base.position.set(RACK.POSITIONS.PLAYER1.x, RACK.POSITIONS.PLAYER1.y, RACK.POSITIONS.PLAYER1.z);
    rack1Base.rotation.x = RACK.SLANT_ANGLE;
    rack1Base.castShadow = true;
    rack1Base.receiveShadow = true;
    scene.add(rack1Base);
    resourcesRef.current.geometries.push(rack1BaseGeometry);
    resourcesRef.current.materials.push(rackMaterial);
    resourcesRef.current.meshes.push(rack1Base);

    // Back support of the rack (slanted)
    const rack1BackGeometry = new THREE.BoxGeometry(RACK.BACK.WIDTH, RACK.BACK.HEIGHT, RACK.BACK.DEPTH);
    const rack1Back = new THREE.Mesh(rack1BackGeometry, rackMaterial);
    rack1Back.position.set(RACK.POSITIONS.PLAYER1.x, RACK.POSITIONS.PLAYER1.backY, RACK.POSITIONS.PLAYER1.backZ);
    rack1Back.rotation.x = RACK.SLANT_ANGLE;
    rack1Back.castShadow = true;
    rack1Back.receiveShadow = true;
    scene.add(rack1Back);
    resourcesRef.current.geometries.push(rack1BackGeometry);
    resourcesRef.current.meshes.push(rack1Back);

    // Create slanted rack for Player 2 (top of board)
    // Base of the rack (slanted)
    const rack2BaseGeometry = new THREE.BoxGeometry(RACK.BASE.WIDTH, RACK.BASE.HEIGHT, RACK.BASE.DEPTH);
    const rack2Base = new THREE.Mesh(rack2BaseGeometry, rackMaterial);
    rack2Base.position.set(RACK.POSITIONS.PLAYER2.x, RACK.POSITIONS.PLAYER2.y, RACK.POSITIONS.PLAYER2.z);
    rack2Base.rotation.x = -RACK.SLANT_ANGLE; // -15 degree slant (opposite direction)
    rack2Base.castShadow = true;
    rack2Base.receiveShadow = true;
    scene.add(rack2Base);
    resourcesRef.current.geometries.push(rack2BaseGeometry);
    resourcesRef.current.meshes.push(rack2Base);

    // Back support of the rack (slanted)
    const rack2BackGeometry = new THREE.BoxGeometry(RACK.BACK.WIDTH, RACK.BACK.HEIGHT, RACK.BACK.DEPTH);
    const rack2Back = new THREE.Mesh(rack2BackGeometry, rackMaterial);
    rack2Back.position.set(RACK.POSITIONS.PLAYER2.x, RACK.POSITIONS.PLAYER2.backY, RACK.POSITIONS.PLAYER2.backZ);
    rack2Back.rotation.x = -RACK.SLANT_ANGLE; // -15 degree slant (opposite direction)
    rack2Back.castShadow = true;
    rack2Back.receiveShadow = true;
    scene.add(rack2Back);
    resourcesRef.current.geometries.push(rack2BackGeometry);
    resourcesRef.current.meshes.push(rack2Back);
  };

  const createAmazingScoreboard = (scene) => {
    // Create the main scoreboard base (raised platform)
    const baseGeometry = new THREE.BoxGeometry(8, 0.3, 6);
    const baseMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x1a1a2e, // Dark blue base
      transparent: true,
      opacity: 0.9,
      shininess: 100
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(18, 1.8, 0); // Moved further to the right side
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    resourcesRef.current.geometries.push(baseGeometry);
    resourcesRef.current.materials.push(baseMaterial);
    resourcesRef.current.meshes.push(base);

    // Create glowing border around the base
    const borderGeometry = new THREE.BoxGeometry(8.2, 0.1, 6.2);
    const borderMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x00ffff, // Cyan glow
      emissive: 0x00ffff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8
    });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.set(18, 1.95, 0);
    scene.add(border);
    resourcesRef.current.geometries.push(borderGeometry);
    resourcesRef.current.materials.push(borderMaterial);
    resourcesRef.current.meshes.push(border);

    // Create the main scoreboard display
    const displayGeometry = new THREE.BoxGeometry(7.5, 2, 5.5);
    const displayMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x0f0f23, // Very dark blue
      transparent: true,
      opacity: 0.95,
      shininess: 200
    });
    const display = new THREE.Mesh(displayGeometry, displayMaterial);
    display.position.set(18, 2.8, 0);
    display.castShadow = true;
    display.receiveShadow = true;
    scene.add(display);
    resourcesRef.current.geometries.push(displayGeometry);
    resourcesRef.current.materials.push(displayMaterial);
    resourcesRef.current.meshes.push(display);

    // Create glowing accent lines
    const accentGeometry = new THREE.BoxGeometry(7.6, 0.05, 5.6);
    const accentMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff6b6b, // Coral accent
      emissive: 0xff6b6b,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.9
    });
    const accent = new THREE.Mesh(accentGeometry, accentMaterial);
    accent.position.set(18, 3.85, 0);
    scene.add(accent);
    resourcesRef.current.geometries.push(accentGeometry);
    resourcesRef.current.materials.push(accentMaterial);
    resourcesRef.current.meshes.push(accent);

    // Create the digital display screen
    const screenGeometry = new THREE.PlaneGeometry(7, 1.8);
    const screenMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000,
      transparent: true,
      opacity: 0.9
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(18, 2.8, 2.76); // Front face of display
    scene.add(screen);
    resourcesRef.current.geometries.push(screenGeometry);
    resourcesRef.current.materials.push(screenMaterial);
    resourcesRef.current.meshes.push(screen);

    // Create the scoreboard texture with amazing design
    const createScoreboardTexture = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
    
    // High-DPI scaling for crisp text
    const scale = window.devicePixelRatio || 1;
      canvas.width = 700 * scale;
      canvas.height = 180 * scale;
      canvas.style.width = '700px';
      canvas.style.height = '180px';
      
      ctx.scale(scale, scale);
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, 180);
      gradient.addColorStop(0, '#0a0a1a');
      gradient.addColorStop(0.5, '#1a1a3a');
      gradient.addColorStop(1, '#0a0a1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 700, 180);
    
      // Add subtle grid pattern
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
      
      // Add glowing border effect
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, 696, 176);
      
      // Add inner border
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 1;
      ctx.strokeRect(6, 6, 688, 168);
    
      // Get player names and scores
      const player1Name = gameData && gameData.length > 0 ? gameData[0].player : 'Player 1';
      const player2Name = gameData && gameData.length > 1 ? gameData[1].player : 'Player 2';
      
      // Calculate current scores
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
      
      // Draw player 1 section (left side)
      ctx.fillStyle = '#4ecdc4';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player1Name, 175, 40);
      
      // Player 1 score with glow effect
      ctx.shadowColor = '#4ecdc4';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.fillText(player1Score.toString(), 175, 100);
      
      // Draw player 2 section (right side)
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(player2Name, 525, 40);
      
      // Player 2 score with glow effect
      ctx.shadowColor = '#ff6b6b';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.fillText(player2Score.toString(), 525, 100);
      
      // Draw center divider
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(350, 20);
      ctx.lineTo(350, 160);
      ctx.stroke();
      
      return canvas;
    };
    
    // Create and apply the texture
    const scoreboardCanvas = createScoreboardTexture();
    const scoreboardTexture = new THREE.CanvasTexture(scoreboardCanvas);
    const scoreboardDisplayGeometry = new THREE.PlaneGeometry(6.8, 1.6);
    const scoreboardDisplayMaterial = new THREE.MeshBasicMaterial({ 
      map: scoreboardTexture,
      transparent: true,
      alphaTest: 0.01
    });
    const scoreboardDisplay = new THREE.Mesh(scoreboardDisplayGeometry, scoreboardDisplayMaterial);
    scoreboardDisplay.position.set(18, 2.8, 2.78); // Slightly in front of screen
    scene.add(scoreboardDisplay);
    resourcesRef.current.geometries.push(scoreboardDisplayGeometry);
    resourcesRef.current.materials.push(scoreboardDisplayMaterial);
    resourcesRef.current.textures.push(scoreboardTexture);
    resourcesRef.current.meshes.push(scoreboardDisplay);

    // Store reference to scoreboard for updates
    sceneRef.current.scoreboard = {
      base: base,
      display: display,
      screen: screen,
      scoreboardDisplay: scoreboardDisplay,
      texture: scoreboardTexture
    };
        
    // Add pulsing light effect
    const pulseLight = new THREE.PointLight(0x00ffff, 0.5, 10);
    pulseLight.position.set(18, 3, 0);
    scene.add(pulseLight);
    resourcesRef.current.lights.push(pulseLight);

    // Store pulse light for animation
    sceneRef.current.pulseLight = pulseLight;
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
    // Create simple paper scoresheet
    const scoresheetGeometry = new THREE.PlaneGeometry(TABLE.SCORESHEET.WIDTH, TABLE.SCORESHEET.HEIGHT);
    const scoresheetMaterial = new THREE.MeshPhongMaterial({ 
      color: TABLE.SCORESHEET.MATERIAL.COLOR,
      transparent: true,
      opacity: TABLE.SCORESHEET.MATERIAL.OPACITY,
      shininess: TABLE.SCORESHEET.MATERIAL.SHININESS
    });
    const scoresheet = new THREE.Mesh(scoresheetGeometry, scoresheetMaterial);
    scoresheet.rotation.x = -Math.PI / 2; // Lay flat on table
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

    // Store reference to scoresheet for updates
    sceneRef.current.scoresheet = {
      base: scoresheet,
      scores: null // Will be set when texture is created
    };

    // Create scores text with high-DPI scaling
    const scoresCanvas = document.createElement('canvas');
    const scoresContext = scoresCanvas.getContext('2d');
    
    // High-DPI scaling for crisp text
    const scale = window.devicePixelRatio || 1;
    scoresCanvas.width = 360 * scale;
    scoresCanvas.height = 416 * scale;
    scoresCanvas.style.width = '360px';
    scoresCanvas.style.height = '416px';
    
    // Scale the context to match the device pixel ratio
    scoresContext.scale(scale, scale);
    
    // White background
    scoresContext.fillStyle = '#F5F5DC';
    scoresContext.fillRect(0, 0, 360, 416);
    
    // Draw grid lines
    scoresContext.strokeStyle = '#000000';
    scoresContext.lineWidth = 1;
    
    // Vertical lines for columns
    scoresContext.beginPath();
    scoresContext.moveTo(80, 0);
    scoresContext.lineTo(80, 416);
    scoresContext.moveTo(160, 0);
    scoresContext.lineTo(160, 416);
    scoresContext.moveTo(200, 0);
    scoresContext.lineTo(200, 416);
    scoresContext.moveTo(280, 0);
    scoresContext.lineTo(280, 416);
    scoresContext.moveTo(360, 0);
    scoresContext.lineTo(360, 416);
    scoresContext.stroke();
    
    // Horizontal lines for rows
    scoresContext.beginPath();
    for (let i = 0; i <= 21; i++) {
      scoresContext.moveTo(0, 20 + i * 18);
      scoresContext.lineTo(360, 20 + i * 18);
    }
    scoresContext.stroke();
    
    // Function to create and apply texture
    const createTexture = () => {
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
        TABLE.SCORESHEET.Y_POSITION + 0.01, // Slightly above paper
        TABLE.SCORESHEET.POSITION.z
      );
      scoresMesh.rotation.x = -Math.PI / 2;
      scene.add(scoresMesh);
      resourcesRef.current.geometries.push(scoresGeometry);
      resourcesRef.current.materials.push(scoresMaterial);
      resourcesRef.current.textures.push(scoresTexture);
      resourcesRef.current.meshes.push(scoresMesh);

      // Store reference to scoresheet for updates
      sceneRef.current.scoresheet = {
        base: scoresheet,
        scores: scoresMesh
      };
    };
    
    // Draw text with system fonts that actually work
    const drawText = () => {
      // Set text color and draw all text
      scoresContext.fillStyle = '#000000';
      scoresContext.font = 'bold 14px monospace';
      scoresContext.textAlign = 'center';
      scoresContext.textBaseline = 'middle';
      
      // Get player names from game data
      const player1Name = gameData && gameData.length > 0 ? gameData[0].player : 'Player 1';
      const player2Name = gameData && gameData.length > 1 ? gameData[1].player : 'Player 2';
      
      // Player name headers
      scoresContext.fillText(player1Name, 120, 10);
      scoresContext.fillText(player2Name, 320, 10);
      
      // Column headers
      scoresContext.fillText('Word(s)', 40, 29);   // Center of 0-80 column
      scoresContext.fillText('Score', 120, 29);         // Center of 80-160 column
      scoresContext.fillText('Turn', 180, 29);          // Center of 160-200 column
      scoresContext.fillText('Word(s)', 240, 29);  // Center of 200-280 column
      scoresContext.fillText('Score', 320, 29);         // Center of 280-360 column
      
      scoresContext.font = '12px monospace';
      for (let i = 1; i <= 20; i++) {
        scoresContext.fillText(i.toString(), 180, 29 + i * 18);  // Center of 160-200 column
      }
      scoresContext.fillText('+', 180, 29 + 21 * 18);  // Center of 160-200 column
      
      // Draw real game data
      if (gameData && gameData.length > 0) {
        scoresContext.textAlign = 'center';
        scoresContext.textBaseline = 'middle';
        
        // Calculate running totals
        let player1Total = 0;
        let player2Total = 0;
        
        gameData.forEach((move, index) => {
          if (index >= 20) return; // Only show first 20 moves
          
          const row = index + 1;
          const y = 29 + row * 18;
          const score = move.score || 0;
          const word = move.word || 'Pass';
          
          // Determine which player this move belongs to
          const isPlayer1 = move.player === player1Name;
          
          if (isPlayer1) {
            player1Total += score;
            scoresContext.fillText(word, 40, y);  // Player 1 word column
            scoresContext.fillText(`+${score}`, 120, y);  // Player 1 score column
          } else {
            player2Total += score;
            scoresContext.fillText(word, 240, y);  // Player 2 word column
            scoresContext.fillText(`+${score}`, 320, y);  // Player 2 score column
          }
        });
        
        // Draw totals in the last row
        const totalY = 29 + 21 * 18;
        scoresContext.fillText(player1Total.toString(), 120, totalY);
        scoresContext.fillText(player2Total.toString(), 320, totalY);
      }
      
      createTexture();
    };
    
    // Draw immediately with system fonts
    drawText();
  };

  const updateScoresheet = () => {
    if (sceneRef.current.scoresheet && sceneRef.current.scoresheet.scores) {
      // Recreate the texture with updated data
      const scoresCanvas = document.createElement('canvas');
      const scoresContext = scoresCanvas.getContext('2d');
      
      // High-DPI scaling for crisp text
      const scale = window.devicePixelRatio || 1;
      scoresCanvas.width = 360 * scale;
      scoresCanvas.height = 416 * scale;
      scoresCanvas.style.width = '360px';
      scoresCanvas.style.height = '416px';
      
      // Scale the context to match the device pixel ratio
      scoresContext.scale(scale, scale);
      
      // White background
      scoresContext.fillStyle = '#F5F5DC';
      scoresContext.fillRect(0, 0, 360, 416);
      
      // Draw grid lines
      scoresContext.strokeStyle = '#000000';
      scoresContext.lineWidth = 1;
      
      // Vertical lines for columns
      scoresContext.beginPath();
      scoresContext.moveTo(80, 0);
      scoresContext.lineTo(80, 416);
      scoresContext.moveTo(160, 0);
      scoresContext.lineTo(160, 416);
      scoresContext.moveTo(200, 0);
      scoresContext.lineTo(200, 416);
      scoresContext.moveTo(280, 0);
      scoresContext.lineTo(280, 416);
      scoresContext.moveTo(360, 0);
      scoresContext.lineTo(360, 416);
      scoresContext.stroke();
      
      // Horizontal lines for rows
      scoresContext.beginPath();
      for (let i = 0; i <= 21; i++) {
        scoresContext.moveTo(0, 20 + i * 18);
        scoresContext.lineTo(360, 20 + i * 18);
      }
      scoresContext.stroke();
      
      // Draw updated text
      const drawUpdatedText = () => {
        scoresContext.fillStyle = '#000000';
        scoresContext.font = 'bold 14px monospace';
        scoresContext.textAlign = 'center';
        scoresContext.textBaseline = 'middle';
        
        // Get player names from game data
        const player1Name = gameData && gameData.length > 0 ? gameData[0].player : 'Player 1';
        const player2Name = gameData && gameData.length > 1 ? gameData[1].player : 'Player 2';
        
        // Player name headers
        scoresContext.fillText(player1Name, 120, 10);
        scoresContext.fillText(player2Name, 320, 10);
        
        // Column headers
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
        
        // Draw real game data up to current move
        if (gameData && gameData.length > 0) {
          scoresContext.textAlign = 'center';
          scoresContext.textBaseline = 'middle';
          
          // Track the latest totals for each player
          let player1LatestTotal = 0;
          let player2LatestTotal = 0;
          
          gameData.slice(0, currentMoveIndex + 1).forEach((move, index) => {
            if (index >= 20) return; // Only show first 20 moves
            
            const row = index + 1;
            const y = 29 + row * 18;
            const score = move.score || 0;
            const total = move.total || 0;
            const word = move.word || 'Pass';
            
            // Determine which player this move belongs to
            const isPlayer1 = move.player === player1Name;
            
            if (isPlayer1) {
              player1LatestTotal = total; // Use the total from the move data
              scoresContext.fillText(word, 40, y);
              scoresContext.fillText(`+${score}`, 120, y);
            } else {
              player2LatestTotal = total; // Use the total from the move data
              scoresContext.fillText(word, 240, y);
              scoresContext.fillText(`+${score}`, 320, y);
            }
          });
          
          // Draw totals in the last row using the latest totals from move data
          const totalY = 29 + 21 * 18;
          scoresContext.fillText(player1LatestTotal.toString(), 120, totalY);
          scoresContext.fillText(player2LatestTotal.toString(), 320, totalY);
        }
      };
      
      drawUpdatedText();
      
      // Update the texture
      const newTexture = new THREE.CanvasTexture(scoresCanvas);
      sceneRef.current.scoresheet.scores.material.map = newTexture;
      sceneRef.current.scoresheet.scores.material.needsUpdate = true;
      
      // Clean up old texture
      if (sceneRef.current.scoresheet.scores.material.map) {
        sceneRef.current.scoresheet.scores.material.map.dispose();
      }
      sceneRef.current.scoresheet.scores.material.map = newTexture;
    }
  };

  const updateScoreboard = () => {
    if (sceneRef.current.scoreboard && sceneRef.current.scoreboard.scoreboardDisplay) {
      // Recreate the scoreboard texture with updated data
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // High-DPI scaling for crisp text
      const scale = window.devicePixelRatio || 1;
      canvas.width = 700 * scale;
      canvas.height = 180 * scale;
      canvas.style.width = '700px';
      canvas.style.height = '180px';
      
      ctx.scale(scale, scale);
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, 180);
      gradient.addColorStop(0, '#0a0a1a');
      gradient.addColorStop(0.5, '#1a1a3a');
      gradient.addColorStop(1, '#0a0a1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 700, 180);
      
      // Add subtle grid pattern
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
      
      // Add glowing border effect
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, 696, 176);
      
      // Add inner border
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 1;
      ctx.strokeRect(6, 6, 688, 168);
      
      // Get player names and scores
      const player1Name = gameData && gameData.length > 0 ? gameData[0].player : 'Player 1';
      const player2Name = gameData && gameData.length > 1 ? gameData[1].player : 'Player 2';
      
      // Calculate current scores
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
      
      // Draw player 1 section (left side)
      ctx.fillStyle = '#4ecdc4';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player1Name, 175, 40);
      
      // Player 1 score with glow effect
      ctx.shadowColor = '#4ecdc4';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.fillText(player1Score.toString(), 175, 100);
      
      // Draw player 2 section (right side)
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(player2Name, 525, 40);
      
      // Player 2 score with glow effect
      ctx.shadowColor = '#ff6b6b';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.fillText(player2Score.toString(), 525, 100);
      
      // Draw center divider
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(350, 20);
      ctx.lineTo(350, 160);
      ctx.stroke();
      
      // Remove VS, TURN, and Move __ labels
      // (No ctx.fillText for those)
      
      // Add decorative elements
      ctx.fillStyle = '#ffd93d';
      ctx.font = '12px Arial';
      
      // Update the texture
      const newTexture = new THREE.CanvasTexture(canvas);
      sceneRef.current.scoreboard.scoreboardDisplay.material.map = newTexture;
      sceneRef.current.scoreboard.scoreboardDisplay.material.needsUpdate = true;
      
      // Clean up old texture
      if (sceneRef.current.scoreboard.texture) {
        sceneRef.current.scoreboard.texture.dispose();
      }
      sceneRef.current.scoreboard.texture = newTexture;
    }
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

    // Create letter texture
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = TILE.LETTER.CANVAS_SIZE;
    canvas.height = TILE.LETTER.CANVAS_SIZE;
    
    context.clearRect(0, 0, TILE.LETTER.CANVAS_SIZE, TILE.LETTER.CANVAS_SIZE);
    
    // Add white letter
    context.fillStyle = TILE.LETTER.COLORS.LETTER;
    context.font = TILE.LETTER.FONT.RACK;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter, TILE.LETTER.CANVAS_SIZE/2, TILE.LETTER.CANVAS_SIZE/2);
    
    // Add point value
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

    // Create clean white lettering
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = TILE.LETTER.CANVAS_SIZE;
    canvas.height = TILE.LETTER.CANVAS_SIZE;
    
    context.clearRect(0, 0, TILE.LETTER.CANVAS_SIZE, TILE.LETTER.CANVAS_SIZE);
    
    // Add white fill for main letter
    context.fillStyle = TILE.LETTER.COLORS.LETTER;
    context.font = TILE.LETTER.FONT.BOARD;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter, TILE.LETTER.CANVAS_SIZE/2, TILE.LETTER.CANVAS_SIZE/2);
    
    // Add point value in bottom right
    const pointValue = POINT_VALUES[letter] || 0;
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
    resourcesRef.current.geometries.push(letterGeometry);
    resourcesRef.current.materials.push(letterMaterial);
    resourcesRef.current.textures.push(texture);
    resourcesRef.current.meshes.push(letterMesh);
    
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