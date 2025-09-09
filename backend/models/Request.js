/**
 * Blood Request Model - MongoDB Schema for Blood Requests
 * This model defines the structure for blood request data
 */

const mongoose = require('mongoose');

// Define the blood request schema
const requestSchema = new mongoose.Schema({
    // Patient Information
    patientName: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true,
        minlength: [2, 'Patient name must be at least 2 characters long'],
        maxlength: [100, 'Patient name cannot exceed 100 characters']
    },
    
    bloodGroup: {
        type: String,
        required: [true, 'Blood group is required'],
        enum: {
            values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            message: 'Invalid blood group'
        }
    },
    
    requiredUnits: {
        type: Number,
        required: [true, 'Required units is required'],
        min: [1, 'At least 1 unit is required'],
        max: [10, 'Cannot request more than 10 units at once']
    },
    
    // Hospital Information
    hospitalName: {
        type: String,
        required: [true, 'Hospital name is required'],
        trim: true,
        minlength: [2, 'Hospital name must be at least 2 characters long'],
        maxlength: [200, 'Hospital name cannot exceed 200 characters']
    },
    
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
        minlength: [2, 'Location must be at least 2 characters long'],
        maxlength: [200, 'Location cannot exceed 200 characters']
    },
    
    // Contact Information
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number']
    },
    
    // Additional Information
    urgency: {
        type: String,
        enum: {
            values: ['Low', 'Medium', 'High', 'Critical'],
            message: 'Urgency must be Low, Medium, High, or Critical'
        },
        default: 'Medium'
    },
    
    requiredBy: {
        type: Date,
        required: [true, 'Required by date is required'],
        validate: {
            validator: function(date) {
                // Date should not be in the past
                return date >= new Date();
            },
            message: 'Required by date cannot be in the past'
        }
    },
    
    additionalNotes: {
        type: String,
        maxlength: [500, 'Additional notes cannot exceed 500 characters'],
        default: ''
    },
    
    // Request Status
    status: {
        type: String,
        enum: {
            values: ['Pending', 'In Progress', 'Fulfilled', 'Cancelled', 'Expired'],
            message: 'Invalid status'
        },
        default: 'Pending'
    },
    
    // Fulfillment Information
    fulfilledUnits: {
        type: Number,
        default: 0,
        min: [0, 'Fulfilled units cannot be negative']
    },
    
    fulfilledBy: [{
        donorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Donor'
        },
        units: {
            type: Number,
            min: [1, 'Units must be at least 1']
        },
        fulfilledDate: {
            type: Date,
            default: Date.now
        }
    }],
    
    // System Information
    requestDate: {
        type: Date,
        default: Date.now
    },
    
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Contact person details
    contactPersonName: {
        type: String,
        trim: true,
        maxlength: [100, 'Contact person name cannot exceed 100 characters']
    },
    
    relationship: {
        type: String,
        enum: {
            values: ['Self', 'Family', 'Friend', 'Doctor', 'Hospital Staff', 'Other'],
            message: 'Invalid relationship'
        },
        default: 'Family'
    },

    // User identification (for authenticated users)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional for guest users
    },

    userEmail: {
        type: String,
        required: false, // Optional for guest users
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field for remaining units needed
requestSchema.virtual('remainingUnits').get(function() {
    return Math.max(0, this.requiredUnits - this.fulfilledUnits);
});

// Virtual field to check if request is urgent
requestSchema.virtual('isUrgent').get(function() {
    return this.urgency === 'High' || this.urgency === 'Critical';
});

// Virtual field to check if request is expired
requestSchema.virtual('isExpired').get(function() {
    return new Date() > this.requiredBy;
});

// Virtual field for days remaining
requestSchema.virtual('daysRemaining').get(function() {
    const now = new Date();
    const timeDiff = this.requiredBy.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Index for efficient searching
requestSchema.index({ bloodGroup: 1, location: 1, status: 1 });
requestSchema.index({ urgency: 1, requiredBy: 1 });
requestSchema.index({ status: 1, isActive: 1 });

// Pre-save middleware to update status based on fulfillment
requestSchema.pre('save', function(next) {
    // Auto-update status based on fulfilled units
    if (this.fulfilledUnits >= this.requiredUnits) {
        this.status = 'Fulfilled';
    } else if (this.fulfilledUnits > 0) {
        this.status = 'In Progress';
    }
    
    // Mark as expired if past required date
    if (new Date() > this.requiredBy && this.status === 'Pending') {
        this.status = 'Expired';
        this.isActive = false;
    }
    
    next();
});

// Static method to find active requests by blood group and location
requestSchema.statics.findActiveByBloodGroupAndLocation = function(bloodGroup, location) {
    return this.find({
        bloodGroup: bloodGroup,
        location: new RegExp(location, 'i'),
        status: { $in: ['Pending', 'In Progress'] },
        isActive: true,
        requiredBy: { $gte: new Date() }
    }).sort({ urgency: -1, requiredBy: 1 });
};

// Static method to find urgent requests
requestSchema.statics.findUrgentRequests = function() {
    return this.find({
        urgency: { $in: ['High', 'Critical'] },
        status: { $in: ['Pending', 'In Progress'] },
        isActive: true,
        requiredBy: { $gte: new Date() }
    }).sort({ urgency: -1, requiredBy: 1 });
};

// Instance method to add fulfillment
requestSchema.methods.addFulfillment = function(donorId, units) {
    this.fulfilledBy.push({
        donorId: donorId,
        units: units,
        fulfilledDate: new Date()
    });
    this.fulfilledUnits += units;
    return this.save();
};

// Instance method to cancel request
requestSchema.methods.cancelRequest = function(reason) {
    this.status = 'Cancelled';
    this.isActive = false;
    this.additionalNotes += `\nCancelled: ${reason}`;
    return this.save();
};

// Create and export the model
const Request = mongoose.model('Request', requestSchema);

module.exports = Request;
