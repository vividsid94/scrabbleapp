import React, { useState, useEffect} from 'react';
import {Box} from '@mui/material';
import styles from './Series.module.css';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';

const Series = () => {
  const [result, setResult] = useState({
    defenseWins: 0,
    champWins: 0,
    draws: 0,
    totalGames: 0,
    defenseTotalScore: 0,
    champTotalScore: 0,
    defenseAverageScore: 0,
    champAverageScore: 0,
  });

  useEffect(() => {
    const games = Array.from({ length: 7 }, (_, i) => `/games/series1/game${i + 1}.gcg`);
    fetchAndAggregateScores(games);
  }, []);

  const fetchAndAggregateScores = async (gameFiles) => {
    let defenseWins = 0;
    let champWins = 0;
    let draws = 0;
    let defenseTotalScore = 0;
    let champTotalScore = 0;

    for (const file of gameFiles) {
      try {
        const response = await fetch(file);
        const text = await response.text();
        const { defenseScore, champScore } = parseScores(text);

        defenseTotalScore += defenseScore;
        champTotalScore += champScore;

        if (champScore > defenseScore) {
          champWins++;
        } else if (defenseScore > champScore) {
          defenseWins++;
        } else {
          draws++;
        }
      } catch (error) {
        console.error(`Error fetching file ${file}:`, error);
        // Handle fetch errors here
      }
    }

    const totalGames = gameFiles.length;
    const defenseAverageScore = totalGames > 0 ? (defenseTotalScore / totalGames).toFixed(2) : 0;
    const champAverageScore = totalGames > 0 ? (champTotalScore / totalGames).toFixed(2) : 0;

    setResult({
      defenseWins,
      champWins,
      draws,
      totalGames,
      defenseTotalScore,
      champTotalScore,
      defenseAverageScore,
      champAverageScore,
    });
  };

  const parseScores = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');

    let defenseScore = 0;
    let champScore = 0;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();

      if (line.startsWith('>Defense:')) {
        const scoreMatch = line.match(/(\d+)$/);
        if (scoreMatch) {
          defenseScore = parseInt(scoreMatch[1], 10);
          break;
        }
      }
    }

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();

      if (line.startsWith('>Champ:')) {
        const scoreMatch = line.match(/(\d+)$/);
        if (scoreMatch) {
          champScore = parseInt(scoreMatch[1], 10);
          break;
        }
      }
    }

    return { defenseScore, champScore };
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidenav />
      <Box sx={{ flexGrow: 1}}>
        <Box sx={{'& .MuiSelect-outlined': {color: 'white', border: "1px solid white", borderRadius: "none"}, '& .MuiSvgIcon-root': {color: 'black'}, '& .MuiTableCell-root': {padding: '8px'}, '& .MuiInputBase-root': {color: 'white'}}} className={styles.container}>
          <Box className={styles.title}>
            {"Series"}
          </Box>
          <Box>
            <h3>Total Games: {result.totalGames}</h3>
            <h3>Defense Wins: {result.defenseWins}</h3>
            <h3>Champ Wins: {result.champWins}</h3>
            <h3>Draws: {result.draws}</h3>
            <h3>Defense Average Score: {result.defenseAverageScore}</h3>
            <h3>Champ Average Score: {result.champAverageScore}</h3>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Series;
