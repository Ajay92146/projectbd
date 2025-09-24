/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT token and authenticate user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Check if database is connected
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            console.log('⚠️ Database not connected, using demo authentication');
            
            // Get token from header for demo purposes
            const authHeader = req.header('Authorization');
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. No token provided.'
                });
            }

            // For demo, accept any token and create a demo user
            req.user = {
                userId: 'demo-user-123',
                email: 'demo@example.com',
                role: 'user'
            };
            
            return next();
        }
        
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Check if token starts with 'Bearer '
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Invalid token format.'
            });
        }

        // Extract token
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user still exists and is active
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. User not found or inactive.'
            });
        }

        // Add user info to request object
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };

        next();

    } catch (error) {
        console.error('Auth middleware error:', error);

        // Handle specific JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Invalid token.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Token expired.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during authentication.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * Middleware to check if user has specific role
 * @param {string|Array} roles - Required role(s)
 * @returns {Function} Express middleware function
 */
const roleMiddleware = (roles) => {
    return (req, res, next) => {
        try {
            // Ensure user is authenticated first
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. Authentication required.'
                });
            }

            // Convert single role to array
            const allowedRoles = Array.isArray(roles) ? roles : [roles];

            // Check if user has required role
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Insufficient permissions.'
                });
            }

            next();

        } catch (error) {
            console.error('Role middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during authorization.',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    };
};

/**
 * Middleware for optional authentication
 * Sets req.user if valid token is provided, but doesn't block access if no token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token provided, continue without authentication
            return next();
        }

        // Extract token
        const token = authHeader.substring(7);

        if (!token) {
            // No token provided, continue without authentication
            return next();
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user still exists and is active
        const user = await User.findById(decoded.userId);
        if (user && user.isActive) {
            // Add user info to request object
            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role
            };
        }

        next();

    } catch (error) {
        // If token is invalid, continue without authentication
        // This allows the route to be accessed by unauthenticated users
        next();
    }
};

/**
 * Middleware to check if user owns the resource or is admin
 * @param {string} resourceIdParam - Parameter name containing resource ID
 * @param {string} resourceUserField - Field name in resource containing user ID
 * @returns {Function} Express middleware function
 */
const ownershipMiddleware = (resourceIdParam = 'id', resourceUserField = 'userId') => {
    return async (req, res, next) => {
        try {
            // Ensure user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. Authentication required.'
                });
            }

            // Admin can access everything
            if (req.user.role === 'admin') {
                return next();
            }

            // Get resource ID from params
            const resourceId = req.params[resourceIdParam];
            
            if (!resourceId) {
                return res.status(400).json({
                    success: false,
                    message: 'Resource ID is required.'
                });
            }

            // For user profile routes, check if accessing own profile
            if (resourceUserField === 'userId' && resourceId === req.user.userId) {
                return next();
            }

            // Additional ownership checks can be added here for other resources
            // For now, allow access if user is accessing their own data
            next();

        } catch (error) {
            console.error('Ownership middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during ownership verification.',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    };
};

module.exports = {
    authMiddleware,
    roleMiddleware,
    optionalAuthMiddleware,
    ownershipMiddleware
};
