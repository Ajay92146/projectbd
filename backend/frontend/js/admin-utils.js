/**
 * Admin Utility Functions
 * Consolidated utility functions for the admin panel to eliminate duplication
 */

// Debug logging function
function debugLog(message) {
    console.log(`[AdminUtils] ${message}`);
}

// Enhanced error handling class
class AdminErrorHandler {
    static handleApiError(error, context = 'API call') {
        debugLog(`❌ ${context} failed: ${error.message}`);
        console.error(`${context} error:`, error);
        
        // Show user-friendly error message
        const userMessage = this.getUserFriendlyMessage(error);
        if (window.AdminUtils && window.AdminUtils.showNotification) {
            AdminUtils.showNotification(userMessage, 'error');
        }
        
        // Log error for debugging
        this.logError(error, context);
        
        // Check if it's an authentication error
        if (error.status === 401 || error.message.includes('authentication')) {
            this.handleAuthError();
        }
        
        return userMessage;
    }
    
    static getUserFriendlyMessage(error) {
        if (error.status === 401) {
            return 'Your session has expired. Please log in again.';
        } else if (error.status === 403) {
            return 'Access denied. You do not have permission to perform this action.';
        } else if (error.status === 404) {
            return 'Requested resource not found.';
        } else if (error.status === 500) {
            return 'Server error. Please try again later.';
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            return 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('timeout')) {
            return 'Request timeout. Please try again.';
        }
        
        return error.message || 'An unexpected error occurred. Please try again.';
    }
    
    static logError(error, context) {
        // In a real implementation, you might send this to a logging service
        console.error(`[AdminErrorHandler] ${context}:`, {
            message: error.message,
            stack: error.stack,
            status: error.status,
            timestamp: new Date().toISOString()
        });
    }
    
    static handleAuthError() {
        // Clear session and redirect to login
        if (window.AdminAuthUtils && window.AdminAuthUtils.sessionManager) {
            AdminAuthUtils.sessionManager.clearSession();
        }
        
        // Show notification
        if (window.AdminUtils && window.AdminUtils.showNotification) {
            AdminUtils.showNotification('Your session has expired. Please log in again.', 'error');
        }
        
        // Redirect to login after a short delay
        setTimeout(() => {
            window.location.href = 'admin-login.html';
        }, 2000);
    }
    
    static createErrorState(containerId, title, message, onRetry = null) {
        const container = document.getElementById(containerId);
        if (container) {
            const retryButton = onRetry ? 
                `<button class="btn btn-primary" onclick="${onRetry}" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i>
                    Retry
                </button>` : '';
                
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error-color, #dc3545); margin-bottom: 1rem;"></i>
                    <h3>${title}</h3>
                    <p>${message}</p>
                    ${retryButton}
                </div>
            `;
        }
    }
}

// Show notification to user
function showNotification(message, type = 'info') {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 10000;
            width: 300px;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: ${type === 'error' ? '#fee2e2' : type === 'success' ? '#dcfce7' : '#dbeafe'};
        border-left: 4px solid ${type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#2563eb'};
        border-radius: 0 4px 4px 0;
        padding: 12px 16px;
        margin-bottom: 10px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: flex-start;">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}" 
               style="color: ${type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#2563eb'}; margin-right: 8px; margin-top: 2px;"></i>
            <div style="flex: 1;">
                <div style="font-weight: 500; color: #333; font-size: 0.9rem;">${message}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; cursor: pointer; color: #999; font-size: 1rem;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    notificationContainer.appendChild(notification);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Update last updated time
function updateLastUpdatedTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    
    // Create or update last updated element
    let lastUpdatedElement = document.getElementById('lastUpdated');
    if (!lastUpdatedElement) {
        lastUpdatedElement = document.createElement('div');
        lastUpdatedElement.id = 'lastUpdated';
        lastUpdatedElement.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.9);
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 0.8rem;
            color: #666;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            z-index: 1000;
        `;
        document.body.appendChild(lastUpdatedElement);
    }
    
    lastUpdatedElement.textContent = `Last updated: ${dateString} ${timeString}`;
}

// Toggle select all checkboxes
function toggleSelectAll(section) {
    let checkboxes = [];
    let selectAllCheckbox = null;
    
    switch(section) {
        case 'users':
            checkboxes = document.querySelectorAll('.user-checkbox');
            selectAllCheckbox = document.getElementById('selectAllUsers');
            break;
        case 'donations':
            checkboxes = document.querySelectorAll('.donation-checkbox');
            selectAllCheckbox = document.getElementById('selectAllDonations');
            break;
        case 'requests':
            checkboxes = document.querySelectorAll('.request-checkbox');
            selectAllCheckbox = document.getElementById('selectAllRequests');
            break;
    }
    
    if (selectAllCheckbox && checkboxes.length > 0) {
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    }
}

// Get selected items based on data type
function getSelectedItems(dataType) {
    let checkboxes = [];
    
    switch(dataType) {
        case 'users':
            checkboxes = document.querySelectorAll('.user-checkbox:checked');
            break;
        case 'donations':
            checkboxes = document.querySelectorAll('.donation-checkbox:checked');
            break;
        case 'requests':
            checkboxes = document.querySelectorAll('.request-checkbox:checked');
            break;
        default:
            return [];
    }
    
    return Array.from(checkboxes).map(checkbox => checkbox.dataset[`${dataType.slice(0, -1)}Id`]);
}

// Refresh current section based on data type
function refreshCurrentSection(dataType) {
    switch(dataType) {
        case 'users':
            if (typeof refreshUsers === 'function') refreshUsers();
            break;
        case 'donations':
            if (typeof refreshDonations === 'function') refreshDonations();
            break;
        case 'requests':
            if (typeof refreshRequests === 'function') refreshRequests();
            break;
    }
}

// Convert array of objects to CSV format
function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV header row
    const csvHeader = headers.join(',') + '\n';
    
    // Create CSV data rows
    const csvRows = data.map(row => {
        return headers.map(header => {
            let value = row[header];
            // Handle values that might contain commas or quotes
            if (typeof value === 'string') {
                // Escape quotes and wrap in quotes if needed
                if (value.includes(',') || value.includes('"')) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
            }
            return value;
        }).join(',');
    }).join('\n');
    
    return csvHeader + csvRows;
}

// Export functions and class
window.AdminUtils = {
    debugLog,
    AdminErrorHandler,
    showNotification,
    updateLastUpdatedTime,
    toggleSelectAll,
    getSelectedItems,
    refreshCurrentSection,
    convertToCSV
};