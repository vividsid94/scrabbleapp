import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Cell from '../../components/AppContent/Board/Cell.js';
import { ThemeContext } from '../../App';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
import { loadSnakesData, alphagram } from './snakesData';
import { initializeDictionary, getHooksLocal } from '../../utils/localDictionary';
import styles from './Snakes.module.css';

const PRESETS = [
  { label: 'High Probability', min: 1, max: 1000 },
  { label: 'Midrange', min: 1000, max: 6000 },
  { label: 'Low Probability', min: 6000, max: 15000 },
  { label: 'Rare', min: 15000, max: 25000 },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

// A single protile - reuses the app's real tile art (Cell.js) and the
// user's chosen tile color, scaled up from its native 30px board/rack size.
function Protile({ letter, color }) {
  return (
    <div className={styles.protileBox}>
      <div className={styles.protileInner}>
        <Cell type="rack" bonus={{ value: letter }} color={color} />
      </div>
    </div>
  );
}

// A found/revealed word chip: hooks (front + back) flanking the word, plus
// its probability rank, all pulled from the local dictionary + word lists.
function WordChip({ entry, variant, hookCache }) {
  const { word, rank } = entry;
  let hooks = hookCache.current.get(word);
  if (hooks === undefined) {
    hooks = getHooksLocal(word) || { front: [], back: [] };
    hookCache.current.set(word, hooks);
  }
  const chipClass = variant === 'found' ? styles.foundChip : styles.revealedChip;
  return (
    <span className={chipClass}>
      {hooks.front.length > 0 && <span className={styles.chipHook}>{hooks.front.join('')}</span>}
      <span className={styles.chipWord}>{word}</span>
      {hooks.back.length > 0 && <span className={styles.chipHook}>{hooks.back.join('')}</span>}
      <span className={styles.chipRank}>#{rank.toLocaleString()}</span>
    </span>
  );
}

export default function Snakes() {
  const { lightMode } = useContext(ThemeContext);
  const tileColor = useColorSchemeStore((state) => state.color);
  const inputRef = useRef(null);
  const hookCache = useRef(new Map());

  const [stage, setStage] = useState('loading');
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [rangeMin, setRangeMin] = useState('1');
  const [rangeMax, setRangeMax] = useState('100');
  const [rangeError, setRangeError] = useState('');

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
    // If there are multiple still-unguessed words, just pick one (the first,
    // which is alphabetically first since roundEntries is sorted that way).
    setHint({ word: remaining[0].word, revealedCount: 1 });
  };

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
    <div className={styles.page}>
      <Sidenav />
      <div className={styles.main} data-theme={lightMode}>
        <div className={styles.header}>
          <div className={styles.heading}>Snakes</div>
          <div className={styles.subheading}>
            Bingo-stem drilling: type every word for each alphagram, then every eight-letter extension.
          </div>
        </div>

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
                  placeholder="100"
                />
              </div>
              <div className={styles.rangeHint} style={{ marginTop: 6 }}>
                1 – {data.sevens.length.toLocaleString()}, most probable first
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

            <div className={styles.roundKind}>
              {roundKind === 'seven' ? 'Find every word for this alphagram' : 'Find every bingo this makes'}
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
      </div>
    </div>
  );
}
