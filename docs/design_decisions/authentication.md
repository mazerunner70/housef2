# Authentication Design Decisions

## Overview
This document outlines the authentication strategy using AWS Cognito over HTTPS. The system will use Cognito User Pools for user management and authentication, with secure access to AWS services through Cognito Identity Pools.

## HTTPS Requirements

### Configuration
- All traffic must be over HTTPS
- HTTP requests automatically redirected to HTTPS
- Strict Transport Security (HSTS) enabled
- Modern TLS versions only (TLS 1.2+)
- Strong cipher suites enforced

### Certificate Management
- AWS Certificate Manager (ACM) for SSL/TLS certificates
- Automatic certificate renewal
- CloudFront distribution for CDN and SSL termination

## Cognito Implementation

### User Pool Configuration
```typescript
interface CognitoUserPoolConfig {
  poolName: "housef2-users";
  policies: {
    password: {
      minimumLength: 12;
      requireNumbers: true;
      requireSpecialCharacters: true;
      requireUppercase: true;
      requireLowercase: true;
    };
    signUp: {
      allowSelfSignUp: false;  // Admin creates users
      verifyEmail: true;
    };
  };
  mfa: {
    enabled: true;
    preferredMethod: "TOTP";
    allowedMethods: ["TOTP", "SMS"];
  };
}
```

### Identity Pool Configuration
```typescript
interface CognitoIdentityPoolConfig {
  poolName: "housef2-identity-pool";
  allowUnauthenticatedIdentities: false;
  authenticationProviders: {
    cognito: {
      userPoolId: string;
      userPoolClientId: string;
    };
  };
}
```

### User Attributes
```typescript
interface CognitoUserAttributes {
  required: {
    email: string;
    given_name: string;
    family_name: string;
  };
  optional: {
    phone_number?: string;
    preferred_username?: string;
    locale?: string;
    timezone?: string;
  };
  custom: {
    "custom:role"?: "ADMIN" | "USER";
    "custom:lastLogin"?: string;
  };
}
```

## Authentication Flow

### Sign-In Process
1. User enters email and password
2. Cognito authenticates credentials
3. If MFA enabled, prompt for TOTP
4. On success:
   - Receive JWT tokens
   - Get temporary AWS credentials
   - Store refresh token securely

```typescript
interface AuthTokens {
  accessToken: string;    // JWT, short-lived (1 hour)
  idToken: string;        // JWT with user info
  refreshToken: string;   // Long-lived (30 days)
}
```

### Token Management
- Access tokens stored in memory only
- Refresh token in secure HTTP-only cookie
- Automatic token refresh using refresh token
- Token revocation on sign out

### Session Handling
```typescript
interface SessionConfig {
  sessionDuration: 1 * 60 * 60;  // 1 hour
  refreshWindow: 5 * 60;         // 5 minutes before expiry
  maxRefreshAge: 30 * 24 * 60 * 60;  // 30 days
}
```

## Security Measures

### Token Security
- JWTs signed by Cognito
- Token signature verification
- Expiration times enforced
- No sensitive data in tokens

### API Security
- API Gateway with Cognito authorizer
- Scoped IAM roles per user
- Rate limiting enabled
- Request signing for AWS services

### Client Security
```typescript
interface SecurityConfig {
  tokenStorage: {
    accessToken: "memory";
    refreshToken: "httpOnlyCookie";
    idToken: "memory";
  };
  cookieSettings: {
    secure: true;
    sameSite: "strict";
    httpOnly: true;
    path: "/";
  };
}
```

## Error Handling

### Authentication Errors
- Invalid credentials
- Expired tokens
- MFA challenges
- Network failures
- Account lockouts

### Recovery Flows
1. Password Reset
2. MFA Device Reset
3. Account Unlock
4. Session Recovery

## Monitoring and Logging

### Metrics to Track
- Sign-in attempts
- Failed authentications
- Token refreshes
- MFA usage
- Account lockouts

### Security Alerts
- Multiple failed attempts
- Unusual location signs-ins
- Token revocation events
- Admin account access

## Development Considerations

### Local Development
- Local Cognito emulator
- Test user pool
- Offline development support
- Debug logging options

### Testing
- Auth flow unit tests
- Integration test users
- Token validation tests
- Security compliance tests 