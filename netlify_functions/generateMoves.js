/* =============================================================
   Optimized Scrabble move generator (GADDAG-based)
   ============================================================= */

   const { letterScores, boardMultipliers } = require('./gameLogic');
   const loadDictionary = require('./loadDictionary');
   const fs = require('fs');
   const path = require('path');

   const theGADDAG = loadDictionary();
   const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
   const alphaArr = ALPHA.split('');
   
   function generateMoves(board, rack) {
     // Convert rack to array of objects with isBlank flag
     const rackArr = Array.isArray(rack) ? rack.map(l => ({
       letter: l === '?' || l === '*' ? '?' : l.toUpperCase(),
       isBlank: l === '?' || l === '*'
     })) : rack.split('').map(l => ({
       letter: l === '?' || l === '*' ? '?' : l.toUpperCase(),
       isBlank: l === '?' || l === '*'
     }));
   
     const moves = [];
     const moveSet = new Set();
   
     // Early termination: if rack is empty, no moves possible
     if (rackArr.length === 0) {
       return moves;
     }
   
     // First move special case - must start at H8 (7,7)
     if (isBoardEmpty(board)) {
       generateMovesAt(board, rackArr, 7, 7, 'horizontal', moves, moveSet);
       generateMovesAt(board, rackArr, 7, 7, 'vertical', moves, moveSet);
     } else {
       // Find all anchor points efficiently
       const anchors = findAnchors(board);
       
       // Early termination: if no anchors, no moves possible
       if (anchors.length === 0) {
         return moves;
       }
       
       for (const anchor of anchors) {
         generateMovesAt(board, rackArr, anchor.row, anchor.col, 'horizontal', moves, moveSet);
         generateMovesAt(board, rackArr, anchor.row, anchor.col, 'vertical', moves, moveSet);
       }
     }
   
     return moves;
   }
   
   function findAnchors(board) {
     const anchors = [];
     const visited = new Set();
   
     for (let row = 0; row < 15; row++) {
       for (let col = 0; col < 15; col++) {
         if (board[row][col] !== null) continue;
   
         const key = `${row},${col}`;
         if (visited.has(key)) continue;
   
         // Check if this empty square is adjacent to existing tiles
         if (hasAdjacentTile(board, row, col)) {
           anchors.push({ row, col });
           visited.add(key);
         }
       }
     }
   
     // Special case: if no anchors found, check for single-tile plays
     // This handles end-game scenarios where we need to find "hooks"
     if (anchors.length === 0) {
       for (let row = 0; row < 15; row++) {
         for (let col = 0; col < 15; col++) {
           if (board[row][col] !== null) continue;
   
           const key = `${row},${col}`;
           if (visited.has(key)) continue;
   
           // Check if this position can form a word by adding a single tile
           if (canFormWordAt(board, row, col)) {
             anchors.push({ row, col });
             visited.add(key);
           }
         }
       }
     }
   
     return anchors;
   }
   
   function canFormWordAt(board, row, col) {
     // Check horizontal direction
     let hasHorizontalWord = false;
     let leftCol = col - 1;
     let rightCol = col + 1;
     
     // Find the word to the left
     let leftWord = '';
     while (leftCol >= 0 && board[row][leftCol] !== null) {
       leftWord = board[row][leftCol] + leftWord;
       leftCol--;
     }
     
     // Find the word to the right
     let rightWord = '';
     while (rightCol < 15 && board[row][rightCol] !== null) {
       rightWord += board[row][rightCol];
       rightCol++;
     }
     
     // If we have tiles on both sides, we can form a word
     if (leftWord.length > 0 && rightWord.length > 0) {
       hasHorizontalWord = true;
     }
     
     // Check vertical direction
     let hasVerticalWord = false;
     let upRow = row - 1;
     let downRow = row + 1;
     
     // Find the word above
     let upWord = '';
     while (upRow >= 0 && board[upRow][col] !== null) {
       upWord = board[upRow][col] + upWord;
       upRow--;
     }
     
     // Find the word below
     let downWord = '';
     while (downRow < 15 && board[downRow][col] !== null) {
       downWord += board[downRow][col];
       downRow++;
     }
     
     // If we have tiles on both sides, we can form a word
     if (upWord.length > 0 && downWord.length > 0) {
       hasVerticalWord = true;
     }
     
     return hasHorizontalWord || hasVerticalWord;
   }
   
   function generateMovesAt(board, rack, anchorRow, anchorCol, direction, moves, moveSet) {
     // Find the leftmost/topmost position for potential words through this anchor
     let leftLimit = anchorCol;
     let topLimit = anchorRow;
     
     if (direction === 'horizontal') {
       // Find how far left we can extend
       while (leftLimit > 0 && board[anchorRow][leftLimit - 1] === null) {
         leftLimit--;
       }
     } else {
       // Find how far up we can extend
       while (topLimit > 0 && board[topLimit - 1][anchorCol] === null) {
         topLimit--;
       }
     }
   
     // Try all possible starting positions
     if (direction === 'horizontal') {
       for (let startCol = leftLimit; startCol <= anchorCol; startCol++) {
         generateWordsFromPosition(board, rack, anchorRow, startCol, direction, moves, moveSet);
       }
     } else {
       for (let startRow = topLimit; startRow <= anchorRow; startRow++) {
         generateWordsFromPosition(board, rack, startRow, anchorCol, direction, moves, moveSet);
       }
     }
   
     // Special case: try single-tile plays directly at the anchor
     // This is important for end-game scenarios
     generateSingleTileMoves(board, rack, anchorRow, anchorCol, direction, moves, moveSet);
   }
   
   function generateSingleTileMoves(board, rack, row, col, direction, moves, moveSet) {
     // Try placing each tile from the rack directly at this position
     for (let i = 0; i < rack.length; i++) {
       const tile = rack[i];
       if (!tile) continue;
   
       // Try both horizontal and vertical directions
       for (const direction of ['horizontal', 'vertical']) {
         if (tile.isBlank) {
           // For blank tiles, try each letter
           for (const letter of ALPHA) {
             const newTile = {
               row, col,
               letter,
               isNew: true,
               isBlank: true
             };
             if (isValidSingleTileMove(board, newTile, direction)) {
               const move = {
                 word: getWordAt(board, row, col, direction, new Map([[`${row},${col}`, letter]])),
                 tiles: [newTile],
                 direction,
                 startRow: row,
                 startCol: col
               };
               const moveKey = `${move.word}-${move.startRow},${move.startCol}-${move.direction}-${move.tiles.map(t => t.isBlank ? t.letter : '').join('')}`;
               if (!moveSet.has(moveKey)) {
                 move.score = calculateScore(board, move.tiles, boardMultipliers);
                 moves.push(move);
                 moveSet.add(moveKey);
               }
             }
           }
         } else {
           // Regular tile
           const newTile = {
             row, col,
             letter: tile.letter,
             isNew: true,
             isBlank: false
           };
           if (isValidSingleTileMove(board, newTile, direction)) {
             const move = {
               word: getWordAt(board, row, col, direction, new Map([[`${row},${col}`, tile.letter]])),
               tiles: [newTile],
               direction,
               startRow: row,
               startCol: col
             };
             const moveKey = `${move.word}-${move.startRow},${move.startCol}-${move.direction}-${move.tiles.map(t => t.isBlank ? t.letter : '').join('')}`;
             if (!moveSet.has(moveKey)) {
               move.score = calculateScore(board, move.tiles, boardMultipliers);
               moves.push(move);
               moveSet.add(moveKey);
             }
           }
         }
       }
     }
   }
   
   function isValidSingleTileMove(board, tile, direction) {
     // Create a map with the tile being placed
     const placedMap = new Map();
     placedMap.set(`${tile.row},${tile.col}`, tile.letter);
     
     // Check main word in the direction of play
     const mainWord = getWordAt(board, tile.row, tile.col, direction, placedMap);
     if (mainWord.length <= 1 || !theGADDAG.contains(mainWord)) return false;
     
     // Check cross-word in the perpendicular direction
     const crossDirection = direction === 'horizontal' ? 'vertical' : 'horizontal';
     const crossWord = getWordAt(board, tile.row, tile.col, crossDirection, placedMap);
     if (crossWord.length > 1 && !theGADDAG.contains(crossWord)) return false;
     
     return true;
   }
   
   function generateWordsFromPosition(board, rack, startRow, startCol, direction, moves, moveSet) {
     // Build the prefix from existing tiles
     let prefix = '';
     let currentRow = startRow;
     let currentCol = startCol;
     
     // Collect existing prefix
     while (inBounds(currentRow, currentCol) && board[currentRow][currentCol] !== null) {
       prefix += board[currentRow][currentCol];
       [currentRow, currentCol] = step(currentRow, currentCol, direction);
     }
   
     // Start GADDAG traversal
     let node = theGADDAG.root;
     
     // If we have a prefix, traverse it backwards in the GADDAG
     if (prefix.length > 0) {
       for (let i = prefix.length - 1; i >= 0; i--) {
         const letter = prefix[i];
         if (!node[letter]) return;
         node = node[letter];
       }
       
       // Switch to suffix mode
       if (!node['^']) return;
       node = node['^'];
     }
   
     // Generate words from this position
     extendWords(
       node, 
       board, 
       rack, 
       prefix, 
       [], 
       currentRow, 
       currentCol, 
       direction, 
       moves, 
       prefix.length > 0, // isInSuffixMode
       moveSet
     );
   }
   
   function extendWords(node, board, rack, wordSoFar, tilesPlaced, row, col, direction, moves, isInSuffixMode, moveSet, depth = 0) {
     // Limit search depth to prevent excessive recursion
     const MAX_DEPTH = 15;
     if (depth > MAX_DEPTH) return;
   
     // Check if we can form a valid word
     if (node['$'] && tilesPlaced.length > 0) {
       const cleanWord = wordSoFar.replace(/\^/g, '');
       const move = {
         word: cleanWord,
         tiles: [...tilesPlaced],
         direction,
         startRow: tilesPlaced[0].row,
         startCol: tilesPlaced[0].col
       };
       
       // Create a unique key for this move
       const moveKey = `${move.word}-${move.startRow},${move.startCol}-${move.direction}-${move.tiles.map(t => t.isBlank ? t.letter : '').join('')}`;
       
       if (validateMove(board, move.tiles) && !moveSet.has(moveKey)) {
         move.score = calculateScore(board, move.tiles, boardMultipliers);
         moves.push(move);
         moveSet.add(moveKey);
       }
     }
   
     if (!inBounds(row, col)) return;
   
     const existingLetter = board[row][col];
   
     if (existingLetter !== null) {
       // Must use existing letter
       if (node[existingLetter]) {
         const [nextRow, nextCol] = step(row, col, direction);
         extendWords(
           node[existingLetter], 
           board, 
           rack, 
           wordSoFar + existingLetter, 
           tilesPlaced, 
           nextRow, 
           nextCol, 
           direction, 
           moves, 
           isInSuffixMode,
           moveSet,
           depth + 1
         );
       }
       return;
     }
   
     // Try placing tiles from rack
     for (let i = 0; i < rack.length; i++) {
       const tile = rack[i];
       if (!tile) continue;
   
       const newRack = rack.slice();
       newRack[i] = null;
   
       if (tile.isBlank) {
         // For blank tiles, try each letter
         for (const letter of ALPHA) {
           if (!isInSuffixMode) {
             // In prefix mode - can continue in prefix or switch to suffix
             if (node[letter]) {
               const newTile = {
                 row, col,
                 letter,
                 isNew: true,
                 isBlank: true
               };
               const [nextRow, nextCol] = step(row, col, direction);
               extendWords(
                 node[letter], 
                 board, 
                 newRack, 
                 wordSoFar + letter, 
                 [...tilesPlaced, newTile], 
                 nextRow, 
                 nextCol, 
                 direction, 
                 moves, 
                 false,
                 moveSet,
                 depth + 1
               );
             }
   
             // Try switching to suffix mode
             if (node['^'] && node['^'][letter]) {
               const newTile = {
                 row, col,
                 letter,
                 isNew: true,
                 isBlank: true
               };
               const [nextRow, nextCol] = step(row, col, direction);
               extendWords(
                 node['^'][letter], 
                 board, 
                 newRack, 
                 wordSoFar + '^' + letter, 
                 [...tilesPlaced, newTile], 
                 nextRow, 
                 nextCol, 
                 direction, 
                 moves, 
                 true,
                 moveSet,
                 depth + 1
               );
             }
           } else {
             // In suffix mode - can only continue in suffix
             if (node[letter]) {
               const newTile = {
                 row, col,
                 letter,
                 isNew: true,
                 isBlank: true
               };
               const [nextRow, nextCol] = step(row, col, direction);
               extendWords(
                 node[letter], 
                 board, 
                 newRack, 
                 wordSoFar + letter, 
                 [...tilesPlaced, newTile], 
                 nextRow, 
                 nextCol, 
                 direction, 
                 moves, 
                 true,
                 moveSet,
                 depth + 1
               );
             }
           }
         }
       } else {
         // Regular tile
         if (!isInSuffixMode) {
           // In prefix mode - can continue in prefix or switch to suffix
           if (node[tile.letter]) {
             const newTile = {
               row, col,
               letter: tile.letter,
               isNew: true,
               isBlank: false
             };
             const [nextRow, nextCol] = step(row, col, direction);
             extendWords(
               node[tile.letter], 
               board, 
               newRack, 
               wordSoFar + tile.letter, 
               [...tilesPlaced, newTile], 
               nextRow, 
               nextCol, 
               direction, 
               moves, 
               false,
               moveSet,
               depth + 1
             );
           }
   
           // Try switching to suffix mode
           if (node['^'] && node['^'][tile.letter]) {
             const newTile = {
               row, col,
               letter: tile.letter,
               isNew: true,
               isBlank: false
             };
             const [nextRow, nextCol] = step(row, col, direction);
             extendWords(
               node['^'][tile.letter], 
               board, 
               newRack, 
               wordSoFar + '^' + tile.letter, 
               [...tilesPlaced, newTile], 
               nextRow, 
               nextCol, 
               direction, 
               moves, 
               true,
               moveSet,
               depth + 1
             );
           }
         } else {
           // In suffix mode - can only continue in suffix
           if (node[tile.letter]) {
             const newTile = {
               row, col,
               letter: tile.letter,
               isNew: true,
               isBlank: false
             };
             const [nextRow, nextCol] = step(row, col, direction);
             extendWords(
               node[tile.letter], 
               board, 
               newRack, 
               wordSoFar + tile.letter, 
               [...tilesPlaced, newTile], 
               nextRow, 
               nextCol, 
               direction, 
               moves, 
               true,
               moveSet,
               depth + 1
             );
           }
         }
       }
     }
   }
   
   function hasAdjacentTile(board, row, col) {
     const adjacent = [
       [row - 1, col], [row + 1, col],
       [row, col - 1], [row, col + 1]
     ];
     
     for (const [r, c] of adjacent) {
       if (inBounds(r, c) && board[r][c] !== null) {
         return true;
       }
     }
     return false;
   }
   
   function step(row, col, direction) {
     return direction === 'horizontal' ? [row, col + 1] : [row + 1, col];
   }
   
   function inBounds(row, col) {
     return row >= 0 && row < 15 && col >= 0 && col < 15;
   }
   
   function isBoardEmpty(board) {
     for (let r = 0; r < 15; r++) {
       for (let c = 0; c < 15; c++) {
         if (board[r][c] !== null) return false;
       }
     }
     return true;
   }
   
   function validateMove(board, tiles) {
     if (!tiles || tiles.length === 0) return false;
     
     // Check if tiles form a straight line
     const first = tiles[0];
     const isHorizontal = tiles.every(t => t.row === first.row);
     const isVertical = tiles.every(t => t.col === first.col);
     if (!isHorizontal && !isVertical) return false;
     
     // For first move, must pass through center star (H8)
     if (isBoardEmpty(board)) {
       const centerRow = 7;
       const centerCol = 7;
       const passesThroughCenter = tiles.some(t => t.row === centerRow && t.col === centerCol);
       if (!passesThroughCenter) return false;
     }
     
     // Check connectivity to existing board (except for first move)
     if (!isBoardEmpty(board) && !isConnectedToBoard(board, tiles)) {
       return false;
     }
     
     // Create a map of placed tiles for word validation
     const placedMap = new Map();
     for (const tile of tiles) {
       placedMap.set(`${tile.row},${tile.col}`, tile.letter);
     }
     
     // Validate main word
     const direction = isHorizontal ? 'horizontal' : 'vertical';
     const mainWord = getWordAt(board, first.row, first.col, direction, placedMap);
     
     if (!mainWord || mainWord.length < 2 || !theGADDAG.contains(mainWord)) {
       return false;
     }
     
     // Validate all cross-words
     for (const tile of tiles) {
       const crossDirection = direction === 'horizontal' ? 'vertical' : 'horizontal';
       const crossWord = getWordAt(board, tile.row, tile.col, crossDirection, placedMap);
       
       if (crossWord && crossWord.length > 1 && !theGADDAG.contains(crossWord)) {
         return false;
       }
     }
     
     return true;
   }
   
   function getWordAt(board, row, col, direction, placedMap) {
     // Find start of word
     let startRow = row, startCol = col;
     
     if (direction === 'horizontal') {
       while (startCol > 0) {
         const letter = getLetterAt(board, startRow, startCol - 1, placedMap);
         if (letter === null) break;
         startCol--;
       }
     } else {
       while (startRow > 0) {
         const letter = getLetterAt(board, startRow - 1, startCol, placedMap);
         if (letter === null) break;
         startRow--;
       }
     }
   
     // Build word
     let word = '';
     let r = startRow, c = startCol;
     
     while (r < 15 && c < 15) {
       const letter = getLetterAt(board, r, c, placedMap);
       if (letter === null) break;
       
       word += letter;
       
       if (direction === 'horizontal') c++;
       else r++;
     }
     
     return word;
   }
   
   function getLetterAt(board, row, col, placedMap) {
     const key = `${row},${col}`;
     if (placedMap && placedMap.has(key)) {
       return placedMap.get(key);
     }
     return board[row][col];
   }
   
   function isConnectedToBoard(board, tiles) {
     for (const tile of tiles) {
       const { row, col } = tile;
       const adjacent = [
         [row - 1, col], [row + 1, col],
         [row, col - 1], [row, col + 1]
       ];
       
       for (const [r, c] of adjacent) {
         if (inBounds(r, c) && board[r][c] !== null) {
           return true;
         }
       }
     }
     return false;
   }
   
   function calculateScore(board, tiles, multipliers) {
     if (!tiles || !tiles.length) return 0;
     
     let mainWordScore = 0;
     let wordMultiplier = 1;
     const placedTiles = new Map();
     
     // Map placed tiles
     for (const tile of tiles) {
       placedTiles.set(`${tile.row},${tile.col}`, tile);
     }
     
     // Calculate main word score
     const direction = tiles.length > 1 && tiles[0].row === tiles[1].row ? 'horizontal' : 'vertical';
     const mainWord = getWordAt(board, tiles[0].row, tiles[0].col, direction, 
       new Map(tiles.map(t => [`${t.row},${t.col}`, t.letter])));
     
     // Score each letter in the main word
     let wordStart = findWordStart(board, tiles[0].row, tiles[0].col, direction, placedTiles);
     let [r, c] = wordStart;
     
     for (let i = 0; i < mainWord.length; i++) {
       const key = `${r},${c}`;
       let letterScore = letterScores[mainWord[i]] || 1;
       
       // Apply multipliers only for newly placed tiles
       if (placedTiles.has(key)) {
         const tile = placedTiles.get(key);
         if (tile.isBlank) letterScore = 0;
         
         const mult = multipliers[r][c];
         if (mult === 1) letterScore *= 2; // Double letter
         else if (mult === 2) letterScore *= 3; // Triple letter
         else if (mult === 3) wordMultiplier *= 2; // Double word
         else if (mult === 4) wordMultiplier *= 3; // Triple word
       }
       
       mainWordScore += letterScore;
       [r, c] = step(r, c, direction);
     }
     
     mainWordScore *= wordMultiplier;
     
     // Calculate cross-word scores
     let crossWordScore = 0;
     const crossDirection = direction === 'horizontal' ? 'vertical' : 'horizontal';
     
     for (const tile of tiles) {
       const crossWord = getWordAt(board, tile.row, tile.col, crossDirection, 
         new Map(tiles.map(t => [`${t.row},${t.col}`, t.letter])));
       
       if (crossWord && crossWord.length > 1) {
         let crossScore = 0;
         let crossWordMult = 1;
         
         const crossStart = findWordStart(board, tile.row, tile.col, crossDirection, placedTiles);
         let [cr, cc] = crossStart;
         
         for (let i = 0; i < crossWord.length; i++) {
           const key = `${cr},${cc}`;
           let letterScore = letterScores[crossWord[i]] || 1;
           
           if (placedTiles.has(key)) {
             const placedTile = placedTiles.get(key);
             if (placedTile.isBlank) letterScore = 0;
             
             const mult = multipliers[cr][cc];
             if (mult === 1) letterScore *= 2;
             else if (mult === 2) letterScore *= 3;  
             else if (mult === 3) crossWordMult *= 2;
             else if (mult === 4) crossWordMult *= 3;
           }
           
           crossScore += letterScore;
           [cr, cc] = step(cr, cc, crossDirection);
         }
         
         crossWordScore += crossScore * crossWordMult;
       }
     }
     
     // Add bingo bonus
     let totalScore = mainWordScore + crossWordScore;
     if (tiles.length === 7) {
       totalScore += 50;
     }
     
     return totalScore;
   }
   
   function findWordStart(board, row, col, direction, placedTiles) {
     let startRow = row, startCol = col;
     
     if (direction === 'horizontal') {
       while (startCol > 0) {
         const prevKey = `${startRow},${startCol - 1}`;
         const hasPlaced = placedTiles.has(prevKey);
         const hasExisting = board[startRow][startCol - 1] !== null;
         if (!hasPlaced && !hasExisting) break;
         startCol--;
       }
     } else {
       while (startRow > 0) {
         const prevKey = `${startRow - 1},${startCol}`;
         const hasPlaced = placedTiles.has(prevKey);
         const hasExisting = board[startRow - 1][startCol] !== null;
         if (!hasPlaced && !hasExisting) break;
         startRow--;
       }
     }
     
     return [startRow, startCol];
   }
   
   module.exports = {
     generateMoves,
     validateMove,
     isConnectedToBoard,
     isBoardEmpty,
     calculateScore
   };