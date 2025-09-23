/**
 * Admin Routes - API endpoints for admin dashboard
 * Handles admin-only operations and data retrieval
 */

const express = require('express');
const User = require('../models/User');
const Donor = require('../models/Donor');
const Request = require('../models/Request');
const UserDonation = require('../models/UserDonation');
const UserRequest = require('../models/UserRequest');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

// Enhanced Admin authentication middleware
function adminAuthMiddleware(req, res, next) {
    // Log all headers for debugging
    console.log('Admin auth headers received:', req.headers);
    
    // For production, this should validate JWT tokens with admin role
    // For now, we'll use a simple admin check with environment variables
    const adminEmail = req.headers['x-admin-email'] || req.headers['X-Admin-Email'];
    const adminAuth = req.headers['x-admin-auth'] || req.headers['X-Admin-Auth'];
    
    // Get admin credentials from environment variables or use defaults
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bloodconnect.com';
    const ADMIN_AUTH_TOKEN = process.env.ADMIN_AUTH_TOKEN || 'true';
    
    console.log('Checking admin credentials:', { adminEmail, adminAuth, ADMIN_EMAIL, ADMIN_AUTH_TOKEN });
    
    // Check if admin credentials are present and valid
    if (adminEmail === ADMIN_EMAIL && adminAuth === ADMIN_AUTH_TOKEN) {
        console.log('✅ Admin authentication successful');
        next();
    } else {
        console.log('❌ Admin authentication failed');
        return res.status(401).json({
            success: false,
            message: 'Admin authentication required'
        });
    }
}

/**
 * @route   POST /api/admin/login
 * @desc    Admin login endpoint
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Hardcoded admin credentials (should be in environment variables in production)
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bloodconnect.com';
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
        
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            // Log successful admin login
            logger.auth('ADMIN_LOGIN_SUCCESS', 'admin', {
                email: email,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            res.json({
                success: true,
                message: 'Admin login successful',
                data: {
                    email: email,
                    role: 'admin',
                    loginTime: new Date().toISOString()
                }
            });
        } else {
            // Log failed admin login attempt
            logger.security('ADMIN_LOGIN_FAILED', {
                email: email,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }
    } catch (error) {
        logger.error('Error during admin login:', error);
        res.status(500).json({
            success: false,
            message: 'Admin login error'
        });
    }
});

/**
 * @route   POST /api/admin/logout
 * @desc    Admin logout endpoint (clears any server-side session if needed)
 * @access  Admin only
 */
