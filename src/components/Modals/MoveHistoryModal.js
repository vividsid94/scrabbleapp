import React from 'react';
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

export default function MoveHistoryModal({ open, onClose, moves }) {
  const formatMove = (move) => {
    const { beforeBoard, afterBoard, player, score, rack, total } = move;
    
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
            +{score}
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
  };

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
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="h6" component="h2">
              Move History
            </Typography>
            {moves.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleDownload}
                startIcon={<DownloadIcon />}
              >
                Download GCG
              </Button>
            )}
          </Box>

          {moves.length > 0 ? (
            <TableContainer component={Paper} sx={{ 
              boxShadow: 'none',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 2
            }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '60px', fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ width: '100px', fontWeight: 600 }}>Player</TableCell>
                    <TableCell sx={{ width: '120px', fontWeight: 600 }}>Rack</TableCell>
                    <TableCell sx={{ width: '200px', fontWeight: 600 }}>Words</TableCell>
                    <TableCell sx={{ width: '80px', fontWeight: 600 }}>Score</TableCell>
                    <TableCell sx={{ width: '120px', fontWeight: 600 }}>Total</TableCell>
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
                        <TableCell>{move.rack}</TableCell>
                        <TableCell>{formattedMove.allWords.join(', ')}</TableCell>
                        <TableCell sx={{ color: '#4CAF50', fontWeight: 600 }}>+{move.score}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Box sx={{ 
                              color: '#6B7280',
                              fontSize: '14px'
                            }}>
                              {move.total}
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              color: '#6B7280',
              py: 4
            }}>
              No moves yet
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
} 