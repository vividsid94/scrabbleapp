/**
 * Scrabble Bot Logic
 * 
 * This module implements a Netlify serverless function that acts as a Scrabble bot.
 * It takes a game board and available letters, then returns all possible valid moves.
 * 
 * @module botLogic
 */

const { normalizeBoard } = require('./normalizeBoard');
const https = require('https');
const http = require('http');

// Import the common word display utility
const { convertWordWithDots } = require('../src/functions/play/wordDisplayUtils');

/**
 * Call the Go generateMoves function via HTTP
 */
async function callGoGenerateMoves(board, letters, premiumSquares = null, poolSize = 0) {
  try {
    // Call the Go service
    const railwayUrl = 'https://scrabble-move-generator-production.up.railway.app/generate-moves'; // Go service running on Railway

    // Board/rack conversion: '*' -> '?' for Macondo's blank convention, empty
    // cells normalized to '' for the wire format the Go service expects.
    const boardData = board.map(row => row.map(cell => cell || ''));
    const rackData = letters.map(letter => letter === '*' ? '?' : letter).join('');

    // Make HTTP request to Go service
    const requestBody = {
      board: boardData, // Already in correct format with empty strings
      rack: rackData, // Convert * to ? for Macondo
      topN: 100, // Get top 100 moves
      poolSize // Go only generates exchange candidates when this is >= 7
    };
    
    // Add premiumSquares if provided
    if (premiumSquares && Array.isArray(premiumSquares) && premiumSquares.length > 0) {
      requestBody.premiumSquares = premiumSquares;
    }
    
    const requestData = JSON.stringify(requestBody);
    
    const url = new URL(railwayUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };
    
    return new Promise((resolve, reject) => {
      const httpModule = url.protocol === 'https:' ? https : http;
      const req = httpModule.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const result = JSON.parse(data);

              // Check if Go service returned valid moves with words
              const validMoves = result.moves ? result.moves.filter(move => move.word && move.word.length > 0) : [];
              if (validMoves.length === 0 && result.moves && result.moves.length > 0) {
                reject(new Error('Go service returned moves with empty words'));
                return;
              }
              
              // Convert Go service response format to expected JavaScript format
              const convertedMoves = result.moves.map(goMove => {
                // Exchange candidates arrive already fully shaped by Go
                // (tiles/direction/startPosition/leave/leaveValue/totalValue) -
                // no position parsing or dot-conversion applies to them.
                if (goMove.isExchange) {
                  return {
                    word: goMove.word,
                    score: 0,
                    tiles: (goMove.tiles || []).map(t => ({ letter: t.letter, isNew: false })),
                    direction: 'exchange',
                    startPosition: 'Exchange',
                    leave: goMove.leave || '',
                    leaveValue: goMove.leaveValue || 0,
                    totalValue: goMove.totalValue || 0,
                    isExchange: true
                  };
                }

                // Parse position like "8D" or "D8" to get row and column
                const position = goMove.position;
                let row, col;
                
                // Handle position format - can be "8D" (row 8, column D) or "D8" (column D, row 8)
                if (position && position.length >= 2) {
                  const firstChar = position[0];
                  
                  // Check if first character is a letter (A-O)
                  if (/^[A-O]$/.test(firstChar)) {
                    // Format: "D8" or "E11" (column D/E, row 8/11)
                    col = firstChar.charCodeAt(0) - 65; // Convert A=0, B=1, etc.
                    // Extract the row number (everything after the first letter)
                    const rowStr = position.slice(1);
                    row = parseInt(rowStr) - 1; // Convert to 0-based index
                  } else if (/^\d$/.test(firstChar)) {
                    // Format: "8D" (row 8, column D)
                    // Extract the row number (everything before the last letter)
                    const rowStr = position.slice(0, -1);
                    row = parseInt(rowStr) - 1; // Convert to 0-based index
                    const lastChar = position[position.length - 1];
                    col = lastChar.charCodeAt(0) - 65; // Convert A=0, B=1, etc.
                  } else {
                    // Fallback to center
                    row = 7;
                    col = 7;
                  }
                } else {
                  row = 7; // Default to center
                  col = 7;
                }
                
                // Ensure row and col are within valid bounds
                row = Math.max(0, Math.min(14, row));
                col = Math.max(0, Math.min(14, col));
                
                // The Go service is returning valid words like "BADE", "LADE", "ABLE"
                // Don't filter them out - they are legitimate Scrabble words
                const actualWord = goMove.word || '';
                
                // Determine direction based on position format
                // If position starts with a letter (like "K8"), it's likely vertical
                // If position starts with a number (like "5E"), it's likely horizontal
                let direction = 'right'; // default
                if (position && position.length >= 2) {
                  const firstChar = position[0];
                  if (/^[A-O]$/.test(firstChar)) {
                    direction = 'down'; // Vertical placement
                  } else if (/^\d$/.test(firstChar)) {
                    direction = 'right'; // Horizontal placement
                  }
                }
                
                // Convert dots to actual letters in parentheses
                const displayWord = convertWordWithDots(actualWord, board, row, col, direction);

                // Create tiles array - for now, we'll create a simple representation
                // since the Go service doesn't provide detailed tile placement info
                const tiles = [];
                if (actualWord) {
                  // Create tiles for each letter in the word
                  for (let i = 0; i < actualWord.length; i++) {
                    const letter = actualWord[i];
                    if (letter === '.') {
                      // Dot represents an existing tile on the board - don't create a new tile
                      continue;
                    }
                    
                    let tileRow, tileCol;
                    if (direction === 'down') {
                      // Vertical placement: increment row
                      tileRow = row + i;
                      tileCol = col;
                    } else {
                      // Horizontal placement: increment column
                      tileRow = row;
                      tileCol = col + i;
                    }
                    
                    // Check if this is a blank tile (lowercase letter from Go service)
                    const isBlank = letter === letter.toLowerCase() && letter !== '.';
                    const tileLetter = isBlank ? letter.toUpperCase() : letter;
                    
                    tiles.push({
                      row: tileRow,
                      col: tileCol,
                      letter: tileLetter,
                      isNew: true,
                      isBlank: isBlank
                    });
                  }
                }
                
                return {
                  word: displayWord,
                  actualWord: actualWord, // Add the raw word from Go service
                  score: goMove.score || 0,
                  tiles: tiles,
                  direction: direction,
                  startPosition: goMove.position || '8H',
                  leave: goMove.leave || '',
                  leaveValue: goMove.leaveValue || 0,
                  totalValue: goMove.totalValue || 0,
                  isExchange: false
                };
              });
              
              resolve(convertedMoves);
            } catch (error) {
              reject(new Error(`Failed to parse response: ${error.message}`));
            }
          } else {
            reject(new Error(`HTTP error! status: ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.write(requestData);
      req.end();
    });
    
  } catch (error) {
    console.error('❌ FAILED to call Go service:', error.message);
    throw new Error(`Move generation service unavailable: ${error.message}`);
  }
}

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
 *     "moves": [
 *       {
 *         "word": "HELLO",
 *         "score": 8,
 *         "tiles": [{row: 7, col: 7, letter: "H", isNew: true}, ...],
 *         "direction": "right",
 *         "startPosition": "8H",
 *         "leave": "ABC",
 *         "leaveValue": 5,
 *         "totalValue": 13,
 *         "isExchange": false
 *       },
 *       // ... all valid moves
 *     ]
 *   }
 * }
 */
exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { board: rawBoard, letters, pool = [], premiumSquares } = JSON.parse(event.body || '{}');
    
    if (!Array.isArray(rawBoard) || rawBoard.length !== 15 || !Array.isArray(letters) || letters.length > 7) {
      throw new Error('Invalid input: board must be 15x15 array and letters must be array of up to 7 letters');
    }

    const board = normalizeBoard(rawBoard);
    const poolSize = Array.isArray(pool) ? pool.length : 0;

    // Get all possible moves from Go function - already leave-scored and
    // sorted server-side (word plays + exchanges), nothing left to compute here.
    const allMoves = await callGoGenerateMoves(board, letters, premiumSquares, poolSize);

    if (allMoves.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No valid move found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        moves: allMoves // Already sorted by totalValue server-side
      })
    };

  } catch (err) {
    console.error('❌ Bot error:', err);
    console.error('Error stack:', err.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: err.message,
        stack: err.stack,
        details: err.toString()
      })
    };
  }
};
