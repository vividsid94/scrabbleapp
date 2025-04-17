const letterScores = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1,
    'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3, 'Q': 10, 'R': 1,
    'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10
};

const boardMultipliers = [
    [4, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 4],
    [0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0],
    [0, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, 0, 3, 0, 0],
    [1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1],
    [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
    [0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
    [0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0],
    [4, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 4],
    [0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0],
    [0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
    [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
    [1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1],
    [0, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, 0, 3, 0, 0],
    [0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0],
    [4, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 4]
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

function isValidScrabblePlacement(beforeBoard, afterBoard) {
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
        return { isValid: false, words: [] };
    }

    if (numPlaced === 1) {
        // Need to check adjacency or first move on star later
    } else {
        const firstRow = placedTiles[0].row;
        const firstCol = placedTiles[0].col;
        const allSameRow = placedTiles.every(tile => tile.row === firstRow);
        const allSameCol = placedTiles.every(tile => tile.col === firstCol);

        if (!allSameRow && !allSameCol) {
            return { isValid: false, words: [] };
        }

        if (allSameRow) {
            const cols = placedTiles.map(tile => tile.col).sort((a, b) => a - b);
            for (let i = 0; i < cols.length - 1; i++) {
                if (cols[i + 1] - cols[i] > 1) {
                    for (let c = cols[i] + 1; c < cols[i + 1]; c++) {
                        if (typeof beforeBoard[firstRow][c] !== 'string' || !beforeBoard[firstRow][c].match(/[A-Z]/)) {
                            return { isValid: false, words: [] };
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
                            return { isValid: false, words: [] };
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
                return { isValid: false, words: [] };
            }
        } else if (isFirstMove && numPlaced === 0) {
            return { isValid: false, words: [] };
        }
    } else {
        if (!isAdjacent) {
            return { isValid: false, words: [] };
        }
    }

    if ((isFirstMove && isOnStar && numPlaced > 0) || (!isFirstMove && isAdjacent)) {
        const words = findNewWords(beforeBoard, afterBoard, placedTiles);
        return { isValid: true, words: words };
    }

    return { isValid: false, words: [] };
}

function scorePlay(beforeBoard, afterBoard) {
    let totalScore = 0;
    const formedWords = new Set();
    const placedTiles = [];

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

    function getWordScore(word, newTilesOnWord) {
        let wordScore = 0;
        let wordMultiplier = 1;
        const usedPremiumSquares = new Set();

        for (let i = 0; i < word.length; i++) {
            const letter = word[i].letter;
            const row = word[i].row;
            const col = word[i].col;
            const letterScore = letterScores[letter];
            let multiplier = 1;
            const isNewTile = newTilesOnWord.some(tile => tile.row === row && tile.col === col);

            if (isNewTile && boardMultipliers[row][col] > 0) {
                const premiumType = boardMultipliers[row][col];
                if (premiumType === 2) multiplier = 2;
                else if (premiumType === 3) multiplier = 3;
                else if (premiumType === 4 && !usedPremiumSquares.has(`DW-${row}-${col}`)) { 
                    wordMultiplier *= 2; 
                    usedPremiumSquares.add(`DW-${row}-${col}`); 
                }
                else if (premiumType === 1 && !usedPremiumSquares.has(`TW-${row}-${col}`)) { 
                    wordMultiplier *= 3; 
                    usedPremiumSquares.add(`TW-${row}-${col}`); 
                }
            }
            wordScore += letterScore * multiplier;
        }
        return wordScore * wordMultiplier;
    }

    function findWord(board, r, c, directionToCheck) {
        let word = [];
        let currentRow = r;
        let currentCol = c;

        if (directionToCheck === 'horizontal') {
            while (currentCol >= 0 && typeof board[currentRow][currentCol] === 'string' && 
                   board[currentRow][currentCol].match(/[A-Z]/)) {
                currentCol--;
            }
            currentCol++;
            while (currentCol < 15 && typeof board[currentRow][currentCol] === 'string' && 
                   board[currentRow][currentCol].match(/[A-Z]/)) {
                word.push({ letter: board[currentRow][currentCol], row: currentRow, col: currentCol });
                currentCol++;
            }
        } else if (directionToCheck === 'vertical') {
            while (currentRow >= 0 && typeof board[currentRow][currentCol] === 'string' && 
                   board[currentRow][currentCol].match(/[A-Z]/)) {
                currentRow--;
            }
            currentRow++;
            while (currentRow < 15 && typeof board[currentRow][currentCol] === 'string' && 
                   board[currentRow][currentCol].match(/[A-Z]/)) {
                word.push({ letter: board[currentRow][currentCol], row: currentRow, col: currentCol });
                currentRow++;
            }
        }
        return word.length > 1 ? word : [];
    }

    for (const placedTile of placedTiles) {
        const r = placedTile.row;
        const c = placedTile.col;

        const horizontalWord = findWord(afterBoard, r, c, 'horizontal');
        if (horizontalWord.length > 0) {
            const newTilesOnWord = horizontalWord.filter(wt => 
                wt.row === r && placedTiles.some(pt => pt.col === wt.col && pt.row === r)
            );
            if (newTilesOnWord.length > 0) {
                const wordString = horizontalWord.map(lt => lt.letter).join('');
                if (!formedWords.has(wordString)) {
                    totalScore += getWordScore(horizontalWord, newTilesOnWord);
                    formedWords.add(wordString);
                }
            }
        }

        const verticalWord = findWord(afterBoard, r, c, 'vertical');
        if (verticalWord.length > 0) {
            const newTilesOnWord = verticalWord.filter(wt => 
                wt.col === c && placedTiles.some(pt => pt.row === wt.row && pt.col === c)
            );
            if (newTilesOnWord.length > 0) {
                const wordString = verticalWord.map(lt => lt.letter).join('');
                if (!formedWords.has(wordString)) {
                    totalScore += getWordScore(verticalWord, newTilesOnWord);
                    formedWords.add(wordString);
                }
            }
        }
    }

    if (placedTiles.length === 7 && beforeBoard.every(row => 
        row.every(cell => typeof cell !== 'string' || !cell.match(/[A-Z]/))
    )) {
        totalScore += 50;
    } else if (placedTiles.length === 7) {
        let tilesBefore = 0;
        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                if (typeof beforeBoard[r][c] === 'string' && beforeBoard[r][c].match(/[A-Z]/)) {
                    tilesBefore++;
                }
            }
        }
        if (tilesBefore > 0) {
            totalScore += 50;
        }
    }

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
            result = isValidScrabblePlacement(beforeBoard, afterBoard);
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