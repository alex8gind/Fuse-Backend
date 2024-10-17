const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    token: { type: String, required: true, unique: true }
  
}, { timestamps: true });

// Index for faster queries
tokenSchema.index({ userId: 1, token: 1 });

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;