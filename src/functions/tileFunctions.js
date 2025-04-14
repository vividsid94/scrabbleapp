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

// Cache for modified image URLs
const imageUrlCache = new Map();

// Cache for canvas and context
let canvas = null;
let ctx = null;

export const modifyImageColor = (image, color) => {
    // Create cache key combining image and color
    const cacheKey = `${image.src}-${color}`;
    
    // Return cached result if available
    if (imageUrlCache.has(cacheKey)) {
        return imageUrlCache.get(cacheKey);
    }

    // Initialize canvas and context if not already done
    if (!canvas) {
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d', { willReadFrequently: true });
    }

    // Check if image is loaded
    if (!image.complete || image.naturalWidth === 0) {
        // If image isn't loaded, return a placeholder
        return '';
    }

    const isDark = isColorDark(color);
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = new Uint32Array(imageData.data.buffer);
    const len = data.length;

    // Pre-calculate the color value
    const r = isDark ? 255 : 0;
    const g = isDark ? 255 : 0;
    const b = isDark ? 255 : 0;
    const colorValue = (255 << 24) | (b << 16) | (g << 8) | r;

    // Process pixels in chunks for better performance
    const CHUNK_SIZE = 10000;
    for (let i = 0; i < len; i += CHUNK_SIZE) {
        const end = Math.min(i + CHUNK_SIZE, len);
        for (let j = i; j < end; j++) {
            if (data[j] & 0xff000000) { // Check alpha channel
                data[j] = colorValue;
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const modifiedUrl = canvas.toDataURL();
    
    // Cache the result
    imageUrlCache.set(cacheKey, modifiedUrl);
    
    return modifiedUrl;
}

export const getComplementaryColor = (hexColor) => {
    // Remove '#' if present
    hexColor = hexColor.replace('#', '');

    // Convert hex to RGB
    var r = parseInt(hexColor.substring(0,2), 16);
    var g = parseInt(hexColor.substring(2,4), 16);
    var b = parseInt(hexColor.substring(4,6), 16);

    // Get the inverted color
    var complementaryR = (255 - r).toString(16);
    var complementaryG = (255 - g).toString(16);
    var complementaryB = (255 - b).toString(16);

    // Ensure that the hexadecimal values have two digits
    complementaryR = ('0' + complementaryR).slice(-2);
    complementaryG = ('0' + complementaryG).slice(-2);
    complementaryB = ('0' + complementaryB).slice(-2);

    // Compose the complementary color
    var complementaryHexColor = '#' + complementaryR + complementaryG + complementaryB;

    return complementaryHexColor;
}


