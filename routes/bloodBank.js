/**
 * Blood Bank Routes - API endpoints for blood bank functionality
 * Handles blood bank registration, authentication, and donation approvals
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const BloodBank = require('../models/BloodBank');
const UserDonation = require('../models/UserDonation');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

// Blood Bank Authentication Middleware
function bloodBankAuthMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Blood bank authentication required'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'bloodbank') {
            return res.status(403).json({
                success: false,
                message: 'Blood bank access required'
            });
        }
        req.bloodBank = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid blood bank token'
        });
    }
}

/**
 * @route   POST /api/bloodbank/register
 * @desc    Register a new blood bank
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        const {
            bankName, licenseNumber, establishedYear, bankType,
            contactPerson, designation, phone, email, website,
            address, city, state, zipCode, country,
            loginEmail, password
        } = req.body;
        
        // Check if blood bank already exists
        const existingBank = await BloodBank.findOne({
            $or: [
                { licenseNumber },
                { email },
                { loginEmail }
            ]
        });
        
        if (existingBank) {
            return res.status(400).json({
                success: false,
                message: 'Blood bank already exists with this license number or email'
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create new blood bank
        const bloodBank = new BloodBank({
            bankName, licenseNumber, establishedYear, bankType,
            contactPerson, designation, phone, email, website,
            address, city, state, zipCode, country,
            loginEmail, password: hashedPassword
        });
        
        await bloodBank.save();
        
        logger.auth('BLOOD_BANK_REGISTRATION', 'bloodbank', {
            bankName,
            licenseNumber,
            email,
            ip: req.ip
        });
        
        res.status(201).json({
            success: true,
            message: 'Blood bank registration submitted successfully. Please wait for admin approval.',
            data: {
                id: bloodBank._id,
                bankName: bloodBank.bankName,
                status: bloodBank.status
            }
        });
        
    } catch (error) {
        logger.error('Blood bank registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
});

/**
 * @route   POST /api/bloodbank/login
 * @desc    Blood bank login
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find blood bank
        const bloodBank = await BloodBank.findOne({ 
            loginEmail: email,
            isActive: true 
        });
        
        if (!bloodBank) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Check if approved
        if (bloodBank.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: `Account is ${bloodBank.status}. Please contact admin.`
            });
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, bloodBank.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            {
                id: bloodBank._id,
                bankName: bloodBank.bankName,
                role: 'bloodbank'
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        logger.auth('BLOOD_BANK_LOGIN_SUCCESS', 'bloodbank', {
            bankName: bloodBank.bankName,
            email: bloodBank.loginEmail,
            ip: req.ip
        });
        
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                bloodBank: {
                    id: bloodBank._id,
                    bankName: bloodBank.bankName,
                    email: bloodBank.loginEmail,
                    status: bloodBank.status
                }
            }
        });
        
    } catch (error) {
        logger.error('Blood bank login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
});

/**
 * @route   GET /api/bloodbank/pending-donations
 * @desc    Get pending donation requests for approval
 * @access  Blood Bank only
 */
router.get('/pending-donations', bloodBankAuthMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Get pending donations that need blood bank approval
        const pendingDonations = await UserDonation.find({
            status: 'Pending',
            isActive: true
        })
        .populate('userId', 'firstName lastName email phoneNumber')
        .sort({ donationDate: -1 })
        .skip(skip)
        .limit(limit);
        
        const totalPending = await UserDonation.countDocuments({
            status: 'Pending',
            isActive: true
        });
        
        res.json({
            success: true,
            data: {
                donations: pendingDonations,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalPending / limit),
                    totalItems: totalPending,
                    itemsPerPage: limit
                }
            }
        });
        
    } catch (error) {
        logger.error('Error fetching pending donations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending donations'
        });
    }
});

/**
 * @route   POST /api/bloodbank/approve-donation/:donationId
 * @desc    Approve a donation request
 * @access  Blood Bank only
 */
router.post('/approve-donation/:donationId', bloodBankAuthMiddleware, async (req, res) => {
    try {
        const { donationId } = req.params;
        const { notes } = req.body;
        
        const donation = await UserDonation.findById(donationId);
        
        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }
        
        if (donation.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Donation is not pending approval'
            });
        }
        
        // Update donation status
        donation.status = 'Completed';
        donation.notes = notes || '';
        await donation.save();
        
        logger.activity('DONATION_APPROVED', req.bloodBank.id, {
            donationId,
            bloodBankName: req.bloodBank.bankName,
            donorId: donation.userId
        });
        
        res.json({
            success: true,
            message: 'Donation approved successfully',
            data: donation
        });
        
    } catch (error) {
        logger.error('Error approving donation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve donation'
        });
    }
});

/**
 * @route   POST /api/bloodbank/reject-donation/:donationId
 * @desc    Reject a donation request
 * @access  Blood Bank only
 */
