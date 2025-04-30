import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import LaunchIcon from '@mui/icons-material/Launch';
import useMediaQuery from '@mui/material/useMediaQuery';
import styles from '../Viewer.module.css';

const ViewedGamesList = ({
  gamesViewed,
  chooseGame,
  handleClose
}) => {
  const [gamesPerPage, setGamesPerPage] = useState(5);
  const matches = useMediaQuery('(max-width:676px)');

  useEffect(() => {
    if (matches) {
      setGamesPerPage(5);
    }
  }, [matches]);

  const currentGames = gamesViewed.slice(-gamesPerPage).reverse();

  return (
    <div>
      <Typography
        variant="h8"
        id="tableTitle"
        component="div"
        sx={{padding: '8px'}}
      >
        <b>Games you viewed this <br></br> session, sorted by most recent</b>
      </Typography>
      <Table className={styles.recentGames}>
        <TableHead>
          <TableRow>
            <TableCell sx={{padding: '8px !important'}}>Game</TableCell>
            <TableCell sx={{padding: '8px !important'}}>Number</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {currentGames.map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                <Box sx={{display: 'flex'}}>
                  <VisibilityOutlinedIcon className={styles.keyBtnSmall} target="_blank" onClick={() => chooseGame(currentGames[index], handleClose())}/>
                  <LaunchIcon className={styles.keyBtnSmall} onClick={() => window.open(`https://www.cross-tables.com/annotated.php?u=${currentGames[index]}`, '_blank')}/>
                </Box>
              </TableCell>
              <TableCell>
                {currentGames[index]}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ViewedGamesList; 