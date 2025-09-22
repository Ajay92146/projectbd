/**
 * Emergency Notification API Routes
 * Handles weather alerts, emergency broadcasting, and push notifications
 */

const express = require('express');
const router = express.Router();
const WeatherService = require('../services/weatherService');
const EmergencyBroadcastService = require('../services/emergencyBroadcastService');

// Initialize services
const weatherService = new WeatherService();
let broadcastService = null;

// Start broadcast service
function initializeBroadcastService() {
    if (!broadcastService) {
        broadcastService = new EmergencyBroadcastService(
            process.env.WEBSOCKET_PORT || 8080
        );
        
        const started = broadcastService.start();
        if (started) {
            console.log('✅ Emergency Broadcast Service started');
        } else {
            console.error('❌ Failed to start Emergency Broadcast Service');
        }
    }
    return broadcastService;
}

// Initialize on module load
initializeBroadcastService();

/**
 * @route   POST /api/emergency/weather-alerts
 * @desc    Check weather alerts for specified locations
 * @access  Public
 */
router.post('/weather-alerts', async (req, res) => {
    try {
        const { locations } = req.body;

        if (!locations || !Array.isArray(locations)) {
            return res.status(400).json({
                success: false,
                error: 'Locations array is required'
            });
        }

        console.log(`🌤️ Checking weather alerts for ${locations.length} locations`);

        const result = await weatherService.checkWeatherAlerts(locations);

        if (result.success && result.data.alerts.length > 0) {
            console.log(`⚠️ Found ${result.data.alerts.length} weather alerts`);
            
            // Broadcast weather alerts
            if (broadcastService) {
                result.data.alerts.forEach(alert => {
                    broadcastService.broadcastWeatherWarning(alert);
                });
            }
        }

        res.json(result);

    } catch (error) {
        console.error('❌ Weather alerts error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check weather alerts',
            message: error.message
        });
    }
});

/**
 * @route   GET /api/emergency/weather/:lat/:lng
 * @desc    Get current weather for specific coordinates
 * @access  Public
 */
router.get('/weather/:lat/:lng', async (req, res) => {
    try {
        const { lat, lng } = req.params;
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid coordinates provided'
            });
        }

        const location = { lat: latitude, lng: longitude, name: 'Requested Location' };
        const weather = await weatherService.getWeatherData(location);

        res.json({
            success: true,
            data: {
                weather: weather,
                isCritical: weatherService.isCriticalWeather(weather),
                location: location
            }
        });

    } catch (error) {
        console.error('❌ Weather data error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get weather data',
            message: error.message
        });
    }
});

/**
 * @route   POST /api/emergency/broadcast
 * @desc    Broadcast emergency alert to all connected clients
 * @access  Public
 */
