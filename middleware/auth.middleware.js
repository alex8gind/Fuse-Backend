const jwt = require('jsonwebtoken');
const { getUserById } = require('../repositories/auth.repo');

// Validating Access token:
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const route = req.path;
    
    console.error("ROUTE:", route);
    console.error("TOKEN:", token);
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

         // Check if the token has the required scope
        if ( route !== '/verify-email' && decoded.scope === 'verification' ) {
            return res.status(403).json({ error: 'Access denied. Token is out of scope' });
        }
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Authentication failed', details: 'Access token has expired' });
        }
        return res.status(401).json({ error: 'Authentication failed', details: 'Invalid token' });
    }
};

const requireScope = (scope) => (req, res, next) => {
    req.requiredScope = scope;
    next();
};


module.exports = {
    authMiddleware,
    requireScope
};