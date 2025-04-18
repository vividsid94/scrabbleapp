const { createClient } = require('@supabase/supabase-js');
const letterScores = require('./gameLogic').letterScores;
const boardMultipliers = require('./gameLogic').boardMultipliers;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to check if a word is valid using Supabase
async function isValidWord(word) {
    try {
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
    } catch (error) {
        console.error('Exception in isValidWord:', error);
        return false;
    }
}

// Function to get all possible words from a set of letters
async function getPossibleWords(letters) {
    console.log('Getting possible words for letters:', letters);
    if (!letters || letters.length === 0) {
        console.log('No letters provided');
        return [];
    }

    // Convert letters to uppercase and sort them
    const sortedLetters = letters.map(l => l.toUpperCase()).sort();
    console.log('Sorted letters:', sortedLetters);

    try {
        // First try to get words that contain any of our letters
        const { data, error } = await supabase
            .from('dictionary')
            .select('word')
            .or(sortedLetters.map(letter => `word.ilike.%${letter}%`).join(','));

        if (error) {
            console.error('Error getting possible words:', error);
            return [];
        }

        console.log('Total words from database:', data.length);

        // If no words found, try a more lenient approach
        if (data.length === 0) {
            console.log('No words found with initial query, trying fallback...');
            const fallbackWords = [
                'HELLO', 'WORLD', 'SCRABBLE', 'GAME', 'PLAY', 'WORD', 'TILE', 'RACK', 'BOARD',
                'SCORE', 'POINTS', 'LETTER', 'ALPHABET', 'DICTIONARY', 'VALID', 'MOVE', 'CHECK'
            ];
            return fallbackWords.filter(word => {
                const wordLetters = word.split('').sort();
                let letterIndex = 0;
                let wordIndex = 0;

                while (letterIndex < sortedLetters.length && wordIndex < wordLetters.length) {
                    if (sortedLetters[letterIndex] === wordLetters[wordIndex]) {
                        letterIndex++;
                        wordIndex++;
                    } else if (sortedLetters[letterIndex] < wordLetters[wordIndex]) {
                        letterIndex++;
                    } else {
                        return false;
                    }
                }

                return wordIndex === wordLetters.length;
            });
        }

        // Filter words that can be made from our letters using a more efficient algorithm
        const words = data
            .map(item => item.word)
            .filter(word => {
                // First check if word length is valid
                if (word.length > letters.length) {
                    return false;
                }

                const wordLetters = word.split('').sort();
                let letterIndex = 0;
                let wordIndex = 0;

                while (letterIndex < sortedLetters.length && wordIndex < wordLetters.length) {
                    if (sortedLetters[letterIndex] === wordLetters[wordIndex]) {
                        letterIndex++;
                        wordIndex++;
                    } else if (sortedLetters[letterIndex] < wordLetters[wordIndex]) {
                        letterIndex++;
                    } else {
                        return false;
                    }
                }

                return wordIndex === wordLetters.length;
            });

        console.log('Found possible words:', words);
        return words;
    } catch (error) {
        console.error('Exception in getPossibleWords:', error);
        return [];
    }
}

