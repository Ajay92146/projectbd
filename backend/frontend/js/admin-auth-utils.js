/**
 * Admin Authentication Utility Functions
 * Consolidated authentication functions to eliminate duplication
 */

// Debug logging function
function debugLog(message) {
    console.log(`[AdminAuth] ${message}`);
}

// Get API base URL function
window.getAPIBaseURL = function() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//${hostname}:3002/api`;
    }
    return `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
}

// Get admin authentication headers
window.getAdminAuthHeaders = function() {
    const adminEmail = localStorage.getItem('admin_email') || sessionStorage.getItem('admin_email');
    return {
        'Content-Type': 'application/json',
        'x-admin-email': adminEmail || '',
        'x-admin-auth': 'true'
    };
}

// Enhanced session management
class AdminSessionManager {
    constructor() {
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes in milliseconds
        this.lastActivity = Date.now();
        this.checkInterval = 60 * 1000; // Check every minute
    }
    
    // Start session monitoring
    startSession() {
        this.lastActivity = Date.now();
        this.setupActivityListeners();
        this.startSessionChecker();
    }
    
    // Set up activity listeners
    setupActivityListeners() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.updateLastActivity();
            }, { passive: true });
        });
    }
    
    // Update last activity timestamp
    updateLastActivity() {
        this.lastActivity = Date.now();
        // Update in storage as well
        const storage = this.getStorageType();
        if (storage) {
            storage.setItem('admin_last_activity', this.lastActivity.toString());
        }
    }
    
    // Get storage type (localStorage or sessionStorage)
    getStorageType() {
        if (localStorage.getItem('bloodconnect_admin') === 'true') {
            return localStorage;
        } else if (sessionStorage.getItem('bloodconnect_admin') === 'true') {
            return sessionStorage;
        }
        return null;
    }
    
    // Start session checker
    startSessionChecker() {
        setInterval(() => {
            this.checkSessionTimeout();
        }, this.checkInterval);
    }
    
    // Check if session has timed out
    checkSessionTimeout() {
        const now = Date.now();
        const storage = this.getStorageType();
        
        if (storage) {
            const loginTime = storage.getItem('admin_login_time');
            if (loginTime) {
                const loginDate = new Date(loginTime);
                const sessionAge = now - loginDate.getTime();
                
                // Check if session has expired (30 minutes)
                if (sessionAge > this.sessionTimeout) {
                    debugLog('⏰ Session expired, logging out...');
                    if (window.AdminUtils && window.AdminUtils.showNotification) {
                        AdminUtils.showNotification('Session expired. Please log in again.', 'error');
                    }
                    this.logout();
                    return;
                }
            }
        }
    }
    
    // Logout function
    async logout() {
        try {
            // Call server-side logout endpoint
            const apiUrl = `${getAPIBaseURL()}/admin/logout`;
            await fetch(apiUrl, {
                method: 'POST',
                headers: getAdminAuthHeaders()
            });
        } catch (error) {
            debugLog(`⚠️ Server logout failed: ${error.message}`);
        } finally {
            // Clear local session data
            this.clearSession();
            
            // Redirect to login page
            window.location.href = 'admin-login.html';
        }
    }
    
    // Clear session data
    clearSession() {
        const storages = [localStorage, sessionStorage];
        const keysToRemove = [
            'bloodconnect_admin',
            'admin_email',
            'admin_login_time',
            'admin_last_activity',
            'admin_preferences'
        ];
        
        storages.forEach(storage => {
            keysToRemove.forEach(key => {
                if (storage.getItem(key)) {
                    storage.removeItem(key);
                }
            });
        });
    }
    
    // Check if user is authenticated
    isAuthenticated() {
        const adminStatus = localStorage.getItem('bloodconnect_admin') || sessionStorage.getItem('bloodconnect_admin');
        return adminStatus === 'true';
    }
    
    // Get admin email
    getAdminEmail() {
        return localStorage.getItem('admin_email') || sessionStorage.getItem('admin_email');
    }
}

// Create session manager instance
const sessionManager = new AdminSessionManager();

// Check admin authentication status
function checkAdminAuthentication() {
    debugLog('🔍 Checking admin authentication...');
    
    // Get admin status from localStorage or sessionStorage
    const adminStatus = localStorage.getItem('bloodconnect_admin') || sessionStorage.getItem('bloodconnect_admin');
    const adminEmail = localStorage.getItem('admin_email') || sessionStorage.getItem('admin_email');
    const adminLoginTime = localStorage.getItem('admin_login_time') || sessionStorage.getItem('admin_login_time');
    
    debugLog(`📱 Admin status: ${adminStatus}`);
    debugLog(`📧 Admin email: ${adminEmail}`);
    debugLog(`🕒 Admin login time: ${adminLoginTime}`);
    debugLog(`🌐 Current URL: ${window.location.href}`);
    
    // Check if admin is authenticated
    if (adminStatus !== 'true') {
        debugLog('❌ Not authenticated as admin, redirecting to login...');
        // Add delay to ensure any ongoing localStorage operations complete
        setTimeout(() => {
            window.location.href = 'admin-login.html';
        }, 100);
        return false;
    }
    
    // Start session monitoring
    sessionManager.startSession();
    
    debugLog('✅ Admin authenticated successfully!');
    return true;
}

// Process admin login
async function processAdminLogin(email, password, rememberMe) {
    debugLog('🔐 Starting admin login process...');
    debugLog(`📧 Email: ${email}`);
    debugLog(`💾 Remember me: ${rememberMe}`);
    
    const loginBtn = document.getElementById('adminLoginBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // Hide previous messages
    if (errorMessage) errorMessage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';

    // Show loading state
    if (loginBtn) loginBtn.disabled = true;
    if (loadingSpinner) loadingSpinner.classList.add('active');

    try {
        // Call backend API for admin authentication
        debugLog('🔍 Calling backend API for authentication...');
        const apiUrl = `${getAPIBaseURL()}/admin/login`;
        debugLog(`API URL: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // Note: We don't send admin auth headers for login since we're not authenticated yet
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        debugLog(`Response status: ${response.status}`);
        const data = await response.json();
        debugLog('Response data:', data);
        
        if (response.ok && data.success) {
            debugLog('✅ Admin credentials are correct!');
            
            // Store admin session with verification
            try {
                // Clear any existing admin data first
                localStorage.removeItem('bloodconnect_admin');
                localStorage.removeItem('admin_email');
                localStorage.removeItem('admin_login_time');
                sessionStorage.removeItem('bloodconnect_admin');
                sessionStorage.removeItem('admin_email');
                sessionStorage.removeItem('admin_login_time');
                
                // Set new admin session data based on remember me preference
                const storage = rememberMe ? localStorage : sessionStorage;
                storage.setItem('bloodconnect_admin', 'true');
                storage.setItem('admin_email', email);
                storage.setItem('admin_login_time', new Date().toISOString());
                
                // Verify storage was successful
                const storedStatus = storage.getItem('bloodconnect_admin');
                const storedEmail = storage.getItem('admin_email');
                
                debugLog(`💾 Stored admin status: ${storedStatus}`);
                debugLog(`💾 Stored admin email: ${storedEmail}`);
                
                if (storedStatus === 'true' && storedEmail === email) {
                    debugLog('✅ LocalStorage verification successful!');
                    
                    // Show success message
                    if (successMessage) {
                        successMessage.textContent = 'Login successful! Redirecting to dashboard...';
                        successMessage.style.display = 'block';
                    }
                    
                    // Start session monitoring
                    sessionManager.startSession();
                    
                    // Redirect with delay to ensure storage is committed
                    setTimeout(() => {
                        debugLog('🚀 Redirecting to admin dashboard...');
                        window.location.href = 'admin-dashboard.html';
                    }, 2000);
                    
                } else {
                    throw new Error('Failed to store admin session in storage');
                }
            } catch (storageError) {
                debugLog(`❌ Storage error: ${storageError.message}`);
                throw new Error('Session storage failed. Please try again.');
            }
            
        } else {
            debugLog('❌ Invalid admin credentials or API error');
            throw new Error(data.message || 'Invalid admin credentials. Please try again.');
        }
        
    } catch (error) {
        debugLog(`❌ Login failed: ${error.message}`);
        
        // Show error message
        if (errorMessage) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        }
        
        // Clear password field
        const passwordInput = document.getElementById('adminPassword');
        if (passwordInput) passwordInput.value = '';
        
    } finally {
        // Reset loading state
        if (loginBtn) loginBtn.disabled = false;
        if (loadingSpinner) loadingSpinner.classList.remove('active');
    }
}

