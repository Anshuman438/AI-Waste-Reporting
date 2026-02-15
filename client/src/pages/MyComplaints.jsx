import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MyComplaints.css";

const API = import.meta.env.VITE_API_URL;

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchData();
  }, []);

  const getStatusClass = (status) => {
    if (status === "pending") return "status pending";
    if (status === "in-progress") return "status progress";
    if (status === "resolved") return "status resolved";
    return "status";
  };

  return (
    <div className="my-wrapper">
      <h2>My Complaints</h2>

      {loading ? (
        <p className="loading">Loading your complaints...</p>
      ) : complaints.length === 0 ? (
        <div className="empty-state card">
          <h3>No Complaints Yet</h3>
          <p>You haven't submitted any waste reports.</p>
        </div>
      ) : (
        <div className="my-grid">
          {complaints.map((c) => (
            <div key={c._id} className="card complaint-card">
              <img src={c.imageUrl} alt="waste" />
              <div className="complaint-content">
                <h3>{c.wasteType}</h3>
                <p>{c.description}</p>
                <span className={getStatusClass(c.status)}>
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
