const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
// const { checkUserAuthorization } = require('../middleware/userAuth.middleware');
const isAdmin = require('../middleware/isAdmin.middleware');
const {isAccountVerifiedMiddleware} = require('../middleware/verified.middleware');
const documentController = require('../controllers/document.controller');
const connectionController = require('../controllers/connection.controller');
const { getNotifications, markNotificationsAsRead } = require('../utils/notification');
// const docusignController = require('../controllers/docusign.controller');

// Protected routes
router.use(authMiddleware);
router.delete('/profile', userController.deleteUser);
router.put('/profile', userController.editUser);


router.use(isAccountVerifiedMiddleware);

router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.editUser);
router.get('/search/pid/:pid', userController.getUserByPId);
router.post('/report/:reportedUserId', userController.reportUser);
router.post('/block/:targetUserId', userController.blockUser);
router.post('/unblock/:targetUserId', userController.unblockUser);
router.post('/deactivate', userController.deactivateAccount);
router.post('/reactivate', userController.reactivateAccount);
router.post('/upload', documentController.upload.single('file'), documentController.uploadFile);
router.get('/med', documentController.getUserDocuments);
router.delete('/doc/:docId', documentController.deleteDocument);

//Connections routes:
router.get('/connections', connectionController.getUserConnections);
router.get('/connection/:connectionId', connectionController.getConnection);
router.post('/connection', connectionController.sendConnectionRequest);
router.delete('/connection/:connectionId', connectionController.cancelConnectionRequest);
router.put('/connection/:connectionId/accept', connectionController.acceptConnectionRequest);
router.put('/connection/:connectionId/decline', connectionController.declineConnectionRequest);
router.post('/connection/:connectionId/share-documents', documentController.shareDocuments);
router.get('/connection/:connectionId/shared-documents', documentController.getSharedDocuments);
router.patch('/documents/:docId/share-status', documentController.updateShareStatus);
router.delete('/documents/:docId/share', documentController.revokeShare);
router.get('/documents/:docId/view', documentController.viewDocument);
router.get('/notifications', getNotifications);
router.put('/notifications', markNotificationsAsRead);


// router.post('/docusign/create-envelope', docusignController.createEnvelope);
// router.get('/docusign/status/:envelopeId', docusignController.getStatus);
// router.get('/docusign/download/:envelopeId', docusignController.downloadDocument);

// Admin routes
router.get('/admin/all', isAdmin, userController.getAllUsers);
router.get('/admin/reported', isAdmin, userController.getReportedUsers);
router.get('/admin/:userId', isAdmin, userController.getUserById);
module.exports = router;