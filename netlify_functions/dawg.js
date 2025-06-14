class DAWGNode {
  constructor() {
    this.children = new Map();
    this.isTerminal = false;
    this.id = null;
  }

  // Serialize node to a plain object
  toJSON() {
    const obj = {
      isTerminal: this.isTerminal,
      id: this.id,
      children: {}
    };
    for (const [char, child] of this.children) {
      obj.children[char] = child;
    }
    return obj;
  }

  // Deserialize node from a plain object
  static fromJSON(obj) {
    const node = new DAWGNode();
    node.isTerminal = obj.isTerminal;
    node.id = obj.id;
    for (const [char, child] of Object.entries(obj.children)) {
      node.children.set(char, child);
    }
    return node;
  }
}

class DAWG {
  constructor() {
    this.root = new DAWGNode();
    this.nextId = 0;
  }

  insert(word) {
    let node = this.root;
    for (const char of word.toUpperCase()) {
      if (!node.children.has(char)) {
        const newNode = new DAWGNode();
        newNode.id = this.nextId++;
        node.children.set(char, newNode);
      }
      node = node.children.get(char);
    }
    node.isTerminal = true;
  }

  minimize() {
    console.log('Starting DAWG minimization...');
    const startTime = Date.now();
    
    // First pass: collect all nodes
    const nodes = new Map();
    const queue = [this.root];
    let nodeCount = 0;
    
    while (queue.length > 0) {
      const node = queue.shift();
      if (nodes.has(node.id)) continue;
      
      nodes.set(node.id, node);
      nodeCount++;
      
      for (const child of node.children.values()) {
        queue.push(child);
      }
    }
    console.log(`Collected ${nodeCount} nodes`);

    // Second pass: find equivalent nodes
    const equivalentNodes = new Map();
    
    for (const [id, node] of nodes) {
      const key = this.getNodeKey(node);
      if (!equivalentNodes.has(key)) {
        equivalentNodes.set(key, []);
      }
      equivalentNodes.get(key).push(node);
    }
    console.log(`Found ${equivalentNodes.size} unique node patterns`);

    // Third pass: merge equivalent nodes
    let mergeCount = 0;
    
    for (const nodes of equivalentNodes.values()) {
      if (nodes.length <= 1) continue;
      
      const target = nodes[0];
      for (let i = 1; i < nodes.length; i++) {
        const node = nodes[i];
        // Update all parent references to point to target
        for (const parent of nodes) {
          for (const [char, child] of parent.children) {
            if (child === node) {
              parent.children.set(char, target);
            }
          }
        }
      }
      mergeCount++;
    }
    
    const endTime = Date.now();
    console.log(`DAWG minimization complete:`);
    console.log(`- Total nodes: ${nodeCount}`);
    console.log(`- Unique patterns: ${equivalentNodes.size}`);
    console.log(`- Total merges: ${mergeCount}`);
    console.log(`- Time taken: ${(endTime - startTime) / 1000} seconds`);
  }

  getNodeKey(node) {
    const children = Array.from(node.children.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([char, child]) => `${char}${child.id}`);
    return `${node.isTerminal ? '1' : '0'}${children.join('')}`;
  }

  contains(word) {
    let node = this.root;
    for (const char of word.toUpperCase()) {
      if (!node.children.has(char)) return false;
      node = node.children.get(char);
    }
    return node.isTerminal;
  }

  hasPrefix(prefix) {
    let node = this.root;
    for (const char of prefix.toUpperCase()) {
      if (!node.children.has(char)) return false;
      node = node.children.get(char);
    }
    return true;
  }

  // Serialize the entire DAWG
  toJSON() {
    return {
      root: this.root,
      nextId: this.nextId
    };
  }

  // Deserialize the entire DAWG
  static fromJSON(obj) {
    const dawg = new DAWG();
    dawg.nextId = obj.nextId;
    
    function reconstructNode(nodeData) {
      const node = new DAWGNode();
      node.isTerminal = nodeData.isTerminal;
      node.id = nodeData.id;
      
      for (const [char, childData] of Object.entries(nodeData.children)) {
        node.children.set(char, reconstructNode(childData));
      }
      
      return node;
    }
    
    dawg.root = reconstructNode(obj.root);
    return dawg;
  }
}

module.exports = { DAWG, DAWGNode }; 