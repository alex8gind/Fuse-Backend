const cloudinary = require('cloudinary').v2;
const User = require('../models/user.model');
const { getUserById } = require('../repositories/user.repo');
const { createDocument, getDocumentById, getUserDocuments,deleteDocument } = require('../repositories/document.repo');

  const documentService = {

//     uploadToCloudinary: async (file) => {
//       try {
//         const result = await cloudinary.uploader.upload(file.path, {
//           folder: 'user_documents',
//         });
//         return result.secure_url;
//       } catch (error) {
//         console.error('Cloudinary upload error:', error);
//         throw new Error('Failed to upload file to Cloudinary');
//       }
    // },
  
    addDocumentToUser: async (docData) => {
      return await createDocument(docData);
    },

    getUserDocuments: async (userId) => {
        return await getUserDocuments(userId);
      },

    deleteDocument: async (docId, userId) => {
        const document = await getDocumentById(docId);
        if (!document) {
            throw new Error('Document not found');
        }

        if (document.userId !== userId) {
            throw new Error('You are not authorized to delete this document');
        }
        
        // Delete from Cloudinary
        const publicId = document.url.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
        
        await deleteDocument(docId, userId);
        return document;
      }
    };
    
  
  module.exports = documentService;