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
        this.loadUrgentRequests();
        this.startAutoRefresh();
        this.isInitialized = true;
        
        console.log('✅ Urgent requests section started');
    }
    
    /**
     * Create the urgent requests section in the home page
     */
    createUrgentSection() {
        // Find a good location to insert the section (after hero section or before footer)
        const heroSection = document.querySelector('.hero-section') || 
                           document.querySelector('.hero') ||
                           document.querySelector('main') ||
                           document.querySelector('.container');
        
        if (!heroSection) {
            console.error('❌ Could not find a suitable location for urgent requests section');
            return;
        }
        
        // Create the urgent requests section
        this.sectionContainer = document.createElement('section');
        this.sectionContainer.id = 'urgent-requests-section';
        this.sectionContainer.style.cssText = `
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            padding: 60px 20px;
            margin: 40px 0;
            border-top: 3px solid #dc2626;
            border-bottom: 3px solid #dc2626;
        `;
        
        // Insert after hero section
        heroSection.parentNode.insertBefore(this.sectionContainer, heroSection.nextSibling);
        
        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes urgentPulse {
                0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
                50% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
            }
            
            @keyframes urgentFadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .urgent-card {
                animation: urgentFadeIn 0.6s ease;
                transition: all 0.3s ease;
            }
            
            .urgent-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 30px rgba(220, 38, 38, 0.2);
            }
            
            .urgent-critical {
                animation: urgentPulse 2s infinite;
            }
            
            .urgent-blood-type {
                background: linear-gradient(45deg, #dc2626, #b91c1c);
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-weight: bold;
                display: inline-block;
                margin: 5px;
                min-width: 50px;
                text-align: center;
            }
            
            @media (max-width: 768px) {
                .urgent-grid {
                    grid-template-columns: 1fr !important;
                }
            }
        `;
        document.head.appendChild(style);
        
        this.renderEmptySection();
    }
    
    /**
     * Render empty section with loading state
     */
    renderEmptySection() {
        this.sectionContainer.innerHTML = `
            <div style=\"max-width: 1200px; margin: 0 auto; text-align: center;\">
                <div style=\"margin-bottom: 40px;\">
                    <h2 style=\"
                        color: #dc2626;
                        font-size: 2.5rem;
                        font-weight: bold;
                        margin-bottom: 15px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 15px;
                    \">
                        🆘 Urgent Blood Requests
                    </h2>
                    <p style=\"
                        color: #7c2d12;
                        font-size: 1.2rem;
                        max-width: 600px;
                        margin: 0 auto;
                        line-height: 1.6;
                    \">
                        These patients need your help urgently. Every donation can save a life.
                    </p>
                </div>
                
                <div id=\"urgent-requests-content\">
                    <div style=\"
                        background: white;
                        padding: 40px;
                        border-radius: 15px;
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                        border: 2px dashed #dc2626;
                    \">
                        <div style=\"font-size: 3rem; margin-bottom: 20px;\">⏳</div>
                        <p style=\"color: #6b7280; font-size: 1.1rem;\">Loading urgent requests...</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Load urgent requests from API
     */
    async loadUrgentRequests() {
        try {
            console.log('🆘 Loading urgent blood requests...');
            this.lastUpdate = new Date();
            
            const response = await fetch('/api/requests/urgent');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.urgentRequests = result.data.urgentRequests;
                this.renderUrgentRequests();
                console.log(`✅ Loaded ${this.urgentRequests.length} urgent requests`);
            } else {
                throw new Error(result.message || 'Failed to load urgent requests');
            }
            
        } catch (error) {
            console.error('❌ Error loading urgent requests:', error);
            this.renderErrorState();
        }
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
     * Handle response to urgent request
     */
    respondToRequest(requestId) {
        console.log(`🩸 User wants to help with urgent request: ${requestId}`);
        
        // Redirect to donation page
        window.location.href = '/donate';
    }
    
    /**
     * Share urgent request
     */
    shareRequest(requestId) {
        const request = this.urgentRequests.find(req => req._id === requestId);
        if (!request) return;
        
        const shareText = `🆘 URGENT BLOOD REQUEST 🆘

Patient: ${request.patientName}
Blood Type: ${request.bloodGroup}
Units Needed: ${request.requiredUnits}
Hospital: ${request.hospitalName}
Location: ${request.location}
Time Left: ${request.daysLeft} days

Every donation saves a life! Please help or share.

#BloodDonation #SaveLives`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Urgent Blood Request',
                text: shareText,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                alert('🩸 Request details copied to clipboard! Please share to help save a life.');
            }).catch(() => {
                // Fallback alert
                alert(`🩸 Please share this urgent request:\n\n${shareText}`);
            });
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