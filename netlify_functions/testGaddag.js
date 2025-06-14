const fs = require('fs');
const path = require('path');

class GADDAGNode {
  constructor(obj) {
    this.isTerminal = !!obj.t;
    this.children = {};
    for (const c in obj.c) {
      this.children[c] = new GADDAGNode(obj.c[c]);
    }
  }

  // Check if a GADDAG path exists (for a given split)
  containsPath(path) {
    let node = this;
    for (const c of path) {
      if (!node.children[c]) return false;
      node = node.children[c];
    }
    return node.isTerminal;
  }
}

// GADDAG word check for a given word
function gaddagContains(root, word) {
  word = word.toUpperCase();
  // Try all splits
  for (let i = 1; i < word.length; i++) {
    const prefix = word.substring(0, i).split('').reverse().join('');
    const suffix = word.substring(i);
    if (root.containsPath(prefix + '+' + suffix)) return true;
  }
  // Try full reversed word
  if (root.containsPath(word.split('').reverse().join('') + '+')) return true;
  return false;
}

// Load the compact GADDAG
const gaddagPath = path.join(__dirname, 'dictionary.gaddag.json');
console.log('Loading compact GADDAG from', gaddagPath);
const gaddagJson = JSON.parse(fs.readFileSync(gaddagPath, 'utf8'));
const gaddag = new GADDAGNode(gaddagJson);

// Words to test
const testWords = ['HELLO', 'WORLD', 'SCRABBLE', 'ZZZZZZZ', 'QWERTY', 'AI', 'PYTHON', 'DOG', 'CAT', 'UNLIKELYWORD'];

for (const word of testWords) {
  const result = gaddagContains(gaddag, word);
  console.log(`${word}: ${result ? 'VALID' : 'INVALID'}`);
} 