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

async function getPossibleWords(letters) {
    console.log('Getting possible words for letters:', letters);
    
    if (!letters || letters.length === 0) {
        console.log('No letters provided');
        return [];
    }

    // Convert letters to uppercase and handle blank tiles
    const normalizedLetters = letters.map(letter => letter.toUpperCase());
    const hasBlank = normalizedLetters.includes('?');
    const nonBlankLetters = normalizedLetters.filter(letter => letter !== '?');
    
    // Count occurrences of each letter
    const letterCounts = {};
    nonBlankLetters.forEach(letter => {
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    });
    
    console.log('Normalized letters:', normalizedLetters);
    console.log('Has blank tile:', hasBlank);
    console.log('Non-blank letters:', nonBlankLetters);
    console.log('Letter counts:', letterCounts);

    try {
        // Get words from database that contain our letters
        const { data: words, error } = await supabase
            .from('dictionary')
            .select('word')
            .or(nonBlankLetters.map(letter => `word.ilike.%${letter}%`).join(','))
            .limit(1000);

        if (error) {
            console.error('Error fetching words:', error);
            return [];
        }

        if (!words || words.length === 0) {
            console.log('No words found in database');
            return [];
        }

        console.log('Total words from database:', words.length);

        // Filter words that can be formed with our letters
        const possibleWords = words
            .filter(({ word }) => {
                // First check if word length is valid
                if (word.length > normalizedLetters.length) {
                    return false;
                }

                const wordLetters = word.split('');
                const availableLetters = { ...letterCounts };
                let blanksNeeded = 0;

                // Check if we can form the word with our letters
                for (const letter of wordLetters) {
                    if (availableLetters[letter] > 0) {
                        availableLetters[letter]--;
                    } else {
                        blanksNeeded++;
                    }
                }

                // If we have enough blank tiles to cover missing letters
                return blanksNeeded <= (hasBlank ? 1 : 0);
            })
            .map(({ word }) => word)
            .sort((a, b) => {
                // Sort by length first
                if (b.length !== a.length) {
                    return b.length - a.length;
                }
                // Then by score
                const scoreA = a.split('').reduce((sum, letter) => sum + letterScores[letter], 0);
                const scoreB = b.split('').reduce((sum, letter) => sum + letterScores[letter], 0);
                return scoreB - scoreA;
            });

        console.log('Found possible words:', possibleWords);
        console.log('Number of possible words found:', possibleWords.length);

        return possibleWords;
    } catch (error) {
        console.error('Exception in getPossibleWords:', error);
        return [];
    }
}

