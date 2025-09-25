/**
 * Script to call the admin cleanup endpoint to remove test data
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';
const ADMIN_EMAIL = 'admin@bloodconnect.com';

function getAdminAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'x-admin-email': ADMIN_EMAIL,
        'x-admin-auth': 'true'
    };
}

async function cleanupTestData() {
    console.log('🧹 Calling admin cleanup endpoint to remove test data...\n');
    
    try {
        // Call the cleanup endpoint
        const response = await axios.delete(`${BASE_URL}/admin/cleanup-test-data`, {
            headers: getAdminAuthHeaders()
        });
        
        if (response.data.success) {
            console.log('✅ Test data cleanup completed successfully!');
            console.log('\n📊 CLEANUP RESULTS:');
            console.log('='.repeat(50));
            console.log(`Test Users Removed: ${response.data.data.testUsersRemoved}`);
            console.log(`Test Donors Removed: ${response.data.data.testDonorsRemoved}`);
            console.log(`Test User Donations Removed: ${response.data.data.testUserDonationsRemoved}`);
            console.log(`Test Requests Removed: ${response.data.data.testRequestsRemoved}`);
            console.log(`Test User Requests Removed: ${response.data.data.testUserRequestsRemoved}`);
            console.log(`Total Entries Removed: ${response.data.data.totalRemoved}`);
            
            console.log('\n🎉 SUCCESS! The admin dashboard should now show only REAL DATA!');
            console.log('💡 Please refresh the admin dashboard to see the changes.');
        } else {
            console.log('❌ Cleanup failed:', response.data.message);
        }
    } catch (error) {
        console.error('❌ Error calling cleanup endpoint:', error.message);
        
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the cleanup
cleanupTestData();