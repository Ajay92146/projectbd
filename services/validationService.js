/**
 * Validation Service - Backend Implementation
 * Validates donor contact information including phone numbers and email addresses
 */

const axios = require('axios');

class ValidationService {
    constructor() {
        this.phoneValidationAPI = process.env.PHONE_VALIDATION_API_KEY;
        this.emailValidationAPI = process.env.EMAIL_VALIDATION_API_KEY;
        
        // Validation cache to reduce API calls
        this.validationCache = new Map();
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
        
        // Rate limiting
        this.lastPhoneValidation = 0;
        this.lastEmailValidation = 0;
        this.rateLimitDelay = 1000; // 1 second between API calls
        
        console.log('✅ Validation Service initialized');
    }
    
    /**
     * Validate phone number using NumVerify API
     */
    async validatePhoneNumber(phoneNumber, countryCode = 'IN') {
        try {
            // Normalize phone number
            const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
            const cacheKey = `phone_${normalizedPhone}_${countryCode}`;
            
            // Check cache first
            const cachedResult = this.getCachedResult(cacheKey);
            if (cachedResult) {
                console.log(`📞 Using cached phone validation for ${normalizedPhone}`);
                return cachedResult;
            }
            
            // Rate limiting
            await this.enforceRateLimit('phone');
            
            if (!this.phoneValidationAPI) {
                console.warn('⚠️ Phone validation API key not configured');
                return this.getFallbackPhoneValidation(normalizedPhone, countryCode);
            }
            
            console.log(`📞 Validating phone number: ${normalizedPhone}`);
            
            const response = await axios.get('https://api.numverify.com/v1/validate', {
                params: {
                    access_key: this.phoneValidationAPI,
                    number: normalizedPhone,
                    country_code: countryCode,
                    format: 1
                },
                timeout: 10000
            });
            
            if (response.data && response.data.valid !== undefined) {
                const result = {
                    success: true,
                    data: {
                        isValid: response.data.valid,
                        number: response.data.number,
                        localFormat: response.data.local_format,
                        internationalFormat: response.data.international_format,
                        countryCode: response.data.country_code,
                        countryName: response.data.country_name,
                        location: response.data.location,
                        carrier: response.data.carrier,
                        lineType: response.data.line_type
                    },
                    validatedAt: new Date().toISOString()
                };
                
                // Cache the result
                this.setCachedResult(cacheKey, result);
                
                console.log(`✅ Phone validation complete: ${normalizedPhone} - ${result.data.isValid ? 'Valid' : 'Invalid'}`);
                return result;
            } else {
                throw new Error('Invalid response from validation service');
            }
            
        } catch (error) {
            console.error('❌ Phone validation error:', error.message);
            
            // Return fallback validation
            return this.getFallbackPhoneValidation(phoneNumber, countryCode);
        }
    }
    
    /**
     * Validate email address using ZeroBounce API
     */
    async validateEmail(email) {
        try {
            // Normalize email
            const normalizedEmail = email.toLowerCase().trim();
            const cacheKey = `email_${normalizedEmail}`;
            
            // Check cache first
            const cachedResult = this.getCachedResult(cacheKey);
            if (cachedResult) {
                console.log(`📧 Using cached email validation for ${normalizedEmail}`);
                return cachedResult;
            }
            
            // Rate limiting
            await this.enforceRateLimit('email');
            
            if (!this.emailValidationAPI) {
                console.warn('⚠️ Email validation API key not configured');
                return this.getFallbackEmailValidation(normalizedEmail);
            }
            
            console.log(`📧 Validating email: ${normalizedEmail}`);
            
            const response = await axios.get('https://api.zerobounce.net/v2/validate', {
                params: {
                    api_key: this.emailValidationAPI,
                    email: normalizedEmail,
                    ip_address: '' // Optional IP address
                },
                timeout: 10000
            });
            
            if (response.data && response.data.status) {
                const isValid = ['valid', 'catch-all'].includes(response.data.status);
                
                const result = {
                    success: true,
                    data: {
                        isValid: isValid,
                        email: response.data.address,
                        status: response.data.status,
                        subStatus: response.data.sub_status,
                        account: response.data.account,
                        domain: response.data.domain,
                        didYouMean: response.data.did_you_mean,
                        domainAge: response.data.domain_age_days,
                        freeEmail: response.data.free_email,
                        mxFound: response.data.mx_found,
                        mxRecord: response.data.mx_record,
                        smtpProvider: response.data.smtp_provider
                    },
                    validatedAt: new Date().toISOString()
                };
                
                // Cache the result
                this.setCachedResult(cacheKey, result);
                
                console.log(`✅ Email validation complete: ${normalizedEmail} - ${result.data.status}`);
                return result;
            } else {
                throw new Error('Invalid response from email validation service');
            }
            
        } catch (error) {
            console.error('❌ Email validation error:', error.message);
            
            // Return fallback validation
            return this.getFallbackEmailValidation(email);
        }
    }
    
