import React, { useState } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Home.module.css';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import { Rocket } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

export default function Home(){
  const devMessage = "Hi! I'm Tile Turnover™, a front-end focused project. Development has restarted! Check out the changelog for updates! New features will gradually appear as buttons here.";

  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
      <Box className={styles.page}>
        <Box className={styles.title}>
          Tile Turnover™
        </Box>
        <Box className={styles.developmentMessage}>
          {devMessage.split("changelog")[0]}
          <Link to="/changelog" style={{color: '#3D5A80', textDecoration: 'none', fontWeight: 'bold'}}>changelog</Link>
          {devMessage.split("changelog")[1]}
          <Rocket 
            style={{ 
              color: '#F59E0B', 
              fontSize: '20px', 
              marginLeft: '8px',
              verticalAlign: 'middle'
            }} 
            weight="fill" 
          />
        </Box>
        <Box className={styles.homeButtonContainer}>
          <Link to="/viewer">
            <button className={styles.homeButton}>Annotated Game Viewer</button>
          </Link>
          <Link to="/submit-game">
            <button className={styles.submitGameButton}>Submit Game</button>
          </Link>
          {/* <Link to="/play">
            <button className={styles.homeButton}>Play Scrabble</button>
          </Link> */}
        </Box>
      </Box>   
    </Box>
  )
}
