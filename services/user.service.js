const userRepo = require('../repositories/user.repo');
const { sendWithPhoneOrEmail } = require('./phoneOrEmail.service');
const { hashPassword } = require('./password.service');


const userFunctions = {
    createUser: async (userData) => {
        if (userData.password) {
            userData.password = await hashPassword(userData.password);
        }
        return await userRepo.createUser(userData);
    },

    getUserProfile: async (userId) => {
        const user = await userRepo.getUserById(userId);
        if (!user) {
          throw new Error('User not found');
        }
        // Remove sensitive information
        const { password, ...userProfile } = user.toObject();
        return userProfile;
      },

    editUser: async (userId, updateData) => {
        const { password, isAdmin, isActive, isBlocked, ...safeUpdateData } = updateData;
        return await userRepo.editUser(userId, safeUpdateData);
    },

    reportUser: async (reportedUserId, reportingUserId, reason) => {
        const reportedUser = await userRepo.getUserById(reportedUserId);
        const reportingUser = await userRepo.getUserById(reportingUserId);
        if (!reportedUser || !reportingUser) {
            throw new Error('One or both users not found');
        }
        return await userRepo.reportUser({ reportedUser: reportedUserId, reportingUser: reportingUserId, reason });
    },

    blockUser: async (userId, targetUserId) => {
        if (userId === targetUserId) {
            throw new Error("You can't block yourself");
        }
        return await userRepo.blockUser(targetUserId);
    },

    unblockUser: async (userId, targetUserId) => {
        if (userId === targetUserId) {
            throw new Error("You can't unblock yourself");
        }
        return await userRepo.unblockUser(targetUserId);
    },

    deactivateAccount: async (userId) => {
        return await userRepo.deactivateAccount(userId);
    },

    reactivateAccount: async (userId) => {
        return await userRepo.reactivateAccount(userId);
    },

    deleteUser: async (userId) => {
        return await userRepo.deleteUser(userId);
    },

    sendNotification: async (userId, token, type) => {
        const user = await userRepo.getUserById(userId);
        if (!user) throw new Error('User not found');
        const method = user.phoneOrEmail.includes('@') ? 'email' : 'sms';
        await sendWithPhoneOrEmail(user.phoneOrEmail, token, type, method);
    }
};

const adminFunctions = {
    getUserById: async (userId) => {
        const user = await userRepo.getUserById(userId);
        if (!user) throw new Error('User not found');
        const { password, ...safeUserData } = user.toObject();
        return safeUserData;
    },

    getAllUsers: async (page, limit, sortField = 'createdAt', sortOrder = 'desc', filter = {}) => {
        const skip = (page - 1) * limit;
        const users = await userRepo.getAllUsers(skip, limit, sortField, sortOrder, filter);
        const total = await userRepo.getUsersCount(filter);
        return {
            users,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalUsers: total
        };
    },

    getReportedUsers: async (page, limit) => {
        const skip = (page - 1) * limit;
        const reportedUsers = await userRepo.getAllReportedUsers(skip, limit);
        const total = await userRepo.getReportedUsersCount();
        return {
            users: reportedUsers,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalUsers: total
        };
    },
};

const mixedFunctions = {
    editUser: userFunctions.editUser,
    deleteUser: userFunctions.deleteUser,
    blockUser: userFunctions.blockUser,
    unblockUser: userFunctions.unblockUser,
    deactivateAccount: userFunctions.deactivateAccount,
    reactivateAccount: userFunctions.reactivateAccount,
};

module.exports = {
    userFunctions,
    adminFunctions,
    mixedFunctions
};