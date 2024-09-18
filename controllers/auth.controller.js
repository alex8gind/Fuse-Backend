const authService = require('../services/auth.service');
const userController = require('./userController');
const { generateToken } = require('../services/auth.service');


const authController = {

    register: async (req, res, next) => {
        try {
            const { user, accessToken, refreshToken } = await authService.register(req.body);
            res.status(201).json({
              message: 'User registered successfully',
              user,
              accessToken,
              refreshToken
            });
          } catch (error) {
            if (error.code === 11000) {
              return res.status(409).json({ message: 'User already exists' });
            }
            next(error);
          }
        },

    login: async (req, res, next) => {
        try {
            const { phoneOrEmail, password } = req.body;
            const result = await authService.login(phoneOrEmail, password);
            res.json(result);
        } catch (error) {
            next(error);
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

    requestEmailVerification: async (req, res, next) => {
        try {
            const { userId } = req.user;
            await authService.requestEmailVerification(userId);
            res.json({ message: 'Email verification sent' });
        } catch (error) {
            next(error);
        }
    },

    verifyEmail: async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { token } = req.body;
            await authService.verifyEmail(userId, token);
            res.json({ message: 'Email verified successfully' });
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