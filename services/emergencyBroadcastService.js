/**
 * Emergency Broadcast Service - WebSocket Implementation
 * Real-time broadcasting of emergency alerts, weather warnings, and urgent blood requests
 */

const WebSocket = require('ws');
const EventEmitter = require('events');

class EmergencyBroadcastService extends EventEmitter {
    constructor(port = 8080) {
        super();
        
        this.port = port;
        this.wss = null;
        this.connectedClients = new Map(); // Use Map for better client management
        this.messageQueue = [];
        this.isRunning = false;
        this.maxQueueSize = 100;
        this.heartbeatInterval = 30000; // 30 seconds
        this.heartbeatTimer = null;
        
        // Message types
        this.MESSAGE_TYPES = {
            EMERGENCY_ALERT: 'EMERGENCY_ALERT',
            WEATHER_WARNING: 'WEATHER_WARNING',
            URGENT_REQUEST: 'URGENT_REQUEST',
            SYSTEM_STATUS: 'SYSTEM_STATUS',
            HEARTBEAT: 'HEARTBEAT',
            CLIENT_REGISTER: 'CLIENT_REGISTER',
            CLIENT_UNREGISTER: 'CLIENT_UNREGISTER'
        };
        
        console.log('📡 Emergency Broadcast Service initialized');
    }
    
    /**
     * Start the WebSocket server
     */
    start() {
        try {
            this.wss = new WebSocket.Server({ 
                port: this.port,
                perMessageDeflate: false // Disable compression for faster messaging
            });
            
            this.setupWebSocketServer();
            this.startHeartbeat();
            this.isRunning = true;
            
            console.log(`✅ Emergency Broadcast Server started on port ${this.port}`);
            this.emit('server_started', { port: this.port });
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to start Emergency Broadcast Server:', error);
            this.emit('server_error', error);
            return false;
        }
    }
    
