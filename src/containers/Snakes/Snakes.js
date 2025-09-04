import React, { useState, useEffect, useContext } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import styles from './Snakes.module.css';
import { ThemeContext } from '../../App';
import AnimatedMascot from '../../components/AppContent/AnimatedMascot';
import { GameController, MagnifyingGlass, CheckCircle, ArrowRight } from '@phosphor-icons/react';

const RAILWAY_BASE_URL = 'https://scrabble-move-generator-production.up.railway.app';

export default function Snakes() {
  const { lightMode } = useContext(ThemeContext);
  const [currentLetters, setCurrentLetters] = useState('SKATER?');
  const [currentRound, setCurrentRound] = useState(1); // 1 = 7 letters, 2 = 8 letters
  const [currentWords, setCurrentWords] = useState([]);
  const [currentAlphagrams, setCurrentAlphagrams] = useState([]);
  const [guessedWords, setGuessedWords] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roundHistory, setRoundHistory] = useState([]);
  const [currentAlphagramIndex, setCurrentAlphagramIndex] = useState(0);

  // Initialize the game
  useEffect(() => {
    startNewRound();
  }, []);

  const startNewRound = async () => {
    setIsLoading(true);
    setMessage('');
    setGuessedWords([]);
    
    try {
      if (currentRound === 1) {
        // Get 7-letter anagrams
        await getAnagrams(currentLetters, 1);
      } else {
        // Get 8-letter anagrams (currentLetters already has the + '?' from previous round)
        await getAnagrams(currentLetters, 2);
      }
    } catch (error) {
      setMessage('Error loading words. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAnagrams = async (letters, round) => {
    try {
      // Call the Railway service for real anagrams
      const response = await fetch(`${RAILWAY_BASE_URL}/find-anagrams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letters: letters })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const words = data.anagrams || data.words || data.results || [];
      
      if (words.length === 0) {
        setMessage('No words found for these letters. Try different letters!');
        setCurrentWords([]);
        setCurrentAlphagrams([]);
        return;
      }
      
      // Extract unique alphagrams (sorted letters)
      const alphagrams = [...new Set(words.map(word => word.split('').sort().join('')))];
      
      setCurrentWords(words);
      setCurrentAlphagrams(alphagrams);
      
      if (round === 1) {
        setMessage(`Found ${words.length} 7-letter words with ${alphagrams.length} unique alphagrams. Start guessing!`);
      } else {
        setMessage(`Found ${words.length} 8-letter words with ${alphagrams.length} unique alphagrams. Start guessing!`);
      }
    } catch (error) {
      console.error('Error fetching anagrams:', error);
      setMessage(`Error fetching words: ${error.message}`);
      setCurrentWords([]);
      setCurrentAlphagrams([]);
    }
  };

  const handleGuess = () => {
    const guess = userInput.trim().toUpperCase();
    if (!guess) return;

    // Check if word exists in current words (case-insensitive)
    const isValidWord = currentWords.some(word => word.toUpperCase() === guess);
    
    if (isValidWord && !guessedWords.some(word => word.toUpperCase() === guess)) {
      // Check if we should move to next round BEFORE updating guessedWords
      if (currentRound === 1 && guessedWords.length === 0) {
        // After first 7-letter word is guessed, move to 8-letter round
        setCurrentRound(2);
        // Take the first word and add a wildcard for 8-letter search
        const firstWord = currentWords[0];
        setCurrentLetters(firstWord + '?');
        setRoundHistory([...roundHistory, { round: 1, letters: currentLetters, words: currentWords }]);
        setMessage('First word guessed! Moving to 8-letter words...');
        // Clear current words and guessed words to prepare for 8-letter round
        setCurrentWords([]);
        setGuessedWords([]);
        setTimeout(() => startNewRound(), 2000);
      } else if (currentRound === 2 && guessedWords.length + 1 === currentWords.length) {
        // After all 8-letter words are guessed, move to next 7-letter round
        setCurrentRound(1);
        const newStartingLetters = getNextStartingLetters();
        setCurrentLetters(newStartingLetters);
        setRoundHistory([...roundHistory, { round: 2, letters: currentLetters + '?', words: currentWords }]);
        setMessage('Round 2 complete! Starting new 7-letter round...');
        // Clear current words and guessed words to prepare for new 7-letter round
        setCurrentWords([]);
        setGuessedWords([]);
        setTimeout(() => startNewRound(), 2000);
      } else {
        setMessage(`Great! ${currentWords.length - guessedWords.length - 1} words remaining.`);
      }
      
      // Add the word to guessed words and clear input
      setGuessedWords([...guessedWords, guess]);
      setUserInput('');
    } else if (guessedWords.some(word => word.toUpperCase() === guess)) {
      setMessage('You already guessed that word!');
    } else {
      setMessage('Not a valid word in this set. Try again!');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGuess();
    }
  };

  const getProgressPercentage = () => {
    if (currentWords.length === 0) return 0;
    return (guessedWords.length / currentWords.length) * 100;
  };

  const getCurrentAlphagram = () => {
    if (currentAlphagrams.length === 0) return '';
    return currentAlphagrams[currentAlphagramIndex] || currentAlphagrams[0];
  };

  const getNextStartingLetters = () => {
    const startingSets = [
      'STARE??', 'PAINT??', 'REACT??', 'SMILE??', 'DREAM??', 
      'BRAIN??', 'CLOUD??', 'FLAME??', 'GRACE??', 'HAPPY??'
    ];
    const currentIndex = startingSets.indexOf(currentLetters);
    const nextIndex = (currentIndex + 1) % startingSets.length;
    return startingSets[nextIndex];
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidenav />
      <Box className={styles.page}>
        <Box className={styles.heroContainer}>
          <Box className={styles.mascotWrapper}>
            <AnimatedMascot />
          </Box>
          <Box className={styles.title}
            style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}
          >
            Snakes 🐍
          </Box>
          <Typography variant="h6" className={styles.subtitle}>
            Progressive Word Building Game
          </Typography>
        </Box>

        <Box className={styles.gameContainer}>
          {/* Current Round Info */}
          <Paper elevation={3} className={styles.roundInfo}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <GameController size={24} weight="fill" color="#10B981" />
              <Typography variant="h5" fontWeight="bold">
                Round {currentRound}: {currentRound === 1 ? '7 Letters' : '8 Letters'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h6">Current Letters:</Typography>
              <Chip 
                label={currentLetters} 
                color="primary" 
                variant="outlined"
                sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}
              />
            </Box>

            {currentRound === 2 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Expanding from: {currentWords[0]?.slice(0, -1)}
                </Typography>
                <ArrowRight size={16} />
                <Typography variant="body2" color="text.secondary">
                  + ?
                </Typography>
              </Box>
            )}

            {/* Progress Bar */}
            <Box sx={{ width: '100%', mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Progress</Typography>
                <Typography variant="body2">{guessedWords.length}/{currentWords.length}</Typography>
              </Box>
              <Box sx={{ 
                width: '100%', 
                height: 8, 
                bgcolor: 'grey.200', 
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  width: `${getProgressPercentage()}%`, 
                  height: '100%', 
                  bgcolor: 'success.main',
                  transition: 'width 0.3s ease'
                }} />
              </Box>
            </Box>
          </Paper>

          {/* Game Area */}
          <Paper elevation={3} className={styles.gameArea}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Enter your guess"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                size="small"
              />
              <Button
                variant="contained"
                onClick={handleGuess}
                disabled={isLoading || !userInput.trim()}
                sx={{ minWidth: 100 }}
              >
                <CheckCircle size={20} weight="fill" style={{ marginRight: 8 }} />
                Guess
              </Button>
            </Box>

            {message && (
              <Paper elevation={1} className={styles.messageBox}>
                <Typography variant="body1">{message}</Typography>
              </Paper>
            )}

            {/* Word Lists */}
            <Box sx={{ display: 'flex', gap: 3 }}>
              {/* Guessed Words */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                  ✅ Guessed Words ({guessedWords.length})
                </Typography>
                <List dense className={styles.wordList}>
                  {guessedWords.map((word, index) => (
                    <ListItem key={index} className={styles.guessedWord}>
                      <ListItemText primary={word} />
                    </ListItem>
                  ))}
                </List>
              </Box>

              {/* Remaining Words */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'warning.main' }}>
                  🔍 Remaining Words ({currentWords.length - guessedWords.length})
                </Typography>
                <List dense className={styles.wordList}>
                                   {currentWords
                   .filter(word => !guessedWords.some(guessed => guessed.toUpperCase() === word.toUpperCase()))
                   .map((word, index) => (
                      <ListItem key={index} className={styles.remainingWord}>
                        <ListItemText primary={word} />
                      </ListItem>
                    ))}
                </List>
              </Box>
            </Box>
          </Paper>

          {/* Round History */}
          {roundHistory.length > 0 && (
            <Paper elevation={2} className={styles.historyContainer}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                📚 Round History
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {roundHistory.map((round, index) => (
                  <Box key={index} className={styles.historyItem}>
                    <Typography variant="body2" color="text.secondary">
                      Round {round.round}: {round.letters} → {round.words.length} words
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Controls */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={startNewRound}
              disabled={isLoading}
              startIcon={<MagnifyingGlass size={20} />}
            >
              Refresh Words
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
