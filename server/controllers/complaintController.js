const Complaint = require("../models/Complaints");

// @desc Create Complaint
// @route POST /api/complaints
// @access Private
const createComplaint = async (req, res) => {
  try {
    const { imageUrl, wasteType, description, location } = req.body;

    const complaint = await Complaint.create({
      imageUrl,
      wasteType,
      description,
      location,
      reportedBy: req.user._id,
    });

    res.status(201).json(complaint);
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

//module.exports = { createComplaint };
//module.exports = { createComplaint, getUserComplaints };
module.exports = { createComplaint, getUserComplaints, getAllComplaints,updateComplaintStatus,};