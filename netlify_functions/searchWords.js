const loadDictionary = require('./loadDictionary');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Get search term from query parameters
    const { searchTerm = '' } = event.queryStringParameters || {};
    
    if (!searchTerm || searchTerm.length < 1) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ words: [] })
      };
    }

    // Load the GADDAG dictionary
    const gaddag = loadDictionary();
    
    // Load the full word list for searching
    const fs = require('fs');
    const path = require('path');
    const dictionaryPath = path.join(__dirname, 'dictionary.json');
    const dictionaryData = fs.readFileSync(dictionaryPath, 'utf8');
    const allWords = JSON.parse(dictionaryData);

    // Filter words that match the search term
    const searchTermUpper = searchTerm.toUpperCase();
    const matchingWords = allWords.filter(word => 
      word.toUpperCase().includes(searchTermUpper)
    );

    // Limit results to top 10 matches
    const limitedResults = matchingWords.slice(0, 10);

    // Verify each word exists in GADDAG (optional validation)
    const verifiedWords = limitedResults.filter(word => 
      gaddag.contains(word.toUpperCase())
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        words: verifiedWords,
        total: matchingWords.length,
        searchTerm: searchTerm
      })
    };

  } catch (error) {
    console.error('Error in searchWords function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to search words',
        message: error.message 
      })
    };
  }
}; 