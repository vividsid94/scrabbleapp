import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useGameStore } from '../../../stores/gameStore';
import { markBlanksLowercase } from '../../../functions/play/boardApiUtils';
import ShakeableMascot from '../../../components/AppContent/ShakeableMascot';

/**
 * Full rewrite of the old scattered Theo Yell implementation (previously
 * split across theoYellFunctions.js, a Play.js useEffect with two chained
 * setTimeouts, and ~250 lines of inline JSX with six overlapping full-screen
 * animations). Three bugs drove the rewrite:
 *
 * 1. Score-mode fired 600ms+ late: a setTimeout(500) left over from the old
 *    MoveCoach pipeline (which needed it for network fetches that no longer
 *    exist), chained into another setTimeout(100) here that was working
 *    around a ref-not-mounted-yet race, chained into the Web Speech API's
 *    own unpredictable voice-loading delay. All three are fixed below:
 *    the store-side check is now synchronous, voices are pre-warmed on
 *    mount instead of at yell-time, and the shake is sequenced via a
 *    separate effect keyed on isYelling (guaranteed to run after the
 *    mascot actually mounts) instead of a guessed delay.
 * 2. Bingo-miss never fired: it read the shared "Ask Theo" topMoves, which
 *    is empty unless the player manually opened that panel. Fixed via its
 *    own isolated background check (theoYellBingoAvailable in the store)
 *    that runs once per turn, independent of the Ask Theo UI.
 * 3. The visual effect stacked six simultaneous full-screen animations
 *    (a backdrop-filter blur flash, three pulsing rings, a radial screen
 *    flash, and two separate shake animations on nested containers holding
 *    the entire board) - expensive to paint. Replaced with two layers,
 *    opacity/transform only, no backdrop-filter and no board shake.
 */

// Trimmed to the 11 phrases that actually have a generated voice line
// (scripts/generateTheoVoiceLines.js hit Gemini TTS's free-tier daily quota
// partway through the full 20+1 set) - keep this in sync with that script
// and with public/sounds/theo/yell-*.wav.
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
const YELL_DURATION_MS = 2200;

// Real recorded lines (scripts/generateTheoVoiceLines.js, Gemini TTS,
// pre-generated once - not called live) - index-matched to YELL_PHRASES so
// the spoken line always matches the phrase shown in the bubble. Preloaded
// at module load, same pattern as soundFunctions.js's SimpleSoundPlayer.
const YELL_AUDIO = YELL_PHRASES.map((_, i) => {
  const audio = new Audio(`/sounds/theo/yell-${i + 1}.wav`);
  audio.volume = 0.85;
  audio.preload = 'auto';
  audio.load();
  return audio;
});

// Module-level (not component state) so the voice list is only ever
// filtered once per page load, not recomputed on every yell.
let cachedVoice = null;
let voicesPrewarmed = false;

function pickScoldingVoice(voices) {
  const byName = (...needles) => voices.find(v => {
    const name = v.name.toLowerCase();
    return needles.some(n => name.includes(n));
  });
  return (
    byName('deep', 'low', 'baritone', 'bass', 'gravel', 'gruff') ||
    byName('david', 'mark', 'paul', 'james', 'thomas', 'richard', 'william', 'george', 'daniel', 'michael') ||
    voices.find(v => {
      const name = v.name.toLowerCase();
      return (name.includes('google') || name.includes('microsoft')) &&
        (name.includes('male') || name.includes('en-us') || name.includes('en-gb')) &&
        !name.includes('female');
    }) ||
    voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('female')) ||
    voices.find(v => v.lang.startsWith('en')) ||
    voices[0] ||
    null
  );
}

function prewarmVoices() {
  if (voicesPrewarmed || !('speechSynthesis' in window)) return;
  const tryPick = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      cachedVoice = pickScoldingVoice(voices);
      voicesPrewarmed = true;
    }
  };
  tryPick();
  if (!voicesPrewarmed) {
    window.speechSynthesis.onvoiceschanged = tryPick;
  }
}

function speakPhrase(phrase) {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(
    phrase.replace(/!!/g, '! ... ').replace(/\?!/g, '? ... ').replace(/!$/g, '! ... ')
  );
  utterance.volume = 1.0;
  utterance.rate = 0.75;
  utterance.pitch = 0.65;
  if (cachedVoice) utterance.voice = cachedVoice;
  try {
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    // Not critical - the visual layer still lands even if speech fails.
  }
}

// Plays the pre-generated recorded line for this phrase; falls back to
// live speechSynthesis only if that specific file is missing/fails to
// play (e.g. it wasn't successfully generated).
function playVoiceLine(audio, phrase) {
  try {
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => speakPhrase(phrase));
    }
  } catch (e) {
    speakPhrase(phrase);
  }
}