router.post('/logout', adminAuthMiddleware, async (req, res) => {
    try {
        const adminEmail = req.headers['x-admin-email'];
        
        // Log successful admin logout
        logger.auth('ADMIN_LOGOUT_SUCCESS', 'admin', {
            email: adminEmail,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        res.json({
            success: true,
            message: 'Admin logout successful'
        });
    } catch (error) {
        logger.error('Error during admin logout:', error);
        res.status(500).json({
            success: false,
            message: 'Admin logout error'
        });
    }
});

/**
 * @route   GET /api/admin/verify
 * @desc    Verify admin authentication status
 * @access  Admin only
 */
router.get('/verify', adminAuthMiddleware, async (req, res) => {
    try {
        const adminEmail = req.headers['x-admin-email'];
        
        res.json({
            success: true,
            message: 'Admin authentication verified',
            data: {
                email: adminEmail,
                role: 'admin',
                verifiedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Error during admin verification:', error);
        res.status(500).json({
            success: false,
            message: 'Admin verification error'
        });
    }
});

/**
 * @route   GET /api/admin/dashboard-stats
 * @desc    Get dashboard statistics
 * @access  Admin only
 */
router.get('/dashboard-stats', adminAuthMiddleware, async (req, res) => {
    try {
        // Get total users count
        const totalUsers = await User.countDocuments({ isActive: true });
        
        // Get total donors count
        const totalDonations = await Donor.countDocuments({ isActive: true });
        
        // Get total requests count
        const totalRequests = await Request.countDocuments({ isActive: true });
        
        // Get total user donations count
        const totalUserDonations = await UserDonation.countDocuments({ isActive: true });
        
        // Get total user requests count
        const totalUserRequests = await UserRequest.countDocuments({ isActive: true });
        
        // Calculate total blood units available (assuming 1 unit per donor for now)
        const totalBloodUnits = totalDonations;

        res.json({
            success: true,
            data: {
                totalUsers,
                totalDonations,
                totalRequests,
                totalBloodUnits,
                totalUserDonations,
                totalUserRequests
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

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination and filtering
 * @access  Admin only
 */
router.get('/users', adminAuthMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
        
        // Build search query
        let query = { isActive: true };
        
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (role) {
            query.role = role;
        }
        
        if (status) {
            query.isActive = status === 'active';
        }
        
        // Execute query with pagination
        const users = await User.find(query)
            .select('-password -resetPasswordToken -emailVerificationToken')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        // Get total count
        const total = await User.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalUsers: total,
                    usersPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

/**
 * @route   GET /api/admin/donations
 * @desc    Get all donors with pagination and filtering
 * @access  Admin only
 */
router.get('/donations', adminAuthMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '', bloodGroup = '' } = req.query;
        
        // Build search query
        let query = { isActive: true };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
                { contactNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status) {
            if (status === 'available') {
                query.isAvailable = true;
            } else if (status === 'unavailable') {
                query.isAvailable = false;
            }
        }
        
        if (bloodGroup) {
            query.bloodGroup = bloodGroup;
        }
        
        // Execute query with pagination
        const donations = await Donor.find(query)
            .sort({ registrationDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        // Get total count
        const total = await Donor.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                donations,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalDonations: total,
                    donationsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching donations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch donations'
        });
    }
});

/**
 * @route   GET /api/admin/user-donations
 * @desc    Get all user donations with pagination and filtering
 * @access  Admin only
 */
router.get('/user-donations', adminAuthMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '', bloodGroup = '' } = req.query;
        
        // Build search query
        let query = { isActive: true };
        
        if (search) {
            // First, find users matching the search term
            const userQuery = {
                $or: [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
            const matchingUsers = await User.find(userQuery).select('_id');
            const userIds = matchingUsers.map(user => user._id);
            
            query.$or = [
                { userId: { $in: userIds } },
                { 'donationCenter.name': { $regex: search, $options: 'i' } },
                { 'donationCenter.city': { $regex: search, $options: 'i' } },
                { certificateNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status) {
            query.status = status;
        }
        
        if (bloodGroup) {
            query.bloodGroup = bloodGroup;
        }
        
        // Execute query with pagination and populate user data
        const userDonations = await UserDonation.find(query)
            .populate('userId', 'firstName lastName email phoneNumber')
            .sort({ donationDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        // Get total count
        const total = await UserDonation.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                userDonations,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    total: total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching user donations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user donations'
        });
    }
});

/**
 * @route   GET /api/admin/requests
 * @desc    Get all blood requests with pagination and filtering
 * @access  Admin only
 */
router.get('/requests', adminAuthMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '', urgency = '', bloodGroup = '' } = req.query;
        
        // Build search query
        let query = { isActive: true };
        
        if (search) {
            query.$or = [
                { patientName: { $regex: search, $options: 'i' } },
                { contactPersonName: { $regex: search, $options: 'i' } },
                { hospitalName: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { contactNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status) {
            query.status = status;
        }
        
        if (urgency) {
            query.urgency = urgency;
        }
        
        if (bloodGroup) {
            query.bloodGroup = bloodGroup;
        }
        
        // Execute query with pagination
        const requests = await Request.find(query)
            .sort({ requestDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        // Get total count
        const total = await Request.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                requests,
                pagination: {
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total: total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch requests'
        });
    }
});

/**
 * @route   GET /api/admin/user-requests
 * @desc    Get all user requests with pagination and filtering
 * @access  Admin only
 */
router.get('/user-requests', adminAuthMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '', urgency = '', bloodGroup = '' } = req.query;
        
        // Build search query
        let query = { isActive: true };
        
        if (search) {
            // First, find users matching the search term
            const userQuery = {
                $or: [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
            const matchingUsers = await User.find(userQuery).select('_id');
            const userIds = matchingUsers.map(user => user._id);
            
            query.$or = [
                { userId: { $in: userIds } },
                { patientName: { $regex: search, $options: 'i' } },
                { 'hospital.name': { $regex: search, $options: 'i' } },
                { 'hospital.city': { $regex: search, $options: 'i' } },
                { 'contactPerson.name': { $regex: search, $options: 'i' } },
                { 'contactPerson.phoneNumber': { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status) {
            query.status = status;
        }
        
        if (urgency) {
            query.urgency = urgency;
        }
        
        if (bloodGroup) {
            query.bloodGroup = bloodGroup;
        }
        
        // Execute query with pagination and populate user data
        const userRequests = await UserRequest.find(query)
            .populate('userId', 'firstName lastName email phoneNumber')
            .populate('donors.donorId', 'firstName lastName phoneNumber')
            .sort({ requestDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        // Get total count
        const total = await UserRequest.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                userRequests,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    total: total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching user requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user requests'
        });
    }
});

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Update user status (activate/deactivate)
 * @access  Admin only
 */
router.put('/users/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        
        const user = await User.findByIdAndUpdate(
            id,
            { isActive },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: user
        });
    } catch (error) {
        logger.error('Error updating user status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status'
        });
    }
});

/**
 * @route   PUT /api/admin/donations/:id/status
 * @desc    Update donor availability status
 * @access  Admin only
 */
router.put('/donations/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { isAvailable, applicationStatus } = req.body;
        
        const updateData = {};
        if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
        if (applicationStatus) updateData.applicationStatus = applicationStatus;
        
        const donation = await Donor.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donor not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Donor status updated successfully',
            data: donation
        });
    } catch (error) {
        logger.error('Error updating donor status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update donor status'
        });
    }
});

/**
 * @route   PUT /api/admin/requests/:id/status
 * @desc    Update request status
 * @access  Admin only
 */
router.put('/requests/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, additionalNotes } = req.body;
        
        const updateData = {};
        if (status) updateData.status = status;
        if (additionalNotes) updateData.additionalNotes = additionalNotes;
        
        const request = await Request.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Request status updated successfully',
            data: request
        });
    } catch (error) {
        logger.error('Error updating request status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update request status'
        });
    }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user (soft delete)
 * @access  Admin only
 */
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
});

