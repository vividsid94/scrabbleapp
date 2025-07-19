import styles from './Pool.module.css';

export default function Pool(props) {
  const { board } = props;
  
  // Ensure props.board is a string and iterable
  const boardString = String(board || "");
  
  // Display logic for the pool
  const boardArray = [];
  let currentChar = null;
  let currentSpan = [];
  
  for (let i = 0; i < boardString.length; i++) {
    const char = boardString[i];
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
      {boardArray} <br/>({boardString.length} remaining)
    </div>
  );
}
