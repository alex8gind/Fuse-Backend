const authRepo = require('../repositories/auth.repo');
const { hashPassword, comparePassword } = require('./password.service');
const { v4: uuidv4 } = require('uuid');
const userService = require('./user.service');
const { sendWithPhoneOrEmail } = require('./phoneOrEmail.service');
const jwt = require('jsonwebtoken');
const { MAX_LOGIN_ATTEMPTS, LOCK_TIME } = require('../config/constants');

const generateVerificationToken = () => uuidv4();
// console.log('ACCESS_TOKEN_SECRET:', process.env.ACCESS_TOKEN_SECRET);
// console.log('REFRESH_TOKEN_SECRET:', process.env.REFRESH_TOKEN_SECRET);

const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).*$/;
    if (!passwordRegex.test(password) || password.length < 8) {
        throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character');
    }
};

const validatePhoneOrEmail = (phoneOrEmail) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!phoneRegex.test(phoneOrEmail) && !emailRegex.test(phoneOrEmail)) {
        throw new Error('Invalid phone number or email address');
    }
};

const generateTokens = (userId, claims = {role: "user"}, atexp = "15m", rtexp = "7d") => {
    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
        throw new Error('Token secrets are not set in environment variables');
    }
    const accessToken = jwt.sign({ userId, ...claims }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: atexp });
    const refreshToken = jwt.sign({ userId, ...claims }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: rtexp });
    return { accessToken, refreshToken };
};


