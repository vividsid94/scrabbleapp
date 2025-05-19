import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import styles from './Boggle.module.css';
import { findAllPossibleWords, canFormWord } from '../../functions/boggleFunctions';

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
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const newBoard = Array(4).fill().map(() => 
      Array(4).fill().map(() => letters[Math.floor(Math.random() * letters.length)])
    );
    setBoard(newBoard);
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

    const word = selectedLetters.map(([row, col]) => board[row][col]).join('');
    
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
              <Box key={rowIndex} className={styles.row}>
                {row.map((letter, colIndex) => (
                  <Box
                    key={`${rowIndex}-${colIndex}`}
                    className={`${styles.letter} ${
                      selectedLetters.some(([r, c]) => r === rowIndex && c === colIndex) ? styles.selected : ''
                    }`}
                    onClick={() => handleLetterClick(rowIndex, colIndex)}
                  >
                    {letter}
                  </Box>
                ))}
              </Box>
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