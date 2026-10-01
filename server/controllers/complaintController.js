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
    const { wasteType, description, location, image: bodyImage, imageUrl: bodyImageUrl } = req.body;

    let imageUrl = bodyImageUrl || bodyImage || "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80";

    // Handle Multipart file upload
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
          imageUrl = `data:${req.file.mimetype || 'image/jpeg'};base64,${req.file.buffer.toString("base64")}`;
        }
      } else {
        imageUrl = `data:${req.file.mimetype || 'image/jpeg'};base64,${req.file.buffer.toString("base64")}`;
      }
    }

    // Parse coordinates & location
    let parsedLocation = { lat: 22.5726, lng: 88.3639, address: "Civic Reported Area" };
    if (location) {
      try {
        parsedLocation = typeof location === "string" ? JSON.parse(location) : location;
      } catch (e) {
        parsedLocation = { lat: 22.5726, lng: 88.3639, address: "Civic Reported Area" };
      }
    }

    const reporterId = req.user?._id || req.user?.id || req.headers["x-user-id"] || "usr-" + Date.now();
    const reporterName = req.user?.name || req.body?.reportedByName || "Citizen Reporter";
    const reporterEmail = (req.user?.email || req.headers["x-user-email"] || req.body?.reportedByEmail || "citizen@safai.org").toLowerCase().trim();

    let savedComplaint = null;

    // 1. Insert into TiDB Cloud Serverless
    try {
      const tidbResult = await tidbInsertComplaint({
        imageUrl,
        wasteType: wasteType || "mixed",
        description: description || "Civic waste reported via safAI.",
        lat: parsedLocation.lat,
        lng: parsedLocation.lng,
        locationName: parsedLocation.address || "Civic Location",
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

    // 2. Insert into MongoDB if available
    try {
      if (Complaint && Complaint.create) {
        const mongoResult = await Complaint.create({
          imageUrl,
          wasteType: wasteType || "mixed",
          description: description || "Civic waste reported via safAI.",
          location: parsedLocation,
          reportedBy: reporterId,
          status: "pending"
        });
        if (!savedComplaint && mongoResult) {
          savedComplaint = {
            _id: String(mongoResult._id),
            id: String(mongoResult._id),
            imageUrl,
            wasteType: mongoResult.wasteType,
            description: mongoResult.description,
            location: parsedLocation,
            status: "pending",
            reportedBy: {
              _id: reporterId,
              name: reporterName,
              email: reporterEmail
            },
            createdAt: mongoResult.createdAt || new Date().toISOString()
          };
        }
      }
    } catch (mongoErr) {
      console.warn("MongoDB complaint save note:", mongoErr.message);
    }

    // 3. Fallback to memory item
    if (!savedComplaint) {
      savedComplaint = {
        _id: "comp-" + Date.now(),
        id: "comp-" + Date.now(),
        imageUrl,
        wasteType: wasteType || "mixed",
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

    inMemoryComplaints.unshift(savedComplaint);
    console.log(`✅ Complaint recorded for [${reporterEmail}]: ${savedComplaint._id || savedComplaint.id}`);

    return res.status(201).json(savedComplaint);

  } catch (error) {
    console.error("Create Complaint Error:", error);
    return res.status(500).json({
      message: "Failed to create complaint: " + (error.message || "Server error")
    });
  }
};


// ======================
// GET LOGGED-IN USER COMPLAINTS (MY REPORTS)
// ======================
const getUserComplaints = async (req, res) => {
  try {
    const userId = String(req.user?._id || req.user?.id || req.headers["x-user-id"] || "");
    const userEmail = (req.user?.email || req.headers["x-user-email"] || "").toLowerCase().trim();

    let userComplaints = [];

    // 1. TiDB Cloud
    try {
      const tidbRows = await tidbGetUserComplaints(userEmail || userId);
      if (tidbRows && Array.isArray(tidbRows)) {
        userComplaints.push(...tidbRows);
      }
    } catch (e) {
      console.warn("TiDB GetUserComplaints note:", e.message);
    }

    // 2. MongoDB
    try {
      if (Complaint && Complaint.find) {
        const mongoRows = await Complaint.find({
          $or: [
            { reportedBy: userId },
            { "reportedBy.email": userEmail }
          ]
        }).sort({ createdAt: -1 });

        if (mongoRows && Array.isArray(mongoRows)) {
          for (const m of mongoRows) {
            const exists = userComplaints.some(c => String(c.id || c._id) === String(m._id));
            if (!exists) {
              userComplaints.push({
                _id: String(m._id),
                id: String(m._id),
                imageUrl: m.imageUrl,
                wasteType: m.wasteType,
                description: m.description,
                location: m.location,
                status: m.status,
                reportedBy: {
                  _id: userId,
                  name: req.user?.name || "Citizen Reporter",
                  email: userEmail
                },
                createdAt: m.createdAt
              });
            }
          }
        }
      }
    } catch (e) {}

    // 3. Memory fallback
    for (const mem of inMemoryComplaints) {
      const matches = 
        (mem.reportedBy?.email && mem.reportedBy.email.toLowerCase() === userEmail) ||
        (mem.reportedBy?._id && String(mem.reportedBy._id) === userId) ||
        !userEmail; // If unauthenticated query, return memory queue

      if (matches) {
        const exists = userComplaints.some(c => String(c.id || c._id) === String(mem.id || mem._id));
        if (!exists) {
          userComplaints.push(mem);
        }
      }
    }

    // Sort newest first
    userComplaints.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.status(200).json(userComplaints);

  } catch (error) {
    console.error("Get User Complaints Error:", error);
    return res.status(500).json({ message: "Server error retrieving user complaints" });
  }
};


// ======================
// ADMIN: GET ALL COMPLAINTS
// ======================
const getAllComplaints = async (req, res) => {
  try {
    let allComplaints = [];

    // 1. TiDB Cloud
    try {
      const tidbRows = await tidbGetAllComplaints();
      if (tidbRows && Array.isArray(tidbRows)) {
        allComplaints.push(...tidbRows);
      }
    } catch (e) {
      console.warn("TiDB GetAllComplaints note:", e.message);
    }

    // 2. MongoDB
    try {
      if (Complaint && Complaint.find) {
        const mongoComplaints = await Complaint.find()
          .populate("reportedBy", "name email")
          .sort({ createdAt: -1 });

        if (mongoComplaints && Array.isArray(mongoComplaints)) {
          for (const mc of mongoComplaints) {
            const exists = allComplaints.some(c => String(c.id || c._id) === String(mc._id));
            if (!exists) {
              allComplaints.push({
                _id: String(mc._id),
                id: String(mc._id),
                imageUrl: mc.imageUrl,
                wasteType: mc.wasteType,
                description: mc.description,
                location: mc.location,
                status: mc.status,
                reportedBy: {
                  _id: mc.reportedBy?._id,
                  name: mc.reportedBy?.name || "Citizen Reporter",
                  email: mc.reportedBy?.email || "citizen@safai.org"
                },
                createdAt: mc.createdAt
              });
            }
          }
        }
      }
    } catch (e) {}

    // 3. Memory fallback
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
    return res.status(500).json({ message: "Server error retrieving complaints" });
  }
};


// ======================
// UPDATE COMPLAINT STATUS (ADMIN)
// ======================
const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["pending", "in-progress", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value. Must be pending, in-progress, or resolved." });
    }

    // 1. Update in TiDB
    try {
      await tidbUpdateComplaintStatus(id, status);
    } catch (e) {}

    // 2. Update in MongoDB
    try {
      if (Complaint && Complaint.findByIdAndUpdate) {
        await Complaint.findByIdAndUpdate(id, { status });
      }
    } catch (e) {}

    // 3. Update in memory cache
    inMemoryComplaints = inMemoryComplaints.map(c => 
      (c._id === id || c.id === id) ? { ...c, status } : c
    );

    return res.status(200).json({
      message: `Complaint status successfully updated to ${status}`,
      id,
      status
    });

  } catch (error) {
    console.error("Update Status Error:", error);
    return res.status(500).json({ message: "Server error updating complaint status" });
  }
};


// ======================
// DELETE COMPLAINT
// ======================
const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Delete from TiDB
    try {
      await tidbDeleteComplaint(id);
    } catch (e) {}

    // 2. Delete from MongoDB
    try {
      if (Complaint && Complaint.findByIdAndDelete) {
        await Complaint.findByIdAndDelete(id);
      }
    } catch (e) {}

    // 3. Delete from memory cache
    inMemoryComplaints = inMemoryComplaints.filter(c => c._id !== id && c.id !== id);

    return res.status(200).json({ message: "Complaint deleted successfully", id });

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
