import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClockCountdown } from '@phosphor-icons/react';
import MobileKeyboardOverlay from '../../../components/MobileKeyboardOverlay';
import { loadSnakesData, loadDeadRackData, alphagram } from '../snakesData';
import { pickDeadRack } from '../deadRacks';
import { initializeDictionary } from '../../../utils/localDictionary';
import { PRESETS, presetMax, presetLabel, shuffle, Protile, badgeColorForCount, DeadRacksSetting, TimeLimitSetting, useIsMobile } from '../snakesShared';
import styles from '../Snakes.module.css';

const PAGE_SIZE = 50;
// min/max/step must line up exactly (max - min divisible by step) or the
// slider's highest reachable position falls short of TIME_LIMIT_MAX - e.g.
// min=5 with step=30 could only ever reach 575s (9:35), never the intended
// 600s (10:00).
const TIME_LIMIT_MIN = 30;
const TIME_LIMIT_MAX = 600;
const TIME_LIMIT_STEP = 30;
// Two tiers, not one constant: below WIDE_SCREEN_BREAKPOINT this is 19,
// byte-for-byte the same cap "regular" desktop always had. At/above it -
// paired with .lithGridContainer's own 1200px media query widening the
// container itself - tiles are allowed to actually grow on wide monitors
// instead of staying pinned to a size calibrated for ~1080px-wide screens.
const MAX_TILE_SIZE_NORMAL = 19;
const MAX_TILE_SIZE_WIDE = 28;
const WIDE_SCREEN_BREAKPOINT = 1200;
const MIN_TILE_SIZE = 12;
// 2 columns needs at least this to be accepted (see computeGridLayout) -
// well above MIN_TILE_SIZE, which is the bare-legible floor, not a size
// that looks intentional sitting alone in a wide mobile column.
const COMFORTABLE_TWO_COLUMN_TILE_SIZE = 20;
const GRID_GAP_NORMAL = 10;
// Used at 1-2 columns instead - MUST be the actual gap applied in the JSX
// below (not just a separately-tweaked CSS value), or the tileSize math
// here assumes a bigger gap than what's really rendered, so the real
// column ends up wider than computed and leaves unaccounted slack (this is
// exactly what was still happening before this got tied to one value).
const GRID_GAP_TIGHT = 6;
// Per-cell width used by everything except the letter tiles themselves:
// the badge, the badge<->tiles gap, the cell's own left/right padding, and
// the small gaps between tiles (one less than the letter count).
const CELL_OVERHEAD = 50;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function formatElapsed(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Picks the most columns (up to 5) whose resulting column width can still
// fit every tile of a word at a legible size - never a fixed column count,
// since a fixed count can't promise every tile stays visible at every
// window width. Falls back to fewer columns (down to 1) rather than ever
// shrinking tiles below MIN_TILE_SIZE. Returns the gap it assumed too, so
// the caller can apply that SAME value rather than risk a second,
// independently-chosen gap drifting out of sync with this math.
function computeGridLayout(containerWidth, maxLetters, maxTileSize) {
  if (!containerWidth) return { columns: 1, tileSize: maxTileSize, gap: GRID_GAP_NORMAL };
  for (let columns = 5; columns >= 1; columns--) {
    const gap = columns <= 2 ? GRID_GAP_TIGHT : GRID_GAP_NORMAL;
    const columnWidth = (containerWidth - (columns - 1) * gap) / columns;
    const tileSize = Math.floor((columnWidth - CELL_OVERHEAD) / maxLetters);
    // 2 columns is only accepted at a genuinely comfortable tile size, not
    // just the bare-legible MIN_TILE_SIZE floor - the mathematical "slack"
    // between columns is always small by construction, but a 12-15px tile
    // sitting in a much wider column just LOOKS sparse/gappy at that size,
    // even with near-zero measured slack. 1 column with a properly sized
    // tile reads far better than 2 columns of undersized ones (this is
    // scoped to exactly 2 columns - 3/4/5 column desktop/tablet layouts,
    // which nobody's flagged, are intentionally left exactly as they were).
    const requiredMin = columns === 2 ? COMFORTABLE_TWO_COLUMN_TILE_SIZE : MIN_TILE_SIZE;
    if (tileSize >= requiredMin || columns === 1) {
      // Falling back to 1-2 columns only happens when the container is
      // narrow relative to the word length, which means each of those few
      // columns is naturally WIDE - clamping to the same cap used at 5
      // columns left a real gap of unused space inside each column (the
      // tile rendered smaller than the column actually was), which is what
      // read as "huge gaps" between columns. Fewer columns can afford a
      // bigger tile, so let them use it instead of wasting the room.
      const effectiveMax = columns <= 2 ? Math.max(maxTileSize, MAX_TILE_SIZE_WIDE) : maxTileSize;
      return { columns, tileSize: Math.max(MIN_TILE_SIZE, Math.min(tileSize, effectiveMax)), gap };
    }
  }
  return { columns: 1, tileSize: MIN_TILE_SIZE, gap: GRID_GAP_TIGHT };
}

// Mode 1 - "Lith Mode". Same probability-range setup as the Wind Up drill,
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

  // Gates the wider grid container + bigger tile cap (see
  // MAX_TILE_SIZE_WIDE/.lithGridContainer's own media query, same 1200px
  // breakpoint) - anything narrower renders with the exact same sizing
  // "regular" desktop always had.
  const [isWideScreen, setIsWideScreen] = useState(false);
  useEffect(() => {
    const checkWide = () => setIsWideScreen(window.innerWidth >= WIDE_SCREEN_BREAKPOINT);
    checkWide();
    window.addEventListener('resize', checkWide);
    return () => window.removeEventListener('resize', checkWide);
  }, []);

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
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(300);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  // pageEnded covers both an actual Give Up and the timer running out - both
  // stop the page short and show the same overlay (pageEndReason just picks
  // its wording); solutionsRevealed tracks whether the user chose to see
  // the page's answers before moving on, or skipped straight to the next page.
  const [pageEnded, setPageEnded] = useState(false);
  const [pageEndReason, setPageEndReason] = useState(null); // 'timeup' | 'giveup' | null
  const [solutionsRevealed, setSolutionsRevealed] = useState(false);

  const [pages, setPages] = useState([]); // {alpha, isDead, fakeCount?}[][]
  const [pageIndex, setPageIndex] = useState(0);
  const [foundWords, setFoundWords] = useState(new Set());
  const [eliminatedDead, setEliminatedDead] = useState(new Set());
  const [stats, setStats] = useState({ solved: 0, correct: 0, deadSpotted: 0, mistakes: 0 });

  const [guessInput, setGuessInput] = useState('');
  const [feedback, setFeedback] = useState(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Session stopwatch - ticks while a drill is actually in progress, reset
  // fresh each time handleStart runs.
  useEffect(() => {
    if (stage !== 'grid') return;
    const intervalId = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(intervalId);
  }, [stage]);

  // Time Limit (optional, off by default): one countdown per page, freshly
  // reset whenever a new page begins - firing on the stage->'grid'
  // transition (first page) and on every pageIndex change afterward (next
  // and previous page both count as "a new page begins").
  //
  // This is deliberately ONE effect (reset + tick together), not two: a
  // separate reset effect and tick effect both keyed on stage fire in the
  // same pass whenever stage flips back to 'grid' (e.g. Drill again after
  // Ending a quiz), and the tick effect would read the stale pre-reset
  // `remainingSeconds` left over from the previous session (often already
  // at 0) and immediately end the new page before it even started.
  // Counting down via a local `remaining` variable inside a single effect -
  // rather than reading `remainingSeconds` state across effects - makes
  // each run self-contained and immune to that race.
  useEffect(() => {
    if (stage !== 'grid') return;
    setPageEnded(false);
    setPageEndReason(null);
    setSolutionsRevealed(false);
    if (!timeLimitEnabled) {
      setRemainingSeconds(null);
      return;
    }
    let remaining = timeLimitSeconds;
    setRemainingSeconds(remaining);
    const intervalId = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(intervalId);
        setRemainingSeconds(0);
        setPageEnded(true);
        setPageEndReason('timeup');
      } else {
        setRemainingSeconds(remaining);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [stage, pageIndex, timeLimitEnabled, timeLimitSeconds]);

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

  const { columns: gridColumns, tileSize: gridTileSize, gap: lithGridGap } = useMemo(
    () => computeGridLayout(
      containerWidth,
      listKind === 'eight' ? 8 : 7,
      isWideScreen ? MAX_TILE_SIZE_WIDE : MAX_TILE_SIZE_NORMAL
    ),
    [containerWidth, listKind, isWideScreen]
  );

  // The badge stays its normal 20px at every tile size this already looked
  // fine at - it only shrinks once tiles themselves have shrunk enough
  // (narrow/mobile widths, typically the 1-2 column case) that a full-size
  // circle would visually dominate a row of much smaller tiles.
  const lithBadgeSize = gridTileSize >= 16 ? 20 : Math.max(13, Math.round(gridTileSize * 0.9));
  const lithBadgeFontSize = lithBadgeSize >= 18 ? 9.5 : lithBadgeSize >= 15 ? 8.5 : 7.5;

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
        // Every dead rack's badge is just a fixed 1, matching the most
        // common real solution-count - the grid never shows a rank, so
        // there's nothing else here to estimate.
        deadCells.push({ alpha: dead.alpha, isDead: true, fakeCount: 1 });
      }
      cells = shuffle([...realCells, ...deadCells]);
    }

    setElapsedSeconds(0);
    setPages(chunk(cells, PAGE_SIZE));
    setPageIndex(0);
    setFoundWords(new Set());
    setEliminatedDead(new Set());
    setStats({ solved: 0, correct: 0, deadSpotted: 0, mistakes: 0 });
    setFeedback(null);
    setGuessInput('');
    setStage('grid');
  };

  const handleEndQuiz = () => setStage('complete');

  // The actual "give up" - ends only the current page (shows the same
  // overlay the timer running out shows), not the whole quiz.
  const handleGiveUpPage = () => {
    setPageEnded(true);
    setPageEndReason('giveup');
  };

  // Flagging a fake is done by typing its on-page number followed by F
  // (e.g. "12F") into the same textbox real guesses go in, rather than a
  // double-click - nothing on the grid itself used to hint that a cell was
  // even clickable, let alone that double-clicking was the gesture.
  const handleFakeFlag = (index) => {
    const cell = currentPageCells[index];
    if (!cell) {
      setFeedback({ type: 'wrong', message: `No alphagram #${index + 1} on this page.` });
    } else if (isResolved(cell)) {
      setFeedback({ type: 'repeat', message: 'That one’s already resolved.' });
    } else if (cell.isDead) {
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
    if (!guess || pageEnded) return;

    // Words are letters only, so "<digits>F" can never collide with an
    // actual word guess - safe to check unconditionally before the normal
    // alphagram-matching logic below.
    const fakeFlagMatch = guess.match(/^(\d+)F$/);
    if (fakeFlagMatch) {
      handleFakeFlag(parseInt(fakeFlagMatch[1], 10) - 1);
      inputRef.current?.focus();
      return;
    }

    const alpha = alphagram(guess);
    const cell = currentPageCells.find((c) => c.alpha === alpha && !c.isDead);
    const entries = cell ? (alphaMap.get(alpha) || []) : [];
    const isRealSolution = entries.some((en) => en.word === guess);

    if (foundWords.has(guess)) {
      setFeedback({ type: 'repeat', message: 'Already found that one!' });
    } else if (!cell) {
      setFeedback({ type: 'wrong', message: 'No alphagram on this page uses those letters — try again.' });
    } else if (!isRealSolution) {
      setFeedback({ type: 'wrong', message: 'Not a valid word for that alphagram — try again.' });
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

  // Mirrors what typing on a physical keyboard would do to the same
  // controlled guessInput/handleGuessSubmit pair, since the on-screen
  // keyboard is the only way to type at all once the real input is
  // readOnly on mobile.
  const handleOverlayKeyPress = (key) => {
    if (key === 'Backspace') {
      setGuessInput((v) => v.slice(0, -1));
    } else if (key === 'Enter') {
      handleGuessSubmit({ preventDefault: () => {} });
    } else {
      setGuessInput((v) => v + key);
    }
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
            hint="Some alphagrams on the grid will be fakes with no real word. Each one has a number — type its number followed by F (e.g. “12F”) if you think it's fake. Flagging a real one counts as a miss."
          />

          <TimeLimitSetting
            enabled={timeLimitEnabled}
            onToggleChange={setTimeLimitEnabled}
            seconds={timeLimitSeconds}
            onSecondsChange={setTimeLimitSeconds}
            min={TIME_LIMIT_MIN}
            max={TIME_LIMIT_MAX}
            step={TIME_LIMIT_STEP}
            formatValue={formatElapsed}
            hint="Each page gets this long. When it runs out, you'll be asked whether to see the page's solutions before moving on."
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

      {stage === 'grid' && (
        <>
        <div className={`${styles.cardBlend} ${styles.lithGridContainer}`}>
          <div className={styles.progressRow}>
            <span>Page {pageIndex + 1} / {pages.length}</span>
            {timeLimitEnabled ? (
              <span className={remainingSeconds != null && remainingSeconds <= 10 ? styles.clockChipLow : styles.clockChipCountdown}>
                {formatElapsed(remainingSeconds ?? timeLimitSeconds)}
              </span>
            ) : (
              <span className={styles.clockChip}>{formatElapsed(elapsedSeconds)}</span>
            )}
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
            style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)`, columnGap: lithGridGap }}
          >
            {currentPageCells.map((cell, index) => {
              const resolved = isResolved(cell);
              const badgeNumber = cell.isDead ? cell.fakeCount : remainingCount(cell.alpha);
              return (
                <div
                  key={cell.alpha}
                  className={resolved ? styles.lithCellSolved : styles.lithCell}
                >
                  <span className={styles.lithIndex}>{index + 1}</span>
                  <span
                    className={styles.lithBadge}
                    style={{
                      width: lithBadgeSize,
                      height: lithBadgeSize,
                      fontSize: lithBadgeFontSize,
                      background: resolved ? undefined : badgeColorForCount(badgeNumber),
                    }}
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
              onFocus={() => isMobile && setKeyboardOpen(true)}
              placeholder="Type a word…"
              autoComplete="off"
              autoCapitalize="characters"
              disabled={pageEnded}
              readOnly={isMobile}
              inputMode={isMobile ? 'none' : undefined}
            />
          </form>
          {feedback && <div className={feedbackClass}>{feedback.message}</div>}

          <div className={styles.footerRow}>
            {pageIndex > 0 && (
              <button type="button" className={styles.secondaryButton} onClick={() => setPageIndex((i) => i - 1)}>
                ◂ Previous page
              </button>
            )}
            <button type="button" className={styles.secondaryButton} onClick={handleGiveUpPage} disabled={pageComplete || pageEnded}>
              Give up
            </button>
            <button type="button" className={styles.secondaryButton} onClick={handleEndQuiz}>
              End Quiz
            </button>
            <button type="button" className={styles.primaryButton} onClick={goNextPage} disabled={!pageComplete}>
              {isLastPage ? 'Finish ▸' : 'Next page ▸'}
            </button>
          </div>
        </div>

        {pageEnded && (
          <div className={styles.pageEndBackdrop}>
            <div className={styles.pageEndCard}>
              <div className={styles.pageEndTitle}>
                {pageEndReason === 'timeup' ? (
                  <>
                    <ClockCountdown size={20} weight="bold" style={{ verticalAlign: -4, marginRight: 6 }} />
                    Time's up!
                  </>
                ) : 'Page given up'}
              </div>
              {!solutionsRevealed ? (
                <>
                  <div className={styles.pageEndSubtitle}>Want to see this page's solutions before moving on?</div>
                  <div className={styles.footerRow}>
                    <button type="button" className={styles.secondaryButton} onClick={() => setSolutionsRevealed(true)}>
                      Show solutions
                    </button>
                    <button type="button" className={styles.primaryButton} onClick={goNextPage}>
                      {isLastPage ? 'Finish ▸' : 'Next page ▸'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.solutionList}>
                    {currentPageCells.filter((cell) => !isResolved(cell)).map((cell) => (
                      <div key={cell.alpha} className={styles.solutionRow}>
                        <span className={styles.solutionAlpha}>{cell.alpha}</span>
                        <span className={styles.solutionAnswer}>
                          {cell.isDead ? '💀 Fake — no real word' : (alphaMap.get(cell.alpha) || []).map((e) => e.word).join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button type="button" className={styles.primaryButton} onClick={goNextPage}>
                    {isLastPage ? 'Finish ▸' : 'Next page ▸'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <MobileKeyboardOverlay
          visible={isMobile && keyboardOpen && !pageEnded}
          onKeyPress={handleOverlayKeyPress}
          onClose={() => { setKeyboardOpen(false); inputRef.current?.blur(); }}
          label={guessInput}
        />
        </>
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
            <div className={styles.statTile}>
              <div className={styles.clockChip}>{formatElapsed(elapsedSeconds)}</div>
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
