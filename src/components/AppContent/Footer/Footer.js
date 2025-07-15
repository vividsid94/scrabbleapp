import React, { useContext } from 'react';
import styles from './Footer.module.css';
import Box from '@mui/material/Box';
import { ThemeContext } from '../../../App';

const Footer = () => {
  const { lightMode } = useContext(ThemeContext);

  const getBackgroundColor = () => {
    return '#1F2937';
  };

  const getTextColor = () => {
    return lightMode === 'dark' ? '#fff' : '#f5f5f5';
  };

  return (
    <Box 
      className={styles.footer}
      sx={{
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        backgroundImage: "url('https://www.transparenttextures.com/patterns/diagonal-noise.png')",
      }}
    >
      <span className={styles.footerText}>"Step up your game with every tile turned - Sid @ Tile Turnover" - ChatGPT</span>
      <span className={styles.footerText}>SCRABBLE® is a registered trademark of Hasbro, Inc. in the USA and Canada.</span>
      <span className={styles.footerText}>cross-tables is copyrighted and its data is used with permission</span>
    </Box>
  );
};

export default Footer;