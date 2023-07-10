import React from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Home.module.css';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import { Link } from 'react-router-dom';

export default function Home(){
  
  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
      <Box className={styles.page}>
        <Box className={styles.title}>
          Tile Turnover<PsychologyAltIcon className={styles.questionMark}/>
        </Box>
        <Box className={styles.subTitle}>
          Hi! I am Tile Turnover, a front-end-only project. I will be rolling out a variety of games and tools relating to Scrabble®, so come on in and join the fun!
        </Box>
        <Box className={styles.homeButtonContainer}>
          <Link to="/viewer">
            <button className={styles.homeButton}>Annotated Game Viewer</button>
          </Link>
        </Box>
      </Box>   
    </Box>
  )
}
