const connectionRepo = require('../repositories/connection.repo');
const userRepo = require('../repositories/user.repo');

const connectionService =  {
    sendConnectionRequest: async (senderId, receiverId, io) => {
        if (senderId === receiverId) {
            throw new Error('Cannot send connection request to yourself');
        }

        const existingConnection = await connectionRepo.getConnection(senderId, receiverId);
        if (existingConnection) {
            throw new Error(`Connection already exists with status: ${existingConnection.status}`);
        }

        const sender = await userRepo.getUserById(senderId);
        if (!sender) {
            throw new Error('Sender user not found');
        }
        
        // Emit notification to receiver with sender's details
        // if (io) {
        //     io.of('/notifications').to(receiverId).emit('connection_request', {
        //         type: 'connection_request',
        //         senderId: senderId,
        //         connectionId: existingConnection.connectionId,
        //         data: {
        //             name: `${sender.firstName} ${sender.lastName}`,
        //             profilePicture: sender.profilePicture,
        //             PId: sender.PId,
        //             isActive: sender.isActive
        //         },
        //         createdAt: new Date()
        //     });
        // }
        const result = await connectionRepo.sendConnectionRequest(senderId, receiverId)

        return result

    },

    cancelConnectionRequest: async (senderId, connectionId) => {
        const connection = await connectionRepo.getConnection(senderId, connectionId);
        console.log("🌊🌊🌊", senderId, connectionId, connection)
        if (!connection) {
            throw new Error('Connection request not found');
        }

        if (connection.status !== 'pending') {
            throw new Error('Only pending connection requests can be cancelled');
        }

        const isReceiver = connection.otherUser.userId === senderId;
        if (isReceiver) {
            throw new Error('Not authorized to cancel this connection request');
        }

        return await connectionRepo.cancelConnectionRequest(senderId, connectionId);
    },

    getConnection: async (userId, connectionId) => {
        const connection = await connectionRepo.getConnection(userId, connectionId);
        
        if (!connection) {
            throw new Error('Connection not found');
        }

        return connection;
    },

    getUserConnections: async (userId) => {
        try {
            if (!userId) throw new Error('User ID is required');
            
            const connections = await connectionRepo.getUserConnections(userId);
            if (!connections) return [];
    
            return connections.filter(conn => conn?.otherUser)

        } catch (error) {
            console.error('Error in getUserConnections service:', error);
            throw error;
        }
    },

    acceptConnectionRequest: async (userId, connectionId) => {
        try {
            // First verify the connection exists and user has permission to accept it
            const existingConnection = await connectionRepo.getConnection(userId, connectionId);
            
            // Check if connection is in pending status
            if (existingConnection.status !== 'pending') {
                throw new Error('Only pending connection requests can be accepted');
            }
    
            // Accept the connection
            const updatedConnection = await connectionRepo.acceptConnection(userId, connectionId);
            
            if (!updatedConnection) {
                throw new Error('Failed to accept connection request');
            }

            // Notify the original sender that their request was accepted
            // if (io) {
            //     io.of('/notifications').to(updatedConnection.senderId).emit('connection_accepted', {
            //         type: 'connection_accepted',
            //         data: {
            //             name: `${updatedConnection.otherUser.firstName} ${updatedConnection.otherUser.lastName}`,
            //             profilePicture: updatedConnection.otherUser.profilePicture,
            //             PId: updatedConnection.otherUser.PId,
            //         },
            //         connectionId: connectionId,
            //         createdAt: new Date()
            //     });
            // }
    
            // Return the updated connection data
            return updatedConnection
    
        } catch (error) {
            console.error('Error in acceptConnectionRequest service:', error);
            throw error; // Re-throw to be handled by controller
        }
    },

    declineConnectionRequest: async (userId, connectionId, io) => {
        const connection = await connectionRepo.getConnection(userId, connectionId);
        
        if (!connection) {
            throw new Error('Connection request not found');
        }

        if (connection.status !== 'pending') {
            throw new Error('Only pending connection requests can be declined');
        }

        const isSender = connection.senderId.toString() === userId.toString();
        if (isSender) {
            throw new Error('Not authorized to decline this connection request');
        }

        const updatedConnection = await connectionRepo.declineConnectionRequest(userId, connectionId);
        
         // Notify the original sender that their request was declined
         if (io) {
            io.of('/notifications').to(updatedConnection.senderId).emit('connection_declined', {
                type: 'connection_declined',
                data: {
                    name: `${updatedConnection.otherUser.firstName} ${updatedConnection.otherUser.lastName}`,
                    profilePicture: updatedConnection.otherUser.profilePicture, 
                    PId: updatedConnection.otherUser.PId,
                },
                connectionId: connectionId,
                createdAt: new Date()
            });
        }

        return updatedConnection;
    }

};

module.exports = connectionService;