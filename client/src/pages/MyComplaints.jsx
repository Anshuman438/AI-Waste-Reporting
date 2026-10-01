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
import { fetchUserComplaintsService } from "../services/tidbService";

const MyComplaints = () => {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();

    // Auto-refresh when new complaint is reported
    const handleSync = () => {
      fetchData(true);
    };

    window.addEventListener("new_complaint_reported", handleSync);
    window.addEventListener("storage", handleSync);

    const interval = setInterval(() => {
      fetchData(true);
    }, 4000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("new_complaint_reported", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userEmail = currentUser.email || "";

      const userReports = await fetchUserComplaintsService(token, userEmail);

      if (Array.isArray(userReports)) {
        setComplaints(userReports);
      }
    } catch (error) {
      console.log("Fetching user complaints note:", error.message);
    } finally {
      if (!isBackground) setLoading(false);
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
