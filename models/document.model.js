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
    enum: ['jpg', 'png', 'pdf', 'jpeg', 'doc', 'docx'],
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
  }

}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;