import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { origBoard } from '../../components/AppContent/References/staticData';

const SimulationModal = ({
  open,
  onClose,
  simulationBoard,
  theme = "STANDARD",
  color = { current: '#6D84A2' },
  complementaryColor = { current: '#9F7A83' },
  blankTiles = [],
  simulatingMove,
  simulationProgress,
  simulationResult,
  moveWithResults,
  onStartSimulation
}) => {
  if (!open || !simulationBoard) {
    return null;
  }

  const formatScore = (score) => {
    return typeof score === 'number' ? score.toFixed(1) : '0.0';
  };

  const boardMultipliers = JSON.parse(origBoard);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
        textAlign: 'center',
        pointerEvents: 'auto',
      }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%), url("https://www.transparenttextures.com/patterns/bright-squares.png")',
          color: 'white',
          padding: '20px 25px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
          backdropFilter: 'blur(15px)',
          minWidth: '280px',
          position: 'relative',
        }}
      >
        {/* Close X button */}
        <Box
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            fontSize: '18px',
            cursor: 'pointer',
            opacity: 0.8,
            transition: 'opacity 0.3s ease',
            '&:hover': {
              opacity: 1,
            },
          }}
        >
          ✕
        </Box>
        
        <Box sx={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          mb: 2,
          textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
          letterSpacing: '0.5px'
        }}>
          Metrics
        </Box>

        {/* Simulation Board */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          mb: 3
        }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(15, 1fr)',
            padding: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {simulationBoard.map((row, rowIndex) => 
              row.map((cell, colIndex) => {
                const mult = boardMultipliers[rowIndex][colIndex];
                let bg = 'rgba(255, 255, 255, 0.9)';
                if (mult === 3 || mult === 4) bg = 'rgba(200, 200, 200, 0.9)';
                else if (mult === 2) bg = 'rgba(220, 220, 220, 0.9)';
                else if (mult === 1) bg = 'rgba(240, 240, 240, 0.9)';
                if (typeof cell === 'string') bg = 'rgba(255, 255, 255, 1)';
                
                return (
                  <Box
                    key={`${rowIndex}-${colIndex}`}
                    sx={{
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: bg,
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      fontSize: '8px',
                      fontWeight: typeof cell === 'string' ? 'bold' : 'normal',
                      color: typeof cell === 'string' ? '#333' : '#666'
                    }}
                  >
                    {typeof cell === 'string' ? cell : ''}
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

        {/* Simulation Progress */}
        {simulatingMove && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              fontSize: '12px', 
              opacity: 0.9,
              mb: 1
            }}>
              Simulating: {simulatingMove.word} ({simulatingMove.score} pts)
            </Box>
            <Box sx={{ 
              width: '100%', 
              height: 6, 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <Box sx={{
                width: `${simulationProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #4CAF50 0%, #45a049 100%)',
                transition: 'width 0.3s ease'
              }} />
            </Box>
          </Box>
        )}

        {/* Start Simulation Button */}
        {moveWithResults && !simulatingMove && (
          <Box sx={{ mb: 3 }}>
            <Box
              onClick={() => {
                // Trigger simulation - we'll need to pass this function as a prop
                if (onStartSimulation) {
                  onStartSimulation(moveWithResults);
                }
              }}
              sx={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                padding: '8px 20px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px',
                backdropFilter: 'blur(10px)',
                display: 'inline-block',
                transition: 'all 0.3s ease',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
                },
              }}
            >
              Start Simulation
            </Box>
          </Box>
        )}

        {/* Simulation Results */}
        {simulationResult && moveWithResults && (
          <Box sx={{ 
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            mb: 2
          }}>
            <Box sx={{ 
              fontSize: '14px', 
              fontWeight: 'bold',
              mb: 2,
              color: '#FFD700'
            }}>
              Results
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <Box sx={{ opacity: 0.9 }}>Win Rate:</Box>
                <Box sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                  {formatScore(simulationResult.winRate)}%
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <Box sx={{ opacity: 0.9 }}>Avg Score:</Box>
                <Box sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                  {formatScore(simulationResult.avgScore)}
                </Box>
              </Box>
            </Box>
          </Box>
        )}
        
        {/* Close Button */}
        <Box
          onClick={onClose}
          sx={{
            background: 'rgba(255, 255, 255, 0.15)',
            color: 'white',
            padding: '6px 16px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '11px',
            backdropFilter: 'blur(10px)',
            display: 'inline-block',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              transform: 'translateY(-2px)',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
            },
          }}
        >
          Close
        </Box>
      </Box>
    </Box>
  );
};

export default SimulationModal; 