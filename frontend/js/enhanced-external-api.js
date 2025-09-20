/**
 * Enhanced External Blood Donor API Service
 * Integrates with multiple blood donation services and APIs worldwide
 */

class EnhancedExternalAPI {
    constructor() {
        this.apiEndpoints = {
            // Indian Government APIs
            eRaktKosh: {
                url: 'https://www.eraktkosh.in/BLDAHIMS/bloodbank/nearbyBB.cnt',
                active: false, // Will be activated when API keys are available
                countries: ['India']
            },
            
            // International Blood Services
            redCrossInternational: {
                url: 'https://api.redcross.org/donors/search',
                active: false,
                countries: ['USA', 'UK', 'Canada', 'Australia']
            },
            
            // Alternative APIs (mockable for demonstration)
            bloodConnectGlobal: {
                url: 'https://api.bloodconnect.global/v1/donors',
                active: false,
                countries: ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'France']
            },
            
            // Hospital Networks
            hospitalNetworkAPI: {
                url: 'https://api.hospitalnetwork.com/blood-donors',
                active: false,
                countries: ['USA', 'UK', 'Canada', 'Australia']
            }
        };
        
        this.fallbackData = {
            // Extended mock data for different countries
            'India': [
                { name: "Raj Kumar", bloodGroup: "O+", city: "Mumbai", state: "Maharashtra", phone: "+91-98765-43210", verified: true, source: "eRaktKosh" },
                { name: "Priya Singh", bloodGroup: "A+", city: "New Delhi", state: "Delhi", phone: "+91-87654-32109", verified: true, source: "eRaktKosh" },
                { name: "Amit Patel", bloodGroup: "B+", city: "Ahmedabad", state: "Gujarat", phone: "+91-76543-21098", verified: false, source: "external" },
                { name: "Sneha Reddy", bloodGroup: "AB+", city: "Bangalore", state: "Karnataka", phone: "+91-65432-10987", verified: true, source: "hospitals" },
                { name: "Vikram Singh", bloodGroup: "O-", city: "Jaipur", state: "Rajasthan", phone: "+91-54321-09876", verified: true, source: "government" },
                { name: "Kavya Nair", bloodGroup: "A-", city: "Chennai", state: "Tamil Nadu", phone: "+91-43210-98765", verified: false, source: "external" },
                { name: "Rohit Verma", bloodGroup: "B-", city: "Pune", state: "Maharashtra", phone: "+91-32109-87654", verified: true, source: "hospitals" },
                { name: "Anita Das", bloodGroup: "AB-", city: "Kolkata", state: "West Bengal", phone: "+91-21098-76543", verified: true, source: "government" }
            ],
            'USA': [
                { name: "John Smith", bloodGroup: "O+", city: "New York", state: "New York", phone: "+1-555-0123", verified: true, source: "redCross" },
                { name: "Emily Johnson", bloodGroup: "A+", city: "Los Angeles", state: "California", phone: "+1-555-0124", verified: true, source: "bloodConnectGlobal" },
                { name: "Michael Brown", bloodGroup: "B+", city: "Chicago", state: "Illinois", phone: "+1-555-0125", verified: false, source: "hospitals" },
                { name: "Sarah Davis", bloodGroup: "AB+", city: "Houston", state: "Texas", phone: "+1-555-0126", verified: true, source: "redCross" },
                { name: "David Wilson", bloodGroup: "O-", city: "Miami", state: "Florida", phone: "+1-555-0127", verified: true, source: "bloodConnectGlobal" },
                { name: "Lisa Miller", bloodGroup: "A-", city: "Seattle", state: "Washington", phone: "+1-555-0128", verified: false, source: "hospitals" }
            ],
            'UK': [
                { name: "James Wilson", bloodGroup: "O+", city: "London", state: "England", phone: "+44-20-7946-0958", verified: true, source: "nhsBlood" },
                { name: "Emma Thompson", bloodGroup: "A+", city: "Manchester", state: "England", phone: "+44-161-496-0197", verified: true, source: "bloodConnectGlobal" },
                { name: "Oliver Taylor", bloodGroup: "B+", city: "Birmingham", state: "England", phone: "+44-121-496-0198", verified: false, source: "hospitals" },
                { name: "Sophie Anderson", bloodGroup: "AB+", city: "Edinburgh", state: "Scotland", phone: "+44-131-496-0199", verified: true, source: "nhsBlood" }
            ],
            'Canada': [
                { name: "Alexandre Dubois", bloodGroup: "O+", city: "Toronto", state: "Ontario", phone: "+1-416-555-0129", verified: true, source: "canadianBlood" },
                { name: "Jennifer Chen", bloodGroup: "A+", city: "Vancouver", state: "British Columbia", phone: "+1-604-555-0130", verified: true, source: "bloodConnectGlobal" },
                { name: "Robert MacDonald", bloodGroup: "B+", city: "Montreal", state: "Quebec", phone: "+1-514-555-0131", verified: false, source: "hospitals" },
                { name: "Maria Gonzalez", bloodGroup: "AB+", city: "Calgary", state: "Alberta", phone: "+1-403-555-0132", verified: true, source: "canadianBlood" }
            ],
            'Australia': [
                { name: "William Murphy", bloodGroup: "O+", city: "Sydney", state: "New South Wales", phone: "+61-2-9374-4000", verified: true, source: "lifebloodAU" },
                { name: "Isabella Lee", bloodGroup: "A+", city: "Melbourne", state: "Victoria", phone: "+61-3-9426-0000", verified: true, source: "bloodConnectGlobal" },
                { name: "Jacob White", bloodGroup: "B+", city: "Brisbane", state: "Queensland", phone: "+61-7-3356-0000", verified: false, source: "hospitals" },
                { name: "Charlotte Brown", bloodGroup: "AB+", city: "Perth", state: "Western Australia", phone: "+61-8-6212-0000", verified: true, source: "lifebloodAU" }
            ],
            'Germany': [
                { name: "Hans Mueller", bloodGroup: "O+", city: "Berlin", state: "Berlin", phone: "+49-30-12345678", verified: true, source: "drkBlood" },
                { name: "Greta Schmidt", bloodGroup: "A+", city: "Munich", state: "Bavaria", phone: "+49-89-12345679", verified: true, source: "bloodConnectGlobal" },
                { name: "Klaus Weber", bloodGroup: "B+", city: "Hamburg", state: "Hamburg", phone: "+49-40-12345680", verified: false, source: "hospitals" }
            ],
            'France': [
                { name: "Pierre Dubois", bloodGroup: "O+", city: "Paris", state: "Île-de-France", phone: "+33-1-23456789", verified: true, source: "efsDon" },
                { name: "Marie Leclerc", bloodGroup: "A+", city: "Lyon", state: "Auvergne-Rhône-Alpes", phone: "+33-4-23456790", verified: true, source: "bloodConnectGlobal" },
                { name: "Jean Martin", bloodGroup: "B+", city: "Marseille", state: "Provence-Alpes-Côte d'Azur", phone: "+33-4-23456791", verified: false, source: "hospitals" }
            ],
            'Japan': [
                { name: "Hiroshi Tanaka", bloodGroup: "O+", city: "Tokyo", state: "Tokyo", phone: "+81-3-1234-5678", verified: true, source: "jrcBlood" },
                { name: "Yuki Sato", bloodGroup: "A+", city: "Osaka", state: "Osaka", phone: "+81-6-1234-5679", verified: true, source: "bloodConnectGlobal" },
                { name: "Takeshi Yamada", bloodGroup: "B+", city: "Kyoto", state: "Kyoto", phone: "+81-75-1234-5680", verified: false, source: "hospitals" }
            ],
            'Singapore': [
                { name: "Wei Ming Lim", bloodGroup: "O+", city: "Singapore", state: "Singapore", phone: "+65-6123-4567", verified: true, source: "hsa" },
                { name: "Priya Sharma", bloodGroup: "A+", city: "Singapore", state: "Singapore", phone: "+65-6123-4568", verified: true, source: "bloodConnectGlobal" },
                { name: "Ahmad Rahman", bloodGroup: "B+", city: "Singapore", state: "Singapore", phone: "+65-6123-4569", verified: false, source: "hospitals" }
            ],
            'UAE': [
                { name: "Mohammed Al-Rashid", bloodGroup: "O+", city: "Dubai", state: "Dubai", phone: "+971-4-123-4567", verified: true, source: "dubaHealth" },
                { name: "Fatima Al-Zahra", bloodGroup: "A+", city: "Abu Dhabi", state: "Abu Dhabi", phone: "+971-2-123-4568", verified: true, source: "bloodConnectGlobal" },
                { name: "Ahmed Hassan", bloodGroup: "B+", city: "Sharjah", state: "Sharjah", phone: "+971-6-123-4569", verified: false, source: "hospitals" }
            ]
        };
        
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes cache
    }

    /**
     * Search external blood donor APIs
     * @param {string} bloodGroup - Required blood group
     * @param {string} country - Country to search in
     * @param {Object} filters - Additional filters
     * @returns {Promise<Object>} - Search results from external APIs
     */
    async searchExternalDonors(bloodGroup, country = 'India', filters = {}) {
        console.log(`🌐 Searching external APIs for ${bloodGroup} in ${country}...`);
        
        const cacheKey = `external_${bloodGroup}_${country}_${JSON.stringify(filters)}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('📋 Returning cached external results');
                return cached.data;
            }
        }
        
        const searchPromises = [];
        const results = {
            success: true,
            sources: [],
            donors: [],
            totalFound: 0,
            searchTime: Date.now()
        };
        
        // Try different external APIs based on country
        Object.keys(this.apiEndpoints).forEach(apiName => {
            const api = this.apiEndpoints[apiName];
            if (api.countries.includes(country)) {
                if (api.active) {
                    // Real API call (when credentials are available)
                    searchPromises.push(this.callRealAPI(api, bloodGroup, country, filters));
                } else {
                    // Fallback to mock data for demonstration
                    searchPromises.push(this.getFallbackData(apiName, bloodGroup, country, filters));
                }
            }
        });
        
        // Execute all API calls
        const apiResults = await Promise.allSettled(searchPromises);
        
        // Process results
        apiResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                results.sources.push(result.value.source);
                results.donors.push(...result.value.donors);
            }
        });
        
        // Apply filters
        results.donors = this.applyAdvancedFilters(results.donors, filters);
        
        // Remove duplicates and sort
        results.donors = this.removeDuplicates(results.donors);
        results.donors = this.sortByRelevance(results.donors, bloodGroup, filters);
        
        results.totalFound = results.donors.length;
        results.searchTime = Date.now() - results.searchTime;
        
        // Cache results
        this.cache.set(cacheKey, {
            data: results,
            timestamp: Date.now()
        });
        
        console.log(`✅ External search completed: ${results.totalFound} donors found in ${results.searchTime}ms`);
        return results;
    }

    /**
     * Get fallback data for demonstration when real APIs aren't available
     */
    async getFallbackData(sourceName, bloodGroup, country, filters) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const countryDonors = this.fallbackData[country] || [];
                const filteredDonors = countryDonors
                    .filter(donor => donor.bloodGroup === bloodGroup)
                    .map(donor => ({
                        ...donor,
                        source: sourceName,
                        lastDonation: this.getRandomLastDonation(),
                        availability: this.getRandomAvailability(),
                        distance: Math.floor(Math.random() * 50) + 1,
                        rating: (Math.random() * 2 + 3).toFixed(1) // 3.0 to 5.0
                    }));
                
                resolve({
                    source: sourceName,
                    donors: filteredDonors
                });
            }, Math.random() * 1000 + 500); // Simulate API delay
        });
    }

    /**
     * Call real external APIs (when available)
     */
    async callRealAPI(api, bloodGroup, country, filters) {
        try {
            const params = new URLSearchParams({
                bloodType: bloodGroup,
                location: country,
                ...filters
            });
            
            const response = await fetch(`${api.url}?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    // Add API keys when available
                    // 'Authorization': `Bearer ${API_KEY}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`API ${api.name} responded with status ${response.status}`);
            }
            
            const data = await response.json();
            
            return {
                source: api.name,
                donors: data.donors || []
            };
            
        } catch (error) {
            console.warn(`⚠️ External API ${api.name} failed:`, error.message);
            return null;
        }
    }

    /**
     * Apply advanced filters to donor results
     */
    applyAdvancedFilters(donors, filters) {
        return donors.filter(donor => {
            // Age range filter
            if (filters.ageRange) {
                const [minAge, maxAge] = filters.ageRange.split('-').map(Number);
                const donorAge = donor.age || Math.floor(Math.random() * 30) + 20;
                if (donorAge < minAge || donorAge > maxAge) return false;
            }
            
            // Gender filter
            if (filters.gender && donor.gender && donor.gender !== filters.gender) {
                return false;
            }
            
            // Verification filter
            if (filters.verified !== '' && filters.verified !== undefined) {
                if (filters.verified === 'true' && !donor.verified) return false;
                if (filters.verified === 'false' && donor.verified) return false;
            }
            
            // Availability filter
            if (filters.availability && donor.availability !== filters.availability) {
                return false;
            }
            
            // Source filter
            if (filters.source && filters.source !== 'all' && donor.source !== filters.source) {
                return false;
            }
            
            return true;
        });
    }

    /**
     * Remove duplicate donors based on phone number or email
     */
    removeDuplicates(donors) {
        const seen = new Set();
        return donors.filter(donor => {
            const key = donor.phone || donor.email || `${donor.name}_${donor.city}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    /**
     * Sort donors by relevance
     */
    sortByRelevance(donors, bloodGroup, filters) {
        return donors.sort((a, b) => {
            // Verified donors first
            if (a.verified !== b.verified) return b.verified - a.verified;
            
            // Higher ratings first
            if (a.rating !== b.rating) return (b.rating || 0) - (a.rating || 0);
            
            // Closer distance first
            if (a.distance !== b.distance) return (a.distance || 999) - (b.distance || 999);
            
            // More recent donations first
            const aDate = new Date(a.lastDonation || 0);
            const bDate = new Date(b.lastDonation || 0);
            return bDate - aDate;
        });
    }

    /**
     * Generate random last donation date
     */
    getRandomLastDonation() {
        const months = ['1 month ago', '2 months ago', '3 months ago', '4 months ago', '5 months ago'];
        return months[Math.floor(Math.random() * months.length)];
    }

    /**
     * Generate random availability
     */
    getRandomAvailability() {
        const availabilities = ['Available Now', 'Available Today', 'Available This Week', 'Available This Month'];
        return availabilities[Math.floor(Math.random() * availabilities.length)];
    }

    /**
     * Get country-specific blood service information
     */
    getCountryBloodServices(country) {
        const services = {
            'India': {
                name: 'e-RaktKosh',
                website: 'https://www.eraktkosh.in',
                helpline: '104'
            },
            'USA': {
                name: 'American Red Cross',
                website: 'https://www.redcrossblood.org',
                helpline: '1-800-RED CROSS'
            },
            'UK': {
                name: 'NHS Blood and Transplant',
                website: 'https://www.nhsbt.nhs.uk',
                helpline: '0300 123 23 23'
            },
            'Canada': {
                name: 'Canadian Blood Services',
                website: 'https://www.blood.ca',
                helpline: '1-888-2-DONATE'
            },
            'Australia': {
                name: 'Lifeblood',
                website: 'https://www.lifeblood.com.au',
                helpline: '13 14 95'
            }
        };
        
        return services[country] || null;
    }
}

// Create global instance
window.EnhancedExternalAPI = new EnhancedExternalAPI();

console.log('🌐 Enhanced External API Service loaded successfully!');
