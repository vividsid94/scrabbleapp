import {useState, useEffect} from 'react';
export default function Cell(rowIndex, colIndex, bonus, type) {
    function displayTiles(word, place){
        for (var i = 0; i < String(word).length; i++) {
            var r = document.getElementsByClassName(place);
            var source = "./images/white-pro/";
            source += word[i];
            source += ".png"
            r[i].src = source;
            if (word.length == 7){
                r[7].src = "";
                r[i].style.width = "10%";
            }
            if (word.length == 8){
                r[i].style.width = "8%";
            }
        }
    }




    if (type === "board"){
        //return (<img style={{ width: '20px', height: '20px'}} src="images/white-pro/A.png"></img>);
        return (<div style={{ backgroundColor: bonus.color, backgroundImage: bonus.image, display: 'flex', width: '30px', height: '30px', textAlign: 'center', justifyContent: 'center', alignItems: 'flex-end', fontSize: '25px' }}>{bonus.value}</div>);
    }
    else if (type === "pool"){
        return (<div style={{ backgroundColor: "lightgrey", display: 'flex', width: '15px', height: '15px', textAlign: 'center', justifyContent: 'center', alignItems: 'center', border: "2px solid black", color: "black", fontSize: '12px' }}>{bonus.value}</div>);
    }
    else if (type === "rack"){
        return bonus.value;
    }
    else{
        return (<div style={{ backgroundColor: bonus.color, display: 'flex', width: '40px', height: '40px', textAlign: 'center', justifyContent: 'center', alignItems: 'flex-end' }}>{bonus.value}</div>);
    }
}