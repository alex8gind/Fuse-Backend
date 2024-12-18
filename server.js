require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
// require('newrelic');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error.middleware');
const { initializeSocket } = require('./socketServer');
const winston = require('winston')

process.on('uncaughtException', (err) => {
  console.error('There was an uncaught exception', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});


const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `${timestamp} [${level}]: ${message}`
})


const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(), // Add colorization
    logFormat // Use custom log format
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Connect to DB:
connectDB().catch((error)=>{
  console.error(`Error: ${error.message}`);
  process.exit(1); // Exit process with failure
})

const whitelist = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://fuse-f3b7e.web.app'
]
// Middlewares:
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Import Routes:
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

// Create API router
const apiRouter = express.Router();

// Use Routes with API prefix:
apiRouter.use(authRoutes);
apiRouter.use(userRoutes);

// Apply API router to app
app.use('/api', apiRouter);

// Global error handler
app.use(errorHandler);


// Server:
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Initialize socket.io
const { io, notificationsNamespace } = initializeSocket(server);

// Make io available both globally and through app
app.set('io', io);
app.set('notificationsNamespace', notificationsNamespace);







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




