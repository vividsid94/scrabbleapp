import React, { useEffect, useState, useRef } from 'react';
import { Box } from '@mui/material';

/**
 * MoveScoreAnimation Component
 * Beautiful animated display showing player and bot scores after each move
 */
export default function MoveScoreAnimation({ 
  trigger, 
  playerScore,
  botScore,
  playerName,
  botName,
  isPlayerMove,
  isBotMove
}) {
  const [isActive, setIsActive] = useState(false);
  const [displayPlayerScore, setDisplayPlayerScore] = useState(0);
  const [displayBotScore, setDisplayBotScore] = useState(0);
  const intervalsRef = useRef([]);
  const timeoutRef = useRef(null);


  useEffect(() => {
    // Clean up any existing intervals/timeouts
    intervalsRef.current.forEach(interval => {
      if (interval) clearInterval(interval);
    });
    intervalsRef.current = [];
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Debug: log when effect runs
    if (trigger > 0) {
      console.log('MoveScoreAnimation effect:', {
        trigger,
        playerScore,
        botScore,
        isPlayerMove,
        isBotMove,
        condition: trigger > 0 && (playerScore > 0 || botScore > 0)
      });
    }

    if (trigger > 0 && (playerScore > 0 || botScore > 0)) {
      console.log('Activating animation!');
      setIsActive(true);
      setDisplayPlayerScore(0);
      setDisplayBotScore(0);
      
      // Animate score counting up
      const animateScore = (targetScore, setScore) => {
        if (targetScore <= 0) return null;
        
        let current = 0;
        const increment = Math.max(1, Math.floor(targetScore / 25));
        const interval = setInterval(() => {
          current += increment;
          if (current >= targetScore) {
            current = targetScore;
            clearInterval(interval);
          }
          setScore(current);
        }, 15);
        
        return interval;
      };

      if (playerScore > 0 && isPlayerMove) {
        const interval = animateScore(playerScore, setDisplayPlayerScore);
        if (interval) intervalsRef.current.push(interval);
      }
      if (botScore > 0 && isBotMove) {
        const interval = animateScore(botScore, setDisplayBotScore);
        if (interval) intervalsRef.current.push(interval);
      }

      // Reset after animation
      timeoutRef.current = setTimeout(() => {
        setIsActive(false);
        setDisplayPlayerScore(0);
        setDisplayBotScore(0);
      }, 3000);
    }

    return () => {
      intervalsRef.current.forEach(interval => {
        if (interval) clearInterval(interval);
      });
      intervalsRef.current = [];
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [trigger, playerScore, botScore, isPlayerMove, isBotMove]);

  // Always log render to debug
  console.log('MoveScoreAnimation RENDER:', {
    isActive,
    trigger,
    playerScore,
    botScore,
    isPlayerMove,
    isBotMove,
    displayPlayerScore,
    displayBotScore
  });

  if (!isActive) {
    return null;
  }

  // Determine what to show
  const showPlayer = isPlayerMove && playerScore > 0;
  const showBot = isBotMove && botScore > 0;
  const showBoth = showPlayer && showBot;
  
  // If nothing to show, return null
  if (!showPlayer && !showBot) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        left: '50%',
        top: showBoth ? '25%' : '30%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 99999,
        textAlign: 'center',
        display: 'flex',
        flexDirection: showBoth ? 'column' : 'row',
        gap: showBoth ? '20px' : '40px',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Player Score Display */}
      {showPlayer && (
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Box
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#4A90E2',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              opacity: 0.9,
            }}
          >
            {playerName || 'You'}
          </Box>
          <Box
            sx={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: '#4A90E2',
              textShadow: `
                0 0 10px rgba(74, 144, 226, 0.8),
                0 0 20px rgba(74, 144, 226, 0.6),
                0 0 30px rgba(74, 144, 226, 0.4),
                2px 2px 4px rgba(0, 0, 0, 0.5)
              `,
              animation: 'scoreCelebratePlayer 3s ease-out forwards',
              fontFamily: 'Syne, sans-serif',
              '@keyframes scoreCelebratePlayer': {
                '0%': {
                  transform: 'scale(0) rotate(-180deg)',
                  opacity: 0,
                },
                '20%': {
                  transform: 'scale(1.2) rotate(0deg)',
                  opacity: 1,
                },
                '80%': {
                  transform: 'scale(1) rotate(0deg)',
                  opacity: 1,
                },
                '100%': {
                  transform: 'scale(0.9) translateY(-50px)',
                  opacity: 0,
                },
              },
            }}
          >
            +{displayPlayerScore}
          </Box>
          
          {/* Sparkle particles for player */}
          {Array.from({ length: 15 }).map((_, i) => (
            <Box
              key={`player-${i}`}
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '6px',
                height: '6px',
                backgroundColor: '#4A90E2',
                borderRadius: '50%',
                boxShadow: '0 0 10px #4A90E2',
                animation: `sparklePlayer 3s ease-out forwards`,
                animationDelay: `${i * 0.1}s`,
                '@keyframes sparklePlayer': {
                  '0%': {
                    transform: 'translate(-50%, -50%) scale(1) rotate(0deg)',
                    opacity: 1,
                  },
                  '100%': {
                    transform: `translate(-50%, -50%) scale(0) rotate(${360 * (i % 2 === 0 ? 1 : -1)}deg) translate(${(Math.random() - 0.5) * 250}px, ${(Math.random() - 0.5) * 250}px)`,
                    opacity: 0,
                  },
                },
              }}
            />
          ))}
        </Box>
      )}

      {/* VS Divider (only when showing both) */}
      {showBoth && (
        <Box
          sx={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'rgba(255, 255, 255, 0.6)',
            animation: 'fadeIn 0.5s ease-out 0.3s both',
            '@keyframes fadeIn': {
              '0%': { opacity: 0 },
              '100%': { opacity: 1 },
            },
          }}
        >
          VS
        </Box>
      )}

      {/* Bot Score Display */}
      {showBot && (
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Box
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#FF6B6B',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              opacity: 0.9,
            }}
          >
            {botName || 'Bot'}
          </Box>
          <Box
            sx={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: '#FF6B6B',
              textShadow: `
                0 0 10px rgba(255, 107, 107, 0.8),
                0 0 20px rgba(255, 107, 107, 0.6),
                0 0 30px rgba(255, 107, 107, 0.4),
                2px 2px 4px rgba(0, 0, 0, 0.5)
              `,
              animation: 'scoreCelebrateBot 3s ease-out forwards',
              fontFamily: 'Syne, sans-serif',
              '@keyframes scoreCelebrateBot': {
                '0%': {
                  transform: 'scale(0) rotate(180deg)',
                  opacity: 0,
                },
                '20%': {
                  transform: 'scale(1.2) rotate(0deg)',
                  opacity: 1,
                },
                '80%': {
                  transform: 'scale(1) rotate(0deg)',
                  opacity: 1,
                },
                '100%': {
                  transform: 'scale(0.9) translateY(-50px)',
                  opacity: 0,
                },
              },
            }}
          >
            +{displayBotScore}
          </Box>
          
          {/* Sparkle particles for bot */}
          {Array.from({ length: 15 }).map((_, i) => (
            <Box
              key={`bot-${i}`}
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '6px',
                height: '6px',
                backgroundColor: '#FF6B6B',
                borderRadius: '50%',
                boxShadow: '0 0 10px #FF6B6B',
                animation: `sparkleBot 3s ease-out forwards`,
                animationDelay: `${i * 0.1}s`,
                '@keyframes sparkleBot': {
                  '0%': {
                    transform: 'translate(-50%, -50%) scale(1) rotate(0deg)',
                    opacity: 1,
                  },
                  '100%': {
                    transform: `translate(-50%, -50%) scale(0) rotate(${360 * (i % 2 === 0 ? -1 : 1)}deg) translate(${(Math.random() - 0.5) * 250}px, ${(Math.random() - 0.5) * 250}px)`,
                    opacity: 0,
                  },
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
