import React, { useState, useEffect } from 'react';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';

// Pool of 20+ words and definitions
const WORDS = [
  { word: 'FOX', clue: 'Clever animal, often red.' },
  { word: 'PUZZLE', clue: 'A game that tests ingenuity.' },
  { word: 'BOARD', clue: 'Where Scrabble is played.' },
  { word: 'TILE', clue: 'A single letter piece in Scrabble.' },
  { word: 'GAME', clue: 'An activity for fun or competition.' },
  { word: 'WIN', clue: 'To be victorious.' },
  { word: 'SMART', clue: 'Clever or intelligent.' },
  { word: 'LOGIC', clue: 'Reasoning conducted according to strict principles.' },
  { word: 'WORD', clue: 'A unit of language.' },
  { word: 'MATCH', clue: 'A contest or a pair.' },
  { word: 'GRID', clue: 'A network of lines that cross each other.' },
  { word: 'SCORE', clue: 'Points earned in a game.' },
  { word: 'TIME', clue: 'Measured in seconds, minutes, hours.' },
  { word: 'LEVEL', clue: 'A stage or rank.' },
  { word: 'FUN', clue: 'Enjoyment or amusement.' },
  { word: 'HINT', clue: 'A small piece of advice.' },
  { word: 'QUIZ', clue: 'A short test.' },
  { word: 'HELP', clue: 'Assistance.' },
  { word: 'PLAY', clue: 'To engage in a game.' },
  { word: 'RULE', clue: 'A principle governing conduct.' },
  { word: 'CAT', clue: 'Feline pet.' },
  { word: 'DOG', clue: 'Canine companion.' },
  { word: 'SUN', clue: 'Star in our solar system.' },
  { word: 'MOON', clue: 'Earth\'s natural satellite.' },
  { word: 'TREE', clue: 'Woody plant.' },
  { word: 'BOOK', clue: 'Collection of pages.' },
  { word: 'FIRE', clue: 'Hot flames.' },
  { word: 'WATER', clue: 'Clear liquid.' },
  { word: 'HOUSE', clue: 'Place to live.' },
  { word: 'PHONE', clue: 'Communication device.' },
];

const GRID_SIZE = 12;
const ACROSS = 0;
const DOWN = 1;

function getRandomWords(n) {
  const shuffled = [...WORDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

function generateCrossword(words) {
  // Initialize empty grid
  let grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  let placed = [];
  let wordNumber = 1;

  // Sort words by length for better placement
  const sortedWords = [...words].sort((a, b) => b.word.length - a.word.length);
  
  console.log('Starting crossword generation with words:', sortedWords.map(w => w.word));

  // Place first word horizontally in center
  const firstWord = sortedWords[0];
  const startRow = Math.floor(GRID_SIZE / 2);
  const startCol = Math.floor((GRID_SIZE - firstWord.word.length) / 2);
  
  // Place first word
  for (let i = 0; i < firstWord.word.length; i++) {
    grid[startRow][startCol + i] = {
      letter: firstWord.word[i],
      userLetter: '',
      number: i === 0 ? wordNumber : undefined
    };
  }
  
  placed.push({
    word: firstWord.word,
    clue: firstWord.clue,
    row: startRow,
    col: startCol,
    dir: ACROSS,
    num: wordNumber++
  });

  console.log('Placed first word:', firstWord.word);

  // Try to place remaining words
  for (let wordIdx = 1; wordIdx < sortedWords.length && wordIdx < 8; wordIdx++) {
    const currentWord = sortedWords[wordIdx];
    let bestPlacement = null;
    let maxIntersections = 0;

    console.log('Trying to place word:', currentWord.word);

    // Try both directions
    for (let direction of [ACROSS, DOWN]) {
      // Try every position on the grid
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          
          // Check if word fits in bounds
          if (direction === ACROSS && col + currentWord.word.length > GRID_SIZE) continue;
          if (direction === DOWN && row + currentWord.word.length > GRID_SIZE) continue;

          // Check if this placement is valid
          let canPlace = true;
          let intersections = 0;
          let hasIntersection = false;
          
          for (let i = 0; i < currentWord.word.length; i++) {
            const r = direction === ACROSS ? row : row + i;
            const c = direction === ACROSS ? col + i : col;
            
            const cell = grid[r][c];
            
            if (cell !== null) {
              // Cell is occupied
              if (cell.letter === currentWord.word[i]) {
                // Valid intersection
                intersections++;
                hasIntersection = true;
              } else {
                // Invalid intersection
                canPlace = false;
                break;
              }
            } else {
              // Cell is empty - check surroundings to avoid creating invalid words
              const adjacentCells = [];
              
              if (direction === ACROSS) {
                // Check above and below for vertical words
                if (r > 0) adjacentCells.push(grid[r - 1][c]);
                if (r < GRID_SIZE - 1) adjacentCells.push(grid[r + 1][c]);
              } else {
                // Check left and right for horizontal words
                if (c > 0) adjacentCells.push(grid[r][c - 1]);
                if (c < GRID_SIZE - 1) adjacentCells.push(grid[r][c + 1]);
              }
              
              // Only allow adjacent letters at intersection points
              for (let adj of adjacentCells) {
                if (adj !== null) {
                  canPlace = false;
                  break;
                }
              }
              
              if (!canPlace) break;
            }
          }
          
          // Check that we don't extend existing words
          if (canPlace) {
            if (direction === ACROSS) {
              if (col > 0 && grid[row][col - 1] !== null) canPlace = false;
              if (col + currentWord.word.length < GRID_SIZE && grid[row][col + currentWord.word.length] !== null) canPlace = false;
            } else {
              if (row > 0 && grid[row - 1][col] !== null) canPlace = false;
              if (row + currentWord.word.length < GRID_SIZE && grid[row + currentWord.word.length][col] !== null) canPlace = false;
            }
          }

          // Must have at least one intersection (except first word)
          if (canPlace && hasIntersection && intersections > maxIntersections) {
            maxIntersections = intersections;
            bestPlacement = { row, col, direction, intersections };
          }
        }
      }
    }
    
    // Place the word if we found a good spot
    if (bestPlacement) {
      console.log(`Placing word ${currentWord.word} at row ${bestPlacement.row}, col ${bestPlacement.col}, direction ${bestPlacement.direction}, intersections: ${bestPlacement.intersections}`);
      
      for (let i = 0; i < currentWord.word.length; i++) {
        const r = bestPlacement.direction === ACROSS ? bestPlacement.row : bestPlacement.row + i;
        const c = bestPlacement.direction === ACROSS ? bestPlacement.col + i : bestPlacement.col;
        
        if (grid[r][c] === null) {
          grid[r][c] = {
            letter: currentWord.word[i],
            userLetter: '',
            number: i === 0 ? wordNumber : undefined
          };
        } else {
          // This is an intersection - add number if it's the start of the word
          if (i === 0) {
            grid[r][c].number = wordNumber;
          }
        }
      }
      
      placed.push({
        word: currentWord.word,
        clue: currentWord.clue,
        row: bestPlacement.row,
        col: bestPlacement.col,
        dir: bestPlacement.direction,
        num: wordNumber++
      });
    } else {
      console.log(`Could not place word: ${currentWord.word}`);
    }
  }

  console.log('Final placed words:', placed.length);
  return { grid, placed };
}