const authService = {

    register: async (userData) => {
        try {
          console.log('Registration userData:', userData);
          const { password, ...otherUserData } = userData;
          validatePassword(password);
          validatePhoneOrEmail(otherUserData.phoneOrEmail);
          const hashedPassword = await hashPassword(password);
          const newUser = await userService.userFunctions.createUser({
            ...otherUserData,
            password: hashedPassword
          });
          const { accessToken } = generateTokens(newUser.userId, {scope: "verification"}, "5m");
          return { user: newUser, accessToken };
        } catch (error) {
          console.error('Registration error in service:', error);
          throw error;
        }
      },

      login: async (phoneOrEmail, password) => {
        // Input validation
        if (!phoneOrEmail || !password) {
            throw new Error('Phone/Email and password are required');
        }
    
        // Validate phone or email format
        try {
            validatePhoneOrEmail(phoneOrEmail);
        } catch (error) {
            throw new Error('Invalid phone number or email format');
        }
    
        // Check if user exists
        const user = await authRepo.getUserByPhoneOrEmail(phoneOrEmail);
        if (!user) {
            throw new Error('User not found');
        }
    
        // Check if account is locked
        const lockUntil = await authRepo.checkAccountLock(user.userId);
        if (lockUntil && lockUntil > Date.now()) {
            throw new Error('Account is locked. Please try again later.');
        }
    
        // Validate password
        const isPasswordValid = await comparePassword(password, user.password);
        console.log("isPASSWORDVALID: ", isPasswordValid);
        if (!isPasswordValid) {
            const attempts = (user.loginAttempts || 0) + 1;
            if (attempts >= MAX_LOGIN_ATTEMPTS) {
                await authRepo.lockAccount(user.userId, new Date(Date.now() + LOCK_TIME));
                throw new Error('Too many failed attempts. Account is locked for 15 minutes.');
            }
            await authRepo.updateLoginAttempts(user.userId, attempts);
            throw new Error('Invalid password');
        }
    
        // Reset login attempts on successful login
        await authRepo.updateLoginAttempts(user.userId, 0);
    
        // Generate tokens
        // Check if PhoneOrEmail is Verified
        if (!user.isPhoneOrEmailVerified) {
            console.log("THAT LINE EXECIUTED");
            const { accessToken } = generateTokens(user.userId, {scope: "verification"}, "30s");
            return { user, accessToken };
        }

        const { accessToken, refreshToken } = generateTokens(user.userId, {scope: "standard", role: user.isAdmin ? "admin" : "user"});
        await authRepo.saveRefreshToken(user.userId, refreshToken);
        delete user.password;
        
        
        return { 
            user, 
            accessToken, 
            refreshToken 
        };
    },

    changePhoneOrEmail: async (userId, oldPhoneOrEmail, newPhoneOrEmail) => {
        const user = await authRepo.getUserById(userId);
        if (!user || user.phoneOrEmail !== oldPhoneOrEmail) {
            throw new Error('Invalid current phone/email');
        }
        validatePhoneOrEmail(newPhoneOrEmail);
        return await authRepo.changePhoneOrEmail(userId, newPhoneOrEmail);
    },

    getUserVerificationStatus: async (userId) => {
        const status = await authRepo.getUserVerificationStatus(userId);
        if (!status) {
            throw new Error('User not found');
        }
        return status;
    },

    logout: async (userId, refreshToken) => {
        await authRepo.removeRefreshToken(userId, refreshToken);
    },

    refreshToken: async (refreshToken) => {
        try {
            const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const user = await authRepo.getUserById(payload.userId);
            if (!user) {
                throw new Error('Invalid refresh token');
            }
            
            const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.userId, {scope: "standard", role: user.isAdmin ? "admin" : "user"});
            
            await authRepo.removeRefreshToken(user.userId, refreshToken);
            await authRepo.saveRefreshToken(user.userId, newRefreshToken);

            return { accessToken, refreshToken: newRefreshToken, user };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    },

    getAllRefreshTokens: async (userId) => {
        const tokens = await authRepo.getAllRefreshTokens(userId);
        return tokens.map(token => ({
            token: token.token,
            createdAt: token.createdAt
        }));
    },

    removeAllRefreshTokens: async (userId) => {
        await authRepo.removeAllRefreshTokens(userId);
    },

    changePassword: async (userId, oldPassword, newPassword) => {
        const user = await authRepo.getUserById(userId);
        if (!user) throw new Error('User not found');
        const isValid = await comparePassword(oldPassword, user.password);
        if (!isValid) throw new Error('Invalid old password');
        validatePassword(newPassword);
        const hashedNewPassword = await hashPassword(newPassword);
        return await authRepo.updatePassword(userId, hashedNewPassword);
    },

    requestEmailVerification: async (userId) => {
        console.log("Requesting email verification for user:", userId);
        try {
            const user = await authRepo.getUserById(userId);
            if (!user) throw new Error('User not found');
    
            const verificationStatus = await authRepo.getUserVerificationStatus(userId);
            console.log("Verification status:", verificationStatus);
    
            if (verificationStatus.isVerified) {
                throw new Error('User is already verified.');
            }
    
            const cooldownPeriod = 1 * 60 * 1000; // 1 minute in milliseconds
            if (verificationStatus.lastVerificationSentAt && 
                Date.now() - verificationStatus.lastVerificationSentAt < cooldownPeriod) {
                throw new Error('Please wait before requesting another verification email.');
            }
    
            const verificationToken = generateVerificationToken();
            console.log("Generated verification token:", verificationToken);
    
            await authRepo.setVerificationToken(userId, verificationToken, 'email');
            // await authRepo.updateLastVerificationSent(userId);
    
            console.log("Sending email to:", user.phoneOrEmail);
            await sendWithPhoneOrEmail(
                user.phoneOrEmail,
                verificationToken,
                'verification',
                'email'
            );
    
            return { message: 'Verification email sent successfully.' };
        } catch (error) {
            console.error("Error in requestEmailVerification:", error);
            throw error;
        }
    },

    verifyEmail: async (token) => {
        const user = await authRepo.getUserByVerificationToken(token);
        if (!user) {
            throw new Error('Invalid verification token:: user not found');
        }
        if (user.isPhoneOrEmailVerified) {
            return { message: 'Email already verified', isPhoneOrEmailVerified: true };
        }
        const isValid = await authRepo.checkVerificationToken(user.userId, token, 'email');
        if (!isValid) {
            throw new Error('Invalid verification token:: isValid failed');
        }
        const updatedUser = await authRepo.verifyEmailOrPhone(user.userId, 'email');
        return { message: 'Email verified successfully', isPhoneOrEmailVerified: updatedUser.isPhoneOrEmailVerified };
    },

    requestPhoneVerification: async (userId) => {
        const user = await authRepo.getUserById(userId);
        if (!user) throw new Error('User not found');
        const verificationToken = generateVerificationToken();
        await authRepo.setVerificationToken(userId, verificationToken, 'phone');
        await sendWithPhoneOrEmail(
            user.phoneOrEmail,
            verificationToken,
            'verification',
            'sms'
        );
    },

    verifyPhone: async (userId, token) => {
        const isValid = await authRepo.checkVerificationToken(userId, token, 'phone');
        if (!isValid) {
            throw new Error('Invalid verification token');
        }
        return await authRepo.verifyEmailOrPhone(userId, 'phone');
    },

    forgotPassword: async (phoneOrEmail) => {
        const user = await authRepo.findUserForPasswordReset(phoneOrEmail);
        if (!user) throw new Error('User not found');
        const resetToken = generateVerificationToken();
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
        await authRepo.setResetPasswordToken(user.userId, resetToken, resetTokenExpiry);
        await sendWithPhoneOrEmail(
            phoneOrEmail,
            resetToken,
            'passwordReset',
            phoneOrEmail.includes('@') ? 'email' : 'sms'
        );
    },


    resetPassword: async (userId, token, newPassword) => {
        const user = await authRepo.getUserById(userId);
        if (!user || user.resetPasswordToken !== token || user.resetPasswordExpires < new Date()) {
            throw new Error('Invalid or expired reset token');
        }
        validatePassword(newPassword);
        const hashedPassword = await hashPassword(newPassword);
        await authRepo.updatePassword(userId, hashedPassword);
        return await authRepo.clearResetPasswordToken(userId);
    }

};

module.exports = authService;