// Server-side logout call with activity logging
async function logoutFromServer() {
    try {
        // Log the logout activity first
        await logAdminActivity('logout', 'Admin logout initiated');
        
        const apiUrl = `${getAPIBaseURL()}/admin/logout`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: getAdminAuthHeaders()
        });
        
        if (response.ok) {
            debugLog('✅ Server logout completed');
        } else {
            debugLog('⚠️ Server logout response not OK');
        }
    } catch (error) {
        debugLog(`❌ Server logout error: ${error.message}`);
        throw error;
    }
}

// Log admin activity
async function logAdminActivity(action, details) {
    try {
        const apiUrl = `${getAPIBaseURL()}/admin/activity-log`;
        
        const activityData = {
            action: action,
            details: details,
            timestamp: new Date().toISOString(),
            adminEmail: sessionManager.getAdminEmail() || 'unknown'
        };
        
        await fetch(apiUrl, {
            method: 'POST',
            headers: {
                ...getAdminAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(activityData)
        });
        
        debugLog(`📝 Activity logged: ${action}`);
    } catch (error) {
        debugLog(`⚠️ Failed to log activity: ${error.message}`);
    }
}

// Admin logout function
async function logoutAdmin() {
    debugLog('🚪 Logout button clicked');
    
    // Log activity before logout
    logAdminActivity('logout', 'Admin logged out');
    
    // Create a more reliable confirmation dialog
    const confirmLogout = window.confirm('Are you sure you want to logout from the admin dashboard?');
    
    if (confirmLogout) {
        debugLog('📝 User confirmed logout, proceeding...');
        
        // Call server-side logout endpoint first (for logging)
        logoutFromServer().then(() => {
            performClientLogout();
        }).catch((error) => {
            debugLog(`⚠️ Server logout failed: ${error.message}, proceeding with client logout`);
            performClientLogout();
        });
    } else {
        debugLog('❌ User cancelled logout');
    }
}

// Client-side logout cleanup
function performClientLogout() {
    try {
        // Use shared utility for clearing admin auth data
        if (window.SharedUtils && window.SharedUtils.AuthUtils) {
            SharedUtils.AuthUtils.clearAuthData(true);
        } else {
            // Fallback implementation using session manager
            sessionManager.clearSession();
        }
        
        debugLog('✅ Admin logout completed successfully');
        
        // Show logout message briefly before redirect
        const logoutMessage = document.createElement('div');
        logoutMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #e53e3e;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
            font-family: 'Poppins', sans-serif;
        `;
        logoutMessage.innerHTML = `
            <i class="fas fa-check-circle" style="color: #e53e3e; font-size: 2rem; margin-bottom: 10px;"></i>
            <div style="color: #333; font-weight: 600;">Logout Successful!</div>
            <div style="color: #666; font-size: 0.9rem; margin-top: 5px;">Redirecting to login page...</div>
        `;
        document.body.appendChild(logoutMessage);
        
        // Redirect to admin login page after a brief delay
        setTimeout(() => {
            // Remove the message element
            if (document.body.contains(logoutMessage)) {
                document.body.removeChild(logoutMessage);
            }
            window.location.href = 'admin-login.html';
        }, 2000);
        
    } catch (error) {
        debugLog(`❌ Client logout error: ${error.message}`);
        window.location.href = 'admin-login.html';
    }
}

// Check if already logged in
function checkExistingAdminLogin() {
    // Check both localStorage and sessionStorage
    const adminStatus = localStorage.getItem('bloodconnect_admin') || sessionStorage.getItem('bloodconnect_admin');
    if (adminStatus === 'true') {
        debugLog('Already logged in as admin, redirecting to dashboard');
        window.location.href = 'admin-dashboard.html';
        return true;
    }
    return false;
}

// Export functions and class
window.AdminAuthUtils = {
    debugLog,
    getAPIBaseURL,
    getAdminAuthHeaders,
    checkAdminAuthentication,
    processAdminLogin,
    logoutFromServer,
    logAdminActivity,
    logoutAdmin,
    performClientLogout,
    checkExistingAdminLogin,
    sessionManager
};