const User = require('../models/user.model');
const Connection = require('../models/connection.model');

const connectionRepo = {
    createConnection: async (userId, connectionId) => {
        const newConnection = new Connection({
            user: userId,
            connection: connectionId,
            status: 'pending'
        });
        const savedConnection = await newConnection.save();

        // Add connection reference to user
        await User.findOneAndUpdate(
            { userId },
            { $addToSet: { connections: savedConnection._id } }
        );

        return savedConnection;
    },

    getConnection: async (userId, connectionId) => {
        return await Connection.findOne({ user: userId, connection: connectionId }).exec();
    },

    getUserConnections: async (userId, skip, limit, status) => {
        const query = { user: userId };
        if (status) query.status = status;

        return await Connection.find(query)
            .skip(skip)
            .limit(limit)
            .populate('connection', 'userId firstName lastName')
            .exec();
    },

    updateConnectionStatus: async (userId, connectionId, status) => {
        return await Connection.findOneAndUpdate(
            { user: userId, connection: connectionId },
            { status },
            { new: true }
        ).exec();
    },

    deleteConnection: async (userId, connectionId) => {
        const deletedConnection = await Connection.findOneAndDelete({ user: userId, connection: connectionId }).exec();
        
        // Remove connection reference from user
        await User.findOneAndUpdate(
            { userId },
            { $pull: { connections: deletedConnection._id } }
        );

        return deletedConnection;
    }
};

module.exports = connectionRepo;