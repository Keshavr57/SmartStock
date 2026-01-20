// Inline API configuration to avoid import issues
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';

const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  GOOGLE: `${API_BASE_URL}/auth/google`,
  VERIFY: `${API_BASE_URL}/auth/verify`,
  REFRESH: `${API_BASE_URL}/auth/refresh`
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
  private refreshTimer: number | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    if (this.isInitialized) return;
    
    // Initialize from localStorage
    this.token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (userData) {
      try {
        this.user = JSON.parse(userData);
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    // If we have a token, verify it's still valid
    if (this.token) {
      const isValid = await this.verifyToken();
      if (!isValid) {
        this.logout();
      } else {
        // Set up auto-refresh for valid tokens
        this.setupTokenRefresh();
      }
    }

    this.isInitialized = true;
  }

  private async verifyToken(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(AUTH_ENDPOINTS.VERIFY, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        timeout: 5000 // 5 second timeout for quick verification
      } as RequestInit);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          this.user = data.user;
          localStorage.setItem('user', JSON.stringify(data.user));
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private setupTokenRefresh() {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh token every 6 days (before 7-day expiry)
    this.refreshTimer = window.setTimeout(() => {
      this.refreshToken();
    }, 6 * 24 * 60 * 60 * 1000); // 6 days
  }

  private async refreshToken(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(AUTH_ENDPOINTS.REFRESH, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.token) {
          this.setAuthData(data.token, data.user || this.user!);
          this.setupTokenRefresh(); // Setup next refresh
          return true;
        }
      }
      
      // If refresh fails, logout user
      this.logout();
      return false;
    } catch (error) {
      this.logout();
      return false;
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.error || errorData.message || `Server error: ${response.status}`,
          error: errorData.error || `HTTP ${response.status}`
        };
      }

      const data = await response.json();

      if (data.success && data.token && data.user) {
        this.setAuthData(data.token, data.user);
        this.setupTokenRefresh();
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Network error occurred. Please check your connection.',
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.error || errorData.message || `Server error: ${response.status}`,
          error: errorData.error || `HTTP ${response.status}`
        };
      }

      const data = await response.json();

      if (data.success && data.token && data.user) {
        this.setAuthData(data.token, data.user);
        this.setupTokenRefresh();
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Network error occurred. Please check your connection.',
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
        body: JSON.stringify({ token: credential }),
      });

      const data = await response.json();

      if (data.success && data.token && data.user) {
        this.setAuthData(data.token, data.user);
        this.setupTokenRefresh();
      }

      return data;
    } catch (error) {
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
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
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
      return {
        success: false,
        message: 'Network error occurred',
        error: 'Failed to update profile'
      };
    }
  }

  logout(): void {
    // Clear refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.setItem('isAuthenticated', 'false');
  }

  async isAuthenticated(): Promise<boolean> {
    // Ensure auth is initialized
    if (!this.isInitialized) {
      await this.initializeAuth();
    }
    
    // Quick check for token and user
    if (!this.token || !this.user) {
      return false;
    }

    // For performance, don't verify token on every call
    // Token verification happens during initialization and refresh
    return true;
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
    localStorage.setItem('lastLogin', new Date().toISOString());
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

  // Check if user needs to re-authenticate (for UX purposes)
  shouldPromptReauth(): boolean {
    const lastLogin = localStorage.getItem('lastLogin');
    if (!lastLogin) return true;

    const daysSinceLogin = (Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLogin > 7; // Prompt re-auth after 7 days
  }

  // Fast authentication check for app initialization
  async quickAuthCheck(): Promise<boolean> {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      return false;
    }

    try {
      this.token = token;
      this.user = JSON.parse(userData);
      this.setupTokenRefresh();
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;