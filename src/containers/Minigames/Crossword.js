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
  { word: 'TESS', clue: 'Your friendly fox mascot.' },
  { word: 'SID', clue: 'The creator of this site.' },
  { word: 'THEO', clue: 'Another mascot fox.' },
  { word: 'ICON', clue: 'A small graphic symbol.' },
  { word: 'IMAGE', clue: 'A visual representation.' },
  { word: 'CARD', clue: 'A piece used in memory games.' },
  { word: 'PAIR', clue: 'Two of a kind.' },
  { word: 'HOME', clue: 'Where you live.' },
  { word: 'ABOUT', clue: 'Information section.' },
  { word: 'MENU', clue: 'A list of options.' },
];

const GRID_SIZE = 13;

// Directions
const ACROSS = 0;
const DOWN = 1;

function getRandomWords(n) {
  const shuffled = WORDS.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// Backtracking crossword generator with localGrid to avoid shadowing state
function generateCrossword(words) {
  const sortedWords = [...words].sort((a, b) => b.word.length - a.word.length);
  let bestPlaced = [];
  let bestGrid = [];

  function cloneGrid(localGrid) {
    return localGrid.map(row => row.map(cell => (cell ? { ...cell } : null)));
  }

  function canPlace(localGrid, word, row, col, dir) {
    if (dir === ACROSS && col + word.length > GRID_SIZE) return false;
    if (dir === DOWN && row + word.length > GRID_SIZE) return false;
    for (let k = 0; k < word.length; k++) {
      const r = dir === ACROSS ? row : row + k;
      const c = dir === ACROSS ? col + k : col;
      const cell = localGrid[r][c];
      if (cell && cell.letter !== word[k]) return false;
      // Don't allow adjacent words (classic rule)
      if (dir === ACROSS) {
        if (r > 0 && localGrid[r - 1][c]) return false;
        if (r < GRID_SIZE - 1 && localGrid[r + 1][c]) return false;
      } else {
        if (c > 0 && localGrid[r][c - 1]) return false;
        if (c < GRID_SIZE - 1 && localGrid[r][c + 1]) return false;
      }
    }
    return true;
  }

  function placeWord(localGrid, word, row, col, dir, wordNum) {
    for (let k = 0; k < word.length; k++) {
      const r = dir === ACROSS ? row : row + k;
      const c = dir === ACROSS ? col + k : col;
      if (!localGrid[r][c]) localGrid[r][c] = { letter: word[k], userLetter: '' };
      if (k === 0) localGrid[r][c].number = wordNum;
    }
  }

  function removeWord(localGrid, word, row, col, dir) {
    for (let k = 0; k < word.length; k++) {
      const r = dir === ACROSS ? row : row + k;
      const c = dir === ACROSS ? col + k : col;
      // Only remove if this cell is not shared with another word
      let shared = false;
      for (let d = 0; d < word.length; d++) {
        if (d === k) continue;
        const rr = dir === ACROSS ? row : row + d;
        const cc = dir === ACROSS ? col + d : col;
        if (rr === r && cc === c) shared = true;
      }
      if (!shared) localGrid[r][c] = null;
    }
  }

  function search(localGrid, placed, used, wordNum) {
    if (placed.length > bestPlaced.length) {
      bestPlaced = placed.map(w => ({ ...w }));
      bestGrid = cloneGrid(localGrid);
    }
    if (used.length === sortedWords.length) return;
    for (let w = 0; w < sortedWords.length; w++) {
      if (used.includes(w)) continue;
      const word = sortedWords[w].word;
      let placedWord = false;
      // Try all possible positions and directions
      for (let dir of [ACROSS, DOWN]) {
        for (let row = 0; row < GRID_SIZE; row++) {
          for (let col = 0; col < GRID_SIZE; col++) {
            // If not first word, must cross an existing letter
            if (placed.length > 0) {
              let crosses = false;
              for (let k = 0; k < word.length; k++) {
                const r = dir === ACROSS ? row : row + k;
                const c = dir === ACROSS ? col + k : col;
                if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) continue;
                if (localGrid[r][c] && localGrid[r][c].letter === word[k]) crosses = true;
              }
              if (!crosses) continue;
            }
            if (canPlace(localGrid, word, row, col, dir)) {
              placeWord(localGrid, word, row, col, dir, wordNum);
              placed.push({ ...sortedWords[w], row, col, dir, num: wordNum });
              search(localGrid, placed, [...used, w], wordNum + 1);
              placed.pop();
              removeWord(localGrid, word, row, col, dir);
              placedWord = true;
            }
          }
        }
      }
      if (!placedWord && placed.length === 0) return; // If first word can't be placed, stop
    }
  }

  // Start with empty grid and no placed words
  for (let dir of [ACROSS, DOWN]) {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const localGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
        if (canPlace(localGrid, sortedWords[0].word, row, col, dir)) {
          placeWord(localGrid, sortedWords[0].word, row, col, dir, 1);
          search(localGrid, [{ ...sortedWords[0], row, col, dir, num: 1 }], [0], 2);
          // No need to removeWord here since localGrid is recreated each time
        }
      }
    }
  }
  return { grid: bestGrid, placed: bestPlaced };
}

