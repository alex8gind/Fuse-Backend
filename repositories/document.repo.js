const Document = require('../models/document.model');
const User = require('../models/user.model');

const documentRepo = {
    createDocument: async (docData) => {
        const newDocument = new Document(docData);
        const savedDocument = await newDocument.save();
        return savedDocument;
    },

    getDocumentById: async (docId) => {
        console.log("🥶🥶🥶", docId);
        return await Document.findOne({docId}).exec();
    },

    getUserDocuments: async (userId) => {
        const documents = await Document.find({ userId }).exec();
        return documents
    },

    deleteDocument: async (docId, userId) => {
        console.log("🥶🥶🥶", docId, userId);
        const deletedDocument = await Document.findOneAndDelete({
            docId: docId,
            userId: userId
        }).exec();
        console.log("Deleted document:", deletedDocument);
        return deletedDocument;
    }
};

module.exports = documentRepo;