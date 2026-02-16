import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MyComplaints.css";

const API = import.meta.env.VITE_API_URL;

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API}/api/complaints/my`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComplaints(res.data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteComplaint = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to remove this complaint?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(
  `${API}/api/complaints/${id}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);


      // remove from UI instantly
      setComplaints((prev) =>
        prev.filter((complaint) => complaint._id !== id)
      );

    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const getStatusClass = (status) => {
    if (status === "pending") return "status pending";
    if (status === "in-progress") return "status progress";
    if (status === "resolved") return "status resolved";
    return "status";
  };

  const formatStatusText = (status) => {
    if (status === "in-progress") return "In Progress";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="my-wrapper">

      {/*header*/}
      <div className="my-header-box">
        <h1>My Complaint History</h1>
        <p>Review and manage your submitted reports.</p>
      </div>

      {loading ? (
        <div className="loading">Loading your complaints...</div>
      ) : complaints.length === 0 ? (
        <div className="empty-state">
          <h3>No Complaints Submitted</h3>
          <p>You haven't reported any waste yet.</p>
        </div>
      ) : (
        <div className="my-grid">
          {complaints.map((c) => (
            <div key={c._id} className="complaint-card">

              <img src={c.imageUrl} alt="waste" />

              <div className="complaint-content">

                <div className="card-header">
                  <h3>{c.wasteType}</h3>

                  <span className={getStatusClass(c.status)}>
                    {formatStatusText(c.status)}
                  </span>
                </div>

                <p className="description">
                  {c.description && c.description.trim() !== ""
                    ? c.description
                    : "No additional description provided."}
                </p>

                <button
                  className="delete-btn"
                  onClick={() => deleteComplaint(c._id)}
                >
                  Remove Complaint
                </button>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default MyComplaints;
