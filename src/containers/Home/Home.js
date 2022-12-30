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
          Word Sense<PsychologyAltIcon className={styles.questionMark}/>
        </Box>
        <Box className={styles.subTitle}>
          Hello! I am Word Sense. I am a React-only project designed as a happy marriage between Scrabble® and UX. I will be rolling out a wide variety of games and tools, so come on in and join the fun!
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
