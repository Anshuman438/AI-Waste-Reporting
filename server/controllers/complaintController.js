const Complaint = require("../models/Complaints");
const cloudinary = require("../config/cloudinary");
const classifyImage = require("../utils/aiClassifier");

// @desc Create Complaint
// @route POST /api/complaints
// @access Private
const createComplaint = async (req, res) => {
  try {
    const { description, location } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    cloudinary.uploader
      .upload_stream({ folder: "waste_reports" }, async (error, result) => {
        if (error) {
          return res.status(500).json({ message: "Image upload failed" });
        }

        //  AI CLASSIFICATION
        const aiResult = await classifyImage(result.secure_url);

        let wasteType = "unknown";

        if (aiResult && aiResult[0]) {
          wasteType = aiResult[0].label;
        }

        //  SAVE TO DATABASE
        const complaint = await Complaint.create({
          imageUrl: result.secure_url,
          wasteType: wasteType,
          description,
          location: JSON.parse(location),
          reportedBy: req.user._id,
        });

        res.status(201).json(complaint);
      })
      .end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      reportedBy: req.user._id,
    });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().populate(
      "reportedBy",
      "name email"
    );

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.status = status || complaint.status;

    const updatedComplaint = await complaint.save();

    res.json(updatedComplaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createComplaint,
  getUserComplaints,
  getAllComplaints,
  updateComplaintStatus,
};