import React, { useState, useEffect } from 'react';

// Preset word list (2-9 letters)
const WORDS = [
  'TO', 'IN', 'ON', 'CAT', 'DOG', 'SUN', 'MOON', 'STAR', 'GAME', 'WORD', 'PUZZLE', 'BOARD', 'TILE', 'MATCH', 'FIND', 'SEARCH', 'PLAYER', 'WINNER', 'LETTER', 'SCRABBLE', 'JIGSAW', 'MEMORY', 'BOGGLE', 'FOX', 'MASCOT', 'THEO', 'TESS', 'SID', 'ICON', 'IMAGE', 'QUIZ', 'LOGIC', 'SMART', 'FUN', 'HARD', 'EASY', 'LEVEL', 'SCORE', 'POINT', 'TIMER', 'ROUND', 'SHUFFLE', 'SELECT', 'DRAG', 'DROP', 'CLICK', 'GRID', 'ROW', 'COL', 'LINE', 'DIAGONAL', 'VERTICAL', 'HORIZONTAL', 'RANDOM', 'SOLVE', 'WORDS', 'TILES', 'MATCHES', 'CARDS', 'PAIR', 'LIST', 'SHOW', 'HIDE', 'RESET', 'START', 'END', 'MOVE', 'TURN', 'PLAY', 'GAME', 'WIN', 'LOSE', 'TRY', 'BEST', 'FAST', 'SLOW', 'TIME', 'NEW', 'OLD', 'NEXT', 'BACK', 'MENU', 'HOME', 'ABOUT', 'HELP', 'INFO', 'RULE', 'TIP', 'HINT', 'FOXES', 'MASCOTS', 'GAMES', 'PUZZLES', 'BOARDS', 'TILES', 'WORDS', 'CARDS', 'LEVELS', 'SCORES', 'POINTS', 'TIMERS', 'ROUNDS', 'SHUFFLES', 'MATCHED', 'SELECTED', 'DRAGGED', 'DROPPED', 'CLICKED', 'SOLVED', 'WINNER', 'PLAYER', 'SEARCH', 'FINDER', 'MEMORY', 'JIGSAW', 'BOGGLE', 'SCRABBLE', 'THEO', 'TESS', 'SID', 'ICON', 'IMAGE', 'QUIZ', 'LOGIC', 'SMART', 'FUN', 'HARD', 'EASY', 'LEVEL', 'SCORE', 'POINT', 'TIMER', 'ROUND', 'SHUFFLE', 'SELECT', 'DRAG', 'DROP', 'CLICK', 'GRID', 'ROW', 'COL', 'LINE', 'DIAGONAL', 'VERTICAL', 'HORIZONTAL', 'RANDOM', 'SOLVE'
];

