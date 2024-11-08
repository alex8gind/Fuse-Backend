const authService = require('../services/auth.service');


const authController = {
    register: async (req, res) => {
        try {
            const { user, accessToken } = await authService.register(req.body);
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
                accessToken
            });
        } catch (error) {
            console.error('Registration error in controller:', error);
            if (error.code === 11000) {
                return res.status(409).json({ error: 'User already exists. @@@@Please use a different email or phone number.' });
            }
            res.status(400).json({ error: error.message || 'An error occurred during registration' });
        }
    },

    login: async (req, res) => {
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

    sendVerificationEmail: async (req, res) => {
        try {
            console.log("EXECUTED");
            const { userId } = req.user;
            const result = await authService.requestEmailVerification(userId);
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

    verifyEmail: async (req, res) => {
        try {
            const { token } = req.params;
            
            if (!token) {
                return res.status(400).json({ 
                    error: 'Token is required' 
                });
            }
    
            const result = await authService.verifyEmail(token);
            res.json(result);
    
        } catch (error) {
            console.error('Email verification error:', error);
            
            // Handle specific error cases with appropriate HTTP status codes
            if (error.message === 'Invalid token type') {
                return res.status(400).json({ 
                    error: 'Invalid token format' 
                });
            }
            
            if (error.message === 'Invalid token: user mismatch') {
                return res.status(404).json({ 
                    error: 'User not found or token mismatch' 
                });
            }
            
            if (error.message === 'Verification token has expired') {
                return res.status(401).json({ 
                    error: 'Token has expired. Please request a new verification email.' 
                });
            }
    
            if (error.name === 'JsonWebTokenError') {
                return res.status(400).json({ 
                    error: 'Invalid token' 
                });
            }
    
            // For unexpected errors
            res.status(500).json({ 
                error: 'An error occurred during email verification' 
            });
        }
    },

    forgotPassword: async (req, res) => {
        try {
          const { phoneOrEmail } = req.body;
      
          if (!phoneOrEmail) {
            return res.status(400).json({ 
              error: 'Phone number or email is required' 
            });
          }
      
          await authService.forgotPassword(phoneOrEmail);
          
          res.json({ 
            message: 'Password reset instructions sent successfully' 
          });
      
        } catch (error) {
          // Handle specific error cases
          if (error.message === 'No account found with this phone number or email') {
            return res.status(404).json({ error: error.message });
          }
      
          if (error.message.includes('Invalid') || error.message.includes('required')) {
            return res.status(400).json({ error: error.message });
          }
      
          if (error.message.includes('Too many requests')) {
            return res.status(429).json({ error: error.message });
          }
      
          // Log unexpected errors
          console.error('Forgot password error:', error);
          res.status(500).json({ 
            error: 'An error occurred while processing your request' 
          });
        }
      },
      
    validateResetToken: async (req, res) => {
        try {
          const { token } = req.body;
          const isValid = await authService.validateResetToken(token);
          res.json({ valid: isValid });
        } catch (error) {
          if (error.message === 'Reset token not found') {
            return res.status(404).json({ error: error.message });
          }
          if (error.message === 'Reset token has expired') {
            return res.status(401).json({ error: error.message });
          }
          res.status(400).json({ error: error.message });
        }
      },

      resetPassword: async (req, res) => {
        try {
            const { token, newPassword } = req.body;
    
            if (!token || !newPassword) {
                return res.status(400).json({
                    error: 'Token and new password are required'
                });
            }
    
            await authService.resetPassword(token, newPassword);
            
            res.json({ 
                message: 'Password has been reset successfully' 
            });
    
        } catch (error) {
            console.error('Password reset error:', error);
    
            if (error.message === 'Reset token not found') {
                return res.status(404).json({ 
                    error: 'Invalid or expired reset token' 
                });
            }
    
            if (error.message.includes('Password must be')) {
                return res.status(400).json({ 
                    error: error.message 
                });
            }
    
            res.status(500).json({
                error: 'An error occurred while resetting your password'
            });
        }
    },

    getUserVerificationStatus: async (req, res) => {
        try {
            const { userId } = req.user;
            const status = await authService.getUserVerificationStatus(userId);
            res.json(status);
        } catch (error) {
            console.error("Error in getUserVerificationStatus controller:", error);
            res.status(500).json({ error: 'Failed to get verification status' });
  
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