const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/socket.io'
  });

  // Create notifications namespace
  const notificationsNamespace = io.of('/notifications');

  // Authentication middleware for notifications namespace
  notificationsNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      console.log('Socket authentication attempt:', {
        hasToken: !!token,
        clientId: socket.id
      });

      if (!token) {
        console.log('Authentication failed: No token provided');
        return next(new Error('Authentication token missing'));
      }

      try {
        // Verify token using your existing JWT verification
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        socket.userId = decoded.userId;
        
        console.log('User authenticated:', {
          userId: decoded.userId,
          socketId: socket.id
        });

        // Join user to their personal room
        socket.join(decoded.userId.toString());
        console.log(`User ${decoded.userId} joined room ${decoded.userId.toString()}`);
        
        next();
      } catch (error) {
        console.error('Token verification failed:', error);
        next(new Error('Authentication failed'));
      }
    } catch (error) {
      console.error('Socket middleware error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Handle connections to notifications namespace
  notificationsNamespace.on('connection', (socket) => {
    console.log('New client connected:', {
      socketId: socket.id,
      userId: socket.userId,
      rooms: Array.from(socket.rooms)
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', {
        socketId: socket.id,
        userId: socket.userId,
        reason
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error for client:', {
        socketId: socket.id,
        userId: socket.userId,
        error
      });
    });

    // Debug: Log all events
    socket.onAny((eventName, ...args) => {
      console.log('Event received:', {
        event: eventName,
        socketId: socket.id,
        userId: socket.userId,
        args
      });
    });
  });

  // Add debug method to check connected clients
  notificationsNamespace.fetchSockets().then(sockets => {
    console.log('Connected clients:', sockets.map(socket => ({
      id: socket.id,
      userId: socket.userId,
      rooms: Array.from(socket.rooms)
    })));
  });

  return { io, notificationsNamespace };
};

module.exports = { initializeSocket };