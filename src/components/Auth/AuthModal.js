import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeContext } from '../../App';
import { useContext } from 'react';

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

export default function AuthModal({ open, onClose, initialMode = 'signin' }) {
  const { lightMode } = useContext(ThemeContext);
  const [mode, setMode] = useState(initialMode); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithUsername, signInWithOAuth, signUp, user, isConfigured } = useAuth();

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  // Close modal when user successfully signs in
  useEffect(() => {
    if (user && open) {
      onClose();
      // Reset form
      setEmail('');
      setPassword('');
      setUsername('');
      setDisplayName('');
      setError('');
      setMode('signin');
    }
  }, [user, open, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signInWithUsername(username, password);
        if (error) throw error;
        onClose();
      } else {
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, username, displayName || username);
        if (error) throw error;
        setError('');
        setMode('signin');
        setError('Account created! Please sign in.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
    setPassword('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="auth-modal-title"
      aria-describedby="auth-modal-description"
    >
      <Box
        sx={{
          ...style,
          bgcolor: lightMode === 'dark' ? '#1F2937' : '#fff',
          border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.10)' : '1px solid rgba(0, 0, 0, 0.10)',
        }}
      >
        <Typography
          id="auth-modal-title"
          variant="h6"
          component="h2"
          sx={{
            mb: 2,
            color: lightMode === 'dark' ? '#fff' : '#1F2937',
            fontWeight: 600,
          }}
        >
          {mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </Typography>

        {!isConfigured && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Supabase isn’t configured, so auth won’t work yet. Set `REACT_APP_SUPABASE_URL` and
            `REACT_APP_SUPABASE_ANON_KEY`.
          </Alert>
        )}

        {error && (
          <Alert
            severity={error.includes('created') ? 'success' : 'error'}
            sx={{ mb: 2 }}
          >
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
            helperText={mode === 'signin' ? 'Use your username (not email).' : '3-20 chars: letters, numbers, underscores.'}
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
              }
            }}
          />

          {mode === 'signup' && (
            <>
              <TextField
                label="Display Name (optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                fullWidth
                autoComplete="nickname"
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
                }}
              />
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                autoComplete="email"
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
                }}
              />
            </>
          )}

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
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
            }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={
              loading ||
              !username.trim() ||
              !password ||
              (mode === 'signup' && !email.trim())
            }
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
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>

          {mode === 'signin' && (
            <>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mt: 0.5,
                  mb: 0.5,
                  opacity: lightMode === 'dark' ? 0.85 : 0.75,
                }}
              >
                <Box sx={{ flex: 1, height: '1px', background: lightMode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }} />
                <Box sx={{ fontSize: 12, color: lightMode === 'dark' ? 'rgba(255,255,255,0.75)' : 'rgba(31,41,55,0.7)' }}>
                  or
                </Box>
                <Box sx={{ flex: 1, height: '1px', background: lightMode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }} />
              </Box>

              <Button
                variant="outlined"
                onClick={async () => {
                  setError('');
                  setLoading(true);
                  try {
                    const { error } = await signInWithOAuth('google');
                    if (error) throw error;
                  } catch (err) {
                    setError(err.message || 'SSO failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                sx={{
                  borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  color: lightMode === 'dark' ? '#fff' : '#1F2937',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                    backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                Continue with Google
              </Button>

              <Button
                variant="outlined"
                onClick={async () => {
                  setError('');
                  setLoading(true);
                  try {
                    const { error } = await signInWithOAuth('github');
                    if (error) throw error;
                  } catch (err) {
                    setError(err.message || 'SSO failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                sx={{
                  borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  color: lightMode === 'dark' ? '#fff' : '#1F2937',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                    backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                Continue with GitHub
              </Button>
            </>
          )}

          <Button
            onClick={switchMode}
            sx={{
              color: lightMode === 'dark' ? '#60A5FA' : '#3B82F6',
              textTransform: 'none',
            }}
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

