import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  FiTrash2, 
  FiMapPin, 
  FiCalendar, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiPlus,
  FiFilter,
  FiX,
  FiTruck,
  FiAward,
  FiArrowLeft
} from "react-icons/fi";
import { LuLeaf, LuSparkles, LuCrown } from "react-icons/lu";
import "./MyComplaints.css";

import { API } from "../config/api";

// High quality initial user reports
const defaultUserComplaints = [
  {
    _id: "usr-c1",
    wasteType: "plastic",
    description: "Discarded plastic packaging and water bottles piled outside cafeteria recycling dock.",
    imageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80",
    status: "in-progress",
    location: { lat: 22.5726, lng: 88.3639 },
    locationName: "Campus Canteen East Walkway",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    aiConfidence: 96,
    xpReward: 50
  },
  {
    _id: "usr-c2",
    wasteType: "metal",
    description: "Crushed soda beverage cans and snack wrappers left near the main football pavilion.",
    imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop&q=80",
    status: "pending",
    location: { lat: 22.5801, lng: 88.3752 },
    locationName: "Sports Complex Pavilion Zone",
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    aiConfidence: 92,
    xpReward: 50
  },
  {
    _id: "usr-c3",
    wasteType: "biodegradable",
    description: "Fallen tree branches and food box waste accumulated after weekend sports meet.",
    imageUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=500&auto=format&fit=crop&q=80",
    status: "resolved",
    location: { lat: 22.5675, lng: 88.3512 },
    locationName: "Botanical Path Lawn B",
    createdAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    aiConfidence: 95,
    xpReward: 50
  }
];

