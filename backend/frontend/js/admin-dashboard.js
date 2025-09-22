// Admin Dashboard JavaScript

// Global variables for pagination
let currentUsersPage = 1;
let currentDonationsPage = 1;
let currentRequestsPage = 1;
const itemsPerPage = 10;

// Global variables for data storage
let usersData = [];
let donationsData = [];
let requestsData = [];

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing admin dashboard...');
    
    // Check authentication
    const adminStatus = localStorage.getItem('bloodconnect_admin');
    if (adminStatus !== 'true') {
        alert('You must be logged in as admin to access this page.');
        window.location.href = 'admin-login.html';
        return;
    }
    
    // Initialize event listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Load initial data
    loadStats();
    loadUsers();
    loadDonations();
    loadRequests();
    
    // Update last updated time
    updateLastUpdatedTime();
    
    // Set up auto-refresh
    setInterval(() => {
        loadStats();
        updateLastUpdatedTime();
    }, 30000); // Refresh every 30 seconds
    
    console.log('✅ Admin dashboard initialized successfully!');
});

/**
 * Update the last updated time display
 */
function updateLastUpdatedTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('lastUpdated').textContent = timeString;
}

/**
 * Load dashboard statistics from the API
 */
function loadStats() {
    const apiUrl = getAPIBaseURL() + '/admin/dashboard-stats';
    
    fetch(apiUrl, {
        method: 'GET',
        headers: getAdminAuthHeaders()
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load statistics');
        }
        return response.json();
    })
    .then(data => {
        // Check if data has the expected structure
        if (data && data.success && data.data) {
            const stats = data.data;
            // Update statistics on the dashboard
            document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
            document.getElementById('totalDonations').textContent = stats.totalDonations || 0;
            document.getElementById('totalRequests').textContent = stats.totalRequests || 0;
            document.getElementById('totalBloodUnits').textContent = stats.totalBloodUnits || 0;
        } else {
            console.error('Invalid data structure received from API');
            showNotification('Invalid data received from server', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading statistics:', error);
        showNotification('Failed to load statistics. Please try again.', 'error');
    });
}

/**
 * Load users data from the API
 */
function loadUsers() {
    const apiUrl = getAPIBaseURL() + '/admin/users';
    
    fetch(apiUrl, {
        method: 'GET',
        headers: getAdminAuthHeaders()
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load users');
        }
        return response.json();
    })
    .then(data => {
        // Check if data has the expected structure
        if (data && data.success && data.data && data.data.users) {
            // Store users data globally
            usersData = data.data.users;
            
            // Display users
            filterUsers();
        } else {
            console.error('Invalid users data structure received from API');
            showNotification('Invalid users data received from server', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading users:', error);
        showNotification('Failed to load users. Please try again.', 'error');
    });
}

/**
 * Filter and display users based on search and filter criteria
 */
function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const roleFilter = document.getElementById('roleFilter').value;
    
    if (!Array.isArray(usersData)) {
        console.error('Users data is not an array');
        return;
    }
    
    const filteredUsers = usersData.filter(user => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const bloodGroup = user.bloodGroup || '';
        const email = user.email || '';
        
        const matchesSearch = 
            fullName.includes(searchTerm) ||
            email.toLowerCase().includes(searchTerm) ||
            bloodGroup.toLowerCase().includes(searchTerm);
            
        const matchesRole = roleFilter === '' || user.role === roleFilter;
        
        return matchesSearch && matchesRole;
    });
    
    displayUsers(filteredUsers);
}

/**
 * Display users in the table with pagination
 */
