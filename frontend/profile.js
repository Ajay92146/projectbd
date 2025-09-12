// Profile page JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Profile page JavaScript loaded');
    
    // For demo purposes, skip token check and set up demo user
    const demoUser = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        bloodType: 'O+'
    };
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem('user', JSON.stringify(demoUser));
    
    console.log('👤 Demo user set up');

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
    console.log('📋 Loading profile data...');
    
    try {
        // Use demo user data for now
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('📄 User data:', userData);
        
        // Update UI elements if they exist
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userData.name || 'User';
        }
        
        const profileNameElement = document.getElementById('profileName');
        if (profileNameElement) {
            profileNameElement.value = userData.name || '';
        }
        
        const profileEmailElement = document.getElementById('profileEmail');
        if (profileEmailElement) {
            profileEmailElement.value = userData.email || '';
        }
        
        const profilePhoneElement = document.getElementById('profilePhone');
        if (profilePhoneElement) {
            profilePhoneElement.value = userData.phone || '';
        }
        
        const profileBloodTypeElement = document.getElementById('profileBloodType');
        if (profileBloodTypeElement) {
            profileBloodTypeElement.value = userData.bloodType || '';
        }
        
        console.log('✅ Profile data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading profile data:', error);
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

async function loadDonations() {
    try {
        const response = await fetch('/api/donations/my-donations', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const donations = await response.json();
            displayDonations(donations);
        } else {
            document.getElementById('donations').innerHTML = '<p>Failed to load donations</p>';
        }
    } catch (error) {
        console.error('Error loading donations:', error);
        document.getElementById('donations').innerHTML = '<p>Error loading donations</p>';
    }
}

async function loadRequests() {
    try {
        const response = await fetch('/api/requests/my-requests', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const requests = await response.json();
            displayRequests(requests);
        } else {
            document.getElementById('requests').innerHTML = '<p>Failed to load requests</p>';
        }
    } catch (error) {
        console.error('Error loading requests:', error);
        document.getElementById('requests').innerHTML = '<p>Error loading requests</p>';
    }
}

function displayDonations(donations) {
    const container = document.getElementById('donations');
    if (donations.length === 0) {
        container.innerHTML = '<p>No donations found.</p>';
        return;
    }

    const html = donations.map(donation => `
        <div class="donation-item">
            <h4>Donation to ${donation.recipientName}</h4>
            <p><strong>Date:</strong> ${new Date(donation.date).toLocaleDateString()}</p>
            <p><strong>Location:</strong> ${donation.location}</p>
            <p><strong>Status:</strong> ${donation.status}</p>
        </div>
    `).join('');

    container.innerHTML = html;
}

function displayRequests(requests) {
    const container = document.getElementById('requests');
    if (requests.length === 0) {
        container.innerHTML = '<p>No requests found.</p>';
        return;
    }

    const html = requests.map(request => `
        <div class="request-item">
            <h4>Request for ${request.bloodType}</h4>
            <p><strong>Date:</strong> ${new Date(request.date).toLocaleDateString()}</p>
            <p><strong>Location:</strong> ${request.location}</p>
            <p><strong>Status:</strong> ${request.status}</p>
            <p><strong>Urgency:</strong> ${request.urgency}</p>
        </div>
    `).join('');

    container.innerHTML = html;
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

    // Settings form submission
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', saveSettings);
    }

    // Change password form submission
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', changePassword);
    }
}

function enableProfileEdit() {
    const inputs = document.querySelectorAll('#settingsForm input');
    inputs.forEach(input => {
        input.disabled = false;
    });

    document.getElementById('editBtn').style.display = 'none';
    document.getElementById('saveBtn').style.display = 'inline-block';
    document.getElementById('cancelBtn').style.display = 'inline-block';
}

async function saveProfile(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('profileName').value,
        email: document.getElementById('profileEmail').value,
        phone: document.getElementById('profilePhone').value,
        bloodType: document.getElementById('profileBloodType').value
    };

    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Profile updated successfully!');
            loadProfileData(); // Reload profile data
            cancelProfileEdit();
        } else {
            alert('Failed to update profile');
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Error saving profile');
    }
}

function cancelProfileEdit() {
    const inputs = document.querySelectorAll('#settingsForm input');
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
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

async function saveSettings(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('profileName').value,
        email: document.getElementById('profileEmail').value,
        phone: document.getElementById('profilePhone').value,
        bloodType: document.getElementById('profileBloodType').value
    };

    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Settings saved successfully!');
            loadProfileData();
        } else {
            alert('Failed to save settings');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Error saving settings');
    }
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
        const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
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
