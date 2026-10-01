const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { tidbFindUserById, tidbFindUserByEmail } = require("../config/tidb");

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
    const secret = process.env.JWT_SECRET || "safai_super_secret_jwt_key_2026_green_future_984392472";
    const decoded = jwt.verify(token, secret);

    let user = null;

    // 1. Try finding in MongoDB if available
    try {
      if (User && User.findById) {
        user = await User.findById(decoded.id).select("-password");
      }
    } catch (e) {
      // Ignored for non-ObjectId or when MongoDB is offline
    }

    // 2. Try finding in TiDB if not found in Mongo
    if (!user) {
      try {
        const tidbUser = await tidbFindUserById(decoded.id) || (decoded.email ? await tidbFindUserByEmail(decoded.email) : null);
        if (tidbUser) {
          user = {
            _id: tidbUser.id,
            id: tidbUser.id,
            name: tidbUser.name,
            email: tidbUser.email,
            role: tidbUser.role,
            avatar: tidbUser.avatar,
          };
        }
      } catch (e) {
        // Ignored
      }
    }

    // 3. Fallback to decoded payload session
    if (!user && decoded.id) {
      user = {
        _id: decoded.id,
        id: decoded.id,
        name: decoded.name || "safAI User",
        email: decoded.email || "admin@safai.org",
        role: decoded.role || (decoded.email === "admin@safai.org" ? "admin" : "user"),
      };
    }

    if (!user) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({
      message: "Not authorized, token invalid or expired"
    });
  }
};

module.exports = { protect };
