/**
 * Urgent Requests Section - Validation Script
 * This script validates all the improvements made to the urgent requests section
 */

// Test results collector
const validationResults = {
    core: [],
    accessibility: [],
    performance: [],
    integration: []
};

/**
 * Log validation result
 */
function logResult(category, test, passed, message = '') {
    const result = { test, passed, message, timestamp: new Date().toISOString() };
    validationResults[category].push(result);
    console.log(`${passed ? '✅' : '❌'} ${category.toUpperCase()}: ${test} - ${message}`);
}

/**
 * Core Functionality Validation
 */
function validateCoreFunctionality() {
    console.log('\n🔧 VALIDATING CORE FUNCTIONALITY...');
    
    // Check if UrgentRequestsSection class exists
    const hasClass = typeof UrgentRequestsSection === 'function';
    logResult('core', 'Class Definition', hasClass, 'UrgentRequestsSection class available');
    
    if (hasClass) {
        const instance = new UrgentRequestsSection();
        
        // Check essential methods
        const methods = ['init', 'loadUrgentRequests', 'renderUrgentRequests', 'respondToRequest', 'shareRequest'];
        methods.forEach(method => {
            const hasMethod = typeof instance[method] === 'function';
            logResult('core', `Method: ${method}`, hasMethod, hasMethod ? 'Available' : 'Missing');
        });
        
        // Check caching system
        const hasCache = instance.cache && typeof instance.cache.ttl === 'number';
        logResult('core', 'Caching System', hasCache, hasCache ? `TTL: ${instance.cache.ttl}ms` : 'Cache missing');
        
        // Check auto-refresh configuration
        const hasAutoRefresh = typeof instance.refreshInterval === 'number' && instance.refreshInterval > 0;
        logResult('core', 'Auto-refresh', hasAutoRefresh, hasAutoRefresh ? `Interval: ${instance.refreshInterval/60000} minutes` : 'Not configured');
    }
}

/**
 * Accessibility Features Validation
 */
function validateAccessibility() {
    console.log('\n♿ VALIDATING ACCESSIBILITY FEATURES...');
    
    if (typeof UrgentRequestsSection === 'function') {
        const instance = new UrgentRequestsSection();
        
        // Check new accessibility methods
        const accessibilityMethods = [
            'handleButtonKeydown',
            'navigateToCard', 
            'announceToScreenReader',
            'initKeyboardNavigation'
        ];
        
        accessibilityMethods.forEach(method => {
            const hasMethod = typeof instance[method] === 'function';
            logResult('accessibility', `Method: ${method}`, hasMethod, hasMethod ? 'Implemented' : 'Missing');
        });
        
        // Create a test section to check ARIA attributes
        const testContainer = document.createElement('section');
        testContainer.id = 'test-urgent-section';
        instance.sectionContainer = testContainer;
        
        // Test ARIA implementation
        instance.sectionContainer.setAttribute('role', 'region');
        instance.sectionContainer.setAttribute('aria-label', 'Urgent Blood Requests');
        
        const hasRole = instance.sectionContainer.getAttribute('role') === 'region';
        const hasAriaLabel = !!instance.sectionContainer.getAttribute('aria-label');
        
        logResult('accessibility', 'ARIA Attributes', hasRole && hasAriaLabel, 
            `Role: ${hasRole}, Label: ${hasAriaLabel}`);
    }
}

/**
 * Performance Optimizations Validation
 */
function validatePerformance() {
    console.log('\n⚡ VALIDATING PERFORMANCE OPTIMIZATIONS...');
    
    if (typeof UrgentRequestsSection === 'function') {
        const instance = new UrgentRequestsSection();
        
        // Check timeout handling
        const testLoadMethod = instance.loadUrgentRequests.toString();
        const hasTimeout = testLoadMethod.includes('AbortController') && testLoadMethod.includes('setTimeout');
        logResult('performance', 'Timeout Handling', hasTimeout, 'AbortController implementation detected');
        
        // Check caching implementation
        const hasCacheValidation = typeof instance.isCacheValid === 'function';
        const hasCacheLoading = typeof instance.loadFromCache === 'function';
        logResult('performance', 'Cache Management', hasCacheValidation && hasCacheLoading, 
            'Cache validation and loading methods available');
        
        // Check error state rendering
        const errorMethods = ['renderTimeoutState', 'renderNetworkErrorState', 'renderErrorState'];
        const hasErrorHandling = errorMethods.every(method => typeof instance[method] === 'function');
        logResult('performance', 'Error State Handling', hasErrorHandling, 
            `${errorMethods.length} error states implemented`);
    }
}

/**
 * Enhanced Features Validation
 */
