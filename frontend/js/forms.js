/**
 * Blood Donation Website - Forms JavaScript
 * Handles form submissions, validation, and user interactions
 */

// Form handlers
document.addEventListener('DOMContentLoaded', function() {
    setupFormHandlers();
});

/**
 * Setup all form handlers
 */
function setupFormHandlers() {
    setupDonorForm();
    setupRequestForm();
    setupSearchForm();
    setupContactForm();
    setupLoginForm();
    setupRegisterForm();
}

/**
 * Setup donor registration form
 */
function setupDonorForm() {
    const donorForm = document.getElementById('donorForm');
    if (!donorForm) return;
    
    donorForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateDonorForm()) {
            return;
        }
        
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        
        try {
            BloodConnect.setLoadingState(submitBtn, true);
            
            const formData = new FormData(donorForm);
            const rawData = Object.fromEntries(formData.entries());

            // Map form fields to MongoDB schema
            const donorData = {
                name: rawData.fullName,
                age: parseInt(rawData.age),
                gender: rawData.gender,
                bloodGroup: rawData.bloodGroup,
                contactNumber: rawData.contactNumber,
                email: rawData.email,
                city: rawData.city,
                state: rawData.state,
                dateOfDonation: rawData.donationDate ? new Date(rawData.donationDate).toISOString() : '',
                medicalHistory: rawData.medicalHistory || ''
            };

            console.log('📝 Raw form data:', rawData);
            console.log('📤 Submitting donor data to MongoDB Atlas:', donorData);

            // Validate required fields before sending
            const requiredFields = ['name', 'age', 'gender', 'bloodGroup', 'contactNumber', 'email', 'city', 'state', 'dateOfDonation'];
            const missingFields = requiredFields.filter(field => !donorData[field]);

            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            const apiBase = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api`;
            const response = await fetch(`${apiBase}/donors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(donorData)
            });
            
            const result = await response.json();
            console.log('📥 MongoDB Atlas response:', result);

            if (response.ok) {
                BloodConnect.showModal(
                    '🎉 Registration Successful!',
                    `Thank you ${donorData.name}! Your blood donor registration has been saved to our database.

                    📋 Registration Details:
                    • Blood Group: ${donorData.bloodGroup}
                    • Donation Date: ${new Date(donorData.dateOfDonation).toLocaleDateString()}
                    • Location: ${donorData.city}, ${donorData.state}

                    We will contact you at ${donorData.contactNumber} to confirm your donation appointment.`,
                    'success'
                );
                donorForm.reset();
            } else {
                throw new Error(result.message || 'Registration failed');
            }
            
        } catch (error) {
            console.error('❌ Donor registration error:', error);

            let errorMessage = 'An error occurred during registration. Please try again.';

            if (error.message.includes('fetch')) {
                errorMessage = '🔌 Connection Error: Unable to connect to the database. Please check your internet connection and try again.';
            } else if (error.message.includes('duplicate') || error.message.includes('already exists')) {
                errorMessage = '📧 Email Already Registered: This email is already registered in our system. Please use a different email or try logging in.';
            } else if (error.message.includes('validation')) {
                errorMessage = '📝 Validation Error: Please check your information and ensure all required fields are filled correctly.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            BloodConnect.showModal(
                '❌ Registration Failed',
                errorMessage,
                'error'
            );
        } finally {
            submitBtn.innerHTML = originalText;
            BloodConnect.setLoadingState(submitBtn, false);
        }
    });
}

/**
 * Validate donor form
 * @returns {boolean} - Validation result
 */
