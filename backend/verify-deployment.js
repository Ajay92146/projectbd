#!/usr/bin/env node

/**
 * Deployment Verification Script
 * This script helps verify that the blood donation app is properly deployed
 */

const https = require('https');
const http = require('http');

// Configuration
const RENDER_URL = process.env.RENDER_URL || 'https://your-app-name.onrender.com'; // Update with your actual Render URL
const ENDPOINTS_TO_TEST = [
    '/api/health',
    '/api/cors-test',
    '/api/auth/profile', // Should return 401
];

console.log('🩸 Blood Donation Deployment Verification\n');

// Test function
function testEndpoint(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        const req = client.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        url,
                        status: res.statusCode,
                        statusText: res.statusMessage,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        url,
                        status: res.statusCode,
                        statusText: res.statusMessage,
                        data: data
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            reject({
                url,
                error: error.message
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            reject({
                url,
                error: 'Request timeout'
            });
        });
    });
}

// Main test function
async function runTests() {
    console.log(`Testing deployment at: ${RENDER_URL}\n`);
    
    for (const endpoint of ENDPOINTS_TO_TEST) {
        const fullUrl = `${RENDER_URL}${endpoint}`;
        
        try {
            console.log(`🧪 Testing: ${endpoint}`);
            const result = await testEndpoint(fullUrl);
            
            // Determine if result is expected
            let isExpected = false;
            let message = '';
            
            if (endpoint === '/api/health' && result.status === 200) {
                isExpected = true;
                message = '✅ Health endpoint working';
            } else if (endpoint === '/api/cors-test' && result.status === 200) {
                isExpected = true;
                message = '✅ CORS endpoint working';
            } else if (endpoint === '/api/auth/profile' && result.status === 401) {
                isExpected = true;
                message = '✅ Auth endpoint working (401 expected)';
            } else {
                message = `❌ Unexpected response: ${result.status}`;
            }
            
            console.log(`   Status: ${result.status} ${result.statusText}`);
            console.log(`   Result: ${message}`);
            
            if (result.data && typeof result.data === 'object') {
                console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.error}`);
        }
        
        console.log(''); // Empty line for readability
    }
    
    // Test frontend access
    console.log('🧪 Testing frontend access');
    try {
        const result = await testEndpoint(RENDER_URL);
        if (result.status === 200) {
            console.log('   ✅ Frontend accessible');
        } else {
            console.log(`   ❌ Frontend error: ${result.status}`);
        }
    } catch (error) {
        console.log(`   ❌ Frontend error: ${error.error}`);
    }
    
    console.log('\n📋 Manual Testing Instructions:');
    console.log('1. Open your browser and go to:', RENDER_URL);
    console.log('2. Open Developer Tools (F12)');
    console.log('3. Go to the login page');
    console.log('4. Try to create an account or log in');
    console.log('5. Check the Console tab for any JavaScript errors');
    console.log('6. Check the Network tab to see API requests');
    console.log('\n🔧 Debug Tool:');
    console.log(`Visit: ${RENDER_URL}/debug-login.html`);
    console.log('This tool will help you test API connectivity and identify issues.');
}

// Run the tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };
