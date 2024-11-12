const connectionService = require('../services/connection.service');


const connectionController = {

    sendConnectionRequest: async (req, res) => {
        try {
            const { receiverId } = req.body;
            const senderId = req.user.userId; 

            if (!receiverId) {
                return res.status(400).json({
                    success: false,
                    message: 'Receiver ID is required'
                });
            }

            const connection = await connectionService.sendConnectionRequest(senderId, receiverId);
            
            return res.status(201).json({
                success: true,
                data: connection
            });
        } catch (error) {
            if (error.message.includes('Connection already exists')) {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }

            if (error.message.includes('Cannot send connection request to yourself')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to send connection request'
            });
        }
    },

    cancelConnectionRequest: async (req, res) => {
        try {
            const { connectionId } = req.params;
            const senderId = req.user.userId;

            if (!connectionId) {
                return res.status(400).json({
                    success: false,
                    message: 'Connection ID is required'
                });
            }

            const connection = await connectionService.cancelConnectionRequest(senderId, connectionId);
            
            return res.status(200).json({
                success: true,
                data: connection
            });
        } catch (error) {
            if (error.message.includes('Connection request not found')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            if (error.message.includes('Not authorized')) {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }

            if (error.message.includes('Only pending connection requests')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to cancel connection request'
            });
        }
    },

    getConnection: async (req, res) => {
        try {
            const { connectionId } = req.params;
            const userId = req.user.userId;

            if (!connectionId) {
                return res.status(400).json({
                    success: false,
                    message: 'Connection ID is required'
                });
            }

            const connection = await connectionService.getConnection(userId, connectionId);
            
            return res.status(200).json({
                success: true,
                data: connection
            });
        } catch (error) {
            if (error.message.includes('Connection not found')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to get connection details'
            });
        }
    },

    getUserConnections: async (req, res) => {
        try {
            const userId = req.user.userId;
            const connections = await connectionService.getUserConnections(userId);
            
            return res.status(200).json({
                success: true,
                data: connections
            });
        } catch (error) {
            console.error('Error in getUserConnections:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch connections',
                error: error.message
            });
        }
    },

    acceptConnectionRequest: async (req, res) => {
        try {
            const { connectionId } = req.params;
            const userId = req.user.userId;
    
            if (!connectionId) {
                return res.status(400).json({
                    success: false,
                    message: 'Connection ID is required'
                });
            }
    
            const connection = await connectionService.acceptConnectionRequest(userId, connectionId);
            
            return res.status(200).json({
                success: true,
                data: connection
            });
        } catch (error) {
            console.error('Error accepting connection request:', error);
            
            // Handle specific error cases with appropriate status codes
            if (error.message.includes('Connection request not found')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
    
            if (error.message.includes('Not authorized')) {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
    
            if (error.message.includes('Only pending connection requests')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
    
            // Default error response for unexpected errors
            return res.status(500).json({
                success: false,
                message: 'Failed to accept connection request'
            });
        }
    },

    declineConnectionRequest: async (req, res) => {
        try {
            const { connectionId } = req.params;
            const userId = req.user.userId;

            if (!connectionId) {
                return res.status(400).json({
                    success: false,
                    message: 'Connection ID is required'
                });
            }

            const connection = await connectionService.declineConnectionRequest(userId, connectionId);
            
            return res.status(200).json({
                success: true,
                data: connection
            });
        } catch (error) {
            if (error.message.includes('Connection request not found')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            if (error.message.includes('Not authorized')) {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }

            if (error.message.includes('Only pending connection requests')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to decline connection request'
            });
        }
    }
};

module.exports = connectionController;