import React from "react";
import { useNavigate } from "react-router-dom";
import "./UserDashboard.css";

const UserDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="dashboard-wrapper">
      <div className="card dashboard-card">
        <h2>Hello, {user?.name}</h2>

        <button className="btn-primary" onClick={() => navigate("/report")}>
          Report Waste
        </button>

        <button className="btn-primary" onClick={() => navigate("/my-complaints")}>
          My Complaints
        </button>
      </div>
    </div>
  );
};

export default UserDashboard;
