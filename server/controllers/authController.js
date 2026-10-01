const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
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

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with default role
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user"   // ensures no accidental admin creation
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });

  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};


// ======================
// LOGIN USER (Supports email or username 'admin')
// ======================
exports.loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide username/email and password"
      });
    }

    email = email.trim().toLowerCase();
    if (email === "admin") {
      email = "admin@safai.org";
    }

    // Find user
    let user = await User.findOne({ email });

    // Auto-seed admin user if missing
    if (!user && email === "admin@safai.org" && password === "123456") {
      const hashedPassword = await bcrypt.hash("123456", 10);
      user = await User.create({
        name: "Municipal Admin",
        email: "admin@safai.org",
        password: hashedPassword,
        role: "admin"
      });
    }

    if (!user) {
      return res.status(401).json({
        message: "Invalid username/email or password"
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid username/email or password"
      });
    }

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      message: "Server error"
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

    let user = await User.findOne({ email });

    if (!user) {
      // Create user from Google profile
      const randomPassword = await bcrypt.hash(Math.random().toString(36) + "GAuth@2026", 10);
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        password: randomPassword,
        role: "user"
      });
    }

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: avatar || null,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(500).json({ message: "Google authentication failed" });
  }
};

// ======================
// CHANGE PASSWORD
// ======================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({ message: "Failed to update password" });
  }
};