function validateDonorForm() {
    const form = document.getElementById('donorForm');
    if (!form) return false;
    
    const fields = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    fields.forEach(field => {
        if (!BloodConnect.validateField(field)) {
            isValid = false;
        }
    });
    
    // Additional validation for date
    const dateField = document.getElementById('donationDate');
    if (dateField && dateField.value) {
        const selectedDate = new Date(dateField.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate <= today) {
            BloodConnect.showFieldError(dateField, 'Please select a future date for donation');
            isValid = false;
        } else {
            BloodConnect.clearFieldError(dateField);
        }
    }

    // Age validation
    const ageField = document.getElementById('age');
    if (ageField && ageField.value) {
        const age = parseInt(ageField.value);
        if (age < 18 || age > 65) {
            BloodConnect.showFieldError(ageField, 'Age must be between 18 and 65 years');
            isValid = false;
        } else {
            BloodConnect.clearFieldError(ageField);
        }
    }

    // Phone number validation
    const phoneField = document.getElementById('contactNumber');
    if (phoneField && phoneField.value) {
        const phoneRegex = /^[6-9][0-9]{9}$/;
        if (!phoneRegex.test(phoneField.value)) {
            BloodConnect.showFieldError(phoneField, 'Please enter a valid 10-digit mobile number');
            isValid = false;
        } else {
            BloodConnect.clearFieldError(phoneField);
        }
    }

    // Email validation
    const emailField = document.getElementById('email');
    if (emailField && emailField.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value)) {
            BloodConnect.showFieldError(emailField, 'Please enter a valid email address');
            isValid = false;
        } else {
            BloodConnect.clearFieldError(emailField);
        }
    }
    
    return isValid;
}

/**
 * Setup blood request form
 */
