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
 * @route   GET /api/bloodbank/dashboard-stats
 * @desc    Get dashboard statistics for blood bank
 * @access  Blood Bank only
 */
router.get('/dashboard-stats', bloodBankAuthMiddleware, async (req, res) => {
    try {
        // Get pending donations count
        const pendingCount = await UserDonation.countDocuments({
            status: 'Pending',
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
                totalUnits: totalUnits[0]?.total || 0
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

module.exports = router;