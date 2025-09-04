import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, Slider } from '@mui/material';
import styles from './Modals.module.css';

const DefenseModal = ({ 
  open, 
  onClose, 
  move, 
  boardCoords, 
  pool, 
  defenseResults, 
  isLoading,
  onUpdateResults
}) => {
  const [iterations, setIterations] = useState(5);
  const [isRunning, setIsRunning] = useState(false);

  if (!move) {
    return null;
  }

  // Create board with the move applied
  const createBoardWithMove = () => {
    const boardWithMove = JSON.parse(JSON.stringify(boardCoords));
    
    // Apply the move to the board
    move.tiles.forEach(tile => {
      if (tile.isNew) {
        boardWithMove[tile.row][tile.col] = tile.letter;
      }
    });
    
    return boardWithMove;
  };

  const boardWithMove = createBoardWithMove();

  const handleRunMoreIterations = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    
    try {
      // Calculate how many bulk requests we need
      const maxPerRequest = 1000; // API limit per request
      const totalRequests = Math.ceil(iterations / maxPerRequest);
      const iterationsPerRequest = Math.floor(iterations / totalRequests);
      const remainingIterations = iterations % maxPerRequest;
      
      console.log(`🛡️ Running ${iterations} iterations in ${totalRequests} requests`);
      
      let allResults = [];
      
      for (let i = 0; i < totalRequests; i++) {
        const currentIterations = i === totalRequests - 1 && remainingIterations > 0 
          ? remainingIterations 
          : iterationsPerRequest;
        
        console.log(`🛡️ Request ${i + 1}/${totalRequests}: ${currentIterations} iterations`);
        
        // Create a clean board for the request (same logic as the original)
        const cleanBoard = Array(15).fill().map(() => Array(15).fill(''));
        
        // Copy existing board state (only string values)
        for (let row = 0; row < 15; row++) {
          for (let col = 0; col < 15; col++) {
            if (boardWithMove[row] && boardWithMove[row][col] && typeof boardWithMove[row][col] === 'string') {
              cleanBoard[row][col] = boardWithMove[row][col];
            }
          }
        }
        
        const requestBody = {
          board: cleanBoard,
          tilePool: pool.join(''),
          iterations: currentIterations
        };
        
        console.log('🛡️ Additional iterations request body:', requestBody);
        
        const response = await fetch('https://scrabble-move-generator-production.up.railway.app/bulk-move-gen', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('🛡️ API Error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        allResults.push(result);
      }
      
      // Combine results
      const combinedResults = {
        iterations: allResults.reduce((sum, r) => sum + r.iterations, 0),
        totalScore: allResults.reduce((sum, r) => sum + r.totalScore, 0),
        totalBingos: allResults.reduce((sum, r) => sum + r.totalBingos, 0),
        averageScore: 0,
        bingoPercent: 0,
        lexicon: allResults[0]?.lexicon || 'N/A'
      };
      
      // Calculate averages
      combinedResults.averageScore = combinedResults.totalScore / combinedResults.iterations;
      combinedResults.bingoPercent = (combinedResults.totalBingos / combinedResults.iterations) * 100;
      
      console.log('🛡️ Combined results:', combinedResults);
      
      // Update the parent component with new results
      if (onUpdateResults) {
        onUpdateResults(combinedResults);
      }
      
    } catch (error) {
      console.error('Error running more iterations:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="defense-modal-title"
      style={{ zIndex: 10000 }}
    >
      <Box style={{ 
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '340px',
        backgroundColor: '#fff',
        borderRadius: '0px',
        padding: '16px',
        outline: 'none',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        border: 'none'
      }}>

        {isLoading ? (
          <Box style={{ textAlign: 'center', padding: '16px 0' }}>
            <Box className={styles.thinkingDots} style={{ marginBottom: 8 }}>
              <div></div>
              <div></div>
              <div></div>
            </Box>
            <Typography variant="body2" style={{ fontSize: '11px' }}>
              Running 5 simulations...
            </Typography>
          </Box>
        ) : defenseResults ? (
          <Box>
            {/* Board Preview - Compact but Beautiful */}
            <Box style={{ marginBottom: 12, textAlign: 'center' }}>
              <Box style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(15, 14px)', 
                gridTemplateRows: 'repeat(15, 14px)',
                gap: '0px',
                width: '210px',
                height: '210px',
                borderRadius: '6px',
                margin: '0 auto',
                backgroundColor: '#ecf0f1',
                boxShadow: '0 3px 6px rgba(0,0,0,0.1)'
              }}>
                {boardWithMove.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const hasLetter = typeof cell === 'string' && cell !== '';
                    // Check if this cell is part of the current move
                    const isMoveTile = move.tiles.some(tile => 
                      tile.isNew && tile.row === rowIndex && tile.col === colIndex
                    );
                    
                    return (
                      <Box
                        key={`${rowIndex}-${colIndex}`}
                        style={{
                          backgroundColor: hasLetter 
                            ? (isMoveTile ? '#e74c3c' : '#27ae60')  // Red for move tiles, green for existing
                            : '#ecf0f1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          color: hasLetter ? 'white' : '#7f8c8d',
                          textShadow: hasLetter ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                          transition: 'all 0.1s ease',
                          position: 'relative',
                          // Add borders for all cells
                          border: isMoveTile ? '1px solid #c0392b' : '1px solid #bdc3c7'
                        }}
                      >
                        {hasLetter ? cell.toUpperCase() : ''}
                        {/* Add a subtle highlight for occupied cells */}
                        {hasLetter && (
                          <Box
                            style={{
                              position: 'absolute',
                              top: '1px',
                              left: '1px',
                              right: '1px',
                              height: '1px',
                              background: isMoveTile 
                                ? 'linear-gradient(to right, rgba(255,255,255,0.4), transparent)'
                                : 'linear-gradient(to right, rgba(255,255,255,0.3), transparent)',
                              borderRadius: '1px'
                            }}
                          />
                        )}
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>

            {/* Defense Statistics - Three Boxes in One Row */}
            <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: 12, width: '210px', margin: '0 auto 12px' }}>
              <Box style={{ textAlign: 'center', padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '6px' }}>
                <Typography variant="body2" style={{ fontSize: '13px', fontWeight: 'bold', color: '#1976d2' }}>
                  {defenseResults.averageScore ? defenseResults.averageScore.toFixed(1) : 'N/A'}
                </Typography>
                <Typography variant="body2" style={{ fontSize: '10px', color: '#666' }}>
                  Opp Avg Score
                </Typography>
              </Box>
              
              <Box style={{ textAlign: 'center', padding: '8px', backgroundColor: '#fff3e0', borderRadius: '6px' }}>
                <Typography variant="body2" style={{ fontSize: '13px', fontWeight: 'bold', color: '#f57c00' }}>
                  {defenseResults.bingoPercent ? defenseResults.bingoPercent.toFixed(0) : '0'}%
                </Typography>
                <Typography variant="body2" style={{ fontSize: '10px', color: '#666' }}>
                  Opp Bingo %
                </Typography>
              </Box>
              
              <Box style={{ textAlign: 'center', padding: '8px', backgroundColor: '#e8f5e8', borderRadius: '6px' }}>
                <Typography variant="body2" style={{ fontSize: '13px', fontWeight: 'bold', color: '#388e3c' }}>
                  {defenseResults.iterations || 'N/A'}
                </Typography>
                <Typography variant="body2" style={{ fontSize: '10px', color: '#666' }}>
                  Total Iterations
                </Typography>
              </Box>
            </Box>

            {/* Iterations Slider */}
            <Box style={{ marginBottom: 12, width: '210px', margin: '0 auto 12px' }}>
              <Slider
                value={iterations}
                onChange={(e, value) => setIterations(value)}
                min={5}
                max={10000}
                step={5}
                marks={[
                  { value: 5 },
                  { value: 100 },
                  { value: 1000 },
                  { value: 5000 },
                  { value: 10000 }
                ]}
                style={{ 
                  color: '#1976d2',
                  marginBottom: '12px',
                  width: '100%'
                }}
                sx={{
                  padding: '0 !important',
                  '& .MuiSlider-mark': {
                    backgroundColor: '#1976d2',
                    height: '6px',
                    width: '6px',
                    borderRadius: '50%',
                    marginTop: '-2px'
                  },
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
              <Box style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', marginTop: '-2px' }}>
                <span>5</span>
                <span>100</span>
                <span>1K</span>
                <span>5K</span>
                <span>10K</span>
              </Box>
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
                  width: '210px',
                  marginTop: 10
                }}
              >
                {isRunning ? 'Running...' : `Run ${iterations} Iterations`}
              </button>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="error" style={{ fontSize: '11px', textAlign: 'center' }}>
            {defenseResults?.error || 'No results available.'}
          </Typography>
        )}

        <Box style={{ textAlign: 'center', marginTop: 10 }}>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(45deg, transparent 5%, #1F2937 5%)',
              color: '#fff',
              border: 0,
              borderRadius: 8,
              padding: '6px 16px',
              fontWeight: 'bold',
              letterSpacing: 1,
              fontSize: 13,
              boxShadow: '6px 0px 0px #374151',
              outline: 'transparent',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              opacity: 1,
              width: '210px'
            }}
          >
            Close
          </button>
        </Box>
      </Box>
    </Modal>
  );
};

export default DefenseModal;
