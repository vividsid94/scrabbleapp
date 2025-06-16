import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Play.module.css';
import Board from "../../components/AppContent/Board/Board.js";
import PlayPool from "../../components/AppContent/Board/PlayPool.js";
import Modal from '@mui/material/Modal';
import { origPool, origBoard, letterLookup } from "../../components/AppContent/References/staticData.js";
import { TEST_RACKS } from "../../components/AppContent/References/testRacks.js";
import { createBoard } from "../../functions/boardFunctions.js";
import { Snackbar, Alert, Slider, Tooltip } from "@mui/material";
import ChoicesModal from '../../components/Modals/ChoicesModal';
import PlayerInfo from './components/PlayerInfo';
import ColorScheme from '../../components/common/ColorScheme';
import TuneIcon from '@mui/icons-material/Tune';
import PaletteIcon from '@mui/icons-material/Palette';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TimerIcon from '@mui/icons-material/Timer';
import SortIcon from '@mui/icons-material/Sort';
import MoveHistoryModal from '../../components/Modals/MoveHistoryModal';
import { simulateMove as simulateMoveFunction } from '../../functions/simulationFunctions';
import { calculateScore } from '../../functions/scoreFunctions';
import { initializeSounds, updateSoundType, handleSoundError } from '../../functions/play/soundFunctions';
import { alphabetizeRack } from '../../functions/play/rackFunctions';
import { handleTileDrop, handleTileClick } from '../../functions/play/tileFunctions';
import { handleBoardPositionSelect } from "../../functions/play/boardFunctions.js";
import { handleKeyDown, handleKeyPress } from '../../functions/play/keyboardFunctions';

