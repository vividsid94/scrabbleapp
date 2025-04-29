const { normalizeBoard } = require('./normalizeBoard');
const { findAnchors } = require('./findAnchors');
const { loadDictionary } = require('./loadDictionary');
const { generateMoves, validateMove } = require('./generateMoves');

// Cache the dictionary in memory
let cachedTrie = null;

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (!event.body) {
      throw new Error('No request body provided');
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (e) {
      throw new Error('Invalid JSON in request body');
    }

    const { board: rawBoard, letters } = parsedBody;
    
    if (!rawBoard || !letters) {
      throw new Error('Missing required fields: board and letters');
    }

    if (!Array.isArray(rawBoard) || rawBoard.length !== 15) {
      throw new Error('Invalid board: must be a 15x15 array');
    }

    if (!Array.isArray(letters) || letters.length > 7) {
      throw new Error('Invalid letters: must be an array of up to 7 letters');
    }

    console.log('🧠 Bot received letters:', letters);
    //console.log('🧠 Bot received board:', JSON.stringify(rawBoard));

    const board = normalizeBoard(rawBoard);
    //console.log('🧠 Normalized board:', JSON.stringify(board));

    // Load dictionary if not already cached
    if (!cachedTrie) {
      console.log('🧠 Loading dictionary...');
      cachedTrie = await loadDictionary();
      console.log('🧠 Dictionary loaded and cached');
    }

    const anchors = findAnchors(board);
    console.log('🧠 Found anchors:', anchors);

    const allMoves = generateMoves(board, letters, anchors, cachedTrie);
    console.log('🧠 Generated moves:', allMoves.length);

    if (!Array.isArray(allMoves)) {
      throw new Error('generateMoves did not return an array');
    }

    const sortedMoves = allMoves.sort((a, b) => b.score - a.score);

    // ✅ Validate each move (connection + cross-words)
    const validMoves = [];
    for (const move of sortedMoves) {
      if (!move || !move.tiles) {
        console.warn('Invalid move object:', move);
        continue;
      }
      if (validateMove(board, move.tiles, cachedTrie)) {
        validMoves.push(move);
      }
    }

    // 🔍 Show top 10 moves
    console.log(`\n🏆 TOP 10 MOVES:`);
    sortedMoves.slice(0, 10).forEach((move, i) => {
      if (!move || !move.word || !move.score || !move.tiles) {
        console.warn('Invalid move in top 10:', move);
        return;
      }
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
    if (!best || !best.word || !best.score || !best.tiles) {
      throw new Error('Invalid best move object');
    }

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
    console.error('❌ Error stack:', err.stack);
    console.error('❌ Request body:', event.body);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: err.message, 
        stack: err.stack,
        input: event.body 
      })
    };
  }
};