router.post('/broadcast', async (req, res) => {
    try {
        const emergencyData = req.body;

        if (!emergencyData || !emergencyData.patientName || !emergencyData.bloodGroup) {
            return res.status(400).json({
                success: false,
                error: 'Emergency data with patientName and bloodGroup is required'
            });
        }

        console.log(`🚨 Broadcasting emergency: ${emergencyData.patientName} needs ${emergencyData.bloodGroup}`);

        if (broadcastService) {
            broadcastService.broadcastEmergency(emergencyData);
            
            const status = broadcastService.getStatus();
            
            res.json({
                success: true,
                data: {
                    message: 'Emergency alert broadcasted successfully',
                    clientsNotified: status.connectedClients,
                    emergencyData: emergencyData,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            res.status(503).json({
                success: false,
                error: 'Broadcast service not available'
            });
        }

    } catch (error) {
        console.error('❌ Emergency broadcast error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to broadcast emergency',
            message: error.message
        });
    }
});

/**
 * @route   POST /api/emergency/targeted-notification
 * @desc    Send targeted notifications based on criteria
 * @access  Public
 */
router.post('/targeted-notification', async (req, res) => {
    try {
        const { criteria, message } = req.body;

        if (!criteria || !message) {
            return res.status(400).json({
                success: false,
                error: 'Criteria and message are required'
            });
        }

        console.log(`🎯 Sending targeted notification for criteria:`, criteria);

        if (broadcastService) {
            const notifiedCount = broadcastService.sendTargetedNotifications(criteria, message);
            const status = broadcastService.getStatus();
            
            res.json({
                success: true,
                data: {
                    message: 'Targeted notification sent successfully',
                    clientsNotified: notifiedCount,
                    totalClients: status.connectedClients,
                    criteria: criteria,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            res.status(503).json({
                success: false,
                error: 'Broadcast service not available'
            });
        }

    } catch (error) {
        console.error('❌ Targeted notification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send targeted notification',
            message: error.message
        });
    }
});

/**
 * @route   GET /api/emergency/broadcast-status
 * @desc    Get emergency broadcast service status
 * @access  Public
 */
router.get('/broadcast-status', (req, res) => {
    try {
        if (broadcastService) {
            const status = broadcastService.getStatus();
            const clients = broadcastService.getClientInfo();
            
            res.json({
                success: true,
                data: {
                    ...status,
                    clients: clients,
                    serviceHealth: 'operational'
                }
            });
        } else {
            res.json({
                success: false,
                data: {
                    isRunning: false,
                    connectedClients: 0,
                    serviceHealth: 'unavailable'
                }
            });
        }

    } catch (error) {
        console.error('❌ Broadcast status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get broadcast status',
            message: error.message
        });
    }
});

/**
 * @route   POST /api/emergency/test-notification
 * @desc    Send test notification for development/testing
 * @access  Public
 */
router.post('/test-notification', async (req, res) => {
    try {
        const { type, testData } = req.body;
        
        const testTypes = ['emergency', 'weather', 'urgent'];
        if (!type || !testTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: `Type must be one of: ${testTypes.join(', ')}`
            });
        }

        console.log(`🧪 Sending test ${type} notification`);

        if (!broadcastService) {
            return res.status(503).json({
                success: false,
                error: 'Broadcast service not available'
            });
        }

        let testMessage;
        
        switch (type) {
            case 'emergency':
                testMessage = {
                    patientName: 'Test Patient',
                    bloodGroup: 'O+',
                    requiredUnits: 2,
                    urgency: 'Critical',
                    hospitalName: 'Test Hospital',
                    location: 'Test City',
                    hospitalPhone: '+91-9999999999',
                    hoursLeft: 6,
                    additionalNotes: 'This is a test emergency alert',
                    ...testData
                };
                broadcastService.broadcastEmergency(testMessage);
                break;
                
            case 'weather':
                testMessage = {
                    location: { name: 'Test City', lat: 19.0760, lng: 72.8777 },
                    weather: { description: 'heavy rain', type: 'Rain' },
                    severity: 'HIGH',
                    message: 'Test weather alert: Heavy rain may affect blood drives',
                    ...testData
                };
                broadcastService.broadcastWeatherWarning(testMessage);
                break;
                
            case 'urgent':
                testMessage = {
                    message: 'Test urgent request: Blood donor needed in your area',
                    bloodType: 'A+',
                    location: { name: 'Test Area', lat: 19.0760, lng: 72.8777 },
                    ...testData
                };
                broadcastService.sendTargetedNotifications(
                    { bloodType: 'A+', radius: 10 },
                    testMessage
                );
                break;
        }

        const status = broadcastService.getStatus();
        
        res.json({
            success: true,
            data: {
                message: `Test ${type} notification sent successfully`,
                clientsNotified: status.connectedClients,
                testData: testMessage,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Test notification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send test notification',
            message: error.message
        });
    }
});

/**
 * @route   GET /api/emergency/test
 * @desc    Test emergency notification services
 * @access  Public
 */
router.get('/test', async (req, res) => {
    try {
        console.log('🧪 Testing emergency notification services...');

        // Test weather service
        const weatherTest = await weatherService.testConnection();
        
        // Test broadcast service
        const broadcastTest = broadcastService ? {
            success: true,
            data: {
                service: 'Emergency Broadcast Service',
                status: broadcastService.getStatus(),
                clientCount: broadcastService.getStatus().connectedClients
            }
        } : {
            success: false,
            error: 'Broadcast service not available'
        };

        const overallStatus = {
            success: true,
            services: {
                weather: weatherTest,
                broadcast: broadcastTest
            },
            timestamp: new Date().toISOString()
        };

        console.log('✅ Emergency services test completed');

        res.json(overallStatus);

    } catch (error) {
        console.error('❌ Emergency services test failed:', error);
        res.status(500).json({
            success: false,
            error: 'Emergency services test failed',
            message: error.message
        });
    }
});

/**
 * Graceful shutdown handler
 */
process.on('SIGTERM', () => {
    console.log('📡 Shutting down emergency broadcast service...');
    if (broadcastService) {
        broadcastService.stop();
    }
});

process.on('SIGINT', () => {
    console.log('📡 Shutting down emergency broadcast service...');
    if (broadcastService) {
        broadcastService.stop();
    }
    process.exit(0);
});

module.exports = router;