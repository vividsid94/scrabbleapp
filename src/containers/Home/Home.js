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
        <Box className={styles.developmentMessage}>
          Hi! I am Tile Turnover, a front-end-only project. Development has restarted! Expect new features and improvements coming soon! 🚀
        </Box>
        <Box className={styles.homeButtonContainer}>
          <Link to="/viewer">
            <button className={styles.homeButton}>Annotated Game Viewer</button>
          </Link>
          {/* <Link to="/play">
            <button className={styles.homeButton}>Play Scrabble</button>
          </Link> */}
        </Box>
      </Box>   
    </Box>
  )
}
