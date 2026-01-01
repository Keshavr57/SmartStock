// Inline API configuration to avoid import issues
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';

const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  GOOGLE: `${API_BASE_URL}/auth/google`,
  VERIFY: `${API_BASE_URL}/auth/verify`
};

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  virtualBalance: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  error?: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Initialize from localStorage
    this.token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        this.user = JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
      }
    }
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(AUTH_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (data.success && data.token && data.user) {
        this.setAuthData(data.token, data.user);
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Network error occurred',
        error: 'Failed to connect to server'
      };
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.token && data.user) {
        this.setAuthData(data.token, data.user);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error occurred',
        error: 'Failed to connect to server'
      };
    }
  }

  async googleLogin(credential: string): Promise<AuthResponse> {
    try {
      const response = await fetch(AUTH_ENDPOINTS.GOOGLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json();

      if (data.success && data.token && data.user) {
        this.setAuthData(data.token, data.user);
      }

      return data;
    } catch (error) {
      console.error('Google login error:', error);
      return {
        success: false,
        message: 'Google authentication failed',
        error: 'Failed to authenticate with Google'
      };
    }
  }

  async getProfile(): Promise<User | null> {
    if (!this.token) return null;

    try {
      const response = await fetch(AUTH_ENDPOINTS.VERIFY, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.user) {
        this.user = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
      }

      return null;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  }

  async updateProfile(updates: Partial<User>): Promise<AuthResponse> {
    if (!this.token) {
      return {
        success: false,
        message: 'Not authenticated',
        error: 'No authentication token'
      };
    }

    try {
      const response = await fetch(AUTH_ENDPOINTS.VERIFY, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success && data.user) {
        this.user = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        message: 'Network error occurred',
        error: 'Failed to update profile'
      };
    }
  }

  logout(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.setItem('isAuthenticated', 'false');
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  private setAuthData(token: string, user: User): void {
    this.token = token;
    this.user = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
  }

  // Helper method to get authorization headers
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;