router.post('/reject-donation/:donationId', bloodBankAuthMiddleware, async (req, res) => {
    try {
        const { donationId } = req.params;
        const { reason } = req.body;
        
        const donation = await UserDonation.findById(donationId);
        
        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }
        
        if (donation.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Donation is not pending approval'
            });
        }
        
        // Update donation status
        donation.status = 'Cancelled';
        donation.notes = reason || 'Rejected by blood bank';
        await donation.save();
        
        logger.activity('DONATION_REJECTED', req.bloodBank.id, {
            donationId,
            bloodBankName: req.bloodBank.bankName,
            donorId: donation.userId,
            reason
        });
        
        res.json({
            success: true,
            message: 'Donation rejected',
            data: donation
        });
        
    } catch (error) {
        logger.error('Error rejecting donation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject donation'
        });
    }
});

/**
 * @route   GET /api/bloodbank/blood-requests
 * @desc    Get all available blood requests that blood banks can accept
 * @access  Blood Bank only
 */
router.get('/blood-requests', bloodBankAuthMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { bloodGroup, urgency, location } = req.query;
        
        // Build search criteria - only show requests not accepted by any blood bank
        let searchCriteria = {
            isActive: true,
            status: { $in: ['Pending', 'In Progress'] },
            acceptedBy: { $exists: false } // Only show requests not yet accepted
        };

        if (bloodGroup) {
            searchCriteria.bloodGroup = bloodGroup;
        }

        if (urgency) {
            searchCriteria.urgency = urgency;
        }

        if (location) {
            searchCriteria.$or = [
                { 'hospital.city': new RegExp(location, 'i') },
                { 'hospital.state': new RegExp(location, 'i') }
            ];
        }

        // Get blood requests from UserRequest model
        const UserRequest = require('../models/UserRequest');
        const bloodRequests = await UserRequest.find(searchCriteria)
            .populate('userId', 'firstName lastName email phoneNumber')
            .sort({ urgency: -1, requiredBy: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalRequests = await UserRequest.countDocuments(searchCriteria);

        // Map urgency to priority for better sorting
        const priorityMap = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        
        const enhancedRequests = bloodRequests.map(request => ({
            ...request.toObject(),
            priority: priorityMap[request.urgency] || 2,
            daysLeft: Math.ceil((request.requiredBy - new Date()) / (1000 * 60 * 60 * 24)),
            timeAgo: getTimeAgo(request.createdAt)
        }));

        res.json({
            success: true,
            data: {
                requests: enhancedRequests,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalRequests / limit),
                    totalItems: totalRequests,
                    itemsPerPage: limit
                }
            }
        });
        
    } catch (error) {
        logger.error('Error fetching blood requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blood requests'
        });
    }
});

/**
 * @route   POST /api/bloodbank/accept-request/:requestId
 * @desc    Accept a blood request
 * @access  Blood Bank only
 */
router.post('/accept-request/:requestId', bloodBankAuthMiddleware, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { notes, contactNumber, contactPerson } = req.body;
        
        const UserRequest = require('../models/UserRequest');
        const BloodBank = require('../models/BloodBank');
        
        // Get blood bank details
        const bloodBank = await BloodBank.findById(req.bloodBank.id);
        if (!bloodBank) {
            return res.status(404).json({
                success: false,
                message: 'Blood bank not found'
            });
        }
        
        const request = await UserRequest.findById(requestId);
        
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Blood request not found'
            });
        }
        
        // Check if request is already accepted
        if (request.acceptedBy) {
            return res.status(400).json({
                success: false,
                message: 'Request has already been accepted by another blood bank'
            });
        }
        
        if (!['Pending', 'In Progress'].includes(request.status)) {
            return res.status(400).json({
                success: false,
                message: 'Request is not available for acceptance'
            });
        }
        
        // Update request with blood bank acceptance
        request.status = 'In Progress';
        request.acceptedBy = {
            bloodBankId: bloodBank._id,
            bloodBankName: bloodBank.bankName,
            contactPerson: contactPerson || bloodBank.contactPerson,
            contactNumber: contactNumber || bloodBank.phone,
            email: bloodBank.email,
            address: bloodBank.fullAddress,
            acceptedDate: new Date(),
            notes: notes || ''
        };
        request.updatedAt = new Date();
        
        await request.save();
        
        logger.activity('BLOOD_REQUEST_ACCEPTED', req.bloodBank.id, {
            requestId,
            bloodBankName: req.bloodBank.bankName,
            patientName: request.patientName,
            bloodGroup: request.bloodGroup,
            requiredUnits: request.requiredUnits
        });
        
        res.json({
            success: true,
            message: 'Blood request accepted successfully',
            data: {
                request: request,
                bloodBankContact: {
                    name: bloodBank.bankName,
                    contactPerson: contactPerson || bloodBank.contactPerson,
                    contactNumber: contactNumber || bloodBank.phone,
                    email: bloodBank.email,
                    address: bloodBank.fullAddress
                }
            }
        });
        
    } catch (error) {
        logger.error('Error accepting blood request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept blood request'
        });
    }
});

