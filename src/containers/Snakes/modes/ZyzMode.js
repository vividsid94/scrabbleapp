import React, { useEffect, useMemo, useRef, useState } from 'react';
import MobileKeyboardOverlay from '../../../components/MobileKeyboardOverlay';
import { loadSnakesData, loadDeadRackData, alphagram } from '../snakesData';
import { pickDeadRack, estimateRank } from '../deadRacks';
import { initializeDictionary } from '../../../utils/localDictionary';
import { PRESETS, presetMax, presetLabel, shuffle, Protile, WordChip, DeadRacksSetting, TimeLimitSetting, useIsMobile } from '../snakesShared';
import styles from '../Snakes.module.css';

const TIME_LIMIT_MIN = 10;
const TIME_LIMIT_MAX = 60;
const TIME_LIMIT_STEP = 5;

function formatElapsed(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Mode 2 - "Zyz Mode". Exactly Classic mode's one-at-a-time round UI (type
// every word for an alphagram, hint, reveal, continue), but over a single
// list chosen up front (sevens OR eights, like Lith mode's setup) instead
// of always sevens with automatic eight-letter extensions chained in.
export default function ZyzMode({ tileColor }) {
  const inputRef = useRef(null);
  const hookCache = useRef(new Map());

  // On mobile, the guess input is readOnly (see below) so tapping it never
  // summons the native keyboard - this on-screen one replaces it instead.
  const isMobile = useIsMobile();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const [stage, setStage] = useState('loading');
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [listKind, setListKind] = useState('seven');
  const [rangeMin, setRangeMin] = useState('1');
  const [rangeMax, setRangeMax] = useState('1000');
  const [rangeError, setRangeError] = useState('');

  const [deadRacksEnabled, setDeadRacksEnabled] = useState(false);
  const [deadRacksPercent, setDeadRacksPercent] = useState(20);

  const [timeLimitEnabled, setTimeLimitEnabled] = useState(false);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(30);
  const [timeLimitUnit, setTimeLimitUnit] = useState('word');
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [roundKey, setRoundKey] = useState(0);

  const [queue, setQueue] = useState([]); // {alpha, isDead, fakeRank?}[]
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ stemsCompleted: 0, correct: 0, revealed: 0, deadSpotted: 0, mistakes: 0 });

  const [currentAlpha, setCurrentAlpha] = useState('');
  const [currentIsDead, setCurrentIsDead] = useState(false);
  const [roundEntries, setRoundEntries] = useState([]); // [{word, rank}] - a dead round's is [{word: 'DEAD', rank: fakeRank}]
  const [foundWords, setFoundWords] = useState(new Set());
  const [revealedWords, setRevealedWords] = useState(new Set());
  const [guessInput, setGuessInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [hint, setHint] = useState(null); // { word, revealedCount } | null

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Session stopwatch - ticks while a drill is actually in progress, reset
  // fresh each time handleStart runs.
  useEffect(() => {
    if (stage !== 'quiz') return;
    const intervalId = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(intervalId);
  }, [stage]);

  // Kick off the (lazy, ~13MB worst case) dead-rack data load in the
  // background as soon as the toggle goes on, so it's likely already
  // cached by the time "Start drilling" is clicked - handleStart still
  // awaits it itself as a safety net for a same-instant toggle+start.
  const handleToggleDeadRacks = (checked) => {
    setDeadRacksEnabled(checked);
    if (checked) loadDeadRackData().catch(() => {});
  };

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

  const alphaMap = useMemo(() => {
    if (!data) return null;
    return listKind === 'seven' ? data.sevenAlphagramToWords : data.eightAlphagramToWords;
  }, [data, listKind]);

  const currentList = data ? (listKind === 'seven' ? data.sevens : data.eights) : null;

  // A dead round's roundEntries is a single synthetic {word: 'DEAD', rank}
  // entry (see startRound), so this - and roundActive, and hint/reveal
  // below - all work identically for dead and real rounds with no special
  // casing. That's deliberate: special-casing dead rounds out of the
  // regular found/total flow is what made Hint/Reveal need to disappear
  // for them before, which was itself a tell that a round was fake.
  const promptRank = roundEntries.length > 0 ? Math.min(...roundEntries.map((e) => e.rank)) : null;

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

  // Letter-by-letter hint reveal - identical timing/behavior to Classic
  // mode. For a dead round, "DEAD" is the word being hinted at, so this
  // needs no special casing either - it just attributes the stat
  // differently once fully revealed (deadSpotted, not correct).
  useEffect(() => {
    if (!hint) return;
    if (hint.revealedCount >= hint.word.length) {
      if (!foundWords.has(hint.word)) {
        setFoundWords((prev) => new Set(prev).add(hint.word));
        setStats((s) => (currentIsDead ? { ...s, deadSpotted: s.deadSpotted + 1 } : { ...s, correct: s.correct + 1 }));
      }
      setHint(null);
      return;
    }
    const timeoutId = setTimeout(() => {
      setHint((h) => (h ? { ...h, revealedCount: h.revealedCount + 1 } : null));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [hint, foundWords, currentIsDead]);

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

  const startRound = (cell) => {
    // A dead round's "word" is the literal string DEAD - that's what makes
    // it resolve through the exact same found/hint/reveal machinery as a
    // real round instead of needing its own parallel path.
    const entries = cell.isDead ? [{ word: 'DEAD', rank: cell.fakeRank }] : (alphaMap.get(cell.alpha) || []);
    setCurrentAlpha(cell.alpha);
    setCurrentIsDead(cell.isDead);
    setRoundEntries(entries);
    setFoundWords(new Set());
    setRevealedWords(new Set());
    setGuessInput('');
    setFeedback(null);
    setHint(null);
    setRoundKey((k) => k + 1);
  };

  const handleStart = async () => {
    const min = parseInt(rangeMin, 10);
    const max = parseInt(rangeMax, 10);
    const upperBound = currentList.length;
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > upperBound || min > max) {
      setRangeError(`Enter a range between 1 and ${upperBound.toLocaleString()}, min ≤ max.`);
      return;
    }
    setRangeError('');
    const raw = currentList.slice(min - 1, max);
    const distinct = Array.from(new Set(raw.map(alphagram)));
    const shuffled = shuffle(distinct);

    // Falls back to an all-real session (rather than blocking start) if the
    // dead-rack data fails to load - e.g. a flaky network on first fetch.
    let deadPool = null;
    if (deadRacksEnabled) {
      try {
        deadPool = await loadDeadRackData();
      } catch (err) {
        deadPool = null;
      }
    }

    // Dead racks are ADDED on top of the real set, not substituted in for
    // some of it - every real alphagram in the range still gets drilled,
    // so raising the percentage makes the session longer instead of
    // leaving gaps in what got studied.
    const realCells = shuffled.map((alpha) => ({ alpha, isDead: false }));
    let cells = realCells;
    if (deadPool) {
      const targetDeadCount = Math.round(shuffled.length * (deadRacksPercent / 100));
      const usedDead = new Set();
      const deadCells = [];
      for (let i = 0; i < targetDeadCount; i++) {
        const dead = pickDeadRack(listKind, data, deadPool, min, max, usedDead);
        if (!dead) break; // pool exhausted for this range - stop rather than loop forever
        usedDead.add(dead.alpha);
        const rank = estimateRank(listKind, data, deadPool, dead.favorable);
        deadCells.push({ alpha: dead.alpha, isDead: true, fakeRank: rank });
      }
      cells = shuffle([...realCells, ...deadCells]);
    }

    setElapsedSeconds(0);
    setTotalCount(cells.length);
    setStats({ stemsCompleted: 0, correct: 0, revealed: 0, deadSpotted: 0, mistakes: 0 });
    const [first, ...rest] = cells;
    setQueue(rest);
    startRound(first);
    setStage('quiz');
  };

  // overrideGuess lets the on-screen keyboard's skull key submit "DEAD"
  // immediately (see handleOverlayKeyPress) without a stale-state round trip
  // through guessInput - setGuessInput('DEAD') then reading guessInput in
  // the same tick would still see the value from before that update.
  const handleGuessSubmit = (e, overrideGuess) => {
    e.preventDefault();
    const guess = (overrideGuess ?? guessInput).trim().toUpperCase();
    if (!guess) return;

    // Same match-against-roundEntries logic for dead and real rounds - a
    // dead round's roundEntries is just [{word: 'DEAD', ...}] (see
    // startRound), so "guessing right" naturally means typing DEAD there
    // and nothing else. The one extra case: typing DEAD on a REAL round
    // doesn't match anything in ITS roundEntries either, so it already
    // falls through to the generic wrong-guess branch below - this just
    // additionally flags that specific miss (mirrors Lith mode's
    // "double-clicked a real cell" mistake).
    if (foundWords.has(guess)) {
      setFeedback({ type: 'repeat', message: 'Already found that one!' });
    } else if (roundEntries.some((entry) => entry.word === guess)) {
      setFoundWords((prev) => new Set(prev).add(guess));
      setStats((s) => (currentIsDead ? { ...s, deadSpotted: s.deadSpotted + 1 } : { ...s, correct: s.correct + 1 }));
      setFeedback({ type: 'correct', message: 'Correct!' });
    } else {
      if (guess === 'DEAD' && !currentIsDead) {
        setStats((s) => ({ ...s, mistakes: s.mistakes + 1 }));
      }
      setFeedback({ type: 'wrong', message: 'Not a match — try again.' });
    }
    setGuessInput('');
    inputRef.current?.focus();
  };

  // Mirrors what typing on a physical keyboard would do to the same
  // controlled guessInput/handleGuessSubmit pair, since the on-screen
  // keyboard is the only way to type at all once the real input is
  // readOnly on mobile. 'Dead' (the skull key) submits DEAD immediately.
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
    setHint({ word: remaining[0].word, revealedCount: 1 });
  };

  const handleEndQuiz = () => setStage('complete');

  const advanceRound = () => {
    setStats((s) => ({ ...s, stemsCompleted: s.stemsCompleted + 1 }));
    if (queue.length === 0) {
      setStage('complete');
      return;
    }
    const [next, ...rest] = queue;
    setQueue(rest);
    startRound(next);
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

  // DEAD isn't a real word being drilled - showing its dictionary hooks or
  // probability rank alongside it (which WordChip does for every other
  // entry) would be meaningless, so it gets its own plain chip instead.
  const renderEntryChip = (entry, variant) => {
    if (currentIsDead) {
      const chipClass = variant === 'found' ? styles.foundChip : styles.revealedChip;
      return <span key={entry.word} className={chipClass}>💀 {entry.word}</span>;
    }
    return <WordChip key={entry.word} entry={entry} variant={variant} hookCache={hookCache} />;
  };

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
            <div className={styles.sectionLabel}>Word length</div>
            <div className={styles.presetRow} style={{ marginTop: 8 }}>
              <button
                type="button"
                className={styles.presetPill}
                style={listKind === 'seven' ? { background: 'var(--amber)', color: '#fff', borderColor: 'var(--amber)' } : undefined}
                onClick={() => setListKind('seven')}
              >
                Sevens
              </button>
              <button
                type="button"
                className={styles.presetPill}
                style={listKind === 'eight' ? { background: 'var(--amber)', color: '#fff', borderColor: 'var(--amber)' } : undefined}
                onClick={() => setListKind('eight')}
              >
                Eights
              </button>
            </div>
          </div>

          <div>
            <div className={styles.sectionLabel}>Probability range</div>
            <div className={styles.rangeRow} style={{ marginTop: 8 }}>
              <input
                className={styles.rangeInput}
                type="number"
                min={1}
                max={currentList.length}
                value={rangeMin}
                onChange={(e) => setRangeMin(e.target.value)}
                placeholder="1"
              />
              <span className={styles.rangeSeparator}>to</span>
              <input
                className={styles.rangeInput}
                type="number"
                min={1}
                max={currentList.length}
                value={rangeMax}
                onChange={(e) => setRangeMax(e.target.value)}
                placeholder="1000"
              />
            </div>
            <div className={styles.rangeHint} style={{ marginTop: 6 }}>
              1 – {currentList.length.toLocaleString()}, most probable first
            </div>
          </div>

          <DeadRacksSetting
            enabled={deadRacksEnabled}
            percent={deadRacksPercent}
            onToggleChange={handleToggleDeadRacks}
            onPercentChange={setDeadRacksPercent}
            hint="Some rounds will be fakes with no real word. Type DEAD if you think this one is — typing it on a real round counts as a miss."
          />

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
                onClick={() => { setRangeMin(String(p.min)); setRangeMax(String(presetMax(p, currentList.length))); }}
              >
                {presetLabel(p, currentList.length)}
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
            <span>{formatElapsed(elapsedSeconds)}</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${totalCount ? (stats.stemsCompleted / totalCount) * 100 : 0}%` }}
            />
          </div>

          <div className={styles.tileRow}>
            {currentAlpha.split('').map((l, i) => (
              <Protile key={i} letter={l} color={tileColor.current} />
            ))}
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
                currentIsDead ? (
                  <div className={styles.deadHintReveal}>
                    <span
                      className={styles.deadHintSkull}
                      style={{
                        opacity: hint.revealedCount / hint.word.length,
                        transform: `scale(${0.5 + 0.5 * (hint.revealedCount / hint.word.length)})`,
                      }}
                    >
                      💀
                    </span>
                  </div>
                ) : (
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
                )
              )}
              <div className={styles.foundList}>
                {foundEntries.map((entry) => renderEntryChip(entry, 'found'))}
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
                {foundEntries.map((entry) => renderEntryChip(entry, 'found'))}
                {revealedEntries.map((entry) => renderEntryChip(entry, 'revealed'))}
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
            deadKey={deadRacksEnabled}
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
            <div className={styles.statTile}>
              <div className={styles.statValue}>{formatElapsed(elapsedSeconds)}</div>
              <div className={styles.statLabel}>Time</div>
            </div>
            {deadRacksEnabled && (
              <>
                <div className={styles.statTile}>
                  <div className={styles.statValue}>{stats.deadSpotted}</div>
                  <div className={styles.statLabel}>Dead spotted</div>
                </div>
                <div className={styles.statTile}>
                  <div className={styles.statValue}>{stats.mistakes}</div>
                  <div className={styles.statLabel}>Mistakes</div>
                </div>
              </>
            )}
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
