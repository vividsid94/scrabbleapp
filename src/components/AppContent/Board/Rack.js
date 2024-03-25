import styles from './Rack.module.css';
import { Box } from '@mui/system';
import React from "react";
import {modifyImageColor} from "../../../functions/tileFunctions.js"; // Importing tile functions

let allLetters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'];

export default (function() {
    let preloadedImages = {}; // define variable in closure scope

    function preload() {
        allLetters.forEach(letter => {
            let srcString = '/images/compressed-clean-protiles/' + letter + '.png';
            preloadedImages[letter] = new Image();
            preloadedImages[letter].src = srcString;
        });
    }
    
    return function Rack(props) {
        if(Object.keys(preloadedImages).length === 0) {
            preload();
        }

        function rackWithTiles(letter) {
            if (letter) {
                const cacheKey = /^\s$/.test(letter) ? '_' : letter;
                const cachedImage = preloadedImages[cacheKey];
                if (cachedImage) {
                    const color = props.color;
                    const modifiedImageUrl = modifyImageColor(cachedImage, color);
                    return (
                        <div className={styles.Rack_protiles} style={{ backgroundImage: `url(${modifiedImageUrl})`, backgroundSize: '100%', boxSizing: 'border-box' }}></div>
                    );
                } else {
                    return null;
                }
            }
        }
        let rack = props.board;
        switch (props.tiles) {
            case 'PROTILES':
                return (
                    <Box className={styles.Rack}>
                        {rack.map((col, colIndex) => (
                            <Box className={styles.Protile} style={{ backgroundColor: props.color }} key={colIndex}>
                                {rackWithTiles(col)}
                            </Box>
                        ))}
                    </Box>
                );
            default:
                return (
                    <Box className={styles.Rack}>
                        {rack.map((col, colIndex) => (
                            <Box className={styles.Tile} key={colIndex}>
                                {col}
                            </Box>
                        ))}
                    </Box>
                );
        }
    };
})();
