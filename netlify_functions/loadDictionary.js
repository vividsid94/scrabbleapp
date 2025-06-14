const { Trie } = require('./trie');
const fs = require('fs');
const path = require('path');

// Global cache for the trie
let cachedTrie = null;

async function loadDictionary() {
  // Return cached trie if it exists
  if (cachedTrie) {
    return cachedTrie;
  }

  console.log('Loading dictionary...');
  const startTime = Date.now();
  const trie = new Trie();

  try {
    // Load from local JSON file
    const dictionaryPath = path.join(__dirname, 'dictionary.json');
    console.log('Loading dictionary from:', dictionaryPath);
    
    const fileStartTime = Date.now();
    const words = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
    const fileLoadTime = Date.now() - fileStartTime;
    console.log(`File load time: ${fileLoadTime}ms`);
    console.log(`Found ${words.length} words in dictionary`);
    
    // Verify a few sample words
    const sampleWords = ['AA', 'QI', 'ZA', 'JAZZ', 'QUIZ'];
    console.log('Verifying sample words:', sampleWords.map(word => ({
      word,
      inDictionary: words.includes(word)
    })));
    
    const trieStartTime = Date.now();
    for (const word of words) {
      trie.insert(word);
    }
    const trieBuildTime = Date.now() - trieStartTime;
    console.log(`Trie build time: ${trieBuildTime}ms`);
    
    console.log(`Loaded ${words.length} words into trie`);
    cachedTrie = trie;
    
    const totalTime = Date.now() - startTime;
    console.log(`Total dictionary load time: ${totalTime}ms`);
    
    return trie;
  } catch (err) {
    console.error("Failed to load dictionary:", err);
    console.error('Full error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    throw err;
  }
}

module.exports = { loadDictionary };
