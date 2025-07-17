import React, { useState } from 'react';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
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
          <Paper 
            elevation={8}
            sx={{
              background: '#808080',
              backgroundImage: "url('https://www.transparenttextures.com/patterns/diagonal-noise.png')",
              borderRadius: '0px',
              padding: '40px',
              margin: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width="20" height="20" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="fabric" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"%3E%3Ccircle cx="10" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23fabric)"/%3E%3C/svg%3E")',
                opacity: 0.3,
                pointerEvents: 'none',
              }
            }}
          >
            <Typography 
              variant="body1" 
              sx={{
                textAlign: 'center',
                marginBottom: '30px',
                color: '#ffffff !important',
                fontSize: '16px',
                lineHeight: 1.6,
                position: 'relative',
                zIndex: 1,
                fontWeight: 'bold',
              }}
            >
              Submit a Woogles Game for Mack Meller to analyze for GTE!
            </Typography>

            <form onSubmit={handleSubmit} className={styles.form}>
              <TextField
                fullWidth
                label="Game URL"
                variant="outlined"
                value={gameUrl}
                onChange={handleUrlChange}
                placeholder="https://woogles.io/game/abc123"
                disabled={submitting}
                inputProps={{
                  autocomplete: 'off'
                }}
                sx={{
                  marginBottom: '20px',
                  position: 'relative',
                  zIndex: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '0px',
                    transition: 'all 0.3s ease',
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.2)',
                      borderWidth: '1px',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,255,255,0.4)',
                      transform: 'scale(1.02)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#fff',
                      borderWidth: '2px',
                      boxShadow: '0 0 20px rgba(255,255,255,0.3)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.8)',
                    fontWeight: 'bold',
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                    fontWeight: '500',
                  },
                }}
              />

              {message && (
                <Alert 
                  severity={messageType} 
                  sx={{
                    marginBottom: '20px',
                    backgroundColor: messageType === 'success' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                    color: messageType === 'success' ? '#4CAF50' : '#f44336',
                    border: `2px solid ${messageType === 'success' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)'}`,
                    borderRadius: '0px',
                    fontWeight: 'bold',
                    position: 'relative',
                    zIndex: 1,
                    animation: 'slideIn 0.5s ease-out',
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
                  padding: '0px 25px',
                  cursor: 'pointer',
                  height: '40px', 
                  background: 'linear-gradient(45deg, transparent 5%, #ffffff 5%)',
                  border: 0,
                  color: '#333',
                  letterSpacing: '2px',
                  boxShadow: '6px 0px 0px #00E6F6',
                  outline: 'transparent',
                  position: 'relative',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: 'manipulation',
                  marginLeft: '20px',
                  marginRight: '20px',
                  borderRadius: '0px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(45deg, transparent 5%, #ffffff 5%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '8px 0px 0px #00E6F6',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(45deg, transparent 5%, #ffffff 5%)',
                    color: 'rgba(0,0,0,0.5)',
                    transform: 'none',
                    boxShadow: '6px 0px 0px #00E6F6',
                    cursor: 'not-allowed',
                  },
                  width: '200px',
                }}
              >
                {submitting ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                    <span>Submitting...</span>
                  </Box>
                ) : (
                  'Submit Game'
                )}
              </Button>
            </form>
          </Paper>
        </Box>
      </Box>
      
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </Box>
  );
} 