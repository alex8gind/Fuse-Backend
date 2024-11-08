const cloudinary = require('cloudinary').v2;
const User = require('../models/user.model');
const { getUserById } = require('../repositories/user.repo');
const { createDocument, getDocumentById, getUserDocuments,deleteDocument, getVerificationDocuments } = require('../repositories/document.repo');

  const documentService = {

   uploadVerificationDocument: async (docData) => {
      try {

       // Check if user already has a verification document of the same type
      const existingDocs = await getVerificationDocuments(docData.userId);
      const existingDoc = existingDocs.find(doc => doc.documentType === docData.documentType);

      if (existingDoc) {
                throw new Error(`You have already uploaded a ${docData.documentType}. Please delete the existing one first.`);
      }
    
      return await createDocument(docData);
      } catch (error) {
        console.error('Verification document upload error:', error);
        throw error;
      }
},

  getVerificationDocuments: async (userId) => {
  try {
      return await getVerificationDocuments(userId);
  } catch (error) {
      console.error('Error fetching verification documents:', error);
      throw error;
  }
},
  
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

        if (document.userId !== userId.toString()) {
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