import React, { useContext } from 'react';
import styles from './Footer.module.css';
import Box from '@mui/material/Box';
import { ThemeContext } from '../../../App';

const Footer = () => {
  const { lightMode } = useContext(ThemeContext);

  const getBackgroundColor = () => {
    return lightMode === 'dark' ? '#1F2937' : '#ffffff';
  };

  const getTextColor = () => {
    return lightMode === 'dark' ? '#fff' : '#1F2937';
  };

  const getBackgroundGradient = () => {
    if (lightMode === 'dark') {
      return `
        radial-gradient(circle at 20% 30%, rgba(55, 65, 81, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(17, 24, 39, 0.4) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(31, 41, 55, 0.2) 0%, transparent 60%),
        radial-gradient(circle at 70% 20%, rgba(55, 65, 81, 0.25) 0%, transparent 45%),
        radial-gradient(circle at 30% 80%, rgba(17, 24, 39, 0.3) 0%, transparent 50%),
        #1F2937
      `;
    } else {
      // Light mode: transparent so main page background shows through
      return 'transparent';
    }
  };

  return (
    <Box 
      className={styles.footer}
      sx={{
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        background: getBackgroundGradient(),
      }}
    >
      <span className={styles.footerText}>"Step up your game with every tile turned - Sid @ Tile Turnover" - ChatGPT</span>
      <span className={styles.footerText}>SCRABBLE® is a registered trademark of Hasbro, Inc. in the USA and Canada.</span>
      <span className={styles.footerText}>cross-tables is copyrighted and its data is used with permission</span>
    </Box>
  );
};

export default Footer;