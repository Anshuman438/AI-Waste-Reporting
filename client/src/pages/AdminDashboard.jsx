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
  FiKey,
  FiDatabase,
  FiX
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
  updateComplaintStatusService,
  getDatabaseUrl,
  setCustomDatabaseUrl
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

  // TiDB Cloud Live Status & Diagnostic Modal
  const [showDbModal, setShowDbModal] = useState(false);
  const [dbUrlInput, setDbUrlInput] = useState(getDatabaseUrl() || "");
  const [dbTestResult, setDbTestResult] = useState(null);
  const [dbTesting, setDbTesting] = useState(false);

  useEffect(() => {
    fetchData();

    // Auto-fetch polling every 3 seconds for real-time reporting sync
    const interval = setInterval(() => {
      fetchData(true);
    }, 3000);

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

  const handleTestDatabase = async () => {
    setDbTesting(true);
    setDbTestResult(null);

    const inputToTest = dbUrlInput ? dbUrlInput.trim() : getDatabaseUrl();
    if (inputToTest) {
      setCustomDatabaseUrl(inputToTest);
    }

    try {
      // 1. Test via Serverless Backend API (Node.js runtime has full TCP/HTTPS network access with zero browser CORS blocks)
      const res = await axios.post(
        `${API}/api/test-db`,
        { url: inputToTest },
        { 
          headers: { 
            "x-db-url": inputToTest,
            "Content-Type": "application/json" 
          }, 
          timeout: 12000 
        }
      );

      if (res.data) {
        setDbTestResult(res.data);
      }
      if (res.data?.connected) {
        await fetchData();
      }
    } catch (err) {
      // 2. Fallback to direct GET /api/test-db
      try {
        const getRes = await axios.get(`${API}/api/test-db?url=${encodeURIComponent(inputToTest)}`, { timeout: 8000 });
        setDbTestResult(getRes.data);
      } catch (getErr) {
        setDbTestResult({
          connected: false,
          message: err.response?.data?.message || err.message || "Failed to reach backend diagnostic API.",
          hint: "Ensure DATABASE_URL is added to Vercel Environment Variables and the project is Redeployed."
        });
      }
    } finally {
      setDbTesting(false);
      await fetchData();
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
      c.location?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
              className="btn-secondary btn-db-trigger"
              onClick={() => {
                setShowDbModal(true);
                handleTestDatabase();
              }}
              title="Inspect TiDB Cloud Database Connection"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <FiDatabase size={15} />
              <span>TiDB Status</span>
            </button>

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
              className="btn-primary btn-refresh" 
              onClick={() => fetchData()} 
              disabled={loading}
              title="Refresh live database"
            >
              <FiRefreshCw className={loading ? "spin-icon" : ""} size={16} />
              <span>{loading ? "Syncing..." : "Live Sync"}</span>
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

          <div className="toolbar-status-filters">
            <button
              type="button"
              className={`filter-chip ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              All Incidents ({complaints.length})
            </button>
            <button
              type="button"
              className={`filter-chip pending ${statusFilter === "pending" ? "active" : ""}`}
              onClick={() => setStatusFilter("pending")}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              className={`filter-chip progress ${statusFilter === "in-progress" ? "active" : ""}`}
              onClick={() => setStatusFilter("in-progress")}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              type="button"
              className={`filter-chip resolved ${statusFilter === "resolved" ? "active" : ""}`}
              onClick={() => setStatusFilter("resolved")}
            >
              Resolved ({resolvedCount})
            </button>
          </div>
        </div>

        {/* Incidents Table / Cards Grid */}
        <div className="admin-table-container">
          <div className="table-header-info">
            <h3>Registered Incidents ({filteredList.length})</h3>
            <span className="table-subtext">Click on any dropdown to update municipal resolution status in real time.</span>
          </div>

          {loading && complaints.length === 0 ? (
            <div className="table-loading-state">
              <div className="royal-spinner"></div>
              <p>Fetching incident feed from TiDB Cloud database...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="admin-empty-state">
              <FiCheckCircle size={40} className="empty-icon" />
              <h4>No matching incidents found</h4>
              <p>All clean! There are no reports matching your current filter criteria.</p>
            </div>
          ) : (
            <div className="incident-cards-list">
              {filteredList.map((complaint) => {
                const compId = complaint._id || complaint.id;
                const wasteType = (complaint.wasteType || "mixed").toLowerCase();

                return (
                  <div key={compId} className={`incident-row-card status-${complaint.status || "pending"}`}>
                    
                    {/* Thumbnail */}
                    <div className="incident-media-thumb">
                      <img
                        src={complaint.imageUrl || "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80"}
                        alt="Civic waste"
                        className="thumb-img"
                      />
                      <span className={`thumb-badge badge-${wasteType}`}>
                        {wasteType}
                      </span>
                    </div>

                    {/* Details Column */}
                    <div className="incident-info-col">
                      <div className="incident-top-meta">
                        <span className="incident-id-tag">REF #{String(compId).slice(-6)}</span>
                        <span className="incident-time-text">
                          <FiClock size={12} /> {formatDate(complaint.createdAt)}
                        </span>
                      </div>

                      <h4 className="incident-desc-text">
                        {complaint.description || "Civic waste reported via safAI AI Neural Triage."}
                      </h4>

                      <div className="incident-meta-chips">
                        <div className="meta-chip">
                          <FiMapPin size={13} />
                          <span title={complaint.location?.address || complaint.locationName}>
                            {complaint.location?.address || complaint.locationName || "Civic Coordinates Captured"}
                          </span>
                        </div>
                        
                        <div className="meta-chip">
                          <FiUser size={13} />
                          <span>
                            {complaint.reportedBy?.name || "Citizen Reporter"} 
                            {complaint.reportedBy?.email ? ` (${complaint.reportedBy.email})` : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Update Dropdown */}
                    <div className="incident-action-col">
                      <label className="action-label">Resolution Status</label>
                      <select
                        className={`status-select-control select-${complaint.status || "pending"}`}
                        value={complaint.status || "pending"}
                        onChange={(e) => updateStatus(compId, e.target.value)}
                        disabled={updatingId === compId}
                      >
                        <option value="pending">⏳ Pending Triage</option>
                        <option value="in-progress">🚚 In Progress</option>
                        <option value="resolved">✅ Resolved & Cleared</option>
                      </select>
                      {updatingId === compId && (
                        <span className="updating-status-text">Updating DB...</span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* Admin Change Password Modal */}
      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />

      {/* TiDB Cloud Diagnostic & Connection Modal */}
      {showDbModal && (
        <div className="pwd-modal-overlay" onClick={() => setShowDbModal(false)}>
          <div className="pwd-modal-card animate-pop" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div className="pwd-modal-header">
              <div className="pwd-header-badge" style={{ background: "#ecfdf5", color: "#059669" }}>
                <FiDatabase size={20} />
              </div>
              <div className="pwd-header-titles">
                <h3>TiDB Cloud Live Diagnostics</h3>
                <p>Verify live database connectivity and table status.</p>
              </div>
              <button type="button" className="pwd-btn-close" onClick={() => setShowDbModal(false)}>
                <FiX size={18} />
              </button>
            </div>

            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {dbTestResult && (
                <div 
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: dbTestResult.connected ? "#f0fdf4" : "#fef2f2",
                    border: `1px solid ${dbTestResult.connected ? "#bbf7d0" : "#fecaca"}`,
                    color: dbTestResult.connected ? "#15803d" : "#b91c1c",
                    fontSize: "13px",
                    lineHeight: "1.5"
                  }}
                >
                  <div style={{ fontWeight: "700", marginBottom: "4px" }}>
                    {dbTestResult.connected ? "✅ Database Connected" : "⚠️ Connection Notice"}
                  </div>
                  <div>{dbTestResult.message}</div>
                  {dbTestResult.stats && (
                    <div style={{ marginTop: "6px", fontWeight: "600", fontSize: "12px" }}>
                      Users in DB: {dbTestResult.stats.users} | Complaints in DB: {dbTestResult.stats.complaints}
                    </div>
                  )}
                  {dbTestResult.hint && (
                    <div style={{ marginTop: "4px", fontSize: "12px", opacity: 0.85 }}>
                      Hint: {dbTestResult.hint}
                    </div>
                  )}
                </div>
              )}

              <div className="pwd-input-group">
                <label>TiDB Cloud Connection String (Optional Override)</label>
                <div className="pwd-input-wrapper">
                  <input
                    type="text"
                    placeholder="mysql://[user]:[pass]@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?ssl={...}"
                    value={dbUrlInput}
                    onChange={(e) => setDbUrlInput(e.target.value)}
                    style={{ fontSize: "12px", paddingLeft: "12px" }}
                  />
                </div>
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                  Used for direct serverless queries if backend API environment variables are updating.
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowDbModal(false)}
                  style={{ padding: "8px 16px" }}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleTestDatabase}
                  disabled={dbTesting}
                  style={{ padding: "8px 18px" }}
                >
                  {dbTesting ? "Testing..." : "Test Connection & Sync"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
