import { useState, useEffect } from 'react';
import styles from './Cell.module.css';

let allLetters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'];
let preloadedImages = {};

function preload() {
  allLetters.forEach(letter => {
    let srcString = '/images/batch_processed_images/' + letter + '.png';
    preloadedImages[letter] = new Image();
    preloadedImages[letter].src = srcString;
  });
}

preload();

export default function Cell(rowIndex, colIndex, bonus, type, theme, tiles) {
  let cellTheme = "Cell__" + theme;

  function cell(letter) {
    if (letter) {
      const cacheKey = /[a-z]/.test(letter) ? '_' : letter;
      const cachedImage = preloadedImages[cacheKey];

      if (cachedImage) {
        return (
          <div
            className={styles[cellTheme]}
            style={{
              boxShadow: bonus.boxShadow,
              backgroundImage: `url(${cachedImage.src})`,
              backgroundSize: '100%',
              boxSizing: 'border-box',
            }}
          ></div>
        );
      } else {
        // Image not cached, you might want to handle this case (e.g., show a loading spinner).
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
          <div className={styles[cellTheme]} style={{ background: bonus.color, boxShadow: bonus.boxShadow }}>
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