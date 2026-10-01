const express = require("express");
const router = express.Router();

const {
  createComplaint,
  getUserComplaints,
  getAllComplaints,
  updateComplaintStatus,
  deleteComplaint,
} = require("../controllers/complaintController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Safe upload wrapper for multipart or JSON payloads
const safeUpload = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    return next();
  }

  upload.single("image")(req, res, (err) => {
    if (err) {
      console.warn("Upload middleware warning:", err.message);
      return next();
    }
    next();
  });
};

/* ================= USER ROUTES ================= */

router.post("/", protect, safeUpload, createComplaint);

router.get("/my", protect, getUserComplaints);

router.delete("/:id", protect, deleteComplaint);

/* ================= ADMIN ROUTES ================= */

router.get("/", protect, adminOnly, getAllComplaints);

router.put("/:id/status", protect, adminOnly, updateComplaintStatus);

module.exports = router;
