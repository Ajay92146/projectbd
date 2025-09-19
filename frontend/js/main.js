/**
 * Blood Donation Website - Main JavaScript File
 * Handles general functionality, navigation, and UI interactions
 */

// Global variables
let isMenuOpen = false;

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    setupNavigation();
    setupScrollEffects();
    setupCounters();
    setupFAQ();
    setupModals();
    setupFormValidation();
    setupAnimations();
    initializeAuthState();

    console.log('🩸 BloodConnect initialized successfully');
}

/**
 * Initialize authentication state manager
 */
function initializeAuthState() {
    // Initialize global auth state manager if not already done
    if (typeof AuthStateManager !== 'undefined' && !window.authStateManager) {
        window.authStateManager = new AuthStateManager();
        console.log('🔐 Auth State Manager initialized');
    }
}

/**
 * Setup navigation functionality
 */
function setupNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Hamburger menu toggle
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            toggleMobileMenu();
        });
    }
    
    // Close menu when clicking on nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 640) {
                closeMobileMenu();
            }
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (isMenuOpen && !navMenu.contains(event.target) && !hamburger.contains(event.target)) {
            closeMobileMenu();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 640 && isMenuOpen) {
            closeMobileMenu();
        }
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                navbar.style.backdropFilter = 'blur(10px)';
            } else {
                navbar.style.backgroundColor = '#ffffff';
                navbar.style.backdropFilter = 'none';
            }
        }
    });
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    if (hamburger && navMenu) {
        isMenuOpen = !isMenuOpen;
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    }
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    if (hamburger && navMenu) {
        isMenuOpen = false;
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Setup scroll effects and animations
 */
function setupScrollEffects() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, observerOptions);
    
    // Observe elements with animation classes
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in');
    animatedElements.forEach(element => {
        observer.observe(element);
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Setup counter animations
 */
function setupCounters() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    
    const countUp = (element) => {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    };
    
    // Intersection Observer for counters
    const counterObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                countUp(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

/**
 * Setup Advanced FAQ functionality
 */
function setupFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    const searchInput = document.getElementById('faq-search-input');

    // Enhanced FAQ item interactions
    faqItems.forEach((item, index) => {
        const question = item.querySelector('.faq-question');

        if (question) {
            question.addEventListener('click', function() {
                // Close other open FAQ items with animation
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                        // Add closing animation
                        otherItem.style.transform = 'scale(0.98)';
                        setTimeout(() => {
                            otherItem.style.transform = '';
                        }, 200);
                    }
                });

                // Toggle current item with enhanced animation
                const isActive = item.classList.contains('active');
                item.classList.toggle('active');

                // Add opening animation
                if (!isActive) {
                    item.style.transform = 'scale(1.02)';
                    setTimeout(() => {
                        item.style.transform = '';
                    }, 300);
                }

                // Track FAQ interaction
                console.log(`FAQ ${index + 1} ${isActive ? 'closed' : 'opened'}`);
            });

            // Add keyboard support
            question.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    question.click();
                }
            });
        }
    });

    // FAQ Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();

            faqItems.forEach(item => {
                const questionText = item.querySelector('.faq-question h3').textContent.toLowerCase();
                const answerText = item.querySelector('.faq-answer p').textContent.toLowerCase();

                if (questionText.includes(searchTerm) || answerText.includes(searchTerm)) {
                    item.style.display = 'block';
                    item.style.animation = 'fadeInUp 0.3s ease-out';
                } else {
                    item.style.display = searchTerm === '' ? 'block' : 'none';
                }
            });

            // Show "no results" message if needed
            const visibleItems = Array.from(faqItems).filter(item =>
                item.style.display !== 'none'
            );

            if (visibleItems.length === 0 && searchTerm !== '') {
                showNoResultsMessage();
            } else {
                hideNoResultsMessage();
            }
        });

        // Add search input animations
        searchInput.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
            this.parentElement.style.boxShadow = '0 8px 30px rgba(229, 62, 62, 0.15)';
        });

        searchInput.addEventListener('blur', function() {
            this.parentElement.style.transform = '';
            this.parentElement.style.boxShadow = '';
        });
    }
}

