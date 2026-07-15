/**
 * Shared 3D scene creation for Scrabble3D (viewer) and Scrabble3DPlay.
 * Keeps the board identical in both so rendering matches and avoids visual artifacts.
 */
import * as THREE from 'three';
import { BOARD, GAME } from './constants';

/**
 * Procedurally paints a warm walnut wood-grain texture for the board's outer
 * border ring, with a brass/gold trim ring roughly where the square grid
 * meets the round border. Cylinder cap UVs project the flat top face onto a
 * unit square from directly above, so a square canvas here maps correctly
 * onto the circular top face.
 */
function createBoardTopTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2;

  // Base walnut wood radial gradient
  const base = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
  base.addColorStop(0, '#7a4b28');
  base.addColorStop(0.6, '#5c3820');
  base.addColorStop(1, '#33200f');
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();

  // Subtle concentric wood-grain rings, slightly wobbly for a natural look
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  for (let ring = 0; ring < 36; ring++) {
    const rr = R * (0.16 + ring * 0.0235);
    ctx.beginPath();
    ctx.strokeStyle = ring % 3 === 0 ? 'rgba(255, 222, 180, 0.12)' : 'rgba(35, 18, 8, 0.14)';
    ctx.lineWidth = 1.5 + (ring % 4) * 0.4;
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.08) {
      const wobble = Math.sin(a * 5 + ring * 1.7) * R * 0.006;
      const x = cx + Math.cos(a) * (rr + wobble);
      const y = cy + Math.sin(a) * (rr + wobble);
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Faint accent ring near the very outer edge for polish
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.985, 0, Math.PI * 2);
  ctx.lineWidth = R * 0.008;
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.5)';
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Create the game board mesh (cylinder base + grid squares + grid lines).
 * Same exact geometry and materials as 3D viewer.
 * @param {THREE.Scene} scene - Scene (used when boardParent not provided)
 * @param {Object} opts - Options
 * @param {React.MutableRefObject} opts.resourcesRef - { geometries, materials, meshes }
 * @param {string} opts.origBoard - JSON string of board layout
 * @param {THREE.Group} [opts.boardParent] - If provided, board meshes are added here (for Play's rotatable group)
 * @param {React.MutableRefObject<THREE.Mesh[]>} [opts.boardSquaresRef] - If provided, square meshes are pushed here and get userData for raycasting
 */
export function createBoard(scene, opts) {
  const { resourcesRef, origBoard, boardParent, boardSquaresRef } = opts;
  const parent = boardParent || scene;

  // Circular board base (closed cylinder - same as viewer). Per-face
  // materials: a plain walnut side/underside, and a wood-grain + brass-trim
  // texture on the top face where the border is actually visible.
  const boardGeometry = new THREE.CylinderGeometry(BOARD.RADIUS, BOARD.RADIUS, BOARD.HEIGHT, BOARD.SEGMENTS);
  const boardTopTexture = createBoardTopTexture();
  const boardSideMaterial = new THREE.MeshPhongMaterial({
    color: 0x4a2f1a,
    shininess: 45
  });
  const boardTopMaterial = new THREE.MeshPhongMaterial({
    map: boardTopTexture,
    transparent: true,
    opacity: BOARD.MATERIAL.OPACITY,
    shininess: BOARD.MATERIAL.SHININESS,
    reflectivity: BOARD.MATERIAL.REFLECTIVITY
  });
  const boardBottomMaterial = new THREE.MeshPhongMaterial({
    color: 0x2e1c10,
    shininess: 30
  });
  const board = new THREE.Mesh(boardGeometry, [boardSideMaterial, boardTopMaterial, boardBottomMaterial]);
  board.receiveShadow = true;
  board.position.y = BOARD.Y_POSITION;
  board.renderOrder = -1;
  parent.add(board);
  resourcesRef.current.geometries.push(boardGeometry);
  resourcesRef.current.materials.push(boardSideMaterial, boardTopMaterial, boardBottomMaterial);
  resourcesRef.current.textures.push(boardTopTexture);
  resourcesRef.current.meshes.push(board);

  const startX = -(BOARD.GRID.SIZE * BOARD.GRID.SQUARE_SIZE) / 2 + BOARD.GRID.SQUARE_SIZE / 2;
  const startZ = -(BOARD.GRID.SIZE * BOARD.GRID.SQUARE_SIZE) / 2 + BOARD.GRID.SQUARE_SIZE / 2;
  const parsedBoard = JSON.parse(origBoard);

  for (let row = 0; row < BOARD.GRID.SIZE; row++) {
    for (let col = 0; col < BOARD.GRID.SIZE; col++) {
      const squareGeometry = new THREE.BoxGeometry(
        BOARD.GRID.SQUARE_SIZE * BOARD.GRID.SQUARE_SCALE,
        BOARD.GRID.SQUARE_HEIGHT,
        BOARD.GRID.SQUARE_SIZE * BOARD.GRID.SQUARE_SCALE
      );
      const boardValue = parsedBoard[row][col];
      let squareColor = BOARD.SQUARE_COLORS.EMPTY;
      if (boardValue === GAME.BOARD_VALUES.TRIPLE_WORD) squareColor = BOARD.SQUARE_COLORS.TRIPLE_WORD;
      else if (boardValue === GAME.BOARD_VALUES.DOUBLE_WORD) squareColor = BOARD.SQUARE_COLORS.DOUBLE_WORD;
      else if (boardValue === GAME.BOARD_VALUES.TRIPLE_LETTER) squareColor = BOARD.SQUARE_COLORS.TRIPLE_LETTER;
      else if (boardValue === GAME.BOARD_VALUES.DOUBLE_LETTER) squareColor = BOARD.SQUARE_COLORS.DOUBLE_LETTER;

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
      square.renderOrder = 1;
      if (boardSquaresRef) {
        square.userData = { type: 'boardSquare', row, col };
        boardSquaresRef.current.push(square);
      }
      parent.add(square);
      resourcesRef.current.geometries.push(squareGeometry);
      resourcesRef.current.materials.push(squareMaterial);
      resourcesRef.current.meshes.push(square);
    }
  }

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
    gridLine.castShadow = true;
    gridLine.receiveShadow = true;
    parent.add(gridLine);
    resourcesRef.current.geometries.push(gridLineGeometry);
    resourcesRef.current.materials.push(gridLineMaterial);
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
      gridLine.castShadow = true;
      gridLine.receiveShadow = true;
      parent.add(gridLine);
      resourcesRef.current.geometries.push(gridLineGeometry);
      resourcesRef.current.materials.push(gridLineMaterial);
      resourcesRef.current.meshes.push(gridLine);
    }
  }

  createBoardCompass(parent, resourcesRef);
}

