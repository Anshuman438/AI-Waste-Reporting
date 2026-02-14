import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";
import ComplaintMap from "../components/ComplaintMap";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");

    const res = await axios.get(
      "http://localhost:5000/api/complaints",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setComplaints(res.data);
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
    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:5000/api/complaints/${id}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchData();
  };

  return (
    <div className="admin-layout">
      <AdminSidebar setFilter={setFilter} />

      <div className="admin-content">
        <h2>Active Complaints</h2>

        <div className="complaint-grid">
          {activeComplaints.map((c) => (
            <div key={c._id} className="card">
              <img src={c.imageUrl} alt="" />
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

        <h2>Archived</h2>

        <div className="complaint-grid">
          {archived.map((c) => (
            <div key={c._id} className="card">
              <img src={c.imageUrl} alt="" />
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