/**
 * @route   GET /api/admin/chart-stats
 * @desc    Get chart statistics for admin dashboard
 * @access  Admin only
 */
router.get('/chart-stats', adminAuthMiddleware, async (req, res) => {
    try {
        // Get user registrations by month
        const userRegistrations = await User.aggregate([
            { $match: { isActive: true } },
            { $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                count: { $sum: 1 }
            }},
            { $sort: { '_id': 1 } }
        ]);

        // Get donations by blood group
        const donationsByGroup = await Donor.aggregate([
            { $match: { isActive: true } },
            { $group: {
                _id: '$bloodGroup',
                count: { $sum: 1 }
            }},
            { $sort: { '_id': 1 } }
        ]);

        // Get requests by urgency
        const requestsByUrgency = await Request.aggregate([
            { $match: { isActive: true } },
            { $group: {
                _id: '$urgency',
                count: { $sum: 1 }
            }},
            { $sort: { '_id': 1 } }
        ]);

        // Get donor availability status
        const donorAvailability = await Donor.aggregate([
            { $group: {
                _id: '$isAvailable',
                count: { $sum: 1 }
            }}
        ]);

        res.json({
            success: true,
            data: {
                userRegistrations: {
                    labels: userRegistrations.map(item => item._id),
                    data: userRegistrations.map(item => item.count)
                },
                donationsByGroup: {
                    labels: donationsByGroup.map(item => item._id),
                    data: donationsByGroup.map(item => item.count)
                },
                requestsByUrgency: {
                    labels: requestsByUrgency.map(item => item._id),
                    data: requestsByUrgency.map(item => item.count)
                },
                donorAvailability: {
                    labels: donorAvailability.map(item => item._id ? 'Available' : 'Unavailable'),
                    data: donorAvailability.map(item => item.count)
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching chart stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chart statistics'
        });
    }
});

/**
 * @route   POST /api/admin/activity-log
 * @desc    Log admin activity
 * @access  Admin only
 */
router.post('/activity-log', adminAuthMiddleware, async (req, res) => {
    try {
        const { action, details } = req.body;
        
        // In a real implementation, you would save this to a database
        // For now, we'll just log it
        logger.info('ADMIN_ACTIVITY', {
            action,
            details,
            adminEmail: req.headers['x-admin-email'],
            timestamp: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: 'Activity logged successfully'
        });
    } catch (error) {
        logger.error('Error logging activity:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to log activity'
        });
    }
});

