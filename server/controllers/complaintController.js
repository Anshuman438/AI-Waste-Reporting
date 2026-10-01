const Complaint = require("../models/Complaints");
const cloudinary = require("../config/cloudinary");


// CREATE COMPLAINT
const createComplaint = async (req, res) => {
  try {
    const { wasteType, description, location } = req.body;

    let imageUrl = "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80";

    if (req.file) {
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
        try {
          const uploadPromise = new Promise((resolve, reject) => {
            cloudinary.uploader
              .upload_stream({ folder: "waste_reports" }, (err, result) => {
                if (err) reject(err);
                else resolve(result.secure_url);
              })
              .end(req.file.buffer);
          });
          imageUrl = await uploadPromise;
        } catch (cloudErr) {
          console.warn("Cloudinary upload failed, falling back to data URI:", cloudErr.message);
          imageUrl = `data:${req.file.mimetype || 'image/jpeg'};base64,${req.file.buffer.toString("base64")}`;
        }
      } else {
        // Base64 storage fallback when Cloudinary is unconfigured
        imageUrl = `data:${req.file.mimetype || 'image/jpeg'};base64,${req.file.buffer.toString("base64")}`;
      }
    }

    let parsedLocation = { lat: 22.5726, lng: 88.3639 };
    if (location) {
      try {
        parsedLocation = typeof location === "string" ? JSON.parse(location) : location;
      } catch (e) {
        parsedLocation = { lat: 22.5726, lng: 88.3639 };
      }
    }

    const complaint = await Complaint.create({
      imageUrl,
      wasteType: wasteType || "plastic",
      description: description || "Civic waste reported via safAI mobile/web interface.",
      location: parsedLocation,
      reportedBy: req.user?._id,
    });

    return res.status(201).json(complaint);

  } catch (error) {
    console.error("Create Complaint Error:", error);
    return res.status(500).json({
      message: "Failed to create complaint: " + (error.message || "Server error")
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
