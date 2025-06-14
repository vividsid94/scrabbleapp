import React, { useMemo, useState, useCallback } from 'react';
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
import Board from '../AppContent/Board/Board';
import { createBoard } from '../../functions/boardFunctions';

export default function MoveHistoryModal({ open, onClose, moves }) {
  const [showBotRacks, setShowBotRacks] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'board'

  const formatMove = useMemo(() => (move) => {
    const { boardDiff, player, score, rack, total } = move;

    // If no board diff, it's a pass move
    if (!boardDiff || boardDiff.length === 0) {
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

    // Reconstruct the board state for this move
    const board = Array(15).fill().map(() => Array(15).fill(0));
    boardDiff.forEach(({ row, col, value }) => {
      board[row][col] = value;
    });

    // Find the first tile that changed
    let firstRow = -1;
    let firstCol = -1;
    let isHorizontal = false;
    let displayWord = '';
    let gcgWord = '';
    let allWords = [];
    
    // Find the first changed tile and determine direction
    for (const { row, col } of boardDiff) {
      if (firstRow === -1) {
        firstRow = row;
        firstCol = col;
        // Check if it's horizontal by looking at the next tile
        isHorizontal = col < 14 && boardDiff.some(d => d.row === row && d.col === col + 1);
      }
    }

    // Build the word based on direction
    if (isHorizontal) {
      // For horizontal plays, scan left to find the start of the word
      while (firstCol > 0 && board[firstRow][firstCol - 1] !== 0) {
        firstCol--;
      }
      // Now scan right to build the word
      let col = firstCol;
      while (col < 15 && board[firstRow][col] !== 0) {
        displayWord += board[firstRow][col];
        gcgWord += board[firstRow][col];
        col++;
      }
      allWords.push(displayWord);

      // Check for vertical words at each new tile
      for (const { row, col } of boardDiff) {
        // Check for vertical word at this position
        let vRow = row;
        while (vRow > 0 && board[vRow - 1][col] !== 0) {
          vRow--;
        }
        let verticalWord = '';
        while (vRow < 15 && board[vRow][col] !== 0) {
          verticalWord += board[vRow][col];
          vRow++;
        }
        if (verticalWord.length > 1) {
          allWords.push(verticalWord);
        }
      }
    } else {
      // For vertical plays, scan up to find the start of the word
      while (firstRow > 0 && board[firstRow - 1][firstCol] !== 0) {
        firstRow--;
      }
      // Now scan down to build the word
      let row = firstRow;
      while (row < 15 && board[row][firstCol] !== 0) {
        displayWord += board[row][firstCol];
        gcgWord += board[row][firstCol];
        row++;
      }
      allWords.push(displayWord);

      // Check for horizontal words at each new tile
      for (const { row, col } of boardDiff) {
        // Check for horizontal word at this position
        let hCol = col;
        while (hCol > 0 && board[row][hCol - 1] !== 0) {
          hCol--;
        }
        let horizontalWord = '';
        while (hCol < 15 && board[row][hCol] !== 0) {
          horizontalWord += board[row][hCol];
          hCol++;
        }
        if (horizontalWord.length > 1) {
          allWords.push(horizontalWord);
        }
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
  }, [moves, formatMove, showBotRacks]);

  const renderMove = useCallback((move, index) => {
    // Reconstruct board state from diffs
    const board = Array(15).fill().map(() => Array(15).fill(0));
    for (let i = 0; i <= index; i++) {
      const currentMove = moves[i];
      if (currentMove.boardDiff) {
        currentMove.boardDiff.forEach(({ row, col, value }) => {
          board[row][col] = value;
        });
      }
    }

    return (
      <Box key={index} sx={{ 
        p: 2, 
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1
      }}>
        <Typography variant="subtitle1">
          {move.player}: {move.score} points
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Rack: {move.rack}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total: {move.total}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Board
            board={createBoard(
              board,
              [],
              "PROTILES",
              "STANDARD",
              '#6D84A2',
              '#9F7A83',
              []
            )}
            boardMode="STANDARD"
            onBoardChildClick={() => {}}
            onTileDrop={() => {}}
            animate={false}
            showSlip={false}
            showDictionary={false}
            dictionary=""
          />
        </Box>
      </Box>
    );
  }, [moves]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="move-history-modal"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80%',
        maxWidth: '800px',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Move History
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showBotRacks}
                  onChange={(e) => setShowBotRacks(e.target.checked)}
                  size="small"
                />
              }
              label="Show Bot Racks"
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => setViewMode(viewMode === 'table' ? 'board' : 'table')}
            >
              {viewMode === 'table' ? 'Board View' : 'Table View'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
            >
              Download GCG
            </Button>
          </Box>
        </Box>
        
        {viewMode === 'table' ? (
          tableContent
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {moves.map((move, index) => renderMove(move, index))}
          </Box>
        )}
      </Box>
    </Modal>
  );
} 