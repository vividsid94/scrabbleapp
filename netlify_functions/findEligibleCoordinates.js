function calculateDistance(coordA, coordB) {
    const verticalDistance = Math.abs(coordA[0] - coordB[0]);
    const horizontalDistance = Math.abs(coordA[1] - coordB[1]);
    return { verticalDistance, horizontalDistance };
  }
  

  function findEligibleCoordinates(board) {
    const eligibleCoordinates = [];
  
    // Step 1: Find coordinates with letters
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (typeof board[i][j] === 'string') {
          const letter = board[i][j];
          eligibleCoordinates.push({ letter, coordinates: [i, j] });
        }
      }
    }
  
    // Step 2: Calculate distances for eligible coordinates
    const result = [];
    for (const { letter, coordinates } of eligibleCoordinates) {
      const distances = [];
      for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
          if (board[i][j] !== 0) {
            const distance = calculateDistance(coordinates, [i, j]);
            if (
              (distance.verticalDistance <= 7 && distance.horizontalDistance === 0) ||
              (distance.horizontalDistance <= 7 && distance.verticalDistance === 0)
            ) {
              distances.push({ coordinates: [i, j], distance });
            }
          }
        }
      }
      result.push({ letter, distances });
    }
  
    return result;
  }
  

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const result = findEligibleCoordinates(body.board);

        return {
        statusCode: 200,
        body: JSON.stringify(result),
        };
    } catch (error) {
        return {
        statusCode: 500,
        body: JSON.stringify({ error: 'An error occurred' }),
        };
    }
};