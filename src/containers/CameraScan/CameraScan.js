import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, IconButton, Tooltip } from '@mui/material';
import { Camera, Play, Pause, RefreshCw, CheckCircle, XCircle, Lightbulb } from '@phosphor-icons/react';
import { ThemeContext } from '../../App';
import { useGameStore } from '../../stores/gameStore';
import MoveCoach from '../Play/components/MoveCoach';
import Tesseract from 'tesseract.js';
import { analyzeMove } from '../../functions/play/moveCoachAnalysis';
import { calculateLeave } from '../../functions/play/leaveFunctions';
import styles from './CameraScan.module.css';

/**
 * CameraScan - Live Scrabble Board Scanner
 * 
 * Features:
 * - Continuous camera access
 * - Board grid detection and calibration
 * - Tile recognition (OCR + manual correction)
 * - Real-time best move calculation
 * - Move feedback using Move Coach
 */
export default function CameraScan() {
  const { lightMode } = React.useContext(ThemeContext);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const ocrWorkerRef = useRef(null);
  
  // Camera and scanning state
  const [cameraActive, setCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState([]);
  const [boardState, setBoardState] = useState(null); // 15x15 array
  const [rack, setRack] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [ocrEnabled, setOcrEnabled] = useState(true);
  
  // Move calculation state
  const [topMoves, setTopMoves] = useState([]);
  const [isLoadingMoves, setIsLoadingMoves] = useState(false);
  const [showMoveCoach, setShowMoveCoach] = useState(false);
  const [moveCoachData, setMoveCoachData] = useState(null);
  const [previousBoardState, setPreviousBoardState] = useState(null);
  
  // Manual tile entry state
  const [selectedCell, setSelectedCell] = useState(null);
  const [manualEntryMode, setManualEntryMode] = useState(false);
  
  // Initialize empty board
  useEffect(() => {
    const emptyBoard = Array(15).fill(null).map(() => Array(15).fill(null));
    setBoardState(emptyBoard);
  }, []);
  
  // Initialize OCR worker
  useEffect(() => {
    let worker = null;
    
    const initOCR = async () => {
      try {
        worker = await Tesseract.createWorker('eng', 1, {
          logger: m => {
            if (m.status === 'recognizing text') {
              // Can show progress if needed
            }
          }
        });
        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          tessedit_pageseg_mode: '10' // Single character mode
        });
        ocrWorkerRef.current = worker;
        console.log('✅ OCR worker initialized');
      } catch (err) {
        console.warn('OCR initialization failed, using manual entry only:', err);
        setOcrEnabled(false);
      }
    };
    
    if (ocrEnabled) {
      initOCR();
    }
    
    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, [ocrEnabled]);
  
  // Request camera access
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Could not access camera. Please ensure camera permissions are granted.');
    }
  };
  
  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
  
  // Calibration: User clicks 4 corners of the board
  const handleCanvasClick = (e) => {
    if (!calibrationMode || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newPoints = [...calibrationPoints, { x, y }];
    setCalibrationPoints(newPoints);
    
    if (newPoints.length === 4) {
      // Complete calibration
      setCalibrationMode(false);
      // Calculate grid transformation
      calculateGridTransformation(newPoints);
    }
  };
  
  // Calculate grid transformation from 4 corner points
  const calculateGridTransformation = (points) => {
    // Sort points: top-left, top-right, bottom-left, bottom-right
    points.sort((a, b) => a.y - b.y); // Sort by y
    const topPoints = points.slice(0, 2).sort((a, b) => a.x - b.x);
    const bottomPoints = points.slice(2, 4).sort((a, b) => a.x - b.x);
    
    const topLeft = topPoints[0];
    const topRight = topPoints[1];
    const bottomLeft = bottomPoints[0];
    const bottomRight = bottomPoints[1];
    
    // Store transformation for later use
    localStorage.setItem('cameraCalibration', JSON.stringify({
      topLeft, topRight, bottomLeft, bottomRight,
      timestamp: Date.now()
    }));
    
    console.log('✅ Calibration complete:', { topLeft, topRight, bottomLeft, bottomRight });
  };
  
  // Get calibration from storage
  const getCalibration = () => {
    const stored = localStorage.getItem('cameraCalibration');
    if (stored) {
      const cal = JSON.parse(stored);
      // Check if calibration is recent (within 1 hour)
      if (Date.now() - cal.timestamp < 3600000) {
        return cal;
      }
    }
    return null;
  };
  
  // Start continuous scanning
  const startScanning = () => {
    if (!cameraActive || !videoRef.current) return;
    
    const calibration = getCalibration();
    if (!calibration) {
      setError('Please calibrate the board first by clicking "Calibrate Board"');
      return;
    }
    
    setIsScanning(true);
    // Scan every 2 seconds
    scanIntervalRef.current = setInterval(() => {
      scanBoard(calibration);
    }, 2000);
    
    // Initial scan
    scanBoard(calibration);
  };
  
  // Stop scanning
  const stopScanning = () => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };
  
  // Scan the board and detect tiles
  const scanBoard = async (calibration) => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame
      ctx.drawImage(video, 0, 0);
      
      // Extract board region and detect tiles
      const detectedBoard = await detectTiles(canvas, calibration);
      
      if (detectedBoard) {
        setBoardState(detectedBoard);
        // Auto-calculate best moves when board changes
        calculateBestMoves(detectedBoard, rack);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Error scanning board: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Detect tiles from canvas using image processing
  const detectTiles = async (canvas, calibration) => {
    const ctx = canvas.getContext('2d');
    const board = Array(15).fill(null).map(() => Array(15).fill(null));
    
    // Calculate grid cell positions
    const { topLeft, topRight, bottomLeft, bottomRight } = calibration;
    
    // For each cell in 15x15 grid
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        // Calculate cell position using bilinear interpolation
        const rowRatio = row / 14;
        const colRatio = col / 14;
        
        const topX = topLeft.x + (topRight.x - topLeft.x) * colRatio;
        const topY = topLeft.y + (topRight.y - topLeft.y) * colRatio;
        const bottomX = bottomLeft.x + (bottomRight.x - bottomLeft.x) * colRatio;
        const bottomY = bottomLeft.y + (bottomRight.y - bottomLeft.y) * colRatio;
        
        const cellX = topX + (bottomX - topX) * rowRatio;
        const cellY = topY + (bottomY - topY) * rowRatio;
        
        // Extract cell region (approximate cell size)
        const cellSize = Math.min(
          Math.abs(topRight.x - topLeft.x) / 15,
          Math.abs(bottomLeft.y - topLeft.y) / 15
        );
        
        const cellStartX = Math.max(0, cellX - cellSize / 2);
        const cellStartY = Math.max(0, cellY - cellSize / 2);
        const cellEndX = Math.min(canvas.width, cellX + cellSize / 2);
        const cellEndY = Math.min(canvas.height, cellY + cellSize / 2);
        
        // Extract cell image data
        const cellImageData = ctx.getImageData(
          cellStartX, cellStartY,
          cellEndX - cellStartX,
          cellEndY - cellStartY
        );
        
        // Detect if there's a tile (check for non-background pixels)
        const hasTile = detectTilePresence(cellImageData);
        
        if (hasTile) {
          // Try to recognize the letter
          const letter = await recognizeLetter(cellImageData);
          if (letter) {
            board[row][col] = letter;
          } else {
            // Mark as detected but unrecognized (for manual entry)
            board[row][col] = '?';
          }
        }
      }
    }
    
    return board;
  };
  
  // Detect if a tile is present in the cell
  const detectTilePresence = (imageData) => {
    const data = imageData.data;
    let nonBackgroundPixels = 0;
    const threshold = 50; // Adjust based on testing
    
    // Sample pixels (check every 4th pixel for performance)
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      
      // Check if pixel is significantly different from board background
      // Board is typically beige/wood colored
      if (brightness < 200 || brightness > 250) {
        nonBackgroundPixels++;
      }
    }
    
    // If enough pixels are different, likely a tile
    return nonBackgroundPixels > (data.length / 16) * 0.1;
  };
  
  // Recognize letter from tile image using OCR
  const recognizeLetter = async (imageData) => {
    if (!ocrEnabled || !ocrWorkerRef.current) {
      return null; // Fall back to manual entry
    }
    
    try {
      // Create canvas from image data
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(imageData, 0, 0);
      
      // Enhance image for better OCR
      const processedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = processedData.data;
      
      // Convert to high contrast grayscale
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        
        // High contrast threshold
        const threshold = 128;
        const contrast = gray < threshold ? 0 : 255;
        
        data[i] = contrast;
        data[i + 1] = contrast;
        data[i + 2] = contrast;
      }
      
      ctx.putImageData(processedData, 0, 0);
      
      // Perform OCR
      const { data: { text } } = await ocrWorkerRef.current.recognize(canvas);
      const letter = text.trim().charAt(0).toUpperCase();
      
      // Validate result
      if (letter && letter.match(/[A-Z]/)) {
        return letter;
      }
    } catch (err) {
      console.warn('OCR recognition failed:', err);
    }
    
    return null; // Fall back to manual entry
  };
  
  // Analyze a detected move and provide feedback
  const analyzeDetectedMove = async (newTiles) => {
    if (!previousBoardState || newTiles.length === 0) return;
    
    try {
      // Construct move data
      const words = extractWordsFromTiles(newTiles, boardState);
      if (words.length === 0) return;
      
      const moveForLeave = {
        tiles: newTiles.map(t => ({
          letter: t.letter,
          isNew: true,
          row: t.row,
          col: t.col
        })),
        word: words[0]
      };
      
      // Calculate leave
      const leave = calculateLeave(moveForLeave, rack);
      
      // Calculate score (simplified - would need proper scoring)
      const score = newTiles.length * 10; // Placeholder
      
      const coachData = {
        score,
        word: words[0],
        leave,
        leaveValue: 0, // Would fetch from API
        boardControl: 0, // Would fetch from API
        player1points: 0,
        player2points: 0,
        currentPlayer: 1,
        moveNumber: 0
      };
      
      // Analyze the move
      const analysis = analyzeMove(coachData, topMoves, {
        player1points: 0,
        player2points: 0,
        currentPlayer: 1,
        moveHistory: []
      });
      
      coachData.overallRating = analysis.overallRating;
      coachData.analysisScore = analysis.score;
      
      // Show move coach feedback
      setMoveCoachData(coachData);
      setShowMoveCoach(true);
      
      console.log('📊 Move detected and analyzed:', {
        word: words[0],
        score,
        rating: analysis.overallRating,
        analysisScore: analysis.score
      });
    } catch (err) {
      console.error('Error analyzing move:', err);
    }
  };
  
  // Extract words from placed tiles
  const extractWordsFromTiles = (tiles, board) => {
    if (tiles.length === 0) return [];
    
    // Simple word extraction - check horizontal and vertical
    const words = [];
    const sortedTiles = [...tiles].sort((a, b) => {
      // Check if horizontal or vertical
      const isHorizontal = tiles.every(t => t.row === tiles[0].row);
      if (isHorizontal) {
        return a.col - b.col;
      } else {
        return a.row - b.row;
      }
    });
    
    // Build word from sorted tiles
    const word = sortedTiles.map(t => t.letter).join('');
    if (word.length >= 2) {
      words.push(word);
    }
    
    return words;
  };
  
  // Calculate best moves from current board state
  const calculateBestMoves = async (board, currentRack) => {
    if (!board || !currentRack || currentRack.length === 0) return;
    
    setIsLoadingMoves(true);
    try {
      // Convert board to API format (null -> null, string -> letter)
      const apiBoard = board.map(row => 
        row.map(cell => cell === null ? null : cell.toUpperCase())
      );
      
      // Convert rack to API format
      const apiRack = currentRack.map(tile => tile === '?' ? '*' : tile.toUpperCase());
      
      const response = await fetch('/.netlify/functions/getTopMoves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: apiBoard,
          letters: apiRack
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.moves && data.moves.length > 0) {
        // Filter out empty words
        const validMoves = data.moves.filter(move => move.word && move.word.trim() !== '');
        setTopMoves(validMoves);
      }
    } catch (err) {
      console.error('Error calculating moves:', err);
      setError('Error calculating best moves: ' + err.message);
    } finally {
      setIsLoadingMoves(false);
    }
  };
  
  // Handle manual tile entry
  const handleCellClick = (row, col) => {
    if (manualEntryMode) {
      setSelectedCell({ row, col });
    }
  };
  
  // Handle keyboard input for manual tile entry
  const handleKeyPress = useCallback((e) => {
    if (selectedCell && manualEntryMode) {
      if (e.key === 'Escape') {
        setSelectedCell(null);
        return;
      }
      
      const key = e.key.toUpperCase();
      if (key.match(/[A-Z]/)) {
        e.preventDefault();
        const newBoard = boardState.map(r => [...r]);
        newBoard[selectedCell.row][selectedCell.col] = key;
        setBoardState(newBoard);
        setSelectedCell(null);
        // Recalculate moves
        calculateBestMoves(newBoard, rack);
      } else if (key === 'BACKSPACE' || key === 'DELETE') {
        e.preventDefault();
        const newBoard = boardState.map(r => [...r]);
        newBoard[selectedCell.row][selectedCell.col] = null;
        setBoardState(newBoard);
        setSelectedCell(null);
        calculateBestMoves(newBoard, rack);
      }
    }
  }, [selectedCell, manualEntryMode, boardState, rack]);
  
  useEffect(() => {
    if (manualEntryMode) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [manualEntryMode, handleKeyPress]);
  
  // Render board grid overlay on canvas
  useEffect(() => {
    if (!canvasRef.current || !cameraActive) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (calibrationPoints.length > 0) {
        // Draw calibration points
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        calibrationPoints.forEach((point, i) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.fillStyle = '#00ff00';
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = '16px Arial';
          ctx.fillText(`${i + 1}`, point.x - 5, point.y + 5);
        });
        
        // Draw lines connecting points if we have 4
        if (calibrationPoints.length === 4) {
          const sorted = [...calibrationPoints].sort((a, b) => {
            if (Math.abs(a.y - b.y) < 50) return a.x - b.x;
            return a.y - b.y;
          });
          const [tl, tr, bl, br] = sorted;
          
          ctx.strokeStyle = '#00ff00';
          ctx.beginPath();
          ctx.moveTo(tl.x, tl.y);
          ctx.lineTo(tr.x, tr.y);
          ctx.lineTo(br.x, br.y);
          ctx.lineTo(bl.x, bl.y);
          ctx.closePath();
          ctx.stroke();
          
          // Draw 15x15 grid
          for (let i = 0; i <= 15; i++) {
            const ratio = i / 15;
            // Horizontal lines
            const hx1 = tl.x + (bl.x - tl.x) * ratio;
            const hy1 = tl.y + (bl.y - tl.y) * ratio;
            const hx2 = tr.x + (br.x - tr.x) * ratio;
            const hy2 = tr.y + (br.y - tr.y) * ratio;
            ctx.beginPath();
            ctx.moveTo(hx1, hy1);
            ctx.lineTo(hx2, hy2);
            ctx.stroke();
            
            // Vertical lines
            const vx1 = tl.x + (tr.x - tl.x) * ratio;
            const vy1 = tl.y + (tr.y - tl.y) * ratio;
            const vx2 = bl.x + (br.x - bl.x) * ratio;
            const vy2 = bl.y + (br.y - bl.y) * ratio;
            ctx.beginPath();
            ctx.moveTo(vx1, vy1);
            ctx.lineTo(vx2, vy2);
            ctx.stroke();
          }
        }
      }
      
      requestAnimationFrame(drawGrid);
    };
    
    const animationId = requestAnimationFrame(drawGrid);
    return () => cancelAnimationFrame(animationId);
  }, [cameraActive, calibrationPoints]);
  
  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Typography variant="h4" className={styles.title}>
          📷 Live Board Scanner
        </Typography>
        <Typography variant="body2" className={styles.subtitle}>
          Scan your physical Scrabble board and get real-time move suggestions
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box className={styles.mainContent}>
        {/* Camera View */}
        <Paper className={styles.cameraSection} elevation={3}>
          <Box className={styles.cameraControls}>
            {!cameraActive ? (
              <Button
                variant="contained"
                startIcon={<Camera size={20} />}
                onClick={startCamera}
                size="large"
              >
                Start Camera
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={stopCamera}
                  size="small"
                >
                  Stop Camera
                </Button>
                {calibrationPoints.length < 4 && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      setCalibrationMode(true);
                      setCalibrationPoints([]);
                    }}
                    size="small"
                    color="primary"
                  >
                    Calibrate Board ({calibrationPoints.length}/4)
                  </Button>
                )}
                {calibrationPoints.length === 4 && !isScanning && (
                  <Button
                    variant="contained"
                    startIcon={<Play size={20} />}
                    onClick={startScanning}
                    size="small"
                    color="success"
                  >
                    Start Scanning
                  </Button>
                )}
                {isScanning && (
                  <Button
                    variant="outlined"
                    startIcon={<Pause size={20} />}
                    onClick={stopScanning}
                    size="small"
                    color="warning"
                  >
                    Stop Scanning
                  </Button>
                )}
                <Button
                  variant={manualEntryMode ? "contained" : "outlined"}
                  onClick={() => setManualEntryMode(!manualEntryMode)}
                  size="small"
                >
                  {manualEntryMode ? 'Manual Entry ON' : 'Manual Entry'}
                </Button>
                <Tooltip title={ocrEnabled ? "OCR is enabled" : "OCR disabled - using manual entry only"}>
                  <Button
                    variant={ocrEnabled ? "outlined" : "outlined"}
                    onClick={() => setOcrEnabled(!ocrEnabled)}
                    size="small"
                    color={ocrEnabled ? "success" : "default"}
                  >
                    OCR {ocrEnabled ? 'ON' : 'OFF'}
                  </Button>
                </Tooltip>
              </>
            )}
          </Box>
          
          <Box className={styles.videoContainer}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={styles.video}
            />
            <canvas
              ref={canvasRef}
              className={styles.overlayCanvas}
              onClick={handleCanvasClick}
            />
            {isProcessing && (
              <Box className={styles.processingOverlay}>
                <CircularProgress />
                <Typography>Processing...</Typography>
              </Box>
            )}
          </Box>
          
          {calibrationMode && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Click the 4 corners of the Scrabble board in order: Top-Left, Top-Right, Bottom-Left, Bottom-Right
            </Alert>
          )}
        </Paper>
        
        {/* Board State & Controls */}
        <Paper className={styles.controlsSection} elevation={3}>
          <Typography variant="h6" gutterBottom>
            Detected Board
          </Typography>
          
          {/* Mini board display */}
          <Box className={styles.miniBoard}>
            {boardState && boardState.map((row, rowIdx) => (
              <Box key={rowIdx} className={styles.miniBoardRow}>
                {row.map((cell, colIdx) => (
                  <Box
                    key={colIdx}
                    className={`${styles.miniBoardCell} ${
                      selectedCell?.row === rowIdx && selectedCell?.col === colIdx ? styles.selected : ''
                    } ${cell === '?' ? styles.unrecognized : ''}`}
                    onClick={() => handleCellClick(rowIdx, colIdx)}
                    title={cell === '?' ? 'Tile detected - click to enter letter' : cell || 'Empty'}
                  >
                    {cell === '?' ? '?' : (cell || '')}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
          
          {manualEntryMode && selectedCell && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Click a cell above, then type a letter (A-Z) or Backspace to clear. Press Escape to cancel.
            </Alert>
          )}
          
          {/* Rack input */}
          <Box className={styles.rackInput}>
            <Typography variant="subtitle2" gutterBottom>
              Your Rack (comma-separated, e.g., A,B,C,D,E,F,G)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <input
                type="text"
                value={rack.join(',')}
                onChange={(e) => {
                  const newRack = e.target.value.split(',').map(t => t.trim().toUpperCase()).filter(t => t);
                  setRack(newRack);
                  if (boardState) {
                    calculateBestMoves(boardState, newRack);
                  }
                }}
                placeholder="A,B,C,D,E,F,G"
                className={styles.rackInputField}
                style={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const emptyBoard = Array(15).fill(null).map(() => Array(15).fill(null));
                  setBoardState(emptyBoard);
                  setPreviousBoardState(emptyBoard);
                  setTopMoves([]);
                }}
              >
                Clear Board
              </Button>
            </Box>
          </Box>
          
          {/* Best Moves */}
          {isLoadingMoves ? (
            <Box className={styles.loadingBox}>
              <CircularProgress size={24} />
              <Typography variant="body2">Calculating best moves...</Typography>
            </Box>
          ) : topMoves.length > 0 ? (
            <Box className={styles.topMoves}>
              <Typography variant="h6" gutterBottom>
                Best Moves
              </Typography>
              {topMoves.slice(0, 5).map((move, idx) => (
                <Paper
                  key={idx}
                  className={styles.moveCard}
                  onClick={() => {
                    // Show move coach feedback
                    setMoveCoachData({
                      word: move.word,
                      score: move.score,
                      leave: move.leave || '',
                      overallRating: 'excellent',
                      score: 90
                    });
                    setShowMoveCoach(true);
                  }}
                >
                  <Typography variant="body1" fontWeight="bold">
                    {move.word}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {move.score} points
                  </Typography>
                </Paper>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Enter your rack and scan the board to see best moves
            </Typography>
          )}
        </Paper>
      </Box>
      
      {/* Move Coach Modal */}
      <MoveCoach
        open={showMoveCoach}
        onClose={() => setShowMoveCoach(false)}
        moveData={moveCoachData}
        topMoves={topMoves}
        gameState={{
          player1points: 0,
          player2points: 0,
          currentPlayer: 1,
          moveHistory: []
        }}
      />
    </Box>
  );
}
