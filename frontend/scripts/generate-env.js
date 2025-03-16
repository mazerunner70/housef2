const fs = require('fs');
const path = require('path');

// Read the .env file
require('dotenv').config();

// Read the HTML template
const htmlPath = path.resolve(__dirname, '../public/index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Replace placeholders with actual values
const envVars = [
  'REACT_APP_AWS_REGION',
  'REACT_APP_COGNITO_USER_POOL_ID',
  'REACT_APP_COGNITO_CLIENT_ID',
  'REACT_APP_API_URL',
  'NODE_ENV'
];

envVars.forEach(varName => {
  const value = process.env[varName] || '';
  htmlContent = htmlContent.replace(
    `%${varName}%`,
    value
  );
});

// Write the modified HTML
fs.writeFileSync(htmlPath, htmlContent);

console.log('Environment variables injected into index.html'); 