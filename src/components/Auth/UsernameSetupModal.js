import React, { useState, useEffect, useContext } from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeContext } from '../../App';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'min(420px, 92vw)',
  bgcolor: 'background.paper',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
  p: 3,
  borderRadius: 3,
};

export default function UsernameSetupModal({ open, onClose }) {
  const { lightMode } = useContext(ThemeContext);
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const initial =
        profile?.username && !/^user_[0-9a-f]{8}$/i.test(profile.username)
          ? profile.username
          : (user?.email?.split('@')[0] || '').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      setUsername(initial || '');
      setError('');
    }
  }, [open, profile, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmed = (username || '').trim();
    if (!trimmed) {
      setError('Username is required.');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
      setError('Username must be 3-20 characters and use only letters, numbers, and underscores.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await updateProfile({
        username: trimmed.toLowerCase(),
        display_name: trimmed,
      });
      if (updateError) {
        if (updateError.code === '23505') {
          setError('That username is taken. Please choose another one.');
        } else {
          setError(updateError.message || 'Failed to save username.');
        }
        return;
      }
      // Ensure we have the freshest profile from the database
      if (refreshProfile) {
        await refreshProfile();
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save username.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="username-setup-title"
      aria-describedby="username-setup-description"
    >
      <Box
        sx={{
          ...style,
          bgcolor: lightMode === 'dark' ? '#1F2937' : '#fff',
          border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.10)' : '1px solid rgba(0, 0, 0, 0.10)',
        }}
      >
        <Typography
          id="username-setup-title"
          variant="overline"
          component="p"
          sx={{
            mb: 1.5,
            color: lightMode === 'dark' ? 'rgba(249,250,251,0.8)' : '#6B7280',
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          Profile
        </Typography>

        <Box
          sx={{
            borderRadius: 2,
            mb: 2.5,
            backgroundColor: lightMode === 'dark' ? 'rgba(55, 65, 81, 0.7)' : 'rgba(249, 250, 251, 0.95)',
            border: lightMode === 'dark'
              ? '1px solid rgba(217, 119, 6, 0.18)'
              : '1px solid rgba(217, 119, 6, 0.2)',
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              backgroundColor: lightMode === 'dark'
                ? 'rgba(217, 119, 6, 0.22)'
                : 'rgba(217, 119, 6, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <img
              src="/images/fox-icon.svg"
              alt="Fox icon"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                fontSize: 13,
                color: lightMode === 'dark' ? '#F9FAFB' : '#1F2937',
              }}
            >
              Choose a username
            </Typography>
            <Typography
              id="username-setup-description"
              variant="body2"
              sx={{
                fontSize: 12.5,
                color: lightMode === 'dark' ? 'rgba(249,250,251,0.8)' : '#4B5563',
              }}
            >
              This is the name other players will see in lobbies, leaderboards, and results.
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            fullWidth
            autoComplete="username"
            helperText="3-20 chars: letters, numbers, underscores."
            sx={{
              '& .MuiOutlinedInput-root': {
                color: lightMode === 'dark' ? '#fff' : '#1F2937',
                '& fieldset': {
                  borderColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                },
              },
              '& .MuiInputLabel-root': {
                color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              },
              '& .MuiFormHelperText-root': {
                color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)',
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading || !username.trim()}
            sx={{
              mt: 1,
              bgcolor: '#D97706',
              boxShadow: '6px 0px 0px #B45309',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              letterSpacing: '0.06em',
              '&:hover': {
                bgcolor: '#B45309',
              },
            }}
          >
            {loading ? 'Saving...' : 'Save username'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

