import { parseGCG } from "../utils/gcgParser.js";

export const createRack = (moveSet, currentMoveRef, parsedMoves = null) => {
    // Use pre-parsed moves if available
    if (parsedMoves && Array.isArray(parsedMoves)) {
        return getRackFromParsedMoves(parsedMoves, currentMoveRef);
    }
    
    // If moveSet is a string (old format), parse it first
    if (typeof moveSet === 'string') {
        const parsedMoves = parseGCG(moveSet);
        return getRackFromParsedMoves(parsedMoves, currentMoveRef);
    }
    
    // If moveSet is already an array of strings (current format)
    if (Array.isArray(moveSet)) {
        // Try new parser first
        try {
            const gcgString = moveSet.join('\n');
            const parsedMoves = parseGCG(gcgString);
            return getRackFromParsedMoves(parsedMoves, currentMoveRef);
        } catch (error) {
            // Fall back to old parsing method
            return getRackFromOldFormat(moveSet, currentMoveRef);
        }
    }
    
    return [];
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

const getRackFromOldFormat = (moveSet, currentMoveRef) => {
    var move = moveSet ? moveSet[currentMoveRef + 1] : null;
    if (!move) return [];
    
    const parts = move.split(" ");
    if (parts.length < 2) return [];
    
    const rack = parts[1];
    
    // Handle exchanges (racks that start with -)
    if (rack.startsWith('-')) {
        return []; // No rack shown for exchanges
    }
    
    // Handle blank tiles (represented as ?)
    return move.rack.split('').map(char => char === '?' ? '?' : char);
};