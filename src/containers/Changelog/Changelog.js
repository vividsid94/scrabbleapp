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
        <Box className={styles.developmentMessage} style={{ color: '#000' }}>    
          <h2 style={{ color: '#000' }}>Recent Updates</h2> 
          <h5 style={{ color: '#000' }}>✨ User Accounts & Profiles - Create an account to track your stats and game history</h5>
          <h5 style={{ color: '#000' }}>🎨 Homepage Redesign - New pyramid button layout with improved visual hierarchy</h5>
          <h5 style={{ color: '#000' }}>🎯 Button Styling Updates - Streamlined orange outline buttons with refined typography</h5>
          <h5 style={{ color: '#000' }}>Complete UI redesign with streamlined navigation and improved theming</h5>
          <h5 style={{ color: '#000' }}>Enhanced Game Viewer performance and mobile responsiveness</h5>
          <h2 style={{ color: '#000' }}>Beta Features</h2>
          <div className={styles.betaSection} style={{textAlign: 'left', padding: '5px'}}>
            <h5 style={{margin: '0', color: '#000'}}><Link to="/play" style={{color: '#3D5A80', textDecoration: 'none', fontWeight: 'bold'}}>Play Mode</Link> <span style={{ color: '#000' }}>- Play against Theo</span></h5>
            <h5 style={{margin: '0', color: '#000'}}><Link to="/puzzle" style={{color: '#3D5A80', textDecoration: 'none', fontWeight: 'bold'}}>Puzzle Mode</Link> <span style={{ color: '#000' }}>- Solve Scrabble puzzles</span></h5>
            <h5 style={{margin: '0', color: '#000'}}><Link to="/widget" style={{color: '#3D5A80', textDecoration: 'none', fontWeight: 'bold'}}>Widget System</Link> <span style={{ color: '#000' }}>- Embed tools on your site</span></h5>
            <h5 style={{margin: '0', color: '#000'}}><Link to="/boggle" style={{color: '#3D5A80', textDecoration: 'none', fontWeight: 'bold'}}>Boggle Game</Link> <span style={{ color: '#000' }}>- Classic word game</span></h5>
          </div>
          <div className={styles.footer}>
            <p style={{ color: '#000' }}>Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </Box>
      </Box>   
    </Box>
  );
} 