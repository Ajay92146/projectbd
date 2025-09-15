/**
 * Admin Dashboard JavaScript - External file to avoid CSP issues
 * Handles admin dashboard functionality and API calls
 */

// Debug logging function
function debugLog(message) {
    console.log(`[AdminDashboard] ${message}`);
}

// Get dynamic API base URL
function getAPIBaseURL() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // If on localhost, use the same port as the frontend (3002)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//${hostname}:3002/api`;
    }
    
    return `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
}

// Check admin authentication
function checkAdminAuthentication() {
    debugLog('🔍 Checking admin authentication...');
    
    // Get admin status from localStorage
    const adminStatus = localStorage.getItem('bloodconnect_admin');
    const adminEmail = localStorage.getItem('admin_email');
    
    debugLog(`📱 LocalStorage admin status: ${adminStatus}`);
    debugLog(`📧 LocalStorage admin email: ${adminEmail}`);
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
    
    debugLog('✅ Admin authenticated successfully!');
    return true;
}

// Get auth headers for admin API calls
function getAdminAuthHeaders() {
    const adminEmail = localStorage.getItem('admin_email');
    return {
        'Content-Type': 'application/json',
        'x-admin-email': adminEmail || '',
        'x-admin-auth': 'true'
    };
}

// Load dashboard statistics
async function loadStats() {
    try {
        debugLog('Loading dashboard stats...');
        const apiUrl = `${getAPIBaseURL()}/admin/dashboard-stats`;
        debugLog(`API URL: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        debugLog(`Response status: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        debugLog('Response data:', data);
        
        if (data.success) {
            const totalUsers = document.getElementById('totalUsers');
            const totalDonations = document.getElementById('totalDonations');
            const totalRequests = document.getElementById('totalRequests');
            const totalBloodUnits = document.getElementById('totalBloodUnits');
            
            if (totalUsers) totalUsers.textContent = data.data.totalUsers.toLocaleString();
            if (totalDonations) totalDonations.textContent = data.data.totalDonations.toLocaleString();
            if (totalRequests) totalRequests.textContent = data.data.totalRequests.toLocaleString();
            if (totalBloodUnits) totalBloodUnits.textContent = data.data.totalBloodUnits.toLocaleString();
        } else {
            throw new Error(data.message || 'Failed to load statistics');
        }
    } catch (error) {
        debugLog(`Error loading stats: ${error.message}`);
        
        const totalUsers = document.getElementById('totalUsers');
        const totalDonations = document.getElementById('totalDonations');
        const totalRequests = document.getElementById('totalRequests');
        const totalBloodUnits = document.getElementById('totalBloodUnits');
        
        if (totalUsers) totalUsers.textContent = 'Error';
        if (totalDonations) totalDonations.textContent = 'Error';
        if (totalRequests) totalRequests.textContent = 'Error';
        if (totalBloodUnits) totalBloodUnits.textContent = 'Error';
    }
}

// Load users data
async function loadUsers(searchTerm = '', roleFilter = '') {
    const usersTableBody = document.getElementById('usersTableBody');
    if (usersTableBody) {
        usersTableBody.innerHTML = '<tr><td colspan="8" class="loading"><i class="fas fa-spinner"></i> Loading users...</td></tr>';
    }

    try {
        debugLog('Loading users...');
        let apiUrl = `${getAPIBaseURL()}/admin/users?limit=50`;
        
        // Add search and filter parameters
        if (searchTerm) {
            apiUrl += `&search=${encodeURIComponent(searchTerm)}`;
        }
        if (roleFilter) {
            apiUrl += `&role=${encodeURIComponent(roleFilter)}`;
        }
        
        debugLog(`Users API URL: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        debugLog(`Users response status: ${response.status}`);
        
        const data = await response.json();
        debugLog('Users response data:', data);
        
        if (data.success) {
            displayUsers(data.data.users);
        } else {
            throw new Error(data.message || 'Failed to load users');
        }
    } catch (error) {
        debugLog(`Error loading users: ${error.message}`);
        if (usersTableBody) {
            usersTableBody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-exclamation-triangle"></i><br>Failed to load users. Please try again.</td></tr>';
        }
    }
}

