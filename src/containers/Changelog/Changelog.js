import React from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Changelog.module.css';
import { ThemeContext } from '../../App';
import { Link } from 'react-router-dom';

export default function Changelog() {
  const { lightMode } = React.useContext(ThemeContext);
  
  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
      <Box className={styles.page}>
        <Box className={styles.title}>
          Changelog
        </Box>
        <Box className={styles.content} style={{color: lightMode === 'dark' ? '#fff' : '#000'}}>
          <h2>Current Version</h2>
          <div className={styles.version}>v1.0.0</div>
          
          <h2>Recent Updates</h2>
          <ul>
            <p>Added light/dark mode toggle for better viewing experience</p>
            <p>Dramatically changed overall UI and Game Viewer performance</p>
          </ul>

          <h2>Beta Features</h2>
          <div className={styles.betaSection}>
            <p>The <Link to="/play" className={styles.link}>Play</Link> page is currently in beta! Play against SidBot while I complete development!</p>
          </div>
          <div className={styles.footer}>
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </Box>
      </Box>   
    </Box>
  );
} 