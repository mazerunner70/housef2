import { authService } from './auth';

export class API {
  private baseUrl: string;

  constructor() {
    this.baseUrl = window.env?.REACT_APP_API_URL || '';
    if (!this.baseUrl) {
      console.warn('API URL not found in environment variables');
    }
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    try {
      // Get the current user session to include the token
      const user = await authService.getCurrentUser();
      const session = await new Promise<any>((resolve, reject) => {
        const cognitoUser = authService['userPool'].getCurrentUser();
        if (!cognitoUser) {
          reject(new Error('No user found'));
          return;
        }
        
        cognitoUser.getSession((err: Error | null, session: any) => {
          if (err || !session) {
            reject(err || new Error('Invalid session'));
            return;
          }
          resolve(session);
        });
      });

      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.getIdToken().getJwtToken()}`
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return {
        'Content-Type': 'application/json'
      };
    }
  }

  async get(endpoint: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async post(endpoint: string, data: any): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async put(endpoint: string, data: any): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async delete(endpoint: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
} 