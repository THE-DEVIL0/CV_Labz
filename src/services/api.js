const API_BASE_URL = 'https://delightful-passion-production.up.railway.app';


class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic fetch wrapper with credentials
  async fetchWithCredentials(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      credentials: 'include', // This is crucial for cookie handling
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return { data, status: response.status };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials) {
    return this.fetchWithCredentials('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    return this.fetchWithCredentials('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.fetchWithCredentials('/logout', {
      method: 'POST',
    });
  }

  async checkSession() {
    return this.fetchWithCredentials('/session', {
      method: 'GET',
    });
  }

  // Generic API call for other endpoints
  async apiCall(endpoint, options = {}) {
    return this.fetchWithCredentials(endpoint, options);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService; 