function displayUsers(users) {
    const tableBody = document.getElementById('usersTableBody');
    tableBody.innerHTML = '';
    
    // Calculate pagination
    const totalPages = Math.ceil(users.length / itemsPerPage);
    const startIndex = (currentUsersPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const usersToDisplay = users.slice(startIndex, endIndex);
    
    if (usersToDisplay.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" style="text-align: center;">No users found</td>';
        tableBody.appendChild(row);
    } else {
        usersToDisplay.forEach(user => {
            const row = document.createElement('tr');
            
            // Determine status class
            let statusClass = '';
            if (user.isActive) statusClass = 'status-active';
            else statusClass = 'status-inactive';
            
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`;
            const status = user.isActive ? 'active' : 'inactive';
            const role = user.isAdmin ? 'Admin' : 'User';
            
            row.innerHTML = `
                <td>${fullName}</td>
                <td>${user.email || ''}</td>
                <td>${user.bloodGroup || ''}</td>
                <td>${role}</td>
                <td><span class="status ${statusClass}">${status}</span></td>
                <td>
                    <button class="action-btn view-user-btn" data-id="${user._id}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-user-btn" data-id="${user._id}" title="Edit User">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // Update pagination
    updatePagination('usersPagination', totalPages, currentUsersPage, (page) => {
        currentUsersPage = page;
        displayUsers(users);
    });
    
    // Add event listeners to buttons
    addViewEventListeners();
}

/**
 * Load donations data from the API
 */
function loadDonations() {
    const apiUrl = getAPIBaseURL() + '/admin/donations';
    
    fetch(apiUrl, {
        method: 'GET',
        headers: getAdminAuthHeaders()
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load donations');
        }
        return response.json();
    })
    .then(data => {
        // Check if data has the expected structure
        if (data && data.success && data.data && data.data.donations) {
            // Store donations data globally
            donationsData = data.data.donations;
            
            // Display donations
            filterDonations();
        } else {
            console.error('Invalid donations data structure received from API');
            showNotification('Invalid donations data received from server', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading donations:', error);
        showNotification('Failed to load donations. Please try again.', 'error');
    });
}

/**
 * Filter and display donations based on search and filter criteria
 */
function filterDonations() {
    const searchTerm = document.getElementById('donationSearch').value.toLowerCase();
    const bloodTypeFilter = document.getElementById('bloodTypeFilter').value;
    
    if (!Array.isArray(donationsData)) {
        console.error('Donations data is not an array');
        return;
    }
    
    const filteredDonations = donationsData.filter(donation => {
        // Get donor name from user data if available
        const donorName = donation.userId ? 
            `${donation.userId.firstName || ''} ${donation.userId.lastName || ''}`.toLowerCase() : '';
        
        // Get location from donation center if available
        const location = donation.donationCenter ? 
            `${donation.donationCenter.name || ''} ${donation.donationCenter.city || ''}`.toLowerCase() : '';
        
        const matchesSearch = 
            donorName.includes(searchTerm) ||
            location.includes(searchTerm) ||
            (donation.certificateNumber && donation.certificateNumber.toLowerCase().includes(searchTerm));
            
        const matchesBloodType = bloodTypeFilter === '' || donation.bloodGroup === bloodTypeFilter;
        
        return matchesSearch && matchesBloodType;
    });
    
    displayDonations(filteredDonations);
}

/**
 * Display donations in the table with pagination
 */
function displayDonations(donations) {
    const tableBody = document.getElementById('donationsTableBody');
    tableBody.innerHTML = '';
    
    // Calculate pagination
    const totalPages = Math.ceil(donations.length / itemsPerPage);
    const startIndex = (currentDonationsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const donationsToDisplay = donations.slice(startIndex, endIndex);
    
    if (donationsToDisplay.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" style="text-align: center;">No donations found</td>';
        tableBody.appendChild(row);
    } else {
        donationsToDisplay.forEach(donation => {
            const row = document.createElement('tr');
            
            // Format donor name
            const donorName = donation.userId ? 
                `${donation.userId.firstName || ''} ${donation.userId.lastName || ''}` : 'Unknown';
            
            // Format location
            const location = donation.donationCenter ? 
                `${donation.donationCenter.name || ''}, ${donation.donationCenter.city || ''}` : 'Unknown';
            
            // Format date
            const date = donation.donationDate ? new Date(donation.donationDate).toLocaleDateString() : 'Unknown';
            
            row.innerHTML = `
                <td>${donorName}</td>
                <td>${donation.bloodGroup || 'Unknown'}</td>
                <td>${donation.units || 1}</td>
                <td>${date}</td>
                <td>${location}</td>
                <td>
                    <button class="action-btn view-donation-btn" data-id="${donation._id}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // Update pagination
    updatePagination('donationsPagination', totalPages, currentDonationsPage, (page) => {
        currentDonationsPage = page;
        displayDonations(donations);
    });
    
    // Add event listeners to buttons
    addViewEventListeners();
}

/**
 * Load requests data from the API
 */
function loadRequests() {
    const apiUrl = getAPIBaseURL() + '/admin/user-requests';
    
    fetch(apiUrl, {
        method: 'GET',
        headers: getAdminAuthHeaders()
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load requests');
        }
        return response.json();
    })
    .then(data => {
        // Check if data has the expected structure
        if (data && data.success && data.data && data.data.userRequests) {
            // Store requests data globally
            requestsData = data.data.userRequests;
            
            // Display requests
            filterRequests();
        } else {
            console.error('Invalid requests data structure received from API');
            showNotification('Invalid requests data received from server', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading requests:', error);
        showNotification('Failed to load requests. Please try again.', 'error');
    });
}

/**
 * Filter and display requests based on search and filter criteria
 */
function filterRequests() {
    const searchTerm = document.getElementById('requestSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const bloodTypeFilter = document.getElementById('requestBloodTypeFilter').value;
    
    if (!Array.isArray(requestsData)) {
        console.error('Requests data is not an array');
        return;
    }
    
    const filteredRequests = requestsData.filter(request => {
        // Get requester name from user data if available
        const requesterName = request.userId ? 
            `${request.userId.firstName || ''} ${request.userId.lastName || ''}`.toLowerCase() : '';
        
        // Get hospital name if available
        const hospital = request.hospitalName ? request.hospitalName.toLowerCase() : '';
        
        const matchesSearch = 
            requesterName.includes(searchTerm) ||
            hospital.includes(searchTerm) ||
            (request.reason && request.reason.toLowerCase().includes(searchTerm));
            
        const matchesStatus = statusFilter === '' || request.status === statusFilter;
        const matchesBloodType = bloodTypeFilter === '' || request.bloodGroup === bloodTypeFilter;
        
        return matchesSearch && matchesStatus && matchesBloodType;
    });
    
    displayRequests(filteredRequests);
}

/**
 * Display requests in the table with pagination
 */
function displayRequests(requests) {
    const tableBody = document.getElementById('requestsTableBody');
    tableBody.innerHTML = '';
    
    // Calculate pagination
    const totalPages = Math.ceil(requests.length / itemsPerPage);
    const startIndex = (currentRequestsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const requestsToDisplay = requests.slice(startIndex, endIndex);
    
    if (requestsToDisplay.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" style="text-align: center;">No requests found</td>';
        tableBody.appendChild(row);
    } else {
        requestsToDisplay.forEach(request => {
            const row = document.createElement('tr');
            
            // Format requester name
            const requesterName = request.userId ? 
                `${request.userId.firstName || ''} ${request.userId.lastName || ''}` : 'Unknown';
            
            // Format date
            const date = request.requestDate ? new Date(request.requestDate).toLocaleDateString() : 'Unknown';
            
            // Determine status class
            let statusClass = '';
            if (request.status === 'fulfilled') statusClass = 'status-active';
            else if (request.status === 'pending') statusClass = 'status-pending';
            else if (request.status === 'urgent') statusClass = 'status-inactive';
            else if (request.status === 'expired') statusClass = 'status-inactive';
            
            row.innerHTML = `
                <td>${requesterName}</td>
                <td>${request.bloodGroup || 'Unknown'}</td>
                <td>${request.unitsNeeded || 1}</td>
                <td><span class="status ${statusClass}">${request.status || 'pending'}</span></td>
                <td>${date}</td>
                <td>
                    <button class="action-btn view-request-btn" data-id="${request._id}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // Update pagination
    updatePagination('requestsPagination', totalPages, currentRequestsPage, (page) => {
        currentRequestsPage = page;
        displayRequests(requests);
    });
    
    // Add event listeners to buttons
    addViewEventListeners();
}

/**
 * Update pagination controls
 */
function updatePagination(containerId, totalPages, currentPage, callback) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (totalPages <= 1) {
        return;
    }
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-secondary';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            callback(currentPage - 1);
        }
    });
    container.appendChild(prevBtn);
    
    // Page buttons
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = i === currentPage ? 'btn btn-primary' : 'btn btn-secondary';
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => callback(i));
        container.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-secondary';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            callback(currentPage + 1);
        }
    });
    container.appendChild(nextBtn);
}

/**
 * View user details
 */
function viewUser(userId) {
    const user = usersData.find(u => u.id === userId);
    if (user) {
        alert(`User Details:\n\nName: ${user.name}\nEmail: ${user.email}\nBlood Type: ${user.bloodType}\nRole: ${user.role}\nStatus: ${user.status}\nPhone: ${user.phone || 'N/A'}\nAddress: ${user.address || 'N/A'}`);
    }
}

/**
 * View donation details
 */
function viewDonation(donationId) {
    const donation = donationsData.find(d => d.id === donationId);
    if (donation) {
        alert(`Donation Details:\n\nDonor: ${donation.donorName}\nBlood Type: ${donation.bloodType}\nUnits: ${donation.units}\nDate: ${donation.date}\nLocation: ${donation.location}\nNotes: ${donation.notes || 'N/A'}`);
    }
}

/**
 * Load donations data from the API
 */
function loadDonations() {
    const apiUrl = getAPIBaseURL() + '/admin/donations';
    
    fetch(apiUrl, {
        method: 'GET',
        headers: getAdminAuthHeaders()
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load donations');
        }
        return response.json();
    })
    .then(data => {
        // Check if data has the expected structure
        if (data && data.success && data.data && data.data.donations) {
            // Store donations data globally
            donationsData = data.data.donations;
            
            // Display donations
            filterDonations();
        } else {
            console.error('Invalid donations data structure received from API');
            showNotification('Invalid donations data received from server', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading donations:', error);
        showNotification('Failed to load donations. Please try again.', 'error');
    });
}

/**
 * Filter and display donations based on search and filter criteria
 */
function filterDonations() {
    const searchTerm = document.getElementById('donationSearch')?.value?.toLowerCase() || '';
    const bloodTypeFilter = document.getElementById('bloodTypeFilter')?.value || '';
    
    if (!Array.isArray(donationsData)) {
        console.error('Donations data is not an array');
        return;
    }
    
    const filteredDonations = donationsData.filter(donation => {
        const donorName = donation.donorName?.toLowerCase() || '';
        const bloodType = donation.bloodType?.toLowerCase() || '';
        
        const matchesSearch = donorName.includes(searchTerm) || 
                             bloodType.includes(searchTerm);
        const matchesBloodType = bloodTypeFilter === '' || 
                               bloodType === bloodTypeFilter.toLowerCase();
        
        return matchesSearch && matchesBloodType;
    });
    
    displayDonations(filteredDonations);
}

/**
 * Load blood requests data from the API
 */
function loadRequests() {
    const apiUrl = getAPIBaseURL() + '/admin/requests';
    
    fetch(apiUrl, {
        method: 'GET',
        headers: getAdminAuthHeaders()
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load requests');
        }
        return response.json();
    })
    .then(data => {
        // Check if data has the expected structure
        if (data && data.success && data.data && data.data.requests) {
            // Store requests data globally
            requestsData = data.data.requests;
            
            // Display requests
            filterRequests();
        } else {
            console.error('Invalid requests data structure received from API');
            showNotification('Invalid requests data received from server', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading requests:', error);
        showNotification('Failed to load requests. Please try again.', 'error');
    });
}

/**
 * Filter and display requests based on search and filter criteria
 */
function filterRequests() {
    const searchTerm = document.getElementById('requestSearch')?.value?.toLowerCase() || '';
    const statusFilter = document.getElementById('requestStatusFilter')?.value || '';
    
    if (!Array.isArray(requestsData)) {
        console.error('Requests data is not an array');
        return;
    }
    
    const filteredRequests = requestsData.filter(request => {
        const requesterName = request.requesterName?.toLowerCase() || '';
        const bloodGroup = request.bloodGroup?.toLowerCase() || '';
        const status = request.status?.toLowerCase() || '';
        
        const matchesSearch = requesterName.includes(searchTerm) || 
                             bloodGroup.includes(searchTerm);
        const matchesStatus = statusFilter === '' || 
                            status === statusFilter.toLowerCase();
        
        return matchesSearch && matchesStatus;
    });
    
    displayRequests(filteredRequests);
}

/**
 * Display users in the users table
 */
function displayUsers(users) {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) {
        console.error('Users table body element not found');
        return;
    }
    
    // Clear existing table rows
    tableBody.innerHTML = '';
    
    if (users.length === 0) {
        // Display no users found message
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `<td colspan="6" class="text-center">No users found</td>`;
        tableBody.appendChild(noDataRow);
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentUsersPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = users.slice(startIndex, endIndex);
    
    // Create table rows for each user
    paginatedUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.phone || 'N/A'}</td>
            <td>${user.bloodType || 'N/A'}</td>
            <td>${user.status || 'Active'}</td>
            <td>
                <button class="btn btn-sm btn-primary view-btn" data-id="${user.id}">View</button>
            </td>
        `;
        tableBody.appendChild(row);
        
        // Add event listener to view button
        const viewBtn = row.querySelector('.view-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', () => viewUser(user.id));
        }
    });
    
    // Update pagination controls
    updatePagination(users.length, currentUsersPage, 'usersPagination', (page) => {
        currentUsersPage = page;
        displayUsers(users);
    });
}

/**
 * Display donations in the donations table
 */
function displayDonations(donations) {
    const tableBody = document.getElementById('donationsTableBody');
    if (!tableBody) {
        console.error('Donations table body element not found');
        return;
    }
    
    // Clear existing table rows
    tableBody.innerHTML = '';
    
    if (donations.length === 0) {
        // Display no donations found message
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `<td colspan="6" class="text-center">No donations found</td>`;
        tableBody.appendChild(noDataRow);
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentDonationsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDonations = donations.slice(startIndex, endIndex);
    
    // Create table rows for each donation
    paginatedDonations.forEach(donation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${donation.donorName || 'N/A'}</td>
            <td>${donation.bloodType || 'N/A'}</td>
            <td>${donation.units || '1'}</td>
            <td>${formatDate(donation.date) || 'N/A'}</td>
            <td>${donation.location || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-primary view-btn" data-id="${donation.id}">View</button>
            </td>
        `;
        tableBody.appendChild(row);
        
        // Add event listener to view button
        const viewBtn = row.querySelector('.view-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', () => viewDonation(donation.id));
        }
    });
    
    // Update pagination controls
    updatePagination(donations.length, currentDonationsPage, 'donationsPagination', (page) => {
        currentDonationsPage = page;
        displayDonations(donations);
    });
}

