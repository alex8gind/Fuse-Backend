const Connection = require('../models/connection.model');

const connectionRepo = {
    sendConnectionRequest: async (senderId, receiverId) => {
        const newConnection = new Connection({
            senderId,
            receiverId
        });
        return await newConnection.save();
    },

    cancelConnectionRequest: async (senderId, connectionId) => {
        return await Connection.findOneAndDelete({ senderId, connectionId }).exec();
    },

    getConnection: async (userId, connectionId) => {
        return await Connection.findOne({ 
            $or: [
                { senderId: userId }, 
                { receiverId: userId }
                ],
                 connectionId
                }).exec();
    },

    // getUserConnections: async (userId) => {

    //     const allConnections = await Connection.find({
    //          $or: [
    //             { senderId: userId }, 
    //             { receiverId: userId }
    //         ]
    //     })
    //     .populate({
    //         path: function(){
    //         if (userId === this.senderId) return 'receiverId';
    //         else if (userId === this.receiverId) return 'senderId';
    //         }, 
    //         select: 'userId PId profilePicture firstName lastName'
    //         })
    //         .exec();
    //         // modify receiverId and senderId to match other user key
    //          return allConnections?.map((con) => {
    //             if (con.senderId) return { ...con, otherUser: con.senderId}
    //             else if (con.receiverId) return { ...con, otherUser: con.receiverId}
    //          }) || [];
    // }, 

    getUserConnections: async (userId) => {
        const allConnections = await Connection.find({ 
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        })
        .populate('senderId', 'userId PId profilePicture firstName lastName')
        .populate('receiverId', 'userId PId profilePicture firstName lastName')
        .exec();

        return allConnections.map(conn => {
            const otherUser = conn.senderId?._id.toString() === userId 
                ? conn.receiverId 
                : conn.senderId;
            
            return {
                ...conn.toObject(),
                otherUser
            };
        });
    },

    acceptConnectionRequest: async (receiverId, connectionId) => {
        return await Connection.findOneAndUpdate(
            { connectionId, receiverId, status: 'pending' },
            { status: 'accepted' }, 
            { new: true }
        ).exec();
    },

    declineConnectionRequest: async (receiverId, connectionId) => {
        return await Connection.findOneAndUpdate(
            { connectionId, receiverId, status: 'pending' },
            { status: 'declined' }, 
            { new: true }
        ).exec();
    }
};


module.exports = connectionRepo;