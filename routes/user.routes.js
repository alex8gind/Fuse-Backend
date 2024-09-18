const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { checkUserAuthorization } = require('../middleware/userAuth.middleware');
const isAdmin = require('../middleware/isAdmin.middleware');

// Protected routes
router.use(authenticateToken);

router.get('/profile', userController.getUserProfile);
router.get('/:userId', checkUserAuthorization, userController.getUserById);
router.put('/:userId', checkUserAuthorization, userController.editUser);
router.delete('/:userId', checkUserAuthorization, userController.deleteUser);
router.post('/report/:reportedUserId', userController.reportUser);
router.post('/block/:targetUserId', userController.blockUser);
router.post('/unblock/:targetUserId', userController.unblockUser);
router.post('/deactivate', userController.deactivateAccount);
router.post('/reactivate', userController.reactivateAccount);

// Admin routes
router.get('/admin/all', isAdmin, userController.getAllUsers);
router.get('/admin/reported', isAdmin, userController.getReportedUsers);

module.exports = router;