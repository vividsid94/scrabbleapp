const { generateMoves } = require('./netlify_functions/generateMoves');

function printMoves(label, moves, expectedWords = []) {
  console.log(`\n${label}`);
  if (expectedWords.length) {
    expectedWords.forEach(word => {
      const found = moves.some(m => m.word === word);
      console.log(found ? `✅ Found: ${word}` : `❌ Missing: ${word}`);
    });
  }
  console.log(`Total moves: ${moves.length}`);
  moves.slice(0, 5).forEach((move, i) => {
    console.log(`${i + 1}. ${move.word} at (${move.startRow},${move.startCol}) ${move.direction} - ${move.score} points`);
  });
  if (moves.length > 5) console.log(`...and ${moves.length - 5} more`);
}

// 1. First Move (Empty Board)
const emptyBoard = Array(15).fill(null).map(() => Array(15).fill(null));
const rack1 = ['C', 'A', 'T', 'S', 'E', 'R', 'N'];
const moves1 = generateMoves(emptyBoard, rack1);
printMoves('Test 1: First Move (Empty Board)', moves1, ['CAT', 'CATS', 'EARN', 'SCAN']);

// 2. Simple Extension
const board2 = Array(15).fill(null).map(() => Array(15).fill(null));
board2[7][7] = 'C';
board2[7][8] = 'A';
board2[7][9] = 'T';
const rack2 = ['S', 'E', 'D'];
const moves2 = generateMoves(board2, rack2);
printMoves('Test 2: Simple Extension', moves2, ['CATS', 'CAT', 'SCAT']);

// 3. Prefix/Suffix
const board3 = Array(15).fill(null).map(() => Array(15).fill(null));
board3[7][7] = 'A';
board3[7][8] = 'T';
const rack3 = ['C', 'S'];
const moves3 = generateMoves(board3, rack3);
printMoves('Test 3: Prefix/Suffix', moves3, ['CAT', 'SAT']);

// 4. Parallel Play
const board4 = Array(15).fill(null).map(() => Array(15).fill(null));
board4[7][7] = 'C';
board4[7][8] = 'A';
board4[7][9] = 'T';
const rack4 = ['D', 'O', 'G'];
const moves4 = generateMoves(board4, rack4);
printMoves('Test 4: Parallel Play', moves4, ['DOG']);

// 5. Hook
const board5 = Array(15).fill(null).map(() => Array(15).fill(null));
board5[7][7] = 'A';
board5[7][8] = 'T';
const rack5 = ['C'];
const moves5 = generateMoves(board5, rack5);
printMoves('Test 5: Hook', moves5, ['CAT']);

// 6. Blank Tile
const board6 = Array(15).fill(null).map(() => Array(15).fill(null));
const rack6 = ['C', 'A', 'T', '?', 'S', 'E', 'R'];
const moves6 = generateMoves(board6, rack6);
printMoves('Test 6: Blank Tile', moves6, ['CATS', 'SCAR', 'CARE']);

// 7. No Valid Moves
const board7 = Array(15).fill(null).map(() => Array(15).fill('Z'));
const rack7 = ['Q', 'X', 'J'];
const moves7 = generateMoves(board7, rack7);
printMoves('Test 7: No Valid Moves', moves7);

// 8. End-Game (Single Tile Left)
const board8 = Array(15).fill(null).map(() => Array(15).fill(null));
board8[7][7] = 'A';
board8[7][8] = 'T';
const rack8 = ['S'];
const moves8 = generateMoves(board8, rack8);
printMoves('Test 8: End-Game (Single Tile Left)', moves8, ['SAT']);

// 9. Cross-Word Validation
const board9 = Array(15).fill(null).map(() => Array(15).fill(null));
board9[7][7] = 'A';
board9[8][7] = 'T';
const rack9 = ['S'];
const moves9 = generateMoves(board9, rack9);
printMoves('Test 9: Cross-Word Validation', moves9, ['SAT']);

console.log('\nAll tests completed!'); 