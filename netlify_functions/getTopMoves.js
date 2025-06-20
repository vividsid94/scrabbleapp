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
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

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
 * Call the Go generateMoves function via HTTP
 */
async function callGoGenerateMoves(board, letters) {
  try {
    // Call the Go service
    const renderUrl = 'https://scrabble-move-generator.onrender.com/generate-moves'; // Go service running on Render
    
    console.log('🚀 ATTEMPTING TO USE GO SERVICE for move generation...');
    console.log('📍 Calling URL:', renderUrl);
    
    // Debug: Log what we're sending to Go service
    const boardData = board.map(row => row.map(cell => cell || ''));
    const rackData = letters.map(letter => letter === '*' ? '?' : letter).join('');
    
    // Make board readable
    console.log('🔍 DEBUG: Board being sent to Go service:');
    console.log('   A B C D E F G H I J K L M N O');
    boardData.forEach((row, i) => {
      const rowNum = (i + 1).toString().padStart(2, ' ');
      const rowStr = row.map(cell => cell || '.').join(' ');
      console.log(`${rowNum} ${rowStr}`);
    });
    
    console.log('🔍 DEBUG: Rack being sent to Go service:', rackData);
    console.log('🔍 DEBUG: Original letters array:', letters);
    
    // Make HTTP request to Go service
    const requestData = JSON.stringify({
      board: boardData, // Already in correct format with empty strings
      rack: rackData, // Convert * to ? for Macondo
      topN: 100 // Get top 100 moves
    });
    
    const url = new URL(renderUrl);
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
              console.log(result);
              console.log('✅ SUCCESS: Go service returned', result.moves ? result.moves.length : 0, 'moves');
              console.log('🏆 Go service is working!');
              
              // Debug: Check what moves we're getting
              if (result.moves && result.moves.length > 0) {
                console.log('🔍 DEBUG: First move from Go service:', result.moves[0]);
                console.log('🔍 DEBUG: Moves with words:', result.moves.filter(m => m.word && m.word.length > 0).length);
                console.log('🔍 DEBUG: Moves with empty words:', result.moves.filter(m => !m.word || m.word.length === 0).length);
              }
              
              // Check if Go service returned valid moves with words
              const validMoves = result.moves ? result.moves.filter(move => move.word && move.word.length > 0) : [];
              if (validMoves.length === 0 && result.moves && result.moves.length > 0) {
                console.log('⚠️ Go service returned moves with empty words, falling back to JavaScript implementation');
                // Fall back to JavaScript implementation
                const { generateMoves } = require('./generateMoves');
                resolve(generateMoves(board, letters));
                return;
              }
              
              // Convert Go service response format to expected JavaScript format
              const convertedMoves = result.moves.map(goMove => {
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
                  word: actualWord,
                  score: goMove.score || 0,
                  tiles: tiles,
                  direction: direction,
                  startPosition: goMove.position || '8H',
                  leave: goMove.leave || '',
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
    console.log('🔄 FALLING BACK to JavaScript implementation...');
    console.log('⚠️ This means the Go service is not available or failed.');
    
    // Fall back to JavaScript implementation
    const { generateMoves } = require('./generateMoves');
    return generateMoves(board, letters);
  }
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
    
    // Get all possible moves from Go function
    console.log('Generating moves with Go...');
    const allMoves = await callGoGenerateMoves(board, letters);
    console.log(`Generated ${allMoves.length} possible moves`);

    // Calculate leave for regular moves
    for (const move of allMoves) {
      const rackCopy = [...letters];
      
      // Remove tiles used in the move
      for (const tile of move.tiles) {
        if (tile.isNew) {
          if (tile.isBlank) {
            // For blank tiles, we need to find the specific blank that was used
            // Look for the blank in the rack
            const blankIndex = rackCopy.indexOf('*');
            if (blankIndex !== -1) {
              rackCopy.splice(blankIndex, 1);
            }
          } else {
            // For regular tiles, find and remove the letter
            const tileIndex = rackCopy.indexOf(tile.letter);
            if (tileIndex !== -1) {
              rackCopy.splice(tileIndex, 1);
            }
          }
        }
      }
      // Sort remaining tiles to create leave
      move.leave = rackCopy.map(tile => tile === '*' ? '?' : tile).sort().join('');
    }

    // Process moves to add leave values but don't sort
    const processedMoves = allMoves.map(move => {
      const leaveValue = getLeaveValue(move.leave);
      const totalValue = move.isExchange ? 
        leaveValue : // For exchanges, total value is just the leave value
        (move.score + leaveValue); // For regular moves, add score and leave value
      
      return {
        ...move,
        leaveValue,
        totalValue
      };
    });

    if (processedMoves.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No valid move found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        moves: processedMoves // Return ALL moves, let frontend handle sorting
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