// Function to find valid placements for a word
function findValidPlacements(board, word, letters) {
    console.log('Finding valid placements for word:', word);
    const placements = [];
    const wordLength = word.length;
    const isFirstMove = board.every(row => 
        row.every(cell => typeof cell !== 'string' || !cell.match(/[A-Z]/))
    );

    // Check horizontal placements
    for (let row = 0; row < 15; row++) {
        for (let col = 0; col <= 15 - wordLength; col++) {
            let canPlace = true;
            let usedLetters = [...letters];
            let tilesToPlace = [];
            let isAdjacent = false;
            let coversCenter = false;
            let score = 0;
            let wordMultiplier = 1;
            const usedPremiumSquares = new Set();

            for (let i = 0; i < wordLength; i++) {
                const currentCell = board[row][col + i];
                const currentLetter = word[i];

                // Check if this position covers the center star
                if (row === 7 && col + i === 7) {
                    coversCenter = true;
                }

                if (typeof currentCell === 'string' && currentCell.match(/[A-Z]/)) {
                    // Cell is already occupied
                    if (currentCell !== currentLetter) {
                        canPlace = false;
                        break;
                    }
                    isAdjacent = true;
                    score += letterScores[currentLetter];
                } else {
                    // Cell is empty, check if we have the letter
                    const letterIndex = usedLetters.indexOf(currentLetter);
                    if (letterIndex === -1) {
                        canPlace = false;
                        break;
                    }
                    usedLetters.splice(letterIndex, 1);
                    tilesToPlace.push({ row, col: col + i, letter: currentLetter });

                    // Calculate score with premium squares
                    const premiumType = boardMultipliers[row][col + i];
                    let letterMultiplier = 1;

                    if (premiumType === 3) { // Double word
                        if (!usedPremiumSquares.has(`DW-${row}-${col + i}`)) {
                            wordMultiplier *= 2;
                            usedPremiumSquares.add(`DW-${row}-${col + i}`);
                        }
                    } else if (premiumType === 1) { // Double letter
                        letterMultiplier = 2;
                    } else if (premiumType === 2) { // Triple letter
                        letterMultiplier = 3;
                    } else if (premiumType === 4) { // Triple word
                        if (!usedPremiumSquares.has(`TW-${row}-${col + i}`)) {
                            wordMultiplier *= 3;
                            usedPremiumSquares.add(`TW-${row}-${col + i}`);
                        }
                    }

                    score += letterScores[currentLetter] * letterMultiplier;

                    // Check adjacent cells for existing tiles
                    if (!isAdjacent) {
                        const adjacentCells = [
                            { r: row - 1, c: col + i }, { r: row + 1, c: col + i },
                            { r: row, c: col + i - 1 }, { r: row, c: col + i + 1 }
                        ];
                        for (const { r, c } of adjacentCells) {
                            if (r >= 0 && r < 15 && c >= 0 && c < 15 &&
                                typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
                                isAdjacent = true;
                                break;
                            }
                        }
                    }
                }
            }

            if (canPlace && (isFirstMove ? coversCenter : isAdjacent)) {
                score *= wordMultiplier;
                // Add 50-point bonus for using all 7 tiles
                if (tilesToPlace.length === 7) {
                    score += 50;
                }
                placements.push({
                    word,
                    tiles: tilesToPlace,
                    direction: 'horizontal',
                    startRow: row,
                    startCol: col,
                    score
                });
            }
        }
    }

    // Check vertical placements (similar to horizontal but with row/col swapped)
    for (let col = 0; col < 15; col++) {
        for (let row = 0; row <= 15 - wordLength; row++) {
            let canPlace = true;
            let usedLetters = [...letters];
            let tilesToPlace = [];
            let isAdjacent = false;
            let coversCenter = false;
            let score = 0;
            let wordMultiplier = 1;
            const usedPremiumSquares = new Set();

            for (let i = 0; i < wordLength; i++) {
                const currentCell = board[row + i][col];
                const currentLetter = word[i];

                // Check if this position covers the center star
                if (row + i === 7 && col === 7) {
                    coversCenter = true;
                }

                if (typeof currentCell === 'string' && currentCell.match(/[A-Z]/)) {
                    // Cell is already occupied
                    if (currentCell !== currentLetter) {
                        canPlace = false;
                        break;
                    }
                    isAdjacent = true;
                    score += letterScores[currentLetter];
                } else {
                    // Cell is empty, check if we have the letter
                    const letterIndex = usedLetters.indexOf(currentLetter);
                    if (letterIndex === -1) {
                        canPlace = false;
                        break;
                    }
                    usedLetters.splice(letterIndex, 1);
                    tilesToPlace.push({ row: row + i, col, letter: currentLetter });

                    // Calculate score with premium squares
                    const premiumType = boardMultipliers[row + i][col];
                    let letterMultiplier = 1;

                    if (premiumType === 3) { // Double word
                        if (!usedPremiumSquares.has(`DW-${row + i}-${col}`)) {
                            wordMultiplier *= 2;
                            usedPremiumSquares.add(`DW-${row + i}-${col}`);
                        }
                    } else if (premiumType === 1) { // Double letter
                        letterMultiplier = 2;
                    } else if (premiumType === 2) { // Triple letter
                        letterMultiplier = 3;
                    } else if (premiumType === 4) { // Triple word
                        if (!usedPremiumSquares.has(`TW-${row + i}-${col}`)) {
                            wordMultiplier *= 3;
                            usedPremiumSquares.add(`TW-${row + i}-${col}`);
                        }
                    }

                    score += letterScores[currentLetter] * letterMultiplier;

                    // Check adjacent cells for existing tiles
                    if (!isAdjacent) {
                        const adjacentCells = [
                            { r: row + i - 1, c: col }, { r: row + i + 1, c: col },
                            { r: row + i, c: col - 1 }, { r: row + i, c: col + 1 }
                        ];
                        for (const { r, c } of adjacentCells) {
                            if (r >= 0 && r < 15 && c >= 0 && c < 15 &&
                                typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
                                isAdjacent = true;
                                break;
                            }
                        }
                    }
                }
            }

            if (canPlace && (isFirstMove ? coversCenter : isAdjacent)) {
                score *= wordMultiplier;
                // Add 50-point bonus for using all 7 tiles
                if (tilesToPlace.length === 7) {
                    score += 50;
                }
                placements.push({
                    word,
                    tiles: tilesToPlace,
                    direction: 'vertical',
                    startRow: row,
                    startCol: col,
                    score
                });
            }
        }
    }

    console.log('Found valid placements:', placements);
    return placements;
}

