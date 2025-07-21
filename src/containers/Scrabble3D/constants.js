// Scrabble3D Constants
// This file centralizes all hardcoded numbers and configuration values

// Camera and Rendering
export const CAMERA = {
  FOV: 75,
  NEAR: 0.1,
  FAR: 1000,
  INITIAL_POSITION: { x: 0, y: 25, z: 0 },
  TARGET: { x: 0, y: 0, z: 0 }
};

export const RENDERER = {
  PIXEL_RATIO_MAX: 2.0,
  SHADOW_MAP_SIZE: 2048,
  TARGET_FPS: 60
};

// Scene and Environment
export const SCENE = {
  BACKGROUND_COLOR: 0x000033,
  FOG_COLOR: 0x000033,
  FOG_NEAR: 20,
  FOG_FAR: 100
};

// Lighting
export const LIGHTS = {
  AMBIENT: {
    COLOR: 0xffffff,
    INTENSITY: 0.8
  },
  DIRECTIONAL: {
    COLOR: 0xffffff,
    INTENSITY: 1.0,
    POSITION: { x: 15, y: 15, z: 10 },
    SHADOW_CAMERA: {
      NEAR: 0.5,
      FAR: 50,
      LEFT: -20,
      RIGHT: 20,
      TOP: 20,
      BOTTOM: -20
    }
  },
  POINT_LIGHTS: [
    {
      COLOR: 0xffffff,
      INTENSITY: 0.8,
      DISTANCE: 50,
      POSITION: { x: -20, y: 15, z: -20 }
    },
    {
      COLOR: 0xffffff,
      INTENSITY: 0.8,
      DISTANCE: 50,
      POSITION: { x: 20, y: 15, z: 20 }
    }
  ],
  LAMP: {
    COLOR: 0xFFFFE0,
    INTENSITY: 3.0,
    DISTANCE: 40,
    BASE_RADIUS: 0.3,
    BASE_HEIGHT: 0.2,
    POLE_RADIUS: 0.05,
    POLE_HEIGHT: 2.5,
    SHADE_RADIUS_TOP: 0.8,
    SHADE_RADIUS_BOTTOM: 0.6,
    SHADE_HEIGHT: 0.4,
    BULB_RADIUS: 0.2,
    ANIMATION: {
      BASE_INTENSITY: 0.4,
      FLICKER_AMPLITUDE: 0.05,
      FLICKER_SPEED: 2
    }
  }
};

// Environment Materials
export const MATERIALS = {
  FLOOR: {
    COLOR: 0x696969,
    OPACITY: 0.9,
    SHININESS: 10
  },
  WALL: {
    COLOR: 0x8B7355,
    OPACITY: 0.9,
    SHININESS: 5
  },
  CEILING: {
    COLOR: 0xF5DEB3,
    OPACITY: 1.0,
    SHININESS: 5
  },
  PILLAR: {
    COLOR: 0x696969,
    OPACITY: 0.9,
    SHININESS: 15
  },
  LAMP_BASE: {
    COLOR: 0x654321,
    OPACITY: 0.9,
    SHININESS: 20
  },
  LAMP_POLE: {
    COLOR: 0x8B4513,
    OPACITY: 0.9,
    SHININESS: 30
  },
  LAMP_SHADE: {
    COLOR: 0xF5DEB3,
    OPACITY: 0.7,
    SHININESS: 10
  },
  LAMP_BULB: {
    COLOR: 0xFFFFE0,
    EMISSIVE: 0xFFFFE0,
    EMISSIVE_INTENSITY: 0.4,
    OPACITY: 0.9
  }
};

// Environment Dimensions
export const ENVIRONMENT = {
  FLOOR: {
    WIDTH: 80,
    HEIGHT: 80,
    Y_POSITION: -1.5
  },
  WALL: {
    WIDTH: 80,
    HEIGHT: 32,
    DEPTH: 1,
    Y_POSITION: 14,
    Z_POSITION: -40
  },
  CEILING: {
    WIDTH: 80,
    HEIGHT: 0.5,
    DEPTH: 80,
    Y_POSITION: 30
  },
  PILLAR: {
    RADIUS: 0.8,
    HEIGHT: 8,
    SEGMENTS: 8,
    POSITIONS: [
      [-30, 4, -30],
      [30, 4, -30],
      [-30, 4, 30],
      [30, 4, 30]
    ]
  },
  LAMP_POSITIONS: [
    [-25, 0, -25],
    [25, 0, -25],
    [-25, 0, 25],
    [25, 0, 25]
  ]
};

// Table and Furniture
export const TABLE = {
  WIDTH: 50,
  HEIGHT: 0.3,
  DEPTH: 25,
  Y_POSITION: -0.5,
  MATERIAL: {
    COLOR: 0xFFFFFF,
    OPACITY: 0.9,
    SHININESS: 20
  },
  LEG: {
    WIDTH: 0.4,
    HEIGHT: 1.2,
    DEPTH: 0.4,
    MATERIAL: {
      COLOR: 0x654321,
      OPACITY: 0.9,
      SHININESS: 15
    },
    POSITIONS: [
      [-9.5, -1.1, -9.5],
      [9.5, -1.1, -9.5],
      [-9.5, -1.1, 9.5],
      [9.5, -1.1, 9.5]
    ]
  },
  SCORESHEET: {
    WIDTH: 10,
    HEIGHT: 11.5,
    Y_POSITION: -0.2, // Slightly above table surface
    POSITION: { x: -18, z: 0 }, // Position on table - centered and on the table
    MATERIAL: {
      COLOR: 0xF5F5DC, // Beige paper color
      OPACITY: 0.95,
      SHININESS: 5
    }
  }
};

