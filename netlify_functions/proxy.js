const axios = require('axios');
const cors = require('cors')({origin: true});

exports.handler = async (event, context) => {
  return new Promise((resolve, reject) => {
    cors(event, context, () => {
      const { url } = event.queryStringParameters;
      axios.get(url)
        .then(response => {
          resolve({
            statusCode: 200,
            body: response.data
          });
        })
        .catch(error => {
          reject({
            statusCode: error.response.status,
            body: error.response.statusText
          });
        });
    });
  });
};