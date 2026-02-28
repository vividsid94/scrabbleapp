/**
 * scanBoard — uses Gemini Flash (free tier) to read a photo of a Scrabble board
 * and return the 15×15 grid of letters.
 *
 * Requires the environment variable GEMINI_API_KEY to be set.
 * Get a free key at: https://aistudio.google.com/apikey
 * Free tier: 1,500 requests/day, no billing required.
 */
const axios = require('axios');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const ok  = (body) => ({ statusCode: 200, headers: CORS, body: JSON.stringify(body) });
const err = (code, msg, extra = {}) => ({
  statusCode: code,
  headers: CORS,
  body: JSON.stringify({ error: msg, ...extra }),
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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return err(500, 'GEMINI_API_KEY is not configured. Add it in Netlify → Site settings → Environment variables.');

  let image;
  try {
    ({ image } = JSON.parse(event.body || '{}'));
  } catch {
    return err(400, 'Invalid JSON body.');
  }
  if (!image) return err(400, 'No image provided.');

  // Strip the data-URL prefix
  const match = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/s);
  const mimeType = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : 'image/jpeg';
  const base64Data = match ? match[2] : image;

  let geminiResponse;
  try {
    geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Data } },
            { text: PROMPT },
          ],
        }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 4096,
        },
      },
      {
        headers: { 'content-type': 'application/json' },
        timeout: 45000,
      }
    );
  } catch (e) {
    const detail = e.response?.data || e.message;
    console.error('Gemini API error:', detail);
    return err(502, 'Gemini API call failed.', { detail });
  }

  const rawText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

  // Extract the JSON array (handles accidental markdown fences)
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error('No JSON array in Gemini response:', rawText.slice(0, 200));
    return err(500, 'Unexpected response — no board array found.', { raw: rawText.slice(0, 300) });
  }

  let board;
  try {
    board = JSON.parse(jsonMatch[0]);
  } catch {
    return err(500, 'Could not parse Gemini response as JSON.', { raw: rawText.slice(0, 300) });
  }

  board = normaliseBoard(board);

  const tileCount = board.flat().filter(Boolean).length;
  console.log(`scanBoard: detected ${tileCount} tiles`);

  return ok({ board, tileCount });
};