/**
 * @route   GET /api/admin/activity-logs
 * @desc    Get recent admin activity logs
 * @access  Admin only
 */
router.get('/activity-logs', adminAuthMiddleware, async (req, res) => {
    try {
        // In a real implementation, you would fetch this from a database
        // For now, we'll return a placeholder response
        res.json({
            success: true,
            data: {
                logs: []
            }
        });
    } catch (error) {
        logger.error('Error fetching activity logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity logs'
        });
    }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user details by ID
 * @access  Admin only
 */
router.get('/users/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findById(id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        logger.error('Error fetching user details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user details'
        });
    }
});

/**
 * @route   GET /api/admin/donations/:id
 * @desc    Get donation details by ID
 * @access  Admin only
 */
router.get('/donations/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const donation = await Donor.findById(id);
        
        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }
        
        res.json({
            success: true,
            data: donation
        });
    } catch (error) {
        logger.error('Error fetching donation details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch donation details'
        });
    }
});

/**
 * @route   GET /api/admin/requests/:id
 * @desc    Get request details by ID
 * @access  Admin only
 */
router.get('/requests/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const request = await Request.findById(id);
        
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }
        
        res.json({
            success: true,
            data: request
        });
    } catch (error) {
        logger.error('Error fetching request details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch request details'
        });
    }
});

/**
 * @route   GET /api/admin/:dataType/export
 * @desc    Export data to CSV
 * @access  Admin only
 */
router.get('/:dataType/export', adminAuthMiddleware, async (req, res) => {
    try {
        const { dataType } = req.params;
        
        let data = [];
        let fileName = '';
        
        switch (dataType) {
            case 'users':
                data = await User.find({ isActive: true }).select('-password');
                fileName = 'users_export';
                break;
            case 'donations':
                data = await Donor.find({ isActive: true });
                fileName = 'donations_export';
                break;
            case 'requests':
                data = await Request.find({ isActive: true });
                fileName = 'requests_export';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid data type for export'
                });
        }
        
        res.json({
            success: true,
            data: data,
            fileName: fileName
        });
    } catch (error) {
        logger.error(`Error exporting ${dataType} data:`, error);
        res.status(500).json({
            success: false,
            message: `Failed to export ${dataType} data`
        });
    }
});

/**
 * @route   POST /api/admin/:dataType/bulk-approve
 * @desc    Bulk approve items
 * @access  Admin only
 */
router.post('/:dataType/bulk-approve', adminAuthMiddleware, async (req, res) => {
    try {
        const { dataType } = req.params;
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items selected for approval'
            });
        }
        
        let updatedCount = 0;
        
        switch (dataType) {
            case 'users':
                const userResult = await User.updateMany(
                    { _id: { $in: ids } },
                    { isActive: true }
                );
                updatedCount = userResult.modifiedCount;
                break;
            case 'donations':
                const donationResult = await Donor.updateMany(
                    { _id: { $in: ids } },
                    { isAvailable: true, applicationStatus: 'Approved' }
                );
                updatedCount = donationResult.modifiedCount;
                break;
            case 'requests':
                const requestResult = await Request.updateMany(
                    { _id: { $in: ids } },
                    { status: 'Approved' }
                );
                updatedCount = requestResult.modifiedCount;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid data type for bulk approval'
                });
        }
        
        res.json({
            success: true,
            message: `${updatedCount} ${dataType} approved successfully`,
            data: {
                updatedCount
            }
        });
    } catch (error) {
        logger.error(`Error bulk approving ${dataType}:`, error);
        res.status(500).json({
            success: false,
            message: `Failed to approve ${dataType}`
        });
    }
});

