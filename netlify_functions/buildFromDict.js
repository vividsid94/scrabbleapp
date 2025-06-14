const fs = require('fs');
const path = require('path');
const { buildGaddag } = require('./buildGaddag');

// Build GADDAG from dictionary.json
function buildFromDict() {
  console.log('Reading dictionary.json...');
  const dictPath = path.join(__dirname, 'dictionary.json');
  const gaddagPath = path.join(__dirname, 'gaddag.json');
  
  // Build GADDAG
  buildGaddag(dictPath, gaddagPath);
  
  console.log('Done! The GADDAG is ready to use.');
}

buildFromDict(); 