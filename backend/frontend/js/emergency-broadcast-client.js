/**
 * Emergency Broadcast Client - Frontend WebSocket Implementation
 * Handles real-time emergency alerts, weather warnings, and urgent blood requests
 */

class EmergencyBroadcastClient {
    constructor(serverURL = 'ws://localhost:8080') {
        this.serverURL = serverURL;
        this.ws = null;
        this.isConnected = false;
        this.reconnectInterval = 5000; // 5 seconds
        this.reconnectTimer = null;
        this.heartbeatInterval = 30000; // 30 seconds
        this.heartbeatTimer = null;
        this.maxReconnectAttempts = 10;
        this.reconnectAttempts = 0;
        this.clientId = null;
        this.userPreferences = null;
        
        // Event handlers
        this.eventHandlers = {
            connected: [],
            disconnected: [],
            error: [],
            emergencyAlert: [],
            weatherWarning: [],
            urgentRequest: [],
            systemStatus: []
        };
        
        // Message types (must match server)
        this.MESSAGE_TYPES = {
            EMERGENCY_ALERT: 'EMERGENCY_ALERT',
            WEATHER_WARNING: 'WEATHER_WARNING',
            URGENT_REQUEST: 'URGENT_REQUEST',
            SYSTEM_STATUS: 'SYSTEM_STATUS',
            HEARTBEAT: 'HEARTBEAT',
            CLIENT_REGISTER: 'CLIENT_REGISTER',
            CLIENT_UNREGISTER: 'CLIENT_UNREGISTER'
        };
        
        console.log('📡 Emergency Broadcast Client initialized');
    }
    
