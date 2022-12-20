export default function cellBonusMap(type){
    let result;
    switch (type) {
        case 0:
            result = {
                "value": "",
                "color": "white"
            };
            break;
        case 1:
            result = {
                "value": "",
                "color": "lightblue"
            };
            break;
        case 2:
            result = {
                "value": "",
                "color": "purple"
            };
            break;
        case 3:
            result = {
                "value": "",
                "color": "pink"
            };
            break;
        case 4:
            result = {
                "value": "",
                "color": "red"
            };
            break;
        default:
            result = {
                "value": type,
                "color": "#FF013C"
            };
    }
    return result;
}