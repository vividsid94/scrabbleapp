/* =============================================================
   Fixed Scrabble move generator (GADDAG-based)
   ============================================================= */

   const { letterScores, boardMultipliers } = require('./gameLogic');
   const loadDictionary = require('./loadDictionary');

   const theGADDAG = loadDictionary();
   const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
   const alphaArr = ALPHA.split('');
   
   function generateMoves(board, rack) {
     // Convert rack to array of objects with isBlank flag
     const rackArr = Array.isArray(rack) ? rack.map(l => ({
       letter: l.toUpperCase(),
       isBlank: l === '?' || l === '*'
     })) : rack.split('').map(l => ({
       letter: l.toUpperCase(),
       isBlank: l === '?' || l === '*'
     }));
   
     const moves = [];
     const moveSet = new Set(); // Track unique moves
     const crossChecks = computeCrossChecks(board);
   
     // First move special case - must start at H8 (7,7)
     if (isBoardEmpty(board)) {
       const centerRow = 7;  // H
       const centerCol = 7;  // 8
       generateMovesAt(board, rackArr, centerRow, centerCol, 'horizontal', moves, crossChecks, moveSet);
       generateMovesAt(board, rackArr, centerRow, centerCol, 'vertical', moves, crossChecks, moveSet);
       return moves;
     }
   
     // Regular moves - check every empty square
     for (let row = 0; row < 15; row++) {
       for (let col = 0; col < 15; col++) {
         if (board[row][col] === null) {
           // Check if this square can be an anchor (adjacent to existing tiles)
           if (hasAdjacentTile(board, row, col)) {
             generateMovesAt(board, rackArr, row, col, 'horizontal', moves, crossChecks, moveSet);
             generateMovesAt(board, rackArr, row, col, 'vertical', moves, crossChecks, moveSet);
           }
         }
       }
     }
   
     return moves;
   }
   
   function generateMovesAt(board, rack, anchorRow, anchorCol, direction, moves, crossChecks, moveSet) {
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
         generateWordsFromPosition(board, rack, anchorRow, startCol, direction, moves, crossChecks, moveSet);
     }
     } else {
       for (let startRow = topLimit; startRow <= anchorRow; startRow++) {
         generateWordsFromPosition(board, rack, startRow, anchorCol, direction, moves, crossChecks, moveSet);
     }
   }
   }
   
   function generateWordsFromPosition(board, rack, startRow, startCol, direction, moves, crossChecks, moveSet) {
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
       crossChecks,
       prefix.length > 0, // isInSuffixMode
       moveSet
     );
   }
   
   function extendWords(node, board, rack, wordSoFar, tilesPlaced, row, col, direction, moves, crossChecks, isInSuffixMode, moveSet) {
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
       const moveKey = `${move.word}-${move.startRow},${move.startCol}-${move.direction}`;
       
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
           crossChecks,
           isInSuffixMode,
           moveSet
         );
       }
       return;
     }
   
     // Get cross-check constraints for this position
     const crossCheckKey = `${row},${col}`;
     const crossCheck = crossChecks.get(crossCheckKey);
   
     // Try placing tiles from rack
     for (let i = 0; i < rack.length; i++) {
       const tile = rack[i];
       if (!tile) continue;
   
       const newRack = rack.slice();
       newRack[i] = null;
   
       const letters = tile.isBlank ? alphaArr : [tile.letter];
   
       for (const letter of letters) {
         // Check cross-check constraints
         if (crossCheck && crossCheck[direction] && !crossCheck[direction].has(letter.toLowerCase())) {
           continue;
         }
   
         if (!isInSuffixMode) {
           // In prefix mode - can continue in prefix or switch to suffix
           if (node[letter]) {
             const newTile = {
               row, col,
               letter,
               isNew: true,
               isBlank: tile.isBlank
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
               crossChecks,
               false,
               moveSet
           );
         }
   
           // Try switching to suffix mode
           if (node['^'] && node['^'][letter]) {
             const newTile = {
               row, col,
               letter,
               isNew: true,
               isBlank: tile.isBlank
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
               crossChecks,
               true,
               moveSet
         );
       }
         } else {
           // In suffix mode - can only continue in suffix
           if (node[letter]) {
             const newTile = {
               row, col,
               letter,
               isNew: true,
               isBlank: tile.isBlank
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
               crossChecks,
               true,
               moveSet
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
   
   function computeCrossChecks(board) {
     const map = new Map();
     
     for (let r = 0; r < 15; r++) {
       for (let c = 0; c < 15; c++) {
         if (board[r][c] !== null) continue;
         
         const key = `${r},${c}`;
         const horizontalChecks = getValidLetters(board, r, c, 'horizontal');
         const verticalChecks = getValidLetters(board, r, c, 'vertical');
   
         if (horizontalChecks || verticalChecks) {
           map.set(key, {
             horizontal: horizontalChecks,
             vertical: verticalChecks
           });
         }
       }
     }
     
     return map;
   }
   
   function getValidLetters(board, row, col, direction) {
     // Check if placing a tile here would form a cross-word
     const perpDirection = direction === 'horizontal' ? 'vertical' : 'horizontal';
     
     // Find if there are adjacent tiles in the perpendicular direction
     let hasPerpendicularTiles = false;
     if (perpDirection === 'horizontal') {
       hasPerpendicularTiles = (col > 0 && board[row][col - 1] !== null) || 
                              (col < 14 && board[row][col + 1] !== null);
     } else {
       hasPerpendicularTiles = (row > 0 && board[row - 1][col] !== null) || 
                              (row < 14 && board[row + 1][col] !== null);
     }
   
     if (!hasPerpendicularTiles) {
       return null; // No cross-word constraints
     }
   
     // Find valid letters that form valid cross-words
     const validLetters = new Set();
     
     for (const letter of ALPHA) {
       if (isValidCrossWord(board, row, col, letter, perpDirection)) {
         validLetters.add(letter.toLowerCase());
       }
     }
     
     return validLetters.size > 0 ? validLetters : null;
   }
   
   function isValidCrossWord(board, row, col, letter, direction) {
     // Temporarily place the letter and check if it forms a valid word
     const tempBoard = board.map(row => [...row]);
     tempBoard[row][col] = letter;
     
     // Find the complete word in the given direction
     let startRow = row, startCol = col;
     
     if (direction === 'vertical') {
       while (startRow > 0 && tempBoard[startRow - 1][col] !== null) {
         startRow--;
       }
       } else {
       while (startCol > 0 && tempBoard[row][startCol - 1] !== null) {
         startCol--;
       }
     }
   
     let word = '';
     let r = startRow, c = startCol;
     
     while (r < 15 && c < 15 && tempBoard[r][c] !== null) {
       word += tempBoard[r][c];
       if (direction === 'vertical') r++;
       else c++;
     }
   
     // Single letters are always valid
     if (word.length <= 1) return true;
     
     return theGADDAG.contains(word);
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