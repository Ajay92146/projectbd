/**
 * Admin Login JavaScript - External file to avoid CSP issues
 * Handles admin authentication and dashboard redirect
 */

// Debug logging function
function debugLog(message) {
    console.log(`[AdminLogin] ${message}`);
}

// Password toggle functionality
function toggleAdminPassword() {
    const passwordInput = document.getElementById('adminPassword');
    const toggleButton = document.querySelector('.password-toggle i');

    if (passwordInput && toggleButton) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleButton.classList.remove('fa-eye');
            toggleButton.classList.add('fa-eye-slash');
            toggleButton.parentElement.setAttribute('aria-label', 'Hide password');
        } else {
            passwordInput.type = 'password';
            toggleButton.classList.remove('fa-eye-slash');
            toggleButton.classList.add('fa-eye');
            toggleButton.parentElement.setAttribute('aria-label', 'Show password');
        }
    }
}

// Password strength checker
function checkPasswordStrength(password) {
    const strengthMeter = document.getElementById('strengthMeter');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthMeter || !strengthText) return;
    
    if (password.length === 0) {
        strengthMeter.className = 'strength-meter';
        strengthText.textContent = 'Password strength: None';
        strengthText.className = 'strength-text';
        return;
    }
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    
    // Character variety checks
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    // Update UI based on strength
    strengthMeter.className = 'strength-meter';
    strengthText.className = 'strength-text';
    
    if (strength <= 2) {
        strengthMeter.classList.add('strength-weak');
        strengthText.textContent = 'Password strength: Weak';
        strengthText.classList.add('strength-weak-text');
    } else if (strength <= 3) {
        strengthMeter.classList.add('strength-medium');
        strengthText.textContent = 'Password strength: Medium';
        strengthText.classList.add('strength-medium-text');
    } else {
        strengthMeter.classList.add('strength-strong');
        strengthText.textContent = 'Password strength: Strong';
        strengthText.classList.add('strength-strong-text');
    }
}

// Admin login process
async function processAdminLogin(email, password, rememberMe) {
    debugLog('🔐 Starting admin login process...');
    debugLog(`📧 Email: ${email}`);
    debugLog(`💾 Remember me: ${rememberMe}`);
    
    const loginBtn = document.getElementById('adminLoginBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // Hide previous messages
    if (errorMessage) errorMessage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';

    // Show loading state
    if (loginBtn) loginBtn.disabled = true;
    if (loadingSpinner) loadingSpinner.classList.add('active');

    try {
        // Check if BloodConnectAPI is available
        if (typeof window.BloodConnectAPI === 'undefined' || !window.BloodConnectAPI.adminService) {
            throw new Error('API service not available. Please refresh the page.');
        }

        // Use the admin service from api.js
        debugLog('🔍 Calling backend API for authentication...');
        const response = await window.BloodConnectAPI.adminService.login({
            email: email,
            password: password
        });
        
        debugLog('Response data:', response);
        
        if (response.success) {
            debugLog('✅ Admin credentials are correct!');
            
            // Store admin session with verification and fallback
            try {
                // Clear any existing admin data first
                const storages = [localStorage, sessionStorage];
                storages.forEach(storage => {
                    storage.removeItem('bloodconnect_admin');
                    storage.removeItem('admin_email');
                    storage.removeItem('admin_login_time');
                });
                
                // Set new admin session data based on remember me preference
                const primaryStorage = rememberMe ? localStorage : sessionStorage;
                primaryStorage.setItem('bloodconnect_admin', 'true');
                primaryStorage.setItem('admin_email', email);
                primaryStorage.setItem('admin_login_time', new Date().toISOString());
                
                // Mirror to the other storage as fallback
                const secondaryStorage = rememberMe ? sessionStorage : localStorage;
                secondaryStorage.setItem('bloodconnect_admin', 'true');
                secondaryStorage.setItem('admin_email', email);
                secondaryStorage.setItem('admin_login_time', new Date().toISOString());
                
                // Verify storage was successful in primary
                const storedStatus = primaryStorage.getItem('bloodconnect_admin');
                const storedEmail = primaryStorage.getItem('admin_email');
                
                debugLog(`💾 Stored admin status: ${storedStatus}`);
                debugLog(`💾 Stored admin email: ${storedEmail}`);
                
                if (storedStatus === 'true' && storedEmail === email) {
                    debugLog('✅ Storage verification successful!');
                    
                    // Show success message
                    if (successMessage) {
                        successMessage.textContent = 'Login successful! Redirecting to dashboard...';
                        successMessage.style.display = 'block';
                    }
                    
                    // Redirect with delay to ensure storage is committed
                    setTimeout(() => {
                        debugLog('🚀 Redirecting to admin dashboard...');
                        window.location.href = 'admin-dashboard.html';
                    }, 2000);
                    
                } else {
                    throw new Error('Failed to store admin session in storage');
                }
            } catch (storageError) {
                debugLog(`❌ Storage error: ${storageError.message}`);
                // Fallback: Try the other storage type
                const fallbackStorage = rememberMe ? sessionStorage : localStorage;
                fallbackStorage.setItem('bloodconnect_admin', 'true');
                fallbackStorage.setItem('admin_email', email);
                fallbackStorage.setItem('admin_login_time', new Date().toISOString());
                
                if (fallbackStorage.getItem('bloodconnect_admin') === 'true') {
                    debugLog('✅ Fallback storage successful!');
                } else {
                    throw new Error('Session storage failed even in fallback. Please check browser settings.');
                }
            }
            
        } else {
            debugLog('❌ Invalid admin credentials or API error');
            throw new Error(response.message || 'Invalid admin credentials. Please try again.');
        }
        
    } catch (error) {
        debugLog(`❌ Login failed: ${error.message}`);
        
        // Show error message
        if (errorMessage) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        }
        
        // Clear password field
        const passwordInput = document.getElementById('adminPassword');
        if (passwordInput) passwordInput.value = '';
        
    } finally {
        // Reset loading state
        if (loginBtn) loginBtn.disabled = false;
        if (loadingSpinner) loadingSpinner.classList.remove('active');
    }
}

