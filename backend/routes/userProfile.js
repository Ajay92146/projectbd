/**
 * User Profile Routes - API endpoints for user profile management
 * Handles user donations, requests, and profile data
 */

const express = require('express');
const { body, validationResult, query } = require('express-validator');
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



        // Get donation statistics from Donor collection - ONLY for this user
        const Donor = require('../models/Donor');
        const donationStats = await Donor.aggregate([
            { 
                $match: { 
                    $and: [
                        { email: user.email },
                        { isActive: { $ne: false } }
                    ]
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

        // Get request statistics from Request collection - ONLY for this user
        const Request = require('../models/Request');
        const mongoose = require('mongoose');
        
        const requestQuery = {
            $and: [
                { userId: { $exists: true, $ne: null } }, // Must have userId
                { userId: new mongoose.Types.ObjectId(userId) }, // Must match authenticated user's ObjectId
                { isActive: { $ne: false } }
            ]
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

        // Get recent donations (last 5) - ONLY for this user
        const recentDonations = await Donor.find({
            $and: [
                { email: user.email },
                { isActive: { $ne: false } }
            ]
        })
            .sort({ applicationDate: -1, dateOfDonation: -1 })
            .limit(5);

        // Get recent requests (last 5) - ONLY for this user
        const recentRequests = await Request.find(requestQuery)
            .sort({ createdAt: -1 })
            .limit(5);

        // Get upcoming eligible donation date - ONLY for this user
        const lastDonation = await Donor.findOne({
            $and: [
                { email: user.email },
                { isActive: { $ne: false } }
            ]
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

        // Get donations from Donor collection - ONLY for authenticated user
        const Donor = require('../models/Donor');
        console.log('🔍 Looking for donations with email:', user.email, 'for userId:', userId);

        // Security: ONLY get donations for the authenticated user's email
        const donationQuery = {
            $and: [
                { email: user.email }, // Must match user's email
                { isActive: { $ne: false } } // Include documents where isActive is not false
            ]
        };

        const donations = await Donor.find(donationQuery)
            .sort({ applicationDate: -1, dateOfDonation: -1 })
            .skip(skip)
            .limit(limit);

        console.log('📊 Found donations for current user:', donations.length);
        
        // Security check: Verify all returned donations belong to the current user
        const verifyDonations = donations.filter(donation => donation.email === user.email);
        if (verifyDonations.length !== donations.length) {
            console.error('😱 SECURITY ALERT: Found donations not belonging to current user!');
            console.error('Expected email:', user.email);
            console.error('Found donations:', donations.map(d => ({ id: d._id, email: d.email })));
            
            // Filter to only include current user's donations
            const secureReponse = donations.filter(donation => donation.email === user.email);
            donations = secureReponse;
        }

        // Get total count - ONLY for authenticated user
        const totalDonations = await Donor.countDocuments(donationQuery);

        console.log('📤 Sending donations response:', {
            success: true,
            donationsCount: donations.length,
            totalDonations,
            userEmail: user.email,
            userId: userId,
            securityVerified: true,
            sampleDonation: donations[0] ? {
                id: donations[0]._id,
                email: donations[0].email,
                bloodGroup: donations[0].bloodGroup,
                dateOfDonation: donations[0].dateOfDonation,
                emailMatches: donations[0].email === user.email
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

        // Build query for Request collection - SECURITY: ONLY use userId
        const Request = require('../models/Request');
        const mongoose = require('mongoose');

        console.log('🔍 Looking for requests for userId:', userId);
        
        // SECURITY: Primary and ONLY query - must match exact userId
        const requestQuery = {
            $and: [
                { userId: { $exists: true, $ne: null } }, // CRITICAL: Must have userId field
                { userId: new mongoose.Types.ObjectId(userId) }, // CRITICAL: Must match authenticated user's ObjectId
                { isActive: { $ne: false } }
            ]
        };

        if (status) {
            requestQuery.$and.push({ status: status });
        }

        console.log('🔍 Secure request query (userId only):', JSON.stringify(requestQuery, null, 2));

        // Get requests ONLY for authenticated user
        let requests = await Request.find(requestQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        console.log('📊 Found requests for authenticated user:', requests.length);
        
        // Security check: Verify all returned requests belong to the current user
        const invalidRequests = requests.filter(request => {
            return !request.userId || request.userId.toString() !== userId.toString();
        });
        if (invalidRequests.length > 0) {
            console.error('😱 SECURITY ALERT: Found requests not belonging to current user!');
            console.error('Expected userId:', userId);
            console.error('Invalid requests:', invalidRequests.map(r => ({ 
                id: r._id, 
                userId: r.userId, 
                patientName: r.patientName 
            })));
            
            // Filter to only include current user's requests
            requests = requests.filter(request => {
                return request.userId && request.userId.toString() === userId.toString();
            });
            console.log('🛡️ Filtered to secure requests:', requests.length);
        }

        // Get total count ONLY for authenticated user
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
            userId: userId,
            securityVerified: true,
            sampleRequest: requests[0] ? {
                id: requests[0]._id,
                userId: requests[0].userId,
                patientName: requests[0].patientName,
                bloodGroup: requests[0].bloodGroup,
                requiredUnits: requests[0].requiredUnits,
                status: requests[0].status,
                userIdMatches: requests[0].userId && requests[0].userId.toString() === userId.toString()
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

/**
 * @route   PUT /api/profile/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', [
    authMiddleware,
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Password confirmation does not match new password');
            }
            return true;
        })
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
        const { currentPassword, newPassword } = req.body;

        // Get user from database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const bcrypt = require('bcryptjs');
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Check if new password is different from current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password'
            });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user password
        await User.findByIdAndUpdate(userId, {
            password: hashedNewPassword,
            passwordChangedAt: new Date()
        });

        console.log(`🔐 Password changed successfully for user: ${user.email}`);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;
