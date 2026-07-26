import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import styles from './AnalysisPanel.module.css';
import { formatMoveLocation } from '../../functions/play/moveDisplayUtils';

const LAYERS = [
  { key: 'preview', label: 'Preview' },
  { key: 'heatmap', label: 'Heat Map' },
  { key: 'opponentResponses', label: 'Opponent Responses' }
];

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

  const [heatMapIterations, setHeatMapIterations] = useState(20);
  const [opponentResponsesIterations, setOpponentResponsesIterations] = useState(20);

  const { layer, selectedMove, frames, stepIndex, isRunning, error, heatMap, opponentResponses } = analysisState;

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
        const isSelected = selectedMove && selectedMove.word === move.word && selectedMove.score === move.score;
        const response = layer === 'opponentResponses' ? opponentResponses?.[move.word] : null;

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

  const renderPreviewLayer = () => {
    if (!selectedMove) {
      return (
        <Box sx={{ fontSize: '12px', color: secondaryTextColor, padding: '8px 0' }}>
          Select a move above to preview it step by step.
        </Box>
      );
    }

    if (isRunning) {
      return (
        <Box className={styles.thinkingDots}>
          <div></div>
          <div></div>
          <div></div>
        </Box>
      );
    }

    if (error) {
      return <Box sx={{ fontSize: '12px', color: '#EF4444' }}>{error}</Box>;
    }

    if (!frames || frames.length === 0) {
      return (
        <Box
          component="button"
          onClick={() => onSelectMove(selectedMove)}
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
          Run Preview for {selectedMove.word}
        </Box>
      );
    }

    const currentFrame = frames[stepIndex];
    const frameLabel = FRAME_LABELS[currentFrame?.move] || 'Move';

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Box sx={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
          {selectedMove.word} - step {stepIndex + 1} of {frames.length}: {frameLabel}
        </Box>
        <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Box
            component="button"
            onClick={() => onStep(stepIndex - 1)}
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
            onClick={() => onStep(stepIndex + 1)}
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

  const renderHeatMapLayer = () => {
    if (!selectedMove) {
      return (
        <Box sx={{ fontSize: '12px', color: secondaryTextColor, padding: '8px 0' }}>
          Select a move above to run a heat map for it.
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Box sx={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
          {selectedMove.word} - where opponent replies land over {heatMapIterations} simulated iterations
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box sx={{ fontSize: '12px', color: secondaryTextColor, minWidth: '70px' }}>
            Iterations: {heatMapIterations}
          </Box>
          <Slider
            value={heatMapIterations}
            onChange={(e, value) => setHeatMapIterations(value)}
            min={5}
            max={50}
            step={5}
            disabled={isRunning}
            sx={{ flex: 1 }}
          />
        </Box>

        <Box
          component="button"
          onClick={() => onRunHeatMap(selectedMove, heatMapIterations)}
          disabled={isRunning}
          sx={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: `1px solid ${borderColor}`,
            background: isRunning ? bgColor : '#3D5A80',
            color: isRunning ? secondaryTextColor : '#fff',
            fontWeight: 600,
            fontSize: '12px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          {isRunning ? 'Running...' : (heatMap ? 'Run Again' : 'Run Heat Map')}
        </Box>

        {error && <Box sx={{ fontSize: '12px', color: '#EF4444' }}>{error}</Box>}

        {heatMap && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: secondaryTextColor }}>
            <Box sx={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'rgba(140, 180, 255, 0.8)' }} />
            Never
            <Box sx={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'rgba(255, 50, 50, 0.9)', marginLeft: '8px' }} />
            Frequent
          </Box>
        )}
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
          Opponent Responses: expected score & bingo rate for each move above, over {opponentResponsesIterations} simulated continuations
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box sx={{ fontSize: '12px', color: secondaryTextColor, minWidth: '70px' }}>
            Iterations: {opponentResponsesIterations}
          </Box>
          <Slider
            value={opponentResponsesIterations}
            onChange={(e, value) => setOpponentResponsesIterations(value)}
            min={5}
            max={100}
            step={5}
            disabled={isRunning}
            sx={{ flex: 1 }}
          />
        </Box>

        <Box
          component="button"
          onClick={() => onRunOpponentResponses(topMoves, opponentResponsesIterations)}
          disabled={isRunning}
          sx={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: `1px solid ${borderColor}`,
            background: isRunning ? bgColor : '#3D5A80',
            color: isRunning ? secondaryTextColor : '#fff',
            fontWeight: 600,
            fontSize: '12px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          {isRunning ? 'Running...' : (opponentResponses ? 'Run Again' : 'Run')}
        </Box>

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
      case 'preview':
        return renderPreviewLayer();
      case 'heatmap':
        return renderHeatMapLayer();
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
