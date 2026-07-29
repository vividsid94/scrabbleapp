/**
 * Scheduled Netlify Function.
 *
 * Pings the Railway-hosted Go move-generator on a timer so it never sits
 * idle long enough for Railway to scale it to zero. Without this, the first
 * bot move after a period of inactivity pays a ~15s cold-start cost (booting
 * the container and reloading its dictionary data) before it can respond.
 *
 * Runs on the schedule configured in netlify.toml ([functions.pingBotService]).
 */
const https = require('https');

const RAILWAY_BASE_URL = 'https://scrabble-move-generator-production.up.railway.app';

exports.handler = async function () {
  const result = await new Promise((resolve) => {
    const req = https.get(RAILWAY_BASE_URL, { timeout: 10000 }, (res) => {
      res.resume(); // drain the response body, we don't need it
      resolve({ pinged: true, status: res.statusCode });
    });

    req.on('error', (error) => {
      resolve({ pinged: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ pinged: false, error: 'timeout' });
    });
  });

  // Always return 200 - a failed ping (service already warm, transient
  // network blip, etc.) isn't a function failure worth alerting on.
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};
