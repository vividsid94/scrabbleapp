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
    setBoardCoords(parsedOrigBoardCoords);
    setTempBoardCoords(parsedOrigBoardCoords);

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

    // Prevent Alt and Shift keys from affecting the board
    if (e.altKey || e.shiftKey) {
      e.preventDefault();
      return;
    }

    // Handle arrow keys to change direction
    if (e.key === 'ArrowRight') {
      setArrowDirection('right');
      return;
    } else if (e.key === 'ArrowDown') {
      setArrowDirection('down');
      return;
    }

    // Handle Enter key to submit move
    if (e.key === 'Enter') {
      handleWordSubmit();
      return;
    }

    // Handle backspace
    if (e.key === 'Backspace') {
      const newTempBoard = [...tempBoardCoords];
      // Get the position where the last tile was placed (one position back from current)
      const lastRow = arrowDirection === 'right' ? row : row - 1;
      const lastCol = arrowDirection === 'right' ? col - 1 : col;
      
      // Only proceed if we're not at the edge of the board
      if (lastRow >= 0 && lastCol >= 0) {
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
      if (col < 14) {
        setSelectedBoardPosition({ row, col: col + 1 });
      }
    } else {
      if (row < 14) {
        setSelectedBoardPosition({ row: row + 1, col });
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
      // Tile came from player 1's rack
      const newRack = [...player1Rack];
      newRack.splice(player1Index, 1);
      setPlayer1Rack(newRack);
    } else if (player2Index !== -1) {
      // Tile came from player 2's rack
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
    if (!selectedBoardPosition || selectedTiles.length === 0) {
      console.log('Cannot submit: No position or tiles selected');
      return;
    }

    console.log('Submitting move:', {
      position: selectedBoardPosition,
      tiles: selectedTiles,
      direction: arrowDirection
    });

    // Validate move structure
    const isFirstMove = boardCoords.every(row => row.every(cell => cell === 0));
    const { row, col } = selectedBoardPosition;

    // Check if first move covers center square
    if (isFirstMove) {
      const centerSquare = { row: 7, col: 7 };
      let coversCenter = false;
      let currentRow = row;
      let currentCol = col;

      for (let i = 0; i < selectedTiles.length; i++) {
        if (currentRow === centerSquare.row && currentCol === centerSquare.col) {
          coversCenter = true;
          break;
        }
        if (arrowDirection === 'right') {
          currentCol++;
        } else {
          currentRow++;
        }
      }

      if (!coversCenter) {
        alert('First move must cover the center square');
        return;
      }
    } else {
      // Check if move connects to existing tiles
      let connectsToExisting = false;
      let currentRow = row;
      let currentCol = col;

      for (let i = 0; i < selectedTiles.length; i++) {
        // Check adjacent squares
        const adjacentPositions = [
          { row: currentRow - 1, col: currentCol },
          { row: currentRow + 1, col: currentCol },
          { row: currentRow, col: currentCol - 1 },
          { row: currentRow, col: currentCol + 1 }
        ];

        for (const pos of adjacentPositions) {
          if (pos.row >= 0 && pos.row < 15 && pos.col >= 0 && pos.col < 15) {
            if (boardCoords[pos.row][pos.col] !== 0) {
              connectsToExisting = true;
              break;
            }
          }
        }

        if (connectsToExisting) break;

        if (arrowDirection === 'right') {
          currentCol++;
        } else {
          currentRow++;
        }
      }

      if (!connectsToExisting) {
        alert('Move must connect to existing tiles');
        return;
      }
    }

    // Update the board with the move
    const newBoard = [...boardCoords];
    let currentRow = selectedBoardPosition.row;
    let currentCol = selectedBoardPosition.col;

    // Copy tiles from tempBoardCoords to boardCoords
    for (let i = 0; i < selectedTiles.length; i++) {
      newBoard[currentRow][currentCol] = tempBoardCoords[currentRow][currentCol];
      if (arrowDirection === 'right') {
        currentCol++;
      } else {
        currentRow++;
      }
    }

    setBoardCoords(newBoard);
    setTempBoardCoords(newBoard); // Update tempBoardCoords to match
    
    // Update player's score (simple scoring for now)
    let score = 0;
    for (const tile of selectedTiles) {
      score += getTileValue(tile);
    }
    
    if (currentPlayer === 1) {
      setPlayer1points(player1points + score);
    } else {
      setPlayer2points(player2points + score);
    }

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
    
    // Add new tiles from pool
    while (newRack.length < 7 && newPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * newPool.length);
      newRack.push(newPool[randomIndex]);
      newPool.splice(randomIndex, 1);
    }
    
    if (currentPlayer === 1) {
      setPlayer1Rack(newRack);
    } else {
      setPlayer2Rack(newRack);
    }
    
    setPool(newPool);
    
    // Switch players
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    setSelectedBoardPosition(null);
    setSelectedTiles([]);
    setArrowDirection('right');
  };

  function getTileValue(letter) {
    const values = {
      'A': 1, 'E': 1, 'I': 1, 'O': 1, 'U': 1, 'L': 1, 'N': 1, 'S': 1, 'T': 1, 'R': 1,
      'D': 2, 'G': 2,
      'B': 3, 'C': 3, 'M': 3, 'P': 3,
      'F': 4, 'H': 4, 'V': 4, 'W': 4, 'Y': 4,
      'K': 5,
      'J': 8, 'X': 8,
      'Q': 10, 'Z': 10
    };
    return values[letter] || 0;
  }

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

  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
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
            <Box className={styles.playerToggle}>
              <Tooltip title="Settings">
                <SettingsOutlinedIcon className={styles.keyBtn} onClick={handleSettingsOpen}/>
              </Tooltip>
              <Tooltip title="Color Scheme">
                <ColorizeIcon className={styles.keyBtn} onClick={handleColorSchemeOpen}/>
              </Tooltip>
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
            <Box className={styles.wordInput}>
              <Button 
                variant="contained" 
                onClick={handleWordSubmit}
                disabled={!selectedBoardPosition || selectedTiles.length === 0}
              >
                Submit
              </Button>
            </Box>
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
  );
} 