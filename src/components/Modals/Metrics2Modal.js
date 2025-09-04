import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, Slider } from '@mui/material';
import styles from './Modals.module.css';

const Metrics2Modal = ({ 
  open, 
  onClose, 
  topMoves, 
  boardCoords, 
  pool, 
  onAnalyzeAllMoves 
}) => {
  const [results, setResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMove, setSelectedMove] = useState(null);
  const [iterations, setIterations] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    if (open && topMoves && topMoves.length > 0) {
      // Take top 10 moves
      const top10Moves = topMoves.slice(0, 10);
      analyzeAllMoves(top10Moves);
    }
  }, [open, topMoves]);

  const analyzeAllMoves = async (moves) => {
    setIsLoading(true);
    setResults({});
    
    console.log('🛡️ Metrics2Modal - Starting bulk analysis for', moves.length, 'moves');
    
    try {
      // Run analysis for all moves in parallel
      const promises = moves.map(async (move, index) => {
        try {
          console.log(`🛡️ Analyzing move ${index + 1}/${moves.length}: ${move.word}`);
          
          // Create clean board with this move applied
          const cleanBoard = Array(15).fill().map(() => Array(15).fill(''));
          
          // Copy existing board
          boardCoords.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
              if (typeof cell === 'string' && cell !== '') {
                cleanBoard[rowIndex][colIndex] = cell;
              }
            });
          });
          
          // Apply the move
          move.tiles.forEach(tile => {
            if (tile.isNew) {
              cleanBoard[tile.row][tile.col] = tile.letter;
            }
          });
          
          const tilePoolString = pool.join('');
          
          console.log(`🛡️ API Request for ${move.word}:`, {
            board: cleanBoard,
            tilePool: tilePoolString,
            iterations: 5
          });
          
          const response = await fetch('https://scrabble-move-generator-production.up.railway.app/bulk-move-gen', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              board: cleanBoard,
              tilePool: tilePoolString,
              iterations: 5
            })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log(`🛡️ API Response for ${move.word}:`, data);
          return { index, move, data };
        } catch (error) {
          console.error(`🛡️ Error analyzing move ${index} (${move.word}):`, error);
          return { index, move, error: error.message };
        }
      });
      
      const allResults = await Promise.all(promises);
      console.log('🛡️ All moves analysis completed:', allResults);
      
      // Convert to object with move word as key
      const resultsObj = {};
      allResults.forEach(({ index, move, data, error }) => {
        resultsObj[move.word] = { data, error, move };
      });
      
      setResults(resultsObj);
    } catch (error) {
      console.error('🛡️ Error in bulk analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveClick = (move) => {
    setSelectedMove(selectedMove === move ? null : move);
  };

  const handleRunMoreIterations = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    const top10Moves = topMoves.slice(0, 10);
    
    console.log('🛡️ Metrics2Modal - Running more iterations:', iterations);
    
    try {
      // Calculate how many requests we need to make
      const requestsNeeded = Math.ceil(iterations / 5);
      const iterationsPerRequest = Math.floor(iterations / requestsNeeded);
      const remainingIterations = iterations % requestsNeeded;
      
      // Calculate total API calls needed
      const totalApiCalls = top10Moves.length * requestsNeeded;
      setProgress({ completed: 0, total: totalApiCalls });
      
      console.log(`🛡️ Bulk division: ${iterations} iterations = ${requestsNeeded} requests`);
      console.log(`🛡️ Each request: ${iterationsPerRequest} iterations + ${remainingIterations} remaining`);
      console.log(`🛡️ Total API calls needed: ${totalApiCalls}`);
      
      // Run analysis for all moves in parallel
      const promises = top10Moves.map(async (move, moveIndex) => {
        try {
          console.log(`🛡️ Running ${iterations} iterations for move ${moveIndex + 1}/${top10Moves.length}: ${move.word}`);
          const moveResults = [];
          
          for (let i = 0; i < requestsNeeded; i++) {
            const currentIterations = i === requestsNeeded - 1 
              ? iterationsPerRequest + remainingIterations 
              : iterationsPerRequest;
            
            console.log(`🛡️ Request ${i + 1}/${requestsNeeded} for ${move.word}: ${currentIterations} iterations`);
            
            // Create clean board with this move applied
            const cleanBoard = Array(15).fill().map(() => Array(15).fill(''));
            
            // Copy existing board
            boardCoords.forEach((row, rowIndex) => {
              row.forEach((cell, colIndex) => {
                if (typeof cell === 'string' && cell !== '') {
                  cleanBoard[rowIndex][colIndex] = cell;
                }
              });
            });
            
            // Apply the move
            move.tiles.forEach(tile => {
              if (tile.isNew) {
                cleanBoard[tile.row][tile.col] = tile.letter;
              }
            });
            
            const tilePoolString = pool.join('');
            
            console.log(`🛡️ API Request ${i + 1}/${requestsNeeded} for ${move.word}:`, {
              board: cleanBoard,
              tilePool: tilePoolString,
              iterations: currentIterations
            });
            
            const response = await fetch('https://scrabble-move-generator-production.up.railway.app/bulk-move-gen', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                board: cleanBoard,
                tilePool: tilePoolString,
                iterations: currentIterations
              })
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`🛡️ API Response ${i + 1}/${requestsNeeded} for ${move.word}:`, data);
            moveResults.push(data);
            
            // Update progress
            setProgress(prev => {
              const newCompleted = prev.completed + 1;
              console.log(`🛡️ Progress: ${newCompleted}/${prev.total} (${Math.round((newCompleted / prev.total) * 100)}%)`);
              return { ...prev, completed: newCompleted };
            });
          }
          
          // Combine results
          const combinedData = {
            iterations: moveResults.reduce((sum, r) => sum + (r.iterations || 0), 0),
            averageScore: moveResults.reduce((sum, r) => sum + (r.averageScore || 0) * (r.iterations || 0), 0) / 
                         moveResults.reduce((sum, r) => sum + (r.iterations || 0), 0),
            bingoPercent: moveResults.reduce((sum, r) => sum + (r.bingoPercent || 0) * (r.iterations || 0), 0) / 
                         moveResults.reduce((sum, r) => sum + (r.iterations || 0), 0),
            totalBingos: moveResults.reduce((sum, r) => sum + (r.totalBingos || 0), 0),
            totalScore: moveResults.reduce((sum, r) => sum + (r.totalScore || 0), 0),
            lexicon: moveResults[0]?.lexicon || 'NWL23'
          };
          
          console.log(`🛡️ Combined results for ${move.word}:`, combinedData);
          return { moveIndex, move, data: combinedData };
        } catch (error) {
          console.error(`🛡️ Error analyzing move ${moveIndex} (${move.word}):`, error);
          return { moveIndex, move, error: error.message };
        }
      });
      
      const allResults = await Promise.all(promises);
      console.log('🛡️ All additional iterations completed:', allResults);
      
      // Update results
      const newResults = { ...results };
      allResults.forEach(({ moveIndex, move, data, error }) => {
        newResults[move.word] = { data, error, move };
      });
      
      setResults(newResults);
    } catch (error) {
      console.error('🛡️ Error in additional iterations:', error);
    } finally {
      setIsRunning(false);
      setProgress({ completed: 0, total: 0 });
    }
  };

  const createBoardWithMove = (move) => {
    const boardWithMove = Array(15).fill().map(() => Array(15).fill(''));
    
    // Copy existing board
    boardCoords.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (typeof cell === 'string' && cell !== '') {
          boardWithMove[rowIndex][colIndex] = cell;
        }
      });
    });
    
    // Apply the move
    move.tiles.forEach(tile => {
      if (tile.isNew) {
        boardWithMove[tile.row][tile.col] = tile.letter;
      }
    });
    
    return boardWithMove;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      style={{ zIndex: 10000 }}
    >
      <Box style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxHeight: '80vh',
        backgroundColor: '#fff',
        borderRadius: '0px',
        padding: '16px',
        outline: 'none',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        border: 'none',
        overflow: 'auto'
      }}>
        {isLoading ? (
          <Box style={{ textAlign: 'center', padding: '40px 0' }}>
            <Box className={styles.thinkingDots} style={{ marginBottom: 16 }}>
              <div></div>
              <div></div>
              <div></div>
            </Box>
            <Typography variant="body2" style={{ fontSize: '14px' }}>
              Analyzing all moves...
            </Typography>
          </Box>
        ) : (
          <Box style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {/* Ultra Compact Moves List */}
            <Box style={{ flex: '0 0 200px' }}>
              {topMoves.slice(0, 10).map((move, index) => {
                const result = results[move.word];
                const hasError = result?.error;
                const data = result?.data;
                
                return (
                  <Box 
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px 6px',
                      marginBottom: '2px',
                      backgroundColor: selectedMove === move ? '#e3f2fd' : '#f8f9fa',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      border: selectedMove === move ? '1px solid #1976d2' : '1px solid #e0e0e0',
                      fontSize: '10px',
                      height: '20px'
                    }}
                    onClick={() => handleMoveClick(move)}
                  >
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Box style={{ fontWeight: 'bold', fontSize: '10px' }}>
                        {move.word} - {move.score}pts
                      </Box>
                      {data && (
                        <Box style={{ fontSize: '9px', color: '#666', lineHeight: '1' }}>
                          {data.averageScore?.toFixed(1) || 'N/A'} | {data.bingoPercent?.toFixed(0) || '0'}%
                        </Box>
                      )}
                      {hasError && (
                        <Box style={{ fontSize: '9px', color: '#d32f2f' }}>
                          Error
                        </Box>
                      )}
                    </Box>
                    <Box style={{ fontSize: '9px', color: '#666', marginLeft: '6px' }}>
                      {selectedMove === move ? '✓' : '○'}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Board Preview - No centering, just left-aligned */}
            <Box style={{ flex: '1' }}>
              {selectedMove ? (
                <Box style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(15, 16px)', 
                  gridTemplateRows: 'repeat(15, 16px)',
                  gap: '0px',
                  width: '240px',
                  height: '240px',
                  borderRadius: '6px',
                  backgroundColor: '#ecf0f1',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                  border: '2px solid #34495e'
                }}>
                  {createBoardWithMove(selectedMove).map((row, rowIndex) =>
                    row.map((cell, colIndex) => {
                      const hasLetter = typeof cell === 'string' && cell !== '';
                      const isMoveTile = selectedMove.tiles.some(tile => 
                        tile.isNew && tile.row === rowIndex && tile.col === colIndex
                      );
                      
                      return (
                        <Box
                          key={`${rowIndex}-${colIndex}`}
                          style={{
                            backgroundColor: hasLetter 
                              ? (isMoveTile ? '#e74c3c' : '#27ae60')
                              : '#ecf0f1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: hasLetter ? 'white' : '#7f8c8d',
                            textShadow: hasLetter ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                            border: isMoveTile ? '1px solid #c0392b' : '1px solid #bdc3c7'
                          }}
                        >
                          {hasLetter ? cell.toUpperCase() : ''}
                        </Box>
                      );
                    })
                  )}
                </Box>
              ) : (
                <Box style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '240px',
                  width: '240px',
                  color: '#666',
                  fontSize: '14px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0'
                }}>
                  Click a move to see the board
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Iterations Slider */}
        <Box style={{ marginTop: 16, width: '280px', margin: '16px auto 0' }}>
          <Slider
            value={iterations}
            onChange={(e, value) => setIterations(value)}
            min={5}
            max={2000}
            step={5}
            style={{ 
              color: '#1976d2',
              marginBottom: '12px'
            }}
            sx={{
              padding: '0 !important',
              '& .MuiSlider-thumb': {
                backgroundColor: '#1976d2',
                width: '18px',
                height: '18px',
                border: '2px solid #fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              },
              '& .MuiSlider-track': {
                backgroundColor: '#1976d2',
                height: '4px'
              },
              '& .MuiSlider-rail': {
                backgroundColor: '#e0e0e0',
                height: '4px'
              }
            }}
          />
          <button
            onClick={handleRunMoreIterations}
            disabled={isRunning}
            style={{
              background: isRunning ? 'linear-gradient(45deg, transparent 5%, #6B7280 5%)' : 'linear-gradient(45deg, transparent 5%, #3D5A80 5%)',
              color: '#fff',
              border: 0,
              borderRadius: 8,
              padding: '6px 16px',
              fontWeight: 'bold',
              letterSpacing: 1,
              fontSize: 13,
              boxShadow: isRunning ? '6px 0px 0px #9CA3AF' : '6px 0px 0px #60A5FA',
              outline: 'transparent',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              userSelect: 'none',
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              opacity: isRunning ? 0.85 : 1,
              width: '280px',
              marginTop: 10
            }}
          >
            {isRunning ? (
              progress.total > 0 ? 
                `Running... ${Math.round((progress.completed / progress.total) * 100)}%` : 
                'Running...'
            ) : (
              `Run ${iterations} Iterations`
            )}
          </button>
        </Box>
      </Box>
    </Modal>
  );
};

export default Metrics2Modal;
