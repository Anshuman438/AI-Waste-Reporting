import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
  FiMapPin, 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle, 
  FiUser, 
  FiRefreshCw,
  FiShield,
  FiCalendar,
  FiArrowLeft,
  FiTruck,
  FiKey,
  FiDatabase,
  FiX,
  FiTrash2,
  FiExternalLink
} from "react-icons/fi";
import { LuLeaf, LuSparkles, LuTrash2 as LuTrashIcon } from "react-icons/lu";
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
  deleteComplaintService,
  getDatabaseUrl,
  setCustomDatabaseUrl
} from "../services/tidbService";

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Primary Data States
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filters & Search
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const [dbUrlInput, setDbUrlInput] = useState(getDatabaseUrl() || "");
  const [dbTestResult, setDbTestResult] = useState(null);
  const [dbTesting, setDbTesting] = useState(false);

  // Fetch error state for debugging
  const [fetchError, setFetchError] = useState(null);

  // Guarded fetch: isFetchingRef prevents concurrent in-flight requests
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async (isBackground = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isBackground) { setLoading(true); setFetchError(null); }

    try {
      // Direct fetch - no axios, no service layer complexity
      const token = localStorage.getItem("token");
      const headers = { "x-user-role": "admin" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Primary: /api/complaints
      let list = [];
      try {
        const r = await fetch("/api/complaints", { headers });
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data) && data.length > 0) list = data;
        }
      } catch (_) {}

      // Fallback: /api/test-db
      if (list.length === 0) {
        try {
          const r = await fetch("/api/test-db", { headers });
          if (r.ok) {
            const data = await r.json();
            if (Array.isArray(data.complaints) && data.complaints.length > 0) {
              list = data.complaints;
            }
          }
        } catch (_) {}
      }

      if (list.length > 0) {
        setComplaints(list);
        setFetchError(null);
      } else if (!isBackground) {
        setFetchError("No complaints returned from API. Database may be empty or unreachable.");
      }
    } catch (err) {
      if (!isBackground) setFetchError(err.message);
    } finally {
      if (!isBackground) setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll every 30s — safe for serverless cold-start latency
    const interval = setInterval(() => fetchData(true), 30000);
    const handleNewReport = () => setTimeout(() => fetchData(true), 1500);
    window.addEventListener("new_complaint_reported", handleNewReport);
    return () => {
      clearInterval(interval);
      window.removeEventListener("new_complaint_reported", handleNewReport);
    };
  }, [fetchData]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);

    // Optimistic local UI update immediately
    setComplaints((prev) =>
      prev.map((c) => ((c._id === id || c.id === id) ? { ...c, status } : c))
    );

    try {
      const token = localStorage.getItem("token");

      // Update in TiDB via API
      const res = await fetch("/api/complaints", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "admin",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id, status }),
      });

      if (res.ok) {
        // Also update localStorage so MyComplaints page sees the change immediately
        try {
          const stored = JSON.parse(localStorage.getItem("safai_all_complaints") || "[]");
          const updated = stored.map((c) =>
            String(c._id || c.id) === String(id) ? { ...c, status } : c
          );
          localStorage.setItem("safai_all_complaints", JSON.stringify(updated));
          localStorage.setItem("user_complaints_data", JSON.stringify(updated));
        } catch (_) {}

        // Notify MyComplaints page to re-fetch from DB
        window.dispatchEvent(new CustomEvent("status_updated", { detail: { id, status } }));
      }
    } catch (error) {
      console.warn("Status update error:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteComplaint = async () => {
    if (!deleteModalId) return;
    setDeleting(true);

    try {
      const token = localStorage.getItem("token");
      await deleteComplaintService(deleteModalId, token);
      setComplaints((prev) =>
        prev.filter((c) => c._id !== deleteModalId && c.id !== deleteModalId)
      );
    } catch (err) {
      console.warn("Delete incident note:", err);
    } finally {
      setDeleteModalId(null);
      setDeleting(false);
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
      const res = await axios.post(
        `${API}/api/test-db`,
        { url: inputToTest },
        { 
          headers: { "Content-Type": "application/json" }, 
          timeout: 12000 
        }
      );

      if (res.data) {
        setDbTestResult(res.data);
        // If test-db returned complaints, use them directly
        if (Array.isArray(res.data.complaints) && res.data.complaints.length > 0) {
          setComplaints(res.data.complaints);
        }
      }
    } catch (err) {
      try {
        const getRes = await axios.get(`${API}/api/test-db`, { timeout: 8000 });
        setDbTestResult(getRes.data);
        if (Array.isArray(getRes.data?.complaints) && getRes.data.complaints.length > 0) {
          setComplaints(getRes.data.complaints);
        }
      } catch (getErr) {
        setDbTestResult({
          connected: false,
          message: err.response?.data?.message || err.message || "Failed to reach backend diagnostic API.",
          hint: "Ensure DATABASE_URL is added to Vercel Environment Variables and the project is Redeployed."
        });
      }
    } finally {
      setDbTesting(false);
      // No fetchData() here - it would race against and reset the complaints we just set
    }
  };

  // Filtered List calculation
  const filteredList = useMemo(() => {
    return complaints.filter((c) => {
      const wType = (c.wasteType || "").toLowerCase();

      const matchesCategory =
        filter === "all" ||
        wType === filter.toLowerCase() ||
        (filter === "bio" && wType === "biodegradable") ||
        (filter === "biodegradable" && wType === "biodegradable");

      const matchesStatus =
        statusFilter === "all" || c.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.wasteType && c.wasteType.toLowerCase().includes(q)) ||
        (c.location?.address && c.location.address.toLowerCase().includes(q)) ||
        (c.locationName && c.locationName.toLowerCase().includes(q)) ||
        (c.reportedBy?.name && c.reportedBy.name.toLowerCase().includes(q)) ||
        (c.reportedBy?.email && c.reportedBy.email.toLowerCase().includes(q)) ||
        String(c._id || c.id || "").includes(q);

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [complaints, filter, statusFilter, searchQuery]);

  // Metric Totals
  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => (c.status || "pending") === "pending").length;
  const inProgressCount = complaints.filter((c) => c.status === "in-progress").length;
  const resolvedCount = complaints.filter((c) => c.status === "resolved").length;

  const plasticCount = complaints.filter((c) => (c.wasteType || "").toLowerCase() === "plastic").length;
  const metalCount = complaints.filter((c) => (c.wasteType || "").toLowerCase() === "metal").length;
  const bioCount = complaints.filter((c) => (c.wasteType || "").toLowerCase() === "biodegradable").length;

  const categoryStats = {
    all: totalCount,
    plastic: plasticCount,
    metal: metalCount,
    biodegradable: bioCount
  };

  // Donut Chart Configuration
  const chartData = {
    labels: ["Plastic", "Metal", "Biodegradable"],
    datasets: [
      {
        data: [plasticCount || (totalCount === 0 ? 1 : 0), metalCount || (totalCount === 0 ? 1 : 0), bioCount || (totalCount === 0 ? 1 : 0)],
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
    const d = new Date(iso);
    return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString("en-US", {
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
                <FiArrowLeft size={15} />
                <span>Exit to Main Site</span>
              </button>
              <div className="admin-title-badge">
                <FiShield size={13} /> Municipal Operations
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

        {/* Metrics Grid */}
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
                <span className="sub-heading-text">Interactive dispatch radar across urban sectors</span>
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
              placeholder="Search by waste type, description, location, citizen name, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="search-clear-btn" 
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
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
            <div>
              <h3>Registered Incidents ({filteredList.length})</h3>
              <span className="table-subtext">Review citizen reports and assign municipal crew resolution status.</span>
            </div>
            {filter !== "all" && (
              <span className="filter-active-pill">
                Filtered by: <strong>{filter}</strong>
                <button type="button" onClick={() => setFilter("all")}>✕</button>
              </span>
            )}
          </div>

          {loading && complaints.length === 0 ? (
            <div className="table-loading-state">
              <div className="royal-spinner"></div>
              <p>Fetching incident feed from TiDB Cloud database...</p>
            </div>
          ) : fetchError && complaints.length === 0 ? (
            <div className="admin-empty-state" style={{ borderTop: "3px solid #f59e0b" }}>
              <FiAlertCircle size={44} className="empty-icon" style={{ color: "#f59e0b" }} />
              <h4>Database Fetch Notice</h4>
              <p style={{ color: "#92400e", fontSize: "13px" }}>{fetchError}</p>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => fetchData()}
                style={{ marginTop: "12px", padding: "8px 20px" }}
              >
                <FiRefreshCw size={14} style={{ marginRight: "6px" }} /> Retry Now
              </button>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="admin-empty-state">
              <FiCheckCircle size={44} className="empty-icon" />
              <h4>No matching incidents found</h4>
              <p>
                {complaints.length === 0 
                  ? "No incidents in database yet. New citizen reports will automatically appear here in real time." 
                  : "There are no reports matching your current filter criteria."}
              </p>
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
                        {wasteType === "biodegradable" ? "🌿 Bio" : wasteType === "plastic" ? "🧴 Plastic" : "🥫 Metal"}
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
                        <div className="meta-chip" title={complaint.location?.address || complaint.locationName}>
                          <FiMapPin size={13} className="meta-icon" />
                          <span>
                            {complaint.location?.address || complaint.locationName || "Civic Coordinates Captured"}
                          </span>
                        </div>
                        
                        <div className="meta-chip">
                          <FiUser size={13} className="meta-icon" />
                          <span>
                            {complaint.reportedBy?.name || "Citizen Reporter"} 
                            {complaint.reportedBy?.email ? ` (${complaint.reportedBy.email})` : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Update & Actions Column */}
                    <div className="incident-action-col">
                      <div className="action-control-group">
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

                      <button 
                        type="button" 
                        className="btn-delete-incident"
                        title="Delete Incident"
                        onClick={() => setDeleteModalId(compId)}
                      >
                        <FiTrash2 size={15} />
                      </button>
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

      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="c-modal-overlay" onClick={() => setDeleteModalId(null)}>
          <div className="c-modal-card animate-pop" onClick={(e) => e.stopPropagation()}>
            <div className="c-modal-header">
              <div className="warn-icon-badge">
                <FiAlertCircle size={22} />
              </div>
              <div className="modal-title-area">
                <h3>Delete Incident Report?</h3>
                <p>Are you sure you want to remove report #{String(deleteModalId).slice(-6)} from TiDB Cloud database? This cannot be undone.</p>
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
                onClick={handleDeleteComplaint}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete Report"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <p>Verify live database connectivity and cluster telemetry.</p>
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
                    {dbTestResult.connected ? "✅ Database Connected & Active" : "⚠️ Connection Notice"}
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
