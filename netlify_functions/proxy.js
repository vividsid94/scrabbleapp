const axios = require('axios');

exports.handler = async (event) => {
  const { url, method = 'GET', body } = event.queryStringParameters || {};

  if (!url) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({ error: 'URL parameter is required' })
    };
  }

  // Forward Authorization header if present
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const isPost = method.toUpperCase() === 'POST';
  const headers = isPost
    ? { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    : { 'Accept': '*/*', 'User-Agent': 'Mozilla/5.0 (compatible; TileTurnover/1.0)' };
  if (authHeader) headers.Authorization = authHeader;

  try {
    let response;
    if (isPost) {
      response = await axios.post(url, body ? JSON.parse(body) : {}, { headers });
    } else {
      response = await axios.get(url, { headers });
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    return {
      statusCode: error.response?.status || 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({
        error: error.message,
        code: error.code,
        details: error.response?.data || error.response?.statusText
      })
    };
  }
};