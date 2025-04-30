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
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CheckIcon from '@mui/icons-material/Check';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ForwardIcon from '@mui/icons-material/Forward';
import { origPool, origBoard } from "../../components/AppContent/References/staticData.js";
import { createBoard, updateBoard } from "../../functions/boardFunctions.js";
import { TextField, Tooltip, Button, Snackbar, Alert } from "@mui/material";
import BotSettingsModal from '../../components/Modals/BotSettingsModal';
import TopMovesModal from '../../components/Modals/TopMovesModal';

export default function Play() {
  const [boardCoords, setBoardCoords] = useState([]);
  const [tempBoardCoords, setTempBoardCoords] = useState([]);
  const [origBoardCoords, setOrigBoardCoords] = useState([]);
  const [player1points, setPlayer1points] = useState(0);
  const [player2points, setPlayer2points] = useState(0);
  const [pointsScored, setPointsScored] = useState(0);
  const [pool, setPool] = useState(origPool);
  const [theme] = useState("STANDARD");
  const [dictionary, setDictionary] = useState("ANY");
  const [open, setOpen] = useState(false);
  const [modalContent, setModalContent] = useState("settings");
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [player1Rack, setPlayer1Rack] = useState([]);
  const [player2Rack, setPlayer2Rack] = useState([]);
  const [selectedTiles, setSelectedTiles] = useState([]); 
  const [selectedBoardPosition, setSelectedBoardPosition] = useState(null);
  const [arrowDirection, setArrowDirection] = useState('right');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const color = useRef('#60857C');
  const complementaryColor = useRef('#9F7A83');
  const [isBotMode, setIsBotMode] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');
  const [player1Time, setPlayer1Time] = useState(20 * 60); // 20 minutes in seconds
  const [player2Time, setPlayer2Time] = useState(20 * 60); // 20 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const timerRef = useRef(null);
  const [consecutivePasses, setConsecutivePasses] = useState(0);
  const [showTopMoves, setShowTopMoves] = useState(false);
  const [topMoves, setTopMoves] = useState([]);
  const [isLoadingTopMoves, setIsLoadingTopMoves] = useState(false);
  const [isDictionaryLoading, setIsDictionaryLoading] = useState(false);
  const [showBotSettings, setShowBotSettings] = useState(false);
  const [botGoesFirst, setBotGoesFirst] = useState(false);
  const [tilesToExchange, setTilesToExchange] = useState([]);
  
  // Add audio refs
  const playerMoveSound = useRef(new Audio('/sounds/player-move.mp3'));
  const botMoveSound = useRef(new Audio('/sounds/bot-move.mp3'));

  const alphabetizeRack = (rack) => {
    return [...rack].sort((a, b) => a.localeCompare(b));
  };

  const startGame = () => {
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
    
    setPlayer1Rack(alphabetizeRack(rack1));
    setPlayer2Rack(alphabetizeRack(rack2));
    setPool(newPool);
    setGameStarted(true);
    setTimerActive(true);
  };

  useEffect(() => {
    let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    setOrigBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setTempBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    
    const timer = setTimeout(() => {
      // Don't initialize game automatically anymore
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleTileClick = (tile, index) => {
    const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
    
    // If we're in exchange mode, handle tile selection for exchange
    if (tilesToExchange.length > 0 || selectedTiles.length === 0) {
      const tileIndex = tilesToExchange.findIndex(t => t.tile === tile && t.index === index);
      if (tileIndex === -1) {
        setTilesToExchange([...tilesToExchange, { tile, index }]);
      } else {
        const newTiles = [...tilesToExchange];
        newTiles.splice(tileIndex, 1);
        setTilesToExchange(newTiles);
      }
      return;
    }
    
    // Otherwise handle normal tile selection for play
    const tileIndex = selectedTiles.indexOf(tile);
    if (tileIndex === -1) {
      setSelectedTiles([...selectedTiles, tile]);
    } else {
      const newTiles = [...selectedTiles];
      newTiles.splice(tileIndex, 1);
      setSelectedTiles(newTiles);
    }
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
      const lastRow = arrowDirection === 'right' ? row : row - 1;
      const lastCol = arrowDirection === 'right' ? col - 1 : col;
      
      if (lastRow >= 0 && lastCol >= 0 && Number.isInteger(boardCoords[lastRow][lastCol])) {
        const tileToRemove = newTempBoard[lastRow][lastCol];
        
        if (typeof tileToRemove === 'string' && tileToRemove.length === 1) {
          const originalBoard = JSON.parse(origBoard);
          newTempBoard[lastRow][lastCol] = originalBoard[lastRow][lastCol];
          setTempBoardCoords(newTempBoard);
          
          const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
          const newRack = [...currentRack, tileToRemove];
          if (currentPlayer === 1) {
            setPlayer1Rack(alphabetizeRack(newRack));
          } else {
            setPlayer2Rack(alphabetizeRack(newRack));
          }

          setSelectedTiles(prevTiles => {
            const newTiles = [...prevTiles];
            newTiles.pop();
            return newTiles;
          });
        }
      }
      
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

    if (!/[A-Z]/.test(key)) return;

    const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
    const tileIndex = currentRack.indexOf(key);
    
    if (tileIndex === -1) {
      return;
    }

    if (!Number.isInteger(boardCoords[row][col])) {
      return;
    }

    const newRack = [...currentRack];
    newRack.splice(tileIndex, 1);
    if (currentPlayer === 1) {
      setPlayer1Rack(alphabetizeRack(newRack));
    } else {
      setPlayer2Rack(alphabetizeRack(newRack));
    }

    const newTempBoard = [...tempBoardCoords];
    newTempBoard[row][col] = key;
    setTempBoardCoords(newTempBoard);

    setSelectedTiles(prevTiles => [...prevTiles, key]);

    if (arrowDirection === 'right') {
      let nextCol = col + 1;
      while (nextCol <= 14 && !Number.isInteger(boardCoords[row][nextCol])) {
        nextCol++;
      }
      if (nextCol <= 14) {
        setSelectedBoardPosition({ row, col: nextCol });
      }
    } else {
      let nextRow = row + 1;
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
    const player1Index = player1Rack.indexOf(tile);
    const player2Index = player2Rack.indexOf(tile);
    
    if (player1Index !== -1) {
      const newRack = [...player1Rack];
      newRack.splice(player1Index, 1);
      setPlayer1Rack(alphabetizeRack(newRack));
    } else if (player2Index !== -1) {
      const newRack = [...player2Rack];
      newRack.splice(player2Index, 1);
      setPlayer2Rack(alphabetizeRack(newRack));
    }
    
    setSelectedTiles([...selectedTiles, tile]);
    setSelectedBoardPosition({ row, col });

    const newTempBoard = [...tempBoardCoords];
    newTempBoard[row][col] = tile;
    setTempBoardCoords(newTempBoard);
  };

  const handleWordSubmit = async () => {
    const response = await fetch('/.netlify/functions/gameLogic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'validate',
        beforeBoard: boardCoords,
        afterBoard: tempBoardCoords
      })
    });

    const validationResult = await response.json();
    if (!validationResult.isValid) {
      console.log('Invalid word submission:', {
        reason: validationResult.reason || 'Word not found in dictionary',
        word: validationResult.word || 'Unknown',
        position: selectedBoardPosition,
        direction: arrowDirection
      });

      // Show toast notification
      setSnackbarMessage(validationResult.reason);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);

      // Return tiles to the player's rack
      const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
      const newRack = [...currentRack, ...selectedTiles];
      if (currentPlayer === 1) {
        setPlayer1Rack(alphabetizeRack(newRack));
      } else {
        setPlayer2Rack(alphabetizeRack(newRack));
      }

      // Reset the board state
      setTempBoardCoords(JSON.parse(JSON.stringify(boardCoords)));
      setSelectedTiles([]);
      setSelectedBoardPosition(null);
      return;
    }

    const scoreResponse = await fetch('/.netlify/functions/gameLogic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'score',
        beforeBoard: boardCoords,
        afterBoard: tempBoardCoords
      })
    });

    const score = await scoreResponse.json();
    console.log("Score:", score);

    // Play player move sound
    playerMoveSound.current.play();

    // Update player points
    if (currentPlayer === 1) {
      setPlayer1points(prev => prev + score);
    } else {
      setPlayer2points(prev => prev + score);
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
    if (currentPlayer === 1) {
      setPlayer1Rack(alphabetizeRack(newRack));
    } else {
      setPlayer2Rack(alphabetizeRack(newRack));
    }
    
    setPool(newPool);
    
    // Add new tiles from pool
    while (newRack.length < 7 && newPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * newPool.length);
      newRack.push(newPool[randomIndex]);
      newPool.splice(randomIndex, 1);
    }

    if (currentPlayer === 1) {
      setPlayer1Rack(alphabetizeRack(newRack));
    } else {
      setPlayer2Rack(alphabetizeRack(newRack));
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

  const makeBotMove = async () => {
    console.log('makeBotMove called', { isBotMode, currentPlayer });
    if (!isBotMode || currentPlayer !== 2) {
      console.log('Bot move conditions not met', { isBotMode, currentPlayer });
      return;
    }

    setIsBotThinking(true);
    try {
      // Create a deep copy of the board and rack
      const boardCopy = JSON.parse(JSON.stringify(boardCoords));
      const rackCopy = [...player2Rack];
      
      console.log('Sending bot move request', { board: boardCopy, letters: rackCopy });
      const response = await fetch('/.netlify/functions/botLogic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: boardCopy,
          letters: rackCopy
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const botMove = await response.json();
      console.log('Bot move response:', botMove);
      
      if (!botMove || !botMove.tiles || botMove.tiles.length === 0) {
        console.log('No valid bot move found');
        setSnackbarMessage('Bot could not find a valid move');
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
        setCurrentPlayer(1); // Switch back to player 1 if bot can't move
        return;
      }

      // Create a copy of the board with the bot's move
      const newBoard = JSON.parse(JSON.stringify(boardCoords));
      const newRack = [...player2Rack];
      
      for (const tile of botMove.tiles) {
        if (tile.isNew) {
          newBoard[tile.row][tile.col] = tile.letter;
          const letterIndex = newRack.indexOf(tile.letter);
          if (letterIndex !== -1) {
            newRack.splice(letterIndex, 1);
          }
        }
      }
      
      // Update the board state
      setBoardCoords(newBoard);
      setTempBoardCoords(JSON.parse(JSON.stringify(newBoard)));
      setPlayer2Rack(alphabetizeRack(newRack));
      
      // Draw new tiles for bot
      const newPool = [...pool];
      while (newRack.length < 7 && newPool.length > 0) {
        const randomIndex = Math.floor(Math.random() * newPool.length);
        newRack.push(newPool[randomIndex]);
        newPool.splice(randomIndex, 1);
      }
      setPlayer2Rack(alphabetizeRack(newRack));
      setPool(newPool);
      
      // Update player 2's score
      setPlayer2points(prev => prev + botMove.score);
      
      // Play bot move sound
      botMoveSound.current.play();
      
      // Show toast notification for bot's move
      setSnackbarMessage(`SidBot played "${botMove.word}" for ${botMove.score} points from rack of ${[...player2Rack].sort().join('')}`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      
      // Switch back to player 1
      setCurrentPlayer(1);
      setSelectedBoardPosition(null);
      setSelectedTiles([]);
      setArrowDirection('right');
      
    } catch (error) {
      console.error('Error making bot move:', error);
      setSnackbarMessage('Error making bot move: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setCurrentPlayer(1); // Switch back to player 1 on error
    } finally {
      setIsBotThinking(false);
    }
  };

  // Update useEffect to handle bot turns
  useEffect(() => {
    console.log('Bot turn effect', { isBotMode, currentPlayer, isBotThinking });
    if (isBotMode && currentPlayer === 2 && !isBotThinking) {
      makeBotMove();
    }
  }, [currentPlayer, isBotMode, isBotThinking]);

  const handleSettingsChange = (setting, value) => {
    console.log('Settings change', { setting, value });
    if (setting === 'botMode') {
      setIsBotMode(value);
      if (value && currentPlayer === 2) {
        makeBotMove();
      }
    }
    // ... handle other settings ...
  };

  // Update player2Name when isBotMode changes
  useEffect(() => {
    setPlayer1Name(isBotMode ? 'You' : 'Player 1');
    setPlayer2Name(isBotMode ? 'SidBot' : 'Player 2');
  }, [isBotMode]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Start timer when game starts or player changes
  useEffect(() => {
    if (gameStarted) {
      setTimerActive(true);
    }
  }, [currentPlayer, gameStarted]);

  // Start timer when it's a player's turn
  useEffect(() => {
    if (timerActive && gameStarted) {
      timerRef.current = setInterval(() => {
        if (currentPlayer === 1) {
          setPlayer1Time(prev => {
            if (prev <= 0) {
              clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setPlayer2Time(prev => {
            if (prev <= 0) {
              clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, currentPlayer, gameStarted]);

  const handlePass = () => {
    setConsecutivePasses(prev => prev + 1);
    
    // Check if game should end (six consecutive passes)
    if (consecutivePasses >= 5) {
      setSnackbarMessage('Game ended due to six consecutive passes');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      // TODO: Add game end logic here
      return;
    }

    // Switch to next player
    setCurrentPlayer(prev => prev === 1 ? 2 : 1);
    setSnackbarMessage(`${currentPlayer === 1 ? player1Name : player2Name} passed their turn`);
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    
    // Reset the board state
    setTempBoardCoords(JSON.parse(JSON.stringify(boardCoords)));
    setSelectedTiles([]);
    setSelectedBoardPosition(null);
    
    // If next player is bot, make bot move
    if (isBotMode && currentPlayer === 2) {
      makeBotMove();
    }
  };

  const handleGetTopMoves = async () => {
    setIsLoadingTopMoves(true);
    setShowTopMoves(true); // Show modal immediately when lightbulb is clicked
    try {
      const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
      const response = await fetch('/.netlify/functions/getTopMoves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: boardCoords,
          letters: currentRack
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Check if this is the first load (dictionary loading)
      if (data.message && data.message.includes('Loading dictionary')) {
        setIsDictionaryLoading(true);
        // Retry after a short delay
        setTimeout(() => {
          handleGetTopMoves();
        }, 1000);
        return;
      }
      
      setIsDictionaryLoading(false);
      setTopMoves(data.moves);
    } catch (error) {
      console.error('Error getting top moves:', error);
      setSnackbarMessage('Error getting top moves: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setShowTopMoves(false); // Close modal on error
    } finally {
      setIsLoadingTopMoves(false);
    }
  };

  const handleBotModeToggle = () => {
    setShowBotSettings(true);
  };

  const startBotGame = () => {
    // Reset game state
    let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    setOrigBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setTempBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setPlayer1points(0);
    setPlayer2points(0);
    setPointsScored(0);
    setPool(origPool);
    setCurrentPlayer(botGoesFirst ? 2 : 1);
    setConsecutivePasses(0);
    
    // Initialize player racks
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
    
    setPlayer1Rack(alphabetizeRack(rack1));
    setPlayer2Rack(alphabetizeRack(rack2));
    setPool(newPool);
    
    // Set bot mode and names
    setIsBotMode(true);
    setPlayer1Name('You');
    setPlayer2Name('SidBot');
    
    // Close settings modal
    setShowBotSettings(false);
    
    // If bot goes first, make its move
    if (botGoesFirst) {
      makeBotMove();
    }
  };

  const handleExchange = () => {
    if (tilesToExchange.length === 0) {
      setSnackbarMessage('Please select tiles to exchange');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (pool.length < tilesToExchange.length) {
      setSnackbarMessage('Not enough tiles in pool to exchange');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Check if tiles have been placed on the board for this turn
    const hasTilesPlaced = JSON.stringify(tempBoardCoords) !== JSON.stringify(boardCoords);
    if (hasTilesPlaced) {
      setSnackbarMessage('Remove tiles from the board before exchanging');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
    const newRack = [...currentRack];
    const newPool = [...pool];

    // Sort tiles by index in descending order to avoid index shifting issues
    const sortedTiles = [...tilesToExchange].sort((a, b) => b.index - a.index);
    
    // Remove selected tiles from rack
    sortedTiles.forEach(({ index }) => {
      if (index < newRack.length) {
        newRack.splice(index, 1);
      }
    });

    // Add new tiles from pool
    for (let i = 0; i < tilesToExchange.length; i++) {
      const randomIndex = Math.floor(Math.random() * newPool.length);
      newRack.push(newPool[randomIndex]);
      newPool.splice(randomIndex, 1);
    }

    // Update state with alphabetized rack
    if (currentPlayer === 1) {
      setPlayer1Rack(alphabetizeRack(newRack));
    } else {
      setPlayer2Rack(alphabetizeRack(newRack));
    }
    setPool(newPool);
    setTilesToExchange([]);

    // Switch to next player
    setCurrentPlayer(prev => prev === 1 ? 2 : 1);
    setSnackbarMessage(`${currentPlayer === 1 ? player1Name : player2Name} exchanged ${tilesToExchange.length} tiles`);
    setSnackbarSeverity('info');
    setSnackbarOpen(true);

    // If next player is bot, make bot move
    if (isBotMode && currentPlayer === 2) {
      makeBotMove();
    }
  };

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
            board={createBoard(tempBoardCoords, [], "PROTILES", theme, color.current, complementaryColor.current)} 
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
              <Tooltip title={isBotMode ? "Playing against bot" : "Play against bot"}>
                <SmartToyIcon 
                  className={`${styles.keyBtn} ${isBotMode ? styles.activeBot : ''}`} 
                  onClick={handleBotModeToggle}
                  sx={{ 
                    color: isBotMode ? '#4CAF50' : 'inherit',
                    '&:hover': {
                      color: isBotMode ? '#45a049' : '#666'
                    }
                  }}
                />
              </Tooltip>
              <Tooltip title="Get Top Moves">
                <LightbulbIcon 
                  className={styles.keyBtn}
                  onClick={handleGetTopMoves}
                  sx={{ 
                    color: isLoadingTopMoves ? '#FFD700' : 'inherit',
                    '&:hover': {
                      color: '#FFD700'
                    }
                  }}
                />
              </Tooltip>
            </Box>
              <Box sx={{padding: '8px 0px'}} className={`${styles.playerPanel} ${styles.playerToggle}`}>
              <Tooltip title="Start Game" placement="top">
                <Button 
                  variant="contained" 
                  onClick={startGame}
                  disabled={gameStarted}
                  sx={{ 
                    marginRight: '8px',
                    backgroundColor: '#4CAF50',
                    '&:hover': {
                      backgroundColor: '#45a049',
                    },
                    '&:disabled': {
                      backgroundColor: '#cccccc',
                      color: '#666666'
                    },
                    borderRadius: '50%',
                    minWidth: '40px',
                    width: '40px',
                    height: '40px',
                    padding: 0,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  <PlayArrowIcon />
                </Button>
              </Tooltip>
              <Tooltip title="Submit" placement="top">
                <Button 
                  variant="contained" 
                  onClick={handleWordSubmit}
                  disabled={!selectedBoardPosition || selectedTiles.length === 0}
                  sx={{ 
                    marginRight: '8px',
                    backgroundColor: '#4CAF50',
                    '&:hover': {
                      backgroundColor: '#45a049',
                    },
                    '&:disabled': {
                      backgroundColor: '#cccccc',
                      color: '#666666'
                    },
                    borderRadius: '50%',
                    minWidth: '40px',
                    width: '40px',
                    height: '40px',
                    padding: 0,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  <CheckIcon />
                </Button>
              </Tooltip>
              <Tooltip title="Pass" placement="top">
                <Button 
                  variant="contained" 
                  onClick={handlePass}
                  disabled={!gameStarted}
                  sx={{ 
                    marginRight: '8px',
                    backgroundColor: '#f44336',
                    '&:hover': {
                      backgroundColor: '#d32f2f',
                    },
                    '&:disabled': {
                      backgroundColor: '#cccccc',
                      color: '#666666'
                    },
                    borderRadius: '50%',
                    minWidth: '40px',
                    width: '40px',
                    height: '40px',
                    padding: 0,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  <Box sx={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold',
                    color: 'white',
                    '&:disabled': {
                      color: '#666666'
                    }
                  }}>
                    P
                  </Box>
                </Button>
              </Tooltip>
              <Tooltip title="Exchange" placement="top">
                <Button 
                  variant="contained" 
                  onClick={handleExchange}
                  disabled={tilesToExchange.length === 0}
                  sx={{ 
                    backgroundColor: '#2196F3',
                    '&:hover': {
                      backgroundColor: '#1976D2',
                    },
                    '&:disabled': {
                      backgroundColor: '#cccccc',
                      color: '#666666'
                    },
                    borderRadius: '50%',
                    minWidth: '40px',
                    width: '40px',
                    height: '40px',
                    padding: 0,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  <SwapHorizIcon />
                </Button>
              </Tooltip>
              </Box>
            </Box> 
            <Box className={styles.playerPanel}>
              {player1Name}
              <Box className={styles.timer} style={{ 
                color: currentPlayer === 1 ? '#4CAF50' : '#666',
                fontWeight: currentPlayer === 1 ? 'bold' : 'normal'
              }}>
                {formatTime(player1Time)}
              </Box>
              {currentPlayer === 1 && (
                <Box className={styles.Rack}>
                  <Rack 
                    board={player1Rack} 
                    tiles="PROTILES" 
                    color={color.current}
                    selectedTiles={tilesToExchange}
                    onTileClick={(tile, index) => {
                      console.log('Tile clicked:', { tile, index });
                      handleTileClick(tile, index);
                    }}
                  />
                </Box>
              )}
              <Box>
                {player1points} points
              </Box>
            </Box>

            <Box className={styles.playerPanel}>
              {player2Name}
              <Box className={styles.timer} style={{ 
                color: currentPlayer === 2 ? '#4CAF50' : '#666',
                fontWeight: currentPlayer === 2 ? 'bold' : 'normal'
              }}>
                {formatTime(player2Time)}
              </Box>
              {currentPlayer === 2 && (
                <Box className={styles.Rack}>
                  <Rack 
                    board={player2Rack} 
                    tiles="PROTILES" 
                    color={color.current}
                    selectedTiles={tilesToExchange}
                    onTileClick={(tile, index) => {
                      console.log('Tile clicked:', { tile, index });
                      handleTileClick(tile, index);
                    }}
                  />
                </Box>
              )}
              <Box>
                {player2points} points
              </Box>
            </Box>
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
            </Box>
          )}
        </Box>
      </Modal>
      </Box>
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={3000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      {isBotThinking && (
        <div className={styles.botThinking}>
          Bot is thinking...
        </div>
      )}

      <BotSettingsModal
        open={showBotSettings}
        onClose={() => setShowBotSettings(false)}
        botGoesFirst={botGoesFirst}
        onBotGoesFirstChange={(e) => setBotGoesFirst(e.target.value === 'bot')}
        onStartGame={startBotGame}
      />

      <TopMovesModal
        open={showTopMoves}
        onClose={() => {
          setShowTopMoves(false);
          setIsLoadingTopMoves(false);
          setIsDictionaryLoading(false);
        }}
        isTopMovesLoading={isLoadingTopMoves}
        isDictionaryLoading={isDictionaryLoading}
        topMoves={topMoves}
      />
    </Box>
  );
} 