import React, { useState, useEffect } from 'react';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';

// Preset word list (2-9 letters)
const WORDS = [
  'TO', 'IN', 'ON', 'CAT', 'DOG', 'SUN', 'MOON', 'STAR', 'GAME', 'WORD', 'PUZZLE', 'BOARD', 'TILE', 'MATCH', 'FIND', 'SEARCH', 'PLAYER', 'WINNER', 'LETTER', 'SCRABBLE', 'JIGSAW', 'MEMORY', 'BOGGLE', 'FOX', 'MASCOT', 'THEO', 'TESS', 'SID', 'ICON', 'IMAGE', 'QUIZ', 'LOGIC', 'SMART', 'FUN', 'HARD', 'EASY', 'LEVEL', 'SCORE', 'POINT', 'TIMER', 'ROUND', 'SHUFFLE', 'SELECT', 'DRAG', 'DROP', 'CLICK', 'GRID', 'ROW', 'COL', 'LINE', 'DIAGONAL', 'VERTICAL', 'HORIZONTAL', 'RANDOM', 'SOLVE', 'WORDS', 'TILES', 'MATCHES', 'CARDS', 'PAIR', 'LIST', 'SHOW', 'HIDE', 'RESET', 'START', 'END', 'MOVE', 'TURN', 'PLAY', 'GAME', 'WIN', 'LOSE', 'TRY', 'BEST', 'FAST', 'SLOW', 'TIME', 'NEW', 'OLD', 'NEXT', 'BACK', 'MENU', 'HOME', 'ABOUT', 'HELP', 'INFO', 'RULE', 'TIP', 'HINT', 'FOXES', 'MASCOTS', 'GAMES', 'PUZZLES', 'BOARDS', 'TILES', 'WORDS', 'CARDS', 'LEVELS', 'SCORES', 'POINTS', 'TIMERS', 'ROUNDS', 'SHUFFLES', 'MATCHED', 'SELECTED', 'DRAGGED', 'DROPPED', 'CLICKED', 'SOLVED', 'WINNER', 'PLAYER', 'SEARCH', 'FINDER', 'MEMORY', 'JIGSAW', 'BOGGLE', 'SCRABBLE', 'THEO', 'TESS', 'SID', 'ICON', 'IMAGE', 'QUIZ', 'LOGIC', 'SMART', 'FUN', 'HARD', 'EASY', 'LEVEL', 'SCORE', 'POINT', 'TIMER', 'ROUND', 'SHUFFLE', 'SELECT', 'DRAG', 'DROP', 'CLICK', 'GRID', 'ROW', 'COL', 'LINE', 'DIAGONAL', 'VERTICAL', 'HORIZONTAL', 'RANDOM', 'SOLVE'
];

const DIRECTIONS = [
  { dr: 0, dc: 1 },   // right
  { dr: 1, dc: 0 },   // down
  { dr: 1, dc: 1 },   // down-right
  { dr: -1, dc: 1 },  // up-right
  { dr: 0, dc: -1 },  // left
  { dr: -1, dc: 0 },  // up
  { dr: -1, dc: -1 }, // up-left
  { dr: 1, dc: -1 },  // down-left
];

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  easy: { gridSize: 8, numWords: 6, cellSize: 40 },
  medium: { gridSize: 10, numWords: 8, cellSize: 36 },
  hard: { gridSize: 12, numWords: 10, cellSize: 32 }
};

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function pickWords(numWords) {
  // Filter for 2-9 letter words, unique, and pick numWords
  const filtered = WORDS.filter(w => w.length >= 2 && w.length <= 9);
  const shuffled = filtered.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numWords).map(w => w.toUpperCase());
}