const boardMultipliers = JSON.parse(origBoard);

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
  const color = useRef('#b064af');
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
  const [botGoesFirst, setBotGoesFirst] = useState(false);
  const [tilesToExchange, setTilesToExchange] = useState([]);
  const [blankTiles, setBlankTiles] = useState([]); // Track positions of blank tiles
  const [gameTime, setGameTime] = useState(20); // in minutes
  const [showTimeSlider, setShowTimeSlider] = useState(false);
  const [showMoveHistory, setShowMoveHistory] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [simulatingMove, setSimulatingMove] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [previewBoard, setPreviewBoard] = useState(null);
  const [previewMove, setPreviewMove] = useState(null);
  const [moveWithResults, setMoveWithResults] = useState(null);
  const [leaveValues, setLeaveValues] = useState({});
  const [autoPlayBest, setAutoPlayBest] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  
  // Add state for move sound selection first
  const [playerMoveSoundType, setPlayerMoveSoundType] = useState('classic');
  const [botMoveSoundType, setBotMoveSoundType] = useState('classic');

  // Initialize sounds
  const sounds = useRef(initializeSounds());
  const gameStartSound = useRef(sounds.current.gameStartSound);
  const playerMoveSound = useRef(sounds.current.playerMoveSound);
  const botMoveSound = useRef(sounds.current.botMoveSound);

  // Add error handlers for sounds
  useEffect(() => {
    if (!gameStartSound.current || !playerMoveSound.current || !botMoveSound.current) {
      const newSounds = initializeSounds();
      gameStartSound.current = newSounds.gameStartSound;
      playerMoveSound.current = newSounds.playerMoveSound;
      botMoveSound.current = newSounds.botMoveSound;
    }

    gameStartSound.current.addEventListener('error', () => 
      handleSoundError(gameStartSound.current, 'game start', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
    );
    playerMoveSound.current.addEventListener('error', () => 
      handleSoundError(playerMoveSound.current, 'player move', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
    );
    botMoveSound.current.addEventListener('error', () => 
      handleSoundError(botMoveSound.current, 'bot move', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
    );

    return () => {
      if (gameStartSound.current) {
        gameStartSound.current.removeEventListener('error', () => 
          handleSoundError(gameStartSound.current, 'game start', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
        );
      }
      if (playerMoveSound.current) {
        playerMoveSound.current.removeEventListener('error', () => 
          handleSoundError(playerMoveSound.current, 'player move', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
        );
      }
      if (botMoveSound.current) {
        botMoveSound.current.removeEventListener('error', () => 
          handleSoundError(botMoveSound.current, 'bot move', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
        );
      }
    };
  }, []);

  // Update audio refs when sound type changes
  useEffect(() => {
    if (playerMoveSound.current && playerMoveSoundType) {
      updateSoundType(playerMoveSound, playerMoveSoundType, 'player');
    }
  }, [playerMoveSoundType]);

  useEffect(() => {
    if (botMoveSound.current && botMoveSoundType) {
      updateSoundType(botMoveSound, botMoveSoundType, 'bot');
    }
  }, [botMoveSoundType]);

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

  // Update useEffect to handle keyboard events
  useEffect(() => {
    const handleKeyDownWrapper = (e) => handleKeyDown({
      e,
      selectedBoardPosition,
      boardCoords,
      tempBoardCoords,
      currentPlayer,
      player1Rack,
      player2Rack,
      selectedTiles,
      blankTiles,
      setSelectedBoardPosition,
      setArrowDirection,
      setTempBoardCoords,
      setSelectedTiles,
      setPlayer1Rack,
      setPlayer2Rack,
      setBlankTiles,
      setPreviewScore,
      setPreviewScorePosition,
      handleWordSubmit,
      arrowDirection,
      origBoard
    });

    window.addEventListener('keydown', handleKeyDownWrapper);
    return () => {
      window.removeEventListener('keydown', handleKeyDownWrapper);
    };
  }, [
    selectedBoardPosition,
    boardCoords,
    tempBoardCoords,
    currentPlayer,
    player1Rack,
    player2Rack,
    selectedTiles,
    blankTiles,
    arrowDirection,
    origBoard
  ]);

  const handleGameEnd = useCallback((winnerRack, winnerName, loserRack, loserPoints) => {
    // Calculate sum of loser's remaining tiles
    const rackSum = loserRack.reduce((sum, tile) => {
      const value = tile === '?' || tile === '*' ? 0 : 
        tile === 'A' || tile === 'E' || tile === 'I' || tile === 'O' || tile === 'U' || 
        tile === 'L' || tile === 'N' || tile === 'S' || tile === 'T' || tile === 'R' ? 1 :
        tile === 'D' || tile === 'G' ? 2 :
        tile === 'B' || tile === 'C' || tile === 'M' || tile === 'P' ? 3 :
        tile === 'F' || tile === 'H' || tile === 'V' || tile === 'W' || tile === 'Y' ? 4 :
        tile === 'K' ? 5 :
        tile === 'J' || tile === 'X' ? 8 :
        tile === 'Q' || tile === 'Z' ? 10 : 0;
      return sum + value;
    }, 0);
    
    // Add remaining tiles to loser's score
    if (winnerRack === player1Rack) {
      setPlayer2points(loserPoints + rackSum);
    } else {
      setPlayer1points(loserPoints + rackSum);
    }
    
    // Show game over message
    setSnackbarMessage(`Game Over! ${winnerName} played all their tiles!`);
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
    
    // Disable auto-play
    setAutoPlayBest(false);
  }, [player1Rack, player2Rack]);

  // Add a function to compress board state more aggressively
  const compressBoardState = useCallback((board) => {
    const compressed = [];
    for (let row = 0; row < 15; row++) {
      const compressedRow = [];
      for (let col = 0; col < 15; col++) {
        const cell = board[row][col];
        compressedRow.push(typeof cell === 'string' ? cell : 0);
      }
      compressed.push(compressedRow);
    }
    return compressed;
  }, []);

  // Add a function to store only the differences in board states
  const getBoardDiff = useCallback((before, after) => {
    const diff = [];
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (before[row][col] !== after[row][col]) {
          diff.push({ row, col, value: after[row][col] });
        }
      }
    }
    return diff;
  }, []);

  // Modify handleWordSubmit to use board diffs
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

      // Return tiles to the current player's rack
      const rackToUpdate = currentPlayer === 1 ? player1Rack : player2Rack;
      // Extract just the tile values from selectedTiles
      const tilesToReturn = selectedTiles.map(tile => tile.tile);
      const updatedRack = [...rackToUpdate, ...tilesToReturn];
      if (currentPlayer === 1) {
        setPlayer1Rack(alphabetizeRack(updatedRack));
      } else {
        setPlayer2Rack(alphabetizeRack(updatedRack));
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

    // Play player move sound
    playerMoveSound.current.play();

    // Get the current player's rack before making any changes
    const playerRack = currentPlayer === 1 ? player1Rack : player2Rack;
    // Calculate running total
    const runningTotal = currentPlayer === 1 ? player1points + score : player2points + score;

    // Store only the differences in board states
    const boardDiff = getBoardDiff(boardCoords, tempBoardCoords);
    const moveHistoryEntry = {
      boardDiff,
      player: currentPlayer === 1 ? player1Name : player2Name,
      score: score,
      rack: alphabetizeRack(playerRack).join(''),
      total: runningTotal
    };

    setMoveHistory(prev => [...prev.slice(-49), moveHistoryEntry]);

    // Update the board state
    setBoardCoords(tempBoardCoords);
    setTempBoardCoords(JSON.parse(JSON.stringify(tempBoardCoords)));
    setSelectedTiles([]);
    setSelectedBoardPosition(null);
    setArrowDirection('right');

    // Update player's points
    if (currentPlayer === 1) {
      setPlayer1points(runningTotal);
    } else {
      setPlayer2points(runningTotal);
    }

    // Remove played tiles from rack
    const newRack = playerRack.filter(tile => !selectedTiles.includes(tile));
    if (currentPlayer === 1) {
      setPlayer1Rack(alphabetizeRack(newRack));
    } else {
      setPlayer2Rack(alphabetizeRack(newRack));
    }

    // Check if game should end
    if (newRack.length === 0 && pool.length === 0) {
      handleGameEnd(newRack, currentPlayer === 1 ? player1Name : player2Name, 
        currentPlayer === 1 ? player2Rack : player1Rack,
        currentPlayer === 1 ? player2points : player1points);
      return;
    }

    // Refill the current player's rack
    const newPool = [...pool];
    
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
    setPool(newPool);
    
    // Switch to next player
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    setSelectedBoardPosition(null);
    setSelectedTiles([]);
    setArrowDirection('right');

    // After successful move
    setSimulatingMove(null);
    setSimulationResult(null);
    setSimulationProgress(0);
    setPreviewBoard(null);
    setPreviewMove(null);
    setMoveWithResults(null);
    setTopMoves([]); // Clear top moves
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

  const makeBotMove = async () => {
    if (!isBotMode || currentPlayer !== 2) {
      return;
    }

    // Only show thinking state if auto-play is not enabled
    if (!autoPlayBest) {
      setIsBotThinking(true);
    }

    try {
      // Create a deep copy of the board and rack
      const boardCopy = JSON.parse(JSON.stringify(boardCoords));
      const rackCopy = [...player2Rack];
      
      // Convert any '?' in the rack to '*' for the API
      const apiRack = rackCopy.map(tile => tile === '?' ? '*' : tile);
      
      console.log('🤖 Bot Move Request:', {
        rack: apiRack.join('')
      });

      let response;
      // Only add delay if auto-play is not enabled
      if (!autoPlayBest) {
        const startTime = Date.now();
        response = await fetch('/.netlify/functions/botLogic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            board: boardCopy,
            letters: apiRack,
            pool: pool // Pass the pool to the bot
          })
        });

        // Calculate remaining time to ensure minimum 2 second delay
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      } else {
        // Skip delay when auto-play is enabled
        response = await fetch('/.netlify/functions/botLogic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            board: boardCopy,
            letters: apiRack,
            pool: pool
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Bot error details:', errorData);
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Bot moves response:', data);
      
      if (!data.moves || data.moves.length === 0) {
        setSnackbarMessage('Bot could not find a valid move');
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
        setCurrentPlayer(1); // Switch back to player 1 if bot can't move
        return;
      }

      // Sort moves by totalValue (points + leave) from the backend
      const sortedMoves = data.moves.sort((a, b) => b.totalValue - a.totalValue);
      const bestMove = sortedMoves[0];

      // Play bot move sound after the delay
      botMoveSound.current.play();

      // Get the current rack before making the move
      const botRack = player2Rack;
      
      // Create a copy of the board with the bot's move
      const newBoard = JSON.parse(JSON.stringify(boardCoords));
      const newRack = [...player2Rack];
      const newBlankTiles = [...blankTiles];
      const newPool = [...pool];
      
      if (bestMove.isExchange) {
        // Handle exchange move
        const tilesToExchange = bestMove.tilesToExchange || bestMove.tiles.map(t => t.letter);
        const newTiles = bestMove.newTiles || [];
        
        // Remove exchanged tiles from rack
        for (const tile of tilesToExchange) {
          const tileIndex = newRack.indexOf(tile);
          if (tileIndex !== -1) {
            newRack.splice(tileIndex, 1);
          }
        }
        
        // Add new tiles to rack
        newRack.push(...newTiles);
        
        // Remove new tiles from pool
        for (const tile of newTiles) {
          const poolIndex = newPool.indexOf(tile);
          if (poolIndex !== -1) {
            newPool.splice(poolIndex, 1);
          }
        }
        
        // Add exchanged tiles back to pool
        newPool.push(...tilesToExchange);
        
        // Update state
        setPlayer2Rack(alphabetizeRack(newRack));
        setPool(newPool);
        
        // Show toast notification for bot's exchange
        setSnackbarMessage(`SidBot exchanged ${tilesToExchange.length} tiles`);
        setSnackbarSeverity("info");
        setSnackbarOpen(true);
      } else {
        // Handle regular move
        for (const tile of bestMove.tiles) {
          if (tile.isNew) {
            newBoard[tile.row][tile.col] = tile.letter;
            
            // For blank tiles, we need to find the blank in the rack
            if (tile.isBlank) {
              newBlankTiles.push({ row: tile.row, col: tile.col });
              
              // Remove the blank tile from the rack - look for both '?' and '*'
              const blankIndex = newRack.indexOf('?');
              if (blankIndex !== -1) {
                newRack.splice(blankIndex, 1);
              } else {
                const starIndex = newRack.indexOf('*');
                if (starIndex !== -1) {
                  newRack.splice(starIndex, 1);
                }
              }
            } else {
              // For non-blank tiles, find and remove the letter
              const tileIndex = newRack.indexOf(tile.letter);
              if (tileIndex !== -1) {
                newRack.splice(tileIndex, 1);
              }
            }
          }
        }
        
        // Calculate running total
        const botRunningTotal = player2points + bestMove.score;

        // Store only the differences in board states
        const boardDiff = getBoardDiff(boardCoords, newBoard);
        const moveHistoryEntry = {
          boardDiff,
          player: player2Name,
          score: bestMove.score,
          rack: alphabetizeRack(botRack).join(''),
          total: botRunningTotal
        };

        setMoveHistory(prev => [...prev.slice(-49), moveHistoryEntry]);

        // Update the board state
        setBoardCoords(newBoard);
        setTempBoardCoords(JSON.parse(JSON.stringify(newBoard)));
        setPlayer2Rack(alphabetizeRack(newRack));
        setBlankTiles(newBlankTiles);
        
        // Draw new tiles for bot
        while (newRack.length < 7 && newPool.length > 0) {
          const randomIndex = Math.floor(Math.random() * newPool.length);
          newRack.push(newPool[randomIndex]);
          newPool.splice(randomIndex, 1);
        }
        setPlayer2Rack(alphabetizeRack(newRack));
        setPool(newPool);
        
        // Show toast notification for bot's move
        setSnackbarMessage(`SidBot played "${bestMove.word}" for ${bestMove.score} points`);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        
        // Update bot's score
        setPlayer2points(botRunningTotal);
      }
      
      // Check if game should end
      if (newRack.length === 0 && pool.length === 0) {
        handleGameEnd(newRack, player2Name, player1Rack, player1points);
        return;
      }
      
      // Reset consecutive passes since bot made a move
      setConsecutivePasses(0);
      
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
      // Only clear thinking state if auto-play is not enabled
      if (!autoPlayBest) {
        setIsBotThinking(false);
      }
      // Clear states even on error
      setSimulatingMove(null);
      setSimulationResult(null);
      setSimulationProgress(0);
      setPreviewBoard(null);
      setPreviewMove(null);
      setMoveWithResults(null);
      setTopMoves([]); // Clear top moves
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

    // Add pass move to history
    setMoveHistory(prev => [...prev, {
      beforeBoard: JSON.parse(JSON.stringify(boardCoords)),
      afterBoard: JSON.parse(JSON.stringify(boardCoords)), // Same board state for pass
      player: currentPlayer === 1 ? player1Name : player2Name,
      score: 0,
      rack: currentPlayer === 1 ? alphabetizeRack(player1Rack).join('') : alphabetizeRack(player2Rack).join(''),
      total: currentPlayer === 1 ? player1points : player2points
    }]);

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

  const generateExchangeCombinations = (rack) => {
    const combinations = [];
    // Generate all possible combinations of 1-7 tiles
    for (let i = 1; i <= Math.min(rack.length, 7); i++) {
      const generateCombos = (current, start, remaining) => {
        if (current.length === i) {
          combinations.push([...current]);
          return;
        }
        for (let j = start; j < remaining.length; j++) {
          current.push(remaining[j]);
          generateCombos(current, j + 1, remaining);
          current.pop();
        }
      };
      generateCombos([], 0, rack);
    }
    return combinations;
  };

  const calculateExchangeLeave = (rack, tilesToExchange) => {
    const rackCopy = [...rack];
    // Remove tiles that would be exchanged
    for (const tile of tilesToExchange) {
      const index = rackCopy.indexOf(tile === '*' ? '?' : tile);
      if (index !== -1) {
        rackCopy.splice(index, 1);
      }
    }
    return rackCopy.sort().join('');
  };

  const fetchBoardControl = async (moves) => {
    try {
      const response = await fetch('/.netlify/functions/getBoardControl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: boardCoords,
          moves: moves
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch board control metrics');
      }

      const data = await response.json();
      return data.moveMetrics;
    } catch (error) {
      console.error('Error fetching board control:', error);
      return [];
    }
  };

  // Modify handleGetTopMoves to include board control
  const handleGetTopMoves = async () => {
    setIsLoadingTopMoves(true);
    setShowTopMoves(true);
    try {
      // Get the current rack
      const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
      
      // Get any tiles that are placed on the board but not committed
      const uncommittedTiles = [];
      for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
          if (typeof tempBoardCoords[row][col] === 'string' && typeof boardCoords[row][col] !== 'string') {
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

      // Generate exchange moves
      const exchangeCombinations = generateExchangeCombinations(newRack);
      const exchangeMoves = exchangeCombinations.map(tiles => {
        const leave = calculateExchangeLeave(newRack, tiles);
        return {
          word: `Exchange ${tiles.join('')}`,
          score: 0,
          tiles: tiles.map(tile => ({ letter: tile, isNew: false })),
          direction: 'exchange',
          startPosition: 'Exchange',
          leave: leave,
          isExchange: true
        };
      });

      // First, fetch leave values for all moves
      const allMoves = [...data.moves, ...exchangeMoves];
      const [updatedLeaveValues, boardControlMetrics] = await Promise.all([
        fetchLeaveValues(allMoves),
        fetchBoardControl(allMoves)
      ]);

      // Create a map of move words to their control metrics
      const controlMap = new Map(
        boardControlMetrics.map(metric => [metric.move, metric])
      );

      // Then calculate total values and sort
      const topMoves = allMoves
        .map(move => {
          const leaveValue = updatedLeaveValues[move.leave] || 0;
          const controlMetrics = controlMap.get(move.word) || { defensiveValue: 0, boardControl: 0, totalControl: 0 };
          const totalValue = move.isExchange ? 
            leaveValue : // For exchanges, total value is just the leave value
            (move.score + leaveValue); // Just points + leave, no control value
          return {
            ...move,
            totalValue,
            defensiveValue: controlMetrics.defensiveValue,
            boardControl: controlMetrics.boardControl,
          };
        })
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 15); // Show top 15 moves

      setTopMoves(topMoves);
    } catch (error) {
      console.error('Error getting top moves:', error);
      setSnackbarMessage('Error getting top moves: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setShowTopMoves(false);
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
    let rack1 = [];
    let rack2 = [];
    
    if (TEST_RACKS.enabled) {
      // Use test racks
      rack1 = [...TEST_RACKS.player1];
      rack2 = [...TEST_RACKS.player2];
      
      // Remove test tiles from pool
      [...rack1, ...rack2].forEach(tile => {
        const index = newPool.indexOf(tile);
        if (index !== -1) {
          newPool.splice(index, 1);
        }
      });
    } else {
      // Use random racks
      for (let i = 0; i < 7; i++) {
        const randomIndex1 = Math.floor(Math.random() * newPool.length);
        rack1.push(newPool[randomIndex1]);
        newPool.splice(randomIndex1, 1);
        
        const randomIndex2 = Math.floor(Math.random() * newPool.length);
        rack2.push(newPool[randomIndex2]);
        newPool.splice(randomIndex2, 1);
      }
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

  const board = useMemo(() => {
    return createBoard(
      showTopMoves ? boardCoords : (previewBoard || tempBoardCoords.map((row, rowIndex) => 
        row.map((col, colIndex) => {
          // If there's a temporary move, use that
          if (typeof col === 'string') {
            return col;
          }
          // Otherwise use the committed board state
          return boardCoords[rowIndex][colIndex];
        })
      )),
      [], 
      "PROTILES", 
      theme, 
      color.current, 
      complementaryColor.current, 
      blankTiles
    );
  }, [tempBoardCoords, boardCoords, theme, blankTiles, previewBoard, showTopMoves]);

  // Update player time states when gameTime changes
  useEffect(() => {
    setPlayer1Time(gameTime * 60);
    setPlayer2Time(gameTime * 60);
  }, [gameTime]);

  const handlePlayTopMove = useCallback(async () => {
    if (isLoadingTopMoves || isDictionaryLoading) return;
    
    try {
      // Get the current rack
      const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
      
      // Get any tiles that are placed on the board but not committed
      const uncommittedTiles = [];
      for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
          if (typeof tempBoardCoords[row][col] === 'string' && typeof boardCoords[row][col] !== 'string') {
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
      
      // Make API call for moves
      const movesResponse = await fetch('/.netlify/functions/getTopMoves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: boardCoords,
          letters: apiRack
        })
      });

      if (!movesResponse.ok) {
        throw new Error(`HTTP error! status: ${movesResponse.status}`);
      }

      const data = await movesResponse.json();
      
      // Check if this is the first load (dictionary loading)
      if (data.message && data.message.includes('Loading dictionary')) {
        setIsDictionaryLoading(true);
        // Retry after a short delay
        setTimeout(() => {
          handlePlayTopMove();
        }, 1000);
        return;
      }
      
      setIsDictionaryLoading(false);

      // Generate exchange moves only if we have enough tiles in the pool
      const exchangeMoves = pool.length >= 7 ? generateExchangeCombinations(newRack).map(tiles => {
        const leave = calculateExchangeLeave(newRack, tiles);
        return {
          word: `Exchange ${tiles.join('')}`,
          score: 0,
          tiles: tiles.map(tile => ({ letter: tile, isNew: false })),
          direction: 'exchange',
          startPosition: 'Exchange',
          leave: leave,
          isExchange: true
        };
      }) : [];

      // First, fetch leave values for all moves
      const allMoves = [...data.moves, ...exchangeMoves];
      const updatedLeaveValues = await fetchLeaveValues(allMoves);

      // Then calculate total values and sort
      const topMoves = allMoves
        .map(move => {
          const leaveValue = updatedLeaveValues[move.leave] || 0;
          const totalValue = move.isExchange ? 
            leaveValue : // For exchanges, total value is just the leave value
            (move.score + leaveValue); // For regular moves, add score and leave value
          return {
            ...move,
            totalValue
          };
        })
        .sort((a, b) => b.totalValue - a.totalValue);

      if (topMoves.length > 0) {
        const bestMove = topMoves[0];
        
        // Prepare all state updates
        const stateUpdates = {
          newBoard: JSON.parse(JSON.stringify(boardCoords)),
          newRack: [...currentRack],
          newBlankTiles: [...blankTiles],
          newPool: [...pool],
          newMoveHistory: [...moveHistory],
          runningTotal: currentPlayer === 1 ? player1points : player2points
        };
        
        if (bestMove.isExchange) {
          // Handle exchange move
          const tilesToExchange = bestMove.tiles.map(t => t.letter);
          
          // Remove exchanged tiles from rack
          for (const tile of tilesToExchange) {
            const tileIndex = stateUpdates.newRack.indexOf(tile);
            if (tileIndex !== -1) {
              stateUpdates.newRack.splice(tileIndex, 1);
            }
          }
          
          // Add new tiles from pool
          for (let i = 0; i < tilesToExchange.length; i++) {
            if (stateUpdates.newPool.length > 0) {
              const randomIndex = Math.floor(Math.random() * stateUpdates.newPool.length);
              stateUpdates.newRack.push(stateUpdates.newPool[randomIndex]);
              stateUpdates.newPool.splice(randomIndex, 1);
            }
          }
          
          // Add exchanged tiles back to pool
          stateUpdates.newPool.push(...tilesToExchange);
          
          // Store only the differences in board states
          const boardDiff = getBoardDiff(boardCoords, stateUpdates.newBoard);
          const moveHistoryEntry = {
            boardDiff,
            player: currentPlayer === 1 ? player1Name : player2Name,
            score: 0,
            rack: alphabetizeRack(currentRack).join(''),
            total: stateUpdates.runningTotal
          };

          setMoveHistory(prev => [...prev.slice(-49), moveHistoryEntry]);
          
          // Show toast notification
          setSnackbarMessage(`${currentPlayer === 1 ? player1Name : player2Name} exchanged ${tilesToExchange.length} tiles`);
          setSnackbarSeverity("info");
          setSnackbarOpen(true);
        } else {
          // Handle regular move
          // Place tiles on board
          for (const tile of bestMove.tiles) {
            if (tile.isNew) {
              stateUpdates.newBoard[tile.row][tile.col] = tile.letter;
              
              if (tile.isBlank) {
                stateUpdates.newBlankTiles.push({ row: tile.row, col: tile.col });
                const blankIndex = stateUpdates.newRack.indexOf('?');
                if (blankIndex !== -1) {
                  stateUpdates.newRack.splice(blankIndex, 1);
                } else {
                  const starIndex = stateUpdates.newRack.indexOf('*');
                  if (starIndex !== -1) {
                    stateUpdates.newRack.splice(starIndex, 1);
                  }
                }
              } else {
                const tileIndex = stateUpdates.newRack.indexOf(tile.letter);
                if (tileIndex !== -1) {
                  stateUpdates.newRack.splice(tileIndex, 1);
                }
              }
            }
          }
          
          // Draw new tiles
          while (stateUpdates.newRack.length < 7 && stateUpdates.newPool.length > 0) {
            const randomIndex = Math.floor(Math.random() * stateUpdates.newPool.length);
            stateUpdates.newRack.push(stateUpdates.newPool[randomIndex]);
            stateUpdates.newPool.splice(randomIndex, 1);
          }
          
          // Update running total
          stateUpdates.runningTotal += bestMove.score;
          
          // Store only the differences in board states
          const boardDiff = getBoardDiff(boardCoords, stateUpdates.newBoard);
          const moveHistoryEntry = {
            boardDiff,
            player: currentPlayer === 1 ? player1Name : player2Name,
            score: bestMove.score,
            rack: alphabetizeRack(currentRack).join(''),
            total: stateUpdates.runningTotal
          };

          setMoveHistory(prev => [...prev.slice(-49), moveHistoryEntry]);
          
          // Show toast notification
          setSnackbarMessage(`${currentPlayer === 1 ? player1Name : player2Name} played "${bestMove.word}" for ${bestMove.score} points`);
          setSnackbarSeverity("success");
          setSnackbarOpen(true);
        }
        
        // Apply all state updates at once
        setBoardCoords(stateUpdates.newBoard);
        setTempBoardCoords(JSON.parse(JSON.stringify(stateUpdates.newBoard)));
        if (currentPlayer === 1) {
          setPlayer1Rack(alphabetizeRack(stateUpdates.newRack));
          setPlayer1points(stateUpdates.runningTotal);
        } else {
          setPlayer2Rack(alphabetizeRack(stateUpdates.newRack));
          setPlayer2points(stateUpdates.runningTotal);
        }
        setBlankTiles(stateUpdates.newBlankTiles);
        setPool(stateUpdates.newPool);
        setMoveHistory(stateUpdates.newMoveHistory);
        
        // Check if game should end
        if (stateUpdates.newRack.length === 0 && stateUpdates.newPool.length === 0) {
          handleGameEnd(
            stateUpdates.newRack,
            currentPlayer === 1 ? player1Name : player2Name,
            currentPlayer === 1 ? player2Rack : player1Rack,
            currentPlayer === 1 ? player2points : player1points
          );
          return;
        }
        
        // Switch to next player
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
        setSelectedBoardPosition(null);
        setSelectedTiles([]);
        setArrowDirection('right');

        // After successful move
        setSimulatingMove(null);
        setSimulationResult(null);
        setSimulationProgress(0);
        setPreviewBoard(null);
        setPreviewMove(null);
        setMoveWithResults(null);
        setTopMoves([]); // Clear top moves
      }
    } catch (error) {
      console.error('Error playing top move:', error);
      setSnackbarMessage('Error playing top move: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      // Clear states even on error
      setSimulatingMove(null);
      setSimulationResult(null);
      setSimulationProgress(0);
      setPreviewBoard(null);
      setPreviewMove(null);
      setMoveWithResults(null);
      setTopMoves([]); // Clear top moves
    }
  }, [
    isLoadingTopMoves,
    isDictionaryLoading,
    currentPlayer,
    player1Rack,
    player2Rack,
    tempBoardCoords,
    boardCoords,
    selectedTiles,
    pool,
    player1points,
    player2points,
    player1Name,
    player2Name,
    blankTiles,
    moveHistory,
    leaveValues,
    handleGameEnd,
    compressBoardState,
    getBoardDiff
  ]);

  // Add effect to handle auto-play
  useEffect(() => {
    if (autoPlayBest && gameStarted && currentPlayer === 1 && !isLoadingTopMoves && !isDictionaryLoading && !isAutoPlaying) {
      setIsAutoPlaying(true);
      handlePlayTopMove().finally(() => {
        setIsAutoPlaying(false);
        // Clear all temporary states
        setSimulatingMove(null);
        setSimulationResult(null);
        setSimulationProgress(0);
        setPreviewBoard(null);
        setPreviewMove(null);
        setMoveWithResults(null);
        setTopMoves([]); // Clear top moves
      });
    }
  }, [autoPlayBest, gameStarted, currentPlayer, isLoadingTopMoves, isDictionaryLoading, handlePlayTopMove, isAutoPlaying]);

  // Add cleanup effect for all temporary states
  useEffect(() => {
    return () => {
      // Clear all state
      setBoardCoords([]);
      setTempBoardCoords([]);
      setOrigBoardCoords([]);
      setMoveHistory([]);
      setTopMoves([]);
      setSimulatingMove(null);
      setSimulationResult(null);
      setSimulationProgress(0);
      setPreviewBoard(null);
      setPreviewMove(null);
      setMoveWithResults(null);
      setLeaveValues({}); // Clear leave values cache
      setSelectedTiles([]);
      setSelectedBoardPosition(null);
      setArrowDirection('right');
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPressWrapper = (event) => handleKeyPress({
      event,
      gameStarted,
      handlePass,
      handleExchange,
      handlePlayTopMove
    });

    window.addEventListener('keydown', handleKeyPressWrapper);
    return () => {
      window.removeEventListener('keydown', handleKeyPressWrapper);
    };
  }, [gameStarted, handlePass, handleExchange, handlePlayTopMove]);

  const simulateMove = async (move) => {
    setSimulatingMove(move);
    setSimulationProgress(0);
    setPreviewBoard(null);
    setPreviewMove(null);
    
    try {
      const gameState = {
        boardCoords,
        currentPlayer,
        player1Rack,
        player2Rack,
        player1points,
        player2points,
        pool
      };
      
      const result = await simulateMoveFunction(move, gameState, (progress, previewData) => {
        setSimulationProgress(progress);
        if (previewData) {
          setPreviewBoard(previewData.board);
          setPreviewMove(previewData.move);
        }
      });
      setSimulationResult(result);
      setMoveWithResults(move);
    } catch (error) {
      console.error('Error simulating move:', error);
      setSnackbarMessage('Error simulating move: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSimulatingMove(null);
      setSimulationProgress(0);
      // Don't clear previewBoard and previewMove here
    }
  };

  const calculateLeave = (move) => {
    // Create a copy of the current rack
    const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
    const rackCopy = [...currentRack];
    
    // Remove tiles used in the move
    for (const tile of move.tiles) {
      if (tile.isNew) {
        // For blank tiles, we need to find the blank in the rack
        const tileIndex = tile.isBlank ? rackCopy.indexOf('?') : rackCopy.indexOf(tile.letter);
        if (tileIndex !== -1) {
          rackCopy.splice(tileIndex, 1);
        }
      }
    }
    
    // Sort the remaining tiles to create the leave
    const leave = rackCopy.sort().join('');
    return leave;
  };

  const fetchLeaveValues = async (moves) => {
    try {
      // Calculate leave values for each move
      const leavesToFetch = new Map();
      const leavesArray = [];
      
      for (const move of moves) {
        // For regular moves, calculate the leave after playing the word
        const leaveStr = move.isExchange ? move.leave : calculateLeave(move);
        move.leave = leaveStr; // Add leave to the move object
        
        // Only fetch if we don't already have this leave value
        if (!leaveValues[leaveStr]) {
          leavesToFetch.set(leaveStr, true);
          leavesArray.push(leaveStr);
        }
      }

      // Only make the API call if we have new leaves to fetch
      if (leavesToFetch.size > 0) {
        const response = await fetch('/.netlify/functions/getLeaveValues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ leaves: leavesArray }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch leave values');
        }

        const data = await response.json();
        
        // Update the leaveValues state with the new values
        const newLeaveValues = {};
        if (data.leaveValues) {
          // The response is now an object with leave strings as keys
          Object.assign(newLeaveValues, data.leaveValues);
        }
        
        // Merge new leave values with existing ones
        const updatedLeaveValues = {
          ...leaveValues,
          ...newLeaveValues
        };
        setLeaveValues(updatedLeaveValues);

        // Return the updated leave values for immediate use
        return updatedLeaveValues;
      }

      // If no new leaves to fetch, return current leave values
      return leaveValues;
    } catch (error) {
      console.error('Error fetching leave values:', error);
      return leaveValues;
    }
  };

  // Modify the existing code that sets topMoves to also fetch leave values
  useEffect(() => {
    if (topMoves.length > 0) {
      console.log('Top moves updated, fetching leave values');
      fetchLeaveValues(topMoves);
    }
  }, [topMoves]);

  // Add effect to limit move history size more aggressively
  useEffect(() => {
    if (moveHistory.length > 50) { // Reduce to last 50 moves instead of 100
      setMoveHistory(prev => prev.slice(-50));
    }
  }, [moveHistory]);

  const [previewScore, setPreviewScore] = useState(null);
  const [previewScorePosition, setPreviewScorePosition] = useState(null);

  // Add this function to calculate preview score
  const calculatePreviewScore = () => {
    if (selectedTiles.length === 0) {
      setPreviewScore(null);
      setPreviewScorePosition(null);
      return;
    }

    const score = calculateScore(boardCoords, tempBoardCoords, boardMultipliers);
    setPreviewScore(score);
    
    // Calculate position for score preview
    if (selectedBoardPosition) {
      const { row, col } = selectedBoardPosition;
      setPreviewScorePosition({ row, col });
    }
  };

  // Add effect to calculate preview score when tiles are placed
  useEffect(() => {
    if (selectedTiles.length > 0) {
      calculatePreviewScore();
    } else {
      setPreviewScore(null);
      setPreviewScorePosition(null);
    }
  }, [selectedTiles, tempBoardCoords]);

  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
      <Box className={styles.page}>
      <Box className={styles.title}>
        {gameStarted ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: '4px'
          }}>
            <Box sx={{ 
              fontSize: '24px',
              fontWeight: 'bold',
              background: 'linear-gradient(75deg, #4B5563 0%, #6B7280 50%, #4B5563 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {gameTime}/0 • Classic • NWL23
            </Box>
            <Box sx={{ 
              fontSize: '16px',
              color: '#6B7280',
              fontStyle: 'italic'
            }}>
              Void Challenge • Unrated
            </Box>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: '4px'
          }}>
            <Box sx={{ 
              fontSize: '28px',
              fontWeight: 'bold',
              background: 'linear-gradient(75deg, #4B5563 0%, #6B7280 50%, #4B5563 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Play Mode
            </Box>
            <Box sx={{ 
              fontSize: '18px',
              color: '#6B7280',
              fontStyle: 'italic'
            }}>
              Click the robot to play against SidBot
            </Box>
          </Box>
        )}
      </Box>
      <Box className={styles.mainPanel}>
        <Box className={styles.mainBox} component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Board 
            board={board}
            boardMode={theme}
            onBoardChildClick={(row, col) => handleBoardPositionSelect({
              row,
              col,
              boardCoords,
              selectedBoardPosition,
              setSelectedBoardPosition,
              arrowDirection,
              setArrowDirection
            })}
            onTileDrop={(tile, index, row, col) => handleTileDrop({
              tile,
              index,
              row,
              col,
              player1Rack,
              setPlayer1Rack,
              player2Rack,
              setPlayer2Rack,
              selectedTiles,
              setSelectedTiles,
              setSelectedBoardPosition,
              tempBoardCoords,
              setTempBoardCoords
            })}
            onTileClick={(tile, index) => handleTileClick({
              tile,
              index,
              currentPlayer,
              player1Rack,
              player2Rack,
              selectedTiles,
              setSelectedTiles,
              tilesToExchange,
              setTilesToExchange
            })}
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
            previewScore={previewScore}
            previewScorePosition={previewScorePosition}
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
            onTileClick={(tile, index) => handleTileClick({
              tile,
              index,
              currentPlayer,
              player1Rack,
              player2Rack,
              selectedTiles,
              setSelectedTiles,
              tilesToExchange,
              setTilesToExchange
            })}
            selectedTiles={tilesToExchange}
            isBotMode={isBotMode}
            gameStarted={gameStarted}
            isDictionaryLoading={isDictionaryLoading}
            isLoadingTopMoves={isLoadingTopMoves}
            onSettingsOpen={handleSettingsOpen}
            onColorSchemeOpen={handleColorSchemeOpen}
            onBotModeToggle={handleBotModeToggle}
            onGetTopMoves={handleGetTopMoves}
            onWordSubmit={handleWordSubmit}
            onPass={handlePass}
            onExchange={handleExchange}
            onPlayTopMove={handlePlayTopMove}
            selectedBoardPosition={selectedBoardPosition}
            tilesToExchange={tilesToExchange}
            autoPlayBest={autoPlayBest}
            setAutoPlayBest={setAutoPlayBest}
            setShowMoveHistory={setShowMoveHistory}
            isBotThinking={isBotThinking}
            icons={{
              settings: <TuneIcon className={styles.keyBtn} />,
              colorScheme: <PaletteIcon className={styles.keyBtn} />,
              time: (
                <Tooltip title={gameStarted ? "Game time cannot be changed after game starts" : "Set game time"}>
                  <TimerIcon 
                    className={styles.keyBtn} 
                    onClick={() => !gameStarted && setShowTimeSlider(!showTimeSlider)}
                    sx={{ 
                      color: showTimeSlider ? '#4CAF50' : 'inherit',
                      transform: showTimeSlider ? 'scale(1.1)' : 'scale(1)',
                      opacity: gameStarted ? 0.5 : 1,
                      cursor: gameStarted ? 'not-allowed' : 'pointer'
                    }}
                  />
                </Tooltip>
              ),
              botMode: <SmartToyIcon 
                className={`${styles.keyBtn} ${isBotMode ? styles.activeBot : ''}`} 
                sx={{ 
                  fontSize: 24,
                  color: isBotMode ? (currentPlayer === 2 ? '#ff4444' : '#4CAF50') : 'inherit',
                  transition: 'color 0.2s ease',
                  opacity: isBotMode && currentPlayer === 2 ? 0.5 : 1,
                  cursor: isBotMode && currentPlayer === 2 ? 'not-allowed' : 'pointer',
                  pointerEvents: isBotMode && currentPlayer === 2 ? 'none' : 'auto'
                }} 
              />,
              topMoves: <LightbulbIcon className={styles.keyBtn} />,
              moveOrder: (
                <Tooltip title="Move History">
                  <SortIcon 
                    className={styles.keyBtn}
                    onClick={() => setShowMoveHistory(true)}
                    sx={{
                      opacity: !gameStarted ? 0.3 : 1,
                      cursor: !gameStarted ? 'not-allowed' : 'pointer',
                      pointerEvents: !gameStarted ? 'none' : 'auto'
                    }}
                  />
                </Tooltip>
              )
            }}
          />

          {showTimeSlider && !gameStarted && (
            <Box sx={{ 
              width: '100%', 
              mx: 'auto', 
              mt: 2, 
              p: 2, 
              bgcolor: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              backdropFilter: 'blur(10px)',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <Box sx={{ color: '#6B7280', mb: 1, textAlign: 'center' }}>
                Game Time: {gameTime} min
              </Box>
              <Box sx={{ px: 3 }}>
                <Box sx={{ 
                  position: 'relative',
                  width: 'calc(100% - 16px)',
                  mx: 'auto',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {[5, 15, 25, 30].map((value) => (
                    <Box
                      key={value}
                      sx={{
                        position: 'absolute',
                        left: `${((value - 5) / 25) * 100}%`,
                        width: '1px',
                        height: '8px',
                        backgroundColor: '#bfbfbf',
                        transform: 'translateX(-50%)'
                      }}
                    />
                  ))}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${((gameTime - 5) / 25) * 100}%`,
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#4CAF50',
                      borderRadius: '50%',
                      transform: 'translateX(-50%)',
                      cursor: 'pointer'
                    }}
                    onMouseDown={(e) => {
                      const slider = e.currentTarget.parentElement;
                      const rect = slider.getBoundingClientRect();
                      const handleMouseMove = (e) => {
                        const x = e.clientX - rect.left;
                        const percentage = Math.max(0, Math.min(1, x / rect.width));
                        const value = Math.round(5 + percentage * 25);
                        setGameTime(value);
                      };
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )}

          <Box className={styles.playerPanel}>
            <Box className={styles.poolBox}>
              <PlayPool 
                pool={pool} 
                player1Rack={player1Rack} 
                player2Rack={player2Rack}
              />  
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
                  {/* <option value="FULLBOARD">Full Board</option> */}
                </select>
              </Box>
              <Box className={styles.modalContainer__dictionary}>
                Player Move Sound
                <select
                  className={styles.styleSelection}
                  value={playerMoveSoundType}
                  onChange={e => setPlayerMoveSoundType(e.target.value)}
                >
                  <option value="classic">Classic</option>
                  <option value="sword">Sword</option>
                </select>
              </Box>
              <Box className={styles.modalContainer__dictionary}>
                Bot Move Sound
                <select
                  className={styles.styleSelection}
                  value={botMoveSoundType}
                  onChange={e => setBotMoveSoundType(e.target.value)}
                >
                  <option value="classic">Classic</option>
                  <option value="sword">Sword</option>
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

      <ChoicesModal
        open={showTopMoves}
        onClose={() => {
          setShowTopMoves(false);
          setIsLoadingTopMoves(false);
          setIsDictionaryLoading(false);
          setSimulatingMove(null);
          setSimulationResult(null);
          setSimulationProgress(0);
          setMoveWithResults(null);
          setPreviewBoard(null);
          setPreviewMove(null);
          // Don't clear leave values when modal closes
          // setLeaveValues({});
        }}
        isTopMovesLoading={isLoadingTopMoves}
        isDictionaryLoading={isDictionaryLoading}
        topMoves={topMoves}
        onMoveSelect={handleMoveSelect}
        onSimulateMove={simulateMove}
        simulatingMove={simulatingMove}
        simulationResult={simulationResult}
        simulationProgress={simulationProgress}
        moveWithResults={moveWithResults}
        previewBoard={previewBoard}
        boardCoords={boardCoords}
        theme={theme}
        color={color}
        complementaryColor={complementaryColor}
        blankTiles={blankTiles}
        leaveValues={leaveValues}
      />

      <MoveHistoryModal
        open={showMoveHistory}
        onClose={() => setShowMoveHistory(false)}
        moves={moveHistory}
      />
    </Box>
  );
} 