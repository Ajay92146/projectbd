/**
 * Validation Utilities
 * Common validation functions and helpers
 */

/**
 * Validate Indian mobile number
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidIndianMobile = (phoneNumber) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(phoneNumber);
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidEmail = (email) => {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
};

/**
 * Validate blood group
 * @param {string} bloodGroup - Blood group to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidBloodGroup = (bloodGroup) => {
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    return validBloodGroups.includes(bloodGroup);
};

/**
 * Validate age for blood donation
 * @param {number} age - Age to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidDonorAge = (age) => {
    return age >= 18 && age <= 65;
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid and errors
 */
const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    
    if (password.length > 128) {
        errors.push('Password cannot exceed 128 characters');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    // Optional: Check for special characters
    // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    //     errors.push('Password must contain at least one special character');
    // }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validate date is not in the past
 * @param {Date|string} date - Date to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isNotPastDate = (date) => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    return inputDate >= today;
};

/**
 * Validate date is not too far in the future
 * @param {Date|string} date - Date to validate
 * @param {number} maxDaysInFuture - Maximum days in future (default: 365)
 * @returns {boolean} - True if valid, false otherwise
 */
const isNotTooFarInFuture = (date, maxDaysInFuture = 365) => {
    const inputDate = new Date(date);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + maxDaysInFuture);
    
    return inputDate <= maxDate;
};

/**
 * Sanitize string input
 * @param {string} input - String to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input) => {
    if (typeof input !== 'string') {
        return '';
    }
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/\s+/g, ' '); // Replace multiple spaces with single space
};

/**
 * Validate required units for blood request
 * @param {number} units - Number of units
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidBloodUnits = (units) => {
    return Number.isInteger(units) && units >= 1 && units <= 10;
};

/**
 * Validate urgency level
 * @param {string} urgency - Urgency level
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidUrgency = (urgency) => {
    const validUrgencyLevels = ['Low', 'Medium', 'High', 'Critical'];
    return validUrgencyLevels.includes(urgency);
};

/**
 * Validate gender
 * @param {string} gender - Gender to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidGender = (gender) => {
    const validGenders = ['Male', 'Female', 'Other'];
    return validGenders.includes(gender);
};

/**
 * Validate user role
 * @param {string} role - Role to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidUserRole = (role) => {
    const validRoles = ['user', 'donor', 'admin', 'hospital'];
    return validRoles.includes(role);
};

/**
 * Validate relationship type
 * @param {string} relationship - Relationship to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidRelationship = (relationship) => {
    const validRelationships = ['Self', 'Family', 'Friend', 'Doctor', 'Hospital Staff', 'Other'];
    return validRelationships.includes(relationship);
};

/**
 * Check if donor is eligible for donation based on last donation date
 * @param {Date} lastDonationDate - Last donation date
 * @returns {boolean} - True if eligible, false otherwise
 */
const isDonorEligible = (lastDonationDate) => {
    if (!lastDonationDate) {
        return true; // First time donor
    }
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    return new Date(lastDonationDate) <= threeMonthsAgo;
};

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} - Validation result with isValid and sanitized values
 */
const validatePagination = (page, limit) => {
    const sanitizedPage = Math.max(1, parseInt(page) || 1);
    const sanitizedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
    
    return {
        isValid: true,
        page: sanitizedPage,
        limit: sanitizedLimit
    };
};

/**
 * Validate search query
 * @param {string} query - Search query
 * @returns {Object} - Validation result
 */
const validateSearchQuery = (query) => {
    if (!query || typeof query !== 'string') {
        return {
            isValid: false,
            error: 'Search query is required'
        };
    }
    
    const sanitizedQuery = sanitizeString(query);
    
    if (sanitizedQuery.length < 2) {
        return {
            isValid: false,
            error: 'Search query must be at least 2 characters long'
        };
    }
    
    if (sanitizedQuery.length > 100) {
        return {
            isValid: false,
            error: 'Search query cannot exceed 100 characters'
        };
    }
    
    return {
        isValid: true,
        query: sanitizedQuery
    };
};

module.exports = {
    isValidIndianMobile,
    isValidEmail,
    isValidBloodGroup,
    isValidDonorAge,
    validatePassword,
    isNotPastDate,
    isNotTooFarInFuture,
    sanitizeString,
    isValidBloodUnits,
    isValidUrgency,
    isValidGender,
    isValidUserRole,
    isValidRelationship,
    isDonorEligible,
    validatePagination,
    validateSearchQuery
};
