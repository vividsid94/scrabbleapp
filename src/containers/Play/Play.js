import React, { useState, useEffect, useRef } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Play.module.css';
import Board from "../../components/AppContent/Board/Board.js";
import Rack from "../../components/AppContent/Board/Rack.js";
import Pool from "../../components/AppContent/Board/Pool.js";
import Modal from '@mui/material/Modal';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ColorizeIcon from '@mui/icons-material/Colorize';
import { origPool, origBoard } from "../../components/AppContent/References/staticData.js";
import { createBoard, updateBoard } from "../../functions/boardFunctions.js";
import { TextField, Tooltip, Button } from "@mui/material";

export default function Play() {
  const [boardCoords, setBoardCoords] = useState([]);
  const [tempBoardCoords, setTempBoardCoords] = useState([]);
  const [origBoardCoords, setOrigBoardCoords] = useState([]);
  const [player1points, setPlayer1points] = useState(0);
  const [player2points, setPlayer2points] = useState(0);
  const [pointsScored, setPointsScored] = useState(0);
  const [pool, setPool] = useState(origPool);
  const [theme, setTheme] = useState("STANDARD");
  const [tiles, setTiles] = useState("PROTILES");
  const [dictionary, setDictionary] = useState("ANY");
  const [open, setOpen] = useState(false);
  const [modalContent, setModalContent] = useState("settings");
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [player1Rack, setPlayer1Rack] = useState([]);
  const [player2Rack, setPlayer2Rack] = useState([]);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [selectedBoardPosition, setSelectedBoardPosition] = useState(null);
  const [wordInput, setWordInput] = useState("");
  const [arrowDirection, setArrowDirection] = useState('right');
  const color = useRef('#60857C');
  const complementaryColor = useRef('#9F7A83');

  useEffect(() => {
    let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    setOrigBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setTempBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    
    const timer = setTimeout(() => {
      initializeGame();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const initializeGame = () => {
    // Initialize player racks with 7 tiles each
    const newPool = [...origPool];
    const rack1 = [];
    const rack2 = [];
    
    for (let i = 0; i < 7; i++) {
      const randomIndex1 = Math.floor(Math.random() * newPool.length);
      rack1.push(newPool[randomIndex1]);
      newPool.splice(randomIndex1, 1);
      
      const randomIndex2 = Math.floor(Math.random() * newPool.length);
      rack2.push(newPool[randomIndex2]);
      newPool.splice(randomIndex2, 1);
    }
    
    setPlayer1Rack(rack1);
    setPlayer2Rack(rack2);
    setPool(newPool);
  };

  const handleTileClick = (tile, index) => {

  };

  const handleBoardClick = (row, col) => {
    if (!boardCoords || !boardCoords[row] || typeof boardCoords[row][col] !== 'number') {
      console.log('Invalid board position:', { row, col });
      return;
    }
    console.log('Board clicked at:', { row, col });
    const isSamePosition =
      selectedBoardPosition?.row === row &&
      selectedBoardPosition?.col === col;
    setSelectedBoardPosition({ row, col });
    if (isSamePosition) {
      setArrowDirection(prev =>
        prev === 'right' ? 'down' : 'right'
      );
    }
  };

  const handleKeyDown = (e) => {
    if (!selectedBoardPosition) return;

    const { row, col } = selectedBoardPosition;
    const key = e.key.toUpperCase();

    if (e.altKey || e.shiftKey) {
      e.preventDefault();
      return;
    }

    if (e.key === 'ArrowRight') {
      setArrowDirection('right');
      return;
    } else if (e.key === 'ArrowDown') {
      setArrowDirection('down');
      return;
    }

    if (e.key === 'Enter') {
      handleWordSubmit();
      return;
    }

    if (e.key === 'Backspace') {
      const newTempBoard = [...tempBoardCoords];
      // Get the position where the last tile was placed (one position back from current)
      const lastRow = arrowDirection === 'right' ? row : row - 1;
      const lastCol = arrowDirection === 'right' ? col - 1 : col;
      
      // Only proceed if we're not at the edge of the board and there's no submitted tile
      if (lastRow >= 0 && lastCol >= 0 && Number.isInteger(boardCoords[lastRow][lastCol])) {
        const tileToRemove = newTempBoard[lastRow][lastCol];
        
        // Check if there's a letter tile in the last position
        if (typeof tileToRemove === 'string' && tileToRemove.length === 1) {
          // Get the original empty board value (premium square info)
          const originalBoard = JSON.parse(origBoard);
          newTempBoard[lastRow][lastCol] = originalBoard[lastRow][lastCol];
          setTempBoardCoords(newTempBoard);
          
          // Return the tile to the current player's rack
          const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
          const newRack = [...currentRack, tileToRemove];
          if (currentPlayer === 1) {
            setPlayer1Rack(newRack);
          } else {
            setPlayer2Rack(newRack);
          }

          // Update selectedTiles
          setSelectedTiles(prevTiles => {
            const newTiles = [...prevTiles];
            newTiles.pop();
            return newTiles;
          });
        }
      }
      
      // Move back one position
      if (arrowDirection === 'right') {
        if (col > 0) {
          setSelectedBoardPosition({ row, col: col - 1 });
        }
      } else {
        if (row > 0) {
          setSelectedBoardPosition({ row: row - 1, col });
        }
      }
      return;
    }

    // Only process letter keys (A-Z)
    if (!/[A-Z]/.test(key)) return;

    // Check if the current player has this letter in their rack
    const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
    const tileIndex = currentRack.indexOf(key);
    
    if (tileIndex === -1) {
      // Letter not found in rack
      return;
    }

    // Check if there's already a submitted tile at this position
    if (!Number.isInteger(boardCoords[row][col])) {
      return;
    }

    // Remove the tile from the rack
    const newRack = [...currentRack];
    newRack.splice(tileIndex, 1);
    if (currentPlayer === 1) {
      setPlayer1Rack(newRack);
    } else {
      setPlayer2Rack(newRack);
    }

    // Add the letter to the board
    const newTempBoard = [...tempBoardCoords];
    newTempBoard[row][col] = key;
    setTempBoardCoords(newTempBoard);

    // Update selectedTiles
    setSelectedTiles(prevTiles => [...prevTiles, key]);

    // Move to next position based on direction
    if (arrowDirection === 'right') {
      let nextCol = col + 1;
      // Skip over any submitted tiles
      while (nextCol <= 14 && !Number.isInteger(boardCoords[row][nextCol])) {
        nextCol++;
      }
      if (nextCol <= 14) {
        setSelectedBoardPosition({ row, col: nextCol });
      }
    } else {
      let nextRow = row + 1;
      // Skip over any submitted tiles
      while (nextRow <= 14 && !Number.isInteger(boardCoords[nextRow][col])) {
        nextRow++;
      }
      if (nextRow <= 14) {
        setSelectedBoardPosition({ row: nextRow, col });
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedBoardPosition, arrowDirection]);

  const handleTileDrop = (tile, index, row, col) => {
    // Find which rack the tile came from
    const player1Index = player1Rack.indexOf(tile);
    const player2Index = player2Rack.indexOf(tile);
    
    if (player1Index !== -1) {
      const newRack = [...player1Rack];
      newRack.splice(player1Index, 1);
      setPlayer1Rack(newRack);
    } else if (player2Index !== -1) {
      const newRack = [...player2Rack];
      newRack.splice(player2Index, 1);
      setPlayer2Rack(newRack);
    }
    
    setSelectedTiles([...selectedTiles, tile]);
    setSelectedBoardPosition({ row, col });

    // Update temporary board to show the tile
    const newTempBoard = [...tempBoardCoords];
    newTempBoard[row][col] = tile;
    setTempBoardCoords(newTempBoard);
  };

  const handleWordSubmit = async () => {
    const validationResult = isValidScrabblePlacement(boardCoords, tempBoardCoords);
    if (!validationResult.isValid) {
      console.log('Invalid move');
      return;
    }
    console.log("Score (Two Words):", scorePlay(boardCoords, tempBoardCoords));
    console.log('Submitting move:', {
      position: selectedBoardPosition,
      tiles: selectedTiles,
      direction: arrowDirection
    });

    // Refill the current player's rack
    const newPool = [...pool];
    const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
    const newRack = [...currentRack];
    
    // Remove used tiles
    for (const tile of selectedTiles) {
      const index = newRack.indexOf(tile);
      if (index !== -1) {
        newRack.splice(index, 1);
      }
    }
    if (currentPlayer === 1) {
      setPlayer1Rack(newRack);
    } else {
      setPlayer2Rack(newRack);
    }
    
    setPool(newPool);
    
    // Add new tiles from pool
    while (newRack.length < 7 && newPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * newPool.length);
      newRack.push(newPool[randomIndex]);
      newPool.splice(randomIndex, 1);
    }

    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    setSelectedBoardPosition(null);
    setSelectedTiles([]);
    setArrowDirection('right');
    setBoardCoords(JSON.parse(JSON.stringify(tempBoardCoords)));
  };

  const handleSettingsOpen = () => {
    setModalContent("settings");
    setOpen(true);
  };

  const handleColorSchemeOpen = () => {
    setModalContent("colorScheme");
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleDictionaryChange = event => {
    setDictionary(event.target.value);
  };

  const handleTileChange = event => {
    setTiles(event.target.value);
  };

  const isValidScrabblePlacement = (beforeBoard, afterBoard) => {
    const placedTiles = [];
    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
            if (typeof afterBoard[r][c] === 'string' && afterBoard[r][c].match(/[A-Z]/) && (typeof beforeBoard[r][c] !== 'string' || !beforeBoard[r][c].match(/[A-Z]/))) {
                placedTiles.push({ row: r, col: c, letter: afterBoard[r][c] });
            }
        }
    }

    const numPlaced = placedTiles.length;

    if (numPlaced === 0) {
        console.log("Validation: Invalid - No tiles placed.");
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
            console.log("Validation: Invalid - Tiles not in the same row or column.");
            return { isValid: false, words: [] };
        }

        if (allSameRow) {
            const cols = placedTiles.map(tile => tile.col).sort((a, b) => a - b);
            for (let i = 0; i < cols.length - 1; i++) {
                if (cols[i + 1] - cols[i] > 1) {
                    // Check for existing tiles in between
                    for (let c = cols[i] + 1; c < cols[i + 1]; c++) {
                        if (typeof beforeBoard[firstRow][c] !== 'string' || !beforeBoard[firstRow][c].match(/[A-Z]/)) {
                            console.log("Validation: Invalid - Horizontal placement has a gap with no existing tile.");
                            return { isValid: false, words: [] };
                        }
                    }
                }
            }
        } else if (allSameCol) {
            const rows = placedTiles.map(tile => tile.row).sort((a, b) => a - b);
            for (let i = 0; i < rows.length - 1; i++) {
                if (rows[i + 1] - rows[i] > 1) {
                    // Check for existing tiles in between
                    for (let r = rows[i] + 1; r < rows[i + 1]; r++) {
                        if (typeof beforeBoard[r][firstCol] !== 'string' || !beforeBoard[r][firstCol].match(/[A-Z]/)) {
                            console.log("Validation: Invalid - Vertical placement has a gap with no existing tile.");
                            return { isValid: false, words: [] };
                        }
                    }
                }
            }
        }
    }

    // Check for adjacency to existing tiles or first move on star
    let isAdjacent = false;
    let isOnStar = false;

    for (const tile of placedTiles) {
        const { row, col } = tile;

        // Check for adjacency
        const adjacentSquares = [
            { dr: 0, dc: 1 }, { dr: 0, dc: -1 }, { dr: 1, dc: 0 }, { dr: -1, dc: 0 }
        ];
        for (const adj of adjacentSquares) {
            const nr = row + adj.dr;
            const nc = col + adj.dc;
            if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && typeof beforeBoard[nr][nc] === 'string' && beforeBoard[nr][nc].match(/[A-Z]/)) {
                isAdjacent = true;
                break;
            }
        }
        if (isAdjacent) {
            break;
        }

        // Check for first move on star (assuming center is 7,7)
        if (row === 7 && col === 7) {
            isOnStar = true;
        }
    }

    // Determine if it's the first move
    const isFirstMove = beforeBoard.every(row => row.every(cell => typeof cell !== 'string' || !cell.match(/[A-Z]/)));

    if (isFirstMove) {
        if (!isOnStar && numPlaced > 0) { // Ensure at least one tile is placed on the star for the first move
            const placedOnStar = placedTiles.some(tile => tile.row === 7 && tile.col === 7);
            if (!placedOnStar) {
                console.log("Validation: Invalid - First move must cover the star.");
                return { isValid: false, words: [] };
            }
        } else if (isFirstMove && numPlaced > 0 && isOnStar) {
            console.log("Validation: Valid - First move covers the star.");
        } else if (isFirstMove && numPlaced === 0) {
            console.log("Validation: Invalid - First move requires placing at least one tile.");
            return { isValid: false, words: [] };
        }
    } else {
        if (!isAdjacent) {
            console.log("Validation: Invalid - Subsequent moves must be adjacent to existing tiles.");
            return { isValid: false, words: [] };
        } else {
            console.log("Validation: Valid - Subsequent move is adjacent to existing tiles.");
        }
    }

    // If placement is valid, now find the words
    if ((isFirstMove && isOnStar && numPlaced > 0) || (!isFirstMove && isAdjacent)) {
        const words = findNewWords(beforeBoard, afterBoard, placedTiles);
        console.log("Created Words:", words);
        return { isValid: true, words: words };
    }

    return { isValid: false, words: [] };
  }

  function scorePlay(beforeBoard, afterBoard) {
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
        [4, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 4], // Center is DW for first play
        [0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
        [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
        [1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1],
        [0, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, 0, 3, 0, 0],
        [0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0],
        [4, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 4]
    ];

    let totalScore = 0;
    const formedWords = new Set();
    const placedTiles = [];

    // Identify placed tiles
    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
            if (typeof afterBoard[r][c] === 'string' && afterBoard[r][c].match(/[A-Z]/) &&
                (typeof beforeBoard[r][c] !== 'string' || !beforeBoard[r][c].match(/[A-Z]/))) {
                placedTiles.push({ row: r, col: c, letter: afterBoard[r][c] });
            }
        }
    }

    if (placedTiles.length === 0) {
        console.log("Scoring: No new tiles placed.");
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
                if (premiumType === 2) multiplier = 2; // DL
                else if (premiumType === 3) multiplier = 3; // TL
                else if (premiumType === 4 && !usedPremiumSquares.has(`DW-${row}-${col}`)) { wordMultiplier *= 2; usedPremiumSquares.add(`DW-${row}-${col}`); } // DW
                else if (premiumType === 1 && !usedPremiumSquares.has(`TW-${row}-${col}`)) { wordMultiplier *= 3; usedPremiumSquares.add(`TW-${row}-${col}`); } // TW
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
            while (currentCol >= 0 && typeof board[currentRow][currentCol] === 'string' && board[currentRow][currentCol].match(/[A-Z]/)) {
                currentCol--;
            }
            currentCol++;
            while (currentCol < 15 && typeof board[currentRow][currentCol] === 'string' && board[currentRow][currentCol].match(/[A-Z]/)) {
                word.push({ letter: board[currentRow][currentCol], row: currentRow, col: currentCol });
                currentCol++;
            }
        } else if (directionToCheck === 'vertical') {
            while (currentRow >= 0 && typeof board[currentRow][currentCol] === 'string' && board[currentRow][currentCol].match(/[A-Z]/)) {
                currentRow--;
            }
            currentRow++;
            while (currentRow < 15 && typeof board[currentRow][currentCol] === 'string' && board[currentRow][currentCol].match(/[A-Z]/)) {
                word.push({ letter: board[currentRow][currentCol], row: currentRow, col: currentCol });
                currentRow++;
            }
        }
        return word.length > 1 ? word : [];
    }

    // Score primary and perpendicular words formed by each placed tile
    for (const placedTile of placedTiles) {
        const r = placedTile.row;
        const c = placedTile.col;

        // Check horizontal word formed by this tile
        const horizontalWord = findWord(afterBoard, r, c, 'horizontal');
        if (horizontalWord.length > 0) {
            const newTilesOnWord = horizontalWord.filter(wt => wt.row === r && placedTiles.some(pt => pt.col === wt.col && pt.row === r));
            if (newTilesOnWord.length > 0) {
                const wordString = horizontalWord.map(lt => lt.letter).join('');
                if (!formedWords.has(wordString)) {
                    totalScore += getWordScore(horizontalWord, newTilesOnWord);
                    formedWords.add(wordString);
                }
            }
        }

        // Check vertical word formed by this tile
        const verticalWord = findWord(afterBoard, r, c, 'vertical');
        if (verticalWord.length > 0) {
            const newTilesOnWord = verticalWord.filter(wt => wt.col === c && placedTiles.some(pt => pt.row === wt.row && pt.col === c));
            if (newTilesOnWord.length > 0) {
                const wordString = verticalWord.map(lt => lt.letter).join('');
                if (!formedWords.has(wordString)) {
                    totalScore += getWordScore(verticalWord, newTilesOnWord);
                    formedWords.add(wordString);
                }
            }
        }
    }

    // Check for bingo (all 7 tiles placed in one turn - we need to infer this)
    if (placedTiles.length === 7 && beforeBoard.every(row => row.every(cell => typeof cell !== 'string' || !cell.match(/[A-Z]/)))) {
        totalScore += 50; // First move bingo
    } else if (placedTiles.length === 7) {
        // Need a way to know if all 7 were placed in this turn.
        // A more robust game state would track tiles in hand.
        // For now, we'll assume if 7 are placed and it's not the very first turn, it's a bingo.
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

    console.log("Scoring: Placed Tiles:", placedTiles);
    console.log("Scoring: Formed Words:", Array.from(formedWords));
    console.log("Scoring: Total score for the play:", totalScore);
    return totalScore;
}


  const getWordAt = (board, row, col, direction) => {
      let word = "";
      let r = row;
      let c = col;

      if (direction === "horizontal") {
          // Go left until a non-letter or board end
          while (c >= 0 && typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
              c--;
          }
          c++; // Move back to the start of the word
          while (c < 15 && typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
              word += board[r][c];
              c++;
          }
      } else if (direction === "vertical") {
          // Go up until a non-letter or board end
          while (r >= 0 && typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
              r--;
          }
          r++; // Move back to the start of the word
          while (r < 15 && typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
              word += board[r][c];
              r++;
          }
      }
      return word.length > 1 ? word : null; // Only consider words of length 2 or more
  }

  const findNewWords = (beforeBoard, afterBoard, placedTiles) => {
      const newWords = new Set();

      for (const tile of placedTiles) {
          const { row, col } = tile;

          // Check horizontal word
          const horizontalWord = getWordAt(afterBoard, row, col, "horizontal");
          if (horizontalWord) {
              newWords.add(horizontalWord);
          }

          // Check vertical word
          const verticalWord = getWordAt(afterBoard, row, col, "vertical");
          if (verticalWord) {
              newWords.add(verticalWord);
          }
      }

      return Array.from(newWords);
  }

  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
      <Box className={styles.page}>
      <Box className={styles.title}>
        Play Scrabble
      </Box>
      <Box className={styles.mainPanel}>
        <Box className={styles.mainBox} component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Board 
            board={createBoard(tempBoardCoords, [], tiles, theme, color.current, complementaryColor.current)} 
            theme={theme} 
            onBoardChildClick={(row, col) => {
              console.log('Board component received click:', { row, col });
              handleBoardClick(row, col);
            }}
            onTileDrop={handleTileDrop}
            selectedPosition={selectedBoardPosition}
            arrowDirection={arrowDirection}
            onArrowDirectionChange={(newDirection) => {
                console.log('Play component received direction change:', newDirection);
                setArrowDirection(newDirection);
            }}
            animate={false}
            showSlip={false}
            showDictionary={false}
            dictionary=""
          />   
        </Box>

        <Box className={styles.rightPanel}>
          <Box className={styles.topPlayerPanel}>
            <Box sx={{flexDirection: 'column', lineHeight: '0px'}} className={`${styles.playerPanel}`}>
            <Box className={styles.playerToggle}>
              <Tooltip title="Settings">
                <SettingsOutlinedIcon className={styles.keyBtn} onClick={handleSettingsOpen}/>
              </Tooltip>
              <Tooltip title="Color Scheme">
                <ColorizeIcon className={styles.keyBtn} onClick={handleColorSchemeOpen}/>
              </Tooltip>
            </Box>
              <Box sx={{padding: '8px 0px'}} className={`${styles.playerPanel} ${styles.playerToggle}`}>
              <Button 
                variant="contained" 
                onClick={handleWordSubmit}
                disabled={!selectedBoardPosition || selectedTiles.length === 0}
              >
                Submit
              </Button>
              </Box>
            </Box> 
            {currentPlayer === 1 && (
              <Box className={styles.playerPanel}>
                Player 1
                <Box className={styles.Rack}>
                  <Rack 
                    board={player1Rack} 
                    tiles={tiles} 
                    color={color.current}
                    onTileClick={(tile, index) => {
                      console.log('Tile clicked:', { tile, index });
                      handleTileClick(tile, index);
                    }}
                  />
                </Box>
                <Box>
                  {player1points} points
                </Box>
              </Box>
            )}

            {currentPlayer === 2 && (
              <Box className={styles.playerPanel}>
                Player 2
                <Box className={styles.Rack}>
                  <Rack 
                    board={player2Rack} 
                    tiles={tiles} 
                    color={color.current}
                    onTileClick={(tile, index) => {
                      console.log('Tile clicked:', { tile, index });
                      handleTileClick(tile, index);
                    }}
                  />
                </Box>
                <Box>
                  {player2points} points
                </Box>
              </Box>
            )}
          </Box>

          <Box className={styles.playerPanel}>
            <Box className={styles.poolBox}>
              <Pool board={pool} rack={currentPlayer === 1 ? player1Rack : player2Rack}/>  
            </Box>
          </Box>
        </Box>
      </Box>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className={styles.modalContainer}>
          {modalContent === "settings" && (
            <Box>
              <Box className={styles.modalContainer__dictionary}>
                Dictionary
                <select className={styles.styleSelection} value={dictionary} onChange={handleDictionaryChange}>
                  <option value="ANY">Any</option>
                  <option value="TWL">TWL/NWL</option>
                  <option value="CSW">CSW</option>
                </select>
              </Box>
              <Box className={styles.modalContainer__dictionary}>
                Tiles
                <select className={styles.styleSelection} value={tiles} onChange={handleTileChange}>
                  <option value="PROTILES">Protiles</option>
                  <option value="LETTERS">Letters</option>
                </select>
              </Box>
            </Box>
          )}
        </Box>
      </Modal>
      </Box>
    </Box>
  );
} 