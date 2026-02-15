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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComplaints(res.data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const activeComplaints = complaints.filter(
    (c) =>
      c.status !== "resolved" &&
      (filter === "all" || c.wasteType === filter)
  );

  const archived = complaints.filter(
    (c) => c.status === "resolved"
  );

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `${API}/api/complaints/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar setFilter={setFilter} />

      <div className="admin-content">
        <h2>Active Complaints</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="complaint-grid">
            {activeComplaints.map((c) => (
              <div key={c._id} className="card">
                <img src={c.imageUrl} alt="waste" />
                <h3>{c.wasteType}</h3>
                <p>{c.description}</p>

                <select
                  value={c.status}
                  onChange={(e) =>
                    updateStatus(c._id, e.target.value)
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolve</option>
                </select>
              </div>
            ))}
          </div>
        )}

        <h2 style={{ marginTop: "50px" }}>Archived</h2>

        <div className="complaint-grid">
          {archived.map((c) => (
            <div key={c._id} className="card">
              <img src={c.imageUrl} alt="waste" />
              <h3>{c.wasteType}</h3>
              <p>{c.description}</p>
            </div>
          ))}
        </div>

        <div className="map-section">
          <ComplaintMap complaints={complaints} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
