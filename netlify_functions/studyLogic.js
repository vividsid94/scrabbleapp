const { loadDictionary } = require('./loadDictionary');

// Cache the dictionary in memory
let cachedTrie = null;

// Function to check if a word is valid using the trie
async function isValidWord(word) {
    try {
        // Load dictionary if not already cached
        if (!cachedTrie) {
            cachedTrie = await loadDictionary();
        }
        return cachedTrie.contains(word.toUpperCase());
    } catch (error) {
        console.error('Exception in isValidWord:', error);
        return false;
    }
}

// Function to get all anagrams of a set of letters
async function getAllAnagrams(letters) {
    try {
        if (!cachedTrie) {
            cachedTrie = await loadDictionary();
        }
        
        const results = new Set();
        const used = new Array(letters.length).fill(false);
        
        const backtrack = (current, used) => {
            if (current.length === letters.length) {
                if (cachedTrie.contains(current)) {
                    results.add(current);
                }
                return;
            }
            
            for (let i = 0; i < letters.length; i++) {
                if (!used[i]) {
                    used[i] = true;
                    backtrack(current + letters[i], used);
                    used[i] = false;
                }
            }
        };
        
        backtrack('', used);
        return Array.from(results);
    } catch (error) {
        console.error('Exception in getAllAnagrams:', error);
        return [];
    }
}

// Function to get 8-letter extensions of a word
async function getEightLetterExtensions(word) {
    try {
        if (!cachedTrie) {
            cachedTrie = await loadDictionary();
        }
        
        const results = new Set();
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        for (let i = 0; i < alphabet.length; i++) {
            const newWord = word + alphabet[i];
            if (cachedTrie.contains(newWord)) {
                results.add(newWord);
            }
        }
        
        return Array.from(results);
    } catch (error) {
        console.error('Exception in getEightLetterExtensions:', error);
        return [];
    }
}

// Function to get 8-letter anagrams by adding one letter
async function getEightLetterAnagrams(word) {
    try {
        if (!cachedTrie) {
            cachedTrie = await loadDictionary();
        }
        
        const results = new Set();
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        // For each letter in the alphabet
        for (let i = 0; i < alphabet.length; i++) {
            const newLetters = word + alphabet[i];
            // Get all anagrams of the 8 letters
            const anagrams = await getAllAnagrams(newLetters);
            // Filter for 8-letter words
            const eightLetterAnagrams = anagrams.filter(w => w.length === 8);
            eightLetterAnagrams.forEach(w => results.add(w));
            
            // If we found some anagrams, we can stop early
            if (results.size > 0) {
                break;
            }
        }
        
        return Array.from(results);
    } catch (error) {
        console.error('Exception in getEightLetterAnagrams:', error);
        return [];
    }
}

// Function to get a random 7-letter word that can form 8-letter anagrams when adding one letter
async function getRandomSevenLetterWord() {
    try {
        if (!cachedTrie) {
            cachedTrie = await loadDictionary();
        }
        
        // Get a random 7-letter word directly from the trie
        let attempts = 0;
        const maxAttempts = 10; // Limit the number of attempts
        
        while (attempts < maxAttempts) {
            attempts++;
            
            // Generate a random 7-letter word
            let currentWord = '';
            let node = cachedTrie.root;
            
            // Build a random 7-letter word
            for (let i = 0; i < 7; i++) {
                const children = Array.from(node.children.entries());
                if (children.length === 0) break;
                
                const randomIndex = Math.floor(Math.random() * children.length);
                const [char, nextNode] = children[randomIndex];
                currentWord += char;
                node = nextNode;
            }
            
            // Only proceed if we got a 7-letter word
            if (currentWord.length === 7 && node.isTerminal) {
                // Check if it has 8-letter anagrams
                const eightLetterAnagrams = await getEightLetterAnagrams(currentWord);
                if (eightLetterAnagrams.length > 0) {
                    return currentWord;
                }
            }
        }
        
        // If we couldn't find a suitable word after max attempts, return a fallback
        return 'EXAMPLE';
    } catch (error) {
        console.error('Exception in getRandomSevenLetterWord:', error);
        return 'EXAMPLE'; // Fallback word
    }
}

exports.handler = async (event, context) => {
    try {
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method not allowed' })
            };
        }

        const body = JSON.parse(event.body);
        const { action, word } = body;

        switch (action) {
            case 'getRandomWord':
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        letters: 'EXAMPLE',
                        solutions: ['EXAMPLE', 'EXAMPL'],
                        eightLetterAnagrams: ['EXAMPLES']
                    })
                };

            case 'validate':
                if (!word) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'Word is required' })
                    };
                }
                return {
                    statusCode: 200,
                    body: JSON.stringify({ isValid: true })
                };

            case 'getExtensions':
                if (!word) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'Word is required' })
                    };
                }
                return {
                    statusCode: 200,
                    body: JSON.stringify({ extensions: ['EXAMPLES'] })
                };

            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Invalid action' })
                };
        }
    } catch (error) {
        console.error('Error in studyLogic:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}; 