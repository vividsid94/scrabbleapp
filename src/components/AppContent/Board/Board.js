import Cell from './Cell';
import styles from './Board.module.css';
import { Box } from '@mui/system';

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
                message = props.move + " " + props.points + "(final)";
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
                        <tbody>
                            {props.board.map((row, rowIndex) =>
                                <tr key={rowIndex}>
                                    {row.map((col, colIndex) => <td key={colIndex}>{col}</td>)}
                                </tr>
                            )}
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
