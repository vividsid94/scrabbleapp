import { parseGCG } from './src/utils/gcgParser.js';

// Test the exact data that getMove would receive
const testMoves = [
  '>Josh: ?DFGOTU H7 FUG +14 14',
  '>Noah: ACEEHIT I7 AHI +23 23', 
  '>Josh: ?ADEOOT J1 TAbOOED +68 82',
  '>Josh: EEOPRTU 1H OU.PETER +149 231',
  '>Josh: EEOPRTU --  -149 82'
];

console.log('=== Testing Parser with Individual Moves ===\n');

testMoves.forEach((moveString, index) => {
  console.log(`Move ${index + 1}: "${moveString}"`);
  
  try {
    const parsedMoves = parseGCG(moveString);
    console.log('Parsed result:', parsedMoves);
    
    if (parsedMoves.length > 0) {
      const move = parsedMoves[0];
      console.log('  player:', move.player);
      console.log('  rack:', move.rack);
      console.log('  location:', move.location);
      console.log('  word:', move.word);
      console.log('  score:', move.score);
      console.log('  total:', move.total);
      
      // Simulate what getMove would do
      let play;
      if (move.location === '--') {
        play = "Challenge";
      } else if (move.word) {
        play = move.location + " " + move.word;
      } else {
        play = move.location || "Pass";
      }
      console.log('  getMove would return:', play);
    }
  } catch (error) {
    console.log('  ERROR:', error.message);
  }
  
  console.log('');
}); 