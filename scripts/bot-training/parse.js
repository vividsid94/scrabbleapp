/**
 * Parses raw annotated GCG files (scripts/bot-training/raw-games/*.gcg) into
 * training examples: (board-before, rack, score context, move played) plus
 * the expert's #note commentary, for every commented move.
 *
 * Deliberately standalone from src/utils/gcgParser.js - that one only reads
 * '>' move lines for live single-game viewing and has no reason to carry
 * this pipeline's board-reconstruction/note-capture logic.
 *
 * Usage:
 *   node scripts/bot-training/parse.js              # parse all raw games -> dataset.jsonl
 *   node scripts/bot-training/parse.js 58184         # parse+print one game for inspection
 */

const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, 'raw-games');
const OUT_FILE = path.join(__dirname, 'dataset.jsonl');

const LETTER_LOOKUP = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 10, K: 11, L: 12, M: 13, N: 14, O: 15 };
const ORIG_BOARD = [
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

function extractLocation(str) {
  const parts = str.match(/^(\d+)(\D+)$|^(\D+)(\d+)$/);
  if (!parts) return [null, null];
  return [parts[1] || parts[3], parts[2] || parts[4]];
}

function isLocationField(field) {
  return /^[A-O]\d+$|^\d+[A-O]$/.test(field);
}

function isExchangeField(field) {
  return /^-[A-Za-z?]+$/.test(field) && field !== '-';
}

// Parses one '>Player: rack field1 field2... score total' line.
function parseMoveLine(line) {
  const content = line.slice(1); // drop '>'
  const parts = content.split(' ').filter(p => p.trim() !== '');
  if (parts.length < 2) return null;

  const player = parts[0].endsWith(':') ? parts[0].slice(0, -1) : parts[0];
  const rest = parts.slice(1);

  // Endgame adjustment lines look like: "Player:  (CG) +10 447" - rack slot is "(...)"
  if (rest.length > 0 && rest[0].startsWith('(')) {
    const score = parseInt(rest[1], 10);
    const total = parseInt(rest[2], 10);
    return { player, type: 'endgame_adjustment', rack: null, score, total, word: null, location: null };
  }

  const rack = rest[0];
  const remaining = rest.slice(1);
  // Last two numeric-ish fields are score (+/-N) and total (N)
  const total = parseInt(remaining[remaining.length - 1], 10);
  const score = parseInt(remaining[remaining.length - 2], 10);
  const middleFields = remaining.slice(0, remaining.length - 2);

  let type = 'pass';
  let location = null;
  let word = null;
  let exchangedTiles = null;

  for (const field of middleFields) {
    if (isLocationField(field)) {
      type = 'play';
      location = field;
    } else if (field === '--') {
      // pass or challenge - leave type as 'pass' unless a location was already found
    } else if (isExchangeField(field)) {
      type = 'exchange';
      exchangedTiles = field.slice(1);
    } else if (/^[A-Za-z.]+$/.test(field)) {
      word = field;
    }
  }

  return { player, type, rack, location, word, score, total, exchangedTiles };
}

function parseRawGame(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let player1 = null;
  let player2 = null;
  const moves = [];

  for (const line of lines) {
    if (line.startsWith('#player1')) {
      player1 = line.split(' ').slice(2).join(' ').trim();
    } else if (line.startsWith('#player2')) {
      player2 = line.split(' ').slice(2).join(' ').trim();
    } else if (line.startsWith('#note')) {
      const noteText = line.slice('#note'.length).trim();
      if (moves.length > 0) {
        const last = moves[moves.length - 1];
        last.note = last.note ? `${last.note} ${noteText}` : noteText;
      }
    } else if (line.startsWith('>')) {
      const move = parseMoveLine(line);
      if (move) moves.push(move);
    }
    // ignore #character-encoding and any other header lines
  }

  return { player1, player2, moves };
}

// Places a word on the board, mutating `board` in place. Returns the list of
// newly-placed tiles ({row, col, letter, isBlank}) - '.' chars are existing
// pass-through tiles and are skipped.
function placeWord(board, location, word) {
  const [part1, part2] = extractLocation(location);
  if (part1 === null) return [];

  const placed = [];
  let row, col, horizontal;

  if (Number.isInteger(Number(part1))) {
    // e.g. "8F" -> horizontal, row 8, starting col F
    row = Number(part1) - 1;
    col = LETTER_LOOKUP[part2.toUpperCase()] - 1;
    horizontal = true;
  } else {
    // e.g. "F8" -> vertical, starting row 8, col F
    row = Number(part2) - 1;
    col = LETTER_LOOKUP[part1.toUpperCase()] - 1;
    horizontal = false;
  }

  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || r > 14 || c < 0 || c > 14) {
      // Non-standard board (e.g. oversized bot-test games with columns past O
      // or rows past 15) - bail so the caller discards this whole game.
      throw new Error(`out-of-bounds placement at row=${r}, col=${c} (non-standard board?)`);
    }
    if (ch !== '.') {
      const isBlank = ch >= 'a' && ch <= 'z';
      board[r][c] = ch.toUpperCase();
      placed.push({ row: r, col: c, letter: ch.toUpperCase(), isBlank });
    }
  }
  return placed;
}

