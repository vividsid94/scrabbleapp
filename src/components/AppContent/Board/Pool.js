import styles from './Pool.module.css';

export default function Pool(props) {
  const board = [];
  let currentChar = null;
  let currentSpan = [];
  let rack = props.rack;
  for (const char of props.board) {
    if (char !== currentChar) {
      if (currentSpan.length > 0) {
        let className = styles.charGroup;
        if (rack.includes(currentChar)) {
          // Only apply the "red" class to the first X characters in the span
          for (let i = 0; i < rack.filter(char => char === currentChar).length; i++) {
            currentSpan[i] = <span key={currentChar + i} className={`${styles.red}`}>{currentSpan[i]}</span>;
          }
        }
        board.push(
          <span key={currentChar} className={className}>{currentSpan}</span>
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
      currentSpan[0] = <span key={currentChar + rack} className={`${styles.red}`}>{currentSpan[0]}</span>;
    }
    board.push(
      <span key={currentChar} className={className}>{currentSpan}</span>
    );
  }

  return (
    <div className={styles.poolTbl}>
      {board} <br/>({props.board.length} - {rack.length} unseen)
    </div>
  );
}
