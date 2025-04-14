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
import { createRack } from "../../functions/rackFunctions.js";
import { getComplementaryColor } from "../../functions/tileFunctions.js";
import { addToPool, removeFromPool } from "../../functions/poolFunctions.js";
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
    initializeGame();
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
    if (currentPlayer === 1) {
      const newRack = [...player1Rack];
      newRack[index] = null;
      setPlayer1Rack(newRack);
      setSelectedTiles([...selectedTiles, tile]);
    } else {
      const newRack = [...player2Rack];
      newRack[index] = null;
      setPlayer2Rack(newRack);
      setSelectedTiles([...selectedTiles, tile]);
    }
  };

  const handleBoardClick = (row, col) => {
    console.log('Board clicked at:', { row, col });
    setSelectedBoardPosition({ row, col });
    setArrowDirection('right');
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

  const handleWordSubmit = () => {
    // Update the actual board with the temporary board state
    setBoardCoords(tempBoardCoords);
    
    // Refill rack for current player
    const newPool = [...pool];
    const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
    const newRack = [...currentRack];
    
    // Fill rack with new tiles from pool until it has 7 tiles
    while (newRack.length < 7 && newPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * newPool.length);
      newRack.push(newPool[randomIndex]);
      newPool.splice(randomIndex, 1);
    }
    
    // Update the appropriate rack
    if (currentPlayer === 1) {
      setPlayer1Rack(newRack);
    } else {
      setPlayer2Rack(newRack);
    }
    
    setPool(newPool);
    
    // Switch player and reset selection
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    setSelectedBoardPosition(null);
    
    // Reset temporary board to match the actual board
    setTempBoardCoords(boardCoords);
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

          <div className={styles.playerInfo}>
            <h3>Player {currentPlayer}</h3>
            <button 
              className={styles.directionToggle}
              onClick={() => {
                console.log('Direction toggle clicked');
                const newDirection = arrowDirection === 'right' ? 'down' : 'right';
                console.log('Changing direction to:', newDirection);
                setArrowDirection(newDirection);
              }}
            >
              Toggle Direction ({arrowDirection === 'right' ? '→' : '↓'})
            </button>
          </div>
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