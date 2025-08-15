/**
 * Search Words - Now calls deployed Railway service
 * 
 * This function provides word search and validation by calling the deployed Go service
 * instead of trying to parse KWG files locally.
 */

const RAILWAY_BASE_URL = 'https://scrabble-move-generator-production.up.railway.app';

/**
 * Check if a word exists in the dictionary
 */
async function validateWord(word) {
  try {
    const response = await fetch(`${RAILWAY_BASE_URL}/validate-word`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ word: word })
    });

    if (!response.ok) {
      console.error('Railway service error:', response.status, response.statusText);
      return { word: word.toUpperCase(), isValid: false, error: 'Service error' };
    }

    const data = await response.json();
    return { 
      word: data.word, 
      isValid: data.isValid, 
      dictionary: data.dictionary || 'NWL23' 
    };
  } catch (error) {
    console.error('Error calling Railway service:', error);
    return { word: word.toUpperCase(), isValid: false, error: 'Network error' };
  }
}

/**
 * Search for anagrams of given letters
 */
async function findAnagrams(letters) {
  try {
    const response = await fetch(`${RAILWAY_BASE_URL}/anagram-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ letters: letters })
    });

    if (!response.ok) {
      console.error('Railway service error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data.words || [];
  } catch (error) {
    console.error('Error calling Railway service:', error);
    return [];
  }
}

/**
 * Main handler for the Netlify function
 */
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

    const searchTermUpper = searchTerm.toUpperCase();

    // For anagram search, find all possible words that can be made from these letters
    let matchingWords = [];

    // Use Railway service for anagram search
    matchingWords = await findAnagrams(searchTermUpper);

    // Limit results to top 20 matches for anagrams
    const limitedResults = matchingWords.slice(0, 20);

    // Get additional info about the service being used
    const serviceInfo = {
      format: 'Railway Service',
      source: 'Deployed Go Service',
      url: RAILWAY_BASE_URL
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        words: limitedResults,
        total: matchingWords.length,
        searchTerm: searchTerm,
        service: serviceInfo
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