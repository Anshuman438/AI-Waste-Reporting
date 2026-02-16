const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ======================
// PROTECT MIDDLEWARE
// ======================
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if Authorization header exists
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // If no token found
    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token"
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Find user from DB
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    // Attach user to request
    req.user = user;

    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({
      message: "Not authorized, token invalid"
    });
  }
};

module.exports = { protect };
