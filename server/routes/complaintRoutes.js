const express = require("express");
const router = express.Router();

const { createComplaint, getUserComplaints } = require("../controllers/complaintController");
const { protect } = require("../middleware/authMiddleware");

const { adminOnly } = require("../middleware/roleMiddleware");
const { getAllComplaints } = require("../controllers/complaintController");

const { updateComplaintStatus } = require("../controllers/complaintController");

const upload = require("../middleware/uploadMiddleware");
router.put("/:id", protect, adminOnly, updateComplaintStatus);
router.get("/", protect, adminOnly, getAllComplaints);

router.post("/", protect, upload.single("image"), createComplaint);

router.get("/my", protect, getUserComplaints);

module.exports = router;