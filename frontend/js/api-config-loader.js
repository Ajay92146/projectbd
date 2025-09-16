/**
 * API Configuration Loader
 * Safely loads external API configurations and sets up global variables
 */

class APIConfigLoader {
    constructor() {
        this.configLoaded = false;
        this.config = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        console.log('🔧 API Config Loader initialized');
    }
    
    /**
     * Load API configuration from server
     */
    async loadConfiguration() {
        try {
            console.log('📡 Loading API configuration from server...');
            
            const response = await fetch('/api/external/config');
            const config = await response.json();
            
            if (config.success) {
                this.config = config;
                this.configLoaded = true;
                
                // Set up global API configuration
                this.setupGlobalConfig(config);
                
                console.log('✅ API configuration loaded successfully:', config);
                return config;
            } else {
                throw new Error('Failed to load API configuration');
            }
            
        } catch (error) {
            console.error('❌ Failed to load API configuration:', error.message);
            
            // Use fallback configuration
            const fallbackConfig = this.getFallbackConfig();
            this.setupGlobalConfig(fallbackConfig);
            
            return fallbackConfig;
        }
    }
    
    /**
     * Set up global configuration variables
     */
    setupGlobalConfig(config) {
        // Set global API availability flags
        window.API_CONFIG = {
            GOOGLE_MAPS_AVAILABLE: config.apis?.googleMaps?.available || false,
            TWILIO_AVAILABLE: config.apis?.twilio?.available || false,
            WHATSAPP_AVAILABLE: config.apis?.whatsapp?.available || false,
            HOSPITAL_API_AVAILABLE: config.apis?.hospital?.available || true,
            
            // Features
            ENHANCED_SEARCH: config.features?.enhancedSearch || true,
            MULTI_SOURCE_SEARCH: config.features?.multiSourceSearch || true,
            URGENT_NOTIFICATIONS: config.features?.urgentNotifications || true,
            HOSPITAL_LOCATOR: config.features?.hospitalLocator || true,
            FALLBACK_SUPPORT: config.features?.fallbackSupport || true
        };
        
        // Set up external API service configuration
        if (window.ExternalAPIService) {
            window.ExternalAPIService.configureDataSources({
                external: config.apis?.googleMaps?.available || false,
                government: false, // Not implemented yet
                hospitals: config.apis?.hospital?.available || true
            });
        }
        
        console.log('🌐 Global API configuration set:', window.API_CONFIG);
    }
    
    /**
     * Get fallback configuration when server is unavailable
     */
    getFallbackConfig() {
        return {
            success: true,
            apis: {
                googleMaps: { available: false, status: 'fallback' },
                twilio: { available: false, status: 'fallback' },
                whatsapp: { available: false, status: 'fallback' },
                hospital: { available: true, status: 'mock_ready' }
            },
            features: {
                enhancedSearch: true,
                multiSourceSearch: true,
                urgentNotifications: true,
                hospitalLocator: true,
                fallbackSupport: true
            },
            fallback: true
        };
    }
    
    /**
     * Test API connections
     */
    async testAPIConnections() {
        try {
            console.log('🧪 Testing API connections...');
            
            const response = await fetch('/api/external/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const results = await response.json();
            console.log('📊 API test results:', results);
            
            return results;
            
        } catch (error) {
            console.error('❌ API connection test failed:', error.message);
            return {
                success: false,
                error: error.message,
                tests: {}
            };
        }
    }
    
    /**
     * Get current API status
     */
    async getAPIStatus() {
        try {
            const response = await fetch('/api/external/status');
            const status = await response.json();
            
            console.log('📈 Current API status:', status);
            return status;
            
        } catch (error) {
            console.error('❌ Failed to get API status:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Send test notification
     */
    async sendTestNotification(phoneNumber, message, method = 'sms') {
        try {
            console.log(`📱 Sending test notification to ${phoneNumber}...`);
            
            const response = await fetch('/api/external/send-test-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phoneNumber,
                    message,
                    method
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Test notification sent successfully');
            } else {
                console.error('❌ Test notification failed:', result.message);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Test notification error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Initialize API configuration when DOM is ready
     */
    async initialize() {
        try {
            // Load configuration
            await this.loadConfiguration();
            
            // Wait for external API service to be ready
            if (window.ExternalAPIService) {
                console.log('🔗 External API Service detected, running availability check...');
                await window.ExternalAPIService.checkAPIAvailability();
            }
            
            // Emit configuration ready event
            document.dispatchEvent(new CustomEvent('apiConfigReady', {
                detail: { config: this.config }
            }));
            
            console.log('🚀 API configuration initialization complete');
            
        } catch (error) {
            console.error('❌ API configuration initialization failed:', error.message);
        }
    }
    
    /**
     * Get current configuration
     */
    getConfig() {
        return this.config;
    }
    
    /**
     * Check if configuration is loaded
     */
    isConfigLoaded() {
        return this.configLoaded;
    }
}

// Create global instance
window.APIConfigLoader = new APIConfigLoader();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.APIConfigLoader.initialize();
});

// Global helper functions
window.BloodConnectConfig = {
    getAPIStatus: () => window.APIConfigLoader.getAPIStatus(),
    testAPIs: () => window.APIConfigLoader.testAPIConnections(),
    sendTestNotification: (phone, message, method) => window.APIConfigLoader.sendTestNotification(phone, message, method),
    isConfigReady: () => window.APIConfigLoader.isConfigLoaded(),
    getConfig: () => window.APIConfigLoader.getConfig()
};

console.log('🔧 API Configuration Loader ready');

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIConfigLoader;
}