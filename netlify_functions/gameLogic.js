/**
 * Scrabble Game Logic
 * 
 * This module implements the core game rules and scoring for Scrabble.
 * It provides functions for validating moves, scoring plays, and checking word validity.
 * 
 * @module gameLogic
 */

/** @type {Object.<string, number>} */
const letterScores = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1,
    'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3, 'Q': 10, 'R': 1,
    'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10
};

const loadDictionary = require('./loadDictionary');

// Load the GADDAG once at module level
const gaddag = loadDictionary();

/**
 * Checks if a word exists in the Scrabble dictionary.
 * 
 * @param {string} word - The word to check
 * @returns {Promise<boolean>} True if the word is valid
 */
async function isValidWord(word) {
    try {
        const result = await gaddag.contains(word.toUpperCase());
        return result;
    } catch (error) {
        console.error('❌ Dictionary error:', error);
        return false;
    }
}

/**
 * Board multiplier values for premium squares.
 * 0: Normal square
 * 1: Double Letter Score
 * 2: Triple Letter Score
 * 3: Double Word Score
 * 4: Triple Word Score
 * 
 * @type {number[][]}
 */
const boardMultipliers = [
    [4,0,0,1,0,0,0,4,0,0,0,1,0,0,4],
    [0,3,0,0,0,2,0,0,0,2,0,0,0,3,0],
    [0,0,3,0,0,0,1,0,1,0,0,0,3,0,0],
    [1,0,0,3,0,0,0,1,0,0,0,3,0,0,1],
    [0,0,0,0,3,0,0,0,0,0,3,0,0,0,0],
    [0,2,0,0,0,2,0,0,0,2,0,0,0,2,0],
    [0,0,1,0,0,0,1,0,1,0,0,0,1,0,0],
    [4,0,0,1,0,0,0,3,0,0,0,1,0,0,4],
    [0,0,1,0,0,0,1,0,1,0,0,0,1,0,0],
    [0,2,0,0,0,2,0,0,0,2,0,0,0,2,0],
    [0,0,0,0,3,0,0,0,0,0,3,0,0,0,0],
    [1,0,0,3,0,0,0,1,0,0,0,3,0,0,1],
    [0,0,3,0,0,0,1,0,1,0,0,0,3,0,0],
    [0,3,0,0,0,2,0,0,0,2,0,0,0,3,0],
    [4,0,0,1,0,0,0,4,0,0,0,1,0,0,4]
];

/**
 * Gets the word at a specific position on the board.
 * 
 * @param {Array<Array<string|null>>} board - The game board
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {string} direction - 'horizontal' or 'vertical'
 * @returns {string|null} The word found, or null if no valid word
 */
function getWordAt(board, row, col, direction) {
    let word = "";
    let r = row;
    let c = col;

    if (direction === "horizontal") {
        while (c >= 0 && typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
            c--;
        }
        c++;
        while (c < 15 && typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
            word += board[r][c];
            c++;
        }
    } else if (direction === "vertical") {
        while (r >= 0 && typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
            r--;
        }
        r++;
        while (r < 15 && typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
            word += board[r][c];
            r++;
        }
    }
    return word.length > 1 ? word : null;
}

/**
 * Finds all new words formed by the placed tiles.
 * 
 * @param {Array<Array<string|null>>} beforeBoard - Board state before the move
 * @param {Array<Array<string|null>>} afterBoard - Board state after the move
 * @param {Array<{row: number, col: number, letter: string}>} placedTiles - Tiles that were placed
 * @returns {string[]} Array of new words formed
 */
function findNewWords(beforeBoard, afterBoard, placedTiles) {
    const newWords = new Set();

    for (const tile of placedTiles) {
        const { row, col } = tile;

        const horizontalWord = getWordAt(afterBoard, row, col, "horizontal");
        if (horizontalWord) {
            newWords.add(horizontalWord);
        }

        const verticalWord = getWordAt(afterBoard, row, col, "vertical");
        if (verticalWord) {
            newWords.add(verticalWord);
        }
    }

    return Array.from(newWords);
}

/**
 * Validates a Scrabble move according to game rules.
 * 
 * @param {Array<Array<string|null>>} beforeBoard - Board state before the move
 * @param {Array<Array<string|null>>} afterBoard - Board state after the move
 * @returns {Promise<{isValid: boolean, reason?: string, word?: string, words: string[]}>} Validation result
 */
