const { createClient } = require('@supabase/supabase-js');

const letterScores = {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2,
    H: 4, I: 1, J: 8, K: 5, L: 1, M: 3, N: 1,
    O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1,
    V: 4, W: 4, X: 8, Y: 4, Z: 10
};

const boardMultipliers = [
    [4,0,0,1,0,0,0,4,0,0,0,1,0,0,4],
    [0,3,0,0,0,2,0,0,0,2,0,0,0,3,0],
    [0,0,3,0,0,0,1,0,1,0,0,0,3,0,0],
    [1,0,0,3,0,0,0,1,0,0,0,3,0,0,1],
    [0,0,0,0,3,0,0,0,0,0,3,0,0,0,0],
    [0,2,0,0,0,2,0,0,0,2,0,0,0,2,0],
    [0,0,1,0,0,0,1,0,1,0,0,0,1,0,0],
    [4,0,0,1,0,0,0,3,0,0,0,1,0,0,4],
    [0,0,1,0,0,0,1,0,1,0,0,0,1,0,0],
    [0,2,0,0,0,2,0,0,0,2,0,0,0,2,0],
    [0,0,0,0,3,0,0,0,0,0,3,0,0,0,0],
    [1,0,0,3,0,0,0,1,0,0,0,3,0,0,1],
    [0,0,3,0,0,0,1,0,1,0,0,0,3,0,0],
    [0,3,0,0,0,2,0,0,0,2,0,0,0,3,0],
    [4,0,0,1,0,0,0,4,0,0,0,1,0,0,4]
];

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function isValidWord(word) {
  try {
    const { data, error } = await supabase
      .from('dictionary')
      .select('word')
      .eq('word', word.toUpperCase())
      .single();

    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

function getWordAt(board, row, col, direction) {
  let word = '';
  let r = row;
  let c = col;

  if (direction === 'horizontal') {
    while (c >= 0 && typeof board[r][c] === 'string') c--;
    c++;
    while (c < 15 && typeof board[r][c] === 'string') word += board[r][c++];
  } else {
    while (r >= 0 && typeof board[r][c] === 'string') r--;
    r++;
    while (r < 15 && typeof board[r][c] === 'string') word += board[r++][c];
  }

  return word.length > 1 ? word : null;
}

function findNewWords(beforeBoard, afterBoard, placedTiles) {
  const words = new Set();
  for (const { row, col } of placedTiles) {
    const h = getWordAt(afterBoard, row, col, 'horizontal');
    const v = getWordAt(afterBoard, row, col, 'vertical');
    if (h) words.add(h);
    if (v) words.add(v);
  }
  return [...words];
}

function applyTilesToBoard(board, tiles) {
  const copy = board.map(row => [...row]);
  for (const { row, col, letter } of tiles) {
    copy[row][col] = letter;
  }
  return copy;
}

async function scoreTilesWithBoard(beforeBoard, tiles) {
  const afterBoard = applyTilesToBoard(beforeBoard, tiles);
  return await scorePlay(beforeBoard, afterBoard);
}

async function scorePlay(beforeBoard, afterBoard) {
  let totalScore = 0;
  const placedTiles = [];

  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (typeof afterBoard[r][c] === 'string' &&
          (typeof beforeBoard[r][c] !== 'string')) {
        placedTiles.push({ row: r, col: c, letter: afterBoard[r][c] });
      }
    }
  }

  if (placedTiles.length === 0) return 0;

  const formedWords = new Set();

  const getWordScore = (tiles) => {
    let score = 0;
    let wordMultiplier = 1;
    for (const { letter, row, col } of tiles) {
      const base = letterScores[letter] || 0;
      let letterMult = 1;
      if (beforeBoard[row][col] !== afterBoard[row][col]) {
        const m = boardMultipliers[row][col];
        if (m === 1) letterMult = 2;
        else if (m === 2) letterMult = 3;
        else if (m === 3) wordMultiplier *= 2;
        else if (m === 4) wordMultiplier *= 3;
      }
      score += base * letterMult;
    }
    return score * wordMultiplier;
  };

  const findWordTiles = (row, col, dir) => {
    const tiles = [];
    let r = row;
    let c = col;

    if (dir === 'horizontal') {
      while (c > 0 && typeof afterBoard[r][c - 1] === 'string') c--;
      while (c < 15 && typeof afterBoard[r][c] === 'string') {
        tiles.push({ row: r, col: c, letter: afterBoard[r][c++] });
      }
    } else {
      while (r > 0 && typeof afterBoard[r - 1][c] === 'string') r--;
      while (r < 15 && typeof afterBoard[r][c] === 'string') {
        tiles.push({ row: r, col: c, letter: afterBoard[r++][c] });
      }
    }

    return tiles.length > 1 ? tiles : [];
  };

  for (const { row, col } of placedTiles) {
    const h = findWordTiles(row, col, 'horizontal');
    const v = findWordTiles(row, col, 'vertical');

    if (h.length) {
      const word = h.map(t => t.letter).join('');
      if (!formedWords.has(word) && await isValidWord(word)) {
        totalScore += getWordScore(h);
        formedWords.add(word);
      }
    }

    if (v.length) {
      const word = v.map(t => t.letter).join('');
      if (!formedWords.has(word) && await isValidWord(word)) {
        totalScore += getWordScore(v);
        formedWords.add(word);
      }
    }
  }

  if (placedTiles.length === 7) totalScore += 50;
  return totalScore;
}

module.exports = {
  scorePlay,
  applyTilesToBoard,
  scoreTilesWithBoard,
  letterScores,
  boardMultipliers
};
