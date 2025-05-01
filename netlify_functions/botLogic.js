/**
 * Scrabble Bot Logic
 * 
 * This module implements a Netlify serverless function that acts as a Scrabble bot.
 * It takes a game board and available letters, then returns the highest-scoring valid move.
 * 
 * @module botLogic
 */

const { normalizeBoard } = require('./normalizeBoard');
const { loadDictionary } = require('./loadDictionary');
const { generateMoves } = require('./generateMoves');

/** @type {import('./trie').Trie} */
let cachedTrie = null;

/**
 * Netlify serverless function handler for the Scrabble bot.
 * 
 * @param {Object} event - The Netlify function event object
 * @param {string} event.httpMethod - The HTTP method of the request
 * @param {string} event.body - The request body as a JSON string
 * @returns {Object} Response object with status code and body
 * @throws {Error} If the request is invalid or processing fails
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
 *     "word": "HELLO",
 *     "score": 8,
 *     "tiles": [{row: 7, col: 7, letter: "H", isNew: true}, ...]
 *   }
 * }
 */
exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { board: rawBoard, letters } = JSON.parse(event.body || '{}');
    
    if (!Array.isArray(rawBoard) || rawBoard.length !== 15 || !Array.isArray(letters) || letters.length > 7) {
      throw new Error('Invalid input: board must be 15x15 array and letters must be array of up to 7 letters');
    }

    const board = normalizeBoard(rawBoard);
    
    // Load dictionary if not already cached
    if (!cachedTrie) {
      console.log('Loading dictionary...');
      cachedTrie = await loadDictionary();
      console.log('Dictionary loaded and cached');
    }

    const allMoves = generateMoves(board, letters, [], cachedTrie);
    const sortedMoves = allMoves.sort((a, b) => b.score - a.score);

    if (sortedMoves.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No valid move found' })
      };
    }

    const best = sortedMoves[0];
    return {
      statusCode: 200,
      body: JSON.stringify({
        word: best.word,
        score: best.score,
        tiles: best.tiles
      })
    };

  } catch (err) {
    console.error('❌ Bot error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: err.message,
        stack: err.stack
      })
    };
  }
};