    /**
     * Stop the WebSocket server
     */
    stop() {
        try {
            this.isRunning = false;
            
            // Stop heartbeat
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
                this.heartbeatTimer = null;
            }
            
            // Close all client connections
            this.connectedClients.forEach((clientInfo, ws) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close(1000, 'Server shutdown');
                }
            });
            
            // Close server
            if (this.wss) {
                this.wss.close(() => {
                    console.log('📡 Emergency Broadcast Server stopped');
                    this.emit('server_stopped');
                });
            }
            
            this.connectedClients.clear();
            
        } catch (error) {
            console.error('❌ Error stopping Emergency Broadcast Server:', error);
        }
    }
    
    /**
     * Setup WebSocket server event handlers
     */
    setupWebSocketServer() {
        this.wss.on('connection', (ws, request) => {
            const clientId = this.generateClientId();
            const clientInfo = {
                id: clientId,
                connectedAt: new Date(),
                lastPing: new Date(),
                userAgent: request.headers['user-agent'] || 'Unknown',
                ip: request.socket.remoteAddress || 'Unknown'
            };
            
            this.connectedClients.set(ws, clientInfo);
            
            console.log(`🔗 Client connected: ${clientId} (Total: ${this.connectedClients.size})`);
            
            // Send welcome message
            this.sendToClient(ws, {
                type: this.MESSAGE_TYPES.SYSTEM_STATUS,
                data: {
                    message: 'Connected to Emergency Broadcast System',
                    clientId: clientId,
                    serverTime: new Date().toISOString()
                }
            });
            
            // Setup client event handlers
            this.setupClientHandlers(ws, clientInfo);
            
            // Emit connection event
            this.emit('client_connected', { clientId, clientInfo });
        });
        
        this.wss.on('error', (error) => {
            console.error('❌ WebSocket Server error:', error);
            this.emit('server_error', error);
        });
    }
    
    /**
     * Setup individual client event handlers
     */
    setupClientHandlers(ws, clientInfo) {
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                this.handleClientMessage(ws, clientInfo, data);
            } catch (error) {
                console.warn(`⚠️ Invalid message from client ${clientInfo.id}:`, error.message);
                this.sendErrorToClient(ws, 'Invalid message format');
            }
        });
        
        ws.on('close', (code, reason) => {
            console.log(`📡 Client disconnected: ${clientInfo.id} (Code: ${code}, Reason: ${reason})`);
            this.connectedClients.delete(ws);
            this.emit('client_disconnected', { clientId: clientInfo.id, code, reason });
        });
        
        ws.on('error', (error) => {
            console.warn(`⚠️ Client error for ${clientInfo.id}:`, error.message);
            this.connectedClients.delete(ws);
        });
        
        ws.on('pong', () => {
            // Update last ping time
            clientInfo.lastPing = new Date();
        });
    }
    
    /**
     * Handle messages from clients
     */
    handleClientMessage(ws, clientInfo, message) {
        try {
            switch (message.type) {
                case this.MESSAGE_TYPES.CLIENT_REGISTER:
                    this.handleClientRegistration(ws, clientInfo, message.data);
                    break;
                    
                case this.MESSAGE_TYPES.HEARTBEAT:
                    clientInfo.lastPing = new Date();
                    this.sendToClient(ws, {
                        type: this.MESSAGE_TYPES.HEARTBEAT,
                        data: { timestamp: new Date().toISOString() }
                    });
                    break;
                    
                default:
                    console.log(`📨 Received message from ${clientInfo.id}:`, message.type);
            }
        } catch (error) {
            console.error(`❌ Error handling client message:`, error);
            this.sendErrorToClient(ws, 'Message processing error');
        }
    }
    
    /**
     * Handle client registration
     */
    handleClientRegistration(ws, clientInfo, data) {
        // Update client info with registration data
        if (data.userType) clientInfo.userType = data.userType;
        if (data.location) clientInfo.location = data.location;
        if (data.preferences) clientInfo.preferences = data.preferences;
        
        console.log(`👤 Client ${clientInfo.id} registered as ${data.userType || 'guest'}`);
        
        this.sendToClient(ws, {
            type: this.MESSAGE_TYPES.SYSTEM_STATUS,
            data: {
                message: 'Registration successful',
                clientId: clientInfo.id,
                userType: data.userType || 'guest'
            }
        });
    }
    
    /**
     * Broadcast emergency alert to all connected clients
     */
    broadcastEmergency(emergencyData) {
        const message = {
            type: this.MESSAGE_TYPES.EMERGENCY_ALERT,
            data: emergencyData,
            timestamp: new Date().toISOString(),
            urgency: emergencyData.urgency || 'HIGH'
        };
        
        console.log(`🚨 Broadcasting emergency: ${emergencyData.patientName || emergencyData.title}`);
        
        this.broadcastToAll(message);
        this.addToMessageQueue(message);
        
        // Emit for logging/analytics
        this.emit('emergency_broadcast', { 
            message, 
            clientCount: this.connectedClients.size 
        });
    }
    
    /**
     * Broadcast weather warning
     */
    broadcastWeatherWarning(weatherData) {
        const message = {
            type: this.MESSAGE_TYPES.WEATHER_WARNING,
            data: weatherData,
            timestamp: new Date().toISOString(),
            severity: weatherData.severity || 'MEDIUM'
        };
        
        console.log(`🌤️ Broadcasting weather warning: ${weatherData.location?.name}`);
        
        this.broadcastToAll(message);
        this.addToMessageQueue(message);
        
        this.emit('weather_broadcast', { 
            message, 
            clientCount: this.connectedClients.size 
        });
    }
    
    /**
     * Send targeted notifications based on location/preferences
     */
    sendTargetedNotifications(criteria, messageData) {
        const targetedClients = this.findTargetedClients(criteria);
        
        const message = {
            type: this.MESSAGE_TYPES.URGENT_REQUEST,
            data: messageData,
            timestamp: new Date().toISOString(),
            targetCriteria: criteria
        };
        
        console.log(`🎯 Sending targeted notification to ${targetedClients.length} clients`);
        
        targetedClients.forEach(({ ws, clientInfo }) => {
            this.sendToClient(ws, message);
        });
        
        this.emit('targeted_broadcast', { 
            message, 
            targetCount: targetedClients.length,
            totalClients: this.connectedClients.size
        });
        
        return targetedClients.length;
    }
    
    /**
     * Find clients matching targeting criteria
     */
    findTargetedClients(criteria) {
        const targetedClients = [];
        
        this.connectedClients.forEach((clientInfo, ws) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            
            let matches = true;
            
            // Check blood type matching
            if (criteria.bloodType && clientInfo.preferences?.bloodType) {
                if (clientInfo.preferences.bloodType !== criteria.bloodType) {
                    matches = false;
                }
            }
            
            // Check location proximity
            if (criteria.location && clientInfo.location) {
                const distance = this.calculateDistance(
                    criteria.location,
                    clientInfo.location
                );
                if (distance > (criteria.radius || 50)) { // Default 50km radius
                    matches = false;
                }
            }
            
            // Check user type
            if (criteria.userType && clientInfo.userType !== criteria.userType) {
                matches = false;
            }
            
            if (matches) {
                targetedClients.push({ ws, clientInfo });
            }
        });
        
        return targetedClients;
    }
    
    /**
     * Broadcast message to all connected clients
     */
    broadcastToAll(message) {
        let successCount = 0;
        let failureCount = 0;
        
        this.connectedClients.forEach((clientInfo, ws) => {
            if (this.sendToClient(ws, message)) {
                successCount++;
            } else {
                failureCount++;
            }
        });
        
        console.log(`📡 Broadcast complete: ${successCount} sent, ${failureCount} failed`);
        
        return { successCount, failureCount };
    }
    
    /**
     * Send message to a specific client
     */
    sendToClient(ws, message) {
        try {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
                return true;
            } else {
                // Remove disconnected client
                this.connectedClients.delete(ws);
                return false;
            }
        } catch (error) {
            console.warn('⚠️ Error sending message to client:', error.message);
            this.connectedClients.delete(ws);
            return false;
        }
    }
    
    /**
     * Send error message to client
     */
    sendErrorToClient(ws, errorMessage) {
        this.sendToClient(ws, {
            type: 'ERROR',
            data: { message: errorMessage },
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Start heartbeat to keep connections alive
     */
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            this.performHeartbeat();
        }, this.heartbeatInterval);
    }
    
    /**
     * Perform heartbeat check on all clients
     */
    performHeartbeat() {
        const now = new Date();
        let activeClients = 0;
        let staleClients = 0;
        
        this.connectedClients.forEach((clientInfo, ws) => {
            const timeSinceLastPing = now - clientInfo.lastPing;
            
            if (timeSinceLastPing > this.heartbeatInterval * 2) {
                // Client is stale, remove it
                console.log(`💔 Removing stale client: ${clientInfo.id}`);
                ws.terminate();
                this.connectedClients.delete(ws);
                staleClients++;
            } else if (ws.readyState === WebSocket.OPEN) {
                // Send ping
                ws.ping();
                activeClients++;
            }
        });
        
        if (staleClients > 0) {
            console.log(`💔 Heartbeat: ${activeClients} active, ${staleClients} stale clients removed`);
        }
    }
    
    /**
     * Add message to queue for late-joining clients
     */
    addToMessageQueue(message) {
        this.messageQueue.push({
            ...message,
            queuedAt: new Date().toISOString()
        });
        
        // Limit queue size
        if (this.messageQueue.length > this.maxQueueSize) {
            this.messageQueue.shift(); // Remove oldest message
        }
    }
    
    /**
     * Send recent messages to newly connected client
     */
    sendRecentMessages(ws, maxMessages = 5) {
        const recentMessages = this.messageQueue.slice(-maxMessages);
        
        recentMessages.forEach(message => {
            this.sendToClient(ws, {
                ...message,
                isHistoric: true
            });
        });
        
        console.log(`📬 Sent ${recentMessages.length} recent messages to new client`);
    }
    
    /**
     * Calculate distance between two coordinates (in km)
     */
    calculateDistance(point1, point2) {
        const R = 6371; // Earth's radius in km
        const dLat = (point2.lat - point1.lat) * Math.PI / 180;
        const dLng = (point2.lng - point1.lng) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    /**
     * Generate unique client ID
     */
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get server status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            port: this.port,
            connectedClients: this.connectedClients.size,
            queuedMessages: this.messageQueue.length,
            uptime: this.isRunning ? Date.now() - this.startTime : 0,
            lastHeartbeat: this.heartbeatTimer ? new Date().toISOString() : null
        };
    }
    
    /**
     * Get detailed client information
     */
    getClientInfo() {
        const clients = [];
        
        this.connectedClients.forEach((clientInfo, ws) => {
            clients.push({
                id: clientInfo.id,
                connectedAt: clientInfo.connectedAt,
                lastPing: clientInfo.lastPing,
                userType: clientInfo.userType || 'guest',
                userAgent: clientInfo.userAgent,
                ip: clientInfo.ip,
                isConnected: ws.readyState === WebSocket.OPEN
            });
        });
        
        return clients;
    }
}

module.exports = EmergencyBroadcastService;