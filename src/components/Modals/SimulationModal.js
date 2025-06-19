import React from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
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
  moveWithResults
}) => {
  if (!simulationBoard) {
    return null;
  }

  const formatScore = (score) => {
    return typeof score === 'number' ? score.toFixed(1) : '0.0';
  };

  const boardMultipliers = JSON.parse(origBoard); // 15x15 array

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="simulation-modal"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 500,
          minWidth: 0,
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          p: 0,
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40px',
            background: 'linear-gradient(135deg, #7F9CF5 0%, #667EEA 100%)',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            '&:hover': {
              background: 'linear-gradient(135deg, #667EEA 0%, #5A67D8 100%)',
            },
            mb: '8px',
          }}
        >
          <Typography 
            variant="h6" 
            sx={{
              color: 'white',
              fontWeight: 600,
              fontSize: '1.1rem',
              letterSpacing: '0.5px'
            }}
          >
            Move Simulation
          </Typography>
          <IconButton 
            onClick={onClose}
            sx={{ 
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 4, pt: '56px' }}>
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
              fontFamily: 'monospace'
            }}>
              {simulationBoard.map((row, rowIndex) => 
                row.map((cell, colIndex) => {
                  // Get the multiplier for this cell
                  const mult = boardMultipliers[rowIndex][colIndex];
                  let bg = '#fff'; // default
                  if (mult === 3 || mult === 4) bg = '#bbb';      // triple word - darkest
                  else if (mult === 2) bg = '#ddd'; // double word - medium
                  else if (mult === 1) bg = '#eee'; // double letter - light
                  else bg = '#fff';                 // normal
                  // If there's a letter, keep it white for contrast
                  if (typeof cell === 'string') bg = '#fff';
                  return (
                    <Box
                      key={`${rowIndex}-${colIndex}`}
                      sx={{
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: bg,
                        border: '1px solid #ddd',
                        fontSize: '10px',
                        fontWeight: typeof cell === 'string' ? 'bold' : 'normal',
                        color: typeof cell === 'string' ? '#000' : '#999'
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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Simulating move: {simulatingMove.word} ({simulatingMove.score} pts)
              </Typography>
              <Box sx={{ 
                width: '100%', 
                height: 4, 
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <Box sx={{
                  width: `${simulationProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(135deg, #667EEA 0%, #5A67D8 100%)',
                  transition: 'width 0.3s ease'
                }} />
              </Box>
            </Box>
          )}

          {/* Simulation Results */}
          {simulationResult && moveWithResults && (
            <Box sx={{ 
              p: 2, 
              backgroundColor: 'rgba(76, 175, 80, 0.05)',
              borderRadius: 2,
              border: '1px solid rgba(76, 175, 80, 0.2)'
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#2D3748' }}>
                Simulation Results
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Win Rate:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                    {formatScore(simulationResult.winRate)}%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Average Score:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2196F3' }}>
                    {formatScore(simulationResult.avgScore)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default SimulationModal; 