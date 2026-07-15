/**
 * Shared "world class" visual dressing for the 3D Scrabble room - floor, rug,
 * table, chairs, the parchment scoresheet, the brass trophy-plaque scoreboard
 * console, the fox crest icon, and the gold blank-tile styling.
 *
 * Used by both Scrabble3DPlay (interactive play) and Scrabble3D (replay
 * viewer) so the two share one visual source of truth. Each caller still
 * owns its own data (Play reads the Zustand game store; the viewer reads its
 * own gameData/currentMoveIndex) - only the geometry, textures, and canvas
 * painting live here.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { ENVIRONMENT, TABLE, FUTON, TILE, POINT_VALUES } from './constants';

// ---------------------------------------------------------------------------
// Floor + rug
// ---------------------------------------------------------------------------

export function createFloorAndRug(scene, resourcesRef) {
  // Dark wood-plank floor, tiled across the whole room
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 512;
  floorCanvas.height = 512;
  const floorCtx = floorCanvas.getContext('2d');
  const floorGradient = floorCtx.createLinearGradient(0, 0, 0, floorCanvas.height);
  floorGradient.addColorStop(0, '#4a3226');
  floorGradient.addColorStop(0.5, '#3a2718');
  floorGradient.addColorStop(1, '#2a1c10');
  floorCtx.fillStyle = floorGradient;
  floorCtx.fillRect(0, 0, floorCanvas.width, floorCanvas.height);
  const plankHeight = floorCanvas.height / 6;
  floorCtx.strokeStyle = 'rgba(15, 8, 4, 0.55)';
  floorCtx.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    floorCtx.beginPath();
    floorCtx.moveTo(0, i * plankHeight);
    floorCtx.lineTo(floorCanvas.width, i * plankHeight);
    floorCtx.stroke();
  }
  floorCtx.globalCompositeOperation = 'overlay';
  for (let i = 0; i < 90; i++) {
    const y = Math.random() * floorCanvas.height;
    floorCtx.strokeStyle = Math.random() > 0.5 ? 'rgba(255, 220, 180, 0.07)' : 'rgba(15, 8, 4, 0.12)';
    floorCtx.lineWidth = 0.5 + Math.random();
    floorCtx.beginPath();
    floorCtx.moveTo(0, y);
    for (let x = 0; x <= floorCanvas.width; x += 32) {
      const yy = y + Math.sin(x * 0.02 + i) * 2;
      floorCtx.lineTo(x, yy);
    }
    floorCtx.stroke();
  }
  floorCtx.globalCompositeOperation = 'source-over';
  const floorTexture = new THREE.CanvasTexture(floorCanvas);
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(8, 8);
  floorTexture.needsUpdate = true;

  const floorGeometry = new THREE.PlaneGeometry(ENVIRONMENT.FLOOR.WIDTH, ENVIRONMENT.FLOOR.HEIGHT);
  const floorMaterial = new THREE.MeshPhongMaterial({
    map: floorTexture,
    shininess: 35
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = ENVIRONMENT.FLOOR.Y_POSITION;
  floor.receiveShadow = true;
  scene.add(floor);
  resourcesRef.current.geometries.push(floorGeometry);
  resourcesRef.current.materials.push(floorMaterial);
  resourcesRef.current.textures.push(floorTexture);
  resourcesRef.current.meshes.push(floor);

  // Plain deep hunter-green rug with a soft vignette - in the same green
  // family as the leather chairs but a distinctly different, more muted
  // shade so the two don't just read as the same color reused twice
  const rugCanvas = document.createElement('canvas');
  rugCanvas.width = 1024;
  rugCanvas.height = 768;
  const rugCtx = rugCanvas.getContext('2d');
  const rw = rugCanvas.width;
  const rh = rugCanvas.height;
  const rugBg = rugCtx.createRadialGradient(rw / 2, rh / 2, 0, rw / 2, rh / 2, Math.max(rw, rh) / 1.3);
  rugBg.addColorStop(0, '#2f5233');
  rugBg.addColorStop(1, '#12210f');
  rugCtx.fillStyle = rugBg;
  rugCtx.fillRect(0, 0, rw, rh);

  const rugTexture = new THREE.CanvasTexture(rugCanvas);
  rugTexture.needsUpdate = true;

  const carpetGeometry = new THREE.PlaneGeometry(60, 45);
  const carpetMaterial = new THREE.MeshPhongMaterial({
    map: rugTexture,
    shininess: 8
  });
  const carpet = new THREE.Mesh(carpetGeometry, carpetMaterial);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.y = ENVIRONMENT.FLOOR.Y_POSITION + 0.05;
  carpet.receiveShadow = true;
  scene.add(carpet);
  resourcesRef.current.geometries.push(carpetGeometry);
  resourcesRef.current.materials.push(carpetMaterial);
  resourcesRef.current.textures.push(rugTexture);
  resourcesRef.current.meshes.push(carpet);
}

// ---------------------------------------------------------------------------
// Table (honey-oak top) + legs
// ---------------------------------------------------------------------------

export function createTableSurface(scene, resourcesRef) {
  // Table - honey oak wood-grain top instead of flat white, matching the
  // walnut/brass tones used everywhere else in the room
  const tableTopCanvas = document.createElement('canvas');
  tableTopCanvas.width = 512;
  tableTopCanvas.height = 512;
  const tableTopCtx = tableTopCanvas.getContext('2d');
  const tableTopGradient = tableTopCtx.createLinearGradient(0, 0, tableTopCanvas.width, 0);
  tableTopGradient.addColorStop(0, '#c9a26a');
  tableTopGradient.addColorStop(0.5, '#b8875a');
  tableTopGradient.addColorStop(1, '#a67a4d');
  tableTopCtx.fillStyle = tableTopGradient;
  tableTopCtx.fillRect(0, 0, tableTopCanvas.width, tableTopCanvas.height);
  tableTopCtx.globalCompositeOperation = 'overlay';
  for (let i = 0; i < 70; i++) {
    const y = Math.random() * tableTopCanvas.height;
    tableTopCtx.strokeStyle = Math.random() > 0.5 ? 'rgba(255, 235, 200, 0.10)' : 'rgba(80, 50, 20, 0.14)';
    tableTopCtx.lineWidth = 0.6 + Math.random() * 1.6;
    tableTopCtx.beginPath();
    tableTopCtx.moveTo(0, y);
    for (let x = 0; x <= tableTopCanvas.width; x += 28) {
      const yy = y + Math.sin(x * 0.015 + i) * 3;
      tableTopCtx.lineTo(x, yy);
    }
    tableTopCtx.stroke();
  }
  tableTopCtx.globalCompositeOperation = 'source-over';
  const tableTopTexture = new THREE.CanvasTexture(tableTopCanvas);
  tableTopTexture.wrapS = THREE.RepeatWrapping;
  tableTopTexture.wrapT = THREE.RepeatWrapping;
  tableTopTexture.repeat.set(4, 2);
  tableTopTexture.needsUpdate = true;

  const tableSideMaterial = new THREE.MeshPhongMaterial({ color: 0x6b4a2e, shininess: 30 });
  const tableTopMaterial = new THREE.MeshPhongMaterial({ map: tableTopTexture, shininess: 45 });

  const tableGeometry = new THREE.BoxGeometry(TABLE.WIDTH, TABLE.HEIGHT, TABLE.DEPTH);
  // BoxGeometry material order: [+x, -x, +y (top), -y (bottom), +z, -z]
  const table = new THREE.Mesh(tableGeometry, [
    tableSideMaterial, tableSideMaterial, tableTopMaterial, tableSideMaterial, tableSideMaterial, tableSideMaterial
  ]);
  table.position.y = TABLE.Y_POSITION;
  table.castShadow = true;
  table.receiveShadow = true;
  scene.add(table);
  resourcesRef.current.geometries.push(tableGeometry);
  resourcesRef.current.materials.push(tableSideMaterial, tableTopMaterial);
  resourcesRef.current.textures.push(tableTopTexture);
  resourcesRef.current.meshes.push(table);

  // Table legs (unchanged plain wood - never restyled, kept as-is)
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
}

// ---------------------------------------------------------------------------
// Chairs (tufted leather club chairs with brass buttons + velvet pillows)
// ---------------------------------------------------------------------------

export function createChairs(scene, resourcesRef) {
  const leatherCanvas = document.createElement('canvas');
  leatherCanvas.width = 256;
  leatherCanvas.height = 256;
  const leatherCtx = leatherCanvas.getContext('2d');
  const leatherGrad = leatherCtx.createRadialGradient(128, 128, 10, 128, 128, 190);
  leatherGrad.addColorStop(0, '#1f6b4a');
  leatherGrad.addColorStop(1, '#0f3d29');
  leatherCtx.fillStyle = leatherGrad;
  leatherCtx.fillRect(0, 0, 256, 256);
  const tuftStep = 64;
  leatherCtx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  leatherCtx.lineWidth = 2;
  for (let offset = -256; offset <= 512; offset += tuftStep) {
    leatherCtx.beginPath();
    leatherCtx.moveTo(offset, 0);
    leatherCtx.lineTo(offset + 256, 256);
    leatherCtx.stroke();
    leatherCtx.beginPath();
    leatherCtx.moveTo(offset, 256);
    leatherCtx.lineTo(offset + 256, 0);
    leatherCtx.stroke();
  }
  for (let x = 0; x <= 256; x += tuftStep) {
    for (let y = 0; y <= 256; y += tuftStep) {
      leatherCtx.beginPath();
      leatherCtx.arc(x, y, 3.5, 0, Math.PI * 2);
      leatherCtx.fillStyle = '#8a6a2a';
      leatherCtx.fill();
      leatherCtx.beginPath();
      leatherCtx.arc(x, y, 1.6, 0, Math.PI * 2);
      leatherCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      leatherCtx.fill();
    }
  }
  const leatherTexture = new THREE.CanvasTexture(leatherCanvas);
  leatherTexture.wrapS = THREE.RepeatWrapping;
  leatherTexture.wrapT = THREE.RepeatWrapping;
  leatherTexture.needsUpdate = true;

  const cushionMaterial = new THREE.MeshPhongMaterial({
    map: leatherTexture,
    shininess: 55
  });
  const frameMaterial = new THREE.MeshPhongMaterial({
    color: 0x3e2723,
    shininess: 60
  });
  const pillowMaterial = new THREE.MeshPhongMaterial({
    color: 0x7a1f2b,
    shininess: 90
  });

  FUTON.POSITIONS.forEach((pos) => {
    const cushionGeometry = new RoundedBoxGeometry(FUTON.CUSHION.WIDTH, FUTON.CUSHION.HEIGHT, FUTON.CUSHION.DEPTH, 3, 0.15);
    const cushion = new THREE.Mesh(cushionGeometry, cushionMaterial);
    cushion.position.set(pos.x, FUTON.CUSHION.Y_POSITION, pos.z);
    cushion.castShadow = true;
    scene.add(cushion);
    resourcesRef.current.geometries.push(cushionGeometry);
    resourcesRef.current.meshes.push(cushion);

    const backCushionGeometry = new RoundedBoxGeometry(FUTON.BACK_CUSHION.WIDTH, FUTON.BACK_CUSHION.HEIGHT, FUTON.BACK_CUSHION.DEPTH, 3, 0.15);
    const backCushion = new THREE.Mesh(backCushionGeometry, cushionMaterial);
    backCushion.position.set(pos.x, FUTON.BACK_CUSHION.Y_POSITION, pos.z + (pos.rotation === 0 ? -FUTON.BACK_CUSHION.Z_OFFSET : FUTON.BACK_CUSHION.Z_OFFSET));
    scene.add(backCushion);
    resourcesRef.current.geometries.push(backCushionGeometry);
    resourcesRef.current.meshes.push(backCushion);

    const frameGeometry = new RoundedBoxGeometry(FUTON.FRAME.WIDTH, FUTON.FRAME.HEIGHT, FUTON.FRAME.DEPTH, 3, 0.08);
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(pos.x, FUTON.FRAME.Y_POSITION, pos.z);
    scene.add(frame);
    resourcesRef.current.geometries.push(frameGeometry);
    resourcesRef.current.meshes.push(frame);

    // Throw pillows, tilted slightly for a casually-placed look
    FUTON.PILLOW.POSITIONS.forEach((pillowPos, i) => {
      const pillowGeometry = new RoundedBoxGeometry(FUTON.PILLOW.WIDTH, FUTON.PILLOW.HEIGHT, FUTON.PILLOW.DEPTH, 3, 0.12);
      const pillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
      pillow.position.set(
        pos.x + pillowPos.x,
        FUTON.PILLOW.Y_POSITION,
        pos.z + (pos.rotation === 0 ? pillowPos.z : -pillowPos.z)
      );
      pillow.rotation.y = i % 2 === 0 ? 0.18 : -0.18;
      pillow.castShadow = true;
      scene.add(pillow);
      resourcesRef.current.geometries.push(pillowGeometry);
      resourcesRef.current.meshes.push(pillow);
    });
  });

  resourcesRef.current.materials.push(cushionMaterial, frameMaterial, pillowMaterial);
  resourcesRef.current.textures.push(leatherTexture);
}

// ---------------------------------------------------------------------------
// Scoresheet (parchment base plane + overlay canvas for the drawn grid)
// ---------------------------------------------------------------------------

export function createScoresheetBase(scene, resourcesRef) {
  // Aged parchment texture for the paper backing, instead of flat beige
  const parchmentCanvas = document.createElement('canvas');
  parchmentCanvas.width = 256;
  parchmentCanvas.height = 296;
  const parchmentCtx = parchmentCanvas.getContext('2d');
  const parchmentGradient = parchmentCtx.createRadialGradient(128, 148, 20, 128, 148, 210);
  parchmentGradient.addColorStop(0, '#f5ecd7');
  parchmentGradient.addColorStop(0.7, '#ecdfc0');
  parchmentGradient.addColorStop(1, '#d8c69c');
  parchmentCtx.fillStyle = parchmentGradient;
  parchmentCtx.fillRect(0, 0, parchmentCanvas.width, parchmentCanvas.height);
  parchmentCtx.globalAlpha = 0.5;
  for (let i = 0; i < 900; i++) {
    parchmentCtx.fillStyle = Math.random() > 0.5 ? 'rgba(120, 95, 60, 0.06)' : 'rgba(255, 250, 235, 0.08)';
    parchmentCtx.fillRect(Math.random() * parchmentCanvas.width, Math.random() * parchmentCanvas.height, 1.5, 1.5);
  }
  parchmentCtx.globalAlpha = 1;
  const parchmentTexture = new THREE.CanvasTexture(parchmentCanvas);
  parchmentTexture.needsUpdate = true;

  const scoresheetGeometry = new THREE.PlaneGeometry(TABLE.SCORESHEET.WIDTH, TABLE.SCORESHEET.HEIGHT);
  const scoresheetMaterial = new THREE.MeshPhongMaterial({
    map: parchmentTexture,
    transparent: true,
    opacity: TABLE.SCORESHEET.MATERIAL.OPACITY,
    shininess: 8
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
  resourcesRef.current.textures.push(parchmentTexture);
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

  return { base: scoresheet, scores: scoresMesh, canvas: scoresCanvas, context: scoresContext };
}

/**
 * Paints the scoresheet's score grid onto its canvas (transparent background
 * so the parchment texture underneath shows through). Pure function - caller
 * resolves its own data first (Play from the game store, the viewer from its
 * own gameData/currentMoveIndex) and passes it in.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} data
 * @param {string} data.p1Name
 * @param {string} data.p2Name
 * @param {Array<{player: string, word?: string, score?: number}>} data.moves - up to 20 will be shown
 * @param {number} data.p1Total
 * @param {number} data.p2Total
 */
