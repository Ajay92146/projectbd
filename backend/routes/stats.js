/**
 * Statistics API Routes
 * Provides homepage and dashboard statistics
 */

const express = require('express');
const router = express.Router();

// Import models
const User = require('../models/User');
const Donor = require('../models/Donor');
const Request = require('../models/Request');

/**
 * @route   GET /api/stats/homepage
 * @desc    Get homepage statistics
 * @access  Public
 */
router.get('/homepage', async (req, res) => {
    try {
        console.log('📊 Fetching homepage statistics...');

        // Get total active donors
        const activeDonors = await Donor.countDocuments({ 
            isActive: { $ne: false },
            applicationStatus: { $in: ['Approved', 'Pending'] }
        });

        // Get total blood requests (as a proxy for lives potentially saved)
        const totalRequests = await Request.countDocuments({ 
            isActive: { $ne: false }
        });

        // Get unique cities from donors
        const citiesWithDonors = await Donor.distinct('city', { 
            isActive: { $ne: false },
            city: { $exists: true, $ne: null, $ne: '' }
        });

        // Get unique cities from requests
        const citiesWithRequests = await Request.distinct('location', { 
            isActive: { $ne: false },
            location: { $exists: true, $ne: null, $ne: '' }
        });

        // Combine and get unique cities
        const allCities = [...new Set([...citiesWithDonors, ...citiesWithRequests])];
        const citiesCovered = allCities.length;

        // Calculate lives saved (requests that are fulfilled or partially fulfilled)
        const livesSaved = await Request.countDocuments({
            isActive: { $ne: false },
            status: { $in: ['Fulfilled', 'Partially Fulfilled'] }
        });

        const stats = {
            livesSaved: livesSaved,
            activeDonors: activeDonors,
            citiesCovered: citiesCovered,
            totalRequests: totalRequests,
            totalUsers: await User.countDocuments({ isActive: true })
        };

        console.log('📊 Homepage statistics:', stats);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('❌ Error fetching homepage statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   GET /api/stats/dashboard
 * @desc    Get dashboard statistics (for admin)
 * @access  Private (Admin only)
 */
router.get('/dashboard', async (req, res) => {
    try {
        console.log('📊 Fetching dashboard statistics...');

        // Get various statistics
        const stats = {
            totalUsers: await User.countDocuments({ isActive: true }),
            totalDonors: await Donor.countDocuments({ isActive: { $ne: false } }),
            totalRequests: await Request.countDocuments({ isActive: { $ne: false } }),
            pendingRequests: await Request.countDocuments({ 
                isActive: { $ne: false },
                status: 'Pending'
            }),
            fulfilledRequests: await Request.countDocuments({
                isActive: { $ne: false },
                status: { $in: ['Fulfilled', 'Partially Fulfilled'] }
            }),
            activeDonors: await Donor.countDocuments({ 
                isActive: { $ne: false },
                applicationStatus: { $in: ['Approved', 'Pending'] }
            })
        };

        console.log('📊 Dashboard statistics:', stats);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('❌ Error fetching dashboard statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;

