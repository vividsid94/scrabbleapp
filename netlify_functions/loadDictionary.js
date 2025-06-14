const fs = require('fs');
const path = require('path');

// Cache for the trie
let cachedTrie = null;

/**
 * Load the dictionary from a file and build a trie
 * @returns {Promise<import('./trie').Trie>} The trie containing all words
 */
async function loadDictionary() {
  // Return cached trie if it exists
  if (cachedTrie) {
    return cachedTrie;
  }

  console.log('Loading dictionary...');
  const startTime = Date.now();

  try {
    // Load from local JSON file
    const dictionaryPath = path.join(__dirname, 'dictionary.json');
    console.log('Loading dictionary from:', dictionaryPath);
    
    const fileStartTime = Date.now();
    const words = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
    const fileLoadTime = Date.now() - fileStartTime;
    console.log(`File load time: ${fileLoadTime}ms`);
    console.log(`Found ${words.length} words in dictionary`);

    // Create trie with root node
    const trie = {
      root: {
        children: new Map(),
        isTerminal: false
      },
      contains: function(word) {
        let node = this.root;
        for (const char of word) {
          if (!node.children.has(char)) {
            return false;
          }
          node = node.children.get(char);
        }
        return node.isTerminal;
      }
    };

    // Process words in chunks to avoid memory issues
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < words.length; i += CHUNK_SIZE) {
      const chunk = words.slice(i, i + CHUNK_SIZE);
      for (const word of chunk) {
        let node = trie.root;
        for (const char of word) {
          if (!node.children.has(char)) {
            node.children.set(char, {
              children: new Map(),
              isTerminal: false
            });
          }
          node = node.children.get(char);
        }
        node.isTerminal = true;
      }
      // Force garbage collection of processed chunk
      if (global.gc) {
        global.gc();
      }
    }

    console.log(`Loaded ${words.length} words into trie`);
    cachedTrie = trie;
    
    const totalTime = Date.now() - startTime;
    console.log(`Total dictionary load time: ${totalTime}ms`);

    return trie;
  } catch (error) {
    console.error('Error loading dictionary:', error);
    throw error;
  }
}

module.exports = { loadDictionary };
