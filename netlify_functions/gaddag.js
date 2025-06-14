class GADDAGNode {
  constructor() {
    this.children = new Map();
    this.isTerminal = false;
    this.id = null; // For node sharing
  }

  toJSON() {
    // Even more compact representation: [id, isTerminal, {letter: childId, ...}]
    const childrenObj = {};
    for (const [letter, child] of this.children) {
      childrenObj[letter] = child.id;
    }
    return [this.id, this.isTerminal, childrenObj];
  }

  static fromJSON(json, nodeMap) {
    const node = new GADDAGNode();
    node.id = json[0];
    node.isTerminal = json[1];
    for (const [letter, childId] of Object.entries(json[2])) {
      node.children.set(letter, nodeMap.get(childId));
    }
    return node;
  }
}

class GADDAG {
  constructor() {
    this.root = new GADDAGNode();
    this.nextId = 0;
    this.nodeMap = new Map(); // For node sharing
  }

  add(word) {
    // Add the word in all possible positions
    for (let i = 0; i <= word.length; i++) {
      const prefix = word.slice(0, i);
      const suffix = word.slice(i);
      const reversedPrefix = prefix.split('').reverse().join('');
      const gaddagWord = reversedPrefix + '^' + suffix;
      
      // Add the word in both directions
      this._addWord(gaddagWord);
      
      // Also add the reversed word for prefix search
      if (i > 0) {
        const reversedWord = word.split('').reverse().join('');
        const reversedGaddagWord = reversedWord.slice(0, i) + '^' + reversedWord.slice(i);
        this._addWord(reversedGaddagWord);
      }
    }
  }

  _addWord(word) {
    let node = this.root;
    for (const letter of word) {
      if (!node.children.has(letter)) {
        const newNode = new GADDAGNode();
        newNode.id = this.nextId++;
        this.nodeMap.set(newNode.id, newNode);
        node.children.set(letter, newNode);
      }
      node = node.children.get(letter);
    }
    node.isTerminal = true;
  }

  contains(word) {
    // Try all possible splits of the word
    for (let i = 0; i <= word.length; i++) {
      const prefix = word.slice(0, i);
      const suffix = word.slice(i);
      const reversedPrefix = prefix.split('').reverse().join('');
      const gaddagWord = reversedPrefix + '^' + suffix;
      
      let node = this.root;
      let valid = true;
      
      // Traverse the GADDAG
      for (const letter of gaddagWord) {
        if (!node.children.has(letter)) {
          valid = false;
          break;
        }
        node = node.children.get(letter);
      }
      
      if (valid && node.isTerminal) {
        return true;
      }
      
      // Try the reversed word if this split failed
      if (i > 0) {
        const reversedWord = word.split('').reverse().join('');
        const reversedGaddagWord = reversedWord.slice(0, i) + '^' + reversedWord.slice(i);
        
        node = this.root;
        valid = true;
        
        for (const letter of reversedGaddagWord) {
          if (!node.children.has(letter)) {
            valid = false;
            break;
          }
          node = node.children.get(letter);
        }
        
        if (valid && node.isTerminal) {
          return true;
        }
      }
    }
    return false;
  }

  toJSON() {
    // Convert the entire GADDAG to a compact format
    const nodes = [];
    const nodeMap = new Map();
    
    // First pass: assign IDs to all nodes
    let nextId = 0;
    const assignIds = (node) => {
      if (nodeMap.has(node)) return;
      node.id = nextId++;
      nodeMap.set(node, node.id);
      for (const child of node.children.values()) {
        assignIds(child);
      }
    };
    assignIds(this.root);
    
    // Second pass: serialize nodes
    const serializeNode = (node) => {
      const childrenObj = {};
      for (const [letter, child] of node.children) {
        childrenObj[letter] = nodeMap.get(child);
      }
      return [node.id, node.isTerminal, childrenObj];
    };
    
    // Build the final JSON structure
    const json = {
      rootId: this.root.id,
      nodes: Array.from(nodeMap.entries()).map(([node, id]) => serializeNode(node))
    };
    
    return json;
  }

  static fromJSON(json) {
    const gaddag = new GADDAG();
    const nodeMap = new Map();
    
    // First pass: create all nodes
    for (const [id, isTerminal, children] of json.nodes) {
      const node = new GADDAGNode();
      node.id = id;
      node.isTerminal = isTerminal;
      nodeMap.set(id, node);
    }
    
    // Second pass: connect nodes
    for (const [id, isTerminal, children] of json.nodes) {
      const node = nodeMap.get(id);
      for (const [letter, childId] of Object.entries(children)) {
        node.children.set(letter, nodeMap.get(childId));
      }
    }
    
    gaddag.root = nodeMap.get(json.rootId);
    return gaddag;
  }
}

module.exports = GADDAG; 