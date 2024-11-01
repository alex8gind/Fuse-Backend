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

// const generateTokens = (userId, claims = {role: "user"}, atexp = "15m", rtexp = "7d") => {
//     if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
//         throw new Error('Token secrets are not set in environment variables');
//     }
//     const accessToken = jwt.sign({ userId, ...claims }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: atexp });
//     const refreshToken = jwt.sign({ userId, ...claims }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: rtexp });
//     return { accessToken, refreshToken };
// };

const getTokenSecret = (type) => {
    const secretMap = {
        'standard_access': process.env.ACCESS_TOKEN_SECRET,
        'standard_refresh': process.env.REFRESH_TOKEN_SECRET,
        'verification': process.env.VERIFICATION_TOKEN_SECRET,
        'password_reset': process.env.RESET_TOKEN_SECRET
    };

    const secret = secretMap[type];
    if (!secret) {
        throw new Error(`Token secret not set for type: ${type}`);
    }
    return secret;
};

const generateTokens = (payload = {}, claims = {}, options = {}) => {
    const {
        type = 'standard',
        atexp = "15m",
        rtexp = "7d",
        rpexp = "3d"
    } = options;

    const basePayload = {
        userId: payload.userId,
        type,
        nonce: Math.random().toString(36).substring(2), 
        role: claims.role || 'user',    
        ...claims
    };

    switch (type) {
        case 'standard':
            const accessToken = jwt.sign(
                { ...basePayload, 
                tokenType: 'access',
                type: 'standard' 
                },
                getTokenSecret('standard_access'),
                { expiresIn: atexp }
            );
            const refreshToken = jwt.sign(
                { ...basePayload, 
                    tokenType: 'refresh',
                    type: 'standard'  
                },
                getTokenSecret('standard_refresh'),
                { expiresIn: rtexp }
            );
            return { accessToken, refreshToken };

        case 'verification':
            return {
                accessToken: jwt.sign(
                    { ...basePayload, tokenType: 'verification', phoneOrEmail: payload.phoneOrEmail },
                    getTokenSecret('verification'),
                    { expiresIn: atexp }
                )
            };

        case 'password_reset':
            if (!payload.phoneOrEmail) {
                throw new Error('phoneOrEmail required for password reset token');
            }
            const resetToken = jwt.sign(
                { 
                    ...basePayload, 
                    tokenType: 'reset',
                    phoneOrEmail: payload.phoneOrEmail
                },
                getTokenSecret('password_reset'),
                { 
                    expiresIn: rpexp,
                    jwtid: Math.random().toString(36).substring(2)
                }
            );
            return { resetToken };

        default:
            throw new Error('Invalid token type');
    }
};

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

