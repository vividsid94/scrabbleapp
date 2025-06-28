import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Paper, TextField, List, ListItem, ListItemText } from '@mui/material';
import { Close, Minimize, Refresh, Search } from '@mui/icons-material';

const Widget = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isElectron, setIsElectron] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    setIsElectron(window.electronAPI !== undefined);
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sample word list for search (you can replace with your actual dictionary)
  const sampleWords = [
    'SCRABBLE', 'TILE', 'WORD', 'GAME', 'PLAY', 'SCORE', 'BOARD',
    'RACK', 'LETTER', 'POINT', 'TRIPLE', 'DOUBLE', 'BONUS',
    'QUIZ', 'PUZZLE', 'STUDY', 'LEARN', 'PRACTICE', 'CHALLENGE'
  ];

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.length > 0) {
      const filtered = sampleWords.filter(word => 
        word.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 5)); // Show max 5 results
    } else {
      setSearchResults([]);
    }
  };

  const handleClose = () => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.close();
    }
  };

  const handleMinimize = () => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.minimize();
    } else {
      // PWA minimize - just hide content
      setIsMinimized(!isMinimized);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Paper 
      elevation={8}
      className="widget-container"
      sx={{
        width: '400px',
        height: isMinimized ? '40px' : '300px',
        minWidth: '400px',
        minHeight: isMinimized ? '40px' : '300px',
        maxWidth: '400px',
        maxHeight: isMinimized ? '40px' : '300px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'height 0.3s ease'
      }}
    >
      {/* Widget Header */}
      <Box 
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1,
          background: 'linear-gradient(45deg, #6c6a62, #808080)',
          color: 'white',
          cursor: 'move'
        }}
        className="widget-header"
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          Scrabble Widget
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton 
            size="small" 
            onClick={handleRefresh}
            sx={{ color: 'white', p: 0.5 }}
          >
            <Refresh fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={handleMinimize}
            sx={{ color: 'white', p: 0.5 }}
          >
            <Minimize fontSize="small" />
          </IconButton>
          {isElectron && (
            <IconButton 
              size="small" 
              onClick={handleClose}
              sx={{ color: 'white', p: 0.5 }}
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Widget Content - Hidden when minimized */}
      {!isMinimized && (
        <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Time Display */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
              {currentTime.toLocaleTimeString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
              {currentTime.toLocaleDateString()}
            </Typography>
          </Box>

          {/* Word Search */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#6c6a62', fontWeight: 'bold' }}>
              Word Search
            </Typography>
            <TextField
              size="small"
              placeholder="Search words..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: '#6c6a62' }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#6c6a62',
                  },
                  '&:hover fieldset': {
                    borderColor: '#808080',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6c6a62',
                  },
                },
              }}
            />
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <List sx={{ 
                maxHeight: 120, 
                overflow: 'auto', 
                bgcolor: 'rgba(108, 106, 98, 0.05)',
                borderRadius: 1,
                p: 0
              }}>
                {searchResults.map((word, index) => (
                  <ListItem 
                    key={index} 
                    sx={{ 
                      py: 0.5, 
                      px: 1,
                      '&:hover': { bgcolor: 'rgba(108, 106, 98, 0.1)' }
                    }}
                  >
                    <ListItemText 
                      primary={word} 
                      primaryTypographyProps={{ 
                        fontSize: '0.875rem',
                        color: '#6c6a62'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default Widget; 