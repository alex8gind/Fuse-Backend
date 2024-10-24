const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const {isAccountVerifiedMiddleware} = require('../middleware/verified.middleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-email/:token', authController.verifyEmail);//triggered by user clicking on sent email link
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.use(authMiddleware);

router.post('/logout', authController.logout);
router.post('/verify-email', authController.sendVerificationEmail);//triggered by account registration in front end
router.get('/refresh-tokens', authController.getAllRefreshTokens);
router.delete('/refresh-tokens', authController.removeAllRefreshTokens);

router.use(isAccountVerifiedMiddleware);

router.post('/change-password', authController.changePassword);
router.get('/verification-status', authController.getUserVerificationStatus);
router.post('/change-phone-or-email', authController.changePhoneOrEmail);

module.exports = router;