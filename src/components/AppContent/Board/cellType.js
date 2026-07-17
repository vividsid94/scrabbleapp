import { getCellColors, cellColors } from '../References/cellColors';

export default function CellType(type, lightenedCell, lightMode = 'dark', premiumSquareType = null){
    let result;
    const boxShadowColor = lightMode === 'dark'
        ? 'rgba(0, 0, 0, 0.35)'
        : 'rgba(120, 108, 96, 0.65)';
    const boxShadowOffset = lightMode === 'dark' ? '0.15px' : '1px';
    let regBoxShadow = 'inset ' + boxShadowOffset + ' ' + boxShadowOffset + ' ' + boxShadowColor + ', inset -' + boxShadowOffset + ' -' + boxShadowOffset + ' ' + boxShadowColor;
    
    const colors = getCellColors(lightMode);

    if (type in colors) {
        result = {
            ...colors[type],
            boxShadow: regBoxShadow,
            hasBorder: false
        };
    } else {
        // For letters (tiles), use premium square color if provided, otherwise default board color
        const backgroundColor = premiumSquareType !== null && premiumSquareType in colors 
            ? colors[premiumSquareType].color 
            : colors[0].color;
        result = {
            value: type,
            hasBorder: lightenedCell,
            color: backgroundColor
        };
    }
    return result;
}