const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Get the API URL from the environment
  const apiUrl = process.env.REACT_APP_API_URL || '';
  
  if (apiUrl) {
    console.log(`Setting up proxy for API requests to: ${apiUrl}`);
    
    app.use(
      '/api-proxy',
      createProxyMiddleware({
        target: apiUrl,
        changeOrigin: true,
        pathRewrite: {
          '^/api-proxy': '', // Remove the /api-proxy prefix
        },
        onProxyRes: function(proxyRes, req, res) {
          // Add CORS headers to the response
          proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS';
          proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization';
        }
      })
    );
  }
}; 