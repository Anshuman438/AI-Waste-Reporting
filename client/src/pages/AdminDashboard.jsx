import React, { useEffect, useState } from "react";
import axios from "axios";
import { Doughnut } from "react-chartjs-2";
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend 
} from "chart.js";
import { 
  FiSearch, 
  FiFilter, 
  FiMapPin, 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle, 
  FiUser, 
  FiLayers, 
  FiBarChart2, 
  FiRefreshCw,
  FiShield,
  FiCalendar,
  FiArrowLeft,
  FiTruck,
  FiZap,
  FiPlusCircle,
  FiKey
} from "react-icons/fi";
import { LuLeaf } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import ComplaintMap from "../components/ComplaintMap";
import ChangePasswordModal from "../components/ChangePasswordModal";
import "./AdminDashboard.css";

ChartJS.register(ArcElement, Tooltip, Legend);

import { API } from "../config/api";
import { 
  fetchAllComplaintsService, 
  updateComplaintStatusService 
} from "../services/tidbService";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchData();

    // Auto-fetch polling every 4 seconds for real-time reporting sync
    const interval = setInterval(() => {
      fetchData(true);
    }, 4000);

    const handleNewReport = () => {
      fetchData(true);
    };

    window.addEventListener("new_complaint_reported", handleNewReport);
    window.addEventListener("storage", handleNewReport);

    return () => {
      clearInterval(interval);
      window.removeEventListener("new_complaint_reported", handleNewReport);
      window.removeEventListener("storage", handleNewReport);
    };
  }, []);

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const list = await fetchAllComplaintsService(token);
      if (Array.isArray(list)) {
        setComplaints(list);
      }
    } catch (error) {
      console.log("Using live complaints telemetry note:", error.message);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);

    // Optimistic local state update
    setComplaints((prev) =>
      prev.map((c) => ((c._id === id || c.id === id) ? { ...c, status } : c))
    );

    try {
      const token = localStorage.getItem("token");
      await updateComplaintStatusService(id, status, token);
    } catch (error) {
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter complaints based on sidebar wasteType + status + search query
  const filteredList = complaints.filter((c) => {
    const matchesCategory =
      filter === "all" ||
      c.wasteType?.toLowerCase() === filter.toLowerCase() ||
      (filter === "bio" && c.wasteType?.toLowerCase() === "biodegradable") ||
      (filter === "biodegradable" && c.wasteType?.toLowerCase() === "biodegradable");

    const matchesStatus =
      statusFilter === "all" || c.status === statusFilter;

    const matchesSearch =
      !searchQuery ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.wasteType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.locationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.reportedBy?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.reportedBy?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const activeComplaints = filteredList.filter((c) => c.status !== "resolved");
  const resolvedComplaints = filteredList.filter((c) => c.status === "resolved");

  // Summary Metrics
  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === "pending").length;
  const inProgressCount = complaints.filter((c) => c.status === "in-progress").length;
  const resolvedCount = complaints.filter((c) => c.status === "resolved").length;

  const plasticCount = complaints.filter((c) => c.wasteType?.toLowerCase() === "plastic").length;
  const metalCount = complaints.filter((c) => c.wasteType?.toLowerCase() === "metal").length;
  const bioCount = complaints.filter((c) => c.wasteType?.toLowerCase() === "biodegradable").length;

  const categoryStats = {
    all: totalCount,
    plastic: plasticCount,
    metal: metalCount,
    biodegradable: bioCount
  };

  // Chart Data Configuration
  const chartData = {
    labels: ["Plastic", "Metal", "Biodegradable"],
    datasets: [
      {
        data: [plasticCount || 1, metalCount || 1, bioCount || 1],
        backgroundColor: ["#3b82f6", "#64748b", "#10b981"],
        hoverBackgroundColor: ["#2563eb", "#475569", "#059669"],
        borderWidth: 3,
        borderColor: "#ffffff",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 14,
          font: { family: "Plus Jakarta Sans", size: 12, weight: "700" },
          color: "#334155"
        },
      },
    },
  };

  const formatDate = (iso) => {
    if (!iso) return "Just now";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="admin-layout-wrapper">
      <AdminSidebar 
        setFilter={setFilter} 
        active={filter} 
        totalStats={categoryStats} 
        onChangePassword={() => setShowPasswordModal(true)}
      />

      <main className="admin-main-content">
        
        {/* Header Bar */}
        <div className="admin-page-header">
          <div className="admin-header-left">
            <div className="admin-nav-actions-top">
              <button 
                type="button" 
                className="btn-back-to-site"
                onClick={() => navigate("/")}
              >
                <FiArrowLeft size={16} />
                <span>Exit to Main Site</span>
              </button>
              <div className="admin-title-badge">
                <FiShield size={12} /> Municipal Operations
              </div>
            </div>
            <h1>AI Waste Control Center</h1>
            <p>Real-time civic surveillance, material segregation analytics, and crew triage.</p>
          </div>

          <div className="admin-header-actions">
            <button 
              type="button"
              className="btn-secondary btn-pwd-trigger" 
              onClick={() => setShowPasswordModal(true)}
              title="Update Admin Password"
            >
              <FiKey size={15} />
              <span>Change Password</span>
            </button>

            <button 
              type="button"
              className="btn-secondary btn-reset-demo" 
              onClick={handleResetDemoData}
              title="Reset sample civic complaints"
            >
              <FiRefreshCw size={15} />
              <span>Reset Demo Data</span>
            </button>

            <button 
              type="button"
              className="btn-primary btn-refresh" 
              onClick={fetchData} 
              disabled={loading}
            >
              <FiZap className={loading ? "spin-icon" : ""} size={16} />
              <span>Sync Telemetry</span>
            </button>
          </div>
        </div>

        {/* Stats & Analytics Row */}
        <div className="admin-metrics-grid">
          
          <div className="metric-card total">
            <div className="metric-header">
              <span className="metric-name">Total Reports</span>
              <span className="metric-pill">All Time</span>
            </div>
            <h2 className="metric-number">{totalCount}</h2>
            <p className="metric-sub">Registered civic reports</p>
          </div>

          <div className="metric-card pending">
            <div className="metric-header">
              <span className="metric-name">Pending Triage</span>
              <span className="metric-pill warning">Needs Action</span>
            </div>
            <h2 className="metric-number">{pendingCount}</h2>
            <p className="metric-sub">Awaiting crew assignment</p>
          </div>

          <div className="metric-card progress">
            <div className="metric-header">
              <span className="metric-name">In Progress</span>
              <span className="metric-pill info">Crews Active</span>
            </div>
            <h2 className="metric-number">{inProgressCount}</h2>
            <p className="metric-sub">Cleaning & transit underway</p>
          </div>

          <div className="metric-card resolved">
            <div className="metric-header">
              <span className="metric-name">Resolved</span>
              <span className="metric-pill success">
                {totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0}% Rate
              </span>
            </div>
            <h2 className="metric-number">{resolvedCount}</h2>
            <p className="metric-sub">Cleared & verified spots</p>
          </div>

        </div>

        {/* Analytics & Map Section */}
        <div className="analytics-map-grid">
          
          {/* Map Section */}
          <div className="admin-section-card map-card-wrap">
            <div className="card-heading-row">
              <div className="heading-title-group">
                <h3>Live Incident Geo-Map</h3>
                <span className="sub-heading-text">Interactive dispatch radar</span>
              </div>
              <span className="map-counter-badge">{complaints.length} Geo-pins</span>
            </div>
            <div className="admin-map-container-box">
              <ComplaintMap complaints={complaints} />
            </div>
          </div>

          {/* Waste Composition Chart */}
          <div className="admin-section-card chart-card-wrap">
            <div className="card-heading-row">
              <div className="heading-title-group">
                <h3>Material Segregation</h3>
                <span className="sub-heading-text">AI categorization ratio</span>
              </div>
            </div>
            <div className="chart-canvas-box">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          </div>

        </div>

        {/* Complaints Filter & Search Toolbar */}
        <div className="admin-toolbar">
          <div className="search-input-wrap">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by waste type, description, location, or citizen name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-select-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Statuses ({filteredList.length})</option>
              <option value="pending">⏳ Pending Triage</option>
              <option value="in-progress">🚚 In Progress</option>
              <option value="resolved">✅ Resolved</option>
            </select>
          </div>
        </div>

        {/* Active Complaints Grid */}
        <div className="admin-content-section">
          <div className="section-title-wrap-left">
            <h2>Active Complaints Queue ({activeComplaints.length})</h2>
            <p>Review incoming citizen reports and dispatch sanitation crews.</p>
          </div>

          {loading ? (
            <div className="admin-loading-indicator">
              <div className="btn-spinner"></div>
              <span>Fetching complaint telemetry...</span>
            </div>
          ) : activeComplaints.length === 0 ? (
            <div className="admin-empty-box">
              <FiCheckCircle size={38} className="empty-green-icon" />
              <h3>Queue Fully Cleared!</h3>
              <p>No active complaints match your current filter criteria.</p>
              <button 
                type="button" 
                className="btn-seed-data-link"
                onClick={handleResetDemoData}
              >
                Reset demo complaints
              </button>
            </div>
          ) : (
            <div className="admin-complaints-grid">
              {activeComplaints.map((c) => (
                <div key={c._id} className="admin-case-card animate-fade-in">
                  
                  <div className="case-img-container">
                    <img src={c.imageUrl} alt="Waste Incident" className="case-img" />
                    <div className="case-category-pill">
                      <span className={`badge-category badge-${c.wasteType?.toLowerCase()}`}>
                        {c.wasteType}
                      </span>
                    </div>
                    {c.aiConfidence && (
                      <div className="case-confidence-badge">
                        <span>⚡ {c.aiConfidence}% AI Conf.</span>
                      </div>
                    )}
                  </div>

                  <div className="case-body">
                    <div className="case-meta-top">
                      <span className="case-date">
                        <FiCalendar size={12} /> {formatDate(c.createdAt)}
                      </span>
                      {c.reportedBy && (
                        <span className="case-reporter">
                          <FiUser size={12} /> {c.reportedBy.name || "Citizen"}
                        </span>
                      )}
                    </div>

                    <h4 className="case-title">{c.wasteType ? (c.wasteType.charAt(0).toUpperCase() + c.wasteType.slice(1)) : "Civic"} Waste</h4>

                    <p className="case-desc">
                      {c.description && c.description.trim() !== ""
                        ? c.description
                        : "Visual report submitted via mobile camera."}
                    </p>

                    {(c.locationName || c.location?.lat) && (
                      <div className="case-coords">
                        <FiMapPin size={13} className="pin-icon" />
                        <span>{c.locationName || `${c.location.lat.toFixed(4)}, ${c.location.lng.toFixed(4)}`}</span>
                      </div>
                    )}

                    {/* Quick Triage Buttons */}
                    <div className="case-status-triage">
                      <label>Update Crew Status:</label>
                      <div className="triage-action-btn-group">
                        <button 
                          type="button"
                          className={`btn-triage-opt ${c.status === "pending" ? "active pending" : ""}`}
                          onClick={() => updateStatus(c._id, "pending")}
                          disabled={updatingId === c._id}
                        >
                          <FiClock size={13} />
                          <span>Pending</span>
                        </button>
                        
                        <button 
                          type="button"
                          className={`btn-triage-opt ${c.status === "in-progress" ? "active progress" : ""}`}
                          onClick={() => updateStatus(c._id, "in-progress")}
                          disabled={updatingId === c._id}
                        >
                          <FiTruck size={13} />
                          <span>In Progress</span>
                        </button>

                        <button 
                          type="button"
                          className={`btn-triage-opt ${c.status === "resolved" ? "active resolved" : ""}`}
                          onClick={() => updateStatus(c._id, "resolved")}
                          disabled={updatingId === c._id}
                        >
                          <FiCheckCircle size={13} />
                          <span>Resolved</span>
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved / Archived Reports */}
        <div className="admin-content-section" style={{ marginTop: "48px" }}>
          <div className="section-title-wrap-left">
            <h2>Resolved & Cleared Reports ({resolvedComplaints.length})</h2>
            <p>Archive of civic complaints verified and cleaned by sanitation teams.</p>
          </div>

          <div className="admin-complaints-grid">
            {resolvedComplaints.map((c) => (
              <div key={c._id} className="admin-case-card resolved-card animate-fade-in">
                <div className="case-img-container">
                  <img src={c.imageUrl} alt="Resolved Waste" className="case-img" />
                  <div className="case-category-pill">
                    <span className="badge-status badge-resolved">
                      <FiCheckCircle size={12} /> Resolved
                    </span>
                  </div>
                </div>

                <div className="case-body">
                  <div className="case-meta-top">
                    <span className="case-date">
                      <FiCalendar size={12} /> {formatDate(c.createdAt)}
                    </span>
                    {c.reportedBy && (
                      <span className="case-reporter">
                        <FiUser size={12} /> {c.reportedBy.name || "Citizen"}
                      </span>
                    )}
                  </div>
                  <h4 className="case-title">{c.wasteType ? (c.wasteType.charAt(0).toUpperCase() + c.wasteType.slice(1)) : "Civic"} Waste</h4>
                  <p className="case-desc">{c.description || "Cleared & resolved by local municipal crew."}</p>

                  <div className="resolved-action-row">
                    <button 
                      type="button" 
                      className="btn-reopen-case"
                      onClick={() => updateStatus(c._id, "in-progress")}
                    >
                      <span>↩ Re-open for Inspection</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Change Admin Password Modal */}
      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
    </div>
  );
};

export default AdminDashboard;
