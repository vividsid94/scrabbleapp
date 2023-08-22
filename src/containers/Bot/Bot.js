import React, { useState } from 'react';
import { findEligibleCoordinates } from '../../functions/moveFunctions';

function App() {
  const [result, setResult] = useState(null);

  const handleClick = async () => {
    try {
      const response = await fetch('/.netlify/functions/findEligibleCoordinates', {
        method: 'POST',
        body: JSON.stringify({ board: [
          [4, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 4],
          [0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0],
          [0, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, 0, 3, 0, 0],
          [1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1],
          [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
          [0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
          [0, 0, 1, 0, 0, 0, 1, "F", 1, 0, 0, 0, 1, 0, 0],
          [4, 0, 0, 1, 0, 0, 0, "U", "H", 0, 0, 1, 0, 0, 4],
          [0, 0, 1, 0, 0, 0, 1, "G", 1, 0, 0, 0, 1, 0, 0],
          [0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
          [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
          [1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1],
          [0, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, 0, 3, 0, 0],
          [0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0],
          [4, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, "Z"],
        ]}),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error calling function:', error);
    }
  };

  return (
    <div>
      <button onClick={handleClick}>Call Function</button>
      <pre></pre>
    </div>
  );
}

export default App;
