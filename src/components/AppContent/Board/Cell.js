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

    function element(letter) {
        if (letter){
            let srcString = preloadedImages[/[a-z]/.test(letter) ? '_' : letter].src;
            return <img className={styles.keyBtn} height='100%' src={srcString}></img>;
        }
    }

    function cell(letter){
        if (letter){
            let src = ( 'url(' + preloadedImages[/[a-z]/.test(letter) ? '_' : letter].src + ')');
            return (<div className={styles[cellTheme]} style={{ boxShadow: bonus.boxShadow, backgroundImage: src, backgroundSize: '100%', boxSizing: 'border-box'}}></div>);
        }
    }

    switch (type) {
        case "board":
            if (tiles === "PROTILES"){
                return (<div className={styles[cellTheme]} style={{ backgroundColor: bonus.color, boxShadow: bonus.boxShadow, backgroundImage: bonus.image}}>{cell(bonus.value)}</div>);
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
