// Profile Page Functionality
console.log('🔄 Profile.js loaded');

// Check if user is logged in
function checkAuth() {
    const user = getCurrentUser();
    if (!user) {
        alert('Please log in to access your profile.');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Get current user data
function getCurrentUser() {
    // Check for actual user data first
    const userData = localStorage.getItem('bloodconnect_user');
    if (userData) {
        return JSON.parse(userData);
    }
    
    // Fallback to demo user
    const demoUser = localStorage.getItem('bloodconnect_demo_user');
    if (demoUser) {
        return JSON.parse(demoUser);
    }
    
    return null;
}

// Load profile data
function loadProfile() {
    if (!checkAuth()) return;

    const user = getCurrentUser();
    
    // Load personal information
    const personalInfo = document.getElementById('personalInfo');
    personalInfo.innerHTML = `
        <div class="info-item">
            <div class="info-label">Full Name</div>
            <div class="info-value">${user.firstName || 'Demo'} ${user.lastName || 'User'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${user.email || 'demo@example.com'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Member Since</div>
            <div class="info-value">${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}</div>
        </div>
    `;

    // Load contact information
    const contactInfo = document.getElementById('contactInfo');
    contactInfo.innerHTML = `
        <div class="info-item">
            <div class="info-label">Phone Number</div>
            <div class="info-value">${user.phoneNumber || 'Not provided'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">City</div>
            <div class="info-value">${user.city || 'Not provided'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">State</div>
            <div class="info-value">${user.state || 'Not provided'}</div>
        </div>
    `;

    // Load medical information
    const medicalInfo = document.getElementById('medicalInfo');
    medicalInfo.innerHTML = `
        <div class="info-item">
            <div class="info-label">Blood Group</div>
            <div class="info-value">${user.bloodGroup || 'Not provided'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Donor Status</div>
            <div class="info-value">${user.role === 'donor' ? 'Active Donor' : 'Not a Donor'}</div>
        </div>
    `;
}

// Edit profile function
function editProfile() {
    alert('Edit profile functionality would be implemented here. This would open a form to update user information.');
}

// Logout function
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            // Use API if available
            if (typeof window.API !== 'undefined' && window.API.auth) {
                await window.API.auth.logout();
            } else {
                // Clear demo data
                localStorage.removeItem('bloodconnect_demo_user');
                localStorage.removeItem('bloodconnect_user');
                localStorage.removeItem('bloodconnect_token');
            }
            
            alert('You have been logged out successfully.');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even if API call fails
            localStorage.clear();
            window.location.href = 'index.html';
        }
    }
}

// Profile dropdown functionality
function toggleProfileDropdown(event) {
    event.preventDefault();
    const dropdown = document.querySelector('.profile-dropdown');
    dropdown.classList.toggle('active');
}

// Tab functionality
function showTab(tabName) {
    console.log('🔄 Switching to tab:', tabName);

    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab pane
    const tabPane = document.getElementById(tabName + 'Pane');
    const tabButton = document.getElementById(tabName + 'Tab');

    if (tabPane && tabButton) {
        tabPane.classList.add('active');
        tabButton.classList.add('active');
        console.log('✅ Tab activated:', tabName);
    } else {
        console.error('❌ Tab elements not found:', tabName + 'Pane', tabName + 'Tab');
    }

    // Load content based on tab
    switch(tabName) {
        case 'profile':
            loadProfile();
            break;
        case 'donations':
            loadDonations();
            break;
        case 'requests':
            loadRequests();
            break;
        case 'settings':
            loadSettings();
            break;
        case 'changePassword':
            loadChangePasswordForm();
            break;
    }
}

