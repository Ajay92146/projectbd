# External API Integration Guide for Blood Donation Website

## Current Status
❌ **No external APIs currently integrated**
✅ **Only internal database search available**

## Available External Blood Bank APIs in India

### 1. eRaktKosh (Government Portal)
- **Website**: https://www.eraktkosh.in/
- **Status**: Government portal - may have APIs
- **Coverage**: National blood bank network
- **Integration**: Contact NBTC for API access

### 2. Thalassaemia and Sickle Cell Society APIs
- **Website**: Various state-specific organizations
- **Status**: Limited public APIs
- **Coverage**: Specialized blood requirements

### 3. Red Cross Society APIs
- **Website**: https://www.indianredcross.org/
- **Status**: Organization-specific, limited public access
- **Coverage**: Regional blood banks

## Recommended Third-Party APIs to Integrate

### 1. Location & Maps APIs
```javascript
// Google Maps API for better location search
const GOOGLE_MAPS_API = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

// Example integration
async function searchNearbyBloodBanks(lat, lng) {
    const response = await fetch(`${GOOGLE_MAPS_API}?location=${lat},${lng}&radius=10000&type=hospital&keyword=blood+bank&key=${API_KEY}`);
    return response.json();
}
```

### 2. Communication APIs
```javascript
// Twilio SMS API for donor notifications
const TWILIO_API = 'https://api.twilio.com/2010-04-01/Accounts';

// WhatsApp Business API for urgent requests
const WHATSAPP_API = 'https://graph.facebook.com/v18.0';
```

### 3. Healthcare Data APIs
```javascript
// Practo API (if available) for hospital data
const PRACTO_API = 'https://api.practo.com/v1';

// Apollo Hospitals API (if available)
const APOLLO_API = 'https://api.apollohospitals.com/v1';
```

## Implementation Steps

### Step 1: Enable External API Support
Add to your `.env` file:
```env
# External API Keys
GOOGLE_MAPS_API_KEY=your_google_maps_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
ERAKTKOSH_API_KEY=your_government_api_key
PRACTO_API_KEY=your_practo_key
```

### Step 2: Update Backend Routes
Add to `backend/routes/donors.js`:
```javascript
// External API integration route
router.get('/search/external', async (req, res) => {
    try {
        const { bloodGroup, location, urgent } = req.query;
        
        // Search multiple sources
        const results = await Promise.allSettled([
            searchInternalDB(bloodGroup, location),
            searchGovernmentAPI(bloodGroup, location),
            searchHospitalNetworks(bloodGroup, location)
        ]);
        
        // Combine and deduplicate results
        const donors = combineSearchResults(results);
        
        res.json({
            success: true,
            sources: ['internal', 'government', 'hospitals'],
            totalDonors: donors.length,
            donors: donors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'External search failed',
            error: error.message
        });
    }
});
```

### Step 3: Frontend Integration
Update your search form to use enhanced search:
```javascript
// Replace existing search in forms.js
async function performDonorSearch(bloodGroup, location) {
    try {
        // Use enhanced search system
        const results = await window.EnhancedDonorSearch.searchDonors({
            bloodGroup,
            location,
            urgency: 'high'
        });
        
        displaySearchResults(results);
    } catch (error) {
        console.error('Search failed:', error);
    }
}
```

## Potential External APIs to Research

### 1. Indian Government APIs
- **UMANG Platform**: https://web.umang.gov.in/
- **India Stack APIs**: https://www.indiastack.org/
- **Aadhaar APIs**: For donor verification
- **DigiLocker APIs**: For medical certificates

### 2. Healthcare Platforms
- **1mg API**: For pharmacy and health data
- **PharmEasy API**: For medical services
- **Zomato API**: For location-based services (hospitals)

### 3. Communication Platforms
- **JioSaavn API**: For regional language support
- **PayTM API**: For donation payments
- **UPI APIs**: For quick payments

### 4. Social Media APIs
- **Facebook Graph API**: For social donor networks
- **WhatsApp Business API**: For urgent notifications
- **Twitter API**: For emergency blood requests

## Benefits of External API Integration

### 1. Expanded Donor Network
- Access to government blood bank databases
- Hospital network integration
- Cross-platform donor sharing

### 2. Real-time Data
- Live blood availability status
- Immediate donor notifications
- Emergency response system

### 3. Better Verification
- Government ID verification
- Medical certificate validation
- Donor history verification

### 4. Enhanced Communication
- SMS/WhatsApp notifications
- Email campaigns
- Social media integration

## Next Steps to Implement

1. **Research Government APIs**
   - Contact National Blood Transfusion Council
   - Apply for eRaktKosh API access
   - Register with health ministry portals

2. **Partner with Hospitals**
   - Contact local hospital networks
   - Negotiate API access agreements
   - Set up data sharing protocols

3. **Integrate Communication APIs**
   - Set up Twilio account
   - Configure WhatsApp Business
   - Implement email automation

4. **Test External Integrations**
   - Start with one external API
   - Monitor performance and reliability
   - Gradually add more sources

## Current Implementation Status

✅ **Available Now:**
- Internal database search
- Enhanced search framework ready
- Multi-source search architecture

🔄 **In Progress:**
- External API research
- Government portal investigation
- Hospital partnership discussions

❌ **Not Yet Available:**
- Government API access
- Hospital network APIs
- Third-party integrations

## Contact for API Access

1. **Government APIs**: Contact your state health department
2. **Hospital APIs**: Reach out to hospital IT departments
3. **Platform APIs**: Apply through official developer portals
4. **Emergency Services**: Contact local emergency response teams

---
**Note**: Most external blood bank APIs in India require official approval and partnerships. Start with location and communication APIs while working on healthcare API access.