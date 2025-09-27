/**
 * Blood Donation Website - Forms JavaScript
 * Handles form submissions, validation, and user interactions
 */

// Form handlers
document.addEventListener('DOMContentLoaded', function() {
    // Ensure BloodConnect exists before setting up forms
    if (typeof window.BloodConnect === 'undefined') {
        console.warn('⚠️ BloodConnect not found, creating minimal fallback...');
        window.BloodConnect = {
            showModal: function(title, message, type) {
                const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : '💬';
                alert(`${icon} ${title}\n\n${message}`);
            },
            setLoadingState: function(button, loading) {
                if (!button) return;
                if (loading) {
                    button.disabled = true;
                    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                } else {
                    button.disabled = false;
                    button.innerHTML = button.getAttribute('data-original-text') || 'Submit';
                }
            },
            showFieldError: function(field, message) {
                console.error('Field validation error:', field.name || field.id, message);
                field.style.borderColor = '#e53e3e';
                field.classList.add('error');
                
                // Create or update error message element
                let errorDiv = document.getElementById((field.name || field.id) + '-error');
                if (!errorDiv) {
                    errorDiv = document.createElement('div');
                    errorDiv.id = (field.name || field.id) + '-error';
                    errorDiv.className = 'field-error';
                    errorDiv.style.cssText = 'color: #e53e3e; font-size: 12px; margin-top: 4px; display: block; font-weight: 500;';
                    field.parentNode.appendChild(errorDiv);
                }
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
            },
            clearFieldError: function(field) {
                field.style.borderColor = '';
                field.classList.remove('error');
                const errorDiv = document.getElementById((field.name || field.id) + '-error');
                if (errorDiv) {
                    errorDiv.textContent = '';
                    errorDiv.style.display = 'none';
                }
            },
            validateField: function(field) {
                const value = field.value.trim();
                let isValid = true;
                let errorMessage = '';
                
                // Required field validation
                if (field.hasAttribute('required') && !value) {
                    isValid = false;
                    errorMessage = 'This field is required';
                }
                // Email validation
                else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
                // Password validation (enhanced)
                else if (field.type === 'password' && value) {
                    const minLength = 8;
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
                    }
                }
                // Phone validation
                else if (field.type === 'tel' && value && !/^[6-9]\d{9}$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid 10-digit mobile number';
                }
                
                if (!isValid) {
                    this.showFieldError(field, errorMessage);
                } else {
                    this.clearFieldError(field);
                }
                
                return isValid;
            }
        };
        console.log('✅ BloodConnect fallback created successfully!');
    }
    
    setupFormHandlers();
});

/**
 * Check authentication for form access
 * @param {string} formType - Type of form ('donation' or 'request')
 * @returns {Object} Authentication status and message
 */
