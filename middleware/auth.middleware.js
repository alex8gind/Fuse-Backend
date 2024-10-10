const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { getUserById } = require('../repositories/auth.repo');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication failed', details: 'No token provided' });
    }
  
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await getUserById(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
  
        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ error: 'Authentication failed', details: 'Token has expired' });
        }
        return res.status(403).json({ error: 'Authentication failed', details: 'Invalid token' });
    }
};

module.exports = {
    authMiddleware
};