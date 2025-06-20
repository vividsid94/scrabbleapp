import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalculateIcon from '@mui/icons-material/Calculate';
import { origBoard } from '../../components/AppContent/References/staticData';

const SimulationModal = ({
  open,
  onClose,
  simulationBoard,
  previewTileOwnership,
  theme = "STANDARD",
  color = { current: '#6D84A2' },
  complementaryColor = { current: '#9F7A83' },
  blankTiles = [],
  simulatingMove,
  simulationProgress,
  simulationResult,
  moveWithResults,
  onStartSimulation,
  onStartHeatMap,
  onStopSimulation,
  onSwitchToMetrics,
  heatMapData,
  isHeatMapMode,
  simulationSettings,
  onSimulationSettingsChange,
  topMoves,
  onMoveSelect,
  onRunAllMovesSimulation,
  allMoveResults,
  isSimulatingAllMoves,
  previewBoard
}) => {
  const [showSettings, setShowSettings] = useState(false);

  if (!open || !simulationBoard) {
    return null;
  }

  const formatScore = (score) => {
    return typeof score === 'number' ? score.toFixed(1) : '0.0';
  };

  const boardMultipliers = JSON.parse(origBoard);

  const handleClose = () => {
    // Stop any running simulation before closing
    if (simulatingMove && onStopSimulation) {
      onStopSimulation();
    }
    onClose();
  };

  // Helper function to format move location
  const formatLocation = (move) => {
    if (!move.tiles || move.tiles.length === 0) {
      return null;
    }

    // Find the first tile
    const firstTile = move.tiles[0];
    let firstRow = firstTile.row;
    let firstCol = firstTile.col;
    
    // Determine if it's horizontal by checking if there are tiles in the same row
    const isHorizontal = move.tiles.some(t => t.row === firstRow && t.col === firstCol + 1);
    
    // Format the position (convert 0-14 to 1-15 for rows, 0-14 to A-O for columns)
    const row = firstRow + 1;
    const col = String.fromCharCode(65 + firstCol);
    const position = isHorizontal ? `${row}${col}` : `${col}${row}`;
    
    return position;
  };

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
          onClick={handleClose}
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

        {showSettings ? (
          // Settings View
          <Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2,
              gap: 1
            }}>
              <Box
                onClick={() => setShowSettings(false)}
            sx={{ 
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
              '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
            }}
          >
                <ArrowBackIcon sx={{ fontSize: '20px' }} />
              </Box>
              <Box sx={{ fontSize: '16px', fontWeight: 'bold' }}>
                Settings
              </Box>
        </Box>

            <Box sx={{ 
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px'
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', mb: 1 }}>
                    <Box sx={{ opacity: 0.9 }}>Simulations:</Box>
                    <Box sx={{ fontWeight: 'bold' }}>{simulationSettings?.numSimulations || 5}</Box>
                  </Box>
                  <Slider
                    value={simulationSettings?.numSimulations || 5}
                    onChange={(event, newValue) => {
                      onSimulationSettingsChange?.({ 
                        ...simulationSettings, 
                        numSimulations: newValue 
                      });
                    }}
                    min={1}
                    max={50}
                    step={1}
                    size="small"
                    sx={{
                      color: '#4CAF50',
                      height: 2,
                      '& .MuiSlider-track': {
                        border: 'none',
                      },
                      '& .MuiSlider-thumb': {
                        height: 10,
                        width: 10,
                        backgroundColor: '#4CAF50',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                          boxShadow: 'inherit',
                        },
                        '&:before': {
                          display: 'none',
                        },
                      },
                      '& .MuiSlider-rail': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', mb: 1 }}>
                    <Box sx={{ opacity: 0.9 }}>Turns:</Box>
                    <Box sx={{ fontWeight: 'bold' }}>{simulationSettings?.turnsPerSim || 1}</Box>
                  </Box>
                  <Slider
                    value={simulationSettings?.turnsPerSim || 1}
                    onChange={(event, newValue) => {
                      onSimulationSettingsChange?.({ 
                        ...simulationSettings, 
                        turnsPerSim: newValue 
                      });
                    }}
                    min={1}
                    max={4}
                    step={1}
                    size="small"
                    sx={{
                      color: '#2196F3',
                      height: 2,
                      '& .MuiSlider-track': {
                        border: 'none',
                      },
                      '& .MuiSlider-thumb': {
                        height: 10,
                        width: 10,
                        backgroundColor: '#2196F3',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                          boxShadow: 'inherit',
                        },
                        '&:before': {
                          display: 'none',
                        },
                      },
                      '& .MuiSlider-rail': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        ) : (
          // Main View
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            mb: 3,
            alignItems: 'flex-start'
          }}>
            {/* Moves List */}
            {topMoves && topMoves.length > 0 && (
              <Box sx={{ 
                minWidth: '140px',
                maxHeight: '286px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                  padding: '8px 8px 0 8px'
                }}>
                  <Box sx={{ 
                    fontSize: '11px', 
                    fontWeight: 'bold',
                    color: 'rgba(255, 255, 255, 0.9)',
                  }}>
                    Moves
                  </Box>
                  <Box
                    onClick={() => {
                      if (onRunAllMovesSimulation) {
                        onRunAllMovesSimulation();
                      }
                    }}
                    sx={{
                      background: 'rgba(76, 175, 80, 0.2)',
                      color: 'white',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '8px',
                      backdropFilter: 'blur(10px)',
                      display: 'inline-block',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      borderRadius: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      '&:hover': {
                        backgroundColor: 'rgba(76, 175, 80, 0.3)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 3px 8px rgba(76, 175, 80, 0.2)',
                      },
                    }}
                  >
                    <CalculateIcon sx={{ fontSize: '10px' }} />
                    Responses
                  </Box>
                </Box>
                
                {/* Scrollable moves list */}
                <Box sx={{ 
                  flex: 1,
                  overflowY: 'auto',
                  padding: '0 8px 8px 8px'
                }}>
                  {topMoves.map((move, index) => {
                    const location = formatLocation(move);
                    // Create a more specific comparison that includes location and tiles
                    const isSelected = moveWithResults && 
                      moveWithResults.word === move.word && 
                      moveWithResults.tiles && move.tiles &&
                      moveWithResults.tiles.length === move.tiles.length &&
                      moveWithResults.tiles.every((tile, i) => 
                        tile.row === move.tiles[i].row && 
                        tile.col === move.tiles[i].col
                      );
                    const moveResult = allMoveResults[move.word];
                    
                    return (
                      <Box 
                        key={index}
                        onClick={() => onMoveSelect && onMoveSelect(move)}
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          padding: '2px 4px',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                          borderRadius: '2px',
                          transition: 'all 0.2s ease',
                          fontSize: '9px',
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      >
                        <Box sx={{ 
                          fontWeight: 'bold',
                          color: 'rgba(255, 255, 255, 0.7)',
                          minWidth: '12px'
                        }}>
                          {index + 1}
                        </Box>
                        <Box sx={{ 
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontFamily: 'monospace',
                          background: 'rgba(255, 255, 255, 0.1)',
                          padding: '1px 2px',
                          borderRadius: '2px',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {location || ''}
                        </Box>
                        <Box sx={{ 
                          fontWeight: 'bold',
                          color: 'rgba(255, 255, 255, 0.9)',
                          flex: 1
                        }}>
                          {move.word}
                        </Box>
                        {/* Always show average opponent score box, even if no results yet */}
                        <Box sx={{ 
                          color: 'white',
                          background: '#2196F3',
                          padding: '1px 2px',
                          borderRadius: '2px',
                          minWidth: '20px',
                          textAlign: 'center',
                          fontSize: '8px'
                        }}>
                          {moveResult && !moveResult.error ? 
                            formatScore(moveResult.avgFirstTurnOpponentScore) : 
                            isSimulatingAllMoves ? '...' : '0.0'
                          }
                        </Box>
                        {moveResult && moveResult.error && (
                          <Box sx={{ 
                            color: 'white',
                            background: '#f44336',
                            padding: '1px 2px',
                            borderRadius: '2px',
                            minWidth: '16px',
                            textAlign: 'center',
                            fontSize: '8px'
                          }}>
                            ERR
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
                
                {/* Sticky action buttons at bottom */}
                {moveWithResults && (
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 0.5, 
                    padding: '8px',
                    justifyContent: 'center',
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)'
                  }}>
                    <Box
                      onClick={() => {
                        if (onStartSimulation) {
                          onStartSimulation(moveWithResults);
                        }
                      }}
                      sx={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        color: 'white',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        borderRadius: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontSize: '8px',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        },
                      }}
                    >
                      <VisibilityIcon sx={{ fontSize: '10px' }} />
                      Visualize
                    </Box>
                    <Box
                      onClick={() => {
                        if (onStartHeatMap) {
                          onStartHeatMap(moveWithResults);
                        }
                      }}
                      sx={{
                        background: 'rgba(255, 193, 7, 0.2)',
                        color: 'white',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        borderRadius: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontSize: '8px',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 193, 7, 0.3)',
                        },
                      }}
                    >
                      <WhatshotIcon sx={{ fontSize: '10px' }} />
                      Map
                    </Box>
                    <Box
                      onClick={() => setShowSettings(true)}
                      sx={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        borderRadius: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontSize: '8px',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        },
                      }}
                    >
                      <SettingsIcon sx={{ fontSize: '10px' }} />
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* Simulation Board */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
                flex: 1
            }}>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(15, 1fr)',
                padding: '8px',
                fontSize: '12px',
                  fontFamily: 'monospace',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                {(previewBoard || simulationBoard).map((row, rowIndex) => 
                  row.map((cell, colIndex) => {
                    const mult = boardMultipliers[rowIndex][colIndex];
                      let bg = 'rgba(255, 255, 255, 0.9)';
                      let textColor = '#333';
                      
                      // If in heat map mode and we have heat map data, use heat map colors
                      if (isHeatMapMode && heatMapData && heatMapData[rowIndex] && heatMapData[rowIndex][colIndex] !== undefined) {
                        const heatValue = heatMapData[rowIndex][colIndex];
                        // Color gradient from ice cold blue (0) to red hot (high values)
                        const maxSimulations = simulationSettings?.numSimulations || 5;
                        const intensity = Math.min(heatValue / maxSimulations, 1); // Normalize to 0-1
                        
                        if (intensity === 0) {
                          bg = 'rgba(140, 180, 255, 0.8)'; // Vibrant ice cold blue with full opacity
                        } else if (intensity < 0.5) {
                          // Blue to purple transition
                          const blueIntensity = 1 - (intensity * 2);
                          bg = `rgba(${150 + blueIntensity * 105}, ${200 - blueIntensity * 100}, 255, ${0.3 + intensity * 0.4})`;
                        } else {
                          // Purple to red transition
                          const redIntensity = (intensity - 0.5) * 2;
                          bg = `rgba(255, ${100 - redIntensity * 100}, ${100 - redIntensity * 100}, ${0.7 + redIntensity * 0.3})`;
                        }
                      } else if (typeof cell === 'string' && previewTileOwnership) {
                        // Color code tiles based on ownership
                        const ownership = previewTileOwnership[rowIndex]?.[colIndex];
                        if (ownership === 'player') {
                          bg = 'rgba(33, 150, 243, 0.9)'; // Blue for player tiles
                          textColor = 'white';
                        } else if (ownership === 'opponent') {
                          bg = 'rgba(244, 67, 54, 0.9)'; // Red for opponent tiles
                          textColor = 'white';
                        } else if (ownership === 'existing') {
                          bg = 'rgba(255, 255, 255, 1)'; // White for existing tiles
                          textColor = '#333';
                        }
                      } else {
                        // Normal board colors
                        if (mult === 3 || mult === 4) bg = 'rgba(200, 200, 200, 0.9)';
                        else if (mult === 2) bg = 'rgba(220, 220, 220, 0.9)';
                        else if (mult === 1) bg = 'rgba(240, 240, 240, 0.9)';
                        if (typeof cell === 'string') bg = 'rgba(255, 255, 255, 1)';
                      }
                      
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
                            color: textColor
                        }}
                      >
                        {typeof cell === 'string' ? cell : ''}
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>
          </Box>
        )}

        {/* Progress Bar - Always show when simulating */}
        {(simulatingMove || simulationProgress > 0 || isSimulatingAllMoves) && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ 
              fontSize: '10px', 
              opacity: 0.9,
              mb: 0.5
            }}>
              {simulatingMove ? `${simulatingMove.word} (${simulatingMove.score} pts)` : 'Simulating...'}
            </Box>
              <Box sx={{ 
                width: '100%', 
                height: 4, 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 2,
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
            {/* Progress Text */}
            <Box sx={{ 
              fontSize: '8px', 
              opacity: 0.7,
              textAlign: 'center',
              mt: 0.5
            }}>
              {isHeatMapMode ? 
                `${Math.round(simulationProgress / 100 * (simulationSettings?.numSimulations || 5))}/${simulationSettings?.numSimulations || 5} simulations` :
                isSimulatingAllMoves ?
                `${Math.round(simulationProgress / 100 * (simulationSettings?.numSimulations || 5))}/${simulationSettings?.numSimulations || 5} iterations` :
                `${Math.round(simulationProgress)}% complete`
              }
                </Box>
            {/* Stop Button */}
            <Box
              onClick={() => {
                if (onStopSimulation) {
                  onStopSimulation();
                }
              }}
              sx={{
                background: 'rgba(244, 67, 54, 0.2)',
                color: 'white',
                padding: '3px 8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '8px',
                backdropFilter: 'blur(10px)',
                display: 'inline-block',
                transition: 'all 0.3s ease',
                borderRadius: '4px',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                marginTop: '4px',
                textAlign: 'center',
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.3)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 3px 8px rgba(244, 67, 54, 0.2)',
                },
              }}
            >
              Stop
              </Box>
            </Box>
          )}

        {/* Close Button */}
        <Box
          onClick={handleClose}
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