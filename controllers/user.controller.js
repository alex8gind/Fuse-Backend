const userService = require('../services/user.service');

const userController = {

    getUserProfile: async (req, res, next) => {
        try {
            const userId = req.user.userId; // Assuming the user ID is attached to the request by the auth middleware
            const user = await userService.getUserProfile(userId);
            res.json({ user });
        } catch (error) {
            next(error);
        }
    },

    editUser: async (req, res, next) => {
        try {
            const { userId } = req.params;
            const updateData = req.body;
            const updatedUser = await userService.userFunctions.editUser(userId, updateData);
            res.json(updatedUser);
        } catch (error) {
            next(error);
        }
    },

    deleteUser: async (req, res, next) => {
        try {
            const { userId } = req.params;
            await userService.userFunctions.deleteUser(userId);
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            next(error);
        }
    },

    reportUser: async (req, res, next) => {
        try {
            const { reportedUserId } = req.params;
            const { reason } = req.body;
            const reportingUserId = req.user.userId;
            await userService.userFunctions.reportUser(reportedUserId, reportingUserId, reason);
            res.json({ message: 'User reported successfully' });
        } catch (error) {
            next(error);
        }
    },

    blockUser: async (req, res, next) => {
        try {
            const { targetUserId } = req.params;
            const userId = req.user.userId;
            await userService.userFunctions.blockUser(userId, targetUserId);
            res.json({ message: 'User blocked successfully' });
        } catch (error) {
            next(error);
        }
    },

    unblockUser: async (req, res, next) => {
        try {
            const { targetUserId } = req.params;
            const userId = req.user.userId;
            await userService.userFunctions.unblockUser(userId, targetUserId);
            res.json({ message: 'User unblocked successfully' });
        } catch (error) {
            next(error);
        }
    },

    deactivateAccount: async (req, res, next) => {
        try {
            const { userId } = req.user;
            await userService.userFunctions.deactivateAccount(userId);
            res.json({ message: 'Account deactivated successfully' });
        } catch (error) {
            next(error);
        }
    },

    reactivateAccount: async (req, res, next) => {
        try {
            const { userId } = req.user;
            await userService.userFunctions.reactivateAccount(userId);
            res.json({ message: 'Account reactivated successfully' });
        } catch (error) {
            next(error);
        }
    },

    // Admin functions
    getAllUsers: async (req, res, next) => {
        try {
            const { page, limit, sortField, sortOrder, ...filter } = req.query;
            const users = await userService.adminFunctions.getAllUsers(page, limit, sortField, sortOrder, filter);
            res.json(users);
        } catch (error) {
            next(error);
        }
    },

    getReportedUsers: async (req, res, next) => {
        try {
            const { page, limit } = req.query;
            const reportedUsers = await userService.adminFunctions.getReportedUsers(page, limit);
            res.json(reportedUsers);
        } catch (error) {
            next(error);
        }
    },

    getUserById: async (req, res, next) => {
        try {
            const { userId } = req.params;
            const user = await userService.adminFunctions.getUserById(userId);
            res.json(user);
        } catch (error) {
            next(error);
        }
    }
};

module.exports = userController;