export function paintScoresheet(ctx, { p1Name, p2Name, moves, p1Total, p2Total }) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const scale = window.devicePixelRatio || 1;
  ctx.scale(scale, scale);
  // Transparent, not a solid fill, so the parchment texture on the base
  // plane underneath shows through instead of being hidden by this overlay
  ctx.clearRect(0, 0, 360, 416);

  // Alternating row banding for readability
  ctx.fillStyle = 'rgba(107, 66, 38, 0.12)';
  for (let i = 0; i <= 20; i += 2) {
    ctx.fillRect(2, 20 + i * 18, 356, 18);
  }

  // Gold underline beneath the header row
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(4, 38);
  ctx.lineTo(356, 38);
  ctx.stroke();

  // Column dividers and row lines - dark enough to read clearly, still warm brown not stark black
  ctx.strokeStyle = 'rgba(74, 44, 20, 0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 0); ctx.lineTo(80, 416);
  ctx.moveTo(160, 0); ctx.lineTo(160, 416);
  ctx.moveTo(200, 0); ctx.lineTo(200, 416);
  ctx.moveTo(280, 0); ctx.lineTo(280, 416);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i <= 21; i++) {
    ctx.moveTo(0, 20 + i * 18);
    ctx.lineTo(360, 20 + i * 18);
  }
  ctx.stroke();

  // Framed border around the whole sheet
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 356, 412);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#1a0f05';
  ctx.font = '700 15px "Palatino Linotype", Georgia, serif';
  ctx.fillText(p1Name, 120, 10);
  ctx.fillText(p2Name, 320, 10);
  ctx.font = '700 12px "Palatino Linotype", Georgia, serif';
  ctx.fillStyle = '#4a2c14';
  ctx.fillText('Word(s)', 40, 29);
  ctx.fillText('Score', 120, 29);
  ctx.fillText('Turn', 180, 29);
  ctx.fillText('Word(s)', 240, 29);
  ctx.fillText('Score', 320, 29);
  ctx.font = '600 11px Georgia, serif';
  ctx.fillStyle = '#4a2c14';
  for (let i = 1; i <= 20; i++) {
    ctx.fillText(i.toString(), 180, 29 + i * 18);
  }
  ctx.fillText('+', 180, 29 + 21 * 18);

  ctx.font = '600 13px Georgia, serif';
  ctx.fillStyle = '#1a0f05';
  (moves || []).slice(0, 20).forEach((move, index) => {
    const row = index + 1;
    const y = 29 + row * 18;
    const score = move.score || 0;
    const word = move.word || 'Pass';
    const isPlayer1 = move.player === p1Name;
    if (isPlayer1) {
      ctx.fillText(word, 40, y);
      ctx.fillText(`+${score}`, 120, y);
    } else {
      ctx.fillText(word, 240, y);
      ctx.fillText(`+${score}`, 320, y);
    }
  });
  const totalY = 29 + 21 * 18;
  ctx.font = '700 15px "Palatino Linotype", Georgia, serif';
  ctx.fillStyle = '#7a1f2b';
  ctx.fillText(String(p1Total ?? 0), 120, totalY);
  ctx.fillText(String(p2Total ?? 0), 320, totalY);
}

