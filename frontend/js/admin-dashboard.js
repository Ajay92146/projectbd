/**
 * Admin Dashboard JavaScript - External file to avoid CSP issues
 * Handles admin dashboard functionality and API calls
 */

// Debug logging function
function debugLog(message) {
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
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `${protocol}//${hostname}:3002/api`;
        }
        return `${protocol}//${hostname}/api`;
    };
}

// Use global getAPIBaseURL from api.js

// Check admin authentication
function checkAdminAuthentication() {
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
        debugLog(`Error loading users: ${error.message}`);
        if (usersTableBody) {
            usersTableBody.innerHTML = '<tr><td colspan="10" class="empty-state"><i class="fas fa-exclamation-triangle"></i><br>Failed to load users. Please try again.</td></tr>';
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
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        const data = await response.json();
        
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
        if (donationsTableBody) {
            donationsTableBody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-exclamation-triangle"></i><br>Failed to load donations. Please try again.</td></tr>';
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
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        const data = await response.json();
        
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
        if (requestsTableBody) {
            requestsTableBody.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-exclamation-triangle"></i><br>Failed to load requests. Please try again.</td></tr>';
        }
    }
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
    
    // Auto-refresh data every 5 minutes
    setInterval(() => {
        loadStats();
        loadChartStats();
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

// Enhanced logout function with activity logging
function logout() {
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

// Log admin activity
async function logAdminActivity(action, details) {
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

// Client-side logout cleanup
function performClientLogout() {
    try {
        // Clear all admin-related localStorage items
        const adminKeys = [
            'bloodconnect_admin',
            'admin_email',
            'admin_login_time',
            'admin_session',
            'admin_preferences',
            'admin_last_activity'
        ];
        
        debugLog('🧹 Clearing admin session data...');
        adminKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                debugLog(`📝 Cleared localStorage key: ${key}`);
            } else {
                debugLog(`📝 Key ${key} was already empty`);
            }
        });
        
        // Clear any sessionStorage as well
        try {
            sessionStorage.clear();
            debugLog('🧹 SessionStorage cleared');
        } catch (sessionError) {
            debugLog(`⚠️ SessionStorage clear error: ${sessionError.message}`);
        }
        
        // Verify cleanup
        const remainingAdminStatus = localStorage.getItem('bloodconnect_admin');
        if (remainingAdminStatus) {
            debugLog(`⚠️ Warning: Admin status still exists: ${remainingAdminStatus}`);
            // Force remove it
            localStorage.clear();
            debugLog('🧹 Performed complete localStorage clear');
        } else {
            debugLog('✅ Admin session cleanup verified');
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
        
        // Redirect to admin login page after a short delay
        setTimeout(() => {
            debugLog('🚀 Redirecting to admin login page...');
            window.location.href = 'admin-login.html';
        }, 1500);
        
    } catch (error) {
        debugLog(`❌ Error during logout: ${error.message}`);
        // Force redirect even if cleanup fails
        alert('Logout completed. Redirecting to login page.');
        window.location.href = 'admin-login.html';
    }
}

// Initialize admin dashboard
function initializeAdminDashboard() {
    debugLog('🚀 Admin dashboard page loaded');
    
    // Check authentication first
    if (!checkAdminAuthentication()) {
        return; // Will redirect to login
    }
    
    // Initialize session timeout checker
    initializeSessionTimeout();
    
    // Log dashboard access
    logAdminActivity('dashboard_access', 'Admin accessed dashboard');
    
    // Set up logout button event listener as backup
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        debugLog('🔄 Setting up logout button event listener');
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            debugLog('🚪 Logout button clicked via event listener');
            logout();
        });
    } else {
        debugLog('⚠️ Warning: Logout button not found in DOM');
    }
    
    // Test logout function availability
    if (typeof logout === 'function') {
        debugLog('✅ Logout function is available');
    } else {
        debugLog('❌ Error: Logout function is not available!');
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

// Add this new function for updating last updated time
function updateLastUpdatedTime() {
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

// Toggle select all checkboxes
function toggleSelectAll(section) {
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
function viewUserDetails(userId) {
    debugLog(`Viewing details for user: ${userId}`);
    showNotification('User details feature coming soon', 'info');
}

// View donation details
function viewDonationDetails(donationId) {
    debugLog(`Viewing details for donation: ${donationId}`);
    showNotification('Donation details feature coming soon', 'info');
}

// View request details
function viewRequestDetails(requestId) {
    debugLog(`Viewing details for request: ${requestId}`);
    showNotification('Request details feature coming soon', 'info');
}

// Export data to CSV
function exportDataToCSV(dataType) {
    debugLog(`Exporting ${dataType} data to CSV`);
    showNotification(`${dataType} export feature coming soon`, 'info');
}

// Bulk approve selected items
function bulkApprove(dataType) {
    debugLog(`Bulk approving ${dataType}`);
    showNotification(`${dataType} bulk approval feature coming soon`, 'info');
}

// Bulk reject selected items
function bulkReject(dataType) {
    debugLog(`Bulk rejecting ${dataType}`);
    showNotification(`${dataType} bulk rejection feature coming soon`, 'info');
}

// Bulk delete selected items
function bulkDelete(dataType) {
    debugLog(`Bulk deleting ${dataType}`);
    showNotification(`${dataType} bulk deletion feature coming soon`, 'info');
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
