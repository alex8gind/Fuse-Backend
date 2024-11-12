const User = require('../models/user.model');
const Token = require('../models/token.model');

const authRepo = {
    saveGoogleUser: async (userData) => {
        const user = new User({
            ...userData,
            authMethod: 'google',
            isPhoneOrEmailVerified: true, // Google accounts come pre-verified
            isOnboardingComplete: false
        });
        const result = await user.save();
        
         // Exclude sensitive data
        const { password, verificationToken, resetPasswordToken, ...safeUser } = result.toObject();
        return {
            ...safeUser,
            userId: result._id
        };
    },
      

    getUserById: async (userId) => {
        const result =  await User.findOne({ _id: userId })
        .select('-verificationToken -resetPasswordExpires -loginAttempts -lockUntil -password')
        .exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    getUserByPhoneOrEmail: async (phoneOrEmail) => {
        const result =  await User.findOne({ phoneOrEmail })
        .select('-verificationToken -resetPasswordExpires -loginAttempts -lockUntil')
        .exec(); 
        if(!result) return null;
        
         return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    findUserForPasswordReset: async (phoneOrEmail) => {
        const result = await User.findOne({ phoneOrEmail })
        .select('userId phoneOrEmail')
        .lean()
        .exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },
    
    updatePassword: async (userId, hashedPassword) => {
        const result = await User.findOneAndUpdate(
            { _id: userId },
            { password: hashedPassword },
            { new: true }
        ).exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    getUserPassword: async (userId) => {
        const result = await User.findOne({ _id: userId }).select('+password').exec();
        const user =  {
            ...result?.toObject(),
            userId: result?._id
        }
        return user ? user.password : null;
    },

    setVerificationToken: async (userId, token, type) => {
        const updateField = type === 'email' ? 'emailVerificationToken' : 'phoneVerificationToken';
        const result = await User.findOneAndUpdate(
            { _id: userId },
            { [updateField]: token },
            { new: true }
        ).exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    verifyEmailOrPhone: async (userId, type) => {
        const updateField = type === 'email' ? 'isEmailVerified' : 'isPhoneVerified';

        const result = await User.findOneAndUpdate(
            { _id: userId },
            {[updateField]: true,
            isPhoneOrEmailVerified: true
            },
            { new: true }
        ).exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    changePhoneOrEmail: async (userId, newPhoneOrEmail) => {
        const result = await User.findOneAndUpdate(
            { _id: userId },
            { 
                phoneOrEmail: newPhoneOrEmail, 
                isEmailVerified: false, 
                isPhoneVerified: false 
            },
            { new: true }
        ).exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    updateLoginAttempts: async (userId, attempts) => {
        const result = await User.findOneAndUpdate(
            { _id: userId },
            { loginAttempts: attempts },
            { new: true }
        ).exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    lockAccount: async (userId, lockUntil) => {
        const result = await User.findOneAndUpdate(
            { _id: userId },
            { lockUntil },
            { new: true }
        ).exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    checkAccountLock: async (userId) => {
        const result = await User.findOne({ _id: userId }).select('lockUntil').exec();
        const user =  {
            ...result?.toObject(),
            userId: result?._id
        }
        return user ? user.lockUntil : null;
    },

    checkResetToken: async (userId, token) => {
        const user = await getUserById(userId);
        if (!user.resetPasswordToken) return false;
        return await comparePassword(token, user.resetPasswordToken);
    },

    setResetPasswordToken: async (userId, token, expires) => {
        const result = await User.findOneAndUpdate(
            { _id: userId },
            { resetPasswordToken: token, resetPasswordExpires: expires },
            { new: true }
        ).exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    clearResetPasswordToken: async (userId) => {
        const result = await User.findOneAndUpdate(
            { _id: userId },
            { resetPasswordToken: null, resetPasswordExpires: null },
            { new: true }
        ).exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    findUserByResetToken: async (token) => {
        const result = await User.findOne({ 
          resetPasswordToken: token,
          resetPasswordExpires: { $gt: Date.now() } 
        }).select('userId resetPasswordExpires').lean().exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    saveRefreshToken: async (userId, refreshToken) => {
        const token = new Token({userId, token: refreshToken });
        return await token.save();
    },

    findUserByRefreshToken: async (refreshToken) => {
        const token = await Token.findOne({ token: refreshToken });
        if (!token) return null;
        const result = await User.findOne({ _id: token.userId })
        .select('-verificationToken -resetPasswordExpires -loginAttempts -lockUntil -password')
        .exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    removeRefreshToken: async (userId, refreshToken) => {
        return await Token.findOneAndDelete({userId, token: refreshToken });
    },

    getUserVerificationStatus: async (userId) => {
        const result = await User.findOne({ _id: userId })
        .select('emailVerificationToken isPhoneOrEmailVerified isVerified')
        .exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    getUserByVerificationToken: async (token) => {
        console.log('tocken from email: ', token);
        const result = await User.findOne({ emailVerificationToken: token }).exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    checkVerificationToken: async (userId, token, type) => {
        const tokenField = type === 'email' ? 'emailVerificationToken' : 'phoneVerificationToken';
        const result = await User.findOne({ _id: userId, [tokenField]: token }).exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },
    
    getAllRefreshTokens: async (userId) => {
        return await Token.find({userId }).exec();
    },

    removeAllRefreshTokens: async (userId) => {
        return await Token.deleteMany({ userId });
    }
};

module.exports = authRepo;