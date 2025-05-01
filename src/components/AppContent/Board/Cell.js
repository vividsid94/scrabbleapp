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

function lightenColor(color) {
  if (!color) return 'rgb(240, 240, 240)';
  const baseColor = color.includes('rgba') ? color.split(',')[0] + ')' : color;
  return `color-mix(in srgb, ${baseColor} 60%, white)`;
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
              backgroundColor: bonus.hasBorder ? lightenColor(color) : color,
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
      return (
        <div style={{ 
          background: bonus.hasBorder ? lightenColor(bonus.color) : bonus.color, 
          boxShadow: bonus.boxShadow 
        }}>
          <div className={styles.decalContainer}>
              <div>{cell(bonus.value)}</div>
          </div>
        </div>
      );
    case "pool":
      return <div className={styles.cellPool}>{bonus.value}</div>;
    case "rack":
      return bonus.value;
    default:
      return bonus.value;
  }
}