/**
 * Classic Scrabble coordinate lettering (A-O / 1-15) on engraved gold
 * plaques, parented to the same object as the rest of the board so it moves
 * rigidly with it (e.g. in Play mode, this rotates along with the board when
 * it turns to face the bot, making the rotation state unmistakable at a glance).
 */
function createBoardCompass(parent, resourcesRef) {
  const squareSize = BOARD.GRID.SQUARE_SIZE; // 1
  const gridHalf = (BOARD.GRID.SIZE * squareSize) / 2; // 7.5
  const labelY = 0.09; // just above the grid squares' top face
  // The round board's radius only just barely contains the square grid's own
  // corners, so a full-width (15 unit) strip sitting outside the grid has
  // almost no room to clear the board's edge. Trimming the strip slightly
  // narrower than the full grid width (still ~1 unit per square, imperceptibly
  // tighter) buys enough clearance for a real gap plus a legible depth
  // without either colliding with the squares or poking off the board.
  const stripWidth = 14.2;
  const stripDepth = 0.4;
  const gapFromGrid = 0.15; // visible breathing room between the squares and the strip
  const edgeOffset = gridHalf + gapFromGrid + stripDepth / 2;

  // Physical size of one letter's cell along the strip's long axis (~1 unit,
  // matching a board square) vs. its short axis (stripDepth). Canvas cells
  // are drawn at this same aspect ratio so glyphs render undistorted even
  // though the strip itself is a short, wide rectangle.
  const cellUnit = stripWidth / BOARD.GRID.SIZE;
  const cellPxMajor = 160;
  const cellPxMinor = Math.round(cellPxMajor * (stripDepth / cellUnit));

  const drawLabel = (ctx, label, cx, cy, fontSize) => {
    ctx.font = `800 ${fontSize}px "Palatino Linotype", Georgia, "Book Antiqua", serif`;

    // Embossed drop shadow for a raised, carved-in feel
    ctx.save();
    ctx.fillStyle = 'rgba(40, 20, 8, 0.55)';
    ctx.fillText(label, cx + fontSize * 0.035, cy + fontSize * 0.05);
    ctx.restore();

    // Soft outer glow
    ctx.save();
    ctx.shadowColor = 'rgba(251, 191, 36, 0.9)';
    ctx.shadowBlur = fontSize * 0.4;
    ctx.fillStyle = 'rgba(251, 191, 36, 0.65)';
    ctx.fillText(label, cx, cy);
    ctx.restore();

    // Engraved outline for depth
    ctx.lineWidth = fontSize * 0.045;
    ctx.strokeStyle = '#6B2E0F';
    ctx.strokeText(label, cx, cy);

    // Polished gold gradient fill, richer 4-stop metallic ramp
    const half = fontSize * 0.42;
    const gradient = ctx.createLinearGradient(0, cy - half, 0, cy + half);
    gradient.addColorStop(0, '#FFFBEB');
    gradient.addColorStop(0.35, '#FDE68A');
    gradient.addColorStop(0.7, '#F59E0B');
    gradient.addColorStop(1, '#B45309');
    ctx.fillStyle = gradient;
    ctx.fillText(label, cx, cy);

    // Thin bright highlight along the top edge of the glyph, like a light catching polished metal
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#FFFDF5';
    ctx.fillText(label, cx, cy - fontSize * 0.03);
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  // vertical=false: labels run left-to-right across a wide canvas (for the
  // column strip). vertical=true: labels stack top-to-bottom down a tall,
  // narrow canvas (for the row strip) - each glyph is still drawn upright,
  // only its position within the canvas moves, so the strip can be laid out
  // along the board's Z axis without rotating the glyphs themselves.
  const buildLabelTexture = (labels, vertical) => {
    const canvas = document.createElement('canvas');
    canvas.width = vertical ? cellPxMinor : labels.length * cellPxMajor;
    canvas.height = vertical ? labels.length * cellPxMajor : cellPxMinor;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.round(cellPxMinor * 0.72);

    labels.forEach((label, i) => {
      const cx = vertical ? cellPxMinor / 2 : i * cellPxMajor + cellPxMajor / 2;
      const cy = vertical ? i * cellPxMajor + cellPxMajor / 2 : cellPxMinor / 2;
      drawLabel(ctx, label, cx, cy, fontSize);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    resourcesRef.current.textures.push(texture);
    return texture;
  };

  // A strip is just the glowing lettering, laid flat directly on the board.
  // Only ever rotated around X (to lie flat) - never also spun around Y,
  // since combining both into one Euler triple would rotate the glyphs
  // themselves sideways instead of just repositioning the strip.
  const buildStrip = (labels, vertical) => {
    const texture = buildLabelTexture(labels, vertical);
    const textGeometry = vertical
      ? new THREE.PlaneGeometry(stripDepth, stripWidth)
      : new THREE.PlaneGeometry(stripWidth, stripDepth);
    const textMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.01 });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.rotation.x = -Math.PI / 2;

    resourcesRef.current.geometries.push(textGeometry);
    resourcesRef.current.materials.push(textMaterial);
    resourcesRef.current.meshes.push(textMesh);

    return textMesh;
  };

  const columnLabels = Array.from({ length: BOARD.GRID.SIZE }, (_, i) => String.fromCharCode(65 + i)); // A..O
  const rowLabels = Array.from({ length: BOARD.GRID.SIZE }, (_, i) => String(i + 1)); // 1..15

  // Column letters along the board's north edge
  const colStrip = buildStrip(columnLabels, false);
  colStrip.position.set(0, labelY, -edgeOffset);
  parent.add(colStrip);

  // Row numbers along the board's west edge, upright and facing up
  const rowStrip = buildStrip(rowLabels, true);
  rowStrip.position.set(-edgeOffset, labelY, 0);
  parent.add(rowStrip);
}
