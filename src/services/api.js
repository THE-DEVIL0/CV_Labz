const API_BASE_URL = 'https://delightful-passion-production.up.railway.app';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async fetchWithCredentials(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      credentials: 'include',
      headers: {
        // Only set Content-Type for non-FormData requests
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
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

  async apiCall(endpoint, options = {}) {
    return this.fetchWithCredentials(endpoint, options);
  }
}

const apiService = new ApiService();
export default apiService;