// Check if already logged in
function checkExistingAdminLogin() {
    // Check both localStorage and sessionStorage
    const adminStatus = localStorage.getItem('bloodconnect_admin') || sessionStorage.getItem('bloodconnect_admin');
    const adminEmail = localStorage.getItem('admin_email') || sessionStorage.getItem('admin_email');
    const adminLoginTime = localStorage.getItem('admin_login_time') || sessionStorage.getItem('admin_login_time');
    
    debugLog(`Checking existing login - Status: ${adminStatus}, Email: ${adminEmail}, LoginTime: ${adminLoginTime}`);
    
    if (adminStatus === 'true' && adminEmail && adminLoginTime) {
        // Check if session is still valid (30 minutes)
        const loginTime = new Date(adminLoginTime);
        const currentTime = new Date();
        const timeDiff = currentTime - loginTime;
        const minutesDiff = timeDiff / (1000 * 60);
        
        debugLog(`Session age: ${minutesDiff.toFixed(2)} minutes`);
        
        if (minutesDiff <= 30) {
            debugLog('Valid session found, redirecting to dashboard');
            // Add a small delay to prevent redirect loops
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 500);
            return true;
        } else {
            debugLog('Session expired, clearing storage');
            // Clear expired session
            localStorage.removeItem('bloodconnect_admin');
            localStorage.removeItem('admin_email');
            localStorage.removeItem('admin_login_time');
            sessionStorage.removeItem('bloodconnect_admin');
            sessionStorage.removeItem('admin_email');
            sessionStorage.removeItem('admin_login_time');
        }
    }
    return false;
}

// Validate email format
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password
function validatePassword(password) {
    // At least 8 characters, contains uppercase, lowercase, number, and special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

// Initialize admin login page
function initializeAdminLogin() {
    debugLog('🚀 Admin login page initialized');
    debugLog(`Current URL: ${window.location.href}`);
    
    // Prevent multiple initialization
    if (window.adminLoginInitialized) {
        debugLog('Admin login already initialized, skipping...');
        return;
    }
    window.adminLoginInitialized = true;
    
    // Check if already logged in
    if (checkExistingAdminLogin()) {
        return;
    }
    
    // Set up form submission handler
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const email = document.getElementById('adminEmail')?.value || '';
            const password = document.getElementById('adminPassword')?.value || '';
            const rememberMe = document.getElementById('rememberMe')?.checked || false;
            
            // Reset error messages
            const emailError = document.getElementById('email-error');
            const passwordError = document.getElementById('password-error');
            const errorMessage = document.getElementById('errorMessage');
            
            if (emailError) emailError.style.display = 'none';
            if (passwordError) passwordError.style.display = 'none';
            if (errorMessage) errorMessage.style.display = 'none';
            
            // Basic validation
            let hasErrors = false;
            
            if (!email) {
                debugLog('❌ Email is empty');
                if (emailError) {
                    emailError.textContent = 'Please enter your email address.';
                    emailError.style.display = 'block';
                }
                hasErrors = true;
            } else if (!validateEmail(email)) {
                debugLog('❌ Invalid email format');
                if (emailError) {
                    emailError.textContent = 'Please enter a valid email address.';
                    emailError.style.display = 'block';
                }
                hasErrors = true;
            }
            
            if (!password) {
                debugLog('❌ Password is empty');
                if (passwordError) {
                    passwordError.textContent = 'Please enter your password.';
                    passwordError.style.display = 'block';
                }
                hasErrors = true;
            }
            
            if (hasErrors) {
                return;
            }
            
            await processAdminLogin(email, password, rememberMe);
        });
        
        // Add password strength checker
        const passwordInput = document.getElementById('adminPassword');
        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                checkPasswordStrength(this.value);
            });
        }
        
        // Add email validation on blur
        const emailInput = document.getElementById('adminEmail');
        if (emailInput) {
            emailInput.addEventListener('blur', function() {
                const emailError = document.getElementById('email-error');
                if (emailError) {
                    emailError.style.display = 'none';
                    if (this.value && !validateEmail(this.value)) {
                        emailError.textContent = 'Please enter a valid email address.';
                        emailError.style.display = 'block';
                    }
                }
            });
        }
        
        debugLog('✅ Form submission handler attached');
    } else {
        debugLog('❌ Admin login form not found!');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAdminLogin);

// Make functions globally available
window.toggleAdminPassword = toggleAdminPassword;
window.checkPasswordStrength = checkPasswordStrength;