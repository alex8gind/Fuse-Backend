const User = require('../models/user.model');

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (user && user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "Access denied. Admin rights required." });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = isAdmin;