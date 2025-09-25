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



        // Get donation statistics from Donor collection
        const Donor = require('../models/Donor');
        const donationStats = await Donor.aggregate([
            { $match: { email: user.email, isActive: { $ne: false } } },
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

        // Get request statistics from Request collection
        const Request = require('../models/Request');
        const requestQuery = user.phoneNumber ?
            { contactNumber: user.phoneNumber, isActive: { $ne: false } } :
            {
                $or: [
                    { contactPersonName: new RegExp(user.firstName, 'i') },
                    { contactPersonName: new RegExp(user.lastName, 'i') }
                ],
                isActive: { $ne: false }
            };

        const requestStats = await Request.aggregate([
            { $match: requestQuery },
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

        // Get recent donations (last 5)
        const recentDonations = await Donor.find({
            email: user.email,
            isActive: { $ne: false }
        })
            .sort({ applicationDate: -1, dateOfDonation: -1 })
            .limit(5);

        // Get recent requests (last 5)
        const recentRequests = await Request.find(requestQuery)
            .sort({ createdAt: -1 })
            .limit(5);

        // Get upcoming eligible donation date
        const lastDonation = await Donor.findOne({
            email: user.email,
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

        // Get donations from Donor collection by matching email AND userId if available
        const Donor = require('../models/Donor');
        console.log('🔍 Looking for donations with email:', user.email, 'and userId:', userId);

        // Build query to ensure we're only getting the current user's donations
        const donorQuery = {
            email: user.email,
            isActive: { $ne: false }
        };
        
        // Add userId to query if the field exists in the Donor model
        if (Donor.schema.paths.userId) {
            donorQuery.userId = userId;
        }
        
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
            donorName: donation.name,
            contactNumber: donation.contactNumber,
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

        console.log('🔍 Looking for requests for user:', user.email, 'userId:', userId);

        // Build query for Request collection with proper user identification
        const Request = require('../models/Request');
        
        // Primary query: Look for requests with exact userId match (most secure)
        // CRITICAL FIX: Force string comparison for userId to ensure exact matches
        const userIdStr = userId.toString();
        
        // Strict query that only returns the current user's requests
        const requestQuery = {
            isActive: { $ne: false },
            $or: [
                { userId: mongoose.Types.ObjectId(userId) },  // Try as ObjectId
                { userId: userIdStr },                        // Try as string
                { userEmail: user.email }                     // Fallback to email
            ]
        };

        if (status) {
            requestQuery.status = status;
        }

        console.log('🔍 Enhanced request query:', JSON.stringify(requestQuery, null, 2));

        // Get requests from Request table with pagination
        let requests = await Request.find(requestQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        // CRITICAL FIX: Double-check each request to ensure it belongs to the current user
        // This is a final safety check to prevent any data leakage
        requests = requests.filter(request => {
            const requestUserId = request.userId ? request.userId.toString() : null;
            const requestEmail = request.userEmail || null;
            return requestUserId === userIdStr || requestEmail === user.email;
        });
            
        // Log the found requests for debugging
        console.log('📊 Found requests after strict filtering:', requests.length, 'for userId:', userId);

        // Get total count from Request table
        let totalRequests = await Request.countDocuments(requestQuery);

        // Prepare the response
        const responseData = {
            success: true,
            data: {
                requests,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalRequests / limit),
                    totalRequests,
                    hasNext: page < Math.ceil(totalRequests / limit),
                    hasPrev: page > 1
                }
            }
        };

        console.log('📤 Sending requests response:', {
            success: responseData.success,
            requestsCount: requests.length,
            totalRequests,
            sampleRequest: requests[0] ? {
                id: requests[0]._id,
                patientName: requests[0].patientName,
                bloodGroup: requests[0].bloodGroup,
                requiredUnits: requests[0].requiredUnits,
                status: requests[0].status
            } : null
        });

        // Add cache-busting headers
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.json(responseData);

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
 * @route   GET /api/profile/settings
 * @desc    Get user settings
 * @access  Private
 */
router.get('/settings', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                notifications: user.notifications,
                profileVisibility: user.profileVisibility,
                accountInfo: {
                    email: user.email,
                    isVerified: user.isVerified,
                    lastLogin: user.lastLogin,
                    memberSince: user.createdAt
                }
            }
        });

    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching settings',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   PUT /api/profile/settings
 * @desc    Update user settings
 * @access  Private
 */
router.put('/settings', [
    authMiddleware,
    body('notifications.email').optional().isBoolean(),
    body('notifications.sms').optional().isBoolean(),
    body('notifications.push').optional().isBoolean(),
    body('profileVisibility').optional().isIn(['public', 'private', 'donors-only'])
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
        const updateData = req.body;

        // Update user settings
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: {
                notifications: updatedUser.notifications,
                profileVisibility: updatedUser.profileVisibility
            }
        });

    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating settings',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;
