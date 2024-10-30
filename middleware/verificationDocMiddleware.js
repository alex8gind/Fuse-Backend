const { getUserById } = require('../repositories/user.repo');

const verificationDocMiddleware = async (req, res, next) => {
    try {
        console.log('User ID:', req.user.userId);
        const user = await getUserById(req.user.userId);
        console.log('Found user:', user);
        
        if (!user.isPhoneOrEmailVerified) {
            return res.status(403).json({ 
                error: 'Please verify your email/phone first' 
            });
        }
        
        if (user.isVerified) {
            return res.status(403).json({ 
                error: 'Identity is already verified' 
            });
        }
        
        next();
    } catch (error) {
        console.error('Verification middleware error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { verificationDocMiddleware };