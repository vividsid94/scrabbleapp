import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import styles from '../Play.module.css';
import Rack from '../../../components/AppContent/Board/Rack.js';
import SendIcon from '@mui/icons-material/Send';
import CancelIcon from '@mui/icons-material/Cancel';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Tooltip, Collapse } from '@mui/material';
import { BOT_RACK_VISIBILITY } from '../../../components/AppContent/References/testRacks';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import SyncIcon from '@mui/icons-material/Sync';
import LatestMove from './LatestMove';
import TopMoves from './TopMoves';
import ShakeableMascot from '../../../components/AppContent/ShakeableMascot';
import { UserCircle, DotsThree, ScribbleLoop, Brain } from '@phosphor-icons/react';
import AnalysisPanel from '../../../components/Analysis/AnalysisPanel';

const actionButtonStyle = {
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

// Splits Tope's raw prompt text into the preamble, each numbered "Example N
// (...)" block, and everything after the "---" divider - works for any
// number of examples, since it's just pattern matching, not hardcoded.
function parseTopePrompt(promptText) {
  if (!promptText) return null;
  const exampleRegex = /Example (\d+) \(([^)]*)\):\n([\s\S]*?)(?=\n\nExample \d+ \(|\n\n---)/g;
  const examples = [];
  let match;
  while ((match = exampleRegex.exec(promptText)) !== null) {
    examples.push({ number: match[1], meta: match[2], body: match[3].trim() });
  }
  if (examples.length === 0) return null;

  const firstIdx = promptText.indexOf('Example 1 (');
  const preamble = firstIdx >= 0 ? promptText.slice(0, firstIdx).trim() : '';

  const dividerIdx = promptText.indexOf('\n---\n');
  const postamble = dividerIdx >= 0 ? promptText.slice(dividerIdx).trim() : '';

  return { preamble, examples, postamble };
}

function TopeExampleBlock({ number, meta, body, lightMode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box
      sx={{
        marginBottom: '8px',
        paddingBottom: '8px',
        borderBottom: lightMode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'
      }}
    >
      <Box
        onClick={() => setExpanded(v => !v)}
        sx={{
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer'
        }}
      >
        Example {number}
        <Box component="span" sx={{ fontSize: '10px', fontWeight: 400, opacity: 0.6 }}>
          [{expanded ? 'collapse' : 'expand'}]
        </Box>
      </Box>
      {expanded && (
        <Box sx={{ marginTop: '4px' }}>
          <Box sx={{ fontStyle: 'italic', opacity: 0.75, marginBottom: '2px' }}>({meta})</Box>
          <Box>{body}</Box>
        </Box>
      )}
    </Box>
  );
}

function TopePromptView({ prompt, lightMode }) {
  if (!prompt) {
    return <Box sx={{ marginBottom: '8px' }}>(no prompt - Tope fell back to its default move)</Box>;
  }
  const parsed = parseTopePrompt(prompt);
  if (!parsed) {
    return <Box sx={{ marginBottom: '8px' }}>{prompt}</Box>;
  }
  return (
    <Box sx={{ marginBottom: '8px' }}>
      {parsed.preamble && <Box sx={{ marginBottom: '8px' }}>{parsed.preamble}</Box>}
      {parsed.examples.map(ex => (
        <TopeExampleBlock key={ex.number} number={ex.number} meta={ex.meta} body={ex.body} lightMode={lightMode} />
      ))}
      {parsed.postamble && <Box sx={{ marginTop: '8px' }}>{parsed.postamble}</Box>}
    </Box>
  );
}

const PlayerInfoSection = ({ name, time, points, rack, color, onTileClick, selectedTiles, isBot, currentPlayer, playerNumber, sx, mascotRef, botImage, lightMode = 'dark', moveStatus = null, isTope = false, topeThinking, showTopePrompt, onToggleTopePrompt }) => {
  const isActive = currentPlayer === playerNumber;

  const panelBackground = lightMode === 'dark'
    ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%)'
    : 'radial-gradient(circle at 25% 0%, rgba(255, 255, 255, 0.75) 0%, transparent 55%), linear-gradient(150deg, #FFFFFF 0%, #F5F3EE 50%, #E7E3D8 100%)';

  const panelBorder = lightMode === 'dark'
    ? '1px solid rgba(255, 255, 255, 0.1)'
    : '1px solid rgba(140, 130, 110, 0.28)';

  const panelShadow = lightMode === 'dark'
    ? '0 2px 8px rgba(0, 0, 0, 0.2)'
    : '0 3px 10px rgba(100, 95, 80, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)';

  // Active turn: leave the card itself alone entirely (no shadow, lift,
  // border, or background change - that whole direction read as arbitrary
  // decoration). Instead, put the emphasis on the two pieces of the panel
  // that actually mean "it's your turn": the name and the running clock.
  return (
  <Box
    className={styles.playerPanel}
    sx={{
      ...sx,
      background: panelBackground,
      border: panelBorder,
      boxShadow: panelShadow,
      backgroundImage: 'none'
    }}
  >
    <Box className={styles.playerInfo}>
      <Box
        className={styles.playerName}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: lightMode === 'dark' ? '#fff' : '#1F2937'
        }}
      >
        {isActive && (
          <Box
            sx={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              flexShrink: 0,
              backgroundColor: lightMode === 'dark' ? '#F9FAFB' : '#374151',
              boxShadow: lightMode === 'dark'
                ? '0 0 6px rgba(249, 250, 251, 0.9), 0 0 12px rgba(249, 250, 251, 0.5)'
                : '0 0 6px rgba(55, 65, 81, 0.7), 0 0 12px rgba(55, 65, 81, 0.35)',
              animation: 'clockPulse 1.8s ease-in-out infinite',
              '@keyframes clockPulse': {
                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.55, transform: 'scale(1.3)' }
              }
            }}
          />
        )}
        {name}
        {isTope && topeThinking && (
          <Box
            component="button"
            onClick={(e) => { e.stopPropagation(); onToggleTopePrompt && onToggleTopePrompt(); }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              color: '#fff',
              backgroundColor: '#3D5A80',
              boxShadow: '0 0 0 2px rgba(61, 90, 128, 0.35)',
              '&:hover': { backgroundColor: '#2c4160' }
            }}
          >
            {showTopePrompt ? "Hide Tope's thinking" : "View Tope's thinking"}
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Box
          className={styles.timer}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: '#141210',
            border: '1px solid rgba(201, 191, 174, 0.35)',
            borderRadius: '5px',
            padding: '3px 8px',
            fontSize: '13px',
            letterSpacing: '1px',
            fontVariantNumeric: 'tabular-nums',
            color: '#D6CCB8',
            fontFamily: '"Courier New", monospace',
            fontWeight: 700,
            textShadow: '0 0 5px rgba(214, 204, 184, 0.55), 0 0 10px rgba(214, 204, 184, 0.25)',
            boxShadow: 'inset 0 2px 3px rgba(0, 0, 0, 0.7), inset 0 -1px 0 rgba(255, 255, 255, 0.06), 0 1px 2px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: 'rgba(201, 191, 174, 0.55)'
            }
          }}
        >
          {time}
        </Box>
        {moveStatus && currentPlayer === playerNumber && (
          <Box 
            sx={{
              backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
              border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.18)',
              padding: '2px 6px',
              fontSize: '12px',
              color: lightMode === 'dark' ? '#fff' : '#1F2937',
              fontFamily: 'monospace',
              boxShadow: lightMode === 'dark' ? '0 2px 4px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                borderColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-1px)',
                boxShadow: lightMode === 'dark' ? '0 4px 8px rgba(0, 0, 0, 0.15)' : '0 2px 6px rgba(0, 0, 0, 0.12)'
              }
            }}
          >
            {moveStatus}
          </Box>
        )}
      </Box>
    </Box>
    <Box 
      className={styles.points} 
      sx={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#D97706'
      }}
    >
      {points}
    </Box>
    {isTope && showTopePrompt && topeThinking && (
      <Box
        sx={{
          fontFamily: 'monospace',
          fontSize: '11px',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          padding: '8px',
          marginBottom: '8px',
          maxHeight: '300px',
          overflowY: 'auto',
          borderRadius: '6px',
          backgroundColor: lightMode === 'dark' ? 'rgba(0,0,0,0.35)' : '#F9FAFB',
          border: lightMode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid #D1D5DB',
          color: lightMode === 'dark' ? 'rgba(255,255,255,0.85)' : '#374151'
        }}
      >
        <Box sx={{ fontWeight: 700, marginBottom: '4px' }}>PROMPT SENT:</Box>
        <TopePromptView prompt={topeThinking.prompt} lightMode={lightMode} />
        <Box sx={{ fontWeight: 700, marginBottom: '4px' }}>RESPONSE:</Box>
        <Box>{topeThinking.response}</Box>
      </Box>
    )}
    {rack && !isBot && (
      <Box className={styles.Rack}>
        <Rack 
          rack={rack} 
          color={color.current} 
          onTileClick={onTileClick}
          selectedTiles={selectedTiles}
          disableSelectionHighlight
        />
      </Box>
    )}
  </Box>
  );
};

