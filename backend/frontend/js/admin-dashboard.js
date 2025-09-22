/**
 * Admin Dashboard JavaScript - External file to avoid CSP issues
 * Handles admin dashboard functionality and API calls
 */

// Debug logging function
function debugLog(message) {
    console.log(`[AdminDashboard] ${message}`);
}

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
            <td>${user.id}</td>
            <td>${user.firstName} ${user.lastName}</td>
            <td>${user.email}</td>
            <td>${user.phone || 'N/A'}</td>
            <td><span class="status-badge ${user.role === 'donor' ? 'status-active' : 'status-pending'}">${user.role}</span></td>
            <td>${user.bloodGroup || 'N/A'}</td>
            <td>${user.city || 'N/A'}</td>
            <td>${user.donationsCount || 0}</td>
            <td>${user.requestsCount || 0}</td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
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
    
    // Check authentication first
    if (!checkAdminAuthentication()) {
        return;
    }
    
    // Load initial data
    loadStats();
    loadUsers();
    
    // Set up auto-refresh
    setInterval(() => {
        loadStats();
        updateLastUpdatedTime();
    }, 30000); // Refresh every 30 seconds
    
    debugLog('✅ Admin dashboard initialized successfully!');
});

// Make functions globally available
window.loadStats = loadStats;
window.loadUsers = loadUsers;
window.loadStatistics = loadStats; // Alias for auto-refresh service
window.showNotification = showNotification;
window.logout = logout;