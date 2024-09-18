const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reportedUser: { type: String, ref: 'User', required: true },
    reportingUser: { type: String, ref: 'User', required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
    adminNotes: { type: String },
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;