const User = require('../models/user.model');
const Token = require('../models/token.model');

const authRepo = {
    getUserById: async (userId) => {
        return await User.findOne({ userId })
        .select('-verificationToken -resetPasswordExpires -loginAttempts -lockUntil -password')
        .exec();
    },

    getUserByPhoneOrEmail: async (phoneOrEmail) => {
        const result =  await User.findOne({ phoneOrEmail })
        .select('-verificationToken -resetPasswordExpires -loginAttempts -lockUntil')
        .exec(); 
        if(!result) return null;
        
        return result.toObject();
    },

    findUserForPasswordReset: async (phoneOrEmail) => {
        return await User.findOne({ phoneOrEmail }).select('userId phoneOrEmail').exec();
    },
    
    updatePassword: async (userId, hashedPassword) => {
        return await User.findOneAndUpdate(
            { userId },
            { password: hashedPassword },
            { new: true }
        ).exec();
    },

    getUserPassword: async (userId) => {
        const user = await User.findOne({ userId }).select('+password').exec();
        return user ? user.password : null;
    },

    setVerificationToken: async (userId, token, type) => {
        const updateField = type === 'email' ? 'emailVerificationToken' : 'phoneVerificationToken';
        return await User.findOneAndUpdate(
            { userId },
            { [updateField]: token },
            { new: true }
        ).exec();
    },

    verifyEmailOrPhone: async (userId, type) => {
        const updateField = type === 'email' ? 'isEmailVerified' : 'isPhoneVerified';

        return await User.findOneAndUpdate(
            { userId },
            {[updateField]: true,
            isPhoneOrEmailVerified: true
            },
            { new: true }
        ).exec();
    },

    changePhoneOrEmail: async (userId, newPhoneOrEmail) => {
        return await User.findOneAndUpdate(
            { userId },
            { 
                phoneOrEmail: newPhoneOrEmail, 
                isEmailVerified: false, 
                isPhoneVerified: false 
            },
            { new: true }
        ).exec();
    },

    updateLoginAttempts: async (userId, attempts) => {
        return await User.findOneAndUpdate(
            { userId },
            { loginAttempts: attempts },
            { new: true }
        ).exec();
    },

    lockAccount: async (userId, lockUntil) => {
        return await User.findOneAndUpdate(
            { userId },
            { lockUntil },
            { new: true }
        ).exec();
    },

    checkAccountLock: async (userId) => {
        const user = await User.findOne({ userId }).select('lockUntil').exec();
        return user ? user.lockUntil : null;
    },

    setResetPasswordToken: async (userId, token, expires) => {
        return await User.findOneAndUpdate(
            { userId },
            { resetPasswordToken: token, resetPasswordExpires: expires },
            { new: true }
        ).exec();
    },

    clearResetPasswordToken: async (userId) => {
        return await User.findOneAndUpdate(
            { userId },
            { resetPasswordToken: null, resetPasswordExpires: null },
            { new: true }
        ).exec();
    },

    saveRefreshToken: async (userId, refreshToken) => {
        const token = new Token({ userId, token: refreshToken });
        return await token.save();
    },

    findUserByRefreshToken: async (refreshToken) => {
        const token = await Token.findOne({ token: refreshToken });
        if (!token) return null;
        return await User.findOne({ userId: token.userId })
        .select('-verificationToken -resetPasswordExpires -loginAttempts -lockUntil -password')
        .exec();
    },

    removeRefreshToken: async (userId, refreshToken) => {
        return await Token.findOneAndDelete({ userId, token: refreshToken });
    },

    getUserVerificationStatus: async (userId) => {
        const user = await User.findOne({ userId }).select('isPhoneOrEmailVerified emailVerificationToken lastVerificationSentAt').exec();
        return user ? {
            isVerified: user.isPhoneOrEmailVerified,
            hasVerificationToken: !!user.emailVerificationToken,
            lastVerificationSentAt: user.lastVerificationSentAt
        } : null;
    },
    
    updateLastVerificationSent: async (userId) => {
        return await User.findOneAndUpdate(
            { userId },
            { lastVerificationSentAt: Date.now() },
            { new: true }
        ).exec();
    },

    getUserByVerificationToken: async (token) => {
        console.log('tocken from email: ', token);
        return await User.findOne({ emailVerificationToken: token }).exec();
    },

    checkVerificationToken: async (userId, token, type) => {
        const tokenField = type === 'email' ? 'emailVerificationToken' : 'phoneVerificationToken';
        const user = await User.findOne({ userId, [tokenField]: token }).exec();
        return user;
    },
    
    getAllRefreshTokens: async (userId) => {
        return await Token.find({ userId }).exec();
    },

    removeAllRefreshTokens: async (userId) => {
        return await Token.deleteMany({ userId });
    }
};

module.exports = authRepo;