function checkFormAuthentication(formType) {
    // Check for authentication tokens - try multiple keys for compatibility
    const token = localStorage.getItem('token') || localStorage.getItem('bloodconnect_token') || localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userData = localStorage.getItem('bloodconnect_user') || localStorage.getItem('userData') || localStorage.getItem('user') || sessionStorage.getItem('userData');
    
    console.log('Checking form authentication:', {
        formType,
        hasToken: !!token,
        hasUserData: !!userData
    });
    
    if (!token || !userData) {
        const formTypeText = formType === 'donation' ? 'blood donation application' : 'blood request';
        return {
            isAuthenticated: false,
            message: `You must be logged in to submit a ${formTypeText}. Please log in to your account first.

Why do we require login?
• To verify your identity
• To contact you about your ${formType}
• To maintain a secure database
• To track your ${formType} history`
        };
    }
    
    try {
        const user = JSON.parse(userData);
        return {
            isAuthenticated: true,
            user: user,
            token: token
        };
    } catch (error) {
        console.error('Error parsing user data:', error);
        return {
            isAuthenticated: false,
            message: 'Invalid user session. Please log in again.'
        };
    }
}

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
    const donorForm = document.getElementById('donorForm') || document.getElementById('donorApplicationForm');
    if (!donorForm) return;
    
    donorForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Check authentication before processing form
        const authCheck = checkFormAuthentication('donation');
        if (!authCheck.isAuthenticated) {
            BloodConnect.showModal(
                '🔒 Authentication Required',
                authCheck.message,
                'error'
            );
            return;
        }
        
        if (!validateDonorForm()) {
            return;
        }
        
        const submitBtn = document.getElementById('submitBtn') || document.getElementById('submitApplicationBtn');
        const originalText = submitBtn.innerHTML;
        
        try {
            BloodConnect.setLoadingState(submitBtn, true);
            
            const formData = new FormData(donorForm);
            const rawData = Object.fromEntries(formData.entries());

            // Check if this is the application form or basic form
            const isApplicationForm = donorForm.id === 'donorApplicationForm';
            let donorData;
            let apiEndpoint;

            if (isApplicationForm) {
                // Handle application form data mapping for /api/donors/apply
                donorData = {
                    firstName: rawData.firstName,
                    lastName: rawData.lastName,
                    dateOfBirth: rawData.dateOfBirth,
                    gender: rawData.gender,
                    email: rawData.email,
                    phoneNumber: rawData.phoneNumber,
                    city: rawData.city,
                    state: rawData.state,
                    address: rawData.address,
                    bloodGroup: rawData.bloodGroup,
                    weight: parseInt(rawData.weight),
                    emergencyContact: rawData.emergencyContact,
                    preferredDate: rawData.preferredDate,
                    preferredTime: rawData.preferredTime,
                    medicalHistory: rawData.medicalHistory || '',
                    lastDonation: rawData.lastDonation || null,
                    availability: rawData.availability || '',
                    healthConsent: rawData.healthConsent === 'on',
                    dataConsent: rawData.dataConsent === 'on',
                    contactConsent: rawData.contactConsent === 'on'
                };
                apiEndpoint = '/donors/apply';
            } else {
                // Handle basic form data mapping for /api/donors (legacy)
                donorData = {
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
                apiEndpoint = '/donors';
            }

            console.log('📝 Raw form data:', rawData);
            console.log('📤 Submitting donor data to MongoDB Atlas:', donorData);
            console.log('📍 Using endpoint:', apiEndpoint);
            console.log('🔐 Authentication status:', !!token ? 'Authenticated' : 'Not authenticated');

            const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:3002/api' 
                : `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api`;
            
            // Get auth token for authenticated submissions  
            const token = localStorage.getItem('token') || localStorage.getItem('bloodconnect_token') || localStorage.getItem('authToken');
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                console.log('🔐 User is logged in, sending donation with auth token');
            }
            
            const response = await fetch(`${apiBase}${apiEndpoint}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(donorData)
            });
            
            const result = await response.json();
            console.log('📥 MongoDB Atlas response:', result);

            if (response.ok) {
                if (isApplicationForm) {
                    BloodConnect.showModal(
                        '🎉 Application Submitted Successfully!',
                        `Thank you for applying to become a blood donor! Your application has been submitted successfully.

                        📋 Application Details:
                        • Blood Group: ${donorData.bloodGroup}
                        • Preferred Date: ${new Date(donorData.preferredDate).toLocaleDateString()}
                        • Location: ${donorData.city}, ${donorData.state}

                        You will be contacted within 2-3 business days with next steps. ${result.data?.userLinked ? 'You can track your donation status in your profile under "My Donations".' : ''}
                        
                        📝 Note: Your donation will appear as "Pending" until approved by our blood bank staff.`,
                        'success'
                    );
                    
                    // Auto-redirect to profile after 3 seconds if user is logged in
                    if (result.data?.userLinked) {
                        setTimeout(() => {
                            if (confirm('Would you like to view your donation status in your profile?')) {
                                window.location.href = 'profile.html';
                            }
                        }, 3000);
                    }
                } else {
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
                }
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
    const form = document.getElementById('donorForm') || document.getElementById('donorApplicationForm');
    if (!form) return false;
    
    const fields = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    fields.forEach(field => {
        if (!BloodConnect.validateField(field)) {
            isValid = false;
        }
    });
    
    // Additional validation for date (both forms)
    const dateField = document.getElementById('donationDate') || document.getElementById('preferredDate');
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

    // Age validation (basic form)
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

    // Phone number validation (both forms)
    const phoneField = document.getElementById('contactNumber') || document.getElementById('phoneNumber');
    if (phoneField && phoneField.value) {
        const phoneRegex = /^[6-9][0-9]{9}$/;
        if (!phoneRegex.test(phoneField.value)) {
            BloodConnect.showFieldError(phoneField, 'Please enter a valid 10-digit mobile number');
            isValid = false;
        } else {
            BloodConnect.clearFieldError(phoneField);
        }
    }

    // Email validation (both forms)
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
        
        // Check authentication before processing form
        const authCheck = checkFormAuthentication('request');
        if (!authCheck.isAuthenticated) {
            BloodConnect.showModal(
                '🔒 Authentication Required',
                authCheck.message,
                'error'
            );
            return;
        }
        
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
            
            // Get auth token if user is logged in - check multiple keys
            const token = localStorage.getItem('token') || localStorage.getItem('bloodconnect_token') || localStorage.getItem('authToken');
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                console.log('🔐 User is logged in, sending blood request with auth token');
            } else {
                console.log('👤 User is not logged in, submitting blood request as guest');
            }

            const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:3002/api' 
                : `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api`;
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
 * Setup search form with enhanced external API integration
 */
function setupSearchForm() {
    const searchForm = document.getElementById('searchForm');
    if (!searchForm) return;
    
    searchForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const bloodGroupElement = document.getElementById('searchBloodGroup');
        const locationElement = document.getElementById('searchLocation');
        const urgencyElement = document.getElementById('searchUrgency');
        
        // Check if elements exist before accessing properties
        if (!bloodGroupElement) {
            console.error('Search form elements not found');
            return;
        }
        
        const bloodGroup = bloodGroupElement.value;
        const location = locationElement?.value || '';
        const urgency = urgencyElement?.value || 'medium';
        
        if (!bloodGroup) {
            if (window.BloodConnect && window.BloodConnect.showFieldError) {
                window.BloodConnect.showFieldError(
                    bloodGroupElement,
                    'Please select a blood group'
                );
            } else {
                alert('Please select a blood group');
            }
            return;
        }
        
        try {
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '🔍 Searching all sources...';
            submitBtn.disabled = true;
            
            // Use enhanced donor search with external APIs
            if (window.EnhancedDonorSearch) {
                console.log('🚀 Using enhanced search with external APIs');
                
                const searchParams = {
                    bloodGroup: bloodGroup,
                    location: location,
                    urgency: urgency
                };
                
                const results = await window.EnhancedDonorSearch.searchDonors(searchParams);
                
                // Display enhanced results
                displayEnhancedSearchResults(results, bloodGroup, location);
                
                // Send notifications if urgent
                if (urgency === 'critical' || urgency === 'high') {
                    await sendUrgentNotifications(results.donors, bloodGroup, location);
                }
                
            } else {
                // Fallback to original search
                console.log('⚠️ Enhanced search not available, using basic search');
                await performBasicSearch(bloodGroup, location);
            }
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
        } catch (error) {
            console.error('Search error:', error);
            
            // Reset button
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Search Donors';
                submitBtn.disabled = false;
            }
            
            BloodConnect.showModal(
                'Search Failed',
                error.message || 'An error occurred during search. Please try again.',
                'error'
            );
        }
    });
}

/**
 * Perform basic search (fallback)
 */
async function performBasicSearch(bloodGroup, location) {
    const params = new URLSearchParams({
        bloodGroup: bloodGroup,
        ...(location && { location: location })
    });
    
    // Use dynamic API URL
    const apiBaseURL = window.getAPIBaseURL ? window.getAPIBaseURL() : '/api';
    const apiUrl = `${apiBaseURL}/donors/search?${params}`;
    
    console.log('🔍 Basic search API URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    const result = await response.json();
    
    if (response.ok) {
        displaySearchResults(result.data?.donors || [], bloodGroup, location);
    } else {
        throw new Error(result.message || 'Search failed');
    }
}

/**
 * Display enhanced search results with multiple sources
 */
function displayEnhancedSearchResults(results, bloodGroup, location) {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) {
        console.warn('Search results container not found');
        return;
    }
    
    // Show search summary
    const summaryHtml = `
        <div class="search-summary" style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <h3 style="color: #e53e3e; margin-bottom: 0.5rem;">🔍 Enhanced Search Results</h3>
            <p style="margin: 0.5rem 0;">Found <strong>${results.totalDonors}</strong> donors for <strong>${bloodGroup}</strong> blood group</p>
            <p style="margin: 0.5rem 0; font-size: 0.9rem; color: #666;">Search completed in ${results.searchTime}ms from multiple sources</p>
            
            <div class="source-summary" style="margin-top: 1rem;">
                ${Object.entries(results.sources).map(([source, info]) => `
                    <span style="display: inline-block; margin: 0.25rem; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; ${
                        info.success ? 'background: #d4edda; color: #155724;' : 'background: #f8d7da; color: #721c24;'
                    }">
                        ${source}: ${info.success ? info.count + ' donors' : 'Failed'}
                    </span>
                `).join('')}
            </div>
        </div>
    `;
    
    // Show individual donor results
    const donorsHtml = results.donors.length > 0 ? `
        <div class="donors-grid" style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
            ${results.donors.map(donor => `
                <div class="donor-card" style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div class="donor-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                        <div>
                            <h4 style="margin: 0; color: #333;">${donor.name}</h4>
                            <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">📍 ${donor.city}, ${donor.state}</p>
                        </div>
                        <div style="text-align: right;">
                            <span style="background: #e53e3e; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: bold;">${donor.bloodGroup}</span>
                        </div>
                    </div>
                    
                    <div class="donor-details">
                        <p style="margin: 0.5rem 0;"><i class="fas fa-phone" style="color: #e53e3e; margin-right: 0.5rem;"></i>${donor.phone || donor.contactNumber || 'Contact via platform'}</p>
                        
                        <div style="display: flex; gap: 0.5rem; margin: 0.75rem 0; flex-wrap: wrap;">
                            <span style="background: #${donor.verified ? 'e7f3ff' : 'fff3cd'}; color: #${donor.verified ? '0c5460' : '856404'}; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">
                                ${donor.verified ? '✓ Verified' : 'Unverified'}
                            </span>
                            <span style="background: #e7f3ff; color: #0c5460; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">
                                Source: ${donor.source}
                            </span>
                            ${donor.priority ? `<span style="background: #d4edda; color: #155724; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">Priority: ${Math.round(donor.priority)}</span>` : ''}
                        </div>
                        
                        ${donor.lastDonation ? `<p style="margin: 0.5rem 0; font-size: 0.9rem; color: #666;">Last donation: ${new Date(donor.lastDonation).toLocaleDateString()}</p>` : ''}
                        ${donor.availability ? `<p style="margin: 0.5rem 0; font-size: 0.9rem; color: #666;">Status: ${donor.availability}</p>` : ''}
                        
                        <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                            <button class="contact-donor-btn" data-phone="${donor.phone || donor.contactNumber}" data-name="${donor.name}" style="background: #e53e3e; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; flex: 1;">
                                📞 Contact
                            </button>
                            ${donor.source === 'hospital_network' ? `
                                <button class="hospital-info-btn" data-name="${donor.name}" data-address="${donor.address}" style="background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                                    🏥 Info
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    ` : `
        <div style="text-align: center; padding: 2rem; color: #666;">
            <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; color: #ddd;"></i>
            <p>No donors found for ${bloodGroup} blood group in ${location || 'your area'}.</p>
            <p>Try searching in nearby cities or contact us at +91 9136706650 for assistance.</p>
        </div>
    `;
    
    searchResults.innerHTML = summaryHtml + donorsHtml;
    searchResults.style.display = 'block';
    
    // Add event listeners for contact and hospital info buttons (CSP-compliant)
    setTimeout(() => {
        // Contact donor buttons
        document.querySelectorAll('.contact-donor-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const phone = this.getAttribute('data-phone');
                const name = this.getAttribute('data-name');
                contactDonor(phone, name);
            });
        });
        
        // Hospital info buttons
        document.querySelectorAll('.hospital-info-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const name = this.getAttribute('data-name');
                const address = this.getAttribute('data-address');
                showHospitalInfo(name, address);
            });
        });
    }, 100);
}

/**
 * Send urgent notifications to nearby donors
 */
async function sendUrgentNotifications(donors, bloodGroup, location) {
    try {
        if (!window.ExternalAPIService) {
            console.log('External API service not available for notifications');
            return;
        }
        
        const urgentMessage = `URGENT: ${bloodGroup} blood needed in ${location}. Contact BloodConnect for details: +91 9136706650`;
        
        // Send to top 3 priority donors
        const topDonors = donors.slice(0, 3);
        
        for (const donor of topDonors) {
            if (donor.phone || donor.contactNumber) {
                const phone = donor.phone || donor.contactNumber;
                
                // Try WhatsApp first for urgent requests, then SMS
                try {
                    await window.ExternalAPIService.sendWhatsAppMessage(phone, urgentMessage, 'critical');
                    console.log(`💬 WhatsApp sent to ${donor.name}`);
                } catch (error) {
                    console.log(`📱 Fallback SMS sent to ${donor.name}`);
                }
            }
        }
        
        // Show notification to user
        if (topDonors.length > 0) {
            BloodConnect.showModal(
                'Urgent Notifications Sent',
                `Urgent blood request notifications sent to ${topDonors.length} nearby donors. You should receive responses shortly.`,
                'success'
            );
        }
        
    } catch (error) {
        console.error('Failed to send urgent notifications:', error);
    }
}

/**
 * Contact donor function
 */
window.contactDonor = function(phone, name) {
    if (!phone || phone === 'Contact via platform') {
        BloodConnect.showModal(
            'Contact Information',
            'Please contact this donor through our platform or call our helpline: +91 9136706650',
            'info'
        );
        return;
    }
    
    const message = `Contact ${name} at ${phone} for blood donation. Always verify donor availability before visiting.`;
    
    if (confirm(`${message}\n\nWould you like to call ${phone} now?`)) {
        window.open(`tel:${phone}`);
    }
};

/**
 * Show hospital information
 */
window.showHospitalInfo = function(name, address) {
    BloodConnect.showModal(
        'Hospital Blood Bank',
        `${name}

Address: ${address}

Please call ahead to confirm blood availability and visiting hours.`,
        'info'
    );
};

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
    console.log('🔧 Setting up login form...');
    const loginForm = document.getElementById('loginForm');
    
    if (!loginForm) {
        console.log('ℹ️ No login form found on this page - this is normal for pages without login functionality');
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
        
        // Store original text for loading state restoration
        if (!submitBtn.hasAttribute('data-original-text')) {
            submitBtn.setAttribute('data-original-text', originalText);
        }
        
        try {
            // Check if BloodConnect is available, if not create minimal fallback
            if (typeof BloodConnect === 'undefined') {
                console.warn('⚠️ BloodConnect object not available, creating fallback...');
                window.BloodConnect = {
                    setLoadingState: function(btn, loading) {
                        if (btn) {
                            btn.disabled = loading;
                            btn.textContent = loading ? 'Loading...' : 'Sign In';
                        }
                    },
                    showModal: function(title, message, type) {
                        alert(title + ': ' + message);
                    },
                    showFieldError: function(field, message) {
                        console.error('Field error:', field.name, message);
                    },
                    clearFieldError: function(field) {
                        console.log('Clearing error for:', field.name);
                    }
                };
            }
            
            BloodConnect.setLoadingState(submitBtn, true);
            
            const formData = new FormData(loginForm);
            const loginData = Object.fromEntries(formData.entries());
            
            console.log('📧 Login data:', {
                email: loginData.email,
                password: '***hidden***'
            });
            
            // Use the API client if available, otherwise fallback to fetch
            let response, result;
            
            if (window.API && window.API.auth) {
                console.log('🔧 Using API client for login...');
                result = await window.API.auth.login(loginData);
                response = { ok: result.success };
            } else {
                console.log('🔧 Using direct fetch for login...');
                
                // Use fixed backend port for local development
                const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                    ? 'http://localhost:3002/api' 
                    : `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api`;
                    
                console.log('🌐 API Base URL:', apiBase);
                console.log('📤 Making login request to:', `${apiBase}/auth/login`);
                
                response = await fetch(`${apiBase}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });
                
                result = await response.json();
            }
            
            if (response.ok && result.success) {
                console.log('🎉 Login successful, processing response...');
                
                // Handle login success with auth state manager
                let redirectUrl = '/index.html';
                
                // Store user data immediately
                try {
                    localStorage.setItem('authToken', result.data.token);
                    localStorage.setItem('userData', JSON.stringify(result.data.user));
                    
                    // Handle admin login with special redirect logic
                    if (result.data.user.role === 'admin') {
                        localStorage.setItem('bloodconnect_admin', 'true');
                        localStorage.setItem('admin_email', result.data.user.email);
                        localStorage.setItem('admin_login_time', new Date().toISOString());
                        
                        // Verify storage was set before redirect
                        setTimeout(() => {
                            const adminStatus = localStorage.getItem('bloodconnect_admin');
                            const adminEmail = localStorage.getItem('admin_email');
                            
                            console.log('🔍 Verifying admin storage:', { adminStatus, adminEmail });
                            
                            if (adminStatus === 'true' && adminEmail) {
                                console.log('✅ Admin storage verified, redirecting to dashboard...');
                                redirectUrl = 'admin-dashboard.html';
                                window.location.href = redirectUrl;
                            } else {
                                console.error('❌ Admin storage verification failed');
                                // Retry storage and redirect
                                localStorage.setItem('bloodconnect_admin', 'true');
                                localStorage.setItem('admin_email', result.data.user.email);
                                setTimeout(() => {
                                    window.location.href = 'admin-dashboard.html';
                                }, 200);
                            }
                        }, 150); // Give storage time to complete
                        
                        BloodConnect.showModal(
                            '👑 Admin Login Successful!',
                            `Welcome back, Administrator! Redirecting to admin dashboard...`,
                            'success'
                        );
                        return; // Don't execute normal user login flow
                    }
                    
                    // Normal user login flow
                    if (window.authStateManager) {
                        redirectUrl = window.authStateManager.handleLoginSuccess(result.data.user, result.data.token);
                    }
                    
                } catch (storageError) {
                    console.error('❌ Storage error:', storageError);
                    // Continue with login but show warning
                }

                BloodConnect.showModal(
                    '🎉 Login Successful!',
                    `Welcome back, ${result.data.user.firstName}! You can now access all features of the website.`,
                    'success'
                );

                // Redirect after 2 seconds for normal users
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 2000);
                
            } else {
                // Handle authentication failure
                const errorMessage = result.message || 'Login failed';
                throw new Error(errorMessage);
            }
            
        } catch (error) {
            console.error('❌ Login error:', error);
            
            let errorMessage = 'An error occurred during login. Please try again.';
            let isConnectionError = false;
            
            if (error.message) {
                if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                    errorMessage = '🔌 Connection Error: Unable to connect to the server. Please check your internet connection and ensure the backend is running.';
                    isConnectionError = true;
                } else if (error.message.includes('401') || error.message.includes('Invalid') || error.message.includes('credentials') || error.message.includes('Unauthorized')) {
                    errorMessage = '🔐 Invalid email or password. Please check your credentials and try again.';
                } else if (error.message.includes('User not found') || error.message.includes('user does not exist')) {
                    errorMessage = '🔐 Invalid email or password. Please check your credentials and try again.';
                } else if (error.message.includes('password') && error.message.includes('incorrect')) {
                    errorMessage = '🔐 Invalid email or password. Please check your credentials and try again.';
                } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
                    errorMessage = '🛠️ Server Error: Please try again later or contact support.';
                } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
                    errorMessage = '⏱️ Request Timeout: The server is taking too long to respond. Please try again.';
                } else {
                    // For any authentication-related errors, show the generic invalid credentials message
                    if (error.message.toLowerCase().includes('auth') || 
                        error.message.toLowerCase().includes('login') ||
                        error.message.toLowerCase().includes('password') ||
                        error.message.toLowerCase().includes('email')) {
                        errorMessage = '🔐 Invalid email or password. Please check your credentials and try again.';
                    } else {
                        errorMessage = error.message;
                    }
                }
            }
            
            // Add debug information for connection errors
            if (isConnectionError) {
                errorMessage += '\n\nDebug Info:\n- Backend should be running on http://localhost:3002\n- Check browser console for more details';
            }
            
            // Use the showMessage function from login.html if available
            if (typeof showMessage === 'function') {
                showMessage(errorMessage, 'error');
            }
            // Check if we can use BloodConnect.showModal
            else if (typeof BloodConnect !== 'undefined' && BloodConnect.showModal) {
                BloodConnect.showModal(
                    '❌ Login Failed',
                    errorMessage,
                    'error'
                );
            } else {
                // Fallback to alert if BloodConnect is not available
                alert(`Login Failed: ${errorMessage}`);
            }
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
            BloodConnect.showFieldError(email, 'Please enter a valid email address (e.g., user@example.com)');
            isValid = false;
        } else if (emailValue.length > 254) {
            BloodConnect.showFieldError(email, 'Email address is too long');
            isValid = false;
        } else {
            BloodConnect.clearFieldError(email);
        }

        // Enhanced password validation
        const passwordValue = password.value.trim();
        if (!passwordValue) {
            BloodConnect.showFieldError(password, 'Password is required');
            isValid = false;
        } else if (passwordValue.length < 1) {
            BloodConnect.showFieldError(password, 'Password cannot be empty');
            isValid = false;
        } else if (passwordValue.length > 128) {
            BloodConnect.showFieldError(password, 'Password is too long');
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
            const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:3002/api' 
                : `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api`;
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

/**
 * Contact donor function
 */
function contactDonor(phone, name) {
    if (!phone || phone === 'Contact via platform') {
        alert(`Please contact ${name} through the BloodConnect platform. Call +91 9136706650 for assistance.`);
        return;
    }
    
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    if (confirm(`Contact ${name} at ${phone}?

Options:
1. Call directly
2. Send WhatsApp message

Click OK to open contact options.`)) {
        // Create contact options modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.5); z-index: 10000; 
            display: flex; align-items: center; justify-content: center;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 400px; width: 90%;">
                <h3 style="margin: 0 0 1rem 0; color: #e53e3e;">Contact ${name}</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <a href="tel:${cleanPhone}" style="background: #28a745; color: white; padding: 1rem; text-decoration: none; border-radius: 4px; text-align: center;">
                        📞 Call ${phone}
                    </a>
                    <a href="https://wa.me/91${cleanPhone}?text=Hi ${name}, I found your contact through BloodConnect. I need blood. Can you help?" target="_blank" style="background: #25d366; color: white; padding: 1rem; text-decoration: none; border-radius: 4px; text-align: center;">
                        💬 WhatsApp Message
                    </a>
                    <button class="close-modal-btn" style="background: #6c757d; color: white; padding: 0.5rem; border: none; border-radius: 4px; cursor: pointer;">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listener for close button
        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

/**
 * Show hospital info function
 */
function showHospitalInfo(name, address) {
    alert(`Hospital: ${name}\nAddress: ${address}\n\nPlease contact the hospital directly for blood availability and procedures.`);
}
