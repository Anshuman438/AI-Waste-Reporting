const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { 
  tidbFindUserByEmail, 
  tidbCreateUser, 
  tidbUpdateUserPassword 
} = require("../config/tidb");

const JWT_SECRET = process.env.JWT_SECRET || "safai_super_secret_jwt_key_2026_green_future_984392472";

// Server memory cache for universal persistence if DBs are initializing
let inMemoryAdminPasswordHash = null;

// Helper to generate JWT Token
const generateToken = (id, email = "", role = "user") => {
  return jwt.sign(
    { id, email, role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ======================
// REGISTER USER
// ======================
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please provide all fields"
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check MongoDB
    let userExists = null;
    try {
      userExists = await User.findOne({ email: cleanEmail });
    } catch (e) {
      // MongoDB offline fallback
    }

    // Check TiDB
    if (!userExists) {
      try {
        userExists = await tidbFindUserByEmail(cleanEmail);
      } catch (e) {
        // TiDB fallback
      }
    }

    if (userExists) {
      return res.status(400).json({
        message: "User already exists with this email"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to TiDB
    let tidbUser = null;
    try {
      tidbUser = await tidbCreateUser({
        name,
        email: cleanEmail,
        password: hashedPassword,
        role: "user"
      });
    } catch (e) {
      console.warn("TiDB User save note:", e.message);
    }

    // Save to MongoDB
    let mongoUser = null;
    try {
      mongoUser = await User.create({
        name,
        email: cleanEmail,
        password: hashedPassword,
        role: "user"
      });
    } catch (e) {
      console.warn("MongoDB User save note:", e.message);
    }

    const userId = mongoUser?._id || tidbUser?.id || "user-" + Date.now();

    return res.status(201).json({
      _id: userId,
      name,
      email: cleanEmail,
      role: "user",
      token: generateToken(userId, cleanEmail, "user")
    });

  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      message: "Server error during registration"
    });
  }
};


// ======================
// LOGIN USER (Supports email or username 'admin')
// ======================
exports.loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide username/email and password"
      });
    }

    email = email.trim().toLowerCase();
    if (email === "admin") {
      email = "admin@safai.org";
    }

    let userPasswordHash = null;
    let foundUser = null;

    // 1. Check TiDB
    try {
      const tidbUser = await tidbFindUserByEmail(email);
      if (tidbUser) {
        foundUser = {
          _id: tidbUser.id,
          name: tidbUser.name,
          email: tidbUser.email,
          role: tidbUser.role,
        };
        userPasswordHash = tidbUser.password;
      }
    } catch (e) {
      // Ignored
    }

    // 2. Check MongoDB
    if (!foundUser) {
      try {
        const mongoUser = await User.findOne({ email });
        if (mongoUser) {
          foundUser = {
            _id: mongoUser._id,
            name: mongoUser.name,
            email: mongoUser.email,
            role: mongoUser.role,
          };
          userPasswordHash = mongoUser.password;
        }
      } catch (e) {
        // Ignored
      }
    }

    // 3. Admin auto-seed (Initial default password is 123456 ONLY if admin has never been created anywhere)
    if (!foundUser && email === "admin@safai.org") {
      const initialHash = inMemoryAdminPasswordHash || (await bcrypt.hash("123456", 10));
      
      try {
        await tidbCreateUser({
          name: "Municipal Admin",
          email: "admin@safai.org",
          password: initialHash,
          role: "admin"
        });
      } catch (e) {}

      try {
        await User.create({
          name: "Municipal Admin",
          email: "admin@safai.org",
          password: initialHash,
          role: "admin"
        });
      } catch (e) {}

      foundUser = {
        _id: "admin-master-id",
        name: "Municipal Admin",
        email: "admin@safai.org",
        role: "admin",
      };
      userPasswordHash = initialHash;
    }

    // Use in-memory admin hash override if set and user is admin
    if (email === "admin@safai.org" && inMemoryAdminPasswordHash) {
      userPasswordHash = inMemoryAdminPasswordHash;
    }

    if (!foundUser || !userPasswordHash) {
      return res.status(401).json({
        message: "Invalid username/email or password"
      });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, userPasswordHash);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid username/email or password"
      });
    }

    return res.status(200).json({
      _id: foundUser._id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
      token: generateToken(foundUser._id, foundUser.email, foundUser.role)
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      message: "Server error during login"
    });
  }
};

// ======================
// GOOGLE AUTH (OAUTH / ONE-TAP)
// ======================
exports.googleAuth = async (req, res) => {
  try {
    const { name, email, googleId, avatar } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Google email is required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = null;

    // Check TiDB
    try {
      user = await tidbFindUserByEmail(cleanEmail);
    } catch (e) {}

    // Check MongoDB
    if (!user) {
      try {
        user = await User.findOne({ email: cleanEmail });
      } catch (e) {}
    }

    if (!user) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36) + "GAuth@2026", 10);
      
      try {
        await tidbCreateUser({
          name: name || cleanEmail.split("@")[0],
          email: cleanEmail,
          password: randomPassword,
          role: "user",
          avatar
        });
      } catch (e) {}

      try {
        user = await User.create({
          name: name || cleanEmail.split("@")[0],
          email: cleanEmail,
          password: randomPassword,
          role: "user"
        });
      } catch (e) {}
    }

    const userId = user?._id || user?.id || ("google-" + (googleId || Date.now()));

    return res.status(200).json({
      _id: userId,
      name: name || user?.name || cleanEmail.split("@")[0],
      email: cleanEmail,
      role: user?.role || "user",
      avatar: avatar || null,
      token: generateToken(userId, cleanEmail, user?.role || "user")
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(500).json({ message: "Google authentication failed" });
  }
};

// ======================
// UNIVERSAL CHANGE PASSWORD
// ======================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userEmail = req.user?.email || "admin@safai.org";
    const userId = req.user?._id || req.user?.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    // 1. Retrieve current user hash from TiDB or MongoDB or cache
    let currentHash = inMemoryAdminPasswordHash;

    try {
      const tidbUser = await tidbFindUserByEmail(userEmail);
      if (tidbUser && tidbUser.password) {
        currentHash = tidbUser.password;
      }
    } catch (e) {}

    let mongoUser = null;
    try {
      mongoUser = await User.findOne({ email: userEmail });
      if (mongoUser && mongoUser.password && !currentHash) {
        currentHash = mongoUser.password;
      }
    } catch (e) {}

    // If still no hash and user is admin, default initial was 123456
    if (!currentHash && userEmail === "admin@safai.org") {
      currentHash = await bcrypt.hash("123456", 10);
    }

    if (currentHash) {
      const isMatch = await bcrypt.compare(currentPassword, currentHash);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password" });
      }
    }

    // 2. Hash new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Persist universally in TiDB Cloud
    try {
      await tidbUpdateUserPassword(userEmail, newHashedPassword);
    } catch (e) {
      console.warn("TiDB password update error:", e.message);
    }

    // 4. Persist universally in MongoDB
    try {
      if (mongoUser) {
        mongoUser.password = newHashedPassword;
        await mongoUser.save();
      } else {
        await User.updateOne({ email: userEmail }, { password: newHashedPassword });
      }
    } catch (e) {
      console.warn("MongoDB password update error:", e.message);
    }

    // 5. Update in-memory cache for admin
    if (userEmail === "admin@safai.org") {
      inMemoryAdminPasswordHash = newHashedPassword;
    }

    console.log(`🔐 Password universally updated for ${userEmail}`);
    return res.status(200).json({ message: "Password updated successfully and active universally!" });

  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({ message: "Failed to update password: " + error.message });
  }
};
