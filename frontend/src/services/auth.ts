import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
  ISignUpResult
} from 'amazon-cognito-identity-js';

declare global {
  interface Window {
    env: {
      NODE_ENV: string;
      REACT_APP_API_URL: string;
      REACT_APP_COGNITO_USER_POOL_ID: string;
      REACT_APP_COGNITO_CLIENT_ID: string;
      REACT_APP_AWS_REGION: string;
    }
  }
}

export interface AuthCredentials {
  email: string;
  password: string;
  mfaCode?: string;
  newPassword?: string;
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
  preferredName?: string;
  role?: string;
  mfaEnabled?: boolean;
}

class AuthService {
  private userPool: CognitoUserPool;
  private refreshTimer?: NodeJS.Timeout;
  private sessionTimeoutWarning = 5 * 60 * 1000; // 5 minutes
  private cognitoUser: CognitoUser | null = null;

  constructor() {
    // Debug log for environment variables
    console.log('Environment variables:', {
      userPoolId: window.env?.REACT_APP_COGNITO_USER_POOL_ID,
      clientId: window.env?.REACT_APP_COGNITO_CLIENT_ID,
      region: window.env?.REACT_APP_AWS_REGION,
    });

    if (!window.env) {
      console.error('Environment variables not loaded. Using default configuration.');
    }

    const region = window.env?.REACT_APP_AWS_REGION || 'eu-west-2'; // Default to eu-west-2
    const userPoolId = window.env?.REACT_APP_COGNITO_USER_POOL_ID;
    const clientId = window.env?.REACT_APP_COGNITO_CLIENT_ID;

    if (!userPoolId || !clientId) {
      throw new Error('Required Cognito configuration is missing');
    }

    this.userPool = new CognitoUserPool({
      UserPoolId: userPoolId,
      ClientId: clientId,
      endpoint: `https://cognito-idp.${region}.amazonaws.com`
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

      // If we have a cognitoUser from a previous NEW_PASSWORD_REQUIRED challenge, use it
      if (this.cognitoUser && credentials.newPassword) {
        try {
          // The API doesn't accept these fields back
          const userAttributes = {
            given_name: credentials.email.split('@')[0], // Use email username as given_name
            family_name: credentials.email.split('@')[0], // Use email username as family_name
          };
          
          this.cognitoUser.completeNewPasswordChallenge(
            credentials.newPassword,
            userAttributes,
            {
              onSuccess: async (session) => {
                try {
                  const user = await this.getUserAttributes(this.cognitoUser!);
                  this.cognitoUser = null; // Clear the stored user after successful password change
                  resolve(user);
                } catch (error) {
                  reject(error);
                }
              },
              onFailure: (err) => {
                reject(this.handleAuthError(err));
              }
            }
          );
        } catch (error) {
          reject(this.handleAuthError(error));
        }
        return;
      }

      // Initial sign in attempt
      this.cognitoUser = new CognitoUser({
        Username: credentials.email,
        Pool: this.userPool
      });

      this.cognitoUser.authenticateUser(authData, {
        onSuccess: async (session) => {
          try {
            const user = await this.getUserAttributes(this.cognitoUser!);
            resolve(user);
          } catch (error) {
            reject(error);
          }
        },
        onFailure: (err) => {
          this.cognitoUser = null;
          reject(this.handleAuthError(err));
        },
        newPasswordRequired: (userAttributes, requiredAttributes) => {
          // Don't attempt to change password here, just notify the UI
          reject(new Error('NEW_PASSWORD_REQUIRED'));
        },
        mfaRequired: (challengeName, challengeParameters) => {
          if (!credentials.mfaCode) {
            reject(new Error('MFA code required'));
            return;
          }

          this.cognitoUser!.sendMFACode(credentials.mfaCode, {
            onSuccess: async (session) => {
              try {
                const user = await this.getUserAttributes(this.cognitoUser!);
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
    if (this.cognitoUser) {
      this.cognitoUser.signOut();
    }
    this.cognitoUser = null;
    this.clearSessionRefresh();
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
          .then(async (user) => {
            // Check if MFA is enabled
            try {
              const mfaEnabled = await this.isMfaEnabled(cognitoUser);
              user.mfaEnabled = mfaEnabled;
            } catch (error) {
              console.error('Error checking MFA status:', error);
            }
            resolve(user);
          })
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
            case 'custom:prefname':
              user.preferredName = attr.getValue();
              break;
            case 'custom:preferred_name':
              user.preferredName = attr.getValue();
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

  private async isMfaEnabled(cognitoUser: CognitoUser): Promise<boolean> {
    return new Promise((resolve, reject) => {
      cognitoUser.getMFAOptions((err, mfaOptions) => {
        if (err) {
          reject(err);
          return;
        }
        
        // If MFA options exist and have at least one option, MFA is enabled
        resolve(!!mfaOptions && mfaOptions.length > 0);
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

  async updatePreferredName(preferredName: string): Promise<void> {
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

        const attributes = [
          new CognitoUserAttribute({
            Name: 'custom:prefname',
            Value: preferredName
          }),
          new CognitoUserAttribute({
            Name: 'custom:pref_name',
            Value: preferredName
          })
        ];

        cognitoUser.updateAttributes(attributes, (err) => {
          if (err) {
            reject(this.handleAuthError(err));
            return;
          }
          resolve();
        });
      });
    });
  }

  async signUp(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    preferredName?: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: userData.email
        }),
        new CognitoUserAttribute({
          Name: 'given_name',
          Value: userData.firstName
        }),
        new CognitoUserAttribute({
          Name: 'family_name',
          Value: userData.lastName
        })
      ];

      if (userData.preferredName) {
        attributeList.push(
          new CognitoUserAttribute({
            Name: 'custom:prefname',
            Value: userData.preferredName
          }),
          new CognitoUserAttribute({
            Name: 'custom:pref_name',
            Value: userData.preferredName
          })
        );
      }

      this.userPool.signUp(
        userData.email,
        userData.password,
        attributeList,
        [],
        (err, result) => {
          if (err) {
            reject(this.handleAuthError(err));
            return;
          }
          resolve();
        }
      );
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
    console.error('Auth service error:', {
      originalError: error,
      code: error.code,
      message: error.message,
      name: error.name,
      fullError: JSON.stringify(error, null, 2)
    });
    
    if (error.code === 'NotAuthorizedException') {
      if (error.message.includes('Password attempts exceeded')) {
        return new Error('Too many failed attempts. Please try again later.');
      }
      if (error.message.includes('Cannot modify an already provided email')) {
        return new Error('Unable to change password. Please try signing in again.');
      }
      return new Error('Invalid credentials');
    }
    if (error.code === 'UserNotFoundException') {
      return new Error('User not found');
    }
    if (error.code === 'CodeMismatchException') {
      return new Error('Invalid verification code');
    }
    if (error.code === 'PasswordResetRequiredException') {
      return new Error('Please sign in with your temporary password to set a new password');
    }
    if (error.code === 'UserNotConfirmedException') {
      return new Error('User not confirmed');
    }
    if (error.code === 'InvalidPasswordException') {
      return new Error('Password does not meet requirements. Password must have uppercase, lowercase, numbers, and special characters.');
    }
    if (error.code === 'LimitExceededException') {
      return new Error('Too many attempts. Please try again later.');
    }

    return new Error(error.message || 'An error occurred during authentication');
  }
}

export const authService = new AuthService(); 