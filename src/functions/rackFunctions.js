import Cell from "../components/AppContent/Board/Cell";

export const createRack = (moveSet, currentMoveRef) => {
    var move = moveSet ? moveSet[currentMoveRef + 1] : null;
    const parts = move ? move.split(" ") : '';
    const rack = parts ? parts[1].replace(/\?/g, " ").split('') : [];
    return rack;
}