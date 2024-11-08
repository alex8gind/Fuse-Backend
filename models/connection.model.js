const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const connectionSchema = new mongoose.Schema({
    connectionId: {
        type: String,
        unique: true,
        default: () => `con_${uuidv4()}`,
        required: true,
        immutable: true
    },
    senderId: {type: String, ref: 'User', required: true},
    receiverId: {type: String, ref: 'User', required: true},
    status: {type: String, enum: ['pending', 'accepted', 'declined'], default:'pending'},
    
}, {timestamps:true})


// Make sure all middlewares are placed before conversion to model
const Connection = mongoose.model('Connection', connectionSchema)

// add a Middleware to inform the receiver of friendship about the friend request.

module.exports = Connection