/**
 * @route   GET /api/bloodbank/accepted-requests
 * @desc    Get requests accepted by this blood bank
 * @access  Blood Bank only
 */
router.get('/accepted-requests', bloodBankAuthMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const UserRequest = require('../models/UserRequest');
        
        // Get requests accepted by this blood bank
        const acceptedRequests = await UserRequest.find({
            'acceptedBy.bloodBankId': req.bloodBank.id,
            isActive: true
        })
        .populate('userId', 'firstName lastName email phoneNumber')
        .sort({ 'acceptedBy.acceptedDate': -1 })
        .skip(skip)
        .limit(limit);
        
        const totalAccepted = await UserRequest.countDocuments({
            'acceptedBy.bloodBankId': req.bloodBank.id,
            isActive: true
        });
        
        res.json({
            success: true,
            data: {
                requests: acceptedRequests,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalAccepted / limit),
                    totalItems: totalAccepted,
                    itemsPerPage: limit
                }
            }
        });
        
    } catch (error) {
        logger.error('Error fetching accepted requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch accepted requests'
        });
    }
});

/**
 * @route   POST /api/bloodbank/fulfill-request/:requestId
 * @desc    Mark a blood request as fulfilled
 * @access  Blood Bank only
 */
router.post('/fulfill-request/:requestId', bloodBankAuthMiddleware, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { unitsFulfilled, notes } = req.body;
        
        const UserRequest = require('../models/UserRequest');
        
        const request = await UserRequest.findOne({
            _id: requestId,
            'acceptedBy.bloodBankId': req.bloodBank.id
        });
        
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or not accepted by your blood bank'
            });
        }
        
        // Update fulfillment details
        request.fulfilledUnits = unitsFulfilled || request.requiredUnits;
        request.status = (request.fulfilledUnits >= request.requiredUnits) ? 'Fulfilled' : 'Partially Fulfilled';
        request.acceptedBy.fulfillmentDate = new Date();
        request.acceptedBy.fulfillmentNotes = notes || '';
        request.updatedAt = new Date();
        
        await request.save();
        
        logger.activity('BLOOD_REQUEST_FULFILLED', req.bloodBank.id, {
            requestId,
            bloodBankName: req.bloodBank.bankName,
            patientName: request.patientName,
            unitsFulfilled: request.fulfilledUnits,
            totalRequired: request.requiredUnits
        });
        
        res.json({
            success: true,
            message: 'Blood request marked as fulfilled',
            data: request
        });
        
    } catch (error) {
        logger.error('Error fulfilling blood request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fulfill blood request'
        });
    }
});

/**
 * @route   GET /api/bloodbank/dashboard-stats
 * @desc    Get dashboard statistics for blood bank
 * @access  Blood Bank only
 */
router.get('/dashboard-stats', bloodBankAuthMiddleware, async (req, res) => {
    try {
        const UserRequest = require('../models/UserRequest');
        
        // Get pending donations count
        const pendingCount = await UserDonation.countDocuments({
            status: 'Pending',
            isActive: true
        });
        
        // Get available blood requests count
        const availableRequestsCount = await UserRequest.countDocuments({
            isActive: true,
            status: { $in: ['Pending', 'In Progress'] },
            acceptedBy: { $exists: false }
        });
        
        // Get requests accepted by this blood bank
        const acceptedRequestsCount = await UserRequest.countDocuments({
            'acceptedBy.bloodBankId': req.bloodBank.id,
            isActive: true
        });
        
        // Get fulfilled requests by this blood bank
        const fulfilledRequestsCount = await UserRequest.countDocuments({
            'acceptedBy.bloodBankId': req.bloodBank.id,
            status: 'Fulfilled',
            isActive: true
        });
        
        // Get today's approved donations
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const approvedToday = await UserDonation.countDocuments({
            status: 'Completed',
            updatedAt: { $gte: today, $lt: tomorrow },
            isActive: true
        });
        
        // Get total units approved by this blood bank
        const totalUnits = await UserDonation.aggregate([
            { $match: { status: 'Completed', isActive: true } },
            { $group: { _id: null, total: { $sum: '$unitsCollected' } } }
        ]);
        
        res.json({
            success: true,
            data: {
                pendingCount,
                approvedToday,
                totalUnits: totalUnits[0]?.total || 0,
                availableRequestsCount,
                acceptedRequestsCount,
                fulfilledRequestsCount
            }
        });
        
    } catch (error) {
        logger.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics'
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