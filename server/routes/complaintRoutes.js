const express = require("express");
const router = express.Router();

const {
  createComplaint,
  getUserComplaints,
  getAllComplaints,
  updateComplaintStatus,
  deleteComplaint,   // ✅ Added properly
} = require("../controllers/complaintController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

/* ================= USER ROUTES ================= */

// Create complaint (with image upload)
router.post("/", protect, upload.single("image"), createComplaint);

// Get logged-in user's complaints
router.get("/my", protect, getUserComplaints);

/* ================= ADMIN ROUTES ================= */

// Get all complaints
router.get("/", protect, adminOnly, getAllComplaints);

// Update complaint status
router.put("/:id", protect, adminOnly, updateComplaintStatus);

// Delete complaint
router.delete("/:id", protect, adminOnly, deleteComplaint);

module.exports = router;