export default function Crossword() {
  const [grid, setGrid] = useState([]);
  const [placed, setPlaced] = useState([]);
  const [userGrid, setUserGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [win, setWin] = useState(false);
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

  // Responsive sizing
  const cellSize = isMobile ? 24 : 36;
  const fontSize = isMobile ? 12 : 20;

  const newPuzzle = () => {
    const words = getRandomWords(12);
    const { grid, placed } = generateCrossword(words);
    setGrid(grid);
    setPlaced(placed);
    setUserGrid(grid.map(row => row.map(cell => cell ? { ...cell, userLetter: '' } : null)));
    setSelectedCell(null);
    setWin(false);
    setScore(0);
    setTimer(0);
    console.log(`Generated puzzle with ${placed.length} words`);
  };

  useEffect(() => {
    newPuzzle();
  }, []);

  // Timer effect
  useEffect(() => {
    if (!win && placed.length > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [win, placed.length]);

  // Check for win
  useEffect(() => {
    if (!userGrid.length || !grid.length) return;
    
    let allFilled = true;
    let correctCells = 0;
    let totalCells = 0;
    
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r] && grid[r][c]) {
          totalCells++;
          if (grid[r][c].letter === userGrid[r][c].userLetter.toUpperCase()) {
            correctCells++;
          } else {
            allFilled = false;
          }
        }
      }
    }
    
    setScore(Math.floor((correctCells / totalCells) * 100));
    setWin(allFilled);
  }, [userGrid, grid]);

  const handleCellClick = (row, col) => {
    if (!grid[row] || !grid[row][col]) return;
    setSelectedCell({ row, col });
  };

  const handleInput = (e) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    
    if (e.key === 'Backspace') {
      setUserGrid(prev => {
        const newGrid = prev.map(rowArr => rowArr.map(cell => cell ? { ...cell } : null));
        if (newGrid[row] && newGrid[row][col]) {
          newGrid[row][col].userLetter = '';
        }
        return newGrid;
      });
      return;
    }
    
    const val = e.key.length === 1 ? e.key.toUpperCase() : '';
    if (!/^[A-Z]$/.test(val)) return;
    
    setUserGrid(prev => {
      const newGrid = prev.map(rowArr => rowArr.map(cell => cell ? { ...cell } : null));
      if (newGrid[row] && newGrid[row][col]) {
        newGrid[row][col].userLetter = val;
      }
      return newGrid;
    });
    
    // Move to next cell in the same word if possible
    const currentWord = placed.find(w => {
      const inRange = w.dir === ACROSS 
        ? (row === w.row && col >= w.col && col < w.col + w.word.length)
        : (col === w.col && row >= w.row && row < w.row + w.word.length);
      return inRange;
    });
    
    if (currentWord) {
      let nextRow = row, nextCol = col;
      if (currentWord.dir === ACROSS) {
        nextCol++;
      } else {
        nextRow++;
      }
      
      if (nextRow < grid.length && nextCol < grid[0].length && 
          grid[nextRow] && grid[nextRow][nextCol]) {
        setSelectedCell({ row: nextRow, col: nextCol });
      }
    }
  };

  // Generate clues
  const acrossClues = placed
    .filter(w => w.dir === ACROSS)
    .sort((a, b) => a.num - b.num)
    .map(w => ({ num: w.num, clue: w.clue }));
    
  const downClues = placed
    .filter(w => w.dir === DOWN)
    .sort((a, b) => a.num - b.num)
    .map(w => ({ num: w.num, clue: w.clue }));

  return (
    <Box sx={{ display: 'flex'}}>
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
            {/* Left third - Controls */}
            <div style={{
              width: isMobile ? '100%' : '33%',
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? 8 : 10
            }}>
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
                  New Puzzle ({placed.length} words)
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
                  <span>Score: {score}%</span>
                </div>
              </div>

              {/* Clues */}
              <div style={{ 
                background: '#fff', 
                borderRadius: 16, 
                boxShadow: '0 2px 12px #0001', 
                border: '2px solid #e0e7ef', 
                padding: isMobile ? 8 : 12, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: isMobile ? 6 : 8,
                marginTop: isMobile ? 12 : 16,
                maxHeight: isMobile ? 300 : 400,
                overflowY: 'auto',
                alignItems: 'flex-start'
              }}>
                {acrossClues.length > 0 && (
                  <>
                    <div style={{ 
                      fontWeight: 700, 
                      fontSize: isMobile ? 12 : 14, 
                      marginBottom: isMobile ? 2 : 4, 
                      color: '#3D5A80',
                      textAlign: 'left',
                      width: '100%'
                    }}>
                      Across
                    </div>
                    {acrossClues.map(({ num, clue }) => (
                      <div key={`across-${num}`} style={{ 
                        fontWeight: 600, 
                        fontSize: isMobile ? 10 : 12, 
                        marginBottom: isMobile ? 1 : 2,
                        textAlign: 'left',
                        width: '100%'
                      }}>
                        <span style={{ color: '#4ECDC4', fontWeight: 800 }}>{num}.</span> {clue}
                      </div>
                    ))}
                  </>
                )}
                
                {downClues.length > 0 && (
                  <>
                    <div style={{ 
                      fontWeight: 700, 
                      fontSize: isMobile ? 12 : 14, 
                      margin: isMobile ? '8px 0 2px 0' : '12px 0 4px 0', 
                      color: '#3D5A80',
                      textAlign: 'left',
                      width: '100%'
                    }}>
                      Down
                    </div>
                    {downClues.map(({ num, clue }) => (
                      <div key={`down-${num}`} style={{ 
                        fontWeight: 600, 
                        fontSize: isMobile ? 10 : 12, 
                        marginBottom: isMobile ? 1 : 2,
                        textAlign: 'left',
                        width: '100%'
                      }}>
                        <span style={{ color: '#3D5A80', fontWeight: 800 }}>{num}.</span> {clue}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Right two-thirds - Game Board */}
            <div style={{
              width: isMobile ? '100%' : '67%',
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
                  tabIndex={0}
                  onKeyDown={handleInput}
                >
                  <tbody>
                    {userGrid.map((rowArr, r) => (
                      <tr key={r}>
                        {rowArr.map((cell, c) => (
                          <td
                            key={c}
                            onClick={() => handleCellClick(r, c)}
                            style={{
                              width: cellSize, 
                              height: cellSize, 
                              textAlign: 'center', 
                              border: '1px solid #e0e7ef', 
                              borderRadius: 6,
                              background: cell 
                                ? (selectedCell && selectedCell.row === r && selectedCell.col === c ? '#ffe066' : '#f8fafc') 
                                : '#bbb',
                              color: cell ? '#222' : '#888',
                              cursor: cell ? 'pointer' : 'default',
                              position: 'relative',
                              fontWeight: 700,
                              fontSize: fontSize,
                              outline: 'none',
                              transition: 'background 0.2s',
                            }}
                          >
                            {cell && cell.number && (
                              <span style={{ 
                                position: 'absolute', 
                                top: 2, 
                                left: 4, 
                                fontSize: Math.max(fontSize * 0.4, 6), 
                                color: '#3D5A80', 
                                fontWeight: 800 
                              }}>
                                {cell.number}
                              </span>
                            )}
                            {cell && cell.userLetter}
                          </td>
                        ))}
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
              🎉 You solved the crossword!
            </div>
          )}
        </Box>
      </Box>
    </Box>
  );
}