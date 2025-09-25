// Blood Bank Dashboard JavaScript

// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// Global variables
let currentPage = 1;
let totalPages = 1;
let isLoading = false;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadDashboardData();
    setupEventListeners();
});

function checkAuthentication() {
    const token = localStorage.getItem('bloodBankToken');
    const bankInfo = localStorage.getItem('bloodBankInfo');
    
    if (!token || !bankInfo) {
        window.location.href = '/blood-bank-login';
        return;
    }
    
    try {
        const bank = JSON.parse(bankInfo);
        document.getElementById('bankName').textContent = bank.bankName || 'Blood Bank';
    } catch (error) {
        console.error('Error parsing bank info:', error);
        window.location.href = '/blood-bank-login';
    }
}

function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', function() {
        loadPendingDonations();
        loadDashboardStats();
    });
}

async function loadDashboardData() {
    await Promise.all([
        loadDashboardStats(),
        loadPendingDonations()
    ]);
}

async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('bloodBankToken');
        const response = await fetch(`${API_BASE_URL}/bloodbank/dashboard-stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('pendingCount').textContent = data.data.pendingCount;
            document.getElementById('approvedToday').textContent = data.data.approvedToday;
            document.getElementById('totalUnits').textContent = data.data.totalUnits;
        } else {
            console.error('Failed to load dashboard stats:', data.message);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadPendingDonations(page = 1) {
    if (isLoading) return;
    
    isLoading = true;
    const tableBody = document.getElementById('donationsTableBody');
    
    // Show loading state
    tableBody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 2rem; color: #7f8c8d;">
                <i class="fas fa-spinner fa-spin"></i> Loading donations...
            </td>
        </tr>
    `;
    
    try {
        const token = localStorage.getItem('bloodBankToken');
        const response = await fetch(`${API_BASE_URL}/bloodbank/pending-donations?page=${page}&limit=10`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const donations = data.data.donations;
            const pagination = data.data.pagination;
            
            currentPage = pagination.currentPage;
            totalPages = pagination.totalPages;
            
            if (donations.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 2rem; color: #7f8c8d;">
                            <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                            No pending donations to approve
                        </td>
                    </tr>
                `;
            } else {
                renderDonationsTable(donations);
            }
            
            renderPagination(pagination);
        } else {
            console.error('Failed to load pending donations:', data.message);
            showError('Failed to load pending donations');
        }
    } catch (error) {
        console.error('Error loading pending donations:', error);
        showError('Error loading pending donations');
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #e74c3c;">
                    Error loading donations. Please refresh and try again.
                </td>
            </tr>
        `;
    } finally {
        isLoading = false;
    }
}

function renderDonationsTable(donations) {
    const tableBody = document.getElementById('donationsTableBody');
    
    const rows = donations.map(donation => {
        const donationDate = new Date(donation.donationDate).toLocaleDateString();
        const donorName = donation.userId ? `${donation.userId.firstName} ${donation.userId.lastName}` : 'Unknown';
        const donorEmail = donation.userId?.email || 'N/A';
        const donorPhone = donation.userId?.phoneNumber || 'N/A';
        
        return `
            <tr>
                <td>${donorName}</td>
                <td>${donorEmail}</td>
                <td>${donorPhone}</td>
                <td><strong>${donation.bloodGroup}</strong></td>
                <td>${donation.unitsCollected || 1}</td>
                <td>${donationDate}</td>
                <td>${donation.donationCenter?.city || 'N/A'}</td>
                <td>
                    <button class="approve-btn" onclick="approveDonation('${donation._id}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="reject-btn" onclick="rejectDonation('${donation._id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = rows;
}

function renderPagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    
    if (pagination.totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (pagination.currentPage > 1) {
        paginationHTML += `
            <button class="pagination-btn" onclick="loadPendingDonations(${pagination.currentPage - 1})">
                <i class="fas fa-chevron-left"></i> Previous
            </button>
        `;
    }
    
    // Page numbers
    const startPage = Math.max(1, pagination.currentPage - 2);
    const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === pagination.currentPage;
        paginationHTML += `
            <button class="pagination-btn ${isActive ? 'active' : ''}" onclick="loadPendingDonations(${i})">
                ${i}
            </button>
        `;
    }
    
    // Next button
    if (pagination.currentPage < pagination.totalPages) {
        paginationHTML += `
            <button class="pagination-btn" onclick="loadPendingDonations(${pagination.currentPage + 1})">
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }
    
    paginationContainer.innerHTML = `
        <div class="pagination-buttons">
            ${paginationHTML}
        </div>
        <div class="pagination-info">
            Page ${pagination.currentPage} of ${pagination.totalPages} 
            (${pagination.totalItems} total items)
        </div>
    `;
}

async function approveDonation(donationId) {
    if (!confirm('Are you sure you want to approve this donation?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('bloodBankToken');
        const response = await fetch(`${API_BASE_URL}/bloodbank/approve-donation/${donationId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                notes: 'Approved by blood bank'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Donation approved successfully!');
            // Reload data
            loadDashboardStats();
            loadPendingDonations(currentPage);
        } else {
            showError(data.message || 'Failed to approve donation');
        }
    } catch (error) {
        console.error('Error approving donation:', error);
        showError('Error approving donation. Please try again.');
    }
}

async function rejectDonation(donationId) {
    const reason = prompt('Please enter a reason for rejection:');
    if (!reason) {
        return;
    }
    
    try {
        const token = localStorage.getItem('bloodBankToken');
        const response = await fetch(`${API_BASE_URL}/bloodbank/reject-donation/${donationId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason: reason
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Donation rejected successfully!');
            // Reload data
            loadDashboardStats();
            loadPendingDonations(currentPage);
        } else {
            showError(data.message || 'Failed to reject donation');
        }
    } catch (error) {
        console.error('Error rejecting donation:', error);
        showError('Error rejecting donation. Please try again.');
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('bloodBankToken');
        localStorage.removeItem('bloodBankInfo');
        window.location.href = '/blood-bank-login';
    }
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <div class="success-content">
            <span class="success-icon">✓</span>
            <span class="success-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    notification.innerHTML = `
        <div class="success-content">
            <span class="success-icon">✗</span>
            <span class="success-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
}

// Add pagination styles
const paginationStyles = `
    .pagination-buttons {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }
    
    .pagination-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #e1e8ed;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;
        font-size: 0.875rem;
    }
    
    .pagination-btn:hover {
        background: #f8f9fa;
        border-color: #e74c3c;
    }
    
    .pagination-btn.active {
        background: #e74c3c;
        color: white;
        border-color: #e74c3c;
    }
    
    .pagination-info {
        text-align: center;
        color: #6c757d;
        font-size: 0.875rem;
    }
`;

// Inject styles
const styleElement = document.createElement('style');
styleElement.textContent = paginationStyles;
document.head.appendChild(styleElement);