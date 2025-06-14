const fs = require('fs');
const path = require('path');

// Simple GADDAG implementation
class GADDAG {
  constructor() {
    this.root = {};
  }

  static fromJSON(json) {
    const gaddag = new GADDAG();
    gaddag.root = json;
    return gaddag;
  }

  contains(word) {
    word = word.toUpperCase();
    // Try all GADDAG traversals for the word
    for (let i = 1; i < word.length; i++) {
      const prefix = word.substring(0, i).split('').reverse().join('');
      const suffix = word.substring(i);
      const gaddagPath = prefix + '^' + suffix;
      let node = this.root;
      let found = true;
      for (const letter of gaddagPath) {
        if (!node[letter]) {
          found = false;
          break;
        }
        node = node[letter];
      }
      if (found && node['$'] === true) {
        return true;
      }
    }
    // Also check the full reversed word with no suffix
    const rev = word.split('').reverse().join('') + '^';
    let node = this.root;
    let found = true;
    for (const letter of rev) {
      if (!node[letter]) {
        found = false;
        break;
      }
      node = node[letter];
    }
    if (found && node['$'] === true) {
      return true;
    }
    return false;
  }
}

// Cache the loaded GADDAG
let cachedGaddag = null;

function loadDictionary() {
  try {
    if (cachedGaddag) {
      console.log('Using cached GADDAG');
      return cachedGaddag;
    }

    // Load the pre-built GADDAG using fs.readFileSync
    const gaddagPath = path.join(__dirname, 'dictionary.gaddag.json');
    console.log('Loading GADDAG from:', gaddagPath);
    const jsonData = fs.readFileSync(gaddagPath, 'utf8');
    console.log('GADDAG JSON file size:', jsonData.length);
    const gaddagJson = JSON.parse(jsonData);
    console.log('GADDAG JSON parsed successfully');
    
    cachedGaddag = GADDAG.fromJSON(gaddagJson);
    
    // Test a few common words to verify the GADDAG is working
    const testWords = ['HELLO', 'WORLD', 'SCRABBLE'];
    console.log('Testing GADDAG with sample words:');
    for (const word of testWords) {
      console.log(`${word}: ${cachedGaddag.contains(word)}`);
    }

    return cachedGaddag;
  } catch (error) {
    console.error('Error loading GADDAG:', error);
    throw new Error('Failed to load GADDAG dictionary');
  }
}

module.exports = loadDictionary;
module.exports.GADDAG = GADDAG;
