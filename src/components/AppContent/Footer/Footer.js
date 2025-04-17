import React from 'react';
import styles from './Footer.module.css';
import Box from '@mui/material/Box';

const Footer = () => (
  <Box className={styles.footer}>
    <span className={styles.footerText}>"Step up your game with every tile turned - Sid @ Tile Turnover" - ChatGPT</span>
    <span className={styles.footerText}>SCRABBLE® is a registered trademark of Hasbro, Inc. in the USA and Canada.</span>
    <span className={styles.footerText}>cross-tables is copyrighted and its data is used with permission</span>
  </Box>
);

export default Footer;