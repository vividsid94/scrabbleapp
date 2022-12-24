import {useState, useEffect} from 'react';
import styles from './Cell.module.css';

export default function Cell(rowIndex, colIndex, bonus, type, theme) {
    let cellTheme = "Cell__" + theme;
    switch (type) {
        case "board":
            return (<div className={styles[cellTheme]} style={{ backgroundColor: bonus.color, backgroundImage: bonus.image}}>{bonus.value}</div>);
        case "pool":
            return (<div className={styles.cellPool}>{bonus.value}</div>);
        case "rack":
            return bonus.value;
        default:
            return bonus.value;
    }
}