function placeWordsOnGrid(words, gridSize) {
  // Create empty grid
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));
  const placed = [];

  for (const word of words) {
    let placedWord = false;
    let attempts = 0;
    while (!placedWord && attempts < 100) {
      const dir = DIRECTIONS[getRandomInt(DIRECTIONS.length)];
      const maxRow = dir.dr === 1 ? gridSize - word.length : dir.dr === -1 ? word.length - 1 : gridSize - 1;
      const maxCol = dir.dc === 1 ? gridSize - word.length : dir.dc === -1 ? word.length - 1 : gridSize - 1;
      const row = dir.dr === 0 ? getRandomInt(gridSize) : getRandomInt(maxRow + 1);
      const col = dir.dc === 0 ? getRandomInt(gridSize) : getRandomInt(maxCol + 1);
      // Check if word fits
      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const r = row + dir.dr * i;
        const c = col + dir.dc * i;
        if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) { fits = false; break; }
        if (grid[r][c] && grid[r][c] !== word[i]) { fits = false; break; }
      }
      if (fits) {
        for (let i = 0; i < word.length; i++) {
          const r = row + dir.dr * i;
          const c = col + dir.dc * i;
          grid[r][c] = word[i];
        }
        placed.push({ word, row, col, dir });
        placedWord = true;
      }
      attempts++;
    }
  }
  // Fill empty cells with random letters
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (!grid[r][c]) {
        grid[r][c] = String.fromCharCode(65 + getRandomInt(26));
      }
    }
  }
  return { grid, placed };
}

function cellsForWord(wordObj) {
  const cells = [];
  for (let i = 0; i < wordObj.word.length; i++) {
    cells.push(`${wordObj.row + wordObj.dir.dr * i},${wordObj.col + wordObj.dir.dc * i}`);
  }
  return cells;
}

