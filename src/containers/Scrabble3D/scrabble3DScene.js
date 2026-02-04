/**
 * Shared 3D scene creation for Scrabble3D (viewer) and Scrabble3DPlay.
 * Keeps the board identical in both so rendering matches and avoids visual artifacts.
 */
import * as THREE from 'three';
import { BOARD, GAME } from './constants';

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

  // Circular board base (closed cylinder - same as viewer)
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
  board.renderOrder = -1;
  parent.add(board);
  resourcesRef.current.geometries.push(boardGeometry);
  resourcesRef.current.materials.push(boardMaterial);
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
}
