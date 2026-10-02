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
import { fetchUserComplaintsService, deleteComplaintService } from "../services/tidbService";

const MyComplaints = () => {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();

    // Auto-refresh when new complaint is reported or updated
    const handleSync = () => {
      fetchData(true);
    };

    window.addEventListener("new_complaint_reported", handleSync);
    window.addEventListener("storage", handleSync);

    const interval = setInterval(() => {
      fetchData(true);
    }, 3500);

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
      await deleteComplaintService(deleteModalId, token);
    } catch (error) {
      // Handled locally
    }

    setComplaints((prev) =>
      prev.filter((complaint) => (complaint._id !== deleteModalId && complaint.id !== deleteModalId))
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
                <span>Home</span>
              </button>
              <div className="eco-xp-badge">
                <LuLeaf size={14} />
                <span>My Civic Reports</span>
              </div>
            </div>
            <h1 className="royal-complaints-title">Activity & History</h1>
            <p className="royal-complaints-sub">
              Live tracking of all civic waste incidents you've reported across the municipal network.
            </p>
          </div>

          <div className="header-right-col">
            <div className="points-summary-card animate-glow">
              <div className="points-icon-badge">
                <FiAward size={22} />
              </div>
              <div className="points-info">
                <div className="points-label">Total Green Points</div>
                <div className="points-num">
                  <span>{totalPoints}</span>
                  <span className="points-unit">XP</span>
                </div>
              </div>
            </div>

            <button 
              type="button" 
              className="btn-royal-new-report"
              onClick={() => navigate("/report")}
            >
              <FiPlus size={16} />
              <span>Report New Spot</span>
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
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
              <span>Pending</span>
              <span className="tab-count-bubble">
                {complaints.filter((c) => c.status === "pending").length}
              </span>
            </button>
            <button 
              type="button"
              className={`filter-pill-btn ${activeTab === "in-progress" ? "active" : ""}`}
              onClick={() => setActiveTab("in-progress")}
            >
              <span>In Progress</span>
              <span className="tab-count-bubble">
                {complaints.filter((c) => c.status === "in-progress").length}
              </span>
            </button>
            <button 
              type="button"
              className={`filter-pill-btn ${activeTab === "resolved" ? "active" : ""}`}
              onClick={() => setActiveTab("resolved")}
            >
              <span>Resolved</span>
              <span className="tab-count-bubble">
                {complaints.filter((c) => c.status === "resolved").length}
              </span>
            </button>
          </div>
        </div>

        {/* Complaints Grid Content */}
        {loading && complaints.length === 0 ? (
          <div className="complaints-loading-state">
            <div className="royal-spinner"></div>
            <p>Syncing civic reports with database...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="complaints-empty-card animate-fade-in">
            <div className="empty-icon-box">
              <FiTrash2 size={34} />
            </div>
            <h3>No reports found</h3>
            <p>
              {activeTab === "all" 
                ? "You haven't submitted any civic waste reports yet. Help keep your city clean by reporting a spot!" 
                : `No reports currently under the '${activeTab}' filter.`}
            </p>
            <button 
              type="button" 
              className="btn-empty-create"
              onClick={() => navigate("/report")}
            >
              <FiPlus size={16} />
              <span>Report Waste Now</span>
            </button>
          </div>
        ) : (
          <div className="complaints-grid-layout animate-fade-in">
            {filteredComplaints.map((item) => {
              const compId = item._id || item.id;
              const wasteType = (item.wasteType || "mixed").toLowerCase();

              return (
                <div key={compId} className="complaint-royal-card">
                  {/* Card Image Banner */}
                  <div className="complaint-card-media">
                    <img 
                      src={item.imageUrl || "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80"} 
                      alt="Reported waste spot" 
                      className="complaint-img-cover" 
                    />
                    <div className="media-overlay-badges">
                      <span className={`waste-type-tag tag-${wasteType}`}>
                        {wasteType === "biodegradable" ? "🌿 Organic" : wasteType === "plastic" ? "🧴 Plastic" : "🥫 Metal"}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="complaint-card-body">
                    <div className="complaint-date-row">
                      <div className="date-item">
                        <FiCalendar size={13} />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                      <span className="complaint-id-badge">ID: {String(compId).slice(-6)}</span>
                    </div>

                    <p className="complaint-desc-text">
                      {item.description || "Civic waste reported via safAI AI Neural Triage."}
                    </p>

                    <div className="complaint-meta-row">
                      <div className="loc-item">
                        <FiMapPin size={14} className="loc-icon" />
                        <span title={item.location?.address}>
                          {item.location?.address || "Civic Coordinates Captured"}
                        </span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="complaint-card-footer">
                      <div className="reward-earned-chip">
                        <LuSparkles size={13} />
                        <span>+50 XP Earned</span>
                      </div>

                      <button 
                        type="button" 
                        className="btn-delete-report"
                        title="Delete report"
                        onClick={() => setDeleteModalId(compId)}
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalId && (
          <div className="c-modal-overlay" onClick={() => setDeleteModalId(null)}>
            <div className="c-modal-card animate-pop" onClick={(e) => e.stopPropagation()}>
              <div className="c-modal-header">
                <div className="warn-icon-badge">
                  <FiAlertCircle size={22} />
                </div>
                <div className="modal-title-area">
                  <h3>Delete Civic Report?</h3>
                  <p>Are you sure you want to delete report #{String(deleteModalId).slice(-6)}? This action cannot be undone.</p>
                </div>
              </div>
              <div className="c-modal-actions">
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
                  className="btn-modal-delete" 
                  onClick={confirmDeleteComplaint}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Yes, Delete Report"}
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
