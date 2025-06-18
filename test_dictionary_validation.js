const { generateMoves } = require('./netlify_functions/generateMoves');

// Test dictionary validation for single-tile plays
console.log('Test: Dictionary validation for single-tile plays');

// Create a board with words that can be extended
const board = Array(15).fill(null).map(() => Array(15).fill(null));

// Place "CAT" horizontally
board[7][5] = 'C';
board[7][6] = 'A';
board[7][7] = 'T';

// Place "DOG" vertically
board[5][9] = 'D';
board[6][9] = 'O';
board[7][9] = 'G';

console.log('Board setup:');
console.log('  CAT at row 7, cols 5-7');
console.log('  DOG at col 9, rows 5-7');

// Test with single tile 'S' - should form "SCAT" (valid word)
const rack1 = ['S'];
const moves1 = generateMoves(board, rack1);

console.log(`\nFound ${moves1.length} moves with 'S':`);
const scatMove = moves1.find(m => m.word === 'SCAT');
if (scatMove) {
  console.log('✅ Found "SCAT" move:', scatMove);
} else {
  console.log('❌ "SCAT" move not found');
}

// Test with single tile 'X' - should not form valid words
const rack2 = ['X'];
const moves2 = generateMoves(board, rack2);

console.log(`\nFound ${moves2.length} moves with 'X':`);
if (moves2.length === 0) {
  console.log('✅ Correctly found no valid moves with "X"');
} else {
  console.log('❌ Unexpected moves found with "X":', moves2);
}

// Test with single tile 'E' - should form "CAT" + "E" = "CATE" (not a valid word)
const rack3 = ['E'];
const moves3 = generateMoves(board, rack3);

console.log(`\nFound ${moves3.length} moves with 'E':`);
const cateMove = moves3.find(m => m.word === 'CATE');
if (cateMove) {
  console.log('❌ Found invalid "CATE" move:', cateMove);
} else {
  console.log('✅ Correctly rejected invalid "CATE" move');
}

// Test with single tile 'S' at position that would form "SCAT"
const rack4 = ['S'];
const moves4 = generateMoves(board, rack4);

console.log(`\nAll moves with 'S':`);
moves4.forEach((move, index) => {
  console.log(`${index + 1}. ${move.word} at (${move.startRow},${move.startCol}) ${move.direction} - ${move.score} points`);
});

console.log('\nTest completed!'); 