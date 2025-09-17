/**
 * Blood Request Routes - API endpoints for blood request management
 * Handles blood request creation, search, and management operations
 */

const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Request = require('../models/Request');
const Donor = require('../models/Donor');
const router = express.Router();

/**
 * @route   GET /api/requests
 * @desc    Get all blood requests or search by criteria
 * @access  Public
 */
router.get('/', [
    query('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    query('location').optional().isLength({ min: 2, max: 100 }),
    query('status').optional().isIn(['Pending', 'In Progress', 'Fulfilled', 'Cancelled', 'Expired']),
    query('urgency').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: errors.array()
            });
        }

        const { bloodGroup, location, status, urgency, page = 1, limit = 10 } = req.query;
        
        // Build search criteria
        let searchCriteria = {
            isActive: true
        };

        if (bloodGroup) {
            searchCriteria.bloodGroup = bloodGroup;
        }

        if (location) {
            searchCriteria.location = new RegExp(location, 'i');
        }

        if (status) {
            searchCriteria.status = status;
        } else {
            // Default to active requests only
            searchCriteria.status = { $in: ['Pending', 'In Progress'] };
        }

        if (urgency) {
            searchCriteria.urgency = urgency;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute search with pagination
        const requests = await Request.find(searchCriteria)
            .select('-contactNumber') // Hide sensitive information
            .sort({ urgency: -1, requiredBy: 1, requestDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const totalRequests = await Request.countDocuments(searchCriteria);
        const totalPages = Math.ceil(totalRequests / parseInt(limit));

        res.json({
            success: true,
            message: 'Blood requests retrieved successfully',
            data: {
                requests,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalRequests,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching blood requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching blood requests',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/requests
 * @desc    Create a new blood request
 * @access  Public/Private (optional auth)
 */
router.post('/', [
    // Optional auth middleware - allows both authenticated and guest users
    (req, res, next) => {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded;
                console.log('🔐 Authenticated user submitting blood request:', decoded.userId);
            } catch (error) {
                console.log('⚠️ Invalid token, treating as guest user');
            }
        }
        next();
    },
    body('patientName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Patient name must be between 2 and 100 characters'),
    body('bloodGroup')
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood group'),
    body('requiredUnits')
        .isInt({ min: 1, max: 10 })
        .withMessage('Required units must be between 1 and 10'),
    body('hospitalName')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Hospital name must be between 2 and 200 characters'),
    body('location')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Location must be between 2 and 200 characters'),
    body('contactNumber')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please enter a valid 10-digit Indian mobile number'),
    body('urgency')
        .optional()
        .isIn(['Low', 'Medium', 'High', 'Critical'])
        .withMessage('Urgency must be Low, Medium, High, or Critical'),
    body('requiredBy')
        .isISO8601()
        .toDate()
        .withMessage('Please enter a valid required by date'),
    body('additionalNotes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Additional notes cannot exceed 500 characters'),
    body('contactPersonName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Contact person name cannot exceed 100 characters'),
    body('relationship')
        .optional()
        .isIn(['Self', 'Family', 'Friend', 'Doctor', 'Hospital Staff', 'Other'])
        .withMessage('Invalid relationship')
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

        const {
            patientName,
            bloodGroup,
            requiredUnits,
            hospitalName,
            location,
            contactNumber,
            urgency = 'Medium',
            requiredBy,
            additionalNotes,
            contactPersonName,
            relationship = 'Family'
        } = req.body;

        // Validate required by date is not in the past
        if (new Date(requiredBy) <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Required by date must be in the future'
            });
        }

        // Create new blood request
        const newRequest = new Request({
            patientName,
            bloodGroup,
            requiredUnits,
            hospitalName,
            location,
            contactNumber,
            urgency,
            requiredBy,
            additionalNotes,
            contactPersonName,
            relationship,
            // Add user identification for authenticated users
            ...(req.user && req.user.userId && {
                userId: req.user.userId,
                userEmail: req.user.email
            })
        });

        // Save request to database
        const savedRequest = await newRequest.save();

        // If user is authenticated, also create a UserRequest record
        if (req.user && req.user.userId) {
            try {
                const UserRequest = require('../models/UserRequest');

                // Map relationship to valid enum values
                const validRelationships = ['Self', 'Parent', 'Child', 'Spouse', 'Sibling', 'Relative', 'Friend', 'Other'];
                const mappedRelationship = validRelationships.includes(relationship) ? relationship : 'Other';

                const userRequest = new UserRequest({
                    userId: req.user.userId,
                    patientName: patientName,
                    patientAge: 25, // Default age - could be enhanced to collect this
                    patientGender: 'Other', // Default - could be enhanced to collect this
                    relationship: mappedRelationship,
                    bloodGroup: bloodGroup,
                    requiredUnits: requiredUnits,
                    urgency: urgency,
                    hospitalName: hospitalName,
                    hospitalAddress: location,
                    contactNumber: contactNumber,
                    requestDate: new Date(),
                    requiredBy: new Date(requiredBy),
                    status: 'Pending',
                    requestId: savedRequest._id, // Link to the main request
                    additionalNotes: additionalNotes || `Request submitted on ${new Date().toLocaleDateString()}`,
                    isActive: true
                });

                await userRequest.save();
                console.log('✅ UserRequest record created for authenticated user');
            } catch (error) {
                console.error('❌ Error creating UserRequest record:', error);
                console.error('❌ UserRequest validation error details:', error.message);
                // Don't fail the whole request if UserRequest creation fails
            }
        }

        // Find potential donors in the same location
        const potentialDonors = await Donor.findByBloodGroupAndLocation(
            bloodGroup,
            location.split(',')[0].trim(), // Extract city from location
            location.split(',')[1]?.trim() || '' // Extract state if available
        ).limit(10);

        res.status(201).json({
            success: true,
            message: req.user ?
                'Blood request created successfully! You can track your request in your profile.' :
                'Blood request created successfully',
            data: {
                request: savedRequest,
                potentialDonors: potentialDonors.length,
                suggestedDonors: potentialDonors.map(donor => ({
                    name: donor.name,
                    bloodGroup: donor.bloodGroup,
                    city: donor.city,
                    state: donor.state
                })),
                userLinked: !!req.user
            }
        });

    } catch (error) {
        console.error('Error creating blood request:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating blood request',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   GET /api/requests/search
 * @desc    Search blood requests by blood group and location
 * @access  Public
 */
router.get('/search', [
    query('bloodGroup')
        .notEmpty()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Valid blood group is required'),
    query('location')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Location must be between 2 and 100 characters')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid search parameters',
                errors: errors.array()
            });
        }

        const { bloodGroup, location } = req.query;

        // Use the static method to find active requests
        let requests;
        if (location) {
            requests = await Request.findActiveByBloodGroupAndLocation(bloodGroup, location);
        } else {
            requests = await Request.find({
                bloodGroup,
                status: { $in: ['Pending', 'In Progress'] },
                isActive: true,
                requiredBy: { $gte: new Date() }
            }).sort({ urgency: -1, requiredBy: 1 });
        }

        res.json({
            success: true,
            message: `Found ${requests.length} blood requests matching your criteria`,
            data: {
                requests,
                searchCriteria: {
                    bloodGroup,
                    location: location || 'All locations'
                }
            }
        });

    } catch (error) {
        console.error('Error searching blood requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching blood requests',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});



/**
 * @route   GET /api/requests/stats
 * @desc    Get blood request statistics
 * @access  Public
 */
router.get('/stats', async (req, res) => {
    try {
        // Get total requests count
        const totalRequests = await Request.countDocuments({ isActive: true });
        
        // Get pending requests count
        const pendingRequests = await Request.countDocuments({ 
            status: 'Pending',
            isActive: true 
        });

        // Get urgent requests count
        const urgentRequests = await Request.countDocuments({
            urgency: { $in: ['High', 'Critical'] },
            status: { $in: ['Pending', 'In Progress'] },
            isActive: true
        });

        // Get requests by blood group
        const requestsByBloodGroup = await Request.aggregate([
            { $match: { isActive: true, status: { $in: ['Pending', 'In Progress'] } } },
            { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Get requests by urgency
        const requestsByUrgency = await Request.aggregate([
            { $match: { isActive: true, status: { $in: ['Pending', 'In Progress'] } } },
            { $group: { _id: '$urgency', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            message: 'Blood request statistics retrieved successfully',
            data: {
                totalRequests,
                pendingRequests,
                urgentRequests,
                requestsByBloodGroup,
                requestsByUrgency
            }
        });

    } catch (error) {
        console.error('Error fetching request statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching request statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   GET /api/requests/urgent
 * @desc    Get urgent blood requests (High and Critical priority)
 * @access  Public
 */
router.get('/urgent', async (req, res) => {
    try {
        // Find urgent requests (High and Critical urgency)
        const urgentRequests = await Request.find({
            urgency: { $in: ['High', 'Critical'] },
            status: { $in: ['Pending', 'In Progress'] },
            isActive: true,
            requiredBy: { $gte: new Date() } // Not expired
        })
        .select('patientName bloodGroup requiredUnits hospitalName location urgency requiredBy additionalNotes contactPersonName relationship requestDate')
        .sort({ urgency: -1, requiredBy: 1 })
        .limit(10); // Limit to 10 most urgent

        // Add calculated fields
        const enrichedRequests = urgentRequests.map(request => {
            const daysLeft = Math.ceil((request.requiredBy - new Date()) / (1000 * 60 * 60 * 24));
            return {
                ...request.toObject(),
                daysLeft,
                isEmergency: request.urgency === 'Critical' || daysLeft <= 1,
                timeAgo: getTimeAgo(request.requestDate)
            };
        });

        res.json({
            success: true,
            message: 'Urgent blood requests retrieved successfully',
            data: {
                urgentRequests: enrichedRequests,
                totalUrgent: urgentRequests.length,
                emergencyCount: enrichedRequests.filter(req => req.isEmergency).length
            }
        });

    } catch (error) {
        console.error('Error fetching urgent blood requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching urgent blood requests',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   GET /api/requests/emergency
 * @desc    Get emergency blood requests (Critical urgency or expiring within 24 hours)
 * @access  Public
 */
router.get('/emergency', async (req, res) => {
    try {
        const now = new Date();
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Find emergency requests
        const emergencyRequests = await Request.find({
            $or: [
                { urgency: 'Critical' },
                { requiredBy: { $lte: twentyFourHoursFromNow } }
            ],
            status: { $in: ['Pending', 'In Progress'] },
            isActive: true,
            requiredBy: { $gte: now } // Not expired
        })
        .select('patientName bloodGroup requiredUnits hospitalName location urgency requiredBy additionalNotes contactPersonName relationship requestDate')
        .sort({ urgency: -1, requiredBy: 1 })
        .limit(5); // Limit to 5 most critical

        // Add calculated fields
        const enrichedRequests = emergencyRequests.map(request => {
            const hoursLeft = Math.ceil((request.requiredBy - now) / (1000 * 60 * 60));
            const daysLeft = Math.ceil(hoursLeft / 24);
            return {
                ...request.toObject(),
                hoursLeft,
                daysLeft,
                isCritical: request.urgency === 'Critical',
                isExpiringSoon: hoursLeft <= 24,
                timeAgo: getTimeAgo(request.requestDate)
            };
        });

        res.json({
            success: true,
            message: 'Emergency blood requests retrieved successfully',
            data: {
                emergencyRequests: enrichedRequests,
                totalEmergency: emergencyRequests.length,
                criticalCount: enrichedRequests.filter(req => req.isCritical).length,
                expiringSoonCount: enrichedRequests.filter(req => req.isExpiringSoon).length
            }
        });

    } catch (error) {
        console.error('Error fetching emergency blood requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching emergency blood requests',
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