function cloneBoard(board) {
  return board.map(row => row.slice());
}

// Walks a parsed game's moves, reconstructing board state before/after each
// move. Returns an array of enriched move records ready for dataset export.
function reconstructGame(gameId, parsed) {
  const { player1, player2, moves } = parsed;
  let board = ORIG_BOARD.map(row => row.slice());
  let totals = { [player1]: 0, [player2]: 0 };
  let tilesPlacedSoFar = 0;
  const enriched = [];

  moves.forEach((move, moveIndex) => {
    const boardBefore = cloneBoard(board);
    const poolRemainingBefore = 100 - tilesPlacedSoFar;
    let placedTiles = [];

    if (move.type === 'play' && move.location && move.word) {
      placedTiles = placeWord(board, move.location, move.word);
      tilesPlacedSoFar += placedTiles.length;
    }
    // exchange / pass / endgame_adjustment: board unchanged

    if (typeof move.total === 'number' && !Number.isNaN(move.total)) {
      totals[move.player] = move.total;
    }
    const opponent = move.player === player1 ? player2 : player1;

    enriched.push({
      gameId,
      moveIndex,
      player: move.player,
      opponent,
      type: move.type,
      rack: move.rack,
      location: move.location,
      word: move.word,
      exchangedTiles: move.exchangedTiles,
      score: move.score,
      playerTotalAfter: totals[move.player],
      opponentTotalBefore: totals[opponent] || 0,
      poolRemainingBeforeMove: poolRemainingBefore,
      boardBefore,
      placedTiles,
      note: move.note || null
    });
  });

  return enriched;
}

function parseOneGameFile(filePath, gameId) {
  const rawText = fs.readFileSync(filePath, 'utf8');
  if (!rawText.trim()) return null; // empty marker = confirmed-missing game
  const parsed = parseRawGame(rawText);
  if (parsed.moves.length === 0) return null;
  return reconstructGame(gameId, parsed);
}

function run() {
  const inspectId = process.argv[2];

  if (inspectId) {
    const filePath = path.join(RAW_DIR, `${inspectId}.gcg`);
    const enriched = parseOneGameFile(filePath, inspectId);
    if (!enriched) {
      console.log('No moves found (missing/empty game file).');
      return;
    }
    const withNotes = enriched.filter(m => m.note);
    console.log(`Game ${inspectId}: ${enriched.length} moves, ${withNotes.length} with commentary.\n`);
    withNotes.forEach(m => {
      console.log(`Move ${m.moveIndex} (${m.player}) [${m.type}]: word=${m.word} exchanged=${m.exchangedTiles} @ ${m.location || 'n/a'} for ${m.score}`);
      console.log(`  Rack: ${m.rack} | Pool remaining before: ${m.poolRemainingBeforeMove} | Player total after: ${m.playerTotalAfter}`);
      console.log(`  Note: ${m.note}\n`);
    });

    // Optional third arg: dump the board-before grid for one specific move index
    const showBoardFor = process.argv[3];
    if (showBoardFor !== undefined) {
      const target = enriched.find(m => m.moveIndex === parseInt(showBoardFor, 10));
      if (target) {
        console.log(`Board BEFORE move ${showBoardFor}:`);
        target.boardBefore.forEach(row => console.log(row.map(c => (typeof c === 'string' ? c : '.')).join(' ')));
        console.log('Placed tiles:', JSON.stringify(target.placedTiles));
      }
    }
    return;
  }

  const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.gcg'));
  console.log(`Found ${files.length} raw game files. Parsing...`);

  let totalGames = 0;
  let totalExamples = 0;
  const outStream = fs.createWriteStream(OUT_FILE, { flags: 'w' });

  files.forEach((file, idx) => {
    const gameId = path.basename(file, '.gcg');
    const filePath = path.join(RAW_DIR, file);
    let enriched;
    try {
      enriched = parseOneGameFile(filePath, gameId);
    } catch (err) {
      console.error(`Failed to parse game ${gameId}: ${err.message}`);
      return;
    }
    if (!enriched) return;

    totalGames++;
    enriched.filter(m => m.note).forEach(example => {
      outStream.write(JSON.stringify(example) + '\n');
      totalExamples++;
    });

    if (idx % 5000 === 0) {
      console.log(`Processed ${idx}/${files.length} files | games with data: ${totalGames} | examples so far: ${totalExamples}`);
    }
  });

  outStream.end(() => {
    console.log(`\nDone. Games parsed: ${totalGames}. Commented-move examples written: ${totalExamples}.`);
    console.log(`Output: ${OUT_FILE}`);
  });
}

run();
