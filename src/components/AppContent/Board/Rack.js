import Cell from './Cell';
import cellBonusMap from './cellBonusMap';

export default function Rack(props) {
    return (
        <div>
            <table>
                <tbody>
                    {props.board.map((col, colIndex) => <td key={colIndex}>{col}</td>)}
                </tbody>
            </table>
        </div>
    )
}
