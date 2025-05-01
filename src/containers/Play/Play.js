import React, { useState, useEffect, useRef } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Play.module.css';
import Board from "../../components/AppContent/Board/Board.js";
import Rack from "../../components/AppContent/Board/Rack.js";
import Pool from "../../components/AppContent/Board/Pool.js";
import Modal from '@mui/material/Modal';
import { origPool, origBoard } from "../../components/AppContent/References/staticData.js";
import { createBoard } from "../../functions/boardFunctions.js";
import { Snackbar, Alert } from "@mui/material";
import BotSettingsModal from '../../components/Modals/BotSettingsModal';
import TopMovesModal from '../../components/Modals/TopMovesModal';
import PlayerInfo from './components/PlayerInfo';
import ColorScheme from '../../components/common/ColorScheme';
import TuneIcon from '@mui/icons-material/Tune';
import PaletteIcon from '@mui/icons-material/Palette';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

export default function Play() {
  const [boardCoords, setBoardCoords] = useState([]);
  const [tempBoardCoords, setTempBoardCoords] = useState([]);
  const [origBoardCoords, setOrigBoardCoords] = useState([]);
  const [player1points, setPlayer1points] = useState(0);
  const [player2points, setPlayer2points] = useState(0);
  const [pool, setPool] = useState(origPool);
  const [theme, setTheme] = useState("STANDARD");
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
  const color = useRef('#6D84A2');
  const boardColor = useRef('#ffffff');
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
  const gameStartSound = useRef(new Audio('/sounds/game-start.mp3'));

  const alphabetizeRack = (rack) => {
    return [...rack].sort((a, b) => a.localeCompare(b));
  };

  useEffect(() => {
    let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    setOrigBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setTempBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    
    // Check dictionary loading state on mount
    const checkDictionary = async () => {
      try {
        const response = await fetch('/.netlify/functions/gameLogic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'validate',
            beforeBoard: parsedOrigBoardCoords,
            afterBoard: parsedOrigBoardCoords
          })
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        // Set loading to false if we get any response
        setIsDictionaryLoading(false);
        setSnackbarOpen(false);
      } catch (error) {
        console.error('Error checking dictionary:', error);
        // Retry after a short delay
        setTimeout(checkDictionary, 1000);
      }
    };
    
    setIsDictionaryLoading(true);
    setSnackbarMessage('Loading dictionary.. (up to 30s)');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    checkDictionary();
  }, []);

  const startGame = async () => {
    if (isDictionaryLoading) {
      return;
    }

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
          // If the tile was a blank, return '*' to the rack
          const tileToAdd = selectedTiles[selectedTiles.length - 1] === '*' ? '*' : tileToRemove;
          const newRack = [...currentRack, tileToAdd];
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
    // Dictionary selection is not used in Play mode
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
      
      // Convert any '?' in the rack to '*' for the API
      const apiRack = rackCopy.map(tile => tile === '?' ? '*' : tile);
      
      console.log('Sending bot move request', { board: boardCopy, letters: apiRack });
      const response = await fetch('/.netlify/functions/botLogic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: boardCopy,
          letters: apiRack
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
          // For blank tiles, we need to find the blank in the rack
          const tileIndex = tile.isBlank ? newRack.indexOf('*') : newRack.indexOf(tile.letter);
          if (tileIndex !== -1) {
            newRack.splice(tileIndex, 1);
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
    if (isBotMode && currentPlayer === 2 && !isBotThinking) {
      makeBotMove();
    }
  }, [currentPlayer, isBotMode, isBotThinking]);

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
      // Get the current rack
      const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
      
      // Get any tiles that are placed on the board but not committed
      const uncommittedTiles = [];
      for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
          if (typeof tempBoardCoords[row][col] === 'string' && typeof boardCoords[row][col] !== 'string') {
            // If the tile was a blank, we need to get the original blank tile back
            const tileIndex = selectedTiles.findIndex(t => t === '*');
            if (tileIndex !== -1) {
              uncommittedTiles.push('*');
            } else {
              uncommittedTiles.push(tempBoardCoords[row][col]);
            }
          }
        }
      }
      
      // Return uncommitted tiles to the rack
      const newRack = [...currentRack, ...uncommittedTiles];
      if (currentPlayer === 1) {
        setPlayer1Rack(alphabetizeRack(newRack));
      } else {
        setPlayer2Rack(alphabetizeRack(newRack));
      }
      
      // Reset the board state
      setTempBoardCoords(JSON.parse(JSON.stringify(boardCoords)));
      setSelectedTiles([]);
      setSelectedBoardPosition(null);
      
      // Convert any '?' in the rack to '*' for the API
      const apiRack = newRack.map(tile => tile === '?' ? '*' : tile);
      
      console.log('Getting top moves for rack:', apiRack);
      const response = await fetch('/.netlify/functions/getTopMoves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: boardCoords,
          letters: apiRack
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Top moves API response:', data);
      
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
    if (isDictionaryLoading) return;
    
    // If there are tiles on the board, return them to the rack first
    if (selectedTiles.length > 0) {
      const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
      const newRack = [...currentRack, ...selectedTiles];
      
      if (currentPlayer === 1) {
        setPlayer1Rack(alphabetizeRack(newRack));
      } else {
        setPlayer2Rack(alphabetizeRack(newRack));
      }
      
      // Reset the board state by rebuilding from origBoardCoords
      const newBoard = JSON.parse(JSON.stringify(origBoardCoords));
      
      // Copy over any committed tiles from boardCoords
      for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
          if (typeof boardCoords[row][col] === 'string') {
            newBoard[row][col] = boardCoords[row][col];
          }
        }
      }
      
      setTempBoardCoords(newBoard);
      setSelectedTiles([]);
      setSelectedBoardPosition(null);
      setArrowDirection('right');
    }
    
    // Randomly determine who goes first
    const randomFirst = Math.random() < 0.5;
    setBotGoesFirst(randomFirst);
    
    // Set game started state
    setGameStarted(true);
    setTimerActive(true);
    
    // Start the game directly
    startBotGame();
  };

  const startBotGame = () => {
    // Play game start sound
    gameStartSound.current.play();

    // Reset game state
    let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    setOrigBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setTempBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setPlayer1points(0);
    setPlayer2points(0);
    setPool(origPool);
    
    // Set current player based on who goes first
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

  const handleMoveSelect = (move) => {
    // Reset the board to its current state
    setTempBoardCoords(JSON.parse(JSON.stringify(boardCoords)));
    
    // Set the direction
    setArrowDirection(move.direction);
    
    // Place the tiles on the board
    const newTempBoard = [...tempBoardCoords];
    const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
    const newRack = [...currentRack];
    const newSelectedTiles = [];
    
    // Place each tile using the exact positions from the tiles array
    for (const tile of move.tiles) {
      if (tile.isNew) {
        
        // Check if the tile is already on the board in the committed state
        if (typeof boardCoords[tile.row][tile.col] === 'string') {
          continue;
        }
        
        // For blank tiles, we need to find the blank in the rack
        const tileIndex = tile.isBlank ? newRack.indexOf('*') : newRack.indexOf(tile.letter);
        if (tileIndex !== -1) {
          // For blank tiles, we need to show the letter it represents
          newTempBoard[tile.row][tile.col] = tile.letter;
          newRack.splice(tileIndex, 1);
          newSelectedTiles.push(tile.isBlank ? '*' : tile.letter);
        }
      }
    }
    
    setTempBoardCoords(newTempBoard);
    setSelectedTiles(newSelectedTiles);
    if (currentPlayer === 1) {
      setPlayer1Rack(alphabetizeRack(newRack));
    } else {
      setPlayer2Rack(alphabetizeRack(newRack));
    }

    // Set the position to the square after the last tile
    const lastTile = move.tiles[move.tiles.length - 1];
    if (move.direction === 'right') {
      let nextCol = lastTile.col + 1;
      while (nextCol <= 14 && !Number.isInteger(boardCoords[lastTile.row][nextCol])) {
        nextCol++;
      }
      if (nextCol <= 14) {
        setSelectedBoardPosition({ row: lastTile.row, col: nextCol });
      }
    } else {
      let nextRow = lastTile.row + 1;
      while (nextRow <= 14 && !Number.isInteger(boardCoords[nextRow][lastTile.col])) {
        nextRow++;
      }
      if (nextRow <= 14) {
        setSelectedBoardPosition({ row: nextRow, col: lastTile.col });
      }
    }
  };

  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
      <Box className={styles.page}>
      <Box className={styles.title}>
        Play!
      </Box>
      <Box className={styles.mainPanel}>
        <Box className={styles.mainBox} component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Board 
            board={createBoard(tempBoardCoords, [], "PROTILES", theme, color.current, complementaryColor.current)} 
            boardMode={theme}
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
          <PlayerInfo
            player1Name={player1Name}
            player2Name={player2Name}
            player1Points={player1points}
            player2Points={player2points}
            player1Time={formatTime(player1Time)}
            player2Time={formatTime(player2Time)}
            currentPlayer={currentPlayer}
            player1Rack={player1Rack}
            player2Rack={player2Rack}
            color={color}
            onTileClick={handleTileClick}
            selectedTiles={tilesToExchange}
            isBotMode={isBotMode}
            gameStarted={gameStarted}
            isDictionaryLoading={isDictionaryLoading}
            isLoadingTopMoves={isLoadingTopMoves}
            onSettingsOpen={handleSettingsOpen}
            onColorSchemeOpen={handleColorSchemeOpen}
            onBotModeToggle={handleBotModeToggle}
            onGetTopMoves={handleGetTopMoves}
            onStartGame={startGame}
            onWordSubmit={handleWordSubmit}
            onPass={handlePass}
            onExchange={handleExchange}
            selectedBoardPosition={selectedBoardPosition}
            tilesToExchange={tilesToExchange}
            icons={{
              settings: <TuneIcon className={styles.keyBtn} />,
              colorScheme: <PaletteIcon className={styles.keyBtn} />,
              botMode: <SmartToyIcon className={`${styles.keyBtn} ${isBotMode ? styles.activeBot : ''}`} sx={{ fontSize: 24 }} />,
              topMoves: <LightbulbIcon className={styles.keyBtn} />
            }}
          />

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
                Board Mode
                <select className={styles.styleSelection} value={theme} onChange={(e) => setTheme(e.target.value)}>
                  <option value="STANDARD">Standard</option>
                  <option value="FULLBOARD">Full Board</option>
                </select>
              </Box>
            </Box>
          )}
          {modalContent === "colorScheme" && (
            <ColorScheme
              color={color}
              boardColor={boardColor}
            />
          )}
        </Box>
      </Modal>
      </Box>
      <Snackbar 
        open={snackbarOpen} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={snackbarMessage === 'Loading dictionary.. (up to 30s)' ? null : 3000}
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
        onMoveSelect={handleMoveSelect}
      />
    </Box>
  );
} 