// Futon Configuration
export const FUTON = {
  POSITIONS: [
    { x: 0, z: -16, rotation: 0 },
    { x: 0, z: 16, rotation: Math.PI }
  ],
  CUSHION: {
    WIDTH: 5.0,
    HEIGHT: 1.0,
    DEPTH: 5.0,
    Y_POSITION: -0.6,
    MATERIAL: {
      COLOR: 0x4682B4,
      OPACITY: 0.9,
      SHININESS: 10
    }
  },
  BACK_CUSHION: {
    WIDTH: 5.0,
    HEIGHT: 4.5,
    DEPTH: 1.0,
    Y_POSITION: 0.65,
    Z_OFFSET: 3.0,
    MATERIAL: {
      COLOR: 0x4682B4,
      OPACITY: 0.9,
      SHININESS: 10
    }
  },
  FRAME: {
    WIDTH: 5.3,
    HEIGHT: 0.4,
    DEPTH: 5.3,
    Y_POSITION: -1.2,
    MATERIAL: {
      COLOR: 0x191970,
      OPACITY: 0.9,
      SHININESS: 20
    }
  },
  PILLOW: {
    WIDTH: 1.2,
    HEIGHT: 0.4,
    DEPTH: 1.2,
    Y_POSITION: 0.1,
    MATERIAL: {
      COLOR: 0xFF69B4,
      OPACITY: 0.9,
      SHININESS: 5
    },
    POSITIONS: [
      { x: -1.5, z: 0.8 },
      { x: 1.5, z: 0.8 }
    ]
  }
};

// Board Configuration
export const BOARD = {
  RADIUS: 10.8,
  HEIGHT: 0.3,
  SEGMENTS: 64,
  Y_POSITION: -0.1,
  MATERIAL: {
    COLOR: 0xC0C0C0,
    OPACITY: 0.8,
    SHININESS: 100,
    REFLECTIVITY: 0.8
  },
  GRID: {
    SIZE: 15,
    SQUARE_SIZE: 1,
    SQUARE_HEIGHT: 0.1,
    SQUARE_SCALE: 0.9,
    Y_POSITION: 0.025,
    GRID_LINE: {
      WIDTH: 0.05,
      HEIGHT: 0.15,
      Y_POSITION: 0.075,
      MATERIAL: {
        COLOR: 0x8B4513,
        OPACITY: 0.8,
        SHININESS: 30
      }
    }
  },
  SQUARE_COLORS: {
    TRIPLE_WORD: 0xCE2222,
    DOUBLE_WORD: 0xF49FD4,
    TRIPLE_LETTER: 0x7269D6,
    DOUBLE_LETTER: 0x7ED6DD,
    EMPTY: 0xFFFFFF
  }
};

// Rack Configuration
export const RACK = {
  MATERIAL: {
    COLOR: 0x8B4513,
    OPACITY: 0.9,
    SHININESS: 15
  },
  BASE: {
    WIDTH: 8,
    HEIGHT: 0.1,
    DEPTH: 0.8
  },
  BACK: {
    WIDTH: 8,
    HEIGHT: 0.6,
    DEPTH: 0.1
  },
  SLANT_ANGLE: Math.PI / 12, // 15 degrees
  POSITIONS: {
    PLAYER1: { x: 0, y: -0.2, z: -12, backY: 0.07, backZ: -11.65 },
    PLAYER2: { x: 0, y: -0.2, z: 12, backY: 0.07, backZ: 11.65 }
  }
};

// Tile Configuration
export const TILE = {
  BOARD: {
    WIDTH: 0.9,
    HEIGHT: 0.15,
    DEPTH: 0.9,
    Y_POSITION: 0.15,
    MATERIAL: {
      COLOR: 0xE8D5B5,
      OPACITY: 0.95,
      SHININESS: 50
    }
  },
  RACK: {
    WIDTH: 0.7,
    HEIGHT: 0.12,
    DEPTH: 0.7,
    Y_POSITION: 0.2,
    SPACING: 0.8,
    OFFSET: 2.8,
    MATERIAL: {
      COLOR: 0xE8D5B5,
      OPACITY: 0.95,
      SHININESS: 50
    }
  },
  LETTER: {
    CANVAS_SIZE: 128,
    BOARD_SIZE: 0.8,
    RACK_SIZE: 0.6,
    Y_OFFSET: 0.11,
    ROTATION: -Math.PI / 2,
    FONT: {
      BOARD: 'bold 100px Arial',
      RACK: 'bold 80px Arial',
      POINTS: 'bold 45px Arial',
      RACK_POINTS: 'bold 35px Arial'
    },
    COLORS: {
      LETTER: '#FFFFFF',
      POINTS: '#FFFFFF'
    }
  }
};

// Point Values for Letters
export const POINT_VALUES = {
  'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1, 'J': 8,
  'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3, 'Q': 10, 'R': 1, 'S': 1, 'T': 1,
  'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10, '_': 0
};

// Game Configuration
export const GAME = {
  DEFAULT_GAME_ID: 37033,
  PLAYBACK_SPEEDS: {
    FAST: 500,
    NORMAL: 1000,
    SLOW: 2000
  },
  BOARD_VALUES: {
    EMPTY: 0,
    DOUBLE_LETTER: 1,
    TRIPLE_LETTER: 2,
    DOUBLE_WORD: 3,
    TRIPLE_WORD: 4
  }
};

// Controls Configuration
export const CONTROLS = {
  DAMPING_FACTOR: 0.05
};

// Animation Configuration
export const ANIMATION = {
  FRAME_INTERVAL: 1000 / 60 // 60 FPS
};

// Preloading Configuration
export const PRELOAD = {
  LETTERS: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'],
  CHECK_INTERVAL: 100
}; 