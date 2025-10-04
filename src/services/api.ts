// API service for communicating with the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiService {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // Set auth token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Remove auth token
  removeToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Get headers with auth token
  getHeaders(includeAuth = true) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(options.method !== 'GET'),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData: { email: string; password: string; name: string }) {
    const response = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async logout() {
    this.removeToken();
    // Optionally call backend logout endpoint if you implement one
  }

  async getProfile() {
    return this.request('/api/auth/profile');
  }

  async verifyToken() {
    if (!this.token) {
      throw new Error('No token available');
    }
    
    return this.request('/api/auth/verify');
  }

  // User data methods
  async getLedgerData() {
    return this.request('/api/user-data/ledger');
  }

  async saveLedgerData(data: {
    books: any[];
    transactions: any[];
    selectedBookId: string | null;
  }) {
    return this.request('/api/user-data/ledger', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createBackup() {
    return this.request('/api/user-data/backup', {
      method: 'POST',
    });
  }

  async getBackups() {
    return this.request('/api/user-data/backups');
  }

  async restoreFromBackup(backupId: string) {
    return this.request(`/api/user-data/restore/${backupId}`, {
      method: 'POST',
    });
  }

  async deleteAccount(password: string) {
    return this.request('/api/user-data/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  }
}

export const apiService = new ApiService();