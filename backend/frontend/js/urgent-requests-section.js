/**
 * Urgent Requests Section for Home Page
 * Displays urgent blood requests in a dedicated section
 */

class UrgentRequestsSection {
    constructor() {
        this.sectionContainer = null;
        this.isInitialized = false;
        this.refreshInterval = 3 * 60 * 1000; // Refresh every 3 minutes
        this.intervalId = null;
        this.lastUpdate = null;
        this.urgentRequests = [];
        this.cache = {
            data: null,
            timestamp: null,
            ttl: 2 * 60 * 1000 // 2 minutes cache
        };
        this.retryCount = 0;
        this.maxRetries = 3;
        
        console.log('🆘 Urgent Requests Section initialized');
    }
    
    /**
     * Initialize the urgent requests section
     */
    init() {
        if (this.isInitialized) {
            console.log('⚠️ Urgent requests section already initialized');
            return;
        }
        
        this.createUrgentSection();
        
        // Try to load from cache first for faster initial display
        if (!this.loadFromCache()) {
            this.loadUrgentRequests();
        } else {
            // Still fetch fresh data in background
            setTimeout(() => this.loadUrgentRequests(), 1000);
        }
        
        this.startAutoRefresh();
        this.isInitialized = true;
        
        console.log('✅ Urgent requests section started');
    }
    
