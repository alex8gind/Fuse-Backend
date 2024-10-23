const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const User = require('../models/user.model');
const { addDocumentToUser, deleteDocument, getUserDocuments } = require('../services/document.service');

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'user_documents',
    allowed_formats: ['jpg', 'png', 'pdf', 'jpeg', 'doc', 'docx'],
  },
});

// Initialize upload
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB file size limit
    }
});

const documentController = {
  uploadFile: async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const userId = req.user.userId;
    const docName = req.file.originalname.split('.').slice(0, -1).join('.');
    const documentType = req.body.documentType;
    const docSize = req.file.size;
    const fileUrl = req.file.path; // Cloudinary URL
    const fileType = req.file.mimetype.split('/')[1];

    try {
      const uploadedDocument = await addDocumentToUser({userId, docName, documentType, docSize, url: fileUrl, fileType});
     
      res.json({ 
        success: true,
        message: 'File uploaded and associated with user',
        document: uploadedDocument
      });
    } catch (error) {
      console.error('Error in upload process:', error);
      res.status(500).json({ success: false, error: 'Error saving document information' });
    }
  },

  getUserDocuments: async (req, res) => {
    try {
      const documents = await getUserDocuments(req.user.userId);
      res.json({ success: true, documents });
    } catch (error) {
      console.error('Error fetching user documents:', error);
      res.status(500).json({ success: false, error: 'Error fetching user documents' });
    }
  },

  deleteDocument: async (req, res) => {
    try {
     await deleteDocument(req.params.docId, req.user.userId);

      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ success: false, error: 'Error deleting document' });
    }
  }
};

module.exports = {
  upload,
  ...documentController
};