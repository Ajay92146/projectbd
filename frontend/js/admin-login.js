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
        } else {
            passwordInput.type = 'password';
            toggleButton.classList.remove('fa-eye-slash');
            toggleButton.classList.add('fa-eye');
        }
    }
}

// Admin login process
async function processAdminLogin(email, password) {
    debugLog('🔐 Starting admin login process...');
    debugLog(`📧 Email: ${email}`);
    
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
        // Check admin credentials
        debugLog('🔍 Validating credentials...');
        
        if (email === 'admin@bloodconnect.com' && password === 'Admin@123') {
            debugLog('✅ Admin credentials are correct!');
            
            // Store admin session with verification
            try {
                // Clear any existing admin data first
                localStorage.removeItem('bloodconnect_admin');
                localStorage.removeItem('admin_email');
                localStorage.removeItem('admin_login_time');
                
                // Set new admin session data
                localStorage.setItem('bloodconnect_admin', 'true');
                localStorage.setItem('admin_email', email);
                localStorage.setItem('admin_login_time', new Date().toISOString());
                
                // Verify storage was successful
                const storedStatus = localStorage.getItem('bloodconnect_admin');
                const storedEmail = localStorage.getItem('admin_email');
                
                debugLog(`💾 Stored admin status: ${storedStatus}`);
                debugLog(`💾 Stored admin email: ${storedEmail}`);
                
                if (storedStatus === 'true' && storedEmail === email) {
                    debugLog('✅ LocalStorage verification successful!');
                    
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
                    throw new Error('Failed to store admin session in localStorage');
                }
            } catch (storageError) {
                debugLog(`❌ LocalStorage error: ${storageError.message}`);
                throw new Error('Session storage failed. Please try again.');
            }
            
        } else {
            debugLog('❌ Invalid admin credentials');
            throw new Error('Invalid admin credentials. Please try again.');
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
    const adminStatus = localStorage.getItem('bloodconnect_admin');
    if (adminStatus === 'true') {
        debugLog('Already logged in as admin, redirecting to dashboard');
        window.location.href = 'admin-dashboard.html';
        return true;
    }
    return false;
}

// Initialize admin login page
function initializeAdminLogin() {
    debugLog('🚀 Admin login page initialized');
    debugLog(`Current URL: ${window.location.href}`);
    
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
            
            if (email && password) {
                await processAdminLogin(email, password);
            } else {
                debugLog('❌ Email or password is empty');
                const errorMessage = document.getElementById('errorMessage');
                if (errorMessage) {
                    errorMessage.textContent = 'Please enter both email and password.';
                    errorMessage.style.display = 'block';
                }
            }
        });
        
        debugLog('✅ Form submission handler attached');
    } else {
        debugLog('❌ Admin login form not found!');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAdminLogin);

// Make functions globally available
window.toggleAdminPassword = toggleAdminPassword;
window.processAdminLogin = processAdminLogin;