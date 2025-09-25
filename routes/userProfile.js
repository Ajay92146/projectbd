/**
 * User Profile Routes - API endpoints for user profile management
 * Handles user donations, requests, and profile data
 */

const express = require('express');
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const UserDonation = require('../models/UserDonation');
const UserRequest = require('../models/UserRequest');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

/**
 * @route   GET /api/profile/dashboard
 * @desc    Get user dashboard data
 * @access  Private
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get user basic info
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get donation statistics from Donor collection - FIXED QUERY
        const Donor = require('../models/Donor');
        const donationStats = await Donor.aggregate([
            { 
                $match: { 
                    userId: userId,  // PRIMARY FILTER: Only current user's donations
                    isActive: { $ne: false } 
                } 
            },
            {
                $group: {
                    _id: null,
                    totalDonations: { $sum: 1 },
                    totalUnits: { $sum: 1 }, // Assuming 1 unit per donation
                    lastDonation: { $max: '$dateOfDonation' },
                    bloodGroups: { $addToSet: '$bloodGroup' }
                }
            }
        ]);

        // Get request statistics from Request collection - FIXED QUERY
        const Request = require('../models/Request');
        const requestStats = await Request.aggregate([
            { 
                $match: { 
                    userId: userId,  // PRIMARY FILTER: Only current user's requests
                    isActive: { $ne: false } 
                } 
            },
            {
                $group: {
                    _id: null,
                    totalRequests: { $sum: 1 },
                    totalUnitsRequested: { $sum: '$requiredUnits' },
                    pendingRequests: {
                        $sum: { $cond: [{ $in: ['$status', ['Pending', 'In Progress']] }, 1, 0] }
                    },
                    fulfilledRequests: {
                        $sum: { $cond: [{ $eq: ['$status', 'Fulfilled'] }, 1, 0] }
                    }
                }
            }
        ]);

        // Get recent donations (last 5) - FIXED QUERY
        const recentDonations = await Donor.find({
            userId: userId,  // Only current user's donations
            isActive: { $ne: false }
        })
            .sort({ applicationDate: -1, dateOfDonation: -1 })
            .limit(5);

        // Get recent requests (last 5) - FIXED QUERY
        const recentRequests = await Request.find({
            userId: userId,  // Only current user's requests
            isActive: { $ne: false }
        })
            .sort({ createdAt: -1 })
            .limit(5);

        // Get upcoming eligible donation date
        const lastDonation = await Donor.findOne({
            userId: userId,  // Only current user's donations
            isActive: { $ne: false }
        }).sort({ dateOfDonation: -1 });

        let nextEligibleDate = null;
        if (lastDonation && lastDonation.dateOfDonation) {
            const nextDate = new Date(lastDonation.dateOfDonation);
            nextDate.setMonth(nextDate.getMonth() + 3); // 3 months gap
            nextEligibleDate = nextDate;
        }

        res.json({
            success: true,
            data: {
                user: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    bloodGroup: user.bloodGroup,
                    city: user.city,
                    state: user.state,
                    memberSince: user.createdAt
                },
                donations: {
                    stats: donationStats[0] || {
                        totalDonations: 0,
                        totalUnits: 0,
                        lastDonation: null,
                        bloodGroups: []
                    },
                    recent: recentDonations,
                    nextEligibleDate
                },
                requests: {
                    stats: requestStats[0] || {
                        totalRequests: 0,
                        totalUnitsRequested: 0,
                        totalUnitsFulfilled: 0,
                        pendingRequests: 0,
                        fulfilledRequests: 0
                    },
                    recent: recentRequests
                }
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   GET /api/profile/donations
 * @desc    Get user's donation history
 * @access  Private
 */