// Load donations
async function loadDonations() {
    const donationsContent = document.getElementById('donationsContent');
    donationsContent.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Loading your donations...
        </div>
    `;

    try {
        if (typeof window.API !== 'undefined' && window.API.profile) {
            console.log('🔄 Loading donations...');
            const response = await window.API.profile.getDonations();
            console.log('📥 Donations response:', response);

            if (response.success && response.data.donations.length > 0) {
                console.log('✅ Found donations, displaying:', response.data.donations.length);
                displayDonations(response.data.donations);
            } else {
                console.log('❌ No donations found, showing empty state');
                showEmptyDonations();
            }
        } else {
            console.log('⚠️ API not available, using fallback');
            // Fallback for demo
            setTimeout(() => {
                showEmptyDonations();
            }, 1000);
        }
    } catch (error) {
        console.error('❌ Error loading donations:', error);
        showEmptyDonations();
    }
}

function showEmptyDonations() {
    const donationsContent = document.getElementById('donationsContent');
    donationsContent.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-hand-holding-heart" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
            <h3>No Donations Yet</h3>
            <p>You haven't made any blood donations yet. Start saving lives today!</p>
            <a href="donate.html" class="btn btn-primary" style="margin-top: 1rem;">
                <i class="fas fa-hand-holding-heart"></i>
                Donate Blood
            </a>
        </div>
    `;
}

function displayDonations(donations) {
    const donationsContent = document.getElementById('donationsContent');
    const donationsHtml = donations.map(donation => `
        <div class="donation-card">
            <div class="donation-header">
                <h4>${new Date(donation.donationDate).toLocaleDateString()}</h4>
                <span class="status-badge ${donation.status.toLowerCase()}">${donation.status}</span>
            </div>
            <div class="donation-details">
                <p><strong>Blood Group:</strong> ${donation.bloodGroup}</p>
                <p><strong>Units:</strong> ${donation.unitsCollected}</p>
                <p><strong>Center:</strong> ${donation.donationCenter.name}</p>
                <p><strong>Location:</strong> ${donation.donationCenter.city}, ${donation.donationCenter.state}</p>
                ${donation.certificateNumber ? `<p><strong>Certificate:</strong> ${donation.certificateNumber}</p>` : ''}
            </div>
        </div>
    `).join('');

    donationsContent.innerHTML = donationsHtml;
}

// Load requests
async function loadRequests() {
    const requestsContent = document.getElementById('requestsContent');
    requestsContent.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Loading your requests...
        </div>
    `;

    try {
        if (typeof window.API !== 'undefined' && window.API.profile) {
            console.log('🔄 Loading requests...');
            const response = await window.API.profile.getRequests();
            console.log('📥 Requests response:', response);
            console.log('📊 Response structure check:', {
                hasSuccess: !!response.success,
                hasData: !!response.data,
                hasRequests: !!(response.data && response.data.requests),
                requestsType: response.data && response.data.requests ? typeof response.data.requests : 'undefined',
                requestsLength: response.data && response.data.requests ? response.data.requests.length : 0,
                firstRequest: response.data && response.data.requests && response.data.requests[0] ? response.data.requests[0] : null
            });

            if (response.success && response.data && response.data.requests && response.data.requests.length > 0) {
                console.log('✅ Found requests, displaying:', response.data.requests.length);
                displayRequests(response.data.requests);
            } else {
                console.log('❌ No requests found, showing empty state');
                console.log('❌ Reason:', {
                    success: response.success,
                    hasData: !!response.data,
                    hasRequests: !!(response.data && response.data.requests),
                    requestsLength: response.data && response.data.requests ? response.data.requests.length : 0
                });
                showEmptyRequests();
            }
        } else {
            console.log('⚠️ API not available, using fallback');
            // Fallback for demo
            setTimeout(() => {
                showEmptyRequests();
            }, 1000);
        }
    } catch (error) {
        console.error('❌ Error loading requests:', error);
        showEmptyRequests();
    }
}

function showEmptyRequests() {
    const requestsContent = document.getElementById('requestsContent');
    requestsContent.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-search" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
            <h3>No Blood Requests</h3>
            <p>You haven't made any blood requests yet.</p>
            <a href="request.html" class="btn btn-primary" style="margin-top: 1rem;">
                <i class="fas fa-search"></i>
                Request Blood
            </a>
        </div>
    `;
}

