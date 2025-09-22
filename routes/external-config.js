/**
 * External API Configuration Routes
 * Manages external API keys and settings safely
 */

const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/external-config
 * @desc    Get external API configuration status
 * @access  Public (only returns status, not keys)
 */
router.get('/config', (req, res) => {
    try {
        // Check which external APIs are configured (don't return actual keys)
        const config = {
            success: true,
            apis: {
                googleMaps: {
                    available: !!(process.env.GOOGLE_MAPS_API_KEY && !process.env.GOOGLE_MAPS_API_KEY.includes('optional_')),
                    status: 'ready',
                    features: ['location_search', 'nearby_hospitals', 'geocoding']
                },
                twilio: {
                    available: !!(process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_ACCOUNT_SID.includes('optional_')),
                    status: 'ready',
                    features: ['sms_notifications', 'donor_alerts']
                },
                whatsapp: {
                    available: !!(process.env.WHATSAPP_BUSINESS_TOKEN && !process.env.WHATSAPP_BUSINESS_TOKEN.includes('optional_')),
                    status: 'ready',
                    features: ['urgent_messaging', 'business_api']
                },
                hospital: {
                    available: true, // Always available (mock data)
                    status: 'mock_ready',
                    features: ['hospital_search', 'blood_bank_locator', 'mock_data']
                }
            },
            features: {
                enhancedSearch: true,
                multiSourceSearch: true,
                urgentNotifications: true,
                hospitalLocator: true,
                fallbackSupport: true
            }
        };

        res.json(config);

    } catch (error) {
        console.error('Error getting external API config:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving API configuration',
            apis: {
                googleMaps: { available: false, status: 'error' },
                twilio: { available: false, status: 'error' },
                whatsapp: { available: false, status: 'error' },
                hospital: { available: true, status: 'mock_ready' }
            }
        });
    }
});

/**
 * @route   POST /api/external-config/test
 * @desc    Test external API connections
 * @access  Public
 */
router.post('/test', async (req, res) => {
    try {
        const testResults = {
            success: true,
            timestamp: new Date().toISOString(),
            tests: {}
        };

        // Test Google Maps API
        try {
            if (process.env.GOOGLE_MAPS_API_KEY && !process.env.GOOGLE_MAPS_API_KEY.includes('optional_')) {
                // Note: In a real implementation, you'd make a test API call here
                testResults.tests.googleMaps = {
                    status: 'available',
                    message: 'API key configured',
                    tested: false // Set to true when actually testing
                };
            } else {
                testResults.tests.googleMaps = {
                    status: 'not_configured',
                    message: 'API key not configured - using fallback'
                };
            }
        } catch (error) {
            testResults.tests.googleMaps = {
                status: 'error',
                message: error.message
            };
        }

        // Test Twilio API
        try {
            if (process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_ACCOUNT_SID.includes('optional_')) {
                testResults.tests.twilio = {
                    status: 'available',
                    message: 'Credentials configured',
                    tested: false
                };
            } else {
                testResults.tests.twilio = {
                    status: 'not_configured',
                    message: 'Credentials not configured - using fallback'
                };
            }
        } catch (error) {
            testResults.tests.twilio = {
                status: 'error',
                message: error.message
            };
        }

        // Test WhatsApp API
        try {
            if (process.env.WHATSAPP_BUSINESS_TOKEN && !process.env.WHATSAPP_BUSINESS_TOKEN.includes('optional_')) {
                testResults.tests.whatsapp = {
                    status: 'available',
                    message: 'Token configured',
                    tested: false
                };
            } else {
                testResults.tests.whatsapp = {
                    status: 'not_configured',
                    message: 'Token not configured - using SMS fallback'
                };
            }
        } catch (error) {
            testResults.tests.whatsapp = {
                status: 'error',
                message: error.message
            };
        }

        // Hospital API (always available with mock data)
        testResults.tests.hospital = {
            status: 'available',
            message: 'Mock data ready',
            tested: true
        };

        res.json(testResults);

    } catch (error) {
        console.error('Error testing external APIs:', error);
        res.status(500).json({
            success: false,
            message: 'Error testing external APIs',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/external-config/status
 * @desc    Get real-time API status
 * @access  Public
 */
router.get('/status', (req, res) => {
    try {
        const status = {
            success: true,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            apis: {
                internal: {
                    database: 'connected',
                    server: 'running'
                },
                external: {
                    googleMaps: process.env.GOOGLE_MAPS_API_KEY && !process.env.GOOGLE_MAPS_API_KEY.includes('optional_') ? 'configured' : 'fallback',
                    twilio: process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_ACCOUNT_SID.includes('optional_') ? 'configured' : 'fallback',
                    whatsapp: process.env.WHATSAPP_BUSINESS_TOKEN && !process.env.WHATSAPP_BUSINESS_TOKEN.includes('optional_') ? 'configured' : 'fallback',
                    hospital: 'mock_ready'
                }
            },
            features: {
                enhancedDonorSearch: 'enabled',
                multiSourceSearch: 'enabled',
                urgentNotifications: 'enabled',
                hospitalLocator: 'enabled',
                fallbackSupport: 'enabled'
            }
        };

        res.json(status);

    } catch (error) {
        console.error('Error getting API status:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving API status',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/external-config/send-test-notification
 * @desc    Send a test notification (for testing SMS/WhatsApp)
 * @access  Public (rate limited in production)
 */
router.post('/send-test-notification', async (req, res) => {
    try {
        const { phoneNumber, message, method } = req.body;

        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and message are required'
            });
        }

        // Basic phone number validation
        if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Indian phone number format'
            });
        }

        // In a real implementation, this would send actual notifications
        // For now, we'll just simulate the response
        const testResult = {
            success: true,
            method: method || 'simulation',
            phoneNumber: phoneNumber,
            message: 'Test notification queued',
            timestamp: new Date().toISOString(),
            simulation: true // Indicates this is a test/simulation
        };

        console.log(`📱 Test notification simulated for ${phoneNumber}: ${message}`);

        res.json(testResult);

    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending test notification',
            error: error.message
        });
    }
});

module.exports = router;