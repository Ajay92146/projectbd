/**
 * Blood Donation Website - API Communication
 * Handles all API calls and data management
 */

// API Configuration - Dynamic URL detection
const getAPIBaseURL = () => {
    // Check if we're in development (localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3002/api';
    }

    // For production, use the same domain as the frontend
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    // If frontend is served from a different port, adjust accordingly
    if (port && port !== '80' && port !== '443') {
        // Assume backend is on port 3002 or same domain with /api path
        return `${protocol}//${hostname}/api`;
    }

    return `${protocol}//${hostname}/api`;
};

const API_CONFIG = {
    baseURL: getAPIBaseURL(),
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000
};

// API Client Class
class APIClient {
    constructor(config = API_CONFIG) {
        this.baseURL = config.baseURL;
        this.timeout = config.timeout;
        this.retryAttempts = config.retryAttempts;
        this.retryDelay = config.retryDelay;
        this.token = this.getStoredToken();
    }
    
    /**
     * Get stored authentication token
     * @returns {string|null} - Authentication token
     */
    getStoredToken() {
        return localStorage.getItem('bloodconnect_token');
    }
    
    /**
     * Set authentication token
     * @param {string} token - Authentication token
     */
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('bloodconnect_token', token);
        } else {
            localStorage.removeItem('bloodconnect_token');
        }
    }
    
    /**
     * Get default headers for requests
     * @returns {Object} - Headers object
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }
    
    /**
     * Make HTTP request with retry logic
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @param {number} attempt - Current attempt number
     * @returns {Promise} - Response promise
     */
    async makeRequest(url, options = {}, attempt = 1) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const response = await fetch(`${this.baseURL}${url}`, {
                ...options,
                headers: {
                    ...this.getHeaders(),
                    ...options.headers
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.handleUnauthorized();
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (attempt < this.retryAttempts && this.shouldRetry(error)) {
                await this.delay(this.retryDelay * attempt);
                return this.makeRequest(url, options, attempt + 1);
            }
            
            throw error;
        }
    }
    
    /**
     * Check if request should be retried
     * @param {Error} error - Request error
     * @returns {boolean} - Whether to retry
     */
    shouldRetry(error) {
        return error.name === 'AbortError' || 
               error.message.includes('fetch') ||
               error.message.includes('network');
    }
    
    /**
     * Delay execution
     * @param {number} ms - Delay in milliseconds
     * @returns {Promise} - Delay promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Handle unauthorized responses
     */
    handleUnauthorized() {
        this.setToken(null);
        localStorage.removeItem('bloodconnect_user');

        // Only redirect to login if we're on a protected page (not home page)
        const currentPath = window.location.pathname;
        const isHomePage = currentPath === '/' || currentPath.includes('/index.html') || currentPath === '';
        const isLoginPage = currentPath.includes('/login');

        // Don't redirect if we're already on home page or login page
        if (!isHomePage && !isLoginPage) {
            window.location.href = '/login.html';
        }
    }
    
    // HTTP Methods
    
    /**
     * GET request
     * @param {string} url - Request URL
     * @param {Object} params - Query parameters
     * @returns {Promise} - Response promise
     */
    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        
        return this.makeRequest(fullUrl, {
            method: 'GET'
        });
    }
    
    /**
     * POST request
     * @param {string} url - Request URL
     * @param {Object} data - Request body data
     * @returns {Promise} - Response promise
     */
    async post(url, data = {}) {
        return this.makeRequest(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    /**
     * PUT request
     * @param {string} url - Request URL
     * @param {Object} data - Request body data
     * @returns {Promise} - Response promise
     */
    async put(url, data = {}) {
        return this.makeRequest(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    /**
     * DELETE request
     * @param {string} url - Request URL
     * @returns {Promise} - Response promise
     */
    async delete(url) {
        return this.makeRequest(url, {
            method: 'DELETE'
        });
    }
}

// API Service Classes

/**
 * Donor API Service
 */
class DonorService {
    constructor(apiClient) {
        this.api = apiClient;
    }
    
    /**
     * Register new donor
     * @param {Object} donorData - Donor registration data
     * @returns {Promise} - Registration response
     */
    async register(donorData) {
        return this.api.post('/donors', donorData);
    }
    
    /**
     * Search donors
     * @param {Object} searchParams - Search parameters
     * @returns {Promise} - Search results
     */
    async search(searchParams) {
        return this.api.get('/donors/search', searchParams);
    }
    
    /**
     * Get all donors
     * @param {Object} params - Query parameters
     * @returns {Promise} - Donors list
     */
    async getAll(params = {}) {
        return this.api.get('/donors', params);
    }
    
    /**
     * Get donor statistics
     * @returns {Promise} - Statistics data
     */
    async getStats() {
        return this.api.get('/donors/stats');
    }
}

/**
 * Blood Request API Service
 */
class RequestService {
    constructor(apiClient) {
        this.api = apiClient;
    }
    
    /**
     * Submit blood request
     * @param {Object} requestData - Blood request data
     * @returns {Promise} - Request response
     */
    async submit(requestData) {
        return this.api.post('/requests', requestData);
    }
    
    /**
     * Search blood requests
     * @param {Object} searchParams - Search parameters
     * @returns {Promise} - Search results
     */
    async search(searchParams) {
        return this.api.get('/requests/search', searchParams);
    }
    
    /**
     * Get all requests
     * @param {Object} params - Query parameters
     * @returns {Promise} - Requests list
     */
    async getAll(params = {}) {
        return this.api.get('/requests', params);
    }
    
    /**
     * Get urgent requests
     * @returns {Promise} - Urgent requests
     */
    async getUrgent() {
        return this.api.get('/requests/urgent');
    }
    
    /**
     * Get request statistics
     * @returns {Promise} - Statistics data
     */
    async getStats() {
        return this.api.get('/requests/stats');
    }
}

/**
 * Authentication API Service
 */
class AuthService {
    constructor(apiClient) {
        this.api = apiClient;
    }
    
    /**
     * User login
     * @param {Object} credentials - Login credentials
     * @returns {Promise} - Login response
     */
    async login(credentials) {
        const response = await this.api.post('/auth/login', credentials);
        
        if (response.success && response.data.token) {
            this.api.setToken(response.data.token);
            localStorage.setItem('bloodconnect_user', JSON.stringify(response.data.user));
        }
        
        return response;
    }
    
    /**
     * User registration
     * @param {Object} userData - Registration data
     * @returns {Promise} - Registration response
     */
    async register(userData) {
        const response = await this.api.post('/auth/register', userData);

        // Don't auto-login after registration
        // User needs to login manually after registration

        return response;
    }
    
    /**
     * User logout
     * @returns {Promise} - Logout response
     */
    async logout() {
        try {
            await this.api.post('/auth/logout');
        } catch (error) {
            console.warn('Logout API call failed:', error);
        } finally {
            this.api.setToken(null);
            localStorage.removeItem('bloodconnect_user');
        }
    }
    
    /**
     * Get user profile
     * @returns {Promise} - Profile data
     */
    async getProfile() {
        return this.api.get('/auth/profile');
    }
    
    /**
     * Update user profile
     * @param {Object} profileData - Profile update data
     * @returns {Promise} - Update response
     */
    async updateProfile(profileData) {
        const response = await this.api.put('/auth/profile', profileData);

        // Update local user data if successful
        if (response.success && response.data.user) {
            localStorage.setItem('bloodconnect_user', JSON.stringify(response.data.user));
        }

        return response;
    }

    /**
     * Change user password
     * @param {Object} passwordData - Password change data
     * @returns {Promise} - Change password response
     */
    async changePassword(passwordData) {
        return this.api.put('/auth/change-password', passwordData);
    }
    
    /**
     * Check if user is authenticated
     * @returns {boolean} - Authentication status
     */
    isAuthenticated() {
        return !!this.api.token && !!localStorage.getItem('bloodconnect_user');
    }
    
    /**
     * Get current user data
     * @returns {Object|null} - User data
     */
    getCurrentUser() {
        const userData = localStorage.getItem('bloodconnect_user');
        return userData ? JSON.parse(userData) : null;
    }
}

/**
 * Profile Management API Service
 */
class ProfileService {
    constructor(apiClient) {
        this.api = apiClient;
    }

    /**
     * Get user dashboard data
     * @returns {Promise} - Dashboard data
     */
    async getDashboard() {
        return this.api.get('/profile/dashboard');
    }

    /**
     * Get user donations
     * @param {Object} params - Query parameters
     * @returns {Promise} - Donations data
     */
    async getDonations(params = {}) {
        return this.api.get('/profile/donations', params);
    }

    /**
     * Add new donation record
     * @param {Object} donationData - Donation data
     * @returns {Promise} - Add donation response
     */
    async addDonation(donationData) {
        return this.api.post('/profile/donations', donationData);
    }

    /**
     * Get user blood requests
     * @param {Object} params - Query parameters
     * @returns {Promise} - Requests data
     */
    async getRequests(params = {}) {
        return this.api.get('/profile/requests', params);
    }

    /**
     * Get user settings
     * @returns {Promise} - Settings data
     */
    async getSettings() {
        return this.api.get('/profile/settings');
    }

    /**
     * Update user settings
     * @param {Object} settingsData - Settings data
     * @returns {Promise} - Update response
     */
    async updateSettings(settingsData) {
        return this.api.put('/profile/settings', settingsData);
    }
}

// Initialize API services
const apiClient = new APIClient();
const donorService = new DonorService(apiClient);
const requestService = new RequestService(apiClient);
const authService = new AuthService(apiClient);
const profileService = new ProfileService(apiClient);

// Global API object
window.API = {
    client: apiClient,
    donors: donorService,
    requests: requestService,
    auth: authService,
    profile: profileService
};

// Utility functions for API integration

/**
 * Handle API errors globally
 * @param {Error} error - API error
 * @param {string} context - Error context
 */
function handleAPIError(error, context = 'API call') {
    console.error(`${context} failed:`, error);
    
    let message = 'An unexpected error occurred. Please try again.';
    
    if (error.message.includes('fetch')) {
        message = 'Network error. Please check your internet connection.';
    } else if (error.message.includes('401')) {
        message = 'Authentication required. Please log in.';
    } else if (error.message.includes('403')) {
        message = 'Access denied. You do not have permission for this action.';
    } else if (error.message.includes('404')) {
        message = 'Resource not found.';
    } else if (error.message.includes('500')) {
        message = 'Server error. Please try again later.';
    }
    
    // Show error modal if available
    if (window.BloodConnect && window.BloodConnect.showModal) {
        window.BloodConnect.showModal('Error', message, 'error');
    } else {
        alert(message);
    }
}

/**
 * Show loading state for API calls
 * @param {boolean} loading - Loading state
 * @param {string} message - Loading message
 */
function showLoadingState(loading, message = 'Loading...') {
    const loadingElement = document.getElementById('loading');
    
    if (loadingElement) {
        if (loading) {
            loadingElement.textContent = message;
            loadingElement.style.display = 'block';
        } else {
            loadingElement.style.display = 'none';
        }
    }
}

/**
 * Cache API responses
 */
class APICache {
    constructor(ttl = 5 * 60 * 1000) { // 5 minutes default TTL
        this.cache = new Map();
        this.ttl = ttl;
    }
    
    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }
    
    clear() {
        this.cache.clear();
    }
}

// Initialize API cache
const apiCache = new APICache();

// Export for use in other files
window.APICache = APICache;
window.apiCache = apiCache;
window.handleAPIError = handleAPIError;
window.showLoadingState = showLoadingState;
