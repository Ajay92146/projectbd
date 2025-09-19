/**
 * Location Manager - Frontend Implementation
 * Handles user location, maps, and blood bank finding functionality
 */

class LocationManager {
    constructor() {
        this.userLocation = null;
        this.nearbyFacilities = [];
        this.map = null;
        this.markers = [];
        this.infoWindows = [];
        this.searchRadius = 50; // Default 50km
        this.isInitialized = false;
        
        console.log('🗺️ Location Manager initialized');
    }
    
    /**
     * Initialize the location manager
     */
    async init() {
        try {
            // Check if Google Maps is loaded
            if (typeof google === 'undefined') {
                throw new Error('Google Maps API not loaded');
            }
            
            this.isInitialized = true;
            console.log('✅ Location Manager ready');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Location Manager:', error);
            return false;
        }
    }
    
    /**
     * Get current user location
     */
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }
            
            console.log('📍 Getting user location...');
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    
                    console.log('✅ User location obtained:', this.userLocation);
                    resolve(this.userLocation);
                },
                (error) => {
                    console.error('❌ Geolocation error:', error);
                    
                    // Provide fallback based on error
                    let errorMessage = 'Unable to get your location';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location access denied by user';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information unavailable';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Location request timed out';
                            break;
                    }
                    
                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000 // Cache for 1 minute
                }
            );
        });
    }
    
    /**
     * Find nearby blood banks
     */
    async findNearbyBloodBanks(radius = this.searchRadius, keyword = 'blood bank') {
        try {
            // Get user location if not available
            if (!this.userLocation) {
                await this.getCurrentLocation();
            }
            
            console.log(`🔍 Searching for blood banks within ${radius}km...`);
            
            // Call backend API
            const response = await fetch('/api/location/nearby-blood-banks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    latitude: this.userLocation.lat,
                    longitude: this.userLocation.lng,
                    radius: radius,
                    keyword: keyword
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.nearbyFacilities = result.data.bloodBanks;
                console.log(`✅ Found ${this.nearbyFacilities.length} blood banks`);
                
                return {
                    success: true,
                    bloodBanks: this.nearbyFacilities,
                    totalFound: this.nearbyFacilities.length
                };
            } else {
                throw new Error(result.error || 'Failed to find blood banks');
            }
            
        } catch (error) {
            console.error('❌ Error finding blood banks:', error);
            return {
                success: false,
                error: error.message,
                bloodBanks: [],
                totalFound: 0
            };
        }
    }
    
    /**
     * Display map with blood banks
     */
    displayMap(containerId, options = {}) {
        try {
            if (!this.isInitialized) {
                throw new Error('Location Manager not initialized');
            }
            
            if (!this.userLocation) {
                throw new Error('User location not available');
            }
            
            const defaultOptions = {
                center: this.userLocation,
                zoom: 12,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                styles: [
                    {
                        featureType: 'poi.medical',
                        elementType: 'geometry',
                        stylers: [{ color: '#ff6b6b' }]
                    }
                ]
            };
            
            const mapOptions = { ...defaultOptions, ...options };
            
            // Create map
            const mapContainer = document.getElementById(containerId);
            if (!mapContainer) {
                throw new Error(`Map container '${containerId}' not found`);
            }
            
            this.map = new google.maps.Map(mapContainer, mapOptions);
            
            // Add markers
            this.addUserLocationMarker();
            this.addBloodBankMarkers();
            
            // Fit map to show all markers
            this.fitMapToMarkers();
            
            console.log('✅ Map displayed successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error displaying map:', error);
            return false;
        }
    }
    
    /**
     * Add user location marker
     */
    addUserLocationMarker() {
        if (!this.map || !this.userLocation) return;
        
        const userMarker = new google.maps.Marker({
            position: this.userLocation,
            map: this.map,
            title: 'Your Location',
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#4285f4">
                        <circle cx="12" cy="12" r="8"/>
                        <circle cx="12" cy="12" r="3" fill="white"/>
                    </svg>
                `),
                scaledSize: new google.maps.Size(24, 24),
                anchor: new google.maps.Point(12, 12)
            }
        });
        
        const userInfoWindow = new google.maps.InfoWindow({
            content: `
                <div style="padding: 10px;">
                    <h3 style="margin: 0 0 5px 0; color: #4285f4;">📍 Your Location</h3>
                    <p style="margin: 0; font-size: 14px;">
                        Accuracy: ±${Math.round(this.userLocation.accuracy || 0)}m
                    </p>
                </div>
            `
        });
        
        userMarker.addListener('click', () => {
            this.closeAllInfoWindows();
            userInfoWindow.open(this.map, userMarker);
        });
        
        this.markers.push(userMarker);
        this.infoWindows.push(userInfoWindow);
    }
    
    /**
     * Add blood bank markers
     */
    addBloodBankMarkers() {
        if (!this.map || !this.nearbyFacilities) return;
        
        this.nearbyFacilities.forEach((facility, index) => {
            const marker = new google.maps.Marker({
                position: {
                    lat: facility.location.latitude,
                    lng: facility.location.longitude
                },
                map: this.map,
                title: facility.name,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#dc2626">
                            <path d="M12 2L13.09 8.26L22 9L17 14L18.18 22L12 19L5.82 22L7 14L2 9L10.91 8.26L12 2Z"/>
                        </svg>
                    `),
                    scaledSize: new google.maps.Size(32, 32),
                    anchor: new google.maps.Point(16, 16)
                }
            });
            
            const infoWindow = new google.maps.InfoWindow({
                content: this.createInfoWindowContent(facility)
            });
            
            marker.addListener('click', () => {
                this.closeAllInfoWindows();
                infoWindow.open(this.map, marker);
            });
            
            this.markers.push(marker);
            this.infoWindows.push(infoWindow);
        });
    }
    
    /**
     * Create info window content for blood bank
     */
    createInfoWindowContent(facility) {
        const distanceText = facility.distance 
            ? `📏 ${facility.distance.distance.text} away` 
            : '📏 Distance unavailable';
            
        const ratingText = facility.rating 
            ? `⭐ ${facility.rating}/5 (${facility.userRatingsTotal} reviews)` 
            : '⭐ No ratings';
            
        const phoneLink = facility.phone 
            ? `<a href="tel:${facility.phone}" style="color: #dc2626; text-decoration: none;">📞 ${facility.phone}</a>`
            : '📞 No phone available';
            
        const websiteLink = facility.website 
            ? `<a href="${facility.website}" target="_blank" style="color: #dc2626; text-decoration: none;">🌐 Website</a>`
            : '';
            
        const openStatus = facility.isOpen !== null 
            ? (facility.isOpen ? '🟢 Open Now' : '🔴 Closed') 
            : '🟡 Hours Unknown';
        
        return `
            <div style="padding: 15px; max-width: 300px; font-family: Arial, sans-serif;">
                <h3 style="margin: 0 0 10px 0; color: #dc2626; font-size: 16px;">
                    🏥 ${facility.name}
                </h3>
                
                <div style="margin-bottom: 8px; font-size: 14px;">
                    📍 ${facility.address}
                </div>
                
                <div style="margin-bottom: 8px; font-size: 14px;">
                    ${distanceText}
                </div>
                
                <div style="margin-bottom: 8px; font-size: 14px;">
                    ${ratingText}
                </div>
                
                <div style="margin-bottom: 8px; font-size: 14px;">
                    ${openStatus}
                </div>
                
                <div style="margin-bottom: 8px; font-size: 14px;">
                    ${phoneLink}
                </div>
                
                ${websiteLink ? `<div style="margin-bottom: 8px; font-size: 14px;">${websiteLink}</div>` : ''}
                
                <div style="margin-top: 12px; display: flex; gap: 8px;">
                    <button onclick="window.locationManager.getDirections('${facility.id}')" 
                            style="background: #dc2626; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        🗺️ Directions
                    </button>
                    <button onclick="window.locationManager.shareLocation('${facility.id}')" 
                            style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        📤 Share
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Close all info windows
     */
    closeAllInfoWindows() {
        this.infoWindows.forEach(infoWindow => {
            infoWindow.close();
        });
    }
    
    /**
     * Fit map to show all markers
     */
    fitMapToMarkers() {
        if (!this.map || this.markers.length === 0) return;
        
        const bounds = new google.maps.LatLngBounds();
        
        this.markers.forEach(marker => {
            bounds.extend(marker.getPosition());
        });
        
        this.map.fitBounds(bounds);
        
        // Ensure minimum zoom level
        google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
            if (this.map.getZoom() > 15) {
                this.map.setZoom(15);
            }
        });
    }
    
    /**
     * Get directions to a blood bank
     */
    getDirections(facilityId) {
        const facility = this.nearbyFacilities.find(f => f.id === facilityId);
        if (!facility || !this.userLocation) {
            alert('Unable to get directions');
            return;
        }
        
        const url = `https://www.google.com/maps/dir/${this.userLocation.lat},${this.userLocation.lng}/${facility.location.latitude},${facility.location.longitude}`;
        window.open(url, '_blank');
    }
    
    /**
     * Share blood bank location
     */
    shareLocation(facilityId) {
        const facility = this.nearbyFacilities.find(f => f.id === facilityId);
        if (!facility) {
            alert('Unable to share location');
            return;
        }
        
        const shareText = `🏥 ${facility.name}\n📍 ${facility.address}\n🗺️ https://maps.google.com/?q=${facility.location.latitude},${facility.location.longitude}`;
        
        if (navigator.share) {
            navigator.share({
                title: `Blood Bank: ${facility.name}`,
                text: shareText,
                url: `https://maps.google.com/?q=${facility.location.latitude},${facility.location.longitude}`
            });
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Location details copied to clipboard!');
            }).catch(() => {
                alert('Please manually copy the location details');
            });
        }
    }
    
    /**
     * Clear all markers from map
     */
    clearMarkers() {
        this.markers.forEach(marker => {
            marker.setMap(null);
        });
        this.markers = [];
        this.infoWindows = [];
    }
    
    /**
     * Update search radius
     */
    setSearchRadius(radius) {
        this.searchRadius = Math.min(Math.max(radius, 1), 100); // Limit between 1-100km
        console.log(`📏 Search radius updated to ${this.searchRadius}km`);
    }
    
    /**
     * Get system status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            hasUserLocation: !!this.userLocation,
            facilitiesCount: this.nearbyFacilities.length,
            searchRadius: this.searchRadius,
            mapLoaded: !!this.map
        };
    }
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.LocationManager = LocationManager;
    window.locationManager = new LocationManager();
}