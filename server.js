require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
require('newrelic');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error.middleware');

// Connect to DB:
connectDB();

// Middlewares:
app.use(cors());
app.use(express.json());

// Import Routes:
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

// Create API router
const apiRouter = express.Router();

// Use Routes with API prefix:
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);

// Apply API router to app
app.use('/api', apiRouter);

// Global error handler
app.use(errorHandler);

// Server:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});






// //Using New Relic
// const sessionSchema = new mongoose.Schema({

// });

// const Session = mongoose.model('Session', sessionSchema);

// const userSchema = new mongoose.Schema({

// });

// const User = mongoose.model('User', userSchema);

// app.post("/api/login", async (req, res) => {
//   req.ip
//   req.headers['user-agent']

//   const { username, password, deviceInfo, location } = req.body
//   try{
//     const foundUser = await User.findOne({username: username}).exec()
//     //in Reality we use BCrypt to compare hashes
//     if(!foundUser || foundUser.password !== password) return res.status(401).json({message: "Wrong Credentials"})
  
//       const tocken = jwt.sign({userId:foundUser.userId, tocken_version: foundUser.tocken_version}, "the_secret_key")
//       const newSession = new Session({
//         deviceInfo,
//         location,
//         tocken
//       })

//       newSession.save()

//       res.json({message: "Logged in successfully", tocken})
//     } 
//   catch(err){

//   }
// })




