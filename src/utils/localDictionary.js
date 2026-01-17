/**
 * Local Dictionary for Scrabble Word Validation
 * 
 * Loads a word list into memory for instant O(1) lookups.
 * Falls back to API if dictionary not loaded or fails.
 */

// In-memory dictionary cache
let dictionarySet = null;
let isLoading = false;
let loadPromise = null;

/**
 * Load dictionary from Netlify function or public file
 * @returns {Promise<Set<string>>}
 */
async function loadDictionary() {
  // If already loaded, return immediately
  if (dictionarySet) {
    return dictionarySet;
  }

  // If currently loading, return the existing promise
  if (loadPromise) {
    return loadPromise;
  }

  // Start loading
  isLoading = true;
  loadPromise = (async () => {
    // Try to load from public text file first (nwl2023.txt or nwl23.txt)
    console.log('📖 Attempting to load dictionary from /nwl2023.txt...');
    try {
      const response = await fetch('/nwl2023.txt');
      console.log('📖 Response status:', response.status, response.statusText);
      if (response.ok) {
        const text = await response.text();
        console.log('📖 File loaded, text length:', text.length, 'characters');
        
        // Check if we got HTML instead of the text file (routing issue)
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          console.warn('⚠️ Got HTML instead of dictionary file - trying nwl23.txt...');
          // Try alternative filename
          try {
            const altResponse = await fetch('/nwl23.txt');
            if (altResponse.ok) {
              const altText = await altResponse.text();
              if (!altText.trim().startsWith('<!DOCTYPE') && !altText.trim().startsWith('<html')) {
                const words = altText
                  .split('\n')
                  .map(line => line.trim().toUpperCase())
                  .filter(word => word.length > 0 && !word.startsWith('<'));
                
                if (words.length > 0) {
                  dictionarySet = new Set(words);
                  console.log(`✅ Local dictionary loaded from nwl23.txt: ${dictionarySet.size} words`);
                  return dictionarySet;
                }
              }
            }
          } catch (altError) {
            console.warn('❌ Alternative filename also failed:', altError);
          }
          throw new Error('Got HTML instead of dictionary file');
        }
        
        // Parse text file (one word per line)
        const words = text
          .split('\n')
          .map(line => line.trim().toUpperCase())
          .filter(word => word.length > 0 && !word.startsWith('<'));
        
        console.log('📖 Parsed words:', words.length);
        if (words.length > 0) {
          dictionarySet = new Set(words);
          console.log(`✅ Local dictionary loaded from nwl2023.txt: ${dictionarySet.size} words`);
          // Log a sample of words to verify
          const sampleWords = Array.from(dictionarySet).slice(0, 5);
          console.log('📖 Sample words:', sampleWords);
          return dictionarySet;
        } else {
          console.warn('⚠️ nwl2023.txt loaded but no words found after parsing');
        }
      } else {
        console.warn(`⚠️ nwl2023.txt not found (status: ${response.status})`);
      }
    } catch (error) {
      console.warn('❌ Failed to load dictionary from nwl2023.txt:', error);
    }

    // Fallback: try to load from Netlify function
    console.log('📖 Attempting to load dictionary from Netlify function...');
    try {
      const response = await fetch('/.netlify/functions/getWordList', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.words && Array.isArray(data.words)) {
          dictionarySet = new Set(data.words.map(word => word.toUpperCase()));
          console.log(`✅ Local dictionary loaded from function: ${dictionarySet.size} words`);
          return dictionarySet;
        }
      } else {
        console.warn(`⚠️ Netlify function not available (status: ${response.status})`);
      }
    } catch (error) {
      console.warn('❌ Failed to load dictionary from function:', error);
    }

    // Fallback: try to load from JSON file
    try {
      const response = await fetch('/wordlist.json');
      if (response.ok) {
        const words = await response.json();
        if (Array.isArray(words)) {
          dictionarySet = new Set(words.map(word => word.toUpperCase()));
          console.log(`✅ Local dictionary loaded from wordlist.json: ${dictionarySet.size} words`);
          return dictionarySet;
        }
      }
    } catch (error) {
      console.warn('Failed to load dictionary from wordlist.json:', error);
    }

    // If all else fails, return null (will use API fallback)
    console.warn('⚠️ Could not load local dictionary, will use API fallback');
    return null;
  })();

  const result = await loadPromise;
  isLoading = false;
  return result;
}

/**
 * Check if a word is valid (synchronous if dictionary loaded)
 * @param {string} word - Word to check
 * @returns {boolean|null} - true if valid, false if invalid, null if dictionary not loaded
 */
export function isValidWordLocal(word) {
  if (!dictionarySet) {
    return null; // Dictionary not loaded
  }
  return dictionarySet.has(word.toUpperCase());
}

/**
 * Check if multiple words are valid (batch validation)
 * @param {string[]} words - Words to check
 * @returns {Object<string, boolean>|null} - Map of word -> isValid, or null if dictionary not loaded
 */
export function isValidWordsBatchLocal(words) {
  if (!dictionarySet) {
    return null; // Dictionary not loaded
  }
  const results = {};
  for (const word of words) {
    results[word] = dictionarySet.has(word.toUpperCase());
  }
  return results;
}

/**
 * Initialize dictionary (loads in background)
 * @returns {Promise<void>}
 */
export async function initializeDictionary() {
  try {
    await loadDictionary();
  } catch (error) {
    console.error('Error initializing dictionary:', error);
  }
}

/**
 * Check if dictionary is loaded
 * @returns {boolean}
 */
export function isDictionaryLoaded() {
  return dictionarySet !== null;
}

/**
 * Get dictionary size (if loaded)
 * @returns {number|null}
 */
export function getDictionarySize() {
  return dictionarySet ? dictionarySet.size : null;
}
