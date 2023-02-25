export default function CellType(type, flag, border, tiles){
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
        boxShadow = 'inset 2.0px 2.0px ' + highlightColor;
    } else if (left) {
        boxShadow = 'inset 2.0px 0px ' + highlightColor;
    } else if (top) {
        boxShadow = 'inset 0px 2.0px ' + highlightColor;
    }
    
    if (right && bottom) {
        boxShadow += ', inset -2.0px -2.0px ' + highlightColor;
    } else if (right) {
        boxShadow += ', inset -2.0px 0px ' + highlightColor;
    } else if (bottom) {
        boxShadow += ', inset 0px -2.0px ' + highlightColor;
    }

    switch (type) {
        case 0:
            result = {
                "value": "",
                "color": "linear-gradient(to right bottom, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.9))",
                "boxShadow": regBoxShadow
            };
            break;
        case 1:
            result = {
                "value": "",
                "color": "linear-gradient(to right bottom, rgba(126, 214, 221, 0.3), rgba(126, 214, 221, 0.95))",
                "boxShadow": regBoxShadow
            };
            break;
        case 2:
            result = {
                "value": "",
                "color": "linear-gradient(to right bottom, rgba(114, 105, 214, 0.6), rgba(114, 105, 214, 0.95))",
                "boxShadow": regBoxShadow
            };
            break;
        case 3:
            result = {
                "value": "",
                "color": "linear-gradient(to right bottom, rgba(244, 159, 212, 0.5), rgba(244, 159, 212, 0.9))",
                "boxShadow": regBoxShadow
            };
            break;
        case 4:
            result = {
                "value": "",
                "color": "linear-gradient(to right bottom, rgba(206, 34, 34, 0.5), rgba(206, 34, 34, 0.9))",
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
                    "color": flag === "lightColor" ? "#306B73" : "#41bf9e"
                };
            }
    }
    return result;
}