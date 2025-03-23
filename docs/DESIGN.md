# Environment Variables

## Frontend Environment Variables

The frontend application uses a multi-layered approach to handle environment variables:

### Build-time Configuration
1. Environment files:
   - `.env.development` for development
   - `.env.production` for production
   - All environment variables must be prefixed with `REACT_APP_`

2. Webpack Configuration:
   - Uses `dotenv-webpack` to load environment variables during build
   - Environment variables are explicitly injected into the browser via `window.env`
   - Each variable is individually stringified to ensure proper type handling

### Required Environment Variables
```
REACT_APP_AWS_REGION=eu-west-2
REACT_APP_COGNITO_USER_POOL_ID=your-user-pool-id
REACT_APP_COGNITO_CLIENT_ID=your-client-id
REACT_APP_API_URL=your-api-url
```

### Usage in Code
```typescript
// Access environment variables through window.env
const config = {
  aws: {
    region: window.env.REACT_APP_AWS_REGION,
    cognito: {
      userPoolId: window.env.REACT_APP_COGNITO_USER_POOL_ID,
      clientId: window.env.REACT_APP_COGNITO_CLIENT_ID
    }
  },
  api: {
    url: window.env.REACT_APP_API_URL
  }
};
```

### Security Considerations
1. Environment variables are injected at build time
2. Only variables prefixed with `REACT_APP_` are included
3. Sensitive values should be handled server-side when possible
4. Production builds should use different environment values than development

### Development Workflow
1. Create appropriate `.env.development` or `.env.production` file
2. Variables are loaded by webpack during build/dev-server startup
3. Variables are accessible in browser via `window.env`
4. Changes to env files require server restart to take effect

### Troubleshooting
If environment variables are not available:
1. Verify the `.env` file exists and has correct name for the environment
2. Ensure variables are prefixed with `REACT_APP_`
3. Restart the development server
4. Check webpack build logs for environment loading status 