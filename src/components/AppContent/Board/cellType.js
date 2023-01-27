export default function cellType(type, flag, border, tiles){
    let result;
    let bottom = border ? border.bottom : false;
    let top = border ? border.top : false;
    let left = border ? border.left : false;
    let right = border ? border.right : false;
    let boxShadowColor = 'grey';
    let regBoxShadow = 'inset 0.75px 0.75px ' + boxShadowColor + ', inset -0.75px -0.75px grey';

    let boxShadow = 'inset 0.75px 0.75px ' + boxShadowColor + ', inset -0.75px -0.75px grey';

    if (left && top) {
        boxShadow = 'inset 1.5px 1.5px black';
    } else if (left) {
        boxShadow = 'inset 1.5px 0px black';
    } else if (top) {
        boxShadow = 'inset 0px 1.5px black';
    }
    
    if (right && bottom) {
        boxShadow += ', inset -1.5px -1.5px black';
    } else if (right) {
        boxShadow += ', inset -1.5px 0px black';
    } else if (bottom) {
        boxShadow += ', inset 0px -1.5px black';
    }

    switch (type) {
        case 0:
            result = {
                "value": "",
                "color": "#90A793",
                "image" : "url('http://www.transparenttextures.com/patterns/brushed-alum.png')",
                "boxShadow": regBoxShadow
            };
            break;
        case 1:
            result = {
                "value": "",
                "color": "#DCD2C9",
                "boxShadow": regBoxShadow
            };
            break;
        case 2:
            result = {
                "value": "",
                "color": "#A6C4CD",
                "boxShadow": regBoxShadow
            };
            break;
        case 3:
            result = {
                "value": "",
                "color": "#FFA0AA",
                "boxShadow": regBoxShadow
            };
            break;
        case 4:
            result = {
                "value": "",
                "color": "#BE3939",
                "boxShadow": regBoxShadow
            };
            break;
        default:
            if (tiles === "PROTILES"){
                result = {
                    "value": type,
                    "boxShadow": boxShadow,
                };
            }
            else{
                result = {
                    "value": (type.toLowerCase() === type) ? "" : type,
                    "boxShadow": 'inset 0.75px 0.75px lightgrey, inset -0.75px -0.75px lightgrey',
                    "color": flag === "apple" ? "#306B73" : "#41bf9e"
                };
            }
    }
    return result;
}