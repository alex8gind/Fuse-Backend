const Document = require('../models/document.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

const documentRepo = {
    getVerificationDocuments: async (userId) => {
        return await Document.find({ 
            userId,
            documentType: { 
                $in: ['id', 'passport', 'driving_license', 'photo'] 
            }
        }).exec();
    },

    createDocument: async (docData) => {
        const newDocument = new Document(docData);
        const savedDocument = await newDocument.save();
        return savedDocument;
    },

    // getDocumentById: async (docId) => {
    //     // console.log("🥶🥶🥶", docId);
    //     return await Document.findOne({docId})
    //     .select('docId docName url userId sharedWith documentType fileType createdAt updatedAt')
    //     .lean() 
    //     .exec();
    // },

    getUserDocuments: async (userId) => {
        const documents = await Document.find({ userId }).exec();
        return documents
    },

    deleteDocument: async (docId, userId) => {
        const session = await mongoose.startSession();
        let deletedDocument = null;

        try {
            // Start transaction
            await session.startTransaction();

              // First find the document to check its type
            const document = await Document.findOne({
                docId: docId,
                userId: userId
            }).session(session);

            if (!document) {
                throw new Error('Document not found');
            }

            deletedDocument = await Document.findOneAndDelete({
                docId: docId,
                userId: userId
            }).session(session);

         // If it's a verification document (photo), update user's verification status
            if (document.documentType === 'photo') {
                console.log("Deleting verification photo, updating user status");
                const updateResult = await User.findOneAndUpdate(
                    { _id: userId},
                    { 
                        $set: { 
                            isVerified: false,
                            profilePicture: 'default.png'
                        }
                    },
                    { 
                        new: true,
                        session: session 
                    }
                );

                if (!updateResult) {
                throw new Error('Failed to update user verification status');
                }
            }

            // If everything succeeded, commit the transaction
            await session.commitTransaction();
            console.log("Successfully deleted document and updated user status");

            return deletedDocument;
            } catch (error) {
            // If anything fails, abort the transaction
                await session.abortTransaction();
                console.error("Transaction failed:", error);
                throw error;
            } finally {
            // End the session
                await session.endSession();
            }
    },

    shareDocuments: async (docId, shareData) => {
        if (!shareData.userId || !shareData.connectionId) {
            throw new Error('Missing required share data fields');
        }

        return await Document.findOneAndUpdate(
            { docId },
            { 
                $push: { 
                    sharedWith: {
                        userId: shareData.userId,
                        connectionId: shareData.connectionId,
                        status: shareData.status || 'pending'
                }   
             } 
            },
            { new: true }
        ).exec();
    },

    getSharedDocuments: async ( connectionId) => {
        const filter = { 
            'sharedWith.connectionId': connectionId,
            'sharedWith.status': 'accepted',
            'sharedWith.expiresAt': { $gt: new Date() }
        };
    
         const result =  await Document.find(filter)
        .populate('sharedWith.userId', '-password') 
        .exec();

        console.log("Shared documents found:👜👜👜", result, connectionId);
        return result
    },

    getDocumentById: async (docId) => {
        console.log("Fetching document:", docId);

        const document = await Document.findOne({ docId })
        .select('docId docName url userId sharedWith documentType fileType createdAt updatedAt')
        // .populate('userId', 'firstName lastName') // Get user details
        // .populate('sharedWith.userId', 'firstName lastName') // Get shared users' details
        // .populate('sharedWith.connectionId', 'status') // Get connection status
        .lean()
        .exec();

        console.log("Repository - Document found:", {
            exists: !!document,
            docId: document?.docId,
            userId: document?.userId,
            sharedCount: document?.sharedWith?.length || 0
          });
      
        return document;
    },

    updateShareStatus: async (docId, userId, status) => {
        return await Document.findOneAndUpdate(
            { 
                docId,
                'sharedWith.userId': userId
            },
            { 
                $set: { 'sharedWith.$.status': status }
            },
            { new: true }
        ).exec();
    },

    revokeShare: async (docId, userId) => {
        return await Document.findOneAndUpdate(
            { 
                docId,
                'sharedWith.userId': userId
            },
            { 
                $set: { 'sharedWith.$.status': 'revoked' }
            },
            { new: true }
        ).exec();
    }

};

module.exports = documentRepo;