// Main function to generate a bot move
async function generateBotMove(board, letters) {
    console.log('Generating bot move with board:', board, 'and letters:', letters);
    if (!letters || letters.length === 0) {
        console.log('No letters available for bot move');
        return null;
    }

    try {
        const possibleWords = await getPossibleWords(letters);
        console.log('Number of possible words found:', possibleWords.length);
        
        if (possibleWords.length === 0) {
            console.log('No possible words found with letters:', letters);
            return null;
        }

        let bestMove = null;
        let bestScore = 0;

        // If it's the first move, we need to place a word on the center star
        const isFirstMove = board.every(row => 
            row.every(cell => typeof cell !== 'string' || !cell.match(/[A-Z]/))
        );
        console.log('Is first move:', isFirstMove);

        for (const word of possibleWords) {
            console.log('Trying word:', word);
            const placements = findValidPlacements(board, word, letters);
            console.log(`Found ${placements.length} placements for word:`, word);
            
            for (const placement of placements) {
                console.log('Evaluating placement:', placement);
                if (placement.score > bestScore) {
                    console.log('New best move found with score:', placement.score);
                    bestScore = placement.score;
                    bestMove = placement;
                }
            }
        }

        if (bestMove) {
            console.log('Best move found:', bestMove);
        } else {
            console.log('No valid moves found');
        }
        return bestMove;
    } catch (error) {
        console.error('Error in generateBotMove:', error);
        return null;
    }
}

exports.handler = async function(event, context) {
    console.log('Bot handler called');
    if (event.httpMethod !== 'POST') {
        console.error('Invalid HTTP method:', event.httpMethod);
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { board, letters } = JSON.parse(event.body);
        console.log('Processing bot move request with board:', board, 'and letters:', letters);
        const move = await generateBotMove(board, letters);

        if (!move) {
            console.log('No move was generated');
        }

        return {
            statusCode: 200,
            body: JSON.stringify(move)
        };
    } catch (error) {
        console.error('Handler error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Internal Server Error',
                message: error.message 
            })
        };
    }
}; 