/**
 * Enhanced Donor Search System
 * Integrates multiple data sources for comprehensive donor search
 */

class EnhancedDonorSearch {
    constructor() {
        this.dataSources = {
            internal: true,           // Your internal database
            external: false,          // External APIs (when available)
            government: false,        // Government blood bank APIs
            hospitals: false          // Hospital networks
        };
        
        this.apiEndpoints = {
            internal: '/api/donors/search',
            // Add external API endpoints here when available
            government: null,         // 'https://api.eraktkosh.in/donors/search'
            redCross: null,          // 'https://api.redcross.org/donors'
            hospitals: null          // 'https://api.hospitalnetwork.com/donors'
        };
        
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Search donors from multiple sources
     * @param {Object} searchParams - Search parameters
     * @returns {Promise<Object>} - Combined search results
     */
    async searchDonors(searchParams) {
        const { bloodGroup, location, urgency = 'medium' } = searchParams;
        
        console.log('🔍 Starting enhanced donor search:', searchParams);
        
        // Check cache first
        const cacheKey = JSON.stringify(searchParams);
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('📋 Returning cached results');
                return cached.data;
            }
        }
        
        const searchPromises = [];
        const results = {
            success: true,
            sources: {},
            totalDonors: 0,
            donors: [],
            searchTime: Date.now()
        };
        
        // 1. Search internal database (always available)
        if (this.dataSources.internal) {
            searchPromises.push(
                this.searchInternalDatabase(searchParams)
                    .then(data => ({ source: 'internal', data }))
                    .catch(error => ({ source: 'internal', error: error.message }))
            );
        }
        
        // 2. Search external APIs (when implemented)
        if (this.dataSources.external && this.apiEndpoints.government) {
            searchPromises.push(
                this.searchGovernmentAPI(searchParams)
                    .then(data => ({ source: 'government', data }))
                    .catch(error => ({ source: 'government', error: error.message }))
            );
        }
        
        // 3. Search hospital networks (when implemented)
        if (this.dataSources.hospitals && this.apiEndpoints.hospitals) {
            searchPromises.push(
                this.searchHospitalNetworks(searchParams)
                    .then(data => ({ source: 'hospitals', data }))
                    .catch(error => ({ source: 'hospitals', error: error.message }))
            );
        }
        
        // Wait for all searches to complete
        const searchResults = await Promise.allSettled(searchPromises);
        
        // Process results from each source
        searchResults.forEach(result => {
            if (result.status === 'fulfilled') {
                const { source, data, error } = result.value;
                
                if (error) {
                    results.sources[source] = { success: false, error };
                } else {
                    results.sources[source] = { success: true, count: data.donors?.length || 0 };
                    if (data.donors) {
                        results.donors.push(...data.donors.map(donor => ({
                            ...donor,
                            source: source,
                            verified: source === 'government',
                            priority: this.calculateDonorPriority(donor, urgency)
                        })));
                    }
                }
            }
        });
        
        // Remove duplicates based on email/phone
        results.donors = this.removeDuplicateDonors(results.donors);
        
        // Sort by priority and availability
        results.donors.sort((a, b) => {
            if (a.priority !== b.priority) return b.priority - a.priority;
            if (a.verified !== b.verified) return b.verified - a.verified;
            return new Date(b.lastDonation || 0) - new Date(a.lastDonation || 0);
        });
        
        results.totalDonors = results.donors.length;
        results.searchTime = Date.now() - results.searchTime;
        
        // Cache results
        this.cache.set(cacheKey, {
            data: results,
            timestamp: Date.now()
        });
        
