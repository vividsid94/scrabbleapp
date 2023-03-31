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
      let src = ('url(' + preloadedImages[/[a-z]/.test(letter) ? '_' : letter].src + ')');
      return (<div className={styles[cellTheme]} style={{ boxShadow: bonus.boxShadow, backgroundImage: src, backgroundSize: '100%', boxSizing: 'border-box' }}></div>);
    }
  }

  let classN = "basic";
  let classQ = "basic";
  let classO = "";
  let classP = "";
  let classZ = "";

  if (bonus.value) {
    classZ = "cellPositioning"
  }

  if (bonus.color !== "#FDF5D8" && !bonus.value) {
    classN = "decal";
    classQ = "decal2";
    classO = bonus.color.replace("#", "").trim()
    classP = bonus.color.replace("#", "").trim()
  }

  switch (type) {
    case "board":
      if (tiles === "PROTILES") {
        return (<div className={`${styles[classZ]}`} style={{ background: bonus.color, boxShadow: bonus.boxShadow }}><div className={styles.decalContainer}><div className={`${styles[classN]} ${styles[classO]}`}><div className={`${styles[classQ]} ${styles[classP]}`}>{cell(bonus.value)}</div></div></div></div>);
      } else {
        return (<div className={styles[cellTheme]} style={{ background: bonus.color, boxShadow: bonus.boxShadow }}>{bonus.value}</div>);
      }
    case "pool":
      return (<div className={styles.cellPool}>{bonus.value}</div>);
    case "rack":
      return bonus.value;
    default:
      return bonus.value;
  }
}
