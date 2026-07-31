import React, { useContext, useState } from 'react';
import Box from '@mui/material/Box';
import { Button, ToggleButton, ToggleButtonGroup, Slider, Checkbox, Radio } from '@mui/material';
import { Play, Stop, Download, CaretDown, CaretUp } from '@phosphor-icons/react';
import Rack from '../../components/AppContent/Board/Rack.js';
import LatestMove from '../Play/components/LatestMove.js';
import SandboxLeaveRules from './SandboxLeaveRules.js';
import SandboxNumberField from './SandboxNumberField.js';
import { useSandboxStore } from '../../stores/sandboxStore';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
import { ThemeContext } from '../../App';
import styles from './Sandbox.module.css';

// 'Static' stays the internal botName (matches sandboxStore.js/
// sandboxBotFunctions.js's rank mechanism) - "Speedy" is just its label here.
// Theo is dropped as its own selectable option - mechanically she's just
// Speedy at rank 1 (getBotRank already returns 1 for 'Theo' and for
// 'Static' rank 1 alike), so rather than a separate button, "(Theo)" is
// appended to the label only when Speedy's rank is 1 - purely a display
// hint in this one spot, not the bot's actual name/identity (leaves
// getBotDisplayName, player names, and GCGs untouched).
const BOT_OPTIONS = [
  { value: 'Static', label: 'Speedy' },
  { value: 'Tess', label: 'Tess' },
  // RulesBot temporarily hidden while its rules get reworked (see
  // rulesbot.go) - the backend/store wiring (sandboxStore.js's isRulesBot
  // payload field, game-count tier, "Plays impacted" formatting, /rulesbot-
  // debug) is all still intact and functional, just unreachable from here
  // since botName can never become 'RulesBot' without this option. Re-add
  // this line to bring it back.
  // { value: 'RulesBot', label: 'RulesBot' },
];

