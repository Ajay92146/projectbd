/**
 * Location Service - Backend Implementation
 * Handles nearby blood banks, distance calculations, and route optimization
 */

const axios = require('axios');

class LocationService {
    constructor() {
        this.googleMapsAPI = process.env.GOOGLE_MAPS_API_KEY;
        this.placesAPI = process.env.GOOGLE_PLACES_API_KEY || this.googleMapsAPI;
        this.directionsAPI = process.env.GOOGLE_DIRECTIONS_API_KEY || this.googleMapsAPI;
        this.distanceMatrixAPI = process.env.GOOGLE_DISTANCE_MATRIX_API_KEY || this.googleMapsAPI;
        
        this.defaultRadius = 50; // 50km default radius
        this.maxRadius = 100; // Maximum search radius
        
        if (!this.googleMapsAPI) {
            console.warn('⚠️ Google Maps API key not configured');
        }
    }
    
    /**
     * Find nearby blood banks and hospitals
     */
    async findNearbyBloodBanks(latitude, longitude, radius = this.defaultRadius, keyword = 'blood bank') {
        try {
            // Validate inputs
            if (!latitude || !longitude) {
                throw new Error('Latitude and longitude are required');
            }
            
            // Limit radius to maximum allowed
            radius = Math.min(radius, this.maxRadius);
            
            // Google Places API - Nearby Search
            const placesResponse = await axios.get(
                'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
                {
                    params: {
                        location: `${latitude},${longitude}`,
                        radius: radius * 1000, // Convert km to meters
                        type: 'hospital',
                        keyword: keyword,
                        key: this.placesAPI
                    }
                }
            );
            
            if (placesResponse.data.status !== 'OK') {
                throw new Error(`Google Places API error: ${placesResponse.data.status}`);
            }
            
            // Process and enhance results
            const bloodBanks = await this.processBloodBankResults(
                placesResponse.data.results,
                { lat: latitude, lng: longitude }
            );
            
            return {
                success: true,
                data: {
                    bloodBanks: bloodBanks,
                    searchCenter: { latitude, longitude },
                    searchRadius: radius,
                    totalFound: bloodBanks.length
                }
            };
            
        } catch (error) {
            console.error('❌ Error finding nearby blood banks:', error);
            return {
                success: false,
                error: error.message,
                data: {
                    bloodBanks: [],
                    searchCenter: { latitude, longitude },
                    searchRadius: radius,
                    totalFound: 0
                }
            };
        }
    }
    
    /**
     * Process and enhance blood bank results
     */
    async processBloodBankResults(results, userLocation) {
        const processedResults = [];
        
        for (const place of results) {
            try {
                // Get detailed place information
                const placeDetails = await this.getPlaceDetails(place.place_id);
                
                // Calculate distance
                const distance = await this.calculateDistance(
                    userLocation,
                    {
                        lat: place.geometry.location.lat,
                        lng: place.geometry.location.lng
                    }
                );
                
                const bloodBank = {
                    id: place.place_id,
                    name: place.name,
                    address: place.vicinity || place.formatted_address,
                    location: {
                        latitude: place.geometry.location.lat,
                        longitude: place.geometry.location.lng
                    },
                    rating: place.rating || null,
                    userRatingsTotal: place.user_ratings_total || 0,
                    isOpen: place.opening_hours?.open_now || null,
                    photos: place.photos?.map(photo => ({
                        reference: photo.photo_reference,
                        url: this.getPhotoURL(photo.photo_reference)
                    })) || [],
                    distance: distance,
                    types: place.types || [],
                    
                    // Enhanced details from place details API
                    phone: placeDetails?.formatted_phone_number,
                    website: placeDetails?.website,
                    openingHours: placeDetails?.opening_hours?.weekday_text,
                    priceLevel: placeDetails?.price_level
                };
                
                processedResults.push(bloodBank);
                
            } catch (error) {
                console.warn(`⚠️ Error processing place ${place.name}:`, error.message);
                
                // Add basic info even if details fail
                processedResults.push({
                    id: place.place_id,
                    name: place.name,
                    address: place.vicinity,
                    location: {
                        latitude: place.geometry.location.lat,
                        longitude: place.geometry.location.lng
                    },
                    rating: place.rating,
                    distance: null,
                    error: 'Details unavailable'
                });
            }
        }
        
        // Sort by distance (closest first)
        return processedResults.sort((a, b) => {
            if (!a.distance) return 1;
            if (!b.distance) return -1;
            return a.distance.value - b.distance.value;
        });
    }
    
    /**
     * Get detailed place information
     */
    async getPlaceDetails(placeId) {
        try {
            const response = await axios.get(
                'https://maps.googleapis.com/maps/api/place/details/json',
                {
                    params: {
                        place_id: placeId,
                        fields: 'formatted_phone_number,website,opening_hours,price_level',
                        key: this.placesAPI
                    }
                }
            );
            
            if (response.data.status === 'OK') {
                return response.data.result;
            }
            
            return null;
            
        } catch (error) {
            console.warn(`⚠️ Error getting place details for ${placeId}:`, error.message);
            return null;
        }
    }
    
