import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MyComplaints.css";

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/complaints/my",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComplaints(res.data);
    };

    fetchData();
  }, []);

  return (
    <div className="my-wrapper">
      <h2>My Complaints</h2>

      <div className="my-grid">
        {complaints.map((c) => (
          <div key={c._id} className="card">
            <img src={c.imageUrl} alt="" />
            <h3>{c.wasteType}</h3>
            <p>{c.description}</p>
            <p>Status: {c.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyComplaints;
