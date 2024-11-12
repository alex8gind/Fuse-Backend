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
const { generateSignedUrl } = require('../utils/generateSignedUrl');

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
             const documentOwnerId = document.userId.toString ? document.userId.toString() : document.userId;
             const requestingUserId = userId.toString ? userId.toString() : userId;

             if (documentOwnerId !== requestingUserId) {
                console.log('Authorization failed - IDs do not match');
                throw new Error(`Not authorized to share document ${docId}`);
              }

             // Check if already shared with this user
             const isAlreadyShared = document.sharedWith?.some(share => {
                const sharedUserId = share.userId.toString ? share.userId.toString() : share.userId;
                return sharedUserId === recipientId.toString() && 
                       ['pending', 'accepted'].includes(share.status);
              });

            if (isAlreadyShared) {
                continue;
            }

            // Share document
            const sharedDoc = await shareDocuments(docId, {
                userId: recipientId,
                connectionId,
                status: 'pending',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
            });

            results.push(sharedDoc);
        }
        return results;
    } catch (error) {
        console.error('Error sharing documents:', error);
        throw error;
    }
  },

  getSharedDocuments: async (connectionId) => {
    try {
        if (!connectionId) {
            throw new Error('Connection ID is required');
        }
        const documents = await getSharedDocuments(connectionId);
        
        // const transformedDocuments = documents.map(doc => {
        //     const userShare = doc.sharedWith.find(share => 
        //       share.userId === userId
        //     );
        //     return {
        //         docId: doc.docId,
        //         docName: doc.docName,
        //         documentType: doc.documentType,
        //         fileType: doc.fileType,
        //         url: doc.url,
        //         sharedAt: userShare?.sharedAt,
        //         status: userShare?.status,
        //         expiresAt: userShare?.expiresAt,
        //         connectionId: userShare?.connectionId,
        //         sharedWith: userShare
        //       }
        // });

        return documents;
    } catch (error) {
        console.error('Error fetching shared documents:', error);
        throw error;
    }
  },

  viewDocument: async (docId, userId, connectionId = null) => {
    try {
        console.log('ViewDocument Service - Input:', { docId, userId, connectionId });
       
        // Get the document with full details
        const document = await getDocumentById(docId);
        console.log('ViewDocument Service - Document found:', {
            docId: document.docId,
            userId: document.userId,
            sharedWith: document.sharedWith
          });
        
        if (!document) {
          throw new Error('Document not found');
        }
    
        // Check access permissions
        const isOwner = document.userId === userId;
        console.log('ViewDocument Service - Is Owner:', isOwner);

         // Check share access
        const shareRecord = document.sharedWith?.find(share => 
        share.userId === userId && 
        share.connectionId === connectionId
      );

      console.log('ViewDocument Service - Access Check:', {
        isOwner,
        shareFound: !!shareRecord,
        shareStatus: shareRecord?.status,
        expiresAt: shareRecord?.expiresAt
      });
  
      
    // Validate access
    // if (!isOwner) {
    //     if (!shareRecord) {
    //       throw new Error('Document not shared with user');
    //     }
  
    //     if (shareRecord.status !== 'accepted') {
    //       throw new Error('Share request is pending acceptance');
    //     }
  
    //     if (new Date(shareRecord.expiresAt) <= new Date()) {
    //       throw new Error('Share access has expired');
    //     }
    //   }
    

        // Validate supported file types
        const supportedTypes = ['pdf', 'jpg', 'jpeg', 'png'];
        if (!supportedTypes.includes(document.fileType.toLowerCase())) {
            throw new Error('Unsupported file type');
        }

        // Generate signed URL
        const signedUrl = await generateSignedUrl(document);

        return {
            success: true,
            url: signedUrl,
            document: {
              docId: document.docId,
              docName: document.docName,
              fileType: document.fileType,
              documentType: document.documentType,
              shareStatus: shareRecord?.status
            }
          };
      
        } catch (error) {
            console.error('ViewDocument Service - Error:', error);
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