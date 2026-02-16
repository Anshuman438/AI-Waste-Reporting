const Complaint = require("../models/Complaints");
const cloudinary = require("../config/cloudinary");


// CREATE COMPLAINT

const createComplaint = async (req, res) => {
  try {
    const { wasteType, description, location } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "No image uploaded"
      });
    }

    cloudinary.uploader
      .upload_stream(
        { folder: "waste_reports" },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            return res.status(500).json({
              message: "Image upload failed"
            });
          }

          const complaint = await Complaint.create({
            imageUrl: result.secure_url,
            wasteType,
            description,
            location: location ? JSON.parse(location) : {},
            reportedBy: req.user._id,
          });

          return res.status(201).json(complaint);
        }
      )
      .end(req.file.buffer);

  } catch (error) {
    console.error("Create Complaint Error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};



// GET LOGGED-IN USER COMPLAINTS

const getUserComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      reportedBy: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json(complaints);

  } catch (error) {
    console.error("Get User Complaints Error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};



// ADMIN: GET ALL COMPLAINTS

const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json(complaints);

  } catch (error) {
    console.error("Get All Complaints Error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};



// ADMIN: UPDATE STATUS
const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found"
      });
    }

    complaint.status = status || complaint.status;

    const updatedComplaint = await complaint.save();

    return res.status(200).json(updatedComplaint);

  } catch (error) {
    console.error("Update Complaint Error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};



// DELETE COMPLAINT

const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found"
      });
    }

    // Allow owner OR admin
    if (
      complaint.reportedBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Not authorized to delete this complaint"
      });
    }

    await complaint.deleteOne();

    return res.status(200).json({
      message: "Complaint removed successfully"
    });

  } catch (error) {
    console.error("Delete Complaint Error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};


module.exports = {
  createComplaint,
  getUserComplaints,
  getAllComplaints,
  updateComplaintStatus,
  deleteComplaint,
};
