/**
 * Logger utility using Winston
 * Provides secure logging for the BloodConnect application
 */

const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'bloodconnect-api' },
    transports: [
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({ 
            filename: path.join(logsDir, 'error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        
        // Write all logs with level 'info' and below to combined.log
        new winston.transports.File({ 
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        
        // Write all logs to console in development
        ...(process.env.NODE_ENV !== 'production' ? [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })
        ] : [])
    ]
});

// Security: Filter sensitive information from logs
const sensitiveFields = ['password', 'token', 'authorization', 'cookie'];

function sanitizeLogData(data) {
    if (typeof data !== 'object' || data === null) {
        return data;
    }
    
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }
    
    return sanitized;
}

// Enhanced logging methods
const secureLogger = {
    error: (message, meta = {}) => {
        logger.error(message, sanitizeLogData(meta));
    },
    
    warn: (message, meta = {}) => {
        logger.warn(message, sanitizeLogData(meta));
    },
    
    info: (message, meta = {}) => {
        logger.info(message, sanitizeLogData(meta));
    },
    
    debug: (message, meta = {}) => {
        logger.debug(message, sanitizeLogData(meta));
    },
    
    // Special method for authentication events
    auth: (event, userId, meta = {}) => {
        logger.info(`AUTH_EVENT: ${event}`, {
            userId,
            timestamp: new Date().toISOString(),
            ...sanitizeLogData(meta)
        });
    },
    
    // Special method for security events
    security: (event, meta = {}) => {
        logger.warn(`SECURITY_EVENT: ${event}`, {
            timestamp: new Date().toISOString(),
            ...sanitizeLogData(meta)
        });
    }
};

module.exports = secureLogger;
