const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Electron for Scrabble Widget...\n');

try {
  // Install Electron dependencies
  console.log('📦 Installing Electron dependencies...');
  execSync('npm install electron electron-builder concurrently wait-on cross-env electron-is-dev --save-dev', { stdio: 'inherit' });
  
  console.log('\n✅ Electron setup complete!');
  console.log('\n📋 To run the widget:');
  console.log('   npm run electron-dev    # Development mode');
  console.log('   npm run electron-pack   # Build for distribution');
  console.log('\n🎯 The widget will appear as a small window that stays on top of other applications.');
  
} catch (error) {
  console.error('❌ Error setting up Electron:', error.message);
  process.exit(1);
} 