export default function WordSearch() {
  const [difficulty, setDifficulty] = useState('medium');
  const [grid, setGrid] = useState([]);
  const [placedWords, setPlacedWords] = useState([]);
  const [selected, setSelected] = useState([]); // [{row, col}]
  const [found, setFound] = useState([]); // array of word indices
  const [words, setWords] = useState([]);
  const [win, setWin] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);

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

  // Responsive cell sizing
  const currentSettings = DIFFICULTY_SETTINGS[difficulty];
  const cellSize = isMobile ? Math.min(currentSettings.cellSize - 8, 32) : currentSettings.cellSize;
  const fontSize = isMobile ? Math.max(cellSize * 0.4, 10) : Math.max(cellSize * 0.5, 14);

  const newPuzzle = () => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const picked = pickWords(settings.numWords);
    const { grid, placed } = placeWordsOnGrid(picked, settings.gridSize);
    setGrid(grid);
    setPlacedWords(placed);
    setWords(picked);
    setSelected([]);
    setFound([]);
    setWin(false);
    setScore(0);
    setTimer(0);
  };

  useEffect(() => {
    newPuzzle();
  }, [difficulty]);

  // Timer effect
  useEffect(() => {
    if (!win && words.length > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [win, words.length]);

  // Helper: get all cells between start and end if in a straight line
  function getLineCells(start, end) {
    if (!start || !end) return [];
    const cells = [];
    const dr = end.row - start.row;
    const dc = end.col - start.col;
    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    if (steps === 0) return [{ row: start.row, col: start.col }];
    const stepR = dr / steps;
    const stepC = dc / steps;
    for (let i = 0; i <= steps; i++) {
      cells.push({
        row: Math.round(start.row + stepR * i),
        col: Math.round(start.col + stepC * i)
      });
    }
    return cells;
  }

  const handleMouseDown = (row, col) => {
    setIsDragging(true);
    setDragStart({ row, col });
    setDragCurrent({ row, col });
    setSelected([{ row, col }]);
  };

  const handleMouseEnter = (row, col) => {
    if (isDragging && dragStart) {
      const line = getLineCells(dragStart, { row, col });
      setDragCurrent({ row, col });
      setSelected(line);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragCurrent) return;
    setIsDragging(false);
    
    // Check if selected cells form a word
    const selectedCells = selected.map(s => `${s.row},${s.col}`);
    const foundWordIndex = placedWords.findIndex((wordObj, i) => {
      if (found.includes(i)) return false;
      const wordCells = cellsForWord(wordObj);
      return wordCells.every(cell => selectedCells.includes(cell));
    });
    
    if (foundWordIndex !== -1) {
      setFound(prev => [...prev, foundWordIndex]);
      setScore(prev => prev + 100);
      
      // Check for win
      if (found.length + 1 === words.length) {
        setWin(true);
      }
    }
    
    setSelected([]);
    setDragStart(null);
    setDragCurrent(null);
  };

  // Touch support
  const touchCellRef = React.useRef();
  const handleTouchStart = (row, col, e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ row, col });
    setDragCurrent({ row, col });
    setSelected([{ row, col }]);
    touchCellRef.current = { row, col };
  };
  
  const handleTouchMove = (e) => {
    if (!isDragging || !dragStart) return;
    const touch = e.touches[0];
    if (!touch) return;
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!elem) return;
    const r = elem.getAttribute('data-row');
    const c = elem.getAttribute('data-col');
    if (r !== null && c !== null) {
      const row = parseInt(r, 10);
      const col = parseInt(c, 10);
      if (touchCellRef.current && touchCellRef.current.row === row && touchCellRef.current.col === col) return;
      touchCellRef.current = { row, col };
      const line = getLineCells(dragStart, { row, col });
      setDragCurrent({ row, col });
      setSelected(line);
    }
  };
  
  const handleTouchEnd = () => {
    handleMouseUp();
    touchCellRef.current = null;
  };

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
              {/* Difficulty Selection */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? 6 : 8,
                alignItems: 'center'
              }}>
                <label style={{
                  fontWeight: 600,
                  marginBottom: 4,
                  textAlign: 'center',
                  fontSize: isMobile ? 14 : 16
                }}>Difficulty:</label>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: isMobile ? 1 : 2, 
                  justifyContent: 'center',
                  width: '100%'
                }}>
                  {[
                    { value: 'easy', label: 'Easy' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'hard', label: 'Hard' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setDifficulty(option.value)}
                      style={{
                        padding: isMobile ? '1px 3px' : '2px 4px',
                        fontSize: isMobile ? 7 : 9,
                        borderRadius: 3,
                        background: difficulty === option.value 
                          ? 'linear-gradient(45deg, transparent 5%, #4ECDC4 5%)'
                          : 'linear-gradient(45deg, transparent 5%, #1F2937 5%)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        letterSpacing: 0.2,
                        boxShadow: difficulty === option.value 
                          ? '2px 0px 0px #3D5A80'
                          : '2px 0px 0px #374151',
                        outline: 'transparent',
                        position: 'relative',
                        userSelect: 'none',
                        marginLeft: 0,
                        marginRight: 0,
                        marginBottom: 0,
                        transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                        transform: difficulty === option.value ? 'scale(1.01)' : 'scale(1)',
                        zIndex: difficulty === option.value ? 2 : 1,
                        flex: isMobile ? '1 1 calc(33% - 1px)' : '1 1 calc(33% - 1px)',
                        minWidth: isMobile ? '20px' : '25px',
                        height: isMobile ? '20px' : '24px'
                      }}
                    >
                      {option.label}
                      {difficulty === option.value && (
                        <span style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: -2,
                          height: 1,
                          background: '#4ECDC4',
                          borderRadius: 1,
                          width: '100%',
                          display: 'block',
                        }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row', 
                gap: isMobile ? 8 : 8,
                width: '100%'
              }}>
                <button onClick={newPuzzle} style={{ 
                  flex: '1',
                  padding: isMobile ? '3px 8px' : '2px 6px', 
                  fontSize: isMobile ? 10 : 9, 
                  borderRadius: 4, 
                  background: 'linear-gradient(45deg, transparent 5%, #4ECDC4 5%)',
                  color: '#fff', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  letterSpacing: 0.3,
                  boxShadow: '3px 0px 0px #3D5A80',
                  outline: 'transparent',
                  position: 'relative',
                  userSelect: 'none',
                  transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                  height: isMobile ? '24px' : '20px'
                }}>
                  New Puzzle
                </button>
              </div>

              {/* Game Stats */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? 4 : 6,
                alignItems: 'center',
                marginTop: isMobile ? 8 : 12
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
                  <span>Time: {timer}s</span>
                  <span>Score: {score}</span>
                  <span>Found: {found.length}/{words.length}</span>
                </div>
              </div>

              {/* Word List */}
              <div style={{ 
                background: '#fff', 
                borderRadius: 16, 
                boxShadow: '0 2px 12px #0001', 
                border: '2px solid #e0e7ef', 
                padding: isMobile ? 16 : 24, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: isMobile ? 6 : 10,
                marginTop: isMobile ? 12 : 16
              }}>
                <div style={{ 
                  fontWeight: 700, 
                  fontSize: isMobile ? 14 : 18, 
                  marginBottom: isMobile ? 4 : 8, 
                  color: '#3D5A80',
                  textAlign: 'center'
                }}>
                  Words to Find:
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: isMobile ? 4 : 8,
                  justifyContent: 'center'
                }}>
                  {words.map((word, i) => (
                    <div key={word} style={{ 
                      textDecoration: found.includes(i) ? 'line-through' : 'none', 
                      color: found.includes(i) ? '#4ECDC4' : '#222', 
                      fontWeight: 600, 
                      fontSize: isMobile ? 12 : 16, 
                      letterSpacing: 1,
                      padding: isMobile ? '2px 4px' : '4px 8px',
                      borderRadius: 4,
                      background: found.includes(i) ? '#4ECDC422' : 'transparent'
                    }}>
                      {word}
                    </div>
                  ))}
                </div>
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
              {/* Grid */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <table
                  style={{ 
                    borderCollapse: 'collapse', 
                    background: '#fff', 
                    borderRadius: 16, 
                    boxShadow: '0 2px 12px #0001', 
                    border: '2px solid #e0e7ef', 
                    userSelect: 'none' 
                  }}
                  onMouseLeave={handleMouseUp}
                >
                  <tbody>
                    {grid.map((rowArr, r) => (
                      <tr key={r}>
                        {rowArr.map((cell, c) => {
                          const isSelected = selected.some(sel => sel.row === r && sel.col === c);
                          const isFound = placedWords.some((w, i) => found.includes(i) && cellsForWord(w).includes(`${r},${c}`));
                          return (
                            <td
                              key={c}
                              data-row={r}
                              data-col={c}
                              onMouseDown={() => handleMouseDown(r, c)}
                              onMouseEnter={() => handleMouseEnter(r, c)}
                              onMouseUp={handleMouseUp}
                              onTouchStart={e => handleTouchStart(r, c, e)}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={handleTouchEnd}
                              style={{
                                width: cellSize, 
                                height: cellSize, 
                                textAlign: 'center', 
                                border: '1px solid #e0e7ef', 
                                borderRadius: 6,
                                background: isFound ? '#4ECDC4' : isSelected ? '#ffe066' : '#f8fafc',
                                color: isFound ? '#fff' : '#222',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                                boxShadow: isFound ? '0 2px 8px #4ECDC455' : undefined,
                                touchAction: 'none',
                                WebkitUserSelect: 'none',
                                userSelect: 'none',
                                fontSize: fontSize,
                                fontWeight: 700,
                                letterSpacing: 1
                              }}
                            >
                              {cell}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {win && (
            <div style={{ 
              marginTop: isMobile ? 16 : 32, 
              fontSize: isMobile ? 20 : 28, 
              fontWeight: 700, 
              color: '#4ECDC4',
              textAlign: 'center'
            }}>
              🎉 You found all the words!
            </div>
          )}
        </Box>
      </Box>
    </Box>
  );
} 