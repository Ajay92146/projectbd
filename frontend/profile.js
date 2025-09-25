// Profile page JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Profile page JavaScript loaded');
    
    // Check if user is logged in (check both possible token keys)
    const token = localStorage.getItem('token') || localStorage.getItem('bloodconnect_token');
    if (!token) {
        console.log('❌ No token found, redirecting to login');
        console.log('Available localStorage keys:', Object.keys(localStorage));
        window.location.href = 'login.html';
        return;
    }
    
    console.log('✅ Token found:', token.substring(0, 50) + '...');
    
    // Ensure we use the correct token key going forward
    if (localStorage.getItem('bloodconnect_token') && !localStorage.getItem('token')) {
        localStorage.setItem('token', localStorage.getItem('bloodconnect_token'));
        console.log('🔄 Copied bloodconnect_token to token for compatibility');
    }
    
    console.log('🔑 Token found, initializing profile page');

    // Load user profile data
    loadProfileData();

    // Initialize tab navigation
    initializeTabNavigation();

    // Initialize profile functionality
    initializeProfileFunctionality();

    // Load initial tab content
    showTab('donations');
    
    console.log('✅ Profile page initialization complete');
});

async function loadProfileData() {
    console.log('📋 Loading profile data from backend...');
    
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('bloodconnect_token');
        const response = await fetch('/api/auth/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.log('❌ Unauthorized, redirecting to login');
                localStorage.removeItem('token');
                localStorage.removeItem('bloodconnect_token');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📄 Profile API response:', result);
        
        if (result.success && result.data && result.data.user) {
            const userData = result.data.user;
            console.log('👤 User data:', userData);
            
            // Update UI elements if they exist
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                userNameElement.textContent = fullName || 'User';
            }
            
            const profileNameElement = document.getElementById('profileName');
            if (profileNameElement) {
                const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                profileNameElement.value = fullName;
            }
            
            const profileEmailElement = document.getElementById('profileEmail');
            if (profileEmailElement) {
                profileEmailElement.value = userData.email || '';
            }
            
            const profilePhoneElement = document.getElementById('profilePhone');
            if (profilePhoneElement) {
                profilePhoneElement.value = userData.phoneNumber || '';
            }
            
            const profileBloodTypeElement = document.getElementById('profileBloodType');
            if (profileBloodTypeElement) {
                profileBloodTypeElement.value = userData.bloodGroup || '';
            }
            
            // Store user data locally for other functions
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            console.log('✅ Profile data loaded successfully');
        } else {
            throw new Error('Invalid response format from server');
        }
    } catch (error) {
        console.error('❌ Error loading profile data:', error);
        // Show user-friendly error message
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = 'Error loading profile';
        }
        // You might want to show a toast notification here
    }
}

function initializeTabNavigation() {
    console.log('📌 Initializing tab navigation...');
    
    // Get all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    console.log(`🔘 Found ${tabButtons.length} tab buttons`);
    
    // Add event listeners to tab buttons
    tabButtons.forEach((button, index) => {
        const tabId = button.getAttribute('data-tab');
        console.log(`🔘 Button ${index + 1}: ${tabId}`);
        
        button.addEventListener('click', function() {
            console.log(`💆 Tab button clicked: ${tabId}`);
            showTab(tabId);
        });
    });
    
    console.log('✅ Tab navigation initialized');
}

function showTab(tabName) {
    console.log(`🔄 Showing tab: ${tabName}`);
    
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    console.log(`📋 Found ${tabContents.length} tab content sections`);
    tabContents.forEach(content => {
        content.style.display = 'none';
    });

    // Remove active class from all buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Show selected tab and mark button as active
    const selectedTab = document.getElementById(tabName);
    console.log(`🎯 Selected tab element:`, selectedTab);
    
    if (selectedTab) {
        selectedTab.style.display = 'block';
        console.log(`✅ Tab '${tabName}' is now visible`);
        
        // Find and activate the corresponding button
        const activeButton = Array.from(tabButtons).find(button => {
            const buttonTab = button.getAttribute('data-tab');
            return buttonTab === tabName;
        });
        
        if (activeButton) {
            activeButton.classList.add('active');
            console.log(`✅ Button for '${tabName}' is now active`);
        } else {
            console.warn(`⚠️ No button found for tab '${tabName}'`);
        }
    } else {
        console.error(`❌ Tab element '${tabName}' not found`);
    }

    // Load tab-specific content
    switch (tabName) {
        case 'donations':
            loadDonations();
            break;
        case 'requests':
            loadRequests();
            break;
        case 'settings':
            // Settings form is already in HTML, no dynamic loading needed
            break;
        case 'changePassword':
            // Change password form is already in HTML, no dynamic loading needed
            break;
    }
}

