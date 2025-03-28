declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_AWS_REGION: string;
    REACT_APP_COGNITO_USER_POOL_ID: string;
    REACT_APP_COGNITO_CLIENT_ID: string;
    REACT_APP_COGNITO_IDENTITY_POOL_ID: string;
    REACT_APP_API_URL: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}

interface Window {
  env: {
    NODE_ENV: string;
    REACT_APP_API_URL: string;
    REACT_APP_COGNITO_USER_POOL_ID: string;
    REACT_APP_COGNITO_CLIENT_ID: string;
    REACT_APP_AWS_REGION: string;
    REACT_APP_COGNITO_IDENTITY_POOL_ID: string;
  };
  userPool?: any;
} 