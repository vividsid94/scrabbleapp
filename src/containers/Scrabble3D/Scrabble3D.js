import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import styles from './Scrabble3D.module.css';

const Scrabble3D = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2c3e50);
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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

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

  const createBoard = (scene) => {
    // Board base
    const boardGeometry = new THREE.BoxGeometry(15, 0.5, 15);
    const boardMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8B4513,
      transparent: true,
      opacity: 0.9
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.receiveShadow = true;
    board.position.y = -0.25;
    scene.add(board);

    // Create grid of squares
    const squareSize = 1;
    const gridSize = 15;
    const startX = -(gridSize * squareSize) / 2 + squareSize / 2;
    const startZ = -(gridSize * squareSize) / 2 + squareSize / 2;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const squareGeometry = new THREE.BoxGeometry(squareSize * 0.9, 0.1, squareSize * 0.9);
        const squareMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xF5DEB3,
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

    // Add some sample 3D tiles
    const sampleTiles = [
      { letter: 'S', x: 0, z: 0, color: 0xDAA520 },
      { letter: 'C', x: 1, z: 0, color: 0xDAA520 },
      { letter: 'R', x: 2, z: 0, color: 0xDAA520 },
      { letter: 'A', x: 3, z: 0, color: 0xDAA520 },
      { letter: 'B', x: 4, z: 0, color: 0xDAA520 },
      { letter: 'B', x: 5, z: 0, color: 0xDAA520 },
      { letter: 'L', x: 6, z: 0, color: 0xDAA520 },
      { letter: 'E', x: 7, z: 0, color: 0xDAA520 },
    ];

    sampleTiles.forEach((tile, index) => {
      createTile(scene, tile.letter, tile.x, tile.z, tile.color, index);
    });
  };

  const createTile = (scene, letter, x, z, color, index) => {
    // Tile geometry
    const tileGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);
    const tileMaterial = new THREE.MeshPhongMaterial({ 
      color: color,
      transparent: true,
      opacity: 0.9
    });
    const tile = new THREE.Mesh(tileGeometry, tileMaterial);
    
    // Position tile on board
    const startX = -(15 * 1) / 2 + 1 / 2;
    const startZ = -(15 * 1) / 2 + 1 / 2;
    tile.position.set(
      startX + x * 1,
      0.25,
      startZ + z * 1
    );
    tile.castShadow = true;
    tile.receiveShadow = true;

    // Add extruded letter text (3D letters carved into tile)
    
    // Create 3D text geometry
    const textGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.4);
    const textMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2C1810, // Dark brown for carved letters
      transparent: true,
      opacity: 0.9
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.y = 0.05; // Slightly above tile surface
    
    // Add letter texture on top
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;
    
    // Create embossed effect
    context.fillStyle = '#2C1810'; // Dark brown background
    context.fillRect(0, 0, 128, 128);
    
    // Add shadow for embossed look
    context.fillStyle = '#1A0F08';
    context.font = 'bold 80px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter, 66, 66);
    
    // Add main letter
    context.fillStyle = '#8B4513'; // Wooden color
    context.font = 'bold 80px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const letterGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    const letterMaterial = new THREE.MeshBasicMaterial({ 
      map: texture,
      transparent: true,
      alphaTest: 0.1
    });
    const letterMesh = new THREE.Mesh(letterGeometry, letterMaterial);
    letterMesh.position.y = 0.11; // On top of the 3D text block
    letterMesh.rotation.x = -Math.PI / 2; // Rotate to lay flat on tile surface
    textMesh.add(letterMesh);
    
    tile.add(textMesh);

    scene.add(tile);

    // Add hover effect
    tile.userData = { originalColor: color, letter: letter };
    
    // Add click handler
    tile.userData.onClick = () => {
      console.log(`Clicked tile: ${letter}`);
      // Add bounce animation
      const originalY = tile.position.y;
      const bounceHeight = 0.5;
      const duration = 500; // ms
      const startTime = Date.now();
      
      const bounce = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
          const bounceY = originalY + bounceHeight * Math.sin(progress * Math.PI);
          tile.position.y = bounceY;
          requestAnimationFrame(bounce);
        } else {
          tile.position.y = originalY;
        }
      };
      bounce();
    };
  };

  // Add click handler
  useEffect(() => {
    if (!isLoaded) return;

    const handleClick = (event) => {
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, rendererRef.current.camera);

      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
      
      if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.userData.onClick) {
          object.userData.onClick();
        }
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [isLoaded]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎮 3D Scrabble Board</h1>
        <p>Click tiles to see them bounce! Use mouse to rotate and zoom.</p>
      </div>
      <div ref={mountRef} className={styles.canvas} />
      <div className={styles.controls}>
        <button onClick={() => controlsRef.current?.reset()}>
          Reset View
        </button>
      </div>
    </div>
  );
};

export default Scrabble3D; 