import React, { useEffect, useMemo, useRef, useState } from 'react';
import { loadSnakesData, loadDeadRackData, alphagram } from '../snakesData';
import { pickDeadRack } from '../deadRacks';
import { initializeDictionary } from '../../../utils/localDictionary';
import { PRESETS, shuffle, Protile, badgeColorForCount, DeadRacksSetting } from '../snakesShared';
import styles from '../Snakes.module.css';

const PAGE_SIZE = 50;
const MAX_TILE_SIZE = 19;
const MIN_TILE_SIZE = 12;
const GRID_GAP = 10;
// Per-cell width used by everything except the letter tiles themselves:
// the badge, the badge<->tiles gap, the cell's own left/right padding, and
// the small gaps between tiles (one less than the letter count).
const CELL_OVERHEAD = 50;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Picks the most columns (up to 5) whose resulting column width can still
// fit every tile of a word at a legible size - never a fixed column count,
// since a fixed count can't promise every tile stays visible at every
// window width. Falls back to fewer columns (down to 1) rather than ever
// shrinking tiles below MIN_TILE_SIZE.
function computeGridLayout(containerWidth, maxLetters) {
  if (!containerWidth) return { columns: 1, tileSize: MAX_TILE_SIZE };
  for (let columns = 5; columns >= 1; columns--) {
    const columnWidth = (containerWidth - (columns - 1) * GRID_GAP) / columns;
    const tileSize = Math.floor((columnWidth - CELL_OVERHEAD) / maxLetters);
    if (tileSize >= MIN_TILE_SIZE || columns === 1) {
      return { columns, tileSize: Math.max(MIN_TILE_SIZE, Math.min(tileSize, MAX_TILE_SIZE)) };
    }
  }
  return { columns: 1, tileSize: MIN_TILE_SIZE };
}

