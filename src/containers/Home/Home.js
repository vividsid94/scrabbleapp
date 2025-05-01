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
          Hi! I'm Tile Turnover, a front-end focused project with a little back-end magic ✨. Development has restarted! Check out the <Link to="/changelog" style={{color: '#3D5A80', textDecoration: 'none', fontWeight: 'bold'}}>changelog</Link> for updates! 🚀
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
