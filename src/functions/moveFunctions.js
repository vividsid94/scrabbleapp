function calculateDistance(coordA, coordB) {
  const verticalDistance = Math.abs(coordA[0] - coordB[0]);
  const horizontalDistance = Math.abs(coordA[1] - coordB[1]);
  return { verticalDistance, horizontalDistance };
}

export function findEligibleCoordinates(board) {
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
        if (board[i][j] !== 0) {  // Skip empty cells
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



export const generateRandomRack = (rackSize) => {
  const standardTileDistribution = {
    A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1,
    K: 1, L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6,
    U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1
  };
  const letters = Object.keys(standardTileDistribution);
  let rack = [];
  while (rack.length < rackSize) {
    const randomIndex = Math.floor(Math.random() * letters.length);
    const letter = letters[randomIndex];
    if (standardTileDistribution[letter] > 0) {
      rack.push(letter);
      standardTileDistribution[letter]--;
    } else {
      // If no more tiles of this letter are available, remove it from the list
      letters.splice(randomIndex, 1);
    }
    // If all tiles have been used up, break the loop
    if (letters.length === 0) {
      break;
    }
  }
  return rack;
}


export const getAllWordsFromRack = (rack, dictionary) => {
  const results = [];

  function generateWords(remainingRack, currentWord) {
    if (currentWord.length > 0 && dictionary.includes(currentWord)) {
      results.push(currentWord);
    }

    if (remainingRack.length === 0) {
      return;
    }

    for (let i = 0; i < remainingRack.length; i++) {
      const newWord = currentWord + remainingRack[i];
      const newRack = remainingRack.slice(0, i) + remainingRack.slice(i + 1);
      generateWords(newRack, newWord);
    }
  }

  generateWords(rack.join(''), '');

  return results;
}