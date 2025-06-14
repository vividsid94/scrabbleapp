import styles from './Rack.module.css';
import { Box } from '@mui/system';
import React from "react";
import {modifyImageColor} from "../../../functions/tileFunctions.js"; // Importing tile functions
import Cell from './Cell';

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

        const handleDragStart = (e, tile, index) => {
            e.dataTransfer.setData('tile', tile);
            e.dataTransfer.setData('index', index);
            e.dataTransfer.effectAllowed = 'move';
        };

        let rack = props.rack || props.board;
        return (
            <Box className={styles.Rack}>
                {rack.map((letter, index) => (
                    <Box 
                        key={index}
                        className={`${styles.Protile} ${props.selectedTiles?.some(t => t.tile === letter && t.index === index) ? styles.selected : ''}`}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, letter, index)}
                        onClick={() => props.onTileClick && props.onTileClick(letter, index)}
                    >
                        <Cell 
                            type="rack"
                            bonus={{ value: letter === '?' ? '_' : letter }}
                            color={props.color}
                        />
                    </Box>
                ))}
            </Box>
        );
    };
})();