async function isValidScrabblePlacement(beforeBoard, afterBoard) {
    const placedTiles = [];
    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
            if (typeof afterBoard[r][c] === 'string' && afterBoard[r][c].match(/[A-Z]/) && 
                (typeof beforeBoard[r][c] !== 'string' || !beforeBoard[r][c].match(/[A-Z]/))) {
                placedTiles.push({ row: r, col: c, letter: afterBoard[r][c] });
            }
        }
    }

    const numPlaced = placedTiles.length;
    if (numPlaced === 0) {
        return { isValid: false, reason: 'No tiles placed', words: [] };
    }

    // Check if tiles are in a straight line
    if (numPlaced > 1) {
        const firstRow = placedTiles[0].row;
        const firstCol = placedTiles[0].col;
        const allSameRow = placedTiles.every(tile => tile.row === firstRow);
        const allSameCol = placedTiles.every(tile => tile.col === firstCol);

        if (!allSameRow && !allSameCol) {
            return { isValid: false, reason: 'Tiles must be placed in a straight line', words: [] };
        }

        // Check for gaps
        if (allSameRow) {
            const cols = placedTiles.map(tile => tile.col).sort((a, b) => a - b);
            for (let i = 0; i < cols.length - 1; i++) {
                if (cols[i + 1] - cols[i] > 1) {
                    for (let c = cols[i] + 1; c < cols[i + 1]; c++) {
                        if (typeof beforeBoard[firstRow][c] !== 'string' || !beforeBoard[firstRow][c].match(/[A-Z]/)) {
                            return { isValid: false, reason: 'Gaps between tiles are not allowed', words: [] };
                        }
                    }
                }
            }
        } else if (allSameCol) {
            const rows = placedTiles.map(tile => tile.row).sort((a, b) => a - b);
            for (let i = 0; i < rows.length - 1; i++) {
                if (rows[i + 1] - rows[i] > 1) {
                    for (let r = rows[i] + 1; r < rows[i + 1]; r++) {
                        if (typeof beforeBoard[r][firstCol] !== 'string' || !beforeBoard[r][firstCol].match(/[A-Z]/)) {
                            return { isValid: false, reason: 'Gaps between tiles are not allowed', words: [] };
                        }
                    }
                }
            }
        }
    }

    // Check adjacency and center star
    let isAdjacent = false;
    let isOnStar = false;

    for (const tile of placedTiles) {
        const { row, col } = tile;
        const adjacentSquares = [
            { dr: 0, dc: 1 }, { dr: 0, dc: -1 }, { dr: 1, dc: 0 }, { dr: -1, dc: 0 }
        ];

        for (const { dr, dc } of adjacentSquares) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15) {
                if (typeof beforeBoard[newRow][newCol] === 'string' && beforeBoard[newRow][newCol].match(/[A-Z]/)) {
                    isAdjacent = true;
                    break;
                }
            }
        }

        if (row === 7 && col === 7) {
            isOnStar = true;
        }
    }

    if (!isAdjacent && !isOnStar) {
        return { isValid: false, reason: 'First move must cover center star or connect to existing tiles', words: [] };
    }

    // Find all new words
    const newWords = findNewWords(beforeBoard, afterBoard, placedTiles);
    if (newWords.length === 0) {
        return { isValid: false, reason: 'No valid words formed', words: [] };
    }

    // Check if all words are valid
    for (const word of newWords) {
        if (!(await isValidWord(word))) {
            return { isValid: false, reason: `Invalid word: ${word}`, words: newWords };
        }
    }

    return { isValid: true, words: newWords };
}

/**
 * Calculates the score for a play.
 * 
 * @param {Array<Array<string|null>>} beforeBoard - Board state before the move
 * @param {Array<Array<string|null>>} afterBoard - Board state after the move
 * @returns {Promise<number>} The total score for the play
 */
