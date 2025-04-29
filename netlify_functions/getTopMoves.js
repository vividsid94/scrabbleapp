const { normalizeBoard } = require('./normalizeBoard');
const { findAnchors } = require('./findAnchors');
const { loadDictionary } = require('./loadDictionary');
const { generateMoves, validateMove } = require('./generateMoves');

// Helper function to convert row/col to scrabble coordinates
function getScrabbleCoordinates(row, col) {
  const letters = 'ABCDEFGHIJKLMNO';
  return `${row + 1}${letters[col]}`;
}

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (!event.body) {
      throw new Error('No request body provided');
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (e) {
      throw new Error('Invalid JSON in request body');
    }

    const { board: rawBoard, letters } = parsedBody;
    
    if (!rawBoard || !letters) {
      throw new Error('Missing required fields: board and letters');
    }

    if (!Array.isArray(rawBoard) || rawBoard.length !== 15) {
      throw new Error('Invalid board: must be a 15x15 array');
    }

    if (!Array.isArray(letters) || letters.length > 7) {
      throw new Error('Invalid letters: must be an array of up to 7 letters');
    }

    const board = normalizeBoard(rawBoard);
    const trie = await loadDictionary();
    const anchors = findAnchors(board);
    const allMoves = generateMoves(board, letters, anchors, trie);

    if (!Array.isArray(allMoves)) {
      throw new Error('generateMoves did not return an array');
    }

    const sortedMoves = allMoves.sort((a, b) => b.score - a.score);

    // Validate each move and keep only valid ones
    const validMoves = [];
    for (const move of sortedMoves) {
      if (!move || !move.tiles) {
        console.warn('Invalid move object:', move);
        continue;
      }
      if (validateMove(board, move.tiles, trie)) {
        validMoves.push(move);
      }
    }

    // Return top 10 moves
    const topMoves = validMoves.slice(0, 10).map(move => {
      // Find the starting position (first tile in the move)
      const startTile = move.tiles.reduce((first, current) => {
        if (!first) return current;
        if (move.direction === 'right') {
          return current.col < first.col ? current : first;
        } else {
          return current.row < first.row ? current : first;
        }
      }, null);

      return {
        word: move.word,
        score: move.score,
        tiles: move.tiles,
        direction: move.direction,
        startPosition: getScrabbleCoordinates(startTile.row, startTile.col)
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        moves: topMoves
      })
    };

  } catch (err) {
    console.error('❌ GetTopMoves error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: err.message,
        stack: err.stack
      })
    };
  }
}; 