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

        // Convert userId string to ObjectId for UserDonation queries
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Get donation statistics from UserDonation collection scoped to current user
        const donationStats = await UserDonation.aggregate([
            { $match: { userId: userObjectId } },
            {
                $group: {
                    _id: null,
                    totalDonations: { $sum: 1 },
                    totalUnits: { $sum: { $ifNull: ['$unitsCollected', 1] } },
                    lastDonation: { $max: '$donationDate' },
                    bloodGroups: { $addToSet: '$bloodGroup' }
                }
            }
        ]);

        // Get request statistics strictly for current user (by userId)
        const Request = require('../models/Request');
        const requestStats = await Request.aggregate([
            { 
                $match: { 
                    userId: userId,
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

        // Get recent donations (last 5) from UserDonation
        const recentDonations = await UserDonation.find({
            userId: userObjectId
        })
            .sort({ donationDate: -1, createdAt: -1 })
            .limit(5);

        // Get recent requests (last 5) belonging to current user
        const recentRequests = await Request.find({ userId: userId, isActive: { $ne: false } })
            .sort({ createdAt: -1 })
            .limit(5);

        // Get upcoming eligible donation date from UserDonation
        const lastDonation = await UserDonation.findOne({
            userId: userObjectId
        }).sort({ donationDate: -1, createdAt: -1 });

        let nextEligibleDate = null;
        if (lastDonation && (lastDonation.donationDate || lastDonation.dateOfDonation)) {
            const lastDonationDate = lastDonation.donationDate || lastDonation.dateOfDonation;
            const nextDate = new Date(lastDonationDate);
            nextDate.setMonth(nextDate.getMonth() + 3); // 3 months gap
            nextEligibleDate = nextDate;
        }

        // Prevent caching of sensitive user dashboard
        res.set({ 'Cache-Control': 'no-store' });
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

        // Convert userId string to ObjectId for UserDonation queries
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Look up donations strictly in UserDonation by userId
        const donations = await UserDonation.find({
            userId: userObjectId
        })
            .sort({ donationDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count
        const totalDonations = await UserDonation.countDocuments({
            userId: userObjectId
        });

        console.log('📤 Sending donations response:', {
            success: true,
            userId: userId,
            userObjectId: userObjectId,
            donationsCount: donations.length,
            totalDonations,
            sampleDonation: donations[0] ? {
                id: donations[0]._id,
                userId: donations[0].userId,
                bloodGroup: donations[0].bloodGroup,
                donationDate: donations[0].donationDate
            } : null
        });

        // Prevent caching of sensitive user donations
        res.set({ 'Cache-Control': 'no-store' });
        // Prevent caching of sensitive user requests
        res.set({ 'Cache-Control': 'no-store' });

        // Map UserDonation model fields to frontend expected format
        const mappedDonations = donations.map(donation => ({
            _id: donation._id,
            donationDate: donation.donationDate || donation.dateOfDonation,
            bloodGroup: donation.bloodGroup,
            unitsCollected: donation.unitsCollected || 1,
            status: donation.status || 'Recorded',
            donationCenter: donation.donationCenter ? {
                name: donation.donationCenter.name,
                address: donation.donationCenter.address
            } : undefined,
            donorName: undefined,
            contactNumber: undefined,
            city: donation.city,
            state: donation.state,
            createdAt: donation.createdAt
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

        // Build query to get only current user's requests by userId
        const Request = require('../models/Request');
        let requestQuery = {
            userId: userId,
            isActive: { $ne: false }
        };

        if (status) {
            requestQuery.status = status;
        }

        // Get requests that match exactly this user
        let requests = await Request.find(requestQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Extra safety: enforce ownership in-memory as well
        requests = requests.filter(r => r.userId && r.userId.toString() === userId.toString());

        console.log('📊 Found requests (after ownership filter):', requests.length);

        // Get total count
        const totalRequests = await Request.countDocuments(requestQuery);

        // Also get UserRequest records if they exist - with blood bank contact info
        const UserRequest = require('../models/UserRequest');
        const userRequests = await UserRequest.find({
            userId: userId,
            isActive: { $ne: false },
            ...(status && { status })
        })
            .populate('acceptedBy.bloodBankId', 'bankName email phone address city state')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Merge both sources and dedupe by _id
        const combined = [...requests, ...userRequests];
        const seen = new Set();
        const uniqueRequests = combined.filter(r => {
            const id = r._id.toString();
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });

        // Enhance requests with blood bank contact information
        const enhancedRequests = uniqueRequests.map(request => {
            const requestObj = request.toObject();
            
            // Add additional fields for better user experience
            if (requestObj.acceptedBy && requestObj.acceptedBy.bloodBankId) {
                requestObj.hasBloodBankContact = true;
                requestObj.bloodBankContactInfo = {
                    name: requestObj.acceptedBy.bloodBankName,
                    contactPerson: requestObj.acceptedBy.contactPerson,
                    contactNumber: requestObj.acceptedBy.contactNumber,
                    email: requestObj.acceptedBy.email,
                    address: requestObj.acceptedBy.address,
                    acceptedDate: requestObj.acceptedBy.acceptedDate,
                    fulfillmentDate: requestObj.acceptedBy.fulfillmentDate,
                    notes: requestObj.acceptedBy.notes || '',
                    fulfillmentNotes: requestObj.acceptedBy.fulfillmentNotes || ''
                };
            } else {
                requestObj.hasBloodBankContact = false;
                requestObj.bloodBankContactInfo = null;
            }
            
            // Add time-related information
            if (requestObj.requiredBy) {
                const daysLeft = Math.ceil((new Date(requestObj.requiredBy) - new Date()) / (1000 * 60 * 60 * 24));
                requestObj.daysLeft = daysLeft;
                requestObj.isUrgent = daysLeft <= 3 || requestObj.urgency === 'Critical';
            }
            
            if (requestObj.createdAt) {
                requestObj.timeAgo = getTimeAgo(new Date(requestObj.createdAt));
            }
            
            return requestObj;
        });

        console.log('📤 Sending enhanced requests response:', {
            success: true,
            requestsCount: enhancedRequests.length,
            totalRequests,
            acceptedRequests: enhancedRequests.filter(r => r.hasBloodBankContact).length
        });

        res.json({
            success: true,
            data: {
                requests: enhancedRequests,
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

/**
 * @route   PUT /api/profile/donations/:id/cancel
 * @desc    Cancel a user's donation
 * @access  Private
 */
router.put('/donations/:id/cancel', [
    authMiddleware,
    body('reason')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Cancellation reason cannot exceed 500 characters')
], async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user.userId;

        // Find the donation by ID and ensure it belongs to the current user
        const donation = await UserDonation.findOne({
            _id: id,
            userId: userId
        });

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found or does not belong to you'
            });
        }

        // Check if donation can be cancelled
        if (['Cancelled', 'Completed'].includes(donation.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel donation with status: ${donation.status}`
            });
        }

        // Update donation status to cancelled
        donation.status = 'Cancelled';
        donation.notes = reason || 'Cancelled by user';
        donation.updatedAt = new Date();
        await donation.save();

        res.json({
            success: true,
            message: 'Donation cancelled successfully',
            data: {
                donation
            }
        });

    } catch (error) {
        console.error('Error cancelling donation:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling donation',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   PUT /api/profile/requests/:id/cancel
 * @desc    Cancel a user's blood request
 * @access  Private
 */
router.put('/requests/:id/cancel', [
    authMiddleware,
    body('reason')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Cancellation reason cannot exceed 500 characters')
], async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user.userId;

        // Find the request by ID and ensure it belongs to the current user
        const request = await UserRequest.findOne({
            _id: id,
            userId: userId
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or does not belong to you'
            });
        }

        // Check if request can be cancelled
        if (['Cancelled', 'Fulfilled'].includes(request.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel request with status: ${request.status}`
            });
        }

        // Update request status to cancelled
        request.status = 'Cancelled';
        request.isActive = false;
        request.additionalNotes = (request.additionalNotes || '') + `\nCancelled by user: ${reason || 'No reason provided'}`;
        request.updatedAt = new Date();
        await request.save();

        res.json({
            success: true,
            message: 'Blood request cancelled successfully',
            data: {
                request
            }
        });

    } catch (error) {
        console.error('Error cancelling request:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling request',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
        return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
}

module.exports = router;