import { cellColors } from '../References/cellColors';

export default function CellType(type, lightenedCell){
    let result;
    let boxShadowColor = 'rgb(185, 174, 166)';
    let regBoxShadow = 'inset 0.15px 0.15px ' + boxShadowColor + ', inset -0.15px -0.15px ' + boxShadowColor;

    if (type in cellColors) {
        result = {
            ...cellColors[type],
            boxShadow: regBoxShadow,
            hasBorder: false
        };
    } else {
        // For letters (tiles), use the default board color
        result = {
            value: type,
            hasBorder: lightenedCell,
            color: cellColors[0].color // Use the default board color (var(--board-color, white))
        };
    }
    return result;
}