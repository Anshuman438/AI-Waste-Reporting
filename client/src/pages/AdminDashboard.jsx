import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";
import ComplaintMap from "../components/ComplaintMap";
import "./AdminDashboard.css";

const API = import.meta.env.VITE_API_URL;

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API}/api/complaints`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setComplaints(res.data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 UPDATED ROUTE HERE
  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `${API}/api/complaints/${id}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const activeComplaints = complaints.filter(
    (c) =>
      c.status !== "resolved" &&
      (filter === "all" || c.wasteType === filter)
  );

  const archivedComplaints = complaints.filter(
    (c) => c.status === "resolved"
  );

  const totalReports = complaints.length;
  const pendingReports = complaints.filter(
    (c) => c.status === "pending"
  ).length;

  const inProgressReports = complaints.filter(
    (c) => c.status === "in-progress"
  ).length;

  const resolvedReports = archivedComplaints.length;

  return (
    <div className="admin-layout">
      <AdminSidebar setFilter={setFilter} active={filter} />

      <div className="admin-content">

        {/* Header */}
        <div className="admin-header">
          <h1>AI Waste Control Center</h1>
          <p>Monitor and manage civic waste reports.</p>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <h3>Total Reports</h3>
            <p>{totalReports}</p>
          </div>

          <div className="admin-stat-card">
            <h3>Pending</h3>
            <p>{pendingReports}</p>
          </div>

          <div className="admin-stat-card">
            <h3>In Progress</h3>
            <p>{inProgressReports}</p>
          </div>

          <div className="admin-stat-card">
            <h3>Resolved</h3>
            <p>{resolvedReports}</p>
          </div>
        </div>

        {/* Active Complaints */}
        <h2>Active Complaints Management</h2>

        {loading ? (
          <p>Loading complaints...</p>
        ) : (
          <div className="complaint-grid">
            {activeComplaints.map((c) => (
              <div key={c._id} className="card">
                <img src={c.imageUrl} alt="waste" />

                <div className="card-content">
                  <h3>{c.wasteType}</h3>

                  <p className="description">
                    <strong>Description:</strong>{" "}
                    {c.description && c.description.trim() !== ""
                      ? c.description
                      : "Not Provided"}
                  </p>

                  <div className="card-bottom">
                    <select
                      value={c.status}
                      onChange={(e) =>
                        updateStatus(c._id, e.target.value)
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">
                        In Progress
                      </option>
                      <option value="resolved">
                        Resolve
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Archived */}
        <h2>Resolved & Archived Reports</h2>

        <div className="complaint-grid">
          {archivedComplaints.map((c) => (
            <div key={c._id} className="card">
              <img src={c.imageUrl} alt="waste" />

              <div className="card-content">
                <h3>{c.wasteType}</h3>

                <p className="description">
                  <strong>Description:</strong>{" "}
                  {c.description && c.description.trim() !== ""
                    ? c.description
                    : "Not Provided"}
                </p>

                <span className="resolved-badge">
                  Resolved
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Map */}
        <h2>Live Complaint Map</h2>

        <div className="map-section">
          <ComplaintMap complaints={complaints} />
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