router.get('/donations', [
    authMiddleware,
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get user's email to match with donations
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // FIXED: Get donations from Donor collection using userId as primary filter
        const Donor = require('../models/Donor');
        console.log('🔍 Looking for donations with userId:', userId);

        const donorQuery = {
            userId: userId,  // PRIMARY FILTER: Only current user's donations
            isActive: { $ne: false }
        };
        
        console.log('🔍 Using donor query:', JSON.stringify(donorQuery));
        
        const donations = await Donor.find(donorQuery)
            .sort({ applicationDate: -1, dateOfDonation: -1 })
            .skip(skip)
            .limit(limit);

        console.log('📊 Found donations:', donations.length);

        // Get total count with the same query
        const totalDonations = await Donor.countDocuments(donorQuery);

        console.log('📤 Sending donations response:', {
            success: true,
            donationsCount: donations.length,
            totalDonations,
            sampleDonation: donations[0] ? {
                id: donations[0]._id,
                email: donations[0].email,
                bloodGroup: donations[0].bloodGroup,
                dateOfDonation: donations[0].dateOfDonation
            } : null
        });

        // Add cache-busting headers
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        // Map Donor model fields to frontend expected format
        const mappedDonations = donations.map(donation => ({
            _id: donation._id,
            donationDate: donation.dateOfDonation,
            bloodGroup: donation.bloodGroup,
            unitsCollected: 1, // Default to 1 unit as Donor model doesn't have this field
            status: donation.isActive === false ? 'Cancelled' : 'Completed',
            donationCenter: {
                name: donation.donationCenter || 'Blood Bank',
                address: donation.address || donation.city + ', ' + donation.state
            },
            donorName: donation.name || `${donation.firstName} ${donation.lastName}`,
            contactNumber: donation.contactNumber || donation.phoneNumber,
            city: donation.city,
            state: donation.state,
            createdAt: donation.applicationDate || donation.createdAt
        }));

        res.json({
            success: true,
            data: {
                donations: mappedDonations,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalDonations / limit),
                    totalDonations,
                    hasNext: page < Math.ceil(totalDonations / limit),
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching donations',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/profile/donations
 * @desc    Add a new donation record
 * @access  Private
 */
router.post('/donations', [
    authMiddleware,
    body('donationDate')
        .isISO8601()
        .withMessage('Please provide a valid donation date'),
    body('bloodGroup')
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood group'),
    body('unitsCollected')
        .isInt({ min: 1, max: 5 })
        .withMessage('Units collected must be between 1 and 5'),
    body('donationCenter.name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Donation center name must be between 2 and 100 characters'),
    body('donationCenter.address')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Donation center address must be between 5 and 200 characters'),
    body('donationCenter.city')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('City must be between 2 and 50 characters'),
    body('donationCenter.state')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('State must be between 2 and 50 characters')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const userId = req.user.userId;
        const donationData = {
            userId,
            ...req.body
        };

        // Create new donation record
        const newDonation = new UserDonation(donationData);
        const savedDonation = await newDonation.save();

        res.status(201).json({
            success: true,
            message: 'Donation record added successfully',
            data: {
                donation: savedDonation
            }
        });

    } catch (error) {
        console.error('Error adding donation record:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding donation record',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   GET /api/profile/requests
 * @desc    Get user's blood request history
 * @access  Private
 */
router.get('/requests', [
    authMiddleware,
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('status').optional().isIn(['Pending', 'In Progress', 'Partially Fulfilled', 'Fulfilled', 'Cancelled', 'Expired'])
], async (req, res) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        // Get user's email to match with requests
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // FIXED: Build query to get only current user's requests
        const Request = require('../models/Request');
        console.log('🔍 Looking for requests with userId:', userId);

        let requestQuery = {
            userId: userId,  // PRIMARY FILTER: Only current user's requests
            isActive: { $ne: false }
        };

        if (status) {
            requestQuery.status = status;
        }

        console.log('🔍 Using request query:', JSON.stringify(requestQuery));

        const requests = await Request.find(requestQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        console.log('📊 Found requests:', requests.length);

        // Get total count
        const totalRequests = await Request.countDocuments(requestQuery);

        // Also get UserRequest records if they exist
        const UserRequest = require('../models/UserRequest');
        const userRequests = await UserRequest.find({
            userId: userId,
            isActive: { $ne: false },
            ...(status && { status })
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Combine and deduplicate requests
        const allRequests = [...requests, ...userRequests];
        const uniqueRequests = allRequests.filter((request, index, self) => 
            index === self.findIndex(r => r._id.toString() === request._id.toString())
        );

        console.log('📤 Sending requests response:', {
            success: true,
            requestsCount: uniqueRequests.length,
            totalRequests
        });

        res.json({
            success: true,
            data: {
                requests: uniqueRequests,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalRequests / limit),
                    totalRequests,
                    hasNext: page < Math.ceil(totalRequests / limit),
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching requests',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/profile/requests
 * @desc    Add a new blood request
 * @access  Private
 */
router.post('/requests', [
    authMiddleware,
    body('patientName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Patient name must be between 2 and 100 characters'),
    body('patientAge')
        .isInt({ min: 1, max: 120 })
        .withMessage('Patient age must be between 1 and 120'),
    body('patientGender')
        .isIn(['Male', 'Female', 'Other'])
        .withMessage('Invalid gender'),
    body('relationship')
        .isIn(['Self', 'Parent', 'Child', 'Spouse', 'Sibling', 'Relative', 'Friend', 'Other'])
        .withMessage('Invalid relationship'),
    body('bloodGroup')
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood group'),
    body('requiredUnits')
        .isInt({ min: 1, max: 10 })
        .withMessage('Required units must be between 1 and 10'),
    body('urgency')
        .isIn(['Low', 'Medium', 'High', 'Critical'])
        .withMessage('Invalid urgency level'),
    body('hospitalName')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Hospital name must be between 2 and 200 characters'),
    body('hospitalAddress')
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Hospital address must be between 5 and 500 characters'),
    body('contactNumber')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please enter a valid 10-digit Indian mobile number'),
    body('requiredBy')
        .isISO8601()
        .withMessage('Please provide a valid required by date'),
    body('additionalNotes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Additional notes cannot exceed 1000 characters')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const userId = req.user.userId;
        const requestData = {
            userId,
            ...req.body
        };

        // Create new request record
        const newRequest = new UserRequest(requestData);
        const savedRequest = await newRequest.save();

        res.status(201).json({
            success: true,
            message: 'Blood request added successfully',
            data: {
                request: savedRequest
            }
        });

    } catch (error) {
        console.error('Error adding blood request:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding blood request',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;