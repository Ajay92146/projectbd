/**
 * Authentication State Manager
 * Handles user authentication state across all pages
 */

class AuthStateManager {
    constructor() {
        this.init();
    }

    /**
     * Initialize authentication state
     */
    init() {
        // Check authentication status when page loads
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🔄 DOM loaded, initializing auth state...');
            this.checkAuthState();
            this.updateNavigation();
        });

        // Also check immediately if DOM is already loaded
        if (document.readyState === 'loading') {
            console.log('📄 DOM is still loading...');
        } else {
            console.log('📄 DOM already loaded, checking auth immediately...');
            this.checkAuthState();
            this.updateNavigation();
        }

        // Listen for storage changes (when user logs in/out in another tab)
        window.addEventListener('storage', (e) => {
            if (e.key === 'bloodconnect_token' || e.key === 'bloodconnect_user' || e.key === 'bloodconnect_demo_user') {
                console.log('💾 Storage changed, updating auth state...');
                this.checkAuthState();
                this.updateNavigation();
            }
        });

        // Periodically check auth state to handle token expiration
        setInterval(() => {
            this.validateToken();
        }, 60000); // Check every minute

        // Additional check after a short delay to ensure everything is loaded
        setTimeout(() => {
            console.log('⏰ Delayed auth check...');
            this.updateNavigation();
        }, 500);
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        const token = localStorage.getItem('bloodconnect_token');
        const user = localStorage.getItem('bloodconnect_user');
        const demoUser = localStorage.getItem('bloodconnect_demo_user');

        // Check for real authentication or demo user
        return !!(token && user) || !!demoUser;
    }

    /**
     * Validate stored token with server
     */
    async validateToken() {
        const token = localStorage.getItem('bloodconnect_token');
        if (!token) return;

        try {
            // Use dynamic API URL
            const apiBaseURL = window.getAPIBaseURL ? window.getAPIBaseURL() : '/api';
            const apiUrl = `${apiBaseURL}/auth/profile`;
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // Token is invalid, clear storage and redirect
                console.log('Token validation failed, logging out...');
                this.clearAuthData();
                this.updateNavigation();
            }
        } catch (error) {
            console.error('Token validation error:', error);
            // On network error, don't clear auth data
        }
    }

    /**
     * Redirect to home page with fallback options
     */
    redirectToHome() {
        console.log('🏠 Redirecting to home page...');

        // Try multiple redirect options
        const homeUrls = [
            '/',
            '/index.html',
            'index.html',
            window.location.origin,
            window.location.origin + '/'
        ];

        // Use the first available option
        for (const url of homeUrls) {
            try {
                window.location.href = url;
                break;
            } catch (error) {
                console.warn(`Failed to redirect to ${url}:`, error);
                continue;
            }
        }
    }

    /**
     * Clear authentication data
     */
    clearAuthData() {
        localStorage.removeItem('bloodconnect_token');
        localStorage.removeItem('bloodconnect_user');
        localStorage.removeItem('bloodconnect_demo_user');
        localStorage.removeItem('bloodconnect_remember');
        localStorage.removeItem('bloodconnect_redirect');

        // Update navigation immediately
        this.updateNavigation();

        console.log('🔓 Authentication data cleared');
    }

    /**
     * Get current user data
     * @returns {Object|null}
     */
    getCurrentUser() {
        try {
            // Check for real user data first
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
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }

    /**
     * Check authentication state and redirect if needed
     */
    checkAuthState() {
        const currentPage = window.location.pathname;
        const isAuthRequired = this.isAuthRequiredPage(currentPage);
        const isAuthenticated = this.isAuthenticated();
        const user = this.getCurrentUser();

        console.log('🔍 Auth State Check:', {
            currentPage,
            isAuthRequired,
            isAuthenticated,
            hasUser: !!user,
            userName: user?.firstName || user?.name || 'Unknown'
        });

        // If authentication is required but user is not authenticated
        if (isAuthRequired && !isAuthenticated) {
            console.log('❌ Authentication required, redirecting to login...');
            // Store the intended destination
            localStorage.setItem('bloodconnect_redirect', currentPage);
            window.location.href = '/login.html';
            return;
        }

        // If user is authenticated, update UI
        if (isAuthenticated) {
            console.log('✅ User is authenticated, updating UI...');
            this.updateAuthenticatedUI();
        } else {
            console.log('👤 User is not authenticated');
        }
    }

    /**
     * Check if current page requires authentication
     * @param {string} path
     * @returns {boolean}
     */
    isAuthRequiredPage(path) {
        const authRequiredPages = [
            '/profile.html'
        ];

        // Only profile page requires authentication
        // Donate and request pages should be accessible to all users
        return authRequiredPages.some(page => path.includes(page));
    }

    /**
     * Update navigation based on authentication state
     */
    updateNavigation() {
        const isAuthenticated = this.isAuthenticated();
        const user = this.getCurrentUser();

        // Handle standard navigation elements (registerNav, loginNav)
        const registerNav = document.getElementById('registerNav');
        const loginNav = document.getElementById('loginNav');

        console.log('🔍 Navigation elements found:', {
            registerNav: !!registerNav,
            loginNav: !!loginNav,
            isAuthenticated
        });

        if (registerNav && loginNav) {
            if (isAuthenticated) {
                // User is logged in - hide register and login
                console.log('👤 User authenticated - hiding register/login buttons');
                registerNav.style.display = 'none';
                loginNav.style.display = 'none';
            } else {
                // User is not logged in - show register and login
                console.log('🚪 User not authenticated - showing register/login buttons');
                registerNav.style.display = 'block';
                loginNav.style.display = 'block';
            }
        } else {
            console.log('⚠️ Navigation elements not found on this page');
        }

        // Find login button or existing user dropdown for auth dropdown system
        const loginBtn = document.querySelector('.nav-link.login-btn, a[href="login.html"]');
        const existingDropdown = document.querySelector('.user-dropdown');

        console.log('🔄 Updating Navigation:', {
            isAuthenticated,
            hasUser: !!user,
            hasLoginBtn: !!loginBtn,
            hasDropdown: !!existingDropdown,
            hasRegisterNav: !!registerNav,
            hasLoginNav: !!loginNav,
            userName: user?.firstName || user?.name || 'Unknown'
        });

        if (isAuthenticated && user) {
            if (loginBtn && !existingDropdown) {
                console.log('🔄 Creating user dropdown...');
                // Replace login button with user dropdown
                this.createUserDropdown(loginBtn, user);
            } else if (existingDropdown) {
                console.log('🔄 Updating existing dropdown...');
                // Update existing dropdown with current user info
                this.updateUserDropdown(user);
            }
        } else {
            // User is not authenticated, show login button
            if (existingDropdown) {
                console.log('🔄 Restoring login button...');
                this.restoreLoginButton();
            }
        }
    }

    /**
     * Update existing user dropdown with current user info
     * @param {Object} user
     */
    updateUserDropdown(user) {
        const userNameSpan = document.querySelector('#userDropdown span');
        if (userNameSpan) {
            userNameSpan.textContent = `Hi, ${user.firstName || user.name || 'User'}`;
        }
    }

    /**
     * Restore login button when user logs out
     */
    restoreLoginButton() {
        const existingDropdown = document.querySelector('.user-dropdown');
        if (existingDropdown) {
            const loginHTML = `
                <li class="nav-item">
                    <a href="login.html" class="nav-link login-btn">
                        <i class="fas fa-user"></i>
                        <span>Login</span>
                    </a>
                </li>
            `;
            existingDropdown.outerHTML = loginHTML;
        }
    }

    /**
     * Create user dropdown menu
     * @param {Element} loginBtn
     * @param {Object} user
     */
    createUserDropdown(loginBtn, user) {
        const navItem = loginBtn.closest('.nav-item') || loginBtn.parentElement;

        // Create dropdown HTML with better structure
        const dropdownHTML = `
            <li class="nav-item user-dropdown">
                <a href="#" class="nav-link dropdown-toggle" id="userDropdown" role="button" aria-haspopup="true" aria-expanded="false">
                    <i class="fas fa-user-circle"></i>
                    <span>Hi, ${user.firstName || user.name || 'User'}</span>
                    <i class="fas fa-chevron-down"></i>
                </a>
                <div class="dropdown-menu" aria-labelledby="userDropdown">
                    <a class="dropdown-item" href="profile.html">
                        <i class="fas fa-user"></i> My Profile
                    </a>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item" href="#" id="logoutDropdownItem">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </a>
                </div>
            </li>
        `;

        // Replace the login button with dropdown
        navItem.outerHTML = dropdownHTML;

        // Add dropdown functionality
        this.initDropdownEvents();
    }

    /**
     * Initialize dropdown events
     */
    initDropdownEvents() {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
            const dropdownToggle = document.querySelector('#userDropdown');
            const dropdownMenu = document.querySelector('.user-dropdown .dropdown-menu');
            const logoutDropdownItem = document.querySelector('#logoutDropdownItem');

            if (dropdownToggle && dropdownMenu) {
                // Toggle dropdown on click
                dropdownToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Close other dropdowns first
                    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                        if (menu !== dropdownMenu) {
                            menu.classList.remove('show');
                        }
                    });

                    // Toggle current dropdown
                    dropdownMenu.classList.toggle('show');
                    dropdownToggle.setAttribute('aria-expanded', dropdownMenu.classList.contains('show'));
                });

                // Close dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
                        dropdownMenu.classList.remove('show');
                        dropdownToggle.setAttribute('aria-expanded', 'false');
                    }
                });

                // Close dropdown on escape key
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && dropdownMenu.classList.contains('show')) {
                        dropdownMenu.classList.remove('show');
                        dropdownToggle.setAttribute('aria-expanded', 'false');
                        dropdownToggle.focus();
                    }
                });
            }
            
            // Add logout event listener
            if (logoutDropdownItem) {
                logoutDropdownItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🚪 Logout clicked from dropdown');
                    this.logout();
                });
            }
        }, 100);
    }

    /**
     * Update UI for authenticated users
     */
    updateAuthenticatedUI() {
        const user = this.getCurrentUser();
        
        // Update any welcome messages
        const welcomeElements = document.querySelectorAll('.welcome-user');
        welcomeElements.forEach(el => {
            el.textContent = `Welcome, ${user.firstName || user.name || 'User'}!`;
        });

        // Show authenticated-only content
        const authOnlyElements = document.querySelectorAll('.auth-only');
        authOnlyElements.forEach(el => {
            el.style.display = 'block';
        });

        // Hide guest-only content
        const guestOnlyElements = document.querySelectorAll('.guest-only');
        guestOnlyElements.forEach(el => {
            el.style.display = 'none';
        });
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            // Call logout API if available
            if (window.API && window.API.auth) {
                await window.API.auth.logout();
            }
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Clear authentication data
            this.clearAuthData();

            // Show logout confirmation
            if (window.BloodConnect && window.BloodConnect.showModal) {
                window.BloodConnect.showModal(
                    '👋 Logged Out Successfully',
                    'You have been logged out successfully. Thank you for using BloodConnect!',
                    'success'
                );

                // Redirect after modal
                setTimeout(() => {
                    this.redirectToHome();
                }, 1500);
            } else {
                // Immediate redirect if no modal
                this.redirectToHome();
            }
        }
    }

    /**
     * Handle login success
     * @param {Object} userData
     * @param {string} token
     * @param {boolean} remember
     */
    handleLoginSuccess(userData, token, remember = false) {
        // Store authentication data
        localStorage.setItem('bloodconnect_token', token);
        localStorage.setItem('bloodconnect_user', JSON.stringify(userData));

        if (remember) {
            localStorage.setItem('bloodconnect_remember', 'true');
        }

        // Update UI immediately
        setTimeout(() => {
            this.updateNavigation();
            this.updateAuthenticatedUI();
        }, 100);

        console.log('✅ Login successful, user authenticated:', userData.firstName || userData.name);

        // Check if there's a redirect URL stored
        const redirectUrl = localStorage.getItem('bloodconnect_redirect');
        if (redirectUrl) {
            localStorage.removeItem('bloodconnect_redirect');
            return redirectUrl;
        }

        return '/'; // Default redirect to home
    }
}

// Initialize authentication state manager
console.log('🚀 Auth State Manager script loaded');

if (!window.authStateManager) {
    console.log('🔐 Creating new Auth State Manager...');
    const authStateManager = new AuthStateManager();
    // Make it globally available
    window.authStateManager = authStateManager;
    console.log('✅ Global Auth State Manager initialized');

    // Override any existing updateNavigation functions to prevent conflicts
    window.updateNavigation = function() {
        console.log('🔄 Global updateNavigation called');
        if (window.authStateManager) {
            window.authStateManager.updateNavigation();
        }
    };

    // Override any existing getCurrentUser functions to prevent conflicts
    window.getCurrentUser = function() {
        if (window.authStateManager) {
            return window.authStateManager.getCurrentUser();
        }
        return null;
    };
} else {
    console.log('♻️ Auth State Manager already exists');
}

// Force an immediate check if the page is already loaded
if (document.readyState !== 'loading') {
    console.log('⚡ Page already loaded, forcing immediate auth check...');
    setTimeout(() => {
        if (window.authStateManager) {
            window.authStateManager.updateNavigation();
        }
    }, 100);
}
