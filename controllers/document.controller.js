const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { generateSignedUrl } = require('../utils/generateSignedUrl');
const { 
  addDocumentToUser, 
  deleteDocument, 
  getUserDocuments, 
  getVerificationDocuments, 
  uploadVerificationDocument,
  shareDocuments,
  getSharedDocuments,
  viewDocument,
  updateShareStatus,
  revokeShare,
  getDocumentById
 } = require('../services/document.service');


// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
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
  },

  shareDocuments: async (req, res) => {
    try {
        const { connectionId } = req.params;
        const { documents, recipientId } = req.body;
        const userId = req.user.userId;

        console.log('Share request:', { 
          userId,
          connectionId,
          documents,
          recipientId
      });

      if (!connectionId) {
        return res.status(400).json({
            success: false,
            error: 'Connection ID is required'
        });
    }

    if (!recipientId) {
        return res.status(400).json({
            success: false,
            error: 'Recipient ID is required'
        });
    }


    if (!Array.isArray(documents) || documents.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of document IDs to share'
            });
    }

        const sharedDocs = await shareDocuments(
            userId,
            connectionId,
            documents,
            recipientId
        );

        res.status(200).json({
            success: true,
            data: sharedDocs
        });
    } catch (error) {
        console.error('Share documents error:', error);
        if (error.message.includes('Not authorized')) {
          return res.status(403).json({
              success: false,
              error: error.message
          });
      }
      
      if (error.message.includes('Document not found')) {
          return res.status(404).json({
              success: false,
              error: error.message
          });
      }

      res.status(400).json({
          success: false,
          error: error.message || 'Failed to share documents'
      });
    }
  },

  getSharedDocuments: async (req, res) => {
    try {
        const documents = await getSharedDocuments(req.params.connectionId);
        console.log('Shared documents:', documents, req.params.connectionId);
        res.json({
            success: true,
            data: documents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch shared documents'
        });
    }
  
  },

  viewDocument: async (req, res) => {
    try {
        const { docId } = req.params;
        const { connectionId } = req.query;
        const userId = req.user.userId;

         // Validation
        if (!docId) {
          return res.status(400).json({
            success: false,
            error: 'Document ID is required'
          });
        }

        console.log('View Document Controller - Request:', {
          docId,
          connectionId,
          userId
        });
    
      const result = await viewDocument(docId, userId, connectionId);
      
      res.json(result);
    } catch (error) {
      console.error('View Document Controller - Error:', error.message);
        
      switch(error.message) {
        case 'Document not found':
          return res.status(404).json({
            success: false,
            error: 'Document not found'
          });
        
        case 'Document not shared with user':
        case 'Share request is pending acceptance':
          return res.status(403).json({
            success: false,
            error: error.message
          });
        
        case 'Share access has expired':
          return res.status(401).json({
            success: false,
            error: error.message
          });
        
        default:
          return res.status(500).json({
            success: false,
            error: 'Failed to retrieve document'
          });
      }
    }
  },

  updateShareStatus: async (req, res) => {
    try {
        const { docId } = req.params;
        const { status } = req.body;
        const userId = req.user.userId;

        const updatedDoc = await updateShareStatus(docId, userId, status);
        res.json({
            success: true,
            data: updatedDoc
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
  },

  revokeShare: async (req, res) => {
    try {
        const { docId } = req.params;
        const userId = req.user.userId;

        const updatedDoc = await revokeShare(docId, userId);
        res.json({
            success: true,
            data: updatedDoc
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
  }
};

module.exports = {
  upload,
  ...documentController
};