/* =============================================================
   Scrabble move generator (with perpendicular plays + blank tiles)
   ============================================================= */

   const { letterScores, boardMultipliers } = require('./gameLogic');

   /**
    * Return every empty square that touches at least one tile already on the board.
    * If the board is empty, the centre (7,7) is the single anchor.
    */
   function getAnchors(board) {
     if (isBoardEmpty(board)) return [{ row: 7, col: 7 }];
   
     const anchors = [];
     for (let r = 0; r < 15; r++) {
       for (let c = 0; c < 15; c++) {
         if (board[r][c] !== null) continue; // skip occupied
         if (
           (r > 0 && board[r - 1][c] !== null) ||
           (r < 14 && board[r + 1][c] !== null) ||
           (c > 0 && board[r][c - 1] !== null) ||
           (c < 14 && board[r][c + 1] !== null)
         ) {
           anchors.push({ row: r, col: c });
         }
       }
     }
     return anchors;
   }
   
   /* -------------------------------------------------------------
      Main entry
      ------------------------------------------------------------- */
   function generateMoves(board, rack, anchors = [], trie) {
     const anchorList = anchors.length ? anchors : getAnchors(board);
     const moves = [];
   
     // Opening move handled separately
     if (isBoardEmpty(board)) {
       generateFirstMove(board, rack, trie, moves);
       return moves;
     }
   
     // Build cross‑check maps once per board
     const horizCross = new Map();
     const vertCross = new Map();
     for (let r = 0; r < 15; r++) {
       for (let c = 0; c < 15; c++) {
         if (board[r][c] !== null) continue;
         horizCross.set(`${r},${c}`, getValidLetters(board, r, c, 'down', trie));
         vertCross.set(`${r},${c}`, getValidLetters(board, r, c, 'right', trie));
       }
     }
   
     // Explore from every anchor in both directions
     for (const anchor of anchorList) {
       generateMovesInDirection(board, rack, anchor, 'right', trie, moves, horizCross);
       generateMovesInDirection(board, rack, anchor, 'down', trie, moves, vertCross);
     }
   
     return moves;
   }
   
   /* -------------------------------------------------------------
      Opening move – must cross the centre
      ------------------------------------------------------------- */
   function generateFirstMove(board, rack, trie, moves) {
     const centerRow = 7;
     const centerCol = 7;
     const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
   
     // Horizontal through centre
     for (let startCol = Math.max(0, centerCol - 6); startCol <= centerCol; startCol++) {
       const maxLen = Math.min(15 - startCol, 7);
       if (centerCol < startCol || centerCol >= startCol + maxLen) continue;
   
       generateAllWords(
         board, [...rack], trie.root, '',
         centerRow, startCol, 'right', moves, trie,
         [], true, centerCol, null, new Map()
       );
     }
   
     // Vertical through centre
     for (let startRow = Math.max(0, centerRow - 6); startRow <= centerRow; startRow++) {
       const maxLen = Math.min(15 - startRow, 7);
       if (centerRow < startRow || centerRow >= startRow + maxLen) continue;
   
       generateAllWords(
         board, [...rack], trie.root, '',
         startRow, centerCol, 'down', moves, trie,
         [], true, centerRow, null, new Map()
       );
     }
   
     // Single‑letter centre plays (blank aware)
     const uniqueSymbols = new Set(rack);
     const alphabetArr = alphabet.split('');
   
     for (const sym of uniqueSymbols) {
       if (sym === '*') {
         for (const letter of alphabetArr) {
           const node = trie.root.children.get(letter);
           if (node && node.isTerminal) {
             const tile = { row: centerRow, col: centerCol, letter, isNew: true, isBlank: true };
             const score = calculateScore(board, [tile], boardMultipliers, trie);
             moves.push({ word: letter, tiles: [tile], score, direction: 'right' });
           }
         }
       } else {
         const letter = sym;
         const node = trie.root.children.get(letter);
         if (node && node.isTerminal) {
           const tile = { row: centerRow, col: centerCol, letter, isNew: true, isBlank: false };
           const score = calculateScore(board, [tile], boardMultipliers, trie);
           moves.push({ word: letter, tiles: [tile], score, direction: 'right' });
         }
       }
     }
   }
   
   /* -------------------------------------------------------------
      Directional search from a single anchor
      ------------------------------------------------------------- */
   function generateMovesInDirection(board, rack, anchor, direction, trie, moves, crossChecks) {
     const { row, col } = anchor;
     const maxBackup = Math.min(7, direction === 'right' ? col : row);
   
     for (let offset = 0; offset <= maxBackup; offset++) {
       const startRow = direction === 'right' ? row : row - offset;
       const startCol = direction === 'right' ? col - offset : col;
       if (startRow < 0 || startCol < 0) continue;
   
       // Don’t begin inside an existing word
       const beforeRow = direction === 'right' ? startRow : startRow - 1;
       const beforeCol = direction === 'right' ? startCol - 1 : startCol;
       if (beforeRow >= 0 && beforeCol >= 0 && board[beforeRow][beforeCol] !== null) continue;
   
       // Consume forced prefix
       let node = trie.root;
       let valid = true;
       let r = startRow;
       let c = startCol;
       let prefix = '';
   
       while (r < 15 && c < 15) {
         const cell = board[r][c];
         if (cell === null) break;
         if (!node.children.has(cell)) { valid = false; break; }
         node = node.children.get(cell);
         prefix += cell;
         if (direction === 'right') c++; else r++;
       }
       if (!valid) continue;
   
       generateAllWords(
         board, [...rack], node, prefix, r, c, direction,
         moves, trie, [], false, null, null, crossChecks
       );
     }
   }
   
   /* -------------------------------------------------------------
      Recursively extend words, blank‑aware
      ------------------------------------------------------------- */
   function generateAllWords(
     board, rack, node, wordSoFar, row, col, direction,
     moves, trie, placedTiles = [], isFirstMove = false,
     centerToCheck = null, anchor = null, crossChecks = null
   ) {
     // off‑board
     if (row >= 15 || col >= 15 || row < 0 || col < 0) return;
   
     const existingLetter = board[row][col];
     const nextRow = direction === 'right' ? row : row + 1;
     const nextCol = direction === 'right' ? col + 1 : col;
   
     if (existingLetter !== null) {
       const nextNode = node.children.get(existingLetter);
       if (!nextNode) return;
       generateAllWords(board, rack, nextNode, wordSoFar + existingLetter,
         nextRow, nextCol, direction,
         moves, trie, placedTiles, isFirstMove, centerToCheck, anchor, crossChecks);
       return;
     }
   
     /* Check if the current prefix is a complete word */
     if (node.isTerminal && wordSoFar.length > 1) {
       const connected = isFirstMove ? isCoveringCenter(placedTiles, centerToCheck)
                                     : isConnected(board, placedTiles);
       if (connected && validateMove(board, placedTiles, trie) && !moveExists(moves, placedTiles)) {
         moves.push({
           word: wordSoFar,
           tiles: [...placedTiles],
           score: calculateScore(board, placedTiles, boardMultipliers, trie),
           direction
         });
       }
     }
   
     // cross‑check letters allowed here
     const key = `${row},${col}`;
     const allowed = crossChecks ? crossChecks.get(key) : null; // null ⇒ all allowed
     const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
   
     for (let i = 0; i < rack.length; i++) {
       const sym = rack[i];
   
       if (sym === '*') { // blank expands to every letter
         for (const letter of alphabet) {
           if (allowed && allowed.size && !allowed.has(letter.toLowerCase())) continue;
           const nextNode = node.children.get(letter);
           if (!nextNode) continue;
           placeTile(letter, true, i, nextNode);
         }
         continue; // finished exploring blank expansions
       }
   
       const letter = sym;
       if (allowed && allowed.size && !allowed.has(letter.toLowerCase())) continue;
       const nextNode = node.children.get(letter);
       if (!nextNode) continue;
       placeTile(letter, false, i, nextNode);
     }
   
     /* helper to recurse after choosing a letter */
     function placeTile(letter, cameFromBlank, rackIndex, nextNode) {
       const newRack = rack.slice();
       newRack.splice(rackIndex, 1);
   
       const newTile = { row, col, letter, isNew: true, isBlank: cameFromBlank };
   
       generateAllWords(
         board, newRack, nextNode, wordSoFar + letter,
         nextRow, nextCol, direction,
         moves, trie, [...placedTiles, newTile],
         isFirstMove, centerToCheck, anchor, crossChecks
       );
     }
   }
   
   /* -------------------------------------------------------------
      Cross‑check helper – returns set of lowercase letters allowed, or null (all)
      ------------------------------------------------------------- */
   function getValidLetters(board, row, col, direction, trie) {
     if (board[row][col] !== null) return new Set();
   
     const hasPerpTile = direction === 'right'
       ? (row > 0 && board[row - 1][col] !== null) || (row < 14 && board[row + 1][col] !== null)
       : (col > 0 && board[row][col - 1] !== null) || (col < 14 && board[row][col + 1] !== null);
   
     if (!hasPerpTile) return null;
   
     const valid = new Set();
     const alphabet = 'abcdefghijklmnopqrstuvwxyz';
   
     for (const letter of alphabet) {
       if (isValidCrossWord(board, row, col, letter, direction === 'right' ? 'down' : 'right', trie)) {
         valid.add(letter);
       }
     }
     return valid;
   }
   
   /* -------------------------------------------------------------
      Supporting validators & utilities (mostly unchanged)
      ------------------------------------------------------------- */
   function isValidCrossWord(board, row, col, letter, crossDir, trie) {
     const hasAdjacent = crossDir === 'down'
       ? (row > 0 && board[row - 1][col] !== null) || (row < 14 && board[row + 1][col] !== null)
       : (col > 0 && board[row][col - 1] !== null) || (col < 14 && board[row][col + 1] !== null);
     if (!hasAdjacent) return true;
   
     let startRow = row, startCol = col;
     if (crossDir === 'down') {
       while (startRow > 0 && board[startRow - 1][col] !== null) startRow--; }
     else {
       while (startCol > 0 && board[row][startCol - 1] !== null) startCol--; }
   
     let word = '';
     let r = startRow, c = startCol;
     while (r < 15 && c < 15) {
       let ch;
       if (r === row && c === col) ch = letter.toUpperCase();
       else {
         ch = board[r][c];
         if (ch === null) break;
       }
       word += ch;
       if (crossDir === 'down') r++; else c++;
     }
     return word.length <= 1 || trie.contains(word);
   }
   
   function validateMove(board, tiles, trie) {
     if (!tiles.length) return false;
     if (!areInLine(tiles)) return false;
     if (!isBoardEmpty(board) && !isConnected(board, tiles)) return false;
   
     const words = getAllWords(board, tiles);
     return words.every(w => trie.contains(w));
   }
   
   function areInLine(tiles) {
     if (tiles.length <= 1) return true;
     const sameRow = tiles.every(t => t.row === tiles[0].row);
     const sameCol = tiles.every(t => t.col === tiles[0].col);
     if (!sameRow && !sameCol) return false;
     const sorted = [...tiles].sort((a, b) => sameRow ? a.col - b.col : a.row - b.row);
     for (let i = 1; i < sorted.length; i++) {
       if (sameRow && sorted[i].col !== sorted[i - 1].col + 1) return false;
       if (sameCol && sorted[i].row !== sorted[i - 1].row + 1) return false;
     }
     return true;
   }
   
   function isConnected(board, tiles) {
     if (isBoardEmpty(board)) return tiles.some(t => t.row === 7 && t.col === 7);
     return tiles.some(({ row, col }) => (
       (row > 0 && board[row - 1][col] !== null) ||
       (row < 14 && board[row + 1][col] !== null) ||
       (col > 0 && board[row][col - 1] !== null) ||
       (col < 14 && board[row][col + 1] !== null)
     ));
   }
   
   function isBoardEmpty(board) {
     for (let r = 0; r < 15; r++) {
       for (let c = 0; c < 15; c++) {
         if (board[r][c] !== null) return false;
       }
     }
     return true;
   }
   
   function isCoveringCenter(tiles, centerPos) {
     return tiles.some(t => (t.row === 7 && t.col === 7) ||
       (centerPos !== null && ((t.row === 7 && t.col === centerPos) || (t.col === 7 && t.row === centerPos))));
   }
   
   /* ---------------- Scoring ---------------- */
   function calculateScore(board, tiles, boardMultipliers, trie) {
     let total = 0;
     const dir = tiles.length === 1 ? 'both' : (tiles[0].row === tiles[1].row ? 'right' : 'down');
   
     if (dir === 'right' || dir === 'both') total += calculateWordScore(board, tiles, 'right', boardMultipliers);
     if (dir === 'down'  || dir === 'both') total += calculateWordScore(board, tiles, 'down', boardMultipliers);
   
     for (const tile of tiles) {
       const crossDir = dir === 'right' ? 'down' : dir === 'down' ? 'right' : null;
       if (!crossDir) continue;
       total += calculateWordScore(board, [tile], crossDir, boardMultipliers, true);
     }
   
     if (tiles.length === 7) total += 50; // bingo
     return total;
   }
   
   function calculateWordScore(board, tiles, direction, boardMultipliers, isCross = false) {
     let startRow = tiles[0].row, startCol = tiles[0].col;
     if (direction === 'right') while (startCol > 0 && board[startRow][startCol - 1] !== null) startCol--; else
       while (startRow > 0 && board[startRow - 1][startCol] !== null) startRow--;
   
     let wordScore = 0, wordMult = 1, r = startRow, c = startCol, length = 0;
     while (r < 15 && c < 15) {
       const placed = tiles.find(t => t.row === r && t.col === c);
       let letter;
       if (placed) {
         letter = placed.letter;
         const base = placed.isBlank ? 0 : (letterScores[letter] || 1);
         const mult = boardMultipliers[r][c];
         if (mult === 1) wordScore += base * 2; else if (mult === 2) wordScore += base * 3; else wordScore += base;
         if (mult === 3) wordMult *= 2; else if (mult === 4) wordMult *= 3;
       } else {
         letter = board[r][c];
         if (letter === null) break;
         wordScore += letterScores[letter] || 1;
       }
       length++;
       if (direction === 'right') c++; else r++;
     }
     if (length <= 1) return 0;
     return wordScore * wordMult;
   }
   
   /* ---------------- Word extraction helpers ---------------- */
   function getAllWords(board, tiles) {
     const words = [];
     if (!tiles.length) return words;
     const dir = tiles.length === 1 ? 'both' : (tiles[0].row === tiles[1].row ? 'right' : 'down');
   
     if (dir === 'right' || dir === 'both') {
       const w = getWordAt(board, tiles[0].row, tiles[0].col, 'right', tiles);
       if (w && w.length > 1) words.push(w);
     }
     if (dir === 'down' || dir === 'both') {
       const w = getWordAt(board, tiles[0].row, tiles[0].col, 'down', tiles);
       if (w && w.length > 1) words.push(w);
     }
   
     for (const t of tiles) {
       const crossDir = dir === 'right' ? 'down' : dir === 'down' ? 'right' : 'both';
       if (crossDir === 'right' || crossDir === 'both') {
         const w = getWordAt(board, t.row, t.col, 'right', tiles);
         if (w && w.length > 1 && !words.includes(w)) words.push(w);
       }
       if (crossDir === 'down' || crossDir === 'both') {
         const w = getWordAt(board, t.row, t.col, 'down', tiles);
         if (w && w.length > 1 && !words.includes(w)) words.push(w);
       }
     }
     return words;
   }
   
   function getWordAt(board, row, col, direction, placed) {
     let startRow = row, startCol = col;
     if (direction === 'right') while (startCol > 0 && getLetterAt(board, startRow, startCol - 1, placed) !== null) startCol--; else
       while (startRow > 0 && getLetterAt(board, startRow - 1, startCol, placed) !== null) startRow--;
   
     let word = '';
     let r = startRow, c = startCol;
     while (r < 15 && c < 15) {
       const letter = getLetterAt(board, r, c, placed);
       if (letter === null) break;
       word += letter;
       if (direction === 'right') c++; else r++;
     }
     return word;
   }
   
   function getLetterAt(board, row, col, placed) {
     const p = placed.find(t => t.row === row && t.col === col);
     if (p) return p.letter;
     return board[row][col];
   }
   
   /* ---------------- Duplicate move detection ---------------- */
   function moveExists(moves, tiles) {
     const key = [...tiles].sort((a, b) => a.row - b.row || a.col - b.col)
                           .map(t => `${t.row},${t.col},${t.letter}${t.isBlank ? '?' : ''}`).join('|');
     return moves.some(m => [...m.tiles].sort((a, b) => a.row - b.row || a.col - b.col)
                                      .map(t => `${t.row},${t.col},${t.letter}${t.isBlank ? '?' : ''}`).join('|') === key);
   }
   
   /* -------------------------------------------------------------
      Exports
      ------------------------------------------------------------- */
   module.exports = {
     generateMoves,
     validateMove,
     isConnected,
     isBoardEmpty,
     calculateScore,
     getAllWords,
   };
   