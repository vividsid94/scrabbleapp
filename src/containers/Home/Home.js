import React, { useState, useEffect } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import Typography from "@mui/material/Typography";
import styles from './Home.module.css';
import axios from 'axios';
import dictionary from '../../components/AppContent/Dictionary/nwl20bings.json';
import Board from "../../components/AppContent/Board/Board.js";
import Rack from "../../components/AppContent/Board/Rack.js";
import Pool from "../../components/AppContent/Board/Pool.js";
import { GoQuestion, GoTriangleLeft, GoTriangleRight } from "react-icons/go";
import { Link } from 'react-router-dom';

export default function Home(){
  
  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
      <Box className={styles.page}>
        <Box className={styles.title}>
          Scrabble Sense<GoQuestion className={styles.questionMark}></GoQuestion>
        </Box>
        <Box className={styles.subTitle}>
          Hello! I am Scrabble Sense. I am a React-only project designed to bridge the gap between Scrabble and UX. I will be rolling out a wide variety of games and tools, so come on in and join the fun!
        </Box>
        <Box className={styles.homeButtonContainer}>
          <Link to="/viewer">
            <button className={styles.homeButton}>Annotated Game Viewer</button>
          </Link>
        </Box>
      </Box>   
    </Box>
  )
}
