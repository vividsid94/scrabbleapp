import Cell from './Cell';
import cellBonusMap from './cellType';
import styles from './Rack.module.css';
import { Box } from '@mui/system';
import React, { useState, useEffect, useRef } from "react";

let allLetters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'];
export default (function() {
    let preloadedImages = {}; // define variable in closure scope
    function preload() {
      allLetters.forEach(letter => {
        let srcString = '/images/black-pro/' + letter + '.png';
        preloadedImages[letter] = new Image();
        preloadedImages[letter].src = srcString;
      });
    }
    return function Rack(props) {
        if(Object.keys(preloadedImages).length === 0){
            preload();
        }
        function rackWithTiles(letter){
            console.log(letter)
            if (letter){
                let src = ( 'url(' + preloadedImages[/^\s$/.test(letter) ? '_' : letter].src + ')');
                return (<div className={styles.Rack_protiles} style={{backgroundImage: src, backgroundSize: '100%', boxSizing: 'border-box'}}></div>);
            }
        }
        let rack = props.board;
        switch (props.tiles) {
            case 'PROTdILES': {
                return (<div>{rackWithTiles("A")}</div>);
            }
            case 'PROTILES': {
                return <Box className={styles.Rack} >
                    {rack.map((col, colIndex) => <Box className={styles.Tile} key={colIndex}>{rackWithTiles(col)}</Box>)}
                </Box>
            }
            default:
                return <Box className={styles.Rack} >
                    {rack.map((col, colIndex) => <Box className={styles.Tile} key={colIndex}>{col}</Box>)}
                </Box>
            }
        }
})();