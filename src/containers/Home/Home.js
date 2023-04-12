import React from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Home.module.css';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import { Link } from 'react-router-dom';

export default function Home(){
  
  return (
    <Box sx={{ display: 'flex'}}>
      <Box className={styles.page}>
        <Box className={styles.subTitle}>
          This project is paused. It will be re-released anytime between 4 and 8 months. Send me a message if you have any questions. Thanks!
        </Box>
      </Box>   
    </Box>
  )
}
