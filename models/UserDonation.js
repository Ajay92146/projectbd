/**
 * UserDonation Model - MongoDB Schema for User's Blood Donations
 * This model tracks donations made by registered users
 */

const mongoose = require('mongoose');

// Define the user donation schema
const userDonationSchema = new mongoose.Schema({
    // User Reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    
    // Donation Information
    donationDate: {
        type: Date,
        required: [true, 'Donation date is required'],
        default: Date.now
    },
    
    bloodGroup: {
        type: String,
        required: [true, 'Blood group is required'],
        enum: {
            values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            message: 'Invalid blood group'
        }
    },
    
    unitsCollected: {
        type: Number,
        required: [true, 'Units collected is required'],
        min: [1, 'At least 1 unit must be collected'],
        max: [5, 'Cannot collect more than 5 units at once'],
        default: 1
    },
    
    // Location Information
    donationCenter: {
        name: {
            type: String,
            required: [true, 'Donation center name is required'],
            trim: true,
            maxlength: [100, 'Donation center name cannot exceed 100 characters']
        },
        address: {
            type: String,
            required: [true, 'Donation center address is required'],
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
        }
    },
    
    // Medical Information
    hemoglobinLevel: {
        type: Number,
        min: [8, 'Hemoglobin level too low for donation'],
        max: [20, 'Invalid hemoglobin level']
    },
    
    bloodPressure: {
        systolic: {
            type: Number,
            min: [90, 'Systolic pressure too low'],
            max: [180, 'Systolic pressure too high']
        },
        diastolic: {
            type: Number,
            min: [60, 'Diastolic pressure too low'],
            max: [100, 'Diastolic pressure too high']
        }
    },
    
    weight: {
        type: Number,
        min: [45, 'Weight too low for donation'],
        max: [200, 'Invalid weight']
    },
    
    // Donation Status
    status: {
        type: String,
        enum: {
            values: ['Completed', 'Deferred', 'Cancelled', 'Pending'],
            message: 'Invalid donation status'
        },
        default: 'Completed'
    },
    
    // Additional Information
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters'],
        default: ''
    },
    
    // Staff Information
    collectedBy: {
        staffName: {
            type: String,
            trim: true,
            maxlength: [100, 'Staff name cannot exceed 100 characters']
        },
        staffId: {
            type: String,
            trim: true,
            maxlength: [50, 'Staff ID cannot exceed 50 characters']
        }
    },
    
    // Certificate Information
    certificateNumber: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    
    certificateIssued: {
        type: Boolean,
        default: false
    },
    
    // Next Eligible Donation Date
    nextEligibleDate: {
        type: Date,
        default: function() {
            const nextDate = new Date(this.donationDate);
            nextDate.setMonth(nextDate.getMonth() + 3); // 3 months gap
            return nextDate;
        }
    },
    
    // System Information
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field for donation center full address
userDonationSchema.virtual('donationCenterFullAddress').get(function() {
    return `${this.donationCenter.address}, ${this.donationCenter.city}, ${this.donationCenter.state}`;
});

// Virtual field to check if user is eligible for next donation
userDonationSchema.virtual('isEligibleForNextDonation').get(function() {
    return new Date() >= this.nextEligibleDate;
});

// Virtual field for blood pressure reading
userDonationSchema.virtual('bloodPressureReading').get(function() {
    if (this.bloodPressure && this.bloodPressure.systolic && this.bloodPressure.diastolic) {
        return `${this.bloodPressure.systolic}/${this.bloodPressure.diastolic}`;
    }
    return null;
});

// Index for efficient queries
userDonationSchema.index({ userId: 1, donationDate: -1 });
userDonationSchema.index({ bloodGroup: 1, donationDate: -1 });
userDonationSchema.index({ status: 1, isActive: 1 });

// Pre-save middleware to generate certificate number
userDonationSchema.pre('save', function(next) {
    if (this.isNew && this.status === 'Completed' && !this.certificateNumber) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        this.certificateNumber = `BD${date}${random}`;
        this.certificateIssued = true;
    }
    next();
});

// Static method to get user's donation history
userDonationSchema.statics.getUserDonationHistory = function(userId, limit = 10) {
    return this.find({ userId, isActive: true })
        .sort({ donationDate: -1 })
        .limit(limit)
        .populate('userId', 'firstName lastName email');
};

// Static method to get donation statistics
userDonationSchema.statics.getDonationStats = function(userId) {
    return this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId), isActive: true } },
        {
            $group: {
                _id: null,
                totalDonations: { $sum: 1 },
                totalUnits: { $sum: '$unitsCollected' },
                lastDonation: { $max: '$donationDate' },
                bloodGroups: { $addToSet: '$bloodGroup' }
            }
        }
    ]);
};

module.exports = mongoose.model('UserDonation', userDonationSchema);
