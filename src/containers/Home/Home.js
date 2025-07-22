import React, { useState, useContext } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Home.module.css';
import { Rocket } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../App';
import AnimatedMascot from '../../components/AppContent/AnimatedMascot';

export default function Home(){
  const { lightMode } = useContext(ThemeContext);
  const devMessage = "Welcome to Tile Turnover™! Meet Theo, your word game fox! We're a front-end focused project. Heavy development in progress! Check changelog for all the latest updates!\n\nOur official release will be after 2025 Nationals, but more buttons are being added to homepage!";

  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
      <Box className={styles.page}>
        <Box className={styles.heroContainer}>
          <Box className={styles.mascotWrapper}>
            <AnimatedMascot />
          </Box>
          <Box className={styles.title}
            style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}
          >
            Tile Turnover™
          </Box>
        </Box>
        <Box 
          className={styles.developmentMessage}
          style={{ 
            backgroundColor: lightMode === 'dark' ? '#374151' : '#f0f0f0',
            color: lightMode === 'dark' ? '#fff' : '#000'
          }}
        >
          Welcome to Tile Turnover™! Meet Theo, your word game fox! We're a front-end focused project that's getting a huge upgrade! Check{" "}
          <Link to="/changelog" style={{
            color: lightMode === 'dark' ? '#60A5FA' : '#3D5A80', 
            textDecoration: 'none', 
            fontWeight: 'bold'
          }}>changelog</Link>
          {" "}for all the latest updates!
          <br /><br />
          <span style={{ fontSize: '0.75em', opacity: 0.6 }}>
            Our official release will be after 2025 Nationals, but more beta features are being added to the homepage!
          </span>
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
            <button className={styles.homeButton}>Game Viewer</button>
          </Link>
          <Link to="/3dviewer">
            <button className={styles.threeDButton}>3D Viewer (Beta)</button>
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
