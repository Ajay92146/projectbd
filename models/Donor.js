/**
 * Donor Model - MongoDB Schema for Blood Donors
 * This model defines the structure for donor registration data
 */

const mongoose = require('mongoose');

// Define the donor schema
const donorSchema = new mongoose.Schema({
    // Personal Information
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    
    age: {
        type: Number,
        required: [true, 'Age is required'],
        min: [18, 'Donor must be at least 18 years old'],
        max: [65, 'Donor cannot be older than 65 years']
    },
    
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: {
            values: ['Male', 'Female', 'Other'],
            message: 'Gender must be Male, Female, or Other'
        }
    },
    
    bloodGroup: {
        type: String,
        required: [true, 'Blood group is required'],
        enum: {
            values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            message: 'Invalid blood group'
        }
    },
    
    // Contact Information
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number']
    },
    
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    
    // Location Information
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        minlength: [2, 'City name must be at least 2 characters long'],
        maxlength: [50, 'City name cannot exceed 50 characters']
    },
    
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
        minlength: [2, 'State name must be at least 2 characters long'],
        maxlength: [50, 'State name cannot exceed 50 characters']
    },
    
    // Donation Information
    dateOfDonation: {
        type: Date,
        required: [true, 'Date of donation is required'],
        validate: {
            validator: function(date) {
                // Date should not be in the past (allow today and future dates)
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Set to start of day
                const donationDate = new Date(date);
                donationDate.setHours(0, 0, 0, 0); // Set to start of day
                return donationDate >= today;
            },
            message: 'Date of donation cannot be in the past'
        }
    },
    
    // Availability Status
    isAvailable: {
        type: Boolean,
        default: true
    },
    
    // Last donation date (for tracking eligibility)
    lastDonationDate: {
        type: Date,
        default: null
    },
    
    // Additional Information
    medicalHistory: {
        type: String,
        maxlength: [500, 'Medical history cannot exceed 500 characters'],
        default: ''
    },

    // New Application Fields
    address: {
        type: String,
        maxlength: [200, 'Address cannot exceed 200 characters'],
        default: ''
    },

    weight: {
        type: Number,
        min: [45, 'Weight must be at least 45 kg'],
        max: [200, 'Weight cannot exceed 200 kg']
    },

    emergencyContact: {
        type: String,
        match: [/^[6-9]\d{9}$/, 'Please enter a valid emergency contact number']
    },

    preferredTime: {
        type: String,
        enum: {
            values: ['morning', 'afternoon', 'evening'],
            message: 'Preferred time must be morning, afternoon, or evening'
        }
    },

    availability: {
        type: String,
        maxlength: [200, 'Availability description cannot exceed 200 characters'],
        default: ''
    },

    consents: {
        health: {
            type: Boolean,
            default: false
        },
        data: {
            type: Boolean,
            default: false
        },
        contact: {
            type: Boolean,
            default: false
        }
    },

    applicationStatus: {
        type: String,
        enum: {
            values: ['pending', 'approved', 'rejected', 'under_review'],
            message: 'Invalid application status'
        },
        default: 'approved' // For backward compatibility with existing donors
    },

    applicationDate: {
        type: Date,
        default: Date.now
    },

    // System Information
    registrationDate: {
        type: Date,
        default: Date.now
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field for full address
donorSchema.virtual('fullAddress').get(function() {
    return `${this.city}, ${this.state}`;
});

// Virtual field to check if donor is eligible for next donation
donorSchema.virtual('isEligibleForDonation').get(function() {
    if (!this.lastDonationDate) return true;
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    return this.lastDonationDate <= threeMonthsAgo;
});

// Index for efficient searching
donorSchema.index({ bloodGroup: 1, city: 1, isAvailable: 1 });
donorSchema.index({ email: 1 });
donorSchema.index({ contactNumber: 1 });

// Pre-save middleware to update lastDonationDate
donorSchema.pre('save', function(next) {
    if (this.isNew && this.dateOfDonation) {
        this.lastDonationDate = this.dateOfDonation;
    }
    next();
});

// Static method to find donors by blood group and location
donorSchema.statics.findByBloodGroupAndLocation = function(bloodGroup, city, state) {
    return this.find({
        bloodGroup: bloodGroup,
        city: new RegExp(city, 'i'),
        state: new RegExp(state, 'i'),
        isAvailable: true,
        isActive: true
    }).sort({ registrationDate: -1 });
};

// Instance method to mark donor as unavailable
donorSchema.methods.markUnavailable = function() {
    this.isAvailable = false;
    return this.save();
};

// Instance method to mark donor as available
donorSchema.methods.markAvailable = function() {
    this.isAvailable = true;
    return this.save();
};

// Create and export the model
module.exports = mongoose.models.Donor || mongoose.model('Donor', donorSchema);
