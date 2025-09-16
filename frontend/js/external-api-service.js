/**
 * External API Integration Service
 * Handles all external API calls with proper error handling and fallbacks
 */

class ExternalAPIService {
    constructor() {
        this.isOnline = navigator.onLine || true;
        this.apiStatus = {
            googleMaps: 'unknown',
            twilio: 'unknown',
            whatsapp: 'unknown',
            hospital: 'unknown'
        };
        
        // Cache for API responses
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
        
        // Mock data for fallbacks
        this.mockData = this.initializeMockData();
        
        // Initialize API availability check
        this.checkAPIAvailability();
        
        console.log('🔌 External API Service initialized with fallback support');
    }
    
    /**
     * Initialize mock data for fallbacks
     */
    initializeMockData() {
        return {
            nearbyHospitals: [
                {
                    name: "City General Hospital",
                    address: "123 Healthcare Ave, Mumbai",
                    phone: "+91 22 1234 5678",
                    bloodBank: true,
                    distance: "2.3 km",
                    coordinates: { lat: 19.0760, lng: 72.8777 }
                },
                {
                    name: "Apollo Hospitals",
                    address: "456 Medical St, Mumbai", 
                    phone: "+91 22 8765 4321",
                    bloodBank: true,
                    distance: "3.7 km",
                    coordinates: { lat: 19.0825, lng: 72.8811 }
                },
                {
                    name: "Fortis Healthcare",
                    address: "789 Wellness Rd, Mumbai",
                    phone: "+91 22 9876 5432",
                    bloodBank: true,
                    distance: "5.1 km",
                    coordinates: { lat: 19.0896, lng: 72.8656 }
                }
            ],
            externalDonors: [
                {
                    name: "Dr. Rajesh Kumar",
                    bloodGroup: "O+",
                    city: "Mumbai",
                    state: "Maharashtra",
                    phone: "+91 98765 43210",
                    verified: true,
                    source: "hospital_network",
                    lastDonation: "2024-06-15",
                    availability: "Available"
                },
                {
                    name: "Nurse Priya Sharma",
                    bloodGroup: "A+",
                    city: "Delhi",
                    state: "Delhi",
                    phone: "+91 87654 32109",
                    verified: true,
                    source: "healthcare_registry",
                    lastDonation: "2024-07-20",
                    availability: "Available"
                }
            ]
        };
    }
    
    /**
     * Check availability of external APIs
     */
    async checkAPIAvailability() {
        try {
            // Test Google Maps API (using a simple geocoding request)
            this.apiStatus.googleMaps = await this.testGoogleMapsAPI() ? 'available' : 'unavailable';
            
            // Test Twilio API (we'll assume it's available if credentials exist)
            this.apiStatus.twilio = this.hasTwilioCredentials() ? 'available' : 'unavailable';
            
            // Test WhatsApp API (we'll assume it's available if credentials exist)
            this.apiStatus.whatsapp = this.hasWhatsAppCredentials() ? 'available' : 'unavailable';
            
            // Hospital API (mock data always available)
            this.apiStatus.hospital = 'mock_available';
            
            console.log('📊 API Status Check:', this.apiStatus);
            
        } catch (error) {
            console.warn('⚠️ API availability check failed:', error.message);
        }
    }
    
