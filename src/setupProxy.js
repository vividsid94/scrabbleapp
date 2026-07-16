const { createProxyMiddleware } = require('http-proxy-middleware');

// Proxy Netlify functions when using `npm start` alongside `netlify dev` (port 8888).
// Run: npx netlify dev  OR  npm run dev
module.exports = function (app) {
  app.use(
    '/.netlify/functions',
    createProxyMiddleware({
      target: 'http://localhost:8888',
      changeOrigin: true,
    })
  );
};
