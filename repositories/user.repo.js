//Always return
//To have repository pattern/logic in one place
//User.repo - all database interactions with user model
const User = require('../models/user.model');
const Report = require('../models/report.model');

const userRepo = {
    createUser: async (userData) => {
        console.log("🥸🥸🥸", userData);
        const newUser = new User(userData);
        const result = await newUser.save();
        const userResponse = {
            ...result?.toObject(),
            userId: result?._id
        };
        delete userResponse.password;
        
        console.log("CREATE USER:", userResponse);
        return userResponse;
    },
    getUserById: async (userId) => {
        const result =  await User.findOne({ _id: userId })
        .select('-verificationToken -resetPasswordExpires -loginAttempts -lockUntil -password')
        .exec(); 

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    getUserByPId: async (pid) => {
        const result = await User.findOne({ PId: pid })
            .select('-password -verificationToken -resetPasswordExpires -loginAttempts -lockUntil')
            .exec();
        
            return {
                ...result?.toObject(),
                userId: result?._id
            }
    },

    getAllUsers: async (skip, limit, sortField = 'createdAt', sortOrder = 'desc', filter = {}) => {
        const result = await User.find(filter)
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit)
            .exec();

        return result.map(user => {
            return {
                ...user.toObject(),
                userId: user._id
            }
        })  
    },

    getUsersCount: async (filter = {}) => {
        return await User.countDocuments(filter);
    },

    editUser: async (userId, updateData) => {
        const result = await User.findOneAndUpdate({ _id: userId }, updateData, { new: true, runValidators: true })
        .select('-verificationToken -resetPasswordExpires -loginAttempts -lockUntil -password')
        .exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    deleteUser: async (userId) => {
        const result = await User.findOneAndDelete({ _id:userId }).exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
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
        const result = await User.findOneAndUpdate(
            { _id: userId },
            statusUpdate,
            { new: true, runValidators: true }
        ).exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    blockUser: async (userId) => {
        const result = await User.findOneAndUpdate(
            { _id: userId },
            { isBlocked: true },
            { new: true, runValidators: true }
        ).exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    unblockUser: async (userId) => {
        const result = await User.findOneAndUpdate(
            { _id:userId },
            { isBlocked: false },
            { new: true, runValidators: true }
        ).exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    deactivateAccount: async (userId) => {
        const result = await User.findOneAndUpdate(
            { _id:userId },
            { isActive: false },
            { new: true, runValidators: true }
        ).exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    },

    reactivateAccount: async (userId) => {
        const result = await User.findOneAndUpdate(
            { _id:userId },
            { isActive: true },
            { new: true, runValidators: true }
        ).exec();

        return {
            ...result?.toObject(),
            userId: result?._id
        }
    }

};

module.exports = userRepo;