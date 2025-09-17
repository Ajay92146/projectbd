/**
 * Auto-Refresh Service for Admin Dashboard
 * Automatically refreshes request data when requests expire
 */

class AutoRefreshService {
    constructor() {
        this.refreshInterval = 30000; // 30 seconds
        this.isRunning = false;
        this.intervalId = null;
        this.lastRefreshTime = null;
        this.expirationCheckInterval = 5 * 60 * 1000; // 5 minutes
        this.expirationIntervalId = null;
        
        console.log('🔄 Auto-refresh service initialized');
        
        // Bind methods to maintain context
        this.refreshRequestData = this.refreshRequestData.bind(this);
        this.checkExpirations = this.checkExpirations.bind(this);
    }
    
    /**
     * Start auto-refresh service
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ Auto-refresh service is already running');
            return;
        }
        
        this.isRunning = true;
        console.log('🚀 Starting auto-refresh service...');
        
        // Start regular refresh
        this.intervalId = setInterval(this.refreshRequestData, this.refreshInterval);
        
        // Start expiration checking
        this.expirationIntervalId = setInterval(this.checkExpirations, this.expirationCheckInterval);
        
        console.log(`✅ Auto-refresh started (every ${this.refreshInterval / 1000} seconds)`);
        console.log(`🕐 Expiration check started (every ${this.expirationCheckInterval / 1000 / 60} minutes)`);
        
        // Show refresh indicator
        this.showRefreshIndicator();
    }
    
    /**
     * Stop auto-refresh service
     */
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ Auto-refresh service is not running');
            return;
        }
        
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.expirationIntervalId) {
            clearInterval(this.expirationIntervalId);
            this.expirationIntervalId = null;
        }
        
        console.log('🛑 Auto-refresh service stopped');
        this.hideRefreshIndicator();
    }
    
    /**
     * Refresh request data
     */
    async refreshRequestData() {
        try {
            this.lastRefreshTime = new Date();
            console.log('🔄 Refreshing request data...');
            
            // Update refresh indicator
            this.updateRefreshIndicator('Refreshing...');
            
            // Check if we're on the admin dashboard
            if (!window.location.pathname.includes('admin-dashboard')) {
                return;
            }
            
            // Refresh the requests table if the function exists
            if (typeof window.loadRequests === 'function') {
                await window.loadRequests();
                console.log('✅ Requests data refreshed');
            }
            
            // Refresh donor data if the function exists
            if (typeof window.loadDonors === 'function') {
                await window.loadDonors();
                console.log('✅ Donors data refreshed');
            }
            
            // Update statistics if the function exists
            if (typeof window.loadStatistics === 'function') {
                await window.loadStatistics();
                console.log('✅ Statistics refreshed');
            }
            
            this.updateRefreshIndicator(`Last updated: ${this.lastRefreshTime.toLocaleTimeString()}`);
            
        } catch (error) {
            console.error('❌ Error refreshing data:', error);
            this.updateRefreshIndicator('Refresh failed', true);
        }
    }
    
    /**
     * Check for expired requests and trigger immediate refresh if found
     */
    async checkExpirations() {
        try {
            console.log('🕐 Checking for expired requests...');
            
            const response = await fetch('/api/expiration/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.data.expiredCount > 0) {
                console.log(`⏰ Found ${result.data.expiredCount} newly expired requests - triggering immediate refresh`);
                
                // Show notification
                this.showExpirationNotification(result.data.expiredCount);
                
                // Trigger immediate refresh
                await this.refreshRequestData();
            } else {
                console.log('✅ No new expired requests found');
            }
            
        } catch (error) {
            console.error('❌ Error checking expirations:', error);
        }
    }
    
    /**
     * Show refresh indicator
     */
    showRefreshIndicator() {
        // Create refresh indicator if it doesn't exist
        let indicator = document.getElementById('refresh-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'refresh-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                font-size: 12px;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.textContent = '🔄 Auto-refresh ON';
        indicator.style.display = 'block';
    }
    
    /**
     * Hide refresh indicator
     */
    hideRefreshIndicator() {
        const indicator = document.getElementById('refresh-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    
    /**
     * Update refresh indicator
     */
    updateRefreshIndicator(message, isError = false) {
        const indicator = document.getElementById('refresh-indicator');
        if (indicator) {
            indicator.textContent = message;
            indicator.style.background = isError ? '#f44336' : '#4CAF50';
            
            if (isError) {
                setTimeout(() => {
                    indicator.style.background = '#4CAF50';
                    indicator.textContent = '🔄 Auto-refresh ON';
                }, 3000);
            }
        }
    }
    
    /**
     * Show expiration notification
     */
    showExpirationNotification(count) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #ff9800;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 1001;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        notification.innerHTML = `
            <strong>⏰ Requests Expired</strong><br>
            ${count} request(s) have been automatically expired.
            <button onclick=\"this.parentElement.remove()\" style=\"
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 2px 8px;
                margin-left: 10px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
            \">✕</button>
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }
    
    /**
     * Manual refresh trigger
     */
    async manualRefresh() {
        console.log('🔧 Manual refresh triggered');
        await this.refreshRequestData();
    }
    
    /**
     * Get service status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            refreshInterval: this.refreshInterval,
            lastRefreshTime: this.lastRefreshTime,
            expirationCheckInterval: this.expirationCheckInterval
        };
    }
    
    /**
     * Update refresh interval
     */
    setRefreshInterval(seconds) {
        this.refreshInterval = seconds * 1000;
        
        if (this.isRunning) {
            this.stop();
            this.start();
        }
        
        console.log(`🔄 Refresh interval updated to ${seconds} seconds`);
    }
}

// Create global instance
window.autoRefreshService = new AutoRefreshService();

// Auto-start when on admin dashboard
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('admin-dashboard')) {
            setTimeout(() => {
                window.autoRefreshService.start();
            }, 2000); // Start after 2 seconds to allow page to load
        }
    });
} else {
    if (window.location.pathname.includes('admin-dashboard')) {
        setTimeout(() => {
            window.autoRefreshService.start();
        }, 2000);
    }
}

// Add manual refresh button to admin dashboard
if (window.location.pathname.includes('admin-dashboard')) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const adminActions = document.querySelector('.admin-actions') || 
                                document.querySelector('.dashboard-header') || 
                                document.body;
            
            if (adminActions) {
                const refreshButton = document.createElement('button');
                refreshButton.innerHTML = '🔄 Manual Refresh';
                refreshButton.style.cssText = `
                    background: #2196F3;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 5px;
                    font-size: 14px;
                `;
                
                refreshButton.onclick = () => {
                    window.autoRefreshService.manualRefresh();
                };
                
                adminActions.appendChild(refreshButton);
            }
        }, 3000);
    });
}

console.log('✅ Auto-refresh service loaded successfully');