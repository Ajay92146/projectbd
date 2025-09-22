/**
 * UserRequest Model - MongoDB Schema for User's Blood Requests
 * This model tracks blood requests made by registered users
 */

const mongoose = require('mongoose');

// Define the user request schema
const userRequestSchema = new mongoose.Schema({
    // User Reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    
    // Patient Information
    patientName: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true,
        minlength: [2, 'Patient name must be at least 2 characters long'],
        maxlength: [100, 'Patient name cannot exceed 100 characters']
    },
    
    patientAge: {
        type: Number,
        required: [true, 'Patient age is required'],
        min: [0, 'Age cannot be negative'],
        max: [120, 'Invalid age']
    },
    
    patientGender: {
        type: String,
        required: [true, 'Patient gender is required'],
        enum: {
            values: ['Male', 'Female', 'Other'],
            message: 'Gender must be Male, Female, or Other'
        }
    },
    
    relationship: {
        type: String,
        required: [true, 'Relationship is required'],
        enum: {
            values: ['Self', 'Parent', 'Child', 'Spouse', 'Sibling', 'Relative', 'Friend', 'Other'],
            message: 'Invalid relationship'
        }
    },
    
    // Blood Request Information
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
    
    urgency: {
        type: String,
        required: [true, 'Urgency level is required'],
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
                return date >= new Date();
            },
            message: 'Required by date cannot be in the past'
        }
    },
    
    // Hospital/Medical Information
    hospital: {
        name: {
            type: String,
            required: [true, 'Hospital name is required'],
            trim: true,
            maxlength: [100, 'Hospital name cannot exceed 100 characters']
        },
        address: {
            type: String,
            required: [true, 'Hospital address is required'],
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
        contactNumber: {
            type: String,
            required: [true, 'Hospital contact number is required'],
            match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number']
        }
    },
    
    doctorName: {
        type: String,
        required: [true, 'Doctor name is required'],
        trim: true,
        maxlength: [100, 'Doctor name cannot exceed 100 characters']
    },
    
    medicalCondition: {
        type: String,
        required: [true, 'Medical condition is required'],
        trim: true,
        maxlength: [200, 'Medical condition cannot exceed 200 characters']
    },
    
    // Request Status
    status: {
        type: String,
        enum: {
            values: ['Pending', 'In Progress', 'Partially Fulfilled', 'Fulfilled', 'Cancelled', 'Expired'],
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
    
    donors: [{
        donorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        donorName: {
            type: String,
            trim: true
        },
        donorContact: {
            type: String,
            trim: true
        },
        unitsProvided: {
            type: Number,
            min: [1, 'Units must be at least 1']
        },
        donationDate: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['Committed', 'Donated', 'Cancelled'],
            default: 'Committed'
        }
    }],
    
    // Additional Information
    additionalNotes: {
        type: String,
        maxlength: [500, 'Additional notes cannot exceed 500 characters'],
        default: ''
    },
    
    // Contact Information
    contactPerson: {
        name: {
            type: String,
            required: [true, 'Contact person name is required'],
            trim: true,
            maxlength: [100, 'Contact person name cannot exceed 100 characters']
        },
        phoneNumber: {
            type: String,
            required: [true, 'Contact person phone number is required'],
            match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number']
        },
        alternateNumber: {
            type: String,
            match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number']
        }
    },
    
    // System Information
    requestDate: {
        type: Date,
        default: Date.now
    },
    
    isActive: {
        type: Boolean,
        default: true
    },
    
    priority: {
        type: Number,
        default: function() {
            const urgencyPriority = {
                'Critical': 4,
                'High': 3,
                'Medium': 2,
                'Low': 1
            };
            return urgencyPriority[this.urgency] || 2;
        }
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field for hospital full address
userRequestSchema.virtual('hospitalFullAddress').get(function() {
    return `${this.hospital.address}, ${this.hospital.city}, ${this.hospital.state}`;
});

// Virtual field for fulfillment percentage
userRequestSchema.virtual('fulfillmentPercentage').get(function() {
    return Math.round((this.fulfilledUnits / this.requiredUnits) * 100);
});

// Virtual field for remaining units
userRequestSchema.virtual('remainingUnits').get(function() {
    return Math.max(0, this.requiredUnits - this.fulfilledUnits);
});

// Virtual field to check if request is urgent
userRequestSchema.virtual('isUrgent').get(function() {
    return this.urgency === 'Critical' || this.urgency === 'High';
});

// Virtual field to check if request is expired
userRequestSchema.virtual('isExpired').get(function() {
    return new Date() > this.requiredBy && this.status !== 'Fulfilled';
});

// Index for efficient queries
userRequestSchema.index({ userId: 1, requestDate: -1 });
userRequestSchema.index({ bloodGroup: 1, status: 1, urgency: 1 });
userRequestSchema.index({ 'hospital.city': 1, 'hospital.state': 1 });
userRequestSchema.index({ requiredBy: 1, status: 1 });

// Pre-save middleware to update status based on fulfillment
userRequestSchema.pre('save', function(next) {
    if (this.fulfilledUnits >= this.requiredUnits) {
        this.status = 'Fulfilled';
    } else if (this.fulfilledUnits > 0) {
        this.status = 'Partially Fulfilled';
    }
    
    // Check if expired
    if (new Date() > this.requiredBy && this.status !== 'Fulfilled') {
        this.status = 'Expired';
    }
    
    next();
});

// Static method to get user's request history
userRequestSchema.statics.getUserRequestHistory = function(userId, limit = 10) {
    return this.find({ userId, isActive: true })
        .sort({ requestDate: -1 })
        .limit(limit)
        .populate('userId', 'firstName lastName email')
        .populate('donors.donorId', 'firstName lastName phoneNumber');
};

// Static method to get request statistics
userRequestSchema.statics.getRequestStats = function(userId) {
    return this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId), isActive: true } },
        {
            $group: {
                _id: null,
                totalRequests: { $sum: 1 },
                totalUnitsRequested: { $sum: '$requiredUnits' },
                totalUnitsFulfilled: { $sum: '$fulfilledUnits' },
                pendingRequests: {
                    $sum: {
                        $cond: [{ $in: ['$status', ['Pending', 'In Progress', 'Partially Fulfilled']] }, 1, 0]
                    }
                },
                fulfilledRequests: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'Fulfilled'] }, 1, 0]
                    }
                }
            }
        }
    ]);
};

module.exports = mongoose.model('UserRequest', userRequestSchema);