const MyComplaints = () => {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState(() => {
    const saved = localStorage.getItem("user_complaints_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return defaultUserComplaints;
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    localStorage.setItem("user_complaints_data", JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API}/api/complaints/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setComplaints(res.data);
      }
    } catch (error) {
      console.log("Using cached/demo civic reports for current citizen");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteComplaint = async () => {
    if (!deleteModalId) return;
    setDeleting(true);

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/api/complaints/${deleteModalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      // Handled locally
    }

    setComplaints((prev) =>
      prev.filter((complaint) => complaint._id !== deleteModalId)
    );
    setDeleteModalId(null);
    setDeleting(false);
  };

  const getStatusBadge = (status) => {
    if (status === "resolved") {
      return (
        <span className="royal-badge-status status-resolved">
          <FiCheckCircle size={13} />
          <span>Resolved & Cleared</span>
        </span>
      );
    }
    if (status === "in-progress") {
      return (
        <span className="royal-badge-status status-in-progress">
          <FiTruck size={13} />
          <span>Cleaning in Progress</span>
        </span>
      );
    }
    return (
      <span className="royal-badge-status status-pending">
        <FiClock size={13} />
        <span>Pending Triage</span>
      </span>
    );
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return c.status === "pending";
    if (activeTab === "in-progress") return c.status === "in-progress";
    if (activeTab === "resolved") return c.status === "resolved";
    return true;
  });

  const formatDate = (isoString) => {
    if (!isoString) return "Recently";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPoints = complaints.length * 50;

  return (
    <div className="my-complaints-royal-root">
      <div className="my-complaints-container">
        
        {/* Top Header Row */}
        <div className="my-complaints-header">
          <div className="header-left-col">
            <div className="header-top-tag-row">
              <button 
                type="button" 
                className="btn-back-home"
                onClick={() => navigate("/")}
              >
                <FiArrowLeft size={15} />
                <span>Back to Home</span>
              </button>
            </div>

            <h1 className="royal-complaints-title">My Waste Reports</h1>
            <p className="royal-complaints-sub">
              Live inspection timeline, GPS tracking, and municipal cleanup status for your civic reports.
            </p>
          </div>

          <div className="header-right-col">
            <button 
              type="button" 
              className="btn-royal-new-report"
              onClick={() => navigate("/report")}
            >
              <FiPlus size={18} />
              <span>Report New Waste Spot</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs Bar */}
        <div className="complaints-filter-bar">
          <div className="filter-tab-group">
            <button 
              type="button"
              className={`filter-pill-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              <span>All Reports</span>
              <span className="tab-count-bubble">{complaints.length}</span>
            </button>
            <button 
              type="button"
              className={`filter-pill-btn ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              <span>⏳ Pending</span>
              <span className="tab-count-bubble">
                {complaints.filter(c => c.status === "pending").length}
              </span>
            </button>
            <button 
              type="button"
              className={`filter-pill-btn ${activeTab === "in-progress" ? "active" : ""}`}
              onClick={() => setActiveTab("in-progress")}
            >
              <span>🚚 In Progress</span>
              <span className="tab-count-bubble">
                {complaints.filter(c => c.status === "in-progress").length}
              </span>
            </button>
            <button 
              type="button"
              className={`filter-pill-btn ${activeTab === "resolved" ? "active" : ""}`}
              onClick={() => setActiveTab("resolved")}
            >
              <span>✅ Resolved</span>
              <span className="tab-count-bubble">
                {complaints.filter(c => c.status === "resolved").length}
              </span>
            </button>
          </div>
        </div>

        {/* Cards Grid or Empty State */}
        {loading ? (
          <div className="loading-grid">
            {[1, 2, 3].map((n) => (
              <div key={n} className="complaint-skeleton-card">
                <div className="skeleton-img"></div>
                <div className="skeleton-content">
                  <div className="skeleton-line short"></div>
                  <div className="skeleton-line medium"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredComplaints.length === 0 ? (
          /* Cozy Empty State Card */
          <div className="empty-complaints-card animate-fade-in">
            <div className="empty-icon-circle">
              <LuLeaf size={34} />
            </div>
            <h3>No reports found in this tab</h3>
            <p>
              {activeTab === "all"
                ? "You haven't submitted any civic waste reports yet. Snap a photo to clean your campus and earn XP!"
                : `You currently have 0 complaints with status '${activeTab}'.`}
            </p>
            <button 
              type="button"
              className="btn-royal-new-report"
              onClick={() => navigate("/report")}
            >
              <FiPlus size={18} />
              <span>Submit Your First Report</span>
            </button>
          </div>
        ) : (
          /* Complaint Cards Grid */
          <div className="complaints-cards-grid">
            {filteredComplaints.map((c) => (
              <div key={c._id} className="user-complaint-card animate-fade-in">
                
                {/* Top Image Preview */}
                <div className="complaint-img-wrap">
                  <img src={c.imageUrl} alt="Reported waste" className="complaint-card-img" />
                  <div className="badge-overlay">
                    <span className={`badge-category badge-${c.wasteType?.toLowerCase()}`}>
                      {c.wasteType ? (c.wasteType.charAt(0).toUpperCase() + c.wasteType.slice(1)) : "Civic"}
                    </span>
                  </div>
                  {c.aiConfidence && (
                    <div className="ai-conf-pill">
                      <span>⚡ {c.aiConfidence}% AI Conf.</span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="complaint-card-body">
                  
                  <div className="complaint-card-meta">
                    {getStatusBadge(c.status)}
                    <span className="report-time">
                      <FiCalendar size={12} /> {formatDate(c.createdAt)}
                    </span>
                  </div>

                  <h3 className="complaint-type-title">
                    {c.wasteType ? `${c.wasteType.charAt(0).toUpperCase() + c.wasteType.slice(1)} Waste Spot` : "Civic Waste Complaint"}
                  </h3>

                  <p className="complaint-desc-text">
                    {c.description && c.description.trim() !== ""
                      ? c.description
                      : "Photo submitted via mobile camera."}
                  </p>

                  {/* Location & GPS */}
                  {(c.locationName || c.location?.lat) && (
                    <div className="complaint-location-tag">
                      <FiMapPin size={13} className="pin-icon" />
                      <span>{c.locationName || `${c.location.lat.toFixed(4)}, ${c.location.lng.toFixed(4)}`}</span>
                    </div>
                  )}

                  {/* 3-Step Live Status Tracker */}
                  <div className="status-stepper-box">
                    <div className="stepper-labels">
                      <span className="active">Logged</span>
                      <span className={c.status === "in-progress" || c.status === "resolved" ? "active" : ""}>Dispatched</span>
                      <span className={c.status === "resolved" ? "active" : ""}>Cleared</span>
                    </div>
                    <div className="stepper-bar-track">
                      <div 
                        className="stepper-bar-fill"
                        style={{
                          width: c.status === "resolved" ? "100%" : c.status === "in-progress" ? "55%" : "15%"
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="complaint-card-actions">
                    <div className="xp-tag-pill">
                      <LuSparkles size={13} />
                      <span>+50 Eco XP</span>
                    </div>

                    <button 
                      type="button"
                      className="btn-delete-report"
                      onClick={() => setDeleteModalId(c._id)}
                      title="Remove complaint"
                    >
                      <FiTrash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalId && (
          <div className="modal-backdrop-overlay animate-fade-in">
            <div className="modal-dialog-box">
              <div className="modal-icon-danger">
                <FiAlertCircle size={28} />
              </div>
              <h3>Remove Waste Complaint?</h3>
              <p>
                Are you sure you want to delete this report from your activity log? This will remove it from your active tracking queue.
              </p>
              <div className="modal-btn-group">
                <button 
                  type="button"
                  className="btn-modal-cancel" 
                  onClick={() => setDeleteModalId(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="btn-modal-danger"
                  onClick={confirmDeleteComplaint}
                  disabled={deleting}
                >
                  {deleting ? "Removing..." : "Delete Report"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyComplaints;
