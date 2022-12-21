export default function cellBonusMap(type){
    let result;
    switch (type) {
        case 0:
            result = {
                "value": "",
                "color": "#FDF5D8",
                "image": "url('https://www.transparenttextures.com/patterns/bright-squares.png')"
            };
            break;
        case 1:
            result = {
                "value": "",
                "color": "#B4D6F8"
            };
            break;
        case 2:
            result = {
                "value": "",
                "color": "#4C3DE0"
            };
            break;
        case 3:
            result = {
                "value": "",
                "color": "#F8B4F1"
            };
            break;
        case 4:
            result = {
                "value": "",
                "color": "#BE3939"
            };
            break;
        default:
            result = {
                "value": type,
                "color": "#306B73"
            };
    }
    return result;
}