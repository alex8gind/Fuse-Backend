const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')

const documentSchema = new mongoose.Schema({
  docName: { 
    type: String, 
    required: true 
  },
  docId: {
    type: String,
    unique: true,
    default: () => `doc_${uuidv4()}`,
    required: true
  },
  fileType: { 
    type: String, 
    enum: ['pdf', 'jpg', 'jpeg', 'png'],
    required: true 
  },
  documentType: { 
    type: String, 
    enum: ['id', 'passport', 'driving_license', 'photo', 'medical', 'agreement'],
    required: true 
  },
  docSize:{
    type: Number,
    required: true
  },
  url: { 
    type: String, 
    required: true 
  },
  userId: { 
    type: String, 
    ref: 'User', 
    required: true 
  },
  sharedWith: { 
    type: [{
        userId: { 
          type: String, 
          ref: 'User',
          required: true
        },
        connectionId: {
          type: String,
          ref: 'Connection',
          required: true
        },
        status: {
          type: String,
          enum: ['accepted', 'revoked'],
          default: 'accepted'
        },
        sharedAt: {
          type: Date,
          default: Date.now
        },
        expiresAt: {
          type: Date,
          default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
  }],
  default: [] 
}   

}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;