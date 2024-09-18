const jwt = require('jsonwebtoken');

//Handles token verification for protected routes.

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication failed', details: 'No token provided' });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ error: 'Authentication failed', details: 'Token has expired' });
            }
            return res.status(403).json({ error: 'Authentication failed', details: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

module.exports = {
    authenticateToken
};