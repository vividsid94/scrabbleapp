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

export default function Cell({ rowIndex, colIndex, bonus, type, theme, tiles, color, isBlank, isLastMove }) {
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
              boxShadow: bonus?.boxShadow,
              backgroundColor: isLastMove ? lightenColor(color) : (bonus?.hasBorder ? lightenColor(color) : color),
              boxSizing: 'border-box',
              opacity: isLastMove ? 0.85 : 1,
              border: 'none',
              borderRadius: '0',
              position: isBlank ? 'relative' : 'static',
            }}
          >
            {!isBlank && (
              <img 
                src={modifiedImageUrl} 
                alt={`tile ${bonus?.value}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 0
                }} 
              />
            )}
            
            {isBlank && (
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                backgroundImage: `url(${modifiedImageUrl})`,
                backgroundSize: '100%',
                transform: 'rotate(-15deg)',
                zIndex: 1
              }} />
            )}
            
            {isBlank && (
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.6) 3px, rgba(255,255,255,0.6) 6px)',
                pointerEvents: 'none',
                zIndex: 2
              }} />
            )}
          </div>
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
          background: bonus?.hasBorder ? lightenColor(bonus.color) : bonus.color, 
          boxShadow: bonus?.boxShadow 
        }}>
          <div className={styles.decalContainer}>
              <div>{cell(bonus?.value)}</div>
          </div>
        </div>
      );
    case "pool":
      return <div className={styles.cellPool}>{bonus?.value}</div>;
    case "rack":
      return (
        <div style={{ 
          background: bonus?.hasBorder ? lightenColor(bonus.color) : bonus.color, 
          boxShadow: bonus?.boxShadow 
        }}>
          <div className={styles.decalContainer}>
              <div>{cell(bonus?.value)}</div>
          </div>
        </div>
      );
    default:
      return bonus?.value;
  }
}
