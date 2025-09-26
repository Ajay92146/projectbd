/**
 * Admin Dashboard JavaScript - External file to avoid CSP issues
 * Handles admin dashboard functionality and API calls
 */

// Debug logging function
function debugLog(message) {
    console.log(`[AdminDashboard] ${message}`);
}

// Helper function to safely format numbers
function safeFormatNumber(value, defaultValue = '0') {
    if (value === undefined || value === null || isNaN(value)) {
        return defaultValue;
    }
    return Number(value).toLocaleString();
}

// Check admin authentication
function checkAdminAuthentication() {
    debugLog('🔍 Checking admin authentication...');
    
    // Check if we're on the admin login page - if so, don't check authentication
    if (window.location.pathname.includes('admin-login.html')) {
        debugLog('📍 On admin login page, skipping auth check');
        return false;
    }
    
    // Check if logout was just completed - if so, redirect immediately
    const logoutCompleted = sessionStorage.getItem('admin_logout_completed');
    if (logoutCompleted === 'true') {
        debugLog('🚪 Logout just completed, clearing flag and redirecting to login');
        sessionStorage.removeItem('admin_logout_completed');
        window.location.href = 'admin-login.html';
        return false;
    }
    
    // Check if logout is in progress
    const logoutInProgress = sessionStorage.getItem('admin_logout_in_progress');
    if (logoutInProgress === 'true') {
        debugLog('🚪 Logout in progress, redirecting to login');
        sessionStorage.removeItem('admin_logout_in_progress');
        window.location.href = 'admin-login.html';
        return false;
    }
    
    // Check both localStorage and sessionStorage
    const adminStatus = localStorage.getItem('bloodconnect_admin') || sessionStorage.getItem('bloodconnect_admin');
    const adminEmail = localStorage.getItem('admin_email') || sessionStorage.getItem('admin_email');
    const adminLoginTime = localStorage.getItem('admin_login_time') || sessionStorage.getItem('admin_login_time');
    
    debugLog(`📱 Admin status: ${adminStatus}`);
    debugLog(`📧 Admin email: ${adminEmail}`);
    debugLog(`🕒 Admin login time: ${adminLoginTime}`);
    debugLog(`🌐 Current URL: ${window.location.href}`);
    
    // Check if admin is authenticated
    if (adminStatus !== 'true' || !adminEmail || !adminLoginTime) {
        debugLog('❌ Not authenticated as admin, redirecting to login...');
        // Clear any partial admin data
        localStorage.removeItem('bloodconnect_admin');
        localStorage.removeItem('admin_email');
        localStorage.removeItem('admin_login_time');
        sessionStorage.removeItem('bloodconnect_admin');
        sessionStorage.removeItem('admin_email');
        sessionStorage.removeItem('admin_login_time');
        
        // Use a small delay to prevent rapid redirects
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
            
            // Clear expired session
            localStorage.removeItem('bloodconnect_admin');
            localStorage.removeItem('admin_email');
            localStorage.removeItem('admin_login_time');
            sessionStorage.removeItem('bloodconnect_admin');
            sessionStorage.removeItem('admin_email');
            sessionStorage.removeItem('admin_login_time');
            
            setTimeout(() => {
                window.location.href = 'admin-login.html';
            }, 2000);
            return false;
        }
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
    const usersTableBody = document.getElementById('usersTableBody');
    
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
            const totalBloodBanks = document.getElementById('totalBloodBanks');
            const pendingBloodBanks = document.getElementById('pendingBloodBanks');
            
            if (totalUsers) totalUsers.textContent = safeFormatNumber(data.data.totalUsers);
            if (totalDonations) totalDonations.textContent = safeFormatNumber(data.data.totalDonations);
            if (totalRequests) totalRequests.textContent = safeFormatNumber(data.data.totalRequests);
            if (totalBloodUnits) totalBloodUnits.textContent = safeFormatNumber(data.data.totalBloodUnits);
            if (totalBloodBanks) totalBloodBanks.textContent = safeFormatNumber(data.data.totalBloodBanks);
            if (pendingBloodBanks) pendingBloodBanks.textContent = safeFormatNumber(data.data.pendingBloodBanks);
            
            // Update last updated time
            updateLastUpdatedTime();
            
            // Update charts with new data
            updateCharts(data.data);
        } else {
            throw new Error(data.message || 'Failed to load statistics');
        }
    } catch (error) {
        debugLog(`Error loading stats: ${error.message}`);
        console.error('Error loading stats:', error);
        
        // Check if this is an authentication error
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            debugLog('❌ Authentication error detected, redirecting to login');
            window.location.href = 'admin-login.html';
            return;
        }
        
        const totalUsers = document.getElementById('totalUsers');
        const totalDonations = document.getElementById('totalDonations');
        const totalRequests = document.getElementById('totalRequests');
        const totalBloodUnits = document.getElementById('totalBloodUnits');
        const totalBloodBanks = document.getElementById('totalBloodBanks');
        const pendingBloodBanks = document.getElementById('pendingBloodBanks');
        
        if (totalUsers) totalUsers.textContent = 'Error';
        if (totalDonations) totalDonations.textContent = 'Error';
        if (totalRequests) totalRequests.textContent = 'Error';
        if (totalBloodUnits) totalBloodUnits.textContent = 'Error';
        if (totalBloodBanks) totalBloodBanks.textContent = 'Error';
        if (pendingBloodBanks) pendingBloodBanks.textContent = 'Error';
    }
}

