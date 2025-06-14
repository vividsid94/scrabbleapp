const fs = require('fs');
const path = require('path');

class GADDAGNode {
  constructor() {
    this.children = {};
  }

  insert(path) {
    let node = this;
    for (let c of path) {
      if (!node.children[c]) node.children[c] = new GADDAGNode();
      node = node.children[c];
    }
    node.children['$'] = true;
  }

  toJSON() {
    const result = {};
    for (const c in this.children) {
      if (c === '$') {
        result[c] = true;
      } else {
        result[c] = this.children[c].toJSON();
      }
    }
    return result;
  }
}

class GADDAGBuilder {
  constructor() {
    this.root = new GADDAGNode();
  }

  insert(word) {
    const upper = word.toUpperCase().trim();
    for (let i = 1; i < upper.length; i++) {
      const prefix = upper.substring(0, i).split('').reverse().join('');
      const suffix = upper.substring(i);
      this.root.insert(prefix + '^' + suffix);
    }
    // include full reversed word with no suffix
    this.root.insert(upper.split('').reverse().join('') + '^');
  }

  toJSON() {
    return this.root.toJSON();
  }
}

// Main script
const dictionaryPath = path.join(__dirname, 'dictionary.json');
const outPath = path.join(__dirname, 'dictionary.gaddag.json');

console.log('Loading dictionary...');
const words = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
console.log(`Loaded ${words.length} words`);

console.log('Building GADDAG...');
const builder = new GADDAGBuilder();
let count = 0;
for (const word of words) {
  builder.insert(word);
  count++;
  if (count % 1000 === 0) {
    console.log(`Processed ${count} words...`);
  }
}

console.log('Saving GADDAG...');
fs.writeFileSync(outPath, JSON.stringify(builder.toJSON()));
console.log(`✅ GADDAG built and saved to ${outPath}`); 