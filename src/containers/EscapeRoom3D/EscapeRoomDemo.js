import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { House } from '@phosphor-icons/react';
import styles from './EscapeRoomDemo.module.css';
import {
  buildRoom,
  buildChest,
  buildMascotSprite,
  buildClueTablet,
  unlockChest,
  spawnBurst,
} from './escapeRoom3DScene';
import BingoForge from './BingoForge';

const MOVE_SPEED = 0.12;
const ROOM_HALF_EXTENT = 8.5;
const MOVE_KEYS = {
  w: [0, -1], arrowup: [0, -1],
  s: [0, 1], arrowdown: [0, 1],
  a: [-1, 0], arrowleft: [-1, 0],
  d: [1, 0], arrowright: [1, 0],
};

/**
 * Proof-of-concept only — validates the "3D room + real mascot + existing
 * puzzle component + physical lock that reacts to solving it" idea before
 * committing to a full revamp of the live EscapeRoom (see EscapeRoom.js).
 * Follows Scrabble3D.js's imperative-Three.js pattern rather than
 * @react-three/fiber so it matches the only 3D code already proven out in
 * this app. Tess is keyboard-controlled (WASD/arrows); the chest's unlock
 * reaction is a particle burst + light flash instead of a plain color swap;
 * a canvas-textured riddle tablet is the room's one atmospheric "clue"
 * element beyond the puzzle-and-lock loop itself.
 */
const EscapeRoomDemo = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const chestRef = useRef(null);
  const mascotRef = useRef(null);
  const tabletRef = useRef(null);
  const particlesRef = useRef([]);
  const keysRef = useRef(new Set());
  const solvedRef = useRef(false);
  const [solved, setSolved] = useState(false);

  const resourcesRef = useRef({
    geometries: [],
    materials: [],
    textures: [],
    meshes: [],
    lights: [],
    controls: null,
    animationId: null,
  });

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1330);
    scene.fog = new THREE.Fog(0x1a1330, 12, 26);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 4, 9);
    camera.lookAt(0, 1, -4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 5;
    controls.maxDistance = 14;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2.3;
    controls.target.set(0, 1, -4);
    resourcesRef.current.controls = controls;

    const ambient = new THREE.AmbientLight(0x8877bb, 0.5);
    scene.add(ambient);
    resourcesRef.current.lights.push(ambient);

    const torch = new THREE.PointLight(0xffb066, 1.4, 14);
    torch.position.set(3, 4, 2);
    scene.add(torch);
    resourcesRef.current.lights.push(torch);

    const torch2 = new THREE.PointLight(0x8877ff, 1, 14);
    torch2.position.set(-3, 4, -1);
    scene.add(torch2);
    resourcesRef.current.lights.push(torch2);

    buildRoom(scene, resourcesRef);
    chestRef.current = buildChest(scene, resourcesRef);
    mascotRef.current = buildMascotSprite(scene, resourcesRef, '/images/tessmascot.png');
    tabletRef.current = buildClueTablet(scene, resourcesRef);

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (MOVE_KEYS[key]) {
        e.preventDefault();
        keysRef.current.add(key);
      }
    };
    const handleKeyUp = (e) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let frame = 0;
    const animate = () => {
      resourcesRef.current.animationId = requestAnimationFrame(animate);
      frame += 1;
      controls.update();

      if (mascotRef.current) {
        let dx = 0;
        let dz = 0;
        keysRef.current.forEach((key) => {
          const [mx, mz] = MOVE_KEYS[key] || [0, 0];
          dx += mx;
          dz += mz;
        });
        if (dx !== 0 || dz !== 0) {
          const len = Math.hypot(dx, dz);
          mascotRef.current.position.x += (dx / len) * MOVE_SPEED;
          mascotRef.current.position.z += (dz / len) * MOVE_SPEED;
          mascotRef.current.position.x = THREE.MathUtils.clamp(mascotRef.current.position.x, -ROOM_HALF_EXTENT, ROOM_HALF_EXTENT);
          mascotRef.current.position.z = THREE.MathUtils.clamp(mascotRef.current.position.z, -ROOM_HALF_EXTENT, ROOM_HALF_EXTENT);
        }
        mascotRef.current.position.y = 1.4 + Math.sin(frame * 0.06) * 0.15;
      }

      if (tabletRef.current) {
        tabletRef.current.position.y = 2.2 + Math.sin(frame * 0.02) * 0.08;
      }

      if (chestRef.current && !solvedRef.current) {
        chestRef.current.lockMaterial.emissiveIntensity = 0.4 + Math.sin(frame * 0.08) * 0.3;
      }
      if (chestRef.current && solvedRef.current) {
        chestRef.current.lockLight.intensity += (1.0 - chestRef.current.lockLight.intensity) * 0.05;
      }

      if (particlesRef.current.length > 0) {
        particlesRef.current = particlesRef.current.filter((p) => {
          p.sprite.position.addScaledVector(p.velocity, 1);
          p.velocity.y -= 0.003;
          p.life -= 1;
          p.sprite.material.opacity = Math.max(p.life / p.maxLife, 0);
          if (p.life <= 0) {
            scene.remove(p.sprite);
            p.sprite.material.dispose();
            return false;
          }
          return true;
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(resourcesRef.current.animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      controls.dispose();
      resourcesRef.current.geometries.forEach((g) => g.dispose());
      resourcesRef.current.materials.forEach((m) => m.dispose());
      resourcesRef.current.textures.forEach((t) => t.dispose());
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const handleSolve = () => {
    solvedRef.current = true;
    setSolved(true);
    if (chestRef.current && sceneRef.current) {
      unlockChest(chestRef.current);
      chestRef.current.lockLight.intensity = 6;
      const origin = chestRef.current.body.getWorldPosition(new THREE.Vector3());
      origin.y += 0.9;
      particlesRef.current = spawnBurst(sceneRef.current, resourcesRef, origin);
    }
  };

  return (
    <div className={styles.container}>
      <div ref={mountRef} className={styles.canvas} />
      <a href="/" className={styles.homeLink}>
        <House size={18} weight="regular" />
      </a>
      {!solved && <div className={styles.hint}>WASD/arrows move Tess. Forge a bingo to open the chest.</div>}
      {solved && <div className={styles.solvedBanner}>Chest unlocked!</div>}
      {!solved && (
        <div className={styles.overlayPanel}>
          <BingoForge theme="emerald" onSolve={handleSolve} />
        </div>
      )}
    </div>
  );
};

export default EscapeRoomDemo;
