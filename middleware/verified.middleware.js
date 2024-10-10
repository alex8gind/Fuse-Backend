const isAccountVerifiedMiddleware = (req, res, next) => {
    if (req.user && req.user.isVerified) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied', details: 'Email not verified' });
    }
};

module.exports = {isAccountVerifiedMiddleware};