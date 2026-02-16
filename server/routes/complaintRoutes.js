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

/* ================= USER ROUTES ================= */

router.post("/", protect, upload.single("image"), createComplaint);

router.get("/my", protect, getUserComplaints);

router.delete("/:id", protect, deleteComplaint);

/* ================= ADMIN ROUTES ================= */

router.get("/", protect, adminOnly, getAllComplaints);

router.put("/:id/status", protect, adminOnly, updateComplaintStatus);

module.exports = router;
