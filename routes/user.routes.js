const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { checkUserAuthorization } = require('../middleware/userAuth.middleware');
const isAdmin = require('../middleware/isAdmin.middleware');
const { upload, uploadFile } = require('../controllers/upload.controller');
const {isAccountVerifiedMiddleware} = require('../middleware/verified.middleware');


// Protected routes
router.use(authMiddleware);
router.use(isAccountVerifiedMiddleware);

router.get('/profile', userController.getUserProfile);
router.put('/profile', checkUserAuthorization, userController.editUser);
router.delete('/:userId', checkUserAuthorization, userController.deleteUser);
router.post('/report/:reportedUserId', userController.reportUser);
router.post('/block/:targetUserId', userController.blockUser);
router.post('/unblock/:targetUserId', userController.unblockUser);
router.post('/deactivate', userController.deactivateAccount);
router.post('/reactivate', userController.reactivateAccount);
router.post('/upload-document', authMiddleware, upload.single('file'), uploadFile);


// Admin routes
router.get('/admin/all', isAdmin, userController.getAllUsers);
router.get('/admin/reported', isAdmin, userController.getReportedUsers);
router.get('/admin/:userId', isAdmin, userController.getUserById);
module.exports = router;