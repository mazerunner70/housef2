import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
  ISignUpResult
} from 'amazon-cognito-identity-js';

export interface AuthCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  mfaEnabled?: boolean;
}

class AuthService {
  private userPool: CognitoUserPool;
  private refreshTimer?: NodeJS.Timeout;
  private sessionTimeoutWarning = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.userPool = new CognitoUserPool({
      UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID!,
      ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID!
    });

    // Start session management
    this.setupSessionRefresh();
  }

  async signIn(credentials: AuthCredentials): Promise<AuthUser> {
    return new Promise((resolve, reject) => {
      const authData = new AuthenticationDetails({
        Username: credentials.email,
        Password: credentials.password
      });

      const cognitoUser = new CognitoUser({
        Username: credentials.email,
        Pool: this.userPool
      });

      cognitoUser.authenticateUser(authData, {
        onSuccess: async (session) => {
          try {
            const user = await this.getUserAttributes(cognitoUser);
            resolve(user);
          } catch (error) {
            reject(error);
          }
        },
        onFailure: (err) => {
          reject(this.handleAuthError(err));
        },
        mfaRequired: (challengeName, challengeParameters) => {
          if (!credentials.mfaCode) {
            reject(new Error('MFA code required'));
            return;
          }

          cognitoUser.sendMFACode(credentials.mfaCode, {
            onSuccess: async (session) => {
              try {
                const user = await this.getUserAttributes(cognitoUser);
                resolve(user);
              } catch (error) {
                reject(error);
              }
            },
            onFailure: (err) => {
              reject(this.handleAuthError(err));
            }
          });
        }
      });
    });
  }

  async signOut(): Promise<void> {
    const cognitoUser = this.userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
      this.clearSessionRefresh();
    }
  }

  async getCurrentUser(): Promise<AuthUser> {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser();

      if (!cognitoUser) {
        reject(new Error('No user found'));
        return;
      }

      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          reject(err || new Error('Invalid session'));
          return;
        }

        this.getUserAttributes(cognitoUser)
          .then(resolve)
          .catch(reject);
      });
    });
  }

  private async getUserAttributes(cognitoUser: CognitoUser): Promise<AuthUser> {
    return new Promise((resolve, reject) => {
      cognitoUser.getUserAttributes((err, attributes) => {
        if (err) {
          reject(err);
          return;
        }

        if (!attributes) {
          reject(new Error('No attributes found'));
          return;
        }

        const user: AuthUser = {
          id: cognitoUser.getUsername(),
          email: '',
          firstName: '',
          lastName: '',
        };

        attributes.forEach(attr => {
          switch (attr.getName()) {
            case 'email':
              user.email = attr.getValue();
              break;
            case 'given_name':
              user.firstName = attr.getValue();
              break;
            case 'family_name':
              user.lastName = attr.getValue();
              break;
            case 'custom:role':
              user.role = attr.getValue();
              break;
          }
        });

        resolve(user);
      });
    });
  }

  async setupMFA(): Promise<string> {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser();
      
      if (!cognitoUser) {
        reject(new Error('No user found'));
        return;
      }

      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          reject(err || new Error('Invalid session'));
          return;
        }

        cognitoUser.associateSoftwareToken({
          associateSecretCode: (secretCode) => {
            resolve(secretCode);
          },
          onFailure: (err) => {
            reject(this.handleAuthError(err));
          }
        });
      });
    });
  }

  async verifyMFA(code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser();
      
      if (!cognitoUser) {
        reject(new Error('No user found'));
        return;
      }

      cognitoUser.verifySoftwareToken(code, 'TOTP MFA', {
        onSuccess: () => {
          cognitoUser.setUserMfaPreference(null, {
            PreferredMfa: true,
            Enabled: true
          }, (err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          });
        },
        onFailure: (err) => {
          reject(this.handleAuthError(err));
        }
      });
    });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser();
      
      if (!cognitoUser) {
        reject(new Error('No user found'));
        return;
      }

      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          reject(err || new Error('Invalid session'));
          return;
        }

        cognitoUser.changePassword(oldPassword, newPassword, (err) => {
          if (err) {
            reject(this.handleAuthError(err));
            return;
          }
          resolve();
        });
      });
    });
  }

  async forgotPassword(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool
      });

      cognitoUser.forgotPassword({
        onSuccess: () => {
          resolve();
        },
        onFailure: (err) => {
          reject(this.handleAuthError(err));
        }
      });
    });
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool
      });

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          resolve();
        },
        onFailure: (err) => {
          reject(this.handleAuthError(err));
        }
      });
    });
  }

  private setupSessionRefresh(): void {
    // Clear any existing timer
    this.clearSessionRefresh();

    // Set up new timer
    this.refreshTimer = setInterval(() => {
      const cognitoUser = this.userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
          if (!err && session) {
            const expirationTime = session.getAccessToken().getExpiration() * 1000;
            const now = Date.now();

            // If token expires in less than the warning time
            if (expirationTime - now < this.sessionTimeoutWarning) {
              cognitoUser.refreshSession(session.getRefreshToken(), (err, session) => {
                if (err) {
                  console.error('Session refresh error:', err);
                }
              });
            }
          }
        });
      }
    }, 60000); // Check every minute
  }

  private clearSessionRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  private handleAuthError(error: any): Error {
    console.error('Auth error:', error);
    
    if (error.code === 'NotAuthorizedException') {
      return new Error('Invalid credentials');
    }
    if (error.code === 'UserNotFoundException') {
      return new Error('User not found');
    }
    if (error.code === 'CodeMismatchException') {
      return new Error('Invalid verification code');
    }
    if (error.code === 'PasswordResetRequiredException') {
      return new Error('Password reset required');
    }
    if (error.code === 'UserNotConfirmedException') {
      return new Error('User not confirmed');
    }

    return new Error(error.message || 'An error occurred during authentication');
  }
}

export const authService = new AuthService(); 