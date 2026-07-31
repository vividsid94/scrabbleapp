import React, { useContext } from 'react';
import { Modal, Box, Typography, Button, FormControl, Select, MenuItem } from '@mui/material';
import { ThemeContext } from '../../App';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
import { useGameStore } from '../../stores/gameStore';

/**
 * Board color, tile color, decorations, and sound - the same settings
 * Profile.js's "Appearance"/"Board & sound" sections expose, but reachable
 * without visiting /profile (which reads from Supabase, currently
 * unconfigured - see utils/supabase.js's hasRealCredentials check). All of
 * this state already lives in colorSchemeStore/gameStore, not Supabase, so
 * it works identically signed in or signed out; this modal just gives it a
 * home that doesn't depend on auth.
 */
export default function LoggedOutVisualSettings({ open, onClose }) {
  const { lightMode } = useContext(ThemeContext);

  const color = useColorSchemeStore(state => state.color);
  const boardColor = useColorSchemeStore(state => state.boardColor);
  const showWoodenCircle = useColorSchemeStore(state => state.showWoodenCircle);
  const showApplePolygon = useColorSchemeStore(state => state.showApplePolygon);
  const updateColor = useColorSchemeStore(state => state.updateColor);
  const updateBoardColor = useColorSchemeStore(state => state.updateBoardColor);
  const updateShowWoodenCircle = useColorSchemeStore(state => state.updateShowWoodenCircle);
  const updateShowApplePolygon = useColorSchemeStore(state => state.updateShowApplePolygon);

  const playerMoveSoundType = useGameStore(state => state.playerMoveSoundType);
  const botMoveSoundType = useGameStore(state => state.botMoveSoundType);
  const setPlayerMoveSoundType = useGameStore(state => state.setPlayerMoveSoundType);
  const setBotMoveSoundType = useGameStore(state => state.setBotMoveSoundType);

  const labelSx = { fontSize: 11, color: lightMode === 'dark' ? '#E5E7EB' : '#4B5563', mb: 0.5, display: 'block' };
  const selectSx = {
    backgroundColor: lightMode === 'dark' ? 'rgba(15,23,42,0.9)' : '#FFFFFF',
    color: lightMode === 'dark' ? '#F9FAFB' : '#111827',
    fontSize: 12,
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="visual-settings-modal-title"
      BackdropProps={{ sx: { backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)' } }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: 420,
          maxHeight: '85vh',
          overflowY: 'auto',
          p: 2.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          backgroundColor: lightMode === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          boxShadow: lightMode === 'dark'
            ? '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
        }}
      >
        <Typography
          id="visual-settings-modal-title"
          component="h2"
          sx={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: lightMode === 'dark' ? 'rgba(251, 191, 36, 0.95)' : '#B45309',
            textAlign: 'center',
            mb: 2,
            pb: 1,
            borderBottom: '1px solid',
            borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          }}
        >
          Visual Settings
        </Typography>

        {/* Colors */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="caption" sx={labelSx}>Tile color</Typography>
            <input
              type="color"
              value={color.current}
              onChange={(e) => updateColor(e.target.value)}
              style={{ width: 44, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="caption" sx={labelSx}>Board color</Typography>
            <input
              type="color"
              value={boardColor.current}
              onChange={(e) => {
                updateBoardColor(e.target.value);
                document.documentElement.style.setProperty('--board-color', e.target.value);
              }}
              style={{ width: 44, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
            />
          </Box>
        </Box>

        {/* Decorations */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={labelSx}>Board decoration</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant={showWoodenCircle.current ? 'contained' : 'outlined'}
              size="small"
              onClick={() => { updateShowWoodenCircle(true); updateShowApplePolygon(false); }}
              sx={{ textTransform: 'none', fontSize: 11, px: 1.4, borderRadius: 999 }}
            >
              Wood
            </Button>
            <Button
              variant={showApplePolygon.current ? 'contained' : 'outlined'}
              size="small"
              onClick={() => { updateShowWoodenCircle(false); updateShowApplePolygon(true); }}
              sx={{ textTransform: 'none', fontSize: 11, px: 1.4, borderRadius: 999 }}
            >
              Red circle
            </Button>
            <Button
              variant={!showWoodenCircle.current && !showApplePolygon.current ? 'contained' : 'outlined'}
              size="small"
              onClick={() => { updateShowWoodenCircle(false); updateShowApplePolygon(false); }}
              sx={{ textTransform: 'none', fontSize: 11, px: 1.4, borderRadius: 999 }}
            >
              None
            </Button>
          </Box>
        </Box>

        {/* Sound */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
          <FormControl fullWidth size="small">
            <Typography variant="caption" sx={labelSx}>Player move sound</Typography>
            <Select value={playerMoveSoundType} onChange={(e) => setPlayerMoveSoundType(e.target.value)} sx={selectSx}>
              <MenuItem value="classic" sx={{ fontSize: 12 }}>Classic</MenuItem>
              <MenuItem value="sword" sx={{ fontSize: 12 }}>Sword</MenuItem>
              <MenuItem value="puzzle" sx={{ fontSize: 12 }}>Puzzle</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <Typography variant="caption" sx={labelSx}>Bot move sound</Typography>
            <Select value={botMoveSoundType} onChange={(e) => setBotMoveSoundType(e.target.value)} sx={selectSx}>
              <MenuItem value="classic" sx={{ fontSize: 12 }}>Classic</MenuItem>
              <MenuItem value="sword" sx={{ fontSize: 12 }}>Sword</MenuItem>
              <MenuItem value="puzzle" sx={{ fontSize: 12 }}>Puzzle</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box
            component="button"
            onClick={onClose}
            sx={{
              px: 2,
              py: 1,
              fontSize: 14,
              fontWeight: 600,
              color: lightMode === 'dark' ? '#94A3B8' : '#64748B',
              border: '1px solid',
              borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
              borderRadius: 1.5,
              cursor: 'pointer',
              background: 'transparent',
              '&:hover': { background: lightMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
            }}
          >
            Done
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