function setupRequestForm() {
    const requestForm = document.getElementById('requestForm');
    if (!requestForm) return;
    
    requestForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateRequestForm()) {
            return;
        }
        
        const submitBtn = document.getElementById('requestSubmitBtn');
        const originalText = submitBtn.innerHTML;
        
        try {
            BloodConnect.setLoadingState(submitBtn, true);
            
            const formData = new FormData(requestForm);
            const rawData = Object.fromEntries(formData.entries());

            // Map form fields to MongoDB schema
            const requestData = {
                patientName: rawData.patientName,
                bloodGroup: rawData.bloodGroup,
                requiredUnits: parseInt(rawData.requiredUnits),
                urgency: rawData.urgency,
                hospitalName: rawData.hospitalName,
                location: rawData.location,
                contactNumber: rawData.contactNumber,
                requiredBy: rawData.requiredBy,
                contactPersonName: rawData.contactPersonName || '',
                relationship: rawData.relationship || 'Family',
                additionalNotes: rawData.additionalNotes || ''
            };

            console.log('📤 Submitting blood request to MongoDB Atlas:', requestData);
            
            // Get auth token if user is logged in
            const token = localStorage.getItem('authToken');
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                console.log('🔐 User is logged in, sending blood request with auth token');
            } else {
                console.log('👤 User is not logged in, submitting blood request as guest');
            }

            const apiBase = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api`;
            const response = await fetch(`${apiBase}/requests`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            console.log('📥 MongoDB Atlas response:', result);

            if (response.ok) {
                BloodConnect.showModal(
                    '🩸 Blood Request Submitted!',
                    `Your urgent blood request has been saved to our database successfully!

                    📋 Request Details:
                    • Patient: ${requestData.patientName}
                    • Blood Group: ${requestData.bloodGroup}
                    • Units Needed: ${requestData.requiredUnits}
                    • Urgency: ${requestData.urgency}
                    • Hospital: ${requestData.hospitalName}
                    • Location: ${requestData.location}
                    • Required By: ${new Date(requestData.requiredBy).toLocaleString()}

                    🔍 We are now searching for compatible donors in your area. You will be contacted at ${requestData.contactNumber} as soon as we find suitable donors.`,
                    'success'
                );
                requestForm.reset();
                
                // Show potential donors if available
                if (result.data && result.data.suggestedDonors && result.data.suggestedDonors.length > 0) {
                    setTimeout(() => {
                        displaySuggestedDonors(result.data.suggestedDonors);
                    }, 2000);
                }
            } else {
                throw new Error(result.message || 'Request submission failed');
            }
            
        } catch (error) {
            console.error('❌ Blood request error:', error);

            let errorMessage = 'An error occurred while submitting your request. Please try again.';

            if (error.message.includes('fetch')) {
                errorMessage = '🔌 Connection Error: Unable to connect to the database. Please check your internet connection and try again.';
            } else if (error.message.includes('validation')) {
                errorMessage = '📝 Validation Error: Please check your information and ensure all required fields are filled correctly.';
            } else if (error.message.includes('required by')) {
                errorMessage = '📅 Date Error: The required by date must be in the future. Please select a valid date.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            BloodConnect.showModal(
                '❌ Request Submission Failed',
                errorMessage,
                'error'
            );
        } finally {
            submitBtn.innerHTML = originalText;
            BloodConnect.setLoadingState(submitBtn, false);
        }
    });
}

/**
 * Validate blood request form
 * @returns {boolean} - Validation result
 */
function validateRequestForm() {
    const form = document.getElementById('requestForm');
    if (!form) return false;
    
    const fields = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    fields.forEach(field => {
        if (!BloodConnect.validateField(field)) {
            isValid = false;
        }
    });
    
    // Additional validation for required by date
    const requiredByField = document.getElementById('requiredBy');
    if (requiredByField) {
        const requiredDate = new Date(requiredByField.value);
        const now = new Date();
        
        if (requiredDate <= now) {
            BloodConnect.showFieldError(requiredByField, 'Required by date must be in the future');
            isValid = false;
        }
    }
    
    // Units validation
    const unitsField = document.getElementById('requiredUnits');
    if (unitsField) {
        const units = parseInt(unitsField.value);
        if (units < 1 || units > 10) {
            BloodConnect.showFieldError(unitsField, 'Required units must be between 1 and 10');
            isValid = false;
        }
    }
    
    // Terms checkbox validation
    const termsCheckbox = document.getElementById('requestTerms');
    if (termsCheckbox && !termsCheckbox.checked) {
        BloodConnect.showFieldError(termsCheckbox, 'You must agree to the terms and conditions');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Setup search form
 */
function setupSearchForm() {
    const searchForm = document.getElementById('searchForm');
    if (!searchForm) return;
    
    searchForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const bloodGroup = document.getElementById('searchBloodGroup').value;
        const location = document.getElementById('searchLocation').value;
        
        if (!bloodGroup) {
            BloodConnect.showFieldError(
                document.getElementById('searchBloodGroup'),
                'Please select a blood group'
            );
            return;
        }
        
        try {
            const params = new URLSearchParams({
                bloodGroup: bloodGroup,
                ...(location && { location: location })
            });
            
            const response = await fetch(`http://localhost:3002/api/donors/search?${params}`);
            const result = await response.json();
            
            if (response.ok) {
                displaySearchResults(result.data.donors, bloodGroup, location);
            } else {
                throw new Error(result.message || 'Search failed');
            }
            
        } catch (error) {
            console.error('Search error:', error);
            BloodConnect.showModal(
                'Search Failed',
                error.message || 'An error occurred during search. Please try again.',
                'error'
            );
        }
    });
}

/**
 * Display search results
 * @param {Array} donors - Array of donor objects
 * @param {string} bloodGroup - Searched blood group
 * @param {string} location - Searched location
 */
