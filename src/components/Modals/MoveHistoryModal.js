import React, { useMemo, useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import DownloadIcon from '@mui/icons-material/Download';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

export default function MoveHistoryModal({ open, onClose, moves }) {
  const [showBotRacks, setShowBotRacks] = useState(false);

  const formatMove = useMemo(() => (move) => {
    const { beforeBoard, afterBoard, player, score, rack, total } = move;
    console.log(move);

    // Check if this is a pass move (no changes to the board)
    const isPass = beforeBoard.every((row, i) => 
      row.every((cell, j) => cell === afterBoard[i][j])
    );

    if (isPass) {
      return {
        display: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              color: '#4B5563',
              fontWeight: 500,
              minWidth: '80px'
            }}>
              {player}
            </Box>
            <Box sx={{ 
              color: '#4B5563',
              fontWeight: 600,
              minWidth: '100px'
            }}>
              Pass
            </Box>
            <Box sx={{ 
              color: '#4CAF50',
              fontWeight: 600,
              minWidth: '60px'
            }}>
              {score}
            </Box>
            <Box sx={{ 
              color: '#6B7280',
              fontSize: '14px'
            }}>
              ({total})
            </Box>
          </Box>
        ),
        gcg: `${player}: ${rack} - +${score} ${total}`,
        displayWord: 'Pass',
        allWords: []
      };
    }

    // Find the first tile that changed
    let firstRow = -1;
    let firstCol = -1;
    let isHorizontal = false;
    let displayWord = '';
    let gcgWord = '';
    let allWords = [];
    
    // First pass: find the first changed tile and determine direction
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (beforeBoard[row][col] !== afterBoard[row][col]) {
          if (firstRow === -1) {
            firstRow = row;
            firstCol = col;
            // Check if it's horizontal by looking at the next tile
            isHorizontal = col < 14 && beforeBoard[row][col + 1] !== afterBoard[row][col + 1];
          }
        }
      }
    }

    // Second pass: build both display word and GCG word
    if (isHorizontal) {
      // For horizontal plays, scan left to find the start of the word
      while (firstCol > 0 && typeof afterBoard[firstRow][firstCol - 1] === 'string') {
        firstCol--;
      }
      // Now scan right to build the word
      let col = firstCol;
      while (col < 15 && typeof afterBoard[firstRow][col] === 'string') {
        displayWord += afterBoard[firstRow][col];
        // If this position had a tile before, use a dot
        if (beforeBoard[firstRow][col] === afterBoard[firstRow][col]) {
          gcgWord += '.';
        } else {
          gcgWord += afterBoard[firstRow][col];
        }
        col++;
      }
      allWords.push(displayWord);

      // Check for vertical words at each new tile
      col = firstCol;
      while (col < 15 && typeof afterBoard[firstRow][col] === 'string') {
        if (beforeBoard[firstRow][col] === afterBoard[firstRow][col]) {
          col++;
          continue;
        }
        // Check for vertical word at this position
        let vRow = firstRow;
        while (vRow > 0 && typeof afterBoard[vRow - 1][col] === 'string') {
          vRow--;
        }
        let verticalWord = '';
        let verticalGcgWord = '';
        while (vRow < 15 && typeof afterBoard[vRow][col] === 'string') {
          verticalWord += afterBoard[vRow][col];
          if (beforeBoard[vRow][col] === afterBoard[vRow][col]) {
            verticalGcgWord += '.';
          } else {
            verticalGcgWord += afterBoard[vRow][col];
          }
          vRow++;
        }
        if (verticalWord.length > 1) {
          allWords.push(verticalWord);
        }
        col++;
      }
    } else {
      // For vertical plays, scan up to find the start of the word
      while (firstRow > 0 && typeof afterBoard[firstRow - 1][firstCol] === 'string') {
        firstRow--;
      }
      // Now scan down to build the word
      let row = firstRow;
      while (row < 15 && typeof afterBoard[row][firstCol] === 'string') {
        displayWord += afterBoard[row][firstCol];
        // If this position had a tile before, use a dot
        if (beforeBoard[row][firstCol] === afterBoard[row][firstCol]) {
          gcgWord += '.';
        } else {
          gcgWord += afterBoard[row][firstCol];
        }
        row++;
      }
      allWords.push(displayWord);

      // Check for horizontal words at each new tile
      row = firstRow;
      while (row < 15 && typeof afterBoard[row][firstCol] === 'string') {
        if (beforeBoard[row][firstCol] === afterBoard[row][firstCol]) {
          row++;
          continue;
        }
        // Check for horizontal word at this position
        let hCol = firstCol;
        while (hCol > 0 && typeof afterBoard[row][hCol - 1] === 'string') {
          hCol--;
        }
        let horizontalWord = '';
        let horizontalGcgWord = '';
        while (hCol < 15 && typeof afterBoard[row][hCol] === 'string') {
          horizontalWord += afterBoard[row][hCol];
          if (beforeBoard[row][hCol] === afterBoard[row][hCol]) {
            horizontalGcgWord += '.';
          } else {
            horizontalGcgWord += afterBoard[row][hCol];
          }
          hCol++;
        }
        if (horizontalWord.length > 1) {
          allWords.push(horizontalWord);
        }
        row++;
      }
    }

    // Format the position
    const row = firstRow + 1; // Convert 0-14 to 1-15
    const col = String.fromCharCode(65 + firstCol); // Convert 0-14 to A-O
    const position = isHorizontal ? `${row}${col}` : `${col}${row}`;

    // Return both the display format and GCG format
    return {
      display: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ 
            color: '#4B5563',
            fontWeight: 500,
            minWidth: '80px'
          }}>
            {player}
          </Box>
          <Box sx={{ 
            color: '#4B5563',
            fontWeight: 600,
            minWidth: '100px'
          }}>
            {displayWord}
          </Box>
          <Box sx={{ 
            color: '#4CAF50',
            fontWeight: 600,
            minWidth: '60px'
          }}>
            {score}
          </Box>
          <Box sx={{ 
            color: '#6B7280',
            fontSize: '14px'
          }}>
            ({total})
          </Box>
        </Box>
      ),
      gcg: `${player}: ${rack} ${position} ${gcgWord} +${score} ${total}`,
      displayWord: displayWord,
      allWords: allWords
    };
  }, []); // Empty dependency array since the function doesn't depend on any props or state

  const handleDownload = () => {
    const header = `#character-encoding UTF-8
#player1 ${moves[0]?.player} ${moves[0]?.player}
#player2 ${moves[1]?.player} ${moves[1]?.player}
#description Created with Scrabble App`;

    const movesText = moves.map((move, index) => `>${formatMove(move).gcg}`).join('\n');
    const content = `${header}\n${movesText}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scrabble-game.gcg';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const tableContent = useMemo(() => {
    if (moves.length === 0) {
      return (
        <Box sx={{ 
          textAlign: 'center', 
          color: '#6B7280',
          py: 4
        }}>
          No moves yet
        </Box>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ 
        boxShadow: 'none',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: 2,
        width: '100%'
      }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '40px', fontWeight: 600 }}>#</TableCell>
              <TableCell sx={{ width: '80px', fontWeight: 600 }}>Player</TableCell>
              <TableCell sx={{ width: '80px', fontWeight: 600 }}>Rack</TableCell>
              <TableCell sx={{ width: '250px', fontWeight: 600 }}>Words</TableCell>
              <TableCell sx={{ width: '60px', fontWeight: 600 }}>Score</TableCell>
              <TableCell sx={{ width: '100px', fontWeight: 600 }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {moves.map((move, index) => {
              const formattedMove = formatMove(move);
              const isPlayer1 = move.player === moves[0]?.player;
              return (
                <TableRow 
                  key={index}
                  sx={{ 
                    backgroundColor: isPlayer1 ? 'rgba(76, 175, 80, 0.05)' : 'rgba(33, 150, 243, 0.05)',
                    '&:hover': {
                      backgroundColor: isPlayer1 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)'
                    }
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{move.player}</TableCell>
                  <TableCell>
                    {move.player === 'SidBot' ? (
                      <Box sx={{ 
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'repeating-linear-gradient(45deg, #f0f0f0, #f0f0f0 2px, #e0e0e0 2px, #e0e0e0 4px)',
                          opacity: showBotRacks ? 0 : 1,
                          borderRadius: '4px'
                        }
                      }}>
                        {move.rack}
                      </Box>
                    ) : move.rack}
                  </TableCell>
                  <TableCell sx={{ maxWidth: '250px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {formattedMove.displayWord === 'Pass' ? (
                      <Box sx={{ 
                        color: '#6B7280',
                        fontSize: '1.2rem',
                        fontWeight: 500
                      }}>
                        ×
                      </Box>
                    ) : formattedMove.allWords.join(', ')}
                  </TableCell>
                  <TableCell sx={{ color: '#4CAF50', fontWeight: 600 }}>{move.score}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', fontSize: '0.875rem' }}>
                      <Box sx={{ 
                        bgcolor: isPlayer1 ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                        px: 0.5,
                        py: 0.25,
                        borderRadius: 1,
                        fontWeight: isPlayer1 ? 600 : 400
                      }}>
                        {isPlayer1 ? move.total : (index > 0 ? moves[index - 1].total : 0)}
                      </Box>
                      <Box>-</Box>
                      <Box sx={{ 
                        bgcolor: !isPlayer1 ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                        px: 0.5,
                        py: 0.25,
                        borderRadius: 1,
                        fontWeight: !isPlayer1 ? 600 : 400
                      }}>
                        {!isPlayer1 ? move.total : (index > 0 ? moves[index - 1].total : 0)}
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }, [moves, formatMove, showBotRacks]); // Add showBotRacks to dependencies

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300
      }}
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: 600,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 2,
        maxHeight: '80vh',
        overflow: 'auto',
        outline: 'none'
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 2,
          p: 3,
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2
          }}>
            <Box>
              <Typography variant="h6" component="h2">
                Move History
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {moves.length > 0 && (
                <>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={showBotRacks}
                        onChange={(e) => setShowBotRacks(e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#4CAF50',
                            '& + .MuiSwitch-track': {
                              backgroundColor: '#4CAF50',
                            },
                          },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" color="text.secondary">
                        Show Bot Racks
                      </Typography>
                    }
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleDownload}
                    startIcon={<DownloadIcon />}
                    sx={{
                      borderColor: '#4CAF50',
                      color: '#4CAF50',
                      '&:hover': {
                        borderColor: '#388E3C',
                        backgroundColor: 'rgba(76, 175, 80, 0.04)',
                        boxShadow: '0 2px 4px rgba(76, 175, 80, 0.2)',
                      },
                      transition: 'all 0.2s ease-in-out',
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 2
                    }}
                  >
                    Download GCG
                  </Button>
                </>
              )}
            </Box>
          </Box>
          {tableContent}
        </Box>
      </Box>
    </Modal>
  );
} 