/**
 * Admin Dashboard JavaScript - External file to avoid CSP issues
 * Handles admin dashboard functionality and API calls
 */

// Import admin utilities
import AdminAuthUtils from './admin-auth-utils.js';

// Debug logging function
function debugLog(message) {
    // Use the unified utility function
    if (window.AdminUtils) {
        AdminUtils.debugLog(message);
        return;
    }
    
    // Fallback to original implementation
    console.log(`[AdminDashboard] ${message}`);
}

// Fallback getAPIBaseURL function in case api.js doesn't load
function ensureAPIBaseURL() {
    if (typeof window.getAPIBaseURL === 'function') {
        return window.getAPIBaseURL;
    }
    
    // Fallback implementation
    return function() {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `${protocol}//${hostname}:3002/api`;
        }
        return `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
    };
}

// Use global getAPIBaseURL from api.js

// Check admin authentication
function checkAdminAuthentication() {
    // Use the unified authentication utility
    if (window.AdminAuthUtils) {
        return AdminAuthUtils.checkAdminAuthentication();
    }
    
    // Fallback to original implementation
    debugLog('🔍 Checking admin authentication...');
    
    // Get admin status from localStorage
    const adminStatus = localStorage.getItem('bloodconnect_admin');
    const adminEmail = localStorage.getItem('admin_email');
    const adminLoginTime = localStorage.getItem('admin_login_time');
    
    debugLog(`📱 LocalStorage admin status: ${adminStatus}`);
    debugLog(`📧 LocalStorage admin email: ${adminEmail}`);
    debugLog(`🕒 LocalStorage admin login time: ${adminLoginTime}`);
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
    
    // Check session timeout (30 minutes)
    if (adminLoginTime) {
        const loginTime = new Date(adminLoginTime);
        const currentTime = new Date();
        const timeDiff = currentTime - loginTime;
        const minutesDiff = timeDiff / (1000 * 60);
        
        debugLog(`⏱️ Session age: ${minutesDiff.toFixed(2)} minutes`);
        
        if (minutesDiff > 30) {
            debugLog('⏰ Session expired, logging out...');
            showNotification('Session expired. Please log in again.', 'error');
            logout();
            return false;
        }
        
        // Update last activity time
        localStorage.setItem('admin_last_activity', currentTime.toISOString());
    }
    
    debugLog('✅ Admin authenticated successfully!');
    return true;
}

// Get auth headers for admin API calls
function getAdminAuthHeaders() {
    // Use the unified authentication utility
    if (window.AdminAuthUtils) {
        return AdminAuthUtils.getAdminAuthHeaders();
    }
    
    // Fallback to original implementation
    const adminEmail = localStorage.getItem('admin_email');
    return {
        'Content-Type': 'application/json',
        'x-admin-email': adminEmail || '',
        'x-admin-auth': 'true'
    };
}

// Load dashboard statistics
async function loadStats() {
    const usersTableBody = document.getElementById('usersTableBody');
    
    try {
        debugLog('Loading dashboard stats...');
        const getAPIBaseURL = ensureAPIBaseURL();
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
            
            // Update last updated time
            updateLastUpdatedTime();
            
            // Update charts with new data
            updateCharts(data.data);
        } else {
            throw new Error(data.message || 'Failed to load statistics');
        }
    } catch (error) {
        // Use enhanced error handling
        if (window.AdminUtils && window.AdminUtils.AdminErrorHandler) {
            AdminUtils.AdminErrorHandler.handleApiError(error, 'Loading dashboard stats');
        } else {
            // Fallback to original error handling
            debugLog(`Error loading stats: ${error.message}`);
            console.error('Error loading stats:', error);
            
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
}

// Load chart statistics
async function loadChartStats() {
    try {
        debugLog('Loading chart stats...');
        const getAPIBaseURL = ensureAPIBaseURL();
        const apiUrl = `${getAPIBaseURL()}/admin/chart-stats`;
        debugLog(`Chart API URL: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        debugLog(`Chart response status: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        debugLog('Chart response data:', data);
        
        if (data.success) {
            // Update charts with new data
            updateCharts(data.data);
        } else {
            throw new Error(data.message || 'Failed to load chart statistics');
        }
    } catch (error) {
        // Use enhanced error handling
        if (window.AdminUtils && window.AdminUtils.AdminErrorHandler) {
            AdminUtils.AdminErrorHandler.handleApiError(error, 'Loading chart stats');
        } else {
            // Fallback to original error handling
            debugLog(`Error loading chart stats: ${error.message}`);
            showNotification('Failed to load chart data', 'error');
        }
    }
}

// Update charts with new data
function updateCharts(chartData) {
    debugLog('Updating charts with new data');
    
    // Destroy existing charts if they exist
    if (window.userRegistrationsChart) {
        window.userRegistrationsChart.destroy();
    }
    if (window.donationsByGroupChart) {
        window.donationsByGroupChart.destroy();
    }
    if (window.requestsByUrgencyChart) {
        window.requestsByUrgencyChart.destroy();
    }
    if (window.donorAvailabilityChart) {
        window.donorAvailabilityChart.destroy();
    }
    
    // User Registrations Chart
    const userCtx = document.getElementById('userRegistrationsChart');
    if (userCtx) {
        window.userRegistrationsChart = new Chart(userCtx, {
            type: 'line',
            data: {
                labels: chartData.userRegistrations.labels,
                datasets: [{
                    label: 'User Registrations',
                    data: chartData.userRegistrations.data,
                    borderColor: '#e53e3e',
                    backgroundColor: 'rgba(229, 62, 62, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            }
        });
    }
    
    // Donations by Blood Group Chart
    const donationCtx = document.getElementById('donationsByGroupChart');
    if (donationCtx) {
        window.donationsByGroupChart = new Chart(donationCtx, {
            type: 'doughnut',
            data: {
                labels: chartData.donationsByGroup.labels,
                datasets: [{
                    data: chartData.donationsByGroup.data,
                    backgroundColor: [
                        '#e53e3e',
                        '#3182ce',
                        '#38a169',
                        '#d69e2e',
                        '#805ad5',
                        '#dd6b20',
                        '#00b8d4',
                        '#d53f8c'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Requests by Urgency Chart
    const requestCtx = document.getElementById('requestsByUrgencyChart');
    if (requestCtx) {
        window.requestsByUrgencyChart = new Chart(requestCtx, {
            type: 'bar',
            data: {
                labels: chartData.requestsByUrgency.labels,
                datasets: [{
                    label: 'Blood Requests',
                    data: chartData.requestsByUrgency.data,
                    backgroundColor: [
                        '#e53e3e',
                        '#dd6b20',
                        '#d69e2e',
                        '#38a169'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Donor Availability Chart
    const availabilityCtx = document.getElementById('donorAvailabilityChart');
    if (availabilityCtx) {
        window.donorAvailabilityChart = new Chart(availabilityCtx, {
            type: 'pie',
            data: {
                labels: chartData.donorAvailability.labels,
                datasets: [{
                    data: chartData.donorAvailability.data,
                    backgroundColor: [
                        '#38a169',
                        '#e53e3e',
                        '#d69e2e'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Enhanced loadUsers with pagination
async function loadUsers(searchTerm = '', roleFilter = '', advancedFilters = {}, page = 1, limit = 20) {
    const usersTableBody = document.getElementById('usersTableBody');
    const usersCount = document.getElementById('usersCount');
    
    if (usersTableBody) {
        usersTableBody.innerHTML = '<tr><td colspan="10" class="loading"><i class="fas fa-spinner"></i> Loading users...</td></tr>';
    }

    try {
        debugLog('Loading users...');
        const getAPIBaseURL = ensureAPIBaseURL();
        let apiUrl = `${getAPIBaseURL()}/admin/users?page=${page}&limit=${limit}`;
        
        // Add search and filter parameters
        if (searchTerm) {
            apiUrl += `&search=${encodeURIComponent(searchTerm)}`;
        }
        if (roleFilter) {
            apiUrl += `&role=${encodeURIComponent(roleFilter)}`;
        }
        
        // Add advanced filters
        if (advancedFilters.bloodGroup) {
            apiUrl += `&bloodGroup=${encodeURIComponent(advancedFilters.bloodGroup)}`;
        }
        if (advancedFilters.city) {
            apiUrl += `&city=${encodeURIComponent(advancedFilters.city)}`;
        }
        if (advancedFilters.status) {
            apiUrl += `&status=${encodeURIComponent(advancedFilters.status)}`;
        }
        if (advancedFilters.dateFrom) {
            apiUrl += `&dateFrom=${encodeURIComponent(advancedFilters.dateFrom)}`;
        }
        if (advancedFilters.dateTo) {
            apiUrl += `&dateTo=${encodeURIComponent(advancedFilters.dateTo)}`;
        }
        
        debugLog(`Users API URL: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        debugLog(`Users response status: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        debugLog('Users response data:', data);
        
        if (data.success) {
            displayUsers(data.data.users);
            if (usersCount) {
                usersCount.textContent = `(${data.data.total} users)`;
            }
            
            // Store pagination info for later use
            window.usersPagination = {
                page: data.data.page,
                totalPages: data.data.totalPages,
                total: data.data.total,
                limit: data.data.limit
            };
            
            // Update pagination controls
            updatePaginationControls('users', data.data);
        } else {
            throw new Error(data.message || 'Failed to load users');
        }
    } catch (error) {
        // Use enhanced error handling
        if (window.AdminUtils && window.AdminUtils.AdminErrorHandler) {
            AdminUtils.AdminErrorHandler.handleApiError(error, 'Loading users');
        } else {
            // Fallback to original error handling
            debugLog(`Error loading users: ${error.message}`);
            console.error('Error loading users:', error);
            if (usersTableBody) {
                usersTableBody.innerHTML = '<tr><td colspan="10" class="empty-state"><i class="fas fa-exclamation-triangle"></i><br>Failed to load users. Please try again.</td></tr>';
            }
        }
    }
}

// Display users in table with bulk operations
function displayUsers(users) {
    const usersTableBody = document.getElementById('usersTableBody');
    const usersCount = document.getElementById('usersCount');
    
    if (usersCount) {
        usersCount.textContent = `(${users.length} users)`;
    }
    
    if (!usersTableBody) return;
    
    if (users.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="10" class="empty-state"><i class="fas fa-users"></i><br>No users found</td></tr>';
        return;
    }

    // Add checkbox column for bulk operations
    usersTableBody.innerHTML = `
        <tr>
            <th><input type="checkbox" id="selectAllUsers" onclick="toggleSelectAll('users')"></th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Blood Group</th>
            <th>City</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
        </tr>
    ` + users.map(user => `
        <tr>
            <td><input type="checkbox" class="user-checkbox" data-user-id="${user._id}"></td>
            <td><strong>${user.firstName} ${user.lastName}</strong></td>
            <td>${user.email}</td>
            <td>${user.phoneNumber || 'N/A'}</td>
            <td><span class="status-badge status-active">${user.bloodGroup || 'N/A'}</span></td>
            <td>${user.city || 'N/A'}</td>
            <td><span class="status-badge status-${user.role === 'donor' ? 'completed' : 'pending'}">${user.role}</span></td>
            <td><span class="status-badge status-${user.isActive ? 'active' : 'cancelled'}">${user.isActive ? 'active' : 'inactive'}</span></td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="viewUserDetails('${user._id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Enhanced loadDonations with pagination
async function loadDonations(searchTerm = '', statusFilter = '', advancedFilters = {}, page = 1, limit = 20) {
    const donationsTableBody = document.getElementById('donationsTableBody');
    const donationsCount = document.getElementById('donationsCount');
    
    if (donationsTableBody) {
        donationsTableBody.innerHTML = '<tr><td colspan="8" class="loading"><i class="fas fa-spinner"></i> Loading donations...</td></tr>';
    }

    try {
        debugLog('Loading donations...');
        const getAPIBaseURL = ensureAPIBaseURL();
        let apiUrl = `${getAPIBaseURL()}/admin/donations?page=${page}&limit=${limit}`;
        
        // Add search and filter parameters
        if (searchTerm) {
            apiUrl += `&search=${encodeURIComponent(searchTerm)}`;
        }
        if (statusFilter) {
            apiUrl += `&status=${encodeURIComponent(statusFilter)}`;
        }
        
        // Add advanced filters
        if (advancedFilters.bloodGroup) {
            apiUrl += `&bloodGroup=${encodeURIComponent(advancedFilters.bloodGroup)}`;
        }
        if (advancedFilters.city) {
            apiUrl += `&city=${encodeURIComponent(advancedFilters.city)}`;
        }
        if (advancedFilters.dateFrom) {
            apiUrl += `&dateFrom=${encodeURIComponent(advancedFilters.dateFrom)}`;
        }
        if (advancedFilters.dateTo) {
            apiUrl += `&dateTo=${encodeURIComponent(advancedFilters.dateTo)}`;
        }
        
        debugLog(`Donations API URL: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        debugLog(`Donations response status: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        debugLog('Donations response data:', data);
        
        if (data.success) {
            displayDonations(data.data.donations);
            if (donationsCount) {
                donationsCount.textContent = `(${data.data.total} donors)`;
            }
            
            // Store pagination info for later use
            window.donationsPagination = {
                page: data.data.page,
                totalPages: data.data.totalPages,
                total: data.data.total,
                limit: data.data.limit
            };
            
            // Update pagination controls
            updatePaginationControls('donations', data.data);
        } else {
            throw new Error(data.message || 'Failed to load donations');
        }
    } catch (error) {
        debugLog(`Error loading donations: ${error.message}`);
        console.error('Error loading donations:', error);
        if (donationsTableBody) {
            donationsTableBody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-exclamation-triangle"></i><br>Failed to load donations. Please try again.</td></tr>';
        }
    }
}

// Enhanced loadRequests with pagination
async function loadRequests(searchTerm = '', urgencyFilter = '', advancedFilters = {}, page = 1, limit = 20) {
    const requestsTableBody = document.getElementById('requestsTableBody');
    const requestsCount = document.getElementById('requestsCount');
    
    if (requestsTableBody) {
        requestsTableBody.innerHTML = '<tr><td colspan="9" class="loading"><i class="fas fa-spinner"></i> Loading requests...</td></tr>';
    }

    try {
        debugLog('Loading requests...');
        const getAPIBaseURL = ensureAPIBaseURL();
        let apiUrl = `${getAPIBaseURL()}/admin/requests?page=${page}&limit=${limit}`;
        
        // Add search and filter parameters
        if (searchTerm) {
            apiUrl += `&search=${encodeURIComponent(searchTerm)}`;
        }
        if (urgencyFilter) {
            apiUrl += `&urgency=${encodeURIComponent(urgencyFilter)}`;
        }
        
        // Add advanced filters
        if (advancedFilters.bloodGroup) {
            apiUrl += `&bloodGroup=${encodeURIComponent(advancedFilters.bloodGroup)}`;
        }
        if (advancedFilters.hospital) {
            apiUrl += `&hospital=${encodeURIComponent(advancedFilters.hospital)}`;
        }
        if (advancedFilters.city) {
            apiUrl += `&city=${encodeURIComponent(advancedFilters.city)}`;
        }
        if (advancedFilters.status) {
            apiUrl += `&status=${encodeURIComponent(advancedFilters.status)}`;
        }
        if (advancedFilters.dateFrom) {
            apiUrl += `&dateFrom=${encodeURIComponent(advancedFilters.dateFrom)}`;
        }
        if (advancedFilters.dateTo) {
            apiUrl += `&dateTo=${encodeURIComponent(advancedFilters.dateTo)}`;
        }
        
        debugLog(`Requests API URL: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        debugLog(`Requests response status: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        debugLog('Requests response data:', data);
        
        if (data.success) {
            displayRequests(data.data.requests);
            if (requestsCount) {
                requestsCount.textContent = `(${data.data.total} requests)`;
            }
            
            // Store pagination info for later use
            window.requestsPagination = {
                page: data.data.page,
                totalPages: data.data.totalPages,
                total: data.data.total,
                limit: data.data.limit
            };
            
            // Update pagination controls
            updatePaginationControls('requests', data.data);
        } else {
            throw new Error(data.message || 'Failed to load requests');
        }
    } catch (error) {
        debugLog(`Error loading requests: ${error.message}`);
        console.error('Error loading requests:', error);
        if (requestsTableBody) {
            requestsTableBody.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-exclamation-triangle"></i><br>Failed to load requests. Please try again.</td></tr>';
        }
    }
}

// Display donations in table with bulk operations
function displayDonations(donations) {
    const donationsTableBody = document.getElementById('donationsTableBody');
    const donationsCount = document.getElementById('donationsCount');
    
    if (donationsCount) {
        donationsCount.textContent = `(${donations.length} donors)`;
    }
    
    if (!donationsTableBody) return;
    
    if (donations.length === 0) {
        donationsTableBody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-hand-holding-heart"></i><br>No donors found in database</td></tr>';
        return;
    }

    // Add checkbox column for bulk operations
    donationsTableBody.innerHTML = `
        <tr>
            <th><input type="checkbox" id="selectAllDonations" onclick="toggleSelectAll('donations')"></th>
            <th>Donor Name</th>
            <th>Blood Group</th>
            <th>Donation Date</th>
            <th>Location</th>
            <th>Status</th>
            <th>Notes</th>
            <th>Actions</th>
        </tr>
    ` + donations.map(donation => `
        <tr>
            <td><input type="checkbox" class="donation-checkbox" data-donation-id="${donation._id}"></td>
            <td><strong>${donation.name || 'Unknown Donor'}</strong></td>
            <td><span class="status-badge status-active">${donation.bloodGroup || 'N/A'}</span></td>
            <td>${donation.dateOfDonation ? new Date(donation.dateOfDonation).toLocaleDateString() : 'N/A'}</td>
            <td>${donation.city ? `${donation.city}, ${donation.state}` : 'N/A'}</td>
            <td><span class="status-badge status-${donation.isAvailable ? 'active' : 'cancelled'}">${donation.isAvailable ? 'Available' : 'Unavailable'}</span></td>
            <td>${donation.applicationStatus || 'Approved'}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="viewDonationDetails('${donation._id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Display requests in table with bulk operations
function displayRequests(requests) {
    const requestsTableBody = document.getElementById('requestsTableBody');
    const requestsCount = document.getElementById('requestsCount');
    
    if (requestsCount) {
        requestsCount.textContent = `(${requests.length} requests)`;
    }
    
    if (!requestsTableBody) return;
    
    if (requests.length === 0) {
        requestsTableBody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-search"></i><br>No requests found in database</td></tr>';
        return;
    }

    // Add checkbox column for bulk operations
    requestsTableBody.innerHTML = `
        <tr>
            <th><input type="checkbox" id="selectAllRequests" onclick="toggleSelectAll('requests')"></th>
            <th>Patient Name</th>
            <th>Blood Group</th>
            <th>Units Needed</th>
            <th>Urgency</th>
            <th>Hospital</th>
            <th>Status</th>
            <th>Request Date</th>
            <th>Actions</th>
        </tr>
    ` + requests.map(request => `
        <tr>
            <td><input type="checkbox" class="request-checkbox" data-request-id="${request._id}"></td>
            <td><strong>${request.patientName || 'Unknown Patient'}</strong></td>
            <td><span class="status-badge status-active">${request.bloodGroup || 'N/A'}</span></td>
            <td>${request.requiredUnits || 'N/A'}</td>
            <td><span class="status-badge status-${request.urgency === 'Critical' || request.urgency === 'High' ? 'cancelled' : 'pending'}">${request.urgency || 'Medium'}</span></td>
            <td>${request.hospitalName || 'N/A'}</td>
            <td><span class="status-badge status-${request.status ? request.status.toLowerCase() : 'pending'}">${request.status || 'Pending'}</span></td>
            <td>${request.requestDate ? new Date(request.requestDate).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="viewRequestDetails('${request._id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
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
    
    // Load chart data
    loadChartStats();
    
    // Set up search and filter event listeners
    setupSearchAndFilters();
    
    // Initialize WebSocket for real-time notifications
    initializeWebSocket();
    
    // Set up auto-refresh based on user preferences
    setupAutoRefresh();
}

// Set up auto-refresh based on user preferences
function setupAutoRefresh() {
    // Clear any existing intervals
    if (window.statsRefreshInterval) {
        clearInterval(window.statsRefreshInterval);
    }
    if (window.dataRefreshInterval) {
        clearInterval(window.dataRefreshInterval);
    }
    
    // Check user preferences
    const savedPrefs = localStorage.getItem('admin_dashboard_prefs');
    let autoRefresh = true;
    
    if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        autoRefresh = prefs.autoRefresh !== false;
    }
    
    if (autoRefresh) {
        // Auto-refresh data every 5 minutes
        window.statsRefreshInterval = setInterval(() => {
            loadStats();
            loadChartStats();
        }, 300000); // 5 minutes
        
        // Auto-refresh tables every 10 minutes
        window.dataRefreshInterval = setInterval(() => {
            loadUsers();
            loadDonations();
            loadRequests();
        }, 600000); // 10 minutes
        
        debugLog('Auto-refresh enabled');
    } else {
        debugLog('Auto-refresh disabled');
    }
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

// Enhanced logout function with activity logging
function logout() {
    debugLog('🚪 Logout button clicked');
    
    // Use the unified authentication utility
    if (window.AdminAuthUtils) {
        AdminAuthUtils.logoutAdmin();
        return;
    }
    
    // Fallback to original implementation
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

// Log admin activity
async function logAdminActivity(action, details) {
    // Use the unified authentication utility
    if (window.AdminAuthUtils) {
        return AdminAuthUtils.logAdminActivity(action, details);
    }
    
    // Fallback to original implementation
    try {
        const getAPIBaseURL = ensureAPIBaseURL();
        const apiUrl = `${getAPIBaseURL()}/admin/activity-log`;
        
        const activityData = {
            action: action,
            details: details,
            timestamp: new Date().toISOString(),
            adminEmail: localStorage.getItem('admin_email') || 'unknown'
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

// Server-side logout call with activity logging
async function logoutFromServer() {
    // Use the unified authentication utility
    if (window.AdminAuthUtils) {
        return AdminAuthUtils.logoutFromServer();
    }
    
    // Fallback to original implementation
    try {
        // Log the logout activity first
        await logAdminActivity('logout', 'Admin logout initiated');
        
        const getAPIBaseURL = ensureAPIBaseURL();
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

// Admin logout function
async function logoutAdmin() {
    // Use the unified authentication utility
    if (window.AdminAuthUtils) {
        AdminAuthUtils.logoutAdmin();
        return;
    }
    
    // Fallback to original implementation
    debugLog('🔐 Starting admin logout process...');
    
    try {
        // Get API base URL
        const getAPIBaseURL = ensureAPIBaseURL();
        const apiUrl = `${getAPIBaseURL()}/admin/logout`;
        debugLog(`API URL: ${apiUrl}`);
        
        // Call backend API for admin logout
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: getAdminAuthHeaders()
        });
        
        debugLog(`Response status: ${response.status}`);
        
        // Use shared utility for clearing admin auth data
        SharedUtils.AuthUtils.clearAuthData(true);
        
        debugLog('✅ Admin session cleared!');
        
        // Show notification
        showNotification('Logged out successfully', 'success');
        
        // Redirect to admin login page after a short delay
        setTimeout(() => {
            window.location.href = 'admin-login.html';
        }, 1500);
        
    } catch (error) {
        debugLog(`❌ Logout failed: ${error.message}`);
        
        // Even if API call fails, clear local session data using shared utility
        SharedUtils.AuthUtils.clearAuthData(true);
        
        // Show notification
        showNotification('Logged out successfully', 'success');
        
        // Redirect to admin login page
        window.location.href = 'admin-login.html';
    }
}

// Client-side logout cleanup
function performClientLogout() {
    // Use the unified authentication utility
    if (window.AdminAuthUtils) {
        AdminAuthUtils.performClientLogout();
        return;
    }
    
    // Fallback to original implementation
    try {
        // Use shared utility for clearing admin auth data
        SharedUtils.AuthUtils.clearAuthData(true);
        
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

// Toggle dark mode
function toggleDarkMode() {
    const body = document.body;
    const isDarkMode = body.classList.toggle('dark-mode');
    
    // Save preference to localStorage
    localStorage.setItem('admin_dark_mode', isDarkMode ? 'true' : 'false');
    
    // Update icon
    const toggleButton = document.querySelector('.dark-mode-toggle i');
    if (toggleButton) {
        toggleButton.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    debugLog(`Dark mode ${isDarkMode ? 'enabled' : 'disabled'}`);
}

// Apply saved dark mode preference
function applyDarkModePreference() {
    const savedDarkMode = localStorage.getItem('admin_dark_mode');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply dark mode if saved preference is true or if user prefers dark mode and no preference is saved
    const shouldEnableDarkMode = savedDarkMode === 'true' || (savedDarkMode === null && prefersDarkScheme);
    
    if (shouldEnableDarkMode) {
        document.body.classList.add('dark-mode');
        const toggleButton = document.querySelector('.dark-mode-toggle i');
        if (toggleButton) {
            toggleButton.className = 'fas fa-sun';
        }
    }
}

// Load recent activity logs
async function loadRecentActivity() {
    try {
        debugLog('Loading recent activity logs...');
        const getAPIBaseURL = ensureAPIBaseURL();
        const apiUrl = `${getAPIBaseURL()}/admin/activity-logs?limit=10`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayRecentActivity(data.data.logs);
        } else {
            throw new Error(data.message || 'Failed to load activity logs');
        }
    } catch (error) {
        debugLog(`Error loading activity logs: ${error.message}`);
    }
}

// Display recent activity logs
function displayRecentActivity(logs) {
    // Create activity panel if it doesn't exist
    let activityPanel = document.getElementById('activityPanel');
    if (!activityPanel) {
        activityPanel = document.createElement('div');
        activityPanel.id = 'activityPanel';
        activityPanel.className = 'customization-panel';
        activityPanel.style.bottom = '90px';
        activityPanel.style.left = '20px';
        activityPanel.style.right = 'auto';
        activityPanel.style.width = '350px';
        activityPanel.innerHTML = `
            <h3>Recent Activity</h3>
            <div id="activityList" style="max-height: 300px; overflow-y: auto;"></div>
        `;
        document.body.appendChild(activityPanel);
    }
    
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    if (logs.length === 0) {
        activityList.innerHTML = '<div class="empty-state">No recent activity</div>';
        return;
    }
    
    activityList.innerHTML = logs.map(log => `
        <div style="padding: 8px 0; border-bottom: 1px solid #eee;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <strong>${log.action}</strong>
                <span style="font-size: 0.8rem; color: #718096;">${new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            <div style="font-size: 0.9rem; color: #4a5568;">${log.details}</div>
            <div style="font-size: 0.8rem; color: #a0aec0; margin-top: 4px;">${log.adminEmail}</div>
        </div>
    `).join('');
}

// Toggle activity panel
function toggleActivityPanel() {
    const panel = document.getElementById('activityPanel');
    if (panel) {
        panel.classList.toggle('active');
        if (panel.classList.contains('active')) {
            loadRecentActivity();
        }
    }
}

// Add activity button to header
function addActivityButton() {
    const headerContainer = document.querySelector('.header-container');
    if (headerContainer) {
        const activityButton = document.createElement('button');
        activityButton.className = 'dark-mode-toggle';
        activityButton.title = 'Recent Activity';
        activityButton.innerHTML = '<i class="fas fa-history"></i>';
        activityButton.onclick = toggleActivityPanel;
        
        // Insert after the system info button
        const infoButton = headerContainer.querySelector('[title="System Information"]');
        if (infoButton) {
            headerContainer.insertBefore(activityButton, infoButton.nextSibling);
        } else {
            // If no info button, add to the left side
            const logoContainer = headerContainer.querySelector('.admin-logo').parentElement;
            if (logoContainer) {
                logoContainer.appendChild(activityButton);
            }
        }
    }
}

// Enhanced initializeAdminDashboard function
function initializeAdminDashboard() {
    debugLog('🚀 Admin dashboard page loaded');
    
    // Apply dark mode preference
    applyDarkModePreference();
    
    // Add system info button
    addSystemInfoButton();
    
    // Add activity button
    addActivityButton();
    
    // Check authentication first
    if (!checkAdminAuthentication()) {
        return; // Will redirect to login
    }
    
    // Initialize session timeout checker
    initializeSessionTimeout();
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Add print button
    addPrintButton();
    
    // Add help button
    addHelpButton();
    
    // Log dashboard access
    logAdminActivity('dashboard_access', 'Admin accessed dashboard');
    
    // Set up logout button event listener as backup
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        debugLog('🔄 Setting up logout button event listener');
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            debugLog('🚪 Logout button clicked via event listener');
            logoutAdmin();
        });
    } else {
        debugLog('⚠️ Warning: Logout button not found in DOM');
    }
    
    // Test logout function availability
    if (typeof logoutAdmin === 'function') {
        debugLog('✅ Logout function is available');
    } else {
        debugLog('❌ Error: Logout function is not available!');
    }
    
    // Initialize dashboard if authenticated
    initializeDashboard();
}



// Make functions globally available
window.refreshUsers = refreshUsers;
window.refreshDonations = refreshDonations;
window.refreshRequests = refreshRequests;
window.logoutAdmin = logoutAdmin;

// Add this new function for updating last updated time
function updateLastUpdatedTime() {
    // Use the unified utility function
    if (window.AdminUtils) {
        AdminUtils.updateLastUpdatedTime();
        return;
    }
    
    // Fallback to original implementation
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    
    // Create or update last updated element
    let lastUpdatedElement = document.getElementById('lastUpdated');
    if (!lastUpdatedElement) {
        lastUpdatedElement = document.createElement('div');
        lastUpdatedElement.id = 'lastUpdated';
        lastUpdatedElement.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.9);
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 0.8rem;
            color: #666;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            z-index: 1000;
        `;
        document.body.appendChild(lastUpdatedElement);
    }
    
    lastUpdatedElement.textContent = `Last updated: ${dateString} ${timeString}`;
}

// Add WebSocket connection for real-time notifications
function initializeWebSocket() {
    try {
        const getAPIBaseURL = ensureAPIBaseURL();
        // Convert HTTP/HTTPS to WS/WSS for WebSocket connection
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = window.location.hostname;
        const wsPort = window.location.port ? `:${window.location.port}` : '';
        const wsPath = '/api/admin/notifications';
        
        const wsUrl = `${wsProtocol}//${wsHost}${wsPort}${wsPath}`;
        debugLog(`WebSocket URL: ${wsUrl}`);
        
        // Check if WebSocket is supported
        if (!window.WebSocket) {
            debugLog('WebSocket not supported in this browser');
            return;
        }
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = function(event) {
            debugLog('WebSocket connection opened');
            showNotification('Connected to real-time updates', 'success');
        };
        
        ws.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                debugLog('WebSocket message received:', data);
                
                // Handle different types of notifications
                switch (data.type) {
                    case 'new_user':
                        showNotification(`New user registered: ${data.user.name}`, 'info');
                        // Refresh users list
                        refreshUsers();
                        break;
                    case 'new_donation':
                        showNotification(`New donation recorded: ${data.donor.name}`, 'info');
                        // Refresh donations list
                        refreshDonations();
                        break;
                    case 'new_request':
                        showNotification(`New blood request: ${data.request.patientName}`, 'info');
                        // Refresh requests list
                        refreshRequests();
                        break;
                    case 'stats_update':
                        // Update stats in real-time
                        updateStatsRealTime(data.stats);
                        break;
                    default:
                        debugLog('Unknown notification type:', data.type);
                }
            } catch (error) {
                debugLog(`Error processing WebSocket message: ${error.message}`);
            }
        };
        
        ws.onerror = function(error) {
            debugLog(`WebSocket error: ${error.message}`);
        };
        
        ws.onclose = function(event) {
            debugLog(`WebSocket connection closed: ${event.code} ${event.reason}`);
            // Attempt to reconnect after 5 seconds
            setTimeout(initializeWebSocket, 5000);
        };
        
        // Store WebSocket connection for later use
        window.adminWebSocket = ws;
    } catch (error) {
        debugLog(`Error initializing WebSocket: ${error.message}`);
    }
}

// Show notification to user
function showNotification(message, type = 'info') {
    // Use the unified utility function
    if (window.AdminUtils) {
        AdminUtils.showNotification(message, type);
        return;
    }
    
    // Fallback to original implementation
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 10000;
            width: 300px;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: ${type === 'error' ? '#fee2e2' : type === 'success' ? '#dcfce7' : '#dbeafe'};
        border-left: 4px solid ${type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#2563eb'};
        border-radius: 0 4px 4px 0;
        padding: 12px 16px;
        margin-bottom: 10px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: flex-start;">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}" 
               style="color: ${type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#2563eb'}; margin-right: 8px; margin-top: 2px;"></i>
            <div style="flex: 1;">
                <div style="font-weight: 500; color: #333; font-size: 0.9rem;">${message}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; cursor: pointer; color: #999; font-size: 1rem;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    notificationContainer.appendChild(notification);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Update stats in real-time without full reload
function updateStatsRealTime(stats) {
    const totalUsers = document.getElementById('totalUsers');
    const totalDonations = document.getElementById('totalDonations');
    const totalRequests = document.getElementById('totalRequests');
    const totalBloodUnits = document.getElementById('totalBloodUnits');
    
    if (totalUsers) totalUsers.textContent = stats.totalUsers.toLocaleString();
    if (totalDonations) totalDonations.textContent = stats.totalDonations.toLocaleString();
    if (totalRequests) totalRequests.textContent = stats.totalRequests.toLocaleString();
    if (totalBloodUnits) totalBloodUnits.textContent = stats.totalBloodUnits.toLocaleString();
    
    // Update last updated time
    updateLastUpdatedTime();
    
    debugLog('Stats updated in real-time');
}

// Update pagination controls
function updatePaginationControls(section, data) {
    const paginationContainer = document.getElementById(`${section}Pagination`);
    if (!paginationContainer) return;
    
    const { page, totalPages, total } = data;
    
    // Clear existing pagination controls
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Create pagination controls
    let paginationHTML = '<div class="pagination-controls">';
    
    // Previous button
    if (page > 1) {
        paginationHTML += `<button class="btn btn-secondary btn-sm" onclick="changePage('${section}', ${page - 1})">Previous</button>`;
    }
    
    // Page numbers
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        if (i === page) {
            paginationHTML += `<button class="btn btn-primary btn-sm" disabled>${i}</button>`;
        } else {
            paginationHTML += `<button class="btn btn-secondary btn-sm" onclick="changePage('${section}', ${i})">${i}</button>`;
        }
    }
    
    // Next button
    if (page < totalPages) {
        paginationHTML += `<button class="btn btn-secondary btn-sm" onclick="changePage('${section}', ${page + 1})">Next</button>`;
    }
    
    paginationHTML += `</div>`;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Change page
function changePage(section, page) {
    switch(section) {
        case 'users':
            const userSearch = document.getElementById('userSearch');
            const userFilter = document.getElementById('userFilter');
            const searchTerm = userSearch ? userSearch.value.trim() : '';
            const roleFilter = userFilter ? userFilter.value : '';
            loadUsers(searchTerm, roleFilter, {}, page);
            break;
        case 'donations':
            const donationSearch = document.getElementById('donationSearch');
            const donationFilter = document.getElementById('donationFilter');
            const donationSearchTerm = donationSearch ? donationSearch.value.trim() : '';
            const donationStatusFilter = donationFilter ? donationFilter.value : '';
            loadDonations(donationSearchTerm, donationStatusFilter, {}, page);
            break;
        case 'requests':
            const requestSearch = document.getElementById('requestSearch');
            const requestFilter = document.getElementById('requestFilter');
            const requestSearchTerm = requestSearch ? requestSearch.value.trim() : '';
            const requestUrgencyFilter = requestFilter ? requestFilter.value : '';
            loadRequests(requestSearchTerm, requestUrgencyFilter, {}, page);
            break;
    }
}

// Implement caching for API responses
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cached API call function
async function cachedApiCall(url, options = {}) {
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    const cached = apiCache.get(cacheKey);
    
    // Check if we have valid cached data
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        debugLog(`Using cached data for: ${url}`);
        return cached.data;
    }
    
    // Make fresh API call
    debugLog(`Making fresh API call to: ${url}`);
    const response = await fetch(url, options);
    const data = await response.json();
    
    // Cache the response
    apiCache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
    });
    
    return data;
}

// Clear cache
function clearApiCache() {
    apiCache.clear();
    debugLog('API cache cleared');
}

// Add a function to manually clear cache and refresh data
function clearCacheAndRefresh() {
    clearApiCache();
    // Refresh all data
    loadStats();
    loadChartStats();
    refreshUsers();
    refreshDonations();
    refreshRequests();
    showNotification('All data refreshed', 'success');
}

// Toggle select all checkboxes
function toggleSelectAll(section) {
    // Use the unified utility function
    if (window.AdminUtils) {
        AdminUtils.toggleSelectAll(section);
        return;
    }
    
    // Fallback to original implementation
    let checkboxes = [];
    let selectAllCheckbox = null;
    
    switch(section) {
        case 'users':
            checkboxes = document.querySelectorAll('.user-checkbox');
            selectAllCheckbox = document.getElementById('selectAllUsers');
            break;
        case 'donations':
            checkboxes = document.querySelectorAll('.donation-checkbox');
            selectAllCheckbox = document.getElementById('selectAllDonations');
            break;
        case 'requests':
            checkboxes = document.querySelectorAll('.request-checkbox');
            selectAllCheckbox = document.getElementById('selectAllRequests');
            break;
    }
    
    if (selectAllCheckbox && checkboxes.length > 0) {
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    }
}

// View user details
async function viewUserDetails(userId) {
    debugLog(`Viewing details for user: ${userId}`);
    
    try {
        const getAPIBaseURL = ensureAPIBaseURL();
        const apiUrl = `${getAPIBaseURL()}/admin/users/${userId}`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayUserDetails(data.data.user);
        } else {
            throw new Error(data.message || 'Failed to load user details');
        }
    } catch (error) {
        debugLog(`Error loading user details: ${error.message}`);
        showNotification(`Failed to load user details: ${error.message}`, 'error');
    }
}

// Display user details in modal
function displayUserDetails(user) {
    const modal = document.getElementById('userDetailModal');
    const content = document.getElementById('userDetailContent');
    
    if (!modal || !content) {
        debugLog('User detail modal elements not found');
        return;
    }
    
    content.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <span class="detail-label">Name</span>
                <span class="detail-value">${user.firstName} ${user.lastName}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Email</span>
                <span class="detail-value">${user.email}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Phone</span>
                <span class="detail-value">${user.phoneNumber || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Blood Group</span>
                <span class="detail-value">${user.bloodGroup || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">City</span>
                <span class="detail-value">${user.city || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Role</span>
                <span class="detail-value">${user.role}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Status</span>
                <span class="detail-value">${user.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Joined Date</span>
                <span class="detail-value">${new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// View donation details
async function viewDonationDetails(donationId) {
    debugLog(`Viewing details for donation: ${donationId}`);
    
    try {
        const getAPIBaseURL = ensureAPIBaseURL();
        const apiUrl = `${getAPIBaseURL()}/admin/donations/${donationId}`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayDonationDetails(data.data.donation);
        } else {
            throw new Error(data.message || 'Failed to load donation details');
        }
    } catch (error) {
        debugLog(`Error loading donation details: ${error.message}`);
        showNotification(`Failed to load donation details: ${error.message}`, 'error');
    }
}

// Display donation details in modal
function displayDonationDetails(donation) {
    const modal = document.getElementById('donationDetailModal');
    const content = document.getElementById('donationDetailContent');
    
    if (!modal || !content) {
        debugLog('Donation detail modal elements not found');
        return;
    }
    
    content.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <span class="detail-label">Donor Name</span>
                <span class="detail-value">${donation.name || 'Unknown Donor'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Blood Group</span>
                <span class="detail-value">${donation.bloodGroup || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Donation Date</span>
                <span class="detail-value">${donation.dateOfDonation ? new Date(donation.dateOfDonation).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Location</span>
                <span class="detail-value">${donation.city ? `${donation.city}, ${donation.state}` : 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Status</span>
                <span class="detail-value">${donation.isAvailable ? 'Available' : 'Unavailable'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Application Status</span>
                <span class="detail-value">${donation.applicationStatus || 'Approved'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Age</span>
                <span class="detail-value">${donation.age || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Gender</span>
                <span class="detail-value">${donation.gender || 'N/A'}</span>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// View request details
async function viewRequestDetails(requestId) {
    debugLog(`Viewing details for request: ${requestId}`);
    
    try {
        const getAPIBaseURL = ensureAPIBaseURL();
        const apiUrl = `${getAPIBaseURL()}/admin/requests/${requestId}`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayRequestDetails(data.data.request);
        } else {
            throw new Error(data.message || 'Failed to load request details');
        }
    } catch (error) {
        debugLog(`Error loading request details: ${error.message}`);
        showNotification(`Failed to load request details: ${error.message}`, 'error');
    }
}

// Display request details in modal
function displayRequestDetails(request) {
    const modal = document.getElementById('requestDetailModal');
    const content = document.getElementById('requestDetailContent');
    
    if (!modal || !content) {
        debugLog('Request detail modal elements not found');
        return;
    }
    
    content.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <span class="detail-label">Patient Name</span>
                <span class="detail-value">${request.patientName || 'Unknown Patient'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Blood Group</span>
                <span class="detail-value">${request.bloodGroup || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Units Needed</span>
                <span class="detail-value">${request.requiredUnits || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Urgency</span>
                <span class="detail-value">${request.urgency || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Hospital</span>
                <span class="detail-value">${request.hospitalName || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">City</span>
                <span class="detail-value">${request.hospitalCity || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Status</span>
                <span class="detail-value">${request.status || 'Pending'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Request Date</span>
                <span class="detail-value">${request.requestDate ? new Date(request.requestDate).toLocaleDateString() : 'N/A'}</span>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Export data to CSV
async function exportDataToCSV(dataType) {
    debugLog(`Exporting ${dataType} data to CSV`);
    
    try {
        // Show loading notification
        showNotification(`Preparing ${dataType} export...`, 'info');
        
        const getAPIBaseURL = ensureAPIBaseURL();
        let apiUrl = `${getAPIBaseURL()}/admin/${dataType}/export`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Convert data to CSV format
            const csvContent = convertToCSV(data.data);
            
            // Create download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            
            link.setAttribute('href', url);
            link.setAttribute('download', `${dataType}_export_${timestamp}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification(`${dataType} data exported successfully!`, 'success');
        } else {
            throw new Error(data.message || 'Failed to export data');
        }
    } catch (error) {
        debugLog(`Error exporting ${dataType} data: ${error.message}`);
        showNotification(`Failed to export ${dataType} data: ${error.message}`, 'error');
    }
}

// Convert array of objects to CSV format
function convertToCSV(data) {
    // Use the unified utility function
    if (window.AdminUtils) {
        return AdminUtils.convertToCSV(data);
    }
    
    // Fallback to original implementation
    if (!data || data.length === 0) return '';
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV header row
    const csvHeader = headers.join(',') + '\n';
    
    // Create CSV data rows
    const csvRows = data.map(row => {
        return headers.map(header => {
            let value = row[header];
            // Handle values that might contain commas or quotes
            if (typeof value === 'string') {
                // Escape quotes and wrap in quotes if needed
                if (value.includes(',') || value.includes('"')) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
            }
            return value;
        }).join(',');
    }).join('\n');
    
    return csvHeader + csvRows;
}

// Bulk approve selected items
async function bulkApprove(dataType) {
    debugLog(`Bulk approving ${dataType}`);
    
    // Get selected items
    const selectedItems = getSelectedItems(dataType);
    
    if (selectedItems.length === 0) {
        showNotification('Please select items to approve', 'warning');
        return;
    }
    
    try {
        showNotification(`Approving ${selectedItems.length} ${dataType}...`, 'info');
        
        const getAPIBaseURL = ensureAPIBaseURL();
        const apiUrl = `${getAPIBaseURL()}/admin/${dataType}/bulk-approve`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                ...getAdminAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids: selectedItems })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`${data.data.updatedCount} ${dataType} approved successfully!`, 'success');
            // Refresh the data
            refreshCurrentSection(dataType);
        } else {
            throw new Error(data.message || 'Failed to approve items');
        }
    } catch (error) {
        debugLog(`Error bulk approving ${dataType}: ${error.message}`);
        showNotification(`Failed to approve ${dataType}: ${error.message}`, 'error');
    }
}

// Bulk reject selected items
async function bulkReject(dataType) {
    debugLog(`Bulk rejecting ${dataType}`);
    
    // Get selected items
    const selectedItems = getSelectedItems(dataType);
    
    if (selectedItems.length === 0) {
        showNotification('Please select items to reject', 'warning');
        return;
    }
    
    try {
        showNotification(`Rejecting ${selectedItems.length} ${dataType}...`, 'info');
        
        const getAPIBaseURL = ensureAPIBaseURL();
        const apiUrl = `${getAPIBaseURL()}/admin/${dataType}/bulk-reject`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                ...getAdminAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids: selectedItems })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`${data.data.updatedCount} ${dataType} rejected successfully!`, 'success');
            // Refresh the data
            refreshCurrentSection(dataType);
        } else {
            throw new Error(data.message || 'Failed to reject items');
        }
    } catch (error) {
        debugLog(`Error bulk rejecting ${dataType}: ${error.message}`);
        showNotification(`Failed to reject ${dataType}: ${error.message}`, 'error');
    }
}

// Bulk delete selected items
async function bulkDelete(dataType) {
    debugLog(`Bulk deleting ${dataType}`);
    
    // Get selected items
    const selectedItems = getSelectedItems(dataType);
    
    if (selectedItems.length === 0) {
        showNotification('Please select items to delete', 'warning');
        return;
    }
    
    // Confirm deletion
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedItems.length} ${dataType}? This action cannot be undone.`);
    
    if (!confirmDelete) {
        debugLog('Bulk delete cancelled by user');
        return;
    }
    
    try {
        showNotification(`Deleting ${selectedItems.length} ${dataType}...`, 'info');
        
        const getAPIBaseURL = ensureAPIBaseURL();
        const apiUrl = `${getAPIBaseURL()}/admin/${dataType}/bulk-delete`;
        
        const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
                ...getAdminAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids: selectedItems })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`${data.data.deletedCount} ${dataType} deleted successfully!`, 'success');
            // Refresh the data
            refreshCurrentSection(dataType);
        } else {
            throw new Error(data.message || 'Failed to delete items');
        }
    } catch (error) {
        debugLog(`Error bulk deleting ${dataType}: ${error.message}`);
        showNotification(`Failed to delete ${dataType}: ${error.message}`, 'error');
    }
}

// Get selected items based on data type
function getSelectedItems(dataType) {
    // Use the unified utility function
    if (window.AdminUtils) {
        return AdminUtils.getSelectedItems(dataType);
    }
    
    // Fallback to original implementation
    let checkboxes = [];
    
    switch(dataType) {
        case 'users':
            checkboxes = document.querySelectorAll('.user-checkbox:checked');
            break;
        case 'donations':
            checkboxes = document.querySelectorAll('.donation-checkbox:checked');
            break;
        case 'requests':
            checkboxes = document.querySelectorAll('.request-checkbox:checked');
            break;
        default:
            return [];
    }
    
    return Array.from(checkboxes).map(checkbox => checkbox.dataset[`${dataType.slice(0, -1)}Id`]);
}

// Refresh current section based on data type
function refreshCurrentSection(dataType) {
    // Use the unified utility function
    if (window.AdminUtils) {
        AdminUtils.refreshCurrentSection(dataType);
        return;
    }
    
    // Fallback to original implementation
    switch(dataType) {
        case 'users':
            refreshUsers();
            break;
        case 'donations':
            refreshDonations();
            break;
        case 'requests':
            refreshRequests();
            break;
    }
}

// Update last activity time
function updateLastActivity() {
    const currentTime = new Date();
    localStorage.setItem('admin_last_activity', currentTime.toISOString());
}

// Initialize session timeout checker
function initializeSessionTimeout() {
    // Check session every minute
    setInterval(() => {
        checkAdminAuthentication();
    }, 60000); // 1 minute
    
    // Update activity on user interaction
    document.addEventListener('click', updateLastActivity);
    document.addEventListener('keypress', updateLastActivity);
    document.addEventListener('scroll', updateLastActivity);
}

// Add keyboard shortcuts for common actions
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // Only trigger shortcuts when not in an input field
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Ctrl+R or F5 to refresh all data
        if ((event.ctrlKey && event.key === 'r') || event.key === 'F5') {
            event.preventDefault();
            clearCacheAndRefresh();
        }
        
        // Ctrl+E to export current view
        if (event.ctrlKey && event.key === 'e') {
            event.preventDefault();
            // Determine which section is currently active
            const activeSection = determineActiveSection();
            if (activeSection) {
                exportDataToCSV(activeSection);
            }
        }
    });
}

// Determine which section is currently active based on scroll position
function determineActiveSection() {
    const sections = ['users', 'donations', 'requests'];
    const scrollTop = window.scrollY;
    
    // Find the section that is currently in view
    for (let i = sections.length - 1; i >= 0; i--) {
        const sectionElement = document.querySelector(`#${sections[i]}TableContainer`);
        if (sectionElement) {
            const sectionTop = sectionElement.offsetTop;
            if (scrollTop >= sectionTop - 100) {
                return sections[i];
            }
        }
    }
    
    return 'users'; // Default to users
}

// Print current view
function printCurrentView() {
    window.print();
}

// Add print button to header
function addPrintButton() {
    const headerContainer = document.querySelector('.header-container');
    if (headerContainer) {
        const printButton = document.createElement('button');
        printButton.className = 'logout-btn';
        printButton.style.marginRight = '0.5rem';
        printButton.title = 'Print Dashboard';
        printButton.innerHTML = '<i class="fas fa-print"></i> <span class="logout-text">Print</span>';
        printButton.onclick = printCurrentView;
        
        // Insert before the help button
        const helpButton = headerContainer.querySelector('button[title="Show Keyboard Shortcuts"]');
        if (helpButton) {
            headerContainer.insertBefore(printButton, helpButton);
        } else {
            // If no help button, insert before refresh button
            const refreshButton = headerContainer.querySelector('button[onclick="clearCacheAndRefresh()"]');
            if (refreshButton) {
                headerContainer.insertBefore(printButton, refreshButton);
            } else {
                headerContainer.appendChild(printButton);
            }
        }
    }
}

// Add a function to show a help modal with keyboard shortcuts
function showHelpModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'helpModal';
    modal.style.cssText = `
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        align-items: center;
        justify-content: center;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3 class="modal-title">Keyboard Shortcuts</h3>
                <button class="modal-close" onclick="document.getElementById('helpModal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="padding: 1rem 0;">
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                        <span><kbd>Ctrl</kbd> + <kbd>R</kbd> or <kbd>F5</kbd></span>
                        <span>Refresh all data</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                        <span><kbd>Ctrl</kbd> + <kbd>E</kbd></span>
                        <span>Export current view to CSV</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                        <span><kbd>Esc</kbd></span>
                        <span>Close modal dialogs</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('helpModal').remove()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Enhanced addHelpButton function
function addHelpButton() {
    const headerContainer = document.querySelector('.header-container');
    if (headerContainer) {
        const helpButton = document.createElement('button');
        helpButton.className = 'logout-btn';
        helpButton.style.marginRight = '0.5rem';
        helpButton.title = 'Show Keyboard Shortcuts';
        helpButton.innerHTML = '<i class="fas fa-question-circle"></i> <span class="logout-text">Help</span>';
        helpButton.onclick = showHelpModal;
        
        // Insert before the refresh button
        const refreshButton = headerContainer.querySelector('button[onclick="clearCacheAndRefresh()"]');
        if (refreshButton) {
            headerContainer.insertBefore(helpButton, refreshButton);
        } else {
            headerContainer.appendChild(helpButton);
        }
    }
}

// Show system information modal
function showSystemInfo() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'systemInfoModal';
    modal.style.cssText = `
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        align-items: center;
        justify-content: center;
    `;
    
    // Get system information
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const cookiesEnabled = navigator.cookieEnabled;
    const onlineStatus = navigator.onLine ? 'Online' : 'Offline';
    
    // Get dashboard version (you can update this as needed)
    const dashboardVersion = '1.2.0';
    
    // Get current date and time
    const now = new Date();
    const dateTime = now.toLocaleString();
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3 class="modal-title">System Information</h3>
                <button class="modal-close" onclick="document.getElementById('systemInfoModal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="padding: 1rem 0;">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Dashboard Version</span>
                            <span class="detail-value">v${dashboardVersion}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Current Date & Time</span>
                            <span class="detail-value">${dateTime}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Browser</span>
                            <span class="detail-value">${userAgent}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Platform</span>
                            <span class="detail-value">${platform}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Language</span>
                            <span class="detail-value">${language}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Cookies</span>
                            <span class="detail-value">${cookiesEnabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Network Status</span>
                            <span class="detail-value">${onlineStatus}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Admin Email</span>
                            <span class="detail-value">${localStorage.getItem('admin_email') || 'Not available'}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('systemInfoModal').remove()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Add system info button to header
function addSystemInfoButton() {
    const headerContainer = document.querySelector('.header-container');
    if (headerContainer) {
        const infoButton = document.createElement('button');
        infoButton.className = 'dark-mode-toggle';
        infoButton.title = 'System Information';
        infoButton.innerHTML = '<i class="fas fa-info-circle"></i>';
        infoButton.onclick = showSystemInfo;
        
        // Insert after the dark mode toggle
        const darkModeToggle = headerContainer.querySelector('.dark-mode-toggle');
        if (darkModeToggle) {
            headerContainer.insertBefore(infoButton, darkModeToggle.nextSibling);
        } else {
            // If no dark mode toggle, add to the left side
            const logoContainer = headerContainer.querySelector('.admin-logo').parentElement;
            if (logoContainer) {
                logoContainer.appendChild(infoButton);
            }
        }
    }
}

// Check server status
async function checkServerStatus() {
    try {
        const getAPIBaseURL = ensureAPIBaseURL();
        const apiUrl = `${getAPIBaseURL()}/health`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            return { status: 'online', message: 'Server is running' };
        } else {
            return { status: 'offline', message: `Server error: ${response.status}` };
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            return { status: 'offline', message: 'Server timeout' };
        }
        return { status: 'offline', message: `Connection error: ${error.message}` };
    }
}

// Show server status indicator
async function showServerStatus() {
    const status = await checkServerStatus();
    
    // Create or update status indicator
    let statusIndicator = document.getElementById('serverStatusIndicator');
    if (!statusIndicator) {
        statusIndicator = document.createElement('div');
        statusIndicator.id = 'serverStatusIndicator';
        statusIndicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: ${status.status === 'online' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 6px;
        `;
        statusIndicator.innerHTML = `
            <i class="fas fa-circle" style="font-size: 0.6rem;"></i>
            <span>${status.message}</span>
        `;
        document.body.appendChild(statusIndicator);
    } else {
        // Update existing indicator
        statusIndicator.style.background = status.status === 'online' ? '#10b981' : '#ef4444';
        statusIndicator.querySelector('span').textContent = status.message;
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (statusIndicator && statusIndicator.parentElement) {
            statusIndicator.remove();
        }
    }, 5000);
}

// Initialize dashboard if authenticated
    initializeDashboard();

