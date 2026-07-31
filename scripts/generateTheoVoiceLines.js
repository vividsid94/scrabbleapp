/**
 * One-off generator: turns Theo Yell's fixed phrase set into real speech
 * audio via Gemini's TTS API (same GEMINI_API_KEY/endpoint pattern as
 * netlify_functions/topeBot.js), instead of the browser's robotic
 * speechSynthesis. Run once (or whenever the phrase list/voice changes),
 * not per-yell - the output gets committed as static files and played
 * exactly like the other preloaded game sounds.
 *
 * Keep this phrase list in sync with YELL_PHRASES in
 * src/containers/Play/components/TheoYellOverlay.js.
 *
 * Usage: node scripts/generateTheoVoiceLines.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY not set in .env');
  process.exit(1);
}

const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
// "Algenib" reads as gravelly in Gemini's voice list - closest prebuilt
// match to the deep/gruff/authoritative tone the old speechSynthesis
// voice-picker was searching browser voices for.
const VOICE_NAME = 'Algenib';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'sounds', 'theo');

const YELL_PHRASES = [
  'What on earth are you thinking?!',
  'That is absolutely terrible!',
  'No! No! No! What are you doing?!',
  'Are you even trying?!',
  'That move is completely awful!',
  'You should be ashamed of that move!',
  "Come on! You're better than this!",
  "Really?! That's the best you can do?!",
  "That's not just bad, that's embarrassing!",
  'Think! Use your brain!',
  'What in the world was that?!',
];

function pcmToWav(pcmBuffer, sampleRate, numChannels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmBuffer.copy(buffer, 44);

  return buffer;
}

async function generateOnce(phrase) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `Say in a gruff, scolding, exasperated tone, like a disappointed coach: ${phrase}` }],
      }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } },
        },
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const retryDelay = data?.error?.details?.find(d => d['@type']?.includes('RetryInfo'))?.retryDelay;
    const err = new Error(`Gemini TTS error (${res.status}): ${data?.error?.message || JSON.stringify(data)}`);
    err.status = res.status;
    err.retryDelaySeconds = retryDelay ? parseFloat(retryDelay) : null;
    throw err;
  }
  const part = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!part || !part.data) {
    throw new Error(`No audio in response: ${JSON.stringify(data)}`);
  }
  const rateMatch = /rate=(\d+)/.exec(part.mimeType || '');
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
  return pcmToWav(Buffer.from(part.data, 'base64'), sampleRate);
}

// Free tier caps this model at 3 requests/minute - retry on 429 honoring
// the server's own suggested retryDelay (plus a small buffer) instead of
// guessing a fixed backoff.
async function generateOne(phrase, outPath, maxRetries = 4) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const wav = await generateOnce(phrase);
      fs.writeFileSync(outPath, wav);
      return;
    } catch (err) {
      if (err.status === 429 && attempt < maxRetries) {
        const waitSeconds = (err.retryDelaySeconds || 20) + 2;
        process.stdout.write(`rate-limited, waiting ${waitSeconds.toFixed(0)}s... `);
        await new Promise(r => setTimeout(r, waitSeconds * 1000));
        continue;
      }
      throw err;
    }
  }
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const jobs = YELL_PHRASES.map((phrase, i) => ({
    phrase,
    out: path.join(OUTPUT_DIR, `yell-${i + 1}.wav`),
  }));

  let failures = 0;
  for (const { phrase, out } of jobs) {
    if (fs.existsSync(out)) {
      console.log(`Skipping "${phrase}" - already generated`);
      continue;
    }
    process.stdout.write(`Generating "${phrase}"... `);
    try {
      await generateOne(phrase, out);
      console.log('done');
    } catch (err) {
      failures++;
      console.log('FAILED:', err.message);
    }
    // 3 requests/minute on the free tier - 21s keeps us safely under that
    // even without hitting the retry path.
    await new Promise(r => setTimeout(r, 21000));
  }

  console.log(`\nDone: ${jobs.length - failures}/${jobs.length} succeeded. Files in ${OUTPUT_DIR}`);
  if (failures > 0) process.exitCode = 1;
}

main();