    /**
     * Calculate distance between two points
     */
    async calculateDistance(origin, destination) {
        try {
            const response = await axios.get(
                'https://maps.googleapis.com/maps/api/distancematrix/json',
                {
                    params: {
                        origins: `${origin.lat},${origin.lng}`,
                        destinations: `${destination.lat},${destination.lng}`,
                        units: 'metric',
                        mode: 'driving',
                        key: this.distanceMatrixAPI
                    }
                }
            );
            
            if (response.data.status === 'OK' && response.data.rows[0].elements[0].status === 'OK') {
                const element = response.data.rows[0].elements[0];
                return {
                    distance: element.distance,
                    duration: element.duration,
                    value: element.distance.value // meters
                };
            }
            
            // Fallback to straight-line distance
            return this.calculateStraightLineDistance(origin, destination);
            
        } catch (error) {
            console.warn('⚠️ Error calculating distance, using straight-line:', error.message);
            return this.calculateStraightLineDistance(origin, destination);
        }
    }
    
    /**
     * Calculate straight-line distance (fallback)
     */
    calculateStraightLineDistance(origin, destination) {
        const R = 6371; // Earth's radius in kilometers
        
        const lat1 = origin.lat * Math.PI / 180;
        const lat2 = destination.lat * Math.PI / 180;
        const deltaLat = (destination.lat - origin.lat) * Math.PI / 180;
        const deltaLng = (destination.lng - origin.lng) * Math.PI / 180;
        
        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers
        
        return {
            distance: {
                text: `${distance.toFixed(1)} km`,
                value: Math.round(distance * 1000) // meters
            },
            duration: {
                text: `${Math.round(distance * 2)} min`, // Rough estimate
                value: Math.round(distance * 120) // seconds
            },
            value: Math.round(distance * 1000)
        };
    }
    
    /**
     * Optimize route for multiple delivery points
     */
    async optimizeDeliveryRoute(startPoint, deliveryPoints, returnToStart = true) {
        try {
            if (!deliveryPoints || deliveryPoints.length === 0) {
                return {
                    success: false,
                    error: 'No delivery points provided'
                };
            }
            
            // Prepare waypoints
            const waypoints = deliveryPoints
                .map(point => `${point.lat},${point.lng}`)
                .join('|');
            
            const destination = returnToStart 
                ? `${startPoint.lat},${startPoint.lng}`
                : waypoints.split('|').pop();
            
            const response = await axios.get(
                'https://maps.googleapis.com/maps/api/directions/json',
                {
                    params: {
                        origin: `${startPoint.lat},${startPoint.lng}`,
                        destination: destination,
                        waypoints: `optimize:true|${waypoints}`,
                        mode: 'driving',
                        key: this.directionsAPI
                    }
                }
            );
            
            if (response.data.status !== 'OK') {
                throw new Error(`Directions API error: ${response.data.status}`);
            }
            
            const route = response.data.routes[0];
            
            return {
                success: true,
                data: {
                    optimizedRoute: route,
                    waypointOrder: route.waypoint_order,
                    totalDistance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0),
                    totalDuration: route.legs.reduce((sum, leg) => sum + leg.duration.value, 0),
                    steps: route.legs.map(leg => ({
                        distance: leg.distance,
                        duration: leg.duration,
                        startAddress: leg.start_address,
                        endAddress: leg.end_address
                    }))
                }
            };
            
        } catch (error) {
            console.error('❌ Error optimizing delivery route:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Get photo URL from photo reference
     */
    getPhotoURL(photoReference, maxWidth = 400) {
        return `https://maps.googleapis.com/maps/api/place/photo?` +
               `maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.placesAPI}`;
    }
    
    /**
     * Geocode address to coordinates
     */
    async geocodeAddress(address) {
        try {
            const response = await axios.get(
                'https://maps.googleapis.com/maps/api/geocode/json',
                {
                    params: {
                        address: address,
                        key: this.googleMapsAPI
                    }
                }
            );
            
            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const result = response.data.results[0];
                return {
                    success: true,
                    data: {
                        latitude: result.geometry.location.lat,
                        longitude: result.geometry.location.lng,
                        formattedAddress: result.formatted_address,
                        addressComponents: result.address_components
                    }
                };
            }
            
            return {
                success: false,
                error: 'Address not found'
            };
            
        } catch (error) {
            console.error('❌ Error geocoding address:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Reverse geocode coordinates to address
     */
    async reverseGeocode(latitude, longitude) {
        try {
            const response = await axios.get(
                'https://maps.googleapis.com/maps/api/geocode/json',
                {
                    params: {
                        latlng: `${latitude},${longitude}`,
                        key: this.googleMapsAPI
                    }
                }
            );
            
            if (response.data.status === 'OK' && response.data.results.length > 0) {
                return {
                    success: true,
                    data: {
                        formattedAddress: response.data.results[0].formatted_address,
                        addressComponents: response.data.results[0].address_components
                    }
                };
            }
            
            return {
                success: false,
                error: 'Location not found'
            };
            
        } catch (error) {
            console.error('❌ Error reverse geocoding:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = LocationService;