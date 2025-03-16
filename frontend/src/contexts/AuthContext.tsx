import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AuthUser, AuthCredentials } from '../services/auth';

interface User {
  id: string;
  name: string;
  email: string;
  accountId: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string, mfaCode?: string, newPassword?: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  setupMFA: () => Promise<string>;
  verifyMFA: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from AWS Cognito
    const loadUser = async () => {
      try {
        setLoading(true);
        const cognitoUser = await authService.getCurrentUser();
        
        if (cognitoUser) {
          // Map Cognito user to our User interface
          setCurrentUser({
            id: cognitoUser.id,
            name: cognitoUser.preferredName || `${cognitoUser.firstName} ${cognitoUser.lastName}`,
            email: cognitoUser.email,
            accountId: cognitoUser.id // Using user ID as account ID for now
          });
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string, mfaCode?: string, newPassword?: string) => {
    setLoading(true);
    try {
      // Call AWS Cognito to sign in
      const cognitoUser = await authService.signIn({
        email,
        password,
        mfaCode,
        newPassword
      });
      
      // Map Cognito user to our User interface
      setCurrentUser({
        id: cognitoUser.id,
        name: cognitoUser.preferredName || `${cognitoUser.firstName} ${cognitoUser.lastName}`,
        email: cognitoUser.email,
        accountId: cognitoUser.id // Using user ID as account ID for now
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    try {
      // Call AWS Cognito to sign up
      await authService.signUp(userData);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Call AWS Cognito to sign out
      await authService.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Call AWS Cognito to initiate password reset
      await authService.forgotPassword(email);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  };

  const confirmPasswordReset = async (email: string, code: string, newPassword: string) => {
    try {
      // Call AWS Cognito to reset password
      await authService.resetPassword(email, code, newPassword);
    } catch (error) {
      console.error('Password reset confirmation failed:', error);
      throw error;
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      if (userData.name) {
        // Call AWS Cognito to update preferred name
        await authService.updatePreferredName(userData.name);
        
        if (currentUser) {
          setCurrentUser({ ...currentUser, ...userData });
        }
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const setupMFA = async (): Promise<string> => {
    try {
      // Call AWS Cognito to set up MFA
      return await authService.setupMFA();
    } catch (error) {
      console.error('MFA setup failed:', error);
      throw error;
    }
  };

  const verifyMFA = async (code: string): Promise<void> => {
    try {
      // Call AWS Cognito to verify MFA
      await authService.verifyMFA(code);
    } catch (error) {
      console.error('MFA verification failed:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    resetPassword,
    confirmPasswordReset,
    updateProfile,
    setupMFA,
    verifyMFA
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 