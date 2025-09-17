/**
 * Emergency Blood Request Popup System
 * Displays urgent blood requests as popups on the home page
 */

class EmergencyPopupSystem {
    constructor() {
        this.popupContainer = null;
        this.isInitialized = false;
        this.checkInterval = 2 * 60 * 1000; // Check every 2 minutes
        this.intervalId = null;
        this.lastEmergencyCheck = null;
        this.shownEmergencies = new Set(); // Track shown emergencies to avoid duplicates
        this.isPopupVisible = false;
        
        console.log('🚨 Emergency Popup System initialized');
    }
    
    /**
     * Initialize the emergency popup system
     */
    init() {
        if (this.isInitialized) {
            console.log('⚠️ Emergency popup system already initialized');
            return;
        }
        
        this.createPopupContainer();
        this.startEmergencyChecking();
        this.isInitialized = true;
        
        console.log('✅ Emergency popup system started');
    }
    
    /**
     * Create the popup container
     */
    createPopupContainer() {
        // Create main popup container
        this.popupContainer = document.createElement('div');
        this.popupContainer.id = 'emergency-popup-container';
        this.popupContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            z-index: 10000;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(5px);
        `;
        
        document.body.appendChild(this.popupContainer);
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes emergencyPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            @keyframes emergencySlideIn {
                from { 
                    opacity: 0; 
                    transform: translateY(-50px) scale(0.9); 
                }
                to { 
                    opacity: 1; 
                    transform: translateY(0) scale(1); 
                }
            }
            
            @keyframes emergencyAlert {
                0%, 100% { background: #dc2626; }
                50% { background: #ef4444; }
            }
            
            .emergency-popup {
                animation: emergencySlideIn 0.5s ease;
            }
            
            .emergency-urgent {
                animation: emergencyPulse 2s infinite;
            }
            
            .emergency-critical {
                animation: emergencyAlert 1s infinite;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Start checking for emergency requests
     */
    startEmergencyChecking() {
        // Check immediately
        this.checkEmergencyRequests();
        
        // Set up interval checking
        this.intervalId = setInterval(() => {
            this.checkEmergencyRequests();
        }, this.checkInterval);
        
        console.log(`🕐 Emergency checking started (every ${this.checkInterval / 1000 / 60} minutes)`);
    }
    
    /**
     * Stop checking for emergency requests
     */
    stopEmergencyChecking() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('🛑 Emergency checking stopped');
    }
    
    /**
     * Check for emergency requests via API
     */
    async checkEmergencyRequests() {
        try {
            console.log('🚨 Checking for emergency blood requests...');
            this.lastEmergencyCheck = new Date();
            
            const response = await fetch('/api/requests/emergency');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.data.emergencyRequests.length > 0) {
                console.log(`🚨 Found ${result.data.emergencyRequests.length} emergency requests`);
                this.showEmergencyPopup(result.data.emergencyRequests);
            } else {
                console.log('✅ No emergency requests found');
            }
            
        } catch (error) {
            console.error('❌ Error checking emergency requests:', error);
        }
    }
    
    /**
     * Show emergency popup with requests
     */
    showEmergencyPopup(emergencyRequests) {
        // Filter out already shown emergencies
        const newEmergencies = emergencyRequests.filter(req => 
            !this.shownEmergencies.has(req._id)
        );
        
        if (newEmergencies.length === 0) {
            console.log('ℹ️ All emergency requests already shown');
            return;
        }
        
        // Don't show popup if one is already visible
        if (this.isPopupVisible) {
            console.log('ℹ️ Popup already visible, skipping');
            return;
        }
        
        // Show the most critical request
        const mostCritical = newEmergencies[0];
        this.displayEmergencyPopup(mostCritical);
        
        // Mark as shown
        newEmergencies.forEach(req => this.shownEmergencies.add(req._id));
    }
    
    /**
     * Display the emergency popup
     */
    displayEmergencyPopup(request) {
        this.isPopupVisible = true;
        
        const urgencyClass = request.urgency === 'Critical' ? 'emergency-critical' : 'emergency-urgent';
        const urgencyIcon = request.urgency === 'Critical' ? '🆘' : '⚠️';
        const timeInfo = request.hoursLeft <= 24 ? 
            `${request.hoursLeft} hours left` : 
            `${request.daysLeft} days left`;
        
        this.popupContainer.innerHTML = `
            <div class=\"emergency-popup ${urgencyClass}\" style=\"
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(220, 38, 38, 0.3);
                text-align: center;
                border: 3px solid #dc2626;
            \">
                <div style=\"font-size: 3rem; margin-bottom: 15px;\">${urgencyIcon}</div>
                
                <h2 style=\"
                    color: #dc2626; 
                    margin-bottom: 10px; 
                    font-size: 1.8rem;
                    font-weight: bold;
                \">
                    EMERGENCY BLOOD REQUEST
                </h2>
                
                <div style=\"
                    background: #fef2f2;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                    border-left: 5px solid #dc2626;
                \">
                    <h3 style=\"color: #1f2937; margin-bottom: 15px; font-size: 1.2rem;\">
                        Patient: ${request.patientName}
                    </h3>
                    
                    <div style=\"display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 15px;\">
                        <div style=\"background: #dc2626; color: white; padding: 8px; border-radius: 5px;\">
                            <strong>${request.bloodGroup}</strong>
                        </div>
                        <div style=\"background: #7c2d12; color: white; padding: 8px; border-radius: 5px;\">
                            ${request.requiredUnits} Unit${request.requiredUnits > 1 ? 's' : ''}
                        </div>
                        <div style=\"background: #b91c1c; color: white; padding: 8px; border-radius: 5px;\">
                            ${request.urgency}
                        </div>
                    </div>
                    
                    <p style=\"color: #4b5563; margin-bottom: 10px;\">
                        <strong>Hospital:</strong> ${request.hospitalName}
                    </p>
                    <p style=\"color: #4b5563; margin-bottom: 10px;\">
                        <strong>Location:</strong> ${request.location}
                    </p>
                    <p style=\"color: #dc2626; font-weight: bold; font-size: 1.1rem;\">
                        ⏰ ${timeInfo}
                    </p>
                </div>
                
                ${request.additionalNotes ? `
                    <div style=\"
                        background: #fffbeb;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 15px 0;
                        border-left: 3px solid #f59e0b;
                    \">
                        <p style=\"color: #78350f; font-style: italic; margin: 0;\">
                            \"${request.additionalNotes}\"
                        </p>
                    </div>
                ` : ''}
                
                <div style=\"margin-top: 25px; display: flex; gap: 15px; justify-content: center;\">
                    <button onclick="window.emergencyPopup.respondToEmergency('${request._id}')\" style=\"
                        background: #dc2626;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 8px;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 1rem;
                        transition: all 0.3s;
                    \" onmouseover=\"this.style.background='#b91c1c'\" onmouseout=\"this.style.background='#dc2626'\">
                        🩸 I CAN HELP
                    </button>
                    
                    <button onclick="window.emergencyPopup.seeAllEmergencies()" style="
                        background: #f59e0b;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 8px;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 1rem;
                        transition: all 0.3s;
                    " onmouseover="this.style.background='#d97706'" onmouseout="this.style.background='#f59e0b'">
                        📋 SEE ALL
                    </button>
                    
                    <button onclick="window.emergencyPopup.closePopup()" style=\"
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 8px;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 1rem;
                        transition: all 0.3s;
                    \" onmouseover=\"this.style.background='#4b5563'\" onmouseout=\"this.style.background='#6b7280'\">
                        CLOSE
                    </button>
                </div>
                
                <p style=\"
                    margin-top: 20px;
                    font-size: 0.9rem;
                    color: #000000;
                    text-align: center;
                \">
                    Every second counts. Your donation can save a life! 💝
                </p>
            </div>
        `;
        
        this.popupContainer.style.display = 'flex';
        
        // Auto-close after 30 seconds
        setTimeout(() => {
            if (this.isPopupVisible) {
                this.closePopup();
            }
        }, 30000);
        
        // Play alert sound (if available)
        this.playAlertSound();
    }
    
    /**
     * Close the emergency popup
     */
    closePopup() {
        this.popupContainer.style.display = 'none';
        this.isPopupVisible = false;
        console.log('🚨 Emergency popup closed');
    }
    
    /**
     * Handle response to emergency
     */
    respondToEmergency(requestId) {
        console.log(`🩸 User wants to help with emergency request: ${requestId}`);
        
        // Close popup
        this.closePopup();
        
        // Redirect to donation page or show contact info
        window.location.href = '/donate';
    }
    
    /**
     * Show all emergency requests
     */
    seeAllEmergencies() {
        console.log('📋 User wants to see all emergency requests');
        
        // Close popup
        this.closePopup();
        
        // Redirect to request page with emergency filter
        window.location.href = '/request?filter=emergency';
    }
    
    /**
     * Play alert sound
     */
    playAlertSound() {
        try {
            // Create audio context for alert sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            
        } catch (error) {
            console.log('🔇 Could not play alert sound:', error.message);
        }
    }
    
    /**
     * Manual trigger for emergency check
     */
    manualCheck() {
        console.log('🔧 Manual emergency check triggered');
        this.checkEmergencyRequests();
    }
    
    /**
     * Get system status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isPopupVisible: this.isPopupVisible,
            lastEmergencyCheck: this.lastEmergencyCheck,
            checkInterval: this.checkInterval,
            shownEmergenciesCount: this.shownEmergencies.size
        };
    }
    
    /**
     * Reset shown emergencies (for testing)
     */
    resetShownEmergencies() {
        this.shownEmergencies.clear();
        console.log('🔄 Reset shown emergencies list');
    }
}

// Create global instance
window.emergencyPopup = new EmergencyPopupSystem();

// Auto-initialize on home page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            setTimeout(() => {
                window.emergencyPopup.init();
            }, 2000); // Start after 2 seconds to allow page to load
        }
    });
} else {
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        setTimeout(() => {
            window.emergencyPopup.init();
        }, 2000);
    }
}

console.log('✅ Emergency popup system loaded successfully');