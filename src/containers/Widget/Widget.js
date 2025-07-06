import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Paper, TextField, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { Close, Minimize, Refresh, Search } from '@mui/icons-material';

const Widget = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isElectron, setIsElectron] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    setIsElectron(window.electronAPI !== undefined);
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Debounced search function
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchTerm.length > 0) {
        performSearch(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(searchTimeout);
  }, [searchTerm]);

  const performSearch = async (term) => {
    if (term.length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Call the Netlify function
      const response = await fetch(`/.netlify/functions/searchWords?searchTerm=${encodeURIComponent(term)}`);
      const data = await response.json();
      
      if (data.words) {
        setSearchResults(data.words);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
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
            <Box sx={{ position: 'relative' }}>
              <TextField
                size="small"
                placeholder="Search Scrabble words..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: '#6c6a62' }} />,
                  endAdornment: isSearching ? (
                    <CircularProgress size={16} sx={{ color: '#6c6a62' }} />
                  ) : null
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
            </Box>
            
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
            
            {/* No results message */}
            {searchTerm.length > 0 && searchResults.length === 0 && !isSearching && (
              <Typography variant="caption" sx={{ color: '#666', textAlign: 'center', py: 1 }}>
                No words found
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default Widget; 