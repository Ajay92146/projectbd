/**
 * Admin Dashboard Fix - Script to debug and fix admin dashboard data loading issues
 */

// Function to check if the admin dashboard API is working correctly
async function checkAdminDashboardAPI() {
    try {
        console.log('Testing admin dashboard API connection...');
        
        // Get API base URL
        const apiUrl = getAPIBaseURL();
        console.log(`API Base URL: ${apiUrl}`);
        
        // Test dashboard stats endpoint
        const statsUrl = `${apiUrl}/admin/dashboard-stats`;
        console.log(`Testing stats endpoint: ${statsUrl}`);
        
        const response = await fetch(statsUrl, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            console.log('✅ API connection successful!');
            console.log('Data received:', data.data);
            return data.data;
        } else {
            throw new Error(data.message || 'API request failed');
        }
    } catch (error) {
        console.error('❌ API connection failed:', error.message);
        throw error;
    }
}

// Function to update dashboard UI with data
function updateDashboardUI(data) {
    try {
        console.log('Updating dashboard UI with data:', data);
        
        // Update total users
        const totalUsers = document.getElementById('totalUsers');
        if (totalUsers) {
            totalUsers.textContent = data.totalUsers.toLocaleString();
            console.log(`Updated totalUsers: ${totalUsers.textContent}`);
        }
        
        // Update total donations
        const totalDonations = document.getElementById('totalDonations');
        if (totalDonations) {
            totalDonations.textContent = data.totalDonations.toLocaleString();
            console.log(`Updated totalDonations: ${totalDonations.textContent}`);
        }
        
        // Update total requests
        const totalRequests = document.getElementById('totalRequests');
        if (totalRequests) {
            totalRequests.textContent = data.totalRequests.toLocaleString();
            console.log(`Updated totalRequests: ${totalRequests.textContent}`);
        }
        
        // Update total blood units
        const totalBloodUnits = document.getElementById('totalBloodUnits');
        if (totalBloodUnits) {
            totalBloodUnits.textContent = data.totalBloodUnits.toLocaleString();
            console.log(`Updated totalBloodUnits: ${totalBloodUnits.textContent}`);
        }
        
        console.log('✅ Dashboard UI updated successfully!');
    } catch (error) {
        console.error('❌ Failed to update dashboard UI:', error.message);
    }
}

// Function to fix admin dashboard data loading
async function fixAdminDashboard() {
    try {
        console.log('Starting admin dashboard fix...');
        
        // Check if we're on the admin dashboard page
        if (!document.getElementById('totalUsers')) {
            console.log('Not on admin dashboard page, skipping fix.');
            return;
        }
        
        // Get data from API
        const data = await checkAdminDashboardAPI();
        
        // Update UI with data
        updateDashboardUI(data);
        
        console.log('✅ Admin dashboard fix completed successfully!');
    } catch (error) {
        console.error('❌ Admin dashboard fix failed:', error.message);
    }
}

// Run the fix when the page loads
window.addEventListener('DOMContentLoaded', fixAdminDashboard);

// Also expose the fix function globally for manual execution
window.fixAdminDashboard = fixAdminDashboard;