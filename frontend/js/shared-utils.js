/**
 * Shared Utility Functions for BloodConnect
 * Contains common functionality used across both user profile and admin dashboard
 */

// Debug logging function
function debugLog(message, context = 'SharedUtils') {
    console.log(`[${context}] ${message}`);
}

// Generic API call function
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Authentication utilities
const AuthUtils = {
    // Get authentication token (handles both user and admin)
    getToken() {
        // Check for user tokens first
        const userToken = localStorage.getItem('token') || localStorage.getItem('bloodconnect_token');
        if (userToken) return userToken;
        
        // Check for admin token
        const adminStatus = localStorage.getItem('bloodconnect_admin');
        if (adminStatus === 'true') {
            return 'admin-token'; // Placeholder, actual admin auth is header-based
        }
        
        return null;
    },
    
    // Clear authentication data
    clearAuthData(isAdmin = false) {
        if (isAdmin) {
            // Clear admin-specific data
            const adminKeys = [
                'bloodconnect_admin',
                'admin_email',
                'admin_login_time',
                'admin_session',
                'admin_preferences',
                'admin_last_activity'
            ];
            
            // Clear from both localStorage and sessionStorage
            const storages = [localStorage, sessionStorage];
            storages.forEach(storage => {
                adminKeys.forEach(key => {
                    if (storage.getItem(key)) {
                        storage.removeItem(key);
                        debugLog(`Cleared ${key} from ${storage === localStorage ? 'localStorage' : 'sessionStorage'}`, 'AuthUtils');
                    }
                });
            });
            
            debugLog('All admin authentication data cleared', 'AuthUtils');
        } else {
            // Clear user-specific data
            const userKeys = [
                'token',
                'bloodconnect_token',
                'bloodconnect_user',
                'currentUser',
                'user'
            ];
            
            userKeys.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    debugLog(`Cleared ${key} from localStorage`, 'AuthUtils');
                }
            });
            
            debugLog('All user authentication data cleared', 'AuthUtils');
        }
    },
    
    // Check if user is authenticated
    isAuthenticated(isAdmin = false) {
        if (isAdmin) {
            return localStorage.getItem('bloodconnect_admin') === 'true';
        } else {
            return !!(localStorage.getItem('token') || localStorage.getItem('bloodconnect_token'));
        }
    }
};

// Data formatting utilities
const DataUtils = {
    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleDateString();
    },
    
    // Format blood group display
    formatBloodGroup(bloodGroup) {
        return bloodGroup || 'Not specified';
    },
    
    // Format location
    formatLocation(city, state) {
        if (city && state) return `${city}, ${state}`;
        if (city) return city;
        if (state) return state;
        return 'Not specified';
    },
    
    // Format status badge
    formatStatus(status) {
        const statusMap = {
            'completed': 'status-active',
            'pending': 'status-pending',
            'cancelled': 'status-cancelled',
            'available': 'status-active',
            'unavailable': 'status-cancelled'
        };
        
        return statusMap[status.toLowerCase()] || 'status-pending';
    }
};

// UI utilities
const UIUtils = {
    // Show loading state
    showLoading(containerId, message = 'Loading...') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    },
    
    // Show empty state
    showEmptyState(containerId, title, message, icon = 'fas fa-info-circle') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="${icon}" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>${title}</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    },
    
    // Show error state
    showErrorState(containerId, title, message, onRetry = null) {
        const container = document.getElementById(containerId);
        if (container) {
            const retryButton = onRetry ? 
                `<button class="btn btn-primary" onclick="${onRetry}" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i>
                    Retry
                </button>` : '';
                
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error-color, #dc3545); margin-bottom: 1rem;"></i>
                    <h3>${title}</h3>
                    <p>${message}</p>
                    ${retryButton}
                </div>
            `;
        }
    }
};

// Export utilities
window.SharedUtils = {
    debugLog,
    apiCall,
    AuthUtils,
    DataUtils,
    UIUtils
};