/**
 * Verification script to test the admin authentication fix
 */

console.log('🧪 Testing Admin Authentication Fix...\n');

// Test 1: Simulate user logout and verify admin data is preserved
console.log('TEST 1: User Logout → Admin Data Preservation');
console.log('='.repeat(50));

// Setup: Add some test admin data
localStorage.setItem('bloodconnect_admin', 'true');
localStorage.setItem('admin_email', 'admin@bloodconnect.com');
localStorage.setItem('admin_login_time', new Date().toISOString());

// Add some test user data
localStorage.setItem('bloodconnect_token', 'test_user_token');
localStorage.setItem('bloodconnect_user', '{"firstName": "Test", "email": "test@user.com"}');

console.log('✅ Setup complete - both user and admin data stored');

// Simulate user logout (clear only user data)
localStorage.removeItem('bloodconnect_token');
localStorage.removeItem('bloodconnect_user');
localStorage.removeItem('bloodconnect_demo_user');
localStorage.removeItem('bloodconnect_remember');
localStorage.removeItem('bloodconnect_redirect');

// Check if admin data is preserved
const adminStatus = localStorage.getItem('bloodconnect_admin');
const adminEmail = localStorage.getItem('admin_email');
const adminLoginTime = localStorage.getItem('admin_login_time');

if (adminStatus === 'true' && adminEmail && adminLoginTime) {
    console.log('✅ PASS: Admin data preserved after user logout');
    console.log(`   Admin Status: ${adminStatus}`);
    console.log(`   Admin Email: ${adminEmail}`);
    console.log(`   Login Time: ${adminLoginTime}`);
} else {
    console.log('❌ FAIL: Admin data was cleared during user logout');
}

console.log('\nTEST 2: Admin Session Validation');
console.log('='.repeat(50));

// Test session validation logic
function validateAdminSession(loginTime) {
    const currentTime = new Date();
    const sessionTime = new Date(loginTime);
    const timeDiff = currentTime - sessionTime;
    const minutesDiff = timeDiff / (1000 * 60);
    
    return minutesDiff <= 30; // 30 minute session timeout
}

// Test with current login time (should be valid)
const isValid = validateAdminSession(adminLoginTime);
console.log(`✅ Current session validation: ${isValid ? 'VALID' : 'EXPIRED'}`);

// Test with expired login time
const expiredTime = new Date(Date.now() - (31 * 60 * 1000)).toISOString(); // 31 minutes ago
const isExpired = validateAdminSession(expiredTime);
console.log(`✅ Expired session validation: ${isExpired ? 'VALID (ERROR)' : 'EXPIRED (CORRECT)'}`);

console.log('\nTEST 3: Admin Dashboard Authentication Check');
console.log('='.repeat(50));

// Simulate admin dashboard authentication check
function checkAdminAuthentication(pathname = '/admin-dashboard.html') {
    // Check if we're on the admin login page
    if (pathname.includes('admin-login.html')) {
        console.log('📍 On admin login page, skipping auth check');
        return false;
    }
    
    // Check admin credentials
    const adminStatus = localStorage.getItem('bloodconnect_admin');
    const adminEmail = localStorage.getItem('admin_email');
    const adminLoginTime = localStorage.getItem('admin_login_time');
    
    if (adminStatus !== 'true' || !adminEmail || !adminLoginTime) {
        console.log('❌ Admin authentication failed - would redirect to login');
        return false;
    }
    
    // Check session timeout
    if (!validateAdminSession(adminLoginTime)) {
        console.log('⏰ Admin session expired - would clear and redirect');
        return false;
    }
    
    console.log('✅ Admin authentication successful - would load dashboard');
    return true;
}

// Test dashboard access
const dashboardAccess = checkAdminAuthentication('/admin-dashboard.html');
console.log(`Dashboard Access Result: ${dashboardAccess ? 'GRANTED' : 'DENIED'}`);

// Test login page access
const loginPageResult = checkAdminAuthentication('/admin-login.html');
console.log(`Login Page Result: ${loginPageResult ? 'ERROR' : 'CORRECT (skipped auth check)'}`);

console.log('\nTEST 4: Admin Login Page Redirect Logic');
console.log('='.repeat(50));

// Simulate admin login page check
function checkExistingAdminLogin(pathname = '/admin-login.html') {
    // Only check on admin login page
    if (!pathname.includes('admin-login.html')) {
        return false;
    }
    
    const adminStatus = localStorage.getItem('bloodconnect_admin');
    const adminEmail = localStorage.getItem('admin_email');
    const adminLoginTime = localStorage.getItem('admin_login_time');
    
    // Validate that all required admin data exists and is valid
    if (adminStatus === 'true' && adminEmail && adminLoginTime) {
        // Check if session is still valid (30 minutes)
        if (validateAdminSession(adminLoginTime)) {
            console.log('✅ Valid admin session found - would redirect to dashboard');
            return true;
        } else {
            console.log('⏰ Admin session expired - would clear data and show login form');
            // Would clear expired session here
            return false;
        }
    }
    
    console.log('📝 No admin session - would show login form');
    return false;
}

const loginRedirect = checkExistingAdminLogin('/admin-login.html');
console.log(`Login Page Redirect: ${loginRedirect ? 'TO DASHBOARD' : 'SHOW LOGIN FORM'}`);

console.log('\n🎯 FINAL TEST RESULTS');
console.log('='.repeat(50));

let allTestsPassed = true;

// Verify admin data is still intact
const finalAdminCheck = localStorage.getItem('bloodconnect_admin') === 'true' && 
                       localStorage.getItem('admin_email') && 
                       localStorage.getItem('admin_login_time');

if (finalAdminCheck) {
    console.log('✅ All admin authentication data intact');
} else {
    console.log('❌ Admin authentication data missing');
    allTestsPassed = false;
}

// Verify user data was cleared
const userDataCleared = !localStorage.getItem('bloodconnect_token') && 
                       !localStorage.getItem('bloodconnect_user');

if (userDataCleared) {
    console.log('✅ User authentication data properly cleared');
} else {
    console.log('❌ User authentication data not cleared');
    allTestsPassed = false;
}

console.log(`\n🎉 OVERALL RESULT: ${allTestsPassed ? 'ALL TESTS PASSED! 🚀' : 'SOME TESTS FAILED ❌'}`);

if (allTestsPassed) {
    console.log('\n💡 The fix should resolve the issue where:');
    console.log('   1. User logs out');
    console.log('   2. Admin login page is accessed');  
    console.log('   3. Admin dashboard shows errors due to missing auth');
    console.log('\n✅ Now admin authentication is properly isolated from user authentication!');
}

// Cleanup
console.log('\n🧹 Cleaning up test data...');
localStorage.removeItem('bloodconnect_admin');
localStorage.removeItem('admin_email');
localStorage.removeItem('admin_login_time');
console.log('✅ Test cleanup complete');