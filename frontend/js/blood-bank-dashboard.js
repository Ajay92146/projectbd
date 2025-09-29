// Blood Bank Dashboard JavaScript

// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// Global variables
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let currentApplicationId = null;

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
    
    // Refresh buttons
    document.getElementById('refreshDonationsBtn').addEventListener('click', function() {
        loadPendingDonations();
        loadDashboardStats();
    });
    
    document.getElementById('refreshApplicationsBtn').addEventListener('click', loadDonorApplications);
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', switchTab);
    });
    
    // Filter application
    document.getElementById('applyFiltersBtn').addEventListener('click', function() {
        loadDonorApplications(1);
    });
    
    // Modal events
    document.querySelector('.close').addEventListener('click', closeReviewModal);
    document.getElementById('cancelReviewBtn').addEventListener('click', closeReviewModal);
    document.getElementById('reviewForm').addEventListener('submit', submitReview);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('reviewModal');
        if (event.target === modal) {
            closeReviewModal();
        }
    });
}

function switchTab(event) {
    const tabName = event.target.getAttribute('data-tab');
    
    // Update active tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update active tab content
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    if (tabName === 'donations') {
        document.getElementById('donations-tab').classList.add('active');
    } else if (tabName === 'applications') {
        document.getElementById('applications-tab').classList.add('active');
        // Load applications when switching to this tab
        loadDonorApplications();
    }
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
            document.getElementById('pendingApplications').textContent = data.data.availableRequestsCount || 0;
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
            
            renderPagination('donationsPagination', pagination, loadPendingDonations);
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

// New function to load donor applications
async function loadDonorApplications(page = 1) {
    if (isLoading) return;
    
    isLoading = true;
    const tableBody = document.getElementById('applicationsTableBody');
    
    // Show loading state
    tableBody.innerHTML = `
        <tr>
            <td colspan="9" style="text-align: center; padding: 2rem; color: #7f8c8d;">
                <i class="fas fa-spinner fa-spin"></i> Loading applications...
            </td>
        </tr>
    `;
    
    try {
        const token = localStorage.getItem('bloodBankToken');
        
        // Get filter values
        const bloodGroup = document.getElementById('bloodGroupFilter').value;
        const city = document.getElementById('cityFilter').value;
        const status = document.getElementById('statusFilter').value;
        
        // Build query parameters
        let queryParams = `page=${page}&limit=10`;
        if (bloodGroup) queryParams += `&bloodGroup=${bloodGroup}`;
        if (city) queryParams += `&city=${city}`;
        if (status) queryParams += `&status=${status}`;
        
        const response = await fetch(`${API_BASE_URL}/bloodbank/donor-applications?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const applications = data.data.applications;
            const pagination = data.data.pagination;
            
            if (applications.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 2rem; color: #7f8c8d;">
                            <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                            No donor applications found
                        </td>
                    </tr>
                `;
            } else {
                renderApplicationsTable(applications);
            }
            
            renderPagination('applicationsPagination', pagination, loadDonorApplications);
        } else {
            console.error('Failed to load donor applications:', data.message);
            showError('Failed to load donor applications');
        }
    } catch (error) {
        console.error('Error loading donor applications:', error);
        showError('Error loading donor applications');
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: #e74c3c;">
                    Error loading applications. Please refresh and try again.
                </td>
            </tr>
        `;
    } finally {
        isLoading = false;
    }
}

// New function to render applications table
function renderApplicationsTable(applications) {
    const tableBody = document.getElementById('applicationsTableBody');
    
    const rows = applications.map(application => {
        const preferredDate = new Date(application.dateOfDonation).toLocaleDateString();
        const statusClass = application.applicationStatus === 'approved' ? 'status-approved' : 
                          application.applicationStatus === 'rejected' ? 'status-rejected' : 
                          application.applicationStatus === 'under_review' ? 'status-review' : 'status-pending';
        
        return `
            <tr>
                <td>${application.name}</td>
                <td>${application.age}</td>
                <td>${application.gender}</td>
                <td><strong>${application.bloodGroup}</strong></td>
                <td>${application.email}<br>${application.contactNumber}</td>
                <td>${application.city}, ${application.state}</td>
                <td>${preferredDate}</td>
                <td><span class="status-badge ${statusClass}">${application.applicationStatus}</span></td>
                <td>
                    <button class="view-btn" onclick="viewApplication('${application._id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="review-btn" onclick="openReviewModal('${application._id}')">
                        <i class="fas fa-edit"></i> Review
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = rows;
}

// New function to render pagination
function renderPagination(containerId, pagination, loadFunction) {
    const paginationContainer = document.getElementById(containerId);
    
    if (pagination.totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (pagination.currentPage > 1) {
        paginationHTML += `
            <button class="pagination-btn" onclick="${loadFunction.name}(${pagination.currentPage - 1})">
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
            <button class="pagination-btn ${isActive ? 'active' : ''}" onclick="${loadFunction.name}(${i})">
                ${i}
            </button>
        `;
    }
    
    // Next button
    if (pagination.currentPage < pagination.totalPages) {
        paginationHTML += `
            <button class="pagination-btn" onclick="${loadFunction.name}(${pagination.currentPage + 1})">
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

// New function to view application details
function viewApplication(applicationId) {
    // For now, we'll just open the review modal
    openReviewModal(applicationId);
}

// New function to open review modal
function openReviewModal(applicationId) {
    currentApplicationId = applicationId;
    document.getElementById('reviewModal').style.display = 'block';
    document.getElementById('reviewStatus').value = '';
    document.getElementById('reviewNotes').value = '';
    
    // Load application details
    loadApplicationDetails(applicationId);
}

// New function to load application details
async function loadApplicationDetails(applicationId) {
    try {
        const token = localStorage.getItem('bloodBankToken');
        const response = await fetch(`${API_BASE_URL}/bloodbank/donor-applications?page=1&limit=100`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const application = data.data.applications.find(app => app._id === applicationId);
            if (application) {
                renderApplicationDetails(application);
            }
        }
    } catch (error) {
        console.error('Error loading application details:', error);
    }
}

// New function to render application details
function renderApplicationDetails(application) {
    const detailsContainer = document.getElementById('applicationDetails');
    
    const preferredDate = new Date(application.dateOfDonation).toLocaleDateString();
    const applicationDate = new Date(application.applicationDate).toLocaleDateString();
    
    detailsContainer.innerHTML = `
        <div class="application-details">
            <h3>${application.name}</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>Age:</strong> ${application.age}
                </div>
                <div class="detail-item">
                    <strong>Gender:</strong> ${application.gender}
                </div>
                <div class="detail-item">
                    <strong>Blood Group:</strong> <span class="blood-group">${application.bloodGroup}</span>
                </div>
                <div class="detail-item">
                    <strong>Weight:</strong> ${application.weight || 'N/A'} kg
                </div>
                <div class="detail-item">
                    <strong>Email:</strong> ${application.email}
                </div>
                <div class="detail-item">
                    <strong>Phone:</strong> ${application.contactNumber}
                </div>
                <div class="detail-item">
                    <strong>Emergency Contact:</strong> ${application.emergencyContact || 'N/A'}
                </div>
                <div class="detail-item">
                    <strong>City:</strong> ${application.city}, ${application.state}
                </div>
                <div class="detail-item">
                    <strong>Preferred Date:</strong> ${preferredDate}
                </div>
                <div class="detail-item">
                    <strong>Preferred Time:</strong> ${application.preferredTime || 'N/A'}
                </div>
                <div class="detail-item">
                    <strong>Application Date:</strong> ${applicationDate}
                </div>
                <div class="detail-item">
                    <strong>Status:</strong> <span class="status-badge status-${application.applicationStatus}">${application.applicationStatus}</span>
                </div>
            </div>
            <div class="detail-section">
                <strong>Address:</strong>
                <p>${application.address || 'N/A'}</p>
            </div>
            <div class="detail-section">
                <strong>Medical History:</strong>
                <p>${application.medicalHistory || 'No medical history provided'}</p>
            </div>
            <div class="detail-section">
                <strong>Availability:</strong>
                <p>${application.availability || 'N/A'}</p>
            </div>
            <div class="consents">
                <strong>Consents:</strong>
                <div class="consent-item">
                    <i class="fas ${application.consents?.health ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    Health Information Consent
                </div>
                <div class="consent-item">
                    <i class="fas ${application.consents?.data ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    Data Processing Consent
                </div>
                <div class="consent-item">
                    <i class="fas ${application.consents?.contact ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    Contact Consent
                </div>
            </div>
        </div>
    `;
}

// New function to close review modal
function closeReviewModal() {
    document.getElementById('reviewModal').style.display = 'none';
    currentApplicationId = null;
}

// New function to submit review
async function submitReview(event) {
    event.preventDefault();
    
    const status = document.getElementById('reviewStatus').value;
    const notes = document.getElementById('reviewNotes').value;
    
    if (!status) {
        showError('Please select a status');
        return;
    }
    
    if (!currentApplicationId) {
        showError('No application selected');
        return;
    }
    
    try {
        const token = localStorage.getItem('bloodBankToken');
        const response = await fetch(`${API_BASE_URL}/bloodbank/review-application/${currentApplicationId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: status,
                notes: notes
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Application reviewed successfully!');
            closeReviewModal();
            // Reload applications
            loadDonorApplications();
            // Reload dashboard stats
            loadDashboardStats();
        } else {
            showError(data.message || 'Failed to review application');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        showError('Error submitting review. Please try again.');
    }
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
    
    .tabs-container {
        margin-top: 2rem;
    }
    
    .tabs {
        display: flex;
        border-bottom: 1px solid #e1e8ed;
        margin-bottom: 1rem;
    }
    
    .tab-btn {
        padding: 1rem 2rem;
        background: none;
        border: none;
        cursor: pointer;
        font-weight: 500;
        color: #6c757d;
        border-bottom: 3px solid transparent;
        transition: all 0.3s;
    }
    
    .tab-btn:hover {
        color: #e74c3c;
        background-color: #f8f9fa;
    }
    
    .tab-btn.active {
        color: #e74c3c;
        border-bottom: 3px solid #e74c3c;
    }
    
    .tab-pane {
        display: none;
    }
    
    .tab-pane.active {
        display: block;
    }
    
    .filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        align-items: end;
    }
    
    .filter-group {
        display: flex;
        flex-direction: column;
    }
    
    .filter-group label {
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
        color: #6c757d;
    }
    
    .filter-group select,
    .filter-group input {
        padding: 0.5rem;
        border: 1px solid #e1e8ed;
        border-radius: 4px;
        font-size: 0.875rem;
    }
    
    .apply-filters-btn {
        padding: 0.5rem 1rem;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .apply-filters-btn:hover {
        background: #c0392b;
    }
    
    .status-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: capitalize;
    }
    
    .status-pending {
        background-color: #fff3cd;
        color: #856404;
    }
    
    .status-approved {
        background-color: #d4edda;
        color: #155724;
    }
    
    .status-rejected {
        background-color: #f8d7da;
        color: #721c24;
    }
    
    .status-review {
        background-color: #cce7ff;
        color: #004085;
    }
    
    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
    }
    
    .modal-content {
        background-color: white;
        margin: 5% auto;
        padding: 2rem;
        border-radius: 8px;
        width: 80%;
        max-width: 600px;
        position: relative;
        max-height: 80vh;
        overflow-y: auto;
    }
    
    .close {
        position: absolute;
        right: 1rem;
        top: 1rem;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6c757d;
    }
    
    .close:hover {
        color: #e74c3c;
    }
    
    .application-details h3 {
        margin-top: 0;
        color: #333;
        border-bottom: 1px solid #e1e8ed;
        padding-bottom: 0.5rem;
    }
    
    .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin: 1rem 0;
    }
    
    .detail-item {
        padding: 0.5rem;
        background-color: #f8f9fa;
        border-radius: 4px;
    }
    
    .detail-section {
        margin: 1rem 0;
    }
    
    .detail-section p {
        margin: 0.5rem 0;
        padding: 0.5rem;
        background-color: #f8f9fa;
        border-radius: 4px;
    }
    
    .consents {
        margin: 1rem 0;
    }
    
    .consent-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0.5rem 0;
    }
    
    .consent-item .fa-check-circle {
        color: #28a745;
    }
    
    .consent-item .fa-times-circle {
        color: #dc3545;
    }
    
    .form-group {
        margin: 1rem 0;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
    }
    
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #e1e8ed;
        border-radius: 4px;
        font-size: 0.875rem;
    }
    
    .form-group textarea {
        min-height: 100px;
        resize: vertical;
    }
    
    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .cancel-btn {
        padding: 0.5rem 1rem;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .submit-btn {
        padding: 0.5rem 1rem;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .submit-btn:hover,
    .cancel-btn:hover {
        opacity: 0.9;
    }
`;

// Inject styles
const styleElement = document.createElement('style');
styleElement.textContent = paginationStyles;
document.head.appendChild(styleElement);