// Export showTab to global scope so it can be used by dropdown navigation
window.showTab = showTab;

async function loadDonations() {
    console.log('🩸 Loading donations from backend...');
    
    const donationsContainer = document.getElementById('donationsContent');
    if (!donationsContainer) {
        console.error('❌ donations container not found');
        return;
    }
    
    // Check authentication first - use fallback if SharedUtils not available
    let token;
    if (window.SharedUtils && window.SharedUtils.AuthUtils) {
        token = SharedUtils.AuthUtils.getToken();
    } else {
        token = localStorage.getItem('token') || localStorage.getItem('bloodconnect_token');
    }
    
    console.log('🔑 Token available:', !!token);
    
    if (!token) {
        console.error('❌ No authentication token found');
        if (window.SharedUtils && window.SharedUtils.UIUtils) {
            SharedUtils.UIUtils.showErrorState('donationsContent', 'Authentication Required', 'Please log in to view your donations.');
        } else {
            donationsContainer.innerHTML = '<div class="text-center p-4"><p>Authentication Required</p><p>Please log in to view your donations.</p></div>';
        }
        return;
    }
    
    // Show loading state
    if (window.SharedUtils && window.SharedUtils.UIUtils) {
        SharedUtils.UIUtils.showLoading('donationsContent', 'Loading your donations...');
    } else {
        donationsContainer.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Loading your donations...</div>';
    }
    
    try {
        const response = await fetch('/api/profile/donations', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('🔄 Donations API response status:', response.status);
        console.log('🔄 Donations API response headers:', response.headers);

        if (!response.ok) {
            if (response.status === 401) {
                console.log('❌ Unauthorized, redirecting to login');
                if (window.SharedUtils && window.SharedUtils.AuthUtils) {
                    SharedUtils.AuthUtils.clearAuthData(false);
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('bloodconnect_token');
                }
                window.location.href = 'login.html';
                return;
            }
            const errorText = await response.text();
            console.error('❌ API Error Response:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📦 Donations API full response:', result);
        
        if (result.success && result.data && result.data.donations) {
            const donations = result.data.donations;
            console.log('🩸 Found donations:', donations.length);
            
            // Show demo data notice if applicable
            if (result.isDemoData) {
                console.log('ℹ️ Demo data notice:', result.message);
            }
            
            if (donations.length > 0) {
                displayDonations(donations);
            } else {
                showEmptyDonations();
            }
        } else {
            console.log('⚠️ No donations data in response, showing empty state');
            showEmptyDonations();
        }
    } catch (error) {
        console.error('❌ Error loading donations:', error);
        if (window.SharedUtils && window.SharedUtils.UIUtils) {
            SharedUtils.UIUtils.showErrorState('donationsContent', 'Error Loading Donations', 'Unable to load your donations. Please try again later.', 'loadDonations()');
        } else {
            const donationsContainer = document.getElementById('donationsContent');
            if (donationsContainer) {
                donationsContainer.innerHTML = '<div class="text-center p-4"><p>Error Loading Donations</p><p>Unable to load your donations. Please try again later.</p><button class="btn btn-primary" onclick="loadDonations()">Retry</button></div>';
            }
        }
    }
}

async function loadRequests() {
    console.log('🔍 Loading requests from backend...');
    
    const requestsContainer = document.getElementById('requestsContent');
    if (!requestsContainer) {
        console.error('❌ requests container not found');
        return;
    }
    
    // Check authentication first - use fallback if SharedUtils not available
    let token;
    if (window.SharedUtils && window.SharedUtils.AuthUtils) {
        token = SharedUtils.AuthUtils.getToken();
    } else {
        token = localStorage.getItem('token') || localStorage.getItem('bloodconnect_token');
    }
    
    console.log('🔑 Token available:', !!token);
    
    if (!token) {
        console.error('❌ No authentication token found');
        if (window.SharedUtils && window.SharedUtils.UIUtils) {
            SharedUtils.UIUtils.showErrorState('requestsContent', 'Authentication Required', 'Please log in to view your requests.');
        } else {
            requestsContainer.innerHTML = '<div class="text-center p-4"><p>Authentication Required</p><p>Please log in to view your requests.</p></div>';
        }
        return;
    }
    
    // Show loading state
    if (window.SharedUtils && window.SharedUtils.UIUtils) {
        SharedUtils.UIUtils.showLoading('requestsContent', 'Loading your blood requests...');
    } else {
        requestsContainer.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Loading your blood requests...</div>';
    }
    
    try {
        const response = await fetch('/api/profile/requests', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('🔄 Requests API response status:', response.status);
        console.log('🔄 Requests API response headers:', response.headers);

        if (!response.ok) {
            if (response.status === 401) {
                console.log('❌ Unauthorized, redirecting to login');
                if (window.SharedUtils && window.SharedUtils.AuthUtils) {
                    SharedUtils.AuthUtils.clearAuthData(false);
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('bloodconnect_token');
                }
                window.location.href = 'login.html';
                return;
            }
            const errorText = await response.text();
            console.error('❌ API Error Response:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📦 Requests API full response:', result);
        
        if (result.success && result.data && result.data.requests) {
            const requests = result.data.requests;
            console.log('🔍 Found requests:', requests.length);
            
            // Show demo data notice if applicable
            if (result.isDemoData) {
                console.log('ℹ️ Demo data notice:', result.message);
            }
            
            if (requests.length > 0) {
                displayRequests(requests);
            } else {
                showEmptyRequests();
            }
        } else {
            console.log('⚠️ No requests data in response, showing empty state');
            showEmptyRequests();
        }
    } catch (error) {
        console.error('❌ Error loading requests:', error);
        if (window.SharedUtils && window.SharedUtils.UIUtils) {
            SharedUtils.UIUtils.showErrorState('requestsContent', 'Error Loading Requests', 'Unable to load your blood requests. Please try again later.', 'loadRequests()');
        } else {
            const requestsContainer = document.getElementById('requestsContent');
            if (requestsContainer) {
                requestsContainer.innerHTML = '<div class="text-center p-4"><p>Error Loading Requests</p><p>Unable to load your blood requests. Please try again later.</p><button class="btn btn-primary" onclick="loadRequests()">Retry</button></div>';
            }
        }
    }
}

function displayDonations(donations) {
    const container = document.getElementById('donationsContent');
    console.log('🔄 Displaying donations:', donations);
    
    if (!container) {
        console.error('❌ donations container not found');
        return;
    }
    
    if (donations.length === 0) {
        showEmptyDonations();
        return;
    }

    const html = donations.map(donation => {
        // Handle both backend formats (mapped and original)
        const donationDate = donation.donationDate || donation.dateOfDonation;
        const bloodGroup = donation.bloodGroup;
        const donorName = donation.donorName || donation.name || 'Unknown';
        const city = donation.city || 'Unknown';
        const state = donation.state || 'Unknown';
        const status = donation.status || 'Completed';
        const unitsCollected = donation.unitsCollected || 1;
        const donationCenter = donation.donationCenter || {};
        
        return `
            <div class="donation-item">
                <div class="donation-header">
                    <h4>Blood Donation</h4>
                    <span class="status-badge ${status.toLowerCase()}">${status}</span>
                </div>
                <div class="donation-details">
                    <p><strong>Date:</strong> ${donationDate ? new Date(donationDate).toLocaleDateString() : 'Not specified'}</p>
                    <p><strong>Blood Group:</strong> ${bloodGroup || 'Not specified'}</p>
                    <p><strong>Units:</strong> ${unitsCollected}</p>
                    <p><strong>Donor:</strong> ${donorName}</p>
                    <p><strong>Center:</strong> ${donationCenter.name || 'Blood Bank'}</p>
                    <p><strong>Location:</strong> ${city}, ${state}</p>
                    
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function displayRequests(requests) {
    const container = document.getElementById('requestsContent');
    console.log('🔄 Displaying requests:', requests);
    
    if (!container) {
        console.error('❌ requests container not found');
        return;
    }
    
    if (requests.length === 0) {
        showEmptyRequests();
        return;
    }

    const html = requests.map(request => {
        // Handle both UserRequest and Request model formats
        const patientName = request.patientName || 'Patient';
        const bloodGroup = request.bloodGroup || request.bloodType || 'Not specified';
        const requiredUnits = request.requiredUnits || request.units || 1;
        const fulfilledUnits = request.fulfilledUnits || 0;
        const status = request.status || 'Pending';
        const urgency = request.urgency || request.priority || 'Medium';
        const hospitalName = request.hospitalName || request.hospital || 'Not specified';
        const location = request.location || `${request.city || ''}, ${request.state || ''}`.trim() || 'Not specified';
        const requestDate = request.createdAt || request.requestDate || new Date();
        const requiredBy = request.requiredBy || request.requiredDate;
        const contactNumber = request.contactNumber || request.contactPersonNumber || 'Not provided';
        
        // Calculate fulfillment percentage
        const fulfillmentPercentage = requiredUnits > 0 ? Math.round((fulfilledUnits / requiredUnits) * 100) : 0;
        
        return `
            <div class="request-item">
                <div class="request-header">
                    <h4>${patientName}</h4>
                    <span class="status-badge ${status.toLowerCase().replace(' ', '-')}">${status}</span>
                </div>
                <div class="request-details">
                    <p><strong>Blood Group:</strong> ${bloodGroup}</p>
                    <p><strong>Required Units:</strong> ${requiredUnits}</p>
                    <p><strong>Fulfilled:</strong> ${fulfilledUnits}/${requiredUnits} (${fulfillmentPercentage}%)</p>
                    <p><strong>Urgency:</strong> ${urgency}</p>
                    <p><strong>Hospital:</strong> ${hospitalName}</p>
                    <p><strong>Location:</strong> ${location}</p>
                    <p><strong>Request Date:</strong> ${new Date(requestDate).toLocaleDateString()}</p>
                    ${requiredBy ? `<p><strong>Required By:</strong> ${new Date(requiredBy).toLocaleDateString()}</p>` : ''}
                    
                    ${request.additionalNotes ? `<p><strong>Notes:</strong> ${request.additionalNotes}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function showEmptyDonations() {
    const donationsContainer = document.getElementById('donationsContent');
    if (!donationsContainer) {
        console.error('❌ donations container not found');
        return;
    }
    
    donationsContainer.innerHTML = `
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

function showEmptyRequests() {
    const requestsContainer = document.getElementById('requestsContent');
    if (!requestsContainer) {
        console.error('❌ requests container not found');
        return;
    }
    
    requestsContainer.innerHTML = `
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

function initializeProfileFunctionality() {
    // Edit profile functionality
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    if (editBtn) {
        editBtn.addEventListener('click', enableProfileEdit);
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProfile);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelProfileEdit);
    }

    // Profile dropdown functionality
    const profileDropdown = document.querySelector('.profile-dropdown');
    const profileToggle = document.querySelector('.profile-toggle');
    
    if (profileToggle) {
        profileToggle.addEventListener('click', function(event) {
            event.preventDefault();
            toggleProfileDropdown();
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (profileDropdown && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.remove('active');
        }
    });

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Settings form submission - using saveProfile function for consistency
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', saveProfile);
    }

    // Change password form submission
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', changePassword);
    }
}

function enableProfileEdit() {
    const inputs = document.querySelectorAll('#settingsForm input, #settingsForm select');
    inputs.forEach(input => {
        input.disabled = false;
    });

    document.getElementById('editBtn').style.display = 'none';
    document.getElementById('saveBtn').style.display = 'inline-block';
    document.getElementById('cancelBtn').style.display = 'inline-block';
}

async function saveProfile(event) {
    event.preventDefault();
    
    console.log('💾 Saving profile...');
    
    // Split name into first and last name
    const fullName = document.getElementById('profileName').value.trim();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const formData = {
        firstName: firstName,
        lastName: lastName,
        phoneNumber: document.getElementById('profilePhone').value,
        bloodGroup: document.getElementById('profileBloodType').value
    };
    
    // Remove empty fields
    Object.keys(formData).forEach(key => {
        if (!formData[key]) {
            delete formData[key];
        }
    });
    
    console.log('📄 Profile data to save:', formData);

    try {
        const token = localStorage.getItem('token') || localStorage.getItem('bloodconnect_token');
        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        console.log('🔄 Profile update response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                console.log('❌ Unauthorized, redirecting to login');
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📦 Profile update response:', result);
        
        if (result.success) {
            alert('Profile updated successfully!');
            loadProfileData(); // Reload profile data
            cancelProfileEdit();
        } else {
            alert(result.message || 'Failed to update profile');
        }
    } catch (error) {
        console.error('❌ Error saving profile:', error);
        alert('Error saving profile: ' + error.message);
    }
}

function cancelProfileEdit() {
    const inputs = document.querySelectorAll('#settingsForm input, #settingsForm select');
    inputs.forEach(input => {
        input.disabled = true;
    });

    document.getElementById('editBtn').style.display = 'inline-block';
    document.getElementById('saveBtn').style.display = 'none';
    document.getElementById('cancelBtn').style.display = 'none';

    loadProfileData(); // Restore original values
}

function toggleProfileDropdown() {
    const dropdown = document.querySelector('.profile-dropdown');
    dropdown.classList.toggle('active');
}

function logout() {
    // Use shared utility for clearing auth data if available
    if (window.SharedUtils && window.SharedUtils.AuthUtils) {
        SharedUtils.AuthUtils.clearAuthData(false);
    } else {
        // Fallback implementation
        localStorage.removeItem('token');
        localStorage.removeItem('bloodconnect_token');
        localStorage.removeItem('bloodconnect_user');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('user');
    }
    console.log('🔓 All authentication data cleared');
    window.location.href = 'login.html';
}

async function changePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }

    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword,
                newPassword,
                confirmPassword
            })
        });

        if (response.ok) {
            alert('Password changed successfully!');
            document.getElementById('changePasswordForm').reset();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to change password');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Error changing password');
    }
}