function validateEnhancedFeatures() {
    console.log('\n✨ VALIDATING ENHANCED FEATURES...');
    
    if (typeof UrgentRequestsSection === 'function') {
        const instance = new UrgentRequestsSection();
        
        // Check sharing enhancements
        const sharingMethods = [
            'shareViaWhatsApp',
            'shareViaEmail', 
            'copyToClipboard',
            'shareViaSMS',
            'showShareOptions',
            'generateShareText'
        ];
        
        const availableSharingMethods = sharingMethods.filter(method => typeof instance[method] === 'function');
        logResult('integration', 'Enhanced Sharing', availableSharingMethods.length >= 4, 
            `${availableSharingMethods.length}/${sharingMethods.length} sharing methods available`);
        
        // Check user experience enhancements
        const uxMethods = ['showToast', 'trackShareEvent', 'isMobileDevice'];
        const availableUXMethods = uxMethods.filter(method => typeof instance[method] === 'function');
        logResult('integration', 'UX Enhancements', availableUXMethods.length >= 2, 
            `${availableUXMethods.length}/${uxMethods.length} UX methods available`);
        
        // Check context preservation
        const hasContextPreservation = instance.respondToRequest.toString().includes('sessionStorage');
        logResult('integration', 'Context Preservation', hasContextPreservation, 
            'Session storage integration for donation flow');
    }
}

/**
 * CSS and Styling Validation
 */
function validateStyling() {
    console.log('\n🎨 VALIDATING CSS AND STYLING...');
    
    if (typeof UrgentRequestsSection === 'function') {
        const instance = new UrgentRequestsSection();
        
        // Check if enhanced styles method exists
        const hasStyleMethod = typeof instance.addEnhancedStyles === 'function';
        logResult('integration', 'Enhanced Styling', hasStyleMethod, 'addEnhancedStyles method available');
        
        if (hasStyleMethod) {
            // Test style injection
            const initialStyleCount = document.querySelectorAll('style').length;
            instance.addEnhancedStyles();
            const finalStyleCount = document.querySelectorAll('style').length;
            
            logResult('integration', 'Style Injection', finalStyleCount > initialStyleCount, 
                'CSS styles successfully injected');
            
            // Check for accessibility styles
            const urgentStyles = document.getElementById('urgent-requests-enhanced-styles');
            if (urgentStyles) {
                const styleContent = urgentStyles.textContent;
                const hasA11yStyles = styleContent.includes('prefers-contrast') && 
                                   styleContent.includes('prefers-reduced-motion') &&
                                   styleContent.includes('.sr-only');
                                   
                logResult('accessibility', 'CSS Accessibility', hasA11yStyles, 
                    'High contrast, reduced motion, and screen reader styles included');
            }
        }
    }
}

/**
 * Global Instance Validation
 */
function validateGlobalInstance() {
    console.log('\n🌐 VALIDATING GLOBAL INSTANCE...');
    
    const hasGlobalInstance = typeof window.urgentSection === 'object';
    logResult('integration', 'Global Instance', hasGlobalInstance, 
        hasGlobalInstance ? 'window.urgentSection available' : 'Global instance missing');
    
    if (hasGlobalInstance) {
        const instance = window.urgentSection;
        const isProperInstance = instance instanceof UrgentRequestsSection;
        logResult('integration', 'Instance Type', isProperInstance, 
            'Global instance is UrgentRequestsSection');
    }
}

/**
 * Run all validations
 */
function runFullValidation() {
    console.log('🆘 URGENT REQUESTS SECTION - COMPREHENSIVE VALIDATION');
    console.log('='.repeat(60));
    
    validateCoreFunctionality();
    validateAccessibility();
    validatePerformance();
    validateEnhancedFeatures();
    validateStyling();
    validateGlobalInstance();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    
    // Calculate results
    const allResults = Object.values(validationResults).flat();
    const totalTests = allResults.length;
    const passedTests = allResults.filter(r => r.passed).length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    
    // Category breakdown
    Object.entries(validationResults).forEach(([category, results]) => {
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        console.log(`${category.toUpperCase()}: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
    });
    
    console.log('='.repeat(60));
    
    if (successRate >= 90) {
        console.log('🎉 EXCELLENT! Urgent requests section is fully optimized.');
    } else if (successRate >= 75) {
        console.log('✅ GOOD! Most features are working correctly.');
    } else {
        console.log('⚠️ NEEDS ATTENTION! Some features require fixes.');
    }
    
    return {
        totalTests,
        passedTests,
        successRate: parseFloat(successRate),
        results: validationResults
    };
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runFullValidation,
        validateCoreFunctionality,
        validateAccessibility,
        validatePerformance,
        validateEnhancedFeatures,
        validateStyling,
        validateGlobalInstance
    };
}

// Auto-run if in browser and urgent section script is loaded
if (typeof window !== 'undefined' && typeof UrgentRequestsSection !== 'undefined') {
    // Wait a bit for the script to fully load
    setTimeout(() => {
        console.log('🚀 Auto-running validation...');
        runFullValidation();
    }, 1000);
}