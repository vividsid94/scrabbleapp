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

  // Mobile responsiveness
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Responsive card sizing
  const cardSize = isMobile ? 60 : 80;
  const cardSpacing = isMobile ? 6 : 8;

  // Build a dynamic image pool from available assets
  const mascotAndIconImages = [
    { url: '/images/compressed/theomascot-compressed.png', description: 'Theo Mascot' },
    { url: '/images/compressed/theomascot2-compressed.png', description: 'Theo Mascot 2' },
    { url: '/images/compressed/theomascot3-compressed.png', description: 'Theo Mascot 3' },
    { url: '/images/compressed/theomascot4-compressed.png', description: 'Theo Mascot 4' },
    { url: '/images/compressed/tessmascot-compressed.png', description: 'Tess Mascot' },
    { url: '/images/compressed/tessmascot2-compressed.png', description: 'Tess Mascot 2' },
    { url: '/images/compressed/tessmascot3-compressed.png', description: 'Tess Mascot 3' },
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
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 2, sm: 4, md: 6 },
        px: { xs: 1, sm: 2, md: 3 }
      }}>
        <Box sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 1000, md: 1200 },
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0
        }}>
          {/* Controls Section */}
          <div style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : 1200,
            marginBottom: isMobile ? 16 : 20,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 16 : 20,
            alignItems: 'flex-start'
          }}>
            {/* Left quarter - Controls */}
            <div style={{
              width: isMobile ? '100%' : '25%',
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? 8 : 10
            }}>
              {/* Theme Selection */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? 6 : 8,
                alignItems: 'center'
              }}>
                <label style={{
                  fontWeight: 600,
                  marginBottom: 4,
                  textAlign: 'center',
                  fontSize: isMobile ? 14 : 16
                }}>Theme:</label>
                <select
                  value={theme}
                  onChange={e => {
                    setTheme(e.target.value);
                    if (gameState.isPlaying) startNewGame();
                  }}
                  style={{
                    fontSize: isMobile ? 12 : 14,
                    padding: isMobile ? '4px 8px' : '6px 12px',
                    borderRadius: 6,
                    width: '100%',
                    maxWidth: isMobile ? '100%' : 200
                  }}
                >
                  <option value="mixed">Mixed</option>
                  <option value="mascots">Mascots & Icons</option>
                  <option value="protiles">Protiles Only</option>
                </select>
              </div>

              {/* Difficulty Selection */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? 6 : 8,
                alignItems: 'center'
              }}>
                <label style={{
                  fontWeight: 600,
                  marginBottom: 4,
                  textAlign: 'center',
                  fontSize: isMobile ? 14 : 16
                }}>Difficulty:</label>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: isMobile ? 1 : 2, 
                  justifyContent: 'center',
                  width: '100%'
                }}>
                  {[
                    { value: 6, label: 'Easy (6 pairs)' },
                    { value: 8, label: 'Medium (8 pairs)' },
                    { value: 12, label: 'Hard (12 pairs)' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setNumPairs(option.value);
                        if (gameState.isPlaying) startNewGame();
                      }}
                      style={{
                        padding: isMobile ? '1px 3px' : '2px 4px',
                        fontSize: isMobile ? 7 : 9,
                        borderRadius: 3,
                        background: numPairs === option.value 
                          ? 'linear-gradient(45deg, transparent 5%, #4ECDC4 5%)'
                          : 'linear-gradient(45deg, transparent 5%, #1F2937 5%)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        letterSpacing: 0.2,
                        boxShadow: numPairs === option.value 
                          ? '2px 0px 0px #3D5A80'
                          : '2px 0px 0px #374151',
                        outline: 'transparent',
                        position: 'relative',
                        userSelect: 'none',
                        marginLeft: 0,
                        marginRight: 0,
                        marginBottom: 0,
                        transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                        transform: numPairs === option.value ? 'scale(1.01)' : 'scale(1)',
                        zIndex: numPairs === option.value ? 2 : 1,
                        flex: isMobile ? '1 1 calc(33% - 1px)' : '1 1 calc(33% - 1px)',
                        minWidth: isMobile ? '20px' : '25px',
                        height: isMobile ? '20px' : '24px'
                      }}
                    >
                      {option.value}
                      {numPairs === option.value && (
                        <span style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: -2,
                          height: 1,
                          background: '#4ECDC4',
                          borderRadius: 1,
                          width: '100%',
                          display: 'block',
                        }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row', 
                gap: isMobile ? 8 : 8,
                width: '100%'
              }}>
                <button onClick={startNewGame} style={{ 
                  flex: '1',
                  padding: isMobile ? '3px 8px' : '2px 6px', 
                  fontSize: isMobile ? 10 : 9, 
                  borderRadius: 4, 
                  background: 'linear-gradient(45deg, transparent 5%, #4ECDC4 5%)',
                  color: '#fff', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  letterSpacing: 0.3,
                  boxShadow: '3px 0px 0px #3D5A80',
                  outline: 'transparent',
                  position: 'relative',
                  userSelect: 'none',
                  transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                  height: isMobile ? '24px' : '20px'
                }}>
                  New Game
                </button>
              </div>

              {/* Game Stats */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? 4 : 6,
                alignItems: 'center',
                marginTop: isMobile ? 8 : 12
              }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row', 
                  gap: isMobile ? 4 : 12,
                  alignItems: 'center',
                  fontSize: isMobile ? 12 : 14,
                  fontWeight: 500,
                  color: '#374151'
                }}>
                  <span>Time: {gameState.timer}s</span>
                  <span>Moves: {gameState.moves}</span>
                  <span>Score: {gameState.score}</span>
                </div>
              </div>
            </div>

            {/* Right three-quarters - Game Board */}
            <div style={{
              width: isMobile ? '100%' : '75%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              overflow: 'hidden'
            }}>
              <div style={{
                maxWidth: '100%',
                overflow: 'auto'
              }}>
                <table style={{
                  borderSpacing: cardSpacing,
                  margin: '0 auto'
                }}>
                  <tbody>
                    {subLists.map((subList, subListIndex) => (
                      <tr key={subListIndex} style={{
                        display: 'flex',
                        gap: cardSpacing,
                        marginBottom: cardSpacing
                      }}>
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
                              style={{
                                width: cardSize,
                                height: cardSize
                              }}
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
              </div>
            </div>
          </div>

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
    </Box>
  );
}