function getCellNumber(grid, row, col) {
  return grid[row][col] && grid[row][col].number ? grid[row][col].number : undefined;
}

export default function Crossword() {
  const [grid, setGrid] = useState([]);
  const [placed, setPlaced] = useState([]);
  const [userGrid, setUserGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [win, setWin] = useState(false);

  const newPuzzle = () => {
    const words = getRandomWords(20);
    const { grid, placed } = generateCrossword(words);
    setGrid(grid);
    setPlaced(placed);
    setUserGrid(grid.map(row => row.map(cell => cell ? { ...cell, userLetter: '' } : null)));
    setSelectedCell(null);
    setWin(false);
  };

  useEffect(() => {
    newPuzzle();
    // eslint-disable-next-line
  }, []);

  // Check for win
  useEffect(() => {
    if (!userGrid.length || !grid.length) return;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r] && grid[r][c] && grid[r][c].letter !== userGrid[r][c].userLetter.toUpperCase()) return;
      }
    }
    setWin(true);
  }, [userGrid, grid]);

  const handleCellClick = (row, col) => {
    if (!grid[row][col]) return;
    setSelectedCell({ row, col });
  };

  const handleInput = (e) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const val = e.key.length === 1 ? e.key.toUpperCase() : '';
    if (!/^[A-Z]$/.test(val)) return;
    setUserGrid(prev => {
      const newGrid = prev.map(rowArr => rowArr.map(cell => cell ? { ...cell } : null));
      newGrid[row][col].userLetter = val;
      return newGrid;
    });
    // Move to next cell in the same word if possible
    const word = placed.find(w => w.row === row && w.col === col && grid[row][col].number === w.num);
    if (word) {
      let nextRow = row, nextCol = col;
      if (word.dir === ACROSS) nextCol++;
      else nextRow++;
      if (nextRow < GRID_SIZE && nextCol < GRID_SIZE && grid[nextRow][nextCol]) {
        setSelectedCell({ row: nextRow, col: nextCol });
      }
    }
  };

  // Clues
  const acrossClues = placed.filter(w => w.dir === ACROSS).map(w => ({ num: w.num, clue: w.clue }));
  const downClues = placed.filter(w => w.dir === DOWN).map(w => ({ num: w.num, clue: w.clue }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, margin: '0 0 18px 0', letterSpacing: 1 }}>Mini Crossword</h2>
      <button onClick={newPuzzle} style={{ marginBottom: 18, padding: '10px 28px', fontSize: 18, borderRadius: 8, background: '#4ECDC4', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px #0002' }}>New Puzzle</button>
      <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', width: '100%', justifyContent: 'center' }}>
        {/* Grid */}
        <table style={{ borderCollapse: 'collapse', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #0001', border: '2px solid #e0e7ef', fontSize: 22, fontWeight: 700, letterSpacing: 2, userSelect: 'none' }}
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
                      width: 36, height: 36, textAlign: 'center', border: '1px solid #e0e7ef', borderRadius: 6,
                      background: cell ? (selectedCell && selectedCell.row === r && selectedCell.col === c ? '#ffe066' : '#f8fafc') : '#bbb',
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
                      <span style={{ position: 'absolute', top: 2, left: 4, fontSize: 10, color: '#3D5A80', fontWeight: 800 }}>{cell.number}</span>
                    )}
                    {cell && cell.userLetter}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {/* Clues */}
        <div style={{ minWidth: 260, background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #0001', border: '2px solid #e0e7ef', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#3D5A80' }}>Across</div>
          {acrossClues.map(({ num, clue }) => (
            <div key={num} style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
              <span style={{ color: '#4ECDC4', fontWeight: 800 }}>{num}.</span> {clue}
            </div>
          ))}
          <div style={{ fontWeight: 700, fontSize: 18, margin: '16px 0 8px 0', color: '#3D5A80' }}>Down</div>
          {downClues.map(({ num, clue }) => (
            <div key={num} style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
              <span style={{ color: '#3D5A80', fontWeight: 800 }}>{num}.</span> {clue}
            </div>
          ))}
        </div>
      </div>
      {win && (
        <div style={{ marginTop: 32, fontSize: 28, fontWeight: 700, color: '#4ECDC4' }}>
          🎉 You solved the crossword!
        </div>
      )}
    </div>
  );
} 