    /**
     * Validate both phone and email for a contact
     */
    async validateContact(contactData) {
        try {
            const { phone, email, countryCode } = contactData;
            const results = {};
            
            console.log('👤 Validating complete contact information...');
            
            // Validate phone if provided
            if (phone) {
                results.phone = await this.validatePhoneNumber(phone, countryCode);
            }
            
            // Validate email if provided
            if (email) {
                results.email = await this.validateEmail(email);
            }
            
            // Overall validation status
            const overallValid = (!phone || results.phone?.data?.isValid) && 
                               (!email || results.email?.data?.isValid);
            
            return {
                success: true,
                data: {
                    isValid: overallValid,
                    phone: results.phone?.data || null,
                    email: results.email?.data || null,
                    validatedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('❌ Contact validation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Bulk validate multiple contacts
     */
    async validateBulkContacts(contacts, batchSize = 5) {
        try {
            console.log(`📋 Bulk validating ${contacts.length} contacts...`);
            
            const results = [];
            
            // Process in batches to respect rate limits
            for (let i = 0; i < contacts.length; i += batchSize) {
                const batch = contacts.slice(i, i + batchSize);
                
                console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(contacts.length/batchSize)}`);
                
                const batchPromises = batch.map(async (contact, index) => {
                    try {
                        const result = await this.validateContact(contact);
                        return {
                            index: i + index,
                            contact: contact,
                            validation: result,
                            processed: true
                        };
                    } catch (error) {
                        return {
                            index: i + index,
                            contact: contact,
                            validation: { success: false, error: error.message },
                            processed: false
                        };
                    }
                });
                
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
                
                // Delay between batches to respect rate limits
                if (i + batchSize < contacts.length) {
                    await this.delay(2000);
                }
            }
            
            const validCount = results.filter(r => r.validation.success && r.validation.data?.isValid).length;
            const invalidCount = results.filter(r => r.validation.success && !r.validation.data?.isValid).length;
            const errorCount = results.filter(r => !r.validation.success).length;
            
            console.log(`✅ Bulk validation complete: ${validCount} valid, ${invalidCount} invalid, ${errorCount} errors`);
            
            return {
                success: true,
                data: {
                    results: results,
                    summary: {
                        total: contacts.length,
                        valid: validCount,
                        invalid: invalidCount,
                        errors: errorCount,
                        processed: results.length
                    },
                    completedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('❌ Bulk validation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Normalize phone number for consistent formatting
     */
    normalizePhoneNumber(phoneNumber) {
        if (!phoneNumber) return '';
        
        // Remove all non-numeric characters except +
        let normalized = phoneNumber.toString().replace(/[^\d+]/g, '');
        
        // Handle Indian phone numbers
        if (normalized.startsWith('91') && normalized.length === 12) {
            normalized = '+' + normalized;
        } else if (normalized.startsWith('0') && normalized.length === 11) {
            normalized = '+91' + normalized.substring(1);
        } else if (normalized.length === 10) {
            normalized = '+91' + normalized;
        } else if (!normalized.startsWith('+')) {
            normalized = '+' + normalized;
        }
        
        return normalized;
    }
    
    /**
     * Get fallback phone validation (basic format checking)
     */
    getFallbackPhoneValidation(phoneNumber, countryCode) {
        const normalized = this.normalizePhoneNumber(phoneNumber);
        
        // Basic validation rules
        let isValid = false;
        
        if (countryCode === 'IN') {
            // Indian phone number validation
            isValid = /^\+91[6-9]\d{9}$/.test(normalized);
        } else {
            // General international format
            isValid = /^\+\d{10,15}$/.test(normalized);
        }
        
        return {
            success: true,
            data: {
                isValid: isValid,
                number: normalized,
                localFormat: phoneNumber,
                internationalFormat: normalized,
                countryCode: countryCode,
                countryName: countryCode === 'IN' ? 'India' : 'Unknown',
                location: 'Unknown',
                carrier: 'Unknown',
                lineType: 'mobile',
                note: 'Fallback validation - API not available'
            },
            validatedAt: new Date().toISOString()
        };
    }
    
    /**
     * Get fallback email validation (basic format checking)
     */
    getFallbackEmailValidation(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        
        const domain = email.split('@')[1] || '';
        const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
        
        return {
            success: true,
            data: {
                isValid: isValid,
                email: email.toLowerCase(),
                status: isValid ? 'valid' : 'invalid',
                subStatus: isValid ? 'fallback_validation' : 'invalid_format',
                account: email.split('@')[0] || '',
                domain: domain,
                didYouMean: '',
                domainAge: null,
                freeEmail: freeEmailDomains.includes(domain.toLowerCase()),
                mxFound: isValid,
                mxRecord: domain,
                smtpProvider: domain,
                note: 'Fallback validation - API not available'
            },
            validatedAt: new Date().toISOString()
        };
    }
    
    /**
     * Enforce rate limiting
     */
    async enforceRateLimit(type) {
        const now = Date.now();
        const lastCall = type === 'phone' ? this.lastPhoneValidation : this.lastEmailValidation;
        
        const timeSinceLastCall = now - lastCall;
        if (timeSinceLastCall < this.rateLimitDelay) {
            const waitTime = this.rateLimitDelay - timeSinceLastCall;
            console.log(`⏱️ Rate limiting: waiting ${waitTime}ms before ${type} validation`);
            await this.delay(waitTime);
        }
        
        if (type === 'phone') {
            this.lastPhoneValidation = Date.now();
        } else {
            this.lastEmailValidation = Date.now();
        }
    }
    
    /**
     * Cache validation results
     */
    setCachedResult(key, result) {
        this.validationCache.set(key, {
            result: result,
            timestamp: Date.now()
        });
        
        // Clean up old cache entries periodically
        if (this.validationCache.size > 1000) {
            this.cleanupCache();
        }
    }
    
    /**
     * Get cached validation result
     */
    getCachedResult(key) {
        const cached = this.validationCache.get(key);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
            return cached.result;
        }
        
        // Remove expired cache entry
        if (cached) {
            this.validationCache.delete(key);
        }
        
        return null;
    }
    
    /**
     * Clean up expired cache entries
     */
    cleanupCache() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [key, cached] of this.validationCache.entries()) {
            if ((now - cached.timestamp) >= this.cacheExpiry) {
                this.validationCache.delete(key);
                cleanedCount++;
            }
        }
        
        console.log(`🧹 Cleaned ${cleanedCount} expired cache entries`);
    }
    
    /**
     * Get validation statistics
     */
    getValidationStats() {
        return {
            cacheSize: this.validationCache.size,
            cacheExpiry: this.cacheExpiry,
            rateLimitDelay: this.rateLimitDelay,
            hasPhoneAPI: !!this.phoneValidationAPI,
            hasEmailAPI: !!this.emailValidationAPI
        };
    }
    
    /**
     * Test validation service connectivity
     */
    async testConnection() {
        try {
            console.log('🧪 Testing validation service connectivity...');
            
            const testResults = {
                phone: { success: false, error: 'Not tested' },
                email: { success: false, error: 'Not tested' }
            };
            
            // Test phone validation with a known valid number
            try {
                const phoneResult = await this.validatePhoneNumber('+919876543210', 'IN');
                testResults.phone = {
                    success: phoneResult.success,
                    apiAvailable: !!this.phoneValidationAPI,
                    result: phoneResult.data?.isValid ? 'Valid test number' : 'Invalid test number'
                };
            } catch (error) {
                testResults.phone = { success: false, error: error.message };
            }
            
            // Test email validation with a known format
            try {
                const emailResult = await this.validateEmail('test@example.com');
                testResults.email = {
                    success: emailResult.success,
                    apiAvailable: !!this.emailValidationAPI,
                    result: emailResult.data?.status || 'Unknown status'
                };
            } catch (error) {
                testResults.email = { success: false, error: error.message };
            }
            
            return {
                success: true,
                data: {
                    service: 'Validation Service',
                    tests: testResults,
                    stats: this.getValidationStats(),
                    timestamp: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('❌ Validation service test failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Delay utility function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = ValidationService;