import React from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import DownloadIcon from '@mui/icons-material/Download';

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
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          pb: 2
        }}>
          <Box sx={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#4B5563'
          }}>
            Move History
          </Box>
          {moves && moves.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{
                textTransform: 'none',
                color: '#4B5563',
                borderColor: '#4B5563',
                '&:hover': {
                  borderColor: '#6B7280',
                  backgroundColor: 'rgba(0,0,0,0.04)'
                }
              }}
            >
              Download GCG
            </Button>
          )}
        </Box>
        {moves && moves.length > 0 ? (
          <Box sx={{ 
            display: 'table',
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            {/* Table Header */}
            <Box sx={{ 
              display: 'table-header-group',
              bgcolor: 'rgba(0,0,0,0.02)',
              borderBottom: '2px solid rgba(0,0,0,0.1)'
            }}>
              <Box sx={{ 
                display: 'table-row',
                '& > *': { 
                  display: 'table-cell',
                  py: 1.5,
                  px: 2,
                  fontWeight: 600,
                  color: '#4B5563',
                  fontSize: '14px',
                  textAlign: 'left'
                }
              }}>
                <Box sx={{ width: '60px' }}>#</Box>
                <Box sx={{ width: '120px' }}>Player</Box>
                <Box sx={{ width: '200px' }}>Words</Box>
                <Box sx={{ width: '100px' }}>Points</Box>
                <Box sx={{ width: '100px' }}>Score</Box>
              </Box>
            </Box>
            {/* Table Body */}
            <Box sx={{ display: 'table-row-group' }}>
              {moves.map((move, index) => {
                const formattedMove = formatMove(move);
                const isPlayer1 = move.player === moves[0].player;
                const prevScore = index > 0 ? moves[index - 1].total : 0;
                const player1Score = isPlayer1 ? move.total : prevScore;
                const player2Score = isPlayer1 ? prevScore : move.total;
                const isPlayer1Turn = isPlayer1;
                
                return (
                  <Box 
                    key={index}
                    sx={{ 
                      display: 'table-row',
                      bgcolor: index % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.04)'
                      },
                      '& > *': {
                        display: 'table-cell',
                        py: 1.5,
                        px: 2,
                        borderBottom: '1px solid rgba(0,0,0,0.05)'
                      }
                    }}
                  >
                    <Box sx={{ 
                      color: '#6B7280',
                      fontSize: '14px'
                    }}>
                      {index + 1}
                    </Box>
                    <Box sx={{ 
                      color: '#4B5563',
                      fontWeight: 500
                    }}>
                      {move.player}
                    </Box>
                    <Box sx={{ 
                      color: '#4B5563',
                      fontWeight: 600
                    }}>
                      {formattedMove.allWords.join(', ')}
                    </Box>
                    <Box sx={{ 
                      color: '#4CAF50',
                      fontWeight: 600
                    }}>
                      +{move.score}
                    </Box>
                    <Box sx={{ 
                      color: '#6B7280',
                      fontSize: '14px'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          bgcolor: isPlayer1Turn ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontWeight: isPlayer1Turn ? 600 : 400
                        }}>
                          {player1Score}
                        </Box>
                        <Box>-</Box>
                        <Box sx={{ 
                          bgcolor: !isPlayer1Turn ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontWeight: !isPlayer1Turn ? 600 : 400
                        }}>
                          {player2Score}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
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
    </Modal>
  );
} 