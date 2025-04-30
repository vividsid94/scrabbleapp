import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import LaunchIcon from '@mui/icons-material/Launch';
import useMediaQuery from '@mui/material/useMediaQuery';
import styles from '../Viewer.module.css';

const GameHistory = ({
  gamesViewed,
  recentNames,
  recentDictionaries,
  recentGameNums,
  chooseGame,
  mode,
  handleClose
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [gamesPerPage, setGamesPerPage] = useState(10);
  const matches = useMediaQuery('(max-width:676px)');

  useEffect(() => {
    if (matches) {
      setGamesPerPage(5);
    } else {
      setGamesPerPage(10);
    }
  }, [matches]);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const startIndex = (currentPage - 1) * gamesPerPage;
  const endIndex = startIndex + gamesPerPage;
  const currentGames = recentDictionaries.slice(startIndex, endIndex);

  return (
    <div>
      <Typography
        variant="h8"
        id="tableTitle"
        component="div"
        sx={{padding: '8px'}}
      >
        <b>Recent Games Uploaded to XT <br></br> {mode === "GUESSELO" ? "(names hidden in this mode!)" : ""}</b>
      </Typography>
      <Table className={styles.recentGames}>
        <TableHead>
          <TableRow>
            <TableCell sx={{padding: '8px !important'}}>Game</TableCell>
            <TableCell sx={{padding: '8px !important'}}>Dictionary</TableCell>
            <TableCell sx={{padding: '8px !important'}}>Players</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {currentGames.map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                <Box sx={{display: 'flex'}}>
                  <VisibilityOutlinedIcon className={styles.keyBtnSmall} target="_blank" onClick={() => chooseGame(recentGameNums[startIndex + index], handleClose())}/>
                  <LaunchIcon className={styles.keyBtnSmall} onClick={() => window.open(`https://www.cross-tables.com/annotated.php?u=${recentGameNums[startIndex + index]}`, '_blank')}/>
                </Box>
              </TableCell>
              <TableCell>{recentDictionaries[startIndex + index]}</TableCell>
              <TableCell style={{color: mode !== "VIEWER" ? "transparent" : "black", background: mode !== "VIEWER" ? 'repeating-linear-gradient(45deg, #3D3B35, #3D3B35 5px, #767266 5px, #767266 10px)' : 'none'}}>
                {recentNames[startIndex + index + 1]}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        sx={{marginTop: '20px'}}
        count={Math.ceil(recentDictionaries.length / gamesPerPage)}
        page={currentPage}
        onChange={handlePageChange}
        color='primary'
      />
    </div>
  );
};

export default GameHistory; 