// Load chart statistics
async function loadChartStats() {
    try {
        debugLog('Loading chart stats...');
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
        debugLog(`Error loading chart stats: ${error.message}`);
        showNotification('Failed to load chart data', 'error');
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
        debugLog('Users response data:', data);
        
        if (data.success) {
            displayUsers(data.data.users, usersTableBody);
            updatePagination(data.data.pagination, 'users', loadUsers);
            
            if (usersCount) {
                usersCount.textContent = `(${data.data.pagination.total} total)`;
            }
        } else {
            throw new Error(data.message || 'Failed to load users');
        }
    } catch (error) {
        debugLog(`Error loading users: ${error.message}`);
        console.error('Error loading users:', error);
        
        if (usersTableBody) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error loading users: ${error.message}</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Display users in table
function displayUsers(users, tableBody) {
    if (!tableBody) return;
    
    if (!users || users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No users found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = users.map(user => `
        <tr>
            <td title="${user._id || user.id || 'N/A'}">${(user._id || user.id || 'N/A').substring(0, 8)}...</td>
            <td>${user.firstName || ''} ${user.lastName || ''}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.phoneNumber || user.phone || 'N/A'}</td>
            <td><span class="status-badge ${user.role === 'donor' ? 'status-active' : 'status-pending'}">${user.role || 'user'}</span></td>
            <td>${user.bloodGroup || 'N/A'}</td>
            <td>${user.city || 'N/A'}</td>
            <td>${user.donationsCount || 0}</td>
            <td>${user.requestsCount || 0}</td>
            <td title="${new Date(user.createdAt).toLocaleString()}">${new Date(user.createdAt).toLocaleDateString('en-GB').split('/').reverse().join('/')}</td>
        </tr>
    `).join('');
}

// Display donations in table
function displayDonations(donations, tableBody) {
    if (!tableBody) return;
    
    if (!donations || donations.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-tint"></i>
                    <p>No donations found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = donations.map(donation => `
        <tr>
            <td>${donation._id || donation.id || 'N/A'}</td>
            <td>${donation.name || 'N/A'}</td>
            <td>${donation.email || 'N/A'}</td>
            <td>${donation.bloodGroup || 'N/A'}</td>
            <td>${donation.city || 'N/A'}</td>
            <td>${donation.contactNumber || donation.phone || 'N/A'}</td>
            <td><span class="status-badge ${donation.isAvailable ? 'status-active' : 'status-pending'}">${donation.isAvailable ? 'Available' : 'Unavailable'}</span></td>
            <td>${new Date(donation.registrationDate || donation.createdAt).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// Update pagination
function updatePagination(pagination, type, loadFunction) {
    const paginationContainer = document.getElementById(`${type}Pagination`);
    if (!paginationContainer) return;
    
    const { page, pages, total, limit } = pagination;
    
    let paginationHTML = '';
    
    // Previous button
    if (page > 1) {
        paginationHTML += `<button onclick="${loadFunction.name}('', '', {}, ${page - 1})" class="btn btn-secondary">Previous</button>`;
    }
    
    // Page numbers
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
        const isActive = i === page ? 'btn-primary' : 'btn-secondary';
        paginationHTML += `<button onclick="${loadFunction.name}('', '', {}, ${i})" class="btn ${isActive}">${i}</button>`;
    }
    
    // Next button
    if (page < pages) {
        paginationHTML += `<button onclick="${loadFunction.name}('', '', {}, ${page + 1})" class="btn btn-secondary">Next</button>`;
    }
    
    paginationContainer.innerHTML = paginationHTML;
}

// Update last updated time
function updateLastUpdatedTime() {
    const lastUpdated = document.getElementById('lastUpdated');
    if (lastUpdated) {
        lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 600;
        z-index: 1000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = '#38a169';
            break;
        case 'error':
            notification.style.background = '#e53e3e';
            break;
        case 'warning':
            notification.style.background = '#d69e2e';
            break;
        default:
            notification.style.background = '#3182ce';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// Logout function
function logout() {
    if (typeof processAdminLogout === 'function') {
        processAdminLogout();
    } else {
        localStorage.removeItem('bloodconnect_admin');
        localStorage.removeItem('admin_email');
        localStorage.removeItem('admin_login_time');
        window.location.href = 'admin-login.html';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    debugLog('🚀 Initializing admin dashboard...');
    
    // Prevent multiple initialization
    if (window.adminDashboardInitialized) {
        debugLog('Admin dashboard already initialized, skipping...');
        return;
    }
    window.adminDashboardInitialized = true;
    
    // Check authentication first
    if (!checkAdminAuthentication()) {
        return;
    }
    
    // Load initial data
    loadStats();
    loadUsers();
    loadDonations();
    loadRequests();
    
    // Try to load blood banks, but don't fail if the endpoint doesn't exist
    try {
        loadBloodBanks();
    } catch (error) {
        console.warn('Blood banks functionality not available:', error.message);
    }
    
    // Set up auto-refresh
    setInterval(() => {
        loadStats();
        loadDonations();
        loadRequests();
        
        // Try to load blood banks, but don't fail if not available
        try {
            loadBloodBanks();
        } catch (error) {
            // Silently ignore blood banks loading errors during auto-refresh
        }
        
        updateLastUpdatedTime();
    }, 30000); // Refresh every 30 seconds
    
    debugLog('✅ Admin dashboard initialized successfully!');
});

// Enhanced loadDonations with pagination and filtering
async function loadDonations(searchTerm = '', bloodTypeFilter = '', page = 1, limit = 20) {
    const donationsTableBody = document.getElementById('donationsTableBody');
    const donationsCount = document.getElementById('donationsCount');
    
    if (donationsTableBody) {
        donationsTableBody.innerHTML = '<tr><td colspan="8" class="loading"><i class="fas fa-spinner"></i> Loading donations...</td></tr>';
    }

    try {
        debugLog('Loading donations...');
        let apiUrl = `${getAPIBaseURL()}/admin/donations?page=${page}&limit=${limit}`;
        
        // Add search and filter parameters
        if (searchTerm) {
            apiUrl += `&search=${encodeURIComponent(searchTerm)}`;
        }
        if (bloodTypeFilter) {
            apiUrl += `&bloodType=${encodeURIComponent(bloodTypeFilter)}`;
        }
        
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
        debugLog('Donations response data:', data);
        
        if (data.success) {
            // Store donations data globally
            window.donationsData = data.data.donations;
            
            displayDonations(data.data.donations, donationsTableBody);
            updatePagination(data.data.pagination, 'donations', loadDonations);
            
            if (donationsCount) {
                donationsCount.textContent = `(${data.data.pagination.total} total)`;
            }
        } else {
            throw new Error(data.message || 'Failed to load donations');
        }
    } catch (error) {
        debugLog(`Error loading donations: ${error.message}`);
        console.error('Error loading donations:', error);
        
        if (donationsTableBody) {
            donationsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error loading donations: ${error.message}</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Make functions globally available
window.loadStats = loadStats;
window.loadUsers = loadUsers;
window.loadDonations = loadDonations;
window.loadRequests = loadRequests;
window.loadStatistics = loadStats; // Alias for auto-refresh service
window.showNotification = showNotification;
window.logout = logout;
window.filterRequests = filterRequests;

/**
 * Enhanced loadRequests with pagination and filtering
 */
async function loadRequests(searchTerm = '', statusFilter = '', page = 1, limit = 20) {
    const requestsTableBody = document.getElementById('requestsTableBody');
    const requestsCount = document.getElementById('requestsCount');
    
    if (requestsTableBody) {
        requestsTableBody.innerHTML = '<tr><td colspan="9" class="loading"><i class="fas fa-spinner"></i> Loading requests...</td></tr>';
    }

    try {
        debugLog('Loading requests...');
        let apiUrl = `${getAPIBaseURL()}/admin/requests?page=${page}&limit=${limit}`;
        
        // Add search and filter parameters
        if (searchTerm) {
            apiUrl += `&search=${encodeURIComponent(searchTerm)}`;
        }
        if (statusFilter) {
            apiUrl += `&status=${encodeURIComponent(statusFilter)}`;
        }
        
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
        debugLog('Requests response data:', data);
        
        if (data.success) {
            // Store requests data globally
            window.requestsData = data.data.requests;
            
            displayRequests(data.data.requests, requestsTableBody);
            updatePagination(data.data.pagination, 'requests', loadRequests);
            
            if (requestsCount) {
                requestsCount.textContent = `(${data.data.pagination.total} total)`;
            }
            
            // Update requests count in the dashboard
            const totalRequests = document.getElementById('totalRequests');
            if (totalRequests && data.data.pagination) {
                totalRequests.textContent = data.data.pagination.total.toLocaleString();
            }
        } else {
            throw new Error(data.message || 'Failed to load requests');
        }
    } catch (error) {
        debugLog(`Error loading requests: ${error.message}`);
        console.error('Error loading requests:', error);
        
        if (requestsTableBody) {
            requestsTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error loading requests: ${error.message}</p>
                    </td>
                </tr>
            `;
        }
        
        showNotification('Failed to load requests. Please try again.', 'error');
    }
}

// Display requests in table
function displayRequests(requests, tableBody) {
    if (!tableBody) return;
    
    if (!requests || requests.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-tint"></i>
                    <p>No blood requests found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = requests.map(request => `
        <tr>
            <td title="${request._id || request.id}">${(request._id || request.id || 'N/A').substring(0, 8)}...</td>
            <td>${request.patientName || request.requesterName || 'N/A'}</td>
            <td>${request.bloodGroup || 'N/A'}</td>
            <td>${request.requiredUnits || request.unitsNeeded || request.units || '1'}</td>
            <td>${request.contactNumber || request.phone || request.emergencyContact || 'N/A'}</td>
            <td><span class="status-badge status-${(request.status || 'pending').toLowerCase()}">${request.status || 'Pending'}</span></td>
            <td>${request.hospitalName || request.hospital || request.location || 'N/A'}</td>
            <td><span class="urgency-badge urgency-${(request.urgency || 'normal').toLowerCase()}">${request.urgency || 'Medium'}</span></td>
            <td title="${new Date(request.createdAt || request.requestDate || request.date || Date.now()).toLocaleString()}">${new Date(request.createdAt || request.requestDate || request.date || Date.now()).toLocaleDateString('en-GB').split('/').reverse().join('/')}</td>
        </tr>
    `).join('');
    
    // Add event listeners for view buttons if they exist
    const viewButtons = tableBody.querySelectorAll('.view-request-btn');
    if (viewButtons.length > 0) {
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const requestId = button.getAttribute('data-id');
                if (typeof viewRequest === 'function') {
                    viewRequest(requestId);
                }
            });
        });
    }
}