export default function PlayerInfo({
  player1Name,
  player2Name,
  player1Points,
  player2Points,
  player1Time,
  player2Time,
  currentPlayer,
  player1Rack,
  player2Rack,
  color,
  onTileClick,
  selectedTiles,
  isBotMode,
  gameStarted,
  isDictionaryLoading,
  isLoadingTopMoves,
  onSettingsOpen,
  onColorSchemeOpen,
  onBotModeToggle,
  onGetTopMoves,
  onWordSubmit,
  onPass,
  onExchange,
  onExchangeClick,
  onPlayTopMove,
  selectedBoardPosition,
  tilesToExchange,
  isBotThinking,
  isPlayerThinking,
  latestMove,
  moveHistory,
  topMoves,
  onMoveSelect,
  boardCoords,
  blankTiles,
  pool,
  icons,
  mascotRef,
  botImage,
  lightMode = 'dark',
  moveStatus = null,
  isMultiplayerMode,
  localPlayerNumber,
  opponentRackCount,
  telestratorEnabled,
  onToggleTelestrator,
  topeThinking,
  analysisModeActive,
  canUseAnalysisMode,
  onToggleAnalysisMode,
  analysisState,
  onAnalysisSelectMove,
  onAnalysisSetSelectedMove,
  onAnalysisSetLayer,
  onAnalysisStep,
  onAnalysisRunHeatMap,
  onAnalysisRunOpponentResponses,
  onAnalysisClearLaneSelection,
  onAnalysisRunLaneIsolation
}) {
  const [showBestMove, setShowBestMove] = useState(false);
  const [showTopePrompt, setShowTopePrompt] = useState(false);
  const isSubmitDisabled = !gameStarted || !selectedBoardPosition || selectedTiles.length === 0;
  const isExchangeDisabled = !gameStarted || (onExchangeClick ? false : tilesToExchange.length === 0);

  const handlePassClick = () => {
    if (isPlayerThinking || isBotThinking) return;
    onPass();
  };

  const handleExchangeClick = () => {
    if (isPlayerThinking || isBotThinking) return;
    if (onExchangeClick) onExchangeClick();
    else onExchange();
  };

  const handlePlayTopMoveClick = () => {
    if (isPlayerThinking || isBotThinking) return;
    onPlayTopMove();
  };

  const handleWordSubmitClick = () => {
    if (isPlayerThinking || isBotThinking) return;
    onWordSubmit();
  };

  const handleGetTopMovesClick = () => {
    if (isPlayerThinking || isBotThinking) return;
    onGetTopMoves();
  };

  return (
    <Box className={styles.playerPanel}>
      <Box className={styles.playerToggle}>
        {icons.time && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icons.time}
          </Box>
        )}
        <Tooltip title={isDictionaryLoading ? "Loading dictionary..." : (isBotMode ? "New Game" : "Play")}>
          <Box
            onClick={() => {
              if (isDictionaryLoading || isBotThinking || isPlayerThinking) return;
              onBotModeToggle();
            }}
            sx={{
              opacity: isDictionaryLoading || isBotThinking || isPlayerThinking ? 0.5 : 1,
              cursor: isDictionaryLoading || isBotThinking || isPlayerThinking ? 'not-allowed' : 'pointer',
              pointerEvents: isDictionaryLoading || isBotThinking || isPlayerThinking ? 'none' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '30px'
            }}
          >
            {icons.botMode}
          </Box>
        </Tooltip>
        <Tooltip title={telestratorEnabled ? "Disable drawing" : "Enable drawing"}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '16px',
              cursor: 'pointer'
            }}
            onClick={() => onToggleTelestrator && onToggleTelestrator(!telestratorEnabled)}
          >
            <ScribbleLoop
              size={20}
              color={telestratorEnabled
                ? (lightMode === 'dark' ? '#10B981' : '#059669')
                : (lightMode === 'dark' ? '#ffffff' : '#1F2937')
              }
              weight={telestratorEnabled ? 'fill' : 'regular'}
            />
          </Box>
        </Tooltip>
        <Tooltip title={showBestMove ? "Hide Options" : "Show Options"}>
          <Box
            onClick={() => setShowBestMove(!showBestMove)}
            sx={{ 
              opacity: !gameStarted ? 0.3 : 1,
              cursor: !gameStarted ? 'not-allowed' : 'pointer',
              pointerEvents: !gameStarted ? 'none' : 'auto',
              transform: showBestMove ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <DotsThree size={20} color={lightMode === 'dark' ? "white" : "#1F2937"} />
          </Box>
        </Tooltip>
        {canUseAnalysisMode && (() => {
          // Only ever block *entering* - once active, always let the user exit
          // regardless of whose turn it is. Blocks entering mid-bot-turn so the
          // analysis engine never ends up using the bot's own live rack as
          // "our" rack (currentPlayer === 1 ? player1Rack : player2Rack).
          const analysisToggleDisabled = !gameStarted || (!analysisModeActive && (currentPlayer !== 1 || isBotThinking));
          return (
          <Tooltip title={analysisModeActive ? "Exit Analysis Mode" : (analysisToggleDisabled ? "Available on your turn" : "Analysis Mode")}>
            <Box
              onClick={() => {
                if (analysisToggleDisabled) return;
                onToggleAnalysisMode();
              }}
              sx={{
                opacity: analysisToggleDisabled ? 0.3 : 1,
                cursor: analysisToggleDisabled ? 'not-allowed' : 'pointer',
                pointerEvents: analysisToggleDisabled ? 'none' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '16px'
              }}
            >
              <Brain
                size={20}
                weight={analysisModeActive ? 'fill' : 'regular'}
                color={analysisModeActive
                  ? (lightMode === 'dark' ? '#10B981' : '#059669')
                  : (lightMode === 'dark' ? 'white' : '#1F2937')
                }
              />
            </Box>
          </Tooltip>
          );
        })()}
      </Box>

      {analysisModeActive ? (
        <AnalysisPanel
          analysisState={analysisState}
          onSelectMove={onAnalysisSelectMove}
          onSetSelectedMove={onAnalysisSetSelectedMove}
          onSetLayer={onAnalysisSetLayer}
          onStep={onAnalysisStep}
          onRunHeatMap={onAnalysisRunHeatMap}
          onRunOpponentResponses={onAnalysisRunOpponentResponses}
          onClearLaneSelection={onAnalysisClearLaneSelection}
          onRunLaneIsolation={onAnalysisRunLaneIsolation}
          onGetTopMoves={onGetTopMoves}
          topMoves={topMoves}
          isLoadingTopMoves={isLoadingTopMoves}
          lightMode={lightMode}
          boardCoords={boardCoords}
        />
      ) : (
      <>
      <Collapse in={showBestMove}>
        <Box className={styles.bestMoveSection} sx={{
          display: 'flex',
          gap: '50px',
          padding: '8px 0',
          backgroundColor: lightMode === 'dark' ? 'rgba(0, 0, 0, 0.05)' : '#F3F4F6',
          border: lightMode === 'dark' ? 'none' : '1px solid #D1D5DB',
          borderRadius: '8px',
          marginTop: '8px'
        }}>
          <Box sx={{ display: 'flex', gap: '4px' }}>
            <Tooltip title="Play Best Move">
              <Box
                className={styles.bestMoveButton}
                onClick={handlePlayTopMoveClick}
                sx={{ 
                  opacity: !gameStarted ? 0.3 : (isLoadingTopMoves || isDictionaryLoading ? 0.5 : 1),
                  cursor: !gameStarted ? 'not-allowed' : (isLoadingTopMoves || isDictionaryLoading ? 'not-allowed' : 'pointer'),
                  pointerEvents: !gameStarted ? 'none' : 'auto',
                  position: 'relative'
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 20, color: lightMode === 'dark' ? '#fff' : '#1F2937' }} />
                <Box sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  3
                </Box>
              </Box>
            </Tooltip>
            <Tooltip title="Pass">
              <Box
                className={styles.bestMoveButton}
                onClick={handlePassClick}
                sx={{ 
                  opacity: !gameStarted ? 0.3 : 1,
                  cursor: !gameStarted ? 'not-allowed' : 'pointer',
                  pointerEvents: !gameStarted ? 'none' : 'auto',
                  position: 'relative'
                }}
              >
                <CancelIcon sx={{ fontSize: 20, color: lightMode === 'dark' ? '#fff' : '#1F2937' }} />
                <Box sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  1
                </Box>
              </Box>
            </Tooltip>
            <Tooltip title="Exchange">
              <Box
                className={styles.bestMoveButton}
                onClick={handleExchangeClick}
                sx={{ 
                  opacity: !gameStarted ? 0.3 : (isExchangeDisabled ? 0.5 : 1),
                  cursor: !gameStarted ? 'not-allowed' : (isExchangeDisabled ? 'not-allowed' : 'pointer'),
                  pointerEvents: !gameStarted ? 'none' : 'auto',
                  position: 'relative'
                }}
              >
                <SwapHorizIcon sx={{ fontSize: 20, color: lightMode === 'dark' ? '#fff' : '#1F2937', fontWeight: '700' }} />
                <Box sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  2
                </Box>
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </Collapse>

      {gameStarted && (() => {
        const players = [
          {
            name: player1Name,
            time: player1Time,
            points: player1Points,
            rack: player1Rack,
            isBot: false,
            isThinking: currentPlayer === 1 && isPlayerThinking,
            playerNumber: 1 // Explicitly set player number
          },
          {
            name: player2Name,
            time: player2Time,
            points: player2Points,
            rack: isBotMode ? ['🤖', '👾', '🤖', '👾', '🤖', '👾', '🤖'] : player2Rack,
            isBot: isBotMode,
            isThinking: isBotMode && isBotThinking,
            botImage: botImage, // Pass botImage to PlayerInfoSection
            isTope: isBotMode && player2Name === 'Tope',
            playerNumber: 2 // Explicitly set player number
          }
        ];

        // Whoever went first stays on top for the entire game - don't
        // reorder by whose turn it currently is (that used to swap the two
        // panels' positions every single turn). moveHistory[0] is
        // authoritative once a move has been played; before that, the
        // starting currentPlayer hasn't changed yet, so it's equivalent.
        const player1WentFirst = moveHistory && moveHistory.length > 0
          ? moveHistory[0].player === player1Name
          : currentPlayer === 1;

        return player1WentFirst ? players : [players[1], players[0]];
      })().map((player) => {
        // Use the explicitly set playerNumber from the player object
        const playerNumber = player.playerNumber;
        return (
        <PlayerInfoSection
          key={`player-${playerNumber}-${currentPlayer}`}
          playerNumber={playerNumber}
          name={player.isThinking ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {player.name}
              <Box sx={{
                backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(0, 0, 0, 0.15)',
                borderRadius: '12px',
                padding: '4px 12px',
                fontSize: '0.9em',
                fontWeight: 500,
                color: lightMode === 'dark' ? 'rgb(255, 255, 255)' : '#1F2937',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: lightMode === 'dark' ? '0 3px 6px rgba(255, 255, 255, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)',
                  boxShadow: lightMode === 'dark' ? '0 4px 8px rgba(255, 255, 255, 0.25)' : '0 3px 6px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-1px)'
                }
              }}>
                <Box className={styles.thinkingDots}>
                  <div></div>
                  <div></div>
                  <div></div>
                </Box>
              </Box>
            </Box>
          ) : player.name}
          time={player.time}
          points={player.points}
          rack={player.rack}
          color={color}
          onTileClick={onTileClick}
          selectedTiles={selectedTiles}
          isBot={player.isBot}
          currentPlayer={currentPlayer}
          lightMode={lightMode}
          sx={player.isBot ? {
            '& .rack': {
              background: 'linear-gradient(135deg, rgba(0,0,0,0.2), rgba(0,0,0,0.1))',
              borderRadius: '12px',
              padding: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.1)',
              '& > div': {
                transform: 'scale(1.3)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: 'thinking 2s ease-in-out infinite',
                '@keyframes thinking': {
                  '0%': { 
                    transform: 'scale(1.3)'
                  },
                  '50%': { 
                    transform: 'scale(1.35)'
                  },
                  '100%': { 
                    transform: 'scale(1.3)'
                  }
                },
                '&:hover': {
                  transform: 'scale(1.5)',
                  animation: 'none'
                }
              }
            }
          } : undefined}
          mascotRef={player.isBot ? mascotRef : undefined}
          botImage={player.botImage}
          moveStatus={moveStatus}
          isTope={player.isTope}
          topeThinking={topeThinking}
          showTopePrompt={showTopePrompt}
          onToggleTopePrompt={() => setShowTopePrompt(v => !v)}
        />
      );
      })}

      <LatestMove
        latestMove={latestMove}
        player1Name={player1Name}
        player2Name={player2Name}
        allMoves={moveHistory}
        boardCoords={boardCoords}
        player1Rack={player1Rack}
        player2Rack={player2Rack}
        blankTiles={blankTiles}
        pool={pool}
        lightMode={lightMode}
      />

      <TopMoves 
        topMoves={topMoves}
        isLoadingTopMoves={isLoadingTopMoves}
        isDictionaryLoading={isDictionaryLoading}
            onMoveSelect={onMoveSelect}
            onGetTopMoves={onGetTopMoves}
        currentPlayer={currentPlayer}
        gameStarted={gameStarted}
        lightMode={lightMode}
      />
      </>
      )}
    </Box>
  );
}