    /**
     * Connect to the WebSocket server
     */
    connect(userPreferences = {}) {
        try {
            this.userPreferences = userPreferences;
            
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                console.log('📡 Already connected to emergency broadcast server');
                return;
            }
            
            console.log(`📡 Connecting to emergency broadcast server: ${this.serverURL}`);
            
            this.ws = new WebSocket(this.serverURL);
            this.setupWebSocketHandlers();
            
        } catch (error) {
            console.error('❌ Failed to connect to emergency broadcast server:', error);
            this.handleConnectionError(error);
        }
    }
    
    /**
     * Disconnect from the WebSocket server
     */
    disconnect() {
        try {
            this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
            
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
                this.heartbeatTimer = null;
            }
            
            if (this.ws) {
                this.ws.close(1000, 'User disconnect');
            }
            
            this.isConnected = false;
            console.log('📡 Disconnected from emergency broadcast server');
            
        } catch (error) {
            console.error('❌ Error during disconnect:', error);
        }
    }
    
    /**
     * Setup WebSocket event handlers
     */
    setupWebSocketHandlers() {
        this.ws.onopen = () => {
            console.log('✅ Connected to emergency broadcast server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            // Register client with preferences
            this.registerClient();
            
            // Start heartbeat
            this.startHeartbeat();
            
            // Trigger connected event
            this.triggerEvent('connected', { timestamp: new Date().toISOString() });
        };
        
        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleServerMessage(message);
            } catch (error) {
                console.error('❌ Error parsing server message:', error);
            }
        };
        
        this.ws.onclose = (event) => {
            console.log(`📡 Connection closed: ${event.code} - ${event.reason}`);
            this.isConnected = false;
            
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
                this.heartbeatTimer = null;
            }
            
            this.triggerEvent('disconnected', { 
                code: event.code, 
                reason: event.reason,
                timestamp: new Date().toISOString()
            });
            
            // Attempt reconnection if not intentional disconnect
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.scheduleReconnect();
            }
        };
        
        this.ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            this.handleConnectionError(error);
        };
    }
    
    /**
     * Handle messages from server
     */
    handleServerMessage(message) {
        try {
            console.log(`📨 Received ${message.type} message`);
            
            switch (message.type) {
                case this.MESSAGE_TYPES.EMERGENCY_ALERT:
                    this.handleEmergencyAlert(message);
                    break;
                    
                case this.MESSAGE_TYPES.WEATHER_WARNING:
                    this.handleWeatherWarning(message);
                    break;
                    
                case this.MESSAGE_TYPES.URGENT_REQUEST:
                    this.handleUrgentRequest(message);
                    break;
                    
                case this.MESSAGE_TYPES.SYSTEM_STATUS:
                    this.handleSystemStatus(message);
                    break;
                    
                case this.MESSAGE_TYPES.HEARTBEAT:
                    // Heartbeat response - no action needed
                    break;
                    
                default:
                    console.log(`📨 Unknown message type: ${message.type}`);
            }
        } catch (error) {
            console.error('❌ Error handling server message:', error);
        }
    }
    
    /**
     * Handle emergency alert message
     */
    handleEmergencyAlert(message) {
        console.log('🚨 Emergency Alert received:', message.data);
        
        // Show emergency popup if available
        if (window.emergencyPopup && message.data) {
            window.emergencyPopup.displayEmergencyPopup(message.data);
        }
        
        // Show browser notification
        this.showBrowserNotification({
            title: '🚨 Emergency Blood Request',
            body: `${message.data.bloodGroup} blood needed urgently for ${message.data.patientName}`,
            icon: '/images/emergency-icon.png',
            tag: 'emergency-alert',
            requireInteraction: true
        });
        
        // Play alert sound
        this.playAlertSound('emergency');
        
        // Trigger custom event handlers
        this.triggerEvent('emergencyAlert', message.data);
    }
    
    /**
     * Handle weather warning message
     */
    handleWeatherWarning(message) {
        console.log('🌤️ Weather Warning received:', message.data);
        
        // Show weather notification
        this.showWeatherNotification(message.data);
        
        // Show browser notification for severe weather
        if (message.data.severity === 'HIGH' || message.data.severity === 'EXTREME') {
            this.showBrowserNotification({
                title: '🌤️ Weather Alert',
                body: `${message.data.weather?.description} in ${message.data.location?.name}. Blood drives may be affected.`,
                icon: '/images/weather-icon.png',
                tag: 'weather-warning'
            });
        }
        
        // Trigger custom event handlers
        this.triggerEvent('weatherWarning', message.data);
    }
    
    /**
     * Handle urgent request message
     */
    handleUrgentRequest(message) {
        console.log('📢 Urgent Request received:', message.data);
        
        // Show urgent request notification
        this.showUrgentRequestNotification(message.data);
        
        // Show browser notification
        this.showBrowserNotification({
            title: '📢 Urgent Blood Request',
            body: message.data.message || 'A blood donor is urgently needed in your area',
            icon: '/images/urgent-icon.png',
            tag: 'urgent-request'
        });
        
        // Trigger custom event handlers
        this.triggerEvent('urgentRequest', message.data);
    }
    
    /**
     * Handle system status message
     */
    handleSystemStatus(message) {
        console.log('ℹ️ System Status:', message.data);
        
        if (message.data.clientId) {
            this.clientId = message.data.clientId;
        }
        
        // Trigger custom event handlers
        this.triggerEvent('systemStatus', message.data);
    }
    
    /**
     * Register client with server
     */
    registerClient() {
        const registrationData = {
            userType: this.userPreferences.userType || 'guest',
            location: this.userPreferences.location || null,
            preferences: {
                bloodType: this.userPreferences.bloodType || null,
                notificationTypes: this.userPreferences.notificationTypes || ['emergency', 'weather'],
                radius: this.userPreferences.radius || 50
            }
        };
        
        this.sendMessage({
            type: this.MESSAGE_TYPES.CLIENT_REGISTER,
            data: registrationData
        });
        
        console.log('👤 Registered with server:', registrationData);
    }
    
    /**
     * Send message to server
     */
    sendMessage(message) {
        try {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(message));
                return true;
            } else {
                console.warn('⚠️ Cannot send message: WebSocket not connected');
                return false;
            }
        } catch (error) {
            console.error('❌ Error sending message:', error);
            return false;
        }
    }
    
    /**
     * Start heartbeat to keep connection alive
     */
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            this.sendMessage({
                type: this.MESSAGE_TYPES.HEARTBEAT,
                data: { timestamp: new Date().toISOString() }
            });
        }, this.heartbeatInterval);
    }
    
    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        this.reconnectAttempts++;
        const delay = this.reconnectInterval * Math.min(this.reconnectAttempts, 5); // Max 25 second delay
        
        console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay/1000}s`);
        
        this.reconnectTimer = setTimeout(() => {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}`);
                this.connect(this.userPreferences);
            } else {
                console.log('❌ Max reconnection attempts reached');
                this.triggerEvent('error', { 
                    message: 'Max reconnection attempts reached', 
                    type: 'connection_failed' 
                });
            }
        }, delay);
    }
    
    /**
     * Handle connection errors
     */
    handleConnectionError(error) {
        console.error('❌ Connection error:', error);
        this.triggerEvent('error', { message: error.message, type: 'connection_error' });
    }
    
    /**
     * Show browser notification
     */
    async showBrowserNotification(options) {
        try {
            // Request permission if not granted
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    console.log('📱 Notification permission denied');
                    return;
                }
            }
            
            if (Notification.permission === 'granted') {
                const notification = new Notification(options.title, {
                    body: options.body,
                    icon: options.icon,
                    tag: options.tag,
                    requireInteraction: options.requireInteraction || false,
                    vibrate: [200, 100, 200] // Mobile vibration pattern
                });
                
                // Auto-close after 10 seconds unless requireInteraction is true
                if (!options.requireInteraction) {
                    setTimeout(() => notification.close(), 10000);
                }
                
                // Handle notification click
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                    
                    // Navigate based on notification type
                    if (options.tag === 'emergency-alert') {
                        window.location.href = '/donate';
                    } else if (options.tag === 'urgent-request') {
                        window.location.href = '/request';
                    }
                };
                
                console.log('📱 Browser notification shown');
            }
        } catch (error) {
            console.warn('⚠️ Error showing browser notification:', error);
        }
    }
    
    /**
     * Show weather notification overlay
     */
    showWeatherNotification(weatherData) {
        // Create weather notification overlay
        const overlay = document.createElement('div');
        overlay.className = 'weather-notification-overlay';
        overlay.innerHTML = `
            <div class=\"weather-notification\" style=\"
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${this.getWeatherColor(weatherData.severity)};
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10001;
                max-width: 350px;
                font-family: Arial, sans-serif;
            \">
                <div style=\"display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;\">
                    <h4 style=\"margin: 0; font-size: 16px;\">🌤️ Weather Alert</h4>
                    <button onclick=\"this.parentElement.parentElement.remove()\" style=\"
                        background: none;
                        border: none;
                        color: white;
                        font-size: 18px;
                        cursor: pointer;
                        padding: 0;
                        width: 20px;
                        height: 20px;
                    \">×</button>
                </div>
                <p style=\"margin: 0; font-size: 14px; line-height: 1.4;\">
                    ${weatherData.message || `${weatherData.weather?.description} in ${weatherData.location?.name}`}
                </p>
                <div style=\"margin-top: 8px; font-size: 12px; opacity: 0.9;\">
                    Severity: ${weatherData.severity} | ${new Date().toLocaleTimeString()}
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
        }, 15000);
    }
    
    /**
     * Show urgent request notification
     */
    showUrgentRequestNotification(requestData) {
        // Create urgent request notification
        const overlay = document.createElement('div');
        overlay.className = 'urgent-notification-overlay';
        overlay.innerHTML = `
            <div class=\"urgent-notification\" style=\"
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #dc2626, #b91c1c);
                color: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(220, 38, 38, 0.4);
                z-index: 10001;
                max-width: 400px;
                font-family: Arial, sans-serif;
                animation: slideDown 0.5s ease;
            \">
                <div style=\"display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;\">
                    <h4 style=\"margin: 0; font-size: 18px;\">📢 Urgent Request</h4>
                    <button onclick=\"this.parentElement.parentElement.remove()\" style=\"
                        background: rgba(255,255,255,0.2);
                        border: none;
                        color: white;
                        font-size: 18px;
                        cursor: pointer;
                        padding: 4px 8px;
                        border-radius: 4px;
                    \">×</button>
                </div>
                <p style=\"margin: 0 0 15px 0; font-size: 15px; line-height: 1.4;\">
                    ${requestData.message || 'A blood donor is urgently needed in your area'}
                </p>
                <div style=\"display: flex; gap: 10px;\">
                    <button onclick=\"window.location.href='/donate'; this.parentElement.parentElement.parentElement.remove();\" style=\"
                        background: white;
                        color: #dc2626;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 14px;
                    \">🩸 I Can Help</button>
                    <button onclick=\"this.parentElement.parentElement.parentElement.remove()\" style=\"
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    \">Not Now</button>
                </div>
            </div>
            
            <style>
                @keyframes slideDown {
                    from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            </style>
        `;
        
        document.body.appendChild(overlay);
        
        // Auto-remove after 20 seconds
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
        }, 20000);
    }
    
    /**
     * Get color based on weather severity
     */
    getWeatherColor(severity) {
        switch (severity) {
            case 'EXTREME': return '#dc2626';
            case 'HIGH': return '#ea580c';
            case 'MEDIUM': return '#d97706';
            case 'LOW': return '#059669';
            default: return '#6b7280';
        }
    }
    
    /**
     * Play alert sound
     */
    playAlertSound(type = 'notification') {
        try {
            // Create audio context if not exists
            if (!window.audioContext) {
                window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Generate different tones for different alert types
            const frequency = type === 'emergency' ? 800 : 400;
            const duration = type === 'emergency' ? 0.5 : 0.3;
            
            const oscillator = window.audioContext.createOscillator();
            const gainNode = window.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(window.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, window.audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, window.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioContext.currentTime + duration);
            
            oscillator.start(window.audioContext.currentTime);
            oscillator.stop(window.audioContext.currentTime + duration);
            
        } catch (error) {
            console.warn('⚠️ Could not play alert sound:', error);
        }
    }
    
    /**
     * Add event listener
     */
    on(eventType, handler) {
        if (this.eventHandlers[eventType]) {
            this.eventHandlers[eventType].push(handler);
        } else {
            console.warn(`⚠️ Unknown event type: ${eventType}`);
        }
    }
    
    /**
     * Remove event listener
     */
    off(eventType, handler) {
        if (this.eventHandlers[eventType]) {
            const index = this.eventHandlers[eventType].indexOf(handler);
            if (index > -1) {
                this.eventHandlers[eventType].splice(index, 1);
            }
        }
    }
    
    /**
     * Trigger event handlers
     */
    triggerEvent(eventType, data) {
        if (this.eventHandlers[eventType]) {
            this.eventHandlers[eventType].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`❌ Error in ${eventType} handler:`, error);
                }
            });
        }
    }
    
    /**
     * Update user preferences
     */
    updatePreferences(newPreferences) {
        this.userPreferences = { ...this.userPreferences, ...newPreferences };
        
        // Re-register with updated preferences
        if (this.isConnected) {
            this.registerClient();
        }
        
        console.log('👤 User preferences updated:', this.userPreferences);
    }
    
    /**
     * Get connection status
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            clientId: this.clientId,
            reconnectAttempts: this.reconnectAttempts,
            userPreferences: this.userPreferences,
            serverURL: this.serverURL
        };
    }
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.EmergencyBroadcastClient = EmergencyBroadcastClient;
    
    // Auto-initialize with default settings
    window.emergencyBroadcast = new EmergencyBroadcastClient();
}