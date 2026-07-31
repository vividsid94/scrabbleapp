/**
 * Vanilla-Three.js scene for the Escape Room 3D proof-of-concept — deliberately
 * mirrors Scrabble3D/scrabble3DScene.js's imperative style (plain THREE calls,
 * resourcesRef bookkeeping for disposal) rather than @react-three/fiber, since
 * that's the pattern already proven out in this codebase.
 */
import * as THREE from 'three';

const ROOM = { WIDTH: 20, DEPTH: 20, HEIGHT: 8 };
const CHEST = { WIDTH: 2.2, HEIGHT: 1.4, DEPTH: 1.4, Y: 0.7 };

function proceduralFloorTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#3a2a1a');
  grad.addColorStop(1, '#241a10');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'overlay';
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(255,220,180,0.08)' : 'rgba(20,10,5,0.15)';
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    const y = Math.random() * size;
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (Math.random() - 0.5) * 30);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

export function buildRoom(scene, resourcesRef) {
  const floorTexture = proceduralFloorTexture();
  const floorGeometry = new THREE.PlaneGeometry(ROOM.WIDTH, ROOM.DEPTH);
  const floorMaterial = new THREE.MeshPhongMaterial({ map: floorTexture, shininess: 15 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  resourcesRef.current.geometries.push(floorGeometry);
  resourcesRef.current.materials.push(floorMaterial);
  resourcesRef.current.textures.push(floorTexture);
  resourcesRef.current.meshes.push(floor);

  const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x2d2440, shininess: 5 });
  const wallGeometry = new THREE.PlaneGeometry(ROOM.WIDTH, ROOM.HEIGHT);
  const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
  backWall.position.set(0, ROOM.HEIGHT / 2, -ROOM.DEPTH / 2);
  scene.add(backWall);
  resourcesRef.current.meshes.push(backWall);

  const sideWallGeometry = new THREE.PlaneGeometry(ROOM.DEPTH, ROOM.HEIGHT);
  const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
  leftWall.position.set(-ROOM.WIDTH / 2, ROOM.HEIGHT / 2, 0);
  leftWall.rotation.y = Math.PI / 2;
  scene.add(leftWall);
  resourcesRef.current.meshes.push(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
  rightWall.position.set(ROOM.WIDTH / 2, ROOM.HEIGHT / 2, 0);
  rightWall.rotation.y = -Math.PI / 2;
  scene.add(rightWall);
  resourcesRef.current.meshes.push(rightWall);

  resourcesRef.current.geometries.push(wallGeometry, sideWallGeometry);
  resourcesRef.current.materials.push(wallMaterial);
}

export function buildChest(scene, resourcesRef) {
  const group = new THREE.Group();

  const bodyGeometry = new THREE.BoxGeometry(CHEST.WIDTH, CHEST.HEIGHT, CHEST.DEPTH);
  const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x4a2f1a, shininess: 40 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = CHEST.Y;
  body.castShadow = true;
  group.add(body);

  const lockGeometry = new THREE.BoxGeometry(0.3, 0.35, 0.15);
  const lockMaterial = new THREE.MeshPhongMaterial({
    color: 0x9b2335,
    emissive: 0x9b2335,
    emissiveIntensity: 0.6,
    shininess: 100,
  });
  const lock = new THREE.Mesh(lockGeometry, lockMaterial);
  lock.position.set(0, CHEST.Y, CHEST.DEPTH / 2 + 0.08);
  group.add(lock);

  const lockLight = new THREE.PointLight(0x9b2335, 1.2, 4);
  lockLight.position.copy(lock.position);
  group.add(lockLight);

  group.position.set(0, 0, -6);
  scene.add(group);

  resourcesRef.current.geometries.push(bodyGeometry, lockGeometry);
  resourcesRef.current.materials.push(bodyMaterial, lockMaterial);
  resourcesRef.current.meshes.push(body, lock);
  resourcesRef.current.lights.push(lockLight);

  return { group, lock, lockMaterial, lockLight, body, bodyMaterial };
}

export function unlockChest(chest) {
  chest.lockMaterial.color.set(0x2d6a4f);
  chest.lockMaterial.emissive.set(0x2d6a4f);
  chest.lockLight.color.set(0x2d6a4f);
  chest.lock.scale.set(1, 1, 1);
  // Lid pops open — tilt the body's top half back by swapping in an open pose
  chest.body.rotation.x = -0.35;
  chest.body.position.z -= 0.15;
}

/**
 * A camera-facing mascot sprite (THREE.Sprite auto-billboards, so no manual
 * look-at math is needed) built from one of the existing mascot PNGs. Bobbing
 * is applied by the caller's animation loop via chest.mascot.position.y.
 */
export function buildMascotSprite(scene, resourcesRef, imagePath) {
  const loader = new THREE.TextureLoader();
  const texture = loader.load(imagePath);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.4, 2.4, 1);
  sprite.position.set(-4, 1.4, -3);
  scene.add(sprite);

  resourcesRef.current.materials.push(material);
  resourcesRef.current.textures.push(texture);
  resourcesRef.current.meshes.push(sprite);

  return sprite;
}

