import React, { useContext } from 'react';
import Box from '@mui/material/Box';
import { IconButton } from '@mui/material';
import { ArrowLeft, ArrowRight, ArrowLineLeft, ArrowLineRight } from '@phosphor-icons/react';
import { useSandboxStore } from '../../stores/sandboxStore';
import { ThemeContext } from '../../App';

// Self-gating (renders null unless a game is actually being viewed) turn-
// navigation row - used in two places (SandboxPlayerInfo.js's "Viewing
// Game" panel, and again directly below the board in Sandbox.js) so
// stepping through a viewed game is reachable without looking away from
// whichever one you're focused on, without duplicating this logic/JSX
// twice by hand.
export default function SandboxViewNav() {
  const { lightMode } = useContext(ThemeContext);
  const viewingGameIndex = useSandboxStore(state => state.viewingGameIndex);
  const viewingTurnIndex = useSandboxStore(state => state.viewingTurnIndex);
  const seriesResults = useSandboxStore(state => state.seriesResults);
  const viewGoToStart = useSandboxStore(state => state.viewGoToStart);
  const viewStepBack = useSandboxStore(state => state.viewStepBack);
  const viewStepForward = useSandboxStore(state => state.viewStepForward);
  const viewGoToEnd = useSandboxStore(state => state.viewGoToEnd);

  const currentViewedResult = viewingGameIndex === null
    ? null
    : seriesResults.find(r => r.gameIndex === viewingGameIndex) || null;

  if (!currentViewedResult) return null;

  const mutedTextColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.65)' : '#4B5563';
  const textColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#1F2937';
  const accentColor = lightMode === 'dark' ? '#10B981' : '#059669';

  const atStart = viewingTurnIndex <= -1;
  const atEnd = viewingTurnIndex >= currentViewedResult.moveHistory.length - 1;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
      <IconButton
        size="small"
        disabled={atStart}
        onClick={viewGoToStart}
        sx={{ color: atStart ? mutedTextColor : accentColor, opacity: atStart ? 0.4 : 1 }}
      >
        <ArrowLineLeft size={16} weight="bold" />
      </IconButton>
      <IconButton
        size="small"
        disabled={atStart}
        onClick={viewStepBack}
        sx={{ color: atStart ? mutedTextColor : accentColor, opacity: atStart ? 0.4 : 1 }}
      >
        <ArrowLeft size={16} weight="bold" />
      </IconButton>
      <Box sx={{ fontSize: '11px', color: textColor, minWidth: '76px', textAlign: 'center' }}>
        {atStart ? 'Start' : `Turn ${viewingTurnIndex + 1} / ${currentViewedResult.moveHistory.length}`}
      </Box>
      <IconButton
        size="small"
        disabled={atEnd}
        onClick={viewStepForward}
        sx={{ color: atEnd ? mutedTextColor : accentColor, opacity: atEnd ? 0.4 : 1 }}
      >
        <ArrowRight size={16} weight="bold" />
      </IconButton>
      <IconButton
        size="small"
        disabled={atEnd}
        onClick={viewGoToEnd}
        sx={{ color: atEnd ? mutedTextColor : accentColor, opacity: atEnd ? 0.4 : 1 }}
      >
        <ArrowLineRight size={16} weight="bold" />
      </IconButton>
    </Box>
  );
}