// Display users in table
function displayUsers(users) {
    const usersTableBody = document.getElementById('usersTableBody');
    const usersCount = document.getElementById('usersCount');
    
    if (usersCount) {
        usersCount.textContent = `(${users.length} users)`;
    }
    
    if (!usersTableBody) return;
    
    if (users.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-users"></i><br>No users found</td></tr>';
        return;
    }

    usersTableBody.innerHTML = users.map(user => `
        <tr>
            <td><strong>${user.firstName} ${user.lastName}</strong></td>
            <td>${user.email}</td>
            <td>${user.phoneNumber || 'N/A'}</td>
            <td><span class="status-badge status-active">${user.bloodGroup || 'N/A'}</span></td>
            <td>${user.city || 'N/A'}</td>
            <td><span class="status-badge status-${user.role === 'donor' ? 'completed' : 'pending'}">${user.role}</span></td>
            <td><span class="status-badge status-${user.isActive ? 'active' : 'cancelled'}">${user.isActive ? 'active' : 'inactive'}</span></td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// Load donations data (simplified version)
async function loadDonations(searchTerm = '', statusFilter = '') {
    const donationsTableBody = document.getElementById('donationsTableBody');
    if (donationsTableBody) {
        donationsTableBody.innerHTML = '<tr><td colspan="6" class="loading"><i class="fas fa-spinner"></i> Loading donations...</td></tr>';
    }

    try {
        debugLog('Loading donations...');
        let apiUrl = `${getAPIBaseURL()}/admin/donations?limit=50`;
        
        // Add search and filter parameters
        if (searchTerm) {
            apiUrl += `&search=${encodeURIComponent(searchTerm)}`;
        }
        if (statusFilter) {
            apiUrl += `&status=${encodeURIComponent(statusFilter)}`;
        }
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            displayDonations(data.data.donations);
        } else {
            throw new Error(data.message || 'Failed to load donations');
        }
    } catch (error) {
        debugLog(`Error loading donations: ${error.message}`);
        if (donationsTableBody) {
            donationsTableBody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-exclamation-triangle"></i><br>Failed to load donations. Please try again.</td></tr>';
        }
    }
}

// Display donations in table
function displayDonations(donations) {
    const donationsTableBody = document.getElementById('donationsTableBody');
    const donationsCount = document.getElementById('donationsCount');
    
    if (donationsCount) {
        donationsCount.textContent = `(${donations.length} donors)`;
    }
    
    if (!donationsTableBody) return;
    
    if (donations.length === 0) {
        donationsTableBody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-hand-holding-heart"></i><br>No donors found in database</td></tr>';
        return;
    }

    donationsTableBody.innerHTML = donations.map(donation => `
        <tr>
            <td><strong>${donation.name || 'Unknown Donor'}</strong></td>
            <td><span class="status-badge status-active">${donation.bloodGroup || 'N/A'}</span></td>
            <td>${donation.dateOfDonation ? new Date(donation.dateOfDonation).toLocaleDateString() : 'N/A'}</td>
            <td>${donation.city ? `${donation.city}, ${donation.state}` : 'N/A'}</td>
            <td><span class="status-badge status-${donation.isAvailable ? 'active' : 'cancelled'}">${donation.isAvailable ? 'Available' : 'Unavailable'}</span></td>
            <td>${donation.applicationStatus || 'Approved'}</td>
        </tr>
    `).join('');
}

// Load requests data (simplified version)
async function loadRequests(searchTerm = '', urgencyFilter = '') {
    const requestsTableBody = document.getElementById('requestsTableBody');
    if (requestsTableBody) {
        requestsTableBody.innerHTML = '<tr><td colspan="7" class="loading"><i class="fas fa-spinner"></i> Loading requests...</td></tr>';
    }

    try {
        debugLog('Loading requests...');
        let apiUrl = `${getAPIBaseURL()}/admin/requests?limit=50`;
        
        // Add search and filter parameters
        if (searchTerm) {
            apiUrl += `&search=${encodeURIComponent(searchTerm)}`;
        }
        if (urgencyFilter) {
            apiUrl += `&urgency=${encodeURIComponent(urgencyFilter)}`;
        }
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            displayRequests(data.data.requests);
        } else {
            throw new Error(data.message || 'Failed to load requests');
        }
    } catch (error) {
        debugLog(`Error loading requests: ${error.message}`);
        if (requestsTableBody) {
            requestsTableBody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-exclamation-triangle"></i><br>Failed to load requests. Please try again.</td></tr>';
        }
    }
}

// Display requests in table
function displayRequests(requests) {
    const requestsTableBody = document.getElementById('requestsTableBody');
    const requestsCount = document.getElementById('requestsCount');
    
    if (requestsCount) {
        requestsCount.textContent = `(${requests.length} requests)`;
    }
    
    if (!requestsTableBody) return;
    
    if (requests.length === 0) {
        requestsTableBody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-search"></i><br>No requests found in database</td></tr>';
        return;
    }

    requestsTableBody.innerHTML = requests.map(request => `
        <tr>
            <td><strong>${request.patientName || 'Unknown Patient'}</strong></td>
            <td><span class="status-badge status-active">${request.bloodGroup || 'N/A'}</span></td>
            <td>${request.requiredUnits || 'N/A'}</td>
            <td><span class="status-badge status-${request.urgency === 'Critical' || request.urgency === 'High' ? 'cancelled' : 'pending'}">${request.urgency || 'Medium'}</span></td>
            <td>${request.hospitalName || 'N/A'}</td>
            <td><span class="status-badge status-${request.status ? request.status.toLowerCase() : 'pending'}">${request.status || 'Pending'}</span></td>
            <td>${request.requestDate ? new Date(request.requestDate).toLocaleDateString() : 'N/A'}</td>
        </tr>
    `).join('');
}

// Initialize dashboard data
function initializeDashboard() {
    debugLog('🚀 Initializing admin dashboard...');
    
    loadStats();
    loadUsers();
    loadDonations();
    loadRequests();
    
    // Set up search and filter event listeners
    setupSearchAndFilters();
    
    // Auto-refresh data every 5 minutes (reduced from 30 seconds/1 minute)
    setInterval(() => {
        loadStats();
    }, 300000); // 5 minutes
    
    // Auto-refresh tables every 10 minutes
    setInterval(() => {
        loadUsers();
        loadDonations();
        loadRequests();
    }, 600000); // 10 minutes
}

// Set up search and filter functionality
function setupSearchAndFilters() {
    // Users search and filter
    const userSearch = document.getElementById('userSearch');
    const userFilter = document.getElementById('userFilter');
    
    if (userSearch) {
        let userSearchTimeout;
        userSearch.addEventListener('input', function() {
            clearTimeout(userSearchTimeout);
            userSearchTimeout = setTimeout(() => {
                const searchTerm = this.value.trim();
                const roleFilter = userFilter ? userFilter.value : '';
                loadUsers(searchTerm, roleFilter);
            }, 500); // Debounce search
        });
    }
    
    if (userFilter) {
        userFilter.addEventListener('change', function() {
            const searchTerm = userSearch ? userSearch.value.trim() : '';
            const roleFilter = this.value;
            loadUsers(searchTerm, roleFilter);
        });
    }
    
    // Donations search and filter
    const donationSearch = document.getElementById('donationSearch');
    const donationFilter = document.getElementById('donationFilter');
    
    if (donationSearch) {
        let donationSearchTimeout;
        donationSearch.addEventListener('input', function() {
            clearTimeout(donationSearchTimeout);
            donationSearchTimeout = setTimeout(() => {
                const searchTerm = this.value.trim();
                const statusFilter = donationFilter ? donationFilter.value : '';
                loadDonations(searchTerm, statusFilter);
            }, 500);
        });
    }
    
    if (donationFilter) {
        donationFilter.addEventListener('change', function() {
            const searchTerm = donationSearch ? donationSearch.value.trim() : '';
            const statusFilter = this.value;
            loadDonations(searchTerm, statusFilter);
        });
    }
    
    // Requests search and filter
    const requestSearch = document.getElementById('requestSearch');
    const requestFilter = document.getElementById('requestFilter');
    
    if (requestSearch) {
        let requestSearchTimeout;
        requestSearch.addEventListener('input', function() {
            clearTimeout(requestSearchTimeout);
            requestSearchTimeout = setTimeout(() => {
                const searchTerm = this.value.trim();
                const urgencyFilter = requestFilter ? requestFilter.value : '';
                loadRequests(searchTerm, urgencyFilter);
            }, 500);
        });
    }
    
    if (requestFilter) {
        requestFilter.addEventListener('change', function() {
            const searchTerm = requestSearch ? requestSearch.value.trim() : '';
            const urgencyFilter = this.value;
            loadRequests(searchTerm, urgencyFilter);
        });
    }
}

// Refresh functions
function refreshUsers() {
    const userSearch = document.getElementById('userSearch');
    const userFilter = document.getElementById('userFilter');
    const searchTerm = userSearch ? userSearch.value.trim() : '';
    const roleFilter = userFilter ? userFilter.value : '';
    loadUsers(searchTerm, roleFilter);
}

function refreshDonations() {
    const donationSearch = document.getElementById('donationSearch');
    const donationFilter = document.getElementById('donationFilter');
    const searchTerm = donationSearch ? donationSearch.value.trim() : '';
    const statusFilter = donationFilter ? donationFilter.value : '';
    loadDonations(searchTerm, statusFilter);
}

function refreshRequests() {
    const requestSearch = document.getElementById('requestSearch');
    const requestFilter = document.getElementById('requestFilter');
    const searchTerm = requestSearch ? requestSearch.value.trim() : '';
    const urgencyFilter = requestFilter ? requestFilter.value : '';
    loadRequests(searchTerm, urgencyFilter);
}

// Improved logout function
function logout() {
    // Create a custom modal-style confirmation instead of browser confirm
    const confirmLogout = confirm('Are you sure you want to logout from the admin dashboard?');
    
    if (confirmLogout) {
        debugLog('📝 Logging out admin user...');
        
        try {
            // Clear all admin-related localStorage items
            const adminKeys = [
                'bloodconnect_admin',
                'admin_email',
                'admin_login_time',
                'admin_session',
                'admin_preferences'
            ];
            
            adminKeys.forEach(key => {
                localStorage.removeItem(key);
                debugLog(`📝 Cleared localStorage key: ${key}`);
            });
            
            // Clear any sessionStorage as well
            sessionStorage.clear();
            
            debugLog('✅ Admin logout completed successfully');
            
            // Redirect to admin login page
            window.location.href = 'admin-login.html';
            
        } catch (error) {
            debugLog(`❌ Error during logout: ${error.message}`);
            // Force redirect even if cleanup fails
            window.location.href = 'admin-login.html';
        }
    }
}

// Initialize admin dashboard
function initializeAdminDashboard() {
    debugLog('🚀 Admin dashboard page loaded');
    
    // Check authentication first
    if (!checkAdminAuthentication()) {
        return; // Will redirect to login
    }
    
    // Initialize dashboard if authenticated
    initializeDashboard();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAdminDashboard);

// Make functions globally available
window.refreshUsers = refreshUsers;
window.refreshDonations = refreshDonations;
window.refreshRequests = refreshRequests;
window.logout = logout;