/**
 * Show no results message for FAQ search
 */
function showNoResultsMessage() {
    let noResultsDiv = document.getElementById('faq-no-results');
    if (!noResultsDiv) {
        noResultsDiv = document.createElement('div');
        noResultsDiv.id = 'faq-no-results';
        noResultsDiv.className = 'faq-no-results';
        noResultsDiv.innerHTML = `
            <div class="no-results-content">
                <i class="fas fa-search"></i>
                <h3>No matching questions found</h3>
                <p>Try searching with different keywords or browse all questions above.</p>
            </div>
        `;
        document.querySelector('.faq-container').appendChild(noResultsDiv);
    }
    noResultsDiv.style.display = 'block';
}

/**
 * Hide no results message for FAQ search
 */
function hideNoResultsMessage() {
    const noResultsDiv = document.getElementById('faq-no-results');
    if (noResultsDiv) {
        noResultsDiv.style.display = 'none';
    }
}

/**
 * Setup modal functionality
 */
function setupModals() {
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal();
            }
        });
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
}

/**
 * Show modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {string} type - Modal type (success, error, info)
 */
function showModal(title = 'Success!', message = 'Operation completed successfully.', type = 'success') {
    const modal = document.getElementById('successModal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    
    if (modal) {
        if (modalTitle) modalTitle.textContent = title;
        if (modalMessage) modalMessage.textContent = message;
        
        // Add type-specific styling
        const modalHeader = modal.querySelector('.modal-header h2');
        if (modalHeader) {
            modalHeader.className = '';
            modalHeader.classList.add(type === 'error' ? 'text-error' : 'text-success');
        }
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Focus management for accessibility
        const closeButton = modal.querySelector('.btn');
        if (closeButton) {
            closeButton.focus();
        }
    }
}

/**
 * Close modal
 */
function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = '';
}

/**
 * Setup basic form validation
 */
function setupFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // Real-time validation
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                clearFieldError(this);
            });
        });
    });
}

/**
 * Validate individual field
 * @param {HTMLElement} field - Form field to validate
 * @returns {boolean} - Validation result
 */
function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name || field.id; // Fix: Fallback to id if name is not available
    const errorElement = document.getElementById(`${fieldName}-error`);
    
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    
    // Email validation
    else if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }
    
    // Phone number validation
    else if (field.type === 'tel' && value) {
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid 10-digit mobile number';
        }
    }
    
    // Age validation
    else if (fieldName === 'age' && value) {
        const age = parseInt(value);
        if (age < 18 || age > 65) {
            isValid = false;
            errorMessage = 'Age must be between 18 and 65 years';
        }
    }
    
    // Password validation
    else if (field.type === 'password' && value) {
        const minLength = 8; // Increased minimum length
        if (value.length < minLength) {
            isValid = false;
            errorMessage = `Password must be at least ${minLength} characters long`;
        } else if (!/(?=.*[a-z])/.test(value)) {
            isValid = false;
            errorMessage = 'Password must contain at least one lowercase letter';
        } else if (!/(?=.*[A-Z])/.test(value)) {
            isValid = false;
            errorMessage = 'Password must contain at least one uppercase letter';
        } else if (!/(?=.*\d)/.test(value)) {
            isValid = false;
            errorMessage = 'Password must contain at least one number';
        } else if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(value)) {
            isValid = false;
            errorMessage = 'Password must contain at least one special character';
        }
    }
    
    // Confirm password validation
    else if (fieldName === 'confirmPassword' && value) {
        const passwordField = document.getElementById('registerPassword');
        if (passwordField && value !== passwordField.value) {
            isValid = false;
            errorMessage = 'Passwords do not match';
        }
    }
    
    // Display error
    if (errorElement) {
        if (!isValid) {
            showFieldError(field, errorMessage);
        } else {
            clearFieldError(field);
        }
    }
    
    return isValid;
}