// Make loadRequests globally available
window.loadRequests = loadRequests;

// Logout function
function logout() {
    debugLog('🚪 Admin logout initiated');
    
    // Try to use the enhanced logout function if available
    if (typeof logoutAdmin === 'function') {
        logoutAdmin();
    } else if (window.AdminAuthUtils && typeof window.AdminAuthUtils.logoutAdmin === 'function') {
        window.AdminAuthUtils.logoutAdmin();
    } else {
        // Fallback simple logout
        debugLog('🔄 Using fallback logout method');
        
        // Show confirmation
        const confirmLogout = window.confirm('Are you sure you want to logout from the admin dashboard?');
        if (!confirmLogout) {
            return;
        }
        
        // Clear admin data immediately
        const adminKeys = [
            'bloodconnect_admin',
            'admin_email', 
            'admin_login_time',
            'admin_session',
            'admin_preferences',
            'admin_last_activity'
        ];
        
        adminKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        
        // Set logout completed flag
        sessionStorage.setItem('admin_logout_completed', 'true');
        
        // Redirect to login
        setTimeout(() => {
            sessionStorage.removeItem('admin_logout_completed');
            window.location.href = 'admin-login.html';
        }, 500);
    }
}

// Make functions globally available
window.loadStats = loadStats;
window.loadUsers = loadUsers;
window.loadDonations = loadDonations;
window.loadRequests = loadRequests;
window.loadBloodBanks = loadBloodBanks;
window.showNotification = showNotification;
window.logout = logout;
window.displayUsers = displayUsers;
window.displayDonations = displayDonations;
window.displayRequests = displayRequests;
window.displayBloodBanks = displayBloodBanks;
window.filterBloodBanks = filterBloodBanks;
window.approveBloodBank = approveBloodBank;
window.rejectBloodBank = rejectBloodBank;
window.suspendBloodBank = suspendBloodBank;
window.viewBloodBankDetails = viewBloodBankDetails;

