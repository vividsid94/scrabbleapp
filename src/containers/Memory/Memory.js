import React, { useState, useEffect, useRef } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import styles from './Memory.module.css';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ThemeContext } from '../../App';
import Card from './Card';

const useInterval = (callback, delay, duration) => {
  const durationRef = useRef(duration);
  const durationIntervalRef = useRef();

  const handler = () => {
    callback(durationRef);
  };

  useEffect(() => {
    const durationInterval = setInterval(handler, delay);
    durationIntervalRef.current = durationInterval;
    return () => {
      clearInterval(durationInterval);
    };
  }, [delay]);

  return durationIntervalRef;
};

export default function Memory() {
  const { lightMode } = React.useContext(ThemeContext);
  const [gameState, setGameState] = useState({
    isPlaying: false,
    score: 0,
    moves: 0,
    matches: 0,
    timer: 0
  });
  const [list, setList] = useState([]);
  const [subLists, setSubLists] = useState([]);
  const [visibleItems, setVisibleItems] = useState([]);
  const [finishedItems, setFinishedItems] = useState([]);
  const [winner, setWinner] = useState(false);
  const matches = useMediaQuery('(min-width:600px)');

  const localImages = [
    {id: "1", url: "./images/bathroom.jpg", description: "Image 1"},
    {id: "2", url: "./images/image2.jpg", description: "Image 2"},
    {id: "3", url: "./images/image3.jpg", description: "Image 3"},
    {id: "4", url: "./images/image4.jpg", description: "Image 4"},
    {id: "5", url: "./images/image5.jpg", description: "Image 5"},
    {id: "6", url: "./images/image6.jpg", description: "Image 6"},
    {id: "7", url: "./images/bathroom.jpg", description: "Image 7"},
    {id: "8", url: "./images/image8.jpg", description: "Image 8"},
    {id: "9", url: "./images/image9.jpg", description: "Image 9"},
    {id: "10", url: "./images/image10.jpg", description: "Image 10"},
    {id: "11", url: "./images/image11.jpg", description: "Image 11"},
    {id: "12", url: "./images/image12.jpg", description: "Image 12"}
  ];

  const startNewGame = () => {
    setGameState({
      isPlaying: true,
      score: 0,
      moves: 0,
      matches: 0,
      timer: 0
    });
    setVisibleItems([]);
    setFinishedItems([]);
    setWinner(false);
    // Shuffle and set new list
    const shuffledList = localImages
      .concat(localImages.map(item => ({...item, id: item.id + "1"})))
      .sort(() => 0.5 - Math.random());
    setList(shuffledList);
  };

  const checkItems = (firstIndex, secondIndex) => {
    setGameState(prev => ({...prev, moves: prev.moves + 1}));
    
    if (firstIndex !== secondIndex && list[firstIndex].url === list[secondIndex].url) {
      setFinishedItems([...finishedItems, firstIndex, secondIndex]);
      setGameState(prev => ({
        ...prev,
        matches: prev.matches + 1,
        score: prev.score + 100
      }));
    } else {
      setTimeout(() => {
        setVisibleItems([]);
      }, 600);
    }
  };

  const durationIntervalRef = useInterval(
    durationRef => {
      if (gameState.isPlaying) {
        durationRef.current++;
        setGameState(prev => ({...prev, timer: durationRef.current}));
      }
    },
    1000,
    gameState.timer
  );

  useEffect(() => {
    if (finishedItems.length > 0 && finishedItems.length === list.length) {
      setWinner(true);
      setGameState(prev => ({...prev, isPlaying: false}));
      clearInterval(durationIntervalRef.current);
    }
  }, [finishedItems]);

  useEffect(() => {
    const numberOfColumns = matches ? 4 : 3;
    let tempSubLists = [];
    for (let i = 0; i < list.length; i += numberOfColumns) {
      tempSubLists.push(list.slice(i, i + numberOfColumns));
    }
    setSubLists(tempSubLists);
  }, [list, matches]);

  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
      <Box className={styles.gameContainer} style={{color: lightMode === 'dark' ? '#fff' : '#000'}}>
        <Box className={styles.gameHeader}>
          <Typography variant="h4" className={styles.title}>Memory Game</Typography>
          <Box className={styles.stats}>
            <Typography>Time: {gameState.timer}s</Typography>
            <Typography>Moves: {gameState.moves}</Typography>
            <Typography>Score: {gameState.score}</Typography>
          </Box>
          <Button 
            variant="contained" 
            onClick={startNewGame}
            className={styles.newGameButton}
          >
            New Game
          </Button>
        </Box>

        <table className={styles.gameBoard}>
          <tbody>
            {subLists.map((subList, subListIndex) => (
              <tr className={styles.row} key={subListIndex}>
                {subList.map((item, index) => (
                  <td key={item.id}>
                    <Card
                      className={`${
                        visibleItems.includes(subListIndex * subList.length + index)
                          ? styles.cardShow
                          : ''
                      } ${
                        finishedItems.includes(subListIndex * subList.length + index)
                          ? styles.cardFinished
                          : ''
                      }`}
                      onClick={() => {
                        if (!gameState.isPlaying) return;
                        if (!finishedItems.includes(subListIndex * subList.length + index)) {
                          switch (visibleItems.length) {
                            case 0:
                              setVisibleItems([subListIndex * subList.length + index]);
                              break;
                            case 1:
                              if (visibleItems[0] !== subListIndex * subList.length + index) {
                                setVisibleItems(
                                  visibleItems.concat(subListIndex * subList.length + index)
                                );
                                checkItems(visibleItems[0], subListIndex * subList.length + index);
                              }
                              break;
                            case 2:
                              setVisibleItems([subListIndex * subList.length + index]);
                              break;
                            default:
                              setVisibleItems([]);
                          }
                        }
                      }}
                      imgSource={item.url}
                      imgDesc={item.description}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {winner && (
          <Box className={styles.winnerMessage}>
            <Typography variant="h4">Congratulations! You Win!</Typography>
            <Typography>Time: {gameState.timer} seconds</Typography>
            <Typography>Moves: {gameState.moves}</Typography>
            <Typography>Score: {gameState.score}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
