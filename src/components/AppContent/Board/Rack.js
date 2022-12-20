import Cell from './Cell';
import cellBonusMap from './cellBonusMap';
import styles from './Rack.module.css';
import { Box } from '@mui/system';

export default function Rack(props) {
    return (
        <Box className={styles.Rack} >
            {props.board.map((col, colIndex) => <Box className={styles.Tile} key={colIndex}>{col}</Box>)}
        </Box>
    )
}
