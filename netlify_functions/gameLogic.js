const letterScores = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1,
    'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3, 'Q': 10, 'R': 1,
    'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10
};

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with anon key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to check if a word is valid using Supabase
async function isValidWord(word) {
    const { data, error } = await supabase
        .from('dictionary')
        .select('word')
        .eq('word', word.toUpperCase())
        .single();

    if (error) {
        console.error('Error checking word:', error);
        return false;
    }

    return !!data;
}

const fs = require('fs');
const path = require('path');

// Load dictionary into memory
let validWords = new Set();
try {
    // Try different possible paths for the dictionary
    const possiblePaths = [
        path.join(__dirname, 'dictionary.txt'),                    // Local development
        path.join(process.cwd(), 'netlify_functions', 'dictionary.txt'),  // Netlify production
        path.join(process.cwd(), 'public', 'dictionary.txt')      // Alternative path
    ];

    let dictionaryPath = null;
    for (const possiblePath of possiblePaths) {
        console.log('Checking path:', possiblePath);
        if (fs.existsSync(possiblePath)) {
            dictionaryPath = possiblePath;
            console.log('Found dictionary at:', dictionaryPath);
            break;
        }
    }

    if (!dictionaryPath) {
        throw new Error('Could not find dictionary file in any of the expected locations');
    }

    const dictionaryContent = fs.readFileSync(dictionaryPath, 'utf8');
    const words = dictionaryContent
        .split('\n')
        .map(word => word.trim().toUpperCase())
        .filter(word => word && !word.startsWith('#'));
    
    console.log('Dictionary loaded successfully, word count:', words.length);
    validWords = new Set(words);
} catch (error) {
    console.error('Error loading dictionary:', error);
    console.error('Error stack:', error.stack);
    // Fallback to a small set of words if dictionary fails to load
    validWords = new Set([
        'HELLO', 'WORLD', 'SCRABBLE', 'GAME', 'PLAY', 'WORD', 'TILE', 'RACK', 'BOARD',
        'SCORE', 'POINTS', 'LETTER', 'ALPHABET', 'DICTIONARY', 'VALID', 'MOVE', 'CHECK'
    ]);
}

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

    if (numPlaced === 1) {
        // Need to check adjacency or first move on star later
    } else {
        const firstRow = placedTiles[0].row;
        const firstCol = placedTiles[0].col;
        const allSameRow = placedTiles.every(tile => tile.row === firstRow);
        const allSameCol = placedTiles.every(tile => tile.col === firstCol);

        if (!allSameRow && !allSameCol) {
            return { isValid: false, reason: 'Tiles must be placed in a straight line', words: [] };
        }

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

    let isAdjacent = false;
    let isOnStar = false;

    for (const tile of placedTiles) {
        const { row, col } = tile;

        const adjacentSquares = [
            { dr: 0, dc: 1 }, { dr: 0, dc: -1 }, { dr: 1, dc: 0 }, { dr: -1, dc: 0 }
        ];
        for (const adj of adjacentSquares) {
            const nr = row + adj.dr;
            const nc = col + adj.dc;
            if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && 
                typeof beforeBoard[nr][nc] === 'string' && beforeBoard[nr][nc].match(/[A-Z]/)) {
                isAdjacent = true;
                break;
            }
        }
        if (isAdjacent) break;

        if (row === 7 && col === 7) {
            isOnStar = true;
        }
    }

    const isFirstMove = beforeBoard.every(row => 
        row.every(cell => typeof cell !== 'string' || !cell.match(/[A-Z]/))
    );

    if (isFirstMove) {
        if (!isOnStar && numPlaced > 0) {
            const placedOnStar = placedTiles.some(tile => tile.row === 7 && tile.col === 7);
            if (!placedOnStar) {
                return { isValid: false, reason: 'First word must cover the center star', words: [] };
            }
        } else if (isFirstMove && numPlaced === 0) {
            return { isValid: false, reason: 'No tiles placed', words: [] };
        }
    } else {
        if (!isAdjacent) {
            return { isValid: false, reason: 'New tiles must be adjacent to existing tiles', words: [] };
        }
    }

    if ((isFirstMove && isOnStar && numPlaced > 0) || (!isFirstMove && isAdjacent)) {
        const words = findNewWords(beforeBoard, afterBoard, placedTiles);
        // Check if all words are valid
        for (const word of words) {
            const isValid = await isValidWord(word);
            if (!isValid) {
                return { 
                    isValid: false, 
                    reason: `Invalid word: ${word}`, 
                    word: word,
                    words: [] 
                };
            }
        }
        return { isValid: true, words: words };
    }

    return { isValid: false, reason: 'Invalid placement', words: [] };
}

function scorePlay(beforeBoard, afterBoard) {
    let totalScore = 0;
    const formedWords = new Set();
    const placedTiles = [];

    // Find all newly placed tiles
    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
            if (typeof afterBoard[r][c] === 'string' && afterBoard[r][c].match(/[A-Z]/) &&
                (typeof beforeBoard[r][c] !== 'string' || !beforeBoard[r][c].match(/[A-Z]/))) {
                placedTiles.push({ row: r, col: c, letter: afterBoard[r][c] });
            }
        }
    }

    if (placedTiles.length === 0) {
        return 0;
    }

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

            // Check if this is a newly placed tile
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
            // Move left to find start of word
            while (currentCol >= 0 && typeof board[currentRow][currentCol] === 'string' && 
                   board[currentRow][currentCol].match(/[A-Z]/)) {
                currentCol--;
            }
            currentCol++;
            // Collect word tiles
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
            // Move up to find start of word
            while (currentRow >= 0 && typeof board[currentRow][currentCol] === 'string' && 
                   board[currentRow][currentCol].match(/[A-Z]/)) {
                currentRow--;
            }
            currentRow++;
            // Collect word tiles
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

    // Score all words formed by the placed tiles
    for (const placedTile of placedTiles) {
        const r = placedTile.row;
        const c = placedTile.col;

        // Check horizontal word
        const horizontalWord = findWord(afterBoard, r, c, 'horizontal');
        if (horizontalWord.length > 0) {
            const wordString = horizontalWord.map(t => t.letter).join('');
            if (!formedWords.has(wordString) && validWords.has(wordString)) {
                totalScore += getWordScore(horizontalWord);
                formedWords.add(wordString);
            }
        }

        // Check vertical word
        const verticalWord = findWord(afterBoard, r, c, 'vertical');
        if (verticalWord.length > 0) {
            const wordString = verticalWord.map(t => t.letter).join('');
            if (!formedWords.has(wordString) && validWords.has(wordString)) {
                totalScore += getWordScore(verticalWord);
                formedWords.add(wordString);
            }
        }
    }

    // Add 50-point bonus for using all 7 tiles
    if (placedTiles.length === 7) {
        totalScore += 50;
    }
    console.log(formedWords);
    return totalScore;
}

exports.handler = async function(event, context) {
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
            result = scorePlay(beforeBoard, afterBoard);
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
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
}; 