import React, { useState } from 'react';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeContext } from '../../App';
import styles from './SubmitGame.module.css';

export default function SubmitGame() {
  const { lightMode } = React.useContext(ThemeContext);
  const [gameUrl, setGameUrl] = useState('');
  const [gameType, setGameType] = useState('cross-tables');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const validateUrl = (url) => {
    // Cross-Tables URL pattern
    const crossTablesPattern = /^https?:\/\/(?:www\.)?cross-tables\.com\/results\.html\?.*$/;
    
    // Woogles URL pattern
    const wooglesPattern = /^https?:\/\/(?:www\.)?woogles\.io\/game\/[a-zA-Z0-9-]+$/;
    
    return crossTablesPattern.test(url) || wooglesPattern.test(url);
  };

  const detectGameType = (url) => {
    if (url.includes('cross-tables.com')) {
      return 'cross-tables';
    } else if (url.includes('woogles.io')) {
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
      setMessage('Please enter a valid Cross-Tables or Woogles game URL');
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
        <Box className={styles.mainPanel}>
          <Box className={styles.contentContainer}>
            <Paper 
              elevation={3} 
              className={styles.submitCard}
              sx={{
                backgroundColor: lightMode ? '#ffffff' : '#2d2d2d',
                color: lightMode ? '#333333' : '#ffffff'
              }}
            >
              <Typography variant="h4" component="h1" gutterBottom className={styles.title}>
                Submit a Game for Analysis
              </Typography>
              
              <Typography variant="body1" className={styles.description}>
                Submit a Cross-Tables or Woogles game URL for Mack Meller to analyze in his next video.
                Make sure the game is publicly accessible.
              </Typography>

              <form onSubmit={handleSubmit} className={styles.form}>
                <TextField
                  fullWidth
                  label="Game URL"
                  variant="outlined"
                  value={gameUrl}
                  onChange={handleUrlChange}
                  placeholder="https://cross-tables.com/results.html?g=12345 or https://woogles.io/game/abc123"
                  disabled={submitting}
                  className={styles.urlInput}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: lightMode ? '#ccc' : '#555',
                      },
                      '&:hover fieldset': {
                        borderColor: lightMode ? '#999' : '#777',
                      },
                    },
                  }}
                />

                <Box className={styles.gameTypeInfo}>
                  <Typography variant="body2" color="textSecondary">
                    Detected game type: <strong>{gameType === 'cross-tables' ? 'Cross-Tables' : gameType === 'woogles' ? 'Woogles' : 'Unknown'}</strong>
                  </Typography>
                </Box>

                {message && (
                  <Alert 
                    severity={messageType} 
                    className={styles.alert}
                    sx={{
                      backgroundColor: messageType === 'success' 
                        ? (lightMode ? '#e8f5e8' : '#1b5e20') 
                        : (lightMode ? '#ffebee' : '#c62828'),
                      color: messageType === 'success' 
                        ? (lightMode ? '#2e7d32' : '#a5d6a7') 
                        : (lightMode ? '#c62828' : '#ef9a9a')
                    }}
                  >
                    {message}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting || !gameUrl.trim()}
                  className={styles.submitButton}
                  sx={{
                    backgroundColor: '#1976d2',
                    '&:hover': {
                      backgroundColor: '#1565c0',
                    },
                    '&:disabled': {
                      backgroundColor: '#ccc',
                    }
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

              <Box className={styles.infoSection}>
                <Typography variant="h6" gutterBottom>
                  What happens next?
                </Typography>
                <ul className={styles.infoList}>
                  <li>Mack will review your submission</li>
                  <li>If selected, the game will be featured in an upcoming video</li>
                  <li>You'll be notified if your game is chosen</li>
                  <li>Submissions are reviewed on a first-come, first-served basis</li>
                </ul>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 