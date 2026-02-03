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
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
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
  const { signIn, signUp, user } = useAuth();

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
        const { error } = await signIn(email, password);
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
          border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
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

        {error && (
          <Alert
            severity={error.includes('created') ? 'success' : 'error'}
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {mode === 'signup' && (
            <>
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                fullWidth
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
                label="Display Name (optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                fullWidth
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
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
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
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
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
              !email.trim() ||
              !password ||
              (mode === 'signup' && !username.trim())
            }
            sx={{
              mt: 1,
              bgcolor: '#D97706',
              '&:hover': {
                bgcolor: '#B45309',
              },
            }}
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </Button>

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

