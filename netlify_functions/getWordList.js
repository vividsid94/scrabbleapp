/**
 * Netlify function to serve the Scrabble word list
 * Returns NWL23 word list for client-side dictionary
 */

const fs = require('fs');
const path = require('path');

// Try to load wordlist from various possible locations
function loadWordList() {
  const possiblePaths = [
    path.join(__dirname, 'twl-wordlist.json'),
    path.join(__dirname, 'nwl-wordlist.json'),
    path.join(__dirname, 'wordlist.json'),
  ];

  for (const wordListPath of possiblePaths) {
    if (fs.existsSync(wordListPath)) {
      try {
        const data = fs.readFileSync(wordListPath, 'utf8');
        const words = JSON.parse(data);
        if (Array.isArray(words)) {
          return words;
        }
      } catch (error) {
        console.error(`Error reading ${wordListPath}:`, error);
      }
    }
  }

  return null;
}

exports.handler = async function(event) {
  // Allow CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const words = loadWordList();
    
    if (!words) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Word list not found',
          message: 'Dictionary file not available. Please ensure wordlist.json exists in netlify_functions directory.'
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        words: words,
        count: words.length,
        source: 'NWL23'
      }),
    };
  } catch (error) {
    console.error('Error serving word list:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
