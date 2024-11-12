const jwt = require('jsonwebtoken');
const { getUserById } = require('../repositories/auth.repo');

// Validating Access token:
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const route = req.path;
    
    console.log("ROUTE:", route);
    console.log("TOKEN:", token);

    if (!token) {
        return res.status(401).json({ error: 'Authentication failed', details: 'No token provided' });
    }
  
    try {
        let secret;
        let tokenType;

        // Determine which secret to use based on the token itself
        try {
            // Decode token without verification first to check its type
            const decoded = jwt.decode(token);
            console.log("Decoded token:", decoded);

            if (!decoded) {
                throw new Error('Invalid token format');
            }

            // Choose secret based on token type
            switch (decoded.tokenType) {
                case 'verification':
                    secret = process.env.VERIFICATION_TOKEN_SECRET;
                    tokenType = 'verification';
                    break;
                case 'access':
                    secret = process.env.ACCESS_TOKEN_SECRET;
                    tokenType = 'access';
                    break;
                default:
                    throw new Error('Invalid token type');
            }
            
        } catch (decodeError) {
            console.error('Token decode error:', decodeError);
            return res.status(401).json({ error: 'Authentication failed', details: 'Invalid token format' });
        }

        // Now verify the token with the correct secret
        const decoded = jwt.verify(token, secret);
        
        // For non-verification routes, ensure we're using an access token
        if (route !== '/verify-email' && tokenType !== 'access') {
            return res.status(403).json({ 
                error: 'Access denied', 
                details: 'Invalid token type for this route' 
            });
        }
        // console.log("🥶🥶🥶", decoded);
        const user = await getUserById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found 🥶🥶🥶' });
        }
  
        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        console.error('Error details:', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Authentication failed', 
                details: 'Token has expired' 
            });
        }
        return res.status(401).json({ 
            error: 'Authentication failed', 
            details: 'Invalid token' 
        });
    }
};

module.exports = {
    authMiddleware,
    requireScope: (scope) => (req, res, next) => {
        req.requiredScope = scope;
        next();
    }
};