        console.log(`✅ Enhanced search completed: ${results.totalDonors} donors found in ${results.searchTime}ms`);
        return results;
    }
    
    /**
     * Search internal database (current implementation)
     */
    async searchInternalDatabase(searchParams) {
        const { bloodGroup, location } = searchParams;
        const params = new URLSearchParams({
            bloodGroup: bloodGroup,
            ...(location && { location: location })
        });
        
        const response = await fetch(`${window.location.origin}/api/donors/search?${params}`);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Internal search failed');
        }
        
        return result.data;
    }
    
    /**
     * Search government blood bank APIs (now with external API service)
     */
    async searchGovernmentAPI(searchParams) {
        try {
            console.log('🏛️ Searching government APIs and external networks...');
            
            // Use external API service for comprehensive search
            if (window.ExternalAPIService) {
                const externalResults = await window.ExternalAPIService.searchExternalDonors(
                    searchParams.bloodGroup,
                    searchParams.location,
                    searchParams.urgency
                );
                
                if (externalResults.success) {
                    return {
                        donors: externalResults.donors.map(donor => ({
                            name: donor.name,
                            bloodGroup: donor.bloodGroup,
                            city: donor.city,
                            state: donor.state,
                            phone: donor.phone,
                            verified: donor.verified || false,
                            source: donor.source || 'external',
                            lastDonation: donor.lastDonation,
                            availability: donor.availability
                        }))
                    };
                }
            }
            
            // Fallback to empty results if external service fails
            console.log('⚠️ External API service not available, using empty results');
            return { donors: [] };
            
        } catch (error) {
            console.warn('⚠️ Government/External API search failed:', error.message);
            return { donors: [] };
        }
    }
    
    /**
     * Search hospital networks (now with external API service)
     */
    async searchHospitalNetworks(searchParams) {
        try {
            console.log('🏥 Searching hospital networks...');
            
            // Use external API service for hospital search
            if (window.ExternalAPIService && searchParams.location) {
                // Try to get user's location for nearby hospital search
                const coordinates = await this.getLocationCoordinates(searchParams.location);
                
                if (coordinates) {
                    const hospitals = await window.ExternalAPIService.searchNearbyHospitals(
                        coordinates.lat,
                        coordinates.lng
                    );
                    
                    // Convert hospital data to donor format for consistency
                    const hospitalDonors = hospitals.map(hospital => ({
                        name: `${hospital.name} Blood Bank`,
                        bloodGroup: 'All Types',
                        city: searchParams.location.split(',')[0] || 'Unknown',
                        state: searchParams.location.split(',')[1] || 'Unknown',
                        phone: hospital.phone,
                        verified: true,
                        source: 'hospital_network',
                        address: hospital.address,
                        distance: hospital.distance,
                        availability: 'Contact for availability'
                    }));
                    
                    return { donors: hospitalDonors };
                }
            }
            
            // Fallback to mock hospital data
            console.log('🏥 Using mock hospital data');
            return { donors: [] };
            
        } catch (error) {
            console.warn('⚠️ Hospital network search failed:', error.message);
            return { donors: [] };
        }
    }
    
    /**
     * Get coordinates from location string
     */
    async getLocationCoordinates(location) {
        try {
            // Try to use browser geolocation if available
            if (navigator.geolocation && location.toLowerCase().includes('current')) {
                return new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        position => resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        }),
                        reject,
                        { timeout: 5000 }
                    );
                });
            }
            
            // Default coordinates for major Indian cities
            const cityCoordinates = {
                'mumbai': { lat: 19.0760, lng: 72.8777 },
                'delhi': { lat: 28.6139, lng: 77.2090 },
                'bangalore': { lat: 12.9716, lng: 77.5946 },
                'chennai': { lat: 13.0827, lng: 80.2707 },
                'kolkata': { lat: 22.5726, lng: 88.3639 },
                'hyderabad': { lat: 17.3850, lng: 78.4867 },
                'pune': { lat: 18.5204, lng: 73.8567 },
                'ahmedabad': { lat: 23.0225, lng: 72.5714 }
            };
            
            const cityName = location.toLowerCase().split(',')[0].trim();
            return cityCoordinates[cityName] || { lat: 19.0760, lng: 72.8777 }; // Default to Mumbai
            
        } catch (error) {
            console.warn('⚠️ Location coordinate lookup failed:', error.message);
            return { lat: 19.0760, lng: 72.8777 }; // Default to Mumbai
        }
    }
    
    /**
     * Calculate donor priority based on urgency and other factors
     */
    calculateDonorPriority(donor, urgency) {
        let priority = 0;
        
        // Base priority
        priority += 10;
        
        // Urgency bonus
        if (urgency === 'critical') priority += 50;
        else if (urgency === 'high') priority += 30;
        else if (urgency === 'medium') priority += 10;
        
        // Verification bonus
        if (donor.verified) priority += 20;
        
        // Recent donation penalty
        if (donor.lastDonation) {
            const daysSinceLastDonation = (Date.now() - new Date(donor.lastDonation)) / (1000 * 60 * 60 * 24);
            if (daysSinceLastDonation < 90) priority -= 30; // Less than 3 months
            else if (daysSinceLastDonation < 180) priority += 10; // 3-6 months
            else priority += 20; // More than 6 months
        }
        
        // Availability bonus
        if (donor.isAvailable) priority += 15;
        
        return priority;
    }
    
    /**
     * Remove duplicate donors based on email or phone
     */
    removeDuplicateDonors(donors) {
        const seen = new Set();
        return donors.filter(donor => {
            const key = donor.email || donor.phone || `${donor.name}-${donor.city}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    
    /**
     * Enable/disable external data sources
     */
    configureDataSources(sources) {
        this.dataSources = { ...this.dataSources, ...sources };
        console.log('📊 Data sources configured:', this.dataSources);
    }
    
    /**
     * Update API endpoints for external services
     */
    updateAPIEndpoints(endpoints) {
        this.apiEndpoints = { ...this.apiEndpoints, ...endpoints };
        console.log('🔗 API endpoints updated:', this.apiEndpoints);
    }
    
    /**
     * Get search statistics
     */
    getSearchStats() {
        return {
            dataSources: this.dataSources,
            cacheSize: this.cache.size,
            lastSearchTime: this.lastSearchTime
        };
    }
}

// Global instance
window.EnhancedDonorSearch = new EnhancedDonorSearch();

// Example usage function
async function performEnhancedDonorSearch(bloodGroup, location, urgency = 'medium') {
    try {
        const searchParams = { bloodGroup, location, urgency };
        const results = await window.EnhancedDonorSearch.searchDonors(searchParams);
        
        console.log('🩸 Enhanced Search Results:', results);
        
        // Display results
        displayEnhancedSearchResults(results);
        
        return results;
        
    } catch (error) {
        console.error('❌ Enhanced search error:', error);
        throw error;
    }
}

// Display function for enhanced results
function displayEnhancedSearchResults(results) {
    const container = document.getElementById('searchResults') || document.body;
    
    const resultsHTML = `
        <div class="enhanced-search-results">
            <div class="search-summary">
                <h3>🔍 Enhanced Search Results</h3>
                <p>Found <strong>${results.totalDonors}</strong> donors in ${results.searchTime}ms</p>
                <div class="source-summary">
                    ${Object.entries(results.sources).map(([source, info]) => 
                        `<span class="source-badge ${info.success ? 'success' : 'error'}">
                            ${source}: ${info.success ? info.count + ' donors' : 'Failed'}
                        </span>`
                    ).join('')}
                </div>
            </div>
            
            <div class="donors-list">
                ${results.donors.map(donor => `
                    <div class="donor-card priority-${Math.floor(donor.priority / 20)}">
                        <div class="donor-header">
                            <h4>${donor.name}</h4>
                            <div class="donor-badges">
                                <span class="blood-group">${donor.bloodGroup}</span>
                                <span class="source-badge">${donor.source}</span>
                                ${donor.verified ? '<span class="verified">✓ Verified</span>' : ''}
                            </div>
                        </div>
                        <div class="donor-details">
                            <p>📍 ${donor.city}, ${donor.state}</p>
                            <p>📞 ${donor.phone || donor.contactNumber || 'Contact via platform'}</p>
                            <p>🩸 Priority Score: ${donor.priority}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = resultsHTML;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedDonorSearch;
}