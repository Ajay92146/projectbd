/**
 * MongoDB Atlas Database Connection Configuration
 * This file handles the connection to MongoDB Atlas database
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas database
 * Uses connection string from environment variables
 */
const connectDB = async () => {
    try {
        // Use hardcoded MongoDB URI temporarily since .env file is blocked
        const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://ajc54875:WCX8kDhsJtVxat7e@ajaykadatabase.ru1ft8v.mongodb.net/?retryWrites=true&w=majority&appName=Ajaykadatabase';
        
        // Connect to MongoDB Atlas with minimal options for compatibility
        const conn = await mongoose.connect(mongoUri);

        console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);

        // Handle connection events
        mongoose.connection.on('connected', () => {
            console.log('🔗 Mongoose connected to MongoDB Atlas');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('🔌 Mongoose disconnected from MongoDB Atlas');
        });

        // Handle application termination
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('🛑 MongoDB Atlas connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ MongoDB Atlas connection failed:', error.message);
        
        // Exit process with failure if in production
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
        
        // In development, continue without database
        console.log('⚠️  Continuing without database connection in development mode');
    }
};

/**
 * Get database connection status
 * @returns {string} Connection status
 */
const getConnectionStatus = () => {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    return states[mongoose.connection.readyState] || 'unknown';
};

/**
 * Close database connection
 */
const closeConnection = async () => {
    try {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed successfully');
    } catch (error) {
        console.error('❌ Error closing database connection:', error.message);
    }
};

module.exports = {
    connectDB,
    getConnectionStatus,
    closeConnection
};
