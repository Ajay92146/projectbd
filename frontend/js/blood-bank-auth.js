// Blood Bank Authentication JavaScript

// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// Navigation Functions
function goToRegistration() {
    window.location.href = '/blood-bank-register';
}

function goToLogin() {
    window.location.href = '/blood-bank-login';
}

function goToDashboard() {
    window.location.href = '/blood-bank-dashboard';
}

// Form Validation Functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

function validatePassword(password) {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
}

function getPasswordStrength(password) {
    const checks = validatePassword(password);
    const score = Object.values(checks).filter(Boolean).length;
    
    if (score < 3) return { strength: 'weak', color: '#e74c3c' };
    if (score < 4) return { strength: 'medium', color: '#f39c12' };
    return { strength: 'strong', color: '#27ae60' };
}

function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('error');
    }
}

function clearError(fieldId) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.remove('error');
    }
}

function showSuccess(message) {
    // Create success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'success-notification';
    successDiv.innerHTML = `
        <div class="success-content">
            <span class="success-icon">✓</span>
            <span class="success-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}

function showErrorMessage(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'success-notification';
    errorDiv.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    errorDiv.innerHTML = `
        <div class="success-content">
            <span class="success-icon">✗</span>
            <span class="success-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 4 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 4000);
}

// Blood Bank Login Form Handler
if (document.getElementById('bloodBankLoginForm')) {
    const loginForm = document.getElementById('bloodBankLoginForm');
    const loader = document.getElementById('loader');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear previous errors
        clearError('email');
        clearError('password');
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        let isValid = true;
        
        // Validate email
        if (!email) {
            showError('email', 'Email is required');
            isValid = false;
        } else if (!validateEmail(email)) {
            showError('email', 'Please enter a valid email address');
            isValid = false;
        }
        
        // Validate password
        if (!password) {
            showError('password', 'Password is required');
            isValid = false;
        } else if (password.length < 8) {
            showError('password', 'Password must be at least 8 characters');
            isValid = false;
        }
        
        if (isValid) {
            // Show loading
            loader.style.display = 'block';
            document.querySelector('.btn-text').style.opacity = '0.7';
            
            try {
                const response = await fetch(`${API_BASE_URL}/bloodbank/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Store token
                    localStorage.setItem('bloodBankToken', data.data.token);
                    localStorage.setItem('bloodBankInfo', JSON.stringify(data.data.bloodBank));
                    
                    showSuccess('Login successful! Redirecting to dashboard...');
                    
                    // Redirect to dashboard
                    setTimeout(() => {
                        goToDashboard();
                    }, 1500);
                } else {
                    showErrorMessage(data.message || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                showErrorMessage('Login failed. Please try again.');
            } finally {
                loader.style.display = 'none';
                document.querySelector('.btn-text').style.opacity = '1';
            }
        }
    });
}

// Blood Bank Registration Form Handler
if (document.getElementById('registrationForm')) {
    const registrationForm = document.getElementById('registrationForm');
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirmPassword');
    const passwordStrengthDiv = document.getElementById('passwordStrength');
    const registerLoader = document.getElementById('registerLoader');
    
    // Password strength indicator
    if (passwordField && passwordStrengthDiv) {
        passwordField.addEventListener('input', function() {
            const password = this.value;
            if (password.length > 0) {
                const strength = getPasswordStrength(password);
                passwordStrengthDiv.innerHTML = `
                    <div class="strength-bar">
                        <div class="strength-fill" style="background-color: ${strength.color}; width: ${password.length >= 8 ? '100%' : '50%'}"></div>
                    </div>
                    <span class="strength-text" style="color: ${strength.color}">Password strength: ${strength.strength}</span>
                `;
                passwordStrengthDiv.style.display = 'block';
            } else {
                passwordStrengthDiv.style.display = 'none';
            }
        });
    }
    
    // Password confirmation validation
    if (confirmPasswordField) {
        confirmPasswordField.addEventListener('blur', function() {
            const password = document.getElementById('password').value;
            const confirmPassword = this.value;
            
            if (confirmPassword && password !== confirmPassword) {
                showError('confirmPassword', 'Passwords do not match');
            } else {
                clearError('confirmPassword');
            }
        });
    }
    
    // Real-time validation for required fields
    const requiredFields = [
        'bankName', 'licenseNumber', 'establishedYear', 'bankType',
        'contactPerson', 'designation', 'phone', 'email',
        'address', 'city', 'state', 'zipCode', 'country', 'loginEmail'
    ];
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', function() {
                if (!this.value.trim()) {
                    showError(fieldId, 'This field is required');
                } else {
                    clearError(fieldId);
                    
                    // Additional specific validations
                    if (fieldId === 'email' || fieldId === 'loginEmail') {
                        if (!validateEmail(this.value)) {
                            showError(fieldId, 'Please enter a valid email address');
                        }
                    }
                    
                    if (fieldId === 'phone') {
                        if (!validatePhone(this.value)) {
                            showError(fieldId, 'Please enter a valid phone number');
                        }
                    }
                    
                    if (fieldId === 'establishedYear') {
                        const year = parseInt(this.value);
                        const currentYear = new Date().getFullYear();
                        if (year < 1900 || year > currentYear) {
                            showError(fieldId, `Year must be between 1900 and ${currentYear}`);
                        }
                    }
                }
            });
        }
    });
    
    // Form submission
    registrationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear all previous errors
        requiredFields.forEach(fieldId => clearError(fieldId));
        clearError('password');
        clearError('confirmPassword');
        
        let isValid = true;
        
        // Validate all required fields
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !field.value.trim()) {
                showError(fieldId, 'This field is required');
                isValid = false;
            }
        });
        
        // Validate password
        const password = document.getElementById('password').value;
        if (!password) {
            showError('password', 'Password is required');
            isValid = false;
        } else {
            const passwordChecks = validatePassword(password);
            if (!passwordChecks.length || password.length < 8) {
                showError('password', 'Password must be at least 8 characters long');
                isValid = false;
            }
            // Enforce complexity requirements
            const complexityScore = Object.values(passwordChecks).filter(Boolean).length;
            if (complexityScore < 3) {
                showError('password', 'Password must contain at least 3 of: uppercase, lowercase, number, special character');
                isValid = false;
            }
        }
        
        // Validate password confirmation
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (password !== confirmPassword) {
            showError('confirmPassword', 'Passwords do not match');
            isValid = false;
        }
        
        // Validate checkboxes
        if (!document.getElementById('agreeTerms').checked) {
            showErrorMessage('Please agree to the Terms of Service and Privacy Policy');
            isValid = false;
        }
        
        if (!document.getElementById('agreeCompliance').checked) {
            showErrorMessage('Please confirm compliance with health regulations');
            isValid = false;
        }
        
        // Validate specific fields
        const email = document.getElementById('email').value;
        const loginEmail = document.getElementById('loginEmail').value;
        const phone = document.getElementById('phone').value;
        
        if (email && !validateEmail(email)) {
            showError('email', 'Please enter a valid email address');
            isValid = false;
        }
        
        if (loginEmail && !validateEmail(loginEmail)) {
            showError('loginEmail', 'Please enter a valid email address');
            isValid = false;
        }
        
        if (phone && !validatePhone(phone)) {
            showError('phone', 'Please enter a valid phone number');
            isValid = false;
        }
        
        if (isValid) {
            // Show loading
            registerLoader.style.display = 'block';
            document.querySelector('.register-btn .btn-text').style.opacity = '0.7';
            
            try {
                // Collect form data
                const formData = {
                    bankName: document.getElementById('bankName').value,
                    licenseNumber: document.getElementById('licenseNumber').value,
                    establishedYear: parseInt(document.getElementById('establishedYear').value),
                    bankType: document.getElementById('bankType').value,
                    contactPerson: document.getElementById('contactPerson').value,
                    designation: document.getElementById('designation').value,
                    phone: document.getElementById('phone').value,
                    email: document.getElementById('email').value,
                    website: document.getElementById('website').value,
                    address: document.getElementById('address').value,
                    city: document.getElementById('city').value,
                    state: document.getElementById('state').value,
                    zipCode: document.getElementById('zipCode').value,
                    country: document.getElementById('country').value,
                    loginEmail: document.getElementById('loginEmail').value,
                    password: password
                };
                
                const response = await fetch(`${API_BASE_URL}/bloodbank/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showSuccess('Registration successful! Redirecting to login page...');
                    
                    // Redirect to login page after success
                    setTimeout(() => {
                        goToLogin();
                    }, 2000);
                } else {
                    showErrorMessage(data.message || 'Registration failed');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showErrorMessage('Registration failed. Please try again.');
            } finally {
                registerLoader.style.display = 'none';
                document.querySelector('.register-btn .btn-text').style.opacity = '1';
            }
        } else {
            // Scroll to first error
            const firstError = document.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });
}