    /**
     * Test Google Maps API availability
     */
    async testGoogleMapsAPI() {
        try {
            const apiKey = this.getGoogleMapsAPIKey();
            if (!apiKey || apiKey.includes('optional_')) {
                return false;
            }
            
            // Simple test request to geocoding API
            const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Mumbai&key=${apiKey}`;
            const response = await fetch(testUrl);
            const data = await response.json();
            
            return data.status === 'OK';
        } catch (error) {
            console.warn('🗺️ Google Maps API test failed:', error.message);
            return false;
        }
    }
    
    /**
     * Get Google Maps API Key
     */
    getGoogleMapsAPIKey() {
        // In production, this would come from environment variables
        // For now, we'll check if it's set in a global variable or return null
        return window.GOOGLE_MAPS_API_KEY || null;
    }
    
    /**
     * Check if Twilio credentials are available
     */
    hasTwilioCredentials() {
        return !!(window.TWILIO_ACCOUNT_SID && window.TWILIO_AUTH_TOKEN);
    }
    
    /**
     * Check if WhatsApp credentials are available
     */
    hasWhatsAppCredentials() {
        return !!(window.WHATSAPP_BUSINESS_TOKEN && window.WHATSAPP_PHONE_NUMBER_ID);
    }
    
    /**
     * Search nearby hospitals with blood banks
     */
    async searchNearbyHospitals(latitude, longitude, radius = 10000) {
        try {
            console.log('🏥 Searching nearby hospitals...');
            
            if (this.apiStatus.googleMaps === 'available') {
                return await this.searchHospitalsWithGoogleMaps(latitude, longitude, radius);
            } else {
                console.log('📍 Using mock hospital data (Google Maps API not available)');
                return this.getMockNearbyHospitals(latitude, longitude);
            }
            
        } catch (error) {
            console.error('❌ Hospital search failed, using fallback:', error.message);
            return this.getMockNearbyHospitals(latitude, longitude);
        }
    }
    
    /**
     * Search hospitals using Google Maps API
     */
    async searchHospitalsWithGoogleMaps(lat, lng, radius) {
        const apiKey = this.getGoogleMapsAPIKey();
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=hospital&keyword=blood+bank&key=${apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status !== 'OK') {
            throw new Error(`Google Maps API error: ${data.status}`);
        }
        
        return data.results.map(place => ({
            name: place.name,
            address: place.vicinity,
            phone: place.formatted_phone_number || 'Contact for details',
            bloodBank: true,
            distance: this.calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng),
            coordinates: place.geometry.location,
            rating: place.rating,
            source: 'google_maps'
        }));
    }
    
    /**
     * Get mock nearby hospitals
     */
    getMockNearbyHospitals(lat, lng) {
        return this.mockData.nearbyHospitals.map(hospital => ({
            ...hospital,
            distance: this.calculateDistance(lat, lng, hospital.coordinates.lat, hospital.coordinates.lng)
        })).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    }
    
    /**
     * Send SMS notification to donors
     */
    async sendSMSNotification(phoneNumber, message, urgency = 'medium') {
        try {
            console.log('📱 Sending SMS notification...');
            
            if (this.apiStatus.twilio === 'available') {
                return await this.sendSMSWithTwilio(phoneNumber, message);
            } else {
                console.log('📧 SMS API not available, using fallback notification');
                return await this.sendFallbackNotification(phoneNumber, message, urgency);
            }
            
        } catch (error) {
            console.error('❌ SMS notification failed, using fallback:', error.message);
            return await this.sendFallbackNotification(phoneNumber, message, urgency);
        }
    }
    
    /**
     * Send SMS using Twilio API
     */
    async sendSMSWithTwilio(phoneNumber, message) {
        const accountSid = window.TWILIO_ACCOUNT_SID;
        const authToken = window.TWILIO_AUTH_TOKEN;
        const fromNumber = window.TWILIO_PHONE_NUMBER;
        
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                From: fromNumber,
                To: phoneNumber,
                Body: message
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`Twilio API error: ${data.message}`);
        }
        
        return {
            success: true,
            messageId: data.sid,
            status: data.status,
            method: 'twilio_sms'
        };
    }
    
    /**
     * Send WhatsApp message for urgent requests
     */
    async sendWhatsAppMessage(phoneNumber, message, urgency = 'high') {
        try {
            console.log('💬 Sending WhatsApp message...');
            
            if (this.apiStatus.whatsapp === 'available') {
                return await this.sendWhatsAppWithBusinessAPI(phoneNumber, message);
            } else {
                console.log('📱 WhatsApp API not available, using SMS fallback');
                return await this.sendSMSNotification(phoneNumber, message, urgency);
            }
            
        } catch (error) {
            console.error('❌ WhatsApp message failed, using SMS fallback:', error.message);
            return await this.sendSMSNotification(phoneNumber, message, urgency);
        }
    }
    
    /**
     * Send WhatsApp message using Business API
     */
    async sendWhatsAppWithBusinessAPI(phoneNumber, message) {
        const token = window.WHATSAPP_BUSINESS_TOKEN;
        const phoneNumberId = window.WHATSAPP_PHONE_NUMBER_ID;
        
        const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'text',
                text: { body: message }
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`WhatsApp API error: ${data.error?.message || 'Unknown error'}`);
        }
        
        return {
            success: true,
            messageId: data.messages[0].id,
            method: 'whatsapp_business'
        };
    }
    
    /**
     * Search external donor networks
     */
    async searchExternalDonors(bloodGroup, location, urgency = 'medium') {
        try {
            console.log('🔍 Searching external donor networks...');
            
            // Always use mock data for now (can be replaced with real APIs later)
            const externalDonors = this.mockData.externalDonors.filter(donor => {
                return donor.bloodGroup === bloodGroup || bloodGroup === 'any';
            });
            
            return {
                success: true,
                source: 'external_networks',
                donors: externalDonors,
                count: externalDonors.length,
                message: 'External donor search completed (using mock data)'
            };
            
        } catch (error) {
            console.error('❌ External donor search failed:', error.message);
            return {
                success: false,
                source: 'external_networks',
                donors: [],
                count: 0,
                error: error.message
            };
        }
    }
    
    /**
     * Fallback notification system
     */
    async sendFallbackNotification(phoneNumber, message, urgency) {
        // Store notification for later processing
        const notification = {
            id: Date.now().toString(),
            phoneNumber,
            message,
            urgency,
            timestamp: new Date().toISOString(),
            method: 'fallback_queue',
            status: 'queued'
        };
        
        // Store in localStorage for later processing
        const notifications = JSON.parse(localStorage.getItem('pending_notifications') || '[]');
        notifications.push(notification);
        localStorage.setItem('pending_notifications', JSON.stringify(notifications));
        
        console.log('📋 Notification queued for later delivery:', notification.id);
        
        // Show user notification
        if (window.BloodConnect && window.BloodConnect.showModal) {
            window.BloodConnect.showModal(
                'Notification Queued',
                `SMS service temporarily unavailable. Notification to ${phoneNumber} has been queued and will be sent when service is restored.`,
                'info'
            );
        }
        
        return {
            success: true,
            messageId: notification.id,
            method: 'fallback_queue',
            status: 'queued'
        };
    }
    
    /**
     * Calculate distance between two coordinates
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        return distance.toFixed(1) + ' km';
    }
    
    /**
     * Get current API status
     */
    getAPIStatus() {
        return {
            apiStatus: this.apiStatus,
            isOnline: this.isOnline,
            cacheSize: this.cache.size,
            mockDataAvailable: true
        };
    }
    
    /**
     * Process queued notifications when APIs become available
     */
    async processQueuedNotifications() {
        try {
            const notifications = JSON.parse(localStorage.getItem('pending_notifications') || '[]');
            
            if (notifications.length === 0) {
                return { processed: 0, message: 'No queued notifications' };
            }
            
            let processed = 0;
            const remaining = [];
            
            for (const notification of notifications) {
                try {
                    await this.sendSMSNotification(notification.phoneNumber, notification.message);
                    processed++;
                } catch (error) {
                    console.warn('⚠️ Still unable to send notification:', notification.id);
                    remaining.push(notification);
                }
            }
            
            localStorage.setItem('pending_notifications', JSON.stringify(remaining));
            
            return {
                processed,
                remaining: remaining.length,
                message: `Processed ${processed} queued notifications, ${remaining.length} remaining`
            };
            
        } catch (error) {
            console.error('❌ Error processing queued notifications:', error.message);
            return { processed: 0, error: error.message };
        }
    }
}

// Initialize global service
window.ExternalAPIService = new ExternalAPIService();

// Helper functions for easy integration
window.BloodConnectAPI = {
    searchNearbyHospitals: (lat, lng) => window.ExternalAPIService.searchNearbyHospitals(lat, lng),
    sendDonorNotification: (phone, message) => window.ExternalAPIService.sendSMSNotification(phone, message),
    sendUrgentWhatsApp: (phone, message) => window.ExternalAPIService.sendWhatsAppMessage(phone, message),
    searchExternalDonors: (bloodGroup, location) => window.ExternalAPIService.searchExternalDonors(bloodGroup, location),
    getAPIStatus: () => window.ExternalAPIService.getAPIStatus()
};

console.log('🚀 External API Service loaded with comprehensive fallback support');

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExternalAPIService;
}