const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const documentController = require('../controllers/document.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { verificationDocMiddleware } = require('../middleware/verificationDocMiddleware');


// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-email/:token', authController.verifyEmail);//triggered by user clicking on sent email link
router.post('/forgot-password', authController.forgotPassword);
router.post('/validate-reset-token', authController.validateResetToken);
router.post('/reset-password', authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);


// Protected routes
router.use(authMiddleware);

router.post('/verification-documents', documentController.upload.single('file'), documentController.uploadVerificationDocument);
router.get('/verification-documents', documentController.getVerificationDocuments);
router.delete('/verification-documents/:docId', documentController.deleteDocument);

router.post('/logout', authController.logout);
router.post('/verify-email', authController.sendVerificationEmail);//triggered by account registration in front end
router.get('/refresh-tokens', authController.getAllRefreshTokens);
router.delete('/refresh-tokens', authController.removeAllRefreshTokens);
router.post('/change-password', authController.changePassword);
router.get('/verification-status', authController.getUserVerificationStatus);
router.post('/change-phone-or-email', authController.changePhoneOrEmail);

module.exports = router;