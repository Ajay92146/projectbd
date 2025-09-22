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
        .withMessage('Please enter a valid emergency contact number'),
    body('preferredDate')
        .isISO8601()
        .toDate()
        .withMessage('Please enter a valid preferred donation date'),
    body('preferredTime')
        .isIn(['morning', 'afternoon', 'evening'])
        .withMessage('Preferred time must be morning, afternoon, or evening'),
    body('healthConsent')
        .isBoolean()
        .withMessage('Health consent is required'),
    body('dataConsent')
        .isBoolean()
        .withMessage('Data consent is required'),
    body('contactConsent')
        .isBoolean()
        .withMessage('Contact consent is required')
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
            medicalHistory,
            lastDonation,
            emergencyContact,
            preferredDate,
            preferredTime,
            availability,
            healthConsent,
            dataConsent,
            contactConsent
        } = req.body;

        // Check if application already exists with same email
        const existingApplication = await Donor.findOne({ email });
        if (existingApplication) {
            return res.status(409).json({
                success: false,
                message: 'An application with this email already exists'
            });
        }

        // Calculate age from date of birth
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        // Check age eligibility
        if (age < 18 || age > 65) {
            return res.status(400).json({
                success: false,
                message: 'Age must be between 18 and 65 years for blood donation'
            });
        }

        // Create new donor application
        const newApplication = new Donor({
            name: `${firstName} ${lastName}`,
            age,
            gender: gender.charAt(0).toUpperCase() + gender.slice(1),
            bloodGroup,
            contactNumber: phoneNumber,
            email,
            city,
            state,
            dateOfDonation: preferredDate,
            // Additional fields for application
            address,
            weight,
            medicalHistory: medicalHistory || '',
            lastDonation: lastDonation || null,
            emergencyContact,
            preferredTime,
            availability: availability || '',
            consents: {
                health: healthConsent,
                data: dataConsent,
                contact: contactConsent
            },
            applicationStatus: 'pending',
            applicationDate: new Date()
        });

        // Save application to database
        const savedApplication = await newApplication.save();

        // If user is authenticated, also create a UserDonation record
        if (req.user && req.user.userId) {
            try {
                const UserDonation = require('../models/UserDonation');

                const userDonation = new UserDonation({
                    userId: req.user.userId,
                    donationDate: preferredDate,
                    bloodGroup: bloodGroup,
                    unitsCollected: 1, // Default to 1 unit
                    donationCenter: {
                        name: 'Blood Connect Center',
                        address: `${city}, ${state}`,
                        contactNumber: '1800-BLOOD-1'
                    },
                    status: 'Scheduled', // Will be updated when donation is completed
                    applicationId: savedApplication._id, // Link to the application
                    notes: `Application submitted on ${new Date().toLocaleDateString()}`
                });

                await userDonation.save();
                console.log('✅ UserDonation record created for authenticated user');
            } catch (error) {
                console.error('❌ Error creating UserDonation record:', error);
                // Don't fail the whole request if UserDonation creation fails
            }
        }

        // Remove sensitive information from response
        const applicationResponse = savedApplication.toObject();
        delete applicationResponse.contactNumber;
        delete applicationResponse.email;
        delete applicationResponse.emergencyContact;

        res.status(201).json({
            success: true,
            message: req.user ?
                'Donor application submitted successfully! You can track your donation in your profile.' :
                'Donor application submitted successfully! You will be contacted within 2-3 business days.',
            data: {
                application: applicationResponse,
                applicationId: savedApplication._id,
                userLinked: !!req.user
            }
        });

    } catch (error) {
        console.error('Error submitting donor application:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting donor application',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;