/**
 * @route   POST /api/admin/:dataType/bulk-reject
 * @desc    Bulk reject items
 * @access  Admin only
 */
router.post('/:dataType/bulk-reject', adminAuthMiddleware, async (req, res) => {
    try {
        const { dataType } = req.params;
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items selected for rejection'
            });
        }
        
        let updatedCount = 0;
        
        switch (dataType) {
            case 'users':
                const userResult = await User.updateMany(
                    { _id: { $in: ids } },
                    { isActive: false }
                );
                updatedCount = userResult.modifiedCount;
                break;
            case 'donations':
                const donationResult = await Donor.updateMany(
                    { _id: { $in: ids } },
                    { isAvailable: false, applicationStatus: 'Rejected' }
                );
                updatedCount = donationResult.modifiedCount;
                break;
            case 'requests':
                const requestResult = await Request.updateMany(
                    { _id: { $in: ids } },
                    { status: 'Rejected' }
                );
                updatedCount = requestResult.modifiedCount;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid data type for bulk rejection'
                });
        }
        
        res.json({
            success: true,
            message: `${updatedCount} ${dataType} rejected successfully`,
            data: {
                updatedCount
            }
        });
    } catch (error) {
        logger.error(`Error bulk rejecting ${dataType}:`, error);
        res.status(500).json({
            success: false,
            message: `Failed to reject ${dataType}`
        });
    }
});

/**
 * @route   DELETE /api/admin/:dataType/bulk-delete
 * @desc    Bulk delete items (soft delete)
 * @access  Admin only
 */
router.delete('/:dataType/bulk-delete', adminAuthMiddleware, async (req, res) => {
    try {
        const { dataType } = req.params;
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items selected for deletion'
            });
        }
        
        let deletedCount = 0;
        
        switch (dataType) {
            case 'users':
                const userResult = await User.updateMany(
                    { _id: { $in: ids } },
                    { isActive: false }
                );
                deletedCount = userResult.modifiedCount;
                break;
            case 'donations':
                const donationResult = await Donor.updateMany(
                    { _id: { $in: ids } },
                    { isActive: false }
                );
                deletedCount = donationResult.modifiedCount;
                break;
            case 'requests':
                const requestResult = await Request.updateMany(
                    { _id: { $in: ids } },
                    { isActive: false }
                );
                deletedCount = requestResult.modifiedCount;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid data type for bulk deletion'
                });
        }
        
        res.json({
            success: true,
            message: `${deletedCount} ${dataType} deleted successfully`,
            data: {
                deletedCount
            }
        });
    } catch (error) {
        logger.error(`Error bulk deleting ${dataType}:`, error);
        res.status(500).json({
            success: false,
            message: `Failed to delete ${dataType}`
        });
    }
});

/**
 * @route   GET /api/admin/notifications
 * @desc    WebSocket endpoint for admin notifications
 * @access  Admin only
 */
/**
 * @route   GET /api/admin/dashboard-stats
 * @desc    Get dashboard statistics for admin dashboard
 * @access  Admin only
 */
router.get('/dashboard-stats', adminAuthMiddleware, async (req, res) => {
    try {
        // Get total users count
        const totalUsers = await User.countDocuments({ isActive: true });
        
        // Get total donations count
        const totalDonations = await Donor.countDocuments({ isActive: true });
        
        // Get total requests count
        const totalRequests = await Request.countDocuments({ isActive: true });
        
        // Get total blood units count
        const totalBloodUnits = await UserDonation.aggregate([
            { $match: { isActive: true, status: 'Completed' } },
            { $group: { _id: null, total: { $sum: "$unitsCollected" } } }
        ]);
        
        res.json({
            success: true,
            data: {
                totalUsers,
                totalDonations,
                totalRequests,
                totalBloodUnits: totalBloodUnits.length > 0 ? totalBloodUnits[0].total : 0
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

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Admin API is running',
        timestamp: new Date().toISOString()
    });
});

// This would typically be handled by a WebSocket server, not an HTTP route
// We'll add a placeholder comment for now
// WebSocket implementation would be in a separate service

module.exports = router;
