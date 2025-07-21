import React from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Changelog.module.css';
import { ThemeContext } from '../../App';
import { Link } from 'react-router-dom';

export default function Changelog() {
  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
      <Box className={styles.page}>
        <Box className={styles.developmentMessage}>    
          <h2>Recent Updates</h2> 
          <h5>Complete UI redesign with streamlined navigation and improved theming</h5>
          <h5>Enhanced Game Viewer performance and mobile responsiveness</h5>
          <h2>Beta Features</h2>
          <div className={styles.betaSection} style={{textAlign: 'left', padding: '5px'}}>
            <h5 style={{margin: '0'}}><Link to="/play" style={{color: '#3D5A80', textDecoration: 'none', fontWeight: 'bold'}}>Play Mode</Link> - Play against Theo</h5>
            <h5 style={{margin: '0'}}><Link to="/puzzle" style={{color: '#3D5A80', textDecoration: 'none', fontWeight: 'bold'}}>Puzzle Mode</Link> - Solve Scrabble puzzles</h5>
            <h5 style={{margin: '0'}}><Link to="/widget" style={{color: '#3D5A80', textDecoration: 'none', fontWeight: 'bold'}}>Widget System</Link> - Embed tools on your site</h5>
            <h5 style={{margin: '0'}}><Link to="/boggle" style={{color: '#3D5A80', textDecoration: 'none', fontWeight: 'bold'}}>Boggle Game</Link> - Classic word game</h5>
          </div>
          <div className={styles.footer}>
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </Box>
      </Box>   
    </Box>
  );
} 