/**
 * Show field error
 * @param {HTMLElement} field - Form field
 * @param {string} message - Error message
 */
function showFieldError(field, message) {
    const fieldName = field.name || field.id;
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        field.classList.add('error');
        field.style.borderColor = '#e53e3e'; // Add visual feedback
    }
}

/**
 * Clear field error
 * @param {HTMLElement} field - Form field
 */
function clearFieldError(field) {
    const fieldName = field.name || field.id;
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (errorElement) {
        errorElement.style.display = 'none';
        field.classList.remove('error');
        field.style.borderColor = ''; // Reset border color
    }
}

/**
 * Setup animations
 */
function setupAnimations() {
    // Add stagger animation to lists
    const staggerLists = document.querySelectorAll('.actions-grid, .features-grid, .links-grid');
    staggerLists.forEach(list => {
        const items = list.children;
        Array.from(items).forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
        });
    });
}

/**
 * Toggle password visibility
 */
function togglePassword() {
    const passwordField = document.getElementById('password');
    const passwordEye = document.getElementById('password-eye');
    
    if (passwordField && passwordEye) {
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            passwordEye.classList.remove('fa-eye');
            passwordEye.classList.add('fa-eye-slash');
        } else {
            passwordField.type = 'password';
            passwordEye.classList.remove('fa-eye-slash');
            passwordEye.classList.add('fa-eye');
        }
    }
}

/**
 * Toggle register password visibility
 */
function toggleRegisterPassword() {
    const passwordField = document.getElementById('registerPassword');
    const passwordEye = document.getElementById('register-password-eye');
    
    if (passwordField && passwordEye) {
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            passwordEye.classList.remove('fa-eye');
            passwordEye.classList.add('fa-eye-slash');
        } else {
            passwordField.type = 'password';
            passwordEye.classList.remove('fa-eye-slash');
            passwordEye.classList.add('fa-eye');
        }
    }
}

/**
 * Show login form with error handling
 */
function showLoginForm() {
    try {
        const loginContainer = document.querySelector('.login-container');
        const registerContainer = document.getElementById('registerContainer');

        if (loginContainer && registerContainer) {
            loginContainer.style.display = 'block';
            registerContainer.style.display = 'none';

            // Focus on email input for better UX
            const emailInput = document.getElementById('email');
            if (emailInput) {
                setTimeout(() => emailInput.focus(), 100);
            }

            console.log('✅ Login form displayed successfully');
        } else {
            console.warn('⚠️ Login or register container not found');
        }
    } catch (error) {
        console.error('❌ Error showing login form:', error);
        // Fallback: redirect to login page
        if (window.location.pathname !== '/login.html') {
            window.location.href = '/login.html';
        }
    }
}

/**
 * Show register form
 */
function showRegisterForm() {
    const loginContainer = document.querySelector('.login-container');
    const registerContainer = document.getElementById('registerContainer');
    
    if (loginContainer && registerContainer) {
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
    }
}

/**
 * Utility function to format date
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

/**
 * Utility function to show loading state
 * @param {HTMLElement} button - Button element
 * @param {boolean} loading - Loading state
 */
function setLoadingState(button, loading) {
    if (!button) return;
    
    if (loading) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    } else {
        button.disabled = false;
        // Restore original content - this should be improved to store original content
        const originalText = button.getAttribute('data-original-text');
        if (originalText) {
            button.innerHTML = originalText;
        }
    }
}

// Export functions for use in other files
window.BloodConnect = {
    showModal,
    closeModal,
    validateField,
    showFieldError,
    clearFieldError,
    setLoadingState,
    formatDate,
    togglePassword,
    toggleRegisterPassword,
    showLoginForm,
    showRegisterForm
};