    /**
     * Create the urgent requests section in the home page
     */
    createUrgentSection() {
        // Find the best location - prioritize insertion after hero but before blood facts
        const heroSection = document.querySelector('.hero') || 
                           document.querySelector('.hero-section');
        const bloodFactsSection = document.querySelector('.blood-facts');
        const quickActionsSection = document.querySelector('.quick-actions');
        
        let insertionPoint = null;
        let insertAfter = null;
        
        if (heroSection && bloodFactsSection) {
            // Insert between hero and blood facts for maximum visibility
            insertionPoint = heroSection.parentNode;
            insertAfter = heroSection;
        } else if (heroSection && quickActionsSection) {
            // Insert between hero and quick actions
            insertionPoint = heroSection.parentNode;
            insertAfter = heroSection;
        } else if (heroSection) {
            // Insert after hero
            insertionPoint = heroSection.parentNode;
            insertAfter = heroSection;
        } else {
            // Fallback: insert at beginning of body
            insertionPoint = document.body;
            insertAfter = document.body.firstElementChild;
        }
        
        if (!insertionPoint) {
            console.error('❌ Could not find suitable location for urgent requests section');
            return;
        }
        
        // Create the urgent requests section with enhanced styling
        this.sectionContainer = document.createElement('section');
        this.sectionContainer.id = 'urgent-requests-section';
        this.sectionContainer.setAttribute('role', 'region');
        this.sectionContainer.setAttribute('aria-label', 'Urgent Blood Requests');
        
        // Enhanced styling for maximum visual impact
        this.sectionContainer.style.cssText = `
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fecaca 100%);
            padding: 80px 20px;
            margin: 0;
            border-top: 5px solid #dc2626;
            border-bottom: 5px solid #dc2626;
            box-shadow: 0 10px 40px rgba(220, 38, 38, 0.15);
            position: relative;
            overflow: hidden;
        `;
        
        // Add background pattern for visual appeal
        const backgroundPattern = document.createElement('div');
        backgroundPattern.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: radial-gradient(circle at 25% 25%, rgba(220, 38, 38, 0.05) 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, rgba(220, 38, 38, 0.05) 0%, transparent 50%);
            pointer-events: none;
            z-index: 1;
        `;
        this.sectionContainer.appendChild(backgroundPattern);
        
        // Insert the section in the optimal position
        if (insertAfter && insertAfter.nextSibling) {
            insertionPoint.insertBefore(this.sectionContainer, insertAfter.nextSibling);
        } else {
            insertionPoint.appendChild(this.sectionContainer);
        }
        
        console.log('✅ Urgent requests section inserted after:', insertAfter?.tagName || 'body start');
        
        this.addEnhancedStyles();
        this.renderEmptySection();
        this.initKeyboardNavigation();
    }
    
    /**
     * Add enhanced CSS styles for better visual impact
     */
    addEnhancedStyles() {
        const style = document.createElement('style');
        style.id = 'urgent-requests-enhanced-styles';
        style.textContent = `
            /* Enhanced Urgent Requests Animations */
            @keyframes urgentPulse {
                0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.6); }
                50% { transform: scale(1.03); box-shadow: 0 0 0 15px rgba(220, 38, 38, 0); }
            }
            
            @keyframes urgentSlideIn {
                from { 
                    opacity: 0; 
                    transform: translateY(30px) scale(0.95); 
                }
                to { 
                    opacity: 1; 
                    transform: translateY(0) scale(1); 
                }
            }
            
            @keyframes urgentGlow {
                0%, 100% { box-shadow: 0 10px 25px rgba(220, 38, 38, 0.2); }
                50% { box-shadow: 0 15px 35px rgba(220, 38, 38, 0.4); }
            }
            
            @keyframes countdownPulse {
                0%, 100% { background: #dc2626; }
                50% { background: #ef4444; }
            }
            
            /* Section Header Enhancements */
            #urgent-requests-section h2 {
                text-shadow: 2px 2px 4px rgba(220, 38, 38, 0.3);
                position: relative;
                z-index: 2;
            }
            
            /* Enhanced Card Styling */
            .urgent-card {
                animation: urgentSlideIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            
            .urgent-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 2px;
                background: linear-gradient(90deg, transparent, #dc2626, transparent);
                transition: left 0.6s;
            }
            
            .urgent-card:hover::before {
                left: 100%;
            }
            
            .urgent-card:hover {
                transform: translateY(-8px) scale(1.02);
                box-shadow: 0 20px 40px rgba(220, 38, 38, 0.25);
            }
            
            .urgent-critical {
                animation: urgentPulse 2.5s infinite, urgentSlideIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                border-color: #dc2626 !important;
            }
            
            .urgent-critical .urgent-blood-type {
                animation: countdownPulse 1.5s infinite;
            }
            
            /* Enhanced Blood Type Badge */
            .urgent-blood-type {
                background: linear-gradient(135deg, #dc2626, #b91c1c, #991b1b);
                color: white;
                padding: 10px 16px;
                border-radius: 25px;
                font-weight: bold;
                display: inline-block;
                margin: 5px;
                min-width: 60px;
                text-align: center;
                box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
                font-size: 1.1rem;
                letter-spacing: 0.5px;
            }
            
            /* Enhanced Button Styling */
            .urgent-card button {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                position: relative;
                overflow: hidden;
            }
            
            .urgent-card button::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                transition: width 0.3s, height 0.3s;
            }
            
            .urgent-card button:hover::before {
                width: 200px;
                height: 200px;
            }
            
            /* Responsive Enhancements */
            @media (max-width: 768px) {
                .urgent-grid {
                    grid-template-columns: 1fr !important;
                    gap: 20px !important;
                }
                
                .urgent-card {
                    margin: 0 10px;
                }
                
                #urgent-requests-section {
                    padding: 60px 15px !important;
                }
            }
            
            @media (max-width: 480px) {
                .urgent-card {
                    padding: 20px !important;
                }
                
                .urgent-blood-type {
                    font-size: 1rem !important;
                    padding: 8px 12px !important;
                }
                
                #urgent-requests-section {
                    padding: 40px 10px !important;
                }
            }
            
            /* Accessibility Enhancements */
            .urgent-card:focus-within {
                outline: 3px solid #dc2626;
                outline-offset: 2px;
            }
            
            .urgent-card:focus {
                outline: 3px solid #dc2626;
                outline-offset: 2px;
                box-shadow: 0 0 0 6px rgba(220, 38, 38, 0.2);
            }
            
            .urgent-card button:focus {
                outline: 2px solid #dc2626;
                outline-offset: 2px;
                box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.3);
            }
            
            /* Screen reader only content */
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
            
            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .urgent-card {
                    border-width: 3px !important;
                }
                
                .urgent-blood-type {
                    border: 2px solid currentColor;
                }
                
                .urgent-card button {
                    border: 2px solid currentColor;
                }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .urgent-card {
                    animation: none;
                }
                
                .urgent-critical {
                    animation: none;
                }
                
                .urgent-critical .urgent-blood-type {
                    animation: none;
                }
                
                .urgent-loading {
                    animation: none;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(0deg); }
                }
            }
            
            /* Loading State Enhancements */
            .urgent-loading {
                animation: urgentGlow 2s infinite;
            }
        `;
        
        // Remove existing style if it exists
        const existingStyle = document.getElementById('urgent-requests-enhanced-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);
        console.log('✨ Enhanced styles added for urgent requests section');
    }
    
    /**
     * Render empty section with loading state
     */
    renderEmptySection() {
        this.sectionContainer.innerHTML = `
            <div style="max-width: 1200px; margin: 0 auto; text-align: center; position: relative; z-index: 2;">
                <!-- Enhanced Section Header -->
                <div style="margin-bottom: 50px; position: relative;">
                    <div style="
                        display: inline-block;
                        background: rgba(220, 38, 38, 0.1);
                        padding: 15px 30px;
                        border-radius: 50px;
                        margin-bottom: 20px;
                        border: 2px solid rgba(220, 38, 38, 0.3);
                    ">
                        <span style="font-size: 2rem; margin-right: 10px;">🆘</span>
                        <span style="
                            color: #7c2d12;
                            font-weight: bold;
                            font-size: 0.9rem;
                            text-transform: uppercase;
                            letter-spacing: 2px;
                        ">Critical Alert</span>
                    </div>
                    
                    <h2 style="
                        color: #dc2626;
                        font-size: clamp(2rem, 5vw, 3rem);
                        font-weight: 900;
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 20px;
                        line-height: 1.2;
                    ">
                        <span style="font-size: 1.2em;">🆘</span>
                        <span>URGENT BLOOD REQUESTS</span>
                        <span style="font-size: 1.2em;">🆘</span>
                    </h2>
                    
                    <div style="
                        background: linear-gradient(135deg, #dc2626, #b91c1c);
                        color: white;
                        padding: 20px 40px;
                        border-radius: 15px;
                        max-width: 800px;
                        margin: 0 auto;
                        box-shadow: 0 10px 30px rgba(220, 38, 38, 0.3);
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="
                            position: absolute;
                            top: -50%;
                            right: -10%;
                            width: 100px;
                            height: 100px;
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 50%;
                            pointer-events: none;
                        "></div>
                        <p style="
                            font-size: clamp(1rem, 3vw, 1.3rem);
                            margin: 0;
                            line-height: 1.6;
                            position: relative;
                            z-index: 1;
                        ">
                            <strong>💖 Every second counts.</strong> These patients urgently need your help.<br>
                            <span style="opacity: 0.9;">Your donation can save lives right now.</span>
                        </p>
                    </div>
                    
                    <!-- Animated pulse indicator -->
                    <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 300px;
                        height: 300px;
                        border: 2px solid rgba(220, 38, 38, 0.2);
                        border-radius: 50%;
                        animation: urgentPulse 3s infinite;
                        pointer-events: none;
                        z-index: 0;
                    "></div>
                </div>
                
                <div id="urgent-requests-content" style="position: relative; z-index: 2;">
                    <div class="urgent-loading" style="
                        background: white;
                        padding: 50px;
                        border-radius: 20px;
                        box-shadow: 0 15px 35px rgba(220, 38, 38, 0.15);
                        border: 3px dashed #dc2626;
                        max-width: 600px;
                        margin: 0 auto;
                    ">
                        <div style="
                            width: 60px;
                            height: 60px;
                            border: 4px solid #fee2e2;
                            border-top: 4px solid #dc2626;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                            margin: 0 auto 25px;
                        "></div>
                        <h3 style="color: #dc2626; margin-bottom: 15px; font-size: 1.5rem; font-weight: bold;">
                            Loading Urgent Requests...
                        </h3>
                        <p style="color: #6b7280; font-size: 1.1rem; margin-bottom: 0;">
                            Checking for patients who need immediate help
                        </p>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }
    
    /**
     * Load urgent requests from API
     */
    async loadUrgentRequests() {
        try {
            console.log('🆘 Loading urgent blood requests...');
            this.lastUpdate = new Date();
            
            console.log('📡 Making API request to /api/requests/urgent');
            
            // Add timeout and better error handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch('/api/requests/urgent', {
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            console.log('📥 Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('📋 API Response:', result);
            
            if (result.success) {
                console.log('✅ API Success, checking data structure...');
                console.log('📊 Result data:', result.data);
                
                this.urgentRequests = result.data.urgentRequests || [];
                console.log(`📝 Urgent requests array:`, this.urgentRequests);
                
                this.renderUrgentRequests();
                this.announceToScreenReader(`${this.urgentRequests.length} urgent blood requests loaded`);
                console.log(`✅ Loaded ${this.urgentRequests.length} urgent requests`);
            } else {
                throw new Error(result.message || 'Failed to load urgent requests');
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('⏱️ Urgent requests API timed out');
                this.renderTimeoutState();
            } else if (error.message.includes('Failed to fetch')) {
                console.error('🌐 Network error - server may be offline:', error.message);
                this.renderNetworkErrorState();
            } else {
                console.error('❌ Error loading urgent requests:', error);
                console.error('🔍 Error details:', {
                    message: error.message,
                    stack: error.stack
                });
                this.renderErrorState();
            }
        }
    }
    
    /**
     * Cache result for performance
     */
    cacheResult(result) {
        this.cache.data = result;
        this.cache.timestamp = new Date();
        console.log('💾 Cached urgent requests data');
    }
    
    /**
     * Check if cache is valid
     */
    isCacheValid() {
        if (!this.cache.data || !this.cache.timestamp) {
            return false;
        }
        
        const now = new Date();
        const age = now - this.cache.timestamp;
        return age < this.cache.ttl;
    }
    
    /**
     * Load from cache if available
     */
    loadFromCache() {
        if (this.isCacheValid()) {
            console.log('💾 Loading urgent requests from cache');
            const result = this.cache.data;
            this.urgentRequests = result.data.urgentRequests || [];
            this.renderUrgentRequests();
            return true;
        }
        return false;
    }
    
    /**
     * Render timeout state
     */
    renderTimeoutState() {
        const contentDiv = document.getElementById('urgent-requests-content');
        contentDiv.innerHTML = `
            <div role="alert" style="
                background: white;
                padding: 40px;
                border-radius: 15px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                border: 2px solid #f59e0b;
            ">
                <div style="font-size: 3rem; margin-bottom: 20px;" aria-hidden="true">⏱️</div>
                <h3 style="color: #d97706; margin-bottom: 10px; font-size: 1.4rem;">Request Timed Out</h3>
                <p style="color: #6b7280; font-size: 1rem; margin-bottom: 20px;">The server is taking longer than expected to respond.</p>
                <button onclick="window.urgentSection.refreshRequests()" 
                        aria-label="Retry loading urgent blood requests"
                        style="
                    background: #dc2626;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 1rem;
                ">
                    <span aria-hidden="true">🔄</span> Try Again
                </button>
            </div>
        `;
        this.announceToScreenReader('Loading timed out. Please try again.', 'assertive');
    }
    
    /**
     * Render network error state
     */
    renderNetworkErrorState() {
        const contentDiv = document.getElementById('urgent-requests-content');
        contentDiv.innerHTML = `
            <div role="alert" style="
                background: white;
                padding: 40px;
                border-radius: 15px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                border: 2px solid #ef4444;
            ">
                <div style="font-size: 3rem; margin-bottom: 20px;" aria-hidden="true">🌐</div>
                <h3 style="color: #dc2626; margin-bottom: 10px; font-size: 1.4rem;">Network Error</h3>
                <p style="color: #6b7280; font-size: 1rem; margin-bottom: 20px;">Unable to connect to the server. Please check your internet connection.</p>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;" role="group" aria-label="Recovery options">
                    <button onclick="window.urgentSection.refreshRequests()" 
                            aria-label="Retry loading urgent blood requests"
                            style="
                        background: #dc2626;
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 8px;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 0.9rem;
                    ">
                        <span aria-hidden="true">🔄</span> Retry
                    </button>
                    <button onclick="window.urgentSection.loadFromCache()" 
                            aria-label="Load cached urgent blood requests"
                            style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 8px;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 0.9rem;
                    ">
                        <span aria-hidden="true">💾</span> Load Cached
                    </button>
                </div>
            </div>
        `;
        this.announceToScreenReader('Network error occurred. Please check your internet connection.', 'assertive');
    }
    
    /**
     * Render urgent requests
     */
    renderUrgentRequests() {
        const contentDiv = document.getElementById('urgent-requests-content');
        
        if (this.urgentRequests.length === 0) {
            contentDiv.innerHTML = `
                <div style=\"
                    background: white;
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                    border: 2px solid #10b981;
                \">
                    <div style=\"font-size: 3rem; margin-bottom: 20px;\">✅</div>
                    <h3 style=\"color: #059669; margin-bottom: 10px; font-size: 1.4rem;\">Great News!</h3>
                    <p style=\"color: #6b7280; font-size: 1.1rem;\">No urgent blood requests at the moment.</p>
                    <p style=\"color: #6b7280; font-size: 1rem; margin-top: 10px;\">Check back later or consider registering as a donor to help future requests.</p>
                </div>
            `;
            return;
        }
        
        const requestsHtml = this.urgentRequests.map((request, index) => {
            const urgencyClass = request.urgency === 'Critical' ? 'urgent-critical' : '';
            const urgencyIcon = request.urgency === 'Critical' ? '🆘' : '⚠️';
            const timeIcon = request.daysLeft <= 1 ? '⏰' : '📅';
            
            return `
                <div class=\"urgent-card ${urgencyClass}\" style=\"
                    background: white;
                    padding: 25px;
                    border-radius: 15px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                    border: ${request.urgency === 'Critical' ? '3px solid #dc2626' : '2px solid #f59e0b'};
                    text-align: left;
                    animation-delay: ${index * 0.1}s;
                \">
                    <div style=\"display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;\">
                        <div>
                            <h3 style=\"
                                color: #1f2937;
                                font-size: 1.3rem;
                                font-weight: bold;
                                margin-bottom: 5px;
                            \">
                                ${urgencyIcon} ${request.patientName}
                            </h3>
                            <p style=\"color: #6b7280; font-size: 0.9rem;\">${request.timeAgo}</p>
                        </div>
                        <div class=\"urgent-blood-type\">${request.bloodGroup}</div>
                    </div>
                    
                    <div style=\"margin-bottom: 15px;\">
                        <p style=\"color: #4b5563; margin-bottom: 8px;\">
                            <strong>🏥 Hospital:</strong> ${request.hospitalName}
                        </p>
                        <p style=\"color: #4b5563; margin-bottom: 8px;\">
                            <strong>📍 Location:</strong> ${request.location}
                        </p>
                        <p style=\"color: #4b5563; margin-bottom: 8px;\">
                            <strong>🩸 Units Needed:</strong> ${request.requiredUnits}
                        </p>
                        <p style=\"color: ${request.daysLeft <= 1 ? '#dc2626' : '#f59e0b'}; font-weight: bold;\">
                            ${timeIcon} ${request.daysLeft <= 1 ? 
                                `${request.daysLeft === 0 ? 'Needed TODAY' : '1 day left'}` :
                                `${request.daysLeft} days left`
                            }
                        </p>
                    </div>
                    
                    ${request.additionalNotes ? `
                        <div style=\"
                            background: #fffbeb;
                            padding: 12px;
                            border-radius: 8px;
                            margin-bottom: 15px;
                            border-left: 3px solid #f59e0b;
                        \">
                            <p style=\"color: #78350f; font-style: italic; margin: 0; font-size: 0.9rem;\">
                                \"${request.additionalNotes}\"
                            </p>
                        </div>
                    ` : ''}
                    
                    <div style=\"display: flex; gap: 10px; margin-top: 20px;\">
                        <button onclick=\"window.urgentSection.respondToRequest('${request._id}')\" style=\"
                            background: #dc2626;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 8px;
                            font-weight: bold;
                            cursor: pointer;
                            font-size: 0.9rem;
                            flex: 1;
                            transition: all 0.3s;
                        \" onmouseover=\"this.style.background='#b91c1c'\" onmouseout=\"this.style.background='#dc2626'\">
                            🩸 I Can Help
                        </button>
                        
                        <button onclick=\"window.urgentSection.shareRequest('${request._id}')\" style=\"
                            background: #2563eb;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 8px;
                            font-weight: bold;
                            cursor: pointer;
                            font-size: 0.9rem;
                            flex: 1;
                            transition: all 0.3s;
                        \" onmouseover=\"this.style.background='#1d4ed8'\" onmouseout=\"this.style.background='#2563eb'\">
                            📢 Share
                        </button>
                    </div>
                    
                    <div style=\"
                        text-align: center;
                        margin-top: 15px;
                        padding-top: 15px;
                        border-top: 1px solid #e5e7eb;
                    \">
                        <span style=\"
                            background: ${request.urgency === 'Critical' ? '#dc2626' : '#f59e0b'};
                            color: white;
                            padding: 4px 12px;
                            border-radius: 15px;
                            font-size: 0.8rem;
                            font-weight: bold;
                        \">
                            ${request.urgency.toUpperCase()} PRIORITY
                        </span>
                    </div>
                </div>
            `;
        }).join('');
        
        contentDiv.innerHTML = `
            <div class=\"urgent-grid\" style=\"
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 25px;
                margin-bottom: 30px;
            \">
                ${requestsHtml}
            </div>
            
            <div style=\"text-align: center; margin-top: 40px;\">
                <p style=\"color: #6b7280; margin-bottom: 20px; font-size: 1rem;\">
                    Last updated: ${this.lastUpdate.toLocaleTimeString()}
                </p>
                
                <button onclick=\"window.urgentSection.refreshRequests()\" style=\"
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 1rem;
                    margin-right: 15px;
                    transition: all 0.3s;
                \" onmouseover=\"this.style.background='#059669'\" onmouseout=\"this.style.background='#10b981'\">
                    🔄 Refresh
                </button>
                
                <button onclick=\"window.location.href='/donate'\" style=\"
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
                    🩸 Become a Donor
                </button>
            </div>
        `;
    }
    
    /**
     * Render error state
     */
    renderErrorState() {
        const contentDiv = document.getElementById('urgent-requests-content');
        contentDiv.innerHTML = `
            <div style=\"
                background: white;
                padding: 40px;
                border-radius: 15px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                border: 2px solid #f59e0b;
            \">
                <div style=\"font-size: 3rem; margin-bottom: 20px;\">⚠️</div>
                <h3 style=\"color: #d97706; margin-bottom: 10px; font-size: 1.4rem;\">Unable to Load Requests</h3>
                <p style=\"color: #6b7280; font-size: 1rem; margin-bottom: 20px;\">We're having trouble loading urgent requests. Please try again.</p>
                <button onclick=\"window.urgentSection.refreshRequests()\" style=\"
                    background: #dc2626;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 1rem;
                \">
                    🔄 Try Again
                </button>
            </div>
        `;
    }
    
    /**
     * Start auto-refresh
     */
    startAutoRefresh() {
        this.intervalId = setInterval(() => {
            this.loadUrgentRequests();
        }, this.refreshInterval);
        
        console.log(`🔄 Auto-refresh started (every ${this.refreshInterval / 1000 / 60} minutes)`);
    }
    
    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('🛑 Auto-refresh stopped');
    }
    
    /**
     * Manual refresh
     */
    refreshRequests() {
        console.log('🔧 Manual refresh triggered');
        this.loadUrgentRequests();
    }
    
    /**
     * Handle response to urgent request with enhanced UX
     */
    respondToRequest(requestId) {
        console.log(`🩸 User wants to help with urgent request: ${requestId}`);
        
        // Find the specific request for better feedback
        const request = this.urgentRequests.find(req => req._id === requestId);
        const patientName = request ? request.patientName : 'this patient';
        
        // Show confirmation dialog with patient details
        const confirmed = confirm(
            `🩸 Thank you for wanting to help ${patientName}!\n\n` +
            `You'll be redirected to the donation page where you can:\n` +
            `• Register as a blood donor\n` +
            `• Contact the hospital directly\n` +
            `• Find nearby blood banks\n\n` +
            `Ready to proceed?`
        );
        
        if (confirmed) {
            // Store the request ID for reference
            sessionStorage.setItem('urgentRequestId', requestId);
            sessionStorage.setItem('urgentPatientName', patientName);
            
            // Enhanced navigation with context
            this.navigateToHelp(requestId);
        }
    }
    
    /**
     * Navigate to help with context preservation
     */
    navigateToHelp(requestId) {
        const baseURL = window.location.origin;
        const currentPath = window.location.pathname;
        
        let donateURL;
        if (currentPath.includes('/frontend/')) {
            donateURL = `${baseURL}/frontend/donate.html`;
        } else {
            donateURL = `${baseURL}/donate`;
        }
        
        // Add request context as URL parameters
        const urlParams = new URLSearchParams();
        urlParams.set('urgent', 'true');
        urlParams.set('requestId', requestId);
        urlParams.set('source', 'urgent_section');
        
        const finalURL = `${donateURL}?${urlParams.toString()}`;
        
        console.log(`🔗 Navigating to: ${finalURL}`);
        window.location.href = finalURL;
    }
    
    /**
     * Enhanced share urgent request with multiple options
     */
    shareRequest(requestId) {
        const request = this.urgentRequests.find(req => req._id === requestId);
        if (!request) {
            console.error('Request not found for sharing:', requestId);
            return;
        }
        
        const urgencyEmoji = request.urgency === 'Critical' ? '🆘' : '⚠️';
        const timeEmoji = request.daysLeft <= 1 ? '⏰' : '📅';
        
        const shareData = {
            title: `${urgencyEmoji} URGENT: ${request.bloodGroup} Blood Needed`,
            text: this.generateShareText(request, urgencyEmoji, timeEmoji),
            url: window.location.href
        };
        
        // Try native sharing first (mobile devices)
        if (navigator.share && this.isMobileDevice()) {
            navigator.share(shareData)
                .then(() => {
                    console.log('📤 Successfully shared urgent request');
                    this.trackShareEvent(requestId, 'native_share');
                })
                .catch((error) => {
                    console.log('❌ Native sharing failed, using fallback:', error);
                    this.showShareOptions(request, shareData);
                });
        } else {
            // Show custom share options for desktop
            this.showShareOptions(request, shareData);
        }
    }
    
    /**
     * Generate optimized share text
     */
    generateShareText(request, urgencyEmoji, timeEmoji) {
        const timeLeft = request.daysLeft <= 1 ? 
            (request.daysLeft === 0 ? 'NEEDED TODAY' : '1 day left') :
            `${request.daysLeft} days left`;
            
        return `${urgencyEmoji} URGENT BLOOD REQUEST ${urgencyEmoji}

` +
               `Patient: ${request.patientName}
` +
               `Blood Type: ${request.bloodGroup}
` +
               `Units Needed: ${request.requiredUnits}
` +
               `Hospital: ${request.hospitalName}
` +
               `Location: ${request.location}
` +
               `${timeEmoji} ${timeLeft}

` +
               `Every donation saves a life! Please help or share.

` +
               `#BloodDonation #SaveLives #UrgentHelp #${request.bloodGroup.replace(/[+-]/g, '')}Blood`;
    }
    
    /**
     * Show enhanced share options modal
     */
    showShareOptions(request, shareData) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 20px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                text-align: center;
            ">
                <h3 style="color: #dc2626; margin-bottom: 20px; font-size: 1.5rem;">
                    📢 Share This Urgent Request
                </h3>
                <p style="color: #6b7280; margin-bottom: 25px;">
                    Help ${request.patientName} by sharing this request with your network
                </p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                    <button onclick="window.urgentSection.shareViaWhatsApp('${request._id}')" style="
                        background: #25d366;
                        color: white;
                        border: none;
                        padding: 15px;
                        border-radius: 10px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s;
                    ">
                        📱 WhatsApp
                    </button>
                    
                    <button onclick="window.urgentSection.shareViaEmail('${request._id}')" style="
                        background: #1a73e8;
                        color: white;
                        border: none;
                        padding: 15px;
                        border-radius: 10px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s;
                    ">
                        ✉️ Email
                    </button>
                    
                    <button onclick="window.urgentSection.copyToClipboard('${request._id}')" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 15px;
                        border-radius: 10px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s;
                    ">
                        📋 Copy Text
                    </button>
                    
                    <button onclick="window.urgentSection.shareViaSMS('${request._id}')" style="
                        background: #10b981;
                        color: white;
                        border: none;
                        padding: 15px;
                        border-radius: 10px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s;
                    ">
                        📲 SMS
                    </button>
                </div>
                
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: #e5e7eb;
                    color: #6b7280;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                ">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    /**
     * Check if device is mobile
     */
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * Share via WhatsApp
     */
    shareViaWhatsApp(requestId) {
        const request = this.urgentRequests.find(req => req._id === requestId);
        if (!request) return;
        
        const text = this.generateShareText(request, '🆘', '⏰');
        const whatsappURL = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappURL, '_blank');
        this.trackShareEvent(requestId, 'whatsapp');
        document.querySelector('[style*="z-index: 10000"]')?.remove();
    }
    
    /**
     * Share via Email
     */
    shareViaEmail(requestId) {
        const request = this.urgentRequests.find(req => req._id === requestId);
        if (!request) return;
        
        const subject = `🆘 URGENT: ${request.bloodGroup} Blood Needed for ${request.patientName}`;
        const body = this.generateShareText(request, '🆘', '⏰');
        const emailURL = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(emailURL);
        this.trackShareEvent(requestId, 'email');
        document.querySelector('[style*="z-index: 10000"]')?.remove();
    }
    
    /**
     * Copy to clipboard with enhanced feedback
     */
    async copyToClipboard(requestId) {
        const request = this.urgentRequests.find(req => req._id === requestId);
        if (!request) return;
        
        const text = this.generateShareText(request, '🆘', '⏰');
        
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('✅ Copied to clipboard! Share it to help save a life.', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('✅ Copied to clipboard!', 'success');
        }
        
        this.trackShareEvent(requestId, 'clipboard');
        document.querySelector('[style*="z-index: 10000"]')?.remove();
    }
    
    /**
     * Share via SMS
     */
    shareViaSMS(requestId) {
        const request = this.urgentRequests.find(req => req._id === requestId);
        if (!request) return;
        
        const text = this.generateShareText(request, '🆘', '⏰');
        const smsURL = `sms:?body=${encodeURIComponent(text)}`;
        window.open(smsURL);
        this.trackShareEvent(requestId, 'sms');
        document.querySelector('[style*="z-index: 10000"]')?.remove();
    }
    
    /**
     * Track sharing events for analytics
     */
    trackShareEvent(requestId, method) {
        console.log(`📤 Share event: ${method} for request ${requestId}`);
        // Here you could add analytics tracking if needed
        if (typeof gtag !== 'undefined') {
            gtag('event', 'share_urgent_request', {
                'method': method,
                'request_id': requestId
            });
        }
    }
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6b7280';
        
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: ${bgColor};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: 600;
            z-index: 10001;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            animation: slideInRight 0.3s ease;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
        
        // Add CSS for toast animations
        if (!document.getElementById('toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Get section status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            lastUpdate: this.lastUpdate,
            urgentRequestsCount: this.urgentRequests.length,
            refreshInterval: this.refreshInterval
        };
    }
    
    /**
     * Handle button keyboard navigation
     */
    handleButtonKeydown(event, requestId, action) {
        // Handle Enter and Space key activation
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (action === 'help') {
                this.respondToRequest(requestId);
            } else if (action === 'share') {
                this.shareRequest(requestId);
            }
        }
        
        // Handle arrow key navigation between buttons
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            const currentButton = event.target;
            const buttonContainer = currentButton.closest('[role="group"]');
            const buttons = buttonContainer.querySelectorAll('button');
            const currentIndex = Array.from(buttons).indexOf(currentButton);
            
            let nextIndex;
            if (event.key === 'ArrowRight') {
                nextIndex = (currentIndex + 1) % buttons.length;
            } else {
                nextIndex = currentIndex === 0 ? buttons.length - 1 : currentIndex - 1;
            }
            
            buttons[nextIndex].focus();
        }
        
        // Handle Up/Down arrow navigation between cards
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            this.navigateToCard(event.target, event.key === 'ArrowDown');
        }
    }
    
    /**
     * Navigate between urgent request cards
     */
    navigateToCard(currentElement, isDownward) {
        const currentCard = currentElement.closest('.urgent-card');
        const allCards = document.querySelectorAll('.urgent-card');
        const currentIndex = Array.from(allCards).indexOf(currentCard);
        
        let nextIndex;
        if (isDownward) {
            nextIndex = currentIndex < allCards.length - 1 ? currentIndex + 1 : 0;
        } else {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : allCards.length - 1;
        }
        
        if (allCards[nextIndex]) {
            allCards[nextIndex].focus();
        }
    }
    
    /**
     * Add screen reader announcements
     */
    announceToScreenReader(message, priority = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    /**
     * Enhanced keyboard navigation for the section
     */
    initKeyboardNavigation() {
        // Add keyboard navigation to the main section
        this.sectionContainer.addEventListener('keydown', (event) => {
            // Skip if focus is on a button
            if (event.target.tagName === 'BUTTON') {
                return;
            }
            
            // Handle Tab key to focus on first interactive element
            if (event.key === 'Tab' && !event.shiftKey) {
                const firstButton = this.sectionContainer.querySelector('button');
                if (firstButton && document.activeElement === this.sectionContainer) {
                    event.preventDefault();
                    firstButton.focus();
                }
            }
            
            // Handle keyboard shortcuts
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case 'r':
                        event.preventDefault();
                        this.refreshRequests();
                        this.announceToScreenReader('Refreshing urgent blood requests');
                        break;
                    case 'd':
                        event.preventDefault();
                        window.location.href = '/donate';
                        break;
                }
            }
        });
    }
}

// Create global instance
window.urgentSection = new UrgentRequestsSection();

// Auto-initialize on home page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            setTimeout(() => {
                window.urgentSection.init();
            }, 1000); // Start after 1 second
        }
    });
} else {
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        setTimeout(() => {
            window.urgentSection.init();
        }, 1000);
    }
}

console.log('✅ Urgent requests section loaded successfully');