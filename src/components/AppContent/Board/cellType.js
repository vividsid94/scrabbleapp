export default function cellType(type, flag, border, tiles){
    let result;
    let bottom = border ? border.bottom : false;
    let top = border ? border.top : false;
    let left = border ? border.left : false;
    let right = border ? border.right : false;
    let regBoxShadow = 'inset 0.75px 0.75px lightgrey, inset -0.75px -0.75px lightgrey';

    let boxShadow = 'inset 0.75px 0.75px lightgrey, inset -0.75px -0.75px lightgrey';

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
                "color": "#FDF5D8",
                "image": "url('https://www.transparenttextures.com/patterns/white-carbon.png')",
                "boxShadow": regBoxShadow
            };
            break;
        case 1:
            result = {
                "value": "",
                "color": "#B4D6F8",
                "boxShadow": regBoxShadow
            };
            break;
        case 2:
            result = {
                "value": "",
                "color": "#4C3DE0",
                "boxShadow": regBoxShadow
            };
            break;
        case 3:
            result = {
                "value": "",
                "color": "#F8B4F1",
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
                    "borderRadius": "4px",
                    "color": "white"
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