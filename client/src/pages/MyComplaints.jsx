import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiTrash2, 
  FiMapPin, 
  FiCalendar, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiPlus,
  FiRefreshCw,
  FiTruck,
  FiAward,
  FiArrowLeft
} from "react-icons/fi";
import { LuLeaf, LuSparkles } from "react-icons/lu";
import "./MyComplaints.css";

const MyComplaints = () => {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Fetch (guarded, no concurrent calls) ────────────────────────────────
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async (isBackground = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isBackground) setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userEmail = (currentUser.email || "").toLowerCase().trim();
      const userId = String(currentUser._id || currentUser.id || "");

      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (userEmail) headers["x-user-email"] = userEmail;
      if (userId) headers["x-user-id"] = userId;

      // Fetch user-specific complaints from DB
      let serverList = [];
      try {
        const r = await fetch(
          `/api/complaints?mode=my&email=${encodeURIComponent(userEmail)}&user_id=${encodeURIComponent(userId)}`,
          { headers }
        );
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data) && data.length > 0) serverList = data;
        }
      } catch (_) {}

      // Fallback: fetch all from test-db and filter client-side
      if (serverList.length === 0) {
        try {
          const r = await fetch("/api/test-db", { headers });
          if (r.ok) {
            const data = await r.json();
            if (Array.isArray(data.complaints)) {
              serverList = data.complaints.filter((c) => {
                const repEmail = (c.reportedBy?.email || "").toLowerCase().trim();
                const repId = String(c.reportedBy?._id || c.reportedBy?.id || "");
                return (
                  (userEmail && repEmail === userEmail) ||
                  (userId && repId === userId)
                );
              });
            }
          }
        } catch (_) {}
      }

      if (serverList.length > 0) {
        // Server is THE truth — use directly, never merge localStorage
        // (merging causes duplicates when local IDs differ from server IDs)
        setComplaints(serverList);

        // Clean up stale localStorage: keep only offline-only items (start with "comp-")
        // that the server doesn't have yet
        try {
          const serverIds = new Set(serverList.map((c) => String(c._id || c.id)));
          const local = JSON.parse(localStorage.getItem("safai_all_complaints") || "[]");
          // Keep only items that are both offline (comp- prefix) AND not yet on server
          const offlineOnly = local.filter((c) => {
            const localId = String(c._id || c.id);
            return localId.startsWith("comp-") && !serverIds.has(localId);
          });
          localStorage.setItem("safai_all_complaints", JSON.stringify([
            ...serverList,
            ...offlineOnly
          ]));
        } catch (_) {}
      } else {
        // Offline fallback — show localStorage items for this user only
        try {
          const local = JSON.parse(localStorage.getItem("safai_all_complaints") || "[]");
          const userLocal = local.filter((c) => {
            const repEmail = (c.reportedBy?.email || "").toLowerCase().trim();
            const repId = String(c.reportedBy?._id || c.reportedBy?.id || "");
            return (
              (userEmail && repEmail === userEmail) ||
              (userId && repId === userId)
            );
          });
          if (userLocal.length > 0) setComplaints(userLocal);
        } catch (_) {}
      }
    } catch (_) {
      // silent
    } finally {
      if (!isBackground) setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Poll every 30s (not 3.5s - prevents cascade)
    const interval = setInterval(() => fetchData(true), 30000);

    // Listen for admin status_updated events — re-fetch immediately
    const handleStatusUpdate = (e) => {
      if (e.detail) {
        // Instant local update from the CustomEvent detail
        setComplaints((prev) =>
          prev.map((c) =>
            String(c._id || c.id) === String(e.detail.id)
              ? { ...c, status: e.detail.status }
              : c
          )
        );
      }
      // Also re-fetch from DB after a short delay for confirmation
      setTimeout(() => fetchData(true), 1000);
    };

    const handleNewReport = () => setTimeout(() => fetchData(true), 1500);

    window.addEventListener("status_updated", handleStatusUpdate);
    window.addEventListener("new_complaint_reported", handleNewReport);

    return () => {
      clearInterval(interval);
      window.removeEventListener("status_updated", handleStatusUpdate);
      window.removeEventListener("new_complaint_reported", handleNewReport);
    };
  }, [fetchData]);

  // ─── Delete complaint ────────────────────────────────────────────────────
  const confirmDeleteComplaint = async () => {
    if (!deleteModalId) return;
    setDeleting(true);

    try {
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`/api/complaints?id=${encodeURIComponent(deleteModalId)}`, {
        method: "DELETE",
        headers,
      });

      // Remove from localStorage too
      try {
        const stored = JSON.parse(localStorage.getItem("safai_all_complaints") || "[]");
        const updated = stored.filter(
          (c) => String(c._id || c.id) !== String(deleteModalId)
        );
        localStorage.setItem("safai_all_complaints", JSON.stringify(updated));
        localStorage.setItem("user_complaints_data", JSON.stringify(updated));
      } catch (_) {}
    } catch (_) {}

    setComplaints((prev) =>
      prev.filter((c) => c._id !== deleteModalId && c.id !== deleteModalId)
    );
    setDeleteModalId(null);
    setDeleting(false);
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    if (status === "resolved") {
      return (
        <span className="royal-badge-status status-resolved">
          <FiCheckCircle size={13} />
          <span>Resolved &amp; Cleared</span>
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

  const filteredComplaints = complaints.filter((c) => {
    if (activeTab === "all") return true;
    return c.status === activeTab;
  });

  const formatDate = (isoString) => {
    if (!isoString) return "Recently";
    const date = new Date(isoString);
    return isNaN(date.getTime())
      ? String(isoString)
      : date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const totalPoints = complaints.length * 50;
  const resolvedCount = complaints.filter((c) => c.status === "resolved").length;
  const inProgressCount = complaints.filter((c) => c.status === "in-progress").length;
  const pendingCount = complaints.filter((c) => (c.status || "pending") === "pending").length;

  return (
    <div className="my-complaints-royal-root">
      <div className="my-complaints-container">

        {/* Header */}
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
            <h1 className="royal-complaints-title">Activity &amp; History</h1>
            <p className="royal-complaints-sub">
              Live tracking of all civic waste incidents you&apos;ve reported.
              Status updates reflect municipal crew actions in real time.
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

        {/* Status Summary Row */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{
            background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px",
            padding: "10px 18px", fontSize: "13px", fontWeight: "600", color: "#c2410c"
          }}>
            ⏳ Pending: {pendingCount}
          </div>
          <div style={{
            background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px",
            padding: "10px 18px", fontSize: "13px", fontWeight: "600", color: "#1d4ed8"
          }}>
            🚚 In Progress: {inProgressCount}
          </div>
          <div style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px",
            padding: "10px 18px", fontSize: "13px", fontWeight: "600", color: "#15803d"
          }}>
            ✅ Resolved: {resolvedCount}
          </div>
          <button
            type="button"
            onClick={() => fetchData()}
            disabled={loading}
            style={{
              background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px",
              padding: "10px 16px", fontSize: "13px", fontWeight: "600", color: "#475569",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
            }}
          >
            <FiRefreshCw size={13} className={loading ? "spin-icon" : ""} />
            {loading ? "Syncing..." : "Refresh"}
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="complaints-filter-bar">
          <div className="filter-tab-group">
            {["all", "pending", "in-progress", "resolved"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`filter-pill-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                <span>{tab === "all" ? "All Reports" : tab === "in-progress" ? "In Progress" : tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                <span className="tab-count-bubble">
                  {tab === "all"
                    ? complaints.length
                    : complaints.filter((c) => c.status === tab).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
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
                ? "You haven't submitted any civic waste reports yet. Help keep your city clean!"
                : `No reports currently under the '${activeTab}' status.`}
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
                  {/* Image Banner */}
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

                    {/* Status description */}
                    <div style={{
                      marginTop: "8px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "500",
                      background: item.status === "resolved" ? "#f0fdf4"
                        : item.status === "in-progress" ? "#eff6ff" : "#fff7ed",
                      color: item.status === "resolved" ? "#15803d"
                        : item.status === "in-progress" ? "#1d4ed8" : "#92400e",
                      border: `1px solid ${item.status === "resolved" ? "#bbf7d0"
                        : item.status === "in-progress" ? "#bfdbfe" : "#fed7aa"}`
                    }}>
                      {item.status === "resolved"
                        ? "✅ Municipal crew has cleared this waste spot. Thank you for reporting!"
                        : item.status === "in-progress"
                        ? "🚚 Crew dispatched — cleaning is underway at this location."
                        : "⏳ Report received. Municipal team will assign a crew soon."}
                    </div>

                    {/* Footer */}
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
                  <p>
                    Are you sure you want to delete report #{String(deleteModalId).slice(-6)}?
                    This action cannot be undone.
                  </p>
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
