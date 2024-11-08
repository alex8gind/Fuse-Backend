const mongoose = require('mongoose');

// mongoose.plugin(schema => {
//     schema.pre('find', function() {
//         this.populate({
//             path: 'senderId receiverId',
//             select: 'userId PId firstName lastName profilePicture isActive'
//         });
//     });
// });

async function connectDB() {
        const conn = await mongoose.connect(process.env.DB_URL );
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn
}
module.exports = connectDB;