async function scorePlay(beforeBoard, afterBoard) {
    let totalScore = 0;
    const formedWords = new Set();
    const placedTiles = [];

    // Find placed tiles
    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
            if (typeof afterBoard[r][c] === 'string' && afterBoard[r][c].match(/[A-Z]/) &&
                (typeof beforeBoard[r][c] !== 'string' || !beforeBoard[r][c].match(/[A-Z]/))) {
                placedTiles.push({ row: r, col: c, letter: afterBoard[r][c] });
            }
        }
    }

    if (placedTiles.length === 0) return 0;

    // Helper function to get word score
    function getWordScore(wordTiles) {
        let wordScore = 0;
        let wordMultiplier = 1;
        const usedPremiumSquares = new Set();

        for (const tile of wordTiles) {
            const letter = tile.letter;
            const row = tile.row;
            const col = tile.col;
            const letterScore = letterScores[letter];
            let letterMultiplier = 1;

            const isNewTile = placedTiles.some(pt => pt.row === row && pt.col === col);
            if (isNewTile) {
                const premiumType = boardMultipliers[row][col];
                if (premiumType === 3) { // Double word
                    if (!usedPremiumSquares.has(`DW-${row}-${col}`)) {
                        wordMultiplier *= 2;
                        usedPremiumSquares.add(`DW-${row}-${col}`);
                    }
                } else if (premiumType === 1) { // Double letter
                    letterMultiplier = 2;
                } else if (premiumType === 2) { // Triple letter
                    letterMultiplier = 3;
                } else if (premiumType === 4) { // Triple word
                    if (!usedPremiumSquares.has(`TW-${row}-${col}`)) {
                        wordMultiplier *= 3;
                        usedPremiumSquares.add(`TW-${row}-${col}`);
                    }
                }
            }

            wordScore += letterScore * letterMultiplier;
        }

        return wordScore * wordMultiplier;
    }

    // Helper function to find complete word
    function findWord(board, startRow, startCol, direction) {
        let wordTiles = [];
        let currentRow = startRow;
        let currentCol = startCol;

        if (direction === 'horizontal') {
            while (currentCol >= 0 && typeof board[currentRow][currentCol] === 'string' && 
                   board[currentRow][currentCol].match(/[A-Z]/)) {
                currentCol--;
            }
            currentCol++;
            while (currentCol < 15 && typeof board[currentRow][currentCol] === 'string' && 
                   board[currentRow][currentCol].match(/[A-Z]/)) {
                wordTiles.push({
                    letter: board[currentRow][currentCol],
                    row: currentRow,
                    col: currentCol
                });
                currentCol++;
            }
        } else if (direction === 'vertical') {
            while (currentRow >= 0 && typeof board[currentRow][currentCol] === 'string' && 
                   board[currentRow][currentCol].match(/[A-Z]/)) {
                currentRow--;
            }
            currentRow++;
            while (currentRow < 15 && typeof board[currentRow][currentCol] === 'string' && 
                   board[currentRow][currentCol].match(/[A-Z]/)) {
                wordTiles.push({
                    letter: board[currentRow][currentCol],
                    row: currentRow,
                    col: currentCol
                });
                currentRow++;
            }
        }

        return wordTiles.length > 1 ? wordTiles : [];
    }

    // Score all words
    for (const placedTile of placedTiles) {
        const r = placedTile.row;
        const c = placedTile.col;

        // Check horizontal word
        const horizontalWord = findWord(afterBoard, r, c, 'horizontal');
        if (horizontalWord.length > 0) {
            const wordString = horizontalWord.map(t => t.letter).join('');
            if (!formedWords.has(wordString)) {
                const isValid = await isValidWord(wordString);
                if (isValid) {
                    totalScore += getWordScore(horizontalWord);
                    formedWords.add(wordString);
                }
            }
        }

        // Check vertical word
        const verticalWord = findWord(afterBoard, r, c, 'vertical');
        if (verticalWord.length > 0) {
            const wordString = verticalWord.map(t => t.letter).join('');
            if (!formedWords.has(wordString)) {
                const isValid = await isValidWord(wordString);
                if (isValid) {
                    totalScore += getWordScore(verticalWord);
                    formedWords.add(wordString);
                }
            }
        }
    }

    // Add 50-point bonus for using all 7 tiles
    if (placedTiles.length === 7) {
        totalScore += 50;
    }

    return totalScore;
}

/**
 * Netlify serverless function handler for game logic operations.
 * 
 * @param {Object} event - The Netlify function event object
 * @param {string} event.httpMethod - The HTTP method of the request
 * @param {string} event.body - The request body as a JSON string
 * @returns {Object} Response object with status code and body
 * 
 * @example
 * // Example request body for validation:
 * {
 *   "action": "validate",
 *   "beforeBoard": [["A", "B", null, ...], ...],
 *   "afterBoard": [["A", "B", "C", ...], ...]
 * }
 * 
 * // Example request body for scoring:
 * {
 *   "action": "score",
 *   "beforeBoard": [["A", "B", null, ...], ...],
 *   "afterBoard": [["A", "B", "C", ...], ...]
 * }
 */
exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { action, beforeBoard, afterBoard } = JSON.parse(event.body);
        
        let result;
        if (action === 'validate') {
            result = await isValidScrabblePlacement(beforeBoard, afterBoard);
        } else if (action === 'score') {
            result = await scorePlay(beforeBoard, afterBoard);
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid action' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error('❌ Game logic error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

// Export constants for use by other modules
exports.letterScores = letterScores;
exports.boardMultipliers = boardMultipliers;
exports.isValidWord = isValidWord;
exports.isValidScrabblePlacement = isValidScrabblePlacement;
exports.scorePlay = scorePlay;
exports.findNewWords = findNewWords; 