const authService = require('../services/auth.service');


const authController = {
    register: async (req, res) => {
        console.log("TRIGGERED");
        try {
            const { user, accessToken, refreshToken } = await authService.register(req.body);
            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    userId: user.userId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phoneOrEmail: user.phoneOrEmail,
                    DateOfBirth: user.DateOfBirth,
                    gender: user.gender,
                    isVerified: user.isVerified,
                    isAdmin: user.isAdmin,
                    isActive: user.isActive
                },
                accessToken,
                refreshToken
            });
        } catch (error) {
            console.error('Registration error in controller:', error);
            if (error.code === 11000) {
                return res.status(409).json({ error: 'User already exists. Please use a different email or phone number.' });
            }
            res.status(400).json({ error: error.message || 'An error occurred during registration' });
        }
    },

    login: async (req, res) => {
        console.log("CREDENTIALS:", req.body);
        try {
            const { phoneOrEmail, password } = req.body;
            const result = await authService.login(phoneOrEmail, password);
            res.json(result);
        } catch (error) {
            console.error('Login error:', error);
            switch(error.message) {
                case 'Phone/Email and password are required':
                case 'Invalid phone number or email format':
                    res.status(400).json({ error: error.message });
                    break;
                case 'User not found':
                    res.status(404).json({ error: error.message });
                    break;
                case 'Invalid password':
                    res.status(401).json({ error: error.message });
                    break;
                case 'Account is locked. Please try again later.':
                case 'Too many failed attempts. Account is locked for 15 minutes.':
                    res.status(423).json({ error: error.message });
                    break;
                case 'Account not verified':
                    res.status(403).json({ error: error.message });
                    break;
                
                default:
                    res.status(500).json({ error: 'An unexpected error occurred' });
            }
        }
    },

    logout: async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { refreshToken } = req.body;
            await authService.logout(userId, refreshToken);
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            next(error);
        }
    },

    refreshToken: async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refreshToken(refreshToken);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    changePassword: async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { oldPassword, newPassword } = req.body;
            await authService.changePassword(userId, oldPassword, newPassword);
            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            next(error);
        }
    },

    sendVerificationEmail: async (req, res, next) => {
        console.log("BACKEND JUST SENT VERIFICATION EMAIL");
        try {
            const { userId } = req.user;
            console.log("User ID:", userId);
            const result = await authService.requestEmailVerification(userId);
            console.log("Email verification result:", result);
            res.status(200).json({ message: 'Verification email sent successfully' });
        } catch (error) {
            console.error("Error in sendVerificationEmail:", error);
            if (error.message === 'Please wait before requesting another verification email.') {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'An error occurred while sending the verification email' });
        }
    },
    // sendVerificationEmail: async (req, res, next) => {
    //     console.log("BACKEND JUST SENT VERIFICATION EMAIL");
    //     try {
    //         const { userId } = req.user;
    //         await authService.requestEmailVerification(userId);
    //         res.json({ message: 'Email verification sent' });
    //     } catch (error) {
    //         if (error.message?.toLowerCase().includes('verification email has already been sent')) {
    //             return res.status(400).json({ error: error.message, reason: 'Verification email has already been sent' });
    //         }
    //         next(error);
    //     }
    // },

    verifyEmail: async (req, res, next) => {
        try {
            const { token } = req.params;
            const user = await authService.verifyEmail(token);
            if (user.message === 'Email already verified') {
                return res.status(200).json({ message: user.message, isPhoneOrEmailVerified: user.isPhoneOrEmailVerified });
            }
            res.json({ message: 'Email verified successfully', isPhoneOrEmailVerified: user.isPhoneOrEmailVerified });
        } catch (error) {
            next(error);
        }
    },

    forgotPassword: async (req, res, next) => {
        try {
            const { phoneOrEmail } = req.body;
            await authService.requestPasswordReset(phoneOrEmail);
            res.json({ message: 'Password reset instructions sent' });
        } catch (error) {
            next(error);
        }
    },

    resetPassword: async (req, res, next) => {
        try {
            const { userId, token, newPassword } = req.body;
            await authService.resetPassword(userId, token, newPassword);
            res.json({ message: 'Password reset successfully' });
        } catch (error) {
            next(error);
        }
    },

    getUserVerificationStatus: async (req, res, next) => {
        try {
            const { userId } = req.user;
            const status = await authService.getUserVerificationStatus(userId);
            res.json(status);
        } catch (error) {
            next(error);
        }
    },

    changePhoneOrEmail: async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { oldPhoneOrEmail, newPhoneOrEmail } = req.body;
            await authService.changePhoneOrEmail(userId, oldPhoneOrEmail, newPhoneOrEmail);
            res.json({ message: 'Phone or email changed successfully' });
        } catch (error) {
            next(error);
        }
    },

    getAllRefreshTokens: async (req, res, next) => {
        try {
            const { userId } = req.user;
            const tokens = await authService.getAllRefreshTokens(userId);
            res.json(tokens);
        } catch (error) {
            next(error);
        }
    },

    removeAllRefreshTokens: async (req, res, next) => {
        try {
            const { userId } = req.user;
            await authService.removeAllRefreshTokens(userId);
            res.json({ message: 'All refresh tokens removed successfully' });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = authController;