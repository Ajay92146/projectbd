/**
 * Admin Routes - API endpoints for admin dashboard
 * Handles admin-only operations and data retrieval
 */

const express = require('express');
const User = require('../models/User');
const Donor = require('../models/Donor');
const Request = require('../models/Request');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

/**
 * @route   GET /api/admin/dashboard-stats
 * @desc    Get dashboard statistics
 * @access  Admin only
 */
router.get('/dashboard-stats', async (req, res) => {
    try {
        // Get total users count
        const totalUsers = await User.countDocuments({ isActive: true });
        
        // Get total donors count
        const totalDonations = await Donor.countDocuments({ isActive: true });
        
        // Get total requests count
        const totalRequests = await Request.countDocuments({ isActive: true });
        
        // Calculate total blood units available (assuming 1 unit per donor for now)
        const totalBloodUnits = totalDonations;

        res.json({
            success: true,
            data: {
                totalUsers,
                totalDonations,
                totalRequests,
                totalBloodUnits
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
router.get('/users', async (req, res) => {
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
router.get('/donations', async (req, res) => {
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
 * @route   GET /api/admin/requests
 * @desc    Get all blood requests with pagination and filtering
 * @access  Admin only
 */
router.get('/requests', async (req, res) => {
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
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRequests: total,
                    requestsPerPage: parseInt(limit)
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

module.exports = router;
