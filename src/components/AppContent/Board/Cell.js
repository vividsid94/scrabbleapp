import {useState, useEffect} from 'react';
import styles from './Cell.module.css';
let allLetters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'];
export default (function() {
    let preloadedImages = {}; // define variable in closure scope
    function preload() {
      allLetters.forEach(letter => {
        let srcString = '/images/white-pro/' + letter + '.png';
        preloadedImages[letter] = new Image();
        preloadedImages[letter].src = srcString;
      });
    }
    return function Cell(rowIndex, colIndex, bonus, type, theme, tiles) {
      if(Object.keys(preloadedImages).length === 0){
        preload();
      }
    let cellTheme = "Cell__" + theme;

    function cell(letter){
        if (letter){
            let src = ( 'url(' + preloadedImages[/[a-z]/.test(letter) ? '_' : letter].src + ')');
            return (<div className={styles[cellTheme]} style={{ boxShadow: bonus.boxShadow, backgroundImage: src, backgroundSize: '100%', boxSizing: 'border-box'}}></div>);
        }
    }

    let classN = "basic";
    let classQ = "basic";
    let classO = "";
    let classP = "";
    let classZ = "";
    if (bonus.value){
      classZ = "cellPositioning"
    }
    if (bonus.color !== "#FDF5D8" && !bonus.value ){
      classN = "decal";
      classQ = "decal2";
      classO = bonus.color.replace("#", "").trim() + "__NtoS"
      classP = bonus.color.replace("#", "").trim() + "__NtoS"
    }
    switch (type) {
        case "board":
            if (tiles === "PROTILES"){
                return (<div className={`${styles[classZ]}`} style={{ backgroundColor: bonus.color, boxShadow: bonus.boxShadow, backgroundImage: bonus.image}}><div className={styles.decalContainer}><div className={`${styles[classN]} ${styles[classO]}`}><div className={`${styles[classQ]} ${styles[classP]}`}>{cell(bonus.value)}</div></div></div></div>);
            }
            else{
                return (<div className={styles[cellTheme]} style={{ backgroundColor: bonus.color, boxShadow: bonus.boxShadow, backgroundImage: bonus.image}}>{bonus.value}</div>);
            }
        case "pool":
            return (<div className={styles.cellPool}>{bonus.value}</div>);
        case "rack":
            return bonus.value;
        default:
            return bonus.value;
    }
  }
})();
