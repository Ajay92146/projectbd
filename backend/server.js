/**
 * Blood Donation Website - Main Server File
 * This file sets up the Express server and handles all routing
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import database connection
const { connectDB } = require('./config/database');

// Import routes
const donorRoutes = require('./routes/donors');
const requestRoutes = require('./routes/requests');
const authRoutes = require('./routes/auth');
const userProfileRoutes = require('./routes/userProfile');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');
const statsRoutes = require('./routes/stats');
const expirationRoutes = require('./routes/expiration');
const locationRoutes = require('./routes/location');
const emergencyRoutes = require('./routes/emergency');
// const bloodBankRoutes = require('../routes/bloodBank');

// Import services
const requestExpirationService = require('./services/requestExpirationService');

// Initialize Express app
const app = express();

// Connect to MongoDB Atlas
connectDB();

// Middleware
// Configure helmet with relaxed CSP for admin pages
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
        },
    },
}));
app.use(morgan('combined')); // Logging

// CORS Configuration - Enhanced for development and production
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
            console.log('✅ CORS: Allowing request with no origin');
            return callback(null, true);
        }

        // Development origins
        const developmentOrigins = [
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://localhost:3002',
            'http://127.0.0.1:3002',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ];

        // Production origins from environment variable
        const productionOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [];
        
        // Add known production domains
        const knownProductionOrigins = [
            'https://blood-donation-website5.onrender.com',
            'https://blood-donation-website.onrender.com'
        ];

        // Add flexible Render domain pattern
        const isRenderDomain = origin && origin.includes('.onrender.com');

        const allowedOrigins = [...developmentOrigins, ...productionOrigins, ...knownProductionOrigins];
        
        console.log(`🌐 CORS: Request from origin: ${origin}`);
        console.log(`🌐 CORS: Allowed origins:`, allowedOrigins);
        console.log(`🌐 CORS: Is Render domain:`, isRenderDomain);

        if (allowedOrigins.indexOf(origin) !== -1 || isRenderDomain) {
            console.log(`✅ CORS: Origin ${origin} is allowed`);
            callback(null, true);
        } else {
            console.warn(`❌ CORS: Origin ${origin} is blocked`);
            callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-admin-email', 'X-Admin-Email', 'x-admin-auth', 'X-Admin-Auth'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Fix MIME types for static files - ADD THIS BEFORE STATIC FILE SERVING
app.use((req, res, next) => {
    if (req.path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
    } else if (req.path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
    }
    next();
});

// Serve static files from backend/frontend directory
app.use('/backend/frontend', express.static(path.join(__dirname, 'frontend'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// API Routes (MUST come before static files)
console.log('🔧 Loading API routes...');
app.use('/api/donors', donorRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', userProfileRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/external', require('./routes/external-config'));
app.use('/api/expiration', expirationRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/emergency', emergencyRoutes);
// app.use('/api/bloodbank', bloodBankRoutes);
console.log('✅ API routes loaded successfully');

// Serve static files from frontend directory (AFTER API routes)
app.use(express.static(path.join(__dirname, '../frontend'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
        // Force fresh loads for profile assets to avoid serving stale cached files
        if (filePath.endsWith('/profile.html') || filePath.endsWith('/profile.js')) {
            res.setHeader('Cache-Control', 'no-store');
        }
    }
}));

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/donate', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/donate.html'));
});

app.get('/request', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/request.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/contact.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/profile', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, '../frontend/profile.html'));
});

app.get('/profile-test', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, '../frontend/profile-test.html'));
});

app.get('/admin-login', (req, res) => {
    console.log('📋 Admin login page requested');
    console.log('Origin:', req.headers.origin);
    console.log('Referer:', req.headers.referer);
    res.sendFile(path.join(__dirname, '../frontend/admin-login.html'));
});

app.get('/admin-dashboard', (req, res) => {
    console.log('📊 Admin dashboard page requested');
    console.log('Origin:', req.headers.origin);
    console.log('Referer:', req.headers.referer);
    console.log('User-Agent:', req.headers['user-agent']);
    res.sendFile(path.join(__dirname, '../frontend/admin-dashboard.html'));
});

// Add debug routes
app.get('/admin-login-debug', (req, res) => {
    console.log('🔧 Admin login debug page requested');
    res.sendFile(path.join(__dirname, '../frontend/admin-login-debug.html'));
});

app.get('/simple-admin-login', (req, res) => {
    console.log('🔑 Simple admin login page requested');
    res.sendFile(path.join(__dirname, '../frontend/simple-admin-login.html'));
});

app.get('/production-admin-test', (req, res) => {
    console.log('🧪 Production admin test page requested');
    res.sendFile(path.join(__dirname, '../frontend/production-admin-test.html'));
});

app.get('/admin-dashboard-csp-fixed', (req, res) => {
    console.log('🔧 CSP-fixed admin dashboard requested');
    res.sendFile(path.join(__dirname, '../frontend/admin-dashboard-csp-fixed.html'));
});

app.get('/blood-bank-login', (req, res) => {
    console.log('🏦 Blood bank login page requested');
    res.sendFile(path.join(__dirname, '../frontend/blood-bank-login.html'));
});

app.get('/blood-bank-register', (req, res) => {
    console.log('🏦 Blood bank register page requested');
    res.sendFile(path.join(__dirname, '../frontend/blood-bank-register.html'));
});

app.get('/blood-bank-dashboard', (req, res) => {
    console.log('🏦 Blood bank dashboard requested');
    res.sendFile(path.join(__dirname, '../frontend/blood-bank-dashboard.html'));
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API is working!',
        timestamp: new Date().toISOString()
    });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
    console.log('🌐 CORS Test: Request headers:', req.headers);
    console.log('🌐 CORS Test: Origin:', req.headers.origin);
    console.log('🌐 CORS Test: Referer:', req.headers.referer);
    
    res.json({
        success: true,
        message: 'CORS test successful!',
        origin: req.headers.origin,
        referer: req.headers.referer,
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Blood Donation API is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.originalUrl
    });
});

// 404 handler for all other routes (but not API routes or static files)
app.use('*', (req, res) => {
    // Don't serve HTML for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            error: 'API endpoint not found',
            path: req.originalUrl
        });
    }
    
    // Don't serve HTML for static files
    if (req.path.endsWith('.js') || req.path.endsWith('.css') || req.path.endsWith('.png') || req.path.endsWith('.jpg') || req.path.endsWith('.ico')) {
        return res.status(404).send('File not found');
    }
    
    // Serve frontend for non-API routes
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Global Error Handler:', err.stack);
    
    // Handle CORS errors specifically
    if (err.message && err.message.includes('CORS')) {
        console.error('🌐 CORS Error:', err.message);
        return res.status(403).json({
            success: false,
            error: 'CORS Error',
            message: 'Cross-origin request blocked. Please check your CORS configuration.',
            details: process.env.NODE_ENV === 'development' ? err.message : 'CORS policy violation'
        });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
        console.error('📝 Validation Error:', err.message);
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: 'Data validation failed',
            details: process.env.NODE_ENV === 'development' ? err.message : 'Invalid data format'
        });
    }
    
    // Handle other errors
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Something went wrong on the server',
        details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 3002;
console.log('Environment PORT:', process.env.PORT);
console.log('Using PORT:', PORT);
app.listen(PORT, () => {
    console.log(`🩸 Blood Donation Server running on port ${PORT}`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    
    // Start the request expiration service
    console.log('🕐 Starting request expiration service...');
    requestExpirationService.start();
    console.log('✅ Request expiration service started successfully');
});

module.exports = app;