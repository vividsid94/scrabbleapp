/**
 * One-off: ask Gemini theoretical Scrabble strategy questions, grounded in a
 * big random sample of the real annotated-game commentary we scraped.
 *
 * Usage: node scripts/bot-training/askTheory.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const DATASET_FILE = path.join(__dirname, 'dataset.jsonl');
const SAMPLE_SIZE = 500;
const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];

const QUESTIONS = [
  `Which play is better in a vacuum (from the same rack)? 50 points keeping QVV or 30 points keeping ERS`,
  `If you're going first and draw DELORTT what would you play?`,
  `I'm going first and I draw IIIIIII, what should I play? What are my approximate winning chances?`
];

function loadDataset() {
  return fs.readFileSync(DATASET_FILE, 'utf8').trim().split('\n').map(l => JSON.parse(l));
}

function sample(arr, n) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function renderExample(r) {
  const move = r.type === 'play'
    ? `Played ${r.word} at ${r.location} for ${r.score} points`
    : r.type === 'exchange'
      ? `Exchanged: ${r.exchangedTiles}`
      : 'Passed';
  return `Rack: ${r.rack} | Pool remaining: ${r.poolRemainingBeforeMove} | ${move}\nReasoning: ${r.note}`;
}

async function callGeminiModel(model, prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Gemini API error (${res.status}) on ${model}: ${JSON.stringify(data)}`);
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGemini(prompt, apiKey) {
  let lastError;
  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`Trying ${model} (attempt ${attempt + 1})...`);
        return await callGeminiModel(model, prompt, apiKey);
      } catch (err) {
        console.error(err.message);
        lastError = err;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  throw lastError;
}

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY in .env');
    process.exit(1);
  }

  const dataset = loadDataset().filter(r => r.note && r.type !== 'endgame_adjustment');
  const sampled = sample(dataset, SAMPLE_SIZE);
  console.log(`Sampled ${sampled.length} annotated examples out of ${dataset.length} eligible.\n`);

  const examplesText = sampled.map(renderExample).join('\n\n');

  const prompt = [
    `Below is a large random sample of real annotated Scrabble games - actual expert players' moves and their own written reasoning at the time. Use this as grounding for how strong players actually think about leaves, risk, and board state (not just theory).`,
    ``,
    `=== SAMPLE OF ${sampled.length} REAL ANNOTATED MOVES ===`,
    examplesText,
    `=== END SAMPLE ===`,
    ``,
    `Now answer these questions, drawing on the patterns of reasoning you see in the sample above where relevant:`,
    ``,
    ...QUESTIONS.map((q, i) => `${i + 1}. ${q}`)
  ].join('\n');

  console.log(`Prompt built (${prompt.length} chars). Calling Gemini...\n`);

  const response = await callGemini(prompt, apiKey);

  console.log('='.repeat(80));
  console.log('GEMINI RESPONSE');
  console.log('='.repeat(80));
  console.log(response);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
