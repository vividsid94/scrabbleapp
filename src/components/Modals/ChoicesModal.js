import React, { useRef } from 'react';
import { Modal, Box, Typography, Button, CircularProgress, Paper, LinearProgress } from '@mui/material';
import Draggable from 'react-draggable';
import Board from '../AppContent/Board/Board';
import { createBoard } from '../../functions/boardFunctions';
import styles from './ChoicesModal.module.css';

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
  blankTiles = []
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
          width: '500px',
          maxHeight: '80vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 3,
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
                height: '40px',
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
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                pt: 1
              }}
            >
              Top Moves
            </Typography>

            {previewBoard && (
              <Box sx={{ 
                mb: 2, 
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
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {topMoves.map((move, index) => (
                  <Paper
                    key={index}
                    elevation={2}
                    sx={{
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
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
                    onClick={() => onMoveSelect(move)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {move.startPosition} {move.direction === 'right' ? '→' : '↓'} {move.word}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: '#4CAF50',
                            fontWeight: 'bold',
                            ml: 1
                          }}
                        >
                          ({move.score} points)
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSimulate(move);
                        }}
                        disabled={simulatingMove !== null}
                        sx={{
                          bgcolor: '#4CAF50',
                          '&:hover': {
                            bgcolor: '#388E3C',
                          },
                          minWidth: '100px',
                        }}
                      >
                        {simulatingMove === move ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          'Small Sim'
                        )}
                      </Button>
                    </Box>

                    {(simulatingMove === move || moveWithResults === move) && (
                      <>
                        {simulationProgress > 0 && simulatingMove === move && (
                          <Box sx={{ mt: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={simulationProgress * 100} 
                              sx={{
                                height: 8,
                                borderRadius: 4,
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
                                mt: 0.5,
                                color: 'text.secondary'
                              }}
                            >
                              Running simulation {Math.ceil(simulationProgress * 5)}/5...
                            </Typography>
                          </Box>
                        )}

                        {simulationResult && moveWithResults === move && (
                          <Box sx={{ 
                            mt: 1,
                            p: 1.5, 
                            bgcolor: 'rgba(0, 0, 0, 0.02)', 
                            borderRadius: 1,
                            borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                          }}>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              After {Math.round(simulationResult.avgMoves)} moves:
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