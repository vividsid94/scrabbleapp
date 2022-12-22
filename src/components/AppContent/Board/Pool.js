import Cell from './Cell';
import cellBonusMap from './cellType';
import styles from './Pool.module.css';

export default function Pool(props) {
  const rows = [];
  let currentRow = [];

  for (let i = 0; i < props.board.length; i++) {
    currentRow.push(props.board[i]);

    if (currentRow.length === 14 || i === props.board.length - 1) {
      rows.push(currentRow);
      currentRow = [];
    }
  }

  return (
    <div className={styles.poolTbl}>
      <table>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((col, colIndex) => (
                <td key={colIndex}>{col}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