const SandboxPlayerInfo = React.memo(() => {
  const { lightMode } = useContext(ThemeContext);
  const color = useColorSchemeStore(state => state.color);
  const [expandedGames, setExpandedGames] = useState(() => new Set());
  const toggleExpandedGame = (gameIndex) => setExpandedGames(prev => {
    const next = new Set(prev);
    if (next.has(gameIndex)) next.delete(gameIndex); else next.add(gameIndex);
    return next;
  });
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  const player1BotName = useSandboxStore(state => state.player1BotName);
  const player2BotName = useSandboxStore(state => state.player2BotName);
  const player1StaticRank = useSandboxStore(state => state.player1StaticRank);
  const player2StaticRank = useSandboxStore(state => state.player2StaticRank);
  const player1LeaveRules = useSandboxStore(state => state.player1LeaveRules);
  const player2LeaveRules = useSandboxStore(state => state.player2LeaveRules);
  const player1BingoAversion = useSandboxStore(state => state.player1BingoAversion);
  const player2BingoAversion = useSandboxStore(state => state.player2BingoAversion);
  const player1SpecialSelection = useSandboxStore(state => state.player1SpecialSelection);
  const player2SpecialSelection = useSandboxStore(state => state.player2SpecialSelection);
  const totalGames = useSandboxStore(state => state.totalGames);
  // Any static-bot matchup (Theo or a chosen Nth static, either side) runs
  // server-side in bulk and can handle far more games than the per-move
  // client loop Tess still needs - mirrors sandboxStore.js's getMaxGamesForBots.
  // Tess's cost dominates whenever she's present at all (checked first);
  // RulesBot gets its own middle tier (real per-turn board-copy work, but
  // nowhere near Tess's cost); both-static is the only combination cheap
  // enough for 500.
  const isStatic = (name) => name === 'Theo' || name === 'Static';
  const maxGames = (player1BotName === 'Tess' || player2BotName === 'Tess') ? 30
    : (player1BotName === 'RulesBot' || player2BotName === 'RulesBot') ? 200
    : (isStatic(player1BotName) && isStatic(player2BotName)) ? 500 : 30;
  const isRunning = useSandboxStore(state => state.isRunning);
  const currentGameIndex = useSandboxStore(state => state.currentGameIndex);
  const seriesResults = useSandboxStore(state => state.seriesResults);
  const estimatedProgressPercent = useSandboxStore(state => state.estimatedProgressPercent);

  const gameStarted = useSandboxStore(state => state.gameStarted);
  const currentPlayer = useSandboxStore(state => state.currentPlayer);
  const player1Rack = useSandboxStore(state => state.player1Rack);
  const player2Rack = useSandboxStore(state => state.player2Rack);
  const player1Name = useSandboxStore(state => state.player1Name);
  const player2Name = useSandboxStore(state => state.player2Name);
  const player1points = useSandboxStore(state => state.player1points);
  const player2points = useSandboxStore(state => state.player2points);
  const moveHistory = useSandboxStore(state => state.moveHistory);
  const boardCoords = useSandboxStore(state => state.boardCoords);
  const blankTiles = useSandboxStore(state => state.blankTiles);
  const pool = useSandboxStore(state => state.pool);

  const {
    setPlayer1BotName,
    setPlayer2BotName,
    setPlayer1StaticRank,
    setPlayer2StaticRank,
    addLeaveRule,
    updateLeaveRule,
    removeLeaveRule,
    setBingoAversion,
    setPlayer1SpecialSelection,
    setPlayer2SpecialSelection,
    setTotalGames,
    startSeries,
    stopSeries,
    downloadGameGCG,
  } = useSandboxStore();

  // mutedTextColor matches Play's own "secondary" tier (not its faintest
  // one) - the previous #6B7280/0.5 pairing read as too washed out to
  // comfortably read against the light-mode cards.
  const textColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#1F2937';
  const mutedTextColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.65)' : '#4B5563';
  const borderColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.18)';
  const panelBackground = lightMode === 'dark'
    ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%)'
    : '#FFFFFF';
  const panelShadow = lightMode === 'dark'
    ? '0 2px 8px rgba(0, 0, 0, 0.2)'
    : '0 3px 10px rgba(100, 95, 80, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)';

  const latestMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;

  const gamesPlayed = seriesResults.length;
  const player1Wins = seriesResults.filter(r => r.winner === r.player1Name).length;
  const player2Wins = seriesResults.filter(r => r.winner === r.player2Name).length;
  const ties = gamesPlayed - player1Wins - player2Wins;
  const avgPlayer1Score = gamesPlayed > 0
    ? Math.round(seriesResults.reduce((sum, r) => sum + r.player1Score, 0) / gamesPlayed)
    : 0;
  const avgPlayer2Score = gamesPlayed > 0
    ? Math.round(seriesResults.reduce((sum, r) => sum + r.player2Score, 0) / gamesPlayed)
    : 0;

  // Pythagorean (Pythagenpat) expected record - same idea sabermetrics uses
  // for runs scored/allowed, applied to Scrabble points scored/allowed.
  // Unlike the fixed exponent of 2 in the classic Pythagorean formula,
  // Pythagenpat's exponent adapts to the actual scoring environment
  // ((totalPoints/games)^0.287), so it stays well-calibrated whether a
  // matchup is low- or high-scoring. Answers "how many games should this
  // record have been, based on points alone" - a big gap from the actual
  // tally above is a signal of close-game luck (or a personality trait
  // like bingo aversion costing points without costing as many wins).
  const totalPlayer1Points = seriesResults.reduce((sum, r) => sum + r.player1Score, 0);
  const totalPlayer2Points = seriesResults.reduce((sum, r) => sum + r.player2Score, 0);
  let pythPlayer1Wins = gamesPlayed / 2;
  let pythPlayer2Wins = gamesPlayed / 2;
  if (gamesPlayed > 0 && (totalPlayer1Points > 0 || totalPlayer2Points > 0)) {
    const exponent = Math.pow((totalPlayer1Points + totalPlayer2Points) / gamesPlayed, 0.287);
    const player1WinPct = Math.pow(totalPlayer1Points, exponent)
      / (Math.pow(totalPlayer1Points, exponent) + Math.pow(totalPlayer2Points, exponent));
    pythPlayer1Wins = player1WinPct * gamesPlayed;
    pythPlayer2Wins = gamesPlayed - pythPlayer1Wins;
  }

  // 95% confidence interval (Wilson score interval) for player 1's true
  // win probability - "if this series ran forever, what win% would it
  // converge to." Wilson rather than the naive p̂ ± z·SE (Wald) interval:
  // Wald produces nonsensical out-of-[0,1] bounds and has poor coverage at
  // small sample sizes or when p̂ is near 0/1, both common in a short
  // series - Wilson stays well-behaved in exactly those cases. Ties count
  // as "not a win" in the denominator (same as any standard win-rate),
  // consistent with how Tally/player1Wins above are already computed.
  const Z_95 = 1.959963985;
  let player1WinRate = gamesPlayed > 0 ? player1Wins / gamesPlayed : 0.5;
  let winRateCiLow = player1WinRate;
  let winRateCiHigh = player1WinRate;
  if (gamesPlayed > 0) {
    const z2 = Z_95 * Z_95;
    const denominator = 1 + z2 / gamesPlayed;
    const center = (player1WinRate + z2 / (2 * gamesPlayed)) / denominator;
    const margin = (Z_95 / denominator) * Math.sqrt(
      (player1WinRate * (1 - player1WinRate)) / gamesPlayed + z2 / (4 * gamesPlayed * gamesPlayed)
    );
    winRateCiLow = Math.max(0, center - margin);
    winRateCiHigh = Math.min(1, center + margin);
  }

  const sectionSx = {
    padding: '12px',
    background: panelBackground,
    borderRadius: '8px',
    boxShadow: panelShadow,
    border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(140, 130, 110, 0.28)',
  };

  const labelSx = {
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: mutedTextColor,
    opacity: 0.7,
    marginBottom: '6px',
  };

  const accentColor = lightMode === 'dark' ? '#10B981' : '#059669';

  const toggleButtonSx = {
    flex: 1,
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: 'Syne, sans-serif',
    textTransform: 'none',
    color: mutedTextColor,
    borderColor: borderColor,
    padding: '5px 4px',
    '&.Mui-selected': {
      backgroundColor: lightMode === 'dark' ? 'rgba(16, 185, 129, 0.22)' : 'rgba(5, 150, 105, 0.15)',
      color: accentColor,
      borderColor: accentColor,
    },
    '&.Mui-selected:hover': {
      backgroundColor: lightMode === 'dark' ? 'rgba(16, 185, 129, 0.32)' : 'rgba(5, 150, 105, 0.25)',
    },
  };

  const sliderSx = {
    color: accentColor,
    padding: '10px 0 4px',
    '& .MuiSlider-valueLabel': {
      backgroundColor: accentColor,
      fontSize: '10px',
      fontWeight: 700,
      fontFamily: 'Syne, sans-serif',
    },
    '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
      boxShadow: `0 0 0 8px ${lightMode === 'dark' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(5, 150, 105, 0.16)'}`,
    },
  };

  const checkboxSx = {
    padding: '2px', color: mutedTextColor,
    '&.Mui-checked': { color: accentColor },
  };

  const gamesCompleted = seriesResults.length;
  const realProgressPercent = totalGames > 0 ? Math.min(100, Math.round((gamesCompleted / totalGames) * 100)) : 0;
  // Whichever signal is further along wins - the time-based estimate covers
  // the network/compute wait before any game result exists yet, then real
  // per-game progress overtakes it once results start arriving.
  const seriesProgressPercent = Math.max(realProgressPercent, estimatedProgressPercent);
  // The "X/Y" count is meaningless while no game has finished yet (it just
  // sits at "0/500" for the whole bulk-request wait) - fall back to the
  // same time-based estimate driving the fill until real results exist.
  const progressLabel = gamesCompleted > 0
    ? `${gamesCompleted}/${totalGames}`
    : (isRunning && estimatedProgressPercent > 0)
      ? `~${estimatedProgressPercent}%`
      : `${gamesCompleted}/${totalGames}`;

  return (
    <Box className={styles.playerPanel}>
      {/* Setup - each player and the run controls get their own card, same
          pattern as the Live/Results sections below, instead of one giant
          block - matches how the rest of the app (e.g. Play's Candidates
          panel) stacks distinct elevated cards rather than one flat sheet. */}
      <Box sx={labelSx}>Series Setup</Box>
      {[
        {
          botName: player1BotName, setBotName: setPlayer1BotName, rank: player1StaticRank, setRank: setPlayer1StaticRank, label: 'Player 1',
          leaveRules: player1LeaveRules, addRule: () => addLeaveRule(1), updateRule: (i, patch) => updateLeaveRule(1, i, patch), removeRule: (i) => removeLeaveRule(1, i),
          bingoAversion: player1BingoAversion, setBingoAv: (patch) => setBingoAversion(1, patch),
          specialSelection: player1SpecialSelection, setSpecialSelection: setPlayer1SpecialSelection,
        },
        {
          botName: player2BotName, setBotName: setPlayer2BotName, rank: player2StaticRank, setRank: setPlayer2StaticRank, label: 'Player 2',
          leaveRules: player2LeaveRules, addRule: () => addLeaveRule(2), updateRule: (i, patch) => updateLeaveRule(2, i, patch), removeRule: (i) => removeLeaveRule(2, i),
          bingoAversion: player2BingoAversion, setBingoAv: (patch) => setBingoAversion(2, patch),
          specialSelection: player2SpecialSelection, setSpecialSelection: setPlayer2SpecialSelection,
        },
      ].map((side, i) => {
        // "Longest word"/"Most tiles" are absolute overrides (simulate.go's
        // BotConfig.SpecialSelection) - no conjunction with rank, leave
        // rules, or bingo aversion is allowed, so those controls are
        // disabled outright rather than trying to reconcile them. Gated on
        // botName === 'Static' (not just specialSelection !== '') so a
        // leftover selection from a previous Static session doesn't leak
        // into disabling LeaveRules/BingoAversion after switching to Tess
        // or RulesBot - those controls are hidden for Tess anyway, but
        // RulesBot actually uses them, so a stale flag here would silently
        // disable something that should work.
        const specialActive = side.botName === 'Static' && side.specialSelection !== '';
        return (
        <React.Fragment key={side.label}>
          {i === 1 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0' }}>
              <Box sx={{ flex: 1, height: '1px', backgroundColor: borderColor }} />
              <Box sx={{ fontSize: '10px', fontWeight: 700, color: mutedTextColor }}>VS</Box>
              <Box sx={{ flex: 1, height: '1px', backgroundColor: borderColor }} />
            </Box>
          )}
          <Box sx={i === 0 ? sectionSx : { ...sectionSx, marginTop: '10px' }}>
            <Box sx={{ fontSize: '10px', fontWeight: 600, color: mutedTextColor, marginBottom: '6px' }}>{side.label}</Box>
            <ToggleButtonGroup
              value={side.botName}
              exclusive
              fullWidth
              size="small"
              disabled={isRunning}
              onChange={(e, val) => val && side.setBotName(val)}
              sx={{ marginBottom: '16px' }}
            >
              {BOT_OPTIONS.map(opt => (
                <ToggleButton key={opt.value} value={opt.value} sx={toggleButtonSx}>
                  {opt.value === 'Static' && side.botName === 'Static'
                    ? (side.specialSelection === 'longestWord' ? 'Longest Word'
                      : side.specialSelection === 'mostTiles' ? 'Most Tiles'
                        : `Speedy${side.rank}${side.rank === 1 ? ' (Theo)' : ''}`)
                    : opt.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {side.botName === 'Static' && (
              <Box sx={{ padding: '0 10px', marginBottom: '10px' }}>
                <Slider
                  size="small"
                  value={side.rank}
                  onChange={(e, val) => side.setRank(val)}
                  min={1}
                  max={15}
                  step={1}
                  disabled={isRunning || specialActive}
                  sx={sliderSx}
                />
              </Box>
            )}
            {/* Speedy-only override modes (simulate.go's
                BotConfig.SpecialSelection) - absolute, no conjunction with
                rank/leave rules/bingo aversion, so selecting either one
                disables all of those below instead of trying to combine
                them. */}
            {side.botName === 'Static' && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: '32px', rowGap: '4px', marginBottom: '10px' }}>
                {[
                  { value: '', label: 'Normal' },
                  { value: 'longestWord', label: 'Longest word' },
                  { value: 'mostTiles', label: 'Most tiles' },
                ].map((opt) => {
                  // Entering a special-selection mode also actually clears
                  // (not just visually disables) both bingo-aversion
                  // checkboxes - leaving them checked-but-disabled would
                  // look like they're still in effect when they're not.
                  const selectOpt = () => {
                    if (isRunning) return;
                    side.setSpecialSelection(opt.value);
                    if (opt.value !== '') {
                      side.setBingoAv({ probabilityEnabled: false, rankLimitEnabled: false });
                    }
                  };
                  return (
                    <Box
                      key={opt.value || 'normal'}
                      onClick={selectOpt}
                      sx={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: isRunning ? 'default' : 'pointer' }}
                    >
                      <Radio
                        size="small"
                        checked={side.specialSelection === opt.value}
                        disabled={isRunning}
                        onChange={selectOpt}
                        sx={checkboxSx}
                      />
                      <Box sx={{ fontSize: '11px', color: textColor }}>{opt.label}</Box>
                    </Box>
                  );
                })}
              </Box>
            )}
            {/* Tess ignores LeaveRules entirely server-side (simulate.go's
                pickTessCandidate always uses the plain baselineTotal) -
                hiding the editor for her keeps the UI honest instead of
                letting someone configure rules that silently do nothing. */}
            {side.botName !== 'Tess' && (
              <SandboxLeaveRules
                rules={side.leaveRules}
                onAdd={side.addRule}
                onUpdate={side.updateRule}
                onRemove={side.removeRule}
                disabled={isRunning || specialActive}
                textColor={textColor}
                mutedTextColor={mutedTextColor}
                borderColor={borderColor}
                accentColor={accentColor}
              />
            )}
            {/* Comedically self-defeating: excludes 7-tile plays from this
                bot's own candidate pool before ranking, so she'll pass up
                a bingo even if it's the best move on the board. simulate.go
                actually applies this uniformly regardless of Tess/rank-based
                (it filters the pool before either selection mechanism sees
                it) - hidden for Tess here anyway, UI-only for now. */}
            {side.botName !== 'Tess' && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Checkbox
                    size="small"
                    checked={side.bingoAversion.probabilityEnabled}
                    disabled={isRunning || specialActive}
                    onChange={(e) => side.setBingoAv({ probabilityEnabled: e.target.checked })}
                    sx={checkboxSx}
                  />
                  <Box sx={{ fontSize: '11px', color: textColor }}>Avoid bingos</Box>
                </Box>
                {side.bingoAversion.probabilityEnabled && (
                  <Box sx={{ padding: '0 10px 4px' }}>
                    <Box sx={{ fontSize: '10px', color: mutedTextColor, marginBottom: '2px' }}>
                      Chance to skip a bingo: {Math.round(side.bingoAversion.probability * 100)}%
                    </Box>
                    <Slider
                      size="small"
                      value={side.bingoAversion.probability}
                      onChange={(e, val) => side.setBingoAv({ probability: val })}
                      min={0}
                      max={1}
                      step={0.05}
                      disabled={isRunning || specialActive}
                      sx={sliderSx}
                    />
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <Checkbox
                    size="small"
                    checked={side.bingoAversion.rankLimitEnabled}
                    disabled={isRunning || specialActive}
                    onChange={(e) => side.setBingoAv({ rankLimitEnabled: e.target.checked })}
                    sx={checkboxSx}
                  />
                  <Box sx={{ fontSize: '11px', color: textColor }}>Limit bingo vocabulary</Box>
                </Box>
                {side.bingoAversion.rankLimitEnabled && (
                  <Box sx={{ padding: '0 10px 4px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <Box sx={{ fontSize: '10px', color: mutedTextColor }}>Only knows the top</Box>
                      <SandboxNumberField
                        value={side.bingoAversion.maxProbabilityRank}
                        onCommit={(n) => side.setBingoAv({ maxProbabilityRank: n })}
                        parse={(s) => parseInt(s, 10)}
                        min={1}
                        disabled={isRunning || specialActive}
                        sx={{ '& .MuiInputBase-input': { fontSize: '11px', color: textColor, width: '56px', padding: '3px 6px' } }}
                      />
                      <Box sx={{ fontSize: '10px', color: mutedTextColor }}>most common 7s/8s</Box>
                    </Box>
                    <Box sx={{ fontSize: '9px', color: mutedTextColor, marginTop: '4px', lineHeight: 1.4 }}>
                      Ranked by NWL23 probability order, separately for 7s and 8s. 9+ letter bingos are never restricted by this.
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>
        </React.Fragment>
        );
      })}

      <Box sx={{ ...sectionSx, marginTop: '10px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Box sx={{ fontSize: '12px', color: textColor }}>Number of games</Box>
          <SandboxNumberField
            value={totalGames}
            onCommit={setTotalGames}
            parse={(s) => parseInt(s, 10)}
            min={1}
            max={maxGames}
            disabled={isRunning}
            sx={{ '& .MuiInputBase-input': { fontSize: '13px', color: textColor, width: '50px' } }}
          />
        </Box>
        <Box sx={{ fontSize: '11px', color: mutedTextColor, marginBottom: '4px', lineHeight: 1.4 }}>
          Note: series with Tess are capped at 30 games; series with only static bots (Theo or Speedy, either side) are capped at 500.
        </Box>
        <Box sx={{ fontSize: '11px', color: mutedTextColor, marginBottom: '12px', lineHeight: 1.4 }}>
          Series over 30 games skip the move-by-move animation and jump straight to the final board and results - every game still gets its own downloadable GCG.
        </Box>
        <Button
          fullWidth
          variant="contained"
          disableElevation
          onClick={() => isRunning ? stopSeries() : startSeries()}
          sx={{
            textTransform: 'none',
            fontFamily: 'Syne, sans-serif',
            position: 'relative',
            overflow: 'hidden',
            // Text stays white throughout instead of matching the fill's
            // red - text and fill being the same #DC2626 meant the label
            // visually vanished into itself wherever the fill had already
            // swept past it. Track and fill are now two different
            // dark-enough reds (not a pale tint) so white reads clearly
            // against both the unfilled and filled portions.
            backgroundColor: isRunning ? '#991B1B' : '#059669',
            color: '#fff',
            '&:hover': { backgroundColor: isRunning ? '#7F1D1D' : '#047857' },
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: isRunning ? `${seriesProgressPercent}%` : '0%',
              backgroundColor: '#DC2626',
              transition: 'width 0.2s ease',
            },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isRunning ? <Stop weight="fill" size={16} /> : <Play weight="fill" size={16} />}
            {isRunning ? `Stop (${progressLabel})` : 'Start Series'}
          </Box>
        </Button>
      </Box>

      {/* Live */}
      {gameStarted && (
        <Box sx={{ ...sectionSx, marginTop: '16px' }}>
          <Box sx={labelSx}>
            Game {currentGameIndex + 1} of {totalGames}
          </Box>
          <Box sx={{ fontSize: '13px', fontWeight: 600, color: textColor, textAlign: 'center', marginBottom: '10px' }}>
            {currentPlayer === 1 ? player1Name : player2Name}'s turn
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', marginBottom: '8px' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ fontSize: '11px', color: mutedTextColor }}>{player1Name}</Box>
              <Box sx={{ fontSize: '16px', fontWeight: 'bold', color: '#D97706' }}>{player1points}</Box>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ fontSize: '11px', color: mutedTextColor }}>{player2Name}</Box>
              <Box sx={{ fontSize: '16px', fontWeight: 'bold', color: '#D97706' }}>{player2points}</Box>
            </Box>
          </Box>
          <Box className={styles.Rack} sx={{ marginBottom: '4px' }}>
            <Rack rack={currentPlayer === 1 ? player1Rack : player2Rack} color={color.current} selectedTiles={[]} />
          </Box>
        </Box>
      )}

      {gameStarted && (
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
      )}

      {/* Results */}
      {gamesPlayed > 0 && (
        <Box sx={{ ...sectionSx, marginTop: '16px' }}>
          <Box sx={labelSx}>Series Results</Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', marginBottom: '10px', fontSize: '12px', color: textColor }}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ fontWeight: 'bold' }}>{player1Wins}-{player2Wins}{ties > 0 ? `-${ties}` : ''}</Box>
              <Box sx={{ fontSize: '10px', color: mutedTextColor }}>Tally</Box>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ fontWeight: 'bold' }}>{avgPlayer1Score}</Box>
              <Box sx={{ fontSize: '10px', color: mutedTextColor }}>Avg {seriesResults[0]?.player1Name}</Box>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ fontWeight: 'bold' }}>{avgPlayer2Score}</Box>
              <Box sx={{ fontSize: '10px', color: mutedTextColor }}>Avg {seriesResults[0]?.player2Name}</Box>
            </Box>
          </Box>

          <Box
            onClick={() => setShowAdvancedStats(v => !v)}
            sx={{
              display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer',
              fontSize: '10px', fontWeight: 600, color: accentColor, marginBottom: showAdvancedStats ? '8px' : '10px',
            }}
          >
            {showAdvancedStats ? <CaretUp size={11} weight="bold" /> : <CaretDown size={11} weight="bold" />}
            Advanced stats
          </Box>
          {showAdvancedStats && (
            <Box sx={{ padding: '8px', marginBottom: '10px', borderRadius: '6px', border: `1px dashed ${borderColor}` }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', rowGap: '10px', fontSize: '12px', color: textColor }}>
                <Box sx={{ textAlign: 'center', minWidth: '45%' }}>
                  <Box sx={{ fontWeight: 'bold' }}>{pythPlayer1Wins.toFixed(1)}-{pythPlayer2Wins.toFixed(1)}</Box>
                  <Box sx={{ fontSize: '10px', color: mutedTextColor, marginTop: '2px' }}>Pythagorean W-L</Box>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: '45%' }}>
                  <Box sx={{ fontWeight: 'bold' }}>{Math.round(player1WinRate * 100)}%</Box>
                  <Box sx={{ fontSize: '10px', color: mutedTextColor, marginTop: '2px' }}>
                    {seriesResults[0]?.player1Name} true win rate
                  </Box>
                </Box>
              </Box>
              <Box sx={{ fontSize: '9px', color: mutedTextColor, marginTop: '8px', lineHeight: 1.4 }}>
                Pythagorean W-L: expected record based on total points scored/allowed (Pythagenpat), rather than who actually won each game - a big gap from the Tally above signals close-game variance.
                {' '}95% CI: {Math.round(winRateCiLow * 100)}-{Math.round(winRateCiHigh * 100)}% is the range {seriesResults[0]?.player1Name}'s true win probability would most likely fall in in an infinitely long series, given this sample (Wilson score interval).
              </Box>
            </Box>
          )}
          <Box sx={{ maxHeight: '260px', overflowY: 'auto' }}>
            {seriesResults.map((result) => {
              const impactedCount = result.impactedTurns?.length || 0;
              const isExpanded = expandedGames.has(result.gameIndex);
              return (
                <Box
                  key={result.gameIndex}
                  sx={{ padding: '6px 0', borderBottom: `1px solid ${borderColor}` }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: textColor,
                    }}
                  >
                    <Box>Game {result.gameIndex + 1}</Box>
                    <Box sx={{ color: mutedTextColor }}>
                      {result.player1Score} - {result.player2Score}
                      {result.winner ? '' : ' (tie)'}
                    </Box>
                    <Box
                      onClick={() => downloadGameGCG(result)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        color: mutedTextColor,
                        '&:hover': { color: textColor }
                      }}
                    >
                      <Download size={14} />
                      GCG
                    </Box>
                  </Box>

                  {impactedCount > 0 && (
                    <Box sx={{ marginTop: '4px' }}>
                      <Box
                        onClick={() => toggleExpandedGame(result.gameIndex)}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer',
                          fontSize: '10px', fontWeight: 600, color: accentColor,
                        }}
                      >
                        {isExpanded ? <CaretUp size={11} weight="bold" /> : <CaretDown size={11} weight="bold" />}
                        Plays impacted ({impactedCount})
                      </Box>
                      {isExpanded && (
                        <Box sx={{ marginTop: '4px', paddingLeft: '6px', borderLeft: `2px solid ${borderColor}` }}>
                          {/* A single run-on sentence per row wrapped at a
                              different point on every row (line length
                              depends on the words/scores involved), which
                              read as random left indents. A fixed two-line
                              block per turn - label line, then a flex row
                              that wraps as whole chips instead of mid-word -
                              keeps every row's left edge identical. */}
                          {result.impactedTurns.map((t) => (
                            <Box key={t.turnIndex} sx={{ marginBottom: '6px' }}>
                              <Box sx={{ fontSize: '9px', color: mutedTextColor, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                Turn {t.turnIndex + 1} · {t.playerName}
                              </Box>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px', fontSize: '10px', marginTop: '1px' }}>
                                <Box component="span" sx={{ color: textColor, fontWeight: 600 }}>{t.actual}</Box>
                              </Box>
                              {/* A turn can be flagged by more than one
                                  mechanism at once (a leave rule AND bingo
                                  aversion) - each gets its own "instead of"
                                  line, since they're separate what-if
                                  questions with separate answers. */}
                              {t.reasons.map((r) => (
                                <Box
                                  key={r.label}
                                  sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px', fontSize: '10px', marginTop: '1px' }}
                                >
                                  <Box component="span" sx={{ color: mutedTextColor }}>instead of</Box>
                                  <Box component="span" sx={{ color: mutedTextColor, textDecoration: 'line-through' }}>{r.without}</Box>
                                  <Box component="span" sx={{ color: mutedTextColor, fontStyle: 'italic' }}>({r.label})</Box>
                                </Box>
                              ))}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
});

export default SandboxPlayerInfo;
