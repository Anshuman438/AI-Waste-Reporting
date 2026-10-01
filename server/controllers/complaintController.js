const Complaint = require("../models/Complaints");
const cloudinary = require("../config/cloudinary");
const {
  tidbInsertComplaint,
  tidbGetAllComplaints,
  tidbGetUserComplaints,
  tidbUpdateComplaintStatus,
  tidbDeleteComplaint
} = require("../config/tidb");

// Server memory fallback cache
let inMemoryComplaints = [];

// ======================
// CREATE COMPLAINT
// ======================
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
          console.warn("Cloudinary upload note:", cloudErr.message);
          imageUrl = `data:${req.file.mimetype || 'image/jpeg'};base64,${req.file.buffer.toString("base64")}`;
        }
      } else {
        imageUrl = `data:${req.file.mimetype || 'image/jpeg'};base64,${req.file.buffer.toString("base64")}`;
      }
    }

    let parsedLocation = { lat: 22.5726, lng: 88.3639, address: "Reported Civic Area" };
    if (location) {
      try {
        parsedLocation = typeof location === "string" ? JSON.parse(location) : location;
      } catch (e) {
        parsedLocation = { lat: 22.5726, lng: 88.3639, address: "Reported Civic Area" };
      }
    }

    const reporterId = req.user?._id || req.user?.id || "user-" + Date.now();
    const reporterName = req.user?.name || "Citizen Reporter";
    const reporterEmail = req.user?.email || "citizen@safai.org";

    let savedComplaint = null;

    // 1. Save to TiDB Cloud
    try {
      const tidbResult = await tidbInsertComplaint({
        imageUrl,
        wasteType: wasteType || "plastic",
        description: description || "Civic waste reported via safAI.",
        lat: parsedLocation.lat,
        lng: parsedLocation.lng,
        locationName: parsedLocation.address || "Reported Location",
        status: "pending",
        reported_by_id: reporterId,
        reported_by_name: reporterName,
        reported_by_email: reporterEmail,
      });
      if (tidbResult) {
        savedComplaint = tidbResult;
      }
    } catch (tidbErr) {
      console.warn("TiDB complaint save note:", tidbErr.message);
    }

    // 2. Save to MongoDB
    try {
      const mongoResult = await Complaint.create({
        imageUrl,
        wasteType: wasteType || "plastic",
        description: description || "Civic waste reported via safAI.",
        location: parsedLocation,
        reportedBy: reporterId,
        status: "pending"
      });
      if (!savedComplaint && mongoResult) {
        savedComplaint = mongoResult;
      }
    } catch (mongoErr) {
      console.warn("MongoDB complaint save note:", mongoErr.message);
    }

    // 3. Fallback memory store
    if (!savedComplaint) {
      savedComplaint = {
        _id: "comp-" + Date.now(),
        id: "comp-" + Date.now(),
        imageUrl,
        wasteType: wasteType || "plastic",
        description: description || "Civic waste reported via safAI.",
        location: parsedLocation,
        status: "pending",
        reportedBy: {
          _id: reporterId,
          name: reporterName,
          email: reporterEmail
        },
        createdAt: new Date().toISOString()
      };
    }

    // Keep memory cache updated
    inMemoryComplaints.unshift(savedComplaint);

    console.log("✅ Waste complaint created successfully:", savedComplaint._id || savedComplaint.id);
    return res.status(201).json(savedComplaint);

  } catch (error) {
    console.error("Create Complaint Error:", error);
    return res.status(500).json({
      message: "Failed to create complaint: " + (error.message || "Server error")
    });
  }
};


// ======================
// GET USER COMPLAINTS
// ======================
const getUserComplaints = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userEmail = req.user?.email;

    // 1. TiDB
    let complaints = await tidbGetUserComplaints(userEmail || userId);

    // 2. MongoDB
    if (!complaints || complaints.length === 0) {
      try {
        const mongoComplaints = await Complaint.find({
          reportedBy: userId,
        }).sort({ createdAt: -1 });

        if (mongoComplaints && mongoComplaints.length > 0) {
          complaints = mongoComplaints;
        }
      } catch (e) {}
    }

    // 3. Memory
    if (!complaints || complaints.length === 0) {
      complaints = inMemoryComplaints.filter(
        c => c.reportedBy?._id === userId || c.reportedBy?.email === userEmail
      );
    }

    return res.status(200).json(complaints || []);

  } catch (error) {
    console.error("Get User Complaints Error:", error);
    return res.status(500).json({ message: "Server error retrieving user complaints" });
  }
};


// ======================
// ADMIN: GET ALL COMPLAINTS (FETCHES DIRECTLY TO ADMIN PORTAL)
// ======================
const getAllComplaints = async (req, res) => {
  try {
    let allComplaints = [];

    // 1. Query TiDB Cloud
    try {
      const tidbRows = await tidbGetAllComplaints();
      if (tidbRows && Array.isArray(tidbRows)) {
        allComplaints.push(...tidbRows);
      }
    } catch (e) {
      console.warn("TiDB fetch all note:", e.message);
    }

    // 2. Query MongoDB
    try {
      const mongoComplaints = await Complaint.find()
        .populate("reportedBy", "name email")
        .sort({ createdAt: -1 });

      if (mongoComplaints && Array.isArray(mongoComplaints)) {
        for (const mc of mongoComplaints) {
          const exists = allComplaints.some(c => String(c.id || c._id) === String(mc._id));
          if (!exists) {
            allComplaints.push(mc);
          }
        }
      }
    } catch (e) {}

    // 3. Include memory items
    for (const mem of inMemoryComplaints) {
      const exists = allComplaints.some(c => String(c.id || c._id) === String(mem.id || mem._id));
      if (!exists) {
        allComplaints.push(mem);
      }
    }

    // Sort newest first
    allComplaints.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.status(200).json(allComplaints);

  } catch (error) {
    console.error("Get All Complaints Error:", error);
    return res.status(500).json({ message: "Server error fetching complaints" });
  }
};


// ======================
// ADMIN: UPDATE STATUS
// ======================
const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const complaintId = req.params.id;

    // Update in TiDB
    await tidbUpdateComplaintStatus(complaintId, status);

    // Update in MongoDB
    try {
      const complaint = await Complaint.findById(complaintId);
      if (complaint) {
        complaint.status = status || complaint.status;
        await complaint.save();
      }
    } catch (e) {}

    // Update in Memory
    const memItem = inMemoryComplaints.find(c => String(c._id || c.id) === String(complaintId));
    if (memItem) {
      memItem.status = status;
    }

    return res.status(200).json({
      message: "Complaint status updated successfully",
      id: complaintId,
      status
    });

  } catch (error) {
    console.error("Update Complaint Error:", error);
    return res.status(500).json({ message: "Server error updating status" });
  }
};


// ======================
// DELETE COMPLAINT
// ======================
const deleteComplaint = async (req, res) => {
  try {
    const complaintId = req.params.id;

    // Delete in TiDB
    await tidbDeleteComplaint(complaintId);

    // Delete in MongoDB
    try {
      await Complaint.findByIdAndDelete(complaintId);
    } catch (e) {}

    // Delete in Memory
    inMemoryComplaints = inMemoryComplaints.filter(c => String(c._id || c.id) !== String(complaintId));

    return res.status(200).json({
      message: "Complaint removed successfully"
    });

  } catch (error) {
    console.error("Delete Complaint Error:", error);
    return res.status(500).json({ message: "Server error deleting complaint" });
  }
};


module.exports = {
  createComplaint,
  getUserComplaints,
  getAllComplaints,
  updateComplaintStatus,
  deleteComplaint,
};