// Enhanced loadBloodBanks with pagination and filtering
async function loadBloodBanks(searchTerm = '', statusFilter = '', page = 1, limit = 20) {
    const bloodBanksTableBody = document.getElementById('bloodBanksTableBody');
    const bloodBanksCount = document.getElementById('bloodBanksCount');
    
    if (bloodBanksTableBody) {
        bloodBanksTableBody.innerHTML = '<tr><td colspan="9" class="loading"><i class="fas fa-spinner"></i> Loading blood banks...</td></tr>';
    }

    try {
        debugLog('Loading blood banks...');
        let apiUrl = `${getAPIBaseURL()}/admin/blood-banks?page=${page}&limit=${limit}`;
        
        // Add search and filter parameters
        if (searchTerm) {
            apiUrl += `&search=${encodeURIComponent(searchTerm)}`;
        }
        if (statusFilter) {
            apiUrl += `&status=${encodeURIComponent(statusFilter)}`;
        }
        
        debugLog(`API URL: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        
        debugLog(`Response status: ${response.status}`);
        
        if (!response.ok) {
            // If blood banks endpoint doesn't exist, fail gracefully
            if (response.status === 404) {
                console.warn('Blood banks endpoint not found - feature may not be implemented yet');
                if (bloodBanksTableBody) {
                    bloodBanksTableBody.innerHTML = `
                        <tr>
                            <td colspan="9" class="empty-state">
                                <i class="fas fa-info-circle"></i>
                                <p>Blood banks management feature is not yet available</p>
                            </td>
                        </tr>
                    `;
                }
                return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        debugLog('Blood banks response data:', data);
        
        if (data.success) {
            // Store blood banks data globally
            window.bloodBanksData = data.data.bloodBanks;
            
            displayBloodBanks(data.data.bloodBanks, bloodBanksTableBody);
            updatePagination(data.data.pagination, 'bloodBanks', loadBloodBanks);
            
            if (bloodBanksCount) {
                bloodBanksCount.textContent = `(${data.data.pagination.totalItems} total)`;
            }
        } else {
            throw new Error(data.message || 'Failed to load blood banks');
        }
    } catch (error) {
        debugLog(`Error loading blood banks: ${error.message}`);
        console.error('Error loading blood banks:', error);
        
        if (bloodBanksTableBody) {
            bloodBanksTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error loading blood banks: ${error.message}</p>
                    </td>
                </tr>
            `;
        }
        
        showNotification('Failed to load blood banks. Please try again.', 'error');
    }
}

