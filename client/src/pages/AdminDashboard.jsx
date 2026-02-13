import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";
import ComplaintMap from "../components/ComplaintMap";
const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/complaints",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setComplaints(res.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/complaints/${id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchComplaints();
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusClass = (status) => {
    if (status === "pending") return "status status-pending";
    if (status === "in-progress") return "status status-progress";
    if (status === "resolved") return "status status-resolved";
    return "status";
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        Waste Reporting Admin Panel
      </div>

      <div className="admin-container">
        <ComplaintMap complaints={complaints} />
        {loading ? (
          <p>Loading complaints...</p>
        ) : (
          
          <div className="card-grid">
            {complaints.map((complaint) => (
              <div
                key={complaint._id}
                className="complaint-card"
              >
                <img
                  src={complaint.imageUrl}
                  alt="waste"
                  className="card-image"
                />

                <div className="card-content">
                  <div className="card-top">
                    <h3>
                      {complaint.wasteType}
                    </h3>

                    <span
                      className={getStatusClass(
                        complaint.status
                      )}
                    >
                      {complaint.status}
                    </span>
                  </div>

                  <p className="description">
                    {complaint.description}
                  </p>

                  <p className="location">
                    📍 {complaint.location?.lat},{" "}
                    {complaint.location?.lng}
                  </p>

                  <select
                    value={complaint.status}
                    onChange={(e) =>
                      updateStatus(
                        complaint._id,
                        e.target.value
                      )
                    }
                    className="status-select"
                  >
                    <option value="pending">
                      Pending
                    </option>
                    <option value="in-progress">
                      In Progress
                    </option>
                    <option value="resolved">
                      Resolved
                    </option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;