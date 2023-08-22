import styles from './Board.module.css';
import { Box } from '@mui/system';
import { letterLookup } from '../References/staticData';

export default function Board({
    theme = "STANDARD",
    move = "N/A",
    points = "",
    rack = "",
    dictionary = "",
    board = [],
    onBoardChildClick
}) {
    let boardTheme = "Board__" + theme;
    let tableTheme = "Table__" + theme;
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
    return (
        <Box className={`${styles.Board} ${styles[boardTheme]}`} onClick={onBoardChildClick}>
            <Box className={styles.Header}>
                {dictionary}
            </Box>
            <Box className={styles.innerBox}>
                <Box className={styles.Left}>
                    
                </Box>
                <Box className={`${styles.tableContainer} ${styles[tableTheme]}`}>
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
                </Box>
            </Box>
            <Box className={styles.Footer}>
                {message}
            </Box>
        </Box>
    )
}

