const cloudinary = require('cloudinary').v2;
const User = require('../models/user.model');
const { getUserById } = require('../repositories/user.repo');
const { 
  createDocument, 
  getDocumentById, 
  getUserDocuments, 
  deleteDocument, 
  getVerificationDocuments,
  getSharedDocuments,
  updateShareStatus,
  revokeShare,
  shareDocuments,
  viewDocument
 } = require('../repositories/document.repo');

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
      return await getUserDocuments(userId);},

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
  },

  shareDocuments: async (userId, connectionId, documentIds, recipientId) => {
    try {
        const results = [];
        for (const docId of documentIds) {
            // Verify document ownership
            const document = await getDocumentById(docId);
            if (!document) {
                throw new Error(`Document ${docId} not found`);
            }

             // Convert IDs to strings for comparison
             if (document.userId.toString() !== userId.toString()) {
              throw new Error(`Not authorized to share document ${docId}`);
          }

             // Check if already shared with this user
             const isAlreadyShared = document.sharedWith?.some(
              share => share.userId.toString() === recipientId.toString() && 
              ['pending', 'accepted'].includes(share.status)
          );

            if (isAlreadyShared) {
                continue;
            }

            // Share document
            const sharedDoc = await shareDocuments(docId, {
                userId: recipientId,
                connectionId,
                status: 'pending'
            });

            results.push(sharedDoc);
        }
        return results;
    } catch (error) {
        console.error('Error sharing documents:', error);
        throw error;
    }
  },

  getSharedDocuments: async (userId) => {
    try {
        if (!userId) {
            throw new Error('User ID is required');
        }
        const documents = await getSharedDocuments(userId);
        
        // Filter out expired shares
        return documents.filter(doc => {
            const activeShares = doc.sharedWith.filter(share => 
                share.userId.toString() === userId.toString() &&
                ['pending', 'accepted'].includes(share.status) &&
                new Date(share.expiresAt) > new Date()
            );
            return activeShares.length > 0;
        });
    } catch (error) {
        console.error('Error fetching shared documents:', error);
        throw error;
    }
  },

  viewDocument: async (docId, userId, connectionId = null) => {
    try {
        const document = await viewDocument(docId, userId, connectionId);
        
        if (!document) {
            throw new Error('Document not found');
        }

        // Check access permissions
        const isOwner = document.userId === userId;
        const isShared = document.sharedWith?.length > 0;

        if (!isOwner && !isShared) {
            throw new Error('Not authorized to access this document');
        }

        // Validate supported file types
        const supportedTypes = ['pdf', 'jpg', 'jpeg', 'png'];
        if (!supportedTypes.includes(document.fileType.toLowerCase())) {
            throw new Error('Unsupported file type');
        }

        return document;
    } catch (error) {
        console.error('Error getting document for viewing:', error);
        throw error;
    }
  },

  getDocumentById: async (docId) => {
    try {
        const document = await getDocumentById(docId);
        if (!document) {
            throw new Error('Document not found');
        }
        return document;
    } catch (error) {
        console.error('Error getting document by ID:', error);
        throw error;
    }
  },

  updateShareStatus: async (docId, userId, status) => {
    try {
        return await updateShareStatus(docId, userId, status);
    } catch (error) {
        console.error('Error updating share status:', error);
        throw error;
    }
  },

  revokeShare: async (docId, userId) => {
    try {
        return await revokeShare(docId, userId);
    } catch (error) {
        console.error('Error revoking share:', error);
        throw error;
    }
  }
};
    
  
  module.exports = documentService;