import styles from './Pool.module.css';

export default function Pool(props) {
  const board = [];
  let currentChar = null;
  let currentSpan = [];
  
  // Ensure props.rack is an array
  const rack = Array.isArray(props.rack) ? props.rack.map(val => val === " " ? "?" : val) : [];
  
  // Ensure props.board is a string and iterable
  const boardString = String(props.board || "");
  
  for (let i = 0; i < boardString.length; i++) {
    const char = boardString[i];
    if (char !== currentChar) {
      if (currentSpan.length > 0) {
        let className = styles.charGroup;
        if (rack.includes(currentChar)) {
          // Only apply the "red" class to the first X characters in the span
          const charCount = rack.filter(c => c === currentChar).length;
          for (let j = 0; j < Math.min(charCount, currentSpan.length); j++) {
            currentSpan[j] = <span key={`${currentChar}-${j}-${i}`} className={`${styles.red}`}>{currentSpan[j]}</span>;
          }
        }
        board.push(
          <span key={`${currentChar}-${i}`} className={className}>{currentSpan}</span>
        );
      }
      currentChar = char;
      currentSpan = [char];
    } else {
      currentSpan.push(char);
    }
  }

  if (currentSpan.length > 0) {
    let className = styles.charGroup;
    if (rack.includes(currentChar)) {
      // Only apply the "red" class to the first character in the span
      currentSpan[0] = <span key={`${currentChar}-last`} className={`${styles.red}`}>{currentSpan[0]}</span>;
    }
    board.push(
      <span key={`${currentChar}-final`} className={className}>{currentSpan}</span>
    );
  }

  return (
    <div className={styles.poolTbl}>
      {board} <br/>({boardString.length} - {rack.length} unseen)
    </div>
  );
}
