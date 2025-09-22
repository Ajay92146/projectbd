/**
 * Admin Logout JavaScript
 * Handles admin logout functionality
 */

// Debug logging function
function debugLog(message) {
    console.log(`[AdminLogout] ${message}`);
}

// Admin logout process
async function processAdminLogout() {
    debugLog('🔐 Starting admin logout process...');
    
    try {
        // Use the global getAPIBaseURL function from api.js
        const apiUrl = `${getAPIBaseURL()}/admin/logout`;
        debugLog(`API URL: ${apiUrl}`);
        
        // Call backend API for admin logout
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        debugLog(`Response status: ${response.status}`);
        
        // Clear admin session from both localStorage and sessionStorage
        localStorage.removeItem('bloodconnect_admin');
        localStorage.removeItem('admin_email');
        localStorage.removeItem('admin_login_time');
        sessionStorage.removeItem('bloodconnect_admin');
        sessionStorage.removeItem('admin_email');
        sessionStorage.removeItem('admin_login_time');
        
        debugLog('✅ Admin session cleared!');
        
        // Redirect to admin login page
        window.location.href = 'admin-login.html';
        
    } catch (error) {
        debugLog(`❌ Logout failed: ${error.message}`);
        
        // Even if API call fails, clear local session data
        localStorage.removeItem('bloodconnect_admin');
        localStorage.removeItem('admin_email');
        localStorage.removeItem('admin_login_time');
        sessionStorage.removeItem('bloodconnect_admin');
        sessionStorage.removeItem('admin_email');
        sessionStorage.removeItem('admin_login_time');
        
        // Redirect to admin login page
        window.location.href = 'admin-login.html';
    }
}

// Initialize admin logout
function initializeAdminLogout() {
    debugLog('🚀 Admin logout initialized');
    
    // Check if we're on a page that requires admin authentication
    const protectedPages = ['admin-dashboard.html', 'admin-settings.html', 'admin-reports.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    // If we're on a protected page, check if admin is logged in
    if (protectedPages.includes(currentPage)) {
        const isAdminLoggedIn = localStorage.getItem('bloodconnect_admin') === 'true' || 
                               sessionStorage.getItem('bloodconnect_admin') === 'true';
                               
        if (!isAdminLoggedIn) {
            debugLog('❌ Admin not logged in, redirecting to login page');
            window.location.href = 'admin-login.html';
            return;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAdminLogout);

// Make function globally available
window.processAdminLogout = processAdminLogout;