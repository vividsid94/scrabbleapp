/**
 * scanBoard — proxies to scrabblecam.com/process (free, no API key needed).
 * Receives a base64 image from the client, uploads it as multipart/form-data,
 * and returns a normalised 15×15 board array.
 */
const axios    = require('axios');
const FormData = require('form-data');

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

// Board string format from scrabblecam:
//   "cell,cell,...|cell,cell,..." — 15 rows separated by |, 15 cells per row.
// Empty cell = empty string. Blank tile used as a letter may come as just "?"
// or the letter itself. We normalise to a 15×15 array of letter | null.
function parseBoard(boardStr) {
  if (!boardStr) return Array(15).fill(null).map(() => Array(15).fill(null));
  const rows = boardStr.split('|').slice(0, 15);
  while (rows.length < 15) rows.push('');
  return rows.map(rowStr => {
    const cells = rowStr.split(',').slice(0, 15);
    while (cells.length < 15) cells.push('');
    return cells.map(cell => {
      if (!cell) return null;
      if (cell === '?') return '?';                          // blank tile
      const letter = cell.replace('?', '').toUpperCase();
      return /^[A-Z]$/.test(letter) ? letter : null;
    });
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  let image;
  try {
    ({ image } = JSON.parse(event.body || '{}'));
  } catch {
    return err(400, 'Invalid JSON body.');
  }
  if (!image) return err(400, 'No image provided.');

  // Extract mime-type and raw base64 from the data-URL
  const match    = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/s);
  const mimeType = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : 'image/jpeg';
  const b64Data  = match ? match[2] : image;

  const imageBuffer = Buffer.from(b64Data, 'base64');

  const form = new FormData();
  form.append('file', imageBuffer, { filename: 'board.jpg', contentType: mimeType });

  let scrabblecamRes;
  try {
    scrabblecamRes = await axios.post('https://scrabblecam.com/process', form, {
      headers: { ...form.getHeaders() },
      timeout: 30000,
    });
  } catch (e) {
    const detail = e.response?.data || e.message;
    console.error('scrabblecam error:', detail);
    return err(502, 'scrabblecam.com request failed.', { detail });
  }

  const { status, board: boardStr, message } = scrabblecamRes.data;
  if (status !== 'OK') {
    return err(500, `scrabblecam returned an error: ${message || 'unknown'}`);
  }

  const board     = parseBoard(boardStr);
  const tileCount = board.flat().filter(Boolean).length;
  return ok({ board, tileCount });
};
