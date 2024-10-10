const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, default: 'user_pid' },
    counter: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;

async function getNextPId() {
    const counter = await Counter.findOneAndUpdate(
        { name: 'user_pid' },
        { $inc: { counter: 1 } },
        { new: true, upsert: true }
    );
    return `P${counter.counter.toString().padStart(3, '0')}`;
}

module.exports.getNextPId = getNextPId;