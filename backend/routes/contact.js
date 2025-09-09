/**
 * Contact Routes - Handle contact form submissions
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Contact form submission endpoint
router.post('/submit', [
    // Validation middleware
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('subject')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Subject must be between 5 and 200 characters'),
    
    body('message')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Message must be between 10 and 1000 characters')
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

        const { name, email, subject, message } = req.body;

        // Log the contact form submission (in a real app, you'd save to database or send email)
        console.log('📧 Contact Form Submission:');
        console.log('Name:', name);
        console.log('Email:', email);
        console.log('Subject:', subject);
        console.log('Message:', message);
        console.log('Timestamp:', new Date().toISOString());

        // In a real application, you would:
        // 1. Save the contact message to a database
        // 2. Send an email notification to administrators
        // 3. Send a confirmation email to the user
        
        // For now, we'll simulate a successful submission
        setTimeout(() => {
            // Simulate processing time
        }, 1000);

        res.status(200).json({
            success: true,
            message: 'Thank you for contacting us! We will get back to you soon.',
            data: {
                submittedAt: new Date().toISOString(),
                reference: `CONTACT-${Date.now()}`
            }
        });

    } catch (error) {
        console.error('Contact form submission error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your message. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get contact information endpoint
router.get('/info', (req, res) => {
    try {
        const contactInfo = {
            success: true,
            data: {
                email: 'support@bloodconnect.com',
                phone: '+1 (555) 123-4567',
                address: {
                    street: '123 Healthcare Avenue',
                    city: 'Medical City',
                    state: 'Health State',
                    zipCode: '12345',
                    country: 'Healthcare Country'
                },
                hours: {
                    monday: '9:00 AM - 6:00 PM',
                    tuesday: '9:00 AM - 6:00 PM',
                    wednesday: '9:00 AM - 6:00 PM',
                    thursday: '9:00 AM - 6:00 PM',
                    friday: '9:00 AM - 6:00 PM',
                    saturday: '10:00 AM - 4:00 PM',
                    sunday: 'Closed'
                },
                socialMedia: {
                    facebook: 'https://facebook.com/bloodconnect',
                    twitter: 'https://twitter.com/bloodconnect',
                    instagram: 'https://instagram.com/bloodconnect',
                    linkedin: 'https://linkedin.com/company/bloodconnect'
                }
            }
        };

        res.status(200).json(contactInfo);
    } catch (error) {
        console.error('Contact info error:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to retrieve contact information'
        });
    }
});

module.exports = router;
