import React, { useState } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Home.module.css';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import { Link } from 'react-router-dom';
import ExtensionIcon from '@mui/icons-material/Extension';

export default function Home(){
  const [isSpinning, setIsSpinning] = useState(false);
  const [showLinks, setShowLinks] = useState(false);

  const devMessage = "Hi! I'm Tile Turnover, a front-end focused project. Development has restarted! Check out the changelog for updates! 🚀";

  const handleIconClick = () => {
    setIsSpinning(true);
    setShowLinks(prev => !prev);
    setTimeout(() => setIsSpinning(false), 500);
  };

  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
      <Box className={styles.page}>
        <Box className={styles.title}>
          Tile Turnover
          <ExtensionIcon 
            className={`${styles.titleIcon} ${isSpinning ? styles.spinning : ''}`}
            onClick={handleIconClick}
            style={{ cursor: 'pointer' }}
          />
        </Box>
        <Box className={styles.developmentMessage}>
          {showLinks ? (
            <div className={styles.scrabbleLinks}>
              <a href="https://www.cross-tables.com/" target="_blank" rel="noopener noreferrer" className={styles.link}>Cross-Tables 🏆</a>
              <a href="https://www.youtube.com/@MackMeller" target="_blank" rel="noopener noreferrer" className={styles.link}>Mack Meller's Channel 🎥</a>
              <a href="https://randomracer.com/" target="_blank" rel="noopener noreferrer" className={styles.link}>Random Racer 🎮</a>
            </div>
          ) : (
            <>
              {devMessage.split("changelog")[0]}
              <Link to="/changelog" style={{color: '#3D5A80', textDecoration: 'none', fontWeight: 'bold'}}>changelog</Link>
              {devMessage.split("changelog")[1]}
            </>
          )}
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
