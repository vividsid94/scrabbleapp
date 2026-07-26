import React, { useEffect, useMemo, useRef, useState } from 'react';
import MobileKeyboardOverlay from '../../../components/MobileKeyboardOverlay';
import { loadSnakesData, alphagram } from '../snakesData';
import { initializeDictionary } from '../../../utils/localDictionary';
import { PRESETS, presetMax, presetLabel, shuffle, Protile, WordChip, TimeLimitSetting, useIsMobile } from '../snakesShared';
import styles from '../Snakes.module.css';

const TIME_LIMIT_MIN = 10;
const TIME_LIMIT_MAX = 60;
const TIME_LIMIT_STEP = 5;

// The letters left over in an eight-letter alphagram once a seven's letters
// are removed one-for-one (multiset difference, not a naive character set
// diff, so duplicate letters are handled correctly).
function extraLetters(eightAlpha, sevenAlpha) {
  let remaining = eightAlpha;
  for (const ch of sevenAlpha) {
    const idx = remaining.indexOf(ch);
    if (idx !== -1) remaining = remaining.slice(0, idx) + remaining.slice(idx + 1);
  }
  return remaining;
}

// Mode 3 - the original bingo-stem drill: probability-ranked sevens, type
// every word for each alphagram, then every eight-letter extension.
export default function ClassicMode({ tileColor }) {
  const inputRef = useRef(null);
  const hookCache = useRef(new Map());

  // On mobile, the guess input is readOnly (see below) so tapping it never
  // summons the native keyboard - this on-screen one replaces it instead.
  const isMobile = useIsMobile();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const [stage, setStage] = useState('loading');
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [rangeMin, setRangeMin] = useState('1');
  const [rangeMax, setRangeMax] = useState('1000');
  const [rangeError, setRangeError] = useState('');

  const [timeLimitEnabled, setTimeLimitEnabled] = useState(false);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(30);
  const [timeLimitUnit, setTimeLimitUnit] = useState('word');
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [roundKey, setRoundKey] = useState(0);

  const [queue, setQueue] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ stemsCompleted: 0, correct: 0, revealed: 0 });

  const [roundKind, setRoundKind] = useState('seven');
  const [currentSevenAlpha, setCurrentSevenAlpha] = useState('');
  const [currentEightAlpha, setCurrentEightAlpha] = useState(null);
  const [eightQueue, setEightQueue] = useState([]);
  const [eightProgress, setEightProgress] = useState({ index: 0, total: 0 });
  const [roundEntries, setRoundEntries] = useState([]); // [{word, rank}]
  const [foundWords, setFoundWords] = useState(new Set());
  const [revealedWords, setRevealedWords] = useState(new Set());
  const [guessInput, setGuessInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [hint, setHint] = useState(null); // { word, revealedCount } | null

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadSnakesData(), initializeDictionary()])
      .then(([d]) => {
        if (cancelled) return;
        setData(d);
        setStage('setup');
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.message || 'Failed to load word lists.');
      });
    return () => { cancelled = true; };
  }, []);

  const extraLettersForCurrentEight = useMemo(() => {
    if (roundKind !== 'eight' || !currentEightAlpha) return '';
    return extraLetters(currentEightAlpha, currentSevenAlpha);
  }, [roundKind, currentEightAlpha, currentSevenAlpha]);

  const promptRank = useMemo(() => {
    if (!data) return null;
    const map = roundKind === 'seven' ? data.sevenAlphagramToWords : data.eightAlphagramToWords;
    const alpha = roundKind === 'seven' ? currentSevenAlpha : currentEightAlpha;
    const entries = map.get(alpha);
    if (!entries || entries.length === 0) return null;
    return Math.min(...entries.map((e) => e.rank));
  }, [data, roundKind, currentSevenAlpha, currentEightAlpha]);

  const roundActive = (foundWords.size + revealedWords.size) < roundEntries.length;

  // Kept in sync with the latest render's values on every render (not just
  // inside an effect) so handleReveal can read the CURRENT foundWords /
  // roundEntries even when it's invoked from the time-limit effect's
  // setInterval callback below, which - for a "per alphagram" timer - can
  // live across several renders without itself re-running; reading the
  // closed-over state directly there would use whatever foundWords looked
  // like back when the round started, wrongly re-revealing words the user
  // already found in the meantime.
  const foundWordsRef = useRef(foundWords);
  foundWordsRef.current = foundWords;
  const roundEntriesRef = useRef(roundEntries);
  roundEntriesRef.current = roundEntries;

  // Reveals whatever's left in the round, exactly like the old manual
  // "Reveal remaining" button did - now also the target of both the new
  // per-question Give Up button AND an expired time limit, so both just
  // call this directly instead of pausing and waiting on the user. Reads
  // via the refs above (not the foundWords/roundEntries closed over by this
  // render) so it's correct no matter which of those call sites invokes it.
  const handleReveal = () => {
    const remaining = roundEntriesRef.current.filter((entry) => !foundWordsRef.current.has(entry.word));
    if (remaining.length === 0) return;
    setHint(null); // stop any in-progress hint animation - it'd otherwise double-count this word
    setRevealedWords((prev) => new Set([...prev, ...remaining.map((entry) => entry.word)]));
    setStats((s) => ({ ...s, revealed: s.revealed + remaining.length }));
    setFeedback(null);
  };

  // Time Limit (optional, off by default). "Per alphagram" resets once per
  // round (roundKey alone drives it - wordProgress is forced to a constant
  // so it can't retrigger mid-round); "per word" additionally resets every
  // time a word resolves (found, hinted, or revealed) while the round's
  // still active, giving each remaining word a fresh full duration. When it
  // runs out, the round is just auto-revealed - same as if the user had
  // clicked Give Up themselves - rather than pausing and asking.
  //
  // This is deliberately ONE effect (reset + tick together), not two: a
  // separate reset effect and tick effect both keyed on roundActive/roundKey
  // fire in the same pass when a round changes, and the tick effect would
  // read the stale pre-reset `remainingSeconds` (already at 0 from the
  // round that just ended) and immediately re-trigger. Counting down via a
  // local `remaining` variable inside a single effect - rather than reading
  // `remainingSeconds` state across effects - makes each run self-contained
  // and immune to that race.
  const wordProgress = foundWords.size + revealedWords.size;
  const timeResetTrigger = timeLimitUnit === 'word' ? wordProgress : 0;
  useEffect(() => {
    if (!timeLimitEnabled || stage !== 'quiz' || !roundActive) return;
    let remaining = timeLimitSeconds;
    setRemainingSeconds(remaining);
    const intervalId = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(intervalId);
        setRemainingSeconds(0);
        handleReveal();
      } else {
        setRemainingSeconds(remaining);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLimitEnabled, stage, roundActive, roundKey, timeResetTrigger, timeLimitSeconds]);

  // Letter-by-letter hint reveal. Ticks revealedCount up on a timer; once it
  // reaches the target word's length, counts the word as found (unless the
  // player already guessed it correctly mid-animation, in which case it's
  // already found and this just clears the hint state).
  useEffect(() => {
    if (!hint) return;
    if (hint.revealedCount >= hint.word.length) {
      if (!foundWords.has(hint.word)) {
        setFoundWords((prev) => new Set(prev).add(hint.word));
        setStats((s) => ({ ...s, correct: s.correct + 1 }));
      }
      setHint(null);
      return;
    }
    const timeoutId = setTimeout(() => {
      setHint((h) => (h ? { ...h, revealedCount: h.revealedCount + 1 } : null));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [hint, foundWords]);

  const startSevenRound = (sevenAlpha) => {
    const entries = data.sevenAlphagramToWords.get(sevenAlpha) || [];
    setCurrentSevenAlpha(sevenAlpha);
    setCurrentEightAlpha(null);
    setEightQueue([]);
    setEightProgress({ index: 0, total: 0 });
    setRoundKind('seven');
    setRoundEntries(entries);
    setFoundWords(new Set());
    setRevealedWords(new Set());
    setGuessInput('');
    setFeedback(null);
    setHint(null);
    setRoundKey((k) => k + 1);
  };

  const startEightRound = (eightAlpha) => {
    const entries = data.eightAlphagramToWords.get(eightAlpha) || [];
    setCurrentEightAlpha(eightAlpha);
    setRoundKind('eight');
    setRoundEntries(entries);
    setFoundWords(new Set());
    setRevealedWords(new Set());
    setGuessInput('');
    setFeedback(null);
    setHint(null);
    setRoundKey((k) => k + 1);
  };

  const finishStemAndAdvance = (remainingQueue) => {
    setStats((s) => ({ ...s, stemsCompleted: s.stemsCompleted + 1 }));
    if (remainingQueue.length === 0) {
      setStage('complete');
      return;
    }
    const [next, ...rest] = remainingQueue;
    setQueue(rest);
    startSevenRound(next);
  };

  const handleStart = () => {
    const min = parseInt(rangeMin, 10);
    const max = parseInt(rangeMax, 10);
    const upperBound = data.sevens.length;
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > upperBound || min > max) {
      setRangeError(`Enter a range between 1 and ${upperBound.toLocaleString()}, min ≤ max.`);
      return;
    }
    setRangeError('');
    const raw = data.sevens.slice(min - 1, max);
    const distinct = Array.from(new Set(raw.map(alphagram)));
    const shuffled = shuffle(distinct);
    setTotalCount(shuffled.length);
    setStats({ stemsCompleted: 0, correct: 0, revealed: 0 });
    const [first, ...rest] = shuffled;
    setQueue(rest);
    startSevenRound(first);
    setStage('quiz');
  };

  // overrideGuess lets the on-screen keyboard's skull key submit "DEAD"
  // immediately (see handleOverlayKeyPress) without a stale-state round trip
  // through guessInput.
  const handleGuessSubmit = (e, overrideGuess) => {
    e.preventDefault();
    const guess = (overrideGuess ?? guessInput).trim().toUpperCase();
    if (!guess) return;
    if (foundWords.has(guess)) {
      setFeedback({ type: 'repeat', message: 'Already found that one!' });
    } else if (roundEntries.some((entry) => entry.word === guess)) {
      setFoundWords((prev) => new Set(prev).add(guess));
      setStats((s) => ({ ...s, correct: s.correct + 1 }));
      setFeedback({ type: 'correct', message: 'Correct!' });
    } else {
      setFeedback({ type: 'wrong', message: 'Not a match — try again.' });
    }
    setGuessInput('');
    inputRef.current?.focus();
  };

  // Mirrors what typing on a physical keyboard would do to the same
  // controlled guessInput/handleGuessSubmit pair, since the on-screen
  // keyboard is the only way to type at all once the real input is
  // readOnly on mobile. 'Dead' (the skull key) submits DEAD immediately -
  // Classic has no dead-rack rounds, so it just always misses, same as
  // typing it on the physical keyboard would.
  const handleOverlayKeyPress = (key) => {
    if (key === 'Backspace') {
      setGuessInput((v) => v.slice(0, -1));
    } else if (key === 'Enter') {
      handleGuessSubmit({ preventDefault: () => {} });
    } else if (key === 'Dead') {
      handleGuessSubmit({ preventDefault: () => {} }, 'DEAD');
    } else {
      setGuessInput((v) => v + key);
    }
  };

  const handleHint = () => {
    if (hint) return; // already animating one
    const remaining = roundEntries.filter((entry) => !foundWords.has(entry.word));
    if (remaining.length === 0) return;
    // If there are multiple still-unguessed words, just pick one (the first,
    // which is alphabetically first since roundEntries is sorted that way).
    setHint({ word: remaining[0].word, revealedCount: 1 });
  };

  const handleEndQuiz = () => setStage('complete');

  const advanceRound = () => {
    if (roundKind === 'seven') {
      const eightAlphas = data.sevenAlphagramToEightAlphagrams.get(currentSevenAlpha) || [];
      if (eightAlphas.length > 0) {
        const [next, ...rest] = eightAlphas;
        setEightQueue(rest);
        setEightProgress({ index: 1, total: eightAlphas.length });
        startEightRound(next);
        return;
      }
    } else if (roundKind === 'eight') {
      if (eightQueue.length > 0) {
        const [next, ...rest] = eightQueue;
        setEightQueue(rest);
        setEightProgress((p) => ({ ...p, index: p.index + 1 }));
        startEightRound(next);
        return;
      }
    }
    finishStemAndAdvance(queue);
  };

  const feedbackClass = feedback
    ? feedback.type === 'correct'
      ? styles.feedbackCorrect
      : feedback.type === 'wrong'
        ? styles.feedbackWrong
        : styles.feedbackRepeat
    : null;

  const foundEntries = roundEntries.filter((entry) => foundWords.has(entry.word));
  const revealedEntries = roundEntries.filter((entry) => revealedWords.has(entry.word));

  return (
    <>
      {stage === 'loading' && (
        <div className={styles.loadingCard}>
          {loadError ? `Couldn't load word lists: ${loadError}` : 'Loading word lists…'}
        </div>
      )}

      {stage === 'setup' && data && (
        <div className={styles.card}>
          <div>
            <div className={styles.sectionLabel}>Probability range (sevens)</div>
            <div className={styles.rangeRow} style={{ marginTop: 8 }}>
              <input
                className={styles.rangeInput}
                type="number"
                min={1}
                max={data.sevens.length}
                value={rangeMin}
                onChange={(e) => setRangeMin(e.target.value)}
                placeholder="1"
              />
              <span className={styles.rangeSeparator}>to</span>
              <input
                className={styles.rangeInput}
                type="number"
                min={1}
                max={data.sevens.length}
                value={rangeMax}
                onChange={(e) => setRangeMax(e.target.value)}
                placeholder="1000"
              />
            </div>
            <div className={styles.rangeHint} style={{ marginTop: 6 }}>
              1 – {data.sevens.length.toLocaleString()}, most probable first
            </div>
          </div>

          <TimeLimitSetting
            enabled={timeLimitEnabled}
            onToggleChange={setTimeLimitEnabled}
            seconds={timeLimitSeconds}
            onSecondsChange={setTimeLimitSeconds}
            min={TIME_LIMIT_MIN}
            max={TIME_LIMIT_MAX}
            step={TIME_LIMIT_STEP}
            formatValue={(s) => `${s}s`}
            unit={timeLimitUnit}
            onUnitChange={setTimeLimitUnit}
            hint="Per word: the clock resets every time you find one. Per alphagram: one clock for the whole round. When it runs out, whatever's left is revealed automatically."
          />

          <div className={styles.presetRow}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className={styles.presetPill}
                onClick={() => { setRangeMin(String(p.min)); setRangeMax(String(presetMax(p, data.sevens.length))); }}
              >
                {presetLabel(p, data.sevens.length)}
              </button>
            ))}
          </div>

          {rangeError && <div className={styles.errorText}>{rangeError}</div>}

          <button type="button" className={styles.primaryButton} onClick={handleStart}>
            Start drilling
          </button>
        </div>
      )}

      {stage === 'quiz' && (
        <div className={styles.card}>
          <div className={styles.progressRow}>
            <span>Stem {Math.min(stats.stemsCompleted + 1, totalCount)} / {totalCount}</span>
            {timeLimitEnabled && roundActive && (
              <span style={remainingSeconds != null && remainingSeconds <= 5 ? { color: '#DC2626' } : undefined}>
                {remainingSeconds ?? timeLimitSeconds}s
              </span>
            )}
            <span>
              {roundKind === 'seven'
                ? 'Sevens'
                : `Eights ${eightProgress.index} / ${eightProgress.total}`}
            </span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${totalCount ? (stats.stemsCompleted / totalCount) * 100 : 0}%` }}
            />
          </div>

          <div className={styles.tileRow}>
            {currentSevenAlpha.split('').map((l, i) => (
              <Protile key={`base${i}`} letter={l} color={tileColor.current} />
            ))}
            {roundKind === 'eight' && (
              <>
                <span className={styles.tilePlus}>+</span>
                {extraLettersForCurrentEight.split('').map((l, i) => (
                  <Protile key={`extra${i}`} letter={l} color={tileColor.current} />
                ))}
              </>
            )}
          </div>

          {promptRank !== null && (
            <div className={styles.promptRank}>Prob #{promptRank.toLocaleString()}</div>
          )}

          <div className={styles.answerCount}>
            {foundWords.size + revealedWords.size} / {roundEntries.length} found
          </div>

          {roundActive ? (
            <>
              <form className={styles.guessForm} onSubmit={handleGuessSubmit}>
                <input
                  ref={inputRef}
                  autoFocus
                  className={styles.guessInput}
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  onFocus={() => isMobile && setKeyboardOpen(true)}
                  placeholder="Type a word…"
                  autoComplete="off"
                  autoCapitalize="characters"
                  readOnly={isMobile}
                  inputMode={isMobile ? 'none' : undefined}
                />
              </form>
              {feedback && <div className={feedbackClass}>{feedback.message}</div>}
              {hint && (
                <div className={styles.hintDisplay}>
                  {hint.word.split('').map((ch, i) => (
                    <span
                      key={i}
                      className={i < hint.revealedCount ? styles.hintLetterRevealed : styles.hintLetterBlank}
                    >
                      {i < hint.revealedCount ? ch : ''}
                    </span>
                  ))}
                </div>
              )}
              <div className={styles.foundList}>
                {foundEntries.map((entry) => (
                  <WordChip key={entry.word} entry={entry} variant="found" hookCache={hookCache} />
                ))}
              </div>
              <div className={styles.footerRow}>
                <button type="button" className={styles.secondaryButton} onClick={handleHint} disabled={!!hint}>
                  Hint
                </button>
                <button type="button" className={styles.secondaryButton} onClick={handleReveal} disabled={!!hint}>
                  Give up
                </button>
                <button type="button" className={styles.secondaryButton} onClick={handleEndQuiz}>
                  End Quiz
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.foundList}>
                {foundEntries.map((entry) => (
                  <WordChip key={entry.word} entry={entry} variant="found" hookCache={hookCache} />
                ))}
                {revealedEntries.map((entry) => (
                  <WordChip key={entry.word} entry={entry} variant="revealed" hookCache={hookCache} />
                ))}
              </div>
              <button type="button" className={styles.primaryButton} autoFocus onClick={advanceRound}>
                Continue ▸
              </button>
            </>
          )}

          <MobileKeyboardOverlay
            visible={isMobile && keyboardOpen && roundActive}
            onKeyPress={handleOverlayKeyPress}
            onClose={() => { setKeyboardOpen(false); inputRef.current?.blur(); }}
            deadKey
          />
        </div>
      )}

      {stage === 'complete' && (
        <div className={styles.card}>
          <div className={styles.heading} style={{ fontSize: 20, alignSelf: 'center' }}>Nice work!</div>
          <div className={styles.statsGrid}>
            <div className={styles.statTile}>
              <div className={styles.statValue}>{stats.stemsCompleted}</div>
              <div className={styles.statLabel}>Stems drilled</div>
            </div>
            <div className={styles.statTile}>
              <div className={styles.statValue}>{stats.correct}</div>
              <div className={styles.statLabel}>Solved</div>
            </div>
            <div className={styles.statTile}>
              <div className={styles.statValue}>{stats.revealed}</div>
              <div className={styles.statLabel}>Revealed</div>
            </div>
            <div className={styles.statTile}>
              <div className={styles.statValue}>
                {stats.correct + stats.revealed > 0
                  ? Math.round((stats.correct / (stats.correct + stats.revealed)) * 100)
                  : 0}%
              </div>
              <div className={styles.statLabel}>Accuracy</div>
            </div>
          </div>
          <div className={styles.footerRow}>
            <button type="button" className={styles.secondaryButton} onClick={() => setStage('setup')}>
              New range
            </button>
            <button type="button" className={styles.primaryButton} onClick={handleStart}>
              Drill again
            </button>
          </div>
        </div>
      )}
    </>
  );
}