// Mode 1 - "Lith Mode". Same probability-range setup as the classic drill,
// but over a single list (sevens OR eights, no seven->eight chaining), and
// presented as pages of 50 alphagram puzzles at a time (5 columns x 10).
// There's no per-puzzle round - one textbox below the whole grid takes any
// word belonging to any still-unsolved alphagram on the CURRENT page; a
// correct guess knocks that alphagram's remaining-solutions badge down by
// one, and crosses it off once every solution for it has been found. The
// next page unlocks once every alphagram on the current one is solved.
export default function LithMode({ tileColor }) {
  const inputRef = useRef(null);
  const gridContainerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const [stage, setStage] = useState('loading');
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [listKind, setListKind] = useState('seven');
  const [rangeMin, setRangeMin] = useState('1');
  const [rangeMax, setRangeMax] = useState('100');
  const [rangeError, setRangeError] = useState('');

  const [deadRacksEnabled, setDeadRacksEnabled] = useState(false);
  const [deadRacksPercent, setDeadRacksPercent] = useState(20);

  const [pages, setPages] = useState([]); // {alpha, isDead, fakeCount?}[][]
  const [pageIndex, setPageIndex] = useState(0);
  const [foundWords, setFoundWords] = useState(new Set());
  const [eliminatedDead, setEliminatedDead] = useState(new Set());
  const [stats, setStats] = useState({ solved: 0, correct: 0, deadSpotted: 0, mistakes: 0 });

  const [guessInput, setGuessInput] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Kick off the (lazy, ~13MB worst case) dead-rack data load in the
  // background as soon as the toggle goes on, so it's likely already
  // cached by the time "Start drilling" is clicked - handleStart still
  // awaits it itself as a safety net for a same-instant toggle+start.
  const handleToggleDeadRacks = (checked) => {
    setDeadRacksEnabled(checked);
    if (checked) loadDeadRackData().catch(() => {});
  };

  // Measures the grid's actual rendered width so column count and tile
  // size can be derived from real available space instead of guessed
  // breakpoints (which can't account for the sidenav, card padding, etc).
  useEffect(() => {
    if (stage !== 'grid') return;
    const el = gridContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [stage]);

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
  const currentPageCells = pages[pageIndex] || [];

  const { columns: gridColumns, tileSize: gridTileSize } = useMemo(
    () => computeGridLayout(containerWidth, listKind === 'eight' ? 8 : 7),
    [containerWidth, listKind]
  );

  const remainingCount = (alpha) => {
    const entries = (alphaMap && alphaMap.get(alpha)) || [];
    return entries.filter((en) => !foundWords.has(en.word)).length;
  };

  // A dead cell resolves by elimination (double-click), a real one by
  // typing every solution - they can't share the remainingCount() check
  // (a dead alpha isn't in alphaMap at all, so that would read as
  // "0 remaining" - i.e. solved - the instant the page loads).
  const isResolved = (cell) => (cell.isDead ? eliminatedDead.has(cell.alpha) : remainingCount(cell.alpha) === 0);

  const pageComplete = currentPageCells.length > 0 && currentPageCells.every(isResolved);
  const isLastPage = pageIndex === pages.length - 1;

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

    const usedDead = new Set();
    const cells = shuffled.map((alpha) => {
      if (deadPool && Math.random() * 100 < deadRacksPercent) {
        const dead = pickDeadRack(listKind, data, deadPool, min, max, usedDead);
        if (dead) {
          usedDead.add(dead.alpha);
          // Every dead rack's badge is just a fixed 1, matching the most
          // common real solution-count - the grid never shows a rank, so
          // there's nothing else here to estimate.
          return { alpha: dead.alpha, isDead: true, fakeCount: 1 };
        }
      }
      return { alpha, isDead: false };
    });

    setPages(chunk(cells, PAGE_SIZE));
    setPageIndex(0);
    setFoundWords(new Set());
    setEliminatedDead(new Set());
    setStats({ solved: 0, correct: 0, deadSpotted: 0, mistakes: 0 });
    setFeedback(null);
    setGuessInput('');
    setStage('grid');
  };

  const handleCellDoubleClick = (cell) => {
    if (isResolved(cell)) return;
    if (cell.isDead) {
      setEliminatedDead((prev) => new Set(prev).add(cell.alpha));
      setStats((s) => ({ ...s, solved: s.solved + 1, deadSpotted: s.deadSpotted + 1 }));
      setFeedback({ type: 'correct', message: 'Dead rack eliminated!' });
    } else {
      setStats((s) => ({ ...s, mistakes: s.mistakes + 1 }));
      setFeedback({ type: 'wrong', message: "That one's real — type its word(s) instead." });
    }
  };

  const handleGuessSubmit = (e) => {
    e.preventDefault();
    const guess = guessInput.trim().toUpperCase();
    setGuessInput('');
    if (!guess) return;

    const alpha = alphagram(guess);
    const cell = currentPageCells.find((c) => c.alpha === alpha && !c.isDead);
    const entries = cell ? (alphaMap.get(alpha) || []) : [];
    const isRealSolution = entries.some((en) => en.word === guess);

    if (!cell || !isRealSolution) {
      setFeedback({ type: 'wrong', message: 'Not a match on this page — try again.' });
    } else if (foundWords.has(guess)) {
      setFeedback({ type: 'repeat', message: 'Already found that one!' });
    } else {
      const nextFound = new Set(foundWords).add(guess);
      setFoundWords(nextFound);
      const remaining = entries.filter((en) => !nextFound.has(en.word)).length;
      setStats((s) => ({
        correct: s.correct + 1,
        solved: s.solved + (remaining === 0 ? 1 : 0),
      }));
      setFeedback({ type: 'correct', message: remaining === 0 ? 'Solved!' : `Correct! ${remaining} left.` });
    }
    inputRef.current?.focus();
  };

  const goNextPage = () => {
    if (isLastPage) {
      setStage('complete');
    } else {
      setPageIndex((i) => i + 1);
      setFeedback(null);
    }
  };

  const feedbackClass = feedback
    ? feedback.type === 'correct'
      ? styles.feedbackCorrect
      : feedback.type === 'wrong'
        ? styles.feedbackWrong
        : styles.feedbackRepeat
    : null;

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

          <DeadRacksSetting
            enabled={deadRacksEnabled}
            percent={deadRacksPercent}
            onToggleChange={handleToggleDeadRacks}
            onPercentChange={setDeadRacksPercent}
            hint="Some alphagrams on the grid will be fakes with no real word. Double-click one you think is fake to eliminate it — double-clicking a real one counts as a miss."
          />

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

      {stage === 'grid' && (
        <div className={styles.cardBlend} style={{ maxWidth: 1080 }}>
          <div className={styles.progressRow}>
            <span>Page {pageIndex + 1} / {pages.length}</span>
            <span>{currentPageCells.filter(isResolved).length} / {currentPageCells.length} solved</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${currentPageCells.length ? (currentPageCells.filter(isResolved).length / currentPageCells.length) * 100 : 0}%` }}
            />
          </div>

          <div
            ref={gridContainerRef}
            className={gridColumns === 1 ? `${styles.lithGrid} ${styles.lithGridScroll}` : styles.lithGrid}
            style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
          >
            {currentPageCells.map((cell) => {
              const resolved = isResolved(cell);
              const badgeNumber = cell.isDead ? cell.fakeCount : remainingCount(cell.alpha);
              return (
                <div
                  key={cell.alpha}
                  className={resolved ? styles.lithCellSolved : styles.lithCell}
                  onDoubleClick={() => handleCellDoubleClick(cell)}
                >
                  <span
                    className={styles.lithBadge}
                    style={resolved ? undefined : { background: badgeColorForCount(badgeNumber) }}
                  >
                    {resolved ? '✓' : badgeNumber}
                  </span>
                  <span className={styles.lithTiles}>
                    {cell.alpha.split('').map((l, i) => (
                      <Protile key={i} letter={l} color={tileColor.current} size={gridTileSize} />
                    ))}
                  </span>
                </div>
              );
            })}
          </div>

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

          <div className={styles.footerRow}>
            {pageIndex > 0 && (
              <button type="button" className={styles.secondaryButton} onClick={() => setPageIndex((i) => i - 1)}>
                ◂ Previous page
              </button>
            )}
            <button type="button" className={styles.primaryButton} onClick={goNextPage} disabled={!pageComplete}>
              {isLastPage ? 'Finish ▸' : 'Next page ▸'}
            </button>
          </div>
        </div>
      )}

      {stage === 'complete' && (
        <div className={styles.cardBlend}>
          <div className={styles.heading} style={{ fontSize: 20, alignSelf: 'center' }}>Nice work!</div>
          <div className={styles.statsGrid}>
            <div className={styles.statTile}>
              <div className={styles.statValue}>{stats.solved}</div>
              <div className={styles.statLabel}>Puzzles solved</div>
            </div>
            <div className={styles.statTile}>
              <div className={styles.statValue}>{stats.correct}</div>
              <div className={styles.statLabel}>Words found</div>
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
