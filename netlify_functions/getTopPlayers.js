const axios = require('axios');

const BASE_URL = 'https://cross-tables.com/rest/players.php';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=300'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { lexicon = 'twl', limit = '25' } = event.queryStringParameters || {};
    const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 25, 200));

    const params = new URLSearchParams();
    if (lexicon && lexicon.toLowerCase() === 'csw') {
      params.append('lexicon', 'csw');
    }

    const url = params.toString() ? `${BASE_URL}?${params.toString()}` : BASE_URL;

    const response = await axios.get(url, { timeout: 12000 });
    const players = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.players)
        ? response.data.players
        : [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ players: players.slice(0, safeLimit) })
    };
  } catch (error) {
    console.error('Error fetching top players:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch player rankings',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};

