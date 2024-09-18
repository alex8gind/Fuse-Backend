const Document = require('../models/document.model');
const User = require('../models/user.model');

const documentRepo = {
    createDocument: async (documentData) => {
        const newDocument = new Document(documentData);
        const savedDocument = await newDocument.save();
        
        // Add document reference to user
        await User.findOneAndUpdate(
            { userId: documentData.userId },
            { $addToSet: { documents: savedDocument._id } }
        );

        return savedDocument;
    },

    getDocumentById: async (documentId) => {
        return await Document.findById(documentId).exec();
    },

    getUserDocuments: async (userId, skip, limit) => {
        const user = await User.findOne({ userId }).populate({
            path: 'documents',
            options: { skip, limit }
        }).exec();
        return user ? user.documents : [];
    },

    updateDocument: async (documentId, updateData) => {
        return await Document.findByIdAndUpdate(documentId, updateData, { new: true }).exec();
    },

    deleteDocument: async (documentId, userId) => {
        const deletedDocument = await Document.findByIdAndDelete(documentId).exec();
        
        // Remove document reference from user
        await User.findOneAndUpdate(
            { userId },
            { $pull: { documents: documentId } }
        );

        return deletedDocument;
    }
};

module.exports = documentRepo;