import React, { useRef } from 'react';
import { Modal, Box, Typography, Button, CircularProgress, Paper, LinearProgress, IconButton, Tooltip } from '@mui/material';
import Board from '../AppContent/Board/Board';
import { createBoard } from '../../functions/boardFunctions';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import InfoIcon from '@mui/icons-material/Info';

const ChoicesModal = ({
  open,
  onClose,
  isTopMovesLoading,
  isDictionaryLoading,
  topMoves = [],
  onMoveSelect,
  onSimulateMove,
  simulatingMove,
  simulationResult,
  simulationProgress,
  moveWithResults,
  previewBoard,
  boardCoords,
  theme = "STANDARD",
  color = { current: '#6D84A2' },
  complementaryColor = { current: '#9F7A83' },
  blankTiles = [],
  leaveValues = {}
}) => {
  const formatScore = (score) => {
    return typeof score === 'number' ? score.toFixed(1) : '0.0';
  };

  const handleSimulate = async (move) => {
    if (onSimulateMove) {
      onSimulateMove(move);
    }
  };

  const handleMoveSelect = (move) => {
    if (onMoveSelect) {
      onMoveSelect(move);
    }
  };

  const board = createBoard(
    previewBoard || boardCoords,
    [],
    "PROTILES",
    theme,
    color.current,
    complementaryColor.current,
    blankTiles
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="top-moves-modal"
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
            position: 'relative',
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
              Move Choices
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

          <Box sx={{ p: 3, pt: '56px' }}>
            {previewBoard && (
              <Box sx={{ 
                mb: 3, 
                display: 'flex', 
                justifyContent: 'center',
                transform: 'scale(0.7)',
                transformOrigin: 'top center',
                height: '350px',
                overflow: 'visible',
                position: 'relative'
              }}>
                <Box sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  <Board
                    board={board}
                    boardMode={theme}
                    onBoardChildClick={() => {}}
                    onTileDrop={() => {}}
                    selectedPosition={null}
                    arrowDirection="right"
                    onArrowDirectionChange={() => {}}
                    animate={false}
                    showSlip={false}
                    showDictionary={false}
                    dictionary=""
                  />
                </Box>
              </Box>
            )}
            
            {isTopMovesLoading || isDictionaryLoading ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                gap: 2,
                p: 4 
              }}>
                <CircularProgress size={40} />
                <Typography variant="body1" color="text.secondary">
                  Analyzing possible moves...
                </Typography>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 1.5,
                maxHeight: 'calc(90vh - 400px)',
                overflowY: 'auto',
                px: 1,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#c1c1c1',
                  borderRadius: '4px',
                  '&:hover': {
                    background: '#a8a8a8',
                  },
                },
              }}>
                {topMoves.map((move, index) => (
                  <Paper
                    key={index}
                    elevation={2}
                    sx={{
                      p: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.25,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
                      },
                      cursor: 'pointer',
                      position: 'relative',
                      border: (simulatingMove === move || moveWithResults === move) ? '2px solid #4CAF50' : 'none',
                      backgroundColor: (simulatingMove === move || moveWithResults === move) ? 'rgba(76, 175, 80, 0.05)' : 'white',
                      borderRadius: '6px',
                      overflow: 'visible',
                    }}
                    onClick={() => handleMoveSelect(move)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: '#2D3748',
                            minWidth: '140px'
                          }}
                        >
                          {move.isExchange ? (
                            `Exchange ${move.tiles.map(t => t.letter).join('')}`
                          ) : (
                            `${move.startPosition} ${move.direction === 'right' ? '→' : '↓'} ${move.word}`
                          )}
                        </Typography>
                        {!move.isExchange && (
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              color: '#4CAF50',
                              fontWeight: 'bold',
                              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.15) 100%)',
                              padding: '1px 4px',
                              borderRadius: '4px',
                              minWidth: '60px',
                              textAlign: 'center',
                              boxShadow: '0 2px 4px rgba(76, 175, 80, 0.1)',
                              border: '1px solid rgba(76, 175, 80, 0.2)',
                              fontSize: '0.85rem'
                            }}
                          >
                            {move.score} pts
                          </Typography>
                        )}
                        {leaveValues[move.leave] !== undefined && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                color: '#2196F3',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.15) 100%)',
                                padding: '1px 4px',
                                borderRadius: '4px',
                                minWidth: '60px',
                                textAlign: 'center',
                                boxShadow: '0 2px 4px rgba(33, 150, 243, 0.1)',
                                border: '1px solid rgba(33, 150, 243, 0.2)',
                                fontSize: '0.85rem'
                              }}
                            >
                              {formatScore(leaveValues[move.leave])} {move.leave}
                            </Typography>
                            <Tooltip title="Leave value represents the strength of your remaining tiles">
                              <InfoIcon sx={{ color: '#2196F3', fontSize: '0.9rem' }} />
                            </Tooltip>
                          </Box>
                        )}
                        {!move.isExchange && move.boardControl !== undefined && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                color: '#9C27B0',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(156, 39, 176, 0.15) 100%)',
                                padding: '1px 4px',
                                borderRadius: '4px',
                                minWidth: '60px',
                                textAlign: 'center',
                                boxShadow: '0 2px 4px rgba(156, 39, 176, 0.1)',
                                border: '1px solid rgba(156, 39, 176, 0.2)',
                                fontSize: '0.85rem'
                              }}
                            >
                              {formatScore(move.boardControl)} ctrl
                            </Typography>
                            <Tooltip title="Board control represents strategic positioning and blocking opponent opportunities">
                              <InfoIcon sx={{ color: '#9C27B0', fontSize: '0.9rem' }} />
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSimulate(move);
                        }}
                        disabled={simulatingMove === move}
                        sx={{
                          background: 'linear-gradient(135deg, #667EEA 0%, #5A67D8 100%)',
                          color: 'white',
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 1,
                          py: 0.25,
                          borderRadius: '4px',
                          minWidth: '80px',
                          fontSize: '0.85rem',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5A67D8 0%, #4C51BF 100%)',
                          },
                          '&:disabled': {
                            background: '#E2E8F0',
                            color: '#A0AEC0'
                          }
                        }}
                      >
                        {simulatingMove === move ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <>
                            <PlayArrowIcon sx={{ mr: 0.25, fontSize: '0.9rem' }} />
                            Simulate
                          </>
                        )}
                      </Button>
                    </Box>
                    {simulationResult && moveWithResults === move && (
                      <Box sx={{ 
                        mt: 0.25,
                        pt: 0.5,
                        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.25
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          Simulation Results:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            Win Rate: {formatScore(simulationResult.winRate)}%
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            Avg Score: {formatScore(simulationResult.avgScore)}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            Best Case: {formatScore(simulationResult.bestCase)}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            Worst Case: {formatScore(simulationResult.worstCase)}
                          </Typography>
                        </Box>
                        {simulationProgress < 100 && (
                          <LinearProgress 
                            variant="determinate" 
                            value={simulationProgress}
                            sx={{
                              height: 3,
                              borderRadius: 1.5,
                              backgroundColor: 'rgba(33, 150, 243, 0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 1.5,
                                background: 'linear-gradient(135deg, #667EEA 0%, #5A67D8 100%)',
                              }
                            }}
                          />
                        )}
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default ChoicesModal; 