function displayRequests(requests) {
    const requestsContent = document.getElementById('requestsContent');
    const requestsHtml = requests.map(request => {
        // Format the date with year
        const requestDate = new Date(request.createdAt || request.requestDate);
        const formattedDate = requestDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Format required by date if available
        const requiredByDate = request.requiredBy ?
            new Date(request.requiredBy).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : 'Not specified';

        // Calculate fulfillment percentage
        const fulfilledUnits = request.fulfilledUnits || 0;
        const fulfillmentPercentage = request.requiredUnits > 0 ?
            Math.round((fulfilledUnits / request.requiredUnits) * 100) : 0;

        return `
            <div class="request-card">
                <div class="request-header">
                    <h4>${request.patientName}</h4>
                    <span class="status-badge ${request.status.toLowerCase().replace(' ', '-')}">${request.status}</span>
                </div>
                <div class="request-details">
                    <p><strong>Blood Group:</strong> ${request.bloodGroup}</p>
                    <p><strong>Required Units:</strong> ${request.requiredUnits}</p>
                    <p><strong>Fulfilled:</strong> ${fulfilledUnits}/${request.requiredUnits}</p>
                    <p><strong>Urgency:</strong> ${request.urgency || 'Medium'}</p>
                    <p><strong>Hospital:</strong> ${request.hospitalName || 'Not specified'}</p>
                    <p><strong>Location:</strong> ${request.location || 'Not specified'}</p>
                    <p><strong>Required By:</strong> ${requiredByDate}</p>
                    <p><strong>Request Date:</strong> ${formattedDate}</p>
                    <p><strong>Progress:</strong> ${fulfillmentPercentage}%</p>
                    <p><strong>Contact:</strong> ${request.contactNumber || 'Not provided'}</p>
                </div>
            </div>
        `;
    }).join('');

    requestsContent.innerHTML = requestsHtml;
}

// Load settings
function loadSettings() {
    const settingsContent = document.getElementById('settingsContent');
    settingsContent.innerHTML = `
        <div class="settings-form">
            <div class="form-group">
                <label>Notification Preferences</label>
                <div class="checkbox-group">
                    <label class="checkbox-container">
                        <input type="checkbox" checked>
                        <span class="checkmark"></span>
                        Email notifications
                    </label>
                    <label class="checkbox-container">
                        <input type="checkbox">
                        <span class="checkmark"></span>
                        SMS notifications
                    </label>
                    <label class="checkbox-container">
                        <input type="checkbox" checked>
                        <span class="checkmark"></span>
                        Push notifications
                    </label>
                </div>
            </div>

            <div class="form-group">
                <label>Profile Visibility</label>
                <select class="form-input">
                    <option value="private" selected>Private</option>
                    <option value="public">Public</option>
                    <option value="donors-only">Donors Only</option>
                </select>
            </div>

            <div class="actions">
                <button class="btn btn-primary" onclick="saveSettings()">
                    <i class="fas fa-save"></i>
                    Save Settings
                </button>
            </div>
        </div>
    `;
}

// Load change password form
function loadChangePasswordForm() {
    console.log('🔑 Loading change password form...');
    const changePasswordContent = document.getElementById('changePasswordContent');
    if (!changePasswordContent) {
        console.error('❌ changePasswordContent element not found!');
        return;
    }

    // The form is already in the HTML, so we don't need to load it again
    // Just make sure it's visible
    console.log('✅ Change password form is ready');
}

// Save settings function
function saveSettings() {
    alert('Settings saved successfully!');
}