function displaySearchResults(donors, bloodGroup, location) {
    const resultsContainer = document.getElementById('searchResults');
    const donorsList = document.getElementById('donorsList');
    
    if (!resultsContainer || !donorsList) return;
    
    resultsContainer.style.display = 'block';
    
    if (donors.length === 0) {
        donorsList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No donors found</h3>
                <p>No donors found for blood group ${bloodGroup} ${location ? `in ${location}` : ''}. 
                Try expanding your search area or check back later.</p>
            </div>
        `;
        return;
    }
    
    donorsList.innerHTML = donors.map(donor => `
        <div class="donor-card">
            <div class="donor-blood-type">${donor.bloodGroup}</div>
            <div class="donor-info">
                <h4>${donor.name}</h4>
                <p><i class="fas fa-map-marker-alt"></i> ${donor.city}, ${donor.state}</p>
                <p><i class="fas fa-calendar"></i> Registered: ${BloodConnect.formatDate(new Date(donor.registrationDate))}</p>
            </div>
            <div class="donor-contact">
                <button class="btn btn-primary btn-sm" onclick="contactDonor('${donor._id}')">
                    <i class="fas fa-phone"></i> Contact
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Display suggested donors
 * @param {Array} donors - Array of suggested donor objects
 */
function displaySuggestedDonors(donors) {
    if (donors.length === 0) return;
    
    const donorsHtml = donors.map(donor => `
        <li>${donor.name} (${donor.bloodGroup}) - ${donor.city}, ${donor.state}</li>
    `).join('');
    
    BloodConnect.showModal(
        'Potential Donors Found!',
        `We found ${donors.length} potential donors in your area:<ul style="text-align: left; margin-top: 10px;">${donorsHtml}</ul>`,
        'success'
    );
}

/**
 * Contact donor (placeholder function)
 * @param {string} donorId - Donor ID
 */
function contactDonor(donorId) {
    BloodConnect.showModal(
        'Contact Information',
        'For privacy reasons, donor contact information is not displayed publicly. Please call our helpline at 9136706650 to get connected with the donor.',
        'info'
    );
}

/**
 * Setup contact form
 */
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateContactForm()) {
            return;
        }
        
        const submitBtn = document.getElementById('contactSubmitBtn');
        const originalText = submitBtn.innerHTML;
        
        try {
            BloodConnect.setLoadingState(submitBtn, true);
            
            // Simulate API call (replace with actual endpoint when available)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            BloodConnect.showModal(
                'Message Sent!',
                'Thank you for contacting us. We have received your message and will get back to you soon.',
                'success'
            );
            contactForm.reset();
            
        } catch (error) {
            console.error('Contact form error:', error);
            BloodConnect.showModal(
                'Message Failed',
                'An error occurred while sending your message. Please try again or call us directly.',
                'error'
            );
        } finally {
            submitBtn.innerHTML = originalText;
            BloodConnect.setLoadingState(submitBtn, false);
        }
    });
}

/**
 * Validate contact form
 * @returns {boolean} - Validation result
 */
function validateContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return false;
    
    const fields = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    fields.forEach(field => {
        if (!BloodConnect.validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

/**
 * Setup login form
 */
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
        console.log('❌ Login form not found in setupLoginForm');
        return;
    }
    
    console.log('✅ Login form found, setting up event listener');
    
    loginForm.addEventListener('submit', async function(e) {
        console.log('🔐 Login form submitted, preventing default...');
        e.preventDefault();
        e.stopPropagation();
        
        if (!validateLoginForm()) {
            return;
        }
        
        const submitBtn = document.getElementById('loginSubmitBtn');
        const originalText = submitBtn.innerHTML;
        
        try {
            if (typeof BloodConnect === 'undefined') {
                console.error('❌ BloodConnect object not available');
                return;
            }
            
            BloodConnect.setLoadingState(submitBtn, true);
            
            const formData = new FormData(loginForm);
            const loginData = Object.fromEntries(formData.entries());
            
            console.log('📧 Login data:', loginData);
            
            const apiBase = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api`;
            console.log('🌐 API Base URL:', apiBase);
            console.log('📤 Making login request to:', `${apiBase}/auth/login`);
            
            const response = await fetch(`${apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Handle login success with auth state manager
                let redirectUrl = '/';
                if (window.authStateManager) {
                    redirectUrl = window.authStateManager.handleLoginSuccess(result.data.user, result.data.token);
                } else {
                    // Fallback if auth state manager not available
                    localStorage.setItem('bloodconnect_token', result.data.token);
                    localStorage.setItem('bloodconnect_user', JSON.stringify(result.data.user));
                }

                BloodConnect.showModal(
                    '🎉 Login Successful!',
                    `Welcome back, ${result.data.user.firstName}! You can now access all features of the website.`,
                    'success'
                );

                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 2000);
                
            } else {
                throw new Error(result.message || 'Login failed');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            BloodConnect.showModal(
                'Login Failed',
                error.message || 'Invalid email or password. Please try again.',
                'error'
            );
        } finally {
            submitBtn.innerHTML = originalText;
            BloodConnect.setLoadingState(submitBtn, false);
        }
    });
}

/**
 * Validate login form with enhanced error handling
 * @returns {boolean} - Validation result
 */
function validateLoginForm() {
    try {
        console.log('🔍 Validating login form...');
        const form = document.getElementById('loginForm');
        if (!form) {
            console.error('❌ Login form not found');
            return false;
        }

        const email = document.getElementById('email');
        const password = document.getElementById('password');

        if (!email || !password) {
            console.error('❌ Email or password field not found');
            return false;
        }

        let isValid = true;

        // Enhanced email validation
        const emailValue = email.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailValue) {
            BloodConnect.showFieldError(email, 'Email is required');
            isValid = false;
        } else if (!emailRegex.test(emailValue)) {
            BloodConnect.showFieldError(email, 'Please enter a valid email address');
            isValid = false;
        } else {
            BloodConnect.clearFieldError(email);
        }

        // Password validation
        const passwordValue = password.value.trim();
        if (!passwordValue) {
            BloodConnect.showFieldError(password, 'Password is required');
            isValid = false;
        } else if (passwordValue.length < 6) {
            BloodConnect.showFieldError(password, 'Password must be at least 6 characters');
            isValid = false;
        } else {
            BloodConnect.clearFieldError(password);
        }

        console.log('✅ Login form validation result:', isValid);
        return isValid;

    } catch (error) {
        console.error('❌ Error validating login form:', error);
        return false;
    }
}

