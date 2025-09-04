import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, TextField, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { Close, Minimize, Refresh, Search } from '@mui/icons-material';
import { Target, MagnifyingGlass, CheckCircle, XCircle } from '@phosphor-icons/react';
import styles from './Widget.module.css';

const Widget = () => {
  // Configuration - change this when you deploy your Go service
  const GO_SERVICE_URL = 'https://scrabble-move-generator-production.up.railway.app';
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isElectron, setIsElectron] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [validationWord, setValidationWord] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState('validation'); // 'validation', 'anagram', or 'subanagram'

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
        if (activeTab === 'anagram') {
        performSearch(searchTerm);
        } else if (activeTab === 'subanagram') {
          performSubanagramSearch(searchTerm);
        }
      } else {
        setSearchResults([]);
      }
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(searchTimeout);
  }, [searchTerm, activeTab]);

  const performSearch = async (term) => {
    if (term.length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Call the Go service for anagram search
      const response = await fetch(`${GO_SERVICE_URL}/find-anagrams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ letters: term })
      });
      
      if (!response.ok) {
        console.error('Search error:', response.status, response.statusText);
        setSearchResults([]);
        return;
      }
      
      const data = await response.json();
      console.log('Anagram search response:', data); // Debug log
      
      // Check for different possible response formats
      if (data.words) {
        setSearchResults(data.words);
      } else if (data.anagrams) {
        setSearchResults(data.anagrams);
      } else if (data.results) {
        setSearchResults(data.results);
      } else if (Array.isArray(data)) {
        setSearchResults(data);
      } else {
        console.log('No words found in response, data:', data);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(['Service temporarily unavailable']);
    } finally {
      setIsSearching(false);
    }
  };

  const performSubanagramSearch = async (term) => {
    if (term.length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Call the Go service for subanagram search
      const response = await fetch(`${GO_SERVICE_URL}/find-subanagrams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ letters: term })
      });
      
      if (!response.ok) {
        console.error('Subanagram search error:', response.status, response.statusText);
        setSearchResults([]);
        return;
      }
      
      const data = await response.json();
      console.log('Subanagram search response:', data); // Debug log
      
      // Check for different possible response formats
      if (data.words) {
        setSearchResults(data.words);
      } else if (data.subanagrams) {
        setSearchResults(data.subanagrams);
      } else if (data.results) {
        setSearchResults(data.results);
      } else if (Array.isArray(data)) {
        setSearchResults(data);
      } else {
        console.log('No subanagrams found in response, data:', data);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Subanagram search error:', error);
      setSearchResults(['Service temporarily unavailable']);
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

  const validateWord = async (word) => {
    if (word.length < 1) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    try {
      // Call the Go service to validate the word
      const response = await fetch(`${GO_SERVICE_URL}/validate-word`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: word })
      });
      
      const data = await response.json();
      
      setValidationResult({
        word: data.word,
        isValid: data.isValid,
        dictionary: data.lexicon || data.dictionary || 'NWL23'
      });
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        word: word.toUpperCase(),
        isValid: false,
        error: 'Failed to validate word'
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Box 
      sx={{
        width: '400px',
        height: isMinimized ? '40px' : '380px',
        minWidth: '400px',
        minHeight: isMinimized ? '40px' : '380px',
        maxWidth: '400px',
        maxHeight: isMinimized ? '40px' : '380px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.9))',
        backgroundSize: '200% 200%',
        backdropFilter: 'blur(20px)',
        borderRadius: '0px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'relative'
      }}
      className="widget-container"
    >
      {/* Widget Header */}
      <Box 
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1.5,
          background: 'linear-gradient(135deg, #1F2937 0%, #374151 50%, #4B5563 100%)',
          color: 'white',
          cursor: 'move',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #60A5FA, #34D399, #F59E0B, #EF4444)',
            backgroundSize: '200% 100%',
            animation: 'gradientShift 3s ease infinite'
          }
        }}
        className="widget-header"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Target size={20} weight="fill" />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold',
              fontFamily: 'Preahvihear, sans-serif',
              fontSize: '1rem',
              letterSpacing: '0.05em',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
          Scrabble Widget
        </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            size="small" 
            onClick={handleRefresh}
            sx={{ 
              color: 'white', 
              p: 1,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <Refresh fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={handleMinimize}
            sx={{ 
              color: 'white', 
              p: 1,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <Minimize fontSize="small" />
          </IconButton>
          {isElectron && (
            <IconButton 
              size="small" 
              onClick={handleClose}
              sx={{ 
                color: 'white', 
                p: 1,
                background: 'rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                '&:hover': {
                  background: 'rgba(239, 68, 68, 0.4)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Widget Content - Hidden when minimized */}
      {!isMinimized && (
        <Box sx={{ 
          p: 1.5, 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1.5, 
          background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.6))'
        }}>
          {/* Time Display */}
          <Box sx={{ 
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.1))',
            borderRadius: '0px',
            p: 1,
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <Typography variant="body1" sx={{ 
              fontWeight: 'bold', 
              color: '#1E40AF',
              fontFamily: 'Preahvihear, sans-serif',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
              mb: 0.25,
              fontSize: '0.9rem'
            }}>
              {currentTime.toLocaleTimeString()}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#3B82F6',
              fontWeight: '500',
              letterSpacing: '0.05em',
              fontSize: '0.7rem'
            }}>
              {currentTime.toLocaleDateString()}
            </Typography>
          </Box>

          {/* Tab Navigation */}
          <Box sx={{ 
            display: 'flex', 
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '0px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <Box
              onClick={() => setActiveTab('validation')}
              sx={{
                flex: 1,
                p: 1.5,
                textAlign: 'center',
                cursor: 'pointer',
                background: activeTab === 'validation' 
                  ? 'linear-gradient(135deg, #4F46E5, #6366F1)' 
                  : 'transparent',
                color: activeTab === 'validation' ? 'white' : '#4F46E5',
                fontWeight: activeTab === 'validation' ? 'bold' : '500',
                transition: 'all 0.2s ease',
                fontSize: '0.7rem',
                '&:hover': {
                  background: activeTab === 'validation' 
                    ? 'linear-gradient(135deg, #4338CA, #5855EB)' 
                    : 'rgba(79, 70, 229, 0.1)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <CheckCircle size={14} weight="fill" />
                Word Validation
              </Box>
            </Box>
            <Box
              onClick={() => setActiveTab('anagram')}
              sx={{
                flex: 1,
                p: 1.5,
                textAlign: 'center',
                cursor: 'pointer',
                background: activeTab === 'anagram' 
                  ? 'linear-gradient(135deg, #059669, #10B981)' 
                  : 'transparent',
                color: activeTab === 'anagram' ? 'white' : '#059669',
                fontWeight: activeTab === 'anagram' ? 'bold' : '500',
                transition: 'all 0.2s ease',
                fontSize: '0.7rem',
                '&:hover': {
                  background: activeTab === 'anagram' 
                    ? 'linear-gradient(135deg, #047857, #059669)' 
                    : 'rgba(34, 197, 94, 0.1)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <MagnifyingGlass size={14} weight="fill" />
                Anagram Search
              </Box>
            </Box>
            <Box
              onClick={() => setActiveTab('subanagram')}
              sx={{
                flex: 1,
                p: 1.5,
                textAlign: 'center',
                cursor: 'pointer',
                background: activeTab === 'subanagram' 
                  ? 'linear-gradient(135deg, #F59E0B, #F97316)' 
                  : 'transparent',
                color: activeTab === 'subanagram' ? 'white' : '#F59E0B',
                fontWeight: activeTab === 'subanagram' ? 'bold' : '500',
                transition: 'all 0.2s ease',
                fontSize: '0.7rem',
                '&:hover': {
                  background: activeTab === 'subanagram' 
                    ? 'linear-gradient(135deg, #D97706, #F59E0B)' 
                    : 'rgba(245, 158, 11, 0.1)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <MagnifyingGlass size={14} weight="fill" />
                Subanagrams
              </Box>
            </Box>
          </Box>

          {/* Tab Content */}
          {activeTab === 'subanagram' && (
            /* Subanagram Search Tab */
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(249, 115, 22, 0.05))',
              borderRadius: '0px',
              p: 1.5,
              border: '1px solid rgba(245, 158, 11, 0.15)',
              height: '200px'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                <MagnifyingGlass size={16} weight="fill" color="#F59E0B" />
                <Typography variant="body2" sx={{ 
                  color: '#F59E0B', 
                  fontWeight: 'bold',
                  fontFamily: 'Preahvihear, sans-serif',
                  textAlign: 'center',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  fontSize: '0.85rem'
                }}>
                  Subanagram Search
            </Typography>
              </Box>
            <Box sx={{ position: 'relative' }}>
              <TextField
                size="small"
                  placeholder="Enter letters to find subanagrams..."
                value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                InputProps={{
                    startAdornment: <Search sx={{ mr: 1.5, color: '#F59E0B', fontSize: '1.2rem' }} />,
                  endAdornment: isSearching ? (
                      <CircularProgress size={20} sx={{ color: '#F59E0B' }} />
                  ) : null
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '0px',
                    '& fieldset': {
                        borderColor: 'rgba(245, 158, 11, 0.3)',
                        borderWidth: '2px',
                    },
                    '&:hover fieldset': {
                        borderColor: 'rgba(245, 158, 11, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: '#F59E0B',
                        borderWidth: '2px',
                      },
                  },
                }}
              />
            </Box>
            
              {/* Search Results - Fixed height, no scrollbar */}
            {searchResults.length > 0 && (
                <Box sx={{ 
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '0px',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  flex: 1,
                  p: 0,
                  overflow: 'hidden'
                }}>
              <List sx={{ 
                    height: '100%',
                    p: 0,
                    overflow: 'hidden'
                  }}>
                    {searchResults.map((word, index) => {
                      // Check if this is a special message (not a real word)
                      const isSpecialMessage = word === 'Service temporarily unavailable';
                      
                      return (
                  <ListItem 
                    key={index} 
                    sx={{ 
                            py: 1, 
                            px: 2,
                            borderBottom: index < searchResults.length - 1 ? '1px solid rgba(245, 158, 11, 0.1)' : 'none',
                            '&:hover': { 
                              background: isSpecialMessage ? 'rgba(255, 193, 7, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                              transform: isSpecialMessage ? 'none' : 'translateX(4px)'
                            },
                            transition: 'all 0.2s ease'
                    }}
                  >
                    <ListItemText 
                      primary={word} 
                      primaryTypographyProps={{ 
                              fontSize: '0.8rem',
                              color: isSpecialMessage ? '#F59E0B' : '#F59E0B',
                              fontWeight: '600',
                              fontFamily: 'Preahvihear, sans-serif',
                              fontStyle: isSpecialMessage ? 'italic' : 'normal'
                            }}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              )}
              
              {/* No results message */}
              {searchTerm.length > 0 && searchResults.length === 0 && !isSearching && (
                <Box sx={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '0px',
                  p: 1.5,
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  textAlign: 'center',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography variant="body2" sx={{ 
                    color: '#DC2626',
                    fontWeight: '500',
                    fontSize: '0.75rem'
                  }}>
                    No subanagrams found
                  </Typography>
                </Box>
              )}
              
              {/* Help text */}
              <Typography variant="body2" sx={{ 
                color: '#F59E0B', 
                textAlign: 'center', 
                py: 0.5,
                fontStyle: 'italic',
                opacity: 0.8,
                fontSize: '0.75rem'
              }}>
                Type letters to find all possible shorter words
              </Typography>
            </Box>
          )}

          {activeTab === 'validation' && (
            /* Word Validation Tab */
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))',
              borderRadius: '0px',
              p: 1.5,
              border: '1px solid rgba(99, 102, 241, 0.15)',
              height: '200px'
            }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                <CheckCircle size={16} weight="fill" color="#4F46E5" />
                <Typography variant="body2" sx={{ 
                  color: '#4F46E5', 
                  fontWeight: 'bold',
                  fontFamily: 'Preahvihear, sans-serif',
                  textAlign: 'center',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  fontSize: '0.85rem'
                }}>
                  Word Validation
                </Typography>
              </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                                                <TextField
                              size="small"
                              placeholder="Enter word to validate..."
                              value={validationWord}
                              onChange={(e) => setValidationWord(e.target.value)}
                              autoComplete="off"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  validateWord(validationWord);
                                }
                              }}
                              sx={{
                                flex: 1,
                                '& .MuiOutlinedInput-root': {
                                  background: 'rgba(255, 255, 255, 0.8)',
                                  borderRadius: '0px',
                                  '& fieldset': {
                                    borderColor: 'rgba(99, 102, 241, 0.3)',
                                    borderWidth: '2px',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: 'rgba(99, 102, 241, 0.5)',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#4F46E5',
                                    borderWidth: '2px',
                                  },
                                },
                              }}
                            />
                    <IconButton
                      size="large"
                      onClick={() => validateWord(validationWord)}
                      disabled={!validationWord.trim() || isValidating}
                      sx={{
                        color: 'white',
                        background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                        borderRadius: '0px',
                        width: '44px',
                        height: '44px',
                        '&:hover': { 
                          background: 'linear-gradient(135deg, #4338CA, #5855EB)',
                          transform: 'scale(1.05)'
                        },
                        '&:disabled': { 
                          background: 'linear-gradient(135deg, #9CA3AF, #D1D5DB)',
                          transform: 'none'
                        },
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
                      }}
                    >
                                                  {isValidating ? (
                              <CircularProgress size={20} sx={{ color: 'white' }} />
                            ) : (
                              <CheckCircle fontSize="medium" />
                            )}
                    </IconButton>
                  </Box>
                  
                  {/* Validation Result */}
                  {validationResult && (
                    <Box sx={{
                      background: validationResult.isValid 
                        ? 'rgba(34, 197, 94, 0.1)' 
                        : 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '0px',
                      p: 1,
                      border: `1px solid ${validationResult.isValid 
                        ? 'rgba(34, 197, 94, 0.2)' 
                        : 'rgba(239, 68, 68, 0.2)'}`,
                      textAlign: 'center',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      {validationResult.isValid ? (
                        <CheckCircle size={16} weight="fill" color="#059669" />
                      ) : (
                        <XCircle size={16} weight="fill" color="#DC2626" />
                      )}
                      <Typography variant="body2" sx={{ 
                        color: validationResult.isValid ? '#059669' : '#DC2626',
                        fontWeight: '600',
                        fontFamily: 'Preahvihear, sans-serif',
                        fontSize: '0.8rem'
                      }}>
                        {validationResult.word} is {validationResult.isValid ? 'VALID' : 'INVALID'}
                      </Typography>
                    </Box>
                      {validationResult.dictionary && (
                        <Typography variant="body2" sx={{ 
                          color: validationResult.isValid ? '#059669' : '#DC2626',
                          fontWeight: '500',
                          mt: 0.25,
                          opacity: 0.8,
                          fontSize: '0.75rem'
                        }}>
                          Dictionary: {validationResult.dictionary}
                        </Typography>
                      )}
                      {validationResult.error && (
                        <Typography variant="body2" sx={{ 
                          color: '#DC2626',
                          fontWeight: '500',
                          mt: 0.25,
                          opacity: 0.8,
                          fontSize: '0.75rem'
                        }}>
                          {validationResult.error}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              )}

              {activeTab === 'anagram' && (
                /* Anagram Search Tab */
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1,
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(16, 185, 129, 0.05))',
                  borderRadius: '0px',
                  p: 1.5,
                  border: '1px solid rgba(34, 197, 94, 0.15)',
                  height: '200px'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                    <MagnifyingGlass size={16} weight="fill" color="#059669" />
                    <Typography variant="body2" sx={{ 
                      color: '#059669', 
                      fontWeight: 'bold',
                      fontFamily: 'Preahvihear, sans-serif',
                      textAlign: 'center',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      fontSize: '0.85rem'
                    }}>
                      Anagram Search
                    </Typography>
                  </Box>
                  <Box sx={{ position: 'relative' }}>
                    <TextField
                      size="small"
                      placeholder="Enter letters to find anagrams..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      autoComplete="off"
                      InputProps={{
                        startAdornment: <Search sx={{ mr: 1.5, color: '#059669', fontSize: '1.2rem' }} />,
                        endAdornment: isSearching ? (
                          <CircularProgress size={20} sx={{ color: '#059669' }} />
                        ) : null
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          background: 'rgba(255, 255, 255, 0.8)',
                          borderRadius: '0px',
                          '& fieldset': {
                            borderColor: 'rgba(34, 197, 94, 0.3)',
                            borderWidth: '2px',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(34, 197, 94, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#059669',
                            borderWidth: '2px',
                          },
                        },
                      }}
                    />
                  </Box>
                  
                  {/* Search Results - Fixed height, no scrollbar */}
                  {searchResults.length > 0 && (
                    <Box sx={{ 
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '0px',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                      flex: 1,
                      p: 0,
                      overflow: 'hidden'
                    }}>
                      <List sx={{ 
                        height: '100%',
                        p: 0,
                        overflow: 'hidden'
                      }}>
                        {searchResults.map((word, index) => {
                          // Check if this is a special message (not a real word)
                          const isSpecialMessage = word === 'Anagram search coming soon!' || word === 'Service temporarily unavailable';
                          
                          return (
                            <ListItem 
                              key={index} 
                              sx={{ 
                                py: 1, 
                                px: 2,
                                borderBottom: index < searchResults.length - 1 ? '1px solid rgba(34, 197, 94, 0.1)' : 'none',
                                '&:hover': { 
                                  background: isSpecialMessage ? 'rgba(255, 193, 7, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                                  transform: isSpecialMessage ? 'none' : 'translateX(4px)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <ListItemText 
                                primary={word} 
                                                          primaryTypographyProps={{ 
                            fontSize: '0.8rem',
                            color: isSpecialMessage ? '#F59E0B' : '#059669',
                            fontWeight: '600',
                            fontFamily: 'Preahvihear, sans-serif',
                            fontStyle: isSpecialMessage ? 'italic' : 'normal'
                      }}
                    />
                  </ListItem>
                          );
                        })}
              </List>
                    </Box>
            )}
            
            {/* No results message */}
            {searchTerm.length > 0 && searchResults.length === 0 && !isSearching && (
                    <Box sx={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '0px',
                      p: 1.5,
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      textAlign: 'center',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Typography variant="body2" sx={{ 
                        color: '#DC2626',
                        fontWeight: '500',
                        fontSize: '0.75rem'
                      }}>
                        No anagrams found
              </Typography>
                    </Box>
                  )}
                  
                  {/* Help text */}
                  <Typography variant="body2" sx={{ 
                    color: '#059669', 
                    textAlign: 'center', 
                    py: 0.5,
                    fontStyle: 'italic',
                    opacity: 0.8,
                    fontSize: '0.75rem'
                  }}>
                    Type letters to find all possible Scrabble words
                  </Typography>
          </Box>
              )}




        </Box>
      )}
    </Box>
  );
};

export default Widget; 