const connectionRepo = require('../repositories/connection.repo');

const connectionService =  {
    sendConnectionRequest: async (senderId, receiverId) => {
        if (senderId === receiverId) {
            throw new Error('Cannot send connection request to yourself');
        }

        const existingConnection = await connectionRepo.getConnection(senderId, receiverId);
        if (existingConnection) {
            throw new Error(`Connection already exists with status: ${existingConnection.status}`);
        }

        return await connectionRepo.sendConnectionRequest(senderId, receiverId);
    },

    cancelConnectionRequest: async (senderId, connectionId) => {
        const connection = await connectionRepo.getConnection(senderId, connectionId);
        
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

    acceptConnectionRequest: async (receiverId, connectionId) => {
        const connection = await connectionRepo.getConnection(receiverId, connectionId);
        
        if (!connection) {
            throw new Error('Connection request not found');
        }

        if (connection.status !== 'pending') {
            throw new Error('Only pending connection requests can be accepted');
        }

        const isSender = connection.otherUser.userId !== receiverId;
        if (isSender) {
            throw new Error('Not authorized to accept this connection request');
        }

        const updatedConnection = await connectionRepo.acceptConnectionRequest(receiverId, connectionId);
        
        return updatedConnection;
    },

    declineConnectionRequest: async (receiverId, connectionId) => {
        const connection = await connectionRepo.getConnection(receiverId, connectionId);
        
        if (!connection) {
            throw new Error('Connection request not found');
        }

        if (connection.status !== 'pending') {
            throw new Error('Only pending connection requests can be declined');
        }

        const isSender = connection.otherUser.userId !== receiverId;
        if (isSender) {
            throw new Error('Not authorized to decline this connection request');
        }

        const updatedConnection = await connectionRepo.declineConnectionRequest(receiverId, connectionId);
        
        return updatedConnection;
    }

};

module.exports = connectionService;