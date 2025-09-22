/**
 * Location API Routes
 * Handles location-based services including nearby blood banks and route optimization
 */

const express = require('express');
const router = express.Router();
const LocationService = require('../services/locationService');

// Initialize location service
const locationService = new LocationService();

/**
 * @route   POST /api/location/nearby-blood-banks
 * @desc    Find nearby blood banks and hospitals
 * @access  Public
 */
router.post('/nearby-blood-banks', async (req, res) => {
    try {
        const { latitude, longitude, radius, keyword } = req.body;

        // Validate required parameters
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required'
            });
        }

        // Validate coordinates
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                success: false,
                error: 'Invalid coordinates provided'
            });
        }

        console.log(`🗺️ Finding blood banks near ${latitude}, ${longitude} within ${radius || 50}km`);

        const result = await locationService.findNearbyBloodBanks(
            latitude,
            longitude,
            radius,
            keyword
        );

        if (result.success) {
            console.log(`✅ Found ${result.data.totalFound} blood banks`);
        } else {
            console.error('❌ Error finding blood banks:', result.error);
        }

        res.json(result);

    } catch (error) {
        console.error('❌ Location API error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * @route   POST /api/location/calculate-distance
 * @desc    Calculate distance between two points
 * @access  Public
 */
router.post('/calculate-distance', async (req, res) => {
    try {
        const { origin, destination } = req.body;

        if (!origin || !destination || !origin.lat || !origin.lng || !destination.lat || !destination.lng) {
            return res.status(400).json({
                success: false,
                error: 'Origin and destination coordinates are required'
            });
        }

        console.log(`📏 Calculating distance from ${origin.lat},${origin.lng} to ${destination.lat},${destination.lng}`);

        const distance = await locationService.calculateDistance(origin, destination);

        res.json({
            success: true,
            data: distance
        });

    } catch (error) {
        console.error('❌ Distance calculation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate distance',
            message: error.message
        });
    }
});

/**
 * @route   POST /api/location/optimize-route
 * @desc    Optimize delivery route for multiple stops
 * @access  Public
 */
router.post('/optimize-route', async (req, res) => {
    try {
        const { startPoint, deliveryPoints, returnToStart } = req.body;

        if (!startPoint || !deliveryPoints || !Array.isArray(deliveryPoints)) {
            return res.status(400).json({
                success: false,
                error: 'Start point and delivery points array are required'
            });
        }

        if (deliveryPoints.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'At least one delivery point is required'
            });
        }

        console.log(`🚚 Optimizing route for ${deliveryPoints.length} delivery points`);

        const result = await locationService.optimizeDeliveryRoute(
            startPoint,
            deliveryPoints,
            returnToStart
        );

        if (result.success) {
            console.log(`✅ Route optimized - Total distance: ${result.data.totalDistance}m`);
        }

        res.json(result);

    } catch (error) {
        console.error('❌ Route optimization error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to optimize route',
            message: error.message
        });
    }
});

/**
 * @route   POST /api/location/geocode
 * @desc    Convert address to coordinates
 * @access  Public
 */
router.post('/geocode', async (req, res) => {
    try {
        const { address } = req.body;

        if (!address) {
            return res.status(400).json({
                success: false,
                error: 'Address is required'
            });
        }

        console.log(`🌍 Geocoding address: ${address}`);

        const result = await locationService.geocodeAddress(address);

        res.json(result);

    } catch (error) {
        console.error('❌ Geocoding error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to geocode address',
            message: error.message
        });
    }
});

/**
 * @route   POST /api/location/reverse-geocode
 * @desc    Convert coordinates to address
 * @access  Public
 */
router.post('/reverse-geocode', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required'
            });
        }

        console.log(`🌍 Reverse geocoding: ${latitude}, ${longitude}`);

        const result = await locationService.reverseGeocode(latitude, longitude);

        res.json(result);

    } catch (error) {
        console.error('❌ Reverse geocoding error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reverse geocode coordinates',
            message: error.message
        });
    }
});

/**
 * @route   GET /api/location/test
 * @desc    Test location service connectivity
 * @access  Public
 */
router.get('/test', async (req, res) => {
    try {
        console.log('🧪 Testing location service...');

        // Test with Mumbai coordinates
        const testResult = await locationService.findNearbyBloodBanks(19.0760, 72.8777, 10, 'hospital');

        const status = {
            success: true,
            service: 'Location Service',
            timestamp: new Date().toISOString(),
            googleMapsAPI: !!process.env.GOOGLE_MAPS_API_KEY,
            testResult: {
                success: testResult.success,
                bloodBanksFound: testResult.data?.totalFound || 0
            }
        };

        console.log('✅ Location service test completed:', status);

        res.json(status);

    } catch (error) {
        console.error('❌ Location service test failed:', error);
        res.status(500).json({
            success: false,
            error: 'Location service test failed',
            message: error.message
        });
    }
});

module.exports = router;