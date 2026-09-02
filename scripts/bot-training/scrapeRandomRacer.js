/**
 * Downloads player cache pages from randomracer.com (Challenged/Unchallenged
 * Phonies sections, among other stats) - see notes/puzzle-mode-ideas.md in
 * whiffers for why. Scraped with the site owner's permission.
 *
 * Doesn't depend on randomracer's own leaderboard/notable pages for the
 * player list (those are a filtered/ranked subset, confirmed by hand: the
 * leaderboard lists 298 players, but real players outside it - e.g.
 * Kolton_Koehler - still have a working cache page). Instead, the player
 * list comes from our OWN local corpus (scripts/bot-training/raw-games/) -
 * every unique player name that ever appears in an annotated GCG move line,
 * uppercased directly (confirmed: randomracer's cache filenames are just
 * the GCG player name uppercased, underscores AND hyphens preserved as-is -
 * e.g. "Conrad_Bassett-Bouchard" -> CONRAD_BASSETT-BOUCHARD.html, verified
 * against the real site, not assumed). Casual online usernames with no
 * real tournament history (jc, whatnoloan, Betsames, Josh, ...) simply
 * won't have a page - a 404 there is expected and fine, not an error.
 *
 * Usage:
 *   node scripts/bot-training/scrapeRandomRacer.js
 * Output: scripts/bot-training/randomracer-cache/{NAME}.html (only for
 * names that resolve to a real page - misses aren't saved, but an empty
 * marker file IS written for them so a re-run doesn't re-request a
 * confirmed-404 name, same resumability pattern as scrape.js).
 */

const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, 'raw-games');
const OUT_DIR = path.join(__dirname, 'randomracer-cache');
const CONCURRENCY = 4;
const BATCH_DELAY_MS = 200;
const USER_AGENT = 'ScrabbleAppBotTraining/1.0 (hobby project; scraping permission granted directly by site owner)';

// Player names are just the text before the first ':' on any '>' move line -
// full parseMoveLine (extractPhonies.js) isn't needed here, only the name.
function collectPlayerNames() {
  const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.gcg'));
  const names = new Set();
  for (const file of files) {
    const text = fs.readFileSync(path.join(RAW_DIR, file), 'utf8');
    for (const line of text.split('\n')) {
      if (!line.startsWith('>')) continue;
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const name = line.slice(1, colonIdx).trim();
      if (name) names.add(name);
    }
  }
  return Array.from(names);
}

function cacheUrl(name) {
  return `https://randomracer.com/cache/${name.toUpperCase()}.html`;
}

async function fetchPlayer(name) {
  const outPath = path.join(OUT_DIR, `${name.toUpperCase()}.html`);
  if (fs.existsSync(outPath)) {
    return { name, status: 'skipped' };
  }

  try {
    const res = await fetch(cacheUrl(name), { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) {
      fs.writeFileSync(outPath, '', 'utf8'); // empty marker = confirmed no page
      return { name, status: 'missing', code: res.status };
    }
    const text = await res.text();
    fs.writeFileSync(outPath, text, 'utf8');
    return { name, status: 'ok' };
  } catch (err) {
    return { name, status: 'error', error: err.message };
  }
}

async function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('Collecting unique player names from raw-games/...');
  const names = collectPlayerNames();
  console.log(`Found ${names.length} unique player names. Fetching from randomracer.com...`);

  let ok = 0, missing = 0, skipped = 0, errors = 0;
  const erroredNames = [];

  for (let i = 0; i < names.length; i += CONCURRENCY) {
    const batch = names.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(fetchPlayer));
    results.forEach(r => {
      if (r.status === 'ok') ok++;
      else if (r.status === 'missing') missing++;
      else if (r.status === 'skipped') skipped++;
      else { errors++; erroredNames.push(r.name); }
    });

    const done = i + batch.length;
    if (done % 200 < CONCURRENCY) {
      console.log(`Progress: ${done}/${names.length} | ok=${ok} missing=${missing} skipped=${skipped} errors=${errors}`);
    }

    await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
  }

  console.log(`\nDone. ok=${ok} missing=${missing} skipped=${skipped} errors=${errors}`);
  console.log(`Player pages saved to: ${OUT_DIR}`);
  if (erroredNames.length > 0) {
    console.log(`Errored names (network issues, safe to re-run to retry): ${erroredNames.slice(0, 20).join(', ')}${erroredNames.length > 20 ? '...' : ''}`);
  }
}

run();
