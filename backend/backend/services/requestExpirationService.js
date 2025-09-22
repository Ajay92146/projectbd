/**
 * Request Expiration Service
 * Automatically handles expiration of blood requests after their required date
 */

const Request = require('../models/Request');
const logger = require('../utils/logger');

class RequestExpirationService {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
        this.lastCheckTime = null;
        this.expiredCount = 0;
        this.cleanupCount = 0;
        
        console.log('🕐 Request Expiration Service initialized');
    }
    
    /**
     * Start the automatic expiration service
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ Request expiration service is already running');
            return;
        }
        
        this.isRunning = true;
        console.log('🚀 Starting request expiration service...');
        
        // Run immediately on start
        this.checkExpiredRequests();
        
        // Set up interval to check every 5 minutes
        this.intervalId = setInterval(() => {
            this.checkExpiredRequests();
        }, this.checkInterval);
        
        console.log(`✅ Request expiration service started (checking every ${this.checkInterval / 1000 / 60} minutes)`);
        
        // Log service status every hour
        setInterval(() => {
            this.logServiceStatus();
        }, 60 * 60 * 1000); // Every hour
    }
    
    /**
     * Stop the automatic expiration service
     */
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ Request expiration service is not running');
            return;
        }
        
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        console.log('🛑 Request expiration service stopped');
    }
    
    /**
     * Check for and handle expired requests
     */
    async checkExpiredRequests() {
        try {
            const startTime = Date.now();
            const currentTime = new Date();
            this.lastCheckTime = currentTime;
            
            console.log('🔍 Checking for expired blood requests...');
            
            // Find requests that are expired but still active/pending
            const expiredRequests = await Request.find({
                requiredBy: { $lt: currentTime },
                status: { $in: ['Pending', 'In Progress'] },
                isActive: true
            });
            
            if (expiredRequests.length === 0) {
                console.log('✅ No expired requests found');
                return { expiredCount: 0, updated: [] };
            }
            
            console.log(`⏰ Found ${expiredRequests.length} expired requests`);
            
            const updatedRequests = [];
            let updateCount = 0;
            
            // Update each expired request
            for (const request of expiredRequests) {
                try {
                    // Calculate how many days overdue
                    const daysOverdue = Math.ceil((currentTime - request.requiredBy) / (1000 * 60 * 60 * 24));
                    
                    const additionalNotesUpdate = (request.additionalNotes || '') + 
                        `\n[AUTO-EXPIRED] Request expired ${daysOverdue} day(s) ago on ${currentTime.toLocaleString()}`;
                    
                    // Use findByIdAndUpdate to bypass schema validation
                    const updatedRequest = await Request.findByIdAndUpdate(
                        request._id,
                        {
                            status: 'Expired',
                            isActive: false,
                            additionalNotes: additionalNotesUpdate
                        },
                        {
                            new: true,
                            runValidators: false // Bypass validation for expired requests
                        }
                    );
                    
                    if (!updatedRequest) {
                        console.error(`❌ Request ${request._id} not found during update`);
                        continue;
                    }
                    
                    updateCount++;
                    
                    updatedRequests.push({
                        id: updatedRequest._id,
                        patientName: updatedRequest.patientName,
                        bloodGroup: updatedRequest.bloodGroup,
                        hospitalName: updatedRequest.hospitalName,
                        requiredBy: updatedRequest.requiredBy,
                        daysOverdue: daysOverdue,
                        urgency: updatedRequest.urgency
                    });
                    
                    // Log the expiration
                    logger.info('REQUEST_EXPIRED', {
                        requestId: updatedRequest._id,
                        patientName: updatedRequest.patientName,
                        bloodGroup: updatedRequest.bloodGroup,
                        hospitalName: updatedRequest.hospitalName,
                        requiredBy: updatedRequest.requiredBy,
                        daysOverdue: daysOverdue,
                        urgency: updatedRequest.urgency
                    });
                    
                    console.log(`📋 Expired: ${updatedRequest.patientName} (${updatedRequest.bloodGroup}) - ${daysOverdue} days overdue`);
                    
                } catch (updateError) {
                    console.error(`❌ Failed to update expired request ${request._id}:`, updateError.message);
                    logger.error('REQUEST_EXPIRATION_UPDATE_FAILED', {
                        requestId: request._id,
                        error: updateError.message
                    });
                }
            }
            
            this.expiredCount += updateCount;
            const executionTime = Date.now() - startTime;
            
            console.log(`✅ Successfully expired ${updateCount} requests in ${executionTime}ms`);
            
            // Log summary if any requests were expired
            if (updateCount > 0) {
                logger.info('REQUEST_EXPIRATION_BATCH_COMPLETED', {
                    totalExpired: updateCount,
                    executionTime: executionTime,
                    requests: updatedRequests
                });
            }
            
            return {
                expiredCount: updateCount,
                updated: updatedRequests,
                executionTime: executionTime
            };
            
        } catch (error) {
            console.error('❌ Error checking expired requests:', error.message);
            logger.error('REQUEST_EXPIRATION_CHECK_FAILED', {
                error: error.message,
                stack: error.stack
            });
            
            return {
                expiredCount: 0,
                error: error.message
            };
        }
    }
    
    /**
     * Clean up old expired requests (soft delete after 30 days)
     */
    async cleanupOldExpiredRequests() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            console.log('🧹 Cleaning up old expired requests...');
            
            // Find expired requests older than 30 days
            const oldExpiredRequests = await Request.find({
                status: 'Expired',
                requiredBy: { $lt: thirtyDaysAgo },
                isActive: false
            });
            
            if (oldExpiredRequests.length === 0) {
                console.log('✅ No old expired requests to clean up');
                return { cleanedCount: 0 };
            }
            
            console.log(`🗑️ Found ${oldExpiredRequests.length} old expired requests to clean up`);
            
            // You can choose to either delete them or mark them differently
            // For now, let's add a cleanup flag instead of deleting
            const result = await Request.updateMany(
                {
                    status: 'Expired',
                    requiredBy: { $lt: thirtyDaysAgo },
                    isActive: false
                },
                {
                    $set: {
                        cleanedUp: true,
                        cleanupDate: new Date()
                    }
                }
            );
            
            this.cleanupCount += result.modifiedCount;
            
            console.log(`✅ Cleaned up ${result.modifiedCount} old expired requests`);
            
            logger.info('REQUEST_CLEANUP_COMPLETED', {
                cleanedCount: result.modifiedCount,
                cutoffDate: thirtyDaysAgo
            });
            
            return {
                cleanedCount: result.modifiedCount
            };
            
        } catch (error) {
            console.error('❌ Error cleaning up old requests:', error.message);
            logger.error('REQUEST_CLEANUP_FAILED', {
                error: error.message
            });
            
            return {
                cleanedCount: 0,
                error: error.message
            };
        }
    }
    
    /**
     * Manual expiration check (for API endpoint)
     */
    async manualExpirationCheck() {
        console.log('🔧 Manual expiration check triggered');
        return await this.checkExpiredRequests();
    }
    
    /**
     * Get service statistics
     */
    getServiceStats() {
        return {
            isRunning: this.isRunning,
            lastCheckTime: this.lastCheckTime,
            totalExpiredCount: this.expiredCount,
            totalCleanupCount: this.cleanupCount,
            checkInterval: this.checkInterval,
            nextCheckIn: this.isRunning ? 
                Math.max(0, this.checkInterval - (Date.now() - (this.lastCheckTime?.getTime() || 0))) : null
        };
    }
    
    /**
     * Log service status
     */
    logServiceStatus() {
        const stats = this.getServiceStats();
        console.log('📊 Request Expiration Service Status:', {
            isRunning: stats.isRunning,
            totalExpired: stats.totalExpiredCount,
            totalCleaned: stats.totalCleanupCount,
            lastCheck: stats.lastCheckTime?.toLocaleString() || 'Never'
        });
        
        logger.info('REQUEST_EXPIRATION_SERVICE_STATUS', stats);
    }
    
    /**
     * Force cleanup of old requests
     */
    async forceCleanup() {
        console.log('🧹 Force cleanup triggered');
        return await this.cleanupOldExpiredRequests();
    }
    
    /**
     * Get expired requests summary
     */
    async getExpiredRequestsSummary() {
        try {
            const expiredRequests = await Request.find({
                status: 'Expired',
                isActive: false
            }).select('patientName bloodGroup hospitalName requiredBy urgency');
            
            const summary = {
                totalExpired: expiredRequests.length,
                byBloodGroup: {},
                byUrgency: {},
                recentExpired: expiredRequests
                    .filter(req => req.requiredBy > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
                    .length
            };
            
            // Group by blood group
            expiredRequests.forEach(req => {
                summary.byBloodGroup[req.bloodGroup] = (summary.byBloodGroup[req.bloodGroup] || 0) + 1;
                summary.byUrgency[req.urgency] = (summary.byUrgency[req.urgency] || 0) + 1;
            });
            
            return summary;
            
        } catch (error) {
            console.error('❌ Error getting expired requests summary:', error.message);
            return {
                totalExpired: 0,
                error: error.message
            };
        }
    }
}

// Create singleton instance
const requestExpirationService = new RequestExpirationService();

module.exports = requestExpirationService;