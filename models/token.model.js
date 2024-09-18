const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: '7d' } // Token expires after 7 days
});

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;