/**
 * Engraved stone tablet with a riddle etched via canvas texture (same
 * draw-to-canvas-then-CanvasTexture technique Scrabble3D.js's
 * createNameTexture already uses) — the room's "one cool element" beyond the
 * chest: an actual clue instead of just a puzzle-and-lock loop.
 */
export function buildClueTablet(scene, resourcesRef) {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = 640 * dpr;
  canvas.height = 320 * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const grad = ctx.createLinearGradient(0, 0, 0, 320);
  grad.addColorStop(0, '#3d3350');
  grad.addColorStop(1, '#241c36');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 640, 320);

  ctx.strokeStyle = 'rgba(201,168,76,0.6)';
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, 616, 296);

  ctx.fillStyle = '#e9dcff';
  ctx.font = 'italic 30px Georgia';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 6;
  const lines = ['"Seek the tiles that rarely', 'come to hand, and the vault', 'will yield its gold."'];
  lines.forEach((line, i) => ctx.fillText(line, 320, 130 + i * 44));

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const geometry = new THREE.PlaneGeometry(4, 2);
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  const tablet = new THREE.Mesh(geometry, material);
  tablet.position.set(5.5, 2.2, -9.7);

  const light = new THREE.PointLight(0xc9a84c, 0.8, 6);
  light.position.set(5.5, 2.2, -8.5);

  scene.add(tablet, light);

  resourcesRef.current.geometries.push(geometry);
  resourcesRef.current.materials.push(material);
  resourcesRef.current.textures.push(texture);
  resourcesRef.current.meshes.push(tablet);
  resourcesRef.current.lights.push(light);

  return tablet;
}

let cachedParticleTexture = null;
function getParticleTexture() {
  if (cachedParticleTexture) return cachedParticleTexture;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,230,150,1)');
  grad.addColorStop(1, 'rgba(255,230,150,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  cachedParticleTexture = new THREE.CanvasTexture(canvas);
  return cachedParticleTexture;
}

/**
 * A one-shot burst of small fading gold sprites from `origin` — the chest's
 * unlock payoff, in place of just flipping the lock's material color.
 * Returns particle records the caller's animation loop advances each frame
 * (position += velocity, velocity.y -= gravity, opacity = life / maxLife)
 * and disposes once life runs out.
 */
export function spawnBurst(scene, resourcesRef, origin, count = 26) {
  const texture = getParticleTexture();
  const particles = [];
  for (let i = 0; i < count; i++) {
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(material);
    const scale = 0.25 + Math.random() * 0.25;
    sprite.scale.set(scale, scale, 1);
    sprite.position.copy(origin);
    scene.add(sprite);

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.03 + Math.random() * 0.05;
    const maxLife = 40 + Math.floor(Math.random() * 20);
    particles.push({
      sprite,
      velocity: new THREE.Vector3(Math.cos(angle) * speed, 0.08 + Math.random() * 0.06, Math.sin(angle) * speed),
      life: maxLife,
      maxLife,
    });

    resourcesRef.current.materials.push(material);
    resourcesRef.current.meshes.push(sprite);
  }
  return particles;
}
