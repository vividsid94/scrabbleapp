import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import styles from './Boggle.module.css';
import { findAllPossibleWords, canFormWord } from '../../functions/boggleFunctions';
import { modifyImageColor } from '../../functions/tileFunctions';

// Preload tile images
let allLetters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'];
let preloadedImages = {};

function preload() {
  allLetters.forEach(letter => {
    let srcString = '/images/compressed-clean-protiles/' + letter + '.png';
    preloadedImages[letter] = new Image();
    preloadedImages[letter].src = srcString;
  });
}

// Initialize preloading
if (Object.keys(preloadedImages).length === 0) {
  preload();
}

const Boggle = () => {
  const [board, setBoard] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes game time
  const [dictionary, setDictionary] = useState(new Set());
  const [possibleWords, setPossibleWords] = useState([]);
  const [showHints, setShowHints] = useState(false);
  const [isDictionaryLoading, setIsDictionaryLoading] = useState(true);
  const [tileColor, setTileColor] = useState('#6D84A2');
  const [highlightedTile, setHighlightedTile] = useState(null);

  // Load dictionary
  useEffect(() => {
    const loadDictionary = async () => {
      try {
        setIsDictionaryLoading(true);
        const response = await fetch('/.netlify/functions/loadBoggleDictionary');
        if (!response.ok) {
          throw new Error('Failed to load dictionary');
        }
        const data = await response.json();
        setDictionary(new Set(data.words));
        setIsDictionaryLoading(false);
      } catch (error) {
        console.error('Error loading dictionary:', error);
        setIsDictionaryLoading(false);
      }
    };
    loadDictionary();
  }, []);

  // Initialize board with random letters
  const initializeBoard = () => {
    // Standard Boggle dice configuration
    const dice = [
      ['A', 'A', 'E', 'E', 'G', 'N'],
      ['A', 'B', 'B', 'J', 'O', 'O'],
      ['A', 'C', 'H', 'O', 'P', 'S'],
      ['A', 'F', 'F', 'K', 'P', 'S'],
      ['A', 'O', 'O', 'T', 'T', 'W'],
      ['C', 'I', 'M', 'O', 'T', 'U'],
      ['D', 'E', 'I', 'L', 'R', 'X'],
      ['D', 'E', 'L', 'R', 'V', 'Y'],
      ['D', 'I', 'S', 'T', 'T', 'Y'],
      ['E', 'E', 'G', 'H', 'N', 'W'],
      ['E', 'E', 'I', 'N', 'S', 'U'],
      ['E', 'H', 'R', 'T', 'V', 'W'],
      ['E', 'I', 'O', 'S', 'S', 'T'],
      ['E', 'L', 'R', 'T', 'T', 'Y'],
      ['H', 'I', 'M', 'N', 'U', 'Qu'],
      ['H', 'L', 'N', 'N', 'R', 'Z']
    ];

    // Shuffle the dice
    const shuffledDice = [...dice].sort(() => Math.random() - 0.5);
    
    // Create new board by rolling each die
    const newBoard = shuffledDice.map(die => {
      const randomIndex = Math.floor(Math.random() * 6);
      return die[randomIndex];
    });

    // Convert 1D array to 4x4 grid
    const boardGrid = [];
    for (let i = 0; i < 4; i++) {
      boardGrid.push(newBoard.slice(i * 4, (i + 1) * 4));
    }

    setBoard(boardGrid);
    setSelectedLetters([]);
    setFoundWords([]);
    setScore(0);
    setTimeLeft(180);
    setIsPlaying(true);
  };

  // Handle letter selection
  const handleLetterClick = (row, col) => {
    if (!isPlaying) return;

    const letter = board[row][col];
    const lastSelected = selectedLetters[selectedLetters.length - 1];
    
    // Check if the letter is adjacent to the last selected letter
    if (lastSelected) {
      const [lastRow, lastCol] = lastSelected;
      const isAdjacent = Math.abs(row - lastRow) <= 1 && Math.abs(col - lastCol) <= 1;
      if (!isAdjacent) return;
    }

    // Check if the letter is already selected
    if (selectedLetters.some(([r, c]) => r === row && c === col)) return;

    setSelectedLetters([...selectedLetters, [row, col]]);
  };

  // Submit word
  const submitWord = () => {
    if (selectedLetters.length < 3) return;

    const word = selectedLetters.map(([row, col]) => {
      const letter = board[row][col];
      return letter === 'Qu' ? 'QU' : letter;
    }).join('');
    
    // Check if word is valid and not already found
    if (dictionary.has(word) && !foundWords.includes(word)) {
      const wordScore = calculateWordScore(word);
      setFoundWords([...foundWords, word]);
      setScore(score + wordScore);
    }

    setSelectedLetters([]);
  };

  // Calculate word score
  const calculateWordScore = (word) => {
    const length = word.length;
    if (length <= 3) return 1;
    if (length === 4) return 2;
    if (length === 5) return 3;
    if (length === 6) return 5;
    if (length === 7) return 7;
    return 11; // 8+ letters
  };

  // Timer effect
  useEffect(() => {
    let timer;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsPlaying(false);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  // Update possible words when board or dictionary changes
  useEffect(() => {
    if (board.length > 0 && dictionary.size > 0 && !isDictionaryLoading) {
      const words = findAllPossibleWords(board, dictionary);
      setPossibleWords(words);
    }
  }, [board, dictionary, isDictionaryLoading]);

  // Add keyboard event listener
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!isPlaying) return;
      
      const key = event.key.toUpperCase();
      if (key === 'Q') {
        // Special handling for 'Qu'
        const quTile = findTile('Qu');
        if (quTile) {
          setHighlightedTile(quTile);
          setTimeout(() => setHighlightedTile(null), 500);
        }
      } else if (/^[A-Z]$/.test(key)) {
        const tile = findTile(key);
        if (tile) {
          setHighlightedTile(tile);
          setTimeout(() => setHighlightedTile(null), 500);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, board]);

  // Helper function to find tile coordinates
  const findTile = (letter) => {
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        if (board[row][col] === letter) {
          return [row, col];
        }
      }
    }
    return null;
  };

  const renderTile = (letter, row, col) => {
    const isSelected = selectedLetters.some(([r, c]) => r === row && c === col);
    const isHighlighted = highlightedTile && highlightedTile[0] === row && highlightedTile[1] === col;
    const cacheKey = letter === 'Qu' ? 'Q' : letter;
    const cachedImage = preloadedImages[cacheKey];

    if (cachedImage) {
      const modifiedImageUrl = modifyImageColor(cachedImage, tileColor);
      
      return (
        <Box
          key={`${row}-${col}`}
          className={`${styles.letter} ${isSelected ? styles.selected : ''} ${isHighlighted ? styles.highlighted : ''}`}
          onClick={() => handleLetterClick(row, col)}
          style={{
            backgroundImage: `url(${modifiedImageUrl})`,
            backgroundSize: '100%',
            backgroundColor: isSelected ? '#4CAF50' : tileColor,
          }}
        />
      );
    }
    return null;
  };

  return (
    <Box className={styles.container}>
      <Box className={styles.gameInfo}>
        <Typography variant="h4">Score: {score}</Typography>
        <Typography variant="h5">Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</Typography>
        <Button 
          variant="contained" 
          onClick={initializeBoard}
          disabled={isDictionaryLoading}
        >
          {isDictionaryLoading ? 'Loading Dictionary...' : 'New Game'}
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => setShowHints(!showHints)}
          disabled={isDictionaryLoading || !isPlaying}
        >
          {showHints ? 'Hide Hints' : 'Show Hints'}
        </Button>
      </Box>

      {isDictionaryLoading ? (
        <Box className={styles.loadingMessage}>
          <Typography variant="h6">Loading Dictionary...</Typography>
        </Box>
      ) : (
        <>
          <Box className={styles.board}>
            {board.map((row, rowIndex) => (
              row.map((letter, colIndex) => renderTile(letter, rowIndex, colIndex))
            ))}
          </Box>

          <Box className={styles.controls}>
            <Button 
              variant="contained" 
              onClick={submitWord}
              disabled={selectedLetters.length < 3 || !isPlaying}
            >
              Submit Word
            </Button>
          </Box>

          <Box className={styles.wordLists}>
            <Box className={styles.foundWords}>
              <Typography variant="h6">Found Words:</Typography>
              {foundWords.map((word, index) => (
                <Typography key={index}>
                  {word} ({calculateWordScore(word)} points)
                </Typography>
              ))}
            </Box>

            {showHints && (
              <Box className={styles.possibleWords}>
                <Typography variant="h6">Possible Words:</Typography>
                {possibleWords.map(({ word, score }, index) => (
                  <Typography key={index}>
                    {word} ({score} points)
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default Boggle; 