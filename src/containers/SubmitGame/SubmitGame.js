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
      setMessage('Please enter a valid XT or Woogles game URL');
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
          
          <Box className={styles.leftContainer}>
            <Box className={`${styles.mainBox} ${styles.mainBoxContent}`} component="main">
              <Box className={styles.submitContainer}>
                <Typography variant="h4" className={styles.title}>
                  Submit a  GTE Game
                </Typography>
                
                <Typography variant="body1" className={styles.description}>
                  Anonymously submit an XT or Woogles game URL for Mack Meller to analyze in his next video.
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
                        '&.Mui-focused fieldset': {
                          borderColor: '#1976d2',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: lightMode ? '#666' : '#aaa',
                      },
                      '& .MuiInputBase-input': {
                        color: lightMode ? '#333' : '#fff',
                      },
                    }}
                  />

                  <Box className={styles.gameTypeInfo}>
                    <Typography variant="body2" sx={{ color: lightMode ? '#666' : '#aaa' }}>
                      Detected game type: <strong style={{ color: lightMode ? '#1976d2' : '#64b5f6' }}>
                        {gameType === 'cross-tables' ? 'XT' : gameType === 'woogles' ? 'Woogles' : 'Unknown'}
                      </strong>
                    </Typography>
                  </Box>

                  {message && (
                    <Alert 
                      severity={messageType} 
                      className={styles.alert}
                      sx={{
                        backgroundColor: messageType === 'success' 
                          ? (lightMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.2)') 
                          : (lightMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.2)'),
                        color: messageType === 'success' 
                          ? (lightMode ? '#2e7d32' : '#81c784') 
                          : (lightMode ? '#c62828' : '#e57373'),
                        border: `1px solid ${messageType === 'success' 
                          ? (lightMode ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.4)') 
                          : (lightMode ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.4)')}`,
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
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 