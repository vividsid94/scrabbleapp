import React, { useEffect, useMemo, useRef, useState } from 'react';
import { loadSnakesData, alphagram } from '../snakesData';
import { initializeDictionary } from '../../../utils/localDictionary';
import { PRESETS, shuffle, Protile, WordChip } from '../snakesShared';
import styles from '../Snakes.module.css';

// Mode 2 - "Zyz Mode". Exactly Classic mode's one-at-a-time round UI (type
// every word for an alphagram, hint, reveal, continue), but over a single
// list chosen up front (sevens OR eights, like Lith mode's setup) instead
// of always sevens with automatic eight-letter extensions chained in.
export default function ZyzMode({ tileColor }) {
  const inputRef = useRef(null);
  const hookCache = useRef(new Map());

  const [stage, setStage] = useState('loading');
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [listKind, setListKind] = useState('seven');
  const [rangeMin, setRangeMin] = useState('1');
  const [rangeMax, setRangeMax] = useState('100');
  const [rangeError, setRangeError] = useState('');

  const [queue, setQueue] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ stemsCompleted: 0, correct: 0, revealed: 0 });

  const [currentAlpha, setCurrentAlpha] = useState('');
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

  const alphaMap = useMemo(() => {
    if (!data) return null;
    return listKind === 'seven' ? data.sevenAlphagramToWords : data.eightAlphagramToWords;
  }, [data, listKind]);

  const currentList = data ? (listKind === 'seven' ? data.sevens : data.eights) : null;

  const promptRank = useMemo(() => {
    if (!alphaMap || !currentAlpha) return null;
    const entries = alphaMap.get(currentAlpha);
    if (!entries || entries.length === 0) return null;
    return Math.min(...entries.map((e) => e.rank));
  }, [alphaMap, currentAlpha]);

  const roundActive = (foundWords.size + revealedWords.size) < roundEntries.length;

  // Letter-by-letter hint reveal - identical timing/behavior to Classic mode.
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

  const startRound = (alpha) => {
    const entries = alphaMap.get(alpha) || [];
    setCurrentAlpha(alpha);
    setRoundEntries(entries);
    setFoundWords(new Set());
    setRevealedWords(new Set());
    setGuessInput('');
    setFeedback(null);
    setHint(null);
  };

  const handleStart = () => {
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
    setTotalCount(shuffled.length);
    setStats({ stemsCompleted: 0, correct: 0, revealed: 0 });
    const [first, ...rest] = shuffled;
    setQueue(rest);
    startRound(first);
    setStage('quiz');
  };

  const handleGuessSubmit = (e) => {
    e.preventDefault();
    const guess = guessInput.trim().toUpperCase();
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

  const handleReveal = () => {
    const remaining = roundEntries.filter((entry) => !foundWords.has(entry.word));
    setRevealedWords(new Set(remaining.map((entry) => entry.word)));
    setStats((s) => ({ ...s, revealed: s.revealed + remaining.length }));
    setFeedback(null);
  };

  const handleHint = () => {
    if (hint) return; // already animating one
    const remaining = roundEntries.filter((entry) => !foundWords.has(entry.word));
    if (remaining.length === 0) return;
    setHint({ word: remaining[0].word, revealedCount: 1 });
  };

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
                placeholder="100"
              />
            </div>
            <div className={styles.rangeHint} style={{ marginTop: 6 }}>
              1 – {currentList.length.toLocaleString()}, most probable first
            </div>
          </div>

          <div className={styles.presetRow}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className={styles.presetPill}
                onClick={() => { setRangeMin(String(p.min)); setRangeMax(String(p.max)); }}
              >
                {p.label}
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
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${totalCount ? (stats.stemsCompleted / totalCount) * 100 : 0}%` }}
            />
          </div>

          <div className={styles.roundKind}>Find every word for this alphagram</div>

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
                  placeholder="Type a word…"
                  autoComplete="off"
                  autoCapitalize="characters"
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
                  Reveal remaining
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
