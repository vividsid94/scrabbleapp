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
const fs = require('fs');
const path = require('path');

// Cache for leave values
let leaveValues = {};
try {
  const leavesPath = path.join(__dirname, 'leaves.json');
  const leaves = JSON.parse(fs.readFileSync(leavesPath, 'utf8'));
  console.log('Loaded leaves from JSON file, count:', Object.keys(leaves).length);
  // Convert leaves to the same format as getLeaveValues
  leaveValues = leaves;
} catch (err) {
  console.error('Failed to load leaves:', err);
  leaveValues = {};
}

/**
 * Get leave value for a given leave string
 */
const getLeaveValue = (leave) => {
  const value = leaveValues[leave];
  if (value === undefined) {
    console.log('Leave not found:', leave);
    return 0;
  }
  return value;
};

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
 *   "letters": ["A", "B", "C", "D", "E", "F", "G"], // Up to 7 letters
 *   "pool": ["A", "B", "C", ...] // Optional: Available tiles in the pool
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

    const { board: rawBoard, letters, pool = [] } = JSON.parse(event.body || '{}');
    
    if (!Array.isArray(rawBoard) || rawBoard.length !== 15 || !Array.isArray(letters) || letters.length > 7) {
      throw new Error('Invalid input: board must be 15x15 array and letters must be array of up to 7 letters');
    }

    const board = normalizeBoard(rawBoard);
    
    // Load dictionary
    console.log('Loading dictionary...');
    const trie = await loadDictionary();
    console.log('Dictionary loaded');

    // Get all possible moves
    const allMoves = generateMoves(board, letters, [], trie);

    // Calculate leave for regular moves
    for (const move of allMoves) {
      const rackCopy = [...letters];
      // Remove tiles used in the move
      for (const tile of move.tiles) {
        if (tile.isNew) {
          const tileIndex = tile.isBlank ? rackCopy.indexOf('*') : rackCopy.indexOf(tile.letter);
          if (tileIndex !== -1) {
            rackCopy.splice(tileIndex, 1);
          }
        }
      }
      // Sort remaining tiles to create leave
      move.leave = rackCopy.sort().join('');
    }

    // Generate exchange moves
    const exchangeMoves = [];
    // Generate all possible combinations of 1-7 tiles
    for (let i = 1; i <= Math.min(letters.length, 7); i++) {
      const generateCombos = (current, start, remaining) => {
        if (current.length === i) {
          // For exchanges, the leave is what we keep (remaining)
          const leave = remaining.sort().join('');
          
          // Calculate the new rack after exchange
          const newRack = [...remaining];
          // Draw new tiles from pool if available
          const tilesToDraw = current.length;
          let newTiles = [];
          if (Array.isArray(pool) && pool.length >= tilesToDraw) {
            // Shuffle pool and take tiles
            const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
            newTiles = shuffledPool.slice(0, tilesToDraw);
            newRack.push(...newTiles);
            // Sort the new rack
            newRack.sort();
          }
          
          exchangeMoves.push({
            word: `Exchange ${current.join('')}`,
            score: 0,
            tiles: current.map(letter => ({ letter, isNew: false })),
            direction: 'exchange',
            startPosition: 'Exchange',
            leave: leave, // The leave is what we keep BEFORE drawing new tiles
            isExchange: true,
            newTiles: newTiles, // Store the new tiles to be drawn
            tilesToExchange: [...current] // Store the tiles being exchanged
          });
          return;
        }
        for (let j = start; j < remaining.length; j++) {
          const nextRemaining = [...remaining];
          nextRemaining.splice(j, 1);
          current.push(remaining[j]);
          generateCombos(current, j, nextRemaining);
          current.pop();
        }
      };
      generateCombos([], 0, [...letters]);
    }

    // Combine regular moves and exchange moves
    const combinedMoves = [...allMoves, ...exchangeMoves];

    // Process moves exactly like ChoicesModal does
    const processedMoves = combinedMoves.map(move => {
      const leaveValue = getLeaveValue(move.leave);
      const totalValue = move.isExchange ? 
        leaveValue : // For exchanges, total value is just the leave value
        (move.score + leaveValue); // For regular moves, add score and leave value
      
      return {
        ...move,
        totalValue
      };
    });

    // Sort moves by total value
    const sortedMoves = processedMoves.sort((a, b) => b.totalValue - a.totalValue);

    if (sortedMoves.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No valid move found' })
      };
    }

    const best = sortedMoves[0];
    
    // Log top 10 moves sorted by total value
    console.log('Top 10 moves:');
    sortedMoves.slice(0, 10).forEach((move, index) => {
      console.log(`${index + 1}. ${move.word} (${move.isExchange ? 'exchange' : 'play'})`, {
        score: move.score,
        leave: move.leave,
        leaveValue: getLeaveValue(move.leave),
        totalValue: move.totalValue
      });
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        word: best.word,
        score: best.score,
        tiles: best.tiles,
        leave: best.leave,
        isExchange: best.isExchange,
        newTiles: best.newTiles, // Include the new tiles to be drawn
        tilesToExchange: best.isExchange ? best.tilesToExchange : [] // Include the tiles being exchanged
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
