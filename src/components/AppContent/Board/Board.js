import React, { useState, useEffect, useRef, useContext } from "react";
import styles from './Board.module.css';
import { Box, Tooltip } from '@mui/material';
import { letterLookup } from '../References/staticData';
import { Modal } from '@mui/material';
import { ThemeContext } from '../../../App';

export default function Board({
    boardMode = "STANDARD",
    move = "N/A",
    points = "",
    rack = "",
    dictionary = "",
    board = [],
    moveDirection,
    onBoardChildClick,
    onTileDrop,
    selectedPosition,
    arrowDirection,
    animate = true,
    showSlip = true,
    showDictionary = true,
    previewScore,
    previewScorePosition,
    lastMoveCoordinates = []
}) {
    const { lightMode } = useContext(ThemeContext);
    let boardTheme = "Board__" + boardMode;
    let tableTheme = "Table__" + boardMode;
    const [open, setOpen] = useState(false);
    const [modalContent, setModalContent] = useState("slip");
    const [circledLetters, setCircledLetters] = useState([]);
    const handleClose = () => setOpen(false);

    useEffect(() => {
        const lowercaseLetters = move.match(/(?<![a-z(])[a-z](?![a-z)])/g);
        if (moveDirection === 'neutral') {
            setCircledLetters([]);
        }
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
    
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, row, col) => {
        e.preventDefault();
        const tile = e.dataTransfer.getData('tile');
        const index = e.dataTransfer.getData('index');
        if (onBoardChildClick) {
            onBoardChildClick(row, col);
        }
        if (onTileDrop) {
            onTileDrop(tile, index, row, col);
        }
    };

    const getHeaderStyle = () => ({
        backgroundColor: lightMode === 'dark' ? 'rgb(12, 12, 59)' : '#b8b6a9',
        color: lightMode === 'dark' ? '#fff' : '#000'
    });



    return (
        <Box className={`${styles.BoardContainer} ${styles[boardTheme]}`}>
            <Box className={`${styles.Header} ${!showDictionary ? styles.hidden : ''}`} style={getHeaderStyle()}>
                <Box className={styles.headerContent}>
                    {dictionary}
                </Box>
                {boardMode === "STANDARD" && showSlip && (
                    <Box 
                        className={`${styles.coloredBox} ${styles.slipBox} ${styles[`slipBox__${boardMode}`]}`} 
                        onClick={handleSlipClick}
                    >
                        Slip
                    </Box>
                )}
            </Box>
            <Box className={styles.innerBox}>
                <Box className={`${styles.Board} ${styles.tableContainer} ${styles[tableTheme]} ${!animate ? styles.noAnimate : ''}`}>
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
                                    {row.map((col, colIndex) => (
                                        <td 
                                            key={colIndex}
                                            onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                                            onDragOver={handleDragOver}
                                            onClick={() => onBoardChildClick && onBoardChildClick(rowIndex, colIndex)}
                                        >
                                            {col}
                                            {selectedPosition && selectedPosition.row === rowIndex && selectedPosition.col === colIndex && (
                                                <div className={previewScore && previewScorePosition?.row === rowIndex && previewScorePosition?.col === colIndex ? 
                                                    styles.arrowIndicatorWithScore : styles.arrowIndicator}>
                                                    {previewScore && previewScorePosition?.row === rowIndex && previewScorePosition?.col === colIndex ? 
                                                        arrowDirection === 'right' ? 
                                                            `${previewScore}→` : 
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                <span>{previewScore}</span>
                                                                <span>↓</span>
                                                            </div>
                                                        : 
                                                        arrowDirection === 'right' ? '→' : '↓'
                                                    }
                                                </div>
                                            )}
                                        </td>
                                    ))}
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
                    {showSlip && boardMode !== "STANDARD" && (
                        <Box className={`${styles.coloredBox} ${styles.slipBox}`} onClick={handleSlipClick}>
                            Slip
                        </Box>
                    )}
                </Box>
            </Box>

            <Modal open={open} onClose={handleClose}>
                <Box className={styles.modalContainer}>
                    {modalContent === "slip" && <SlipContent />}
                </Box>
            </Modal>  
        </Box>
    )
}

