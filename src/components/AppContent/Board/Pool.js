import Cell from './Cell';
import cellBonusMap from './cellBonusMap';

export default function Pool(props) {
    // Create a new 2D array with 7 elements per inner array

    const rows = [];
    for (let i = 0; i < props.board.length; i += 15) {
      rows.push(props.board.slice(i, i + 15));
    }
  
    return (
      <div>
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
