const checkUserAuthorization = (req, res, next) => {
    if (req.user.userId !== req.params.userId || !req.user.isAdmin) {
        return res.status(403).json({ message: "You are not authorized to perform this action" });
    }
    next();
};

module.exports = {
    checkUserAuthorization
};