import Cell from './Cell';
import styles from './Board.module.css';
import { Box } from '@mui/system';
import { letterLookup } from '../References/staticData';

export default function Board(props) {
    let boardTheme = "Board__" + props.theme;
    let tableTheme = "Table__" + props.theme;
    let pointsShown = props.theme === "APPLE";
    let message = "";
    if (/^-[^-\s]/.test(props.move)){
        message = "Exchanged: " + props.move.substring(1, props.move.indexOf(" ")); 
    }
    else if (/^-[^-]/.test(props.move)){
        message = "Unsuccessfully challenged or passed"
    }
    else{
        switch (props.move[0]) {
            case "-":
                message = "Challenged off";
                break;
            case "+":
                message = props.move + " " + (props.points ? props.points : "") + "(final)";
                break;
            default:
                if (props.move !== "N/A"){
                    message = props.move + " " + props.points;
                }
                else{
                    message = "Start of game";
                }
        }
    }
    return (
        <Box className={`${styles.Board} ${styles[boardTheme]}`} onClick={props.onBoardChildClick}>
            <Box sx={{visibility: pointsShown ? 'hidden' : 'visible'}} className={styles.Header}>
                {props.dictionary}
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
                            {props.board.map((row, rowIndex) =>
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
            <Box sx={{visibility: pointsShown ? 'hidden' : 'visible'}} className={styles.Footer}>
                {message}
            </Box>
        </Box>
    )
}
