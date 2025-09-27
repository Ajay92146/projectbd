/**
 * Donor Routes - API endpoints for donor management
 * Handles donor registration, search, and management operations
 */

const express = require('express');
const { body, validationResult, query } = require('express-validator');
const jwt = require('jsonwebtoken');
const Donor = require('../models/Donor');
const router = express.Router();

/**
 * @route   GET /api/donors
 * @desc    Get all donors or search donors by criteria
 * @access  Public
 */
router.get('/', [
    query('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    query('city').optional().isLength({ min: 2, max: 50 }),
    query('state').optional().isLength({ min: 2, max: 50 }),
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

        const { bloodGroup, city, state, page = 1, limit = 10 } = req.query;
        
        // Build search criteria
        let searchCriteria = {
            isActive: true,
            isAvailable: true
        };

        if (bloodGroup) {
            searchCriteria.bloodGroup = bloodGroup;
        }

        if (city) {
            searchCriteria.city = new RegExp(city, 'i');
        }

        if (state) {
            searchCriteria.state = new RegExp(state, 'i');
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute search with pagination
        const donors = await Donor.find(searchCriteria)
            .select('-contactNumber -email') // Hide sensitive information
            .sort({ registrationDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const totalDonors = await Donor.countDocuments(searchCriteria);
        const totalPages = Math.ceil(totalDonors / parseInt(limit));

        res.json({
            success: true,
            message: 'Donors retrieved successfully',
            data: {
                donors,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalDonors,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching donors:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching donors',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/donors
 * @desc    Register a new donor
 * @access  Public
 */
router.post('/', [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('age')
        .isInt({ min: 18, max: 65 })
        .withMessage('Age must be between 18 and 65'),
    body('gender')
        .isIn(['Male', 'Female', 'Other'])
        .withMessage('Gender must be Male, Female, or Other'),
    body('bloodGroup')
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood group'),
    body('contactNumber')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please enter a valid 10-digit Indian mobile number'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address'),
    body('city')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('City must be between 2 and 50 characters'),
    body('state')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('State must be between 2 and 50 characters'),
    body('dateOfDonation')
        .isISO8601()
        .toDate()
        .withMessage('Please enter a valid date')
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
            name,
            age,
            gender,
            bloodGroup,
            contactNumber,
            email,
            city,
            state,
            dateOfDonation
        } = req.body;

        // Check if donor already exists with same email
        const existingDonor = await Donor.findOne({ email });
        if (existingDonor) {
            return res.status(409).json({
                success: false,
                message: 'A donor with this email already exists'
            });
        }

        // Create new donor
        const newDonor = new Donor({
            name,
            age,
            gender,
            bloodGroup,
            contactNumber,
            email,
            city,
            state,
            dateOfDonation
        });

        // Save donor to database
        const savedDonor = await newDonor.save();

        // Remove sensitive information from response
        const donorResponse = savedDonor.toObject();
        delete donorResponse.contactNumber;
        delete donorResponse.email;

        res.status(201).json({
            success: true,
            message: 'Donor registered successfully',
            data: {
                donor: donorResponse
            }
        });

    } catch (error) {
        console.error('Error registering donor:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'A donor with this email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error registering donor',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   GET /api/donors/search
 * @desc    Search donors by blood group and location
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

        // Build search criteria
        let searchCriteria = {
            bloodGroup,
            isActive: true,
            isAvailable: true
        };

        if (location) {
            searchCriteria.$or = [
                { city: new RegExp(location, 'i') },
                { state: new RegExp(location, 'i') }
            ];
        }

        // Find matching donors
        const donors = await Donor.find(searchCriteria)
            .select('name bloodGroup city state registrationDate')
            .sort({ registrationDate: -1 })
            .limit(50); // Limit results for performance

        res.json({
            success: true,
            message: `Found ${donors.length} donors matching your criteria`,
            data: {
                donors,
                searchCriteria: {
                    bloodGroup,
                    location: location || 'All locations'
                }
            }
        });

    } catch (error) {
        console.error('Error searching donors:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching donors',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   GET /api/donors/stats
 * @desc    Get donor statistics
 * @access  Public
 */
router.get('/stats', async (req, res) => {
    try {
        // Get total donors count
        const totalDonors = await Donor.countDocuments({ isActive: true });
        
        // Get available donors count
        const availableDonors = await Donor.countDocuments({ 
            isActive: true, 
            isAvailable: true 
        });

        // Get donors by blood group
        const donorsByBloodGroup = await Donor.aggregate([
            { $match: { isActive: true, isAvailable: true } },
            { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Get donors by city (top 10)
        const donorsByCity = await Donor.aggregate([
            { $match: { isActive: true, isAvailable: true } },
            { $group: { _id: '$city', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            message: 'Donor statistics retrieved successfully',
            data: {
                totalDonors,
                availableDonors,
                donorsByBloodGroup,
                donorsByCity
            }
        });

    } catch (error) {
        console.error('Error fetching donor statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching donor statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/donors/apply
 * @desc    Submit donor application
 * @access  Public/Private (optional auth)
 */
router.post('/apply', [
    // Optional auth middleware - allows both authenticated and guest users
    (req, res, next) => {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded;
                console.log('🔐 Authenticated user submitting donation:', decoded.userId);
            } catch (error) {
                console.log('⚠️ Invalid token, treating as guest user');
            }
        }
        next();
    },
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('dateOfBirth')
        .isISO8601()
        .toDate()
        .withMessage('Please enter a valid date of birth'),
    body('gender')
        .isIn(['male', 'female', 'other'])
        .withMessage('Gender must be male, female, or other'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address'),
    body('phoneNumber')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please enter a valid 10-digit Indian mobile number'),
    body('city')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('City must be between 2 and 50 characters'),
    body('state')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('State must be between 2 and 50 characters'),
    body('address')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Address must be between 5 and 200 characters'),
    body('bloodGroup')
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood group'),
    body('weight')
        .isInt({ min: 50, max: 200 })
        .withMessage('Weight must be between 50 and 200 kg'),
    body('emergencyContact')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please enter a valid 10-digit emergency contact number')
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
            firstName,
            lastName,
            dateOfBirth,
            gender,
            email,
            phoneNumber,
            city,
            state,
            address,
            bloodGroup,
            weight,
            emergencyContact
        } = req.body;

        // Check if a donor with the same email already exists
        const existingDonor = await Donor.findOne({ email });
        if (existingDonor) {
            return res.status(409).json({
                success: false,
                message: 'A donor with this email already exists'
            });
        }

        // Calculate age from date of birth
        const age = Math.floor((new Date() - new Date(dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));

        // FIXED: Create new donor with userId for proper user linking
        const newDonor = new Donor({
            // Map form fields to donor model
            name: `${firstName} ${lastName}`,
            firstName,
            lastName,
            age,
            dateOfBirth,
            gender,
            email,
            phoneNumber,
            contactNumber: phoneNumber, // Map phoneNumber to contactNumber if needed
            city,
            state,
            address,
            bloodGroup,
            weight,
            emergencyContact,
            applicationDate: new Date(),
            registrationDate: new Date(),
            isActive: true,
            isAvailable: true,
            // CRITICAL FIX: Add userId to link donation to user
            userId: req.user?.userId || null,
            userEmail: req.user?.email || email
        });

        // Save donor application to database
        const savedDonor = await newDonor.save();

        // If user is authenticated, also create a UserDonation record for tracking
        if (req.user && req.user.userId) {
            try {
                const UserDonation = require('../models/UserDonation');
                const mongoose = require('mongoose');
                
                const userDonation = new UserDonation({
                    userId: new mongoose.Types.ObjectId(req.user.userId),
                    donationDate: new Date(),
                    bloodGroup: bloodGroup,
                    unitsCollected: 1, // Default to 1 unit
                    status: 'Pending', // Application submitted, not yet donated
                    donationCenter: {
                        name: 'Blood Bank',
                        address: address,
                        city: city,
                        state: state
                    },
                    donorName: `${firstName} ${lastName}`,
                    contactNumber: phoneNumber,
                    notes: `Donor application submitted on ${new Date().toLocaleDateString()}`,
                    isActive: true
                });

                await userDonation.save();
                console.log('✅ UserDonation record created for authenticated user:', {
                    userId: req.user.userId,
                    donationId: userDonation._id,
                    bloodGroup: bloodGroup,
                    status: userDonation.status
                });
            } catch (error) {
                console.error('❌ Error creating UserDonation record:', error);
                // Don't fail the whole request if UserDonation creation fails
            }
        }

        // Remove sensitive information from response
        const donorResponse = savedDonor.toObject();
        delete donorResponse.contactNumber;
        delete donorResponse.phoneNumber;
        delete donorResponse.email;
        delete donorResponse.emergencyContact;

        res.status(201).json({
            success: true,
            message: req.user ? 
                'Donor application submitted successfully! You can track your donation in your profile.' : 
                'Donor application submitted successfully',
            data: {
                donor: donorResponse,
                userLinked: !!req.user
            }
        });

    } catch (error) {
        console.error('Error submitting donor application:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'A donor with this email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error submitting donor application',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   GET /api/donors/:id
 * @desc    Get donor details by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const donorId = req.params.id;

        // Validate ObjectId format
        if (!donorId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid donor ID format'
            });
        }

        // Find donor by ID (exclude sensitive information)
        const donor = await Donor.findById(donorId)
            .select('-contactNumber -email -emergencyContact');

        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor not found'
            });
        }

        // Check if donor is active
        if (!donor.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Donor not found'
            });
        }

        res.json({
            success: true,
            message: 'Donor details retrieved successfully',
            data: {
                donor
            }
        });

    } catch (error) {
        console.error('Error fetching donor details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching donor details',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   PUT /api/donors/:id/availability
 * @desc    Update donor availability status
 * @access  Private (donor only)
 */
router.put('/:id/availability', [
    body('isAvailable')
        .isBoolean()
        .withMessage('Availability status must be boolean')
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

        const donorId = req.params.id;
        const { isAvailable } = req.body;

        // Validate ObjectId format
        if (!donorId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid donor ID format'
            });
        }

        // Update donor availability
        const updatedDonor = await Donor.findByIdAndUpdate(
            donorId,
            { 
                isAvailable,
                updatedAt: new Date()
            },
            { new: true }
        ).select('-contactNumber -email -emergencyContact');

        if (!updatedDonor) {
            return res.status(404).json({
                success: false,
                message: 'Donor not found'
            });
        }

        res.json({
            success: true,
            message: `Donor availability updated to ${isAvailable ? 'available' : 'unavailable'}`,
            data: {
                donor: updatedDonor
            }
        });

    } catch (error) {
        console.error('Error updating donor availability:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating donor availability',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;