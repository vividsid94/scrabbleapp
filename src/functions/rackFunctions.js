import { parseGCG } from "../utils/gcgParser.js";

export const createRack = (currentMoveRef, parsedMoves) => {
    return getRackFromParsedMoves(parsedMoves, currentMoveRef);
};

const getRackFromParsedMoves = (parsedMoves, currentMoveRef) => {
    if (!parsedMoves || currentMoveRef < 0 || currentMoveRef >= parsedMoves.length) {
        return [];
    }
    
    const move = parsedMoves[currentMoveRef];
    if (!move || !move.rack) {
        return [];
    }
    
    // Handle blank tiles (represented as ?)
    return move.rack.split('').map(char => char === '?' ? '?' : char);
};

