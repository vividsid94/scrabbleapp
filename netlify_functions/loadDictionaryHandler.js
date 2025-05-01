const { loadDictionary } = require('./loadDictionary');

// Cache the dictionary in memory
let cachedTrie = null;

exports.handler = async function(event, context) {
  console.log('🔍 loadDictionaryHandler triggered at:', new Date().toISOString());
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Load dictionary if not already cached
    if (!cachedTrie) {
      console.log('📚 Loading dictionary...');
      cachedTrie = await loadDictionary();
      console.log('✅ Dictionary loaded successfully');
    } else {
      console.log('📚 Dictionary already cached');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'Dictionary loaded and cached',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('❌ Error loading dictionary:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
}; 