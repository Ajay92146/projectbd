# 🔑 Advanced Features Configuration Guide

## 📋 **REQUIRED API KEYS AND SERVICES**

### **🗺️ Location Services**

#### **Google Cloud Platform APIs**
1. **Google Maps JavaScript API**
   - Purpose: Interactive maps and location display
   - URL: https://console.cloud.google.com/apis/library/maps-backend.googleapis.com

2. **Google Places API**
   - Purpose: Find nearby blood banks and hospitals
   - URL: https://console.cloud.google.com/apis/library/places-backend.googleapis.com

3. **Google Directions API**
   - Purpose: Route optimization for blood delivery
   - URL: https://console.cloud.google.com/apis/library/directions-backend.googleapis.com

4. **Google Distance Matrix API**
   - Purpose: Calculate distances between locations
   - URL: https://console.cloud.google.com/apis/library/distance-matrix-backend.googleapis.com

**Setup Instructions:**
```bash
# 1. Create Google Cloud Project
# 2. Enable required APIs
# 3. Create API credentials
# 4. Add billing information (required for production)
```

### **🌤️ Weather Services**

#### **OpenWeatherMap API**
- Purpose: Weather alerts affecting blood drives
- URL: https://openweathermap.org/api
- Free tier: 1000 calls/day

**Setup:**
```bash
# 1. Register at openweathermap.org
# 2. Verify email
# 3. Get free API key
# 4. Upgrade to paid plan for production
```

### **📱 Communication Services**

#### **Firebase Cloud Messaging (FCM)**
- Purpose: Push notifications for emergency alerts
- URL: https://firebase.google.com/docs/cloud-messaging

#### **WhatsApp Business API**
- Purpose: Emergency notifications via WhatsApp
- URL: https://developers.facebook.com/docs/whatsapp

#### **SMS Gateway (Twilio)**
- Purpose: SMS notifications backup
- URL: https://www.twilio.com/docs/sms

### **✅ Validation Services**

#### **NumVerify (Phone Validation)**
- Purpose: Validate donor phone numbers
- URL: https://numverify.com/
- Free tier: 1000 requests/month

#### **ZeroBounce (Email Validation)**
- Purpose: Validate donor email addresses
- URL: https://www.zerobounce.net/
- Free tier: 100 credits/month

---

## 🔧 **ENVIRONMENT CONFIGURATION**

### **Backend Environment Variables**
Create/update `.env` file:

```env
# Existing variables
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bloodconnect

# Google Maps APIs
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
GOOGLE_DIRECTIONS_API_KEY=your_google_directions_api_key_here
GOOGLE_DISTANCE_MATRIX_API_KEY=your_distance_matrix_api_key_here

# Weather Service
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Communication Services
FIREBASE_SERVER_KEY=your_firebase_server_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id
WHATSAPP_API_TOKEN=your_whatsapp_api_token
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Validation Services
PHONE_VALIDATION_API_KEY=your_numverify_api_key
EMAIL_VALIDATION_API_KEY=your_zerobounce_api_key

# Security
QR_SECRET=your_qr_code_secret_key_here
JWT_SECRET=your_jwt_secret_here

# WebSocket Configuration
WEBSOCKET_PORT=8080

# Location Configuration
DEFAULT_SEARCH_RADIUS=50
MAX_SEARCH_RADIUS=100
```

### **Frontend Configuration**
Create `frontend/js/config.js`:

```javascript
// Frontend API Configuration
const API_CONFIG = {
    // Google Maps
    GOOGLE_MAPS_API_KEY: 'your_google_maps_api_key_here',
    
    // WebSocket
    WEBSOCKET_URL: 'ws://localhost:8080',
    
    // Location Settings
    DEFAULT_RADIUS: 50,
    MAX_RADIUS: 100,
    
    // Notification Settings
    NOTIFICATION_TIMEOUT: 10000,
    
    // QR Code Settings
    QR_ERROR_CORRECTION: 'M',
    QR_MARGIN: 1
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}
```

---

## 📦 **PACKAGE DEPENDENCIES**

