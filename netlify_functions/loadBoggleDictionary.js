const fs = require('fs');
const path = require('path');

// Cache for the dictionary
let cachedDictionary = null;

async function loadBoggleDictionary() {
  // Return cached dictionary if it exists
  if (cachedDictionary) {
    return cachedDictionary;
  }

  console.log('Loading Boggle dictionary...');
  const startTime = Date.now();

  try {
    // Load from the same dictionary.json file
    const dictionaryPath = path.join(__dirname, 'dictionary.json');
    console.log('Loading dictionary from:', dictionaryPath);
    
    const fileStartTime = Date.now();
    const words = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
    const fileLoadTime = Date.now() - fileStartTime;
    console.log(`File load time: ${fileLoadTime}ms`);
    console.log(`Found ${words.length} words in dictionary`);
    
    // Verify a few sample words
    const sampleWords = ['CAT', 'DOG', 'BIRD', 'FISH', 'TREE'];
    console.log('Verifying sample words:', sampleWords.map(word => ({
      word,
      inDictionary: words.includes(word)
    })));
    
    cachedDictionary = words;
    
    const totalTime = Date.now() - startTime;
    console.log(`Total dictionary load time: ${totalTime}ms`);
    
    return words;
  } catch (err) {
    console.error("Failed to load Boggle dictionary:", err);
    console.error('Full error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    throw err;
  }
}

module.exports = { loadBoggleDictionary }; 