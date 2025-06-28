# Scrabble Desktop Widget

Transform your Scrabble app into a Windows desktop widget that stays on top of other applications!

## Features

- 🖥️ **Desktop Widget**: Small, always-on-top window
- 🎯 **Frameless Design**: Clean, modern widget appearance
- 🔄 **Real-time Updates**: Live clock and game stats
- 🎮 **Quick Actions**: Easy access to new games and study mode
- 📍 **Draggable**: Move the widget anywhere on your screen
- 🎨 **Transparent Background**: Blends with your desktop

## Installation

### Option 1: Quick Setup
```bash
# Install Electron dependencies
node scripts/install-electron.js

# Or manually install
npm install electron electron-builder concurrently wait-on cross-env electron-is-dev --save-dev
```

### Option 2: Manual Installation
```bash
npm install --save-dev electron electron-builder concurrently wait-on cross-env electron-is-dev
```

## Usage

### Development Mode
```bash
npm run electron-dev
```
This will:
1. Start your React development server
2. Launch the Electron widget window
3. Enable hot reloading for development

### Production Build
```bash
npm run electron-pack
```
This will:
1. Build your React app
2. Package it as a Windows executable
3. Create an installer in the `dist` folder

## Widget Features

### Current Widget Display
- **Real-time Clock**: Shows current time and date
- **Game Stats**: Displays tiles left and current score
- **Quick Actions**: Buttons for new game and study mode
- **Window Controls**: Minimize, refresh, and close buttons

### Customization
You can easily customize the widget by editing:
- `src/containers/Widget/Widget.js` - Main widget content
- `src/containers/Widget/Widget.module.css` - Widget styling
- `public/electron.js` - Window properties and behavior

## Alternative Approaches

### Option 2: Progressive Web App (PWA)
If you prefer a web-based approach, you can make your app installable as a PWA:

1. Add a web app manifest
2. Register a service worker
3. Users can "install" it from their browser

### Option 3: Windows Gadgets (Legacy)
For older Windows versions, you could create a Windows Gadget, but this is deprecated.

### Option 4: Rainmeter Skins
Create a Rainmeter skin that displays your app data, but this requires Rainmeter installation.

## Troubleshooting

### Common Issues

1. **Widget doesn't appear**
   - Check if port 3000 is available
   - Ensure all dependencies are installed

2. **Widget is too large/small**
   - Modify the `width` and `height` in `public/electron.js`

3. **Widget position**
   - Change the `x` and `y` coordinates in `public/electron.js`

4. **Build errors**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Development Tips

- Use `Ctrl+Shift+I` to open DevTools in the widget
- The widget window is draggable by its header
- Close button minimizes to system tray instead of quitting
- Widget stays on top of other applications

## Advanced Configuration

### Window Properties
In `public/electron.js`, you can customize:
- Window size and position
- Transparency level
- Always-on-top behavior
- Taskbar visibility

### Widget Content
The widget can display:
- Current game state
- Recent moves
- Word suggestions
- Study progress
- Tournament standings

## Security Notes

- The widget runs with limited permissions
- No access to file system outside the app
- Secure communication between main and renderer processes
- Context isolation enabled

## Future Enhancements

- System tray integration
- Keyboard shortcuts
- Multiple widget themes
- Widget size presets
- Auto-hide functionality
- Integration with game state

---

**Note**: This widget feature requires Electron, which adds about 100MB to your app size. For a lighter alternative, consider the PWA approach. 