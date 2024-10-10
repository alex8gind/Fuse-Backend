const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
    sender: {type:String, ref:'User', required:true},
    receiver: {type:String, ref:'User', required:true},
    status: {type:String, enum: ['pending', 'accepted', 'declined'], default:'pending'},
    
}, {timestamps:true})


// Make sure all middlewares are placed before conversion to model
const Connection = mongoose.model('Connection', connectionSchema)

// add a Middleware to inform the receiver of friendship about the friend request.

module.exports = Connection
