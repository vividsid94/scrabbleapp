import React, { useState, useEffect, useRef } from "react";
import styles from './Board.module.css';
import { Box } from '@mui/system';
import { letterLookup } from '../References/staticData';
import { Modal } from '@mui/material';

export default function Board({
    theme = "STANDARD",
    move = "N/A",
    points = "",
    rack = "",
    dictionary = "",
    board = [],
    moveDirection,
    onBoardChildClick
}) {
    let boardTheme = "Board__" + theme;
    let tableTheme = "Table__" + theme;
    const [open, setOpen] = useState(false);
    const [modalContent, setModalContent] = useState("slip");
    const handleClose = () => setOpen(false);
    let message = "";
    if (/^-[^-\s]/.test(move)){
        message = "Exchanged: " + move.substring(1, move.indexOf(" ")); 
    }
    else if (/^-[^-]/.test(move)){
        message = "Unsuccessfully challenged or passed"
    }
    else{
        switch (move[0]) {
            case "-":
                message = "Challenged off";
                break;
            case "+":
                message = move + " " + (points ? points : "") + "(final)";
                break;
            default:
                if (move !== "N/A"){
                    message = move + " " + points + " from " + rack;
                }
                else{
                    message = "Start of game";
                }
        }
    }

    const [circledLetters, setCircledLetters] = useState([]);
    useEffect(() => {
        const lowercaseLetters = move.match(/(?<![a-z(])[a-z](?![a-z)])/g);
        if (lowercaseLetters) {
            if (moveDirection === 'forward') {
                setCircledLetters(prevLetters => [...prevLetters, ...lowercaseLetters]);
            } else if (moveDirection === 'backward') {
                setCircledLetters(prevLetters => prevLetters.filter(letter => !lowercaseLetters.includes(letter)));
            }
        }
    }, [move]);

    const handleSlipClick = (event) => {
        event.stopPropagation();
        setOpen(true);
    };
    
    let overallIndex = 0; // Initialize overall index outside the function

    const generateLetterBoxes = (startCharCode, endCharCode) => {
        return (
            <Box className={styles.row}>
                {Array.from({ length: endCharCode - startCharCode + 1 }, (_, index) => {
                    overallIndex++; // Increment overall index for each letter
                    return (
                        <Box
                            className={`${styles.letterBox} ${shouldApplyCircle(overallIndex) ? styles.circle : ''}`}
                            key={String.fromCharCode(startCharCode + index)}
                            id={`letter-${String.fromCharCode(startCharCode + index)}`} // Assign unique IDs to each letter box
                        >
                            {String.fromCharCode(startCharCode + index)}
                        </Box>
                    );
                })}
            </Box>
        );
    };
    
    const shouldApplyCircle = (index) => {
        if (circledLetters.length === 0) {
            return false; // No letters to circle
        }
        const letterIndices = circledLetters.map((letter, idx) => {
            if (idx === 1) { // Apply the offset only for the second letter
                return letter.charCodeAt(0) - 96 + 26;
            }
            return letter.charCodeAt(0) - 96;
        });
        return letterIndices.includes(index);
    };
    
    
    const SlipContent = () => (
        <Box>
            {generateLetterBoxes(65, 77)}
            {generateLetterBoxes(78, 90)}
            <Box className={styles.spacing}></Box> {/* Add spacing between sections */}
            {generateLetterBoxes(65, 77)}
            {generateLetterBoxes(78, 90)}
        </Box>
    );
    
    

    return (
        <Box className={`${styles.BoardContainer} ${styles[boardTheme]}`}>
            <Box className={styles.Header}>
                {dictionary}
            </Box>
            <Box className={styles.innerBox}>
                <Box className={styles.Left}>
                    
                </Box>
                <Box className={`${styles.Board} ${styles.tableContainer} ${styles[tableTheme]}`} onClick={onBoardChildClick}>
                    <table>
                        <thead>
                            <tr> 
                                <th className={`${styles.sideNumbering} ${styles.NWcell}`}/>
                                {Object.keys(letterLookup).map(letter => (
                                    <th className={styles.sideNumbering} key={letter}>{letter.toLowerCase()}</th>
                                ))}
                                <th className={`${styles.sideNumbering} ${styles.NEcell}`}/>
                            </tr>
                        </thead>
                        <tbody>
                            {board.map((row, rowIndex) =>
                                <tr key={rowIndex}>
                                    <td className={styles.sideNumbering}>{letterLookup[Object.keys(letterLookup)[rowIndex]]}</td>
                                    {row.map((col, colIndex) => <td key={colIndex}>{col}</td>)}
                                    <td className={styles.sideNumbering}>{letterLookup[Object.keys(letterLookup)[rowIndex]]}</td>
                                </tr>
                            )}
                            <tr> 
                                <th className={`${styles.sideNumbering} ${styles.SWcell}`}/>
                                {Object.keys(letterLookup).map(letter => (
                                    <th className={styles.sideNumbering} key={letter}>{letter.toLowerCase()}</th>
                                ))}
                                <th className={`${styles.sideNumbering} ${styles.SEcell}`}/>
                            </tr>
                        </tbody>
                    </table>
                </Box>
                <Box className={styles.Right}>
                    <Box className={`${styles.coloredBox} ${styles.slipBox}`} onClick={handleSlipClick}>
                        Slip
                    </Box>
                </Box>
            </Box>
            <Box className={styles.Footer}>
                {message}
            </Box>
            <Modal open={open} onClose={handleClose}>
                <Box className={styles.modalContainer}>
                    {modalContent === "slip" && <SlipContent />}
                </Box>
            </Modal>  
        </Box>
    )
}

