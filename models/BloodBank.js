/**
 * BloodBank Model - MongoDB Schema for Blood Bank Registration and Management
 * This model handles blood bank registration, approval workflow, and donation approvals
 */

const mongoose = require('mongoose');

const bloodBankSchema = new mongoose.Schema({
    // Blood Bank Information
    bankName: {
        type: String,
        required: [true, 'Blood bank name is required'],
        trim: true,
        maxlength: [100, 'Blood bank name cannot exceed 100 characters']
    },
    
    licenseNumber: {
        type: String,
        required: [true, 'License number is required'],
        unique: true,
        trim: true,
        maxlength: [50, 'License number cannot exceed 50 characters']
    },
    
    establishedYear: {
        type: Number,
        required: [true, 'Established year is required'],
        min: [1900, 'Invalid established year'],
        max: [new Date().getFullYear(), 'Established year cannot be in the future']
    },
    
    bankType: {
        type: String,
        required: [true, 'Bank type is required'],
        enum: {
            values: ['hospital', 'standalone', 'mobile', 'government', 'private'],
            message: 'Invalid bank type'
        }
    },
    
    // Contact Information
    contactPerson: {
        type: String,
        required: [true, 'Contact person is required'],
        trim: true,
        maxlength: [100, 'Contact person name cannot exceed 100 characters']
    },
    
    designation: {
        type: String,
        required: [true, 'Designation is required'],
        trim: true,
        maxlength: [100, 'Designation cannot exceed 100 characters']
    },
    
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
    },
    
    website: {
        type: String,
        trim: true
    },
    
    // Address Information
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
        maxlength: [200, 'Address cannot exceed 200 characters']
    },
    
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        maxlength: [50, 'City name cannot exceed 50 characters']
    },
    
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
        maxlength: [50, 'State name cannot exceed 50 characters']
    },
    
    zipCode: {
        type: String,
        required: [true, 'ZIP code is required'],
        trim: true,
        maxlength: [10, 'ZIP code cannot exceed 10 characters']
    },
    
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
        maxlength: [50, 'Country name cannot exceed 50 characters']
    },
    
    // Login Credentials
    loginEmail: {
        type: String,
        required: [true, 'Login email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
    },
    
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },
    
    // Status and Verification
    status: {
        type: String,
        enum: {
            values: ['pending', 'approved', 'rejected', 'suspended'],
            message: 'Invalid status'
        },
        default: 'pending'
    },
    
    isVerified: {
        type: Boolean,
        default: false
    },
    
    verifiedBy: {
        type: String,
        trim: true
    },
    
    verificationDate: {
        type: Date
    },
    
    rejectionReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    },
    
    // System Information
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field for full address
bloodBankSchema.virtual('fullAddress').get(function() {
    return `${this.address}, ${this.city}, ${this.state}, ${this.country} - ${this.zipCode}`;
});

// Index for efficient queries
bloodBankSchema.index({ status: 1, isActive: 1 });
bloodBankSchema.index({ city: 1, state: 1 });
bloodBankSchema.index({ loginEmail: 1 });

module.exports = mongoose.model('BloodBank', bloodBankSchema);