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

    // Initialize profile functionality
    initializeProfileFunctionality();
    
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
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', saveProfile);
    }
}

function enableProfileEdit() {
    const inputs = document.querySelectorAll('#profileForm input, #profileForm select');
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
    const inputs = document.querySelectorAll('#profileForm input, #profileForm select');
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
    // Use shared utility for clearing auth data
    SharedUtils.AuthUtils.clearAuthData(false);
    console.log('🔓 All authentication data cleared');
    window.location.href = 'login.html';
}


