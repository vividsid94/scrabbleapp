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
          <h5>Added light/dark mode toggle for better viewing experience</h5>
          <h5>Dramatically changed overall UI and Game Viewer performance</h5>
          <h2>Beta Features</h2>
          <div className={styles.betaSection}>
            <h5>The <Link to="/play" style={{color: '#3D5A80', textDecoration: 'none', fontWeight: 'bold'}}>Play</Link> page is currently in beta! Play against SidBot while I complete development!</h5>
          </div>
          <div className={styles.footer}>
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </Box>
      </Box>   
    </Box>
  );
} 