declare global {
  interface Window {
    env: {
      REACT_APP_AWS_REGION: string;
      REACT_APP_COGNITO_USER_POOL_ID: string;
      REACT_APP_COGNITO_CLIENT_ID: string;
      REACT_APP_API_URL: string;
      NODE_ENV: string;
    };
  }
}

// Log environment variables at runtime
console.log('\n========== RUNTIME ENVIRONMENT ==========');
console.log('window.env:', window.env);
console.log('process.env:', process.env);
console.log('=====================================\n');

export const config = {
  aws: {
    region: window.env.REACT_APP_AWS_REGION || 'eu-west-2',
    cognito: {
      userPoolId: window.env.REACT_APP_COGNITO_USER_POOL_ID || '',
      clientId: window.env.REACT_APP_COGNITO_CLIENT_ID || ''
    }
  },
  api: {
    url: window.env.REACT_APP_API_URL || ''
  }
};

// Log final configuration
console.log('\n========== FINAL CONFIG ==========');
console.log('config:', config);
console.log('================================\n'); 