export default function TheoYellOverlay() {
  const shouldTheoYell = useGameStore(s => s.shouldTheoYell);
  const theoYellEnabled = useGameStore(s => s.theoYellEnabled);
  const theoYellCriteria = useGameStore(s => s.theoYellCriteria);
  const theoYellPhrase = useGameStore(s => s.theoYellPhrase);
  const setShouldTheoYell = useGameStore(s => s.setShouldTheoYell);
  const setTheoYellPhrase = useGameStore(s => s.setTheoYellPhrase);
  const setTheoYellBingoAvailable = useGameStore(s => s.setTheoYellBingoAvailable);
  const currentPlayer = useGameStore(s => s.currentPlayer);
  const gameStarted = useGameStore(s => s.gameStarted);
  const gameEnded = useGameStore(s => s.gameEnded);

  const [isYelling, setIsYelling] = useState(false);
  const mascotRef = useRef();
  const hideTimeoutRef = useRef(null);

  // Pre-warm the TTS voice list as early as possible, so the first yell of
  // the session doesn't have to wait on speechSynthesis.onvoiceschanged.
  useEffect(() => {
    prewarmVoices();
  }, []);

  // Background bingo-availability check, once per turn - keeps the actual
  // submit-time check in wordSubmitFunctions.js synchronous and
  // independent of whether the player ever opened "Ask Theo". Writes to
  // its own store field, not the shared topMoves, so it never leaks into
  // the Ask Theo panel.
  useEffect(() => {
    // Player 1 only - Theo Yell scolds the human, so there's no reason to
    // spend a call checking bingo-availability on the bot's own turn.
    if (!gameStarted || gameEnded || !theoYellEnabled || theoYellCriteria !== 'bingo' || currentPlayer !== 1) {
      return;
    }
    let cancelled = false;
    setTheoYellBingoAvailable(false);

    const { player1Rack, boardCoords, blankTiles, pool, premiumSquares } = useGameStore.getState();
    const rack = player1Rack;
    const requestBody = {
      board: markBlanksLowercase(boardCoords, blankTiles),
      letters: rack.map(t => (t === '?' ? '*' : t)),
      pool: pool.length,
    };
    if (premiumSquares && premiumSquares.length > 0) {
      requestBody.premiumSquares = premiumSquares;
    }

    // Netlify's getTopMoves returns { message: "Loading dictionary..." }
    // instead of moves on a cold start (same as the "Ask Theo" fetch in
    // gameStore.js) - without this retry, a bingo check that happens to
    // land during that warm-up window would silently give up for the
    // whole turn instead of trying again once the dictionary is ready.
    const runCheck = (attempt = 0) => {
      fetch('/.netlify/functions/getTopMoves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (cancelled) return;
          if (data && data.message && data.message.includes('Loading dictionary') && attempt < 5) {
            setTimeout(() => runCheck(attempt + 1), 1000);
            return;
          }
          if (!data || !data.moves) return;
          const hasBingo = data.moves.some(
            move => move.tiles && move.tiles.filter(t => t.isNew !== false).length === 7
          );
          setTheoYellBingoAvailable(hasBingo);
        })
        .catch(() => {
          // Best-effort background check - silent on failure.
        });
    };
    runCheck();

    return () => {
      cancelled = true;
    };
  }, [currentPlayer, gameStarted, gameEnded, theoYellEnabled, theoYellCriteria, setTheoYellBingoAvailable]);

  // Fire the yell - immediately, no artificial delay.
  useEffect(() => {
    if (!shouldTheoYell || !theoYellEnabled) return;

    setShouldTheoYell(false); // Consume the trigger right away.

    // Bingo-miss no longer gets its own line - it just cycles the same
    // generic criticisms (with real voice) as every other yell.
    const index = Math.floor(Math.random() * YELL_PHRASES.length);
    const phrase = YELL_PHRASES[index];
    const audio = YELL_AUDIO[index];
    setTheoYellPhrase(phrase);
    setIsYelling(true);
    playVoiceLine(audio, phrase);

    clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setIsYelling(false);
      setTheoYellPhrase('');
    }, YELL_DURATION_MS);
  }, [shouldTheoYell, theoYellEnabled, setShouldTheoYell, setTheoYellPhrase]);

  // Shake once the mascot has actually mounted (isYelling just flipped
  // true) - React guarantees this effect runs after that DOM commit, no
  // guessed setTimeout needed.
  useEffect(() => {
    if (isYelling) {
      mascotRef.current?.shake();
    }
  }, [isYelling]);

  useEffect(() => () => clearTimeout(hideTimeoutRef.current), []);

  if (!isYelling) return null;

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1400,
          pointerEvents: 'none',
          backgroundColor: 'rgba(239, 68, 68, 0.35)',
          animation: 'theoRedTint 1.3s ease-out',
          '@keyframes theoRedTint': {
            '0%': { opacity: 0 },
            '15%': { opacity: 1 },
            '100%': { opacity: 0 },
          },
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          zIndex: 1500,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          animation: 'theoPop 1.3s ease-out',
          '@keyframes theoPop': {
            '0%': { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 },
            '15%': { transform: 'translate(-50%, -50%) scale(1.05)', opacity: 1 },
            '25%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            '80%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            '100%': { transform: 'translate(-50%, -50%) scale(0.9)', opacity: 0 },
          },
        }}
      >
        <ShakeableMascot
          ref={mascotRef}
          src="/images/compressed/theomascot-compressed.png"
          width={180}
          alt="Theo yelling"
        />
        {theoYellPhrase && (
          <Box
            sx={{
              backgroundColor: 'rgba(239, 68, 68, 0.95)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 700,
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              maxWidth: '300px',
            }}
          >
            {theoYellPhrase}
          </Box>
        )}
      </Box>
    </>
  );
}
