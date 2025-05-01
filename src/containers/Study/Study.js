import React, { useState, useEffect } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Study.module.css';
import { ThemeContext } from '../../App';

export default function Study() {
  const { lightMode } = React.useContext(ThemeContext);
  const [currentLetters, setCurrentLetters] = useState("");
  const [userInput, setUserInput] = useState("");
  const [foundWords, setFoundWords] = useState(new Set());
  const [allSolutions, setAllSolutions] = useState([]);
  const [eightLetterExtensions, setEightLetterExtensions] = useState([]);
  const [currentExtension, setCurrentExtension] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState('anagram'); // 'anagram' or 'extension'

  const getNewWord = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/.netlify/functions/studyLogic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getRandomWord'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data || !data.letters || !data.solutions) {
        throw new Error('Invalid response format from server');
      }
      
      setCurrentLetters(data.letters);
      setAllSolutions(data.solutions);
      setFoundWords(new Set());
      setUserInput("");
      setFeedback("");
      setPhase('anagram');
    } catch (error) {
      console.error('Error getting new word:', error);
      setError("Error getting new word. Please try again.");
      setFeedback("Error getting new word. Please try again.");
    }
    setIsLoading(false);
  };

  const handleAnagramSubmit = async () => {
    if (!userInput) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/.netlify/functions/studyLogic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validate',
          word: userInput
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      setTotalAttempts(prev => prev + 1);
      
      if (data.isValid) {
        if (foundWords.has(userInput)) {
          setFeedback("You already found this word! Try another one. 🔄");
        } else {
          setFoundWords(prev => new Set([...prev, userInput]));
          setScore(prev => prev + 1);
          setFeedback("Correct! 🎉");
          
          // Check if all solutions are found
          if (foundWords.size + 1 === allSolutions.length) {
            // Move to extension phase
            const extensionsResponse = await fetch('/.netlify/functions/studyLogic', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'getExtensions',
                word: userInput
              })
            });

            if (!extensionsResponse.ok) {
              throw new Error(`Server responded with status: ${extensionsResponse.status}`);
            }

            const extensionsData = await extensionsResponse.json();
            if (!extensionsData || !extensionsData.extensions) {
              throw new Error('Invalid response format for extensions');
            }

            setEightLetterExtensions(extensionsData.extensions);
            setCurrentExtension(0);
            setPhase('extension');
          }
        }
      } else {
        setFeedback(`Incorrect. ${data.reason || "Word not found in dictionary"} 💪`);
      }
    } catch (error) {
      console.error('Error validating word:', error);
      setError("Error validating word. Please try again.");
      setFeedback("Error validating word. Please try again.");
    }
    setIsLoading(false);
  };

  const handleNextExtension = () => {
    if (currentExtension < eightLetterExtensions.length - 1) {
      setCurrentExtension(prev => prev + 1);
    } else {
      // Move to next word
      getNewWord();
    }
  };

  useEffect(() => {
    getNewWord();
  }, []);

  if (error) {
    return (
      <Box sx={{ display: 'flex'}}>
        <Sidenav/>
        <Box className={styles.page}>
          <Box className={styles.title}>
            Anagram Study Mode
          </Box>
          <Box className={styles.content} style={{color: lightMode === 'dark' ? '#fff' : '#000'}}>
            <Box className={styles.error}>
              {error}
              <button onClick={getNewWord} className={styles.retryButton}>
                Retry
              </button>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
      <Box className={styles.page}>
        <Box className={styles.title}>
          Anagram Study Mode
        </Box>
        <Box className={styles.content} style={{color: lightMode === 'dark' ? '#fff' : '#000'}}>
          <Box className={styles.stats}>
            <div>Score: {score}</div>
            <div>Attempts: {totalAttempts}</div>
            <div>Found: {foundWords.size}/{allSolutions.length}</div>
          </Box>
          
          {isLoading ? (
            <Box className={styles.loading}>
              Loading...
            </Box>
          ) : (
            <Box className={styles.quizArea}>
              <div className={styles.currentLetters}>
                {currentLetters.split('').map((letter, index) => (
                  <span key={index} className={styles.letterTile}>{letter}</span>
                ))}
              </div>
              
              {phase === 'anagram' ? (
                <>
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value.toUpperCase())}
                    className={styles.input}
                    placeholder="Enter an anagram..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAnagramSubmit();
                      }
                    }}
                  />
                  <button 
                    onClick={handleAnagramSubmit}
                    className={styles.submitButton}
                    disabled={isLoading}
                  >
                    Submit
                  </button>
                </>
              ) : (
                <Box className={styles.extensionArea}>
                  <div className={styles.extensionWord}>
                    {eightLetterExtensions[currentExtension]}
                  </div>
                  <button 
                    onClick={handleNextExtension}
                    className={styles.nextButton}
                  >
                    {currentExtension < eightLetterExtensions.length - 1 ? 'Next Extension' : 'Next Word'}
                  </button>
                </Box>
              )}
            </Box>
          )}

          {feedback && (
            <Box className={styles.feedback}>
              {feedback}
            </Box>
          )}

          {foundWords.size > 0 && (
            <Box className={styles.foundWords}>
              <h3>Found Words:</h3>
              <div className={styles.wordList}>
                {Array.from(foundWords).map((word, index) => (
                  <span key={index} className={styles.foundWord}>{word}</span>
                ))}
              </div>
            </Box>
          )}
        </Box>
      </Box>   
    </Box>
  );
} 