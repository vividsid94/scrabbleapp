/**
 * scanBoard — uses a free vision model via OpenRouter to read a Scrabble board photo.
 *
 * Get a free API key at: https://openrouter.ai  (no billing required)
 * Free models: 200 requests/day, 10 req/min.
 *
 * Set OPENROUTER_API_KEY in:
 *   • local: .env file  →  OPENROUTER_API_KEY=sk-or-v1-...
 *   • production: Netlify → Site settings → Environment variables
 */
const axios = require('axios');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
};

const ok  = (body) => ({ statusCode: 200, headers: CORS, body: JSON.stringify(body) });
const err = (code, msg, extra = {}) => ({
  statusCode: code,
  headers:    CORS,
  body:       JSON.stringify({ error: msg, ...extra }),
});

// Free-tier vision models on OpenRouter — first available one is used.
// All are capable of reading physical text from photos.
const MODELS = [
  'meta-llama/llama-3.2-11b-vision-instruct:free',
  'qwen/qwen-2-vl-7b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
];

const PROMPT = `You are looking at a photograph of a physical Scrabble board (15 columns × 15 rows).

Your task: identify every wooden/plastic letter tile that has been placed on the board and return their positions as a JSON array.

Output format — a JSON array of exactly 15 arrays, each with exactly 15 elements:
  • A capital letter string (e.g. "A", "Q") where a tile is present
  • null where the square is empty

Coordinate system:
  • Row 0 = topmost row,  Row 14 = bottommost row
  • Col 0 = leftmost col, Col 14 = rightmost col

Rules:
  • Only include real letter tiles placed by players. Ignore the board's printed labels (DL, DW, TL, TW, star).
  • If a blank tile has a letter written on it, use that letter.
  • Count rows and columns carefully — the board is always exactly 15×15.

Return ONLY the raw JSON array — no markdown fences, no explanation, nothing else.`;

const normaliseBoard = (board) => {
  while (board.length < 15) board.push(Array(15).fill(null));
  return board.slice(0, 15).map(row => {
    while (row.length < 15) row.push(null);
    return row.slice(0, 15).map(cell =>
      typeof cell === 'string' && /^[A-Za-z]$/.test(cell) ? cell.toUpperCase() : null
    );
  });
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return err(500,
    'OPENROUTER_API_KEY is not configured. ' +
    'Get a free key at https://openrouter.ai and add it to Netlify → Site settings → Environment variables.'
  );

  let image;
  try {
    ({ image } = JSON.parse(event.body || '{}'));
  } catch {
    return err(400, 'Invalid JSON body.');
  }
  if (!image) return err(400, 'No image provided.');

  // Reconstruct the full data-URL so OpenRouter receives it correctly
  const match    = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/s);
  const mimeType = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : 'image/jpeg';
  const b64Data  = match ? match[2] : image;
  const dataUrl  = `data:${mimeType};base64,${b64Data}`;

  // Try each model in order — on rate-limit (429) move on to the next
  let rawText = null;
  let lastError = null;

  for (const model of MODELS) {
    let res;
    try {
      res = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model,
          messages: [{
            role:    'user',
            content: [
              { type: 'image_url', image_url: { url: dataUrl } },
              { type: 'text',      text: PROMPT },
            ],
          }],
          temperature: 0,
          max_tokens:  2048,
        },
        {
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer':  'https://scrabbleapp.netlify.app',
            'X-Title':       'Scrabble Board Scanner',
          },
          timeout: 45000,
        }
      );
    } catch (e) {
      lastError = e.response?.data || e.message;
      const status = e.response?.status;
      // 429 rate-limit → try next model; anything else → bail immediately
      if (status === 429) {
        console.warn(`Model ${model} rate-limited, trying next…`);
        continue;
      }
      console.error('OpenRouter API error:', lastError);
      return err(502, 'Vision API call failed.', { detail: lastError });
    }

    rawText = res.data?.choices?.[0]?.message?.content?.trim() ?? '';
    if (rawText) break; // got a response
  }

  if (!rawText) {
    return err(429, 'All free models are rate-limited right now. Try again in a minute.', { detail: lastError });
  }

  // Extract the JSON array (handles accidental markdown fences)
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error('No JSON array in response:', rawText.slice(0, 200));
    return err(500, 'Unexpected model response — no board array found.', { raw: rawText.slice(0, 300) });
  }

  let board;
  try {
    board = JSON.parse(jsonMatch[0]);
  } catch {
    return err(500, 'Could not parse model response as JSON.', { raw: rawText.slice(0, 300) });
  }

  board = normaliseBoard(board);

  const tileCount = board.flat().filter(Boolean).length;
  console.log(`scanBoard: detected ${tileCount} tiles via OpenRouter`);

  return ok({ board, tileCount });
};
