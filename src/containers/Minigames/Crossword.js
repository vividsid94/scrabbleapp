import React, { useState, useEffect } from 'react';

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

const GRID_SIZE = 13;
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
          let intersections = 0;
          let canPlace = true;
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

  const newPuzzle = () => {
    const words = getRandomWords(12);
    const { grid, placed } = generateCrossword(words);
    setGrid(grid);
    setPlaced(placed);
    setUserGrid(grid.map(row => row.map(cell => cell ? { ...cell, userLetter: '' } : null)));
    setSelectedCell(null);
    setWin(false);
    console.log(`Generated puzzle with ${placed.length} words`);
  };

  useEffect(() => {
    newPuzzle();
  }, []);

  // Check for win
  useEffect(() => {
    if (!userGrid.length || !grid.length) return;
    
    let allFilled = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r] && grid[r][c]) {
          if (grid[r][c].letter !== userGrid[r][c].userLetter.toUpperCase()) {
            allFilled = false;
            break;
          }
        }
      }
      if (!allFilled) break;
    }
    
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
      
      if (nextRow < GRID_SIZE && nextCol < GRID_SIZE && 
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '20px' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, margin: '0 0 18px 0', letterSpacing: 1 }}>Mini Crossword</h2>
      <button 
        onClick={newPuzzle} 
        style={{ 
          marginBottom: 18, 
          padding: '10px 28px', 
          fontSize: 18, 
          borderRadius: 8, 
          background: '#4ECDC4', 
          color: '#fff', 
          border: 'none', 
          cursor: 'pointer', 
          fontWeight: 'bold', 
          boxShadow: '0 2px 8px #0002' 
        }}
      >
        New Puzzle ({placed.length} words)
      </button>
      
      <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
        {/* Grid */}
        <table 
          style={{ 
            borderCollapse: 'collapse', 
            background: '#fff', 
            borderRadius: 16, 
            boxShadow: '0 2px 12px #0001', 
            border: '2px solid #e0e7ef', 
            fontSize: 22, 
            fontWeight: 700, 
            letterSpacing: 2, 
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
                      width: 36, 
                      height: 36, 
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
                      fontSize: 20,
                      outline: 'none',
                      transition: 'background 0.2s',
                    }}
                  >
                    {cell && cell.number && (
                      <span style={{ 
                        position: 'absolute', 
                        top: 2, 
                        left: 4, 
                        fontSize: 10, 
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
        
        {/* Clues */}
        <div style={{ 
          minWidth: 260, 
          background: '#fff', 
          borderRadius: 16, 
          boxShadow: '0 2px 12px #0001', 
          border: '2px solid #e0e7ef', 
          padding: 24, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 18,
          maxHeight: '500px',
          overflowY: 'auto'
        }}>
          {acrossClues.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#3D5A80' }}>Across</div>
              {acrossClues.map(({ num, clue }) => (
                <div key={`across-${num}`} style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                  <span style={{ color: '#4ECDC4', fontWeight: 800 }}>{num}.</span> {clue}
                </div>
              ))}
            </>
          )}
          
          {downClues.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 18, margin: '16px 0 8px 0', color: '#3D5A80' }}>Down</div>
              {downClues.map(({ num, clue }) => (
                <div key={`down-${num}`} style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                  <span style={{ color: '#3D5A80', fontWeight: 800 }}>{num}.</span> {clue}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      
      {win && (
        <div style={{ marginTop: 32, fontSize: 28, fontWeight: 700, color: '#4ECDC4' }}>
          🎉 You solved the crossword!
        </div>
        )}
      
      {/* Debug info */}
      <div style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
        Debug: Check browser console for placement details
      </div>
    </div>
  );
}