// ---------------------------------------------------------------------------
// Standing brass console (shared shell for the scoreboard trophy plaque)
// ---------------------------------------------------------------------------

/**
 * Builds the standing "trophy plaque" shell: a walnut body box, a face plane
 * (with its own canvas/texture the caller paints into), and four brass
 * finials at the corners. Returns the canvas/context so the caller can draw
 * its own data-driven content and call `.texture.needsUpdate = true`.
 */
export function createBrassStandingConsole(scene, resourcesRef, { x, z }) {
  const boardWidth = 4.2;
  const boardHeight = 5.0;
  const boardDepth = 0.4;
  const canvasW = 420;
  const canvasH = 500;
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  const consoleTexture = new THREE.CanvasTexture(canvas);
  const consoleGeometry = new THREE.PlaneGeometry(boardWidth, boardHeight);
  const consoleMaterial = new THREE.MeshBasicMaterial({
    map: consoleTexture,
    transparent: true,
    alphaTest: 0.01
  });
  const consoleDisplay = new THREE.Mesh(consoleGeometry, consoleMaterial);
  consoleDisplay.position.z = boardDepth / 2; // Face in front of body
  consoleDisplay.renderOrder = 1;

  // Back / body: a chunkier walnut block, more "trophy case" than "console"
  const bodyGeometry = new THREE.BoxGeometry(boardWidth, boardHeight, boardDepth);
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0x3e2723,
    shininess: 55,
  });
  const consoleBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
  consoleBody.position.z = -boardDepth / 2;
  consoleBody.castShadow = true;

  const consoleGroup = new THREE.Group();
  consoleGroup.add(consoleBody);
  consoleGroup.add(consoleDisplay);

  // Small brass finials at each corner of the face for a trophy-case feel
  const finialMaterial = new THREE.MeshPhongMaterial({
    color: 0xd97706,
    emissive: 0x92400e,
    emissiveIntensity: 0.2,
    shininess: 120
  });
  const finialGeometry = new THREE.SphereGeometry(0.09, 12, 10);
  const finialInset = 0.18;
  [
    [-boardWidth / 2 + finialInset, boardHeight / 2 - finialInset],
    [boardWidth / 2 - finialInset, boardHeight / 2 - finialInset],
    [-boardWidth / 2 + finialInset, -boardHeight / 2 + finialInset],
    [boardWidth / 2 - finialInset, -boardHeight / 2 + finialInset],
  ].forEach(([fx, fy]) => {
    const finial = new THREE.Mesh(finialGeometry, finialMaterial);
    finial.position.set(fx, fy, boardDepth / 2 + 0.02);
    consoleGroup.add(finial);
  });

  consoleGroup.rotation.y = 0; // Face toward front / room
  const tableTopY = TABLE.Y_POSITION + TABLE.HEIGHT / 2;
  consoleGroup.position.set(x, tableTopY + boardHeight / 2, z);
  scene.add(consoleGroup);
  resourcesRef.current.geometries.push(consoleGeometry, bodyGeometry, finialGeometry);
  resourcesRef.current.materials.push(consoleMaterial, bodyMaterial, finialMaterial);
  resourcesRef.current.textures.push(consoleTexture);
  resourcesRef.current.meshes.push(consoleDisplay, consoleBody);

  return { canvas, context: ctx, texture: consoleTexture, drawW: canvasW, drawH: canvasH };
}

