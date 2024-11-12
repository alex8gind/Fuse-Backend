const Connection = require('../models/connection.model');

const connectionRepo = {
    sendConnectionRequest: async (senderId, receiverId) => {
        const newConnection = await new Connection({
            senderId,
            receiverId
        }).save();

        // Populate and transform to match other functions
        const connection = await Connection.findById(newConnection._id)
            .populate({
                path: "senderId receiverId",
                select: 'userId PId firstName lastName profilePicture isActive'
            })
            .exec();

        const otherUser = connection.receiverId;  // In new connection, always show receiver as otherUser

        return {
            connectionId: connection.connectionId,
            status: connection.status,
            updatedAt: connection.updatedAt,
            senderId: connection.senderId._id.toString(),
            otherUser: {
                userId: otherUser._id.toString(),
                PId: otherUser.PId,
                firstName: otherUser.firstName,
                lastName: otherUser.lastName,
                profilePicture: otherUser.profilePicture,
                isActive: otherUser.isActive
            }
        };
    },

    cancelConnectionRequest: async (senderId, connectionId) => {
        // First get the connection to return consistent format
        const connection = await Connection.findOne({ senderId, connectionId })
            .populate({
                path: "senderId receiverId",
                select: 'userId PId firstName lastName profilePicture isActive'
            })
            .exec();

        if (!connection) return null;

        // Delete the connection
        await Connection.findOneAndDelete({ senderId, connectionId }).exec();

        // Return the last state of connection in consistent format
        const otherUser = connection.receiverId;

        return {
            connectionId: connection.connectionId,
            status: connection.status,
            updatedAt: connection.updatedAt,
            senderId: connection.senderId._id.toString(),
            otherUser: {
                userId: otherUser._id.toString(),
                PId: otherUser.PId,
                firstName: otherUser.firstName,
                lastName: otherUser.lastName,
                profilePicture: otherUser.profilePicture,
                isActive: otherUser.isActive
            }
        };
    },

    // getConnection: async (userId, connectionId) => {
    //     const connection = await Connection.findOne({ 
    //         $or: [
    //             { senderId: userId }, 
    //             { receiverId: userId }
    //             ],
    //              connectionId
    //             }) 
    //             .populate({
    //                 path: "senderId receiverId", 
    //                 select :'userId PId firstName lastName profilePicture isActive'
    //             })
    //             .exec();

    //             if (connection.senderId._id.toString() === userId.toString()) 
    //                 return { 
    //                     ...connection.toObject(), 
    //                     otherUser: {
    //                         ...connection.receiverId.toObject(), 
    //                         userId: connection.receiverId._id.toString()
    //                     }
    //                 }
    //             else if (connection.receiverId._id.toString() === userId.toString()) 
    //                 return { 
    //                     ...connection.toObject(), 
    //                     otherUser: {
    //                         ...connection.senderId.toObject(), 
    //                         userId: connection.senderId._id.toString()
    //                     }
    //                 }
    // },

    // getUserConnections: async (userId) => {

    //     const allConnections = await Connection.find({
    //          $or: [
    //             { senderId: userId }, 
    //             { receiverId: userId }
    //         ]
    //     })
    //     .populate({
    //         path: "senderId receiverId", 
    //         select :'userId PId firstName lastName profilePicture'
    //     })
    //     .exec();
        

    //     const connections = allConnections?.map((con) => {
    //         console.log("EXECUTED, 😱😱😱", con);
    //         if (con.senderId._id.toString() === userId.toString()) return { ...con.toObject(), otherUser: {...con.receiverId.toObject(), userId: con.receiverId._id.toString()}}
    //         else if (con.receiverId._id.toString() === userId.toString()) return { ...con.toObject(), otherUser: {...con.senderId.toObject(), userId: con.senderId._id.toString()}}
    //     })
    //     console.log("🔥🔥🔥", userId)
    //     return connections || [];
    // }, 

    getConnection: async (userId, connectionId) => {
        const connection = await Connection.findOne({ 
            $or: [
                { senderId: userId }, 
                { receiverId: userId }
            ],
            connectionId
        }) 
        .populate({
            path: "senderId receiverId", 
            select: 'userId PId firstName lastName profilePicture isActive'
        })
        .exec();

        if (!connection) return null;

        const otherUser = connection.senderId._id.toString() === userId.toString()
            ? connection.receiverId
            : connection.senderId;

        return {
            connectionId: connection.connectionId,
            status: connection.status,
            updatedAt: connection.updatedAt,
            senderId: connection.senderId._id.toString(),
            otherUser: {
                userId: otherUser._id.toString(),
                PId: otherUser.PId,
                firstName: otherUser.firstName,
                lastName: otherUser.lastName,
                profilePicture: otherUser.profilePicture,
                isActive: otherUser.isActive
            }
        };
    },

    getUserConnections: async (userId) => {
        const allConnections = await Connection.find({
            $or: [
                { senderId: userId }, 
                { receiverId: userId }
            ]
        })
        .populate({
            path: "senderId receiverId", 
            select: 'userId PId firstName lastName profilePicture isActive'
        })
        .exec();

        return allConnections.map(connection => {
            const otherUser = connection.senderId._id.toString() === userId.toString()
                ? connection.receiverId
                : connection.senderId;

            return {
                connectionId: connection.connectionId,
                status: connection.status,
                updatedAt: connection.updatedAt,
                senderId: connection.senderId._id.toString(),
                otherUser: {
                    userId: otherUser._id.toString(),
                    PId: otherUser.PId,
                    firstName: otherUser.firstName,
                    lastName: otherUser.lastName,
                    profilePicture: otherUser.profilePicture,
                    isActive: otherUser.isActive
                }
            };
        });
    },

    acceptConnection: async (userId, connectionId) => {
        // First find the connection to verify the user is the receiver
        const connection = await Connection.findOne({ 
            connectionId,
            status: 'pending'
        });
    
        if (!connection) {
            throw new Error('Connection request not found');
        }
    
        // Verify the user attempting to accept is the receiver
        if (connection.receiverId.toString() !== userId.toString()) {
            throw new Error('Not authorized to accept this connection request');
        }
    
        // Update the connection status
        const updatedConnection = await Connection.findOneAndUpdate(
            { 
                connectionId,
                status: 'pending'
            },
            { 
                status: 'accepted'
            },
            { 
                new: true,
                runValidators: true
            }
        )
        .populate({
            path: "senderId receiverId",
            select: 'userId PId firstName lastName profilePicture isActive'
        })
        .exec();
    
        // Transform and return data
        const otherUser = updatedConnection.senderId; // sender becomes the otherUser
    
        return {
            connectionId: updatedConnection.connectionId,
            status: updatedConnection.status,
            updatedAt: updatedConnection.updatedAt,
            senderId: updatedConnection.senderId._id.toString(),
            otherUser: {
                userId: otherUser._id.toString(),
                PId: otherUser.PId,
                firstName: otherUser.firstName,
                lastName: otherUser.lastName,
                profilePicture: otherUser.profilePicture,
                isActive: otherUser.isActive
            }
        };
    },

    declineConnectionRequest: async (receiverId, connectionId) => {
        const connection = await Connection.findOneAndUpdate(
            { connectionId, receiverId, status: 'pending' },
            { status: 'declined' },
            { new: true }
        )
        .populate({
            path: "senderId receiverId",
            select: 'userId PId firstName lastName profilePicture isActive'
        })
        .exec();

        if (!connection) return null;

        const otherUser = connection.senderId;  // In decline, always show sender as otherUser

        return {
            connectionId: connection.connectionId,
            status: connection.status,
            updatedAt: connection.updatedAt,
            senderId: connection.senderId._id.toString(),
            otherUser: {
                userId: otherUser._id.toString(),
                PId: otherUser.PId,
                firstName: otherUser.firstName,
                lastName: otherUser.lastName,
                profilePicture: otherUser.profilePicture,
                isActive: otherUser.isActive
            }
        };
    }
};

module.exports = connectionRepo;