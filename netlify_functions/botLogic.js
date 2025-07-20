/**
 * Scrabble Bot Logic
 * 
 * This module implements a Netlify serverless function that acts as a Scrabble bot.
 * It takes a game board and available letters, then returns all possible valid moves.
 * 
 * @module botLogic
 */

const { normalizeBoard } = require('./normalizeBoard');
const loadDictionary = require('./loadDictionary');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Import the common word display utility
const { convertWordWithDots } = require('../src/functions/play/wordDisplayUtils');

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
    const railwayUrl = 'https://scrabble-move-generator-production.up.railway.app/generate-moves'; // Go service running on Railway
    
    console.log('🚀 ATTEMPTING TO USE GO SERVICE for move generation...');
    console.log('📍 Calling URL:', railwayUrl);
    
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
                
                // Log what the Go service actually returned
                console.log('🔍 GO SERVICE RAW WORD:', {
                  actualWord: actualWord,
                  position: goMove.position,
                  direction: direction,
                  row: row,
                  col: col
                });
                
                // Convert dots to actual letters in parentheses
                const displayWord = convertWordWithDots(actualWord, board, row, col, direction);
                
                // Log what convertWordWithDots produced
                console.log('🔍 CONVERTED WORD:', {
                  original: actualWord,
                  converted: displayWord
                });
                
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

    const { board: rawBoard, letters, pool = [] } = JSON.parse(event.body || '{}');
    
    if (!Array.isArray(rawBoard) || rawBoard.length !== 15 || !Array.isArray(letters) || letters.length > 7) {
      throw new Error('Invalid input: board must be 15x15 array and letters must be array of up to 7 letters');
    }

    const board = normalizeBoard(rawBoard);
    
    // Load dictionary (for validation, though Go will handle the actual move generation)
    console.log('Loading dictionary...');
    try {
      const gaddag = await loadDictionary();
      console.log('Dictionary loaded successfully');
    } catch (dictError) {
      console.error('Failed to load dictionary:', dictError);
      throw new Error(`Dictionary loading failed: ${dictError.message}`);
    }

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

    // Generate exchange moves
    const exchangeMoves = [];
    // Only generate exchange moves if there are at least 7 tiles in the pool
    if (Array.isArray(pool) && pool.length >= 7) {
      // Generate all possible combinations of 1-7 tiles
      for (let i = 1; i <= Math.min(letters.length, 7); i++) {
        const generateCombos = (current, start, remaining) => {
          if (current.length === i) {
            // For exchanges, the leave is what we keep (remaining)
            // Convert any * to ? for leave lookup
            const leave = remaining.map(tile => tile === '*' ? '?' : tile).sort().join('');
            
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
              tiles: current.map(letter => ({ letter: letter === '?' ? '*' : letter, isNew: false })),
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
    }

    // Combine regular moves and exchange moves
    const combinedMoves = [...allMoves, ...exchangeMoves];

    // Process moves to add leave values but don't sort
    const processedMoves = combinedMoves.map(move => {
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
