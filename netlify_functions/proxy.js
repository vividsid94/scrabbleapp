const axios = require('axios');

exports.handler = async (event, context) => {
  const { url } = event.queryStringParameters;
  try {
    const response = await axios.get(url);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: response.data
    };
  } catch (error) {
    return {
      statusCode: error.response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: error.response.statusText
    };
  }
};