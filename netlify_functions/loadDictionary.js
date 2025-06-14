const fs = require('fs');
const path = require('path');

// DAWGNode and DAWG classes (should match your build script)
class DAWGNode {
  constructor() {
    this.children = new Map();
    this.isTerminal = false;
  }
  static fromJSON(obj) {
    const node = new DAWGNode();
    node.isTerminal = obj.isTerminal;
    for (const [ch, childObj] of Object.entries(obj.children)) {
      node.children.set(ch, DAWGNode.fromJSON(childObj));
    }
    return node;
  }
}

class DAWG {
  constructor() {
    this.root = new DAWGNode();
  }
  static fromJSON(obj) {
    const dawg = new DAWG();
    dawg.root = DAWGNode.fromJSON(obj.root);
    return dawg;
  }
  contains(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) return false;
      node = node.children.get(char);
    }
    return node.isTerminal;
  }
}

let cachedDAWG = null;

/**
 * Load the pre-built DAWG
 * @returns {Promise<DAWG>} The DAWG containing all valid words
 */
async function loadDictionary() {
  if (cachedDAWG) return cachedDAWG;
  const dawgPath = path.join(__dirname, 'dictionary.dawg.json');
  const dawgData = JSON.parse(fs.readFileSync(dawgPath, 'utf8'));
  cachedDAWG = DAWG.fromJSON(dawgData);
  return cachedDAWG;
}

module.exports = { loadDictionary };