### **Backend Dependencies**
Update `package.json`:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.4.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.1",
    
    "@google/maps": "^1.1.3",
    "axios": "^1.4.0",
    "qrcode": "^1.5.3",
    "ws": "^8.13.0",
    "node-cron": "^3.0.2",
    "firebase-admin": "^11.10.1",
    "twilio": "^4.14.0",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.32.1"
  },
  "devDependencies": {
    "jest": "^29.6.1",
    "supertest": "^6.3.3",
    "nodemon": "^3.0.1"
  }
}
```

### **Frontend Dependencies**
Add to HTML or install via npm:

```html
<!-- Google Maps JavaScript API -->
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>

<!-- QR Code Scanner -->
<script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"></script>

<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging.js"></script>
```

---

## 🚀 **INSTALLATION INSTRUCTIONS**

### **Step 1: Install Dependencies**
```bash
# Backend
npm install

# Frontend (if using npm)
cd frontend
npm install
```

### **Step 2: Configure API Keys**
1. Copy `.env.example` to `.env`
2. Fill in all API keys from the services above
3. Update `frontend/js/config.js` with frontend keys

### **Step 3: Database Setup**
```bash
# Start MongoDB
mongod

# Create geospatial indexes
mongo bloodconnect --eval "db.bloodbanks.createIndex({location: '2dsphere'})"
```

### **Step 4: Firebase Setup**
1. Create Firebase project
2. Generate service account key
3. Download JSON key file
4. Place in `backend/config/firebase-admin-key.json`

### **Step 5: Test Configuration**
```bash
# Run configuration test
npm run test:config

# Start development server
npm run dev
```

---

## 🧪 **TESTING CONFIGURATION**

### **API Key Validation Script**
Create `backend/scripts/validate-config.js`:

```javascript
const dotenv = require('dotenv');
dotenv.config();

const requiredKeys = [
    'GOOGLE_MAPS_API_KEY',
    'OPENWEATHER_API_KEY',
    'FIREBASE_SERVER_KEY',
    'PHONE_VALIDATION_API_KEY',
    'EMAIL_VALIDATION_API_KEY'
];

function validateConfiguration() {
    const missing = [];
    
    requiredKeys.forEach(key => {
        if (!process.env[key]) {
            missing.push(key);
        }
    });
    
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        process.exit(1);
    }
    
    console.log('✅ All required API keys configured');
}

validateConfiguration();
```

### **Service Connectivity Test**
```javascript
// Test Google Maps API
async function testGoogleMaps() {
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?` +
        `address=Mumbai&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK') {
        console.log('✅ Google Maps API working');
    } else {
        console.error('❌ Google Maps API error:', data.error_message);
    }
}

// Test OpenWeather API
async function testWeatherAPI() {
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?` +
        `q=Mumbai&appid=${process.env.OPENWEATHER_API_KEY}`
    );
    
    if (response.ok) {
        console.log('✅ OpenWeather API working');
    } else {
        console.error('❌ OpenWeather API error');
    }
}
```

---

## 📊 **COST ESTIMATION**

### **Monthly Costs (Production)**

| Service | Free Tier | Paid Plan | Est. Monthly Cost |
|---------|-----------|-----------|-------------------|
| Google Maps APIs | $200 credit | Pay-per-use | $50-200 |
| OpenWeatherMap | 1K calls/day | $40/month | $40 |
| Firebase FCM | 20M messages | Pay-per-use | $10-50 |
| Twilio SMS | Trial credit | $0.0075/SMS | $20-100 |
| NumVerify | 1K requests | $9.99/month | $10 |
| ZeroBounce | 100 credits | $16/month | $16 |
| **Total** | | | **$146-416/month** |

---

## 🔒 **SECURITY CONSIDERATIONS**

### **API Key Security**
- ✅ Never commit API keys to version control
- ✅ Use environment variables
- ✅ Implement API key rotation
- ✅ Set up API usage alerts
- ✅ Restrict API keys by domain/IP

### **Rate Limiting**
```javascript
// Implement rate limiting for external API calls
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many API requests, please try again later.'
});

app.use('/api/', apiLimiter);
```

---

This configuration guide ensures proper setup of all advanced features while maintaining security and cost efficiency! 🔐💰