/**
 * Test CORS connection to backend
 */
async function testCORSConnection() {
    try {
        console.log('🧪 Testing CORS connection to backend...');
        const apiBase = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api`;
        const response = await fetch(`${apiBase}/cors-test`);
        const data = await response.json();
        console.log('✅ CORS test successful:', data);
        return true;
    } catch (error) {
        console.error('❌ CORS test failed:', error);
        return false;
    }
}

/**
 * Setup register form
 */
function setupRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;
    
    // Test CORS connection when form is set up
    testCORSConnection();
    
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateRegisterForm()) {
            return;
        }
        
        const submitBtn = document.getElementById('registerSubmitBtn');
        const originalText = submitBtn.innerHTML;
        
        try {
            BloodConnect.setLoadingState(submitBtn, true);
            
            const formData = new FormData(registerForm);
            const registerData = Object.fromEntries(formData.entries());
            
            console.log('📤 Registration data being sent:', registerData);
            const apiBase = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api`;
            console.log('🌐 Making request to:', `${apiBase}/auth/register`);
            
            const response = await fetch(`${apiBase}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData)
            });
            
            console.log('📥 Response status:', response.status);
            console.log('📥 Response headers:', response.headers);
            
            const result = await response.json();
            console.log('📥 Response data:', result);
            
            if (response.ok) {
                BloodConnect.showModal(
                    '🎉 Registration Successful!',
                    `Welcome to BloodConnect, ${result.data.user.firstName}! Your account has been created successfully. Please login with your credentials to access all features.`,
                    'success'
                );

                // Clear the form
                registerForm.reset();

                // Redirect to login page after 3 seconds
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 3000);
                
            } else {
                throw new Error(result.message || 'Registration failed');
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            BloodConnect.showModal(
                'Registration Failed',
                error.message || 'An error occurred during registration. Please try again.',
                'error'
            );
        } finally {
            submitBtn.innerHTML = originalText;
            BloodConnect.setLoadingState(submitBtn, false);
        }
    });
}

/**
 * Validate register form
 * @returns {boolean} - Validation result
 */
function validateRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return false;
    
    const fields = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    fields.forEach(field => {
        if (!BloodConnect.validateField(field)) {
            isValid = false;
        }
    });
    
    // Terms checkbox validation
    const termsCheckbox = document.getElementById('agreeTerms');
    if (termsCheckbox && !termsCheckbox.checked) {
        BloodConnect.showFieldError(termsCheckbox, 'You must agree to the terms and conditions');
        isValid = false;
    }
    
    return isValid;
}
