/**
 * Calculates the leave (remaining tiles) after a move
 * @param {Object} move - The move object containing tiles to be played
 * @param {Array} currentRack - The current player's rack
 * @returns {string} The sorted leave string
 */
export const calculateLeave = (move, currentRack) => {
  // Create a copy of the current rack
  const rackCopy = [...currentRack];
  
  // Remove tiles used in the move
  for (const tile of move.tiles) {
    if (tile.isNew) {
      // For blank tiles, we need to find the blank in the rack
      const tileIndex = tile.isBlank ? rackCopy.indexOf('?') : rackCopy.indexOf(tile.letter);
      if (tileIndex !== -1) {
        rackCopy.splice(tileIndex, 1);
      }
    }
  }
  // Sort the remaining tiles to create the leave
  return rackCopy.sort().join('');
};

/**
 * Fetches leave values for a list of moves
 * @param {Array} moves - Array of moves to calculate leave values for
 * @param {Object} leaveValues - Current cache of leave values
 * @param {Function} setLeaveValues - State setter for leave values
 * @returns {Promise<Object>} Updated leave values
 */
export const fetchLeaveValues = async (moves, leaveValues = {}, setLeaveValues) => {
  try {
    // Calculate leave values for each move
    const leavesToFetch = new Map();
    const leavesArray = [];
    
    for (const move of moves) {
      // For regular moves, calculate the leave after playing the word
      const leaveStr = move.isExchange ? move.leave : calculateLeave(move, move.currentRack);
      move.leave = leaveStr; // Add leave to the move object
      
      // Only fetch if we don't already have this leave value
      if (!leaveValues[leaveStr]) {
        leavesToFetch.set(leaveStr, true);
        leavesArray.push(leaveStr);
      }
    }

    // Only make the API call if we have new leaves to fetch
    if (leavesToFetch.size > 0) {
      const response = await fetch('/.netlify/functions/getLeaveValues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leaves: leavesArray }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave values');
      }

      const data = await response.json();
      
      // Update the leaveValues state with the new values
      const newLeaveValues = {};
      if (data.leaveValues) {
        // The response is now an object with leave strings as keys
        Object.assign(newLeaveValues, data.leaveValues);
      }
      
      // Merge new leave values with existing ones
      const updatedLeaveValues = {
        ...leaveValues,
        ...newLeaveValues
      };
      
      // Only call setLeaveValues if it's provided
      if (setLeaveValues) {
        setLeaveValues(updatedLeaveValues);
      }

      // Return the updated leave values for immediate use
      return updatedLeaveValues;
    }

    // If no new leaves to fetch, return current leave values
    return leaveValues;
  } catch (error) {
    console.error('Error fetching leave values:', error);
    return leaveValues || {}; // Return empty object if leaveValues is undefined
  }
};

/**
 * Calculates the leave after exchanging tiles
 * @param {Array} rack - The current rack of tiles
 * @param {Array} tilesToExchange - The tiles to be exchanged
 * @returns {string} The sorted leave string
 */
export const calculateExchangeLeave = (rack, tilesToExchange) => {
  const rackCopy = [...rack];
  // Remove tiles that would be exchanged
  for (const tile of tilesToExchange) {
    const index = rackCopy.indexOf(tile === '*' ? '?' : tile);
    if (index !== -1) {
      rackCopy.splice(index, 1);
    }
  }
  return rackCopy.sort().join('');
}; 