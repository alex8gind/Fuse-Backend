//Always return
//To have repository pattern/logic in one place
//User.repo - all database interactions with user model
const User = require('../models/user.model');
const Report = require('../models/report.model');

const userRepo = {
    createUser: async (userData) => {
        const newUser = new User(userData);
        return await newUser.save();
    },

    getUserById: async (userId) => {
        return await User.findOne({ userId }).exec();
    },

    getAllUsers: async (skip, limit, sortField = 'createdAt', sortOrder = 'desc', filter = {}) => {
        return await User.find(filter)
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit)
            .exec();
    },

    getUsersCount: async (filter = {}) => {
        return await User.countDocuments(filter);
    },

    editUser: async (userId, updateData) => {
        return await User.findOneAndUpdate({ userId }, updateData, { new: true, runValidators: true }).exec();
    },

    deleteUser: async (userId) => {
        return await User.findOneAndDelete({ userId }).exec();
    },

    reportUser: async (reportData) => {
        const newReport = new Report(reportData);
        return await newReport.save();
    },

    getAllReportedUsers: async (skip, limit, sortField = 'createdAt', sortOrder = 'desc') => {
        return await Report.find()
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit)
            .populate('reportedUser', 'userId firstName lastName')
            .populate('reportingUser', 'userId firstName lastName')
            .exec();
    },

    getReportedUsersCount: async () => {
        return await Report.countDocuments();
    },

    updateUserStatus: async (userId, statusUpdate) => {
        return await User.findOneAndUpdate(
            { userId },
            statusUpdate,
            { new: true, runValidators: true }
        ).exec();
    },

    blockUser: async (userId) => {
        return await User.findOneAndUpdate(
            { userId },
            { isBlocked: true },
            { new: true, runValidators: true }
        ).exec();
    },

    unblockUser: async (userId) => {
        return await User.findOneAndUpdate(
            { userId },
            { isBlocked: false },
            { new: true, runValidators: true }
        ).exec();
    },

    deactivateAccount: async (userId) => {
        return await User.findOneAndUpdate(
            { userId },
            { isActive: false },
            { new: true, runValidators: true }
        ).exec();
    },

    reactivateAccount: async (userId) => {
        return await User.findOneAndUpdate(
            { userId },
            { isActive: true },
            { new: true, runValidators: true }
        ).exec();
    },

};

module.exports = userRepo;