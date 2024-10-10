const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')

const documentSchema = new mongoose.Schema({
  docId: {
    type: String,
    unique: true,
    default: () => `doc_${uuidv4()}`,
    required: true
},
  type: { 
    type: String, 
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
  }

}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;