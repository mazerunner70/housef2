import { CognitoUser, AuthenticationDetails, CognitoUserPool } from 'amazon-cognito-identity-js';

export class API {
  private baseUrl: string;
  private userPool: CognitoUserPool;
  private cognitoUser: CognitoUser | null = null;

  constructor() {
    // Use the API URL from environment variables and ensure it ends with /api
    const apiUrl = process.env.REACT_APP_API_URL || '';
    this.baseUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
    console.log('Using API URL:', this.baseUrl);

    // Initialize Cognito User Pool
    this.userPool = new CognitoUserPool({
      UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || '',
      ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID || ''
    });

    // Try to get current user
    this.cognitoUser = this.userPool.getCurrentUser();
  }

  /**
   * Get authentication token from current session
   */
  private async getAuthToken(): Promise<string | null> {
    if (!this.cognitoUser) {
      console.warn('No Cognito user found');
      return null;
    }

    return new Promise((resolve, reject) => {
      this.cognitoUser?.getSession((err: any, session: any) => {
        if (err) {
          console.error('Error getting session:', err);
          reject(err);
          return;
        }

        if (!session.isValid()) {
          console.error('Session is not valid');
          reject(new Error('Invalid session'));
          return;
        }

        const token = session.getIdToken().getJwtToken();
        resolve(token);
      });
    });
  }

  /**
   * Get authentication headers for API requests
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    try {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth headers:', error);
    }

    return headers;
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
      
      console.log('Making GET request to:', url);
      const headers = await this.getAuthHeaders();
      
      console.log('Request headers:', {
        ...headers,
        'Authorization': headers.Authorization ? '[REDACTED]' : undefined
      });

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

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
        headers
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