/**
 * User Model - MongoDB Schema for User Authentication
 * This model defines the structure for user login and authentication data
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the user schema
const userSchema = new mongoose.Schema({
    // Basic Information
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Don't include password in queries by default
    },
    
    // User Profile Information
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [2, 'First name must be at least 2 characters long'],
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [2, 'Last name must be at least 2 characters long'],
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    
    phoneNumber: {
        type: String,
        match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number']
    },

    // Address Information
    address: {
        type: String,
        trim: true,
        maxlength: [200, 'Address cannot exceed 200 characters']
    },
    
    // User Role and Permissions
    role: {
        type: String,
        enum: {
            values: ['user', 'donor', 'admin', 'hospital'],
            message: 'Role must be user, donor, admin, or hospital'
        },
        default: 'user'
    },
    
    // Account Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    isVerified: {
        type: Boolean,
        default: false
    },
    
    // Security Information
    lastLogin: {
        type: Date,
        default: null
    },
    
    loginAttempts: {
        type: Number,
        default: 0
    },
    
    lockUntil: {
        type: Date,
        default: null
    },
    
    // Password Reset
    resetPasswordToken: {
        type: String,
        default: null
    },
    
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    
    // Email Verification
    emailVerificationToken: {
        type: String,
        default: null
    },
    
    emailVerificationExpires: {
        type: Date,
        default: null
    },
    
    // Profile Information
    bloodGroup: {
        type: String,
        enum: {
            values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
            message: 'Invalid blood group'
        },
        default: ''
    },
    
    city: {
        type: String,
        trim: true,
        maxlength: [50, 'City name cannot exceed 50 characters']
    },
    
    state: {
        type: String,
        trim: true,
        maxlength: [50, 'State name cannot exceed 50 characters']
    },
    
    // Preferences
    notifications: {
        email: {
            type: Boolean,
            default: true
        },
        sms: {
            type: Boolean,
            default: false
        },
        push: {
            type: Boolean,
            default: true
        }
    },
    
    // Privacy Settings
    profileVisibility: {
        type: String,
        enum: {
            values: ['public', 'private', 'donors-only'],
            message: 'Profile visibility must be public, private, or donors-only'
        },
        default: 'private'
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.resetPasswordToken;
            delete ret.emailVerificationToken;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Virtual field for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual field to check if account is locked
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Index for efficient searching
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ bloodGroup: 1, city: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }
    
    return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save();
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
    return this.find({ role: role, isActive: true });
};

// Static method to find donors in a location
userSchema.statics.findDonorsInLocation = function(city, state) {
    return this.find({
        role: 'donor',
        city: new RegExp(city, 'i'),
        state: new RegExp(state, 'i'),
        isActive: true,
        isVerified: true
    });
};

// Create and export the model
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