/**
 * Display requests in the requests table
 */
function displayRequests(requests) {
    const tableBody = document.getElementById('requestsTableBody');
    if (!tableBody) {
        console.error('Requests table body element not found');
        return;
    }
    
    // Clear existing table rows
    tableBody.innerHTML = '';
    
    if (requests.length === 0) {
        // Display no requests found message
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `<td colspan="6" class="text-center">No requests found</td>`;
        tableBody.appendChild(noDataRow);
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentRequestsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedRequests = requests.slice(startIndex, endIndex);
    
    // Create table rows for each request
    paginatedRequests.forEach(request => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.requesterName || 'N/A'}</td>
            <td>${request.bloodGroup || 'N/A'}</td>
            <td>${request.units || '1'}</td>
            <td>${formatDate(request.date) || 'N/A'}</td>
            <td>${request.status || 'Pending'}</td>
            <td>
                <button class="btn btn-sm btn-primary view-btn" data-id="${request.id}">View</button>
            </td>
        `;
        tableBody.appendChild(row);
        
        // Add event listener to view button
        const viewBtn = row.querySelector('.view-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', () => viewRequest(request.id));
        }
    });
    
    // Update pagination controls
    updatePagination(requests.length, currentRequestsPage, 'requestsPagination', (page) => {
        currentRequestsPage = page;
        displayRequests(requests);
    });
}

/**
 * Format date to a readable string
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

/**
 * Update pagination controls
 */
function updatePagination(totalItems, currentPage, paginationId, callback) {
    const paginationElement = document.getElementById(paginationId);
    if (!paginationElement) return;
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Clear existing pagination
    paginationElement.innerHTML = '';
    
    // Don't show pagination if there's only one page
    if (totalPages <= 1) return;
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
    if (currentPage > 1) {
        prevLi.addEventListener('click', () => callback(currentPage - 1));
    }
    paginationElement.appendChild(prevLi);
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        if (i !== currentPage) {
            pageLi.addEventListener('click', () => callback(i));
        }
        paginationElement.appendChild(pageLi);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
    if (currentPage < totalPages) {
        nextLi.addEventListener('click', () => callback(currentPage + 1));
    }
    paginationElement.appendChild(nextLi);
}

/**
 * Load users data from the API
 */
function loadUsers() {
    const apiUrl = getAPIBaseURL() + '/admin/users';
    
    fetch(apiUrl, {
        method: 'GET',
        headers: getAdminAuthHeaders()
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load users');
        }
        return response.json();
    })
    .then(data => {
        // Check if data has the expected structure
        if (data && data.success && data.data && data.data.users) {
            // Store users data globally
            usersData = data.data.users;
            
            // Display users
            filterUsers();
        } else {
            console.error('Invalid users data structure received from API');
            showNotification('Invalid users data received from server', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading users:', error);
        showNotification('Failed to load users. Please try again.', 'error');
    });
}

/**
 * Filter and display users based on search and filter criteria
 */
function filterUsers() {
    const searchTerm = document.getElementById('userSearch')?.value?.toLowerCase() || '';
    const bloodTypeFilter = document.getElementById('bloodTypeFilter')?.value || '';
    
    if (!Array.isArray(usersData)) {
        console.error('Users data is not an array');
        return;
    }
    
    const filteredUsers = usersData.filter(user => {
        const name = user.name?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        const bloodType = user.bloodType?.toLowerCase() || '';
        
        const matchesSearch = name.includes(searchTerm) || 
                             email.includes(searchTerm);
        const matchesBloodType = bloodTypeFilter === '' || 
                               bloodType === bloodTypeFilter.toLowerCase();
        
        return matchesSearch && matchesBloodType;
    });
    
    displayUsers(filteredUsers);
}

/**
 * View user details
 */
function viewUser(userId) {
    const user = usersData.find(u => u.id === userId);
    if (user) {
        alert(`User Details:\n\nName: ${user.name || 'N/A'}\nEmail: ${user.email || 'N/A'}\nPhone: ${user.phone || 'N/A'}\nBlood Type: ${user.bloodType || 'N/A'}\nStatus: ${user.status || 'Active'}\nRegistered: ${formatDate(user.createdAt) || 'N/A'}`);
    }
}

/**
 * Handle logout functionality
 */
function logout() {
    // Clear admin authentication data
    localStorage.removeItem('admin_email');
    sessionStorage.removeItem('admin_email');
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_token');
    localStorage.removeItem('bloodconnect_admin');
    localStorage.removeItem('admin_login_time');
    
    // Redirect to admin login page
    window.location.href = 'admin-login.html';
}

/**
 * Get the API base URL
 */
function getAPIBaseURL() {
    // Check if we're in production or development
    const isProduction = window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1';
    
    if (isProduction) {
        return 'https://blood-donation-website5.onrender.com/api';
    } else {
        return 'http://localhost:3002/api';
    }
}

/**
 * Get admin authentication headers
 */
function getAdminAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // Add admin email and auth token as expected by the backend
    const adminEmail = localStorage.getItem('admin_email');
    if (adminEmail) {
        headers['x-admin-email'] = adminEmail;
    }
    
    // Use admin_token as the auth token
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
        headers['x-admin-auth'] = adminToken;
    }
    
    return headers;
}

/**
 * Show notification to the user
 */
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '1000';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    }, 5000);
}