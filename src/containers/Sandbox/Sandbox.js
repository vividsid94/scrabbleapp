import React, { useContext, useMemo, useRef } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import { Flask } from '@phosphor-icons/react';
import styles from './Sandbox.module.css';
import Board from "../../components/AppContent/Board/Board.js";
import { useSandboxStore } from '../../stores/sandboxStore';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
import { createBoard } from "../../functions/boardFunctions.js";
import SandboxPlayerInfo from './SandboxPlayerInfo.js';
import { ThemeContext } from '../../App';

export default function Sandbox() {
  const { lightMode } = useContext(ThemeContext);
  const complementaryColor = useRef('#9F7A83');

  const gameStarted = useSandboxStore(state => state.gameStarted);
  const boardCoords = useSandboxStore(state => state.boardCoords);
  const blankTiles = useSandboxStore(state => state.blankTiles);
  const moveHistory = useSandboxStore(state => state.moveHistory);

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

  return (
    <Box className={styles.container}>
      <Sidenav/>
      <Box className={styles.page}>
        <Box className={styles.mainPanel}>
          <Box className={styles.leftContainer}>
            <Box
              className={`${styles.mainBox} ${styles.mainBoxContent}`}
              component="main"
            >
              {gameStarted ? (
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
                />
              ) : (
                <Box className={styles.emptyBoardState}>
                  <Flask size={40} weight="duotone" style={{ opacity: 0.5 }} />
                  <Box className={styles.emptyBoardStateText}>
                    Set up a series and press Start to watch it play out
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
          <Box className={styles.rightPanel}>
            <SandboxPlayerInfo />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
