const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
// router.use(authMiddleware);

router.post('/logout', authController.logout);
router.post('/change-password', authController.changePassword);
router.post('/request-email-verification', authController.requestEmailVerification);
router.post('/verify-email', authController.verifyEmail);
router.get('/verification-status', authController.getUserVerificationStatus);
router.post('/change-phone-or-email', authController.changePhoneOrEmail);
router.get('/refresh-tokens', authController.getAllRefreshTokens);
router.delete('/refresh-tokens', authController.removeAllRefreshTokens);

module.exports = router;