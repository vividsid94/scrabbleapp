import React from 'react';
import { Modal, Box, Typography, Button, CircularProgress, Paper, LinearProgress } from '@mui/material';
import styles from './TopMovesModal.module.css';

const TopMovesModal = ({
  open,
  onClose,
  isTopMovesLoading,
  isDictionaryLoading,
  topMoves = [],
  onMoveSelect,
  onSimulateMove,
  simulatingMove,
  simulationResult,
  simulationProgress
}) => {
  const formatScore = (score) => {
    if (score === undefined || score === null || isNaN(score)) return 'N/A';
    return Math.round(score).toString();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="top-moves-modal"
    >
      <Box className={styles.modalContainer}>
        <Paper 
          elevation={3}
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            p: 3,
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 3,
              fontWeight: 'bold',
              background: 'linear-gradient(75deg, #4B5563 0%, #6B7280 50%, #4B5563 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center'
            }}
          >
            Top Moves
          </Typography>
          
          {isTopMovesLoading || isDictionaryLoading ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 2,
              py: 4
            }}>
              <CircularProgress size={32} />
              <Typography sx={{ color: '#6B7280' }}>
                {isDictionaryLoading ? 'Loading dictionary...' : 'Finding best moves...'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {topMoves.map((move, index) => {
                const isSimulating = simulatingMove === move;
                const hasSimulation = simulationResult?.move === move;
                
                return (
                  <Paper
                    key={index}
                    elevation={1}
                    sx={{
                      p: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3
                      },
                      background: hasSimulation ? 'rgba(76, 175, 80, 0.05)' : 'white'
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: hasSimulation ? 1 : 0
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          sx={{ 
                            color: '#4B5563',
                            fontWeight: 'medium',
                            fontSize: '1.1rem'
                          }}
                        >
                          {move.word}
                        </Typography>
                        <Typography 
                          sx={{ 
                            color: '#6B7280',
                            fontSize: '0.9rem'
                          }}
                        >
                          {move.startPosition} {move.direction === 'right' ? '→' : '↓'}
                        </Typography>
                        <Typography 
                          sx={{ 
                            color: '#4CAF50',
                            fontWeight: 'bold',
                            ml: 1
                          }}
                        >
                          {move.score} pts
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onSimulateMove(move)}
                        disabled={isSimulating}
                        sx={{
                          borderColor: '#4CAF50',
                          color: '#4CAF50',
                          '&:hover': {
                            borderColor: '#388E3C',
                            backgroundColor: 'rgba(76, 175, 80, 0.04)'
                          }
                        }}
                      >
                        {isSimulating ? (
                          <>
                            <CircularProgress size={16} sx={{ mr: 1, color: '#4CAF50' }} />
                            Simulating...
                          </>
                        ) : (
                          'Small Sim'
                        )}
                      </Button>
                    </Box>
                    
                    {isSimulating && (
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress 
                          variant="determinate"
                          value={simulationProgress * 100}
                          sx={{ 
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#4CAF50'
                            }
                          }} 
                        />
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block',
                            textAlign: 'center',
                            mt: 0.5,
                            color: '#6B7280'
                          }}
                        >
                          Running simulation {Math.round(simulationProgress * 5)}/5...
                        </Typography>
                      </Box>
                    )}
                    
                    {hasSimulation && (
                      <Box sx={{ 
                        mt: 1,
                        pt: 1,
                        borderTop: '1px solid rgba(0,0,0,0.1)'
                      }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#6B7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <span>After {formatScore(simulationResult.avgMoves)} moves:</span>
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 2,
                            ml: 1
                          }}>
                            <span style={{ color: '#4CAF50' }}>
                              You: {formatScore(simulationResult.avgScore)}
                            </span>
                            <span style={{ color: '#F44336' }}>
                              Bot: {formatScore(simulationResult.avgBotScore)}
                            </span>
                          </Box>
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}
        </Paper>
      </Box>
    </Modal>
  );
};

export default TopMovesModal; 