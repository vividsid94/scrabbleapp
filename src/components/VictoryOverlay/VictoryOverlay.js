import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const StyledPaper = styled(Paper)(({ theme, isWinner }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  background: isWinner 
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  color: 'white',
  borderRadius: 20,
  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
  border: '3px solid',
  borderColor: isWinner ? '#FFD700' : '#C0C0C0',
  animation: 'victoryPulse 2s ease-in-out infinite',
  '@keyframes victoryPulse': {
    '0%, 100%': {
      transform: 'scale(1)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    },
    '50%': {
      transform: 'scale(1.05)',
      boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
    },
  },
}));

const TrophyIcon = styled(EmojiEventsIcon)(({ theme, isWinner }) => ({
  fontSize: 80,
  color: isWinner ? '#FFD700' : '#C0C0C0',
  marginBottom: theme.spacing(2),
  animation: 'trophyBounce 1s ease-in-out infinite',
  '@keyframes trophyBounce': {
    '0%, 100%': {
      transform: 'translateY(0px)',
    },
    '50%': {
      transform: 'translateY(-10px)',
    },
  },
}));

const ScoreDisplay = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-around',
  margin: theme.spacing(3, 0),
  padding: theme.spacing(2),
  background: 'rgba(255,255,255,0.1)',
  borderRadius: 15,
  backdropFilter: 'blur(10px)',
}));

const PlayerScore = styled(Box)(({ theme, isWinner }) => ({
  textAlign: 'center',
  padding: theme.spacing(2),
  borderRadius: 10,
  background: isWinner ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.1)',
  border: isWinner ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.3)',
  transform: isWinner ? 'scale(1.1)' : 'scale(1)',
  transition: 'all 0.3s ease',
}));

const VictoryOverlay = ({ 
  isVisible, 
  winner, 
  player1Name, 
  player2Name, 
  player1Score, 
  player2Score,
  onNewGame,
  onClose 
}) => {
  if (!isVisible) return null;

  const isPlayerWinner = winner === 'player';
  const winnerName = isPlayerWinner ? player1Name : player2Name;
  const winnerScore = isPlayerWinner ? player1Score : player2Score;
  const loserScore = isPlayerWinner ? player2Score : player1Score;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(5px)',
      }}
    >
      <StyledPaper isWinner={isPlayerWinner} elevation={24}>
        <TrophyIcon isWinner={isPlayerWinner} />
        
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          {isPlayerWinner ? '🎉 VICTORY! 🎉' : '🏆 GAME OVER 🏆'}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ opacity: 0.9 }}>
          {isPlayerWinner ? 'You crushed the bot!' : 'The bot got the best of you!'}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
          {isPlayerWinner ? (
            <SportsEsportsIcon sx={{ fontSize: 40, mr: 1, color: '#FFD700' }} />
          ) : (
            <SmartToyIcon sx={{ fontSize: 40, mr: 1, color: '#C0C0C0' }} />
          )}
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {winnerName}
          </Typography>
        </Box>
        
        <ScoreDisplay>
          <PlayerScore isWinner={isPlayerWinner}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {isPlayerWinner ? player1Name : player2Name}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FFD700' }}>
              {winnerScore}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              WINNER
            </Typography>
          </PlayerScore>
          
          <PlayerScore isWinner={!isPlayerWinner}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {isPlayerWinner ? player2Name : player1Name}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#C0C0C0' }}>
              {loserScore}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              RUNNER UP
            </Typography>
          </PlayerScore>
        </ScoreDisplay>
        
        <Typography variant="h6" sx={{ mb: 3, opacity: 0.8 }}>
          Final Score: {winnerScore} - {loserScore}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={onNewGame}
            sx={{
              background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': {
                background: 'linear-gradient(45deg, #45a049 30%, #4CAF50 90%)',
              },
            }}
          >
            Play Again
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            onClick={onClose}
            sx={{
              borderColor: 'white',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': {
                borderColor: '#FFD700',
                color: '#FFD700',
              },
            }}
          >
            Close
          </Button>
        </Box>
      </StyledPaper>
    </Box>
  );
};

export default VictoryOverlay; 