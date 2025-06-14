const fs = require('fs');
const path = require('path');

// ========== DAWGNode ==========
class DAWGNode {
  constructor() {
    this.children = new Map();
    this.isTerminal = false;
  }
}

// ========== DAWG ==========
class DAWG {
  constructor() {
    this.root = new DAWGNode();
  }

  insert(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new DAWGNode());
      }
      node = node.children.get(char);
    }
    node.isTerminal = true;
  }

  toJSON() {
    const serializeNode = (node) => ({
      isTerminal: node.isTerminal,
      children: Object.fromEntries(
        [...node.children.entries()].map(([ch, child]) => [ch, serializeNode(child)])
      )
    });

    return {
      root: serializeNode(this.root)
    };
  }
}

// ========== Main Build Script ==========
const wordsPath = path.join(__dirname, 'dictionary.json');
const outPath = path.join(__dirname, 'dictionary.dawg.json');

const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8')).map(w => w.toUpperCase().trim());

const dawg = new DAWG();
for (const word of words) {
  dawg.insert(word);
}

fs.writeFileSync(outPath, JSON.stringify(dawg.toJSON(), null, 0));
console.log(`✅ DAWG built and saved to ${outPath}`);
