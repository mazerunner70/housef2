const fs = require('fs');
const path = require('path');

// Read the environment variables
const env = {
  REACT_APP_AWS_REGION: process.env.REACT_APP_AWS_REGION,
  REACT_APP_COGNITO_USER_POOL_ID: process.env.REACT_APP_COGNITO_USER_POOL_ID,
  REACT_APP_COGNITO_CLIENT_ID: process.env.REACT_APP_COGNITO_CLIENT_ID,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  NODE_ENV: process.env.NODE_ENV
};

// Read the HTML template
const htmlPath = path.resolve(__dirname, '../public/index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Replace placeholders with actual values
Object.keys(env).forEach(key => {
  const placeholder = `%${key}%`;
  html = html.replace(placeholder, env[key] || '');
});

// Write the modified HTML
fs.writeFileSync(htmlPath, html);

console.log('Environment variables injected into index.html'); 