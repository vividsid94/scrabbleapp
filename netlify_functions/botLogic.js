const { normalizeBoard } = require('./normalizeBoard');
const { findAnchors } = require('./findAnchors');
const { loadDictionary } = require('./loadDictionary');
const { generateMoves } = require('./generateMoves');
const { validateMove } = require('./validateMove');
const { scoreTilesWithBoard } = require('./scoringLogic');

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { board: rawBoard, letters } = JSON.parse(event.body);
    console.log('🧠 Bot received letters:', letters);

    const board = normalizeBoard(rawBoard);
    const trie = await loadDictionary();
    const anchors = findAnchors(board);
    const allMoves = generateMoves(board, letters, anchors, trie);

    const sortedMoves = allMoves.sort((a, b) => b.score - a.score);

    // ✅ Validate each move (connection + cross-words)
    const validMoves = [];
    for (const move of sortedMoves) {
      const result = validateMove(board, move, trie);
      if (result.valid) {
        validMoves.push(move);
      } else {
        console.log(`❌ Rejected move '${move.word}' — ${result.reason}`);
      }
    }

        // 🔍 Show top 10 moves
        console.log(`\n🏆 TOP 10 MOVES (pre-validation):`);
        sortedMoves.slice(0, 10).forEach((move, i) => {
          const word = move.word;
          const score = move.score;
          const placement = move.tiles.map(t => `(${t.row},${t.col})`).join(' ');
          console.log(`${i + 1}. ${word} — ${score} pts @ ${placement}`);
        });

    if (validMoves.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No valid move found' })
      };
    }

    const best = validMoves[0];
    console.log(`\n🎯 Best move selected: '${best.word}' — ${best.score} pts`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        word: best.word,
        score: best.score,
        tiles: best.tiles
      })
    };

  } catch (err) {
    console.error('❌ Bot error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message, stack: err.stack })
    };
  }
};