// Change password function
async function changePassword(event) {
    event.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }

    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long!');
        return;
    }

    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Changing Password...';
    submitButton.disabled = true;

    try {
        if (typeof window.API !== 'undefined' && window.API.auth) {
            const response = await window.API.auth.changePassword({
                currentPassword,
                newPassword,
                confirmPassword
            });

            if (response.success) {
                alert('Password changed successfully!');
                document.querySelector('.change-password-form').reset();
            } else {
                alert(response.message || 'Failed to change password');
            }
        } else {
            // Fallback for demo
            await new Promise(resolve => setTimeout(resolve, 2000));
            alert('Password changed successfully! (Demo mode)');
            document.querySelector('.change-password-form').reset();
        }
    } catch (error) {
        console.error('Error changing password:', error);
        let errorMessage = 'Failed to change password. Please try again.';

        if (error.message.includes('Current password is incorrect')) {
            errorMessage = 'Current password is incorrect. Please check and try again.';
        } else if (error.message.includes('validation')) {
            errorMessage = 'Please check your password requirements and try again.';
        }

        alert(errorMessage);
    } finally {
        // Reset button
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Check URL parameters for tab
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
        showTab(tab);
    }
}

// Setup event listeners for tab buttons  
function setupTabEventListeners() {
    console.log('🔧 Setting up tab event listeners...');
    
    // Add click event listeners to tab buttons
    const tabButtons = [
        { id: 'profileTab', tab: 'profile' },
        { id: 'donationsTab', tab: 'donations' },
        { id: 'requestsTab', tab: 'requests' },
        { id: 'settingsTab', tab: 'settings' },
        { id: 'changePasswordTab', tab: 'changePassword' }
    ];

    tabButtons.forEach(({ id, tab }) => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', () => {
                console.log(`🖱️ Tab button clicked: ${tab}`);
                showTab(tab);
            });
            console.log(`✅ Event listener added for ${id}`);
        } else {
            console.warn(`⚠️ Tab button not found: ${id}`);
        }
    });
}

// Setup profile dropdown event listener
function setupProfileDropdownEventListener() {
    console.log('🔧 Setting up profile dropdown event listener...');
    
    const profileToggle = document.querySelector('.profile-toggle');
    if (profileToggle) {
        profileToggle.addEventListener('click', toggleProfileDropdown);
        console.log('✅ Profile dropdown event listener added');
    } else {
        console.warn('⚠️ Profile toggle element not found');
    }
}

// Setup form event listeners
function setupFormEventListeners() {
    console.log('🔧 Setting up form event listeners...');
    
    // Change password form
    const changePasswordForm = document.querySelector('.change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', changePassword);
        console.log('✅ Change password form event listener added');
    } else {
        console.warn('⚠️ Change password form not found');
    }

    // Edit profile button
    const editProfileBtn = document.querySelector('a[onclick="editProfile()"]');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            editProfile();
        });
        console.log('✅ Edit profile button event listener added');
    }

    // Logout button  
    const logoutBtn = document.querySelector('a[onclick="logout()"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
        console.log('✅ Logout button event listener added');
    }
}

// Close dropdown when clicking outside
function setupDropdownCloseListener() {
    document.addEventListener('click', function(event) {
        const dropdown = document.querySelector('.profile-dropdown');
        const toggle = document.querySelector('.profile-toggle');

        if (dropdown && toggle && !dropdown.contains(event.target) && !toggle.contains(event.target)) {
            dropdown.classList.remove('active');
        }
    });
}

// Initialize profile on page load
function initializeProfile() {
    console.log('🔄 Initializing profile page...');
    
    loadProfile();
    checkUrlParams();
    setupTabEventListeners();
    setupProfileDropdownEventListener();
    setupFormEventListeners();
    setupDropdownCloseListener();

    // Update profile name in dropdown
    const user = getCurrentUser();
    if (user && user.firstName) {
        const profileNameElement = document.getElementById('profileName');
        if (profileNameElement) {
            profileNameElement.textContent = user.firstName;
        }
    }
    
    console.log('✅ Profile page initialized');
}

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProfile);
} else {
    // DOM is already loaded
    initializeProfile();
}

// Make functions globally available
window.showTab = showTab;
window.toggleProfileDropdown = toggleProfileDropdown;
window.logout = logout;
window.editProfile = editProfile;
window.changePassword = changePassword;
window.saveSettings = saveSettings;
