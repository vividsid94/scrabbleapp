const colorCache = {};
export const isColorDark = (hexColor) => {
    if (colorCache.hasOwnProperty(hexColor)) {
        return colorCache[hexColor];
    }

    hexColor = hexColor.replace('#', '');
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const isDark = luminance <= 0.7;
    
    colorCache[hexColor] = isDark;
    return isDark;
}

export const modifyImageColor = (image, color) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const isDark = isColorDark(color);
    
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = new Uint32Array(imageData.data.buffer);
    const len = data.length;

    const r = isDark ? 255 : 0;
    const g = isDark ? 255 : 0;
    const b = isDark ? 255 : 0;

    const colorValue = (255 << 24) | (b << 16) | (g << 8) | r; // Packed color value

    for (let i = 0; i < len; i++) {
        if (data[i] & 0xff000000) { // Check if alpha value is non-zero
            data[i] = colorValue; // Set pixel color
        }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
}

