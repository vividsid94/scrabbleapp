import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from '@mui/material/LinearProgress';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { PlayIcon, PauseIcon, FireIcon } from '@phosphor-icons/react';
import styles from './AnalysisPanel.module.css';
import { formatMoveLocation } from '../../functions/play/moveDisplayUtils';
import { buildIterationLabel } from '../../functions/analysisBoardFunctions';

const LAYERS = [
  { key: 'visualize', label: 'Visualize/Heat Maps' },
  { key: 'opponentResponses', label: 'Responses' }
];

const HEATMAP_ITERATIONS = 200;

const FRAME_LABELS = {
  selected: 'Selected move',
  opponent: "Opponent's reply",
  player: 'Reply'
};

// Analysis Mode's single control surface: pick a candidate move, switch
// between analysis layers, and step through whatever the active layer
// produced. Nothing here ever touches game state directly - it's purely
// prop-driven, shared between Play and Viewer.
export default function AnalysisPanel({
  analysisState,
  onSelectMove,
  onSetSelectedMove,
  onSetLayer,
  onStep,
  onRunHeatMap,
  onRunOpponentResponses,
  onGetTopMoves,
  topMoves,
  isLoadingTopMoves,
  lightMode = 'dark'
}) {
  const textColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#1F2937';
  const secondaryTextColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#4B5563';
  const borderColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.18)';
  const bgColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';

  const [opponentResponsesIterations, setOpponentResponsesIterations] = useState(500);
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const { layer, selectedMove, frames, stepIndex, isRunning, error, heatMap, opponentResponses } = analysisState;

  // Auto-play through a freshly-run Visualize: whenever a new `frames` array
  // arrives, step through it on a timer instead of requiring manual Prev/Next
  // clicks. `frames` is a new array reference each time a run completes, so
  // this effect fires exactly once per Run click, not on every re-render.
  const autoPlayTimeoutRef = useRef(null);

  const stopAutoPlay = () => {
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
      autoPlayTimeoutRef.current = null;
    }
    setIsAutoPlaying(false);
  };

  const runAutoPlayFrom = (startIndex, totalFrames) => {
    setIsAutoPlaying(true);
    let i = startIndex;
    const advance = () => {
      onStep(i);
      i += 1;
      if (i < totalFrames) {
        autoPlayTimeoutRef.current = setTimeout(advance, 250);
      } else {
        autoPlayTimeoutRef.current = null;
        setIsAutoPlaying(false);
      }
    };
    advance();
  };

  useEffect(() => {
    if (!frames || frames.length === 0) return undefined;

    setIsPaused(false);
    runAutoPlayFrom(0, frames.length);

    return stopAutoPlay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames]);

  // Pause/resume toggle for the row currently being visualized - pausing just
  // cancels the pending timeout (current frame stays on screen); resuming
  // continues the same auto-play chain from wherever it left off.
  const toggleVisualizePause = () => {
    if (isAutoPlaying) {
      stopAutoPlay();
      setIsPaused(true);
    } else if (isPaused) {
      setIsPaused(false);
      runAutoPlayFrom(stepIndex, frames.length);
    }
  };

  // While any Visualize/Heat Map action is running, paused, or mid-playback,
  // every other move's icons are blocked - the sole exception is the active
  // row's own Play/Pause toggle, handled separately per-row below.
  const isVisualizeBusy = isRunning || isAutoPlaying || isPaused;

  const renderLayerTabs = () => (
    <Box sx={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
      {LAYERS.map(({ key, label }) => (
        <Box
          key={key}
          onClick={() => onSetLayer(key)}
          sx={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '6px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            color: layer === key ? '#fff' : secondaryTextColor,
            backgroundColor: layer === key ? '#3D5A80' : bgColor,
            border: `1px solid ${layer === key ? '#3D5A80' : borderColor}`,
            transition: 'all 0.2s ease'
          }}
        >
          {label}
        </Box>
      ))}
    </Box>
  );

  const renderMoveList = () => (
    <Box sx={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '10px' }}>
      {(!topMoves || topMoves.length === 0) && (
        isLoadingTopMoves ? (
          <Box className={styles.thinkingDots} sx={{ padding: '8px 0' }}>
            <div></div>
            <div></div>
            <div></div>
          </Box>
        ) : (
          <Box
            onClick={() => onGetTopMoves && onGetTopMoves()}
            sx={{
              fontSize: '12px',
              color: secondaryTextColor,
              padding: '8px 0',
              cursor: onGetTopMoves ? 'pointer' : 'default',
              textDecoration: onGetTopMoves ? 'underline' : 'none'
            }}
          >
            Ask Theo for candidates.
          </Box>
        )
      )}
      {topMoves && topMoves.map((move, index) => {
        const isSelected = selectedMove === move;
        const response = layer === 'opponentResponses' ? opponentResponses?.[move.word] : null;

        // This row is the one actually being stepped through right now (as
        // opposed to just selected) - its Play icon becomes a Pause/Resume
        // toggle instead of being blocked like every other row's icons.
        const isThisRowVisualizing = isSelected && frames && frames.length > 1;
        const playDisabled = isVisualizeBusy && !isThisRowVisualizing;
        const fireDisabled = isVisualizeBusy;
        const showRowProgress = isSelected && isVisualizeBusy;
        const showDeterminateProgress = isThisRowVisualizing && !isRunning;

        return (
          <Box
            key={index}
            onClick={() => onSetSelectedMove(move)}
            className={styles.topMoveItem}
            sx={{
              cursor: 'pointer',
              borderBottom: `1px solid ${borderColor}`,
              backgroundColor: isSelected ? bgColor : 'transparent'
            }}
          >
            <Box className={styles.topMoveRank} style={{ color: secondaryTextColor, background: bgColor, border: `1px solid ${borderColor}` }}>
              {index + 1}
            </Box>
            <Box className={styles.topMoveLocation} style={{ color: secondaryTextColor, backgroundColor: bgColor, borderColor }}>
              {formatMoveLocation(move) || ''}
            </Box>
            <Box className={styles.topMoveWord} style={{ color: textColor }}>
              {move.word}
            </Box>
            <Box className={styles.topMoveDetails}>
              <Box className={styles.topMoveScore}>{move.score}</Box>
              {layer !== 'opponentResponses' && (
                <>
                  <Tooltip title={isThisRowVisualizing ? (isAutoPlaying ? 'Pause' : 'Resume') : 'Visualize'} placement="top">
                    <Box
                      component="button"
                      disabled={playDisabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isThisRowVisualizing) {
                          toggleVisualizePause();
                          return;
                        }
                        onSetLayer('visualize');
                        onSetSelectedMove(move);
                        onSelectMove(move);
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '22px',
                        height: '22px',
                        padding: 0,
                        borderRadius: '4px',
                        border: `1px solid ${borderColor}`,
                        background: bgColor,
                        color: textColor,
                        cursor: playDisabled ? 'not-allowed' : 'pointer',
                        opacity: playDisabled ? 0.4 : 1
                      }}
                    >
                      {isThisRowVisualizing && isAutoPlaying ? <PauseIcon size={13} weight="fill" /> : <PlayIcon size={13} weight="fill" />}
                    </Box>
                  </Tooltip>
                  <Tooltip title="Heat Map" placement="top">
                    <Box
                      component="button"
                      disabled={fireDisabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetLayer('visualize');
                        onSetSelectedMove(move);
                        onRunHeatMap(move, HEATMAP_ITERATIONS);
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '22px',
                        height: '22px',
                        padding: 0,
                        borderRadius: '4px',
                        border: `1px solid ${borderColor}`,
                        background: bgColor,
                        color: textColor,
                        cursor: fireDisabled ? 'not-allowed' : 'pointer',
                        opacity: fireDisabled ? 0.4 : 1
                      }}
                    >
                      <FireIcon size={13} weight="fill" />
                    </Box>
                  </Tooltip>
                  {showRowProgress && (
                    <LinearProgress
                      variant={showDeterminateProgress ? 'determinate' : 'indeterminate'}
                      value={showDeterminateProgress ? ((stepIndex + 1) / frames.length) * 100 : undefined}
                      sx={{
                        width: '36px',
                        height: '4px',
                        borderRadius: '2px',
                        backgroundColor: 'rgba(76, 175, 80, 0.25)',
                        '& .MuiLinearProgress-bar': { backgroundColor: '#4CAF50' }
                      }}
                    />
                  )}
                </>
              )}
              {response?.data && (
                <>
                  <Box sx={{ fontSize: '11px', color: secondaryTextColor, backgroundColor: bgColor, border: `1px solid ${borderColor}`, borderRadius: '4px', padding: '2px 6px' }}>
                    Avg {response.data.averageScore?.toFixed(1) ?? 'N/A'}
                  </Box>
                  <Box sx={{ fontSize: '11px', color: secondaryTextColor, backgroundColor: bgColor, border: `1px solid ${borderColor}`, borderRadius: '4px', padding: '2px 6px' }}>
                    Bingo {response.data.bingoPercent?.toFixed(0) ?? '0'}%
                  </Box>
                </>
              )}
              {response?.error && (
                <Box sx={{ fontSize: '11px', color: '#EF4444' }}>Error</Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  // Visualize and Heat Map share one tab/one board (a move can only be
  // stepped through OR heat-mapped at a time, never both), so which content
  // to show here is driven by which data actually came back - a full
  // multi-ply `frames` array means Visualize ran and takes priority (it's
  // the more specific view); otherwise fall back to `heatMap`, then a hint.
  const renderVisualizeLayer = () => {
    if (!selectedMove) {
      return (
        <Box sx={{ fontSize: '12px', color: secondaryTextColor, padding: '8px 0' }}>
          Click the play icon next to a move to visualize it, or the heat icon to run its heat map.
        </Box>
      );
    }

    if (error) {
      return <Box sx={{ fontSize: '12px', color: '#EF4444' }}>{error}</Box>;
    }

    if (isRunning) {
      return (
        <Box sx={{ fontSize: '12px', color: secondaryTextColor, padding: '8px 0' }}>
          Running {selectedMove.word}...
        </Box>
      );
    }

    if (!frames || frames.length <= 1) {
      if (heatMap) {
        return (
          <Box sx={{ fontSize: '12px', color: secondaryTextColor }}>
            {selectedMove.word} - heat map shown on the board.
          </Box>
        );
      }
      return (
        <Box sx={{ fontSize: '12px', color: secondaryTextColor, padding: '8px 0' }}>
          Click the play icon next to {selectedMove.word} to visualize it, or the heat icon to run its heat map.
        </Box>
      );
    }

    const currentFrame = frames[stepIndex];
    const frameLabel = FRAME_LABELS[currentFrame?.move] || 'Move';
    const iterationLabel = buildIterationLabel(frames, stepIndex);

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Box sx={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
          {selectedMove.word} - {iterationLabel ? `${iterationLabel} - ` : ''}{frameLabel}
        </Box>
        <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Box
            component="button"
            onClick={() => { stopAutoPlay(); setIsPaused(true); onStep(stepIndex - 1); }}
            disabled={stepIndex <= 0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${borderColor}`,
              background: bgColor,
              color: textColor,
              cursor: stepIndex <= 0 ? 'not-allowed' : 'pointer',
              opacity: stepIndex <= 0 ? 0.4 : 1
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 18 }} />
            Prev
          </Box>
          <Box
            component="button"
            onClick={() => { stopAutoPlay(); setIsPaused(true); onStep(stepIndex + 1); }}
            disabled={stepIndex >= frames.length - 1}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${borderColor}`,
              background: bgColor,
              color: textColor,
              cursor: stepIndex >= frames.length - 1 ? 'not-allowed' : 'pointer',
              opacity: stepIndex >= frames.length - 1 ? 0.4 : 1
            }}
          >
            Next
            <ChevronRightIcon sx={{ fontSize: 18 }} />
          </Box>
        </Box>
      </Box>
    );
  };

  const renderOpponentResponsesLayer = () => {
    if (!topMoves || topMoves.length === 0) {
      return isLoadingTopMoves ? (
        <Box className={styles.thinkingDots} sx={{ padding: '8px 0' }}>
          <div></div>
          <div></div>
          <div></div>
        </Box>
      ) : (
        <Box
          onClick={() => onGetTopMoves && onGetTopMoves()}
          sx={{
            fontSize: '12px',
            color: secondaryTextColor,
            padding: '8px 0',
            cursor: onGetTopMoves ? 'pointer' : 'default',
            textDecoration: onGetTopMoves ? 'underline' : 'none'
          }}
        >
          Ask Theo for candidates.
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Box sx={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
          Responses: expected score & bingo rate for each move above, over {opponentResponsesIterations} simulated continuations
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box sx={{ fontSize: '12px', color: secondaryTextColor, minWidth: '70px' }}>
            Iterations: {opponentResponsesIterations}
          </Box>
          <Slider
            value={opponentResponsesIterations}
            onChange={(e, value) => setOpponentResponsesIterations(value)}
            min={500}
            max={1000}
            step={50}
            disabled={isRunning}
            sx={{ flex: 1 }}
          />
        </Box>

        {isRunning ? (
          <LinearProgress sx={{ borderRadius: '6px', height: '8px' }} />
        ) : (
          <Box
            component="button"
            onClick={() => onRunOpponentResponses(topMoves, opponentResponsesIterations)}
            sx={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${borderColor}`,
              background: '#3D5A80',
              color: '#fff',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {opponentResponses ? 'Run Again' : 'Run'}
          </Box>
        )}

        {error && <Box sx={{ fontSize: '12px', color: '#EF4444' }}>{error}</Box>}

        {opponentResponses && (
          <Box sx={{ fontSize: '11px', color: secondaryTextColor }}>
            Results are shown next to each move in the list above.
          </Box>
        )}
      </Box>
    );
  };

  const renderLayerBody = () => {
    switch (layer) {
      case 'visualize':
        return renderVisualizeLayer();
      case 'opponentResponses':
        return renderOpponentResponsesLayer();
      default:
        return null;
    }
  };

  return (
    <Box className={styles.playerPanel}>
      <Box sx={{ fontSize: '13px', fontWeight: 700, color: textColor, marginBottom: '10px' }}>
        Analysis Mode
      </Box>
      {renderLayerTabs()}
      {renderMoveList()}
      <Box sx={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px' }}>
        {renderLayerBody()}
      </Box>
    </Box>
  );
}
