export default function cellType(type, flag, border, tiles){
    let result;
    let bottom = border ? border.bottom : false;
    let top = border ? border.top : false;
    let left = border ? border.left : false;
    let right = border ? border.right : false;
    let boxShadowColor = 'rgb(185, 174, 166)';
    let highlightColor = '#6A2B79';
    let regBoxShadow = 'inset 0.15px 0.15px ' + boxShadowColor + ', inset -0.15px -0.15px ' + boxShadowColor;
    let boxShadow = 'inset 0.25px 0.25px ' + boxShadowColor + ', inset -0.25px -0.25px ' + boxShadowColor;
    if (left && top) {
        boxShadow = 'inset 1.5px 1.5px ' + highlightColor;
    } else if (left) {
        boxShadow = 'inset 1.5px 0px ' + highlightColor;
    } else if (top) {
        boxShadow = 'inset 0px 1.5px ' + highlightColor;
    }
    
    if (right && bottom) {
        boxShadow += ', inset -1.5px -1.5px ' + highlightColor;
    } else if (right) {
        boxShadow += ', inset -1.5px 0px ' + highlightColor;
    } else if (bottom) {
        boxShadow += ', inset 0px -1.5px ' + highlightColor;
    }

    switch (type) {
        case 0:
            result = {
                "value": "",
                "color": "papayawhip",
                "boxShadow": regBoxShadow
            };
            break;
        case 1:
            result = {
                "value": "",
                "color": "powderblue",
                "boxShadow": regBoxShadow
            };
            break;
        case 2:
            result = {
                "value": "",
                "color": "mediumslateblue",
                "boxShadow": regBoxShadow
            };
            break;
        case 3:
            result = {
                "value": "",
                "color": "lightpink",
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
                    "radius": '5px'
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