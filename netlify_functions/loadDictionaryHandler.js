const { loadDictionary } = require('./loadDictionary');

// Cache the dictionary in memory
let cachedTrie = null;

exports.handler = async function(event, context) {
  // This will run both on schedule and when called directly
  try {
    // Load dictionary if not already cached
    if (!cachedTrie) {
      console.log('Loading dictionary...');
      cachedTrie = await loadDictionary();
      console.log('Dictionary loaded successfully');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'Dictionary loaded and cached'
      })
    };
  } catch (error) {
    console.error('Error loading dictionary:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}; 