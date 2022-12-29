import Cell from './Cell';
import styles from './Board.module.css';
import { Box } from '@mui/system';

export default function Board(props) {
    let boardTheme = "Board__" + props.theme;
    let tableTheme = "Table__" + props.theme;
    let pointsShown = props.points == "0" || props.theme === "APPLE";
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
                {props.move != null && props.move !== "N/A" ? props.move + " " + props.points : "No previous play"}
            </Box>
        </Box>
    )
}
