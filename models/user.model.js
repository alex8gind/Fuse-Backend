const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { getNextPId } = require('./counter');

const userSchema = new mongoose.Schema({

    PId: {
        type: String,
        unique: true,
        required: true,
        immutable: true,
        default: 0
    },

    firstName: { 
        type: String, 
        trim: true,
        minLength: [2, 'First name must be at least 2 characters long'],
        maxLength: [50, 'First name cannot exceed 50 characters'],
        required: [true, 'First name is required']
    },

    lastName: { 
        type: String, 
        trim: true,
        minLength: [2, 'Last name must be at least 2 characters long'],
        maxLength: [50, 'Last name cannot exceed 50 characters'],
        required: [true, 'Last name is required']
    },

    DateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required'],
        validate: {
            validator: function(value) {
                const today = new Date();
                const birthDate = new Date(value);
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                return age >= 16;
            },
            message: 'User must be at least 16 years old'
        }
    },

    gender: { 
        type: String, 
        enum: {
            values: ['male', 'female', 'other'],
            message: '{VALUE} is not a valid gender'
        },
        required: [true, 'Gender is required']
    },

    phoneOrEmail: {
        type: String,
        required: [true, 'Phone number or email is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
   
    password: { 
        type: String, 
        required: [true, 'Password is required']
    },//
    
    profilePicture: { type: String, default: 'default.png' },
    // documents: [{ 
    //     _id: { type: mongoose.Schema.Types.ObjectId, default: mongoose.Types.ObjectId },
    //     documentType: String,
    //     cloudinaryUrl: String,
    //     uploadedAt: { type: Date, default: Date.now }
    // }],
    isPhoneOrEmailVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    blockedUsers: [{ type: String, ref: 'User' }],
    verificationToken: { type: String },//
    resetPasswordToken: { type: String },//
    resetPasswordExpires: { type: Date },//
    emailVerificationToken: { type: String },//
    phoneVerificationToken: { type: String },//
    lastVerificationSentAt: { type: Date },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },//
    lockUntil: { type: Date }//
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for user's full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Index for faster queries
userSchema.index({ email: 1, phoneNumber: 1 });

userSchema.pre('save', async function(next) {
    if (!this.isModified('PId')) {
        const PId = await getNextPId();
        this.PId = PId;
    }
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;