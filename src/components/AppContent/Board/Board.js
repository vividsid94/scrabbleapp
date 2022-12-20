import Cell from './Cell';
import styles from './Board.module.css';
import { Box } from '@mui/system';

export default function Board(props) {
    return (
        <Box className={styles.Board}>
            <Box sx={{display: props.points == "0" ? 'none' : 'flex'}} className={styles.Header}>
                {props.points}
            </Box>
            <Box className={styles.innerBox}>
                <Box className={styles.Left}>
                    
                </Box>
                <Box className={styles.tableContainer}>
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
            <Box sx={{display: props.points == "0" ? 'none' : 'flex'}} className={styles.Footer}>
                {props.move}
            </Box>
        </Box>
    )
}
