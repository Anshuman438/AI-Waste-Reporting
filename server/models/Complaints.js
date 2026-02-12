const mongoose = require("mongoose");

const complaintSchema = mongoose.Schema(
  {
    imageUrl: {
      type: String,
    },
    wasteType: {
      type: String,
    },
    description: {
      type: String,
    },
    location: {
      lat: Number,
      lng: Number,
    },
    status: {
      type: String,
      default: "pending",
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Complaint", complaintSchema);