/**
 * Paints the scoreboard face: burgundy velvet, brass frame, the fox crest,
 * and stacked embossed-brass scores. Pure function - caller resolves its own
 * data first and passes it in.
 */
export function paintScoreboardConsole(ctx, w, h, { p1Name, p2Name, p1Score, p2Score, foxIcon }) {
  // Deep burgundy velvet, matching the rug and pillows - a trophy plaque,
  // not a glass digital readout like the clock
  const bgGradient = ctx.createRadialGradient(w / 2, h * 0.4, 20, w / 2, h * 0.4, h * 0.75);
  bgGradient.addColorStop(0, '#5a1620');
  bgGradient.addColorStop(1, '#2a0a10');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, w, h);

  const brassGradient = ctx.createLinearGradient(0, 0, w, h);
  brassGradient.addColorStop(0, '#FDE68A');
  brassGradient.addColorStop(0.5, '#D97706');
  brassGradient.addColorStop(1, '#92400E');

  // Brass double-frame
  ctx.strokeStyle = brassGradient;
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, w - 10, h - 10);
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(13, 13, w - 26, h - 26);

  // Fox crest, top-center
  const crestY = 66;
  if (foxIcon) {
    const crestSize = 84;
    ctx.drawImage(foxIcon, w / 2 - crestSize / 2, crestY - crestSize / 2, crestSize, crestSize);
  }

  // Rule beneath the crest
  ctx.strokeStyle = brassGradient;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 118);
  ctx.lineTo(w - 40, 118);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Embossed brass numerals - a carved plaque feel, not a glowing digital readout
  const drawEmbossedScore = (name, score, nameY, scoreY) => {
    ctx.fillStyle = '#FDE68A';
    ctx.font = '700 34px "Palatino Linotype", Georgia, serif';
    ctx.fillText(name, w / 2, nameY);

    const text = String(score);
    ctx.font = '700 84px Georgia, serif';
    ctx.fillStyle = 'rgba(40, 15, 8, 0.7)';
    ctx.fillText(text, w / 2 + 2, scoreY + 3);

    const numGradient = ctx.createLinearGradient(0, scoreY - 40, 0, scoreY + 40);
    numGradient.addColorStop(0, '#FDE68A');
    numGradient.addColorStop(0.5, '#D97706');
    numGradient.addColorStop(1, '#92400E');
    ctx.fillStyle = numGradient;
    ctx.fillText(text, w / 2, scoreY);

    ctx.fillStyle = 'rgba(255, 251, 235, 0.4)';
    ctx.fillText(text, w / 2 - 1, scoreY - 1);
  };

  // Stacked vertically - Player 1 on top, Player 2 below
  drawEmbossedScore(p1Name, p1Score, 190, 250);

  ctx.strokeStyle = brassGradient;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, 320);
  ctx.lineTo(w - 40, 320);
  ctx.stroke();

  drawEmbossedScore(p2Name, p2Score, 370, 430);
}