// Display blood banks in table
function displayBloodBanks(bloodBanks, tableBody) {
    if (!tableBody) return;
    
    if (!bloodBanks || bloodBanks.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-hospital"></i>
                    <p>No blood banks found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = bloodBanks.map(bank => `
        <tr>
            <td title="${bank.bankName}">${bank.bankName || 'N/A'}</td>
            <td>${bank.licenseNumber || 'N/A'}</td>
            <td>${bank.contactPerson || 'N/A'}</td>
            <td>${bank.email || bank.loginEmail || 'N/A'}</td>
            <td>${bank.city || 'N/A'}</td>
            <td><span class="status-badge status-${bank.bankType || 'private'}">${bank.bankType || 'Private'}</span></td>
            <td><span class="status-badge status-${(bank.status || 'pending').toLowerCase()}">${bank.status || 'Pending'}</span></td>
            <td title="${new Date(bank.createdAt).toLocaleString()}">${new Date(bank.createdAt).toLocaleDateString('en-GB').split('/').reverse().join('/')}</td>
            <td>
                ${bank.status === 'pending' ? `
                    <button class="action-btn approve-bank-btn" data-id="${bank._id}" title="Approve">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="action-btn reject-bank-btn" data-id="${bank._id}" title="Reject">
                        <i class="fas fa-times"></i>
                    </button>
                ` : bank.status === 'approved' ? `
                    <button class="action-btn suspend-bank-btn" data-id="${bank._id}" title="Suspend">
                        <i class="fas fa-ban"></i>
                    </button>
                ` : ''}
                <button class="action-btn view-bank-btn" data-id="${bank._id}" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners for action buttons
    addBloodBankActionListeners();
}

// Add event listeners for blood bank action buttons
function addBloodBankActionListeners() {
    // Approve buttons
    document.querySelectorAll('.approve-bank-btn').forEach(button => {
        button.addEventListener('click', function() {
            const bankId = this.getAttribute('data-id');
            approveBloodBank(bankId);
        });
    });
    
    // Reject buttons
    document.querySelectorAll('.reject-bank-btn').forEach(button => {
        button.addEventListener('click', function() {
            const bankId = this.getAttribute('data-id');
            rejectBloodBank(bankId);
        });
    });
    
    // Suspend buttons
    document.querySelectorAll('.suspend-bank-btn').forEach(button => {
        button.addEventListener('click', function() {
            const bankId = this.getAttribute('data-id');
            suspendBloodBank(bankId);
        });
    });
    
    // View buttons
    document.querySelectorAll('.view-bank-btn').forEach(button => {
        button.addEventListener('click', function() {
            const bankId = this.getAttribute('data-id');
            viewBloodBankDetails(bankId);
        });
    });
}

// Approve blood bank
async function approveBloodBank(bankId) {
    if (!confirm('Are you sure you want to approve this blood bank?')) {
        return;
    }
    
    try {
        const response = await fetch(`${getAPIBaseURL()}/admin/approve-blood-bank/${bankId}`, {
            method: 'POST',
            headers: getAdminAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Blood bank approved successfully', 'success');
            loadBloodBanks(); // Refresh the list
            loadStats(); // Update statistics
        } else {
            throw new Error(data.message || 'Failed to approve blood bank');
        }
    } catch (error) {
        console.error('Error approving blood bank:', error);
        showNotification('Failed to approve blood bank', 'error');
    }
}

// Reject blood bank
async function rejectBloodBank(bankId) {
    const reason = prompt('Please enter the reason for rejection:');
    if (!reason) {
        return;
    }
    
    try {
        const response = await fetch(`${getAPIBaseURL()}/admin/reject-blood-bank/${bankId}`, {
            method: 'POST',
            headers: getAdminAuthHeaders(),
            body: JSON.stringify({ reason })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Blood bank rejected', 'success');
            loadBloodBanks(); // Refresh the list
            loadStats(); // Update statistics
        } else {
            throw new Error(data.message || 'Failed to reject blood bank');
        }
    } catch (error) {
        console.error('Error rejecting blood bank:', error);
        showNotification('Failed to reject blood bank', 'error');
    }
}

// Suspend blood bank
async function suspendBloodBank(bankId) {
    const reason = prompt('Please enter the reason for suspension:');
    if (!reason) {
        return;
    }
    
    try {
        const response = await fetch(`${getAPIBaseURL()}/admin/suspend-blood-bank/${bankId}`, {
            method: 'POST',
            headers: getAdminAuthHeaders(),
            body: JSON.stringify({ reason })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Blood bank suspended', 'success');
            loadBloodBanks(); // Refresh the list
            loadStats(); // Update statistics
        } else {
            throw new Error(data.message || 'Failed to suspend blood bank');
        }
    } catch (error) {
        console.error('Error suspending blood bank:', error);
        showNotification('Failed to suspend blood bank', 'error');
    }
}

// View blood bank details
function viewBloodBankDetails(bankId) {
    const bank = window.bloodBanksData?.find(b => b._id === bankId);
    if (bank) {
        const details = `
Blood Bank Details:

Bank Name: ${bank.bankName}
License Number: ${bank.licenseNumber}
Bank Type: ${bank.bankType}
Established Year: ${bank.establishedYear}

Contact Information:
Contact Person: ${bank.contactPerson}
Designation: ${bank.designation}
Phone: ${bank.phone}
Email: ${bank.email}
Login Email: ${bank.loginEmail}
Website: ${bank.website || 'Not provided'}

Address:
${bank.address}
${bank.city}, ${bank.state}
${bank.country} - ${bank.zipCode}

Status: ${bank.status}
Verified: ${bank.isVerified ? 'Yes' : 'No'}
${bank.verifiedBy ? `Verified By: ${bank.verifiedBy}` : ''}
${bank.verificationDate ? `Verification Date: ${new Date(bank.verificationDate).toLocaleString()}` : ''}
${bank.rejectionReason ? `Rejection Reason: ${bank.rejectionReason}` : ''}

Registration Date: ${new Date(bank.createdAt).toLocaleString()}
        `;
        alert(details);
    }
}

// Filter blood banks
function filterBloodBanks() {
    try {
        const searchTerm = document.getElementById('bloodBankSearch')?.value || '';
        const statusFilter = document.getElementById('bloodBankStatusFilter')?.value || '';
        if (typeof loadBloodBanks === 'function') {
            loadBloodBanks(searchTerm, statusFilter);
        }
    } catch (error) {
        console.warn('Blood banks filtering not available:', error.message);
    }
}