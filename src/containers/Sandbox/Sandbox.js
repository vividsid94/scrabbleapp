import React, { useContext, useMemo, useRef } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Sandbox.module.css';
import Board from "../../components/AppContent/Board/Board.js";
import { useSandboxStore } from '../../stores/sandboxStore';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
import { createBoard } from "../../functions/boardFunctions.js";
import { buildGhostOverlayGrid } from "../../functions/analysisBoardFunctions.js";
import SandboxPlayerInfo from './SandboxPlayerInfo.js';
import { ThemeContext } from '../../App';

export default function Sandbox() {
  const { lightMode } = useContext(ThemeContext);
  const complementaryColor = useRef('#9F7A83');

  const gameStarted = useSandboxStore(state => state.gameStarted);
  const boardCoords = useSandboxStore(state => state.boardCoords);
  const blankTiles = useSandboxStore(state => state.blankTiles);
  const moveHistory = useSandboxStore(state => state.moveHistory);
  const analysis = useSandboxStore(state => state.analysis);
  const setAnalysisLaneDragSelection = useSandboxStore(state => state.setAnalysisLaneDragSelection);

  const color = useColorSchemeStore(state => state.color);
  const boardColor = useColorSchemeStore(state => state.boardColor);

  const latestMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;

  const lastMoveCoordinates = useMemo(() => {
    if (!latestMove || !latestMove.boardDiff) return [];
    return latestMove.boardDiff.map(tile => ({ row: tile.row, col: tile.col }));
  }, [latestMove]);

  const board = useMemo(() => {
    if (!boardCoords || boardCoords.length === 0) return [];
    return createBoard(
      boardCoords,
      [],
      "PROTILES",
      "STANDARD",
      color.current,
      complementaryColor.current,
      blankTiles,
      lastMoveCoordinates,
      lightMode
    );
  }, [boardCoords, color.current, boardColor.current, blankTiles, lastMoveCoordinates, lightMode]);

  // Same derivation Play.js uses for its own <Board> - see analysisEngine.js/
  // AnalysisPanel.js for why this is safe to share as-is (purely prop-driven,
  // no store coupling). Visualize and Heat Map share one layer/tab, so this
  // is gated on the layer being active, not which of the two actually ran;
  // Lane Isolation shows the baseline candidate move until a run finds a
  // matching sample, then that sample takes over.
  const analysisGhostGrid = useMemo(() => {
    if (!analysis.active) return null;
    if (analysis.layer === 'visualize') {
      if (!analysis.frames || analysis.frames.length === 0) return null;
      return buildGhostOverlayGrid(analysis.frames[analysis.stepIndex], boardCoords);
    }
    if (analysis.layer === 'laneIsolation') {
      const frame = analysis.laneResult?.sampleFrame || analysis.frames?.[0] || null;
      return buildGhostOverlayGrid(frame, boardCoords);
    }
    return null;
  }, [analysis.active, analysis.layer, analysis.frames, analysis.stepIndex, analysis.laneResult, boardCoords]);

  // Heat-map tint - shown only while Visualize hasn't since produced its own
  // multi-ply frames (which take priority over the tint underneath).
  const analysisHeatGrid = useMemo(() => {
    if (!analysis.active || analysis.layer !== 'visualize' || !analysis.heatMap || (analysis.frames && analysis.frames.length > 1)) {
      return null;
    }
    return analysis.heatMap.grid;
  }, [analysis.active, analysis.layer, analysis.heatMap, analysis.frames]);

  return (
    <Box className={styles.container}>
      <Sidenav/>
      <Box className={styles.page}>
        {gameStarted ? (
          <Box className={styles.mainPanel}>
            <Box className={styles.leftContainer}>
              <Box
                className={`${styles.mainBox} ${styles.mainBoxContent}`}
                component="main"
              >
                <Board
                  board={board}
                  boardMode="STANDARD"
                  animate={false}
                  enableTelestrator={false}
                  showSlip={false}
                  showDictionary={false}
                  showNoCommentaryLabel={false}
                  dictionary=""
                  previewScore={null}
                  previewScorePosition={null}
                  lastMoveCoordinates={lastMoveCoordinates}
                  arrowDirection="right"
                  lightMode={lightMode}
                  analysisGhostGrid={analysisGhostGrid}
                  analysisGhostDashedBorder={analysis.frames && analysis.frames.length > 1}
                  analysisHeatGrid={analysisHeatGrid}
                  analysisHeatMaxCount={analysis.heatMap?.maxCount}
                  analysisLaneSelection={analysis.layer === 'laneIsolation' ? analysis.laneSelection : null}
                  analysisLaneSelectable={analysis.active && analysis.layer === 'laneIsolation' && !!analysis.selectedMove}
                  onAnalysisLaneDrag={(ar, ac, cr, cc) => setAnalysisLaneDragSelection({ row: ar, col: ac }, { row: cr, col: cc })}
                />
              </Box>
            </Box>
            <Box className={styles.rightPanel}>
              <SandboxPlayerInfo />
            </Box>
          </Box>
        ) : (
          <Box className={styles.setupOnlyPanel}>
            <Box className={styles.rightPanel}>
              <SandboxPlayerInfo />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