// ---------------------------------------------------------------------------
// Fox crest icon (loaded once, tinted brass gold)
// ---------------------------------------------------------------------------

/**
 * Loads /images/fox-icon.svg, tints it from its default black silhouette to
 * a brass gradient, and calls onReady(offscreenCanvas) once done. The
 * returned canvas can be drawImage()'d directly wherever the crest is needed.
 */
export function loadFoxCrestIcon(onReady) {
  const img = new Image();
  img.onload = () => {
    const size = 200;
    const off = document.createElement('canvas');
    off.width = size;
    off.height = size;
    const offCtx = off.getContext('2d');
    // SVG viewBox is 200x220 - fit it centered, preserving aspect ratio
    const vbW = 200, vbH = 220;
    const scale = Math.min(size / vbW, size / vbH);
    const dw = vbW * scale;
    const dh = vbH * scale;
    offCtx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);

    // Recolor the black silhouette to a brass gradient
    const gradient = offCtx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, '#FDE68A');
    gradient.addColorStop(0.5, '#D97706');
    gradient.addColorStop(1, '#92400E');
    offCtx.globalCompositeOperation = 'source-in';
    offCtx.fillStyle = gradient;
    offCtx.fillRect(0, 0, size, size);
    offCtx.globalCompositeOperation = 'source-over';

    onReady(off);
  };
  img.src = '/images/fox-icon.svg';
}

