/**
 * scanBoard — reads a Scrabble board photo using a free vision AI.
 *
 * Tries providers in order. Set at least ONE of these env vars:
 *
 *   GEMINI_API_KEY      — recommended, most reliable
 *                         Get a FREE key at https://aistudio.google.com/apikey
 *                         (must use AI Studio, NOT Google Cloud Console)
 *                         Free tier: 1,500 requests/day, no billing required.
 *
 *   OPENROUTER_API_KEY  — fallback; free-tier models are sometimes unavailable
 *                         Get a free key at https://openrouter.ai
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

// ── Provider: Gemini (Google AI Studio) ──────────────────────────────────────
async function callGemini(apiKey, mimeType, b64Data) {
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
    {
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data: b64Data } },
          { text: PROMPT },
        ],
      }],
      generationConfig: { temperature: 0, maxOutputTokens: 2048 },
    },
    { headers: { 'content-type': 'application/json' }, timeout: 45000 }
  );
  return res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
}

// ── Provider: OpenRouter ──────────────────────────────────────────────────────
const OPENROUTER_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'qwen/qwen-2-vl-7b-instruct:free',
  'meta-llama/llama-3.2-11b-vision-instruct:free',
];

async function callOpenRouter(apiKey, dataUrl) {
  for (const model of OPENROUTER_MODELS) {
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
      const status = e.response?.status;
      if (status === 404 || status === 429) {
        console.warn(`OpenRouter model ${model} unavailable (${status}), trying next…`);
        continue;
      }
      throw e; // unexpected error — propagate
    }
    const text = res.data?.choices?.[0]?.message?.content?.trim() ?? '';
    if (text) return text;
  }
  throw new Error('All OpenRouter free models are currently unavailable. Try again in a minute.');
}

// ── Handler ───────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const geminiKey     = process.env.GEMINI_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  if (!geminiKey && !openrouterKey) {
    return err(500,
      'No vision API key configured. Set GEMINI_API_KEY (recommended — free from https://aistudio.google.com/apikey) ' +
      'or OPENROUTER_API_KEY in Netlify → Site settings → Environment variables.'
    );
  }

  let image;
  try {
    ({ image } = JSON.parse(event.body || '{}'));
  } catch {
    return err(400, 'Invalid JSON body.');
  }
  if (!image) return err(400, 'No image provided.');

  const match    = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/s);
  const mimeType = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : 'image/jpeg';
  const b64Data  = match ? match[2] : image;
  const dataUrl  = `data:${mimeType};base64,${b64Data}`;

  // Try Gemini first (more reliable free tier), then OpenRouter as fallback
  let rawText = null;
  const errors = [];

  if (geminiKey) {
    try {
      rawText = await callGemini(geminiKey, mimeType, b64Data);
    } catch (e) {
      const detail = e.response?.data || e.message;
      console.error('Gemini failed:', detail);
      errors.push({ provider: 'Gemini', detail });
    }
  }

  if (!rawText && openrouterKey) {
    try {
      rawText = await callOpenRouter(openrouterKey, dataUrl);
    } catch (e) {
      const detail = e.response?.data || e.message;
      console.error('OpenRouter failed:', detail);
      errors.push({ provider: 'OpenRouter', detail });
    }
  }

  if (!rawText) {
    return err(502, 'All vision providers failed.', { errors });
  }

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
  console.log(`scanBoard: detected ${tileCount} tiles`);
  return ok({ board, tileCount });
};
