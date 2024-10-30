const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const User = require('../models/user.model');
const { addDocumentToUser, deleteDocument, getUserDocuments, getVerificationDocuments, uploadVerificationDocument } = require('../services/document.service');

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

  uploadVerificationDocument: async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('Uploading verification document:', {
          type: req.body.documentType,
          userId: req.user.userId
      });

        const docData = {
            userId: req.user.userId,
            docName: req.file.originalname,
            documentType: req.body.documentType,
            fileType: req.file.mimetype.split('/')[1],
            url: req.file.path,
            docSize: req.file.size
        };


        const document = await uploadVerificationDocument(docData);

        res.status(201).json({
            success: true,
            document
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
},

getVerificationDocuments: async (req, res) => {
    try {
      console.log('Getting documents for user:', req.user.userId);
        const documents = await getVerificationDocuments(req.user.userId);
        res.json({
            success: true,
            documents
        });
    } catch (error) {
      console.error('Error fetching verification documents:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
},

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