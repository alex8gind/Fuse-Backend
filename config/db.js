const mongoose = require('mongoose');

async function connectDB() {
        const conn = await mongoose.connect(process.env.DB_URL );
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn
}
module.exports = connectDB;

