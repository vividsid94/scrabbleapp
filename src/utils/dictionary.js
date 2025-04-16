// This is a simple implementation. In a real app, you'd want to use a proper dictionary API
// or a pre-loaded word list.

const validWords = new Set([
  // Add your dictionary words here
  // For now, we'll just add some common words as an example
  'HELLO', 'WORLD', 'SCRABBLE', 'GAME', 'PLAY', 'WORD', 'TILE', 'RACK', 'BOARD',
  'SCORE', 'POINTS', 'LETTER', 'ALPHABET', 'DICTIONARY', 'VALID', 'MOVE', 'CHECK'
]);

export async function isValidWord(word) {
  // In a real implementation, you'd want to:
  // 1. Use a proper dictionary API
  // 2. Cache results
  // 3. Handle network errors
  return validWords.has(word.toUpperCase());
} 