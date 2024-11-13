const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    text: { 
        type: String, 
        required: true },
    type: { 
        type: String, 
        enum: ['sentRequest', 'acceptedRequest', 'sharedDocument'],
        required: true 
      },
    status: { 
        type: String, 
        enum: ['unread', 'read'],
        default: 'unread' 
      },
    senderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
      },
    receiverId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
      }
    }, {
        timestamps: true
  });

  const Notification = mongoose.model('Notification', notificationSchema);

  module.exports = Notification