const authService = {
    register: async (userData) => {
        try {
            const { password, ...otherUserData } = userData;
            validatePassword(password);
            validatePhoneOrEmail(otherUserData.phoneOrEmail);
            const hashedPassword = await hashPassword(password);
            const newUser = await userService.userFunctions.createUser({
                ...otherUserData,
                password: hashedPassword
            });
            const { accessToken } = generateTokens(
                {
                    userId: newUser.userId,  
                    phoneOrEmail: otherUserData.phoneOrEmail
                },
                {},
                {
                    type: 'verification',  
                    atexp: "5m"
                });
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
    
        // Check if PhoneOrEmail is Verified
        if (!user.isAdmin && !user.isPhoneOrEmailVerified) {
            const { accessToken } = generateTokens({userId: user.userId, phoneOrEmail: user.phoneOrEmail}, 
                {}, 
                {
                type: 'verification', 
                atexp: "30s"
                });
            return { user, accessToken };
        } 

        const { accessToken, refreshToken } = generateTokens({userId: user.userId}, 
            {
            role: user.isAdmin ? "admin" : "user"
            }, 
            {
            type: 'standard'
            });
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
        try {
          const user = await authRepo.getUserVerificationStatus(userId);
          if (!user) {
            throw new Error('User not found');
          }
          return {
            hasVerificationToken: !!user.emailVerificationToken,
            isPhoneOrEmailVerified: user.isPhoneOrEmailVerified,
            isVerified: user.isVerified
          };
        } catch (error) {
          console.error("Error in getUserVerificationStatus service:", error);
          throw error;
        }
      },
      

    logout: async (userId, refreshToken) => {
        await authRepo.removeRefreshToken(userId, refreshToken);
    },

    refreshToken: async (refreshToken) => {
        try {
            const payload = jwt.verify(refreshToken, getTokenSecret('standard_refresh'));
            if (payload.tokenType !== 'refresh') {
                throw new Error('Invalid token type');
            }

            const user = await authRepo.getUserById(payload.userId);
            if (!user) {
                throw new Error('Invalid refresh token');
            }
            
            const tokens = generateTokens({userId: user.userId}, 
                {
                role: user.isAdmin ? "admin" : "user"
                }, 
                { type: 'standard' });
            
            await authRepo.removeRefreshToken(user.userId, refreshToken);
            await authRepo.saveRefreshToken(user.userId, tokens.refreshToken);

            return { ...tokens, user };
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
        try {
            const user = await authRepo.getUserById(userId);
            if (!user) throw new Error('User not found');
    
            const verificationStatus = await authRepo.getUserVerificationStatus(userId);
    
            if (verificationStatus.isVerified) {
                throw new Error('User is already verified.');
            }
    
            const cooldownPeriod = 1 * 60 * 1000; // 1 minute in milliseconds
            if (verificationStatus.lastVerificationSentAt && 
                Date.now() - verificationStatus.lastVerificationSentAt < cooldownPeriod) {
                throw new Error('Please wait before requesting another verification email.');
            }
    
            const { accessToken: verificationToken } = generateTokens({userId, phoneOrEmail: user.phoneOrEmail}, 
                {}, 
                {
                type: 'verification',
                atexp: '1h'  // 1 hour expiry for email verification
                });
    
            const tokenHash = await hashPassword(verificationToken);
            await authRepo.setVerificationToken(userId, tokenHash, 'email');
    
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
        try {
            console.log('Verifying email with token');
            const decoded = jwt.verify(token, getTokenSecret('verification'));
            console.log('Token decoded successfully:', decoded);
            
            if (decoded.type !== 'verification') {
                throw new Error('Invalid token type');
            }
    
            const user = await authRepo.getUserById(decoded.userId);
            if (!user || user.phoneOrEmail !== decoded.phoneOrEmail) {
                throw new Error('Invalid token: user mismatch');
            }
    
            // Generate standard tokens with correct type
            const { accessToken, refreshToken } = generateTokens(
                { userId: decoded.userId },
                { role: user.isAdmin ? "admin" : "user" },
                { type: 'standard' }  // This ensures we get access/refresh tokens
            );
    
            // Save refresh token regardless of verification status
            await authRepo.saveRefreshToken(decoded.userId, refreshToken);
    
            if (user.isPhoneOrEmailVerified) {
                return { 
                    message: 'Email already verified', 
                    isPhoneOrEmailVerified: true,
                    accessToken,
                    refreshToken
                };
            }
    
            const updatedUser = await authRepo.verifyEmailOrPhone(decoded.userId, 'email');
            
            return { 
                message: 'Email verified successfully', 
                isPhoneOrEmailVerified: updatedUser.isPhoneOrEmailVerified,
                accessToken,
                refreshToken
            };
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Verification token has expired');
            }
            throw new Error('Invalid verification token');
        }
    },

    requestPhoneVerification: async (userId) => {
        try {
            const user = await authRepo.getUserById(userId);
            if (!user) throw new Error('User not found');
    
            const { accessToken: verificationToken } = generateTokens({userId, phoneOrEmail: user.phoneOrEmail},
                {}, 
                {
                type: 'verification', 
                atexp: '5m'  // 5 minutes expiry for SMS verification
                });
    
            const tokenHash = await hashPassword(verificationToken);
            await authRepo.setVerificationToken(userId, tokenHash, 'phone');
    
            await sendWithPhoneOrEmail(
                user.phoneOrEmail,
                verificationToken,
                'verification',
                'sms'
            );

            return { message: 'Verification SMS sent successfully.' };
        } catch (error) {
            console.error("Error in requestPhoneVerification:", error);
            throw error;
        }
    },

    verifyPhone: async (userId, token) => {
        try {
            const decoded = jwt.verify(token, getTokenSecret('verification'));
            
            if (decoded.type !== 'verification') {
                throw new Error('Invalid token type');
            }

            if (decoded.userId !== userId) {
                throw new Error('Invalid token: user mismatch');
            }

            const isValid = await authRepo.checkVerificationToken(userId, token, 'phone');
            if (!isValid) {
                throw new Error('Invalid verification token');
            }

            return await authRepo.verifyEmailOrPhone(userId, 'phone');
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Verification token has expired');
            }
            throw new Error('Invalid verification token');
        }
    },

    forgotPassword: async (phoneOrEmail) => {
        try {
            const user = await authRepo.findUserForPasswordReset(phoneOrEmail);
            
            if (!user) {
                throw new Error('No account found with this phone number or email');
            }
    
            const { resetToken } = generateTokens({userId: user.userId, phoneOrEmail}, 
                {}, 
                {
                type: 'password_reset'
                });
            
            const tokenHash = await hashPassword(resetToken);
            await authRepo.setResetPasswordToken(user.userId, tokenHash);
    
            await sendWithPhoneOrEmail(
                phoneOrEmail,
                resetToken,
                'passwordReset',
                phoneOrEmail.includes('@') ? 'email' : 'sms'
            );
    
            return true;
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    },

    validateResetToken: async (token) => {
        try {
            const decoded = jwt.verify(token, getTokenSecret('password_reset'));
            
            if (decoded.type !== 'password_reset') {
                throw new Error('Invalid token type');
            }

            const user = await authRepo.getUserById(decoded.userId);
            if (!user || user.phoneOrEmail !== decoded.phoneOrEmail) {
                throw new Error('Invalid token: user mismatch');
            }

            const isValid = await authRepo.checkResetToken(user.userId, token);
            if (!isValid) {
                throw new Error('Invalid reset token');
            }

            return true;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Reset token has expired');
            }
            throw new Error('Invalid reset token');
        }
    },


    resetPassword: async (token, newPassword) => {
        try {
            const decoded = jwt.verify(token, getTokenSecret('password_reset'));
            
            if (decoded.type !== 'password_reset') {
                throw new Error('Invalid token type');
            }

            const user = await authRepo.getUserById(decoded.userId);
            if (!user || user.phoneOrEmail !== decoded.phoneOrEmail) {
                throw new Error('Invalid token: user mismatch');
            }

            // Verify against stored hash
            const isValid = await authRepo.checkResetToken(user.userId, token);
            if (!isValid) {
                throw new Error('Invalid reset token');
            }
    
            validatePassword(newPassword);
            const hashedPassword = await hashPassword(newPassword);
    
            await authRepo.updatePassword(user.userId, hashedPassword);
            await authRepo.clearResetPasswordToken(user.userId);
    
            return true;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Reset token has expired');
            }
            console.error('Reset password error:', error);
            throw new Error('Invalid reset token');
        }
    }
};

module.exports = authService;