// ---------------------------------------------------------------------------
// Blank tile letter styling (gold letter + star instead of white + points)
// ---------------------------------------------------------------------------

/**
 * Draws a board tile's letter face onto `tile` (a THREE.Mesh) and registers
 * its geometry/material/texture for cleanup. Blanks render gold with a
 * glowing star instead of a point value; regular letters render white with
 * their normal point value, unchanged from before.
 */
export function attachTileLetter(tile, resourcesRef, letter, isBlank) {
  const size = TILE.LETTER.CANVAS_SIZE * 2; // Higher resolution for clarity
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  context.clearRect(0, 0, size, size);
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  const mainColor = isBlank ? '#FBBF24' : '#FFFFFF';
  const shadowColor = isBlank ? 'rgba(146, 64, 14, 0.7)' : 'rgba(80, 60, 40, 0.6)';
  const highlightColor = isBlank ? 'rgba(255, 251, 235, 0.5)' : 'rgba(255, 255, 255, 0.35)';

  // Draw embossed shadow (offset for depth)
  context.fillStyle = shadowColor;
  context.font = `bold ${100 * 2}px Arial`;
  context.fillText(letter.toUpperCase(), size / 2 + 2, size / 2 + 2);

  // Draw main letter
  context.fillStyle = mainColor;
  context.fillText(letter.toUpperCase(), size / 2, size / 2);

  // Draw highlight (top-left offset for emboss effect)
  context.fillStyle = highlightColor;
  context.fillText(letter.toUpperCase(), size / 2 - 1, size / 2 - 1);

  if (isBlank) {
    // Glowing gold star marking this as a wildcard tile, in place of a point value
    context.save();
    context.shadowColor = 'rgba(251, 191, 36, 0.95)';
    context.shadowBlur = 16;
    context.fillStyle = '#FBBF24';
    context.font = `bold ${56 * 2}px Arial`;
    context.textAlign = 'right';
    context.textBaseline = 'bottom';
    context.fillText('★', size - 6, size - 4);
    context.restore();
  } else {
    const pointValue = POINT_VALUES[letter.toUpperCase()] || 0;
    if (pointValue > 0) {
      context.fillStyle = 'rgba(80, 60, 40, 0.5)';
      context.font = `bold ${45 * 2}px Arial`;
      context.textAlign = 'right';
      context.textBaseline = 'bottom';
      context.fillText(pointValue.toString(), size - 8, size - 6);

      context.fillStyle = '#FFFFFF';
      context.fillText(pointValue.toString(), size - 10, size - 8);
    }
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
