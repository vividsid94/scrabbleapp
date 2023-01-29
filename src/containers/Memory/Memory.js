import React, { useState, useEffect, useRef } from "react";

import "./styles.css";
import Card from "./Card";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Memory.module.css';

import useMediaQuery from '@mui/material/useMediaQuery';

const useInterval = (callback, delay, duration) => {
  const durationRef = useRef(duration);
  const durationIntervalRef = useRef();

  const handler = () => {
    callback(durationRef);
  };

  useEffect(
    () => {
      const durationInterval = setInterval(handler, delay);
      durationIntervalRef.current = durationInterval;
      return () => {
        clearInterval(durationInterval);
      };
    },
    [delay]
  );

  return durationIntervalRef;
};

export default function Memory() {
  const [newGame, setNewGame] = useState(false);
  const [list, setList] = useState([]);
  const [subLists, setSubLists] = useState([]);
  const [visibleItems, setVisibleItems] = useState([]);
  const [duration, setDuration] = useState(0);
  const [finishedItems, setFinishedItems] = useState([]);
  const [winner, setWinner] = useState(false);
  const matches = useMediaQuery('(min-width:600px)');

  const checkItems = (firstIndex, secondIndex) => {
    if (
      firstIndex !== secondIndex &&
      list[firstIndex].url === list[secondIndex].url
    ) {
      setFinishedItems([...finishedItems, firstIndex, secondIndex]);
    } else {
      setTimeout(() => {
        setVisibleItems([]);
      }, 600);
    }
  };

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
  
  useEffect(() => {
    setList(localImages.concat(localImages.map(item => { return {...item,id: item.id + "1"};}))
        .sort(() => {
          return 0.5 - Math.random();
        })
    );
  }, [newGame], [list]);

  const durationIntervalRef = useInterval(
    durationRef => {
      durationRef.current++;
      setDuration(durationRef.current);
    },
    1000,
    duration
  );

  useEffect(
    () => {
      if (finishedItems.length > 0 && finishedItems.length === list.length) {
        setWinner(true);
        clearInterval(durationIntervalRef.current);
      }
    },
    [finishedItems]
  );


  useEffect(() => {
    const numberOfColumns = matches ? 4 : 3;
    let tempSubLists = [];
    for (let i = 0; i < list.length; i += numberOfColumns) {
      tempSubLists.push(list.slice(i, i + numberOfColumns));
    }
    setSubLists(tempSubLists);
  }, [list, matches]);

  return (
    <Box sx={{ display: 'table'}}>
        <Sidenav/>
        <button onClick={() => {setNewGame(!newGame); setVisibleItems([]); setFinishedItems([]); setWinner(false);}}> New Game </button>
        <table>
      <tbody>
        {subLists.map((subList, subListIndex) => (
          <tr className={styles.row} key={subListIndex}>
            {subList.map((item, index) => (
              <td key={item.id}>
                <Card
                  className={`${
                    visibleItems.includes(
                      subListIndex * subList.length + index
                    )
                      ? 'grid-card-show'
                      : ''
                  } ${
                    finishedItems.includes(
                      subListIndex * subList.length + index
                    )
                      ? 'grid-card-show grid-card-finished'
                      : ''
                  }`}
                  onClick={() => {
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
        <div>
            You Win!
            <br />
            Finished in {duration} seconds
        </div>
    )}
    </Box>
  );
}
