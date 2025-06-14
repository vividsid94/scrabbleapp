import React, { useRef } from 'react';
import { Modal, Box, Typography, Button, CircularProgress, Paper, LinearProgress } from '@mui/material';
import Draggable from 'react-draggable';
import Board from '../AppContent/Board/Board';
import { createBoard } from '../../functions/boardFunctions';
import styles from './ChoicesModal.module.css';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

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
  const modalRef = useRef(null);

  const formatScore = (score) => {
    if (score === undefined || score === null || isNaN(score)) return 'N/A';
    return Math.round(score).toString();
  };

  const handleSimulate = async (move) => {
    try {
      await onSimulateMove(move);
    } catch (error) {
      console.error('Error simulating move:', error);
    }
  };

  const handleMoveSelect = (move) => {
    if (move.isExchange) {
      // For exchange moves, just select the tiles to exchange
      onMoveSelect({
        ...move,
        tiles: move.tiles.map(tile => ({
          ...tile,
          isNew: true
        }))
      });
    } else {
      // For regular moves, use the existing logic
      onMoveSelect(move);
    }
    onClose();
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
          width: '800px',
          maxHeight: '80vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 2,
          overflow: 'auto',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        }}
      >
        <Draggable
          handle=".drag-handle"
          nodeRef={modalRef}
        >
          <Box
            ref={modalRef}
            sx={{
              position: 'relative',
              cursor: 'move',
            }}
          >
            <Box 
              className="drag-handle"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '30px',
                cursor: 'move',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                }
              }}
            />
            <Typography 
              variant="h5" 
              component="h2" 
              gutterBottom
              sx={{
                textAlign: 'center',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #7F9CF5 0%, #667EEA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                pt: 0.5,
                fontSize: '1.75rem',
                letterSpacing: '-0.5px'
              }}
            >
              Choices
            </Typography>

            {previewBoard && (
              <Box sx={{ 
                mb: 1, 
                display: 'flex', 
                justifyContent: 'center',
                transform: 'scale(0.65)',
                transformOrigin: 'top center',
                height: '350px',
                overflow: 'visible',
                position: 'relative'
              }}>
                <Box sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)'
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
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {topMoves
                  .map(move => ({
                    ...move,
                    totalValue: move.isExchange ? 
                      (leaveValues[move.leave] || 0) : // For exchanges, total value is just the leave value
                      (move.score + (leaveValues[move.leave] || 0)) // For regular moves, add score and leave value
                  }))
                  .sort((a, b) => b.totalValue - a.totalValue)
                  .slice(0, 15) // Only show top 15 moves overall
                  .map((move, index) => (
                  <Paper
                    key={index}
                    elevation={2}
                    sx={{
                      p: 1.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3,
                      },
                      cursor: 'pointer',
                      position: 'relative',
                      border: (simulatingMove === move || moveWithResults === move) ? '2px solid #4CAF50' : 'none',
                      backgroundColor: (simulatingMove === move || moveWithResults === move) ? 'rgba(76, 175, 80, 0.1)' : 'white',
                      overflow: 'visible'
                    }}
                    onClick={() => handleMoveSelect(move)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium', minWidth: '120px' }}>
                          {move.isExchange ? (
                            `Exchange ${move.tiles.map(t => t.letter).join('')}`
                          ) : (
                            `${move.startPosition} ${move.direction === 'right' ? '→' : '↓'} ${move.word}`
                          )}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          {!move.isExchange && (
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                color: '#4CAF50',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.15) 100%)',
                                padding: '3px 6px',
                                borderRadius: '6px',
                                minWidth: '70px',
                                textAlign: 'center',
                                boxShadow: '0 2px 4px rgba(76, 175, 80, 0.1)',
                                border: '1px solid rgba(76, 175, 80, 0.2)',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.2) 100%)',
                                  boxShadow: '0 4px 8px rgba(76, 175, 80, 0.15)',
                                  transform: 'translateY(-1px)'
                                }
                              }}
                            >
                              {move.score} pts
                            </Typography>
                          )}
                          {leaveValues[move.leave] !== undefined && (
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                color: '#2196F3',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.15) 100%)',
                                padding: '3px 6px',
                                borderRadius: '6px',
                                minWidth: '90px',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 4px rgba(33, 150, 243, 0.1)',
                                border: '1px solid rgba(33, 150, 243, 0.2)',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(33, 150, 243, 0.2) 100%)',
                                  boxShadow: '0 4px 8px rgba(33, 150, 243, 0.15)',
                                  transform: 'translateY(-1px)'
                                }
                              }}
                            >
                              <span style={{ 
                                color: '#1565C0',
                                fontSize: '0.9rem',
                                letterSpacing: '0.3px'
                              }}>{move.leave}</span>
                              <span style={{ 
                                width: '1px',
                                height: '14px',
                                background: 'linear-gradient(to bottom, rgba(33, 150, 243, 0.2), rgba(33, 150, 243, 0.4), rgba(33, 150, 243, 0.2))',
                                margin: '0 2px'
                              }}></span>
                              <span style={{ 
                                color: leaveValues[move.leave] < 0 ? '#d32f2f' : '#2e7d32',
                                fontSize: '0.9rem',
                                letterSpacing: '0.3px',
                                fontWeight: 'bold'
                              }}>{leaveValues[move.leave].toFixed(1)}</span>
                            </Typography>
                          )}
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              color: '#9C27B0',
                              fontWeight: 'bold',
                              background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(156, 39, 176, 0.15) 100%)',
                              padding: '3px 6px',
                              borderRadius: '6px',
                              minWidth: '70px',
                              textAlign: 'center',
                              boxShadow: '0 2px 4px rgba(156, 39, 176, 0.1)',
                              border: '1px solid rgba(156, 39, 176, 0.2)',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(156, 39, 176, 0.2) 100%)',
                                boxShadow: '0 4px 8px rgba(156, 39, 176, 0.15)',
                                transform: 'translateY(-1px)'
                              }
                            }}
                          >
                            {move.totalValue.toFixed(1)} eq
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button
                          variant="contained"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveSelect(move);
                          }}
                          sx={{
                            background: 'linear-gradient(135deg, rgba(97, 97, 97, 0.15) 0%, rgba(97, 97, 97, 0.2) 100%)',
                            color: '#616161',
                            fontWeight: 'bold',
                            textTransform: 'none',
                            padding: '3px 12px',
                            borderRadius: '6px',
                            minWidth: '70px',
                            boxShadow: '0 2px 4px rgba(97, 97, 97, 0.1)',
                            border: '1px solid rgba(97, 97, 97, 0.3)',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              background: 'linear-gradient(135deg, rgba(97, 97, 97, 0.2) 0%, rgba(97, 97, 97, 0.25) 100%)',
                              boxShadow: '0 4px 8px rgba(97, 97, 97, 0.15)',
                              transform: 'translateY(-1px)'
                            },
                            '&:active': {
                              transform: 'translateY(0)',
                              boxShadow: '0 2px 4px rgba(97, 97, 97, 0.1)'
                            }
                          }}
                        >
                          {move.isExchange ? 'Exchange' : 'Select'}
                        </Button>
                        {!move.isExchange && (
                          <Button
                            variant="contained"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSimulate(move);
                            }}
                            disabled={simulatingMove !== null}
                            startIcon={<PlayArrowIcon sx={{ fontSize: '1.1rem' }} />}
                            sx={{
                              background: 'linear-gradient(135deg, rgba(66, 66, 66, 0.15) 0%, rgba(66, 66, 66, 0.2) 100%)',
                              color: '#424242',
                              fontWeight: 'bold',
                              textTransform: 'none',
                              padding: '3px 12px',
                              borderRadius: '6px',
                              minWidth: '100px',
                              boxShadow: '0 2px 4px rgba(66, 66, 66, 0.1)',
                              border: '1px solid rgba(66, 66, 66, 0.3)',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                background: 'linear-gradient(135deg, rgba(66, 66, 66, 0.2) 0%, rgba(66, 66, 66, 0.25) 100%)',
                                boxShadow: '0 4px 8px rgba(66, 66, 66, 0.15)',
                                transform: 'translateY(-1px)'
                              },
                              '&:active': {
                                transform: 'translateY(0)',
                                boxShadow: '0 2px 4px rgba(66, 66, 66, 0.1)'
                              },
                              '&.Mui-disabled': {
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.1) 100%)',
                                color: 'rgba(0, 0, 0, 0.26)',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                boxShadow: 'none'
                              }
                            }}
                          >
                            Play It Out
                          </Button>
                        )}
                      </Box>
                    </Box>

                    {(simulatingMove === move || moveWithResults === move) && (
                      <>
                        {simulationProgress > 0 && simulatingMove === move && (
                          <Box sx={{ mt: 0.5 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={simulationProgress * 100} 
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: '#4CAF50',
                                }
                              }}
                            />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: 'block', 
                                textAlign: 'center', 
                                mt: 0.25,
                                color: 'text.secondary'
                              }}
                            >
                              Running simulation {Math.ceil(simulationProgress * 5)}/5...
                            </Typography>
                          </Box>
                        )}

                        {simulationResult && moveWithResults === move && (
                          <Box sx={{ 
                            mt: 0.5,
                            p: 1, 
                            bgcolor: 'rgba(0, 0, 0, 0.02)', 
                            borderRadius: 1,
                            borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                          }}>
                            <Typography variant="body2" sx={{ mb: 0.25 }}>
                              After {Math.round(simulationResult.avgMoves)} turns:
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#2196F3' }}>
                              You: {Math.round(simulationResult.avgScore)} points
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#F44336' }}>
                              Bot: {Math.round(simulationResult.avgBotScore)} points
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        </Draggable>
      </Box>
    </Modal>
  );
};

export default ChoicesModal; 