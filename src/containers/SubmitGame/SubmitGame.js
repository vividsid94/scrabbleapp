import React, { useState } from 'react';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeContext } from '../../App';
import styles from './SubmitGame.module.css';

export default function SubmitGame() {
  const { lightMode } = React.useContext(ThemeContext);
  const [gameUrl, setGameUrl] = useState('');
  const [gameType, setGameType] = useState('woogles');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const validateUrl = (url) => {
    // Only Woogles URL pattern
    const wooglesPattern = /^https?:\/\/(?:www\.)?woogles\.io\/game\/[a-zA-Z0-9-]+$/;
    
    return wooglesPattern.test(url);
  };

  const detectGameType = (url) => {
    if (url.includes('woogles.io')) {
      return 'woogles';
    }
    return 'unknown';
  };

  const handleUrlChange = (event) => {
    const url = event.target.value;
    setGameUrl(url);
    
    if (url) {
      const detectedType = detectGameType(url);
      if (detectedType !== 'unknown') {
        setGameType(detectedType);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!gameUrl.trim()) {
      setMessage('Please enter a game URL');
      setMessageType('error');
      return;
    }

    if (!validateUrl(gameUrl)) {
      setMessage('Please enter a valid Woogles game URL');
      setMessageType('error');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/.netlify/functions/submitGame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameUrl: gameUrl.trim(),
          gameType,
          submittedBy: 'anonymous' // You could add a name field later
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit game');
      }
      
      setMessage('Game submitted successfully! Mack will review it soon.');
      setMessageType('success');
      setGameUrl('');
      
    } catch (error) {
      console.error('Submission error:', error);
      setMessage(error.message || 'Failed to submit game. Please try again.');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidenav />
      <Box className={styles.page}>
        <Box className={styles.content}>
          <p>Submit a Woogles Game for Mack Meller to analyze for GTE!</p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <TextField
              fullWidth
              label="Game URL"
              variant="outlined"
              value={gameUrl}
              onChange={handleUrlChange}
              placeholder="https://woogles.io/game/abc123"
              disabled={submitting}
              sx={{
                marginBottom: '16px',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#ccc',
                  },
                  '&:hover fieldset': {
                    borderColor: '#999',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3D5A80',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#666',
                },
                '& .MuiInputBase-input': {
                  color: '#333',
                },
              }}
            />

            <div className={styles.gameTypeInfo}>
              <p>Detected game type: <strong>{gameType === 'woogles' ? 'Woogles' : 'Unknown'}</strong></p>
            </div>

            {message && (
              <Alert 
                severity={messageType} 
                sx={{
                  marginBottom: '16px',
                  backgroundColor: messageType === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                  color: messageType === 'success' ? '#2e7d32' : '#c62828',
                  border: `1px solid ${messageType === 'success' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`,
                  borderRadius: '8px'
                }}
              >
                {message}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !gameUrl.trim()}
              sx={{
                backgroundColor: '#3D5A80',
                '&:hover': {
                  backgroundColor: '#2c3e50',
                },
                '&:disabled': {
                  backgroundColor: '#ccc',
                },
                marginBottom: '20px'
              }}
            >
              {submitting ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  Submitting...
                </Box>
              ) : (
                'Submit Game'
              )}
            </Button>
          </form>
        </Box>
      </Box>
    </Box>
  );
} 