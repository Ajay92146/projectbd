/**
 * Urgent Requests Page JavaScript
 * Handles data fetching, filtering, and display of blood requests
 */

class UrgentRequestsManager {
    constructor() {
        this.currentPage = 1;
        this.limit = 12;
        this.totalPages = 0;
        this.currentFilters = {};
        this.allRequests = [];
        this.urgentRequests = [];
        this.emergencyRequests = [];
        this.stats = {};
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Urgent Requests page...');
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Load initial data
        await this.loadInitialData();
        
        console.log('✅ Urgent Requests page initialized');
    }

    initEventListeners() {
        // Filter button
        const applyFiltersBtn = document.getElementById('applyFiltersBtn');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }

        // Enter key on filter inputs
        const filterInputs = document.querySelectorAll('.filter-input, .filter-select');
        filterInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyFilters();
                }
            });
        });

        // Auto-refresh every 5 minutes
        setInterval(() => {
            console.log('🔄 Auto-refreshing requests...');
            this.loadInitialData();
        }, 5 * 60 * 1000);
    }

    async loadInitialData() {
        try {
            console.log('📡 Loading initial data...');
            
            // Show loading state
            this.showLoading();
            
            // Load data in parallel
            await Promise.all([
                this.loadStats(),
                this.loadEmergencyRequests(),
                this.loadAllRequests()
            ]);

            // Hide loading state
            this.hideLoading();
            
            console.log('✅ Initial data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            this.showError('Failed to load blood requests. Please try again.');
        }
    }

    async loadStats() {
        try {
            console.log('📊 Loading statistics...');
            
            const response = await fetch('/api/requests/stats', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.stats = result.data;
                this.updateStatsDisplay();
                console.log('✅ Statistics loaded:', this.stats);
            } else {
                throw new Error(result.message || 'Failed to load statistics');
            }
        } catch (error) {
            console.error('❌ Error loading statistics:', error);
            // Set default stats
            this.stats = {
                totalRequests: 0,
                pendingRequests: 0,
                urgentRequests: 0
            };
            this.updateStatsDisplay();
        }
    }

    async loadEmergencyRequests() {
        try {
            console.log('🚨 Loading emergency requests...');
            
            const response = await fetch('/api/requests/emergency', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.emergencyRequests = result.data.emergencyRequests || [];
                this.displayEmergencyRequests();
                console.log('✅ Emergency requests loaded:', this.emergencyRequests.length);
            }
        } catch (error) {
            console.error('❌ Error loading emergency requests:', error);
            this.emergencyRequests = [];
            this.displayEmergencyRequests();
        }
    }

    async loadAllRequests(page = 1) {
        try {
            console.log(`📋 Loading all requests (page ${page})...`);
            
            // Build query parameters
            const params = new URLSearchParams({
                page: page.toString(),
                limit: this.limit.toString()
            });

            // Add filters
            if (this.currentFilters.bloodGroup) {
                params.append('bloodGroup', this.currentFilters.bloodGroup);
            }
            if (this.currentFilters.location) {
                params.append('location', this.currentFilters.location);
            }
            if (this.currentFilters.urgency) {
                params.append('urgency', this.currentFilters.urgency);
            }

            const response = await fetch(`/api/requests?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.allRequests = result.data.requests || [];
                this.currentPage = result.data.pagination?.currentPage || 1;
                this.totalPages = result.data.pagination?.totalPages || 0;
                
                this.displayAllRequests();
                this.updatePagination();
                this.updateResultsCount();
                
                console.log('✅ All requests loaded:', this.allRequests.length);
            } else {
                throw new Error(result.message || 'Failed to load requests');
            }
        } catch (error) {
            console.error('❌ Error loading all requests:', error);
            this.allRequests = [];
            this.displayAllRequests();
        }
    }

    updateStatsDisplay() {
        // Update stat cards
        const elements = {
            totalRequestsCount: this.stats.totalRequests || 0,
            urgentRequestsCount: this.stats.urgentRequests || 0,
            criticalRequestsCount: this.stats.requestsByUrgency?.find(u => u._id === 'Critical')?.count || 0,
            emergencyRequestsCount: this.emergencyRequests.length || 0
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    displayEmergencyRequests() {
        const emergencySection = document.getElementById('emergencySection');
        const emergencyGrid = document.getElementById('emergencyGrid');
        
        if (!emergencySection || !emergencyGrid) return;

        if (this.emergencyRequests.length === 0) {
            emergencySection.style.display = 'none';
            return;
        }

        emergencySection.style.display = 'block';
        
        const html = this.emergencyRequests.map(request => this.createEmergencyCardHTML(request)).join('');
        emergencyGrid.innerHTML = html;
    }

    displayAllRequests() {
        const requestsGrid = document.getElementById('requestsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!requestsGrid || !emptyState) return;

        if (this.allRequests.length === 0) {
            requestsGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        requestsGrid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        const html = this.allRequests.map(request => this.createRequestCardHTML(request)).join('');
        requestsGrid.innerHTML = html;
        
        // Add event listeners to action buttons
        this.addCardEventListeners();
    }

    createEmergencyCardHTML(request) {
        const timeInfo = this.getTimeInfo(request);
        const urgencyClass = request.urgency.toLowerCase();
        
        // Debug log to check request data
        console.log('🩸 Emergency Request Data:', {
            patientName: request.patientName,
            contactNumber: request.contactNumber,
            hospitalName: request.hospitalName,
            location: request.location
        });
        
        return `
            <div class="request-card ${urgencyClass}" style="margin-bottom: var(--spacing-4);">
                <div class="card-header">
                    <div class="urgency-badge ${urgencyClass}">${request.urgency}</div>
                    <div class="blood-type">${request.bloodGroup}</div>
                    <h4 class="patient-name">${request.patientName}</h4>
                    <div class="request-details">
                        <div class="detail-row">
                            <i class="fas fa-tint"></i>
                            <span>${request.requiredUnits} unit${request.requiredUnits > 1 ? 's' : ''} needed</span>
                        </div>
                        <div class="detail-row">
                            <i class="fas fa-hospital"></i>
                            <span>${request.hospitalName}</span>
                        </div>
                        <div class="detail-row">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${request.location}</span>
                        </div>
                        <div class="detail-row">
                            <i class="fas fa-clock"></i>
                            <span class="time-remaining ${timeInfo.class}">${timeInfo.text}</span>
                        </div>
                        ${request.contactNumber ? `
                        <div class="detail-row">
                            <i class="fas fa-phone"></i>
                            <a href="tel:${request.contactNumber}" class="contact-link">
                                <i class="fas fa-phone-alt"></i>
                                ${request.contactNumber}
                            </a>
                        </div>` : ''}
                    </div>
                </div>
                <div class="card-footer">
                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="urgentRequestsManager.helpWithRequest('${request._id}', '${request.patientName}', '${request.bloodGroup}')">
                            I Can Help
                        </button>
                        <button class="btn btn-secondary" onclick="urgentRequestsManager.shareRequest('${request._id}')">
                            Share
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createRequestCardHTML(request) {
        const timeInfo = this.getTimeInfo(request);
        const urgencyClass = request.urgency.toLowerCase();
        
        // Debug log to check request data
        console.log('🩸 Regular Request Data:', {
            patientName: request.patientName,
            contactNumber: request.contactNumber,
            hospitalName: request.hospitalName,
            location: request.location
        });
        
        return `
            <div class="request-card ${urgencyClass}">
                <div class="card-header">
                    <div class="urgency-badge ${urgencyClass}">${request.urgency}</div>
                    <div class="blood-type">${request.bloodGroup}</div>
                    <h4 class="patient-name">${request.patientName}</h4>
                    <div class="request-details">
                        <div class="detail-row">
                            <i class="fas fa-tint"></i>
                            <span>${request.requiredUnits} unit${request.requiredUnits > 1 ? 's' : ''} needed</span>
                        </div>
                        <div class="detail-row">
                            <i class="fas fa-hospital"></i>
                            <span>${request.hospitalName}</span>
                        </div>
                        <div class="detail-row">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${request.location}</span>
                        </div>
                        <div class="detail-row">
                            <i class="fas fa-clock"></i>
                            <span class="time-remaining ${timeInfo.class}">${timeInfo.text}</span>
                        </div>
                        ${request.contactNumber ? `
                        <div class="detail-row">
                            <i class="fas fa-phone"></i>
                            <a href="tel:${request.contactNumber}" class="contact-link">
                                <i class="fas fa-phone-alt"></i>
                                ${request.contactNumber}
                            </a>
                        </div>` : ''}
                        ${request.contactPersonName ? `
                        <div class="detail-row">
                            <i class="fas fa-user"></i>
                            <span>${request.contactPersonName} (${request.relationship})</span>
                        </div>` : ''}
                        ${request.additionalNotes ? `
                        <div class="detail-row">
                            <i class="fas fa-sticky-note"></i>
                            <span>${request.additionalNotes}</span>
                        </div>` : ''}
                    </div>
                </div>
                <div class="card-footer">
                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="urgentRequestsManager.helpWithRequest('${request._id}', '${request.patientName}', '${request.bloodGroup}')">
                            I Can Help
                        </button>
                        <button class="btn btn-secondary" onclick="urgentRequestsManager.shareRequest('${request._id}')">
                            Share
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getTimeInfo(request) {
        const now = new Date();
        const requiredBy = new Date(request.requiredBy);
        const timeDiff = requiredBy.getTime() - now.getTime();
        const hoursLeft = Math.ceil(timeDiff / (1000 * 60 * 60));
        const daysLeft = Math.ceil(hoursLeft / 24);

        if (hoursLeft <= 0) {
            return { text: 'Expired', class: 'urgent' };
        } else if (hoursLeft <= 24) {
            return { text: `${hoursLeft} hour${hoursLeft > 1 ? 's' : ''} left`, class: 'urgent' };
        } else if (daysLeft <= 3) {
            return { text: `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`, class: 'warning' };
        } else {
            return { text: `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`, class: 'normal' };
        }
    }

    addCardEventListeners() {
        // Event listeners are handled by onclick attributes in the HTML
        // This could be enhanced to use proper event delegation
    }

    async applyFilters() {
        console.log('🔍 Applying filters...');
        
        // Get filter values
        this.currentFilters = {
            bloodGroup: document.getElementById('bloodGroupFilter')?.value || '',
            location: document.getElementById('locationFilter')?.value || '',
            urgency: document.getElementById('urgencyFilter')?.value || '',
            sort: document.getElementById('sortFilter')?.value || 'urgency'
        };

        // Reset to first page
        this.currentPage = 1;
        
        // Show loading
        this.showLoading();
        
        // Reload requests with filters
        await this.loadAllRequests(1);
        
        // Hide loading
        this.hideLoading();
        
        console.log('✅ Filters applied:', this.currentFilters);
    }

    async changePage(page) {
        if (page < 1 || page > this.totalPages) return;
        
        this.showLoading();
        await this.loadAllRequests(page);
        this.hideLoading();
    }

    updatePagination() {
        const container = document.getElementById('paginationContainer');
        if (!container) return;

        if (this.totalPages <= 1) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        
        let html = '';
        
        // Previous button
        html += `
            <button class="pagination-btn" ${this.currentPage <= 1 ? 'disabled' : ''} 
                    onclick="urgentRequestsManager.changePage(${this.currentPage - 1})">
                Previous
            </button>
        `;
        
        // Page numbers
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="urgentRequestsManager.changePage(${i})">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        html += `
            <button class="pagination-btn" ${this.currentPage >= this.totalPages ? 'disabled' : ''} 
                    onclick="urgentRequestsManager.changePage(${this.currentPage + 1})">
                Next
            </button>
        `;
        
        container.innerHTML = html;
    }

    updateResultsCount() {
        const element = document.getElementById('resultsCount');
        if (element) {
            const start = (this.currentPage - 1) * this.limit + 1;
            const end = Math.min(this.currentPage * this.limit, this.stats.totalRequests || 0);
            const total = this.stats.totalRequests || 0;
            
            if (total > 0) {
                element.textContent = `(Showing ${start}-${end} of ${total})`;
            } else {
                element.textContent = '';
            }
        }
    }

    async helpWithRequest(requestId, patientName, bloodGroup) {
        console.log(`💝 Helping with request: ${requestId}`);
        
        // Show confirmation dialog
        const confirmed = confirm(
            `🩸 Thank you for wanting to help!\n\n` +
            `Patient: ${patientName}\n` +
            `Blood Group: ${bloodGroup}\n\n` +
            `You will be redirected to the donation page where you can register as a donor and get connected with the blood bank.`
        );
        
        if (confirmed) {
            // Store context for donation page
            localStorage.setItem('helpingRequestId', requestId);
            localStorage.setItem('helpingPatientName', patientName);
            localStorage.setItem('helpingBloodGroup', bloodGroup);
            
            // Redirect to donation page
            window.location.href = 'donate.html';
        }
    }

    async shareRequest(requestId) {
        console.log(`📤 Sharing request: ${requestId}`);
        
        const request = this.allRequests.find(r => r._id === requestId) || 
                       this.emergencyRequests.find(r => r._id === requestId);
        
        if (!request) {
            alert('Request not found');
            return;
        }
        
        const shareText = `🩸 URGENT BLOOD REQUEST 🩸\n\n` +
            `Patient: ${request.patientName}\n` +
            `Blood Group: ${request.bloodGroup}\n` +
            `Units Needed: ${request.requiredUnits}\n` +
            `Hospital: ${request.hospitalName}\n` +
            `Location: ${request.location}\n` +
            `Urgency: ${request.urgency}\n\n` +
            `Please help save a life by donating blood!\n` +
            `Visit: ${window.location.href}`;
        
        // Try to use Web Share API if available
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Urgent Blood Request',
                    text: shareText,
                    url: window.location.href
                });
                console.log('✅ Shared successfully');
            } catch (error) {
                console.log('❌ Share cancelled or failed:', error);
                this.fallbackShare(shareText);
            }
        } else {
            this.fallbackShare(shareText);
        }
    }

    fallbackShare(text) {
        // Copy to clipboard
        navigator.clipboard.writeText(text).then(() => {
            alert('Request details copied to clipboard! You can now paste and share it.');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Request details copied to clipboard! You can now paste and share it.');
        });
    }

    showLoading() {
        const loadingState = document.getElementById('loadingState');
        const requestsGrid = document.getElementById('requestsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (loadingState) loadingState.style.display = 'block';
        if (requestsGrid) requestsGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
    }

    hideLoading() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) loadingState.style.display = 'none';
    }

    showError(message) {
        console.error('❌ Error:', message);
        
        const requestsGrid = document.getElementById('requestsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (requestsGrid) {
            requestsGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-exclamation-triangle" style="color: var(--error-red);"></i>
                    <h3>Error Loading Requests</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="urgentRequestsManager.loadInitialData()" style="margin-top: var(--spacing-4);">
                        <i class="fas fa-redo"></i>
                        Try Again
                    </button>
                </div>
            `;
            requestsGrid.style.display = 'grid';
        }
        
        if (emptyState) emptyState.style.display = 'none';
        this.hideLoading();
    }
    
    // Format phone number for display with partial masking for privacy
    formatPhoneNumber(phoneNumber) {
        if (!phoneNumber || phoneNumber.length !== 10) {
            return phoneNumber;
        }
        // Show first 3 digits, mask middle 4, show last 3: 987****210
        return `${phoneNumber.slice(0, 3)}****${phoneNumber.slice(-3)}`;
    }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing Urgent Requests Manager...');
    
    // Create global instance
    window.urgentRequestsManager = new UrgentRequestsManager();
});

// Handle page visibility changes for auto-refresh
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && window.urgentRequestsManager) {
        console.log('👁️ Page became visible, refreshing data...');
        window.urgentRequestsManager.loadInitialData();
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UrgentRequestsManager;
}