const GRID_SIZE = 12; // 12x12 grid for challenge
const NUM_WORDS = 8; // Number of words per puzzle
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

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function pickWords() {
  // Filter for 2-9 letter words, unique, and pick NUM_WORDS
  const filtered = WORDS.filter(w => w.length >= 2 && w.length <= 9);
  const shuffled = filtered.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, NUM_WORDS).map(w => w.toUpperCase());
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
  const [grid, setGrid] = useState([]);
  const [placedWords, setPlacedWords] = useState([]);
  const [selected, setSelected] = useState([]); // [{row, col}]
  const [found, setFound] = useState([]); // array of word indices
  const [words, setWords] = useState([]);
  const [win, setWin] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);

  const newPuzzle = () => {
    const picked = pickWords();
    const { grid, placed } = placeWordsOnGrid(picked, GRID_SIZE);
    setGrid(grid);
    setPlacedWords(placed);
    setWords(picked);
    setSelected([]);
    setFound([]);
    setWin(false);
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  };

  useEffect(() => {
    newPuzzle();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (found.length === words.length && words.length > 0) setWin(true);
  }, [found, words]);

  // Helper: get all cells between start and end if in a straight line
  function getLineCells(start, end) {
    if (!start || !end) return [];
    const dr = end.row - start.row;
    const dc = end.col - start.col;
    const len = Math.max(Math.abs(dr), Math.abs(dc));
    if (len === 0) return [start];
    const stepR = dr === 0 ? 0 : dr / len;
    const stepC = dc === 0 ? 0 : dc / len;
    // Only allow straight lines (horizontal, vertical, diagonal)
    if (!Number.isInteger(stepR) || !Number.isInteger(stepC)) return [];
    const cells = [];
    for (let i = 0; i <= len; i++) {
      cells.push({ row: start.row + stepR * i, col: start.col + stepC * i });
    }
    return cells;
  }

  // Mouse event handlers
  const handleMouseDown = (row, col) => {
    setIsDragging(true);
    setDragStart({ row, col });
    setDragCurrent({ row, col });
    setSelected([{ row, col }]);
  };
  const handleMouseEnter = (row, col) => {
    if (!isDragging || !dragStart) return;
    const line = getLineCells(dragStart, { row, col });
    setDragCurrent({ row, col });
    setSelected(line);
  };
  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragCurrent) {
      setIsDragging(false);
      setDragStart(null);
      setDragCurrent(null);
      setSelected([]);
      return;
    }
    // Check if the selected line matches any word
    for (let i = 0; i < placedWords.length; i++) {
      const wordObj = placedWords[i];
      const cells = cellsForWord(wordObj);
      const startKey = `${dragStart.row},${dragStart.col}`;
      const endKey = `${dragCurrent.row},${dragCurrent.col}`;
      if ((cells[0] === startKey && cells[cells.length - 1] === endKey) ||
          (cells[0] === endKey && cells[cells.length - 1] === startKey)) {
        if (!found.includes(i)) setFound([...found, i]);
        setSelected(cells.map(cell => {
          const [r, c] = cell.split(',').map(Number);
          return { row: r, col: c };
        }));
        setTimeout(() => {
          setSelected([]);
        }, 600);
        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);
        return;
      }
    }
    // Not a word
    setSelected([]);
    setIsDragging(false);
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
    // Find the cell's row/col from data attributes
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <button onClick={newPuzzle} style={{ marginBottom: 18, padding: '10px 28px', fontSize: 18, borderRadius: 8, background: '#4ECDC4', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px #0002' }}>New Puzzle</button>
      <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', width: '100%', justifyContent: 'center' }}>
        {/* Grid */}
        <table
          style={{ borderCollapse: 'collapse', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #0001', border: '2px solid #e0e7ef', fontSize: 22, fontWeight: 700, letterSpacing: 2, userSelect: 'none' }}
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
                        width: 36, height: 36, textAlign: 'center', border: '1px solid #e0e7ef', borderRadius: 6,
                        background: isFound ? '#4ECDC4' : isSelected ? '#ffe066' : '#f8fafc',
                        color: isFound ? '#fff' : '#222',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        boxShadow: isFound ? '0 2px 8px #4ECDC455' : undefined,
                        touchAction: 'none',
                        WebkitUserSelect: 'none',
                        userSelect: 'none',
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
        {/* Word List */}
        <div style={{ minWidth: 200, background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #0001', border: '2px solid #e0e7ef', padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#3D5A80' }}>Words to Find:</div>
          {words.map((word, i) => (
            <div key={word} style={{ textDecoration: found.includes(i) ? 'line-through' : 'none', color: found.includes(i) ? '#4ECDC4' : '#222', fontWeight: 600, fontSize: 18, letterSpacing: 2 }}>
              {word}
            </div>
          ))}
        </div>
      </div>
      {win && (
        <div style={{ marginTop: 32, fontSize: 28, fontWeight: 700, color: '#4ECDC4' }}>
          🎉 You found all the words!
        </div>
      )}
    </div>
  );
} 