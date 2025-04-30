import styles from './Cell.module.css';
import { modifyImageColor } from "../../../functions/tileFunctions.js";

let allLetters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'];
let preloadedImages = {};

function preload() {
  allLetters.forEach(letter => {
    let srcString = '/images/compressed-clean-protiles/' + letter + '.png';
    preloadedImages[letter] = new Image();
    preloadedImages[letter].src = srcString;
  });
}

preload();

export default function Cell(rowIndex, colIndex, bonus, type, theme, tiles, color) {
  function cell(letter) {
    if (letter) {
      const cacheKey = /[a-z]/.test(letter) ? '_' : letter;
      const cachedImage = preloadedImages[cacheKey];

      if (cachedImage) {
        const modifiedImageUrl = modifyImageColor(cachedImage, color);

        return (
          <div
            className={styles.Cell}
            style={{
              boxShadow: bonus.boxShadow,
              backgroundImage: `url(${modifiedImageUrl})`,
              backgroundSize: '100%',
              backgroundColor: color,
              boxSizing: 'border-box',
            }}
          ></div>
        );
      } else {
        return null;
      }
    }
  }

  switch (type) {
    case "board":
      if (tiles === "PROTILES") {
        return (
          <div style={{ background: bonus.color, boxShadow: bonus.boxShadow }}>
            <div className={styles.decalContainer}>
                <div>{cell(bonus.value)}</div>
            </div>
          </div>
        );
      } else {
        return (
          <div className={styles.Cell} style={{ background: bonus.color, boxShadow: bonus.boxShadow }}>
            {bonus.value}
          </div>
        );
      }
    case "pool":
      return <div className={styles.cellPool}>{bonus.value}</div>;
    case "rack":
      return bonus.value;
    default:
      return bonus.value;
  }
}
