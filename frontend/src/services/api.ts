import { authService } from './auth';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { Sha256 } from '@aws-crypto/sha256-js';

export class API {
  private baseUrl: string;
  private region: string;

  constructor(baseUrl?: string) {
    this.region = window.env?.REACT_APP_AWS_REGION || 'eu-west-2';
    
    // Always use the proxy
    this.baseUrl = '/api';
    console.log('Using webpack dev server proxy at /api');
  }

  /**
   * Get authentication headers for API requests
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      // Basic headers that are always included
      const baseHeaders = {
        'Content-Type': 'application/json',
      };

      // Get current user from auth service
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        console.warn('No current user found');
        return baseHeaders;
      }

      // Get current user session
      const cognitoUser = window.userPool?.getCurrentUser();
      if (!cognitoUser) {
        console.warn('No Cognito user found in session');
        return baseHeaders;
      }

      return new Promise((resolve, reject) => {
        cognitoUser.getSession(async (err: any, session: any) => {
          if (err) {
            console.error('Error getting session:', err);
            resolve(baseHeaders);
            return;
          }

          if (!session?.isValid()) {
            console.warn('Session is not valid');
            resolve(baseHeaders);
            return;
          }

          try {
            // Get the ID token
            const idToken = session.getIdToken().getJwtToken();
            
            // Use ID token for authorization
            const headers = {
              ...baseHeaders,
              'Authorization': `Bearer ${idToken}`
            };

            console.log('Request headers:', {
              ...headers,
              'Authorization': headers.Authorization ? 'Bearer [token]' : 'none'
            });

            resolve(headers);
          } catch (error) {
            console.error('Error getting ID token:', error);
            resolve(baseHeaders);
          }
        });
      });
    } catch (error) {
      console.error('Error in getAuthHeaders:', error);
      return { 'Content-Type': 'application/json' };
    }
  }

  /**
   * Send a GET request
   * @param path - The API path (without leading slash)
   */
  async get(path: string): Promise<any> {
    try {
      // Ensure path doesn't start with a slash
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      const url = `${this.baseUrl}/${cleanPath}`;
      
      console.log(`Making GET request to: ${url}`);
      const headers = await this.getAuthHeaders();
      console.log('Headers for request:', headers);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      // Log response status
      console.log(`Response status: ${response.status} for ${url}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          console.error('Authentication error (403 Forbidden). Please check authentication setup.');
        } else if (response.status === 404) {
          console.error(`Resource not found at ${url}`);
        }
        
        const errorText = await response.text();
        console.error(`API error (${response.status}): ${errorText}`);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`GET request failed for ${path}:`, error);
      throw error;
    }
  }

  /**
   * Send a POST request
   * @param path - The API path (without leading slash)
   * @param data - The data to send
   */
  async post(path: string, data: any): Promise<any> {
    try {
      // Ensure path doesn't start with a slash
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      const url = `${this.baseUrl}/${cleanPath}`;
      
      console.log(`Making POST request to: ${url}`);
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}): ${errorText}`);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`POST request failed for ${path}:`, error);
      throw error;
    }
  }

  /**
   * Send a PUT request
   * @param path - The API path (without leading slash)
   * @param data - The data to send
   */
  async put(path: string, data: any): Promise<any> {
    try {
      // Ensure path doesn't start with a slash
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      const url = `${this.baseUrl}/${cleanPath}`;
      
      console.log(`Making PUT request to: ${url}`);
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}): ${errorText}`);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`PUT request failed for ${path}:`, error);
      throw error;
    }
  }

  /**
   * Send a DELETE request
   * @param path - The API path (without leading slash)
   */
  async delete(path: string): Promise<any> {
    try {
      // Ensure path doesn't start with a slash
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      const url = `${this.baseUrl}/${cleanPath}`;
      
      console.log(`Making DELETE request to: ${url}`);
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}): ${errorText}`);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`DELETE request failed for ${path}:`, error);
      throw error;
    }
  }
} 