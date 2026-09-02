/**
 * Parses the downloaded randomracer.com player pages
 * (scripts/bot-training/randomracer-cache/*.html, from
 * scrapeRandomRacer.js) into a clean phonies list.
 *
 * Unlike our own GCG-derived extractPhonies.js, this needs no dictionary
 * check and no dot-resolution logic at all - randomracer already did that
 * work. Each phony row carries a `data-alpha` attribute with the FULLY
 * RESOLVED word, no placeholder characters:
 *   <td data-alpha='FUATS'><a href='...annotated.php?u=13131'
 *     target='_blank'>FUA(T)S*</a></td>
 * The parenthesized letter in the display text (T) is the play-through
 * tile GCG would've shown as a dot - data-alpha already has it resolved
 * in, so that's the field this script actually uses. The two phonies
 * tables per player page (id='...Challenged Phonies_statlist_table_id'
 * and '...Unchallenged Phonies_statlist_table_id') are what tag each
 * entry - same challenged/unchallenged split as extractPhonies.js, just
 * sourced from randomracer's own site-side detection instead of ours.
 *
 * Usage:
 *   node scripts/bot-training/parseRandomRacer.js
 * Output: scripts/bot-training/randomracerPhonies.txt, sorted by word
 * length descending, same format as phonies.txt for easy comparison.
 */

const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, 'randomracer-cache');
const OUT_FILE = path.join(__dirname, 'randomracerPhonies.txt');

// Grabs the substring for one of the two phonies tables on a player page -
// from its own <table ... id='...statlist_table_id'> open tag through the
// matching close, non-greedy so it doesn't run into the OTHER table.
function extractTableSection(html, tableId) {
  const startMarker = `id='${tableId}'>`;
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return null;
  const bodyStart = startIdx + startMarker.length;
  const endIdx = html.indexOf('</table>', bodyStart);
  if (endIdx === -1) return null;
  return html.slice(bodyStart, endIdx);
}

// Each phony is one <tr data-download='true' >...</tr> block with 4 <td>s:
// a color-dot cell, the word cell (data-alpha + cross-tables link),
// probability, score.
//
// The color-dot cell is NOT always empty, which is what broke the first
// version of this function: some rows (shared markup with a "Notable
// Bingos" list that mixes phonies and real words) carry a CATEGORY label
// there instead, e.g. data-alpha='Bingo Nine or Above' - a plain "first
// data-alpha in the row" match grabbed that label instead of the real
// word two cells later. Found by hand: every one of those bogus entries
// traced back to a row whose color-dot cell had a non-empty data-alpha,
// confirmed by grep'ing the raw HTML directly (the bogus text didn't
// exist ANYWHERE in the file under the naive extraction, which is what
// gave away that it was a wrong-cell bug, not a data problem).
//
// Fixed by anchoring precisely instead of taking "the first data-alpha":
// the word cell's data-alpha is always immediately followed by an <a
// href='...cross-tables.com/annotated.php...'> link - the color-dot cell
// never has one (it has a <span> instead), category label or not. On top
// of that, only display text ending in '*' counts as an actual phony -
// the "Notable Bingos" row this bug surfaced (CON(T)LINE, no asterisk)
// shares the exact row markup but isn't a phony at all, so the asterisk
// check excludes it (and anything like it) regardless of which table
// section it came from.
const ROW_RE = /<tr data-download='true' >([\s\S]*?)<\/tr>/g;
const WORD_CELL_RE = /data-alpha='([^']*)'><a\s+href='https:\/\/www\.cross-tables\.com\/annotated\.php\?u=(\d+)'\s+target='_blank'>([^<]*)<\/a>/;

function extractRows(tableHtml) {
  if (!tableHtml) return [];
  const rows = [];
  let match;
  ROW_RE.lastIndex = 0;
  while ((match = ROW_RE.exec(tableHtml)) !== null) {
    const rowHtml = match[1];
    const wordMatch = rowHtml.match(WORD_CELL_RE);
    if (!wordMatch) continue;
    const [, word, gameRef, display] = wordMatch;
    if (!display.endsWith('*')) continue; // shares row markup with non-phony "Notable" entries

    const numbers = [...rowHtml.matchAll(/<td style='text-align: center; width: 25%;' >(-?[\d.]+)<\/td>/g)];

    rows.push({
      word: word.toUpperCase(),
      display,
      gameRef,
      probability: numbers[0] ? numbers[0][1] : null,
      score: numbers[1] ? numbers[1][1] : null,
    });
  }
  return rows;
}

function parsePlayerFile(filePath, player) {
  const html = fs.readFileSync(filePath, 'utf8');
  if (!html.trim()) return []; // empty marker = confirmed no page

  const challengedTable = extractTableSection(html, 'Player Lists_Challenged Phonies_statlist_table_id');
  const unchallengedTable = extractTableSection(html, 'Player Lists_Unchallenged Phonies_statlist_table_id');

  const challenged = extractRows(challengedTable).map(r => ({ ...r, player, challenged: true }));
  const unchallenged = extractRows(unchallengedTable).map(r => ({ ...r, player, challenged: false }));
  return [...challenged, ...unchallenged];
}

function formatLine(p) {
  const len = String(p.word.length).padStart(2, ' ');
  const word = p.word.padEnd(15, ' ');
  const prob = String(p.probability ?? '?').padStart(4, ' ');
  const score = String(p.score ?? '?').padStart(4, ' ');
  const tag = p.challenged ? 'challenged  ' : 'unchallenged';
  return `${len}  ${word} prob=${prob} score=${score} ${tag} player=${p.player} display=${p.display} gameRef=${p.gameRef}`;
}

function run() {
  const files = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.html'));
  console.log(`Found ${files.length} cached player pages. Parsing...`);

  const all = [];
  files.forEach((file, idx) => {
    const player = path.basename(file, '.html');
    const filePath = path.join(CACHE_DIR, file);
    all.push(...parsePlayerFile(filePath, player));

    if (idx % 200 === 0) {
      console.log(`Processed ${idx}/${files.length} pages | phonies so far: ${all.length}`);
    }
  });

  all.sort((a, b) => b.word.length - a.word.length);

  const challengedCount = all.filter(p => p.challenged).length;
  fs.writeFileSync(OUT_FILE, all.map(formatLine).join('\n') + '\n');

  console.log(`\nDone. ${all.length} phonies (${challengedCount} challenged, ${all.length - challengedCount} unchallenged) across ${files.length} player pages.`);
  console.log(`Output: ${OUT_FILE}`);
}

run();
