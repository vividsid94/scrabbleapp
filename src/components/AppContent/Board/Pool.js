import styles from './Pool.module.css';

export default function Pool(props) {
  const board = [];
  let currentChar = null;
  let currentSpan = [];

  for (const char of props.board) {
    if (char !== currentChar) {
      if (currentSpan.length > 0) {
        board.push(
          <span className={styles.charGroup}>{currentSpan}</span>
        );
      }
      currentChar = char;
      currentSpan = [char];
    } else {
      currentSpan.push(char);
    }
  }

  if (currentSpan.length > 0) {
    board.push(
      <span className={styles.charGroup}>{currentSpan}</span>
    );
  }

  return (
    <div className={styles.poolTbl}>
      {board}
    </div>
  );
}
