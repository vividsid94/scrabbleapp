/**
 * Downloads annotated GCG games from cross-tables.com for the bot-training
 * pipeline. Separate from src/utils/gcgParser.js on purpose - that parser is
 * for live single-game viewing in Play/Viewer, this is an offline data pull.
 *
 * Scraped with the site owner's explicit permission (given directly to the
 * project owner). Respects a moderate rate limit regardless.
 *
 * Usage:
 *   node scripts/bot-training/scrape.js [startId] [endId]
 *   node scripts/bot-training/scrape.js            # defaults to full 1-61050 range
 */

const fs = require('fs');
const path = require('path');

const START_ID = parseInt(process.argv[2], 10) || 1;
const END_ID = parseInt(process.argv[3], 10) || 61050;
const OUT_DIR = path.join(__dirname, 'raw-games');
const CONCURRENCY = 4;
const BATCH_DELAY_MS = 150;
const USER_AGENT = 'ScrabbleAppBotTraining/1.0 (hobby project; scraping permission granted directly by site owner)';

function gameUrl(gameNum) {
  const bucket = Math.floor(gameNum / 100).toString();
  return `https://www.cross-tables.com/annotated/selfgcg/${bucket}/anno${gameNum}.gcg`;
}

async function fetchGame(gameNum) {
  const outPath = path.join(OUT_DIR, `${gameNum}.gcg`);
  if (fs.existsSync(outPath)) {
    return { gameNum, status: 'skipped' };
  }

  try {
    const res = await fetch(gameUrl(gameNum), { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) {
      // Write an empty marker file so we don't re-request confirmed-missing IDs on resume
      fs.writeFileSync(outPath, '', 'utf8');
      return { gameNum, status: 'missing', code: res.status };
    }
    const text = await res.text();
    fs.writeFileSync(outPath, text, 'utf8');
    return { gameNum, status: 'ok' };
  } catch (err) {
    return { gameNum, status: 'error', error: err.message };
  }
}

async function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const ids = [];
  for (let i = START_ID; i <= END_ID; i++) ids.push(i);

  let ok = 0, missing = 0, skipped = 0, errors = 0;
  const erroredIds = [];

  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(fetchGame));
    results.forEach(r => {
      if (r.status === 'ok') ok++;
      else if (r.status === 'missing') missing++;
      else if (r.status === 'skipped') skipped++;
      else { errors++; erroredIds.push(r.gameNum); }
    });

    const done = i + batch.length;
    if (done % 500 < CONCURRENCY) {
      console.log(`Progress: ${done}/${ids.length} | ok=${ok} missing=${missing} skipped=${skipped} errors=${errors}`);
    }

    await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
  }

  console.log(`\nDone. ok=${ok} missing=${missing} skipped=${skipped} errors=${errors}`);
  if (erroredIds.length > 0) {
    console.log(`Errored IDs (network issues, safe to re-run to retry): ${erroredIds.slice(0, 20).join(', ')}${erroredIds.length > 20 ? '...' : ''}`);
  }
}

run();