// Function to find valid placements for a word
function findValidPlacements(board, letters) {
    console.log('Finding valid placements for letters:', letters);
    const placements = [];
    const isFirstMove = board.every(row => 
        row.every(cell => typeof cell !== 'string' || !cell.match(/[A-Z]/))
    );

    // Check horizontal placements
    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
            // Skip if cell is occupied
            if (typeof board[row][col] === 'string' && board[row][col].match(/[A-Z]/)) {
                continue;
            }

            // Check if this is a valid starting position
            let canPlace = false;
            let isAdjacent = false;
            let coversCenter = false;

            // For first move, must cover center
            if (isFirstMove) {
                if (row === 7 && col === 7) {
                    canPlace = true;
                    coversCenter = true;
                }
            } else {
                // Check adjacent cells
                const adjacentCells = [
                    { r: row - 1, c: col }, { r: row + 1, c: col },
                    { r: row, c: col - 1 }, { r: row, c: col + 1 }
                ];
                for (const { r, c } of adjacentCells) {
                    if (r >= 0 && r < 15 && c >= 0 && c < 15 &&
                        typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
                        canPlace = true;
                        isAdjacent = true;
                        break;
                    }
                }
            }

            if (canPlace) {
                // Try placing letters horizontally
                let horizontalWord = '';
                let tilesToPlace = [];
                let currentCol = col;
                let score = 0;
                let wordMultiplier = 1;
                const usedPremiumSquares = new Set();
                let availableLetters = [...letters];

                // First, check if there are any letters to the left
                let startCol = col;
                while (startCol > 0 && typeof board[row][startCol - 1] === 'string' && 
                       board[row][startCol - 1].match(/[A-Z]/)) {
                    startCol--;
                }

                // Now build the word from left to right
                currentCol = startCol;
                while (currentCol < 15 && (horizontalWord.length < letters.length || 
                       (typeof board[row][currentCol] === 'string' && board[row][currentCol].match(/[A-Z]/)))) {
                    const currentCell = board[row][currentCol];
                    
                    if (typeof currentCell === 'string' && currentCell.match(/[A-Z]/)) {
                        // Cell is already occupied
                        horizontalWord += currentCell;
                        score += letterScores[currentCell];
                    } else {
                        // Try to place a letter
                        if (availableLetters.length > 0) {
                            const letter = availableLetters.shift();
                            horizontalWord += letter;
                            tilesToPlace.push({ row, col: currentCol, letter });

                            // Calculate score with premium squares
                            const premiumType = boardMultipliers[row][currentCol];
                            let letterMultiplier = 1;

                            if (premiumType === 3) { // Double word
                                if (!usedPremiumSquares.has(`DW-${row}-${currentCol}`)) {
                                    wordMultiplier *= 2;
                                    usedPremiumSquares.add(`DW-${row}-${currentCol}`);
                                }
                            } else if (premiumType === 1) { // Double letter
                                letterMultiplier = 2;
                            } else if (premiumType === 2) { // Triple letter
                                letterMultiplier = 3;
                            } else if (premiumType === 4) { // Triple word
                                if (!usedPremiumSquares.has(`TW-${row}-${currentCol}`)) {
                                    wordMultiplier *= 3;
                                    usedPremiumSquares.add(`TW-${row}-${currentCol}`);
                                }
                            }

                            score += letterScores[letter] * letterMultiplier;
                        } else {
                            break;
                        }
                    }
                    currentCol++;
                }

                if (horizontalWord.length >= 2) {
                    score *= wordMultiplier;
                    if (tilesToPlace.length === 7) {
                        score += 50; // Bingo bonus
                    }
                    placements.push({
                        word: horizontalWord,
                        tiles: tilesToPlace,
                        direction: 'horizontal',
                        startRow: row,
                        startCol: startCol,
                        score
                    });
                }

                // Try placing letters vertically (similar to horizontal but with row/col swapped)
                let verticalWord = '';
                tilesToPlace = [];
                let currentRow = row;
                score = 0;
                wordMultiplier = 1;
                usedPremiumSquares.clear();
                availableLetters = [...letters];

                // First, check if there are any letters above
                let startRow = row;
                while (startRow > 0 && typeof board[startRow - 1][col] === 'string' && 
                       board[startRow - 1][col].match(/[A-Z]/)) {
                    startRow--;
                }

                // Now build the word from top to bottom
                currentRow = startRow;
                while (currentRow < 15 && (verticalWord.length < letters.length || 
                       (typeof board[currentRow][col] === 'string' && board[currentRow][col].match(/[A-Z]/)))) {
                    const currentCell = board[currentRow][col];
                    
                    if (typeof currentCell === 'string' && currentCell.match(/[A-Z]/)) {
                        verticalWord += currentCell;
                        score += letterScores[currentCell];
                    } else {
                        if (availableLetters.length > 0) {
                            const letter = availableLetters.shift();
                            verticalWord += letter;
                            tilesToPlace.push({ row: currentRow, col, letter });

                            const premiumType = boardMultipliers[currentRow][col];
                            let letterMultiplier = 1;

                            if (premiumType === 3) {
                                if (!usedPremiumSquares.has(`DW-${currentRow}-${col}`)) {
                                    wordMultiplier *= 2;
                                    usedPremiumSquares.add(`DW-${currentRow}-${col}`);
                                }
                            } else if (premiumType === 1) {
                                letterMultiplier = 2;
                            } else if (premiumType === 2) {
                                letterMultiplier = 3;
                            } else if (premiumType === 4) {
                                if (!usedPremiumSquares.has(`TW-${currentRow}-${col}`)) {
                                    wordMultiplier *= 3;
                                    usedPremiumSquares.add(`TW-${currentRow}-${col}`);
                                }
                            }

                            score += letterScores[letter] * letterMultiplier;
                        } else {
                            break;
                        }
                    }
                    currentRow++;
                }

                if (verticalWord.length >= 2) {
                    score *= wordMultiplier;
                    if (tilesToPlace.length === 7) {
                        score += 50;
                    }
                    placements.push({
                        word: verticalWord,
                        tiles: tilesToPlace,
                        direction: 'vertical',
                        startRow: startRow,
                        startCol: col,
                        score
                    });
                }
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
        // First find all possible placements
        const placements = findValidPlacements(board, letters);
        console.log('Number of placements found:', placements.length);
        
        if (placements.length === 0) {
            console.log('No valid placements found');
            return null;
        }

        // Sort placements by score
        placements.sort((a, b) => b.score - a.score);

        // Check each placement until we find a valid word
        for (const placement of placements) {
            console.log('Checking placement:', placement);
            const isValid = await isValidWord(placement.word);
            if (isValid) {
                console.log('Found valid move:', placement);
                return placement;
            }
        }

        console.log('No valid moves found');
        return null;
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