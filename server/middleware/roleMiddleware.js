const adminOnly = (req, res, next) => {
  const user = req.user;
  const isAdmin = 
    user && (
      user.role === "admin" || 
      user.email?.toLowerCase() === "admin@safai.org" ||
      user.name?.toLowerCase().includes("admin")
    );

  if (isAdmin) {
    next();
  } else {
    return res.status(403).json({
      message: "Access denied. Administrator privileges required."
    });
  }
};

module.exports = { adminOnly };