class TrieNode {
    constructor() {
      this.children = new Map();
      this.isTerminal = false;
    }
  }
  
  class Trie {
    constructor() {
      this.root = new TrieNode();
    }
  
    insert(word) {
      let node = this.root;
      for (const char of word.toUpperCase()) {
        if (!node.children.has(char)) {
          node.children.set(char, new TrieNode());
        }
        node = node.children.get(char);
      }
      node.isTerminal = true;
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
  }
  
  module.exports = { Trie };
  