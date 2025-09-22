/**
 * Weather Service - Backend Implementation
 * Monitors weather conditions affecting blood drives and donation events
 */

const axios = require('axios');

class WeatherService {
    constructor() {
        this.weatherAPI = process.env.OPENWEATHER_API_KEY;
        this.criticalWeatherTypes = [
            'thunderstorm', 
            'snow', 
            'extreme', 
            'tornado',
            'hurricane',
            'cyclone'
        ];
        this.criticalConditions = [
            'heavy rain',
            'heavy snow',
            'severe thunderstorm',
            'tornado',
            'hurricane',
            'blizzard',
            'ice storm',
            'extreme heat',
            'extreme cold'
        ];
        
        console.log('🌤️ Weather Service initialized');
    }
    
    /**
     * Check weather alerts for multiple locations
     */
    async checkWeatherAlerts(locations) {
        try {
            if (!this.weatherAPI) {
                console.warn('⚠️ OpenWeather API key not configured');
                return { success: false, error: 'Weather API not configured' };
            }
            
            const alerts = [];
            
            console.log(`🌤️ Checking weather for ${locations.length} locations...`);
            
            for (const location of locations) {
                try {
                    const weather = await this.getWeatherData(location);
                    
                    if (this.isCriticalWeather(weather)) {
                        const alert = await this.createWeatherAlert(weather, location);
                        alerts.push(alert);
                    }
                    
                    // Add delay to avoid rate limiting
                    await this.delay(100);
                    
                } catch (error) {
                    console.warn(`⚠️ Failed to get weather for ${location.name}:`, error.message);
                }
            }
            
            console.log(`🌤️ Weather check complete. Found ${alerts.length} alerts`);
            
            return {
                success: true,
                data: {
                    alerts: alerts,
                    totalLocations: locations.length,
                    alertCount: alerts.length,
                    checkedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('❌ Weather alerts check failed:', error);
            return {
                success: false,
                error: error.message,
                data: { alerts: [], totalLocations: 0, alertCount: 0 }
            };
        }
    }
    
    /**
     * Get weather data for a specific location
     */
    async getWeatherData(location) {
        try {
            const response = await axios.get(
                'https://api.openweathermap.org/data/2.5/weather',
                {
                    params: {
                        lat: location.lat,
                        lon: location.lng,
                        appid: this.weatherAPI,
                        units: 'metric'
                    },
                    timeout: 5000
                }
            );
            
            if (response.data && response.data.weather) {
                return response.data;
            }
            
            throw new Error('Invalid weather data received');
            
        } catch (error) {
            if (error.response) {
                throw new Error(`Weather API error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
            } else if (error.code === 'ECONNABORTED') {
                throw new Error('Weather API request timed out');
            } else {
                throw new Error(`Weather API request failed: ${error.message}`);
            }
        }
    }
    
    /**
     * Get weather forecast for planning events
     */
    async getWeatherForecast(location, days = 5) {
        try {
            const response = await axios.get(
                'https://api.openweathermap.org/data/2.5/forecast',
                {
                    params: {
                        lat: location.lat,
                        lon: location.lng,
                        appid: this.weatherAPI,
                        units: 'metric',
                        cnt: days * 8 // 8 forecasts per day (3-hour intervals)
                    },
                    timeout: 5000
                }
            );
            
            if (response.data && response.data.list) {
                return {
                    success: true,
                    data: {
                        forecast: response.data.list,
                        city: response.data.city,
                        country: response.data.city?.country,
                        forecastDays: days
                    }
                };
            }
            
            throw new Error('Invalid forecast data received');
            
        } catch (error) {
            console.error('❌ Weather forecast error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Check if weather conditions are critical
     */
    isCriticalWeather(weatherData) {
        if (!weatherData || !weatherData.weather || weatherData.weather.length === 0) {
            return false;
        }
        
        const weather = weatherData.weather[0];
        const main = weatherData.main;
        
        // Check weather type
        const weatherType = weather.main.toLowerCase();
        if (this.criticalWeatherTypes.includes(weatherType)) {
            return true;
        }
        
        // Check weather description
        const description = weather.description.toLowerCase();
        for (const condition of this.criticalConditions) {
            if (description.includes(condition)) {
                return true;
            }
        }
        
        // Check temperature extremes (below 0°C or above 40°C)
        if (main.temp < 0 || main.temp > 40) {
            return true;
        }
        
        // Check wind speed (over 50 km/h is dangerous)
        if (weatherData.wind && weatherData.wind.speed > 13.89) { // 50 km/h in m/s
            return true;
        }
        
        // Check visibility (less than 1km)
        if (weatherData.visibility && weatherData.visibility < 1000) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Create weather alert object
     */
    async createWeatherAlert(weatherData, location) {
        const weather = weatherData.weather[0];
        const main = weatherData.main;
        
        const severity = this.calculateSeverity(weatherData);
        const affectedEvents = await this.getAffectedBloodDrives(location, severity);
        
        return {
            id: `weather_${location.id}_${Date.now()}`,
            location: {
                name: location.name,
                coordinates: { lat: location.lat, lng: location.lng }
            },
            weather: {
                type: weather.main,
                description: weather.description,
                temperature: main.temp,
                feelsLike: main.feels_like,
                humidity: main.humidity,
                windSpeed: weatherData.wind?.speed || 0,
                visibility: weatherData.visibility || null
            },
            severity: severity,
            alertType: 'WEATHER_WARNING',
            message: this.generateAlertMessage(weatherData, location),
            recommendations: this.generateRecommendations(weatherData, severity),
            affectedEvents: affectedEvents,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
        };
    }
    
    /**
     * Calculate severity level
     */
    calculateSeverity(weatherData) {
        const weather = weatherData.weather[0];
        const main = weatherData.main;
        
        let severityScore = 0;
        
        // Weather type severity
        const weatherType = weather.main.toLowerCase();
        if (['tornado', 'hurricane', 'cyclone'].includes(weatherType)) {
            severityScore += 10;
        } else if (['thunderstorm', 'snow'].includes(weatherType)) {
            severityScore += 7;
        } else if (weatherType === 'rain') {
            severityScore += 4;
        }
        
        // Temperature severity
        if (main.temp < -10 || main.temp > 45) {
            severityScore += 8;
        } else if (main.temp < 0 || main.temp > 40) {
            severityScore += 5;
        } else if (main.temp < 5 || main.temp > 35) {
            severityScore += 2;
        }
        
        // Wind severity
        const windSpeed = weatherData.wind?.speed || 0;
        if (windSpeed > 20) { // Over 72 km/h
            severityScore += 8;
        } else if (windSpeed > 13.89) { // Over 50 km/h
            severityScore += 5;
        } else if (windSpeed > 8.33) { // Over 30 km/h
            severityScore += 2;
        }
        
        // Visibility severity
        const visibility = weatherData.visibility || 10000;
        if (visibility < 500) {
            severityScore += 8;
        } else if (visibility < 1000) {
            severityScore += 5;
        } else if (visibility < 2000) {
            severityScore += 2;
        }
        
        // Return severity level
        if (severityScore >= 15) return 'EXTREME';
        if (severityScore >= 10) return 'HIGH';
        if (severityScore >= 5) return 'MEDIUM';
        return 'LOW';
    }
    
    /**
     * Generate alert message
     */
    generateAlertMessage(weatherData, location) {
        const weather = weatherData.weather[0];
        const temp = Math.round(weatherData.main.temp);
        const windSpeed = weatherData.wind?.speed ? Math.round(weatherData.wind.speed * 3.6) : 0; // Convert to km/h
        
        let message = `🌤️ Weather Alert for ${location.name}: ${weather.description}`;
        
        if (temp < 0) {
            message += ` with freezing temperatures (${temp}°C)`;
        } else if (temp > 40) {
            message += ` with extreme heat (${temp}°C)`;
        } else if (temp < 5 || temp > 35) {
            message += ` with temperature ${temp}°C`;
        }
        
        if (windSpeed > 50) {
            message += ` and strong winds (${windSpeed} km/h)`;
        }
        
        message += '. Blood donation events may be affected.';
        
        return message;
    }
    
    /**
     * Generate recommendations based on weather
     */
    generateRecommendations(weatherData, severity) {
        const recommendations = [];
        const weather = weatherData.weather[0];
        const temp = weatherData.main.temp;
        
        if (severity === 'EXTREME') {
            recommendations.push('❌ Cancel all outdoor blood donation events');
            recommendations.push('🏠 Move events indoors if possible');
            recommendations.push('📞 Contact donors to reschedule appointments');
        } else if (severity === 'HIGH') {
            recommendations.push('⚠️ Consider postponing outdoor events');
            recommendations.push('🚐 Ensure mobile units are weatherproofed');
            recommendations.push('📱 Send weather updates to scheduled donors');
        } else if (severity === 'MEDIUM') {
            recommendations.push('☂️ Prepare weather protection for outdoor events');
            recommendations.push('🧥 Advise donors to dress appropriately');
            recommendations.push('🔄 Have backup indoor location ready');
        }
        
        // Temperature-specific recommendations
        if (temp < 0) {
            recommendations.push('❄️ Ensure heating in donation areas');
            recommendations.push('☕ Provide warm refreshments');
        } else if (temp > 35) {
            recommendations.push('🧊 Ensure adequate cooling and hydration');
            recommendations.push('☀️ Provide shade for waiting areas');
        }
        
        // Weather-specific recommendations
        if (weather.main.toLowerCase().includes('rain')) {
            recommendations.push('☔ Provide covered walkways');
            recommendations.push('🚗 Ensure accessible parking');
        }
        
        if (weather.main.toLowerCase().includes('snow')) {
            recommendations.push('❄️ Clear pathways and parking areas');
            recommendations.push('🧂 Salt walkways for safety');
        }
        
        return recommendations;
    }
    
    /**
     * Get affected blood drives for a location
     */
    async getAffectedBloodDrives(location, severity) {
        try {
            // This would integrate with your blood drive scheduling system
            // For now, return mock data structure
            
            const mockEvents = [
                {
                    id: `event_${location.id}_1`,
                    name: `Blood Drive - ${location.name} Community Center`,
                    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    location: location.name,
                    type: 'outdoor',
                    expectedDonors: 50,
                    status: severity === 'EXTREME' ? 'cancelled' : 'monitoring'
                },
                {
                    id: `event_${location.id}_2`,
                    name: `Mobile Blood Drive - ${location.name} Mall`,
                    date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                    location: location.name,
                    type: 'mobile',
                    expectedDonors: 30,
                    status: severity === 'HIGH' ? 'postponed' : 'proceeding'
                }
            ];
            
            return mockEvents;
            
        } catch (error) {
            console.warn('⚠️ Could not fetch affected blood drives:', error.message);
            return [];
        }
    }
    
    /**
     * Delay function for rate limiting
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Test weather service connectivity
     */
    async testConnection() {
        try {
            console.log('🧪 Testing weather service connection...');
            
            // Test with Mumbai coordinates
            const testLocation = { lat: 19.0760, lng: 72.8777, name: 'Mumbai' };
            const weather = await this.getWeatherData(testLocation);
            
            return {
                success: true,
                data: {
                    service: 'Weather Service',
                    apiKey: !!this.weatherAPI,
                    testLocation: testLocation.name,
                    weatherData: {
                        temperature: weather.main.temp,
                        description: weather.weather[0].description,
                        humidity: weather.main.humidity
                    },
                    timestamp: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('❌ Weather service test failed:', error);
            return {
                success: false,
                error: error.message,
                service: 'Weather Service'
            };
        }
    }
}

module.exports = WeatherService;