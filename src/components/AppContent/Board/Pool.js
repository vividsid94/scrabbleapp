import styles from './Pool.module.css';

export default function Pool(props) {
  const { board, rack = [] } = props;
  
  // Ensure props.board is a string and iterable
  const boardString = String(board || "");
  
  // Create a copy of the pool string to modify
  let poolString = boardString;
  
  // Remove tiles that are in the rack from the pool display
  for (let i = 0; i < rack.length; i++) {
    const rackTile = rack[i];
    if (rackTile === "?" || rackTile === " ") {
      // Remove a blank tile from pool
      poolString = poolString.replace("?", "");
    } else {
      // Remove the specific tile from pool
      poolString = poolString.replace(rackTile, "");
    }
  }
  
  // Display logic for the filtered pool
  const boardArray = [];
  let currentChar = null;
  let currentSpan = [];
  
  for (let i = 0; i < poolString.length; i++) {
    const char = poolString[i];
    if (char !== currentChar) {
      if (currentSpan.length > 0) {
        boardArray.push(
          <span key={`${currentChar}-${i}`} className={styles.charGroup}>{currentSpan}</span>
        );
      }
      currentChar = char;
      currentSpan = [char];
    } else {
      currentSpan.push(char);
    }
  }

  if (currentSpan.length > 0) {
    boardArray.push(
      <span key={`${currentChar}-final`} className={styles.charGroup}>{currentSpan}</span>
    );
  }

  return (
    <div className={styles.poolTbl}>
      {boardArray} <br/>({poolString.length} unseen)
    </div>
  );
}
