import React from "react";
import { useNavigate } from "react-router-dom";
import { FiPlusCircle, FiClipboard } from "react-icons/fi";
import "./UserDashboard.css";

const UserDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="dashboard-wrapper">

      <div className="dashboard-header">
        <h1>
          Welcome back, <span>{user?.name}</span>
        </h1>
        <p>
          Manage your waste reports and track complaint progress.
        </p>
      </div>

      <div className="dashboard-grid">

        <div
          className="dashboard-card card"
          onClick={() => navigate("/report")}
        >
          <div className="card-icon">
            <FiPlusCircle size={28} />
          </div>
          <h3>Report Waste</h3>
          <p>
            Upload an image and let AI classify the waste instantly.
          </p>
        </div>

        <div
          className="dashboard-card card"
          onClick={() => navigate("/my-complaints")}
        >
          <div className="card-icon">
            <FiClipboard size={28} />
          </div>
          <h3>My Complaints</h3>
          <p>
            Track the status of your submitted waste reports.
          </p>
        </div>

      </div>

    </div>
  );
};

export default UserDashboard;
