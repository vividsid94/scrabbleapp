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
  if (isBlank) {
    console.log('Cell with isBlank=true:', { rowIndex, colIndex, letter: bonus?.value, type });
  }
  function cell(letter) {
    if (letter) {
      // For blank tiles, use the actual letter (uppercase) for the image, not the blank '_'
      const cacheKey = isBlank ? letter.toUpperCase() : (/[a-z]/.test(letter) ? '_' : letter);
      const cachedImage = preloadedImages[cacheKey];

      if (isBlank) {
        console.log('Blank tile debug:', { letter, cacheKey, hasCachedImage: !!cachedImage, color });
      }

      if (cachedImage) {
        const modifiedImageUrl = modifyImageColor(cachedImage, color);
        
        if (isBlank) {
          console.log('Blank tile image URL:', modifiedImageUrl);
        }
        
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#fff',
                backgroundColor: isLastMove ? lightenColor(color) : (bonus?.hasBorder ? lightenColor(color) : (color || '#7878a4')),
                borderRadius: '4px',
                zIndex: 1
              }}>
                <span style={{ transform: 'rotate(-15deg)', zIndex: 10, position: 'relative' }}>
                  {letter}
                </span>
              </div>
            )}
            
            {isBlank && (
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                borderRadius: '50%',
                backgroundColor: lightenColor(color || '#7878a4'),
                opacity: 0.5,
                border: '1px solid rgba(0,0,0,0.3)',
                pointerEvents: 'none',
                zIndex: 3
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
