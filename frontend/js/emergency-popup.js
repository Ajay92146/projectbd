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
        
        // Add CSS animations and responsive styles
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
            
            /* Responsive Design for Emergency Popup */
            @media (max-width: 768px) {
                .emergency-popup {
                    max-width: 320px !important;
                    width: 95% !important;
                    padding: 15px !important;
                    margin: 5px !important;
                }
                
                .emergency-popup h2 {
                    font-size: 1.2rem !important;
                }
                
                .emergency-popup .emergency-info {
                    padding: 12px !important;
                }
                
                .emergency-popup .emergency-buttons {
                    flex-direction: column !important;
                    gap: 8px !important;
                }
                
                .emergency-popup .emergency-buttons button {
                    width: 100% !important;
                    padding: 10px 15px !important;
                    font-size: 0.85rem !important;
                }
                
                .emergency-popup .blood-info-grid {
                    display: flex !important;
                    flex-wrap: wrap !important;
                    gap: 6px !important;
                }
                
                .emergency-popup .blood-info-item {
                    flex: 1 !important;
                    min-width: 80px !important;
                    padding: 4px 8px !important;
                    font-size: 0.8rem !important;
                }
            }
            
            @media (max-width: 480px) {
                .emergency-popup {
                    max-width: 300px !important;
                    width: 98% !important;
                    padding: 12px !important;
                    margin: 3px !important;
                }
                
                .emergency-popup .close-btn {
                    top: 5px !important;
                    right: 8px !important;
                    font-size: 18px !important;
                    width: 24px !important;
                    height: 24px !important;
                }
                
                .emergency-popup h2 {
                    font-size: 1.1rem !important;
                }
                
                .emergency-popup .emergency-info {
                    padding: 10px !important;
                }
                
                .emergency-popup .blood-info-item {
                    padding: 3px 6px !important;
                    font-size: 0.75rem !important;
                }
            }
            
            /* Ultra-small screens (≤320px) */
            @media (max-width: 320px) {
                .emergency-popup {
                    max-width: 280px !important;
                    width: 99% !important;
                    padding: 10px !important;
                    font-size: 0.85rem !important;
                }
                
                .emergency-popup h2 {
                    font-size: 1rem !important;
                    margin-bottom: 6px !important;
                }
                
                .emergency-popup .emergency-buttons button {
                    padding: 8px 12px !important;
                    font-size: 0.75rem !important;
                }
                
                .emergency-popup .blood-info-grid {
                    flex-direction: column !important;
                    align-items: center !important;
                }
                
                .emergency-popup .blood-info-item {
                    width: 100% !important;
                    text-align: center !important;
                    margin-bottom: 3px !important;
                }
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
            
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch('/api/requests/emergency', {
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.data && result.data.emergencyRequests && result.data.emergencyRequests.length > 0) {
                console.log(`🚨 Found ${result.data.emergencyRequests.length} emergency requests`);
                this.showEmergencyPopup(result.data.emergencyRequests);
            } else {
                console.log('✅ No emergency requests found');
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('⏱️ Emergency API request timed out');
            } else if (error.message.includes('Failed to fetch')) {
                console.error('🌐 Network error - server may be offline:', error.message);
            } else {
                console.error('❌ Error checking emergency requests:', error);
            }
            
            // Don't show error to user, just log it silently
            // System will continue checking in next interval
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
        
        // Enhanced contact information display
        const hospitalPhone = request.hospitalPhone || '911';
        const patientContact = request.patientContact || request.emergencyContact || 'Contact via hospital';
        
        this.popupContainer.innerHTML = `
            <div class="emergency-popup ${urgencyClass}" style="
                background: white;
                padding: 20px;
                border-radius: 12px;
                max-width: 380px;
                width: 85%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 15px 35px rgba(220, 38, 38, 0.4);
                text-align: center;
                border: 2px solid #dc2626;
                position: relative;
                margin: 10px;
            ">
                <!-- Close X Button -->
                <button onclick="window.emergencyPopup.closePopup()" class="close-btn" style="
                    position: absolute;
                    top: 8px;
                    right: 12px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    color: #6b7280;
                    cursor: pointer;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.3s;
                    z-index: 10;
                    line-height: 1;
                    font-weight: bold;
                " onmouseover="this.style.background='#f3f4f6'; this.style.color='#dc2626'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='none'; this.style.color='#6b7280'; this.style.transform='scale(1)'">
                    ×
                </button>
                
                <div style="font-size: 2rem; margin-bottom: 10px;">${urgencyIcon}</div>
                
                <h2 style="
                    color: #dc2626; 
                    margin-bottom: 8px; 
                    font-size: 1.3rem;
                    font-weight: bold;
                    line-height: 1.2;
                ">
                    EMERGENCY BLOOD REQUEST
                </h2>
                
                <div class="emergency-info" style="
                    background: #fef2f2;
                    padding: 14px;
                    border-radius: 8px;
                    margin: 12px 0;
                    border-left: 4px solid #dc2626;
                ">
                    <h3 style="color: #1f2937; margin-bottom: 10px; font-size: 1rem; line-height: 1.3; font-weight: 600;">
                        Patient: ${request.patientName}
                    </h3>
                    
                    <div class="blood-info-grid" style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-bottom: 10px;">
                        <div class="blood-info-item" style="background: #dc2626; color: white; padding: 5px 10px; border-radius: 4px; font-size: 0.85rem; font-weight: bold;">
                            ${request.bloodGroup}
                        </div>
                        <div class="blood-info-item" style="background: #7c2d12; color: white; padding: 5px 10px; border-radius: 4px; font-size: 0.85rem;">
                            ${request.requiredUnits} Unit${request.requiredUnits > 1 ? 's' : ''}
                        </div>
                        <div class="blood-info-item" style="background: #b91c1c; color: white; padding: 5px 10px; border-radius: 4px; font-size: 0.85rem;">
                            ${request.urgency}
                        </div>
                    </div>
                    
                    <div style="text-align: left; font-size: 0.85rem; line-height: 1.4;">
                        <p style="color: #4b5563; margin-bottom: 4px;">
                            <strong>🏥 Hospital:</strong> ${request.hospitalName}
                        </p>
                        <p style="color: #4b5563; margin-bottom: 4px;">
                            <strong>📍 Location:</strong> ${request.location}
                        </p>
                        
                        <!-- Enhanced Contact Information -->
                        <div style="background: #f0f9ff; padding: 8px; border-radius: 6px; margin: 8px 0; border-left: 3px solid #0ea5e9;">
                            <p style="color: #0c4a6e; margin-bottom: 3px; font-size: 0.8rem;">
                                <strong>📞 Hospital Phone:</strong> 
                                <a href="tel:${hospitalPhone}" style="color: #dc2626; text-decoration: none; font-weight: bold;"
                                   onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
                                    ${hospitalPhone}
                                </a>
                            </p>
                            <p style="color: #0c4a6e; margin: 0; font-size: 0.8rem;">
                                <strong>📱 Emergency Contact:</strong> 
                                ${typeof patientContact === 'string' && patientContact.match(/^[\d\+\-\s\(\)]+$/) ? 
                                    `<a href="tel:${patientContact}" style="color: #dc2626; text-decoration: none; font-weight: bold;"
                                       onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
                                        ${patientContact}
                                    </a>` : 
                                    `<span style="color: #6b7280;">${patientContact}</span>`
                                }
                            </p>
                        </div>
                        
                        <p style="color: #dc2626; font-weight: bold; font-size: 0.9rem; text-align: center; margin-top: 6px;">
                            ⏰ ${timeInfo}
                        </p>
                    </div>
                </div>
                
                ${request.additionalNotes ? `
                    <div style="
                        background: #fffbeb;
                        padding: 10px;
                        border-radius: 6px;
                        margin: 10px 0;
                        border-left: 3px solid #f59e0b;
                    ">
                        <p style="color: #78350f; font-style: italic; margin: 0; font-size: 0.8rem; line-height: 1.3;">
                            "${request.additionalNotes}"
                        </p>
                    </div>
                ` : ''}
                
                <div class="emergency-buttons" style="margin-top: 16px; display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;">
                    <button onclick="window.emergencyPopup.respondToEmergency('${request._id}', '${request.patientName}', '${request.bloodGroup}')" style="
                        background: #dc2626;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 0.85rem;
                        transition: all 0.3s;
                        flex: 1;
                        min-width: 90px;
                    " onmouseover="this.style.background='#b91c1c'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#dc2626'; this.style.transform='translateY(0)'">
                        🩸 I CAN HELP
                    </button>
                    
                    <button onclick="window.emergencyPopup.seeAllEmergencies()" style="
                        background: #f59e0b;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 0.85rem;
                        transition: all 0.3s;
                        flex: 1;
                        min-width: 90px;
                    " onmouseover="this.style.background='#d97706'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#f59e0b'; this.style.transform='translateY(0)'">
                        📋 SEE ALL
                    </button>
                </div>
                
                <div style="margin-top: 12px;">
                    <button onclick="window.emergencyPopup.closePopup()" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 6px 18px;
                        border-radius: 5px;
                        font-weight: 500;
                        cursor: pointer;
                        font-size: 0.8rem;
                        transition: all 0.3s;
                    " onmouseover="this.style.background='#4b5563'; this.style.transform='translateY(-1px)'" onmouseout="this.style.background='#6b7280'; this.style.transform='translateY(0)'">
                        CLOSE
                    </button>
                </div>
                
                <p style="
                    margin-top: 12px;
                    font-size: 0.75rem;
                    color: #000000;
                    text-align: center;
                    line-height: 1.3;
                ">
                    Every second counts. Your donation can save a life! 💖
                </p>
            </div>
        `;
        
        this.popupContainer.style.display = 'flex';
        
        // Add click outside to close functionality
        this.popupContainer.onclick = (e) => {
            if (e.target === this.popupContainer) {
                this.closePopup();
            }
        };
        
        // Add keyboard escape functionality
        this.escapeHandler = (e) => {
            if (e.key === 'Escape' && this.isPopupVisible) {
                this.closePopup();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
        
        // Auto-close after 15 seconds (increased from 10)
        this.autoCloseTimeout = setTimeout(() => {
            if (this.isPopupVisible) {
                this.closePopup();
            }
        }, 15000);
        
        // Play alert sound (if available)
        this.playAlertSound();
    }
    
    /**
     * Close the emergency popup
     */
    closePopup() {
        if (!this.isPopupVisible) {
            return;
        }
        
        // Add closing animation
        const popup = this.popupContainer.querySelector('.emergency-popup');
        if (popup) {
            popup.style.transform = 'scale(0.95)';
            popup.style.opacity = '0';
            popup.style.transition = 'all 0.3s ease';
        }
        
        // Clear timeouts
        if (this.autoCloseTimeout) {
            clearTimeout(this.autoCloseTimeout);
            this.autoCloseTimeout = null;
        }
        
        // Remove event listeners
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }
        
        // Hide popup after animation
        setTimeout(() => {
            this.popupContainer.style.display = 'none';
            this.isPopupVisible = false;
            
            // Reset popup content
            this.popupContainer.innerHTML = '';
        }, 300);
        
        console.log('🚨 Emergency popup closed');
    }
    
    /**
     * Handle response to emergency
     */
    respondToEmergency(requestId, patientName, bloodGroup) {
        console.log(`🩸 User wants to help with emergency request: ${requestId}`);
        
        // Show confirmation dialog with patient details
        const confirmed = confirm(
            `🩸 Thank you for wanting to help ${patientName || 'this patient'}!\n\n` +
            `Blood Type Needed: ${bloodGroup || 'Not specified'}\n\n` +
            `You'll be redirected to the donation page where you can:\n` +
            `• Register as a blood donor\n` +
            `• Find nearby donation centers\n` +
            `• Contact the hospital directly\n\n` +
            `Ready to proceed and save a life?`
        );
        
        if (!confirmed) {
            return;
        }
        
        // Store emergency context in session storage for the donation page
        try {
            sessionStorage.setItem('emergencyRequestId', requestId);
            sessionStorage.setItem('emergencyPatientName', patientName || '');
            sessionStorage.setItem('emergencyBloodGroup', bloodGroup || '');
            sessionStorage.setItem('emergencyTimestamp', new Date().toISOString());
            sessionStorage.setItem('emergencySource', 'popup');
        } catch (error) {
            console.warn('Could not store emergency context:', error);
        }
        
        // Close popup with animation
        this.closePopup();
        
        // Navigate to donation page with emergency context
        setTimeout(() => {
            this.navigateToDonationPage(requestId, bloodGroup);
        }, 300);
    }
    
    /**
     * Navigate to donation page with proper URL handling
     */
    navigateToDonationPage(requestId, bloodGroup) {
        const baseURL = window.location.origin;
        const currentPath = window.location.pathname;
        
        let donateURL;
        if (currentPath.includes('/frontend/')) {
            donateURL = `${baseURL}/frontend/donate.html`;
        } else {
            donateURL = `${baseURL}/donate`;
        }
        
        // Add emergency parameters to URL
        const urlParams = new URLSearchParams();
        urlParams.set('emergency', 'true');
        urlParams.set('requestId', requestId);
        urlParams.set('bloodType', bloodGroup || '');
        urlParams.set('source', 'emergency_popup');
        
        const finalURL = `${donateURL}?${urlParams.toString()}`;
        
        console.log(`🔗 Navigating to donation page: ${finalURL}`);
        
        // Navigate to the donation page
        window.location.href = finalURL;
    }
    
    /**
     * Show all emergency requests
     */
    seeAllEmergencies() {
        console.log('📋 User wants to see all emergency requests');
        
        // Close current popup
        this.closePopup();
        
        // Show loading state
        this.showLoadingModal();
        
        // Fetch all emergency requests
        this.fetchAllEmergencyRequests();
    }
    
    /**
     * Show loading modal for pending requests
     */
    showLoadingModal() {
        this.popupContainer.innerHTML = `
            <div class="emergency-popup" style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
            ">
                <div style="font-size: 2rem; margin-bottom: 20px;">🔄</div>
                <h3 style="color: #dc2626; margin-bottom: 15px;">Loading Emergency Requests...</h3>
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid #fee2e2;
                    border-top: 4px solid #dc2626;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                ">
                </div>
                <p style="color: #6b7280; margin-top: 15px; font-size: 0.9rem;">Please wait...</p>
            </div>
            
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        this.popupContainer.style.display = 'flex';
        this.isPopupVisible = true;
    }
    
    /**
     * Fetch all emergency requests from API
     */
    async fetchAllEmergencyRequests() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch('/api/requests/emergency/all', {
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.data && result.data.emergencyRequests) {
                this.displayAllEmergencyRequests(result.data.emergencyRequests);
            } else {
                this.showNoRequestsFound();
            }
            
        } catch (error) {
            console.error('Error fetching all emergency requests:', error);
            this.showEmergencyRequestsError();
        }
    }
    
    /**
     * Display all emergency requests in a scrollable modal
     */
    displayAllEmergencyRequests(requests) {
        if (!requests || requests.length === 0) {
            this.showNoRequestsFound();
            return;
        }
        
        const requestsHtml = requests.map((request, index) => {
            const urgencyIcon = request.urgency === 'Critical' ? '🆘' : '⚠️';
            const timeInfo = request.hoursLeft <= 24 ? 
                `${request.hoursLeft} hours left` : 
                `${request.daysLeft} days left`;
            const hospitalPhone = request.hospitalPhone || '911';
            
            return `
                <div class="request-item" style="
                    background: ${request.urgency === 'Critical' ? '#fef2f2' : '#fffbeb'};
                    border: 2px solid ${request.urgency === 'Critical' ? '#dc2626' : '#f59e0b'};
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 12px;
                    text-align: left;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <h4 style="color: #1f2937; margin: 0; font-size: 1rem;">
                            ${urgencyIcon} ${request.patientName}
                        </h4>
                        <span style="
                            background: ${request.urgency === 'Critical' ? '#dc2626' : '#f59e0b'};
                            color: white;
                            padding: 2px 8px;
                            border-radius: 4px;
                            font-size: 0.75rem;
                            font-weight: bold;
                        ">
                            ${request.bloodGroup}
                        </span>
                    </div>
                    
                    <div style="font-size: 0.8rem; color: #4b5563; line-height: 1.4;">
                        <p style="margin: 2px 0;">🏥 ${request.hospitalName}</p>
                        <p style="margin: 2px 0;">📍 ${request.location}</p>
                        <p style="margin: 2px 0;">📞 <a href="tel:${hospitalPhone}" style="color: #dc2626;">${hospitalPhone}</a></p>
                        <p style="margin: 4px 0; color: #dc2626; font-weight: bold;">⏰ ${timeInfo}</p>
                    </div>
                    
                    <div style="display: flex; gap: 8px; margin-top: 10px;">
                        <button onclick="window.emergencyPopup.respondToEmergency('${request._id}', '${request.patientName}', '${request.bloodGroup}')" style="
                            background: #dc2626;
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: 4px;
                            font-size: 0.75rem;
                            cursor: pointer;
                            flex: 1;
                        ">
                            🩸 Help
                        </button>
                        <button onclick="window.emergencyPopup.shareEmergencyRequest('${request._id}')" style="
                            background: #2563eb;
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: 4px;
                            font-size: 0.75rem;
                            cursor: pointer;
                            flex: 1;
                        ">
                            📲 Share
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        this.popupContainer.innerHTML = `
            <div class="emergency-popup" style="
                background: white;
                padding: 20px;
                border-radius: 12px;
                max-width: 500px;
                width: 95%;
                max-height: 80vh;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
                position: relative;
            ">
                <button onclick="window.emergencyPopup.closePopup()" style="
                    position: absolute;
                    top: 10px;
                    right: 15px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: #6b7280;
                    cursor: pointer;
                    z-index: 10;
                " onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#6b7280'">
                    ×
                </button>
                
                <h2 style="color: #dc2626; margin-bottom: 20px; text-align: center; font-size: 1.3rem;">
                    🚨 All Emergency Requests
                </h2>
                
                <div style="
                    max-height: 50vh;
                    overflow-y: auto;
                    padding-right: 10px;
                    margin-bottom: 15px;
                ">
                    ${requestsHtml}
                </div>
                
                <div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 0.85rem; margin-bottom: 10px;">
                        🔄 Updated: ${new Date().toLocaleTimeString()}
                    </p>
                    <button onclick="window.emergencyPopup.closePopup()" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 8px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.85rem;
                    ">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        // Add click outside to close
        this.popupContainer.onclick = (e) => {
            if (e.target === this.popupContainer) {
                this.closePopup();
            }
        };
    }
    
    /**
     * Show no requests found message
     */
    showNoRequestsFound() {
        this.popupContainer.innerHTML = `
            <div class="emergency-popup" style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
            ">
                <div style="font-size: 3rem; margin-bottom: 20px;">✅</div>
                <h3 style="color: #059669; margin-bottom: 15px;">Great News!</h3>
                <p style="color: #6b7280; font-size: 1rem; margin-bottom: 20px;">
                    No emergency blood requests at the moment.
                </p>
                <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 25px;">
                    All critical needs are currently being addressed.
                </p>
                <button onclick="window.emergencyPopup.closePopup()" style="
                    background: #dc2626;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                ">
                    Close
                </button>
            </div>
        `;
    }
    
    /**
     * Show error when fetching emergency requests fails
     */
    showEmergencyRequestsError() {
        this.popupContainer.innerHTML = `
            <div class="emergency-popup" style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
            ">
                <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
                <h3 style="color: #dc2626; margin-bottom: 15px;">Connection Error</h3>
                <p style="color: #6b7280; font-size: 1rem; margin-bottom: 20px;">
                    Unable to load emergency requests at the moment.
                </p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="window.emergencyPopup.fetchAllEmergencyRequests()" style="
                        background: #dc2626;
                        color: white;
                        border: none;
                        padding: 10px 15px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.9rem;
                    ">
                        🔄 Retry
                    </button>
                    <button onclick="window.emergencyPopup.closePopup()" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 10px 15px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.9rem;
                    ">
                        Close
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Share emergency request
     */
    shareEmergencyRequest(requestId) {
        const request = this.urgentRequests?.find(req => req._id === requestId);
        if (!request) {
            console.error('Request not found for sharing:', requestId);
            return;
        }
        
        const shareText = `🆘 EMERGENCY BLOOD REQUEST\n\n` +
                         `Patient: ${request.patientName}\n` +
                         `Blood Type: ${request.bloodGroup}\n` +
                         `Hospital: ${request.hospitalName}\n` +
                         `Location: ${request.location}\n` +
                         `Urgency: ${request.urgency}\n\n` +
                         `Every donation saves lives! Please help or share.\n\n` +
                         `${window.location.origin}`;
        
        if (navigator.share) {
            navigator.share({
                title: `EMERGENCY: ${request.bloodGroup} Blood Needed`,
                text: shareText,
                url: window.location.href
            }).catch(err => console.log('Error sharing:', err));
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Emergency request details copied to clipboard!');
            }).catch(() => {
                alert('Please manually copy and share this emergency request.');
            });
        }
    }
    
    /**
     * Play alert sound
     */
    playAlertSound() {
        try {
            // Check if audio is allowed and context exists
            if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') {
                console.log('🔇 Audio API not supported in this browser');
                return;
            }
            
            // Create audio context for alert sound
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContextClass();
            
            // Check if audio context is allowed
            if (audioContext.state === 'suspended') {
                console.log('🔇 Audio context suspended - user interaction required');
                return;
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Emergency alert sound pattern
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
            
            // Volume control
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            
            console.log('🔔 Emergency alert sound played');
            
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
     * Test emergency popup with sample data
     */
    testPopup() {
        console.log('🧪 Testing emergency popup with enhanced sample data');
        const sampleRequest = {
            _id: 'test-123',
            patientName: 'Kiran Shah',
            bloodGroup: 'B+',
            requiredUnits: 3,
            urgency: 'Critical',
            hospitalName: 'Sterling Hospital',
            location: 'Ahmedabad, Gujarat',
            hospitalPhone: '+91-9876543210',
            patientContact: '+91-9123456789',
            emergencyContact: '+91-9123456789',
            hoursLeft: 18,
            daysLeft: 3,
            additionalNotes: 'Emergency surgery required. Multiple units needed.'
        };
        
        this.displayEmergencyPopup(sampleRequest);
    }
    
    /**
     * Test all emergency requests view
     */
    testAllEmergencies() {
        console.log('🧪 Testing all emergency requests view');
        const sampleRequests = [
            {
                _id: 'test-1',
                patientName: 'Kiran Shah',
                bloodGroup: 'B+',
                requiredUnits: 3,
                urgency: 'Critical',
                hospitalName: 'Sterling Hospital',
                location: 'Ahmedabad, Gujarat',
                hospitalPhone: '+91-9876543210',
                hoursLeft: 18,
                daysLeft: 3
            },
            {
                _id: 'test-2',
                patientName: 'Rajesh Patel',
                bloodGroup: 'O-',
                requiredUnits: 2,
                urgency: 'High',
                hospitalName: 'Apollo Hospital',
                location: 'Mumbai, Maharashtra',
                hospitalPhone: '+91-9876543211',
                hoursLeft: 6,
                daysLeft: 1
            },
            {
                _id: 'test-3',
                patientName: 'Priya Sharma',
                bloodGroup: 'A+',
                requiredUnits: 1,
                urgency: 'Critical',
                hospitalName: 'Fortis Hospital',
                location: 'Delhi, NCR',
                hospitalPhone: '+91-9876543212',
                hoursLeft: 12,
                daysLeft: 2
            }
        ];
        
        this.displayAllEmergencyRequests(sampleRequests);
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
    
    /**
     * Comprehensive system test
     */
    runSystemTest() {
        console.log('🧪 Starting Emergency Popup System Test...');
        
        const testResults = {
            initialization: false,
            containerExists: false,
            apiConnectivity: false,
            popupDisplay: false,
            interactions: false
        };
        
        try {
            // Test 1: Initialization
            testResults.initialization = this.isInitialized;
            console.log(`1. Initialization: ${testResults.initialization ? '✅' : '❌'}`);
            
            // Test 2: Container exists
            testResults.containerExists = !!document.getElementById('emergency-popup-container');
            console.log(`2. Container exists: ${testResults.containerExists ? '✅' : '❌'}`);
            
            // Test 3: Test popup display
            if (testResults.containerExists) {
                this.testPopup();
                testResults.popupDisplay = true;
                console.log('3. Popup display: ✅ (test popup shown)');
            } else {
                console.log('3. Popup display: ❌ (container missing)');
            }
            
            // Test 4: API connectivity (async)
            this.checkEmergencyRequests().then(() => {
                testResults.apiConnectivity = true;
                console.log('4. API connectivity: ✅');
            }).catch(() => {
                console.log('4. API connectivity: ❌');
            });
            
            // Test 5: Interactions
            testResults.interactions = typeof this.closePopup === 'function' && 
                                     typeof this.respondToEmergency === 'function' &&
                                     typeof this.seeAllEmergencies === 'function';
            console.log(`5. Interactions: ${testResults.interactions ? '✅' : '❌'}`);
            
            const passedTests = Object.values(testResults).filter(Boolean).length;
            console.log(`📊 Test Results: ${passedTests}/5 tests passed`);
            
            return testResults;
            
        } catch (error) {
            console.error('❌ Error during system test:', error);
            return testResults;
        }
    }
}

// Create global instance
window.emergencyPopup = new EmergencyPopupSystem();

// Auto-initialize on home page
function initializeEmergencyPopup() {
    // Check if we're on the home page
    const isHomePage = window.location.pathname === '/' || 
                      window.location.pathname === '/index.html' || 
                      window.location.pathname === '' ||
                      window.location.pathname.endsWith('/index.html');
    
    if (isHomePage) {
        console.log('🏠 On home page, initializing emergency popup system...');
        setTimeout(() => {
            try {
                if (window.emergencyPopup && !window.emergencyPopup.isInitialized) {
                    window.emergencyPopup.init();
                } else {
                    console.log('⚠️ Emergency popup already initialized or not available');
                }
            } catch (error) {
                console.error('❌ Error initializing emergency popup:', error);
            }
        }, 2000); // Start after 2 seconds to allow page to load
    } else {
        console.log('📄 Not on home page, skipping emergency popup initialization');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEmergencyPopup);
} else {
    initializeEmergencyPopup();
}

console.log('✅ Emergency popup system loaded successfully');