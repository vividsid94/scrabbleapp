/**
 * Scrabble Top Moves Generator
 * 
 * This module implements a Netlify serverless function that finds the top scoring
 * valid moves for a given board state and available letters.
 * 
 * @module getTopMoves
 */

const { normalizeBoard } = require('./normalizeBoard');
const loadDictionary = require('./loadDictionary');
const { generateMoves, validateMove } = require('./generateMoves');

/** @type {import('./loadDictionary').GADDAG} */
let cachedDictionary = null;

/**
 * Converts row/column coordinates to Scrabble-style coordinates (e.g., "8H").
 * 
 * @param {number} row - Row index (0-14)
 * @param {number} col - Column index (0-14)
 * @returns {string} Scrabble coordinate (e.g., "8H")
 */
function getScrabbleCoordinates(row, col) {
  const letters = 'ABCDEFGHIJKLMNO';
  return `${row + 1}${letters[col]}`;
}

/**
 * Netlify serverless function handler for getting top scoring moves.
 * 
 * @param {Object} event - The Netlify function event object
 * @param {string} event.httpMethod - The HTTP method of the request
 * @param {string} event.body - The request body as a JSON string
 * @returns {Object} Response object with status code and body
 * 
 * @example
 * // Example request body:
 * {
 *   "board": [["A", "B", null, ...], ...], // 15x15 array
 *   "letters": ["A", "B", "C", "D", "E", "F", "G"] // Up to 7 letters
 * }
 * 
 * // Example response:
 * {
 *   "statusCode": 200,
 *   "body": {
 *     "moves": [
 *       {
 *         "word": "HELLO",
 *         "score": 8,
 *         "tiles": [{row: 7, col: 7, letter: "H", isNew: true}, ...],
 *         "direction": "right",
 *         "startPosition": "8H"
 *       },
 *       // ... up to 10 moves
 *     ]
 *   }
 * }
 */
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
    
    // Load dictionary if not already cached
    if (!cachedDictionary) {
      console.log('Loading dictionary...');
      cachedDictionary = await loadDictionary();
      console.log('Dictionary loaded successfully');
    }

    const allMoves = generateMoves(board, letters, [], cachedDictionary);

    if (!Array.isArray(allMoves)) {
      throw new Error('generateMoves did not return an array');
    }

    // Don't sort here - let the frontend handle sorting with leave values
    const validMoves = [];
    for (const move of allMoves) {
      if (!move || !move.tiles) {
        console.warn('Invalid move object:', move);
        continue;
      }
      if (validateMove(board, move.tiles, cachedDictionary)) {
        // Find the starting position (first tile in the move)
        const startTile = move.tiles.reduce((first, current) => {
          if (!first) return current;
          if (move.direction === 'right') {
            return current.col < first.col ? current : first;
          } else {
            return current.row < first.row ? current : first;
          }
        }, null);

        validMoves.push({
          word: move.word,
          score: move.score,
          tiles: move.tiles,
          direction: move.direction,
          startPosition: getScrabbleCoordinates(startTile.row, startTile.col)
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        moves: validMoves // Return ALL valid moves, let frontend sort them
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