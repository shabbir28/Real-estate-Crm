const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    console.log("--- Auth Middleware ---");
    console.log("Path:", req.path);
    console.log("Token present:", !!token);

    if (!token) {
      console.log("No token provided");
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded successfully for user ID:", decoded.id);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or user not found.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

const adminAuth = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin rights required.",
    });
  }
  next();
};

const agentOrAdminAuth = (req, res, next) => {
  if (!["admin", "agent"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Agent or Admin rights required.",
    });
  }
  next();
};

module.exports = { auth, adminAuth, agentOrAdminAuth };
