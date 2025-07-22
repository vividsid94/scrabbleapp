import React, { useState, useEffect, useRef } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import styles from './Memory.module.css';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ThemeContext } from '../../App';
import Card from './Card';
import Confetti from '../../components/Confetti/Confetti';
import { Gear, GridFour, ImageSquare } from '@phosphor-icons/react';

const useInterval = (callback, delay, duration) => {
  const durationRef = useRef(duration);
  const durationIntervalRef = useRef();

  const handler = () => {
    callback(durationRef);
  };

  useEffect(() => {
    const durationInterval = setInterval(handler, delay);
    durationIntervalRef.current = durationInterval;
    return () => {
      clearInterval(durationInterval);
    };
  }, [delay]);

  return durationIntervalRef;
};

export default function Memory() {
  const { lightMode } = React.useContext(ThemeContext);
  const [gameState, setGameState] = useState({
    isPlaying: false,
    score: 0,
    moves: 0,
    matches: 0,
    timer: 0
  });
  const [list, setList] = useState([]);
  const [subLists, setSubLists] = useState([]);
  const [visibleItems, setVisibleItems] = useState([]);
  const [finishedItems, setFinishedItems] = useState([]);
  const [winner, setWinner] = useState(false);
  const matches = useMediaQuery('(min-width:600px)');
  const [theme, setTheme] = useState('mixed');
  const [numPairs, setNumPairs] = useState(8); // Default grid size (8 pairs = 16 cards)
  const [showConfetti, setShowConfetti] = useState(false);

  // Build a dynamic image pool from available assets
  const mascotAndIconImages = [
    { url: '/images/theomascot.png', description: 'Theo Mascot' },
    { url: '/images/theomascot2.png', description: 'Theo Mascot 2' },
    { url: '/images/theomascot3.png', description: 'Theo Mascot 3' },
    { url: '/images/theomascot4.png', description: 'Theo Mascot 4' },
    { url: '/images/tessmascot.png', description: 'Tess Mascot' },
    { url: '/images/tessmascot2.png', description: 'Tess Mascot 2' },
    { url: '/images/tessmascot3.png', description: 'Tess Mascot 3' },
    { url: '/images/player.png', description: 'Player Icon' },
    { url: '/images/t2icon.png', description: 'T2 Icon' },
    { url: '/images/t2icon2.png', description: 'T2 Icon 2' },
    { url: '/images/woogles-icon.png', description: 'Woogles Icon' },
    { url: '/images/cross-tables-icon.png', description: 'Cross-Tables Icon' },
    { url: '/images/me.jpg', description: 'Me' }
  ];
  const protiles = [
    'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','_'
  ].map(letter => ({
    url: `/images/compressed-clean-protiles/${letter}.png`,
    description: `Protile ${letter}`
  }));

  // Theme options
  const themeOptions = {
    mascots: mascotAndIconImages,
    protiles: protiles,
    mixed: [...mascotAndIconImages, ...protiles]
  };

  const getRandomImages = (pool, n) => {
    const shuffled = pool.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  };

  const startNewGame = () => {
    setGameState({
      isPlaying: true,
      score: 0,
      moves: 0,
      matches: 0,
      timer: 0
    });
    setVisibleItems([]);
    setFinishedItems([]);
    setWinner(false);
    // Pick N images from the selected theme pool
    const pool = themeOptions[theme];
    const chosen = getRandomImages(pool, numPairs);
    // Duplicate and shuffle for pairs
    const shuffledList = [...chosen, ...chosen].map((item, idx) => ({ ...item, id: idx + '-' + item.url })).sort(() => 0.5 - Math.random());
    setList(shuffledList);
  };

  const checkItems = (firstIndex, secondIndex) => {
    setGameState(prev => ({...prev, moves: prev.moves + 1}));
    
    if (firstIndex !== secondIndex && list[firstIndex].url === list[secondIndex].url) {
      setFinishedItems([...finishedItems, firstIndex, secondIndex]);
      setGameState(prev => ({
        ...prev,
        matches: prev.matches + 1,
        score: prev.score + 100
      }));
    } else {
      setTimeout(() => {
        setVisibleItems([]);
      }, 600);
    }
  };

  const durationIntervalRef = useInterval(
    durationRef => {
      if (gameState.isPlaying) {
        durationRef.current++;
        setGameState(prev => ({...prev, timer: durationRef.current}));
      }
    },
    1000,
    gameState.timer
  );

  useEffect(() => {
    if (finishedItems.length > 0 && finishedItems.length === list.length) {
      setWinner(true);
      setGameState(prev => ({...prev, isPlaying: false}));
      clearInterval(durationIntervalRef.current);
      setShowConfetti(true);
    }
  }, [finishedItems]);

  useEffect(() => {
    const numberOfColumns = matches ? 4 : 3;
    let tempSubLists = [];
    for (let i = 0; i < list.length; i += numberOfColumns) {
      tempSubLists.push(list.slice(i, i + numberOfColumns));
    }
    setSubLists(tempSubLists);
  }, [list, matches]);

  return (
    <Box sx={{ display: 'flex'}}>
      <Box className={styles.gameContainer} style={{color: lightMode === 'dark' ? '#fff' : '#000'}}>
        <Box className={styles.gameHeader}>
          <Box className={styles.settingsPanel}>
            <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Gear size={28} weight="duotone" style={{ color: '#4ECDC4' }} />
              <span style={{ fontWeight: 600, fontSize: 18, letterSpacing: 1 }}>Settings</span>
            </Box>
            <Box style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', fontWeight: 500, gap: 6 }}>
                <ImageSquare size={22} weight="duotone" style={{ color: '#7C3AED' }} />
                Theme:
                <select
                  value={theme}
                  onChange={e => {
                    setTheme(e.target.value);
                    if (gameState.isPlaying) startNewGame();
                  }}
                  style={{ marginLeft: 6, padding: 4, fontSize: 16, borderRadius: 6 }}
                >
                  <option value="mixed">Mixed</option>
                  <option value="mascots">Mascots & Icons</option>
                  <option value="protiles">Protiles Only</option>
                </select>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', fontWeight: 500, gap: 6 }}>
                <GridFour size={22} weight="duotone" style={{ color: '#F59E0B' }} />
                Difficulty:
                <select
                  value={numPairs}
                  onChange={e => {
                    setNumPairs(Number(e.target.value));
                    if (gameState.isPlaying) startNewGame();
                  }}
                  style={{ marginLeft: 6, padding: 4, fontSize: 16, borderRadius: 6 }}
                >
                  <option value={6}>Easy (6 pairs)</option>
                  <option value={8}>Medium (8 pairs)</option>
                  <option value={12}>Hard (12 pairs)</option>
                </select>
              </label>
            </Box>
            <Box style={{ display: 'flex', gap: 24, alignItems: 'center', margin: '18px 0 0 0', width: '100%' }}>
              <span style={{ fontWeight: 500, fontSize: 15, color: '#374151' }}>Time: {gameState.timer}s</span>
              <span style={{ fontWeight: 500, fontSize: 15, color: '#374151' }}>Moves: {gameState.moves}</span>
              <span style={{ fontWeight: 500, fontSize: 15, color: '#374151' }}>Score: {gameState.score}</span>
              <button
                className={styles.newGameModernButton}
                onClick={startNewGame}
              >
                New Game
              </button>
            </Box>
          </Box>
        </Box>

        <table className={styles.gameBoard}>
          <tbody>
            {subLists.map((subList, subListIndex) => (
              <tr className={styles.row} key={subListIndex}>
                {subList.map((item, index) => (
                  <td key={item.id}>
                    <Card
                      className={`${
                        visibleItems.includes(subListIndex * subList.length + index)
                          ? styles.cardShow
                          : ''
                      } ${
                        finishedItems.includes(subListIndex * subList.length + index)
                          ? styles.cardFinished
                          : ''
                      }`}
                      onClick={() => {
                        if (!gameState.isPlaying) return;
                        if (!finishedItems.includes(subListIndex * subList.length + index)) {
                          switch (visibleItems.length) {
                            case 0:
                              setVisibleItems([subListIndex * subList.length + index]);
                              break;
                            case 1:
                              if (visibleItems[0] !== subListIndex * subList.length + index) {
                                setVisibleItems(
                                  visibleItems.concat(subListIndex * subList.length + index)
                                );
                                checkItems(visibleItems[0], subListIndex * subList.length + index);
                              }
                              break;
                            case 2:
                              setVisibleItems([subListIndex * subList.length + index]);
                              break;
                            default:
                              setVisibleItems([]);
                          }
                        }
                      }}
                      imgSource={item.url}
                      imgDesc={item.description}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {winner && (
          <>
            <Confetti winner="player" isVisible={showConfetti} onComplete={() => setShowConfetti(false)} />
            <Box className={styles.winnerMessage}>
              <Typography variant="h4">Congratulations! You Win!</Typography>
              <Typography>Time: {gameState.timer} seconds</Typography>
              <Typography>Moves: {gameState.moves}</Typography>
              <Typography>Score: {gameState.score}</Typography>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
