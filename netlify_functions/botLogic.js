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
    const { data, error } = await supabase
        .from('dictionary')
        .select('word')
        .ilike('word', `%${letters}%`);

    if (error) {
        console.error('Error getting possible words:', error);
        return [];
    }

    const words = data.map(item => item.word);
    console.log('Found possible words:', words);
    return words;
}

// Function to find valid placements for a word
function findValidPlacements(board, word, letters) {
    console.log('Finding valid placements for word:', word);
    const placements = [];
    const wordLength = word.length;

    // Check horizontal placements
    for (let row = 0; row < 15; row++) {
        for (let col = 0; col <= 15 - wordLength; col++) {
            let canPlace = true;
            let usedLetters = [...letters];
            let tilesToPlace = [];

            for (let i = 0; i < wordLength; i++) {
                const currentCell = board[row][col + i];
                const currentLetter = word[i];

                if (typeof currentCell === 'string' && currentCell.match(/[A-Z]/)) {
                    // Cell is already occupied
                    if (currentCell !== currentLetter) {
                        canPlace = false;
                        break;
                    }
                } else {
                    // Cell is empty, check if we have the letter
                    const letterIndex = usedLetters.indexOf(currentLetter);
                    if (letterIndex === -1) {
                        canPlace = false;
                        break;
                    }
                    usedLetters.splice(letterIndex, 1);
                    tilesToPlace.push({ row, col: col + i, letter: currentLetter });
                }
            }

            if (canPlace) {
                placements.push({
                    word,
                    tiles: tilesToPlace,
                    direction: 'horizontal',
                    startRow: row,
                    startCol: col
                });
            }
        }
    }

    // Check vertical placements
    for (let col = 0; col < 15; col++) {
        for (let row = 0; row <= 15 - wordLength; row++) {
            let canPlace = true;
            let usedLetters = [...letters];
            let tilesToPlace = [];

            for (let i = 0; i < wordLength; i++) {
                const currentCell = board[row + i][col];
                const currentLetter = word[i];

                if (typeof currentCell === 'string' && currentCell.match(/[A-Z]/)) {
                    // Cell is already occupied
                    if (currentCell !== currentLetter) {
                        canPlace = false;
                        break;
                    }
                } else {
                    // Cell is empty, check if we have the letter
                    const letterIndex = usedLetters.indexOf(currentLetter);
                    if (letterIndex === -1) {
                        canPlace = false;
                        break;
                    }
                    usedLetters.splice(letterIndex, 1);
                    tilesToPlace.push({ row: row + i, col, letter: currentLetter });
                }
            }

            if (canPlace) {
                placements.push({
                    word,
                    tiles: tilesToPlace,
                    direction: 'vertical',
                    startRow: row,
                    startCol: col
                });
            }
        }
    }

    console.log('Found valid placements:', placements);
    return placements;
}

// Function to calculate score for a placement
function calculateScore(board, placement) {
    let score = 0;
    let wordMultiplier = 1;
    const usedPremiumSquares = new Set();

    for (const tile of placement.tiles) {
        const letter = tile.letter;
        const row = tile.row;
        const col = tile.col;
        const letterScore = letterScores[letter];
        let letterMultiplier = 1;

        // Check premium squares
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

        score += letterScore * letterMultiplier;
    }

    return score * wordMultiplier;
}

// Main function to generate a bot move
async function generateBotMove(board, letters) {
    console.log('Generating bot move', { board, letters });
    const possibleWords = await getPossibleWords(letters.join(''));
    let bestMove = null;
    let bestScore = 0;

    // If it's the first move, we need to place a word on the center star
    const isFirstMove = board.every(row => 
        row.every(cell => typeof cell !== 'string' || !cell.match(/[A-Z]/))
    );
    console.log('Is first move:', isFirstMove);

    for (const word of possibleWords) {
        const placements = findValidPlacements(board, word, letters);
        
        for (const placement of placements) {
            // For first move, ensure it covers the center star
            if (isFirstMove) {
                const coversCenter = placement.tiles.some(tile => 
                    tile.row === 7 && tile.col === 7
                );
                if (!coversCenter) continue;
            }

            const score = calculateScore(board, placement);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = placement;
            }
        }
    }

    console.log('Best move found:', bestMove);
    return bestMove;
}

exports.handler = async function(event, context) {
    console.log('Bot handler called');
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { board, letters } = JSON.parse(event.body);
        console.log('Processing bot move request', { board, letters });
        const move = await generateBotMove(board, letters);

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