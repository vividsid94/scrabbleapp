import React, { useState, useEffect } from 'react';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import { findAllPossibleWords, canFormWord } from '../../functions/boggleFunctions';
import { modifyImageColor } from '../../functions/tileFunctions';

// Preload tile images
let allLetters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'];
let preloadedImages = {};

function preload() {
  allLetters.forEach(letter => {
    let srcString = '/images/compressed-clean-protiles/' + letter + '.png';
    preloadedImages[letter] = new Image();
    preloadedImages[letter].src = srcString;
  });
}

// Initialize preloading
if (Object.keys(preloadedImages).length === 0) {
  preload();
}

const Boggle = () => {
  const [board, setBoard] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes game time
  const [dictionary, setDictionary] = useState(new Set());
  const [possibleWords, setPossibleWords] = useState([]);
  const [showHints, setShowHints] = useState(false);
  const [isDictionaryLoading, setIsDictionaryLoading] = useState(true);
  const [tileColor, setTileColor] = useState('#6D84A2');
  const [highlightedTile, setHighlightedTile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  const touchCellRef = React.useRef();

  // Mobile responsiveness
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Responsive sizing
  const tileSize = isMobile ? 60 : 80;
  const tileGap = isMobile ? 8 : 12;
  const boardSize = 4 * tileSize + 3 * tileGap;

  // Load dictionary
  useEffect(() => {
    const loadDictionary = async () => {
      try {
        setIsDictionaryLoading(true);
        const response = await fetch('/.netlify/functions/loadBoggleDictionary');
        if (!response.ok) {
          throw new Error('Failed to load dictionary');
        }
        const data = await response.json();
        setDictionary(new Set(data.words));
        setIsDictionaryLoading(false);
      } catch (error) {
        console.error('Error loading dictionary:', error);
        setIsDictionaryLoading(false);
      }
    };
    loadDictionary();
  }, []);

  // Initialize board with random letters
  const initializeBoard = () => {
    // Standard Boggle dice configuration
    const dice = [
      ['A', 'A', 'E', 'E', 'G', 'N'],
      ['A', 'B', 'B', 'J', 'O', 'O'],
      ['A', 'C', 'H', 'O', 'P', 'S'],
      ['A', 'F', 'F', 'K', 'P', 'S'],
      ['A', 'O', 'O', 'T', 'T', 'W'],
      ['C', 'I', 'M', 'O', 'T', 'U'],
      ['D', 'E', 'I', 'L', 'R', 'X'],
      ['D', 'E', 'L', 'R', 'V', 'Y'],
      ['D', 'I', 'S', 'T', 'T', 'Y'],
      ['E', 'E', 'G', 'H', 'N', 'W'],
      ['E', 'E', 'I', 'N', 'S', 'U'],
      ['E', 'H', 'R', 'T', 'V', 'W'],
      ['E', 'I', 'O', 'S', 'S', 'T'],
      ['E', 'L', 'R', 'T', 'T', 'Y'],
      ['H', 'I', 'M', 'N', 'U', 'Qu'],
      ['H', 'L', 'N', 'N', 'R', 'Z']
    ];

    // Shuffle the dice
    const shuffledDice = [...dice].sort(() => Math.random() - 0.5);
    
    // Create new board by rolling each die
    const newBoard = shuffledDice.map(die => {
      const randomIndex = Math.floor(Math.random() * 6);
      return die[randomIndex];
    });

    // Convert 1D array to 4x4 grid
    const boardGrid = [];
    for (let i = 0; i < 4; i++) {
      boardGrid.push(newBoard.slice(i * 4, (i + 1) * 4));
    }

    setBoard(boardGrid);
    setSelectedLetters([]);
    setFoundWords([]);
    setScore(0);
    setTimeLeft(180);
    setIsPlaying(true);
    setShowHints(false);
    setPossibleWords([]);
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft]);

  // Update possible words when board changes
  useEffect(() => {
    if (board.length > 0 && dictionary.size > 0) {
      const words = findAllPossibleWords(board, dictionary);
      setPossibleWords(words);
    }
  }, [board, dictionary]);

  const handleTileMouseDown = (row, col) => {
    if (!isPlaying) return;
    setIsDragging(true);
    setDragStart({ row, col });
    setDragCurrent({ row, col });
    setSelectedLetters([[row, col]]);
  };

  const handleTileMouseEnter = (row, col) => {
    if (!isDragging || !dragStart || !isPlaying) return;
    
    // Check if the tile is adjacent to the last selected tile
    const lastSelected = selectedLetters[selectedLetters.length - 1];
    const rowDiff = Math.abs(row - lastSelected[0]);
    const colDiff = Math.abs(col - lastSelected[1]);
    
    if (rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0)) {
      // Check if this tile is already selected (to prevent loops)
      const isAlreadySelected = selectedLetters.some(([r, c]) => r === row && c === col);
      if (!isAlreadySelected) {
        setSelectedLetters(prev => [...prev, [row, col]]);
        setDragCurrent({ row, col });
      }
    }
  };

  const handleTileMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  };

  const handleTileTouchStart = (row, col, e) => {
    e.preventDefault();
    handleTileMouseDown(row, col);
    touchCellRef.current = { row, col };
  };

  const handleTileTouchMove = (e) => {
    if (!isDragging || !dragStart || !isPlaying) return;
    const touch = e.touches[0];
    if (!touch) return;
    
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!elem) return;
    
    const row = elem.getAttribute('data-row');
    const col = elem.getAttribute('data-col');
    
    if (row !== null && col !== null) {
      const rowNum = parseInt(row, 10);
      const colNum = parseInt(col, 10);
      
      if (touchCellRef.current && touchCellRef.current.row === rowNum && touchCellRef.current.col === colNum) return;
      touchCellRef.current = { row: rowNum, col: colNum };
      handleTileMouseEnter(rowNum, colNum);
    }
  };

  const handleTileTouchEnd = () => {
    handleTileMouseUp();
    touchCellRef.current = null;
  };

  const submitWord = () => {
    if (selectedLetters.length < 3) return;
    
    const word = selectedLetters.map(([row, col]) => board[row][col]).join('');
    
    // Check if word is valid
    if (dictionary.has(word.toLowerCase()) && !foundWords.includes(word)) {
      const wordScore = calculateWordScore(word);
      setScore(prev => prev + wordScore);
      setFoundWords(prev => [...prev, word]);
      
      // Highlight the word briefly
      setHighlightedTile(word);
      setTimeout(() => setHighlightedTile(null), 1000);
    }
    
    setSelectedLetters([]);
  };

  const calculateWordScore = (word) => {
    const length = word.length;
    if (length === 3) return 1;
    if (length === 4) return 1;
    if (length === 5) return 2;
    if (length === 6) return 3;
    if (length === 7) return 5;
    return 11; // 8+ letters
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Enter') {
        submitWord();
      } else if (event.key === 'Escape') {
        setSelectedLetters([]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedLetters]);

  const findTile = (letter) => {
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        if (board[row][col] === letter) {
          return { row, col };
        }
      }
    }
    return null;
  };

  const renderTile = (letter, row, col) => {
    const isSelected = selectedLetters.some(([r, c]) => r === row && c === col);
    const isHighlighted = highlightedTile && highlightedTile.includes(letter);
    const cacheKey = letter === 'Qu' ? 'Q' : letter;
    const cachedImage = preloadedImages[cacheKey];
    
    if (cachedImage) {
      const modifiedImageUrl = modifyImageColor(cachedImage, tileColor);
      return (
        <div
          key={`${row}-${col}`}
          data-row={row}
          data-col={col}
          onMouseDown={() => handleTileMouseDown(row, col)}
          onMouseEnter={() => handleTileMouseEnter(row, col)}
          onMouseUp={handleTileMouseUp}
          onTouchStart={(e) => handleTileTouchStart(row, col, e)}
          onTouchMove={handleTileTouchMove}
          onTouchEnd={handleTileTouchEnd}
          style={{
            width: tileSize,
            height: tileSize,
            backgroundImage: `url(${modifiedImageUrl})`,
            backgroundSize: '100%',
            backgroundRepeat: 'no-repeat',
            backgroundColor: isSelected ? '#4ECDC4' : isHighlighted ? '#FFD700' : tileColor,
            borderRadius: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: isSelected 
              ? '0 4px 8px rgba(78, 205, 196, 0.4)'
              : '0 2px 4px rgba(0, 0, 0, 0.2)',
            transform: isSelected ? 'scale(0.95)' : 'scale(1)',
            touchAction: 'none',
            userSelect: 'none'
          }}
        />
      );
    }
    return null;
  };

  function getTileCenter(row, col) {
    return {
      x: col * (tileSize + tileGap) + tileSize / 2,
      y: row * (tileSize + tileGap) + tileSize / 2,
    };
  }

  // Polyline points for selected path
  const linePoints = selectedLetters.map(([row, col]) => {
    const { x, y } = getTileCenter(row, col);
    return `${x},${y}`;
  }).join(' ');

  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav />
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 2, sm: 4, md: 6 },
        px: { xs: 1, sm: 2, md: 3 }
      }}>
        <Box sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 1200, md: 1400 },
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0
        }}>
          {/* Controls Section */}
          <div style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : 1200,
            marginBottom: isMobile ? 16 : 20,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 16 : 20,
            alignItems: 'flex-start'
          }}>
            {/* Left quarter - Controls */}
            <div style={{
              width: isMobile ? '100%' : '25%',
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? 8 : 10
            }}>
              {/* Game Stats */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? 4 : 6,
                alignItems: 'center',
                marginBottom: isMobile ? 8 : 12
              }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row', 
                  gap: isMobile ? 4 : 12,
                  alignItems: 'center',
                  fontSize: isMobile ? 12 : 14,
                  fontWeight: 500,
                  color: '#374151'
                }}>
                  <span>Score: {score}</span>
                  <span>Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row', 
                gap: isMobile ? 8 : 8,
                width: '100%'
              }}>
                <button 
                  onClick={initializeBoard}
                  disabled={isDictionaryLoading}
                  style={{ 
                    flex: '1',
                    padding: isMobile ? '3px 8px' : '2px 6px', 
                    fontSize: isMobile ? 10 : 9, 
                    borderRadius: 4, 
                    background: 'linear-gradient(45deg, transparent 5%, #4ECDC4 5%)',
                    color: '#fff', 
                    border: 'none', 
                    cursor: isDictionaryLoading ? 'not-allowed' : 'pointer', 
                    fontWeight: 'bold',
                    letterSpacing: 0.3,
                    boxShadow: '3px 0px 0px #3D5A80',
                    outline: 'transparent',
                    position: 'relative',
                    userSelect: 'none',
                    transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                    height: isMobile ? '24px' : '20px',
                    opacity: isDictionaryLoading ? 0.6 : 1
                  }}
                >
                  {isDictionaryLoading ? 'Loading...' : 'New Game'}
                </button>
              </div>

              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row', 
                gap: isMobile ? 8 : 8,
                width: '100%'
              }}>
                <button 
                  onClick={submitWord}
                  disabled={selectedLetters.length < 3 || !isPlaying}
                  style={{ 
                    flex: '1',
                    padding: isMobile ? '3px 8px' : '2px 6px', 
                    fontSize: isMobile ? 10 : 9, 
                    borderRadius: 4, 
                    background: 'linear-gradient(45deg, transparent 5%, #4ECDC4 5%)',
                    color: '#fff', 
                    border: 'none', 
                    cursor: (selectedLetters.length < 3 || !isPlaying) ? 'not-allowed' : 'pointer', 
                    fontWeight: 'bold',
                    letterSpacing: 0.3,
                    boxShadow: '3px 0px 0px #3D5A80',
                    outline: 'transparent',
                    position: 'relative',
                    userSelect: 'none',
                    transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                    height: isMobile ? '24px' : '20px',
                    opacity: (selectedLetters.length < 3 || !isPlaying) ? 0.6 : 1
                  }}
                >
                  Submit Word
                </button>
              </div>

              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row', 
                gap: isMobile ? 8 : 8,
                width: '100%'
              }}>
                <button 
                  onClick={() => setShowHints(!showHints)}
                  disabled={isDictionaryLoading || !isPlaying}
                  style={{ 
                    flex: '1',
                    padding: isMobile ? '3px 8px' : '2px 6px', 
                    fontSize: isMobile ? 10 : 9, 
                    borderRadius: 4, 
                    background: showHints 
                      ? 'linear-gradient(45deg, transparent 5%, #4ECDC4 5%)'
                      : 'linear-gradient(45deg, transparent 5%, #1F2937 5%)',
                    color: '#fff', 
                    border: 'none', 
                    cursor: (isDictionaryLoading || !isPlaying) ? 'not-allowed' : 'pointer', 
                    fontWeight: 'bold',
                    letterSpacing: 0.3,
                    boxShadow: showHints 
                      ? '3px 0px 0px #3D5A80'
                      : '3px 0px 0px #374151',
                    outline: 'transparent',
                    position: 'relative',
                    userSelect: 'none',
                    transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                    height: isMobile ? '24px' : '20px',
                    opacity: (isDictionaryLoading || !isPlaying) ? 0.6 : 1
                  }}
                >
                  {showHints ? 'Hide Hints' : 'Show Hints'}
                </button>
              </div>

              {/* Word Lists */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? 8 : 12,
                marginTop: isMobile ? 12 : 16
              }}>
                {/* Found Words */}
                <div style={{ 
                  background: '#fff', 
                  borderRadius: 16, 
                  boxShadow: '0 2px 12px #0001', 
                  border: '2px solid #e0e7ef', 
                  padding: isMobile ? 12 : 16, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: isMobile ? 4 : 6
                }}>
                  <div style={{ 
                    fontWeight: 700, 
                    fontSize: isMobile ? 12 : 14, 
                    marginBottom: isMobile ? 4 : 6, 
                    color: '#3D5A80',
                    textAlign: 'center'
                  }}>
                    Found Words:
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: isMobile ? 2 : 4,
                    justifyContent: 'center',
                    maxHeight: isMobile ? 120 : 150,
                    overflowY: 'auto'
                  }}>
                    {foundWords.map((word, index) => (
                      <div key={index} style={{ 
                        color: '#4ECDC4', 
                        fontWeight: 600, 
                        fontSize: isMobile ? 10 : 12, 
                        padding: isMobile ? '1px 3px' : '2px 4px',
                        borderRadius: 3,
                        background: '#4ECDC422'
                      }}>
                        {word} ({calculateWordScore(word)})
                      </div>
                    ))}
                  </div>
                </div>

                {/* Possible Words (Hints) */}
                {showHints && (
                  <div style={{ 
                    background: '#fff', 
                    borderRadius: 16, 
                    boxShadow: '0 2px 12px #0001', 
                    border: '2px solid #e0e7ef', 
                    padding: isMobile ? 12 : 16, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: isMobile ? 4 : 6
                  }}>
                    <div style={{ 
                      fontWeight: 700, 
                      fontSize: isMobile ? 12 : 14, 
                      marginBottom: isMobile ? 4 : 6, 
                      color: '#3D5A80',
                      textAlign: 'center'
                    }}>
                      Possible Words:
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: isMobile ? 2 : 4,
                      justifyContent: 'center',
                      maxHeight: isMobile ? 120 : 150,
                      overflowY: 'auto'
                    }}>
                      {possibleWords.slice(0, isMobile ? 10 : 15).map(({ word, score }, index) => (
                        <div key={index} style={{ 
                          color: '#666', 
                          fontWeight: 500, 
                          fontSize: isMobile ? 9 : 11, 
                          padding: isMobile ? '1px 2px' : '1px 3px',
                          borderRadius: 2,
                          background: '#f3f4f6'
                        }}>
                          {word} ({score})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right three-quarters - Game Board */}
            <div style={{
              width: isMobile ? '100%' : '75%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              overflow: 'hidden'
            }}>
              {isDictionaryLoading ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 200,
                  fontSize: isMobile ? 16 : 18,
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Loading Dictionary...
                </div>
              ) : (
                <div style={{ 
                  position: 'relative', 
                  width: boardSize, 
                  height: boardSize,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: tileGap,
                  padding: isMobile ? 12 : 16,
                  background: '#fff',
                  borderRadius: 16,
                  boxShadow: '0 2px 12px #0001',
                  border: '2px solid #e0e7ef'
                }} onMouseLeave={handleTileMouseUp}>
                  {/* SVG overlay for lines */}
                  <svg
                    width={boardSize}
                    height={boardSize}
                    style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 2 }}
                  >
                    {selectedLetters.length > 1 && (
                      <polyline
                        points={linePoints}
                        fill="none"
                        stroke="#4ECDC4"
                        strokeWidth={isMobile ? 6 : 8}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        opacity={0.85}
                        style={{ filter: 'drop-shadow(0 2px 8px #4ECDC455)' }}
                      />
                    )}
                  </svg>
                  {/* Tiles */}
                  {board.map((row, rowIndex) => (
                    row.map((letter, colIndex) => renderTile(letter, rowIndex, colIndex))
                  ))}
                </div>
              )}
            </div>
          </div>

          {!isPlaying && timeLeft === 0 && (
            <div style={{ 
              marginTop: isMobile ? 16 : 32, 
              fontSize: isMobile ? 20 : 28, 
              fontWeight: 700, 
              color: '#4ECDC4',
              textAlign: 'center'
            }}>
              🎉 Game Over! Final Score: {score}
            </div>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Boggle; 