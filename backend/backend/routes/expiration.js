/**
 * Request Expiration Management Routes
 * API endpoints for handling automatic request expiration
 */

const express = require('express');
const router = express.Router();
const requestExpirationService = require('../services/requestExpirationService');
const Request = require('../models/Request');

// Middleware for admin authentication (optional - uncomment if needed)
// const auth = require('../middleware/auth');
// const admin = require('../middleware/admin');

/**
 * GET /api/expiration/status
 * Get expiration service status and statistics
 */
router.get('/status', async (req, res) => {
    try {
        const stats = requestExpirationService.getServiceStats();
        const summary = await requestExpirationService.getExpiredRequestsSummary();
        
        res.json({
            success: true,
            service: stats,
            expiredSummary: summary,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error getting expiration status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get expiration service status',
            error: error.message
        });
    }
});

/**
 * POST /api/expiration/check
 * Manually trigger expiration check
 */
router.post('/check', async (req, res) => {
    try {
        console.log('🔧 Manual expiration check requested');
        const result = await requestExpirationService.manualExpirationCheck();
        
        res.json({
            success: true,
            message: `Expiration check completed. ${result.expiredCount} requests expired.`,
            data: result,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error in manual expiration check:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to run expiration check',
            error: error.message
        });
    }
});

/**
 * POST /api/expiration/cleanup
 * Manually trigger cleanup of old expired requests
 */
router.post('/cleanup', async (req, res) => {
    try {
        console.log('🧹 Manual cleanup requested');
        const result = await requestExpirationService.forceCleanup();
        
        res.json({
            success: true,
            message: `Cleanup completed. ${result.cleanedCount} old requests cleaned up.`,
            data: result,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error in manual cleanup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to run cleanup',
            error: error.message
        });
    }
});

/**
 * POST /api/expiration/start
 * Start the expiration service
 */
router.post('/start', async (req, res) => {
    try {
        requestExpirationService.start();
        
        res.json({
            success: true,
            message: 'Expiration service started successfully',
            status: requestExpirationService.getServiceStats(),
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error starting expiration service:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start expiration service',
            error: error.message
        });
    }
});

/**
 * POST /api/expiration/stop
 * Stop the expiration service
 */
router.post('/stop', async (req, res) => {
    try {
        requestExpirationService.stop();
        
        res.json({
            success: true,
            message: 'Expiration service stopped successfully',
            status: requestExpirationService.getServiceStats(),
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error stopping expiration service:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to stop expiration service',
            error: error.message
        });
    }
});

/**
 * GET /api/expiration/expired-requests
 * Get all expired requests with pagination
 */
router.get('/expired-requests', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const expiredRequests = await Request.find({
            status: 'Expired',
            isActive: false
        })
        .populate('hospital', 'name address phoneNumber')
        .select('patientName bloodGroup hospitalName phoneNumber urgency requiredBy additionalNotes')
        .sort({ requiredBy: -1 })
        .skip(skip)
        .limit(limit);
        
        const totalExpired = await Request.countDocuments({
            status: 'Expired',
            isActive: false
        });
        
        res.json({
            success: true,
            data: {
                requests: expiredRequests,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalExpired / limit),
                    totalRequests: totalExpired,
                    hasNextPage: page < Math.ceil(totalExpired / limit),
                    hasPrevPage: page > 1
                }
            },
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error getting expired requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get expired requests',
            error: error.message
        });
    }
});

/**
 * DELETE /api/expiration/expired-requests/:id
 * Permanently delete an expired request
 */
router.delete('/expired-requests/:id', async (req, res) => {
    try {
        const requestId = req.params.id;
        
        // Find the request and ensure it's expired
        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }
        
        if (request.status !== 'Expired') {
            return res.status(400).json({
                success: false,
                message: 'Can only delete expired requests'
            });
        }
        
        await Request.findByIdAndDelete(requestId);
        
        res.json({
            success: true,
            message: 'Expired request permanently deleted',
            deletedRequest: {
                id: request._id,
                patientName: request.patientName,
                bloodGroup: request.bloodGroup
            },
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error deleting expired request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete expired request',
            error: error.message
        });
    }
});

/**
 * PUT /api/expiration/expired-requests/:id/restore
 * Restore an expired request (if needed)
 */
router.put('/expired-requests/:id/restore', async (req, res) => {
    try {
        const requestId = req.params.id;
        const { newRequiredDate, reason } = req.body;
        
        if (!newRequiredDate) {
            return res.status(400).json({
                success: false,
                message: 'New required date is required for restoration'
            });
        }
        
        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }
        
        if (request.status !== 'Expired') {
            return res.status(400).json({
                success: false,
                message: 'Can only restore expired requests'
            });
        }
        
        // Restore the request
        request.status = 'Pending';
        request.isActive = true;
        request.requiredBy = new Date(newRequiredDate);
        request.additionalNotes = (request.additionalNotes || '') + 
            `\n[RESTORED] Request restored on ${new Date().toLocaleString()}. Reason: ${reason || 'No reason provided'}`;
        
        await request.save();
        
        res.json({
            success: true,
            message: 'Request restored successfully',
            restoredRequest: {
                id: request._id,
                patientName: request.patientName,
                bloodGroup: request.bloodGroup,
                newRequiredDate: request.requiredBy,
                status: request.status
            },
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error restoring expired request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to restore expired request',
            error: error.message
        });
    }
});

module.exports = router;